import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth-session";

const WOO_BASE_URL = process.env.NEXT_PUBLIC_WOO_BASE_URL ?? "";
const WOO_KEY = process.env.WOO_CONSUMER_KEY ?? "";
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET ?? "";

interface WooOrderLineItem {
  id: number;
  name: string;
  quantity: number;
  total: string;
}

interface WooOrder {
  id: number;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  billing?: { email?: string };
  line_items?: WooOrderLineItem[];
}

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get(getSessionCookieName())?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(sessionCookie);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!WOO_BASE_URL || !WOO_KEY || !WOO_SECRET) {
    return NextResponse.json(
      { error: "WooCommerce credentials are not configured." },
      { status: 500 }
    );
  }

  const token = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");

  try {
    const url = `${WOO_BASE_URL}/wp-json/wc/v3/orders?per_page=50&orderby=date&order=desc&search=${encodeURIComponent(
      session.email
    )}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not fetch orders from WooCommerce." },
        { status: response.status }
      );
    }

    const orders = (await response.json()) as WooOrder[];

    const filtered = (Array.isArray(orders) ? orders : [])
      .filter((order) => order.billing?.email?.toLowerCase() === session.email.toLowerCase())
      .map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        currency: order.currency,
        dateCreated: order.date_created,
        items: (order.line_items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          total: item.total,
        })),
      }));

    return NextResponse.json({ orders: filtered });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch order history." },
      { status: 500 }
    );
  }
}
