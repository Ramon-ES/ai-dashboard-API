const characterSchema = {
  type: 'character',
  version: '1.0',
  collection: 'characters',
  sections: [
    {
      name: 'background',
      label: 'Background',
      fields: [
        {
          name: 'image',
          type: 'file',
          required: false,
          label: 'Character Image',
          description: 'Image of the character',
          fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maxSize: 5242880, // 5MB
        },
        {
          name: 'name',
          type: 'string',
          required: true,
          label: 'Name',
          description: 'Character name',
          validation: {
            minLength: 1,
            maxLength: 200,
          },
        },
        {
          name: 'age',
          type: 'number',
          required: false,
          label: 'Age',
          description: 'Character age',
          validation: {
            min: 0,
            max: 200,
          },
        },
        {
          name: 'occupation',
          type: 'string',
          required: false,
          label: 'Occupation',
          description: 'Character occupation',
          validation: {
            maxLength: 200,
          },
        },
        {
          name: 'gender',
          type: 'string',
          required: false,
          label: 'Gender',
          description: 'Character gender',
          validation: {
            maxLength: 100,
          },
        },
        {
          name: 'background',
          type: 'text',
          required: false,
          label: 'Background',
          description: 'Character background story',
          validation: {
            maxLength: 5000,
          },
        },
      ],
    },
    {
      name: 'behaviour',
      label: 'Behaviour',
      fields: [
        {
          name: 'ambitions',
          type: 'text',
          required: false,
          label: 'Ambitions',
          description: 'Character ambitions',
          validation: {
            maxLength: 2000,
          },
        },
        {
          name: 'generalBehaviour',
          type: 'text',
          required: false,
          label: 'General Behaviour',
          description: 'General behaviour description',
          validation: {
            maxLength: 2000,
          },
        },
      ],
    },
    {
      name: 'personality',
      label: 'Personality',
      fields: [
        {
          name: 'personalityPreset',
          type: 'select',
          required: false,
          label: 'Personality Preset',
          description: 'Predefined personality preset',
          options: [],
        },
        {
          name: 'personalitySliders',
          type: 'object',
          required: false,
          label: 'Personality Traits',
          description: 'Personality trait sliders',
          schema: {
            introvertExtrovert: {
              type: 'number',
              label: 'Introvert ← → Extrovert',
              min: 0,
              max: 100,
              default: 50,
            },
            criticalCompassionate: {
              type: 'number',
              label: 'Critical ← → Compassionate',
              min: 0,
              max: 100,
              default: 50,
            },
            spontaneousOrganized: {
              type: 'number',
              label: 'Spontaneous ← → Organized',
              min: 0,
              max: 100,
              default: 50,
            },
            sensitiveCalm: {
              type: 'number',
              label: 'Sensitive ← → Calm',
              min: 0,
              max: 100,
              default: 50,
            },
            conventionalImaginative: {
              type: 'number',
              label: 'Conventional ← → Imaginative',
              min: 0,
              max: 100,
              default: 50,
            },
          },
        },
        {
          name: 'personalityTraits',
          type: 'text',
          required: false,
          label: 'Additional Personality Traits',
          description: 'Extra personality traits description',
          validation: {
            maxLength: 2000,
          },
        },
      ],
    },
    {
      name: 'languageAndSpeech',
      label: 'Language & Speech',
      fields: [
        {
          name: 'voiceId',
          type: 'select',
          required: true,
          label: 'Voice',
          description: 'ElevenLabs voice selection',
          options: [],
        },
        {
          name: 'speakingStylePreset',
          type: 'select',
          required: false,
          label: 'Speaking Style Preset',
          description: 'Predefined speaking style',
          options: [],
        },
        {
          name: 'speakingStyleSliders',
          type: 'object',
          required: false,
          label: 'Speaking Style',
          description: 'Speaking style sliders',
          schema: {
            bluntEmpathic: {
              type: 'number',
              label: 'Blunt ← → Empathic',
              min: 0,
              max: 100,
              default: 50,
            },
            formalCasual: {
              type: 'number',
              label: 'Formal ← → Casual',
              min: 0,
              max: 100,
              default: 50,
            },
            elaborateConcise: {
              type: 'number',
              label: 'Elaborate ← → Concise',
              min: 0,
              max: 100,
              default: 50,
            },
            seriousPlayful: {
              type: 'number',
              label: 'Serious ← → Playful',
              min: 0,
              max: 100,
              default: 50,
            },
            passiveAssertive: {
              type: 'number',
              label: 'Passive ← → Assertive',
              min: 0,
              max: 100,
              default: 50,
            },
          },
        },
        {
          name: 'speakingStyleNotes',
          type: 'text',
          required: false,
          label: 'Additional Speaking Style Notes',
          description: 'Extra notes on speaking style',
          validation: {
            maxLength: 2000,
          },
        },
      ],
    },
    {
      name: 'characterBuilder',
      label: 'Character Builder',
      fields: [
        // Placeholder for future fields
      ],
    },
    {
      name: 'knowledgeBank',
      label: 'Knowledge Bank',
      fields: [
        {
          name: 'knowledge',
          type: 'text',
          required: false,
          label: 'Character Knowledge',
          description: 'Knowledge base for the character',
          validation: {
            maxLength: 10000,
          },
        },
        {
          name: 'knowledgeFiles',
          type: 'array',
          itemType: 'file',
          required: false,
          label: 'Knowledge Files',
          description: 'Files containing character knowledge',
          fileTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          maxSize: 10485760, // 10MB per file
        },
      ],
    },
  ],
  // Flat fields for list view
  listFields: [
    {
      name: 'id',
      type: 'string',
      required: true,
      generated: true,
      editable: false,
    },
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      required: false,
      label: 'Description',
      description: 'Brief description for list view',
      validation: {
        maxLength: 500,
      },
    },
    {
      name: 'voiceId',
      type: 'string',
      required: true,
      label: 'Voice ID',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Status',
      default: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      name: 'companyId',
      type: 'string',
      required: true,
      generated: true,
      editable: false,
    },
    {
      name: 'createdBy',
      type: 'string',
      required: true,
      generated: true,
      editable: false,
    },
    {
      name: 'createdAt',
      type: 'timestamp',
      required: true,
      generated: true,
      editable: false,
    },
    {
      name: 'updatedAt',
      type: 'timestamp',
      required: true,
      generated: true,
      editable: false,
    },
    {
      name: 'updatedBy',
      type: 'string',
      required: false,
      generated: true,
      editable: false,
    },
  ],
};

module.exports = characterSchema;
