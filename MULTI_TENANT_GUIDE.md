# Multi-Tenant Architecture Guide

## Overview

The API supports a 3-tier user hierarchy:

```
Super Admin (You - Owner)
    └── Companies
        └── Company Admins
            └── Company Users (Editors, Viewers)
```

## User Roles Explained

### 1. **Super Admin** (Owner)
- **You** - the platform owner
- Can create/manage all companies
- Can create users for any company
- Full access to everything
- Role: `super-admin`

### 2. **Company Admin**
- Admin of a specific company
- Can create/manage users within their company only
- Cannot access other companies' data
- Role: `admin`
- Permissions: `["read", "write", "admin"]`

### 3. **Company Editor**
- Can create/edit data within their company
- Cannot manage users
- Role: `editor`
- Permissions: `["read", "write"]`

### 4. **Company Viewer**
- Read-only access to their company's data
- Role: `viewer`
- Permissions: `["read"]`

## Setup: Creating Your Super Admin Account

### Step 1: Create Your Super Admin User

1. **In Firebase Authentication:**
   - Create a user with your email
   - Copy the User UID

2. **In Firestore → `users` collection:**
   ```json
   {
     "uid": "your-uid",
     "email": "owner@yourcompany.com",
     "companyId": null,
     "role": "super-admin",
     "permissions": ["read", "write", "admin", "super-admin"],
     "createdAt": "2025-01-08T12:00:00.000Z"
   }
   ```

**Important:** Notice `companyId` is `null` for super admins - they're not tied to any company.

## How It Works

### As Super Admin (You)

#### 1. Create a New Company

```javascript
POST /api/companies
Headers: Authorization: Bearer <your-super-admin-token>
Body:
{
  "name": "Acme Corporation",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePass123!"
}
```

**This automatically:**
- ✅ Creates the company in Firestore
- ✅ Creates a Firebase Auth user for the company admin
- ✅ Creates a Firestore user document with `role: "admin"`
- ✅ Links the admin to the company

#### 2. List All Companies

```javascript
GET /api/companies
Headers: Authorization: Bearer <your-super-admin-token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "company-123",
      "name": "Acme Corporation",
      "status": "active",
      "createdAt": "2025-01-08T12:00:00.000Z"
    }
  ]
}
```

#### 3. View Company Details

```javascript
GET /api/companies/company-123
Headers: Authorization: Bearer <your-super-admin-token>

Response:
{
  "success": true,
  "data": {
    "id": "company-123",
    "name": "Acme Corporation",
    "status": "active",
    "userCount": 5
  }
}
```

#### 4. Create Additional Users for a Company

```javascript
POST /api/companies/company-123/users
Headers: Authorization: Bearer <your-super-admin-token>
Body:
{
  "email": "editor@acme.com",
  "password": "SecurePass123!",
  "role": "editor"
}
```

### As Company Admin

#### 1. List Users in My Company

```javascript
GET /api/users
Headers: Authorization: Bearer <company-admin-token>

// Only sees users from their company
```

#### 2. Create New User in My Company

```javascript
POST /api/users
Headers: Authorization: Bearer <company-admin-token>
Body:
{
  "email": "viewer@acme.com",
  "password": "SecurePass123!",
  "role": "viewer"
}
```

**Automatically added to the admin's company** - they can't create users for other companies.

#### 3. Update Users

```javascript
PUT /api/users/user-uid
Headers: Authorization: Bearer <company-admin-token>
Body:
{
  "role": "editor"
}
```

### As Company Editor/Viewer

- Can access data endpoints (`/api/scenarios`, `/api/characters`, etc.)
- Automatically scoped to their company
- Cannot manage users
- Editors can create/edit, Viewers can only read

## API Endpoints

### Company Management (Super Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List all companies |
| GET | `/api/companies/:id` | Get company details |
| POST | `/api/companies` | Create new company + admin |
| PUT | `/api/companies/:id` | Update company |
| DELETE | `/api/companies/:id?confirm=true` | Delete company + all users |
| GET | `/api/companies/:id/users` | List users in company |
| POST | `/api/companies/:id/users` | Create user for company |

