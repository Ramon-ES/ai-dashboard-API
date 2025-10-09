# Super Admin Setup Guide

Quick guide to set yourself up as the platform owner (super admin).

## Step 1: Create Your Super Admin Account (2 minutes)

### A. Create Firebase Auth User

1. Go to Firebase Console → Authentication
   - https://console.firebase.google.com/project/enversed-ai-dashboard/authentication/users

2. Click **"Add user"**
   - Email: Your owner email (e.g., `owner@enversed.com`)
   - Password: Your secure password
   - Click "Add user"

3. **Copy the User UID** (you'll need it next)

### B. Create Firestore User Document

1. Go to Firestore Console
   - https://console.firebase.google.com/project/enversed-ai-dashboard/firestore/data

2. Go to `users` collection

3. Click **"Add document"**
   - **Document ID:** Paste your User UID from step A

4. **Add these fields:**

| Field | Type | Value |
|-------|------|-------|
| uid | string | `<your UID>` |
| email | string | `owner@enversed.com` |
| companyId | null | `null` (important!) |
| role | string | `super-admin` |
| permissions | array | Add 4 strings: `read`, `write`, `admin`, `super-admin` |
| createdAt | string | `2025-01-08T12:00:00.000Z` |

5. Click **"Save"**

## Step 2: Test Super Admin Access

1. Open the HTML tester: `test-api.html`

2. Login with your super admin credentials

3. Try: **GET /api/companies**
   - Should work (might return empty array if no companies yet)

4. If you get an error, check:
   - ✅ `companyId` is `null` (not a string, actual null)
   - ✅ `role` is exactly `super-admin`
   - ✅ `permissions` array includes `super-admin`

## Step 3: Create Your First Company

Now you can create companies for your clients!

```javascript
POST /api/companies
Headers: Authorization: Bearer <your-super-admin-token>
Body:
{
  "name": "Demo Company",
  "adminEmail": "admin@demo.com",
  "adminPassword": "DemoPass123!"
}
```

This creates:
- ✅ A company
- ✅ An admin user for that company
- ✅ Ready for the company admin to log in and create their team

## What You Can Do Now

### ✅ Company Management
- Create companies
- Update company details
- Deactivate/delete companies
- View all companies

### ✅ Cross-Company User Management
- Create users for any company
- View users across all companies
- Manage any user's role/permissions

### ✅ Data Access
- View all data from all companies
- No restrictions

## Role Hierarchy

```
YOU (super-admin)
  ↓ can create
Companies
  ↓ have
Company Admins (admin)
  ↓ can create
Company Users (editor, viewer)
```

## Security Notes

🔒 **Keep your super admin credentials safe!**
- This account has access to everything
- Use a strong, unique password
- Enable 2FA in Firebase Console if possible

🔒 **Company admins can only:**
- Manage users in their own company
- Access their own company's data
- Cannot see other companies

🔒 **Data isolation is automatic:**
- Company admins/users automatically scoped to their company
- No manual filtering needed
- Middleware handles all security

## Next Steps

1. **Create test company:**
   - Use the API or HTML tester
   - Create `test-company` with admin user

2. **Test company admin access:**
   - Login as the company admin
   - Verify they can only see their company
   - Try creating users

3. **Set up your real companies:**
   - Create actual client companies
   - Send credentials to company admins
   - Let them onboard their teams

## Troubleshooting

### "Forbidden: Super admin access required"
- Check `role` is exactly `super-admin`
- Check `permissions` array includes `super-admin`
- Make sure you're logged in with the right account

### "User not found in database"
- User document doesn't exist in Firestore
- Check the UID matches Firebase Auth UID

### Company admin can see other companies
- Check their `companyId` is set correctly
- Middleware should auto-filter by company

## Quick Reference

**Your super admin user should look like:**
```json
{
  "uid": "abc123...",
  "email": "owner@enversed.com",
  "companyId": null,
  "role": "super-admin",
  "permissions": ["read", "write", "admin", "super-admin"],
  "createdAt": "2025-01-08T12:00:00.000Z"
}
```

**Company admin user looks like:**
```json
{
  "uid": "xyz789...",
  "email": "admin@company.com",
  "companyId": "company-123",
  "role": "admin",
  "permissions": ["read", "write", "admin"],
  "createdAt": "2025-01-08T12:00:00.000Z"
}
```

---

**See full documentation:** [MULTI_TENANT_GUIDE.md](./MULTI_TENANT_GUIDE.md)
