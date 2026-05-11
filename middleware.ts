import { NextResponse, type NextRequest } from "next/server";

const cookieName = process.env.SESSION_COOKIE_NAME ?? "autonet_session";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/app") && !request.cookies.get(cookieName)?.value) {
    const loginUrl = new URL("/login", request.url);
    const pathname = request.nextUrl.pathname;
    // Only pass safe /app/* paths — never expose arbitrary params
    if (/^\/app(\/[\w\-./]*)?$/.test(pathname)) {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
