const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

/**
 * AD group-based authorization middleware.
 * Checks that the authenticated user belongs to at least one of the allowed groups.
 *
 * @param {string[]} allowedGroups - AD group names that grant access
 */
function authorize(allowedGroups) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userGroups = req.user.groups || [];
    const hasAccess = allowedGroups.some((g) => userGroups.includes(g));

    if (!hasAccess) {
      eventBus.publish(EVENT_TYPES.USER_ACCESS_DENIED, {
        user: req.user.preferred_username,
        requiredGroups: allowedGroups,
        actualGroups: userGroups,
        path: req.originalUrl,
        method: req.method,
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredGroups: allowedGroups,
      });
    }

    next();
  };
}

// Convenience group constants
const GROUPS = {
  ADMIN: 'SAWS-AquaAnalytics-Admin',
  VIEWER: 'SAWS-AquaAnalytics-Viewer',
};

module.exports = { authorize, GROUPS };
