/**
 * Auth provider — re-exports from @saws/auth shared package.
 * Authentication is handled by Azure Static Web Apps (/.auth/login/aad).
 * User identity is read from /.auth/me at runtime.
 *
 * Group-based access: SAWS-AquaDocs-Admin, SAWS-AquaDocs-User
 */
export { AuthProvider, useAuth } from '@saws/auth/client';
export { default } from '@saws/auth/client';
