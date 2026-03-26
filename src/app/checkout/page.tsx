"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

interface BillingForm {
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

const EMPTY_BILLING: BillingForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "US",
};

function Field({
  label,
  type = "text",
  required,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="sc-label-fx mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-orange-400">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
      />
    </div>
  );
}

function PaymentForm({
  subtotal,
  onSuccess,
  onBack,
}: {
  subtotal: number;
  onSuccess: (paymentIntentId: string) => Promise<void>;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      setError("Payment was not completed. Please try again.");
      setSubmitting(false);
      return;
    }

    await onSuccess(paymentIntent.id);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Processing..." : `Pay ${formatPrice(subtotal)}`}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5"
      >
        Back to Details
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<"info" | "payment">("info");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingForm>(EMPTY_BILLING);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const setField = (key: keyof BillingForm, value: string) => {
    setBilling((previous) => ({ ...previous, [key]: value }));
  };

  async function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    setLoadingPayment(true);
    setInfoError(null);

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(subtotal * 100) }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInfoError(
          data.error ?? "Could not initialize payment. Please try again."
        );
        return;
      }

      const configResponse = await fetch("/api/stripe-config");
      const configData = await configResponse.json();

      if (!configResponse.ok || !configData.publishableKey) {
        setInfoError(
          configData.error ?? "Could not load Stripe configuration."
        );
        return;
      }

      setPublishableKey(configData.publishableKey);
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch {
      setInfoError("Could not initialize payment. Please try again.");
    } finally {
      setLoadingPayment(false);
    }
  }

  const handlePaymentSuccess = useCallback(
    async (paymentIntentId: string) => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, billing, paymentIntentId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to create order.");
      }

      clearCart();
      router.push(
        `/order-confirmation?orderId=${data.orderId}&total=${encodeURIComponent(
          data.total ?? subtotal.toFixed(2)
        )}`
      );
    },
    [billing, clearCart, items, router, subtotal]
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-center text-white">
        <p className="text-zinc-400">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold transition-colors hover:bg-orange-400"
        >
          Shop Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 text-white">
      <h1 className="text-4xl font-black tracking-tight">Checkout</h1>

      <div className="mt-5 flex items-center gap-3 text-sm">
        <span
          className={`font-semibold ${
            step === "info" ? "text-orange-400" : "text-zinc-500"
          }`}
        >
          1. Contact and Shipping
        </span>
        <span className="text-zinc-700">-&gt;</span>
        <span
          className={`font-semibold ${
            step === "payment" ? "text-orange-400" : "text-zinc-500"
          }`}
        >
          2. Payment
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {step === "info" && (
            <form onSubmit={handleContinue} className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
                <h2 className="mb-5 text-lg font-bold">Contact Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="First name"
                    required
                    value={billing.first_name}
                    onChange={(value) => setField("first_name", value)}
                  />
                  <Field
                    label="Last name"
                    required
                    value={billing.last_name}
                    onChange={(value) => setField("last_name", value)}
                  />
                  <Field
                    label="Email"
                    type="email"
                    required
                    value={billing.email}
                    onChange={(value) => setField("email", value)}
                  />
                  <Field
                    label="Phone"
                    type="tel"
                    value={billing.phone}
                    onChange={(value) => setField("phone", value)}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
                <h2 className="mb-5 text-lg font-bold">Shipping Address</h2>
                <div className="grid gap-4">
                  <Field
                    label="Address line 1"
                    required
                    value={billing.address_1}
                    onChange={(value) => setField("address_1", value)}
                  />
                  <Field
                    label="Address line 2"
                    value={billing.address_2}
                    onChange={(value) => setField("address_2", value)}
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="City"
                      required
                      value={billing.city}
                      onChange={(value) => setField("city", value)}
                    />
                    <Field
                      label="State"
                      required
                      value={billing.state}
                      onChange={(value) => setField("state", value)}
                    />
                    <Field
                      label="ZIP code"
                      required
                      value={billing.postcode}
                      onChange={(value) => setField("postcode", value)}
                    />
                  </div>
                  <div>
                    <label className="sc-label-fx mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                      Country
                    </label>
                    <select
                      value={billing.country}
                      onChange={(event) => setField("country", event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              {infoError && (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {infoError}
                </p>
              )}

              <button
                type="submit"
                disabled={loadingPayment}
                className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400 disabled:opacity-50"
              >
                {loadingPayment ? "Loading..." : "Continue to Payment"}
              </button>
            </form>
          )}

          {step === "payment" && clientSecret && publishableKey && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {billing.first_name} {billing.last_name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">{billing.email}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {billing.address_1}, {billing.city}, {billing.state} {billing.postcode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("info")}
                    className="text-xs text-orange-400 transition-colors hover:text-orange-300"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
                <h2 className="mb-5 text-lg font-bold">Payment</h2>
                <p className="mb-4 text-xs text-zinc-500">
                  Payments are processed securely by Stripe.
                </p>
                <Elements
                  stripe={loadStripe(publishableKey)}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      variables: {
                        colorPrimary: "#f97316",
                        colorBackground: "#09090b",
                        colorText: "#f4f4f5",
                        colorDanger: "#ef4444",
                        borderRadius: "12px",
                      },
                    },
                  }}
                >
                  <PaymentForm
                    subtotal={subtotal}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep("info")}
                  />
                </Elements>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {item.productName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.width}x{item.height} {item.unit} · x{item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-zinc-200">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Shipping calculated separately if needed.
            </p>
          </div>
          <Link
            href="/cart"
            className="mt-4 block w-full rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
