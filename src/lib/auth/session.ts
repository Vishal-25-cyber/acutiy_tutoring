import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "./jwt";
import { UserRole } from "@/types";

export const AUTH_COOKIE_NAME = "acuity_auth_token";

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<TokenPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function handleAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized access. Please login." }, { status: 401 });
  }
  if (message === "FORBIDDEN") {
    return NextResponse.json({ error: "Forbidden: You do not have permission for this resource." }, { status: 403 });
  }
  console.error("API Error:", error);
  return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
}
