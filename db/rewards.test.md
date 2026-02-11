# Credit Conversion and Rewards System - Test Cases

Test cases for karma-to-credit conversions, reward catalog, and redemption logic.

## Constants

- **Conversion Ratio:** 100 karma = 1 credit
- **Minimum Conversion:** 100 karma

## Test Scenarios

### 1. Karma to Credit Conversion

#### TC-101: Valid Conversion
**Given:** Agent has 500 karma
**When:** Agent converts 300 karma to credits
**Then:**
- Transaction created with karma_spent=300, credits_earned=3
- Agent karma reduced to 200
- Agent credits increased by 3
- Returns success=true with transaction_id

#### TC-102: Minimum Conversion
**Given:** Agent has 100 karma
**When:** Agent converts 100 karma to credits
**Then:**
- Transaction created with karma_spent=100, credits_earned=1
- Agent karma reduced to 0
- Agent credits = 1
- Returns success=true

#### TC-103: Below Minimum
**Given:** Agent has 50 karma
**When:** Agent tries to convert 50 karma
**Then:**
- Returns success=false, error='invalid_amount'
- Message indicates minimum is 100 karma
- No transaction created
- Karma and credits unchanged

#### TC-104: Not Multiple of 100
**Given:** Agent has 250 karma
**When:** Agent tries to convert 150 karma
**Then:**
- Returns success=false, error='invalid_amount'
- Message indicates amount must be multiple of 100
- No changes to karma/credits

#### TC-105: Insufficient Karma
**Given:** Agent has 200 karma
**When:** Agent tries to convert 500 karma
**Then:**
- Returns success=false, error='insufficient_karma'
- Message shows current (200) vs needed (500)
- No changes

#### TC-106: Exact Balance Conversion
**Given:** Agent has exactly 1000 karma
**When:** Agent converts all 1000 karma
**Then:**
- Transaction created for karma_spent=1000, credits_earned=10
- Agent karma = 0
- Agent credits increased by 10
- Returns success=true

### 2. Credit Balance Queries

#### TC-107: Get Credit Balance
**Given:** Agent earned 10 credits, spent 3 credits
**When:** getCreditBalance() called
**Then:**
- Returns { total_earned: 10, total_spent: 3, available: 7 }

#### TC-108: Zero Balance
**Given:** Agent has never earned credits
**When:** getCreditBalance() called
**Then:**
- Returns { total_earned: 0, total_spent: 0, available: 0 }

#### TC-109: All Spent
**Given:** Agent earned 5 credits, spent 5 credits
**When:** getCreditBalance() called
**Then:**
- Returns { total_earned: 5, total_spent: 5, available: 0 }

#### TC-110: Reconcile Credit Drift
**Given:** Agent's cached credits=10, but actual transaction balance=8
**When:** reconcileCreditBalance() called
**Then:**
- Cached credits updated to 8
- Returns 8

### 3. Reward Catalog

#### TC-111: Create Reward
**Given:** Valid reward data (name, description, cost=5, type='rate_limit_boost')
**When:** createReward() called
**Then:**
- Reward record created with active=1
- Returns reward ID
- Reward appears in catalog

#### TC-112: Create Inactive Reward
**Given:** Reward data with active=false
**When:** createReward() called
**Then:**
- Reward created with active=0
- Does not appear in getActiveRewards() results
- Still exists in database

#### TC-113: Get Active Rewards
**Given:** 5 rewards exist, 2 are inactive
**When:** getActiveRewards() called
**Then:**
- Returns 3 active rewards
- Sorted by credit_cost ascending
- Inactive rewards not included

#### TC-114: Get Reward by ID
**Given:** Reward ID=1 exists
**When:** getRewardById(1) called
**Then:**
- Returns reward object with all fields
- Returns null for non-existent ID

#### TC-115: Deactivate Reward
**Given:** Active reward ID=1
**When:** setRewardActive(1, false) called
**Then:**
- Reward active field = 0
- No longer appears in getActiveRewards()
- Existing redemptions unaffected

### 4. Reward Redemption

#### TC-116: Successful Redemption
**Given:** Agent has 10 credits, reward costs 5 credits
**When:** Agent redeems reward
**Then:**
- Redemption record created with status='pending'
- Agent credits reduced to 5
- Returns success=true with redemption_id
- Credits_spent logged correctly

#### TC-117: Insufficient Credits
**Given:** Agent has 3 credits, reward costs 5 credits
**When:** Agent tries to redeem reward
**Then:**
- Returns success=false, error='insufficient_credits'
- Message shows current (3) vs needed (5)
- No redemption record created
- Credits unchanged

