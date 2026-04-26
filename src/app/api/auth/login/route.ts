import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionTtlSeconds,
} from "@/lib/auth-session";

const WOO_BASE_URL = process.env.NEXT_PUBLIC_WOO_BASE_URL ?? "";

interface WpJwtLoginResponse {
  token?: string;
  user_email?: string;
  user_nicename?: string;
  user_display_name?: string;
  message?: string;
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    if (!WOO_BASE_URL) {
      return NextResponse.json(
        { error: "Woo base URL is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(`${WOO_BASE_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = (await response.json()) as WpJwtLoginResponse;

    if (!response.ok || !data.user_email) {
      return NextResponse.json(
        {
          error:
            data.message ??
            "Login failed. Ensure WP JWT auth is enabled and credentials are valid.",
        },
        { status: 401 }
      );
    }

    const sessionToken = await createSessionToken({
      email: data.user_email,
      username: data.user_nicename ?? username,
      displayName: data.user_display_name,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        email: data.user_email,
        username: data.user_nicename ?? username,
        displayName: data.user_display_name ?? data.user_nicename ?? username,
      },
    });

    res.cookies.set(getSessionCookieName(), sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Could not process login request." },
      { status: 500 }
    );
  }
}
