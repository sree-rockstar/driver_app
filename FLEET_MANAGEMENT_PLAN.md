# Fleet Management System - Implementation Plan

## 📋 Overview

This document outlines the plan to add comprehensive fleet (vehicle) management capabilities to the PR TRAVELS Driver Management System, allowing admins to manage their fleet of cars as separate entities from drivers.

---

## 🎯 Current System Analysis

### What Exists Today

- **Drivers**: Managed with user accounts, documents, and status
- **Trips**: Assigned to drivers with vehicle info embedded
- **Vehicle Info**: Currently embedded in driver model (`vehicle_type`, `vehicle_number`)
- **Roles**: Admin has permissions to manage drivers and trips

### Problems with Current Approach

1. ❌ Vehicles are tied to drivers (1:1 relationship)
2. ❌ Cannot track vehicle maintenance history
3. ❌ Cannot assign different vehicles to same driver
4. ❌ No vehicle availability tracking
5. ❌ Cannot track vehicle-specific metrics (fuel, mileage, etc.)
6. ❌ No vehicle documentation (insurance, RC, etc.)
7. ❌ Cannot manage spare/pool vehicles

---

## 🚗 Proposed Solution: Separate Fleet Management

### Core Concept

**Vehicles become independent entities** that can be:

- Assigned to drivers (many-to-many relationship)
- Tracked independently with their own lifecycle
- Managed with their own documents and status
- Analyzed for utilization and maintenance

---

## 📊 Database Schema Design

### 1. New Collection: `vehicles`

```javascript
{
  _id: ObjectId,
  vehicle_id: "CAR001",                    // Unique identifier

  // Basic Information
  registration_number: "KA01AB1234",       // License plate
  make: "Toyota",                          // Manufacturer
  model: "Innova Crysta",                  // Model name
  year: 2022,                              // Manufacturing year
  color: "White",

  // Classification
  vehicle_type: "SUV",                     // SUV, Sedan, Hatchback, etc.
  seating_capacity: 7,
  fuel_type: "Electric",                   // Petrol, Diesel, Electric, CNG, Hybrid
  is_electric: true,                       // Boolean flag for EV features

  // Electric Vehicle Specific (only if is_electric = true)
  ev_details: {
    battery_capacity: 60,                  // kWh (e.g., 60 kWh battery)
    current_battery_level: 85,             // Percentage (0-100)
    estimated_range: 340,                  // km on full charge
    current_range: 289,                    // km remaining with current charge
    charging_type: "AC+DC",                // AC, DC, or AC+DC (fast charging)
    max_charging_speed: 50,                // kW (DC fast charging speed)
    last_charged_at: ISODate("2024-12-23T08:30:00Z"),
    charging_status: "not_charging",       // charging, not_charging, fully_charged
    battery_health: 98,                    // Percentage (100% = new battery)
    charging_cycles: 245,                  // Number of full charge cycles
    home_charging_available: true          // If vehicle has home charging setup
  },

  // Status
  status: "available",                     // available, in_use, maintenance, inactive, charging
  condition: "excellent",                  // excellent, good, fair, needs_repair

  // Current Assignment
  current_driver_id: "user_id_123" | null,
  current_trip_id: "trip_id_456" | null,

  // Metrics
  odometer_reading: 45000,                 // Current km reading
  last_service_km: 43000,
  next_service_km: 48000,

  // Documents (File IDs) - REQUIRED UPLOADS
  documents: {
    registration_certificate: "file_id_1",    // RC Book (MANDATORY)
    insurance: "file_id_2",                   // Insurance Policy (MANDATORY)
    pollution_certificate: "file_id_3",
    fitness_certificate: "file_id_4",
    permit: "file_id_5",                      // Commercial permit if applicable
    road_tax_receipt: "file_id_6"
  },

  // Vehicle Photos (Multiple allowed) - REQUIRED
  photos: {
    front_view: "file_id_10",                 // Front view (MANDATORY)
    back_view: "file_id_11",                  // Back view (MANDATORY)
    left_side: "file_id_12",                  // Left side view
    right_side: "file_id_13",                 // Right side view
    interior: "file_id_14",                   // Interior/Dashboard
    rc_photo: "file_id_15",                   // Physical RC book photo
    insurance_sticker: "file_id_16"           // Insurance sticker on windshield
  },

  // Document Expiry Dates (Auto-alerts before expiry)
  registration_expiry: ISODate("2027-01-15"), // RC validity
  insurance_expiry: ISODate("2024-12-31"),     // Insurance renewal date (CRITICAL)
  pollution_expiry: ISODate("2024-06-30"),
  fitness_expiry: ISODate("2025-12-31"),
  permit_expiry: ISODate("2025-12-31") | null,

  // Ownership
  ownership_type: "owned",                 // owned, leased, rental
  acquisition_date: ISODate("2022-01-15"),
  purchase_price: 2500000,

  // Timestamps
  created_at: ISODate,
  updated_at: ISODate,
  created_by: "admin_user_id"
}
```

### 2. New Collection: `vehicle_assignments`

```javascript
{
  _id: ObjectId,
  vehicle_id: "CAR001",
  driver_id: "user_id_123",

  // Assignment Details
  assigned_at: ISODate("2024-01-01T09:00:00Z"),
  assigned_until: ISODate("2024-01-31T18:00:00Z") | null,  // null = indefinite
  assignment_type: "permanent",            // permanent, temporary, trip_specific

  // Trip Association (if trip-specific)
  trip_id: "MS001" | null,

  // Condition at Assignment
  odometer_at_assignment: 45000,
  condition_at_assignment: "excellent",

  // Return Information
  returned_at: ISODate | null,
  odometer_at_return: 45150 | null,
  condition_at_return: "good" | null,
  return_notes: "Minor scratch on rear bumper",

  // Status
  status: "active",                        // active, completed, cancelled

  // Timestamps
  created_at: ISODate,
  updated_at: ISODate
}
```

### 3. New Collection: `vehicle_maintenance`

```javascript
{
  _id: ObjectId,
  vehicle_id: "CAR001",

  // Maintenance Details
  maintenance_type: "routine_service",     // routine_service, repair, inspection, cleaning
  description: "Regular 5000 km service",

  // Scheduling
  scheduled_date: ISODate("2024-01-15"),
  actual_date: ISODate("2024-01-15"),

  // Status
  status: "completed",                     // scheduled, in_progress, completed, cancelled

  // Details
  service_provider: "Toyota Service Center",
  cost: 5000,
  odometer_reading: 45000,

  // Parts & Work
  parts_replaced: ["Engine Oil", "Oil Filter", "Air Filter"],
  work_done: "Oil change, filter replacement, general inspection",

  // Next Service
  next_service_km: 50000,
  next_service_date: ISODate("2024-04-15"),

  // Documents
  invoice_file_id: "file_id_5",

  // Downtime
  vehicle_unavailable_from: ISODate,
  vehicle_unavailable_until: ISODate,

  // Timestamps
  created_at: ISODate,
  created_by: "admin_user_id",
  updated_at: ISODate
}
```

### 4. New Collection: `vehicle_expenses`

