# 📡 Payment API Endpoints Reference

## Quick Reference Guide for PhonePe Integration

---

## Overview

This document provides a quick reference for all payment-related API endpoints that need to be implemented in the Driver App backend.

---

## Base Configuration

### Environments

**UAT (Testing):**

```
Base URL: https://api-preprod.phonepe.com/apis/pg-sandbox
PhonePe Dashboard: https://mercury-uat.phonepe.com/
```

**Production:**

```
Base URL: https://api.phonepe.com/apis/hermes
PhonePe Dashboard: https://business.phonepe.com/
```

### Authentication

All endpoints require:

- **API Key:** Included in SDK initialization
- **Salt Key:** For signature generation
- **Merchant ID:** Your unique identifier

---

## 1. Payment Initiation

### Endpoint: POST /api/v1/payments/initiate

**Purpose:** Create a new payment order and get PhonePe payment URL

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**

```json
{
  "trip_id": "TRIP_12345",
  "customer_id": "CUST_67890",
  "amount": 25000,
  "currency": "INR",
  "customer_mobile": "9876543210",
  "redirect_url": "https://yourapp.com/payment/callback",
  "callback_url": "https://yourapp.com/api/v1/payments/webhook"
}
```

**Field Descriptions:**

- `trip_id`: Unique trip identifier (required)
- `customer_id`: Customer identifier (required)
- `amount`: Amount in paise (₹250 = 25000) (required)
- `currency`: Currency code (default: INR) (optional)
- `customer_mobile`: Customer's mobile number (required)
- `redirect_url`: Where to redirect after payment (required)
- `callback_url`: Webhook URL for status updates (required)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "transaction_id": "TXN_1234567890",
    "merchant_transaction_id": "TRIP_12345_1703433600",
    "payment_url": "https://mercury.phonepe.com/transact/pg?token=xxx",
    "amount": 25000,
    "currency": "INR",
    "status": "PENDING",
    "created_at": "2025-12-24T10:30:00Z",
    "expires_at": "2025-12-24T10:45:00Z"
  },
  "message": "Payment initiated successfully"
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be greater than zero",
    "details": "Received amount: -100"
  }
}
```

**Error Codes:**

- `INVALID_AMOUNT`: Amount validation failed
- `INVALID_CUSTOMER`: Customer not found
- `TRIP_NOT_FOUND`: Trip doesn't exist
- `TRIP_ALREADY_PAID`: Payment already completed for this trip
- `PHONEPE_API_ERROR`: PhonePe service error

---

## 2. Payment Status Check

### Endpoint: GET /api/v1/payments/status/{transaction_id}

**Purpose:** Check current status of a payment

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**

- `transaction_id`: The transaction ID returned during initiation

**Query Parameters:**

```
?refresh=true  (Optional: Force check with PhonePe, default: false)
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "transaction_id": "TXN_1234567890",
    "merchant_transaction_id": "TRIP_12345_1703433600",
    "trip_id": "TRIP_12345",
    "status": "SUCCESS",
    "amount": 25000,
    "currency": "INR",
    "payment_method": "UPI",
    "payment_method_details": {
      "type": "UPI",
      "upi_id": "customer@paytm"
    },
    "phonepe_transaction_id": "PPE_1234567890",
    "created_at": "2025-12-24T10:30:00Z",
    "completed_at": "2025-12-24T10:32:45Z"
  },
  "message": "Payment successful"
}
```

**Payment Statuses:**

- `PENDING`: Payment initiated but not completed
- `SUCCESS`: Payment completed successfully
- `FAILED`: Payment failed
- `CANCELLED`: Payment cancelled by user
- `EXPIRED`: Payment link expired

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction does not exist"
  }
}
```

---

## 3. Webhook Handler

### Endpoint: POST /api/v1/payments/webhook

**Purpose:** Receive payment status updates from PhonePe

**Request Headers:**

```
Content-Type: application/json
X-VERIFY: {signature}
```

**Request Body:**

```json
{
  "response": "base64_encoded_encrypted_response"
}
```

**Decrypted Response Structure:**

```json
{
  "success": true,
  "code": "PAYMENT_SUCCESS",
  "message": "Your payment is successful.",
  "data": {
    "merchantId": "MERCHANTUAT",
    "merchantTransactionId": "TRIP_12345_1703433600",
    "transactionId": "PPE_1234567890",
    "amount": 25000,
    "state": "COMPLETED",
    "responseCode": "SUCCESS",
    "paymentInstrument": {
      "type": "UPI",
      "utr": "123456789012"
    }
  }
}
```

**Response to PhonePe (200 OK):**

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Important Notes:**

- MUST verify signature before processing
- MUST respond within 5 seconds
- Handle duplicate webhooks (idempotency)
- Log all webhook attempts
- Process asynchronously if heavy operations needed

