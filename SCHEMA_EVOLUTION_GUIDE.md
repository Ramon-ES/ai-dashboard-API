# Schema Evolution Guide

This guide explains how to safely evolve your API schemas without breaking existing data.

## How It Works

The API implements a **flexible validation system** that allows schemas to change while keeping existing data intact:

1. **New documents** are validated strictly (all required fields must be present)
2. **Updates** are validated flexibly (only changed fields are validated)
3. **Schema versions** are tracked automatically on every document
4. **Migration tools** help you update old data when needed

## Safe Schema Changes

### ✅ Safe Changes (No Migration Needed)

These changes are **backward compatible** and won't break existing data:

#### 1. Add Optional Fields
```javascript
// Before
{
  name: 'name',
  type: 'string',
  required: true,
}

// After - Add new optional field
{
  name: 'name',
  type: 'string',
  required: true,
},
{
  name: 'nickname',  // NEW FIELD
  type: 'string',
  required: false,   // OPTIONAL
}
```

#### 2. Add Fields with Defaults
```javascript
{
  name: 'status',
  type: 'string',
  required: true,
  default: 'active',  // Will auto-populate for old documents
}
```

#### 3. Relax Validation
```javascript
// Before
validation: { maxLength: 100 }

// After
validation: { maxLength: 200 }  // More permissive
```

#### 4. Add New Dropdown Options
```javascript
// Before
options: [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' }
]

// After
options: [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' }  // NEW OPTION
]
```

### ⚠️ Breaking Changes (Migration Required)

These changes **require migrating existing data**:

#### 1. Add Required Fields (without defaults)
```javascript
{
  name: 'requiredNewField',
  type: 'string',
  required: true,  // ⚠️ Old documents don't have this!
}
```

**Solution:** Add a default value OR run migration to populate existing documents

#### 2. Remove Fields
```javascript
// Removed: description field
// ⚠️ Old documents still have it
```

**Solution:** Leave field in schema as optional, or migrate data

#### 3. Change Field Types
```javascript
// Before
{ name: 'age', type: 'string' }

// After
{ name: 'age', type: 'number' }  // ⚠️ Type mismatch!
```

**Solution:** Run migration to convert data types

#### 4. Stricter Validation
```javascript
// Before
validation: { maxLength: 200 }

// After
validation: { maxLength: 100 }  // ⚠️ Existing data might exceed this!
```

**Solution:** Migrate data to meet new constraints

## Making Schema Changes

### Step 1: Update Schema Version

When making changes, increment the version:

```javascript
// src/schemas/character.schema.js
const characterSchema = {
  type: 'character',
  version: '1.1',  // Changed from '1.0'
  // ... fields
};
```

### Step 2: Check Migration Status

See which documents need updating:

```bash
npm run migrate status characters
```

Output:
```
📊 Migration Status Report

CHARACTERS
--------------------------------------------------------------------------------
Current Schema Version: 1.1
Total Documents: 150
Needs Migration: ⚠️  YES
Outdated Documents: 150

Version Breakdown:
  ⚠️  v1.0: 150 documents
```

### Step 3: Test Migration (Dry Run)

Always test first!

```bash
npm run migrate run characters --dry-run
```

This shows what would change without actually changing anything.

### Step 4: Run Migration

Apply the changes:

```bash
npm run migrate run characters
```

Or migrate all collections:

```bash
npm run migrate run all
```

## Migration Commands

### Check Status
```bash
# All collections
npm run migrate status

# Specific collection
npm run migrate status characters
```

### Run Migration
```bash
# Test first (dry run)
npm run migrate run characters --dry-run

# Apply changes
npm run migrate run characters

# Migrate everything
npm run migrate run all
```

## How Validation Works

### Creating New Documents

**Strict validation** - all required fields must be present:

```javascript
POST /api/characters
{
  "name": "John Doe",
  "voiceId": "voice123"
  // Missing 'status' field
}

// ❌ Error: Field 'status' is required
```

### Updating Existing Documents

**Flexible validation** - only validates fields you're changing:

```javascript
PUT /api/characters/abc123
{
  "name": "Jane Doe"
  // Only updating name
}

// ✅ Success - other fields remain unchanged
```

