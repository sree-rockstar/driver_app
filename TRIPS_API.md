# Trips API Documentation

## Overview

The Trips API allows drivers to manage their trip records for different work sites (e.g., Microsoft).

## Database Setup

### 1. Create Indexes

Run the following command to create necessary indexes for optimal performance:

```bash
cd backend
python create_trips_indexes.py
```

This will create:

- Index on `user_id` for faster user-specific queries
- Unique compound index on `user_id` and `trip_id` to prevent duplicates
- Index on `site` for filtering by work site
- Compound index on `user_id` and `date` for sorting trips by date
- Index on `created_at` for temporal queries

### 2. Collection Schema

**Collection Name:** `trips`

**Fields:**

- `_id`: ObjectId (auto-generated)
- `trip_id`: String (user-defined trip identifier, e.g., "MS001")
- `user_id`: String (reference to the driver's user ID)
- `site`: String (work site name, default: "Microsoft")
- `date`: String (trip date in YYYY-MM-DD format)
- `start_time`: String (24-hour format: "HH:MM", e.g., "09:00", "17:30")
- `expected_completion_time`: String (24-hour format: "HH:MM")
- `completion_time`: String (24-hour format: "HH:MM")
- `source_point`: String (starting location)
- `destination`: String (destination location)
- `total_kilometers`: Float (distance traveled)
- `created_at`: DateTime (auto-generated)
- `updated_at`: DateTime (auto-updated)

## API Endpoints

### Base URL

```
/api/v1/trips
```

### Authentication

All endpoints require Bearer token authentication.

Include in headers:

```
Authorization: Bearer <your_token>
```

---

### 1. Create Trip

**POST** `/api/v1/trips/`

Create a new trip record.

**Request Body:**

```json
{
  "trip_id": "MS001",
  "site": "Microsoft",
  "date": "2024-01-15",
  "start_time": "09:00",
  "expected_completion_time": "17:00",
  "completion_time": "16:30",
  "source_point": "Office A",
  "destination": "Office B",
  "total_kilometers": 45.5
}
```

**Response (201 Created):**

```json
{
  "message": "Trip created successfully",
  "trip_id": "MS001",
  "id": "65abc123..."
}
```

**Errors:**

- `400 Bad Request`: Trip ID already exists or validation error
- `401 Unauthorized`: Invalid or missing token

---

### 2. Get All Trips

**GET** `/api/v1/trips/`

Retrieve all trips for the authenticated driver.

**Query Parameters:**

- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100, max: 100)
- `site`: Filter by site name (optional, e.g., "Microsoft")

**Example:**

```
GET /api/v1/trips/?site=Microsoft&skip=0&limit=50
```

**Response (200 OK):**

```json
[
  {
    "_id": "65abc123...",
    "trip_id": "MS001",
    "user_id": "65xyz789...",
    "site": "Microsoft",
    "date": "2024-01-15",
    "start_time": "09:00",
    "expected_completion_time": "17:00",
    "completion_time": "16:30",
    "source_point": "Office A",
    "destination": "Office B",
    "total_kilometers": 45.5,
    "created_at": "2024-01-15T08:30:00Z",
    "updated_at": "2024-01-15T08:30:00Z"
  }
]
```

---

### 3. Get Single Trip

**GET** `/api/v1/trips/{trip_id}`

Retrieve a specific trip by its trip_id.

**Example:**

```
GET /api/v1/trips/MS001
```

**Response (200 OK):**

```json
{
  "_id": "65abc123...",
  "trip_id": "MS001",
  ...
}
```

**Errors:**

- `404 Not Found`: Trip with specified ID not found

---

### 4. Update Trip

**PUT** `/api/v1/trips/{trip_id}`

Update an existing trip. Only provided fields will be updated.

**Request Body (all fields optional):**

```json
{
  "completion_time": "16:45",
  "total_kilometers": 47.2
}
```

**Response (200 OK):**

```json
{
  "message": "Trip updated successfully",
  "trip_id": "MS001"
}
```

**Errors:**

- `404 Not Found`: Trip not found
- `400 Bad Request`: No fields to update

---

### 5. Delete Trip

**DELETE** `/api/v1/trips/{trip_id}`

Delete a trip record.

**Example:**

```
DELETE /api/v1/trips/MS001
```

**Response (200 OK):**

```json
{
  "message": "Trip deleted successfully",
  "trip_id": "MS001"
}
```

**Errors:**

- `404 Not Found`: Trip not found

---

### 6. Get Trip Statistics

**GET** `/api/v1/trips/stats/summary`

Get aggregated statistics for the driver's trips.

**Query Parameters:**

- `site`: Filter by site (optional)

**Example:**

```
GET /api/v1/trips/stats/summary?site=Microsoft
```

**Response (200 OK):**

```json
{
  "total_trips": 25,
  "total_kilometers": 1250.5,
  "average_kilometers": 50.02,
  "site": "Microsoft"
}
```

---

## Time Format

**Important:** The API stores all times in **24-hour format (HH:MM)** for universal compatibility.

- The frontend UI uses 12-hour format with AM/PM for user convenience
- Times are automatically converted to 24-hour format before sending to the API
- Examples of conversion:
  - `09:00 AM` → `09:00`
  - `12:30 PM` → `12:30`
  - `05:45 PM` → `17:45`
  - `12:15 AM` → `00:15`

## Frontend Integration

The frontend form in `MicrosoftTrips.tsx` automatically calls the Create Trip API endpoint when the user clicks "Save".

### Example Usage in Frontend:

```typescript
const response = await fetch("http://localhost:8000/api/v1/trips/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(tripData),
});
```

## Security

- All endpoints are protected by JWT authentication
- Each driver can only access their own trips
- Trip IDs must be unique per driver (enforced by database unique index)

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server errors

Error responses include a `detail` field with a descriptive message.
