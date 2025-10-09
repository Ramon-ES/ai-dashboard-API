#!/usr/bin/env node

/**
 * Seed Demo Data Script
 *
 * Fills demo-company-001 with sample data for testing
 *
 * Usage:
 *   node scripts/seed-demo-data.js
 *   OR
 *   npm run seed-demo
 */

require('dotenv').config();
require('../src/config/firebase');

const { db } = require('../src/config/firebase');
const { v4: uuidv4 } = require('uuid');

const COMPANY_ID = 'demo-company-001';
const USER_ID = 'demo-user'; // You can change this to an actual user UID

const now = new Date().toISOString();

// Sample Characters
const characters = [
  {
    id: uuidv4(),
    name: 'Dr. Sarah Chen',
    description: 'A compassionate medical professional specializing in patient communication',
    voiceId: 'voice-female-professional',
    status: 'active',
    // Background
    age: 35,
    occupation: 'Medical Doctor',
    gender: 'Female',
    background: 'Dr. Chen has been practicing medicine for 10 years with a focus on patient-centered care. She believes in clear, empathetic communication.',
    // Behaviour
    ambitions: 'To improve healthcare outcomes through better doctor-patient relationships',
    generalBehaviour: 'Calm, patient, and thorough in explanations',
    // Personality
    personalityPreset: 'compassionate-professional',
    personalitySliders: {
      introvertExtrovert: 60,
      criticalCompassionate: 75,
      spontaneousOrganized: 80,
      sensitiveCalm: 70,
      conventionalImaginative: 45
    },
    personalityTraits: 'Empathetic, detail-oriented, excellent listener',
    // Language & Speech
    speakingStylePreset: 'clear-professional',
    speakingStyleSliders: {
      bluntEmpathic: 70,
      formalCasual: 60,
      elaborateConcise: 55,
      seriousPlayful: 40,
      passiveAssertive: 65
    },
    speakingStyleNotes: 'Uses medical terminology but explains it in layman terms',
    // Knowledge Bank
    knowledge: 'Expert in general medicine, patient communication, medical ethics',
    knowledgeFiles: [],
    // Meta
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Marcus Johnson',
    description: 'A friendly customer service representative with excellent problem-solving skills',
    voiceId: 'voice-male-friendly',
    status: 'active',
    age: 28,
    occupation: 'Customer Service Specialist',
    gender: 'Male',
    background: 'Marcus has 5 years of experience in customer service across retail and tech industries. Known for turning frustrated customers into loyal advocates.',
    ambitions: 'To become a customer experience manager and improve service standards',
    generalBehaviour: 'Upbeat, solution-focused, patient with difficult situations',
    personalityPreset: 'friendly-helper',
    personalitySliders: {
      introvertExtrovert: 75,
      criticalCompassionate: 80,
      spontaneousOrganized: 60,
      sensitiveCalm: 65,
      conventionalImaginative: 55
    },
    personalityTraits: 'Cheerful, resourceful, maintains positivity under pressure',
    speakingStylePreset: 'friendly-casual',
    speakingStyleSliders: {
      bluntEmpathic: 75,
      formalCasual: 70,
      elaborateConcise: 60,
      seriousPlayful: 65,
      passiveAssertive: 60
    },
    speakingStyleNotes: 'Uses positive language, mirrors customer tone, focuses on solutions',
    knowledge: 'Product knowledge, conflict resolution, CRM systems, customer psychology',
    knowledgeFiles: [],
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Professor Elena Rodriguez',
    description: 'An enthusiastic educator who makes complex topics accessible',
    voiceId: 'voice-female-educator',
    status: 'draft',
    age: 42,
    occupation: 'University Professor',
    gender: 'Female',
    background: 'Professor Rodriguez teaches environmental science with a passion for making learning interactive and engaging. She has won multiple teaching awards.',
    ambitions: 'To inspire the next generation of environmental scientists',
    generalBehaviour: 'Energetic, encouraging, adapts teaching style to student needs',
    personalityPreset: 'educator-enthusiast',
    personalitySliders: {
      introvertExtrovert: 70,
      criticalCompassionate: 65,
      spontaneousOrganized: 75,
      sensitiveCalm: 60,
      conventionalImaginative: 80
    },
    personalityTraits: 'Passionate, creative, excellent at analogies and examples',
    speakingStylePreset: 'engaging-educator',
    speakingStyleSliders: {
      bluntEmpathic: 60,
      formalCasual: 55,
      elaborateConcise: 70,
      seriousPlayful: 70,
      passiveAssertive: 65
    },
    speakingStyleNotes: 'Uses storytelling, asks thought-provoking questions, encourages participation',
    knowledge: 'Environmental science, pedagogy, climate change, sustainable practices',
    knowledgeFiles: [],
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  }
];

