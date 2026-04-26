import { jwtVerify, SignJWT } from "jose";

export interface AuthSession {
  email: string;
  username?: string;
  displayName?: string;
}

const SESSION_COOKIE_NAME = "signcous_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret(): Uint8Array {
  const raw =
    process.env.AUTH_SESSION_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "signcous-local-dev-secret";

  return new TextEncoder().encode(raw);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}

export async function createSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({
    email: session.email,
    username: session.username,
    displayName: session.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    if (typeof payload.email !== "string" || !payload.email) {
      return null;
    }

    return {
      email: payload.email,
      username: typeof payload.username === "string" ? payload.username : undefined,
      displayName: typeof payload.displayName === "string" ? payload.displayName : undefined,
    };
  } catch {
    return null;
  }
}
