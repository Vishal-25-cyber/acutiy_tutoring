import { NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "./jwt";
import { UserRole } from "@/types";
import { requestContextStorage } from "./session-storage";

export const AUTH_COOKIE_NAME = "acuity_auth_token";

export async function getSession(req?: any): Promise<TokenPayload | null> {
  let token: string | undefined = undefined;

  // 1. Direct request parameter cookies & headers
  if (req) {
    if (typeof req.cookies?.get === "function") {
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    } else if (req.cookies && typeof req.cookies[AUTH_COOKIE_NAME] === "string") {
      token = req.cookies[AUTH_COOKIE_NAME];
    }

    if (!token && req.headers) {
      // Check Authorization: Bearer <token>
      const authHeader =
        typeof req.headers.get === "function"
          ? req.headers.get("authorization")
          : req.headers.authorization;
      if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }

      // Check x-auth-token header
      if (!token) {
        const xToken =
          typeof req.headers.get === "function"
            ? req.headers.get("x-auth-token")
            : req.headers["x-auth-token"];
        if (xToken && typeof xToken === "string") {
          token = xToken.trim();
        }
      }

      // Check Cookie header
      if (!token) {
        const cookieHeader =
          typeof req.headers.get === "function"
            ? req.headers.get("cookie")
            : req.headers.cookie;
        if (cookieHeader && typeof cookieHeader === "string") {
          const matches = cookieHeader.match(
            new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`)
          );
          if (matches) token = decodeURIComponent(matches[1]);
        }
      }
    }

    // Direct check on Express request object
    if (!token && req.expressReq?.headers) {
      const expAuth = req.expressReq.headers.authorization;
      if (expAuth && typeof expAuth === "string" && expAuth.startsWith("Bearer ")) {
        token = expAuth.slice(7).trim();
      }
      if (!token && req.expressReq.headers["x-auth-token"]) {
        token = String(req.expressReq.headers["x-auth-token"]).trim();
      }
      if (!token && req.expressReq.headers.cookie) {
        const matches = req.expressReq.headers.cookie.match(
          new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`)
        );
        if (matches) token = decodeURIComponent(matches[1]);
      }
    }
  }

  // 2. Async Local Storage from express adapter context
  if (!token) {
    try {
      const store = requestContextStorage.getStore();
      if (store && store.cookies && store.cookies[AUTH_COOKIE_NAME]) {
        token = store.cookies[AUTH_COOKIE_NAME];
      }
      if (!token && store && store.headers) {
        const authHdr = store.headers.get("authorization");
        if (authHdr && authHdr.startsWith("Bearer ")) {
          token = authHdr.slice(7).trim();
        }
        if (!token) {
          const xToken = store.headers.get("x-auth-token");
          if (xToken) token = xToken.trim();
        }
        if (!token) {
          const cookieHdr = store.headers.get("cookie");
          if (cookieHdr && typeof cookieHdr === "string") {
            const matches = cookieHdr.match(
              new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`)
            );
            if (matches) token = decodeURIComponent(matches[1]);
          }
        }
      }
    } catch {
      // Storage unavailable
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(req?: any): Promise<TokenPayload> {
  const session = await getSession(req);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[], req?: any): Promise<TokenPayload> {
  const session = await requireAuth(req);
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
