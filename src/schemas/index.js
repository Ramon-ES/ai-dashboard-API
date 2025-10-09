const scenarioSchema = require('./scenario.schema');
const characterSchema = require('./character.schema');
const dialogueSchema = require('./dialogue.schema');
const environmentSchema = require('./environment.schema');

const schemas = {
  scenario: scenarioSchema,
  character: characterSchema,
  dialogue: dialogueSchema,
  environment: environmentSchema,
};

/**
 * Get schema by type
 */
const getSchema = (type) => {
  return schemas[type] || null;
};

/**
 * Get all available schema types
 */
const getSchemaTypes = () => {
  return Object.keys(schemas);
};

/**
 * Validate if a type exists
 */
const isValidType = (type) => {
  return schemas.hasOwnProperty(type);
};

module.exports = {
  schemas,
  getSchema,
  getSchemaTypes,
  isValidType,
};
