# ✅ PhonePe Payment Integration Testing Checklist

## Comprehensive Testing Guide

---

## Overview

This checklist ensures thorough testing of PhonePe payment integration before going live. Complete each section systematically and mark items as done.

---

## 🔧 Phase 1: Environment Setup Testing

### SDK Installation

- [ ] Python 3.9+ verified
- [ ] PhonePe SDK installed successfully
- [ ] SDK version is 2.1.5 or latest
- [ ] All dependencies installed
- [ ] No installation errors in logs

### Configuration

- [ ] UAT credentials configured
- [ ] Production credentials stored securely
- [ ] Environment variables loaded correctly
- [ ] Salt key and index configured
- [ ] Merchant ID verified
- [ ] Client ID and Secret verified
- [ ] Configuration file syntax validated

### Database Setup

- [ ] Payments collection created
- [ ] Wallets collection created
- [ ] Transactions collection created
- [ ] Refunds collection created
- [ ] Indexes created on all collections
- [ ] Database connection successful
- [ ] Test data inserted successfully
- [ ] Query performance tested

---

## 💳 Phase 2: Payment Initiation Testing

### Basic Payment Creation

- [ ] **Test Case 1.1:** Create payment with valid amount

  - Amount: ₹100 (10000 paise)
  - Expected: Payment URL generated
  - Status: PENDING

- [ ] **Test Case 1.2:** Create payment with minimum amount

  - Amount: ₹1 (100 paise)
  - Expected: Success

- [ ] **Test Case 1.3:** Create payment with large amount

  - Amount: ₹50,000 (5000000 paise)
  - Expected: Success

- [ ] **Test Case 1.4:** Create payment with invalid amount (zero)

  - Amount: ₹0
  - Expected: Error - INVALID_AMOUNT

- [ ] **Test Case 1.5:** Create payment with negative amount
  - Amount: -₹100
  - Expected: Error - INVALID_AMOUNT

### Transaction ID Generation

- [ ] Transaction IDs are unique
- [ ] Transaction IDs follow correct format
- [ ] No duplicate transaction IDs in database
- [ ] Transaction ID length is appropriate
- [ ] Transaction ID contains trip reference

### Payment URL Generation

- [ ] Payment URL is generated
- [ ] URL is accessible
- [ ] URL points to PhonePe domain
- [ ] URL contains valid token
- [ ] URL expires after configured time (15 mins)

### Database Records

- [ ] Payment record created in database
- [ ] All required fields populated
- [ ] Status set to PENDING
- [ ] Timestamps recorded correctly
- [ ] Customer and trip IDs linked
- [ ] Amount stored in paise

### Error Handling

- [ ] Invalid trip ID handled
- [ ] Invalid customer ID handled
- [ ] Missing required fields handled
- [ ] Network timeout handled
- [ ] PhonePe API error handled
- [ ] Database error handled

---

## 🔄 Phase 3: Payment Processing Testing

### UPI Payment Flow

- [ ] **Test Case 2.1:** Successful UPI payment

  - Use test UPI ID: success@ybl
  - Expected: Status changes to SUCCESS
  - Wallet credited

- [ ] **Test Case 2.2:** Failed UPI payment

  - Use test UPI ID: failure@ybl
  - Expected: Status changes to FAILED
  - Wallet not credited

- [ ] **Test Case 2.3:** Pending UPI payment

  - Use test UPI ID: pending@ybl
  - Expected: Status remains PENDING
  - Handled appropriately

- [ ] **Test Case 2.4:** Cancelled UPI payment
  - Start payment and cancel
  - Expected: Status changes to CANCELLED
  - No wallet credit

### Card Payment Flow

- [ ] **Test Case 2.5:** Successful card payment

  - Card: 4111 1111 1111 1111
  - Expected: SUCCESS

- [ ] **Test Case 2.6:** Insufficient balance card

  - Card: 4242 4242 4242 4242
  - Expected: FAILED with appropriate error

- [ ] **Test Case 2.7:** Declined card
  - Card: 4000 0000 0000 0002
  - Expected: FAILED

### Wallet Payment Flow

- [ ] **Test Case 2.8:** PhonePe Wallet payment

  - Use test wallet
  - Expected: SUCCESS

