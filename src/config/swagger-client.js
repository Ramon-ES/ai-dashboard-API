const swaggerJsdoc = require('swagger-jsdoc');

// Client-facing documentation (public API for external clients)
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Dashboard API - Client Documentation',
      version: '1.0.0',
      description: 'Public API for external clients to retrieve scenarios, characters, dialogues, and environments',
      contact: {
        name: 'API Support',
        email: 'ramon.hoffman@enversedstudios.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3004',
        description: 'Development server',
      },
      {
        url: 'https://webplatform.enversedstudios.com/ai-dashboard',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token obtained from /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            uid: {
              type: 'string',
              example: 'user-123',
            },
            email: {
              type: 'string',
              example: 'user@company.com',
            },
            role: {
              type: 'string',
              enum: ['viewer', 'editor', 'admin'],
              example: 'editor',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['read', 'write', 'admin'],
              },
            },
            companyId: {
              type: 'string',
              example: 'company-123',
            },
          },
        },
        Scenario: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'scenario-abc123',
            },
            name: {
              type: 'string',
              example: 'Customer Service Training',
            },
            description: {
              type: 'string',
              example: 'Handle an upset customer scenario',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              example: 'published',
            },
            dialogueId: {
              type: 'string',
              example: 'dialogue-xyz',
            },
            environmentId: {
              type: 'string',
              example: 'env-retail',
            },
            characterRoles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  roleId: {
                    type: 'string',
                  },
                  characterId: {
                    type: 'string',
                  },
                },
              },
            },
            image: {
              type: 'string',
              example: 'https://storage.googleapis.com/...',
            },
            companyId: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Character: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'char-123',
            },
            name: {
              type: 'string',
              example: 'Sarah - Customer Service Rep',
            },
            description: {
              type: 'string',
              example: 'Friendly and professional service representative',
            },
            voiceId: {
              type: 'string',
              example: 'voice-female-01',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
            },
            personality: {
              type: 'string',
              example: 'Empathetic, patient, solution-oriented',
            },
            image: {
              type: 'string',
            },
            knowledgeFiles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                  },
                  fileName: {
                    type: 'string',
                  },
                },
              },
            },
            companyId: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Dialogue: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
            },
            nodes: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            companyId: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Environment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
            },
            ambientAudio: {
              type: 'string',
            },
            image: {
              type: 'string',
            },
            companyId: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Login and token management',
      },
      {
        name: 'Scenarios',
        description: 'View training scenarios and their details',
      },
      {
        name: 'Characters',
        description: 'View AI characters',
      },
      {
        name: 'Dialogues',
        description: 'View conversation flows',
      },
      {
        name: 'Environments',
        description: 'View virtual environments',
      },
    ],
  },
  // Only include client-facing endpoints (read-only)
  apis: [
    `${__dirname}/../docs/client-endpoints.js`,
  ],
};

const swaggerSpecClient = swaggerJsdoc(options);

module.exports = swaggerSpecClient;
