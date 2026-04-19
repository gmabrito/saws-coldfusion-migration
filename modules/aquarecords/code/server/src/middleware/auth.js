/**
 * Auth middleware — re-exports from @saws/auth shared package.
 * In production: reads X-MS-CLIENT-PRINCIPAL header injected by Azure SWA.
 * In local dev:  injects DEV_USER when SKIP_AUTH=true or NODE_ENV !== 'production'.
 */
module.exports = require('@saws/auth/server');
