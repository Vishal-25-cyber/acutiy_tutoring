import jwt from "jsonwebtoken";
import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_acuity_tutoring_production_key_2025_min32chars";
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  status: string;
  batchId?: string;
  currentClass?: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}
