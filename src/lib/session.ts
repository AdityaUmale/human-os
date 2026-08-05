import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "human_os_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secretKey() {
  return new TextEncoder().encode(getServerEnv().SESSION_SECRET);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = payload.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      birthDetails: true,
      humanOs: true,
    },
  });
}
