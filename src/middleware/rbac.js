/**
 * Role-based access control middleware
 * Checks if user has required permissions for the requested action
 */

/**
 * Check if user has required role
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.apiClient?.role;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: No role assigned',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Check if user has required permission
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    const permissions = req.user?.permissions || req.apiClient?.permissions || [];

    if (!permissions.includes(requiredPermission) && !permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires '${requiredPermission}' permission`,
      });
    }

    next();
  };
};

/**
 * Ensure user can only access their own company's data
 * This middleware should be used on routes that access company-specific data
 */
const requireCompanyAccess = (req, res, next) => {
  const userCompanyId = req.user?.companyId || req.apiClient?.companyId;

  if (!userCompanyId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: No company association',
    });
  }

  // Attach company filter to request for use in queries
  req.companyId = userCompanyId;

  next();
};

/**
 * Check if user can perform write operations (create, update, delete)
 * API keys with only 'read' permission will be blocked
 */
const requireWrite = (req, res, next) => {
  // Check if this is an API key request
  if (req.apiClient) {
    const permissions = req.apiClient.permissions || [];
    if (!permissions.includes('write') && !permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: API key does not have write permission',
      });
    }
  }

  // Firebase authenticated users have write by default (controlled by role)
  next();
};

module.exports = {
  requireRole,
  requirePermission,
  requireCompanyAccess,
  requireWrite,
};
