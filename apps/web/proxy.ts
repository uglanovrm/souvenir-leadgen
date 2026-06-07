import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const hasSupabaseCookie = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));

  if (!hasSupabaseCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
