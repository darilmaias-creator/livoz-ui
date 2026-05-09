import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada. Defina a URL do PostgreSQL no arquivo .env.");
  }

  const adapter = new PrismaPg({
    connectionString: removePgSslParams(connectionString),
    ssl: {
      rejectUnauthorized: false,
    },
  });
  return new PrismaClient({ adapter });
}

function removePgSslParams(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslaccept");
  return url.toString();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function getPrisma() {
  return prisma;
}
