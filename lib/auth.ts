import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { username, admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),
  emailAndPassword: { 
    enabled: true, 
  }, 
  plugins: [
    username({ minUsernameLength: 6, maxUsernameLength: 20 }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});