**Webhook States:**

- `COMPLETED`: Payment successful
- `FAILED`: Payment failed
- `PENDING`: Payment still processing

---

## 4. Refund Initiation

### Endpoint: POST /api/v1/payments/refund

**Purpose:** Initiate a refund for a completed payment

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**

```json
{
  "transaction_id": "TXN_1234567890",
  "refund_amount": 25000,
  "reason": "TRIP_CANCELLED",
  "description": "Customer cancelled the trip",
  "initiated_by": "ADMIN_001"
}
```

**Field Descriptions:**

- `transaction_id`: Original payment transaction ID (required)
- `refund_amount`: Amount to refund in paise (required)
- `reason`: Refund reason code (required)
- `description`: Detailed description (optional)
- `initiated_by`: User who initiated refund (required)

**Refund Reason Codes:**

- `TRIP_CANCELLED`: Trip was cancelled
- `SERVICE_ISSUE`: Service quality issue
- `OVERCHARGE`: Incorrect amount charged
- `DUPLICATE_PAYMENT`: Payment made twice
- `OTHER`: Other reasons

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "refund_id": "RFD_1234567890",
    "transaction_id": "TXN_1234567890",
    "refund_amount": 25000,
    "status": "PENDING",
    "phonepe_refund_id": "PPE_RFD_1234567890",
    "initiated_at": "2025-12-24T11:00:00Z",
    "estimated_completion": "2025-12-31T23:59:59Z"
  },
  "message": "Refund initiated successfully"
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "REFUND_NOT_ALLOWED",
    "message": "Refund amount exceeds paid amount",
    "details": "Paid: ₹250, Requested: ₹300"
  }
}
```

**Error Codes:**

- `PAYMENT_NOT_FOUND`: Original payment doesn't exist
- `PAYMENT_NOT_SUCCESS`: Can only refund successful payments
- `REFUND_AMOUNT_INVALID`: Invalid refund amount
- `ALREADY_REFUNDED`: Payment already fully refunded
- `REFUND_WINDOW_EXPIRED`: Beyond refund period

---

## 5. Refund Status Check

### Endpoint: GET /api/v1/payments/refund/{refund_id}

**Purpose:** Check status of a refund request

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "refund_id": "RFD_1234567890",
    "transaction_id": "TXN_1234567890",
    "refund_amount": 25000,
    "status": "SUCCESS",
    "phonepe_refund_id": "PPE_RFD_1234567890",
    "initiated_at": "2025-12-24T11:00:00Z",
    "completed_at": "2025-12-27T14:30:00Z",
    "refund_method": "SOURCE_ACCOUNT",
    "reason": "TRIP_CANCELLED"
  },
  "message": "Refund completed successfully"
}
```

**Refund Statuses:**

- `INITIATED`: Refund request created
- `PENDING`: Submitted to PhonePe
- `PROCESSING`: PhonePe processing refund
- `SUCCESS`: Refund completed
- `FAILED`: Refund failed

---

## 6. Wallet Balance

### Endpoint: GET /api/v1/wallets/{driver_id}

**Purpose:** Get driver's wallet balance and transaction history

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**

- `driver_id`: Driver's unique identifier

**Query Parameters:**

```
?include_transactions=true  (Optional: Include transaction history)
?limit=50                   (Optional: Limit transactions, default: 50)
?offset=0                   (Optional: Pagination offset)
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "driver_id": "DRV_67890",
    "wallet": {
      "current_balance": 150000,
      "total_earned": 500000,
      "total_withdrawn": 300000,
      "total_commission": 50000,
      "currency": "INR",
      "last_updated": "2025-12-24T10:30:00Z"
    },
    "transactions": [
      {
        "transaction_id": "TXN_9876543210",
        "type": "CREDIT",
        "amount": 25000,
        "description": "Trip payment - TRIP_12345",
        "balance_after": 150000,
        "timestamp": "2025-12-24T10:30:00Z"
      },
      {
        "transaction_id": "TXN_9876543211",
        "type": "DEBIT",
        "amount": 2500,
        "description": "Platform commission (10%)",
        "balance_after": 125000,
        "timestamp": "2025-12-24T10:30:05Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "has_more": true
    }
  }
}
```

**Transaction Types:**

- `CREDIT`: Money added to wallet
- `DEBIT`: Money deducted from wallet
- `COMMISSION`: Platform commission
- `WITHDRAWAL`: Driver withdrawal
- `REFUND`: Refund deduction

---

## 7. Transaction History

### Endpoint: GET /api/v1/payments/transactions

**Purpose:** Get payment transaction history with filters

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**

