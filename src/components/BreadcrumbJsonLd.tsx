"use client";

import { usePathname } from "next/navigation";

export function BreadcrumbJsonLd() {
  const pathname = usePathname();

  // Don't render breadcrumbs on the homepage
  if (!pathname || pathname === "/") return null;

  const pathParts = pathname.split("/").filter(Boolean);
  
  // Build the BreadcrumbList schema dynamically
  const breadcrumbs = pathParts.map((part, index) => {
    const urlPath = "/" + pathParts.slice(0, index + 1).join("/");
    // Capitalize and format the part name (e.g., "forgot-password" -> "Forgot password")
    const name = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');

    return {
      "@type": "ListItem",
      position: index + 1,
      name: name,
      item: `https://www.ad2vo.com${urlPath}`
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
