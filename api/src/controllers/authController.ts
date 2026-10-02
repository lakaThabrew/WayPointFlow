import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';

function publicUser(u: {
  id: string; email: string; name: string; role: string;
  depot: string | null; outletId: string | null; phone: string | null;
}) {
  return {
    id: u.id, email: u.email, name: u.name, role: u.role,
    depot: u.depot, outletId: u.outletId, phone: u.phone,
  };
}

/** POST /auth/login — { email, password } → { token, user } */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Same message for unknown email and wrong password — never leak which one failed.
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ sub: user.id, role: user.role });
  return res.json({ token, user: publicUser(user) });
}

/** GET /auth/me — Bearer token → { user } */
export async function me(req: Request, res: Response) {
  // authMiddleware has already loaded and attached the fresh user.
  return res.json({ user: publicUser(req.authUser!) });
}
