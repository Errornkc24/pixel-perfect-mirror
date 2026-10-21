/** Shared metadata shape; each page supplies its own title and description. */
export function pageHead(title: string, description: string, privatePage = false) {
  const brandedTitle = `${title} — Tanvisha's Candles`;
  return {
    meta: [
      { title: brandedTitle },
      { name: "description", content: description },
      { property: "og:title", content: brandedTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(privatePage ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
  };
}