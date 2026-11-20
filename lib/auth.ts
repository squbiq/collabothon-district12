import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { username, admin } from "better-auth/plugins";

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
  additionalFields: {
    totalXp: { type: "number", required: false, defaultValue: 0, input: false },
  },
  plugins: [
    username({ minUsernameLength: 6, maxUsernameLength: 20 }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});