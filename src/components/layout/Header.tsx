"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/banners/vinyl-banner", label: "Banners" },
  { href: "/banners/vinyl-banner", label: "Studio" },
  { href: "/quote", label: "Custom Quote" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-700/40 bg-zinc-950/95 backdrop-blur">
      <div className="border-b border-zinc-800/80 bg-zinc-900/80 px-6 py-1.5 text-[11px] text-zinc-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="uppercase tracking-[0.18em] text-zinc-400">Trade Print Platform</span>
          <div className="hidden items-center gap-4 sm:flex">
            <span>Fast Turnaround</span>
            <span className="text-zinc-600">|</span>
            <span>Nationwide Delivery</span>
            <span className="text-zinc-600">|</span>
            <span className="text-orange-400">Studio Live Pricing</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 ring-1 ring-orange-500/40">
            <span className="text-sm font-black tracking-widest text-orange-500">SC</span>
          </div>
          <div>
            <div className="text-xl font-black tracking-wide text-zinc-100">
              SIGNCO<span className="text-orange-500">US</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-400">
              Custom Print Ordering
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          {navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={`transition-colors hover:text-white ${
                link.label === "Studio"
                  ? "rounded-full border border-orange-500/35 bg-orange-500/10 px-3 py-1 text-orange-300"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/account"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            Sign In
          </Link>
          <Link
            href="/cart"
            className="relative rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
          <Link
            href="/quote"
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-400"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-zinc-100 transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-zinc-100 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-zinc-100 transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 pb-6 md:hidden">
          <nav className="flex flex-col gap-4 pt-4 text-sm text-zinc-300">
            {navLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-white" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/cart" className="flex items-center gap-2 hover:text-white" onClick={() => setMenuOpen(false)}>
              Cart
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href="/quote"
              className="mt-2 rounded-xl bg-orange-500 px-4 py-2 text-center text-sm font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              Get a Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
