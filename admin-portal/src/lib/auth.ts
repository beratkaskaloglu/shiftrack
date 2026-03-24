import { SignJWT, jwtVerify } from "jose";
import type { AuthUser, UserRole } from "./types";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const TOKEN_EXPIRY = "8h";

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    platform: user.platform,
    project: user.project,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      username: payload.username as string,
      full_name: payload.full_name as string,
      role: payload.role as UserRole,
      platform: payload.platform as string,
      project: payload.project as string,
    };
  } catch {
    return null;
  }
}

// Role hierarchy for permission checks
const ROLE_LEVELS: Record<UserRole, number> = {
  super_admin: 3,
  project_manager: 2,
  supervisor: 1,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    project_manager: "Proje Yoneticisi",
    supervisor: "Supervisor",
  };
  return labels[role];
}