- [ ] **Test Case 2.9:** Other wallet payments
  - Test Paytm, Google Pay
  - Expected: All work correctly

### Net Banking Flow

- [ ] **Test Case 2.10:** Net banking payment
  - Use test bank
  - Expected: SUCCESS

---

## 📊 Phase 4: Payment Status Testing

### Status Polling

- [ ] **Test Case 3.1:** Check status before payment

  - Expected: Status is PENDING

- [ ] **Test Case 3.2:** Check status during payment

  - Expected: Status is PENDING

- [ ] **Test Case 3.3:** Check status after successful payment

  - Expected: Status is SUCCESS

- [ ] **Test Case 3.4:** Check status after failed payment

  - Expected: Status is FAILED

- [ ] **Test Case 3.5:** Check status with invalid transaction ID
  - Expected: Error - TRANSACTION_NOT_FOUND

### Status Refresh

- [ ] Status refresh from database works
- [ ] Force refresh from PhonePe works
- [ ] Caching works correctly
- [ ] Stale data not returned
- [ ] Status updates propagate correctly

### Payment Details

- [ ] All payment details returned
- [ ] Payment method captured
- [ ] Payment timestamp accurate
- [ ] PhonePe transaction ID stored
- [ ] Amount matches original

---

## 🔔 Phase 5: Webhook Testing

### Webhook Receipt

- [ ] **Test Case 4.1:** Webhook received for successful payment

  - Trigger test payment
  - Verify webhook delivered
  - Check webhook logs

- [ ] **Test Case 4.2:** Webhook received for failed payment

  - Trigger test failure
  - Verify webhook delivered

- [ ] **Test Case 4.3:** Webhook endpoint is accessible
  - Use curl/Postman to test
  - Verify 200 OK response

### Signature Verification

- [ ] **Test Case 4.4:** Valid signature accepted

  - Send webhook with valid signature
  - Expected: Processed successfully

- [ ] **Test Case 4.5:** Invalid signature rejected

  - Send webhook with tampered signature
  - Expected: Rejected with error
  - Not processed

- [ ] **Test Case 4.6:** Missing signature rejected
  - Send webhook without X-VERIFY header
  - Expected: Rejected

### Webhook Processing

- [ ] Payment status updated in database
- [ ] Trip status updated
- [ ] Wallet credited
- [ ] Commission deducted
- [ ] Notifications sent
- [ ] Response sent to PhonePe within 5 seconds

### Duplicate Webhooks

- [ ] **Test Case 4.7:** Duplicate webhook handling

  - Send same webhook twice
  - Expected: Processed only once
  - Idempotency maintained

- [ ] **Test Case 4.8:** Out-of-order webhooks
  - Send webhooks in wrong order
  - Expected: Handled correctly
  - Final state is accurate

### Error Scenarios

- [ ] Database error during webhook processing
- [ ] Network timeout during processing
- [ ] Invalid payload format
- [ ] Missing required fields
- [ ] Decryption failure

---

## 💰 Phase 6: Wallet Management Testing

### Wallet Credit

- [ ] **Test Case 5.1:** Wallet credited on successful payment

  - Complete payment
  - Check wallet balance increased
  - Amount matches payment

- [ ] **Test Case 5.2:** Commission deducted correctly

  - Verify commission percentage
  - Check commission amount
  - Verify net amount credited

- [ ] **Test Case 5.3:** Multiple payments to same wallet
  - Make 5 payments
  - Verify all credited
  - Total balance correct

### Wallet Balance

- [ ] Current balance calculated correctly
- [ ] Total earned tracked
- [ ] Total withdrawn tracked
- [ ] Total commission tracked
- [ ] Balance never goes negative (for credits)

### Transaction History

- [ ] All transactions recorded
- [ ] Transactions ordered by time
- [ ] Transaction types correct
- [ ] Amounts accurate
- [ ] Descriptions meaningful
- [ ] Pagination works

---

## 🔁 Phase 7: Refund Testing

### Refund Eligibility

- [ ] **Test Case 6.1:** Refund successful payment

  - Create and complete payment
  - Initiate refund
  - Expected: Refund initiated

- [ ] **Test Case 6.2:** Cannot refund failed payment

  - Try to refund failed payment
  - Expected: Error - PAYMENT_NOT_SUCCESS

