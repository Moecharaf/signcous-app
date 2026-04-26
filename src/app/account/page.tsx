"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface UserProfile {
  email: string;
  username?: string;
  displayName?: string;
}

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  total: string;
}

interface AccountOrder {
  id: number;
  status: string;
  total: string;
  currency: string;
  dateCreated: string;
  items: OrderItem[];
}

function formatCurrency(value: string, currency: string): string {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return `${value} ${currency}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const meData = await meResponse.json();

        if (!mounted) return;

        if (!meData.authenticated) {
          setUser(null);
          setOrders([]);
          return;
        }

        setUser(meData.user);

        const ordersResponse = await fetch("/api/auth/orders", { cache: "no-store" });
        const ordersData = await ordersResponse.json();

        if (!mounted) return;

        if (!ordersResponse.ok) {
          setError(ordersData.error ?? "Could not load order history.");
          return;
        }

        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
      } catch {
        if (!mounted) return;
        setError("Could not load account data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-white">
        <p className="text-zinc-400">Loading account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-white">
        <h1 className="text-4xl font-black tracking-tight">Account</h1>
        <p className="mt-4 text-zinc-400">You are not signed in.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold hover:bg-orange-400"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-black tracking-tight">My Account</h1>
          <p className="mt-2 text-zinc-400">
            Signed in as {user.displayName || user.username || user.email}
          </p>
        </div>
        <button
          onClick={signOut}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          Sign Out
        </button>
      </div>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-lg font-bold">Order History</h2>

        {orders.length === 0 ? (
          <p className="mt-4 text-zinc-400">No orders found for this account yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-zinc-300">
                    <span className="font-semibold text-white">Order #{order.id}</span>
                    <span className="mx-2 text-zinc-600">•</span>
                    <span className="uppercase tracking-wide">{order.status}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {formatCurrency(order.total, order.currency)}
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(order.dateCreated)}</p>

                {order.items.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="text-zinc-400">{item.total}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
