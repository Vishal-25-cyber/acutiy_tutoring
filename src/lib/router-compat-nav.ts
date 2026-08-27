import {
  useNavigate,
  useLocation,
  useSearchParams as useRouterSearchParams,
  useParams as useRouterParams,
} from "react-router-dom";

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: (_href: string) => {},
  };
}

export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export function useParams<T extends Record<string, string | string[]>>(): T {
  const params = useRouterParams();
  return params as unknown as T;
}

export function redirect(url: string) {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
