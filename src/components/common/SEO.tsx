import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  noIndex?: boolean;
}

export function SEO({
  title = "Mantif — Human x Artificial Intelligence | Online Tutoring & Learning Platform",
  description = "Mantif is an intelligent online tutoring platform combining expert educators with AI-powered personalized learning for Classes 6 to 10.",
  canonical,
  keywords,
  noIndex = false,
}: SEOProps) {
  const location = useLocation();
  const canonicalUrl = canonical || ("https://mantif.com" + (location.pathname === "/" ? "" : location.pathname));

  useEffect(() => {
    // 1. Update Title
    document.title = title.includes("Mantif") ? title : (title + " | Mantif");

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // 3. Update Canonical Tag
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonicalUrl);

    // 4. Update Keywords if provided
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", keywords);
    }

    // 5. Update Robots meta tag if noIndex
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (!metaRobots) {
        metaRobots = document.createElement("meta");
        metaRobots.setAttribute("name", "robots");
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute("content", "noindex, nofollow");
    } else if (metaRobots) {
      metaRobots.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }
  }, [title, description, canonicalUrl, keywords, noIndex]);

  return null;
}

export default SEO;
