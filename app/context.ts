/**
 * Typed context values for React Router middleware
 *
 * Used with context.set() / context.get() in middleware and route handlers.
 * See app/middleware/auth.ts for middleware that populates these values.
 */

import { createContext } from 'react-router';
import type { Agent } from '../db/schema';

/** Authenticated agent, set by auth middleware */
export const authenticatedAgentContext = createContext<Agent | null>(null);

/** API key ID used for the current request (for key management operations) */
export const authKeyIdContext = createContext<number | null>(null);

/** SHA-256 hash of the current API key (for revocation safety checks) */
export const authKeyHashContext = createContext<string | null>(null);

/** Authenticated admin user, set by admin layout middleware */
export const adminUserContext = createContext<{ id: number; username: string } | null>(null);
