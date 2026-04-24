"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useCart } from "@/context/CartContext";

const categoryNavLinks = [
  { hash: "banner", label: "Banner", icon: "▦" },
  { hash: "rigid", label: "Rigid", icon: "▣" },
  { hash: "adhesive", label: "Adhesive", icon: "◫" },
  { hash: "magnet", label: "Magnet", icon: "∪" },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8" />;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#d0d0d0] bg-white text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#d0d0d0] dark:hover:bg-[#252525]"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-[#cfcfcf] bg-[#f5f5f5]/95 backdrop-blur dark:border-[#2a2a2a] dark:bg-[#111111]/95">
      <div className="border-b border-[#dadada] bg-[#efefef] px-4 py-1.5 text-[11px] text-[#555] dark:border-[#222] dark:bg-[#0d0d0d] dark:text-[#888] md:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <span className="uppercase tracking-[0.18em] text-[#666] dark:text-[#777]">Signcous Trade Print Platform</span>
          <div className="hidden items-center gap-4 sm:flex">
            <span>Fast Turnaround</span>
            <span className="text-[#a0a0a0] dark:text-[#555]">|</span>
            <span>Nationwide Delivery</span>
            <span className="text-[#a0a0a0] dark:text-[#555]">|</span>
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
            <div className="text-xl font-black tracking-wide text-[#2d2d2d] dark:text-[#e8e8e8]">
              SIGNCO<span className="text-[#d37800]">US</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#707070] dark:text-[#666]">
              Print Portal
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a4a4a] dark:text-[#aaa] lg:flex">
          {categoryNavLinks.map((link) => (
            <a
              key={`${link.hash}-${link.label}`}
              href={`/#${link.hash}`}
              className="group inline-flex min-w-[94px] flex-col items-center rounded-sm border border-[#d2d2d2] bg-white px-3 py-2.5 transition hover:border-[#d8b72d] hover:bg-[#fff8d7] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:border-[#d8b72d] dark:hover:bg-[#1f1a00]"
            >
              <span className="text-base leading-none text-[#808080] transition group-hover:text-[#3b3b3b] dark:text-[#666] dark:group-hover:text-[#ccc]">
                {link.icon}
              </span>
              {link.label}
            </a>
          ))}
          <Link
            href="/quote"
            className="group inline-flex min-w-[94px] flex-col items-center rounded-sm border border-[#d2d2d2] bg-white px-3 py-2.5 transition hover:border-[#d8b72d] hover:bg-[#fff8d7] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:border-[#d8b72d] dark:hover:bg-[#1f1a00]"
          >
            Custom Quote
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/account"
            className="rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#252525]"
          >
            Sign In
          </Link>
          <Link
            href="/cart"
            className="relative rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#252525]"
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

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="flex flex-col gap-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-[#3a3a3a] transition-transform dark:bg-[#ccc] ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-[#3a3a3a] transition-opacity dark:bg-[#ccc] ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-[#3a3a3a] transition-transform dark:bg-[#ccc] ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[#d6d6d6] bg-[#f5f5f5] px-4 pb-5 dark:border-[#222] dark:bg-[#111] md:hidden">
          <nav className="flex flex-col gap-3 pt-4 text-sm text-[#4c4c4c] dark:text-[#bbb]">
            {categoryNavLinks.map((link) => (
              <a
                key={`${link.hash}-${link.label}`}
                href={`/#${link.hash}`}
                className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#fff8d7] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#1f1a00]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/quote"
              className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#fff8d7] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#1f1a00]"
              onClick={() => setMenuOpen(false)}
            >
              Custom Quote
            </Link>
            <Link href="/cart" className="flex items-center gap-2 rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#f4f4f4] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]" onClick={() => setMenuOpen(false)}>
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
