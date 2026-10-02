import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/jwt';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  depot: string | null;
  outletId: string | null;
  phone: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

/** Verifies the Bearer JWT, loads the fresh user, attaches it to req.authUser. 401 on any failure. */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    req.authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      depot: user.depot,
      outletId: user.outletId,
      phone: user.phone,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
