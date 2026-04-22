# 📘 VELAUTO BACKEND - COMPLETE DOCUMENTATION

**Version:** 1.1.0  
**Last Updated:** 25 Mart 2026  
**Status:** Production Ready ✅

---

## 📑 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Modules](#modules)
4. [API Endpoints](#api-endpoints)
5. [Security & Multi-Tenant](#security--multi-tenant)
6. [Clean Code Patterns](#clean-code-patterns)
7. [Deployment](#deployment)

---

## 🚀 Quick Start

### Prerequisites
- Java 21
- Maven 3.9+
- MySQL 8.0+

### Installation
```bash
git clone <repo-url>
cd velauto-backend
mvn clean package -DskipTests
java -jar target/velauto-backend-0.0.1-SNAPSHOT.jar
```

**API Ready:** http://localhost:8090

---

## 🏗️ Architecture Overview

### Modules (7)

| Module | Endpoints | Features |
|--------|-----------|----------|
| Auth | 6 | JWT, Multi-role, Password reset |
| Customer | 5 | CRUD + Soft delete |
| Vehicle | 5 | CRUD + Brand/Model support |
| ServiceCatalog | 5 | CRUD + Multi-tenant pricing |
| Appointment | 8 | CRUD + Date range queries |
| ServiceForm | 8 | Form items, Lock mechanism, Invoice generation |
| Expense | 6 | CRUD + Category filtering, Monthly analytics |

**Total: 43 REST API Endpoints**

---

## 📡 API Endpoints

### Authentication (6)
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/me
POST   /api/v1/auth/change-password
POST   /api/v1/auth/logout
```

### Customer (5)
```
POST   /api/v1/customers
GET    /api/v1/customers/{id}
GET    /api/v1/customers
PUT    /api/v1/customers/{id}
DELETE /api/v1/customers/{id}
```

### Vehicle (5)
```
POST   /api/v1/vehicles
GET    /api/v1/vehicles/{id}
GET    /api/v1/vehicles
PUT    /api/v1/vehicles/{id}
DELETE /api/v1/vehicles/{id}
```

### ServiceCatalog (5)
```
POST   /api/v1/service-catalogs
GET    /api/v1/service-catalogs/{id}
GET    /api/v1/service-catalogs
PUT    /api/v1/service-catalogs/{id}
DELETE /api/v1/service-catalogs/{id}
```

### Appointment (8)
```
POST   /api/v1/appointments
GET    /api/v1/appointments/{id}
GET    /api/v1/appointments
GET    /api/v1/appointments/customer/{customerId}
GET    /api/v1/appointments/vehicle/{vehicleId}
GET    /api/v1/appointments/range (startDate, endDate)
PUT    /api/v1/appointments/{id}
DELETE /api/v1/appointments/{id}
```

### ServiceForm (8)
```
POST   /api/v1/service-forms
GET    /api/v1/service-forms/{id}
GET    /api/v1/service-forms
GET    /api/v1/service-forms/appointment/{appointmentId}
PUT    /api/v1/service-forms/{id}
DELETE /api/v1/service-forms/{id}
POST   /api/v1/service-forms/{id}/items (Add item - Guard: Not locked)
DELETE /api/v1/service-forms/{id}/items/{itemId} (Delete item - Guard: Not locked)
```

### ServiceFormItem (2)
```
POST   /api/v1/service-forms/{formId}/items
DELETE /api/v1/service-forms/{formId}/items/{itemId}
```

### Invoice (4)
```
POST   /api/v1/invoices/generate/{serviceFormId} (Lock ServiceForm after PDF)
GET    /api/v1/invoices/{id}
GET    /api/v1/invoices
GET    /api/v1/invoices/service-form/{serviceFormId}
```

### Expense (6)
```
POST   /api/v1/expenses (Create - tenantId from security context)
GET    /api/v1/expenses/{id}
GET    /api/v1/expenses (Tenant filtered)
GET    /api/v1/expenses/category/{category} (Filter by category)
PUT    /api/v1/expenses/{id}
DELETE /api/v1/expenses/{id} (Soft delete)
```

### Dashboard (1)
```
GET    /api/v1/dashboard/summary (Includes P&L analytics)
```

---

## 🔒 Security & Multi-Tenant

### Authentication Flow
```
Register/Login → JWT Token → Bearer Header → Tenant Filtering
```

### Roles
- **super_admin** - Full system access
- **admin** - Tenant admin
- **manager** - Service management
- **staff** - Service operations
- **customer** - Self service

### Multi-Tenant Isolation
- All queries filtered by tenantId
- No cross-tenant data access
- Soft delete with tenant filtering

---

## 💡 Clean Code Patterns

### 1. Guard Clause & Early Return
```java
if (request == null) throw new BusinessException(...);
if (!entity.getTenantId().equals(tenantId)) throw new BusinessException(...);
// Process valid case (single level)
```

### 2. No Optional Chaining
```java
Optional<Entity> optional = repository.findById(id);
if (optional.isEmpty()) throw new BusinessException(...);
Entity entity = optional.get();
```

### 3. Single Responsibility per Line
```java
String value = dto.getValue();
validateValue(value);
// Use value in next step
```

### 4. Soft Delete Pattern
```java
entity.setDeletedAt(LocalDateTime.now());
entity.setDeletedBy(userId);
repository.save(entity);
```

### 5. AuditLog Integration
```java
auditLogService.log(userId, "ACTION", "ENTITY_TYPE", id, details);
```

---

## 🧪 Testing

### Postman Collections
1. **Velauto_API_Complete.postman_collection.json** - All endpoints (Auth, Customer, Vehicle, ServiceCatalog, Appointment, ServiceForm, Invoice, Expense, Dashboard)

### Import & Test
```
1. Postman → File → Import
2. Select collection
3. Auth → Login (get token)
4. Test endpoints
```

---

## 🚢 Deployment

### Build
```bash
mvn clean package -DskipTests
```

### Run
```bash
java -jar target/velauto-backend-0.0.1-SNAPSHOT.jar
```

### Docker
```bash
docker build -t velauto:1.1.0 .
docker run -p 8090:8090 velauto:1.1.0
```

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| API Endpoints | 43 |
| DTOs | 36 |
| Services | 12+ |
| Controllers | 12 |
| Repositories | 16 |
| Database Tables | 12 |
| Enums | 8 |
| Build Status | ✅ SUCCESS |

---

## ✨ Key Features

✅ Multi-tenant architecture  
✅ JWT authentication  
✅ Role-based access control  
✅ Soft delete pattern  
✅ AuditLog integration  
✅ MapStruct mapping  
✅ Comprehensive error handling  
✅ Pagination support  
✅ Input validation  
✅ Clean code patterns  
✅ ServiceForm Lock mechanism (after invoice generation)  
✅ Expense management with category filtering  
✅ P&L (Profit & Loss) analytics on Dashboard  
✅ Monthly revenue and expense tracking  

---

## 📞 Support

- **Documentation:** This file
- **API Testing:** Postman collections
- **Issues:** GitHub issues
- **Slack:** #velauto-backend

---

**Status:** ✅ PRODUCTION READY  
**Ready to Deploy:** ✅ YES