```javascript
{
  _id: ObjectId,
  vehicle_id: "CAR001",

  // Expense Details
  expense_type: "fuel",                    // fuel, charging, maintenance, insurance, tax, fine, other
  amount: 5000,
  date: ISODate("2024-01-15"),

  // Context
  description: "Full tank diesel",
  odometer_reading: 45000,

  // Fuel Specific (if expense_type = fuel)
  fuel_quantity: 50,                       // liters
  fuel_price_per_liter: 100,

  // Charging Specific (if expense_type = charging)
  charging_session_id: "charge_session_123",  // Link to charging session
  kw_consumed: 42,                         // kWh consumed (from charging session)
  start_soc: 15,                          // % State of Charge at start
  end_soc: 85,                            // % State of Charge at end
  charging_station_name: "Tata Power MG Road",
  cost_per_kwh: 8,                        // ₹ per kWh (calculated)

  // Association
  driver_id: "user_id_123" | null,
  trip_id: "MS001" | null,

  // Payment
  payment_method: "cash",                  // cash, card, upi, credit
  receipt_file_id: "file_id_6",

  // Timestamps
  created_at: ISODate,
  created_by: "user_id_123",
  updated_at: ISODate
}
```

### 5. New Collection: `charging_sessions` (For Electric Vehicles)

```javascript
{
  _id: ObjectId,
  session_id: "CHG001",                    // Unique charging session ID
  vehicle_id: "CAR001",

  // ===== REQUIRED FIELDS (User Input) =====

  // Battery State (SOC = State of Charge)
  start_soc: 15,                           // % when charging started (USER ENTERS)
  end_soc: 85,                             // % when charging ended (USER ENTERS)
  soc_charged: 70,                         // % charged (auto-calculated: end - start)

  // Energy & Cost
  kw_consumed: 42,                         // kWh consumed (USER ENTERS)
  amount: 336,                             // ₹ Total cost (USER ENTERS)
  cost_per_kwh: 8,                         // ₹/kWh (auto-calculated: amount / kw_consumed)

  // Charging Station
  charging_station_name: "Tata Power Charging Station, MG Road",  // (USER ENTERS)

  // ===== AUTO-CAPTURED FIELDS =====

  // Session Timing
  started_at: ISODate("2024-12-23T08:00:00Z"),  // Auto-captured when session starts
  ended_at: ISODate("2024-12-23T09:15:00Z"),    // Auto-captured when session ends
  duration_minutes: 75,                    // Calculated (end - start)

  // Additional Details (Optional)
  charging_type: "DC_Fast",                // AC_Slow, AC_Fast, DC_Fast, Home (optional)
  payment_method: "upi",                   // cash, card, upi (optional)
  receipt_file_id: "file_id_20",          // Uploaded receipt (optional)
  odometer_reading: 45000,                 // Current km reading (optional)

  // Context
  driver_id: "user_id_123",                // Who logged this session
  trip_id: "MS001" | null,                 // If charging during a trip

  // Status
  status: "completed",                     // in_progress, completed

  // Timestamps
  created_at: ISODate,
  updated_at: ISODate,
  created_by: "user_id_123"
}
```

**Field Summary - What User Must Enter:**

1. ✅ **Start SOC** (State of Charge %) - e.g., 15%
2. ✅ **End SOC** (State of Charge %) - e.g., 85%
3. ✅ **kW Consumed** - e.g., 42 kWh
4. ✅ **Amount** - e.g., ₹336
5. ✅ **Charging Station Name** - e.g., "Tata Power MG Road"

### 6. New Collection: `battery_health_logs` (For Electric Vehicles)

```javascript
{
  _id: ObjectId,
  vehicle_id: "CAR001",

  // Health Metrics
  battery_health_percentage: 98,           // % (100% = new battery)
  total_charging_cycles: 245,              // Full charge cycles completed
  actual_capacity: 58.8,                   // kWh (vs original 60 kWh)
  degradation_rate: 2,                     // % degradation from new

  // Performance
  max_range_current: 333,                  // km (vs original 340 km)
  avg_consumption: 14.5,                   // kWh per 100 km

  // Temperature History
  avg_battery_temp: 30,                    // °C (last 30 days)
  max_battery_temp: 45,                    // °C (peak temperature recorded)

  // Recommendations
  needs_battery_service: false,
  estimated_replacement_date: ISODate("2030-12-31"),  // When battery <80%

  // Measurement
  measured_at: ISODate("2024-12-23"),
  measured_by: "system",                   // system, service_center
  odometer_reading: 45000,

  // Timestamps
  created_at: ISODate
}
```

### 5. Modified Collection: `drivers`

```javascript
{
  // ... existing fields ...

  // REMOVE: vehicle_type, vehicle_number
  // REPLACE WITH:
  assigned_vehicle_id: "CAR001" | null,    // Current assigned vehicle
  vehicle_assignment_type: "permanent" | "temporary" | null,

  // ... rest of fields ...
}
```

### 7. Modified Collection: `trips`

```javascript
{
  // ... existing fields ...

  // ADD:
  vehicle_id: "CAR001",                    // Which vehicle was used
  odometer_start: 45000,
  odometer_end: 45150,

  // For Fuel Vehicles
  fuel_consumed: 15,                       // liters (optional)

  // For Electric Vehicles
  battery_level_start: 85,                 // % at trip start
  battery_level_end: 62,                   // % at trip end
  battery_consumed: 23,                    // % used in trip
  energy_consumed: 13.8,                   // kWh used
  charging_stops: 0,                       // Number of charging stops during trip
  charging_session_ids: [],                // IDs of charging sessions during trip

  // ... rest of fields ...
}
```

---

## ⚡ Electric Vehicle Charging Monitoring

### Overview

Since your fleet includes **Electric Vehicles (EVs)**, the system includes comprehensive charging monitoring and battery management features alongside traditional fuel vehicle management.

### 📝 Charging Session - User Input Requirements

When a driver/user completes a charging session, they must enter these **5 REQUIRED fields**:

1. **Start SOC (%)** - Battery State of Charge when charging started (e.g., 15%)
2. **End SOC (%)** - Battery State of Charge when charging ended (e.g., 85%)
3. **kW Consumed** - Energy consumed in kilowatt-hours (e.g., 42 kWh)
4. **Amount** - Total cost paid in rupees (e.g., ₹336)
5. **Charging Station Name** - Name and location of charging station (e.g., "Tata Power, MG Road, Bangalore")

**Auto-Calculated Fields:**

- SOC Charged = End SOC - Start SOC (e.g., 70%)
- Cost per kWh = Amount ÷ kW Consumed (e.g., ₹8.00/kWh)
- Duration = End Time - Start Time (e.g., 1h 15m)

**Optional Fields:**

- Charging Type (AC Slow/AC Fast/DC Fast/Home)
- Payment Method (Cash/Card/UPI)
- Receipt Upload
- Notes

### 🔄 Charging Session Workflow

```
Step 1: Driver Arrives at Charging Station
   ↓
Step 2: Driver clicks "Start Charging" button
   - App records start time automatically
   - Shows live timer
   ↓
Step 3: Vehicle is Charging
   - Timer running in background
   - Driver can do other work
   ↓
Step 4: Charging Complete
   - Driver clicks "End Charging"
   - App shows charging duration
   ↓
Step 5: Driver Enters 5 Required Fields
   ┌─────────────────────────────────┐
   │ 1. Start SOC: 15%               │
   │ 2. End SOC: 85%                 │
   │ 3. kW Consumed: 42 kWh          │
   │ 4. Amount: ₹336                 │
   │ 5. Station: Tata Power MG Road  │
   └─────────────────────────────────┘
   ↓
Step 6: App Auto-Calculates
   - Charged: 70% (85 - 15)
   - Cost per kWh: ₹8.00 (336 ÷ 42)
   ↓
Step 7: Driver Saves Session
   - Session stored in database
   - Receipt uploaded (optional)
   - Available in charging history
   ↓
Step 8: Session Complete ✓
   - Data used for expense tracking
   - Analytics updated
   - Reports available
```

