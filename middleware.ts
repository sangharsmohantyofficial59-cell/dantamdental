import { NextResponse, type NextRequest } from "next/server";

/**
 * Splits one app into two sites:
 *   dantamdental.com         public landing page and booking
 *   admin.dantamdental.com   front desk, staff only (set ADMIN_HOST to this name)
 * On the public host, /admin returns 404 unless ALLOW_ADMIN_PATH=true (used for the
 * sales demo on a free vercel.app address where there is only one domain).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api")) return NextResponse.next();

  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const adminHost = (process.env.ADMIN_HOST ?? "").toLowerCase().split(":")[0];
  const allowPath = process.env.ALLOW_ADMIN_PATH === "true";
  const headers = new Headers(req.headers);

  if (adminHost && host === adminHost) {
    headers.set("x-admin-mode", "host");
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(url);
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin" + (pathname === "/" ? "" : pathname);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (allowPath) {
      headers.set("x-admin-mode", "path");
      return NextResponse.next({ request: { headers } });
    }
    return NextResponse.rewrite(new URL("/not-found-404", req.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|opengraph-image).*)"],
};
