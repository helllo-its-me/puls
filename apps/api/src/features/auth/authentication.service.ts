import type { AuthUser } from './auth.domain.js';
import { getUserByIdAndAuthVersion } from './auth.repository.js';
import { getBearerToken, verifyAccessToken } from './auth.token.js';

export async function getAuthenticatedUser(
  authorizationHeader: string | undefined
): Promise<AuthUser | null> {
  const token = getBearerToken(authorizationHeader);
  const tokenPayload = token ? verifyAccessToken(token) : null;

  if (!tokenPayload) {
    return null;
  }

  return getUserByIdAndAuthVersion(tokenPayload.sub, tokenPayload.av);
}
