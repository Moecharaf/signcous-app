import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionTtlSeconds,
} from "@/lib/auth-session";

const WOO_BASE_URL = process.env.NEXT_PUBLIC_WOO_BASE_URL ?? "";
const WOO_KEY = process.env.WOO_CONSUMER_KEY ?? "";
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET ?? "";

interface SignupBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

interface WooCustomer {
  id: number;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface WpJwtLoginResponse {
  token?: string;
  user_email?: string;
  user_nicename?: string;
  user_display_name?: string;
  message?: string;
  code?: string;
}

function getWooHeaders(): HeadersInit {
  const token = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${token}`,
  };
}

function buildUsername(email: string): string {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 40);

  if (base.length >= 3) return base;
  return `customer_${Date.now().toString().slice(-6)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignupBody;
    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required." },
        { status: 400 }
      );
    }

    if (!WOO_BASE_URL || !WOO_KEY || !WOO_SECRET) {
      return NextResponse.json(
        { error: "WooCommerce API credentials are not configured." },
        { status: 500 }
      );
    }

    const username = buildUsername(email);

    const createResponse = await fetch(`${WOO_BASE_URL}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: getWooHeaders(),
      body: JSON.stringify({
        email,
        username,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const createData = (await createResponse.json()) as
      | WooCustomer
      | { message?: string; code?: string; data?: { status?: number } };

    if (!createResponse.ok) {
      const code = "code" in createData ? createData.code : undefined;
      if (code === "registration-error-email-exists") {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            ("message" in createData && createData.message) ||
            "Could not create account right now.",
        },
        { status: 400 }
      );
    }

    const loginResponse = await fetch(`${WOO_BASE_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    const loginData = (await loginResponse.json()) as WpJwtLoginResponse;

    if (!loginResponse.ok || !loginData.user_email) {
      return NextResponse.json(
        {
          error:
            loginData.message ??
            "Account created, but automatic sign in failed. Please sign in manually.",
        },
        { status: 201 }
      );
    }

    const displayName =
      loginData.user_display_name ??
      `${firstName} ${lastName}`.trim() ??
      loginData.user_nicename ??
      email;

    const sessionToken = await createSessionToken({
      email: loginData.user_email,
      username: loginData.user_nicename ?? username,
      displayName,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        email: loginData.user_email,
        username: loginData.user_nicename ?? username,
        displayName,
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
    return NextResponse.json({ error: "Could not process signup request." }, { status: 500 });
  }
}