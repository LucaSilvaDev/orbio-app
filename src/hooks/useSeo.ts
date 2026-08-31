import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
};

const SITE_NAME = "Orbio";
const SITE_URL = "https://orbio.app.br";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`;

function setMeta(attr: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function useSeo({ title, description, image = DEFAULT_IMAGE, noindex = false }: SeoOptions) {
  useEffect(() => {
    const fullTitle = `${title} — ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", `${SITE_URL}${window.location.pathname}`);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
  }, [title, description, image, noindex]);
}
