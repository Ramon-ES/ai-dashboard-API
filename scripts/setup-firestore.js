#!/usr/bin/env node

/**
 * Firestore Setup Script
 *
 * Automatically sets up Firestore collections and indexes based on your schemas.
 * This script is safe to run multiple times - it won't overwrite existing data.
 *
 * Usage:
 *   npm run setup-firestore
 */

require('dotenv').config();
require('../src/config/firebase');

const { db } = require('../src/config/firebase');
const { getSchemaTypes } = require('../src/schemas');

const setupCollections = async () => {
  console.log('\n🔧 Setting up Firestore collections...\n');
  console.log('='.repeat(80));

  const schemaTypes = getSchemaTypes();
  const collections = schemaTypes.map(type => `${type}s`); // Add 's' for plural

  // Add additional required collections
  const additionalCollections = ['users', 'companies', 'activities', 'apiKeys'];
  const allCollections = [...collections, ...additionalCollections];

  console.log('\n📁 Collections to initialize:');
  allCollections.forEach(coll => console.log(`  - ${coll}`));

  // Check which collections already exist
  console.log('\n🔍 Checking existing collections...\n');

  for (const collectionName of allCollections) {
    const snapshot = await db.collection(collectionName).limit(1).get();

    if (snapshot.empty) {
      console.log(`✨ ${collectionName}: Creating collection (empty)`);
      // Firestore creates collections automatically when you add a document
      // We'll create a placeholder doc and delete it to initialize the collection
      const placeholderRef = db.collection(collectionName).doc('_placeholder');
      await placeholderRef.set({
        _placeholder: true,
        createdAt: new Date().toISOString()
      });
      await placeholderRef.delete();
      console.log(`   ✅ ${collectionName}: Initialized`);
    } else {
      console.log(`✓ ${collectionName}: Already exists (${snapshot.size} documents)`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Firestore collections setup complete!\n');
};

const createSampleCompany = async () => {
  console.log('\n👥 Creating sample company (if needed)...\n');

  const companiesSnapshot = await db.collection('companies').limit(1).get();

  if (companiesSnapshot.empty) {
    const companyId = 'demo-company-001';

    await db.collection('companies').doc(companyId).set({
      id: companyId,
      name: 'Demo Company',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Created demo company:', companyId);
    console.log('   You can use this company ID when creating your first user.\n');

    return companyId;
  } else {
    console.log('✓ Companies already exist. Skipping sample company creation.\n');
    return null;
  }
};

const showNextSteps = (demoCompanyId) => {
  console.log('\n📋 Next Steps:\n');
  console.log('='.repeat(80));

  console.log('\n1. Create your first user in Firebase Authentication:');
  console.log('   - Go to Firebase Console → Authentication');
  console.log('   - Add a user with email/password');
  console.log('   - Copy the user UID\n');

  console.log('2. Create a user document in Firestore:');
  console.log('   - Go to Firestore → users collection');
  console.log('   - Create a document with ID = user UID');
  console.log('   - Add these fields:\n');

  if (demoCompanyId) {
    console.log(`   {
     "uid": "your-user-uid",
     "email": "your-email@example.com",
     "companyId": "${demoCompanyId}",
     "role": "admin",
     "permissions": ["read", "write", "admin"],
     "createdAt": "${new Date().toISOString()}"
   }\n`);
  } else {
    console.log(`   {
     "uid": "your-user-uid",
     "email": "your-email@example.com",
     "companyId": "your-company-id",
     "role": "admin",
     "permissions": ["read", "write", "admin"],
     "createdAt": "${new Date().toISOString()}"
   }\n`);
  }

  console.log('3. (Optional) Create an API key for external applications:');
  console.log('   - Go to Firestore → apiKeys collection');
  console.log('   - Create a document with a unique ID');
  console.log('   - Add these fields:\n');

  if (demoCompanyId) {
    console.log(`   {
     "key": "your-secret-api-key-here",
     "companyId": "${demoCompanyId}",
     "active": true,
     "permissions": ["read", "write"],
     "name": "External App",
     "createdAt": "${new Date().toISOString()}"
   }\n`);
  } else {
    console.log(`   {
     "key": "your-secret-api-key-here",
     "companyId": "your-company-id",
     "active": true,
     "permissions": ["read", "write"],
     "name": "External App",
     "createdAt": "${new Date().toISOString()}"
   }\n`);
  }

  console.log('4. Start the API server:');
  console.log('   npm run dev\n');

  console.log('5. Test the API:');
  console.log('   curl http://localhost:3000/health\n');

  console.log('='.repeat(80));
  console.log('\n💡 Tip: See README.md for full authentication setup instructions.\n');
};

const setupIndexes = async () => {
  console.log('\n📊 Recommended Firestore Indexes:\n');
  console.log('='.repeat(80));

  console.log('\nThe following composite indexes are recommended for better performance:');
  console.log('(You may need to create these manually in Firebase Console)\n');

  const indexes = [
    {
      collection: 'scenarios',
      fields: ['companyId', 'createdAt'],
      reason: 'List scenarios by company, sorted by creation date'
    },
    {
      collection: 'characters',
      fields: ['companyId', 'createdAt'],
      reason: 'List characters by company, sorted by creation date'
    },
    {
      collection: 'dialogues',
      fields: ['companyId', 'createdAt'],
      reason: 'List dialogues by company, sorted by creation date'
    },
    {
      collection: 'environments',
      fields: ['companyId', 'createdAt'],
      reason: 'List environments by company, sorted by creation date'
    },
    {
      collection: 'activities',
      fields: ['companyId', 'timestamp'],
      reason: 'Recent activity tracking'
    }
  ];

  indexes.forEach((index, i) => {
    console.log(`${i + 1}. ${index.collection}:`);
    console.log(`   Fields: ${index.fields.join(', ')}`);
    console.log(`   Reason: ${index.reason}\n`);
  });

  console.log('💡 Firestore will prompt you to create these indexes when needed.');
  console.log('   Click the link in the error message to auto-create them.\n');

  console.log('='.repeat(80));
};

const main = async () => {
  try {
    console.log('\n🚀 Firestore Setup Wizard\n');

    // Step 1: Setup collections
    await setupCollections();

    // Step 2: Create sample company
    const demoCompanyId = await createSampleCompany();

    // Step 3: Show index recommendations
    await setupIndexes();

    // Step 4: Show next steps
    showNextSteps(demoCompanyId);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

main();
