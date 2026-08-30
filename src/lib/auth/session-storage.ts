import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContextStore {
  cookies: Record<string, string | undefined>;
  headers?: Headers;
  user?: any;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();
