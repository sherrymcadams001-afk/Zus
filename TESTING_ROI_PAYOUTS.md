# ROI Payout System Test Plan

## Manual Testing Steps

### Prerequisites
1. Backend deployed to Cloudflare Workers
2. Database has at least one active pool
3. Admin account exists in database
4. Test user account exists

### Test Case 1: Create Test Data
```sql
-- Connect to D1 database
-- npx wrangler d1 execute trading-platform --remote

-- 1. Verify pools exist
SELECT id, name, roi_min, roi_max FROM pools WHERE status = 'active';

-- If no pools, insert test pool:
INSERT INTO pools (name, bot_tier, min_stake, roi_min, roi_max, lock_period_days, status)
VALUES ('Test Anchor Pool', 'anchor', 100, 0.0080, 0.0096, 30, 'active');

-- 2. Get test user ID
SELECT id, email FROM users WHERE email = 'test@example.com';

-- 3. Ensure user has wallet with balance
SELECT * FROM wallets WHERE user_id = <USER_ID>;

-- If no wallet, create one:
INSERT INTO wallets (user_id, available_balance, locked_balance, pending_balance, currency)
VALUES (<USER_ID>, 5000, 0, 0, 'USD');

-- 4. Create test stake
INSERT INTO pool_stakes (user_id, pool_id, amount, status, staked_at, unstake_available_at, total_earned)
VALUES (
  <USER_ID>, 
  <POOL_ID>, 
  1000, 
  'active', 
  strftime('%s', 'now'), 
  strftime('%s', 'now', '+30 days'),
  0
);
```

### Test Case 2: Verify Manual Trigger
```bash
# 1. Get admin JWT token
curl -X POST https://trading-agent-engine.sherry-mcadams001.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}'

# Save the token from response

# 2. Trigger manual ROI payout
curl -X POST https://trading-agent-engine.sherry-mcadams001.workers.dev/api/admin/roi/process \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json"

# Expected response:
{
  "status": "success",
  "message": "ROI payout processing complete: 1 succeeded, 0 failed",
  "data": {
    "processed": 1,
    "succeeded": 1,
    "failed": 0,
    "results": [
      {
        "user_id": 1,
        "amount": 8.8,
        "status": "success"
      }
    ]
  }
}
```

### Test Case 3: Verify Database Changes
```sql
-- 1. Check wallet balance increased
SELECT 
  u.email,
  w.available_balance,
  w.locked_balance
FROM users u
JOIN wallets w ON u.id = w.user_id
WHERE u.id = <USER_ID>;

-- Before: available_balance = 5000
-- After: available_balance = 5008.8 (if roi = 0.88%)

-- 2. Check stake total_earned updated
SELECT * FROM pool_stakes WHERE user_id = <USER_ID>;

-- Before: total_earned = 0
-- After: total_earned = 8.8

-- 3. Check transaction record created
SELECT * FROM transactions 
WHERE user_id = <USER_ID> 
  AND type = 'roi_payout' 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- type = 'roi_payout'
-- amount = 8.8
-- status = 'completed'
-- description = 'Daily ROI from Test Anchor Pool'
```

### Test Case 4: Verify Cron Execution
```bash
# 1. Deploy worker
cd backend
npx wrangler deploy

# 2. Watch logs (leave running)
npx wrangler tail

# 3. Wait for 00:00 UTC or use wrangler to trigger manually
# Note: You may need to wait for next day to see automatic execution

# Expected in logs:
# "Starting daily ROI payout processing..."
# "Processing ROI for 1 active stakes"
# "Processed ROI payout: User 1, Amount: $8.80"
# "ROI payout processing complete: 1 succeeded, 0 failed"
```

### Test Case 5: Multiple Stakes
```sql
-- Create multiple stakes for testing
INSERT INTO pool_stakes (user_id, pool_id, amount, status, staked_at, unstake_available_at, total_earned)
VALUES 
  (<USER_ID>, <POOL_ID>, 500, 'active', strftime('%s', 'now'), strftime('%s', 'now', '+30 days'), 0),
  (<USER_ID>, <POOL_ID>, 2000, 'active', strftime('%s', 'now'), strftime('%s', 'now', '+30 days'), 0),
  (<USER_ID>, <POOL_ID>, 10000, 'active', strftime('%s', 'now'), strftime('%s', 'now', '+30 days'), 0);

-- Trigger manual payout
-- Should process all 4 stakes and credit appropriate amounts
```

## Expected Results

### For $1000 stake in Anchor Pool (0.80% - 0.96% daily)
- Average ROI: 0.88% per day
- Daily payout: $1000 × 0.0088 = $8.80
- After 30 days: ~$264 earned
- After 1 year: ~$3,212 earned (365 days)

### Calculation Formula
```
daily_roi = (pool.roi_min + pool.roi_max) / 2
payout = stake_amount × daily_roi
```

### Verification Checklist
- [ ] Manual trigger endpoint responds successfully
- [ ] Wallet balance increases by correct amount
- [ ] Stake total_earned updates correctly
- [ ] Transaction record created with type='roi_payout'
- [ ] Multiple stakes processed correctly
- [ ] Cron trigger executes at scheduled time
- [ ] Logs show processing details
- [ ] No errors in Cloudflare dashboard

## Troubleshooting

### Issue: "No active stakes found"
**Solution:** Create test stake using SQL above

### Issue: "Insufficient permissions"
**Solution:** Use admin account token, not regular user

### Issue: Manual trigger works but cron doesn't
**Solution:** 
1. Verify `wrangler.toml` has triggers section
2. Ensure worker is deployed after adding triggers
3. Check Cloudflare dashboard > Workers > Triggers tab

### Issue: Incorrect payout amounts
**Solution:**
1. Check pool roi_min and roi_max values
2. Verify calculation: (0.0080 + 0.0096) / 2 = 0.0088
3. Verify stake amount is correct

## Performance Monitoring

### Database Queries
```sql
-- Total ROI paid out today
SELECT 
  COUNT(*) as payout_count,
  SUM(amount) as total_paid,
  AVG(amount) as avg_payout
FROM transactions
WHERE type = 'roi_payout' 
  AND created_at > strftime('%s', 'now', 'start of day');

-- User earnings summary
SELECT 
  u.email,
  COUNT(t.id) as payout_count,
  SUM(t.amount) as total_earned,
  SUM(ps.amount) as total_staked,
  (SUM(t.amount) / SUM(ps.amount) * 100) as effective_roi
FROM users u
JOIN transactions t ON u.id = t.user_id AND t.type = 'roi_payout'
LEFT JOIN pool_stakes ps ON u.id = ps.user_id AND ps.status = 'active'
GROUP BY u.id;
```

## Production Deployment

### Checklist
1. [ ] Test all scenarios in development
2. [ ] Verify TypeScript compilation
3. [ ] Deploy to production: `npx wrangler deploy`
4. [ ] Verify cron trigger in Cloudflare dashboard
5. [ ] Monitor first automatic execution
6. [ ] Check user balances after first payout
7. [ ] Set up alerts for failed payouts
8. [ ] Document any edge cases discovered

---

**Status:** Ready for testing  
**Last Updated:** 2026-01-06
