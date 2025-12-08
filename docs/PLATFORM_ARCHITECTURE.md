# Zus Trading Agent - Platform Architecture Guide

This document clarifies the dual-purpose design of the Zus Trading Agent and helps you choose the right integration path for your project.

---

## Table of Contents

1. [Dual-Purpose Design](#dual-purpose-design)
2. [Architecture Comparison](#architecture-comparison)
3. [Decision Matrix](#decision-matrix)
4. [Getting Started - Both Paths](#getting-started---both-paths)
5. [Migration Path](#migration-path)

---

## Dual-Purpose Design

The Zus Trading Agent is designed to serve two distinct use cases, giving you flexibility in how you integrate trading simulation capabilities into your platform.

### Use Case A: API-Only Integration

**Who It's For:**
- Teams with existing frontends who need backend trading logic
- Platforms that want to add trading simulation as a feature
- Developers who want to maintain their own UI/UX

**What You Get:**
- REST API endpoints for user balance management
- Tier-based profit calculations
- AI-generated trading narratives
- Real-time balance and projection updates

**What You Need to Build:**
- Your own frontend UI
- User authentication layer
- Custom business logic integration

**Integration Method:**
- HTTP requests to deployed Cloudflare Worker
- WebSocket connections for real-time data (via your implementation)
- Frontend JavaScript API calls (`window.setTradingAgentBalance`, etc.)

**Example Platforms:**
- Fintech applications adding trading simulation
- Portfolio management tools
- Trading education platforms
- Financial dashboards
- Mobile banking apps with investment features

---

### Use Case B: Full-Stack Fork

**Who It's For:**
- Developers building a new trading platform from scratch
- Teams wanting complete control over UI/UX
- White-label solution providers
- Startups needing rapid time-to-market

**What You Get:**
- Complete React frontend with professional trading UI
- Cloudflare Workers backend with all API endpoints
- Real-time market data integration (Binance WebSocket)
- Pre-built components (charts, watchlists, order books, activity logs)
- Zustand state management
- CI/CD pipeline (GitHub Actions)

**Customization:**
- Full access to all UI components and styling
- Complete control over business logic
- Ability to modify bot tiers and ROI calculations
- Add new features and endpoints

**Integration Method:**
- Fork the repository
- Customize to your needs
- Deploy your own instance

**Example Platforms:**
- Standalone trading simulators
- White-label trading solutions
- Branded investment platforms
- Custom trading education tools
- Demo environments for brokerages

---

## Architecture Comparison

| Aspect | API-Only Integration | Full-Stack Fork |
|--------|---------------------|-----------------|
| **Code Access** | Backend API only | Full codebase |
| **Deployment** | Use hosted API or deploy worker only | Deploy frontend + backend |
| **Customization** | Limited to API configuration | Full UI/UX control |
| **Maintenance** | Backend updates handled separately | You manage all updates |
| **Time to Market** | Faster (just API calls) | Longer (frontend development) |
| **Use Case** | Add feature to existing platform | Build new platform |
| **Frontend Control** | Your existing stack | React + TypeScript |
| **Branding** | Fully custom | Customize existing |
| **Data Ownership** | Shared (hosted) or owned (self-hosted) | Fully owned |
| **Scalability** | Depends on hosting choice | Cloudflare edge network |
| **Initial Cost** | Lower | Higher |
| **Long-term Cost** | Depends on usage | Fixed hosting costs |

### Technology Stack Comparison

| Component | API-Only | Full-Stack Fork |
|-----------|----------|-----------------|
| **Frontend** | Your choice | React 19 + TypeScript |
| **Styling** | Your choice | TailwindCSS 4 |
| **State Management** | Your choice | Zustand |
| **Charts** | Your choice | Lightweight Charts |
| **Backend** | Cloudflare Workers | Cloudflare Workers |
| **Storage** | Cloudflare KV | Cloudflare KV |
| **AI** | Workers AI | Workers AI |
| **Market Data** | Your integration | Binance WebSocket |

---

## Decision Matrix

Use this matrix to determine which integration path is right for your project.

### Choose API-Only Integration If:

| Factor | Criteria |
|--------|----------|
| **Existing Infrastructure** | ✅ You have an existing frontend |
| **Development Resources** | ✅ Limited frontend developers |
| **Customization Needs** | ✅ Only need data, not UI |
| **Time Constraints** | ✅ Need to ship quickly |
| **Budget** | ✅ Limited development budget |
| **Maintenance** | ✅ Prefer managed backend |
| **Technology Stack** | ✅ Already committed to non-React stack |

### Choose Full-Stack Fork If:

| Factor | Criteria |
|--------|----------|
| **Existing Infrastructure** | ✅ Building from scratch |
| **Development Resources** | ✅ Have React developers |
| **Customization Needs** | ✅ Need full UI control |
| **Time Constraints** | ✅ Can invest in development |
| **Budget** | ✅ Budget for full platform |
| **Maintenance** | ✅ Want full control |
| **Technology Stack** | ✅ React/TypeScript is acceptable |

### Quick Decision Guide

```
START
  │
  ├─► Do you have an existing frontend?
  │     │
  │     ├─► YES ──► API-Only Integration
  │     │
  │     └─► NO ───► Do you need a trading UI?
  │                   │
  │                   ├─► YES ──► Full-Stack Fork
  │                   │
  │                   └─► NO ───► API-Only Integration
  │
  └─► Do you need complete UI customization?
        │
        ├─► YES ──► Full-Stack Fork
        │
        └─► NO ───► API-Only Integration
```

---

## Getting Started - Both Paths

### Path A: API-Only Integration

Follow these steps to integrate the Trading Agent API into your existing platform.

#### Step 1: Test the API

Verify the API is accessible:

```bash
# Health check
curl https://your-worker.workers.dev/health

# Expected response:
# {"status":"ok","service":"trading-agent-engine"}
```

#### Step 2: Create a User

Register a user with their initial balance:

```bash
curl -X POST https://your-worker.workers.dev/api/balance \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "balance": 10000,
    "currency": "USD"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 10000,
    "currency": "USD",
    "botTier": "chainpulse",
    "botTierConfig": { ... },
    "projectedDailyProfit": {
      "min": 96,
      "max": 112
    }
  }
}
```

#### Step 3: Retrieve User Balance

Get balance and projections for a user:

```bash
curl https://your-worker.workers.dev/api/balance/user123
```

#### Step 4: Update User Balance

Update balance when users deposit or withdraw:

```bash
curl -X PUT https://your-worker.workers.dev/api/balance/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 25000
  }'
```

#### Step 5: Get Trading Narratives

Fetch AI-generated trading activity:

```bash
curl https://your-worker.workers.dev/api/narrative
```

#### Step 6: Integrate into Your Frontend

JavaScript integration example:

```javascript
// Create a service class
class TradingAgentService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async createUser(userId, balance) {
    const response = await fetch(`${this.baseUrl}/api/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, balance })
    });
    return response.json();
  }
  
  async getBalance(userId) {
    const response = await fetch(`${this.baseUrl}/api/balance/${userId}`);
    return response.json();
  }
  
  async updateBalance(userId, balance) {
    const response = await fetch(`${this.baseUrl}/api/balance/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance })
    });
    return response.json();
  }
}

// Usage
const trading = new TradingAgentService('https://your-worker.workers.dev');

// When user deposits
const user = await trading.createUser('user123', 10000);
displayTier(user.data.botTier);
displayProjections(user.data.projectedDailyProfit);
```

If embedding the frontend component, use the global JavaScript API:

```javascript
// Set balance (auto-selects tier)
window.setTradingAgentBalance(10000);

// Set balance with specific tier
window.setTradingAgentBalance(25000, 'titan');

// Get current status
const status = window.getTradingAgentStatus();
console.log(status.data.wallet_balance);
console.log(status.data.bot_tier);

// Get available tiers
const tiers = window.getBotTiers();
```

---

### Path B: Full-Stack Fork

Follow these steps to build your platform on top of the complete solution.

#### Step 1: Fork the Repository

Using GitHub CLI:
```bash
gh repo fork sherrymcadams001-afk/Zus --clone
cd Zus
```

Or via GitHub UI:
1. Visit https://github.com/sherrymcadams001-afk/Zus
2. Click "Fork"
3. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/Zus.git
cd Zus
```

#### Step 2: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### Step 3: Configure Cloudflare

Create a KV namespace:
```bash
cd backend
npx wrangler kv:namespace create "TRADING_CACHE"
# Note the ID returned
```

Update `backend/wrangler.toml`:
```toml
name = "your-platform-name"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "TRADING_CACHE"
id = "YOUR_KV_ID_HERE"
preview_id = "YOUR_KV_ID_HERE"

[ai]
binding = "AI"

[triggers]
crons = ["* * * * *"]
```

#### Step 4: Run Locally

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
cd backend
npm run dev
```

Access at http://localhost:5173

#### Step 5: Customize Your Platform

**Change Branding:**

Edit `src/App.tsx`:
```tsx
<h1 className="text-sm font-bold tracking-widest text-white leading-none">
  YOUR BRAND <span className="text-orion-neon-cyan">NAME</span>
</h1>
```

**Modify Colors:**

Edit `src/index.css`:
```css
:root {
  --orion-neon-cyan: #YOUR_BRAND_COLOR;
}
```

**Customize Bot Tiers:**

Edit `backend/src/index.ts`:
```typescript
const BOT_TIERS: Record<BotTier, BotTierConfig> = {
  protobot: {
    name: 'Your Custom Name',
    dailyRoiMin: 0.01,  // 1% daily
    // ...
  },
};
```

**Add New Components:**

Create components in `src/components/`:
```tsx
// src/components/CustomWidget.tsx
export function CustomWidget() {
  return (
    <div className="bg-orion-panel rounded-lg p-4">
      {/* Your custom content */}
    </div>
  );
}
```

#### Step 6: Deploy

**Deploy Backend:**
```bash
cd backend
npx wrangler deploy
```

**Deploy Frontend:**
```bash
npm run build
npx wrangler pages deploy dist --project-name=your-project
```

#### Step 7: Set Up CI/CD

Configure GitHub Secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The included workflow (`.github/workflows/deploy.yml`) will auto-deploy on push to `main`.

---

## Migration Path

### From API-Only to Full-Stack

If you start with API-Only integration and later want to migrate to Full-Stack:

1. **Fork the repository** as described in Path B

2. **Update API URLs** in your existing frontend to point to your new deployment

3. **Migrate user data** (if needed):
   ```javascript
   // Export from current system
   const users = await getAllUsers(); // Your current system
   
   // Import to new KV
   for (const user of users) {
     await fetch(`${newWorkerUrl}/api/balance`, {
       method: 'POST',
       body: JSON.stringify({
         userId: user.id,
         balance: user.balance,
         botTier: user.tier
       })
     });
   }
   ```

4. **Gradually replace** your custom UI with the provided components

5. **Update DNS/routing** to point to the new platform

### Hybrid Approach

You can also use a hybrid approach:

- Use the **Full-Stack frontend** for the main trading interface
- Use **API-Only** for mobile apps or other platforms
- Both connect to the **same backend**

```
┌─────────────────┐     ┌─────────────────┐
│  React Frontend │     │  Mobile App     │
│  (Full-Stack)   │     │  (API-Only)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Shared Backend      │
         │   (Cloudflare Worker) │
         └───────────────────────┘
```

---

## Summary

| Path | Best For | Time to Market | Customization | Maintenance |
|------|----------|----------------|---------------|-------------|
| **API-Only** | Existing platforms | Fast | Limited | Low |
| **Full-Stack** | New platforms | Medium | Full | Medium |
| **Hybrid** | Multi-platform | Medium | Mixed | Medium |

Choose based on your specific needs, resources, and timeline. Both paths provide access to the same powerful trading simulation engine.

---

## Need Help?

- 📄 **API Reference**: See `docs/api-specification.md`
- 📦 **PDF Documentation**: See `docs/Trading-Agent-API-Specification.pdf`
- 🐛 **Issues**: Open an issue on GitHub
- 💬 **Discussions**: Use GitHub Discussions for questions