### Key EV Features

**1. Battery Monitoring**

- Real-time battery level tracking (0-100%)
- Remaining range calculation
- Battery health percentage
- Low battery alerts (< 20%)
- Charging status (charging/not charging/full)

**2. Charging Session Management**

- Log charging sessions with start/end times
- Track charging location and station
- Record charging type (Home/AC/DC Fast)
- Calculate units consumed (kWh)
- Track charging costs
- Upload charging receipts

**3. Battery Health Tracking**

- Battery degradation monitoring
- Charging cycles count
- Temperature monitoring
- Health trend analysis
- Replacement forecasting

**4. Cost Analytics**

- Charging cost per session
- Cost per kilometer for EVs
- Compare EV charging vs fuel costs
- Monthly charging expense reports
- Savings calculations

**5. Charging Infrastructure**

- Nearby charging station finder
- Favorite charging stations
- Station ratings and reviews
- Charging station usage analytics

**6. Smart Alerts**

- Low battery warnings
- Insufficient range for trip alerts
- Battery health degradation alerts
- Charging completion notifications

### EV-Specific Collections

The system uses dedicated database collections for EV data:

- `charging_sessions` - Track every charging session
- `battery_health_logs` - Monitor battery degradation
- Enhanced `vehicle_expenses` - Include charging costs
- Enhanced `trips` - Track battery usage per trip

### Dual Support: Fuel + Electric

The fleet management system seamlessly handles both:

- **Fuel Vehicles**: Track fuel expenses, mileage, fuel consumption
- **Electric Vehicles**: Track charging sessions, battery health, energy consumption
- **Hybrid Approach**: Manage mixed fleet with unified interface

---

## 📤 File Upload System for Vehicles

### Required Documents (Mandatory before activation)

1. **RC Book (Registration Certificate)** 📄

   - Format: PDF or Image (JPG/PNG)
   - Max Size: 5MB
   - Must be clear and readable
   - Auto-extract: Registration number, owner name, validity date
   - Renewal tracking: Alert 30 days before expiry

2. **Insurance Policy** 📄

   - Format: PDF or Image (JPG/PNG)
   - Max Size: 5MB
   - Must show policy number and expiry
   - Auto-extract: Policy number, insurer, expiry date, coverage amount
   - Critical alerts: 30/15/7 days before expiry
   - Block trip assignment if expired

3. **Pollution Under Control (PUC) Certificate** 📄
   - Format: PDF or Image
   - Max Size: 2MB
   - Required before first trip assignment
   - Validity: Usually 6 months
   - Auto-alerts for renewal

### Required Photos (Mandatory for complete profile)

1. **Front View** 📸

   - Clear view of front bumper, headlights, number plate
   - Good lighting, full vehicle in frame
   - Max Size: 2MB

2. **Back View** 📸

   - Rear bumper, taillights, number plate
   - Max Size: 2MB

3. **Left Side View** 📸

   - Full side profile
   - Max Size: 2MB

4. **Right Side View** 📸

   - Full side profile
   - Max Size: 2MB

5. **Interior/Dashboard** 📸
   - Dashboard, steering wheel, seats
   - Shows odometer reading
   - Max Size: 2MB

### Optional Documents

- Fitness Certificate (for commercial vehicles)
- Commercial Permit
- Road Tax Receipt
- Previous Service Records
- Purchase Invoice

### Optional Photos

- RC Book (physical copy photo)
- Insurance Sticker on windshield
- Engine bay
- Trunk/boot space
- Additional interior angles
- Damage documentation (before repair)
- After maintenance photos

### Upload Features

**Multi-file Upload:**

- Drag & drop interface
- Select multiple files at once
- Progress indicator for each file
- Preview before upload

**Validation:**

- File type checking (PDF, JPG, PNG only)
- File size limits enforced
- Image quality check (minimum resolution)
- Duplicate prevention

**Storage:**

- Files stored in: `backend/uploads/vehicles/{vehicle_id}/`
- Organized by type: `documents/`, `photos/`
- Naming: `{document_type}_{timestamp}.{ext}`
- Database stores: file_id, original_name, type, size, upload_date

**Photo Gallery:**

- Lightbox view for photos
- Zoom in/out
- Download original
- Delete with confirmation
- Replace with new version (keeps history)

### OCR Integration (Future Enhancement)

- Auto-extract data from RC:
  - Registration number
  - Owner name
  - Vehicle class
  - Validity date
- Auto-extract from Insurance:
  - Policy number
  - Insurer name
  - Coverage amount
  - Expiry date

---

## 🔧 Backend Implementation Plan

### Phase 1: Models & Database (Week 1)

#### Files to Create:

1. **`backend/app/models/vehicle.py`**

   - VehicleBase, VehicleCreate, VehicleUpdate, VehicleInDB
   - VehicleStatus, VehicleCondition, FuelType enums
   - VehicleDocuments model (RC, Insurance, Pollution, etc.)
   - VehiclePhotos model (Front, Back, Sides, Interior)
   - DocumentType enum (RC, Insurance, Pollution, Fitness, Permit)
   - PhotoType enum (Front, Back, Left, Right, Interior, RC_Photo, Insurance_Sticker)

2. **`backend/app/models/vehicle_assignment.py`**

   - AssignmentBase, AssignmentCreate, AssignmentUpdate
   - AssignmentType, AssignmentStatus enums

3. **`backend/app/models/vehicle_maintenance.py`**

   - MaintenanceBase, MaintenanceCreate, MaintenanceUpdate
   - MaintenanceType, MaintenanceStatus enums

4. **`backend/app/models/vehicle_expense.py`**

   - ExpenseBase, ExpenseCreate, ExpenseUpdate
   - ExpenseType enum (fuel, charging, maintenance, insurance, etc.)

5. **`backend/app/models/charging_session.py`** (EV-specific)

   - ChargingSessionBase, ChargingSessionCreate, ChargingSessionUpdate
   - ChargingType enum (AC_Slow, AC_Fast, DC_Fast, Home)
   - ChargingStatus enum (in_progress, completed, interrupted, failed)
   - ChargingStation model

6. **`backend/app/models/battery_health.py`** (EV-specific)
   - BatteryHealthBase, BatteryHealthCreate
   - Battery metrics and degradation tracking

#### Database Setup:

7. **`backend/create_vehicles_indexes.py`**

   - Create indexes for vehicle collections
   - Ensure uniqueness for registration_number, vehicle_id
   - Index charging_sessions by vehicle_id, date
   - Index battery_health_logs by vehicle_id, measured_at

8. **`backend/app/db/seed_vehicle_types.py`**
   - Seed vehicle types, makes, models
   - Seed fuel types (Petrol, Diesel, Electric, CNG, Hybrid)
   - Seed maintenance types
   - Seed EV-specific data:
     - Popular charging stations
     - Charging types
     - Battery manufacturers

