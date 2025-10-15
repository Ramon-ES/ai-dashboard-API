#!/usr/bin/env node

/**
 * Update User Role Script
 *
 * Updates a user's role in Firestore
 *
 * Usage:
 *   node scripts/update-user-role.js <user-id> <role>
 *
 * Example:
 *   node scripts/update-user-role.js luHbVzo2vRfZO8CKrxFSYML40cf2 owner
 */

require('dotenv').config();
require('../src/config/firebase');

const { db } = require('../src/config/firebase');

const userId = process.argv[2];
const role = process.argv[3];

const validRoles = ['owner', 'admin', 'member', 'client'];

async function updateUserRole() {
  if (!userId || !role) {
    console.error('\n❌ Error: Missing arguments\n');
    console.log('Usage: node scripts/update-user-role.js <user-id> <role>');
    console.log('\nValid roles: owner, admin, member, client');
    console.log('\nExample:');
    console.log('  node scripts/update-user-role.js luHbVzo2vRfZO8CKrxFSYML40cf2 owner\n');
    process.exit(1);
  }

  if (!validRoles.includes(role)) {
    console.error(`\n❌ Error: Invalid role "${role}"`);
    console.log(`Valid roles: ${validRoles.join(', ')}\n`);
    process.exit(1);
  }

  try {
    console.log(`\n🔄 Updating user role...\n`);
    console.log(`User ID: ${userId}`);
    console.log(`New Role: ${role}`);
    console.log('='.repeat(80));

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error(`\n❌ Error: User with ID "${userId}" not found in Firestore`);
      console.log('\nMake sure the user has logged in at least once to create their user document.\n');
      process.exit(1);
    }

    const userData = userDoc.data();
    console.log(`\nCurrent user data:`);
    console.log(`  Email: ${userData.email || 'N/A'}`);
    console.log(`  Current Role: ${userData.role || 'none'}`);
    console.log(`  Company ID: ${userData.companyId || 'N/A'}`);

    // Update role
    await db.collection('users').doc(userId).update({
      role: role,
      updatedAt: new Date().toISOString(),
    });

    console.log(`\n✅ User role updated successfully!`);
    console.log(`\nNew user data:`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  New Role: ${role}`);
    console.log(`  Company ID: ${userData.companyId}`);

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Done! The user can now access endpoints requiring this role.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating user role:', error.message);
    process.exit(1);
  }
}

updateUserRole();
