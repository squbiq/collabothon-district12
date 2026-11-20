import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/gen/prisma/client"

function createClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("No DATABASE_URL in .env")

  const u = new URL(url)
  const adapter = new PrismaMariaDb({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
  })

  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
