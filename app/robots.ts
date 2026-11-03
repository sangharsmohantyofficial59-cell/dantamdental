import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const host = (headers().get("host") ?? "").toLowerCase().split(":")[0];
  const adminHost = (process.env.ADMIN_HOST ?? "").toLowerCase().split(":")[0];

  // The front desk subdomain must never appear in search results.
  if (adminHost && host === adminHost) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
