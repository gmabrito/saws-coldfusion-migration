/**
 * Auth provider — re-exports from @saws/auth shared package.
 * Authentication is handled by Azure Static Web Apps (/.auth/login/aad).
 * User identity is read from /.auth/me at runtime.
 *
 * Group-based access is preserved — SAWS-FRS-Admin, SAWS-FRS-User, SAWS-FRS-ReadOnly
 * are assigned in Azure SWA role assignments and come through in userRoles/groups.
 */
export { AuthProvider, useAuth } from '@saws/auth/client';
export { default } from '@saws/auth/client';
