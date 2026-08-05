#!/usr/bin/env bash
#
# Bring up the whole IntelBox stack with one command.
#
#   ./dev.sh          start everything, stream logs, Ctrl-C to stop
#   ./dev.sh --stop   stop everything including the containers
#   ./dev.sh --fixtures   frontend only, no backend (design work)
#
# Five processes: MongoDB and SearXNG in Docker, then the MCP server, the API,
# and Vite locally. First run installs dependencies; later runs skip that.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f deployment/docker-compose.yml"
LOGS="$ROOT/.dev-logs"
PIDS=()

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
dim()  { printf '\033[2m%s\033[0m\n' "$1"; }
die()  { printf '\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

# --- stop ------------------------------------------------------------------

if [[ "${1:-}" == "--stop" ]]; then
  bold "Stopping IntelBox"
  pkill -f "uvicorn api.main:app" 2>/dev/null || true
  pkill -f "uvicorn deployment.mcp_server.server:app" 2>/dev/null || true
  pkill -f "vite dev --port 5173" 2>/dev/null || true
  $COMPOSE stop mongo searxng 2>/dev/null || true
  dim "Stopped. Data is kept in deployment/data/mongo."
  exit 0
fi

cleanup() {
  echo
  bold "Shutting down"
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
  dim "Local processes stopped. Containers left running -- ./dev.sh --stop to stop those too."
}
trap cleanup EXIT INT TERM

mkdir -p "$LOGS"

# --- environment -----------------------------------------------------------

[[ -f .env ]] || { cp .env.example .env; dim "Created .env from .env.example"; }

# SearXNG refuses to start while its secret is the upstream placeholder.
if ! grep -qE '^SEARXNG_SECRET=.+' .env; then
  secret="$(openssl rand -hex 32)"
  if grep -q '^SEARXNG_SECRET=' .env; then
    sed -i "s|^SEARXNG_SECRET=.*|SEARXNG_SECRET=$secret|" .env
  else
    printf '\nSEARXNG_SECRET=%s\n' "$secret" >> .env
  fi
  dim "Generated SEARXNG_SECRET"
fi

# Nothing in the app calls load_dotenv, so the shell has to export these.
set -a
# shellcheck disable=SC1091
source .env
set +a

# --- frontend-only mode ----------------------------------------------------

if [[ "${1:-}" == "--fixtures" ]]; then
  [[ -d frontend/node_modules ]] || (cd frontend && npm install)
  [[ -f frontend/.env ]] || cp frontend/.env.example frontend/.env
  bold "IntelBox -- fixture mode (no backend)"
  dim "http://localhost:5173"
  cd frontend && VITE_USE_FIXTURES=1 exec npx vite dev --port 5173 --strictPort
fi

# --- dependencies ----------------------------------------------------------

if [[ ! -d .venv ]]; then
  bold "Creating .venv"
  python3 -m venv .venv
  .venv/bin/pip install -q --upgrade pip
  .venv/bin/pip install -q --only-binary=:all: -r requirements.txt
  .venv/bin/pip install -q --only-binary=:all: -r deployment/mcp_server/requirements.txt
fi
.venv/bin/python -c "import pymongo" 2>/dev/null || \
  .venv/bin/pip install -q --only-binary=:all: -r deployment/mcp_server/requirements.txt

[[ -d frontend/node_modules ]] || (bold "Installing frontend dependencies"; cd frontend && npm install)
[[ -f frontend/.env ]] || cp frontend/.env.example frontend/.env

command -v docker >/dev/null || die "Docker is required for MongoDB and SearXNG. Or run ./dev.sh --fixtures"
docker info >/dev/null 2>&1 || die "The Docker daemon isn't running."

# --- wait helper -----------------------------------------------------------

wait_for() {
  local name="$1" url="$2" tries="${3:-40}"
  for ((i = 0; i < tries; i++)); do
    if curl -fsS -o /dev/null --max-time 2 "$url" 2>/dev/null; then
      printf '  \033[32m✓\033[0m %s\n' "$name"
      return 0
    fi
    sleep 1
  done
  printf '  \033[31m✗\033[0m %s did not come up -- see %s\n' "$name" "$LOGS"
  return 1
}

# --- start -----------------------------------------------------------------

bold "Starting IntelBox"

$COMPOSE up -d mongo searxng >/dev/null 2>&1
printf '  \033[32m✓\033[0m mongodb        :27017\n'
wait_for "searxng        :8080" "http://localhost:8080/" 60 || true

.venv/bin/uvicorn deployment.mcp_server.server:app --port 8001 \
  > "$LOGS/mcp.log" 2>&1 &
PIDS+=($!)
wait_for "mcp server     :8001" "http://localhost:8001/health"

.venv/bin/uvicorn api.main:app --reload --port 8000 \
  > "$LOGS/api.log" 2>&1 &
PIDS+=($!)
wait_for "api            :8000" "http://localhost:8000/health"

(cd frontend && npx vite dev --port 5173 --strictPort) > "$LOGS/frontend.log" 2>&1 &
PIDS+=($!)
wait_for "frontend       :5173" "http://localhost:5173/"

echo
bold "  http://localhost:5173"
if grep -qE '^(ANTHROPIC|OPENAI|GROQ)_API_KEY=.+' .env; then
  dim "  Logs in .dev-logs/  ·  Ctrl-C to stop"
else
  dim "  No LLM key set, so the agent can't choose tools -- runs will call all four."
  dim "  Logs in .dev-logs/  ·  Ctrl-C to stop"
fi
echo

tail -f -n 0 "$LOGS/api.log" "$LOGS/frontend.log" &
PIDS+=($!)
wait
