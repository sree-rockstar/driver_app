# 💸 Payout API Endpoints Reference
## PhonePe Payout/Disbursement APIs

---

## Overview

This document provides API endpoint specifications for PhonePe Payout integration to send money to drivers' UPI IDs and bank accounts.

---

## Base Configuration

### Environments

**UAT (Testing):**
```
Base URL: https://api-preprod.phonepe.com/apis/merchant-payout
PhonePe Business Dashboard: https://business-uat.phonepe.com/
```

**Production:**
```
Base URL: https://api.phonepe.com/apis/merchant-payout  
PhonePe Business Dashboard: https://business.phonepe.com/
```

### Authentication

All endpoints require:
- **Merchant ID:** Your payout merchant ID
- **API Key:** Payout-specific API key
- **Salt Key:** For signature generation (different from Payment Gateway)
- **X-VERIFY Header:** Signature for request verification

---

## 1. Add Beneficiary

### Endpoint: POST /api/v1/payouts/beneficiaries/add

**Purpose:** Add a new beneficiary (UPI ID or bank account) for a driver

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "driver_id": "DRV_67890",
  "beneficiary_type": "UPI",
  "upi_id": "9876543210@paytm",
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "is_primary": true
}
```

**For Bank Account:**
```json
{
  "driver_id": "DRV_67890",
  "beneficiary_type": "BANK",
  "account_number": "1234567890",
  "ifsc_code": "SBIN0001234",
  "account_holder_name": "Rajesh Kumar",
  "phone": "9876543210",
  "is_primary": false
}
```

**Field Descriptions:**
- `driver_id`: Driver's unique identifier (required)
- `beneficiary_type`: UPI or BANK (required)
- `upi_id`: UPI ID (required if type=UPI)
- `account_number`: Bank account number (required if type=BANK)
- `ifsc_code`: Bank IFSC code (required if type=BANK)
- `name/account_holder_name`: Beneficiary name (required)
- `phone`: Mobile number (required)
- `is_primary`: Set as primary beneficiary (optional, default: false)

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "beneficiary_id": "BEN_1234567890",
    "driver_id": "DRV_67890",
    "beneficiary_type": "UPI",
    "upi_id": "9876543210@paytm",
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "status": "PENDING_VERIFICATION",
    "is_primary": true,
    "created_at": "2025-12-24T10:30:00Z"
  },
  "message": "Beneficiary added successfully. Verification in progress."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_UPI_FORMAT",
    "message": "Invalid UPI ID format",
    "details": "UPI ID must be in format: number@handle"
  }
}
```

**Error Codes:**
- `INVALID_UPI_FORMAT`: UPI ID format is incorrect
- `INVALID_IFSC`: IFSC code is invalid
- `DRIVER_NOT_FOUND`: Driver doesn't exist
- `BENEFICIARY_LIMIT_EXCEEDED`: Maximum 3 beneficiaries per driver
- `DUPLICATE_BENEFICIARY`: Beneficiary already exists

---

## 2. Verify Beneficiary

### Endpoint: POST /api/v1/payouts/beneficiaries/verify

**Purpose:** Verify beneficiary details with PhonePe

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "beneficiary_id": "BEN_1234567890"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "beneficiary_id": "BEN_1234567890",
    "verification_status": "VERIFIED",
    "verified_name": "Rajesh Kumar",
    "upi_id": "9876543210@paytm",
    "is_active": true,
    "verified_at": "2025-12-24T10:32:00Z",
    "verification_details": {
      "name_match": true,
      "account_active": true,
      "match_score": 100
    }
  },
  "message": "Beneficiary verified successfully"
}
```

**Verification Status Values:**
- `VERIFIED`: Successfully verified
- `FAILED`: Verification failed
- `PENDING`: Verification in progress
- `NEEDS_REVIEW`: Name mismatch, needs manual review

**Error Response (422 Unprocessable Entity):**
```json
{
  "success": false,
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Beneficiary verification failed",
    "details": "UPI ID not found or inactive"
  }
}
```

---

## 3. Get Beneficiaries

### Endpoint: GET /api/v1/payouts/beneficiaries/{driver_id}

**Purpose:** Get all beneficiaries for a driver

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `driver_id`: Driver's unique identifier

**Query Parameters:**
```
?status=VERIFIED      (Optional: Filter by status)
?is_active=true       (Optional: Filter active only)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "driver_id": "DRV_67890",
    "beneficiaries": [
      {
        "beneficiary_id": "BEN_1234567890",
        "beneficiary_type": "UPI",
        "upi_id": "9876543210@paytm",
        "name": "Rajesh Kumar",
        "status": "VERIFIED",
        "is_primary": true,
        "is_active": true,
        "total_payouts": 45,
        "last_used": "2025-12-23T14:30:00Z",
        "created_at": "2025-11-01T10:00:00Z"
      },
      {
        "beneficiary_id": "BEN_0987654321",
        "beneficiary_type": "BANK",
        "account_number": "****567890",
        "ifsc_code": "SBIN0001234",
        "name": "Rajesh Kumar",
        "status": "VERIFIED",
        "is_primary": false,
        "is_active": true,
        "total_payouts": 5,
        "created_at": "2025-11-15T10:00:00Z"
      }
    ],
    "total_count": 2
  }
}
```

---

## 4. Initiate Payout

### Endpoint: POST /api/v1/payouts/initiate

**Purpose:** Send money to a driver's beneficiary

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "driver_id": "DRV_67890",
  "beneficiary_id": "BEN_1234567890",
  "amount": 50000,
  "remarks": "Weekly earnings withdrawal",
  "initiated_by": "DRIVER"
}
```

