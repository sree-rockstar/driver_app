# User Roles and Permissions - PR TRAVELS

## Overview
This document outlines all user roles in the PR TRAVELS Driver Management System, their permissions, and access levels.

---

## Role Hierarchy

### 🔴 Tier 1 - System Level
**Super Admin** - Complete system control

### 🟣 Tier 2 - Management Level  
**Admin** - User & driver management  
**Manager** - Operations management

### 🟢 Tier 3 - Operations Level
**Operator/Dispatcher** - Trip management  
**Accountant** - Financial management  
**HR Staff** - Document & onboarding

### 🔵 Tier 4 - Support Level
**Support Staff** - Customer service

### 🟡 Tier 5 - External/Field Level
**Driver** - Regular full-time driver  
**Spare Driver** - Backup/on-call driver  
**User/Customer** - Service consumer

---

## Detailed Role Descriptions

### 1. Super Admin 🔴
**Current Assignment:** Sreekanth (9945610425)  
**Color:** Red  
**Backend Role:** Yes

**Description:**  
Full system access with complete control over all features, users, and system configuration.

**Permissions:**
- ✅ Manage Users
- ✅ Approve Drivers
- ✅ Manage Drivers
- ✅ Create/Assign/Manage Trips
- ✅ Manage Payments & Invoices
- ✅ View/Export Reports
- ✅ System Configuration
- ✅ Manage Roles
- ✅ Verify Documents

**Use Cases:**
- System-wide configuration
- Create/delete admins
- Emergency access to all data
- Final escalation point

---

### 2. Admin 🟣
**Color:** Purple  
**Backend Role:** Yes

**Description:**  
Manage daily operations, approve drivers, and oversee user management. Cannot change system settings.

**Permissions:**
- ✅ Manage Users
- ✅ Approve Drivers
- ✅ Manage Drivers
- ✅ Create/Assign/Manage Trips
- 📖 View Payments (Read-only)
- ✅ View/Export Reports
- ✅ Verify Documents
- ❌ System Configuration
- ❌ Manage Payments

**Use Cases:**
- General administration
- Driver approval process
- User management
- Operational oversight

---

### 3. Manager 🔵
**Color:** Blue  
**Backend Role:** Yes

**Description:**  
Focus on trip assignments, driver performance monitoring, and operational reports.

**Permissions:**
- 📖 View Users
- 📖 View Drivers
- ✅ Create/Assign/Manage Trips
- 📖 View Payments
- ✅ View/Export Reports
- 📖 View Documents
- ❌ Approve Drivers
- ❌ Manage Payments

**Use Cases:**
- Daily trip planning
- Driver assignment
- Performance monitoring
- Operational reporting

---

### 4. Operator/Dispatcher 🟢
**Color:** Green  
**Backend Role:** Yes

**Description:**  
Handle immediate operational needs, create trips, and communicate with drivers.

**Permissions:**
- 📖 View Drivers
- ✅ Create/Assign/Manage Trips
- 📖 View Reports (No export)
- 📖 View Documents
- ❌ Manage Users
- ❌ Approve Drivers
- ❌ Financial Access

**Use Cases:**
- Real-time trip assignment
- Driver communication
- Trip status updates
- Immediate operational issues

---

### 5. Accountant 💰
**Color:** Amber/Orange  
**Backend Role:** Yes

**Description:**  
Complete financial management including payments, invoices, and financial reports.

**Permissions:**
- ✅ Manage Payments
- ✅ Generate Invoices
- ✅ View/Export Reports
- 📖 View Drivers & Trips
- ❌ Manage Operations
- ❌ Approve Drivers

**Use Cases:**
- Process driver payouts
- Generate invoices
- Financial reconciliation
- Payment management

---

### 6. HR Staff 👥
**Color:** Pink  
**Backend Role:** Yes

**Description:**  
Handle driver onboarding, document verification, and maintain driver records.

**Permissions:**
- ✅ Approve Drivers
- ✅ Manage Drivers
- ✅ Verify Documents
- 📖 View Users & Reports
- ❌ Manage Trips
- ❌ Financial Access

**Use Cases:**
- Driver onboarding
- Document verification
- Background checks
- Driver record maintenance

---

### 7. Support Staff 🎧
**Color:** Indigo  
**Backend Role:** Yes

**Description:**  
Customer service with read-only access to information for handling queries.

**Permissions:**
- 📖 View Users
- 📖 View Drivers
- 📖 View Trips
- 📖 View Reports
- 📖 View Documents
- ❌ All Modifications

