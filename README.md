# Zus Trading Agent

A production-ready trading simulation engine with multi-tier bot system and REST API.

**Two Ways to Use:**
- 🔌 **API Integration**: Add trading simulation to your existing platform
- 🚀 **Full-Stack Fork**: Build your platform on top of our complete solution

## Quick Links

- 📖 [Platform Architecture Guide](docs/PLATFORM_ARCHITECTURE.md) - Understand integration options
- 📄 [API Specification](docs/api-specification.md) - Complete API documentation
- 📥 [Download PDF Documentation](docs/Trading-Agent-API-Specification.pdf) - Enterprise-ready PDF

## Features

- **Multi-Tier Bot System**: Four bot tiers (Protobot, Chainpulse, Titan, Omega) with varying ROI rates
- **AI-Powered Trading Logs**: Real-time trading activity generation using Workers AI
- **User Balance Management**: REST API for managing user balances and tracking projected profits
- **Real-Time Market Data**: WebSocket integration with Binance for live price feeds
- **Professional Trading UI**: React-based dashboard with charts, watchlists, and activity feeds

## Bot Tier Overview

| Tier | Minimum Stake | Daily ROI | Best For |
|------|---------------|-----------|----------|
| Protobot | $100 | 0.80% - 0.96% | Entry-level users |
| Chainpulse | $4,000 | 0.96% - 1.12% | Serious investors |
| Titan | $25,000 | 1.12% - 1.28% | High-net-worth investors |
| Omega | $50,000 | 1.80% (fixed) | Institutional investors |

## Quick Start

### API-Only Integration

```bash
# Test the API
curl https://trading-agent-engine.sherry-mcadams001.workers.dev/health

# Create a user balance
curl -X POST https://trading-agent-engine.sherry-mcadams001.workers.dev/api/balance \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "balance": 10000}'

# Get user balance and projections
curl https://trading-agent-engine.sherry-mcadams001.workers.dev/api/balance/user123
```

### Full-Stack Development

```bash
# Clone the repository
git clone https://github.com/sherrymcadams001-afk/Zus.git
cd Zus

# Install dependencies
npm install

# Run frontend
npm run dev

# In another terminal, run backend
cd backend
npm install
npm run dev
```

## Documentation

### Generate PDF Documentation

```bash
npm run docs:generate
```

This creates `docs/Trading-Agent-API-Specification.pdf` with:
- Executive summary
- Architecture overview
- Complete API reference
- Bot tier specifications
- Integration guides
- Code examples

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | TailwindCSS 4, Framer Motion |
| State | Zustand |
| Charts | Lightweight Charts |
| Backend | Cloudflare Workers |
| Storage | Cloudflare KV |
| AI | Workers AI (Llama-3) |
| Market Data | Binance WebSocket |

## Deployment

### Frontend (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy dist --project-name=your-project
```

### Backend (Cloudflare Workers)

```bash
cd backend
npx wrangler deploy
```

## License

Proprietary - All rights reserved

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules. Adhere fully.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