- [ ] **Test Case 6.3:** Cannot refund pending payment

  - Try to refund pending payment
  - Expected: Error - PAYMENT_NOT_SUCCESS

- [ ] **Test Case 6.4:** Cannot exceed paid amount
  - Try to refund more than paid
  - Expected: Error - REFUND_AMOUNT_INVALID

### Full Refund

- [ ] **Test Case 6.5:** Full refund processed
  - Paid: ₹100
  - Refund: ₹100
  - Expected: Full refund successful
  - Wallet debited

### Partial Refund

- [ ] **Test Case 6.6:** Partial refund processed
  - Paid: ₹100
  - Refund: ₹50
  - Expected: Partial refund successful
  - Can refund remaining ₹50

### Multiple Refunds

- [ ] **Test Case 6.7:** Multiple partial refunds

  - Paid: ₹100
  - Refund 1: ₹30
  - Refund 2: ₹40
  - Refund 3: ₹30
  - Expected: All successful
  - Total refunded = ₹100

- [ ] **Test Case 6.8:** Cannot exceed total with multiple refunds
  - Try to refund more than remaining
  - Expected: Error

### Refund Status

- [ ] Refund status tracked
- [ ] Status updates received
- [ ] Webhook for refund received
- [ ] Final status correct (SUCCESS/FAILED)

### Wallet Impact

- [ ] Driver wallet debited on refund
- [ ] Commission refunded to driver
- [ ] Transaction recorded
- [ ] Balance accurate after refund

---

## 🔐 Phase 8: Security Testing

### Authentication

- [ ] **Test Case 7.1:** Valid JWT accepted

  - Send request with valid token
  - Expected: Success

- [ ] **Test Case 7.2:** Invalid JWT rejected

  - Send request with invalid token
  - Expected: 401 Unauthorized

- [ ] **Test Case 7.3:** Expired JWT rejected

  - Send request with expired token
  - Expected: 401 Unauthorized

- [ ] **Test Case 7.4:** No JWT rejected
  - Send request without token
  - Expected: 401 Unauthorized

### Authorization

- [ ] User can only access own payments
- [ ] User can only access own wallet
- [ ] Admin can access all data
- [ ] Driver can access own earnings
- [ ] Customer can access own payments

### Data Protection

- [ ] Sensitive data encrypted in database
- [ ] No credentials in logs
- [ ] No card details stored
- [ ] API responses don't leak sensitive data
- [ ] Error messages don't expose internals

### Signature Verification

- [ ] All PhonePe responses verified
- [ ] Tampered responses rejected
- [ ] Signature algorithm correct
- [ ] Salt key used correctly
- [ ] Salt index used correctly

### HTTPS/SSL

- [ ] All endpoints use HTTPS
- [ ] SSL certificate valid
- [ ] No mixed content
- [ ] Certificate chain complete
- [ ] TLS 1.2+ enforced

---

## ⚡ Phase 9: Performance Testing

### Response Times

- [ ] **Test Case 8.1:** Payment initiation < 2 seconds

  - Measure response time
  - Expected: Under 2 seconds

- [ ] **Test Case 8.2:** Status check < 1 second

  - Measure response time
  - Expected: Under 1 second

- [ ] **Test Case 8.3:** Webhook processing < 5 seconds
  - Measure processing time
  - Expected: Under 5 seconds

### Load Testing

- [ ] **Test Case 8.4:** 50 concurrent payments

  - Simulate 50 users
  - All succeed
  - No errors

- [ ] **Test Case 8.5:** 100 concurrent payments

  - Simulate 100 users
  - System handles load
  - Response times acceptable

- [ ] **Test Case 8.6:** 500 concurrent payments
  - Stress test
  - Identify limits
  - System doesn't crash

### Database Performance

- [ ] Queries execute quickly
- [ ] Indexes used properly
- [ ] No slow queries
- [ ] Connection pool works
- [ ] No connection leaks

### Memory Usage

- [ ] No memory leaks
- [ ] Memory usage stable
- [ ] Garbage collection works
- [ ] No out-of-memory errors

---

## 🚨 Phase 10: Error Handling Testing

### Network Errors

