# What Happens When You Change a Schema?

## Quick Answer

**Existing data in the database does NOT automatically update.** But the API is designed to handle this gracefully!

## The System I Built For You

### 1. **Flexible Validation**

- ✅ **New documents**: Strict validation - must have all required fields
- ✅ **Updates**: Lenient validation - only validates fields you're changing
- ✅ **Old data continues working** even if it's missing new fields

### 2. **Automatic Version Tracking**

Every document automatically stores which schema version created it:

```json
{
  "id": "char123",
  "name": "John",
  "schemaVersion": "1.0",  // ← Tracked automatically
  "createdAt": "2025-01-08T10:00:00Z"
}
```

### 3. **Migration Tools**

When you need to update old data:

```bash
# Check what needs updating
npm run migrate status

# Test the migration (no changes)
npm run migrate run characters --dry-run

# Apply the migration
npm run migrate run characters
```

## Common Scenarios

### Scenario 1: You Add a New Optional Field

**What you do:**
```javascript
// Add to character.schema.js
{
  name: 'nickname',
  type: 'string',
  required: false  // ← Optional
}
```

**What happens:**
- ✅ New characters can have nicknames
- ✅ Old characters work fine without nicknames
- ✅ Frontend can display nickname if it exists, show nothing if it doesn't
- ✅ **No migration needed!**

### Scenario 2: You Add a New Required Field with Default

**What you do:**
```javascript
{
  name: 'status',
  type: 'string',
  required: true,
  default: 'draft'  // ← Default value
}
```

**What happens:**
- ✅ New characters must have status
- ✅ Old characters can still be updated (status field isn't required on updates)
- ⚠️ Should run migration to add default value to all old documents

**Run migration:**
```bash
npm run migrate run characters
```

This automatically adds `status: 'draft'` to all old characters.

### Scenario 3: You Change a Dropdown (Add Options)

**What you do:**
```javascript
options: [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' }  // ← NEW
]
```

**What happens:**
- ✅ Old characters keep their 'draft' or 'active' status
- ✅ New characters can use 'archived'
- ✅ **No migration needed!**

### Scenario 4: You Remove a Field

**What you do:**
```javascript
// Removed 'description' field from schema
```

**What happens:**
- ✅ Old characters still have 'description' in database
- ⚠️ Frontend won't know to display it (schema doesn't define it)
- ⚠️ Data is "orphaned" but not deleted

**Best practice:** Keep the field as optional if old data has it, or migrate to remove it.

## Simple Rules

### ✅ Safe Changes (No Migration)
1. Add optional fields
2. Add required fields **with defaults**
3. Add new dropdown options
4. Make validation less strict (e.g., increase maxLength)

### ⚠️ Breaking Changes (Need Migration)
1. Add required fields **without defaults**
2. Remove fields completely
3. Change field types (string → number)
4. Make validation stricter (e.g., decrease maxLength)

## When to Run Migrations

### Don't Need Migration:
- Adding optional fields
- Adding fields with defaults (they work, but migration adds the defaults)
- Adding dropdown options

### Should Run Migration:
- After adding required fields (to populate existing documents)
- After removing fields (to clean up old data)
- After changing types (to convert data)
- Before deploying breaking changes

### How to Know:
```bash
npm run migrate status
```

If it says "Needs Migration: YES", you should run it.

## Example Workflow

You want to add a "department" field to characters:

### Step 1: Update Schema
```javascript
// src/schemas/character.schema.js
{
  name: 'department',
  type: 'string',
  required: true,
  default: 'General',  // ← Important!
  label: 'Department'
}

// Increment version
version: '1.1'  // was '1.0'
```

### Step 2: Check Status
```bash
npm run migrate status characters
```

Output:
```
Needs Migration: ⚠️  YES
Outdated Documents: 150
```

### Step 3: Test Migration
```bash
npm run migrate run characters --dry-run
```

Review what would change.

### Step 4: Run Migration
```bash
npm run migrate run characters
```

All 150 old characters now have `department: 'General'`.

### Step 5: Frontend Works!
Frontend requests schema, sees the new field, displays it automatically.

## Why This Approach?

**Problem:** You're still building the frontend. Requirements will change. You'll add/modify fields frequently.

**Solution:** The system lets you:
1. ✅ Change schemas without breaking existing data
2. ✅ Update only when needed (not every single change)
3. ✅ Test migrations before applying them
4. ✅ Track which documents need updating
5. ✅ Frontend adapts automatically to schema changes

## Need More Details?

See [SCHEMA_EVOLUTION_GUIDE.md](./SCHEMA_EVOLUTION_GUIDE.md) for comprehensive documentation.

## Quick Commands Reference

```bash
# Check migration status
npm run migrate status
npm run migrate status characters

# Test migration (safe, no changes)
npm run migrate run characters --dry-run

# Run migration
npm run migrate run characters

# Migrate everything
npm run migrate run all
```
