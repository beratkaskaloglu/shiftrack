import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { MOCK_USERS, MOCK_PASSWORD } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Kullanici adi ve sifre gerekli" },
      { status: 400 }
    );
  }

  const user = MOCK_USERS.find(
    (u) => u.username === username && u.is_active
  );

  if (!user || password !== MOCK_PASSWORD) {
    return NextResponse.json(
      { error: "Gecersiz kullanici adi veya sifre" },
      { status: 401 }
    );
  }

  // Only admin roles can access admin portal
  if (!["super_admin", "project_manager", "supervisor"].includes(user.role)) {
    return NextResponse.json(
      { error: "Bu portala erisim yetkiniz yok" },
      { status: 403 }
    );
  }

  const authUser = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    platform: user.platform,
    project: user.project,
  };

  const token = await signToken(authUser);

  const response = NextResponse.json({ user: authUser });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return response;
}
