import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { username, admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { verifyPassword } from "better-auth/crypto";

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
    // Usuwanie własnego konta (profil). Konta administratorów nie mogą być usuwane tą drogą.
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        if ((user as { role?: string | null }).role?.split(",").map((r: string) => r.trim()).includes("admin")) {
          throw new APIError("FORBIDDEN", { message: "Administrator accounts cannot be deleted.", code: "ADMIN_CANNOT_DELETE" })
        }
      },
    },
    additionalFields: {
      experience: { type: "number", required: true, defaultValue: 0, input: false },
      streak: { type: "number", required: true, defaultValue: 0, input: false},
      lastStreakUpdate: { type: "date", required: false, defaultValue: undefined }
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Zbanowany użytkownik: przy logowaniu zwracamy powód bana (plugin admin() podaje tylko ogólny komunikat).
      // Powód ujawniamy dopiero po sprawdzeniu hasła, żeby nie dało się w ten sposób zgadywać kont.
      if (ctx.path === "/sign-in/email" || ctx.path === "/sign-in/username") {
        const body = ctx.body as { email?: unknown; username?: unknown; password?: unknown } | undefined
        const password = body?.password
        const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null
        const name = typeof body?.username === "string" ? body.username.trim().toLowerCase() : null
        if (typeof password === "string" && (email || name)) {
          const user = await prisma.user.findFirst({
            where: email ? { email } : { username: name! },
            select: { banned: true, banReason: true, banExpires: true, accounts: { where: { providerId: "credential" }, select: { password: true } } },
          })
          const stillBanned = user?.banned && (!user.banExpires || user.banExpires > new Date())
          const hash = user?.accounts[0]?.password
          if (user && stillBanned && hash && (await verifyPassword({ hash, password }))) {
            const until = user.banExpires ? `Ban expires on ${user.banExpires.toISOString().slice(0, 16).replace("T", " ")} UTC.` : "The ban is permanent."
            throw new APIError("FORBIDDEN", {
              message: `${user.banReason?.trim() || "No reason was given."} ${until}`,
              code: "BANNED_USER",
            })
          }
        }
      }
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