# 🔧 PhonePe Payment Integration Troubleshooting Guide
## Common Issues & Solutions

---

## Table of Contents
1. [Payment Initiation Issues](#payment-initiation-issues)
2. [Payment Processing Issues](#payment-processing-issues)
3. [Webhook Issues](#webhook-issues)
4. [Refund Issues](#refund-issues)
5. [Status Check Issues](#status-check-issues)
6. [Database Issues](#database-issues)
7. [Security Issues](#security-issues)
8. [Performance Issues](#performance-issues)
9. [Integration Issues](#integration-issues)
10. [Production Issues](#production-issues)

---

## 🚫 Payment Initiation Issues

### Issue 1.1: "Invalid Merchant ID" Error

**Symptoms:**
- Payment initiation fails
- Error: "Invalid Merchant ID" or "Merchant not found"

**Possible Causes:**
1. Wrong merchant ID in configuration
2. Using UAT merchant ID in production (or vice versa)
3. Merchant ID not activated

**Diagnosis:**
```
Check configuration file:
- Is MERCHANT_ID set correctly?
- Is ENVIRONMENT set to correct value (UAT/PRODUCTION)?
- Check PhonePe dashboard for correct merchant ID
```

**Solution:**
1. Verify merchant ID from PhonePe dashboard
2. Ensure environment matches credentials (UAT vs Production)
3. Update configuration with correct merchant ID
4. Restart application
5. Test with small payment

**Prevention:**
- Use separate config files for UAT and Production
- Add validation on startup to check credentials
- Document which credentials belong to which environment

---

### Issue 1.2: "Invalid Signature" During Payment Creation

**Symptoms:**
- Payment creation request rejected
- Error: "Signature verification failed"

**Possible Causes:**
1. Incorrect salt key
2. Wrong salt index
3. Signature algorithm issue
4. Request payload modified after signing

**Diagnosis:**
```
1. Verify salt key and index in config
2. Check PhonePe SDK version
3. Review request payload construction
4. Check for any payload modification
```

**Solution:**
1. Get correct salt key from PhonePe dashboard
2. Verify salt index matches dashboard
3. Update SDK to latest version
4. Ensure payload is not modified after signature generation
5. Test signature generation separately

**Prevention:**
- Store salt key securely
- Validate salt key on application startup
- Use SDK methods for signature generation
- Never manually modify signed payloads

---

### Issue 1.3: Payment URL Not Generated

**Symptoms:**
- API call succeeds but no payment URL returned
- Empty or null payment URL

**Possible Causes:**
1. Network timeout
2. PhonePe API error
3. Invalid request parameters
4. Amount validation failed

**Diagnosis:**
```
1. Check API response from PhonePe
2. Review request parameters
3. Check amount is in correct format (paise)
4. Verify network connectivity
5. Check PhonePe service status
```

**Solution:**
1. Verify amount is in paise (₹1 = 100 paise)
2. Ensure all required parameters present
3. Check PhonePe status page for outages
4. Implement retry logic with exponential backoff
5. Add detailed logging for debugging

**Prevention:**
- Validate all parameters before API call
- Add unit conversion helpers (rupees to paise)
- Implement proper error handling
- Monitor PhonePe status page

---

### Issue 1.4: "Amount Invalid" Error

**Symptoms:**
- Payment creation fails
- Error: "Invalid amount" or "Amount must be positive"

**Possible Causes:**
1. Negative amount
2. Zero amount
3. Amount too large
4. Amount not in paise
5. Decimal value in paise amount

**Diagnosis:**
```
1. Check amount value being sent
2. Verify conversion from rupees to paise
3. Check for decimal points
4. Verify amount limits
```

**Solution:**
1. Ensure amount > 0
2. Convert rupees to paise (multiply by 100)
3. Use integer values only (no decimals)
4. Check PhonePe limits (usually min ₹1, max ₹1,00,000)
5. Round amounts properly

**Prevention:**
```python
# Example validation
def validate_amount(rupees):
    if rupees <= 0:
        raise ValueError("Amount must be positive")
    if rupees > 100000:
        raise ValueError("Amount exceeds maximum limit")
    paise = int(rupees * 100)  # Convert to paise
    return paise
```

---

### Issue 1.5: Duplicate Transaction ID Error

**Symptoms:**
- Payment creation fails
- Error: "Duplicate merchant transaction ID"

**Possible Causes:**
1. Transaction ID not unique
2. Retry with same transaction ID
3. ID generation logic flawed

**Diagnosis:**
```
1. Check transaction ID generation logic
2. Look for duplicate IDs in database
3. Verify uniqueness constraints
```

**Solution:**
1. Use UUID or timestamp-based IDs
2. Add random component to IDs
3. Check database before generating
4. Implement proper ID generation

**Prevention:**
```
Format: TRIP_{trip_id}_{timestamp}_{random}
Example: TRIP_12345_1703433600_a7f3
```

---

## 💳 Payment Processing Issues

### Issue 2.1: Payment Stuck in "PENDING" Status

**Symptoms:**
- Payment remains PENDING for extended time
- No status update from PhonePe
- Webhook not received

**Possible Causes:**
1. Customer didn't complete payment
2. Webhook delivery failed
3. Customer lost internet connection
4. Bank processing delay
5. PhonePe system issue

**Diagnosis:**
```
1. Check how long payment has been pending
2. Verify webhook endpoint is accessible
3. Check webhook logs
4. Query PhonePe status API
5. Check customer's payment attempt
```

**Solution:**

**Immediate:**
1. Query PhonePe status API to get current status
2. If genuinely pending, wait (can take up to 24 hours)
3. If completed but webhook missed, update manually

**Long-term:**
1. Implement polling mechanism for pending payments
2. Send reminder to customer after 1 hour
3. Auto-expire after 24 hours
4. Implement webhook retry mechanism

**Customer Communication:**
- "Your payment is being processed"
- "Please don't retry payment"
- "You'll receive confirmation within 24 hours"
- "Contact support if not resolved"

**Prevention:**
- Implement status polling
- Monitor webhook delivery rate
- Set up alerts for long-pending payments
- Implement auto-resolution after 24 hours

---

### Issue 2.2: Payment Shows SUCCESS but Webhook Not Received

**Symptoms:**
- PhonePe shows payment successful
- Database still shows PENDING
- Webhook was not received
- Customer charged but trip not updated

**Possible Causes:**
1. Webhook endpoint unreachable
2. Firewall blocking webhooks
3. SSL certificate issue
4. Webhook handler crashed
5. Network issue during callback

**Diagnosis:**
```
1. Check if webhook endpoint is publicly accessible
2. Test webhook URL with curl/Postman
3. Check firewall/security group rules
4. Review webhook handler logs
5. Check SSL certificate validity
```

**Solution:**

**Immediate Fix:**
1. Manually check payment status using PhonePe API
2. Update database with correct status
3. Credit driver wallet manually
4. Update trip status
5. Send notifications

**Root Cause Fix:**
1. Ensure webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Add webhook endpoint to firewall whitelist
4. Implement webhook retry mechanism on PhonePe side
5. Add status polling as fallback

**Prevention:**
- Monitor webhook delivery rate (should be >99%)
- Set up alerts for missed webhooks
- Implement polling for critical payments
- Test webhook endpoint regularly
- Use webhook testing tools

---

### Issue 2.3: Payment Failed but Wallet Credited

**Symptoms:**
- Payment status is FAILED
- Driver wallet was credited
- Data inconsistency

**Possible Causes:**
1. Race condition in webhook processing
2. Duplicate webhook processing
3. Manual intervention error
4. Database transaction not atomic

**Diagnosis:**
```
1. Check payment status in PhonePe
2. Review webhook logs
3. Check if multiple webhooks received
4. Review database transaction logs
5. Check for manual updates
```

**Solution:**

**Immediate:**
1. Verify actual payment status with PhonePe
2. If payment truly failed:
   - Debit the wallet
   - Reverse the transaction
   - Update trip status
3. If payment actually succeeded:
   - Update status to SUCCESS
   - Keep wallet credit

**Long-term:**
1. Implement database transactions (atomic operations)
2. Add idempotency checks in webhook handler
3. Lock payment record during processing
4. Add validation before wallet operations

**Prevention:**
```python
# Use database transactions
async with db.transaction():
    # Update payment status
    # Credit wallet
    # Update trip
    # All or nothing
```

---

### Issue 2.4: Customer Charged Multiple Times

**Symptoms:**
- Customer charged twice or more
- Multiple payment records for same trip
- Customer complaints about duplicate charge

**Possible Causes:**
1. Customer clicked "Pay" multiple times
2. Retry logic created duplicate payment
3. Race condition in payment creation
4. No duplicate prevention

**Diagnosis:**
```
1. Check how many payment records exist for trip
2. Review payment timestamps
3. Check if payments have different transaction IDs
4. Query PhonePe for all payments
```

**Solution:**

**Immediate:**
1. Identify duplicate payments
2. Refund duplicate payments
3. Keep only one payment
4. Update trip status correctly
5. Apologize to customer

**Long-term:**
1. Implement trip-level payment lock
2. Prevent multiple payment initiations for same trip
3. Disable "Pay" button after click
4. Add loading state during payment creation

**Prevention:**
```python
# Check if payment already exists for trip
existing_payment = db.get_active_payment(trip_id)
if existing_payment:
    if existing_payment.status == "PENDING":
        return existing_payment  # Return existing
    elif existing_payment.status == "SUCCESS":
        raise PaymentAlreadyCompleted()
```

---

## 🔔 Webhook Issues

### Issue 3.1: Webhook Endpoint Returns 404

**Symptoms:**
- PhonePe reports webhook delivery failure
- 404 Not Found error in PhonePe dashboard
- Payments stuck in pending

**Possible Causes:**
1. Webhook URL incorrect in PhonePe dashboard
2. Route not configured in backend
3. Endpoint moved/renamed
4. Server not running

**Diagnosis:**
```
1. Test webhook URL manually:
   curl -X POST https://yourdomain.com/api/v1/payments/webhook
   
2. Check if returns 404 or 200
3. Verify URL in PhonePe dashboard
4. Check backend route configuration
```

**Solution:**
1. Verify correct webhook URL
2. Update URL in PhonePe dashboard if wrong
3. Ensure route is configured in FastAPI
4. Test endpoint manually
5. Restart server if needed

**Prevention:**
- Document webhook URL clearly
- Add health check endpoint
- Test webhook delivery in UAT
- Monitor webhook delivery rate

---

### Issue 3.2: Webhook Signature Verification Fails

**Symptoms:**
- Webhooks received but rejected
- Error: "Invalid signature"
- Payments not updating

**Possible Causes:**
1. Wrong salt key used
2. Wrong salt index
3. Signature algorithm incorrect
4. Payload modified before verification
5. Encoding issue

**Diagnosis:**
```
1. Log incoming signature
2. Log calculated signature
3. Compare both
4. Verify salt key and index
5. Check signature algorithm
```

**Solution:**
1. Get correct salt key from PhonePe dashboard
2. Verify salt index matches
3. Use PhonePe SDK for verification
4. Don't modify payload before verification
5. Check character encoding

**Code Example:**
```python
# Correct way to verify
x_verify = request.headers.get('X-VERIFY')
response_data = request.body

# Verify using SDK
is_valid = phonepe_client.verify_signature(
    response_data,
    x_verify,
    salt_key,
    salt_index
)

if not is_valid:
    # Reject webhook
    raise InvalidSignature()
```

**Prevention:**
- Never skip signature verification
- Use SDK methods for verification
- Test signature verification thoroughly
- Log verification failures

---

### Issue 3.3: Webhook Processing Timeout

**Symptoms:**
- Webhook received but times out
- PhonePe reports timeout
- Processing takes >5 seconds

**Possible Causes:**
1. Heavy business logic in webhook handler
2. Slow database queries
3. External API calls in webhook
4. No async processing

**Diagnosis:**
```
1. Add timing logs in webhook handler
2. Identify slow operations
3. Check database query performance
4. Review external API calls
```

**Solution:**

**Immediate:**
1. Acknowledge webhook immediately (return 200)
2. Process business logic asynchronously
3. Use background tasks

**Long-term:**
1. Optimize database queries
2. Add indexes on frequently queried fields
3. Use caching where appropriate
4. Process in background workers

**Best Practice:**
```python
@app.post("/webhook")
async def webhook_handler(request: Request):
    # Verify signature
    signature = request.headers.get('X-VERIFY')
    payload = await request.body()
    
    if not verify_signature(payload, signature):
        raise InvalidSignature()
    
    # Immediately acknowledge
    # (return 200 BEFORE processing)
    background_tasks.add_task(
        process_webhook,
        payload
    )
    
    return {"success": True}

# Process in background
async def process_webhook(payload):
    # Heavy processing here
    # Update database
    # Send notifications
    # etc.
```

---

### Issue 3.4: Duplicate Webhook Processing

**Symptoms:**
- Same webhook received multiple times
- Wallet credited multiple times
- Duplicate notifications sent

**Possible Causes:**
1. PhonePe retrying webhook delivery
2. No idempotency check
3. Processing same webhook twice

**Diagnosis:**
```
1. Check webhook logs for duplicates
2. Look for same PhonePe transaction ID
3. Check database for duplicate updates
```

**Solution:**
1. Implement idempotency check
2. Use transaction ID as unique key
3. Check if already processed before processing
4. Use database constraints

**Implementation:**
```python
async def process_webhook(transaction_id, data):
    # Check if already processed
    existing = db.get_payment(transaction_id)
    
    if existing.webhook_processed:
        # Already processed, skip
        logger.info(f"Duplicate webhook for {transaction_id}")
        return
    
    # Process webhook
    # ...
    
    # Mark as processed
    db.mark_webhook_processed(transaction_id)
```

**Prevention:**
- Always implement idempotency
- Use unique constraints in database
- Log all webhook processing attempts
- Test duplicate webhook scenarios

---

## 💰 Refund Issues

### Issue 4.1: Refund API Returns "Payment Not Found"

**Symptoms:**
- Refund initiation fails
- Error: "Original payment not found"

**Possible Causes:**
1. Wrong transaction ID provided
2. Payment record deleted
3. Database query issue
4. Payment in different environment (UAT vs Prod)

**Diagnosis:**
```
1. Verify transaction ID is correct
2. Check if payment exists in database
3. Check environment (UAT vs Production)
4. Review database query
```

**Solution:**
1. Get correct transaction ID from payment record
2. Verify payment exists and status is SUCCESS
3. Ensure using correct environment
4. Test database query separately

---

### Issue 4.2: Refund Fails with "Insufficient Balance"

**Symptoms:**
- Refund initiation succeeds
- PhonePe rejects refund
- Error: "Insufficient settlement balance"

**Possible Causes:**
1. Money not yet settled to your account
2. Settlement balance too low
3. Previous refunds exhausted balance

**Diagnosis:**
```
1. Check PhonePe merchant dashboard
2. View settlement balance
3. Check settlement schedule
4. Review recent settlements
```

**Solution:**

**Immediate:**
1. Wait for next settlement
2. Check settlement balance in dashboard
3. Process refund after settlement

**Long-term:**
1. Monitor settlement balance
2. Set up alerts for low balance
3. Adjust settlement frequency if needed
4. Maintain buffer in settlement account

**Note:** PhonePe typically settles T+1 (next day), so refund may need to wait for settlement.

---

### Issue 4.3: Refund Stuck in "PENDING" Status

**Symptoms:**
- Refund initiated successfully
- Status remains PENDING for days
- Customer hasn't received refund

**Possible Causes:**
1. Bank processing delay
2. PhonePe processing backlog
3. Invalid beneficiary details
4. Bank account issue

**Diagnosis:**
```
1. Check how long refund has been pending
2. Query PhonePe refund status API
3. Check for any errors in PhonePe dashboard
4. Verify customer's bank account details
```

**Solution:**

**Timeline Expectations:**
- UPI refunds: 1-3 days
- Card refunds: 5-7 days
- Net banking: 5-7 days

**Actions:**
1. If < 7 days: Wait, inform customer of timeline
2. If > 7 days: Contact PhonePe support
3. Provide PhonePe refund ID to support
4. Track ticket until resolved

**Customer Communication:**
- "Refund is being processed by bank"
- "Expected within 5-7 business days"
- "You'll receive SMS from your bank"
- "Contact us if not received by [date]"

---

### Issue 4.4: Partial Refund Exceeds Original Amount

**Symptoms:**
- Multiple partial refunds created
- Total refund amount > paid amount
- Validation failed

**Possible Causes:**
1. No validation on total refund amount
2. Race condition in refund creation
3. Manual refunds not tracked

**Diagnosis:**
```
1. Sum all refunds for payment
2. Compare with original amount
3. Identify which refund exceeded
4. Check timestamps of refund requests
```

**Solution:**
1. Calculate total already refunded
2. Reject if new refund exceeds remaining
3. Implement proper validation

**Prevention:**
```python
def validate_refund(payment_id, refund_amount):
    payment = db.get_payment(payment_id)
    total_refunded = db.get_total_refunded(payment_id)
    
    remaining = payment.amount - total_refunded
    
    if refund_amount > remaining:
        raise RefundExceedsRemaining(
            f"Can only refund ₹{remaining/100}, "
            f"requested ₹{refund_amount/100}"
        )
```

---

## 📊 Status Check Issues

### Issue 5.1: Status Check Returns Stale Data

**Symptoms:**
- Payment completed but API returns PENDING
- Status not updated in real-time
- Cached data being returned

**Possible Causes:**
1. Cache not invalidated
2. Database not updated
3. Webhook processing delay
4. Polling not refreshing

**Diagnosis:**
```
1. Check database for current status
2. Query PhonePe API directly
3. Compare database vs PhonePe status
4. Check cache TTL
```

**Solution:**
1. Add `force_refresh` parameter to API
2. Query PhonePe when force_refresh=true
3. Invalidate cache on webhook update
4. Reduce cache TTL for payment status

**Implementation:**
```python
async def get_payment_status(
    transaction_id,
    force_refresh=False
):
    if not force_refresh:
        # Try cache/database first
        status = db.get_payment_status(transaction_id)
        if status:
            return status
    
    # Query PhonePe for latest status
    status = phonepe_client.check_status(transaction_id)
    
    # Update database
    db.update_payment_status(transaction_id, status)
    
    return status
```

---

### Issue 5.2: Rate Limit Exceeded on Status Checks

**Symptoms:**
- Status check fails
- Error: "Rate limit exceeded"
- 429 Too Many Requests

**Possible Causes:**
1. Polling too frequently
2. Multiple clients polling same payment
3. No rate limiting on frontend
4. Infinite polling loop

**Diagnosis:**
```
1. Check polling frequency
2. Count API calls per minute
3. Identify source of excessive calls
4. Review frontend polling logic
```

**Solution:**

**Immediate:**
1. Reduce polling frequency
2. Implement exponential backoff
3. Add rate limiting on frontend

**Best Practice:**
- Poll every 2 seconds for first 30 seconds
- Then every 5 seconds for next 2 minutes
- Then every 30 seconds
- Stop after 5 minutes, rely on webhook

**Implementation:**
```javascript
// Frontend polling strategy
let interval = 2000;  // Start with 2 seconds
let attempts = 0;

const poll = () => {
    if (attempts > 15) {
        // Stop after 15 attempts
        showMessage("Please wait, we'll notify you");
        return;
    }
    
    checkStatus();
    attempts++;
    
    // Increase interval gradually
    if (attempts > 5) interval = 5000;   // 5 seconds
    if (attempts > 10) interval = 30000; // 30 seconds
    
    setTimeout(poll, interval);
};
```

---

## 💾 Database Issues

### Issue 6.1: Database Connection Timeout

**Symptoms:**
- Payment operations fail
- Error: "Database connection timeout"
- Intermittent failures

**Possible Causes:**
1. Too many concurrent connections
2. Connection pool exhausted
3. Long-running queries
4. Database server overloaded

**Diagnosis:**
```
1. Check active database connections
2. Review connection pool configuration
3. Identify slow queries
4. Check database server resources
```

**Solution:**

**Immediate:**
1. Restart application to reset connections
2. Kill long-running queries
3. Increase connection timeout temporarily

**Long-term:**
1. Increase connection pool size
2. Optimize slow queries
3. Add database indexes
4. Implement connection retry logic
5. Use connection pooling properly

**Configuration:**
```python
# MongoDB connection with proper pooling
client = MongoClient(
    uri,
    maxPoolSize=50,
    minPoolSize=10,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
    retryWrites=True
)
```

---

### Issue 6.2: Duplicate Key Error on Payment Insert

**Symptoms:**
- Payment creation fails
- Error: "Duplicate key error"
- Transaction ID already exists

**Possible Causes:**
1. Transaction ID collision
2. Retry created duplicate
3. ID generation not unique

**Diagnosis:**
```
1. Check existing payment with same transaction ID
2. Review ID generation logic
3. Check if retry attempt
```

**Solution:**
1. Use UUID for guaranteed uniqueness
2. Add timestamp and random component
3. Check database before creating
4. Implement proper error handling

**Prevention:**
```python
import uuid
from datetime import datetime

def generate_transaction_id(trip_id):
    timestamp = int(datetime.now().timestamp())
    random_suffix = str(uuid.uuid4())[:8]
    return f"TRIP_{trip_id}_{timestamp}_{random_suffix}"
```

---

## 🔐 Security Issues

### Issue 7.1: Credentials Exposed in Logs

**Symptoms:**
- Salt key visible in application logs
- Client secret in error messages
- Security audit failure

**Possible Causes:**
1. Logging full configuration
2. Logging request/response with credentials
3. Error messages exposing secrets

**Diagnosis:**
```
1. Review application logs
2. Search for sensitive keywords
3. Check error messages
4. Review logging configuration
```

**Solution:**

**Immediate:**
1. Rotate exposed credentials immediately
2. Clear logs from servers
3. Update PhonePe dashboard with new credentials

**Long-term:**
1. Implement log sanitization
2. Never log full config
3. Redact sensitive fields in logs
4. Review logging practices

**Implementation:**
```python
import logging

class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        # Redact sensitive data
        message = record.getMessage()
        message = message.replace(SALT_KEY, "***REDACTED***")
        message = message.replace(CLIENT_SECRET, "***REDACTED***")
        record.msg = message
        return True

logger.addFilter(SensitiveDataFilter())
```

---

### Issue 7.2: Webhook Spoofing Attempt

**Symptoms:**
- Webhook with invalid signature received
- Suspicious payment updates
- Unauthorized payment confirmations

**Possible Causes:**
1. Attacker sending fake webhooks
2. Man-in-the-middle attack
3. Signature verification bypassed

**Diagnosis:**
```
1. Check webhook source IP
2. Verify signature validation is working
3. Review webhook logs for suspicious activity
4. Check if signature verification is bypassed anywhere
```

**Solution:**

**Immediate:**
1. Ensure signature verification is enabled
2. Reject all webhooks without valid signature
3. Review recent webhook processing
4. Verify no fraudulent payments confirmed

**Long-term:**
1. Never skip signature verification
2. Validate source IP against PhonePe IPs
3. Add rate limiting on webhook endpoint
4. Monitor for suspicious patterns
5. Set up security alerts

**Implementation:**
```python
PHONEPE_IPS = [
    # Add PhonePe's IP ranges
    "xxx.xxx.xxx.xxx",
]

@app.post("/webhook")
async def webhook_handler(request: Request):
    # Verify source IP
    client_ip = request.client.host
    if client_ip not in PHONEPE_IPS:
        logger.warning(f"Webhook from unknown IP: {client_ip}")
        raise HTTPException(403, "Forbidden")
    
    # Verify signature
    if not verify_signature(request):
        logger.error("Invalid webhook signature")
        raise HTTPException(401, "Invalid signature")
    
    # Process webhook
    ...
```

---

## ⚡ Performance Issues

### Issue 8.1: Slow Payment Initiation

**Symptoms:**
- Payment creation takes >5 seconds
- User experiences delay
- Poor user experience

**Possible Causes:**
1. Slow PhonePe API response
2. Database write delays
3. Heavy validation logic
4. Network latency

**Diagnosis:**
```
1. Add timing logs for each step
2. Identify bottleneck
3. Check network latency to PhonePe
4. Review database query performance
```

**Solution:**
1. Optimize database queries
2. Implement caching where appropriate
3. Reduce validation overhead
4. Use async operations
5. Add loading indicators for user

**Optimization:**
```python
import time

async def initiate_payment(trip_id, amount):
    start = time.time()
    
    # Validate (should be fast)
    validate_trip(trip_id)  # <100ms
    
    # Generate transaction ID (fast)
    txn_id = generate_transaction_id(trip_id)  # <10ms
    
    # Create payment (async)
    payment_url = await phonepe_client.create_payment(...)  # 1-2s
    
    # Save to database (async)
    await db.save_payment(...)  # <200ms
    
    elapsed = time.time() - start
    logger.info(f"Payment initiated in {elapsed:.2f}s")
    
    return payment_url
```

---

### Issue 8.2: High Memory Usage

**Symptoms:**
- Application memory usage increasing
- Out of memory errors
- Server crashes

**Possible Causes:**
1. Memory leaks
2. Large result sets loaded into memory
3. No pagination on queries
4. Cached data not cleared

**Diagnosis:**
```
1. Monitor memory usage over time
2. Profile application
3. Check for unclosed connections
4. Review large data queries
```

**Solution:**
1. Implement pagination on large queries
2. Use database cursors for iteration
3. Clear caches periodically
4. Fix memory leaks
5. Increase server memory if needed

---

## 🔗 Integration Issues

### Issue 9.1: Trip Status Not Updating After Payment

**Symptoms:**
- Payment successful
- Wallet credited
- But trip still shows "AWAITING_PAYMENT"

**Possible Causes:**
1. Trip update logic not triggered
2. Error in trip update
3. Transaction not atomic
4. Race condition

**Diagnosis:**
```
1. Check webhook processing logs
2. Verify trip update function called
3. Check for errors in trip update
4. Review database transactions
```

**Solution:**
1. Ensure trip update is part of payment processing
2. Use database transactions for atomicity
3. Add error handling and retry
4. Log all trip updates

**Implementation:**
```python
async def process_successful_payment(payment):
    async with db.transaction():
        # Update payment status
        await db.update_payment_status(
            payment.id,
            "SUCCESS"
        )
        
        # Credit wallet
        await db.credit_wallet(
            payment.driver_id,
            payment.amount
        )
        
        # Update trip status
        await db.update_trip_status(
            payment.trip_id,
            "COMPLETED_PAID"
        )
        
        # All or nothing
```

---

### Issue 9.2: Notifications Not Sent After Payment

**Symptoms:**
- Payment successful
- No SMS/email sent to customer
- No push notification to driver

**Possible Causes:**
1. Notification service failure
2. Notification not triggered
3. Invalid contact details
4. Network issue

**Diagnosis:**
```
1. Check notification service logs
2. Verify notification function called
3. Check customer/driver contact details
4. Review notification service status
```

**Solution:**
1. Implement retry for failed notifications
2. Queue notifications for async processing
3. Add fallback notification methods
4. Log all notification attempts

---

## 🚀 Production Issues

### Issue 10.1: High Payment Failure Rate in Production

**Symptoms:**
- Success rate dropped to <80%
- Many payments failing
- Customer complaints

**Possible Causes:**
1. PhonePe service degradation
2. Network issues
3. Payment gateway limits exceeded
4. Bank server issues

**Diagnosis:**
```
1. Check PhonePe status page
2. Review failure error codes
3. Analyze failure patterns
4. Check payment method breakdown
```

**Solution:**

**Immediate:**
1. Monitor PhonePe status page
2. Check for any ongoing incidents
3. Communicate with customers
4. Offer alternative payment methods if needed

**Analysis:**
1. Group failures by error code
2. Identify patterns (specific banks, methods, times)
3. Contact PhonePe support for insights
4. Implement appropriate fixes

**Error Code Analysis:**
- `BANK_DOWN`: Specific bank issue
- `TRANSACTION_DECLINED`: Customer's bank declined
- `INSUFFICIENT_FUNDS`: Customer balance low
- `LIMIT_EXCEEDED`: Transaction limits hit

---

### Issue 10.2: Webhook Delivery Rate Dropped

**Symptoms:**
- Webhook delivery rate <90%
- Many pending payments
- Delayed status updates

**Possible Causes:**
1. Server downtime
2. High traffic causing timeouts
3. Firewall blocking webhooks
4. SSL certificate expired

**Diagnosis:**
```
1. Check server uptime
2. Test webhook endpoint accessibility
3. Review firewall logs
4. Verify SSL certificate
5. Check webhook handler performance
```

**Solution:**

**Immediate:**
1. Implement status polling for pending payments
2. Manually verify and update critical payments
3. Fix webhook endpoint issues

**Long-term:**
1. Ensure 99.9% webhook endpoint uptime
2. Optimize webhook handler for <5s response
3. Implement webhook retry on PhonePe side
4. Add monitoring and alerts
5. Use status polling as fallback

**Monitoring:**
```
Alert if webhook delivery rate < 95% for 5 minutes
Alert if webhook response time > 5 seconds
Alert if webhook endpoint returns 5xx errors
```

---

## 🛠️ Debugging Tools & Techniques

### Logging Best Practices

**What to Log:**
```python
logger.info(f"Payment initiated: {transaction_id}, Amount: ₹{amount/100}")
logger.info(f"PhonePe API call started: {transaction_id}")
logger.info(f"PhonePe API response received: {transaction_id}, Status: {status}")
logger.info(f"Payment status updated: {transaction_id}, New status: {status}")
logger.info(f"Wallet credited: {driver_id}, Amount: ₹{amount/100}")
```

**What NOT to Log:**
```python
# DON'T log these
logger.info(f"Salt key: {SALT_KEY}")  # ❌
logger.info(f"Client secret: {CLIENT_SECRET}")  # ❌
logger.info(f"Full config: {config}")  # ❌
```

### Testing Tools

**1. Postman Collection:**
- Create collection for all endpoints
- Add environment variables
- Test each scenario
- Share with team

**2. Webhook Testing:**
```bash
# Use ngrok for local testing
ngrok http 8000

# Update PhonePe dashboard with ngrok URL
https://xxxx.ngrok.io/api/v1/payments/webhook
```

**3. Status Page Monitoring:**
- PhonePe Status: https://status.phonepe.com
- Subscribe to updates
- Check during incidents

### Database Queries for Debugging

**Find pending payments:**
```javascript
db.payments.find({
    status: "PENDING",
    created_at: {$lt: new Date(Date.now() - 24*60*60*1000)}
})
```

**Find failed webhooks:**
```javascript
db.payments.find({
    "webhook_attempts": {$gt: 0},
    "webhook_success": false
})
```

**Reconciliation query:**
```javascript
db.payments.aggregate([
    {
        $group: {
            _id: "$status",
            count: {$sum: 1},
            total_amount: {$sum: "$amount"}
        }
    }
])
```

---

## 📞 Support Escalation

### When to Contact PhonePe Support

1. Webhook delivery rate < 90% for >1 hour
2. Payment success rate < 85% for >1 hour
3. Refund stuck in PENDING for >7 days
4. Signature verification suddenly failing
5. API returning 500 errors consistently
6. Settlement not received as scheduled

### Information to Provide

When contacting PhonePe support, provide:
- Merchant ID
- Environment (UAT/Production)
- Transaction ID(s)
- Timestamp of issue
- Error messages
- Screenshots if applicable
- Steps to reproduce

### Support Channels

- **Email:** tech-support@phonepe.com
- **Merchant Support:** merchant-support@phonepe.com
- **Dashboard:** File ticket from merchant dashboard
- **Emergency:** Hotline (available in dashboard)

---

## 📚 Quick Reference

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| PAYMENT_ERROR | General payment error | Check error message details |
| BAD_REQUEST | Invalid request parameters | Validate all parameters |
| AUTHORIZATION_FAILED | Authentication failed | Check credentials |
| INTERNAL_SERVER_ERROR | PhonePe server error | Retry after some time |
| TRANSACTION_NOT_FOUND | Transaction doesn't exist | Verify transaction ID |
| TIMED_OUT | Request timeout | Retry with exponential backoff |

### HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Fix request parameters |
| 401 | Unauthorized | Check authentication |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify endpoint URL |
| 429 | Rate Limited | Reduce request frequency |
| 500 | Server Error | Retry later |
| 503 | Service Unavailable | Check PhonePe status |

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025  
**Support Contact:** payment-support@yourcompany.com