---

### Phase 2: API Endpoints (Week 2)

#### File: `backend/app/api/v1/endpoints/vehicles.py`

**Vehicle Management Endpoints:**

```
POST   /api/v1/vehicles                  - Add new vehicle
GET    /api/v1/vehicles                  - List all vehicles (with filters)
GET    /api/v1/vehicles/{vehicle_id}     - Get vehicle details
PUT    /api/v1/vehicles/{vehicle_id}     - Update vehicle
DELETE /api/v1/vehicles/{vehicle_id}     - Delete vehicle (soft delete)
PATCH  /api/v1/vehicles/{vehicle_id}/status - Update vehicle status

GET    /api/v1/vehicles/available        - Get available vehicles
GET    /api/v1/vehicles/in-maintenance   - Get vehicles in maintenance
GET    /api/v1/vehicles/statistics       - Get fleet statistics
```

**Assignment Endpoints:**

```
POST   /api/v1/vehicles/{vehicle_id}/assign    - Assign vehicle to driver
POST   /api/v1/vehicles/{vehicle_id}/unassign  - Unassign vehicle
GET    /api/v1/vehicles/{vehicle_id}/assignments - Assignment history
GET    /api/v1/vehicles/{vehicle_id}/current-assignment - Current assignment
```

**Maintenance Endpoints:**

```
POST   /api/v1/vehicles/{vehicle_id}/maintenance       - Schedule maintenance
GET    /api/v1/vehicles/{vehicle_id}/maintenance       - Maintenance history
PUT    /api/v1/vehicles/maintenance/{maintenance_id}   - Update maintenance
GET    /api/v1/vehicles/maintenance/upcoming           - Upcoming maintenance
GET    /api/v1/vehicles/maintenance/overdue            - Overdue maintenance
```

**Expense Endpoints:**

```
POST   /api/v1/vehicles/{vehicle_id}/expenses          - Add expense
GET    /api/v1/vehicles/{vehicle_id}/expenses          - Get expenses
GET    /api/v1/vehicles/expenses/summary               - Expense summary/analytics
GET    /api/v1/vehicles/expenses/by-type               - Group by expense type
GET    /api/v1/vehicles/expenses/fuel-vs-charging      - Compare fuel vs charging costs
```

**Electric Vehicle Charging Endpoints:**

```
POST   /api/v1/vehicles/{vehicle_id}/charging/start    - Start charging session
PUT    /api/v1/vehicles/{vehicle_id}/charging/update   - Update charging progress
POST   /api/v1/vehicles/{vehicle_id}/charging/end      - End charging session
GET    /api/v1/vehicles/{vehicle_id}/charging/sessions - Get charging history
GET    /api/v1/vehicles/{vehicle_id}/charging/current  - Get current charging status
GET    /api/v1/vehicles/{vehicle_id}/charging/cost     - Charging cost analytics

GET    /api/v1/vehicles/{vehicle_id}/battery/health    - Get battery health
GET    /api/v1/vehicles/{vehicle_id}/battery/history   - Battery health over time
POST   /api/v1/vehicles/{vehicle_id}/battery/log       - Log battery health reading

GET    /api/v1/vehicles/electric/all                   - List all electric vehicles
GET    /api/v1/vehicles/electric/low-battery           - EVs with battery < 20%
GET    /api/v1/vehicles/electric/charging              - Currently charging vehicles
GET    /api/v1/vehicles/electric/statistics            - EV fleet statistics
```

**Charging Station Endpoints:**

```
GET    /api/v1/charging-stations                       - List nearby charging stations
GET    /api/v1/charging-stations/{id}                  - Get station details
GET    /api/v1/charging-stations/nearby                - Find stations near location
POST   /api/v1/charging-stations                       - Add charging station (admin)
```

**Document & Photo Endpoints:**

```
POST   /api/v1/vehicles/{vehicle_id}/documents         - Upload document (RC/Insurance/etc)
POST   /api/v1/vehicles/{vehicle_id}/photos            - Upload vehicle photos
GET    /api/v1/vehicles/{vehicle_id}/documents         - Get all documents
GET    /api/v1/vehicles/{vehicle_id}/photos            - Get all photos
GET    /api/v1/vehicles/{vehicle_id}/documents/{type}  - Get specific document (RC/Insurance)
DELETE /api/v1/vehicles/{vehicle_id}/documents/{id}    - Delete document
DELETE /api/v1/vehicles/{vehicle_id}/photos/{id}       - Delete photo
GET    /api/v1/vehicles/documents/expiring             - Documents expiring soon
GET    /api/v1/vehicles/documents/expired              - Expired documents (Critical alert)
```

#### Permissions Required:

- **Admin/Super Admin**: Full access to all endpoints
- **Manager**: Read access + assign/unassign
- **Operator**: Read access only
- **Accountant**: Full access to expenses
- **Drivers**: Read access to assigned vehicle only

---

### Phase 3: Business Logic (Week 2-3)

#### Key Features to Implement:

1. **Smart Vehicle Assignment**

   - Check vehicle availability before assignment
   - Prevent double assignment
   - Auto-update driver's assigned_vehicle_id
   - Create assignment record

2. **Maintenance Tracking**

   - Auto-calculate next service based on km or date
   - Send alerts for upcoming maintenance
   - Mark vehicle as unavailable during maintenance
   - Track maintenance costs

3. **Document Expiry Management**

   - Alert system for expiring documents (30/15/7 days before)
   - Mark vehicle as "needs_renewal" when documents expire
   - Prevent trip assignment if critical docs expired

4. **Utilization Analytics**

   - Calculate km per day/month
   - Track idle time
   - Cost per kilometer
   - Revenue per vehicle (if trip pricing added)

5. **Validation Rules**

   - Registration number format validation
   - Prevent deletion if vehicle has active assignments
   - Odometer reading must increase
   - Service km must be > current km

6. **Electric Vehicle Smart Management**

   - **Battery Monitoring**

     - Real-time battery level tracking
     - Range estimation based on current charge
     - Low battery alerts (< 20%)
     - Critical battery alerts (< 10%)
     - Battery health degradation tracking

   - **Charging Intelligence**

     - Auto-log charging sessions
     - Calculate charging costs
     - Track charging efficiency
     - Recommend optimal charging times
     - Alert on slow charging (possible issue)
     - Track charging station usage patterns

   - **Range Management**

     - Calculate if vehicle has sufficient range for trip
     - Suggest charging stops for long trips
     - Track actual range vs estimated range
     - Alert driver if range insufficient for return trip

   - **Cost Analytics**

     - Compare charging cost vs fuel equivalent
     - Track cost per km for EVs
     - Monthly charging cost reports
     - Cheapest charging stations
     - Home charging vs public charging costs

   - **Battery Health**
     - Monthly battery health assessments
     - Degradation alerts
     - Charging cycle tracking
     - Optimal charging practices recommendations
     - Battery replacement forecasting

---

## 🎨 Frontend Implementation Plan

### Phase 4: Admin Fleet Management UI (Week 3-4)

#### 1. New Page: `frontend/src/pages/admin/Fleet.tsx`

**Features:**

- **Vehicle List View**

  - Table/Grid showing all vehicles
  - Filters: Status, Type, Availability, Make
  - Search: Registration number, Vehicle ID
  - Sort: By status, km, last service
  - Color-coded status badges

