# Zus Trading Agent API Specification

**Version:** 1.0.0  
**Base URL:** `https://your-worker.workers.dev` (Production) | `http://localhost:8787` (Development)

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/narrative` | Get latest AI-generated trading log |
| `GET` | `/api/balance/:userId` | Get user balance and projections |
| `POST` | `/api/balance` | Create user balance |
| `PUT` | `/api/balance/:userId` | Update user balance |

---

## GET /health

Health check endpoint for monitoring.

**Request:**
```bash
curl https://your-worker.workers.dev/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "trading-agent-engine"
}
```

---

## GET /api/narrative

Returns the latest AI-generated trading log.

**Request:**
```bash
curl https://your-worker.workers.dev/api/narrative
```

**Response (200 OK):**
```json
{
  "log": "Long BTC @ 97,450 - RSI divergence on 15m, volume spike confirming breakout",
  "timestamp": 1701234567890
}
```

**Notes:**
- Logs are generated every minute via cron trigger
- On-demand generation if no cached log exists
- CDN cache: 5 seconds | KV TTL: 60 seconds

---

## GET /api/balance/:userId

Retrieves user balance, tier configuration, and profit projections.

**Request:**
```bash
curl https://your-worker.workers.dev/api/balance/user123
```

**Path Parameters:**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `userId` | string | Yes | 1-128 chars, alphanumeric with `-` and `_` |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 10000,
    "currency": "USD",
    "botTier": "chainpulse",
    "botTierConfig": {
      "name": "Chainpulse Bot",
      "hourlyRoiMin": 0.0012,
      "hourlyRoiMax": 0.0014,
      "dailyRoiMin": 0.0096,
      "dailyRoiMax": 0.0112,
      "minimumStake": 4000,
      "tradingHoursPerDay": 8,
      "tradingDaysPerWeek": 6,
      "roiWithdrawalHours": 24,
      "capitalWithdrawalDays": 45,
      "investmentDurationDays": 365
    },
    "dailyTargetPct": { "min": 0.0096, "max": 0.0112 },
    "projectedDailyProfit": { "min": 96, "max": 112 },
    "lastUpdated": 1701234567890
  }
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | Invalid userId format |
| 404 | User balance not found |

---

## POST /api/balance

Creates a new user balance record.

**Request:**
```bash
curl -X POST https://your-worker.workers.dev/api/balance \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "balance": 10000, "currency": "USD"}'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | Unique user identifier |
| `balance` | number | Yes | Initial balance (≥ 0) |
| `currency` | string | No | Currency code (default: "USD") |
| `botTier` | string | No | Bot tier (auto-selected if omitted) |

**Supported Currencies:** `USD`, `EUR`, `GBP`, `JPY`, `AUD`, `CAD`, `CHF`, `CNY`, `HKD`, `SGD`

**Valid Bot Tiers:** `protobot`, `chainpulse`, `titan`, `omega`

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 10000,
    "currency": "USD",
    "botTier": "chainpulse",
    "botTierConfig": { ... },
    "dailyTargetPct": { "min": 0.0096, "max": 0.0112 },
    "projectedDailyProfit": { "min": 96, "max": 112 },
    "lastUpdated": 1701234567890
  }
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | userId and balance required |
| 400 | Invalid userId format |
| 400 | Invalid currency |
| 400 | Invalid botTier |
| 400 | Insufficient stake for tier |

---

## PUT /api/balance/:userId

Updates an existing user's balance.

**Request:**
```bash
curl -X PUT https://your-worker.workers.dev/api/balance/user123 \
  -H "Content-Type: application/json" \
  -d '{"balance": 25000}'
```

**Path Parameters:**

