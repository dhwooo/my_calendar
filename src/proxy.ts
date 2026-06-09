import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED = ["/calendar", "/wiki", "/goals", "/weight", "/assets", "/investment", "/board", "/profile"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/calendar/:path*",
    "/wiki/:path*",
    "/goals/:path*",
    "/weight/:path*",
    "/assets/:path*",
    "/investment/:path*",
    "/board/:path*",
    "/profile/:path*",
  ],
};