- **Quick Stats Cards**

  - Total vehicles
  - Available vehicles
  - In maintenance
  - Assigned vehicles
  - Documents expiring soon

- **Actions**
  - Add New Vehicle button
  - Edit vehicle
  - View details
  - Quick status change
  - Assign to driver
  - Schedule maintenance

#### 2. New Component: `frontend/src/components/VehicleDetailsModal.tsx`

**Tabs:**

1. **Basic Info**: Make, model, year, registration, etc.

   - For EVs: Battery capacity, charging type, max range

2. **Documents**:

   - RC (Registration Certificate) with expiry
   - Insurance Policy with expiry & renewal alerts
   - Pollution Certificate
   - Fitness Certificate
   - Download/View buttons
   - Upload new version
   - Document history

3. **Photos**:

   - Gallery view of all vehicle photos
   - Front, Back, Side views
   - Interior photos
   - RC & Insurance physical copies
   - Damage documentation
   - Upload more photos

4. **⚡ Charging & Battery** (Electric Vehicles Only):

   - Current battery level (visual gauge)
   - Current range remaining
   - Battery health percentage
   - Last charged at (time/location)
   - Charging history table
   - Cost per charge
   - Total charging cost this month
   - Battery health trend chart
   - Charging sessions map view
   - Home vs public charging breakdown

5. **Assignment History**: Who drove when
6. **Maintenance History**: Services, repairs, costs
7. **Expense History**: Fuel/Charging, tolls, fines
8. **Statistics**: Total km, avg km/day, total expenses
   - For EVs: Cost per km, kWh per 100km, charging frequency

#### 3. New Component: `frontend/src/components/AddVehicleModal.tsx`

**Form Fields:**

**Step 1: Basic Information**

- Vehicle ID (auto-generated or manual)
- Registration Number (validated format)
- Make & Model (dropdowns with search)
- Year, Color
- Type, Seating Capacity
- Fuel Type
- Ownership Type
- Current Odometer Reading
- Purchase details (if owned)

**Step 2: Mandatory Document Uploads**

- 📄 RC Book Upload (PDF/Image, max 5MB)
  - Auto-extract: Registration number, owner name, validity
- 📄 Insurance Policy (PDF/Image, max 5MB)
  - Auto-extract: Policy number, expiry date, insurer name
- 📄 Pollution Certificate (optional at creation, required before first trip)
- 📄 Fitness Certificate (if applicable)

**Step 3: Vehicle Photos (Mandatory)**

- 📸 Front View (Required)
- 📸 Back View (Required)
- 📸 Left Side (Recommended)
- 📸 Right Side (Recommended)
- 📸 Interior/Dashboard (Recommended)
- 📸 Physical RC Book Photo
- 📸 Insurance Sticker on Windshield

**Validation:**

- Cannot save vehicle without RC and Insurance
- Cannot activate vehicle without photos
- All documents must be clear and readable

#### 4. New Component: `frontend/src/components/AssignVehicleModal.tsx`

**Features:**

- Select driver from dropdown
- Select assignment type (permanent/temporary)
- Set duration (if temporary)
- Record current odometer
- Record current condition
- Notes field

#### 5. New Component: `frontend/src/components/MaintenanceScheduler.tsx`

**Features:**

- Select maintenance type
- Schedule date
- Service provider
- Estimated cost
- Expected downtime
- Notes

#### 6. New Component: `frontend/src/components/VehicleDocumentUpload.tsx`

**Features:**

**Document Upload Section:**

- Separate tabs for each document type
- RC Book upload with preview
- Insurance upload with preview
- Pollution certificate upload
- Drag & drop zone
- File validation (size, type)
- Upload progress indicator
- View/Download existing documents
- Replace document (keeps history)
- Expiry date input for each document
- Auto-alerts setup

**Photo Upload Section:**

- Grid layout for photo categories
- Front/Back/Side/Interior slots
- Camera icon to upload
- Preview thumbnails
- Drag & drop multiple photos
- Crop/rotate before upload
- Delete/Replace photos
- Photo gallery modal view
- Label each photo type

**Validation & Feedback:**

- Red border for missing mandatory items
- Green checkmark for uploaded items
- File size warnings
- Format validation
- Success/Error toast messages
- Prevent save if mandatory items missing

#### 7. New Component: `frontend/src/components/PhotoGallery.tsx`

**Features:**

- Lightbox view for vehicle photos
- Swipe between photos
- Zoom in/out
- Full-screen mode
- Download original
- Delete option (admin only)
- Before/After comparison view
- Timestamp on each photo

---

### Phase 5.5: Electric Vehicle Specific UI (Week 4-5)

#### 8. New Component: `frontend/src/components/EVBatteryMonitor.tsx`

**Features:**

**Battery Status Card:**

- Large circular battery gauge (0-100%)
- Color-coded: Green (>50%), Yellow (20-50%), Red (<20%)
- Current charge percentage
- Estimated range (km remaining)
- Time since last charge
- Charging status indicator (charging/not charging/full)

**Quick Stats:**

- Battery health: 98% ⚡
- Charging cycles: 245
- Average consumption: 14.5 kWh/100km
- Last 30 days: 12 charging sessions

**Alerts:**

- ⚠️ Low battery alert (< 20%)
- 🔋 Battery health below 90%
- ⚡ Currently charging at [Station Name]

#### 9. New Component: `frontend/src/components/ChargingSessionLogger.tsx`

**Simple 2-Step Process:**

**Step 1: Start Charging**

- Click "Start Charging" button
- Records current timestamp automatically
- Optional: Take photo of charging connector
- Shows live timer

**Step 2: End Charging (User enters 5 required fields)**

```
┌─────────────────────────────────────────────┐
│  Complete Charging Session                  │
├─────────────────────────────────────────────┤
│                                             │
│  Duration: 1h 15m (auto-calculated)         │
│                                             │
│  REQUIRED FIELDS:                           │
│                                             │
│  1. Start SOC (%)                           │
│     [  15  ] %                              │
│                                             │
│  2. End SOC (%)                             │
│     [  85  ] %                              │
│     Charged: 70% (auto-calculated)          │
│                                             │
│  3. kW Consumed                             │
│     [  42  ] kWh                            │
│                                             │
│  4. Amount Paid                             │
│     ₹ [  336  ]                             │
│     Cost per kWh: ₹8.00 (auto-calculated)   │
│                                             │
│  5. Charging Station Name                   │
│     [Tata Power, MG Road, Bangalore______]  │
│                                             │
│  OPTIONAL FIELDS:                           │
│                                             │
│  Charging Type:                             │
│     ( ) AC Slow  ( ) AC Fast                │
│     (•) DC Fast  ( ) Home                   │
│                                             │
│  Payment Method:                            │
│     ( ) Cash  ( ) Card  (•) UPI             │
│                                             │
│  Upload Receipt (optional):                 │
│     [📎 Choose File]                        │
│                                             │
│  Notes (optional):                          │
│     [________________________]              │
│                                             │
│     [Cancel]  [Save Session]                │
│                                             │
└─────────────────────────────────────────────┘
```

**Validation:**

- All 5 required fields must be filled
- End SOC must be > Start SOC
- kW consumed must be > 0
- Amount must be > 0
- Auto-calculations shown in real-time

