import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";

export interface AuthTokenPayload extends JWTPayload {
  sub: string;       // personnelId
  username: string;
  role: string;
}

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "shifttrack-access-secret-change-in-production"
);

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "shifttrack-refresh-secret-change-in-production"
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

// ── Token signing ─────────────────────────────────────────────────────────────

export async function signAccessToken(payload: {
  sub: string;
  username: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

export async function signRefreshToken(payload: {
  sub: string;
  username: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

// ── Token verification ────────────────────────────────────────────────────────

export async function verifyAccessToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

// ── Request helpers ───────────────────────────────────────────────────────────

export async function getAuthUser(
  request: NextRequest
): Promise<AuthTokenPayload | null> {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
