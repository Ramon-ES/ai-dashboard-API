const { db } = require('../config/firebase');
const { getSchema } = require('../schemas');

/**
 * Migration utilities for schema evolution
 *
 * When you need to make breaking schema changes:
 * 1. Increment the schema version
 * 2. Add a migration function here
 * 3. Run the migration script
 */

/**
 * Apply default values for new required fields
 * This helps when you add a new required field to an existing schema
 */
const applyDefaults = (data, schema) => {
  const updated = { ...data };
  let modified = false;

  const allFields = [];
  if (schema.sections) {
    schema.sections.forEach(section => allFields.push(...section.fields));
  }
  if (schema.fields) {
    allFields.push(...schema.fields);
  }
  if (schema.listFields) {
    allFields.push(...schema.listFields);
  }

  allFields.forEach(field => {
    // If field has a default and is missing from data
    if (field.default !== undefined && (data[field.name] === undefined || data[field.name] === null)) {
      updated[field.name] = field.default;
      modified = true;
    }

    // Add empty values for required fields that are missing
    if (field.required && (data[field.name] === undefined || data[field.name] === null)) {
      switch (field.type) {
        case 'string':
        case 'text':
          updated[field.name] = '';
          break;
        case 'number':
          updated[field.name] = 0;
          break;
        case 'boolean':
          updated[field.name] = false;
          break;
        case 'array':
          updated[field.name] = [];
          break;
        case 'object':
          updated[field.name] = {};
          break;
      }
      modified = true;
    }
  });

  return { updated, modified };
};

/**
 * Migrate a single document to the latest schema version
 */
const migrateDocument = async (collectionName, docId, dryRun = false) => {
  const docRef = db.collection(collectionName).doc(docId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return { success: false, error: 'Document not found' };
  }

  const data = doc.data();
  const schema = getSchema(collectionName.slice(0, -1)); // Remove 's' from collection name

  if (!schema) {
    return { success: false, error: 'Schema not found' };
  }

  const currentVersion = data.schemaVersion || '1.0';
  const targetVersion = schema.version;

  // Already up to date
  if (currentVersion === targetVersion) {
    return {
      success: true,
      message: 'Already at latest version',
      version: currentVersion
    };
  }

  // Apply defaults for missing fields
  const { updated, modified } = applyDefaults(data, schema);

  if (!modified) {
    // Just update version number
    if (!dryRun) {
      await docRef.update({
        schemaVersion: targetVersion,
        updatedAt: new Date().toISOString()
      });
    }
    return {
      success: true,
      message: 'Version updated (no data changes needed)',
      from: currentVersion,
      to: targetVersion,
      dryRun
    };
  }

  // Apply updates
  if (!dryRun) {
    await docRef.update({
      ...updated,
      schemaVersion: targetVersion,
      updatedAt: new Date().toISOString()
    });
  }

  return {
    success: true,
    message: 'Document migrated successfully',
    from: currentVersion,
    to: targetVersion,
    changes: Object.keys(updated).filter(key => updated[key] !== data[key]),
    dryRun
  };
};

/**
 * Migrate all documents in a collection
 */
const migrateCollection = async (collectionName, companyId = null, dryRun = false) => {
  let query = db.collection(collectionName);

  // Optionally filter by company
  if (companyId) {
    query = query.where('companyId', '==', companyId);
  }

  const snapshot = await query.get();
  const results = [];

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Migrating ${snapshot.size} documents in ${collectionName}...`);

  for (const doc of snapshot.docs) {
    const result = await migrateDocument(collectionName, doc.id, dryRun);
    results.push({
      id: doc.id,
      name: doc.data().name,
      ...result
    });

    if (result.success) {
      console.log(`✓ ${doc.id}: ${result.message}`);
      if (result.changes) {
        console.log(`  Changed fields: ${result.changes.join(', ')}`);
      }
    } else {
      console.log(`✗ ${doc.id}: ${result.error}`);
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Migration complete: ${successful} successful, ${failed} failed\n`);

  return {
    success: failed === 0,
    total: results.length,
    successful,
    failed,
    results
  };
};

/**
 * Get migration status for a collection
 */
const getMigrationStatus = async (collectionName, companyId = null) => {
  let query = db.collection(collectionName);

  if (companyId) {
    query = query.where('companyId', '==', companyId);
  }

  const snapshot = await query.get();
  const schema = getSchema(collectionName.slice(0, -1));
  const currentVersion = schema?.version || '1.0';

  const versions = {};
  snapshot.forEach(doc => {
    const version = doc.data().schemaVersion || '1.0';
    versions[version] = (versions[version] || 0) + 1;
  });

  const needsMigration = Object.keys(versions).some(v => v !== currentVersion);

  return {
    collection: collectionName,
    currentSchemaVersion: currentVersion,
    totalDocuments: snapshot.size,
    versionBreakdown: versions,
    needsMigration,
    outdatedCount: Object.entries(versions)
      .filter(([v]) => v !== currentVersion)
      .reduce((sum, [, count]) => sum + count, 0)
  };
};

module.exports = {
  migrateDocument,
  migrateCollection,
  getMigrationStatus,
  applyDefaults
};
