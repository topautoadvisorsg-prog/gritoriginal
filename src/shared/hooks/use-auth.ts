/**
 * Active auth hook for the Clerk cutover.
 *
 * Kept at the legacy import path so existing components can move to Clerk
 * without a repo-wide import churn.
 */
export { useAuth } from './use-auth-clerk';