**Use Cases:**
- Customer query handling
- Information lookup
- Ticket management
- Basic support

---

### 8. Driver 🚗
**Color:** Green  
**Backend Role:** No (Field Role)

**Description:**  
Regular full-time driver with assigned trips and consistent availability.

**Permissions:**
- 📖 View Own Trips
- 📖 View Own Payments
- 📖 View Own Reports
- 📖 View Own Documents
- ✅ Update Trip Status
- ✅ Update Availability
- ❌ All Backend Operations

**Use Cases:**
- View assigned trips
- Update trip status
- Track earnings
- Upload documents
- Update personal info

---

### 9. Spare Driver 🟠
**Color:** Orange  
**Backend Role:** No (Field Role)

**Description:**  
Backup/substitute driver available on-call for emergency or temporary assignments when regular drivers are unavailable.

**Permissions:**
- 📖 View Own Trips
- 📖 View Own Payments
- 📖 View Own Reports
- 📖 View Own Documents
- ✅ Update Trip Status
- ✅ Update Availability
- ❌ All Backend Operations

**Key Differences from Regular Driver:**
- Called in for emergency/temporary needs
- On-call availability status
- May have different pay structure
- Can be promoted to regular driver

**Use Cases:**
- Emergency coverage
- Peak season support
- Temporary replacements
- Last-minute assignments
- Holiday coverage

---

### 10. User/Customer 👤
**Color:** Violet  
**Backend Role:** No (External)

**Description:**  
Customer who can book trips and manage their bookings.

**Permissions:**
- ✅ Request Trips
- 📖 View Own Bookings
- 📖 View Own Payments
- ✅ Make Payments
- ❌ All Backend Operations

**Use Cases:**
- Book trips
- Track bookings
- Make payments
- Rate drivers
- View history

---

## Permission Matrix

| Permission | Super Admin | Admin | Manager | Operator | Accountant | HR Staff | Support | Driver | Spare Driver | Customer |
|------------|-------------|-------|---------|----------|------------|----------|---------|--------|--------------|----------|
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Users | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Drivers | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Drivers | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Drivers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Trips | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Trips | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Trips | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Trips | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 📖 Own | 📖 Own | 📖 Own |
| Manage Payments | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Payments | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | 📖 Own | 📖 Own | 📖 Own |
| Generate Invoices | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 📖 Own | 📖 Own | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Verify Documents | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 📖 Own | 📖 Own | ❌ |

**Legend:**  
✅ Full Access | 📖 Read-Only / Own Data | ❌ No Access

---

## Role Assignment Guidelines

### Backend Staff Onboarding
1. **Super Admin** - Only assign to owners/founders
2. **Admin** - Senior management with 2+ years experience
3. **Manager** - Team leads with operational experience
4. **Operator** - Day-to-day operational staff
5. **Accountant** - Qualified finance professionals
6. **HR Staff** - HR department personnel
7. **Support** - Customer service representatives

### Driver Onboarding
1. **Spare Driver** - All new drivers start here
2. **Driver** - Promoted after proving reliability (typically 3-6 months)

### Promotion Path
```
Spare Driver → Driver → (Exceptional cases) → Operator → Manager → Admin
```

---

## Security Notes

1. **Password/MPIN Requirements:**
   - All roles: 4-6 digit MPIN for mobile access
   - Backend roles: Strong password for web access

2. **Two-Factor Authentication:**
   - Recommended for: Super Admin, Admin, Accountant
   - Optional for: Other roles

3. **Session Management:**
   - Backend roles: 24-hour sessions
   - Field roles: 7-day sessions
   - Automatic logout on inactivity

4. **Audit Logging:**
   - All Super Admin actions logged
   - Financial transactions logged
   - Driver approvals logged

---

## Database Collections

### user_roles
Stores role definitions with permissions

### users
User accounts with assigned role codes

---

## API Endpoints for Role Management

```
GET /api/v1/roles - List all roles
GET /api/v1/roles/{code} - Get role details
POST /api/v1/users/{id}/assign-role - Assign role (Super Admin only)
GET /api/v1/users/{id}/permissions - Get user permissions
```

---

## Future Enhancements

- [ ] Custom role creation
- [ ] Granular permission overrides
- [ ] Role expiration dates
- [ ] Multiple role assignments
- [ ] Permission inheritance
- [ ] Role-based UI customization

---

Last Updated: December 22, 2024  
Version: 1.0


