import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get(getSessionCookieName())?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const session = await verifySessionToken(sessionCookie);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      username: session.username,
      displayName: session.displayName,
    },
  });
}
