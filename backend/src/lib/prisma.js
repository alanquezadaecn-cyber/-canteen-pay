import { PrismaClient } from '@prisma/client';

// Create a single instance
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn'] : ['error']
  });
};

const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || prismaClientSingleton();

export const prisma = globalForPrisma.prisma;