#### 10. New Component: `frontend/src/components/ChargingHistory.tsx`

**Table View:**

| Date & Time      | Station Name       | Start SOC | End SOC | Charged | kW Used | Amount | Cost/kWh | Receipt |
| ---------------- | ------------------ | --------- | ------- | ------- | ------- | ------ | -------- | ------- |
| 23 Dec, 9:15 AM  | Tata Power MG Road | 15%       | 85%     | 70%     | 42 kWh  | ₹336   | ₹8.00    | 📄 View |
| 22 Dec, 3:30 PM  | Ather Grid HSR     | 20%       | 90%     | 70%     | 40 kWh  | ₹320   | ₹8.00    | 📄 View |
| 21 Dec, 11:00 AM | Home Charging      | 25%       | 100%    | 75%     | 45 kWh  | ₹270   | ₹6.00    | -       |

**Summary Stats:**

- 📊 This Month: 12 sessions
- ⚡ Total kWh: 456 kWh
- 💰 Total Cost: ₹3,648
- 📍 Most Used: Tata Power MG Road (5 times)
- 💵 Avg Cost per Session: ₹304
- 💵 Avg Cost per kWh: ₹8.00

**Filters:**

- Date range picker
- Search by station name
- Cost range slider
- SOC range (show only sessions charged >50%)

**Analytics Charts:**

- Bar chart: kWh consumed per week
- Line chart: Cost per kWh trend
- Pie chart: Charging station usage breakdown
- Line chart: Average SOC start/end over time

**Export:**

- Download charging report (PDF/Excel)
- For reimbursement/accounting
- Group by month or station

#### 11. New Component: `frontend/src/components/BatteryHealthTracker.tsx`

**Features:**

**Health Dashboard:**

- Battery health percentage (large display)
- Health trend line chart (last 12 months)
- Degradation rate: 2% in 2 years
- Estimated battery life remaining
- Replacement recommendation

**Metrics:**

- Total charging cycles: 245
- Actual capacity: 58.8 kWh / 60 kWh
- Max range now: 333 km (vs 340 km when new)
- Average battery temp: 30°C
- Peak temp recorded: 45°C

**Recommendations:**

- ✅ Battery health is good
- 💡 Avoid charging above 90% daily
- 💡 Use slow charging when possible
- ⚠️ Schedule battery check at 300 cycles

#### 12. New Page: `frontend/src/pages/admin/EVFleet.tsx`

**EV-Specific Fleet View:**

**Quick Stats Cards:**

- Total EVs in fleet: 15
- Currently charging: 3
- Low battery (< 20%): 1
- Available EVs: 11
- Average fleet battery health: 96%

**EV List with Battery Status:**

- Vehicle card showing:
  - Vehicle name & registration
  - Battery level gauge
  - Range remaining
  - Charging status
  - Last charged
  - Battery health
- Sort by: Battery level, Range, Health
- Filter: Charging, Available, Low battery

**Fleet Analytics:**

- Total charging cost this month
- vs Equivalent fuel cost (calculated)
- Savings: ₹XX,XXX per month
- Total kWh consumed
- Average consumption per vehicle
- Most/Least efficient vehicle
- Charging stations most used

**Map View:**

- Show all EVs on map
- Color-coded by battery level
- Show nearby charging stations
- Click vehicle to see details

---

#### 6. New Page: `frontend/src/pages/admin/VehicleDetails.tsx`

**Full-page detailed view with:**

- Header with vehicle photo & key info
- Status timeline
- Current assignment card
- Upcoming maintenance alerts
- Document expiry alerts
- Charts: km over time, expenses over time
- Recent activity feed

---

### Phase 5: Driver View Updates (Week 4)

#### 1. Update: `frontend/src/pages/user/Dashboard.tsx`

**Add Section: "My Assigned Vehicle"**

- Show current vehicle details
- Registration number
- Make/Model
- Current odometer
- Next service due
- Insurance expiry
- Quick link to report issues

#### 2. New Page: `frontend/src/pages/user/MyVehicle.tsx`

**Features for Drivers:**

- View vehicle details (read-only)
- Report issues/problems
- View maintenance history
- Log fuel expenses (or charging sessions for EVs)
- Update odometer reading after trips
- View assignment history

**For Electric Vehicle Drivers - Additional Features:**

- **Battery Monitor Widget**
  - Current battery level
  - Range remaining
  - Sufficient for return trip? (Yes/No indicator)
- **Charging Session Logger**
  - "Start Charging" button (records time)
  - Timer shows charging duration
  - "End Charging" form with 5 required fields:
    1. Start SOC (%)
    2. End SOC (%)
    3. kW Consumed
    4. Amount Paid
    5. Charging Station Name
  - Auto-calculates: SOC charged, cost per kWh
- **Charging History**
  - My charging sessions
  - Total cost this month
  - Download expense report
- **Nearby Charging Stations**
  - Map showing charging stations
  - Distance from current location
  - Availability status
  - Cost per unit
  - Ratings & reviews
- **Range Alerts**
  - Alert when battery < 20%
  - Suggest nearby charging stations
  - Calculate if sufficient charge for assigned trip

---

## 📱 Additional Features & Enhancements

### Phase 6: Advanced Features (Week 5-6)

1. **Dashboard Widgets for Admin**

   - Fleet utilization chart
   - Maintenance calendar
   - Expense trends
   - Top performing vehicles
   - Vehicles needing attention

   **Electric Vehicle Widgets:**

   - EV battery status overview
   - Currently charging vehicles
   - Low battery alerts
   - Charging cost vs fuel cost comparison
   - Fleet battery health average
   - Charging stations map
   - Monthly energy consumption chart

2. **Alerts & Notifications**

   - Document expiring in 30/15/7 days
   - Service due in X km
   - Vehicle idle for > 7 days
   - High expense alert
   - Accident/incident report

3. **Reports & Analytics**

   - Fleet performance report
   - Cost analysis report
   - Utilization report
   - Maintenance summary
   - Document compliance report
   - Export to PDF/Excel

   **Electric Vehicle Reports:**

   - EV fleet efficiency report
   - Charging cost analysis
   - Battery health report
   - Charging station usage report
   - Fuel savings report (EV vs ICE vehicles)
   - Energy consumption trends
   - Battery degradation forecast
   - ROI analysis (EV purchase vs operating costs)

4. **Document & Photo Management**

   - **Document Upload**

     - RC Book (Registration Certificate) - MANDATORY
     - Insurance Policy - MANDATORY
     - Pollution Certificate
     - Fitness Certificate
     - Permit, Road Tax Receipt
     - Support PDF, JPG, PNG (max 5MB per file)

   - **Vehicle Photo Gallery**

     - Front, Back, Left, Right views - MANDATORY
     - Interior photos
     - RC book physical copy photo
     - Insurance sticker photo
     - Before/After maintenance photos
     - Damage documentation photos
     - Support JPG, PNG (max 2MB per photo)

   - **Advanced Features**
     - Document versioning (keep history)
     - OCR to auto-extract data from RC/Insurance
     - Expiry tracking with 30/15/7 day alerts
     - Renewal reminders via notification
     - Bulk document upload for multiple vehicles
     - Photo gallery with zoom/lightbox view
     - Compare before/after photos

