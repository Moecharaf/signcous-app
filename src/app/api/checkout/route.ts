import { NextRequest, NextResponse } from "next/server";
import type { CartItem } from "@/context/CartContext";

const WOO_BASE_URL = process.env.NEXT_PUBLIC_WOO_BASE_URL ?? "";
const WOO_KEY = process.env.WOO_CONSUMER_KEY ?? "";
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET ?? "";

interface BillingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, billing, paymentIntentId } = body as {
      items: CartItem[];
      billing: BillingAddress;
      paymentIntentId?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!billing?.email || !billing?.first_name) {
      return NextResponse.json(
        { error: "Missing required billing fields" },
        { status: 400 }
      );
    }

    const lineItems = items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      price: item.unitPrice.toFixed(2),
      subtotal: item.totalPrice.toFixed(2),
      total: item.totalPrice.toFixed(2),
      meta_data: [
        { key: "custom_width", value: String(item.width) },
        { key: "custom_height", value: String(item.height) },
        { key: "custom_unit", value: item.unit },
        { key: "custom_material", value: item.material },
        { key: "custom_double_sided", value: item.doubleSided ? "yes" : "no" },
        { key: "custom_grommets", value: item.grommets ? "yes" : "no" },
        { key: "custom_pole_pockets", value: item.polePockets ? "yes" : "no" },
        { key: "custom_wind_slits", value: item.windSlits ? "yes" : "no" },
        { key: "custom_hemming", value: item.hemming ? "yes" : "no" },
        { key: "custom_rush", value: item.rush ? "yes" : "no" },
        { key: "custom_file_url", value: item.uploadedFileUrl ?? "" },
        { key: "custom_file_name", value: item.uploadedFileName ?? "" },
        { key: "custom_unit_price", value: item.unitPrice.toFixed(2) },
        { key: "custom_total_price", value: item.totalPrice.toFixed(2) },
      ],
    }));

    const token = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");

    // If a Stripe PaymentIntent ID is present, store it and mark order as paid
    const orderStatus = paymentIntentId ? "processing" : "pending";
    const paymentMeta = paymentIntentId
      ? [{ key: "stripe_payment_intent", value: paymentIntentId }]
      : [];

    const response = await fetch(`${WOO_BASE_URL}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify({
        status: orderStatus,
        billing,
        shipping: {
          first_name: billing.first_name,
          last_name: billing.last_name,
          address_1: billing.address_1,
          address_2: billing.address_2,
          city: billing.city,
          state: billing.state,
          postcode: billing.postcode,
          country: billing.country,
        },
        line_items: lineItems,
        meta_data: paymentMeta,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("WooCommerce checkout error:", err);
      return NextResponse.json(
        { error: err?.message ?? "Failed to create order" },
        { status: response.status }
      );
    }

    const order = await response.json();
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderKey: order.order_key,
      paymentUrl: order.payment_url,
      total: order.total,
    });
  } catch (err) {
    console.error("Checkout route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
