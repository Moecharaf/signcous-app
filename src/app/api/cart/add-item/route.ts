import { NextRequest, NextResponse } from "next/server";

const WOO_BASE_URL = process.env.NEXT_PUBLIC_WOO_BASE_URL ?? "";
const WOO_KEY = process.env.WOO_CONSUMER_KEY ?? "";
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity, itemData } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Missing productId or quantity" },
        { status: 400 }
      );
    }

    // Extract calculated prices passed from the builder
    const unitPrice = itemData?.custom_unit_price
      ? parseFloat(itemData.custom_unit_price)
      : undefined;
    const totalPrice = itemData?.custom_total_price
      ? parseFloat(itemData.custom_total_price)
      : undefined;

    // Prepare the line item with metadata
    // Pass subtotal/total explicitly so WooCommerce uses the builder price,
    // not the fixed catalog price on the product.
    const lineItem: Record<string, unknown> = {
      product_id: productId,
      quantity: quantity,
      meta_data: itemData ? Object.entries(itemData).map(([key, value]) => ({
        key,
        value,
      })) : [],
    };

    if (unitPrice !== undefined && !isNaN(unitPrice)) {
      lineItem.price    = unitPrice.toFixed(2);
      lineItem.subtotal = (unitPrice * quantity).toFixed(2);
      lineItem.total    = totalPrice !== undefined && !isNaN(totalPrice)
        ? totalPrice.toFixed(2)
        : (unitPrice * quantity).toFixed(2);
    }

    // Create order via WooCommerce REST API (v3) with auth
    const token = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");
    
    const response = await fetch(`${WOO_BASE_URL}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify({
        line_items: [lineItem],
        status: "pending",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("WooCommerce error:", errorData);
      return NextResponse.json(
        { error: errorData?.message ?? "Failed to add to cart" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      orderId: data.id,
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