5. **GPS Integration (Future)**

   - Real-time vehicle location
   - Route tracking
   - Geofencing
   - Speed monitoring
   - Distance auto-calculation

6. **Mobile App Features**
   - QR code on vehicle for quick access
   - Driver can scan to report issues
   - Photo upload for damages
   - Checklist before/after trip

---

## 🔐 Permissions Matrix

| Feature                        | Super Admin | Admin | Manager | Operator | Accountant | Driver   |
| ------------------------------ | ----------- | ----- | ------- | -------- | ---------- | -------- |
| Add Vehicle                    | ✅          | ✅    | ❌      | ❌       | ❌         | ❌       |
| Edit Vehicle                   | ✅          | ✅    | ❌      | ❌       | ❌         | ❌       |
| Delete Vehicle                 | ✅          | ✅    | ❌      | ❌       | ❌         | ❌       |
| View All Vehicles              | ✅          | ✅    | ✅      | ✅       | ✅         | ❌       |
| View Assigned Vehicle          | ✅          | ✅    | ✅      | ✅       | ✅         | ✅       |
| Assign/Unassign                | ✅          | ✅    | ✅      | ❌       | ❌         | ❌       |
| Schedule Maintenance           | ✅          | ✅    | ✅      | ❌       | ❌         | ❌       |
| Update Maintenance             | ✅          | ✅    | ✅      | ❌       | ❌         | ❌       |
| Add Expenses                   | ✅          | ✅    | ✅      | ❌       | ✅         | ✅ (own) |
| View Expenses                  | ✅          | ✅    | ✅      | ❌       | ✅         | ✅ (own) |
| Manage Expenses                | ✅          | ❌    | ❌      | ❌       | ✅         | ❌       |
| Upload Documents               | ✅          | ✅    | ❌      | ❌       | ❌         | ❌       |
| View Reports                   | ✅          | ✅    | ✅      | ✅       | ✅         | ❌       |
| Export Reports                 | ✅          | ✅    | ✅      | ❌       | ✅         | ❌       |
| **EV: Start Charging Session** | ✅          | ✅    | ✅      | ✅       | ❌         | ✅ (own) |
| **EV: End Charging Session**   | ✅          | ✅    | ✅      | ✅       | ❌         | ✅ (own) |
| **EV: View Battery Status**    | ✅          | ✅    | ✅      | ✅       | ✅         | ✅ (own) |
| **EV: View Charging History**  | ✅          | ✅    | ✅      | ✅       | ✅         | ✅ (own) |
| **EV: Log Battery Health**     | ✅          | ✅    | ❌      | ❌       | ❌         | ❌       |
| **EV: View Battery Health**    | ✅          | ✅    | ✅      | ✅       | ❌         | ✅ (own) |
| **EV: Manage Charging Costs**  | ✅          | ❌    | ❌      | ❌       | ✅         | ❌       |

---

## 🗓️ Implementation Timeline

### Week 1: Backend Foundation

- ✅ Create database models
- ✅ Setup collections and indexes
- ✅ Create seed data scripts
- ✅ Write migration script for existing data

### Week 2: API Development

- ✅ Implement vehicle CRUD endpoints
- ✅ Implement assignment endpoints
- ✅ Implement maintenance endpoints
- ✅ Implement expense endpoints
- ✅ Add permissions checks
- ✅ Write API documentation

### Week 3: Basic Frontend

- ✅ Create Fleet page with vehicle list
- ✅ Add/Edit vehicle forms
- ✅ Vehicle details view
- ✅ Basic assignment functionality
- ✅ Document upload

### Week 4: Advanced Frontend

- ✅ Maintenance scheduler
- ✅ Expense tracking UI
- ✅ Driver vehicle view
- ✅ Filters and search
- ✅ Status management

### Week 5: Analytics & Reports

- ✅ Dashboard widgets
- ✅ Reports generation
- ✅ Charts and graphs
- ✅ Export functionality

### Week 6: Polish & Testing

- ✅ Alert system
- ✅ Notifications
- ✅ Mobile responsiveness
- ✅ Testing and bug fixes
- ✅ Documentation

---

## ✅ Vehicle Onboarding Checklist

### Before Adding a Vehicle - Prepare These Items

**📄 Mandatory Documents:**

- [ ] RC Book (Registration Certificate) - Clear scan/photo
- [ ] Insurance Policy - Current and valid
- [ ] Pollution Certificate (PUC) - If available

**📸 Mandatory Photos (all 5 required):**

- [ ] Front View - Full vehicle, number plate visible
- [ ] Back View - Full vehicle, number plate visible
- [ ] Left Side View - Full profile
- [ ] Right Side View - Full profile
- [ ] Interior/Dashboard - Clear odometer reading

**📸 Recommended Photos:**

- [ ] Physical RC Book photo
- [ ] Insurance sticker on windshield
- [ ] Engine bay (optional)
- [ ] Additional interior views (optional)

**📝 Information to Enter:**

- [ ] Registration Number (from RC)
- [ ] Make & Model
- [ ] Year of Manufacture
- [ ] Current Odometer Reading
- [ ] Vehicle Type (SUV/Sedan/Hatchback)
- [ ] Seating Capacity
- [ ] Fuel Type
- [ ] Color
- [ ] Insurance Expiry Date
- [ ] RC Expiry Date
- [ ] Last Service Date & KM

**⚠️ Important Notes:**

- All photos should be clear, well-lit, and recent
- Documents must be valid (not expired)
- File sizes: Documents ≤ 5MB, Photos ≤ 2MB
- Supported formats: PDF, JPG, PNG
- Vehicle cannot be assigned to trips without these items

---

## ⚡ Electric Vehicle Onboarding - Additional Checklist

### For Electric Vehicles - Additional Information Required

**🔋 Battery & Charging Specifications:**

- [ ] Battery capacity (kWh) - e.g., 60 kWh
- [ ] Estimated range on full charge (km) - e.g., 340 km
- [ ] Charging type supported (AC/DC/Both)
- [ ] Maximum charging speed (kW) - e.g., 50 kW DC fast
- [ ] Home charging setup (Yes/No)

**📊 Initial Battery Status:**

- [ ] Current battery level (%)
- [ ] Current battery health (% - usually 100% for new)
- [ ] Current odometer reading
- [ ] Number of charging cycles (if known)

**📍 Charging Setup:**

- [ ] Home charging station details (if applicable)
- [ ] Preferred charging stations (add to favorites)
- [ ] Charging card/membership details (if any)

**📸 EV-Specific Photos:**

- [ ] Charging port location
- [ ] Charging cable included
- [ ] Dashboard showing battery level
- [ ] Charging setup at home (if applicable)

**💡 Additional EV Information:**

- [ ] Charging recommendations from manufacturer
- [ ] Battery warranty details
- [ ] Service center for battery issues
- [ ] Emergency charging procedure

### After Adding EV

**Initial Setup Tasks:**

1. Set up battery health baseline
2. Add favorite charging stations
3. Configure low battery alerts
4. Set charging cost parameters
5. Brief driver on:
   - How to log charging sessions
   - Battery monitoring
   - Range management
   - Optimal charging practices

**First Charge:**

- Log first charging session to establish baseline
- Record charging station and cost
- Verify battery health readings
- Test charging time estimates

---

## 📋 Migration Strategy

### Migrating Existing Data

