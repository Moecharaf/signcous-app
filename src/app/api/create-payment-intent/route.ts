import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/stripe-config";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(getStripeSecretKey());
    const { amountCents } = await req.json();

    if (!amountCents || typeof amountCents !== "number" || amountCents < 50) {
      return NextResponse.json(
        { error: "Invalid amount — minimum is $0.50" },
        { status: 400 }
      );
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { source: "signcous_web" },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return NextResponse.json(
      { error: "Could not create payment session. Please try again." },
      { status: 500 }
    );
  }
}
