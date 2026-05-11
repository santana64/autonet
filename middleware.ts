import { NextResponse, type NextRequest } from "next/server";

const cookieName = process.env.SESSION_COOKIE_NAME ?? "autonet_session";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/app") && !request.cookies.get(cookieName)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
