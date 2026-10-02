import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';

const SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-in-production';

export interface TokenPayload {
  sub: string; // user id
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
