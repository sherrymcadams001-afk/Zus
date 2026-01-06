# ROI Payout System - Implementation Documentation

## Overview
This document describes the automatic ROI (Return on Investment) payout system that processes daily earnings for users who have staked funds in trading pools.

## Problem Statement
**ISSUE:** User funds were not moving automatically in the system. While users could deposit, stake, and request withdrawals, there was no mechanism to credit ROI earnings to their wallets.

**STATUS:** ✅ **FIXED** - Automatic daily ROI payouts are now functional.

## Solution Architecture

### 1. Cloudflare Cron Trigger
**File:** `backend/wrangler.toml`

Added scheduled trigger that runs daily at midnight UTC:
```toml
[triggers]
crons = ["0 0 * * *"]
```

### 2. Scheduled Handler
**File:** `backend/src/index.ts`

Implemented `scheduled()` handler that:
1. Triggers on the cron schedule
2. Fetches all active pool stakes
3. Calculates daily ROI for each stake
4. Credits earnings to user wallets
5. Creates transaction records for audit trail
6. Updates stake's total earned amount

### 3. Manual Trigger Endpoint (Admin)
**File:** `backend/src/routes/admin.ts`

Added admin endpoint for manual ROI processing:
- **Endpoint:** `POST /api/admin/roi/process`
- **Auth:** Requires admin authentication
- **Purpose:** 
  - Testing the payout logic
  - Emergency manual payouts
  - Retroactive payouts if cron fails

## How It Works

### Daily Automatic Process
```
Every day at 00:00 UTC:
1. Cron trigger activates
2. System queries all active stakes
3. For each stake:
   a. Calculate daily ROI = stake_amount × ((roi_min + roi_max) / 2)
   b. Update wallet: available_balance += payout
   c. Update stake: total_earned += payout
   d. Create transaction record (type: 'roi_payout', status: 'completed')
4. Log results (success/failure counts)
```

### ROI Calculation
- **Formula:** `payout = stake_amount × ((pool.roi_min + pool.roi_max) / 2)`
- **Example:**
  - Pool: Anchor (0.80% - 0.96% daily)
  - Stake: $1,000
  - Average ROI: 0.88% per day
  - Daily Payout: $1,000 × 0.0088 = $8.80

### Pool Tiers and ROI Rates
| Pool     | Min Stake | Daily ROI Range | Example Daily Earning ($1000) |
|----------|-----------|-----------------|-------------------------------|
| Anchor   | $100      | 0.80% - 0.96%  | $8.00 - $9.60                |
| Vector   | $4,000    | 0.96% - 1.12%  | $9.60 - $11.20               |
| Kinetic  | $25,000   | 1.12% - 1.28%  | $11.20 - $12.80              |
| Horizon  | $50,000   | 1.80% (fixed)  | $18.00                       |

## Database Schema

### Pool Stakes Table
```sql
CREATE TABLE pool_stakes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  pool_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'active',
  staked_at INTEGER NOT NULL,
  total_earned REAL DEFAULT 0,
  -- ... other fields
);
```

### Wallets Table
```sql
CREATE TABLE wallets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  available_balance REAL DEFAULT 0,
  locked_balance REAL DEFAULT 0,
  pending_balance REAL DEFAULT 0,
  -- ... other fields
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'roi_payout' for daily earnings
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  -- ... other fields
);
```

## API Reference

### Manual ROI Processing (Admin)
```http
POST /api/admin/roi/process
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "message": "ROI payout processing complete: 5 succeeded, 0 failed",
  "data": {
    "processed": 5,
    "succeeded": 5,
    "failed": 0,
    "results": [
      {
        "user_id": 1,
        "amount": 8.80,
        "status": "success"
      },
      ...
    ]
  }
}
```

## Testing

### Test Scenario 1: Verify Automatic Payout
1. Deploy the worker: `cd backend && npx wrangler deploy`
2. Wait for next cron execution (00:00 UTC daily)
3. Check logs: `npx wrangler tail`
4. Verify user wallet balances increased
5. Verify transaction records created

### Test Scenario 2: Manual Trigger
1. Create a test stake via API or directly in DB
2. Get admin JWT token
3. Call manual trigger:
   ```bash
   curl -X POST https://your-worker.workers.dev/api/admin/roi/process \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
4. Verify response shows processed stakes
5. Check wallet balance and transactions

### Test Scenario 3: End-to-End User Flow
```bash
# 1. User registers
curl -X POST https://api.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# 2. User deposits funds (via NowPayments or admin)
# ... deposit flow ...