// Sample Dialogues
const dialogues = [
  {
    id: uuidv4(),
    name: 'Patient Consultation Scenario',
    description: 'A medical consultation where the doctor explains a diagnosis',
    // Purpose
    purposePreset: 'descriptive_feedback',
    dialogueContext: 'A patient visit where the doctor needs to explain test results and treatment options',
    dialoguePurpose: 'To practice delivering difficult medical news with empathy while ensuring patient understanding',
    // Character Roles
    roles: [
      {
        roleId: 'role-doctor',
        rolePreset: 'protagonist',
        roleDescription: 'The medical professional delivering information'
      },
      {
        roleId: 'role-patient',
        rolePreset: 'participant',
        roleDescription: 'The patient receiving information and asking questions'
      }
    ],
    // Feedback
    feedbackDescription: 'Evaluate clarity of explanation, empathy shown, and patient understanding',
    feedbackStyle: 'progressive',
    // Meta
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Customer Complaint Resolution',
    description: 'Handling an upset customer with a product issue',
    purposePreset: 'evaluative_feedback',
    dialogueContext: 'Customer calls in frustrated about a defective product they received',
    dialoguePurpose: 'To practice de-escalation techniques and problem-solving under pressure',
    roles: [
      {
        roleId: 'role-agent',
        rolePreset: 'protagonist',
        roleDescription: 'Customer service representative handling the complaint'
      },
      {
        roleId: 'role-customer',
        rolePreset: 'antagonist',
        roleDescription: 'Frustrated customer with a legitimate complaint'
      }
    ],
    feedbackDescription: 'Assess active listening, problem-solving approach, and customer satisfaction',
    feedbackStyle: 'immediate',
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Interactive Lecture on Climate Change',
    description: 'An engaging classroom discussion about environmental issues',
    purposePreset: 'suggestive_feedback',
    dialogueContext: 'A university class where students discuss climate solutions',
    dialoguePurpose: 'To practice facilitating discussions and encouraging critical thinking',
    roles: [
      {
        roleId: 'role-professor',
        rolePreset: 'guide',
        roleDescription: 'Professor facilitating the discussion'
      },
      {
        roleId: 'role-student',
        rolePreset: 'participant',
        roleDescription: 'Students contributing ideas and questions'
      }
    ],
    feedbackDescription: 'Evaluate engagement techniques, question quality, and knowledge transfer',
    feedbackStyle: 'summary',
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  }
];

// Sample Environments
const environments = [
  {
    id: uuidv4(),
    name: 'Modern Medical Office',
    description: 'A clean, well-lit medical examination room with comfortable seating',
    referenceId: 'env-medical-office-001',
    season: 'Spring',
    environmentType: 'indoor',
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Customer Service Call Center',
    description: 'A professional call center with multiple workstations and quiet background ambiance',
    referenceId: 'env-callcenter-001',
    season: 'Year-round',
    environmentType: 'commercial',
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'University Lecture Hall',
    description: 'A spacious lecture hall with tiered seating, large projector screen, and natural lighting',
    referenceId: 'env-lecture-hall-001',
    season: 'Fall',
    environmentType: 'indoor',
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Virtual Meeting Room',
    description: 'A modern virtual meeting space with screen sharing and collaboration tools',
    referenceId: 'env-virtual-meeting-001',
    season: 'Year-round',
    environmentType: 'virtual',
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  }
];

// Sample Scenarios (linking everything together)
const scenarios = [
  {
    id: uuidv4(),
    name: 'Medical Consultation Training',
    referenceId: 'scenario-medical-001',
    description: 'Practice delivering difficult medical news with empathy and clarity',
    dialogueId: dialogues[0].id,
    characterRoles: [
      {
        roleId: 'role-doctor',
        characterId: characters[0].id // Dr. Sarah Chen
      }
    ],
    environmentId: environments[0].id, // Medical Office
    playCount: 15,
    active: true,
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Customer Service Excellence',
    referenceId: 'scenario-cs-001',
    description: 'Master the art of turning upset customers into satisfied ones',
    dialogueId: dialogues[1].id,
    characterRoles: [
      {
        roleId: 'role-agent',
        characterId: characters[1].id // Marcus Johnson
      }
    ],
    environmentId: environments[1].id, // Call Center
    playCount: 23,
    active: true,
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  },
  {
    id: uuidv4(),
    name: 'Interactive Climate Education',
    referenceId: 'scenario-edu-001',
    description: 'Engage students in meaningful discussions about environmental challenges',
    dialogueId: dialogues[2].id,
    characterRoles: [
      {
        roleId: 'role-professor',
        characterId: characters[2].id // Professor Elena Rodriguez
      }
    ],
    environmentId: environments[2].id, // Lecture Hall
    playCount: 8,
    active: false,
    companyId: COMPANY_ID,
    createdBy: USER_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: '1.0'
  }
];

async function seedData() {
  console.log('\n🌱 Seeding Demo Data for demo-company-001...\n');
  console.log('='.repeat(80));

  try {
    // Seed Characters
    console.log('\n👥 Creating Characters...');
    for (const character of characters) {
      await db.collection('characters').doc(character.id).set(character);
      console.log(`  ✅ ${character.name} (${character.status})`);
    }

    // Seed Dialogues
    console.log('\n💬 Creating Dialogues...');
    for (const dialogue of dialogues) {
      await db.collection('dialogues').doc(dialogue.id).set(dialogue);
      console.log(`  ✅ ${dialogue.name}`);
    }

    // Seed Environments
    console.log('\n🏢 Creating Environments...');
    for (const environment of environments) {
      await db.collection('environments').doc(environment.id).set(environment);
      console.log(`  ✅ ${environment.name} (${environment.environmentType})`);
    }

    // Seed Scenarios
    console.log('\n🎬 Creating Scenarios...');
    for (const scenario of scenarios) {
      await db.collection('scenarios').doc(scenario.id).set(scenario);
      console.log(`  ✅ ${scenario.name} (${scenario.playCount} plays)`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Demo Data Seeded Successfully!\n');

    console.log('📊 Summary:');
    console.log(`  Characters: ${characters.length}`);
    console.log(`  Dialogues: ${dialogues.length}`);
    console.log(`  Environments: ${environments.length}`);
    console.log(`  Scenarios: ${scenarios.length}`);

    console.log('\n🧪 Test in API:');
    console.log('  GET /api/characters');
    console.log('  GET /api/scenarios');
    console.log('  GET /api/dashboard/stats\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
