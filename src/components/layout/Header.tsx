"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/components/layout/ThemeProvider";

const MagnetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
    <path d="M18.15 5.43c-1.83-1.72-4.23-2.57-6.75-2.41C6.69 3.33 3 7.39 3 12.27v6.23A2.5 2.5 0 0 0 5.5 21h2a2.5 2.5 0 0 0 2.5-2.5v-6.33c0-1.14.85-2.11 1.89-2.17.56-0 1.08.17 1.49.55.4.38.62.9.62 1.45v6.5a2.5 2.5 0 0 0 2.5 2.5h2a2.5 2.5 0 0 0 2.5-2.5V12c0-2.48-1.04-4.87-2.85-6.57ZM7.5 19h-2c-.28 0-.5-.22-.5-.5V17h3v1.5c0 .28-.22.5-.5.5Zm11 0h-2c-.28 0-.5-.22-.5-.5V17h3v1.5c0 .28-.22.5-.5.5Z" />
  </svg>
);

const AdhesiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="30" height="30" fill="currentColor" aria-hidden="true">
    <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 15 8.586V2.5A1.5 1.5 0 0 0 13.5 1h-11zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V8H9.5A1.5 1.5 0 0 0 8 9.5V14H2.5a.5.5 0 0 1-.5-.5v-11zm7 11.293V9.5a.5.5 0 0 1 .5-.5h4.293L9 13.793z"/>
  </svg>
);

const RigidIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-3.59 0 68.16 68.16" width="30" height="30" fill="currentColor" aria-hidden="true">
    <g transform="translate(-594.805 -384.47)">
      <path d="M645.015 412.48a2.016 2.016 0 0 0 1.41-.58l8.77-8.77a1.966 1.966 0 0 0 .59-1.41 2.006 2.006 0 0 0-.59-1.42l-8.77-8.76a2.016 2.016 0 0 0-1.41-.58h-13.34v-4.49a1.993 1.993 0 0 0-2-2h-9.77a1.993 1.993 0 0 0-2 2v4.49h-12.68a1.993 1.993 0 0 0-2 2v17.52a1.993 1.993 0 0 0 2 2h12.68v4.11h-12.33a2.016 2.016 0 0 0-1.41.58l-8.77 8.76a2.006 2.006 0 0 0-.59 1.42 1.966 1.966 0 0 0 .59 1.41l8.77 8.77a2.016 2.016 0 0 0 1.41.58h12.33v10.52a2 2 0 0 0 .07 4h13.65a2 2 0 0 0 .05-4V438.11h13.69a1.993 1.993 0 0 0 2-2V418.59a1.993 1.993 0 0 0-2-2h-13.69v-4.11Zm-23.11-24.01h5.77v2.49h-5.77Zm5.77 60.16h-5.77V438.11h5.77Zm15.69-28.04v13.52h-36.96l-6.77-6.76 6.77-6.76Zm-21.46-4v-4.11h5.77v4.11Zm-14.68-8.11V394.96h36.96l6.77 6.76-6.77 6.76Z" />
      <path d="M632.722 403.719h-14.854a2 2 0 0 1 0-4h14.854a2 2 0 0 1 0 4Z" />
      <path d="M632.618 429.35h-14.646a2 2 0 0 1 0-4h14.646a2 2 0 0 1 0 4Z" />
    </g>
  </svg>
);

const BannerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 317.113 317.113" width="38" height="38" fill="currentColor" aria-hidden="true">
    <g>
      <polygon points="291.927,136.019 291.927,181.092 317.113,181.092 306.509,157.293 317.113,136.019" />
      <polygon points="262.484,187.999 286.624,187.999 286.624,181.092 286.624,136.019 286.624,129.111 262.484,129.111" />
      <polygon points="25.187,181.092 25.187,136.019 0,136.019 10.604,157.956 0,181.092" />
      <polygon points="30.489,181.092 30.489,187.999 54.629,187.999 54.629,129.111 30.489,129.111 30.489,136.019" />
      <polygon points="59.932,123.809 59.932,126.46 59.932,129.111 59.932,187.999 59.932,190.65 59.932,193.302 59.932,199.826 257.182,199.826 257.182,193.302 257.182,190.65 257.182,187.999 257.182,129.111 257.182,126.46 257.182,123.809 257.182,117.287 59.932,117.287" />
    </g>
  </svg>
);

