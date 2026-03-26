"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const categoryNavLinks = [
  {
    hash: "banner",
    label: "Banner",
    icon: "▦",
    eyebrow: "Flexible Media",
    detail: "Vinyl, mesh, no-curl and poster options",
    texture: "from-[#ffffff]/90 via-[#f4f4f4]/70 to-[#ececec]/80",
  },
  {
    hash: "rigid",
    label: "Rigid",
    icon: "▣",
    eyebrow: "Panel Products",
    detail: "PVC, foamboard, acrylic and aluminum",
    texture: "from-[#ffffff]/90 via-[#eef3f7]/70 to-[#e7edf2]/80",
  },
  {
    hash: "adhesive",
    label: "Adhesive",
    icon: "◫",
    eyebrow: "Sticky Graphics",
    detail: "Wall, window and floor applications",
    texture: "from-[#ffffff]/90 via-[#f8f3eb]/70 to-[#f1e9dd]/80",
  },
  {
    hash: "magnet",
    label: "Magnet",
    icon: "∪",
    eyebrow: "Magnetic Prints",
    detail: "Vehicle and retail-ready magnetic sheets",
    texture: "from-[#ffffff]/90 via-[#f1f1f1]/70 to-[#e8e8e8]/80",
  },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-[#cfcfcf] bg-[#f5f5f5]/95 backdrop-blur">
      <div className="border-b border-[#dadada] bg-[#efefef] px-4 py-1.5 text-[11px] text-[#555] md:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <span className="uppercase tracking-[0.18em] text-[#666]">Signcous Trade Print Platform</span>
          <div className="hidden items-center gap-4 sm:flex">
            <span>Fast Turnaround</span>
            <span className="text-[#a0a0a0]">|</span>
            <span>Nationwide Delivery</span>
            <span className="text-[#a0a0a0]">|</span>
            <span className="font-semibold text-[#d37800]">Live Category Pricing</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#ffd100] ring-1 ring-[#c3ab31]">
            <span className="text-sm font-black tracking-widest text-[#262626]">SC</span>
          </div>
          <div>
            <div className="text-xl font-black tracking-wide text-[#2d2d2d]">
              SIGNCO<span className="text-[#d37800]">US</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#707070]">
              Print Portal
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a4a4a] lg:flex">
          {categoryNavLinks.map((link) => (
            <a
              key={`${link.hash}-${link.label}`}
              href={`/#${link.hash}`}
              className="group relative isolate inline-flex min-w-[132px] flex-col items-start overflow-hidden rounded-sm border border-white/70 bg-white/65 px-3 py-2.5 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] backdrop-blur-sm transition duration-300 hover:border-[#d8b72d] hover:bg-white/88"
            >
              <span
                className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${link.texture} opacity-60 transition duration-300 group-hover:opacity-95`}
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute -right-2 -top-3 text-[44px] leading-none text-[#8f8f8f]/28 transition duration-300 group-hover:text-[#686868]/42"
                aria-hidden="true"
              >
                {link.icon}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#808080]">
                {link.eyebrow}
              </span>
              <span className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-[#3f3f3f]">
                {link.label}
              </span>
              <span className="mt-1 max-h-0 overflow-hidden text-[10px] normal-case tracking-normal text-[#5f5f5f] opacity-0 transition-all duration-300 group-hover:max-h-10 group-hover:opacity-100">
                {link.detail}
              </span>
            </a>
          ))}
          <Link
            href="/quote"
            className="group relative isolate inline-flex min-w-[132px] flex-col items-start overflow-hidden rounded-sm border border-white/70 bg-white/65 px-3 py-2.5 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] backdrop-blur-sm transition duration-300 hover:border-[#d8b72d] hover:bg-white/88"
          >
            <span
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#ffffff]/90 via-[#f7f7f7]/70 to-[#eeeeee]/80 opacity-65 transition duration-300 group-hover:opacity-95"
              aria-hidden="true"
            />
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#808080]">Service</span>
            <span className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-[#3f3f3f]">Custom Quote</span>
            <span className="mt-1 max-h-0 overflow-hidden text-[10px] normal-case tracking-normal text-[#5f5f5f] opacity-0 transition-all duration-300 group-hover:max-h-10 group-hover:opacity-100">
              Upload specs and get a tailored print estimate
            </span>
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/account"
            className="rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4]"
          >
            Sign In
          </Link>
          <Link
            href="/cart"
            className="relative rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4]"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4fae2c] text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
          <Link
            href="/quote"
            className="rounded-sm border border-[#d8b72d] bg-[#ffd100] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2f2f2f] transition-colors hover:bg-[#ffdb3d]"
          >
            Quote
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-[#3a3a3a] transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-[#3a3a3a] transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-[#3a3a3a] transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[#d6d6d6] bg-[#f5f5f5] px-4 pb-5 md:hidden">
          <nav className="flex flex-col gap-3 pt-4 text-sm text-[#4c4c4c]">
            {categoryNavLinks.map((link) => (
              <a
                key={`${link.hash}-${link.label}`}
                href={`/#${link.hash}`}
                className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#fff8d7]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/quote"
              className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#fff8d7]"
              onClick={() => setMenuOpen(false)}
            >
              Custom Quote
            </Link>
            <Link href="/cart" className="flex items-center gap-2 rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#f4f4f4]" onClick={() => setMenuOpen(false)}>
              Cart
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4fae2c] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href="/quote"
              className="mt-1 rounded-sm border border-[#d8b72d] bg-[#ffd100] px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#2f2f2f]"
              onClick={() => setMenuOpen(false)}
            >
              Request Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
