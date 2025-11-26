# ORION Narrative Engine

A Cloudflare Worker that generates AI-powered trading logs using Workers AI (Llama-3) and KV storage.

## Architecture

- **Workers AI**: Uses `@cf/meta/llama-3-8b-instruct` to generate realistic trading logs
- **KV Storage**: Caches the latest log in `ORION_CACHE` namespace
- **Cron Trigger**: Generates new logs every minute
- **HTTP API**: Serves cached logs via REST endpoint

## Setup

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Configuration

1. Create a KV namespace:
   ```bash
   wrangler kv:namespace create ORION_CACHE
   wrangler kv:namespace create ORION_CACHE --preview
   ```

2. Update `wrangler.toml` with your namespace IDs:
   ```toml
   [[kv_namespaces]]
   binding = "ORION_CACHE"
   id = "your-production-namespace-id"
   preview_id = "your-preview-namespace-id"
   ```

### Development

```bash
npm install
npm run dev
```

### Deployment

```bash
npm run deploy
```

## API Endpoints

### GET /api/narrative

Returns the latest AI-generated trading log.

**Response:**
```json
{
  "log": "Long BTC @ 97,450 - RSI divergence on 15m, volume spike confirming breakout",
  "timestamp": 1700000000000
}
```

**Headers:**
- `Cache-Control: public, max-age=5` — CDN caching for Free Tier scaling

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "orion-narrative-engine"
}
```

## Cron Schedule

The worker generates new logs on a schedule defined in `wrangler.toml`:

```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

> Note: Minimum cron interval in production is 1 minute. For more frequent updates, consider using Durable Objects with alarms.
