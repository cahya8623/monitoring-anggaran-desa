import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE = "desa_session";
const SESSION_SECONDS = 60 * 60 * 8;

function signingKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET belum diatur atau panjangnya kurang dari 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(admin) {
  const token = await new SignJWT({ sv: admin.session_version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(admin.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(signingKey());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function getAdminSession() {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    const adminId = Number(payload.sub);
    if (!Number.isInteger(adminId)) return null;
    const admin = getDb().prepare("SELECT id, username, email, session_version FROM admins WHERE id = ?").get(adminId);
    if (!admin || payload.sv !== admin.session_version) return null;
    return admin;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