1. **Create Migration Script**: `backend/migrate_vehicles.py`

   ```
   For each driver with vehicle info:
   - Create vehicle record
   - Extract vehicle_type → vehicle type
   - Extract vehicle_number → registration_number
   - Create permanent assignment
   - Update driver with vehicle_id
   ```

2. **Handle Edge Cases**

   - Drivers without vehicles
   - Multiple drivers with same vehicle
   - Invalid vehicle numbers
   - Missing information

3. **Rollback Plan**
   - Backup database before migration
   - Keep old fields temporarily
   - Add flag: `migrated_to_fleet: true`

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs)

1. **Fleet Utilization**

   - Target: >80% of vehicles active daily
   - Track: vehicles in use / total vehicles

2. **Maintenance Compliance**

   - Target: 100% services on time
   - Track: overdue maintenance count

3. **Document Compliance**

   - Target: 0 expired critical documents
   - Track: expired document count

4. **Cost Efficiency**

   - Track: Cost per kilometer
   - Track: Monthly expenses trend
   - Track: Maintenance cost vs vehicle value

5. **Data Accuracy**

   - Target: <5% data entry errors
   - Track: odometer discrepancies

6. **Electric Vehicle Specific KPIs**

   - **Battery Health**

     - Target: Average fleet battery health > 95%
     - Track: Monthly degradation rate

   - **Charging Efficiency**

     - Target: Average charging cost < ₹X per kWh
     - Track: Cost per km for EVs vs fuel vehicles
     - Track: Savings vs equivalent fuel cost

   - **Range Optimization**

     - Target: 90% of trips completed without charging stops
     - Track: Average consumption (kWh/100km)
     - Track: Range accuracy (estimated vs actual)

   - **Charging Infrastructure**

     - Track: Most used charging stations
     - Track: Average charging time
     - Track: Charging station ratings

   - **Environmental Impact**
     - Track: CO2 emissions saved (vs fuel vehicles)
     - Track: Total kWh consumed
     - Track: Equivalent liters of fuel saved

---

## 🚀 Future Enhancements (Post-MVP)

### Phase 7: Advanced Features

1. **IoT Integration**

   - GPS trackers
   - OBD-II diagnostics
   - Fuel sensors
   - Real-time alerts

2. **AI/ML Features**

   - Predictive maintenance
   - Optimal vehicle assignment
   - Cost forecasting
   - Anomaly detection

3. **Mobile App**

   - Native iOS/Android apps
   - Offline support
   - Push notifications
   - Camera integration

4. **Third-Party Integrations**

   - Insurance providers API
   - Service center booking
   - Fuel card integration
   - Toll payment systems

5. **Advanced Analytics**
   - Driver performance correlation
   - Route optimization
   - Fuel efficiency analysis
   - Carbon footprint tracking

---

## 💰 Cost Estimation

### Development Costs

- Backend Development: 2 weeks
- Frontend Development: 2 weeks
- Testing & QA: 1 week
- Documentation: 3 days

### Infrastructure

- Additional database storage: ~5GB for documents
- File storage: ~10GB for vehicle photos/documents
- API calls: Minimal increase

### Maintenance

- Regular updates
- Bug fixes
- Feature enhancements

---

## 📝 Documentation Needs

### Technical Documentation

1. API documentation (Swagger)
2. Database schema documentation
3. Migration guide
4. Deployment guide

### User Documentation

1. Admin user guide
2. Driver user guide
3. FAQ section
4. Video tutorials

### Developer Documentation

1. Code comments
2. Architecture diagrams
3. Setup instructions
4. Testing guide

---

## ✅ Checklist Before Going Live

### Backend

- [ ] All models created and tested
- [ ] All endpoints implemented
- [ ] Permission checks in place
- [ ] Validation rules working
- [ ] Error handling complete
- [ ] API documentation updated
- [ ] Database indexes created
- [ ] Migration script tested

### Frontend

- [ ] All pages responsive
- [ ] Forms validated
- [ ] Error messages clear
- [ ] Loading states handled
- [ ] Images optimized
- [ ] Accessibility checked
- [ ] Cross-browser tested
- [ ] Mobile tested

### Data

- [ ] Existing data migrated
- [ ] Test data created
- [ ] Backups configured
- [ ] Migration rollback tested

### Security

- [ ] Permissions tested for all roles
- [ ] File uploads validated
- [ ] SQL injection prevented
- [ ] XSS protection in place
- [ ] Authentication working
- [ ] Authorization working

### Documentation

- [ ] API docs complete
- [ ] User guide written
- [ ] Admin guide written
- [ ] README updated
- [ ] Changelog updated

---

## 🎓 Learning Resources for Team

- FastAPI documentation
- MongoDB aggregation framework
- React best practices
- Chart.js for analytics
- File upload best practices

---

## 📞 Support Plan

### During Development

- Daily standups
- Code reviews
- Pair programming sessions
- Weekly demos

### Post-Launch

- Bug tracking system
- User feedback collection
- Regular updates
- Training sessions

---

**Last Updated**: December 23, 2024  
**Version**: 1.1  
**Status**: Planning Phase (with EV Support)

---

## 📊 Summary

This plan transforms vehicle management from simple driver attributes to a comprehensive fleet management system with:

### Core Features

- **Independent vehicle tracking** - Vehicles as separate entities
- **Assignment history and management** - Track who drove what and when
- **Maintenance scheduling and tracking** - Automated service reminders
- **Expense management and analytics** - Track all vehicle-related costs
- **Document management with expiry tracking** - RC, Insurance, PUC with alerts
- **Photo gallery management** - Front, back, side, interior photos
- **Comprehensive reporting and analytics** - Fleet performance insights

### Electric Vehicle Features ⚡

- **Battery monitoring** - Real-time battery level and health tracking
- **Simple charging session logging** - Just 5 fields: Start SOC, End SOC, kW Consumed, Amount, Station Name
- **Auto-calculations** - System calculates SOC charged, cost per kWh, duration
- **Battery health tracking** - Degradation monitoring and forecasting
- **Charging cost analytics** - Compare with fuel costs, calculate savings
- **Range management** - Ensure sufficient charge for trips
- **Charging history** - Complete log with exports for reimbursement
- **Smart alerts** - Low battery, charging complete, health degradation
- **Dual fuel support** - Seamlessly manage fuel + electric vehicles together

### Technical Highlights

- 7 database collections (3 EV-specific)
- 40+ API endpoints (12 EV-specific)
- 12 UI components (5 EV-specific)
- Role-based permissions for all features
- Mobile-responsive design
- Export and reporting capabilities

The phased approach ensures manageable implementation while maintaining system stability and allowing for iterative improvements based on user feedback.

### What Makes This Special

✅ **First-class EV support** - Not an afterthought  
✅ **Simple data entry** - Only 5 fields needed for charging sessions  
✅ **Smart auto-calculations** - System does the math (SOC charged, cost per kWh)  
✅ **Unified interface** - Manage fuel and electric vehicles together  
✅ **Cost comparison** - See real savings from EVs vs fuel  
✅ **Battery intelligence** - Predict maintenance and replacement needs  
✅ **Driver-friendly** - Quick charging logging, no complex forms  
✅ **Admin insights** - Complete fleet analytics with exports  
✅ **Reimbursement ready** - Export charging reports for accounting