| Parameter | Type | Required |
|-----------|------|----------|
| `userId` | string | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `balance` | number | Yes | New balance (≥ 0) |
| `currency` | string | No | Currency code |
| `botTier` | string | No | Bot tier (auto-selected if omitted) |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 25000,
    "currency": "USD",
    "botTier": "titan",
    "botTierConfig": { ... },
    "dailyTargetPct": { "min": 0.0112, "max": 0.0128 },
    "projectedDailyProfit": { "min": 280, "max": 320 },
    "lastUpdated": 1701234567890
  }
}
```

---

## Bot Tiers

| Tier | Min Stake | Daily ROI | Capital Lock |
|------|-----------|-----------|--------------|
| Protobot | $100 | 0.80% - 0.96% | 40 days |
| Chainpulse | $4,000 | 0.96% - 1.12% | 45 days |
| Titan | $25,000 | 1.12% - 1.28% | 65 days |
| Omega | $50,000 | 1.80% (fixed) | 85 days |

**Auto-selection:** If `botTier` is omitted, the highest qualifying tier is selected.

---

## How-To Guides

### Create a User and Get Projections

```javascript
// 1. Create user with initial deposit
const response = await fetch('https://your-worker.workers.dev/api/balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user123', balance: 10000 })
});
const { data } = await response.json();

console.log(`Tier: ${data.botTier}`);
console.log(`Daily profit: $${data.projectedDailyProfit.min} - $${data.projectedDailyProfit.max}`);
```

### Update Balance After Deposit/Withdrawal

```javascript
const response = await fetch('https://your-worker.workers.dev/api/balance/user123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ balance: 50000 })
});
const { data } = await response.json();
// Tier auto-upgrades to 'omega' at $50,000+
```

### Poll for Trading Activity

```javascript
async function pollNarrative() {
  const response = await fetch('https://your-worker.workers.dev/api/narrative');
  const { log, timestamp } = await response.json();
  console.log(`[${new Date(timestamp).toLocaleTimeString()}] ${log}`);
}

setInterval(pollNarrative, 5000);
```

### Select a Specific Bot Tier

```javascript
// User has $60,000 but wants Titan instead of Omega
const response = await fetch('https://your-worker.workers.dev/api/balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user123', balance: 60000, botTier: 'titan' })
});
```

### Python Integration

```python
import requests

BASE_URL = 'https://your-worker.workers.dev'

# Create user
response = requests.post(f'{BASE_URL}/api/balance', json={
    'userId': 'user123',
    'balance': 10000
})
data = response.json()['data']
print(f"Tier: {data['botTier']}, Daily: ${data['projectedDailyProfit']['min']}-${data['projectedDailyProfit']['max']}")

# Get balance
response = requests.get(f'{BASE_URL}/api/balance/user123')
print(response.json())

# Update balance
response = requests.put(f'{BASE_URL}/api/balance/user123', json={'balance': 25000})
print(response.json())

# Get trading log
response = requests.get(f'{BASE_URL}/api/narrative')
print(response.json()['log'])
```

---

## Frontend JavaScript API

When embedding the Trading Agent frontend, use these global functions:

```javascript
// Set balance (auto-selects tier)
window.setTradingAgentBalance(10000);

// Set balance with specific tier
window.setTradingAgentBalance(25000, 'titan');

// Get current status
const status = window.getTradingAgentStatus();
console.log(status.data.wallet_balance);
console.log(status.data.bot_tier);
console.log(status.data.projected_daily_profit);

// Get all tier configurations
const tiers = window.getBotTiers();

// Set specific tier
window.setBotTier('chainpulse');
```

---

## Error Handling

All error responses follow this format:

```json
{
  "status": "error",
  "error": "Error message description"
}
```

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `User balance not found` | User doesn't exist | Use POST /api/balance first |
| `Invalid userId format` | Special characters or too long | Use alphanumeric, hyphens, underscores (1-128 chars) |
| `Insufficient stake for [Tier]` | Balance below tier minimum | Increase balance or select lower tier |
| `Invalid currency` | Unsupported currency code | Use supported currencies |

---

## Validation Rules

**userId:**
- 1-128 characters
- Alphanumeric, hyphens (`-`), underscores (`_`) only
- Case-sensitive

**balance:**
- Must be a number
- Must be ≥ 0
- Must meet minimum stake if `botTier` specified

**currency:**
- Optional (default: USD)
- Must be in: `USD`, `EUR`, `GBP`, `JPY`, `AUD`, `CAD`, `CHF`, `CNY`, `HKD`, `SGD`

**botTier:**
- Optional (auto-selected if omitted)
- Must be: `protobot`, `chainpulse`, `titan`, `omega`
- Balance must meet tier's minimum stake
