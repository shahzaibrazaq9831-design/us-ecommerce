import type { MetadataRoute } from "next";
import {
  brands,
  categories,
  getAllProductSlugs,
  occasions,
} from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";

/**
 * sitemap.xml — every page the shop wants found, built from the catalogue
 * so a new product or a new shelf is listed as soon as it is added.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "daily" },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" },
    { path: "/new-arrivals", priority: 0.9, changeFrequency: "daily" },
    { path: "/best-sellers", priority: 0.9, changeFrequency: "weekly" },
    { path: "/sale", priority: 0.8, changeFrequency: "daily" },
    { path: "/collections", priority: 0.8, changeFrequency: "weekly" },
    { path: "/brands", priority: 0.7, changeFrequency: "monthly" },
    { path: "/custom-stitching", priority: 0.6, changeFrequency: "monthly" },
    { path: "/size-guide", priority: 0.6, changeFrequency: "monthly" },
    { path: "/size-chart", priority: 0.5, changeFrequency: "monthly" },
    { path: "/product-disclosure", priority: 0.4, changeFrequency: "monthly" },
    { path: "/reviews", priority: 0.6, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/shipping", priority: 0.4, changeFrequency: "yearly" },
    { path: "/returns", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/made-to-order", priority: 0.5, changeFrequency: "monthly" },
  ];

  const pages: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(category.href),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const occasionPages: MetadataRoute.Sitemap = occasions.map((occasion) => ({
    url: absoluteUrl(occasion.href),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: absoluteUrl(brand.href),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const productPages: MetadataRoute.Sitemap = getAllProductSlugs().map((slug) => ({
    url: absoluteUrl(`/products/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...pages, ...categoryPages, ...occasionPages, ...brandPages, ...productPages];
}
