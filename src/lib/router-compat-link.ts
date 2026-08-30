import React from "react";
import { Link as RouterLink } from "react-router-dom";

export interface NextLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string | { pathname?: string; query?: Record<string, any> };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Link({
  href,
  prefetch,
  replace,
  scroll,
  children,
  ...rest
}: NextLinkProps) {
  let targetTo = typeof href === "string" ? href : href?.pathname || "/";
  if (typeof href === "object" && href.query) {
    const params = new URLSearchParams(href.query);
    targetTo = `${targetTo}?${params.toString()}`;
  }

  return React.createElement(RouterLink, { to: targetTo, replace, ...rest }, children);
}

export default Link;
