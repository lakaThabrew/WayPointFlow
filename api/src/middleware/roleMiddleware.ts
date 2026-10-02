import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

/** 403 unless the authenticated user's role is in the allowed list. Use after authMiddleware. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.authUser.role)) {
      return res.status(403).json({ error: `Forbidden: requires role ${roles.join(' or ')}` });
    }
    next();
  };
}
