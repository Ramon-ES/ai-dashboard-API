#!/usr/bin/env node

/**
 * Reset Analytics Script
 *
 * Deletes all API usage logs from Firestore
 *
 * Usage:
 *   node scripts/reset-analytics.js
 *
 * WARNING: This will permanently delete all analytics data!
 */

require('dotenv').config();
require('../src/config/firebase');

const { db } = require('../src/config/firebase');

async function resetAnalytics() {
  console.log('\n⚠️  WARNING: This will delete ALL analytics data!\n');
  console.log('Press Ctrl+C to cancel...\n');

  // Wait 3 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🗑️  Deleting analytics logs...\n');
  console.log('='.repeat(80));

  try {
    const collectionRef = db.collection('api_usage_logs');

    // Get all documents in batches
    let deletedCount = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch of 500 documents
      const snapshot = await collectionRef.limit(500).get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      // Delete documents in batch
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      console.log(`Deleted ${deletedCount} logs...`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Successfully deleted ${deletedCount} analytics logs`);
    console.log('\nAll analytics statistics have been reset.');
    console.log('New logs will be created as API requests are made.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error resetting analytics:', error.message);
    process.exit(1);
  }
}

resetAnalytics();
