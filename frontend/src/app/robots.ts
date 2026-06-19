import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://logicra.ai";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/activities", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
