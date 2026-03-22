import { NextResponse } from "next/server";
import { getStripePublishableKey } from "@/lib/stripe-config";

export async function GET() {
  const publishableKey = getStripePublishableKey();

  if (!publishableKey) {
    return NextResponse.json(
      { error: "Missing Stripe publishable key." },
      { status: 500 }
    );
  }

  return NextResponse.json({ publishableKey });
}
