const environmentSchema = {
  type: 'environment',
  version: '1.0',
  collection: 'environments',
  sections: [
    {
      name: 'generalInfo',
      label: 'General Information',
      fields: [
        {
          name: 'image',
          type: 'file',
          required: false,
          label: 'Environment Image',
          description: 'Image of the environment',
          fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maxSize: 5242880, // 5MB
        },
        {
          name: 'name',
          type: 'string',
          required: true,
          label: 'Name',
          description: 'Environment name',
          validation: {
            minLength: 1,
            maxLength: 200,
          },
        },
        {
          name: 'referenceId',
          type: 'string',
          required: true,
          label: 'Reference ID',
          description: 'User-editable reference identifier',
          validation: {
            minLength: 1,
            maxLength: 100,
            pattern: '^[a-zA-Z0-9_-]+$',
          },
        },
        {
          name: 'season',
          type: 'string',
          required: false,
          label: 'Season',
          description: 'Season setting (can be preset or custom)',
          suggestions: ['Spring', 'Summer', 'Fall', 'Winter'],
          validation: {
            maxLength: 100,
          },
        },
        {
          name: 'environmentType',
          type: 'select',
          required: false,
          label: 'Environment Type',
          description: 'Type of environment',
          options: [
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
            { value: 'virtual', label: 'Virtual' },
            { value: 'mixed', label: 'Mixed Reality' },
            { value: 'urban', label: 'Urban' },
            { value: 'rural', label: 'Rural' },
            { value: 'natural', label: 'Natural' },
            { value: 'industrial', label: 'Industrial' },
            { value: 'residential', label: 'Residential' },
            { value: 'commercial', label: 'Commercial' },
          ],
        },
        {
          name: 'description',
          type: 'text',
          required: false,
          label: 'Environment Description',
          description: 'Detailed description of the environment',
          validation: {
            maxLength: 3000,
          },
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

module.exports = environmentSchema;
