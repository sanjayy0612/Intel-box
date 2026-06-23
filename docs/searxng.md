# SearXNG Integration

## Architecture

```text
Agent
  |
  v
web_search.py
  |
  v
SearXNG
  |
  +--> DuckDuckGo
  +--> Wikipedia
  +--> Brave
  +--> Google
```

## Startup

```bash
docker compose -f deployment/docker-compose.yml up -d
```

## Test Commands

```bash
docker ps

curl http://localhost:8080

curl "http://localhost:8000/api/search?q=openai"
```
