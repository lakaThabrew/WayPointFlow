import { PrismaClient } from '@prisma/client';

// Shared singleton — creating a PrismaClient per module exhausts connections
// under ts-node-dev hot-reload. Import this everywhere instead.
export const prisma = new PrismaClient();
