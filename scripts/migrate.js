#!/usr/bin/env node

/**
 * Migration CLI Tool
 *
 * Usage:
 *   npm run migrate status                           # Check migration status for all collections
 *   npm run migrate status characters                # Check status for specific collection
 *   npm run migrate run characters --dry-run         # Test migration without making changes
 *   npm run migrate run characters                   # Run migration for real
 *   npm run migrate run all                          # Migrate all collections
 */

require('dotenv').config();
require('../src/config/firebase');

const { migrateCollection, getMigrationStatus } = require('../src/utils/migrations');

const COLLECTIONS = ['scenarios', 'characters', 'dialogues', 'environments'];

const showHelp = () => {
  console.log(`
Migration CLI Tool

Usage:
  node scripts/migrate.js <command> [options]

Commands:
  status [collection]           Show migration status
  run <collection> [--dry-run]  Run migration

Examples:
  node scripts/migrate.js status
  node scripts/migrate.js status characters
  node scripts/migrate.js run characters --dry-run
  node scripts/migrate.js run characters
  node scripts/migrate.js run all

Collections: ${COLLECTIONS.join(', ')}
  `);
};

const showStatus = async (collection = null) => {
  const collections = collection ? [collection] : COLLECTIONS;

  console.log('\n📊 Migration Status Report\n');
  console.log('='.repeat(80));

  for (const coll of collections) {
    const status = await getMigrationStatus(coll);

    console.log(`\n${coll.toUpperCase()}`);
    console.log('-'.repeat(80));
    console.log(`Current Schema Version: ${status.currentSchemaVersion}`);
    console.log(`Total Documents: ${status.totalDocuments}`);
    console.log(`Needs Migration: ${status.needsMigration ? '⚠️  YES' : '✅ NO'}`);

    if (status.needsMigration) {
      console.log(`Outdated Documents: ${status.outdatedCount}`);
    }

    console.log('\nVersion Breakdown:');
    Object.entries(status.versionBreakdown).forEach(([version, count]) => {
      const isCurrent = version === status.currentSchemaVersion;
      console.log(`  ${isCurrent ? '✅' : '⚠️ '} v${version}: ${count} documents`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
};

const runMigration = async (collection, dryRun = false) => {
  if (collection === 'all') {
    console.log(`\n🚀 Migrating all collections ${dryRun ? '(DRY RUN)' : ''}...\n`);

    for (const coll of COLLECTIONS) {
      await migrateCollection(coll, null, dryRun);
    }
  } else {
    if (!COLLECTIONS.includes(collection)) {
      console.error(`\n❌ Unknown collection: ${collection}`);
      console.log(`Available collections: ${COLLECTIONS.join(', ')}\n`);
      process.exit(1);
    }

    await migrateCollection(collection, null, dryRun);
  }

  if (dryRun) {
    console.log('\n💡 This was a dry run. No changes were made.');
    console.log('Remove --dry-run flag to apply changes.\n');
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];
  const isDryRun = args.includes('--dry-run');

  if (!command || command === 'help') {
    showHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'status':
        await showStatus(param);
        break;

      case 'run':
        if (!param) {
          console.error('\n❌ Please specify a collection or "all"\n');
          showHelp();
          process.exit(1);
        }
        await runMigration(param, isDryRun);
        break;

      default:
        console.error(`\n❌ Unknown command: ${command}\n`);
        showHelp();
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

main();