#### TC-118: Reward Not Found
**Given:** Reward ID=999 does not exist
**When:** Agent tries to redeem ID=999
**Then:**
- Returns success=false, error='reward_not_found'
- No redemption created
- Credits unchanged

#### TC-119: Redeem Inactive Reward
**Given:** Reward ID=1 exists but is inactive
**When:** Agent tries to redeem ID=1
**Then:**
- Returns success=false, error='reward_inactive'
- Message indicates reward no longer available
- No credits deducted

#### TC-120: Exact Balance Redemption
**Given:** Agent has exactly 5 credits, reward costs 5
**When:** Agent redeems reward
**Then:**
- Redemption succeeds
- Agent credits = 0
- Returns success=true

### 5. Redemption Status Management

#### TC-121: Fulfill Redemption
**Given:** Redemption ID=1 exists with status='pending'
**When:** updateRedemptionStatus(1, 'fulfilled') called
**Then:**
- Status updated to 'fulfilled'
- fulfilled_at timestamp set to current time
- Credits remain deducted (no refund)

#### TC-122: Fail Redemption
**Given:** Redemption ID=1 exists with status='pending'
**When:** updateRedemptionStatus(1, 'failed') called
**Then:**
- Status updated to 'failed'
- fulfilled_at remains NULL
- Credits still deducted (use refundRedemption to return)

#### TC-123: Refund Failed Redemption
**Given:** Redemption ID=1 failed, credits_spent=5
**When:** refundRedemption(1) called
**Then:**
- Agent credits increased by 5
- Redemption status set to 'failed'
- Atomic operation (both succeed or both fail)

#### TC-124: Cannot Refund Fulfilled
**Given:** Redemption ID=1 has status='fulfilled'
**When:** refundRedemption(1) called
**Then:**
- Throws error "Cannot refund fulfilled redemption"
- No changes to credits or status

### 6. Transaction History

#### TC-125: Get Agent Transactions
**Given:** Agent has 5 conversion transactions
**When:** getAgentTransactions() called
**Then:**
- Returns transactions ordered by created_at DESC (newest first)
- All transactions have karma_spent and credits_earned
- Limited to specified limit (default 50)

#### TC-126: Get Agent Redemptions
**Given:** Agent has 3 redemptions
**When:** getAgentRedemptions() called
**Then:**
- Returns redemptions with reward details (name, type)
- Ordered by redeemed_at DESC
- Includes status field

#### TC-127: Get Pending Redemptions
**Given:** 10 redemptions exist, 3 are pending
**When:** getPendingRedemptions() called
**Then:**
- Returns only pending redemptions
- Ordered by redeemed_at ASC (oldest first for processing)
- Includes reward details

### 7. Active Rewards Query

#### TC-128: Get Agent Active Rewards
**Given:** Agent has 2 fulfilled redemptions, 1 pending
**When:** getAgentActiveRewards() called
**Then:**
- Returns 2 fulfilled rewards
- Includes reward details and redeemed_at
- Pending redemption not included

#### TC-129: No Active Rewards
**Given:** Agent has never redeemed rewards
**When:** getAgentActiveRewards() called
**Then:**
- Returns empty array
- Does not error

#### TC-130: Multiple Reward Types
**Given:** Agent redeemed: rate_limit_boost, tool_access, badge
**When:** getAgentActiveRewards() called
**Then:**
- Returns all 3 rewards with their reward_type
- Can be filtered by type in application logic

### 8. Concurrent Operations

#### TC-131: Concurrent Conversions
**Given:** Agent has 500 karma
**When:** 2 simultaneous conversions of 300 karma each
**Then:**
- Only 1 succeeds (500 - 300 = 200 remaining)
- Second fails with insufficient_karma error
- No race conditions or lost updates

#### TC-132: Concurrent Redemptions
**Given:** Agent has 10 credits
**When:** 2 simultaneous redemptions of 8 credits each
**Then:**
- Only 1 succeeds
- Second fails with insufficient_credits error
- Credit balance remains accurate

#### TC-133: Conversion + Redemption Race
**Given:** Agent has 200 karma, 0 credits
**When:** Simultaneously convert 200 karma AND redeem 2-credit reward
**Then:**
- Both operations succeed (conversion creates credits for redemption)
- Or redemption fails (depends on timing)
- No inconsistent state

### 9. Edge Cases

