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

`web_search.py` queries SearXNG with `format=json`, which upstream SearXNG disables by default.
`deployment/searxng/settings.yml` is mounted into the container to turn it back on
(`search.formats: [html, json]`) -- if you're running SearXNG some other way (not via this
compose file), your instance needs the same setting or `web_search.search()` will fail on a
non-JSON response.

## Test Commands

```bash
docker ps

curl http://localhost:8080

curl "http://localhost:8080/search?q=openai&format=json"

curl "http://localhost:8000/api/search?q=openai"
```
