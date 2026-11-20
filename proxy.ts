import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// Next.js 16: "middleware" nazywa się teraz "proxy".
// To tylko szybki filtr po obecności cookie. PRAWDZIWA weryfikacja sesji jest w layoutach
// (requireSession), bo samo cookie można podrobić.
export function proxy(request: NextRequest) {
  const hasCookie = getSessionCookie(request)
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/panel") && !hasCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/panel/:path*"],
}