#### TC-134: Convert Zero Karma
**Given:** Agent has 1000 karma
**When:** Agent tries to convert 0 karma
**Then:**
- Returns success=false, error='invalid_amount'
- No changes

#### TC-135: Negative Karma Conversion
**Given:** Agent has 500 karma
**When:** Agent tries to convert -100 karma
**Then:**
- Returns success=false, error='invalid_amount'
- No changes

#### TC-136: Redeem with Zero Credits
**Given:** Agent has 0 credits, reward costs 1 credit
**When:** Agent tries to redeem
**Then:**
- Returns success=false, error='insufficient_credits'
- Message shows 0 vs 1

#### TC-137: Refund Non-Existent Redemption
**Given:** Redemption ID=999 does not exist
**When:** refundRedemption(999) called
**Then:**
- Throws error "Redemption not found"
- No credit changes

### 10. Integration Tests

#### TC-138: Full Flow - Earn, Convert, Redeem
**Given:** Fresh agent
**When:**
1. Agent receives 1000 karma from votes
2. Agent converts 500 karma → 5 credits
3. Agent redeems 3-credit reward
4. Redemption fulfilled
**Then:**
- Agent has 500 karma, 2 credits
- Transaction log shows conversion
- Redemption log shows fulfilled redemption
- Active rewards shows the reward

#### TC-139: Full Flow - Earn, Convert, Failed Redemption, Refund
**Given:** Fresh agent
**When:**
1. Agent receives 500 karma
2. Agent converts 500 karma → 5 credits
3. Agent redeems 5-credit reward
4. Redemption fails
5. Refund issued
**Then:**
- Agent has 0 karma, 5 credits (refunded)
- Redemption status = 'failed'
- Credits returned to available balance

## Performance Requirements

- **Conversion:** < 100ms (p95) including atomic updates
- **Redemption:** < 150ms (p95) including validation and atomic updates
- **Credit Balance Lookup:** < 10ms (cached value)
- **Transaction History:** < 50ms for 1000+ transactions
- **Pending Redemptions Query:** < 100ms for 10,000+ redemptions

## Data Integrity Invariants

1. **Credit Conservation:** Total credits = SUM(transactions.credits_earned) - SUM(redemptions.credits_spent WHERE status='fulfilled')
2. **Transaction Amounts Positive:** All karma_spent, credits_earned, credits_spent must be > 0 (CHECK constraints)
3. **Conversion Ratio:** credits_earned = karma_spent / 100 (always exact division)
4. **Atomic Operations:** Karma deduction and credit earning happen together or not at all
5. **Redemption Atomicity:** Credit deduction and redemption record creation happen together
6. **No Double Refunds:** Once refunded (status='failed'), cannot refund again
7. **Fulfilled Timestamps:** Fulfilled redemptions must have fulfilled_at timestamp

## Debugging Queries

### Check for credit drift:
```sql
SELECT
  a.token,
  a.credits as cached_credits,
  COALESCE(SUM(t.credits_earned), 0) - COALESCE(SUM(r.credits_spent), 0) as actual_credits,
  a.credits - (COALESCE(SUM(t.credits_earned), 0) - COALESCE(SUM(r.credits_spent), 0)) as drift
FROM agents a
LEFT JOIN transactions t ON t.agent_token = a.token
LEFT JOIN redemptions r ON r.agent_token = a.token AND r.status = 'fulfilled'
GROUP BY a.token, a.credits
HAVING drift != 0;
```

### Check conversion ratios:
```sql
SELECT *,
  (karma_spent / 100.0) as expected_credits,
  credits_earned - (karma_spent / 100) as ratio_error
FROM transactions
WHERE ratio_error != 0;
```

### Find orphaned redemptions (no agent):
```sql
SELECT r.*
FROM redemptions r
LEFT JOIN agents a ON a.token = r.agent_token
WHERE a.id IS NULL;
```

### Pending redemptions older than 24 hours:
```sql
SELECT *
FROM redemptions
WHERE status = 'pending'
  AND julianday('now') - julianday(redeemed_at) > 1
ORDER BY redeemed_at ASC;
```

### Agent with most credits:
```sql
SELECT token, credits
FROM agents
ORDER BY credits DESC
LIMIT 10;
```

### Most popular rewards:
```sql
SELECT
  rw.id,
  rw.name,
  COUNT(r.id) as redemption_count,
  SUM(CASE WHEN r.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled_count
FROM rewards rw
LEFT JOIN redemptions r ON r.reward_id = rw.id
GROUP BY rw.id, rw.name
ORDER BY redemption_count DESC;
```