```
?trip_id=TRIP_12345           (Optional: Filter by trip)
?customer_id=CUST_67890       (Optional: Filter by customer)
?driver_id=DRV_67890          (Optional: Filter by driver)
?status=SUCCESS               (Optional: Filter by status)
?from_date=2025-12-01         (Optional: Start date)
?to_date=2025-12-31           (Optional: End date)
?limit=50                     (Optional: Results per page)
?offset=0                     (Optional: Pagination offset)
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transaction_id": "TXN_1234567890",
        "trip_id": "TRIP_12345",
        "customer_id": "CUST_67890",
        "driver_id": "DRV_67890",
        "amount": 25000,
        "status": "SUCCESS",
        "payment_method": "UPI",
        "created_at": "2025-12-24T10:30:00Z",
        "completed_at": "2025-12-24T10:32:45Z"
      }
    ],
    "summary": {
      "total_transactions": 150,
      "total_amount": 3750000,
      "success_count": 145,
      "failed_count": 5,
      "success_rate": 96.67
    },
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "has_more": true
    }
  }
}
```

---

## 8. Payment Analytics

### Endpoint: GET /api/v1/payments/analytics

**Purpose:** Get payment statistics and analytics

**Request Headers:**

```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**

```
?period=daily               (Required: daily/weekly/monthly)
?from_date=2025-12-01      (Required: Start date)
?to_date=2025-12-31        (Required: End date)
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "period": "daily",
    "from_date": "2025-12-01",
    "to_date": "2025-12-31",
    "metrics": {
      "total_transactions": 1500,
      "successful_transactions": 1450,
      "failed_transactions": 50,
      "success_rate": 96.67,
      "total_volume": 37500000,
      "average_transaction_value": 25000,
      "total_refunds": 25,
      "refund_amount": 625000,
      "refund_rate": 1.67
    },
    "by_payment_method": {
      "UPI": {
        "count": 1000,
        "percentage": 66.67,
        "amount": 25000000
      },
      "CARD": {
        "count": 400,
        "percentage": 26.67,
        "amount": 10000000
      },
      "WALLET": {
        "count": 100,
        "percentage": 6.67,
        "amount": 2500000
      }
    },
    "daily_breakdown": [
      {
        "date": "2025-12-24",
        "transactions": 50,
        "amount": 1250000,
        "success_rate": 98.0
      }
    ]
  }
}
```

---

## Error Response Structure

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)",
    "timestamp": "2025-12-24T10:30:00Z",
    "request_id": "REQ_1234567890"
  }
}
```

### Common HTTP Status Codes

- **200 OK:** Request successful
- **201 Created:** Resource created successfully
- **400 Bad Request:** Invalid request parameters
- **401 Unauthorized:** Authentication failed
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Resource conflict (e.g., duplicate)
- **422 Unprocessable Entity:** Validation failed
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server error
- **503 Service Unavailable:** Service temporarily unavailable

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

**Limits:**

- **Payment Initiation:** 100 requests per minute per user
- **Status Check:** 200 requests per minute per user
- **Webhook:** 1000 requests per minute (aggregate)
- **Analytics:** 10 requests per minute per user

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703433660
```

**Rate Limit Exceeded Response (429):**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retry_after": 60
  }
}
```

---

## Testing Endpoints

### UAT Test Cards

**Test UPI IDs:**

- Success: `success@ybl`
- Failed: `failure@ybl`
- Pending: `pending@ybl`

**Test Card Numbers:**

- Success: `4111 1111 1111 1111`
- Insufficient Balance: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

**Test CVV:** Any 3 digits  
**Test Expiry:** Any future date  
**Test OTP:** `123456`

---

## Postman Collection

Import this collection to test all endpoints:

**Collection URL:** _To be created after backend implementation_

---

## SDK Methods Reference

### Python SDK Methods

**Initialize Client:**

```
PhonePePaymentClient(
    merchant_id,
    salt_key,
    salt_index,
    environment='UAT'
)
```

**Create Payment:**

```
client.create_payment(
    amount,
    merchant_transaction_id,
    redirect_url,
    callback_url,
    mobile_number
)
```

**Check Status:**

```
client.check_payment_status(
    merchant_transaction_id
)
```

**Initiate Refund:**

```
client.initiate_refund(
    merchant_transaction_id,
    amount,
    transaction_id
)
```

**Verify Webhook:**

```
client.verify_webhook_signature(
    payload,
    signature
)
```

---

## Support & Resources

**Documentation:**

- PhonePe API Docs: https://developer.phonepe.com
- Python SDK Docs: https://developer.phonepe.com/payment-gateway/backend-sdk/python-be-sdk

**Support:**

- Technical: tech-support@phonepe.com
- Merchant: merchant-support@phonepe.com

**Status Page:**

- PhonePe Status: https://status.phonepe.com

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025