**Field Descriptions:**
- `driver_id`: Driver's unique identifier (required)
- `beneficiary_id`: Beneficiary to send money to (required)
- `amount`: Amount in paise (₹500 = 50000 paise) (required)
- `remarks`: Purpose of payout (optional, max 100 chars)
- `initiated_by`: DRIVER/ADMIN/AUTO (required)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payout_id": "PAYOUT_1234567890",
    "merchant_transaction_id": "PAYOUT_DRV67890_1703433600_a7f3",
    "driver_id": "DRV_67890",
    "beneficiary_id": "BEN_1234567890",
    "amount": 50000,
    "upi_id": "9876543210@paytm",
    "status": "PENDING",
    "initiated_by": "DRIVER",
    "created_at": "2025-12-24T10:30:00Z",
    "expected_completion": "2025-12-24T10:35:00Z"
  },
  "message": "Payout initiated successfully. Money will be transferred shortly."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_WALLET_BALANCE",
    "message": "Driver has insufficient wallet balance",
    "details": {
      "available": 40000,
      "requested": 50000,
      "shortfall": 10000
    }
  }
}
```

**Error Codes:**
- `INSUFFICIENT_WALLET_BALANCE`: Not enough balance in wallet
- `BENEFICIARY_NOT_VERIFIED`: Beneficiary not verified
- `DAILY_LIMIT_EXCEEDED`: Driver exceeded daily limit
- `MONTHLY_LIMIT_EXCEEDED`: Driver exceeded monthly limit
- `AMOUNT_BELOW_MINIMUM`: Amount below minimum (₹100)
- `INSUFFICIENT_PAYOUT_BALANCE`: Not enough in payout account
- `DRIVER_BLOCKED`: Driver is blocked from withdrawals

---

## 5. Check Payout Status

### Endpoint: GET /api/v1/payouts/status/{payout_id}

**Purpose:** Check status of a payout transaction

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `payout_id`: Payout transaction identifier

**Query Parameters:**
```
?refresh=true  (Optional: Force check with PhonePe)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payout_id": "PAYOUT_1234567890",
    "merchant_transaction_id": "PAYOUT_DRV67890_1703433600_a7f3",
    "phonepe_transaction_id": "PPE_PAYOUT_9876543210",
    "driver_id": "DRV_67890",
    "beneficiary_id": "BEN_1234567890",
    "amount": 50000,
    "upi_id": "9876543210@paytm",
    "status": "SUCCESS",
    "utr_number": "123456789012",
    "initiated_at": "2025-12-24T10:30:00Z",
    "completed_at": "2025-12-24T10:31:45Z",
    "processing_time_seconds": 105
  },
  "message": "Payout completed successfully"
}
```

**Payout Status Values:**
- `PENDING`: Payout initiated, processing
- `PROCESSING`: Being processed by PhonePe
- `SUCCESS`: Money transferred successfully
- `FAILED`: Payout failed
- `REVERSED`: Money reversed to source
- `CANCELLED`: Payout cancelled

**If Failed:**
```json
{
  "success": true,
  "data": {
    "payout_id": "PAYOUT_1234567890",
    "status": "FAILED",
    "failure_reason": "INVALID_VPA",
    "failure_message": "Beneficiary UPI ID not found",
    "refund_status": "REFUNDED",
    "amount": 50000,
    "refunded_at": "2025-12-24T10:32:00Z"
  }
}
```

**Failure Reasons:**
- `INVALID_VPA`: UPI ID not found or invalid
- `BENEFICIARY_BANK_DOWN`: Recipient bank unavailable
- `TRANSACTION_DECLINED`: Beneficiary bank declined
- `ACCOUNT_BLOCKED`: Beneficiary account blocked
- `LIMIT_EXCEEDED`: Transaction limit exceeded
- `TECHNICAL_ERROR`: System error

---

## 6. Payout Webhook

### Endpoint: POST /api/v1/payouts/webhook

**Purpose:** Receive payout status updates from PhonePe

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
  "code": "PAYOUT_SUCCESS",
  "message": "Payout completed successfully",
  "data": {
    "merchantId": "PAYOUT_MERCHANT_ID",
    "merchantTransactionId": "PAYOUT_DRV67890_1703433600_a7f3",
    "transactionId": "PPE_PAYOUT_9876543210",
    "amount": 50000,
    "state": "COMPLETED",
    "responseCode": "SUCCESS",
    "paymentInstrument": {
      "type": "UPI",
      "vpa": "9876543210@paytm",
      "utr": "123456789012"
    }
  }
}
```

