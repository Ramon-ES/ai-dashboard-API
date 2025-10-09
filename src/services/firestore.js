const { db } = require('../config/firebase');
const { getSchema } = require('../schemas');
const { v4: uuidv4 } = require('uuid');

/**
 * Generic Firestore service for CRUD operations
 */

/**
 * Get all documents from a collection (filtered by company)
 */
const getAll = async (collectionName, companyId, options = {}) => {
  try {
    let query = db.collection(collectionName).where('companyId', '==', companyId);

    // Apply filters if provided
    if (options.filters) {
      options.filters.forEach((filter) => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.order || 'desc');
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const documents = [];

    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: documents,
      count: documents.length,
    };
  } catch (error) {
    console.error(`Error getting all from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get a single document by ID
 */
const getById = async (collectionName, id, companyId) => {
  try {
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    const data = doc.data();

    // Verify company access
    if (data.companyId !== companyId) {
      return {
        success: false,
        error: 'Unauthorized: Document belongs to another company',
      };
    }

    return {
      success: true,
      data: {
        id: doc.id,
        ...data,
      },
    };
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Create a new document
 */
const create = async (collectionName, data, userId, companyId) => {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get schema version for this collection type
    const schema = getSchema(collectionName.slice(0, -1)); // Remove 's' from collection name
    const schemaVersion = schema?.version || '1.0';

    const documentData = {
      ...data,
      id,
      companyId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      schemaVersion, // Track which schema version created this document
    };

    await db.collection(collectionName).doc(id).set(documentData);

    // Track activity
    await trackActivity({
      type: 'create',
      entityType: collectionName,
      entityId: id,
      entityName: data.name || 'Unnamed',
      userId,
      companyId,
      timestamp: now,
    });

    return {
      success: true,
      data: documentData,
    };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update a document
 */
const update = async (collectionName, id, data, userId, companyId) => {
  try {
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    const existingData = doc.data();

    // Verify company access
    if (existingData.companyId !== companyId) {
      return {
        success: false,
        error: 'Unauthorized: Document belongs to another company',
      };
    }

    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
      updatedBy: userId,
    };

    await docRef.update(updateData);

    // Track activity
    await trackActivity({
      type: 'update',
      entityType: collectionName,
      entityId: id,
      entityName: existingData.name || data.name || 'Unnamed',
      userId,
      companyId,
      timestamp: now,
    });

    return {
      success: true,
      data: {
        id,
        ...existingData,
        ...updateData,
      },
    };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 */
const deleteDoc = async (collectionName, id, userId, companyId) => {
  try {
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    const data = doc.data();

    // Verify company access
    if (data.companyId !== companyId) {
      return {
        success: false,
        error: 'Unauthorized: Document belongs to another company',
      };
    }

    await docRef.delete();

    // Track activity
    await trackActivity({
      type: 'delete',
      entityType: collectionName,
      entityId: id,
      entityName: data.name || 'Unnamed',
      userId,
      companyId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Duplicate a document
 */
const duplicate = async (collectionName, id, userId, companyId) => {
  try {
    const result = await getById(collectionName, id, companyId);

    if (!result.success) {
      return result;
    }

    const originalData = result.data;
    const newId = uuidv4();
    const now = new Date().toISOString();

    // Remove fields that shouldn't be duplicated
    const { id: _id, createdAt, createdBy, updatedAt, updatedBy, playCount, ...dataToDuplicate } = originalData;

    const duplicateData = {
      ...dataToDuplicate,
      id: newId,
      name: `${originalData.name} (Copy)`,
      companyId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      ...(playCount !== undefined && { playCount: 0 }),
    };

    await db.collection(collectionName).doc(newId).set(duplicateData);

    // Track activity
    await trackActivity({
      type: 'duplicate',
      entityType: collectionName,
      entityId: newId,
      entityName: duplicateData.name,
      userId,
      companyId,
      timestamp: now,
    });

    return {
      success: true,
      data: duplicateData,
    };
  } catch (error) {
    console.error(`Error duplicating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Track activity for recent edits
 */
const trackActivity = async (activity) => {
  try {
    const activityId = uuidv4();
    await db.collection('activities').doc(activityId).set({
      id: activityId,
      ...activity,
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    // Don't throw - activity tracking shouldn't break main operations
  }
};

/**
 * Get recent activities for a company
 */
const getRecentActivities = async (companyId, limit = 20) => {
  try {
    const snapshot = await db
      .collection('activities')
      .where('companyId', '==', companyId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const activities = [];
    snapshot.forEach((doc) => {
      activities.push(doc.data());
    });

    return {
      success: true,
      data: activities,
    };
  } catch (error) {
    console.error('Error getting recent activities:', error);
    throw error;
  }
};

/**
 * Get counts for dashboard
 */
const getCounts = async (companyId) => {
  try {
    const collections = ['scenarios', 'characters', 'dialogues', 'environments'];
    const counts = {};

    await Promise.all(
      collections.map(async (collection) => {
        const snapshot = await db.collection(collection).where('companyId', '==', companyId).count().get();
        counts[collection] = snapshot.data().count;
      })
    );

    return {
      success: true,
      data: counts,
    };
  } catch (error) {
    console.error('Error getting counts:', error);
    throw error;
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteDoc,
  duplicate,
  getRecentActivities,
  getCounts,
};