### User Management

| Method | Endpoint | Who Can Access | Description |
|--------|----------|----------------|-------------|
| GET | `/api/users` | Admin, Super Admin | List users in own company |
| POST | `/api/users` | Admin, Super Admin | Create user in own company |
| PUT | `/api/users/:uid` | Admin, Super Admin | Update user |
| DELETE | `/api/users/:uid` | Admin, Super Admin | Delete user |

## Data Isolation

All data is automatically scoped to companies:

```javascript
// When a Company Admin queries characters
GET /api/characters
Headers: Authorization: Bearer <company-admin-token>

// Automatically filtered by their companyId
// They ONLY see their company's characters
```

**Middleware ensures:**
- Users can only access data from their company
- Super admins can access everything
- No cross-company data leakage

## Complete Workflow Example

### Scenario: You're onboarding a new client "TechCorp"

**Step 1:** As Super Admin, create the company
```javascript
POST /api/companies
{
  "name": "TechCorp",
  "adminEmail": "admin@techcorp.com",
  "adminPassword": "TempPass123!"
}
```

**Step 2:** TechCorp admin logs in
- Email: `admin@techcorp.com`
- Password: `TempPass123!`
- Gets Firebase token

**Step 3:** TechCorp admin creates their team
```javascript
POST /api/users
{
  "email": "designer@techcorp.com",
  "password": "Pass123!",
  "role": "editor"
}

POST /api/users
{
  "email": "manager@techcorp.com",
  "password": "Pass123!",
  "role": "viewer"
}
```

**Step 4:** Team members log in and use the platform
- They only see TechCorp's data
- Isolated from all other companies

## Security Features

✅ **Company Isolation** - Automatic data scoping by companyId
✅ **Role-Based Access** - Different permissions per role
✅ **Hierarchical Control** - Super admin → Company admin → Users
✅ **Self-Protection** - Users can't delete themselves or remove own admin role
✅ **Atomic Operations** - Rollback on failures
✅ **Audit Trail** - Track who created/updated what

## Database Structure

```
Firestore:
├── companies/
│   ├── {companyId}/
│   │   ├── id
│   │   ├── name
│   │   ├── status
│   │   ├── createdAt
│   │   └── createdBy
│
├── users/
│   ├── {userId}/
│   │   ├── uid
│   │   ├── email
│   │   ├── companyId         ← Links to company (null for super-admins)
│   │   ├── role
│   │   ├── permissions
│   │   ├── createdAt
│   │   └── createdBy
│
├── scenarios/
│   ├── {scenarioId}/
│   │   ├── companyId         ← Scoped to company
│   │   └── ...
│
├── characters/
│   ├── {characterId}/
│   │   ├── companyId         ← Scoped to company
│   │   └── ...
```

## Best Practices

### 1. Initial Setup
- Create your super admin account first
- Test company creation before onboarding clients
- Set up password reset flows

### 2. Onboarding Companies
- Create company via API
- Share admin credentials securely
- Ask admin to change password immediately
- Let company admin create their team

### 3. User Management
- Company admins manage their own users
- You (super admin) only intervene when needed
- Use "viewer" role for stakeholders who just need visibility

### 4. Data Management
- All data automatically scoped to companies
- No manual filtering needed in frontend
- Company isolation handled by middleware

## Migration: Existing Users to Multi-Tenant

If you have existing users, update their documents:

```javascript
// Add companyId to existing users
{
  "uid": "existing-user-uid",
  "email": "user@example.com",
  "companyId": "demo-company-001",  // ← Add this
  "role": "admin",
  "permissions": ["read", "write", "admin"]
}

// For super admin (you)
{
  "uid": "your-uid",
  "email": "owner@platform.com",
  "companyId": null,                // ← null for super admin
  "role": "super-admin",
  "permissions": ["read", "write", "admin", "super-admin"]
}
```

## Testing

Use the HTML tester to test the full flow:
1. Login as super admin
2. Create a company
3. Login as company admin (new tab/incognito)
4. Create users
5. Verify data isolation

---

**Need help?** Check the main [README.md](./README.md) for API documentation.