- [ ] **Test Case 9.1:** PhonePe API timeout

  - Simulate timeout
  - Expected: Retry mechanism works
  - Error message appropriate

- [ ] **Test Case 9.2:** Connection refused

  - Simulate network down
  - Expected: Graceful failure
  - User notified

- [ ] **Test Case 9.3:** DNS resolution failure
  - Expected: Handled gracefully

### API Errors

- [ ] **Test Case 9.4:** PhonePe returns 500 error

  - Expected: Error logged
  - User notified
  - Retry attempted

- [ ] **Test Case 9.5:** PhonePe returns 400 error
  - Expected: Error logged
  - User notified with details

### Database Errors

- [ ] **Test Case 9.6:** Database connection lost

  - Expected: Reconnection attempted
  - Operations queued

- [ ] **Test Case 9.7:** Write failure
  - Expected: Transaction rolled back
  - Error logged

### Validation Errors

- [ ] Invalid input rejected
- [ ] Clear error messages
- [ ] Field-level errors shown
- [ ] No crash on bad input

---

## 📱 Phase 11: Frontend Integration Testing

### Payment UI

- [ ] Payment button visible
- [ ] Amount displayed correctly
- [ ] Click initiates payment
- [ ] Loading state shown
- [ ] Redirect to PhonePe works

### Payment Flow

- [ ] User redirects to PhonePe
- [ ] Payment options shown
- [ ] Payment completes
- [ ] User redirects back to app
- [ ] Success/failure shown correctly

### Error States

- [ ] Payment initiation error shown
- [ ] Payment failure shown
- [ ] Cancellation handled
- [ ] Timeout handled
- [ ] Retry option available

### Mobile App

- [ ] Works on Android
- [ ] Works on iOS
- [ ] In-app browser works
- [ ] External browser works
- [ ] Deep linking back works

---

## 🔍 Phase 12: Edge Cases Testing

### Concurrent Operations

- [ ] **Test Case 10.1:** Multiple payments for same trip

  - Expected: Only one succeeds

- [ ] **Test Case 10.2:** Payment and status check simultaneously

  - Expected: Correct status returned

- [ ] **Test Case 10.3:** Refund during payment processing
  - Expected: Handled appropriately

### Timing Issues

- [ ] **Test Case 10.4:** Payment after trip completion

  - Expected: Works correctly

- [ ] **Test Case 10.5:** Very old trip payment

  - Expected: Handled or rejected

- [ ] **Test Case 10.6:** Payment link expiry
  - Expected: Expired link rejected
  - New link can be generated

### Data Consistency

- [ ] Payment and wallet always consistent
- [ ] Trip status matches payment status
- [ ] Transaction history complete
- [ ] No orphaned records

### Boundary Conditions

- [ ] Minimum payment amount
- [ ] Maximum payment amount
- [ ] Very long transaction IDs
- [ ] Special characters in descriptions
- [ ] Unicode characters handled

---

## 🌐 Phase 13: Integration Testing

### Trip Integration

- [ ] Trip marked as paid after payment
- [ ] Trip status updates correctly
- [ ] Trip can be completed after payment
- [ ] Trip history shows payment

### Driver Integration

- [ ] Driver wallet updates
- [ ] Driver can see earnings
- [ ] Driver notification sent
- [ ] Driver analytics updated

### Customer Integration

- [ ] Customer sees payment history
- [ ] Customer receives receipt
- [ ] Customer notification sent
- [ ] Customer can view invoice

### Admin Integration

- [ ] Admin can view all payments
- [ ] Admin can initiate refunds
- [ ] Admin sees analytics
- [ ] Admin can export reports

---

## 📊 Phase 14: Reporting & Analytics Testing

### Payment Reports

- [ ] Daily payment report generated
- [ ] Weekly summary available
- [ ] Monthly totals calculated
- [ ] Success rate calculated
- [ ] Revenue reports accurate

### Analytics Dashboard

- [ ] Total transactions shown
- [ ] Success rate displayed
- [ ] Payment method breakdown
- [ ] Refund statistics
- [ ] Real-time updates

### Export Functionality

- [ ] Export to CSV works
- [ ] Export to Excel works
- [ ] Export to PDF works
- [ ] Date range filtering works
- [ ] Large exports handled

---