const categoryNavLinks: { hash: string; label: string; icon: React.ReactNode }[] = [
  { hash: "banner", label: "Banner", icon: <BannerIcon /> },
  { hash: "rigid", label: "Rigid", icon: <RigidIcon /> },
  { hash: "adhesive", label: "Adhesive", icon: <AdhesiveIcon /> },
  { hash: "magnet", label: "Magnet", icon: <MagnetIcon /> },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = useRef(0);
  const showHeaderRef = useRef(true);
  const { itemCount } = useCart();

  useEffect(() => {
    let mounted = true;

    async function loadAuthState() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await response.json()) as { authenticated?: boolean };

        if (!mounted) return;
        setIsAuthenticated(Boolean(data.authenticated));
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
      }
    }

    loadAuthState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    showHeaderRef.current = true;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (menuOpen) {
        if (!showHeaderRef.current) {
          showHeaderRef.current = true;
          setShowHeader(true);
        }
        lastScrollYRef.current = currentY;
        return;
      }

      let nextShowHeader = showHeaderRef.current;

      if (currentY <= 12) {
        nextShowHeader = true;
      } else if (delta > 10 && currentY > 120) {
        nextShowHeader = false;
      } else if (delta < -10) {
        nextShowHeader = true;
      }

      if (nextShowHeader !== showHeaderRef.current) {
        showHeaderRef.current = nextShowHeader;
        setShowHeader(nextShowHeader);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      showHeaderRef.current = true;
      setShowHeader(true);
    }
  }, [menuOpen]);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 overflow-visible border-b border-[#cfcfcf] bg-[#f5f5f5]/95 backdrop-blur transition-transform duration-300 will-change-transform dark:border-[#2a2a2a] dark:bg-[#111111]/95 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="border-b border-[#dadada] bg-[#efefef] px-4 py-1 text-[11px] text-[#555] dark:border-[#222] dark:bg-[#0d0d0d] dark:text-[#888] md:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <span className="uppercase tracking-[0.18em] text-[#666] dark:text-[#777]">Signcous Trade Print Platform</span>
          <div className="hidden items-center gap-4 sm:flex">
            <span>Fast Turnaround</span>
            <span className="text-[#a0a0a0] dark:text-[#555]">|</span>
            <span>Nationwide Delivery</span>
            <span className="text-[#a0a0a0] dark:text-[#555]">|</span>
            <span className="font-semibold text-[var(--brand-accent)]">Live Category Pricing</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 overflow-visible px-4 py-0 md:h-20 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center overflow-visible" aria-label="Signcous home">
          <Image
            src="/card-images/SIGNCO LOGO.png"
            alt="Signcous logo"
            width={480}
            height={175}
            priority
            className="h-24 w-auto object-contain object-center"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-end gap-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#666] dark:text-[#9a9a9a] lg:flex">
          {categoryNavLinks.map((link) => (
            <a
              key={`${link.hash}-${link.label}`}
              href={`/#${link.hash}`}
              className="group inline-flex min-w-[72px] flex-col items-center gap-2 px-1 py-1 transition-colors hover:text-[#3a3a3a] dark:hover:text-[#d0d0d0]"
            >
              <span className="leading-none text-[#7c7c7c] transition group-hover:text-[#3b3b3b] dark:text-[#767676] dark:group-hover:text-[#d3d3d3]">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/contact"
            className="rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#252525]"
          >
            Contact
          </Link>
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                className="rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#252525]"
              >
                Account
              </Link>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#252525]"
              >
                {isSigningOut ? "Signing Out" : "Sign Out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#252525]"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="rounded-sm border border-[#d0d0d0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b4b4b] transition-colors hover:bg-[#f4f4f4] dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#252525]"
              >
                Sign In
              </Link>
            </>
          )}
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
                className="inline-flex items-center gap-3 px-1 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#646464] transition-colors hover:text-[#2f2f2f] dark:text-[#9d9d9d] dark:hover:text-[#dedede]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-[#7b7b7b] dark:text-[#7d7d7d]">{link.icon}</span>
                <span>{link.label}</span>
              </a>
            ))}
            <Link
              href="/contact"
              className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#f4f4f4] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#f4f4f4] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void handleSignOut();
                  }}
                  disabled={isSigningOut}
                  className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 text-left hover:bg-[#f4f4f4] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
                >
                  {isSigningOut ? "Signing Out" : "Sign Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#f4f4f4] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#f4f4f4] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
            <Link href="/cart" className="flex items-center gap-2 rounded-sm border border-[#d3d3d3] bg-white px-3 py-2 hover:bg-[#f4f4f4] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]" onClick={() => setMenuOpen(false)}>
              Cart
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4fae2c] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
