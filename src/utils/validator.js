const { getSchema } = require('../schemas');

/**
 * Validate data against a schema
 *
 * Validation Strategy:
 * - NEW DOCUMENTS (isUpdate=false): Strict validation - all required fields must be present
 * - UPDATES (isUpdate=true): Flexible validation - only validate fields that are being changed
 *   This allows schema evolution without breaking existing data
 *
 * @param {string} type - Schema type (scenario, character, etc.)
 * @param {object} data - Data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @param {object} existingData - Existing document data (for updates, optional)
 * @returns {object} { valid: boolean, errors: string[], warnings: string[] }
 */
const validateData = (type, data, isUpdate = false, existingData = null) => {
  const schema = getSchema(type);
  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown schema type: ${type}`],
      warnings: [],
    };
  }

  const errors = [];
  const warnings = [];
  let allFields = [];

  // Collect all fields from schema (handle both flat fields and sectioned fields)
  if (schema.sections) {
    schema.sections.forEach((section) => {
      allFields = allFields.concat(section.fields);
    });
  }
  if (schema.fields) {
    allFields = allFields.concat(schema.fields);
  }
  if (schema.listFields) {
    allFields = allFields.concat(schema.listFields);
  }

  // Remove duplicates based on field name
  const fieldMap = new Map();
  allFields.forEach((field) => {
    if (!fieldMap.has(field.name)) {
      fieldMap.set(field.name, field);
    }
  });
  allFields = Array.from(fieldMap.values());

  // Check for schema version mismatch (warn if document has old version)
  if (isUpdate && existingData?.schemaVersion && existingData.schemaVersion !== schema.version) {
    warnings.push(
      `Document uses schema version ${existingData.schemaVersion} but current version is ${schema.version}. Consider updating.`
    );
  }

  // Validate each field
  allFields.forEach((field) => {
    const value = data[field.name];
    const fieldName = field.name;

    // Skip generated/non-editable fields for validation
    if (field.generated && field.editable === false) {
      return;
    }

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      if (isUpdate) {
        // For updates: Only require if field is being explicitly set to null/undefined
        // Allow missing fields - they already exist in the database
        if (data.hasOwnProperty(field.name)) {
          errors.push(`Field '${fieldName}' is required and cannot be set to empty`);
        }
        // If field is not in the update data at all, that's OK - we're not changing it
        return;
      } else {
        // For new documents: Strictly require the field
        errors.push(`Field '${fieldName}' is required`);
        return;
      }
    }

    // Skip further validation if field is not present (allowed for optional fields and updates)
    if (value === undefined || value === null) {
      return;
    }

    // Type-specific validation
    switch (field.type) {
      case 'string':
      case 'text':
        if (typeof value !== 'string') {
          errors.push(`Field '${fieldName}' must be a string`);
        } else if (field.validation) {
          if (field.validation.minLength && value.length < field.validation.minLength) {
            errors.push(`Field '${fieldName}' must be at least ${field.validation.minLength} characters`);
          }
          if (field.validation.maxLength && value.length > field.validation.maxLength) {
            errors.push(`Field '${fieldName}' must be at most ${field.validation.maxLength} characters`);
          }
          if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
            errors.push(`Field '${fieldName}' does not match required pattern`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push(`Field '${fieldName}' must be a number`);
        } else if (field.validation) {
          if (field.validation.min !== undefined && value < field.validation.min) {
            errors.push(`Field '${fieldName}' must be at least ${field.validation.min}`);
          }
          if (field.validation.max !== undefined && value > field.validation.max) {
            errors.push(`Field '${fieldName}' must be at most ${field.validation.max}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field '${fieldName}' must be a boolean`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field '${fieldName}' must be an array`);
        } else if (field.validation) {
          if (field.validation.minItems && value.length < field.validation.minItems) {
            errors.push(`Field '${fieldName}' must have at least ${field.validation.minItems} items`);
          }
          if (field.validation.maxItems && value.length > field.validation.maxItems) {
            errors.push(`Field '${fieldName}' must have at most ${field.validation.maxItems} items`);
          }
        }
        // Validate array items if schema is provided
        if (Array.isArray(value) && field.itemType === 'object' && field.schema) {
          value.forEach((item, index) => {
            const itemErrors = validateObjectAgainstSchema(item, field.schema, `${fieldName}[${index}]`);
            errors.push(...itemErrors);
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`Field '${fieldName}' must be an object`);
        } else if (field.schema) {
          const objectErrors = validateObjectAgainstSchema(value, field.schema, fieldName);
          errors.push(...objectErrors);
        }
        break;

      case 'reference':
        if (typeof value !== 'string') {
          errors.push(`Field '${fieldName}' must be a string (reference ID)`);
        }
        break;

      case 'file':
        // File validation handled separately during upload
        break;

      case 'timestamp':
        // Timestamps are auto-generated
        break;

      case 'select':
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map((opt) => opt.value);
          if (!validValues.includes(value)) {
            errors.push(`Field '${fieldName}' must be one of: ${validValues.join(', ')}`);
          }
        }
        break;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate an object against a sub-schema
 */
const validateObjectAgainstSchema = (obj, schema, fieldPrefix = '') => {
  const errors = [];

  Object.keys(schema).forEach((key) => {
    const fieldDef = schema[key];
    const value = obj[key];
    const fullFieldName = fieldPrefix ? `${fieldPrefix}.${key}` : key;

    if (fieldDef.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${fullFieldName}' is required`);
      return;
    }

    if (value === undefined || value === null) {
      return;
    }

    // Type validation
    switch (fieldDef.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${fullFieldName}' must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          errors.push(`Field '${fullFieldName}' must be a number`);
        } else {
          if (fieldDef.min !== undefined && value < fieldDef.min) {
            errors.push(`Field '${fullFieldName}' must be at least ${fieldDef.min}`);
          }
          if (fieldDef.max !== undefined && value > fieldDef.max) {
            errors.push(`Field '${fullFieldName}' must be at most ${fieldDef.max}`);
          }
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field '${fullFieldName}' must be a boolean`);
        }
        break;
      case 'reference':
        if (typeof value !== 'string') {
          errors.push(`Field '${fullFieldName}' must be a string (reference ID)`);
        }
        break;
    }
  });

  return errors;
};

/**
 * Sanitize data by removing non-editable and generated fields (for updates)
 */
const sanitizeData = (type, data) => {
  const schema = getSchema(type);
  if (!schema) {
    return data;
  }

  const sanitized = { ...data };
  let allFields = [];

  // Collect all fields
  if (schema.sections) {
    schema.sections.forEach((section) => {
      allFields = allFields.concat(section.fields);
    });
  }
  if (schema.fields) {
    allFields = allFields.concat(schema.fields);
  }
  if (schema.listFields) {
    allFields = allFields.concat(schema.listFields);
  }

  // Remove duplicates
  const fieldMap = new Map();
  allFields.forEach((field) => {
    if (!fieldMap.has(field.name)) {
      fieldMap.set(field.name, field);
    }
  });
  allFields = Array.from(fieldMap.values());

  // Remove non-editable fields
  allFields.forEach((field) => {
    if (field.editable === false || field.generated) {
      delete sanitized[field.name];
    }
  });

  return sanitized;
};

module.exports = {
  validateData,
  sanitizeData,
};