This allows old documents to be updated even if they're missing new required fields!

### Version Warnings

When updating old documents, you'll get warnings:

```javascript
{
  "success": true,
  "data": { ... },
  "warnings": [
    "Document uses schema version 1.0 but current version is 1.1. Consider updating."
  ]
}
```

## Migration Examples

### Example 1: Add Optional Field

```javascript
// 1. Update schema
{
  name: 'email',
  type: 'string',
  required: false,  // Optional - safe!
  label: 'Email Address'
}

// 2. Increment version to 1.1

// 3. No migration needed! Old documents work fine without this field
```

### Example 2: Add Required Field with Default

```javascript
// 1. Update schema
{
  name: 'status',
  type: 'string',
  required: true,
  default: 'draft',  // Default value provided
  options: [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' }
  ]
}

// 2. Increment version to 1.1

// 3. Run migration - automatically adds 'draft' to old documents
npm run migrate run characters
```

### Example 3: Change Field Type

```javascript
// Old schema
{
  name: 'age',
  type: 'string'
}

// New schema with custom migration
{
  name: 'age',
  type: 'number'
}

// Create custom migration script:
// scripts/custom-migrations/convert-age-to-number.js

const { db } = require('../src/config/firebase');

async function convertAgeToNumber() {
  const snapshot = await db.collection('characters').get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.age && typeof data.age === 'string') {
      const ageNum = parseInt(data.age) || 0;
      batch.update(doc.ref, {
        age: ageNum,
        schemaVersion: '1.2',
        updatedAt: new Date().toISOString()
      });
    }
  });

  await batch.commit();
  console.log('Migration complete!');
}

convertAgeToNumber();
```

## Best Practices

### 1. Always Use Defaults for New Required Fields

```javascript
// ❌ Bad - breaks old documents
{
  name: 'priority',
  type: 'string',
  required: true
}

// ✅ Good - old documents get default value
{
  name: 'priority',
  type: 'string',
  required: true,
  default: 'medium'
}
```

### 2. Test Migrations First

```bash
# Always dry run first!
npm run migrate run characters --dry-run

# Review the output, then run for real
npm run migrate run characters
```

### 3. Increment Versions Incrementally

```javascript
// ❌ Bad - big jumps make it hard to track
version: '1.0' → version: '2.5'

// ✅ Good - clear progression
version: '1.0' → version: '1.1' → version: '1.2'
```

### 4. Document Your Changes

Keep a changelog:

```javascript
// src/schemas/character.schema.js

/**
 * Changelog:
 * - v1.0: Initial schema
 * - v1.1: Added 'status' field with default 'draft'
 * - v1.2: Added 'email' optional field
 */
const characterSchema = {
  version: '1.2',
  // ...
};
```

### 5. Communicate Breaking Changes

If you're working with a team, announce breaking changes:

```
🚨 BREAKING CHANGE: Character schema v1.3
- Added required field 'department'
- Migration required: npm run migrate run characters
- Estimated time: 30 seconds for ~1000 documents
```

## Troubleshooting

### "Field is required" on Updates

**Problem:** Updating old documents fails validation

**Solution:** The validator should allow this. Make sure you're using `isUpdate=true`:

```javascript
// In routes
const validation = validateData(TYPE, data, true);  // ← second param should be true
```

### Old Documents Show Warnings

**Problem:** Every update shows version mismatch warnings

**Solution:** Run migration to update all documents to latest version:

```bash
npm run migrate run characters
```

### Migration Fails Partway Through

**Problem:** Migration errors for some documents

**Solution:** Check the error output, fix those documents manually or with a custom script, then re-run migration.

## Summary

✅ **Safe to do anytime:**
- Add optional fields
- Add fields with defaults
- Relax validation
- Add dropdown options

⚠️ **Requires migration:**
- Add required fields (without defaults)
- Remove fields
- Change field types
- Stricter validation

🛠️ **Always:**
- Increment schema version
- Test with `--dry-run` first
- Document your changes
- Communicate breaking changes

Need help? Check existing schemas for examples or create a custom migration script.
