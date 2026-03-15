import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

export const AUTH_COOKIE = "banking_sim_token";

export type AuthTokenPayload = {
  userId: string;
  role: Role;
  email: string;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-env";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getAuthFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split("=")[1];
  if (!token) return null;
  return verifyToken(token);
}

export function getServerAuth() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}