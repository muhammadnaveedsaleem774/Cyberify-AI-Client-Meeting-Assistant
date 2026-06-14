import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';

type TokenPayload = JwtPayload & { userId?: string; workspaceId?: string };

export function signAccessToken<T extends object>(payload: T, expiresIn = config.accessTokenExpiresIn): string {
  return (jwt as any).sign(payload, config.jwtSecret, { expiresIn });
}

export function signRefreshToken<T extends object>(payload: T, expiresIn = config.refreshTokenExpiresIn): string {
  return (jwt as any).sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = (jwt as any).verify(token, config.jwtSecret);
  if (typeof decoded === 'string') {
    throw new Error('Unexpected token payload');
  }
  return decoded as TokenPayload;
}
