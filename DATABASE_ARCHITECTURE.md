# DATABASE ARCHITECTURE - Property Portfolio Platform

## 📊 OVERVIEW

This project uses a **multi-database architecture** designed to support multiple agencies while maintaining data isolation and a centralized platform database for Super Admin operations.

---

## 🗄️ DATABASES IN USE

### 1. **`property_portforio`** (Main Application Database)
**Status**: ✅ Active (Primary)  
**Purpose**: Main application database for the property portfolio system  
**Records**: 17 properties

**Tables**:
- `users` - Agents, owners, and curators
- `properties` - Property listings
- `property_images` - Property photos and media
- `clients` - Client information
- `property_leads` - Property interest tracking
- `property_status_history` - Status change audit trail
- `content_feedback` - Curator feedback on properties
- `property_notes` - Internal notes about properties

**Used By**:
- Agents (create/manage properties)
- Owners (view analytics)
- Curators (content review)

**Connection String**: 
```
Host: localhost
Database: property_portforio
User: root
```

---

### 2. **`agency_1`** (Agency-Specific Database)
**Status**: ✅ Exists (Multi-Tenant Setup)  
**Purpose**: Isolated database for Agency #1  
**Records**: 0 properties (newly created)

**Tables**: 
- Same structure as `property_portforio`
- Designed for complete agency data isolation

**Used By**:
- Super Admin (cross-agency aggregation)
- Future: Agency #1 users (when migrated)

**Notes**: 
- Part of multi-tenant architecture
- Enables agency-specific data isolation
- Used in UNION queries for Super Admin

---

### 3. **`platform_db`** (Platform Management Database)
**Status**: ✅ Active  
**Purpose**: Centralized platform management for Super Admin  
**Records**: 1 agency registered

**Tables**:
- `agencies` - Agency registration and metadata
- `agency_performance_summary` - Aggregated agency statistics
- `platform_users` - Super Admin accounts

**Used By**:
- Super Admin (platform-wide management)
- Agency synchronization processes

**Key Features**:
- Tracks all registered agencies
- Stores pre-aggregated performance metrics
- Manages platform-level users

---

### 4. **`property_portfolio`** (Legacy/Alternate Database)
**Status**: ⚠️ Exists (Possible duplicate or old version)  
**Purpose**: Unclear - may be legacy or test database  

**Action Needed**: Review if this is needed or should be removed

---

## 🏗️ ARCHITECTURE PATTERNS

### Current Setup: **Hybrid Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      PLATFORM LEVEL                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         platform_db                                   │ │
│  │  - agencies                                           │ │
│  │  - agency_performance_summary                         │ │
│  │  - Super Admin management                             │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     AGENCY LEVEL                            │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  property_portforio  │  │     agency_1         │        │
│  │  (Main Agency)       │  │  (Agency #1)         │        │
│  │  - 17 properties     │  │  - 0 properties      │        │
│  │  - users, clients    │  │  - users, clients    │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  Future: agency_2, agency_3, etc.                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 DATABASE ACCESS BY ROLE

### **Super Admin**
```
✓ platform_db (full access)
✓ property_portforio (read access)
✓ agency_1 (read access)
✓ All future agency_* databases (read access)
```

**Special Capabilities**:
- UNION queries across all agency databases
- Aggregated statistics
- Platform-wide analytics

### **Owner**
```
✓ property_portforio (read access - their agency only)
```

**Restrictions**:
- Cannot access other agencies
- Cannot access platform_db
- Role-based filtering in queries

### **Agent**
```
✓ property_portforio (limited access - their properties only)
```

**Restrictions**:
- Can only see/edit their own properties
- Cannot see other agents' data
- Cannot access analytics

### **Curator**
```
✓ property_portforio (read access for content review)
```

**Restrictions**:
- Read-only access
- Can provide feedback
- Cannot modify property data

---

## 📈 MULTI-TENANT READY FEATURES

### Super Admin Aggregation System

The platform includes a comprehensive **multi-database aggregation system**:

```typescript
// Automatically detects all agency databases
getAllAgencyDatabases() → ['property_portforio', 'agency_1', ...]

// UNION queries across all databases
SuperAdminAggregator.getAllProperties()
// Returns: All properties from all agencies with source_agency field

SuperAdminAggregator.getGlobalStats()
// Returns: Aggregated statistics across all agencies
```

### Endpoints Available

```
GET /api/superadmin/properties        - All properties (UNION)
GET /api/superadmin/clients           - All clients (UNION)
GET /api/superadmin/agents            - All agents (UNION)
GET /api/superadmin/stats             - Global statistics
GET /api/superadmin/closure-ratio     - Cross-agency analytics
```

---

## 🚀 MIGRATION STRATEGY

### To Add New Agency

1. **Create new database**:
```sql
CREATE DATABASE agency_2;
```

2. **Copy table structure**:
```sql
CREATE TABLE agency_2.properties LIKE property_portforio.properties;
CREATE TABLE agency_2.users LIKE property_portforio.users;
-- Repeat for all tables
```

3. **Register in platform_db**:
```sql
INSERT INTO platform_db.agencies (name, status) 
VALUES ('Agency 2', 'active');
```

4. **System automatically detects** the new database - no code changes needed!

---

## 📊 CURRENT STATUS

| Database | Status | Records | Purpose |
|----------|--------|---------|---------|
| `property_portforio` | ✅ Active | 17 properties | Main application DB |
| `agency_1` | ✅ Ready | 0 properties | Multi-tenant setup |
| `platform_db` | ✅ Active | 1 agency | Platform management |
| `property_portfolio` | ⚠️ Review | Unknown | Legacy/duplicate? |

---

## 🔧 CONFIGURATION

**Environment Variables** (`.env`):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ahmad
DB_NAME=property_portforio  # Primary database
```

**Connection Pool**:
- Host: localhost
- Connection Limit: 10
- Charset: utf8mb4
- SSL: Not configured

---

## ✅ SYSTEM CAPABILITIES

- ✅ Single-tenant mode (current)
- ✅ Multi-tenant ready (agency_1 exists)
- ✅ Super Admin UNION queries
- ✅ Cross-database aggregation
- ✅ Automatic database detection
- ✅ Role-based access control
- ✅ Platform management database

---

## 📝 RECOMMENDATIONS

1. **Clarify `property_portfolio`**: Determine if this is needed or should be removed
2. **Data Migration**: Consider migrating data to agency-specific databases if needed
3. **Backup Strategy**: Implement regular backups for all databases
4. **Performance**: Monitor query performance with UNION operations as data grows
5. **Indexing**: Ensure proper indexes on all agency databases for optimal aggregation

---

**Document Updated**: December 8, 2025  
**Total Databases**: 3 active + 1 under review  
**Architecture**: Hybrid (single-tenant with multi-tenant capability)
