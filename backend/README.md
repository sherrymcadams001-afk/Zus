# Trading Agent Engine

A Cloudflare Worker that generates AI-powered trading logs using Workers AI (Llama-3), KV storage, and provides API endpoints for user balance management to integrate with broader platforms.

## Architecture

- **Workers AI**: Uses `@cf/meta/llama-3-8b-instruct` to generate realistic trading logs
- **KV Storage**: Caches the latest log and stores user balances in `TRADING_CACHE` namespace
- **Cron Trigger**: Generates new logs every minute
- **HTTP API**: Serves cached logs and user balance management via REST endpoints

## Setup

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Configuration

1. Create a KV namespace:
   ```bash
   wrangler kv:namespace create TRADING_CACHE
   wrangler kv:namespace create TRADING_CACHE --preview
   ```

2. Update `wrangler.toml` with your namespace IDs:
   ```toml
   [[kv_namespaces]]
   binding = "TRADING_CACHE"
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

## API Specification

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

---

### GET /api/balance/:userId

Get the balance and projected daily profit for a specific user.

**URL Parameters:**
- `userId` (string, required): Unique identifier for the user

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 50000.00,
    "currency": "USD",
    "dailyTargetPct": {
      "min": 0.011,
      "max": 0.014
    },
    "projectedDailyProfit": {
      "min": 550.00,
      "max": 700.00
    },
    "lastUpdated": 1700000000000
  }
}
```

**Response (404 Not Found):**
```json
{
  "status": "error",
  "error": "User balance not found. Use POST /api/balance to set initial balance."
}
```

---

### POST /api/balance

Create or set a user's balance for the Trading Agent to use.

**Request Body:**
```json
{
  "userId": "user123",
  "balance": 50000.00,
  "currency": "USD"
}
```

| Field    | Type   | Required | Description                              |
|----------|--------|----------|------------------------------------------|
| userId   | string | Yes      | Unique identifier for the user           |
| balance  | number | Yes      | User's balance (must be >= 0)            |
| currency | string | No       | Currency code (default: "USD")           |

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 50000.00,
    "currency": "USD",
    "dailyTargetPct": {
      "min": 0.011,
      "max": 0.014
    },
    "projectedDailyProfit": {
      "min": 550.00,
      "max": 700.00
    },
    "lastUpdated": 1700000000000
  }
}
```

---

### PUT /api/balance/:userId

Update an existing user's balance.

**URL Parameters:**
- `userId` (string, required): Unique identifier for the user

**Request Body:**
```json
{
  "balance": 75000.00,
  "currency": "USD"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 75000.00,
    "currency": "USD",
    "dailyTargetPct": {
      "min": 0.011,
      "max": 0.014
    },
    "projectedDailyProfit": {
      "min": 825.00,
      "max": 1050.00
    },
    "lastUpdated": 1700000000000
  }
}
```

---

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "trading-agent-engine"
}
```

## Multi-User Integration Guide

### Overview

The Trading Agent Engine is designed to integrate with broader platforms that manage multiple users. Each user can have their own balance, and the simulated 24-hour cashflow profit (1.1% - 1.4%) is calculated based on their individual balance.

### Integration Steps

1. **Register User Balance**
   When a user joins your platform or deposits funds, register their balance:
   ```bash
   curl -X POST https://your-worker.workers.dev/api/balance \
     -H "Content-Type: application/json" \
     -d '{"userId": "user123", "balance": 25000}'
   ```

2. **Retrieve User Status**
   Get current balance and projected daily profits:
   ```bash
   curl https://your-worker.workers.dev/api/balance/user123
   ```

3. **Update Balance on Deposits/Withdrawals**
   When users deposit or withdraw funds:
   ```bash
   curl -X PUT https://your-worker.workers.dev/api/balance/user123 \
     -H "Content-Type: application/json" \
     -d '{"balance": 30000}'
   ```

### Frontend Integration

For the Trading Agent frontend, you can set the user balance via the global JavaScript API:

```javascript
// Set user balance (this updates the frontend simulation)
window.setTradingAgentBalance(50000);
// Returns: { status: 'success', new_balance: 50000, projected_daily_profit: { min: 550, max: 700 } }

// Get current status
window.getTradingAgentStatus();
// Returns full portfolio state including wallet_balance, session_pnl, market_context, etc.
```

### Profit Calculation

The daily profit is calculated as follows:
- **Minimum daily profit**: `balance × 0.011` (1.1%)
- **Maximum daily profit**: `balance × 0.014` (1.4%)

For example, a user with $50,000 balance:
- Minimum daily profit: $550
- Maximum daily profit: $700

### Market-Contextual Trading

The Trading Agent now considers market conditions when simulating trades:

- **Volatility Levels**: Low, Medium, High
  - High volatility = larger potential profits/losses
  - Low volatility = smaller, more consistent moves
  
- **Market Trend**: Bullish, Bearish, Neutral
  - Bullish markets increase win rates for long positions
  - Bearish markets make profitable trades more challenging

This creates more realistic trading simulations that respond to actual market conditions.

## Cron Schedule

The worker generates new logs on a schedule defined in `wrangler.toml`:

```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

> Note: Minimum cron interval in production is 1 minute. For more frequent updates, consider using Durable Objects with alarms.