**Response to PhonePe (200 OK):**
```json
{
  "success": true,
  "message": "Webhook received and processed"
}
```

**Webhook States:**
- `COMPLETED`: Payout successful
- `FAILED`: Payout failed
- `REVERSED`: Money reversed

---

## 7. Get Payout Account Balance

### Endpoint: GET /api/v1/payouts/balance

**Purpose:** Check available balance in payout account

**Request Headers:**
```
Authorization: Bearer {admin_jwt_token}
```

**Note:** Admin only endpoint

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "account_id": "PAYOUT_ACC_123",
    "current_balance": 50000000,
    "available_balance": 48500000,
    "reserved_balance": 1500000,
    "currency": "INR",
    "last_updated": "2025-12-24T10:30:00Z",
    "low_balance_threshold": 1000000,
    "alert_status": "NORMAL",
    "auto_reload": {
      "enabled": true,
      "threshold": 1000000,
      "reload_amount": 5000000
    }
  }
}
```

**Balance Breakdown:**
- `current_balance`: Total balance in account
- `available_balance`: Available for payouts
- `reserved_balance`: Reserved for pending payouts

**Alert Status:**
- `NORMAL`: Balance above threshold
- `LOW`: Balance approaching threshold
- `CRITICAL`: Balance very low
- `DEPLETED`: No balance remaining

---

## 8. Load Balance

### Endpoint: POST /api/v1/payouts/balance/load

**Purpose:** Add money to payout account (redirect to PhonePe)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {admin_jwt_token}
```

**Request Body:**
```json
{
  "amount": 10000000,
  "payment_method": "NET_BANKING"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "load_transaction_id": "LOAD_1234567890",
    "amount": 10000000,
    "payment_url": "https://business.phonepe.com/load/xxx",
    "status": "PENDING",
    "expires_at": "2025-12-24T10:45:00Z"
  },
  "message": "Please complete payment to load balance"
}
```

**After successful payment, webhook will update balance.**

---

## 9. Driver Payout History

### Endpoint: GET /api/v1/payouts/driver/{driver_id}/history

**Purpose:** Get all payouts for a specific driver

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `driver_id`: Driver's unique identifier

**Query Parameters:**
```
?status=SUCCESS           (Optional: Filter by status)
?from_date=2025-12-01    (Optional: Start date)
?to_date=2025-12-31      (Optional: End date)
?limit=50                (Optional: Results per page, default: 50)
?offset=0                (Optional: Pagination offset)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "driver_id": "DRV_67890",
    "payouts": [
      {
        "payout_id": "PAYOUT_1234567890",
        "amount": 50000,
        "upi_id": "9876543210@paytm",
        "status": "SUCCESS",
        "utr_number": "123456789012",
        "initiated_at": "2025-12-24T10:30:00Z",
        "completed_at": "2025-12-24T10:31:45Z"
      },
      {
        "payout_id": "PAYOUT_0987654321",
        "amount": 30000,
        "upi_id": "9876543210@paytm",
        "status": "SUCCESS",
        "utr_number": "098765432109",
        "initiated_at": "2025-12-20T15:20:00Z",
        "completed_at": "2025-12-20T15:21:30Z"
      }
    ],
    "summary": {
      "total_payouts": 45,
      "total_amount": 2250000,
      "successful": 43,
      "failed": 2,
      "success_rate": 95.56
    },
    "pagination": {
      "total": 45,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}
```

---

## 10. Retry Failed Payout

### Endpoint: POST /api/v1/payouts/retry

**Purpose:** Retry a failed payout transaction

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "payout_id": "PAYOUT_1234567890",
  "beneficiary_id": "BEN_1234567890"
}
```

**Field Descriptions:**
- `payout_id`: Original failed payout ID (required)
- `beneficiary_id`: Optional, use different beneficiary

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "new_payout_id": "PAYOUT_9999999999",
    "original_payout_id": "PAYOUT_1234567890",
    "amount": 50000,
    "status": "PENDING",
    "beneficiary_id": "BEN_1234567890"
  },
  "message": "Payout retry initiated successfully"
}
```

