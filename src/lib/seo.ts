import { siteConfig } from "./config";

export function buildMetadata(opts: {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}) {
  const metaTitle = opts.title ? `${opts.title} | ${siteConfig.name}` : siteConfig.title;
  const metaDescription = opts.description || siteConfig.description;
  const metaImage = opts.image?.startsWith("http") ? opts.image : `${siteConfig.url}${opts.image || siteConfig.ogImage}`;
  const canonical = opts.url ? `${siteConfig.url}${opts.url}` : siteConfig.url;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: opts.keywords,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: opts.type || "website",
      locale: "pt_BR",
      url: canonical,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [{ url: metaImage, width: 1200, height: 630 }],
      publishedTime: opts.publishedTime,
      modifiedTime: opts.modifiedTime,
    },
    twitter: { card: "summary_large_image", title: metaTitle, description: metaDescription, images: [metaImage] },
    verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    sameAs: Object.values(siteConfig.social),
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressRegion: "SP", addressCountry: "BR" },
  };
}

export function articleSchema(post: { title: string; excerpt: string; slug: string; coverImage?: string | null; publishedAt?: Date | null; updatedAt: Date }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteConfig.url}/blog/${post.slug}` },
  };
}

export function productSchema(product: { name: string; description: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: siteConfig.name },
    url: `${siteConfig.url}/produtos/${product.slug}`,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}
