import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "revator_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 kun

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
  role: string;
  /// Qaysi kompaniyaga tegishli — barcha so'rovlar shu bo'yicha ajratiladi
  organizationId: string;
  organizationName: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET .env faylida aniqlanmagan");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const session = payload as unknown as SessionPayload;
    // Multi-tenant'gacha yaratilgan eski sessiyalarда kompaniya yo'q —
    // ularni yaroqsiz deb hisoblaymiz (foydalanuvchi qaytadan kiradi).
    if (!session.organizationId || !session.organizationName) return null;
    return session;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
