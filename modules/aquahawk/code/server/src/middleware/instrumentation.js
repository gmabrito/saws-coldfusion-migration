const eventBus = require('../events/eventBus');

/**
 * Request logging middleware.
 * Logs every API call with method, path, status, duration, and userId.
 * Publishes an 'api.request' event for each completed request.
 */
function instrumentation(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration,
      userId: req.user ? req.user.preferred_username : null,
      timestamp: new Date().toISOString(),
    };

    const statusColor =
      res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
    console.log(
      `${statusColor}${req.method}\x1b[0m ${req.originalUrl} ${res.statusCode} ${duration}ms` +
        (logData.userId ? ` [${logData.userId}]` : '')
    );

    eventBus.publish('api.request', logData).catch(() => {});
  });

  next();
}

module.exports = { instrumentation };
