# 💸 PhonePe Payout/Disbursement Integration Guide

## Send Money to Phone Numbers & UPI IDs - Driver App

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Payout vs Payment Gateway](#payout-vs-payment-gateway)
3. [Prerequisites](#prerequisites)
4. [Architecture & Flow](#architecture--flow)
5. [Integration Phases](#integration-phases)
6. [Payout Flows](#payout-flows)
7. [Beneficiary Management](#beneficiary-management)
8. [Security Implementation](#security-implementation)
9. [Testing Strategy](#testing-strategy)
10. [Error Handling](#error-handling)
11. [Go-Live Checklist](#go-live-checklist)

---

## 🎯 Overview

### What We're Building

A complete payout system for the Driver App that enables:

- **💰 Driver Withdrawals** - Drivers withdraw earnings to their UPI ID/phone number
- **📤 Instant Payouts** - Send money instantly to driver's UPI account
- **🏦 Bank Transfers** - Transfer to bank accounts linked with phone numbers
- **👥 Beneficiary Management** - Maintain verified beneficiary list
- **📊 Payout Tracking** - Track all outgoing transactions
- **⚖️ Balance Management** - Monitor your payout account balance

### Integration Method

- **PhonePe Business Payout API**
- **B2B (Business to Person) Transfers**
- **UPI-based instant transfers**
- **Server-to-Server API Integration**
- **Webhook-based status updates**

### Key Difference from Payment Gateway

**Payment Gateway (Collection):**

```
Customer → Pays Money → Your Platform (Money IN)
```

**Payout/Disbursement:**

```
Your Platform → Sends Money → Driver (Money OUT)
```

---

## 🔄 Payout vs Payment Gateway

### When to Use Each

| Feature            | Payment Gateway        | Payout/Disbursement      |
| ------------------ | ---------------------- | ------------------------ |
| **Direction**      | Money coming IN        | Money going OUT          |
| **Use Case**       | Customer pays for trip | Platform pays driver     |
| **Who Initiates**  | Customer               | Platform/Admin           |
| **Payment Method** | UPI/Card/Net Banking   | UPI/Bank Transfer        |
| **Beneficiary**    | Your merchant account  | Driver's UPI/Bank        |
| **Settlement**     | T+1 to your account    | Instant to driver        |
| **Refund**         | Yes, can refund        | No refund (irreversible) |
| **Webhook**        | For payment status     | For payout status        |

### Complete Driver App Payment Flow

```
1. Customer pays for trip (Payment Gateway - Money IN)
   → Money goes to your merchant account

2. Commission deducted
   → Platform keeps commission

3. Driver earnings accumulated
   → Stored in driver wallet

4. Driver requests withdrawal (Payout - Money OUT)
   → Money sent to driver's UPI ID
```

---

## 🔑 Prerequisites

### 1. PhonePe Business Account Setup

**Required Steps:**

- [ ] Already have PhonePe Payment Gateway account
- [ ] Request Payout API access from PhonePe
- [ ] Complete additional KYC for payouts
- [ ] Provide business bank account details
- [ ] Load balance in payout account
- [ ] Get payout approval from PhonePe

**Expected Timeline:** 5-7 business days after Payment Gateway approval

**Important:** Payout API is a separate product from Payment Gateway. You need explicit approval.

### 2. Obtain Payout API Credentials

**You will receive:**

- **Merchant ID** (may be same as Payment Gateway)
- **API Key** - For payout authentication
- **Salt Key** - Different from Payment Gateway salt
- **Salt Index** - For signature generation
- **Payout Account ID** - Your payout account identifier

**Environments:**

- **UAT (Testing):** Sandbox for payout testing
- **Production:** Live payout credentials

### 3. Technical Requirements

- [ ] Python 3.9 or above installed
- [ ] FastAPI backend running
- [ ] MongoDB database configured
- [ ] HTTPS/SSL certificate for webhooks
- [ ] Sufficient balance in payout account
- [ ] Payment Gateway already integrated (recommended)

### 4. Banking & Compliance

- [ ] Business bank account verified
- [ ] PAN card submitted
- [ ] GST registration (if applicable)
- [ ] Load initial balance (minimum ₹10,000 recommended)
- [ ] Configure auto-reload settings
- [ ] Set daily/monthly payout limits

### 5. Regulatory Compliance

**Know Your Customer (KYC):**

- Verify driver's identity
- Collect PAN card (for payouts >₹50,000/year)
- Verify UPI ID ownership
- Maintain transaction records

**Tax Compliance:**

- TDS deduction if applicable
- Form 26AS reporting
- Annual tax statements to drivers

---

## 🏗️ Architecture & Flow

### System Architecture

```
┌─────────────────┐
│  Mobile App     │ (Driver)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Panel    │ (Manual Approval)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend                 │
│  ┌───────────────────────────────────┐  │
│  │  Payout Service Layer             │  │
│  │  - Initiate Payout                │  │
│  │  - Verify Beneficiary             │  │
│  │  - Check Payout Status            │  │
│  │  - Handle Webhooks                │  │
│  │  - Manage Account Balance         │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  PhonePe Payout SDK               │  │
│  │  - Request Builder                │  │
│  │  - Signature Generation           │  │
│  │  - Response Verification          │  │
│  └───────────────────────────────────┘  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      PhonePe Payout API                 │
│  - Process Payout                       │
│  - Verify UPI ID                        │
│  - Send to Beneficiary                  │
│  - Send Webhooks                        │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│    Driver's UPI Account                 │
│    (9876543210@paytm)                   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│         MongoDB Database                │
│  - Payouts Collection                   │
│  - Beneficiaries Collection             │
│  - Wallets Collection                   │
│  - Payout Batches Collection            │
└─────────────────────────────────────────┘
```

### Data Flow Overview

1. **Request:** Driver requests withdrawal → Admin approves
2. **Validation:** Backend validates balance, UPI ID, limits
3. **Initiation:** Backend calls PhonePe Payout API
4. **Processing:** PhonePe processes payout to UPI ID
5. **Callback:** PhonePe sends webhook with status
6. **Confirmation:** Backend updates wallet and notifies driver
7. **Settlement:** Money reaches driver's account (instant/few minutes)

---

## 📊 Integration Phases

### Phase 1: Environment Setup (Day 1)

**Objective:** Prepare payout environment

**Steps:**

1. Install PhonePe Payout SDK/Library
2. Create payout configuration separate from Payment Gateway
3. Set up environment variables for payout credentials
4. Create payout-specific salt key configuration
5. Document all payout credentials securely

**Deliverables:**

- Payout SDK/library ready
- Configuration structure for payouts
- Environment variables configured
- Credentials documented and secured

---

### Phase 2: Database Schema Design (Day 1-2)

**Objective:** Design MongoDB collections for payout data

**Collections to Create:**

#### A. **Payouts Collection**

**Purpose:** Store all outgoing payout transactions

**Fields to Include:**

- Payout ID (unique, auto-generated)
- PhonePe Transaction ID
- Merchant Transaction ID
- Driver ID (reference)
- Beneficiary ID (reference)
- Amount (in paise)
- UPI ID / Account Number
- Payout Type (UPI/IMPS/NEFT)
- Status (PENDING/SUCCESS/FAILED/REVERSED)
- Initiated By (admin/auto/driver)
- Created timestamp
- Updated timestamp
- Completion timestamp
- UTR Number (Unique Transaction Reference)
- Failure reason (if failed)
- Webhook data (raw response)
- Retry count
- Fee/charges (if any)

#### B. **Beneficiaries Collection**

**Purpose:** Store verified beneficiary details

**Fields to Include:**

- Beneficiary ID
- Driver ID (reference)
- Name (as per bank account)
- UPI ID (primary)
- Phone Number
- Bank Account Number (optional)
- IFSC Code (optional)
- Bank Name
- Verification Status (PENDING/VERIFIED/FAILED)
- Verified At
- Is Primary (boolean)
- Is Active (boolean)
- Created timestamp
- Last used timestamp
- Total payouts sent
- Verification attempts

#### C. **Payout Account Balance Collection**

**Purpose:** Track your payout account balance

**Fields to Include:**

- Account ID
- Current Balance
- Total Payouts Made
- Total Loaded
- Total Fees Charged
- Last Updated
- Low Balance Alert Threshold
- Auto-reload Enabled
- Auto-reload Amount

#### D. **Payout Batches Collection** (Optional)

**Purpose:** Group multiple payouts for processing

**Fields to Include:**

- Batch ID
- Batch Name
- Total Amount
- Total Count
- Status (CREATED/PROCESSING/COMPLETED/FAILED)
- Created By
- Created At
- Processed At
- Payout IDs (array)
- Success Count
- Failed Count

**Deliverables:**

- All collections created
- Indexes defined (driver_id, status, created_at)
- Relationships documented
- Sample test data inserted

---

### Phase 3: Backend Service Layer (Day 2-5)

**Objective:** Create payout service infrastructure

#### A. **Payout Service Module**

**Components:**

1. **PhonePe Payout Client Initialization**

   - Initialize with payout credentials
   - Configure for UAT/Production
   - Set up authentication headers
   - Configure timeout and retry

2. **Beneficiary Management Service**

   - Add new beneficiary
   - Verify UPI ID/bank account
   - Validate beneficiary details
   - Update beneficiary status
   - Mark primary beneficiary

3. **Payout Creation Service**

   - Generate unique transaction ID
   - Validate driver wallet balance
   - Check payout limits (daily/monthly)
   - Deduct amount from wallet
   - Create payout request
   - Call PhonePe Payout API
   - Store payout record

4. **Payout Status Service**

   - Query PhonePe for payout status
   - Update database with status
   - Handle status changes
   - Track UTR number

5. **Webhook Handler Service**

   - Receive payout status webhooks
   - Verify signature
   - Update payout status
   - Update wallet if failed (refund)
   - Trigger notifications

6. **Balance Management Service**
   - Check payout account balance
   - Load balance (if manual)
   - Monitor balance alerts
   - Track balance usage

#### B. **API Endpoints to Create**

1. **/api/v1/payouts/beneficiaries/add**

   - Input: driver_id, upi_id, name, phone
   - Output: beneficiary_id, verification_status
   - Action: Add beneficiary

2. **/api/v1/payouts/beneficiaries/verify**

   - Input: beneficiary_id
   - Output: verification_status, name
   - Action: Verify beneficiary with PhonePe

3. **/api/v1/payouts/initiate**

   - Input: driver_id, beneficiary_id, amount
   - Output: payout_id, transaction_id, status
   - Action: Initiate payout

4. **/api/v1/payouts/status/{payout_id}**

   - Input: payout_id
   - Output: status, utr, timestamp
   - Action: Check payout status

5. **/api/v1/payouts/webhook**

   - Input: PhonePe webhook payload
   - Output: Acknowledgment
   - Action: Process payout status update

6. **/api/v1/payouts/balance**

   - Input: None (admin only)
   - Output: current_balance, available_balance
   - Action: Get payout account balance

7. **/api/v1/payouts/driver/{driver_id}/history**
   - Input: driver_id
   - Output: payout history
   - Action: Get driver's payout history

**Deliverables:**

- Payout service module complete
- All API endpoints functional
- Beneficiary verification working
- Error handling implemented
- Logging configured

---

### Phase 4: Admin Panel Integration (Day 5-6)

**Objective:** Create admin interface for payout management

#### A. **Driver Withdrawal Request Management**

**Features:**

1. View pending withdrawal requests
2. Approve/reject requests
3. Set approval thresholds (auto-approve <₹5000)
4. Manual payout initiation
5. Bulk payout processing

#### B. **Payout Dashboard**

**Metrics to Display:**

1. Today's total payouts
2. Pending payouts count
3. Failed payouts (requires action)
4. Payout account balance
5. Success rate
6. Average payout time

#### C. **Beneficiary Management**

**Admin Features:**

1. View all beneficiaries
2. Verify beneficiaries manually
3. Block/unblock beneficiaries
4. Update beneficiary details
5. View beneficiary payout history

#### D. **Balance Management**

**Features:**

1. View current balance
2. Load balance manually
3. Set low balance alerts
4. Configure auto-reload
5. View balance usage reports

**Deliverables:**

- Admin dashboard functional
- Approval workflow implemented
- Balance monitoring setup
- Reports available

---

### Phase 5: Mobile App Integration (Day 6-7)

**Objective:** Enable drivers to request withdrawals

#### A. **Driver Wallet Screen**

**Display:**

1. Current balance
2. Total earnings
3. Total withdrawn
4. Pending withdrawals

#### B. **Add UPI ID Screen**

**Flow:**

1. Driver enters UPI ID (9876543210@paytm)
2. Driver enters name as per account
3. Backend verifies UPI ID with PhonePe
4. Show verification status
5. Save as primary beneficiary

#### C. **Withdrawal Request Screen**

**Flow:**

1. Select beneficiary (UPI ID)
2. Enter amount to withdraw
3. Show available balance
4. Show any fees (if applicable)
5. Confirm withdrawal
6. Show "Processing..." status
7. Redirect to history after submission

#### D. **Withdrawal History Screen**

**Display:**

1. List of all withdrawals
2. Status (Processing/Success/Failed)
3. Amount and date
4. UTR number (for successful)
5. Retry option (for failed)

**Deliverables:**

- Wallet UI complete
- Withdrawal flow functional
- Status display working
- Error handling implemented

---

## 💸 Payout Flows

### Flow 1: Driver Withdrawal (End-to-End)

**Step-by-Step Process:**

#### Step 1: Driver Initiates Withdrawal

- Driver opens wallet screen
- Views available balance
- Clicks "Withdraw"
- Selects UPI ID (beneficiary)
- Enters withdrawal amount
- Confirms withdrawal

#### Step 2: Backend Validation

**Validations:**

1. Check if driver has sufficient balance
2. Check minimum withdrawal amount (e.g., ₹100)
3. Check maximum daily limit (e.g., ₹50,000)
4. Check if beneficiary is verified
5. Check if driver has pending KYC
6. Check if driver is blocked

**If validation fails:**

- Return error to driver
- Show reason for failure
- Suggest corrective action

**If validation passes:**

- Create withdrawal request
- Status: PENDING_APPROVAL
- Hold amount in wallet (mark as pending)

#### Step 3: Admin Approval (Optional)

**Auto-Approval Criteria:**

- Amount < ₹5,000
- Driver verified
- No recent suspicious activity
- Beneficiary verified

**Manual Approval Required:**

- Amount ≥ ₹5,000
- First withdrawal
- New beneficiary
- Flagged driver

**Admin Actions:**

- Review withdrawal request
- Check driver history
- Approve or reject
- Add notes

#### Step 4: Payout Initiation

**Backend Actions:**

1. Generate unique transaction ID
2. Deduct amount from driver wallet
3. Build payout request:
   - Amount in paise
   - Beneficiary UPI ID
   - Transaction ID
   - Purpose/remark
4. Generate signature using salt key
5. Call PhonePe Payout API
6. Receive acknowledgment
7. Save payout record with status PENDING

**Example Transaction ID Format:**

```
PAYOUT_DRV12345_1703433600_a7f3
```

#### Step 5: PhonePe Processing

**What happens:**

1. PhonePe validates request
2. Checks signature
3. Validates beneficiary UPI ID
4. Initiates UPI transfer
5. Processes transfer (usually instant)
6. Sends webhook with status

**Timeline:**

- Instant: <1 minute (most UPI transfers)
- Delayed: 1-30 minutes (bank processing)
- Failed: Immediate (invalid UPI ID, etc.)

#### Step 6: Webhook Callback

**PhonePe sends:**

1. Payout status (SUCCESS/FAILED)
2. UTR number (if successful)
3. Failure reason (if failed)
4. Timestamp

**Backend actions:**

1. Verify webhook signature
2. Update payout status
3. If SUCCESS:
   - Mark payout as completed
   - Update wallet transaction
   - Send success notification
4. If FAILED:
   - Refund amount to wallet
   - Log failure reason
   - Send failure notification

#### Step 7: Driver Notification

**Success:**

- "Withdrawal successful! ₹XXX sent to 9876543210@paytm"
- "UTR: XXXXXXXXXX"
- "Money will reflect in 1-5 minutes"

**Failed:**

- "Withdrawal failed. Amount refunded to wallet"
- "Reason: Invalid UPI ID"
- "Please update UPI ID and try again"

---

### Flow 2: Add & Verify Beneficiary

**Purpose:** Verify driver's UPI ID before allowing payouts

#### Step 1: Driver Adds UPI ID

**Input Required:**

1. UPI ID (9876543210@paytm)
2. Name (as per bank account)
3. Phone number

#### Step 2: Validation

**Backend validates:**

1. UPI ID format is correct
2. Phone number matches driver's registered number
3. Name is not empty
4. UPI ID not already exists for driver

#### Step 3: Verification with PhonePe

**PhonePe Verification API:**

- Validates if UPI ID exists
- Returns account holder name
- Confirms if UPI ID is active

**Backend compares:**

- Name provided by driver
- Name returned by PhonePe
- If mismatch > threshold, mark as NEEDS_REVIEW

#### Step 4: Verification Result

**If Verified:**

- Status: VERIFIED
- Allow payouts to this beneficiary
- Send confirmation to driver

**If Failed:**

- Status: FAILED
- Show reason
- Allow driver to correct and retry

**If Needs Review:**

- Status: PENDING_REVIEW
- Admin manually reviews
- Admin approves/rejects

---

### Flow 3: Batch Payout (Admin Feature)

**Purpose:** Process multiple payouts at once

#### Step 1: Admin Creates Batch

1. Select drivers to pay
2. Set amount for each (or use wallet balance)
3. Review total amount
4. Confirm batch creation

#### Step 2: Batch Processing

**For each driver:**

1. Validate eligibility
2. Create individual payout
3. Call PhonePe API
4. Store payout record

**Processing strategy:**

- Process sequentially (not parallel)
- Delay 1-2 seconds between calls (avoid rate limit)
- Track success/failure count
- Continue even if one fails

#### Step 3: Batch Summary

**After completion:**

- Total attempted: 100
- Successful: 95
- Failed: 5
- Total amount: ₹2,50,000

**Admin can:**

- View failed payouts
- Retry failed payouts
- Export batch report

---

### Flow 4: Failed Payout Handling

**Common Failure Scenarios:**

1. **Invalid UPI ID**

   - Action: Ask driver to update UPI ID
   - Refund: Immediate to wallet

2. **Beneficiary Bank Down**

   - Action: Retry after 30 minutes
   - Refund: After max retries

3. **Insufficient Payout Account Balance**

   - Action: Alert admin to load balance
   - Status: Hold payout request
   - Process: Auto-retry when balance loaded

4. **Daily Limit Exceeded**

   - Action: Process next day
   - Status: SCHEDULED

5. **Technical Error**
   - Action: Retry up to 3 times
   - Refund: If all retries fail

**Refund Process:**

1. Change payout status to FAILED
2. Credit amount back to wallet
3. Add transaction record (REFUND)
4. Notify driver
5. Log failure reason

---

## 👥 Beneficiary Management

### Beneficiary Types

1. **Primary Beneficiary**

   - Driver's main UPI ID
   - Used for auto-withdrawals
   - Must be verified

2. **Secondary Beneficiaries**
   - Additional UPI IDs
   - Backup options
   - All must be verified

### Beneficiary Verification

**Why Verify:**

- Prevent fraud (wrong UPI ID)
- Ensure money reaches correct person
- Reduce failed payouts
- Compliance requirement

**Verification Process:**

1. **Format Check**

   - Valid UPI format
   - Allowed UPI handles (@paytm, @ybl, @oksbi, etc.)

2. **PhonePe Verification API**

   - Check if UPI ID exists
   - Get account holder name
   - Confirm active status

3. **Name Matching**

   - Compare with driver's name
   - Allow minor differences
   - Flag major mismatches

4. **Test Transaction** (Optional)
   - Send ₹1 to UPI ID
   - Confirm receipt
   - Verify with driver

### Beneficiary Status Lifecycle

```
CREATED → VERIFICATION_PENDING → VERIFIED → ACTIVE
   ↓              ↓                   ↓
REJECTED   VERIFICATION_FAILED   BLOCKED
```

**Status Meanings:**

- **CREATED:** Just added, not verified
- **VERIFICATION_PENDING:** Verification in progress
- **VERIFIED:** Successfully verified
- **ACTIVE:** Can receive payouts
- **BLOCKED:** Cannot receive payouts
- **REJECTED:** Verification failed permanently

### Beneficiary Limits

**Per Driver:**

- Maximum 3 beneficiaries
- Only 1 can be primary
- All must be verified before use

**Update Restrictions:**

- Can update UPI ID once per month
- Must re-verify after update
- Old UPI ID blocked for 7 days

---

## 🔐 Security Implementation

### 1. Credential Management

**Payout Credentials:**

- Store separately from Payment Gateway credentials
- Use different salt key
- Rotate keys every 90 days
- Never commit to Git
- Use secrets manager

### 2. Authorization & Access Control

**Who Can Initiate Payouts:**

1. **Admins:** Full access
2. **Finance Team:** View and initiate
3. **System (Auto):** Based on rules
4. **Drivers:** Request only (not initiate)

**Implement:**

- Role-based access control (RBAC)
- Multi-level approval for large amounts
- Audit trail for all payouts

### 3. Fraud Prevention

**Red Flags:**

1. Frequent beneficiary changes
2. UPI ID verification failures
3. Withdrawal immediately after earning
4. Amount just below auto-approval threshold
5. Multiple withdrawals in short time

**Preventive Measures:**

1. **Velocity Checks:**

   - Max 3 withdrawals per day
   - Max ₹50,000 per day
   - Max ₹2,00,000 per month

2. **Cooling Period:**

   - New driver: 7 days before first withdrawal
   - New beneficiary: 24 hours before use

3. **Verification:**

   - Verify driver identity
   - Verify beneficiary ownership
   - Match names

4. **Monitoring:**
   - Alert on suspicious patterns
   - Flag unusual amounts
   - Review failed payouts

### 4. Signature Verification

**For All PhonePe Responses:**

- Verify webhook signatures
- Reject invalid signatures
- Use latest salt key
- Log verification failures

### 5. Balance Protection

**Safeguards:**

1. **Low Balance Alert:** Alert at ₹10,000
2. **Auto-reload:** Configure threshold
3. **Daily Limit:** Set maximum daily payout
4. **Approval for Large Amounts:** Manual approval >₹50,000

### 6. Data Protection

**Sensitive Data:**

- Encrypt UPI IDs in database
- Encrypt bank account numbers
- Mask UPI in logs (987\*\*\*\*210@paytm)
- Don't expose full UPI in APIs

### 7. Compliance

**Regulatory Requirements:**

1. **KYC:** Verify driver identity
2. **PAN Collection:** For payouts >₹50,000/year
3. **TDS:** Deduct if applicable
4. **Record Keeping:** Maintain for 7 years
5. **Reporting:** File required tax forms

---

## 🧪 Testing Strategy

### Phase 1: UAT Testing

**PhonePe Sandbox Features:**

- Test UPI IDs for success/failure
- Simulated payout processing
- Webhook testing
- Balance management testing

**Test Beneficiaries:**

- Success: `success@test`
- Failure: `failure@test`
- Pending: `pending@test`
- Invalid: `invalid@test`

### Phase 2: Payout Testing

**Test Cases:**

1. **Successful Payout**

   - Add test beneficiary
   - Initiate payout of ₹100
   - Verify success status
   - Check webhook received
   - Verify wallet deducted

2. **Failed Payout**

   - Use invalid beneficiary
   - Initiate payout
   - Verify failure status
   - Check amount refunded to wallet

3. **Pending Payout**

   - Initiate payout
   - Status remains pending
   - Poll for status updates
   - Verify eventual success

4. **Duplicate Prevention**

   - Initiate payout
   - Try to initiate again
   - Verify duplicate rejected

5. **Insufficient Balance**

   - Try payout > wallet balance
   - Verify rejection

6. **Daily Limit**
   - Exceed daily limit
   - Verify rejection

### Phase 3: Beneficiary Testing

**Test Cases:**

1. Verify valid UPI ID
2. Verify invalid UPI ID
3. Name mismatch handling
4. Multiple beneficiaries
5. Update beneficiary
6. Delete beneficiary

### Phase 4: Edge Cases

**Test Scenarios:**

1. Payout during PhonePe downtime
2. Webhook delivery failure
3. Network timeout
4. Very large amounts
5. Concurrent payout attempts
6. Balance exhaustion

---

## ⚠️ Error Handling

### Payout Errors

#### 1. Insufficient Payout Account Balance

**Error:** Not enough balance in payout account

**Handling:**

1. Check balance before payout
2. Alert admin immediately
3. Hold payout request
4. Auto-retry after balance loaded
5. Notify driver of delay

#### 2. Invalid Beneficiary

**Error:** UPI ID doesn't exist or inactive

**Handling:**

1. Mark beneficiary as INVALID
2. Refund to wallet
3. Ask driver to update UPI ID
4. Suggest re-verification

#### 3. Beneficiary Bank Down

**Error:** Recipient bank not available

**Handling:**

1. Retry after 30 minutes
2. Max 3 retries
3. If all fail, refund to wallet
4. Notify driver to try later

#### 4. Daily Limit Exceeded

**Error:** Driver exceeded daily withdrawal limit

**Handling:**

1. Show clear error message
2. Display limit and used amount
3. Show next available date
4. Suggest scheduling withdrawal

#### 5. Verification Failed

**Error:** Name mismatch or verification failed

**Handling:**

1. Show verification failure
2. Display expected vs provided name
3. Allow driver to correct
4. Offer manual review option

---

## 🚀 Go-Live Checklist

### Pre-Production

#### 1. UAT Completion

- [ ] All payout flows tested
- [ ] Beneficiary verification tested
- [ ] Webhook handling tested
- [ ] Failed payout scenarios tested
- [ ] Balance management tested
- [ ] Security testing completed

#### 2. Production Setup

- [ ] Production credentials configured
- [ ] Webhook URL updated
- [ ] Initial balance loaded (min ₹50,000)
- [ ] Auto-reload configured
- [ ] Daily limits set
- [ ] Approval thresholds configured

#### 3. Compliance

- [ ] KYC process implemented
- [ ] PAN collection enabled
- [ ] TDS calculation ready (if applicable)
- [ ] Record keeping system ready
- [ ] Terms and conditions updated

#### 4. Monitoring

- [ ] Balance alerts configured
- [ ] Failed payout alerts setup
- [ ] Daily payout report enabled
- [ ] Fraud detection rules active
- [ ] Admin dashboard ready

### Go-Live Strategy

**Phase 1: Soft Launch (Week 1)**

1. Enable for 10 selected drivers
2. Monitor all payouts closely
3. Review every transaction manually
4. Gather feedback
5. Fix any issues

**Phase 2: Limited Launch (Week 2-3)**

1. Enable for 100 drivers
2. Auto-approve small amounts
3. Manual review for large amounts
4. Monitor fraud patterns
5. Optimize processing time

**Phase 3: Full Launch (Week 4+)**

1. Enable for all verified drivers
2. Increase auto-approval limits
3. Automated monitoring
4. Regular reviews

---

## 📊 Success Metrics

### Key Performance Indicators

**Payout Success Rate**

- Target: >98%
- Measure: (Successful Payouts / Total Attempts) × 100

**Average Payout Time**

- Target: <5 minutes
- Measure: Time from initiation to driver receipt

**Beneficiary Verification Rate**

- Target: >95%
- Measure: Successfully verified / Total attempts

**Failed Payout Rate**

- Target: <2%
- Measure: Failed payouts / Total payouts

**Driver Satisfaction**

- Target: >4.5/5
- Measure: Withdrawal experience rating

---

## 💡 Best Practices

### 1. Balance Management

- Maintain minimum ₹50,000 balance
- Set up auto-reload
- Monitor balance daily
- Alert at ₹20,000 threshold

### 2. Approval Workflow

- Auto-approve <₹5,000
- Manual review ₹5,000-₹50,000
- Multi-level approval >₹50,000
- Always verify new beneficiaries

### 3. Driver Communication

- Clear withdrawal limits
- Expected time for money receipt
- UTR number in confirmation
- Proactive failure notifications

### 4. Reconciliation

- Daily payout reconciliation
- Match PhonePe reports
- Verify wallet balances
- Check for discrepancies

### 5. Support Readiness

- Train support on payout issues
- Prepare FAQs
- Create escalation matrix
- Monitor support tickets

---

## 📚 Additional Resources

### PhonePe Documentation

- **Payout API Docs:** https://developer.phonepe.com/business/docs/payout
- **Beneficiary Verification:** https://developer.phonepe.com/business/docs/verify
- **Webhook Handling:** https://developer.phonepe.com/business/docs/webhooks

### Support Channels

- **Technical Support:** business-tech@phonepe.com
- **Account Manager:** Your dedicated PhonePe contact
- **Dashboard:** PhonePe Business Dashboard

---

## 📝 Summary

This guide provides complete implementation steps for PhonePe Payout/Disbursement integration, enabling you to send money to drivers' UPI IDs instantly.

**Timeline:**

- **Phase 1-2:** 2 days (Setup & Database)
- **Phase 3:** 3-4 days (Backend Development)
- **Phase 4:** 2 days (Admin Panel)
- **Phase 5:** 2 days (Mobile Integration)
- **Testing:** 2-3 days
- **Total:** ~12-14 days

**Key Points:**

1. Payout is separate from Payment Gateway
2. Requires explicit PhonePe approval
3. Verify all beneficiaries before payouts
4. Maintain sufficient balance
5. Implement fraud prevention
6. Test thoroughly before production

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025  
**Maintained By:** Driver App Development Team
