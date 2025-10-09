const dialogueSchema = {
  type: 'dialogue',
  version: '1.0',
  collection: 'dialogues',
  sections: [
    {
      name: 'purpose',
      label: 'Purpose',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          label: 'Dialogue Name',
          description: 'Name of the dialogue',
          validation: {
            minLength: 1,
            maxLength: 200,
          },
        },
        {
          name: 'description',
          type: 'text',
          required: false,
          label: 'Description',
          description: 'Brief description of the dialogue',
          validation: {
            maxLength: 1000,
          },
        },
        {
          name: 'purposePreset',
          type: 'select',
          required: false,
          label: 'Purpose Preset',
          description: 'Predefined purpose preset',
          options: [
            { value: 'correct_feedback', label: 'Correct Feedback' },
            { value: 'incorrect_feedback', label: 'Incorrect Feedback' },
            { value: 'descriptive_feedback', label: 'Descriptive Feedback' },
            { value: 'evaluative_feedback', label: 'Evaluative Feedback' },
            { value: 'suggestive_feedback', label: 'Suggestive Feedback' },
            { value: 'incomplete_feedback', label: 'Incomplete Feedback' },
            { value: 'right_wrong_feedback', label: 'Right/Wrong Feedback' },
            { value: 'percentage_feedback', label: 'Percentage Feedback' },
          ],
        },
        {
          name: 'dialogueContext',
          type: 'text',
          required: false,
          label: 'Dialogue Context',
          description: 'Context for the dialogue',
          validation: {
            maxLength: 3000,
          },
        },
        {
          name: 'dialoguePurpose',
          type: 'text',
          required: false,
          label: 'Dialogue Purpose',
          description: 'Purpose of the dialogue',
          validation: {
            maxLength: 3000,
          },
        },
      ],
    },
    {
      name: 'characterRoles',
      label: 'Character Roles',
      fields: [
        {
          name: 'roles',
          type: 'array',
          itemType: 'object',
          required: false,
          label: 'Roles',
          description: 'Character roles in this dialogue',
          schema: {
            roleId: {
              type: 'string',
              required: true,
              label: 'Role ID',
              description: 'Unique identifier for this role',
            },
            rolePreset: {
              type: 'select',
              required: false,
              label: 'Role Preset',
              description: 'Predefined role type',
              options: [
                { value: 'protagonist', label: 'Protagonist' },
                { value: 'antagonist', label: 'Antagonist' },
                { value: 'guide', label: 'Guide' },
                { value: 'mentor', label: 'Mentor' },
                { value: 'observer', label: 'Observer' },
                { value: 'participant', label: 'Participant' },
              ],
            },
            roleDescription: {
              type: 'text',
              required: false,
              label: 'Role Description',
              description: 'Description of this role',
              validation: {
                maxLength: 1000,
              },
            },
          },
        },
      ],
    },
    {
      name: 'feedback',
      label: 'Feedback',
      fields: [
        {
          name: 'feedbackDescription',
          type: 'text',
          required: false,
          label: 'Feedback Description',
          description: 'Description of the feedback approach',
          validation: {
            maxLength: 2000,
          },
        },
        {
          name: 'feedbackStyle',
          type: 'select',
          required: false,
          label: 'Feedback Style',
          description: 'Style of feedback delivery',
          options: [
            { value: 'immediate', label: 'Immediate' },
            { value: 'delayed', label: 'Delayed' },
            { value: 'progressive', label: 'Progressive' },
            { value: 'summary', label: 'Summary' },
          ],
        },
      ],
    },
  ],
  // Flat fields for list view and metadata
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

module.exports = dialogueSchema;
