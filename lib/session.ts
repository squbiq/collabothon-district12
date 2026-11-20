import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }))

export async function requireSession(redirectTo = "/login") {
  const session = await getSession()
  if (!session) redirect(redirectTo)
  return session
}

export async function requireAdmin() {
  const session = await requireSession()
  if (session.user.role !== "admin") redirect("/")
  return session
}
