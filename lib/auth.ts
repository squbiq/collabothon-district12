import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { username, admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),
  emailAndPassword: { 
    enabled: true, 
  }, 
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    additionalFields: {
      experience: { type: "number", required: true, defaultValue: 0, input: false },
      streak: { type: "number", required: true, defaultValue: 0, input: false},
      lastStreakUpdate: { type: "date", required: false, defaultValue: undefined }
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return
      const raw = ctx.path === "/sign-up/email" ? ctx.body?.email : ctx.body?.newEmail
      if (typeof raw !== "string") return
      const taken = await prisma.user.findUnique({ where: { email: raw.toLowerCase() }, select: { id: true } })
      if (taken) throw new APIError("BAD_REQUEST", { message: "Account with this email address is taken", code: "USER_ALREADY_EXISTS" })
    }),
  },
  plugins: [
    username({ minUsernameLength: 6, maxUsernameLength: 20 }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});