## 🔄 Phase 15: End-to-End Scenarios

### Complete Trip Flow

- [ ] **Scenario 1:** Happy path
  1. Customer books trip
  2. Driver accepts
  3. Trip completed
  4. Payment initiated
  5. Customer pays
  6. Webhook received
  7. Wallet credited
  8. Receipt generated
  9. All statuses correct

### Refund Flow

- [ ] **Scenario 2:** Cancelled trip with refund
  1. Customer books trip
  2. Payment made
  3. Trip cancelled
  4. Refund initiated
  5. Refund processed
  6. Wallet debited
  7. Customer refunded
  8. All statuses correct

### Failure Recovery

- [ ] **Scenario 3:** Payment fails, retry succeeds
  1. First payment fails
  2. Customer retries
  3. Second payment succeeds
  4. Only one payment processed
  5. No duplicate charge

---

## 📝 Phase 16: UAT Acceptance

### Business Validation

- [ ] Commission calculation verified by finance
- [ ] Settlement process validated
- [ ] Refund policy implemented correctly
- [ ] Invoice format approved
- [ ] Receipt format approved

### User Acceptance

- [ ] Customer can complete payment easily
- [ ] Driver receives earnings correctly
- [ ] Admin can manage payments
- [ ] Support can assist with issues

### Compliance

- [ ] Terms and conditions updated
- [ ] Privacy policy updated
- [ ] Refund policy published
- [ ] GST/tax handling correct

---

## 🚀 Phase 17: Pre-Production Checklist

### Configuration

- [ ] Production credentials configured
- [ ] Webhook URL updated to production
- [ ] Redirect URLs point to production
- [ ] Environment set to PRODUCTION
- [ ] All test flags disabled

### Infrastructure

- [ ] Production server ready
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Load balancer ready
- [ ] Database backed up
- [ ] Monitoring enabled

### Security

- [ ] All credentials in secrets manager
- [ ] No test credentials in production
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Logging enabled

### Documentation

- [ ] API documentation complete
- [ ] User guide prepared
- [ ] Admin guide prepared
- [ ] Support guide prepared
- [ ] Runbook prepared

---

## ✅ Final Sign-Off

### Development Team

- [ ] All tests passed
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] No known critical bugs

### QA Team

- [ ] All test cases executed
- [ ] No critical defects
- [ ] Performance acceptable
- [ ] Security validated

### Business Team

- [ ] Business flows validated
- [ ] Commission logic approved
- [ ] Refund policy approved
- [ ] Ready for launch

### Operations Team

- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Support trained
- [ ] Runbook reviewed

---

## 📊 Testing Metrics

### Completion Tracking

**Total Test Cases:** 100+  
**Passed:** **\_  
**Failed:** \_**  
**Blocked:** **\_  
**Not Tested:** \_**

**Overall Progress:** \_\_\_%

### Quality Metrics

- **Success Rate Target:** >95%
- **Response Time Target:** <3 seconds
- **Uptime Target:** >99.9%
- **Error Rate Target:** <5%

---

## 🐛 Defect Tracking

### Critical Defects

| ID  | Description | Status | Owner |
| --- | ----------- | ------ | ----- |
|     |             |        |       |

### Major Defects

| ID  | Description | Status | Owner |
| --- | ----------- | ------ | ----- |
|     |             |        |       |

### Minor Defects

| ID  | Description | Status | Owner |
| --- | ----------- | ------ | ----- |
|     |             |        |       |

---

## 📅 Testing Timeline

- **Day 1:** Phase 1-2 (Setup & Payment Creation)
- **Day 2:** Phase 3-4 (Payment Processing & Status)
- **Day 3:** Phase 5-6 (Webhooks & Wallets)
- **Day 4:** Phase 7-8 (Refunds & Security)
- **Day 5:** Phase 9-10 (Performance & Errors)
- **Day 6:** Phase 11-12 (Frontend & Edge Cases)
- **Day 7:** Phase 13-14 (Integration & Reports)
- **Day 8:** Phase 15-16 (E2E & UAT)
- **Day 9:** Phase 17 & Final Sign-off

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025  
**Testing Lead:** **\*\***\_\_\_**\*\***  
**Reviewed By:** **\*\***\_\_\_**\*\***