**Error Codes:**
- `PAYOUT_NOT_FAILED`: Can only retry failed payouts
- `RETRY_LIMIT_EXCEEDED`: Maximum 3 retries allowed
- `AMOUNT_ALREADY_REFUNDED`: Amount refunded, cannot retry

---

## 11. Cancel Pending Payout

### Endpoint: POST /api/v1/payouts/cancel

**Purpose:** Cancel a pending payout (before processing)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "payout_id": "PAYOUT_1234567890",
  "reason": "Driver request",
  "cancelled_by": "DRIVER"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payout_id": "PAYOUT_1234567890",
    "status": "CANCELLED",
    "amount": 50000,
    "refund_status": "REFUNDED",
    "cancelled_at": "2025-12-24T10:35:00Z"
  },
  "message": "Payout cancelled. Amount refunded to wallet."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL",
    "message": "Payout already processed, cannot cancel",
    "details": "Status: SUCCESS"
  }
}
```

**Can Cancel:**
- Status: PENDING
- Status: FAILED (no need to cancel, already refunded)

**Cannot Cancel:**
- Status: SUCCESS (already completed)
- Status: PROCESSING (being processed)

---

## 12. Payout Analytics

### Endpoint: GET /api/v1/payouts/analytics

**Purpose:** Get payout statistics and analytics

**Request Headers:**
```
Authorization: Bearer {admin_jwt_token}
```

**Query Parameters:**
```
?period=daily              (Required: daily/weekly/monthly)
?from_date=2025-12-01     (Required: Start date)
?to_date=2025-12-31       (Required: End date)
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
      "total_payouts": 450,
      "successful_payouts": 432,
      "failed_payouts": 18,
      "success_rate": 96.0,
      "total_amount": 22500000,
      "average_payout_amount": 50000,
      "average_processing_time_seconds": 120,
      "unique_drivers": 150,
      "total_fees": 45000
    },
    "by_status": {
      "SUCCESS": {
        "count": 432,
        "percentage": 96.0,
        "amount": 21600000
      },
      "FAILED": {
        "count": 18,
        "percentage": 4.0,
        "amount": 900000
      }
    },
    "top_failure_reasons": [
      {
        "reason": "INVALID_VPA",
        "count": 10,
        "percentage": 55.56
      },
      {
        "reason": "BENEFICIARY_BANK_DOWN",
        "count": 5,
        "percentage": 27.78
      }
    ],
    "daily_breakdown": [
      {
        "date": "2025-12-24",
        "payouts": 15,
        "amount": 750000,
        "success_rate": 100.0
      }
    ]
  }
}
```

---

## Error Response Structure

All endpoints follow consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error context",
    "timestamp": "2025-12-24T10:30:00Z",
    "request_id": "REQ_1234567890"
  }
}
```

### Common HTTP Status Codes

- **200 OK:** Request successful
- **201 Created:** Resource created
- **400 Bad Request:** Invalid parameters
- **401 Unauthorized:** Authentication failed
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Duplicate request
- **422 Unprocessable Entity:** Validation failed
- **429 Too Many Requests:** Rate limited
- **500 Internal Server Error:** Server error
- **503 Service Unavailable:** PhonePe service down

---

## Rate Limiting

**Payout Endpoints:**
- **Initiate Payout:** 50 requests per minute
- **Status Check:** 200 requests per minute
- **Webhook:** 1000 requests per minute
- **Analytics:** 10 requests per minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1703433660
```

---

## Testing Credentials

### UAT Test Beneficiaries

**Test UPI IDs:**
- Success: `success@test`
- Failure: `failure@test`
- Pending: `pending@test`
- Invalid: `invalid@test`

**Test Amounts:**
- ₹10 (1000 paise): Success
- ₹100 (10000 paise): Success
- ₹1 (100 paise): Failure (below minimum)
- ₹1,00,000 (10000000 paise): Test large amount

---

## PhonePe SDK Methods

### Python SDK

**Initialize Client:**
```python
from phonepe_payout import PayoutClient

client = PayoutClient(
    merchant_id="PAYOUT_MERCHANT_ID",
    api_key="PAYOUT_API_KEY",
    salt_key="PAYOUT_SALT_KEY",
    salt_index=1,
    environment='UAT'
)
```

**Add Beneficiary:**
```python
beneficiary = client.add_beneficiary(
    vpa="9876543210@paytm",
    name="Rajesh Kumar"
)
```

**Verify Beneficiary:**
```python
verification = client.verify_beneficiary(
    beneficiary_id="BEN_123"
)
```

**Initiate Payout:**
```python
payout = client.initiate_payout(
    merchant_transaction_id="PAYOUT_DRV123_xxx",
    amount=50000,
    vpa="9876543210@paytm"
)
```

**Check Status:**
```python
status = client.check_payout_status(
    merchant_transaction_id="PAYOUT_DRV123_xxx"
)
```

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025


