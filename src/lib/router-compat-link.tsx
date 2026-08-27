import React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";

export interface NextLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string | { pathname?: string; query?: Record<string, any> };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function Link({
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

  return (
    <RouterLink to={targetTo} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
}