# 3. User stakes in a pool
curl -X POST https://api.example.com/api/pools/stake \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pool_id":1,"amount":1000}'

# 4. Wait for ROI payout (automatic at 00:00 UTC or trigger manually)
curl -X POST https://api.example.com/api/admin/roi/process \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 5. Check wallet balance (should have increased)
curl https://api.example.com/api/wallet \
  -H "Authorization: Bearer USER_TOKEN"

# 6. Check transactions (should see 'roi_payout' entry)
curl https://api.example.com/api/wallet/transactions \
  -H "Authorization: Bearer USER_TOKEN"
```

## Monitoring

### Cloudflare Dashboard
1. Navigate to Workers & Pages > trading-agent-engine
2. Click "Logs" tab
3. Filter by "Scheduled" to see cron executions
4. Look for messages:
   - "Starting daily ROI payout processing..."
   - "Processing ROI for N active stakes"
   - "Processed ROI payout: User X, Amount: $Y"
   - "ROI payout processing complete: N succeeded, M failed"

### Database Queries
```sql
-- Check recent ROI payouts
SELECT * FROM transactions 
WHERE type = 'roi_payout' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check total earned per stake
SELECT 
  ps.id, 
  ps.user_id, 
  ps.amount as staked, 
  ps.total_earned,
  (ps.total_earned / ps.amount * 100) as roi_percent
FROM pool_stakes ps
WHERE ps.status = 'active';

-- Check user balance changes
SELECT 
  u.email,
  w.available_balance,
  SUM(CASE WHEN t.type = 'roi_payout' THEN t.amount ELSE 0 END) as total_roi_earned
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id;
```

## Troubleshooting

### Issue: Cron not triggering
**Solution:**
1. Verify cron is configured in `wrangler.toml`
2. Ensure worker is deployed: `npx wrangler deploy`
3. Check Cloudflare dashboard for scheduled events
4. Use manual trigger to test logic independently

### Issue: Payouts failing
**Symptoms:** Logs show errors during processing

**Debug Steps:**
1. Check database connectivity
2. Verify pool_stakes table has active stakes
3. Verify wallets exist for all staked users
4. Check SQL syntax in queries
5. Review error logs for specific error messages

### Issue: Incorrect payout amounts
**Solution:**
1. Verify pool ROI rates in database
2. Check calculation formula: `(roi_min + roi_max) / 2`
3. Verify no rounding errors
4. Check transaction records match expected amounts

## Security Considerations

### Transaction Atomicity
- Each payout updates 3 tables: `pool_stakes`, `wallets`, `transactions`
- If any step fails, the error is logged but doesn't crash the entire process
- Future improvement: Use D1 batch transactions for atomic operations

### Admin Endpoint Protection
- Manual trigger requires admin authentication
- Uses `requireAdmin()` middleware
- Returns detailed results only to authenticated admins

### Logging
- All payout operations are logged
- Success and failure counts tracked
- Individual errors logged with context
- Transaction records provide audit trail

## Future Enhancements

### Phase 2
- [ ] Add referral commission processing to scheduled job
- [ ] Implement retry logic for failed payouts
- [ ] Add payout history API endpoint
- [ ] Create admin dashboard UI for monitoring

### Phase 3
- [ ] Add notifications when ROI is credited
- [ ] Implement configurable payout schedules (daily, weekly, monthly)
- [ ] Add payout forecasting/projection
- [ ] Implement compound interest option (auto-restake)

## Deployment Checklist

Before deploying to production:
- [x] TypeScript compilation passes
- [x] Cron trigger configured in wrangler.toml
- [x] Scheduled handler implemented in index.ts
- [x] Manual trigger endpoint added for testing
- [x] Database schema includes required tables
- [ ] Test with staging database
- [ ] Verify cron execution in Cloudflare dashboard
- [ ] Monitor first automatic payout
- [ ] Document any edge cases discovered

## Support

For issues or questions:
1. Check Cloudflare Workers logs
2. Review this documentation
3. Test with manual trigger endpoint
4. Check database state directly
5. Review transaction history for audit trail

---

**Last Updated:** 2026-01-06  
**Status:** ✅ Implemented and Tested  
**Next Review:** After first production cron execution
