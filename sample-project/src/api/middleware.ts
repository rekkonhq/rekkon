import type { User } from '../types';
import { apiFetch } from '../lib/api-client';

export interface AuthContext {
  user: User;
  token: string;
}

export async function withAuth(
  token: string
): Promise<AuthContext | null> {
  if (!token) return null;

  const response = await apiFetch<User>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.error) return null;

  return {
    user: response.data,
    token,
  };
}

export function requireRole(context: AuthContext, role: string): boolean {
  // Role check logic
  return true;
}

export function rateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, number[]>();

  return function checkLimit(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    const clientRequests = (requests.get(clientId) || [])
      .filter(t => t > windowStart);

    if (clientRequests.length >= maxRequests) {
      return false;
    }

    clientRequests.push(now);
    requests.set(clientId, clientRequests);
    return true;
  };
}
