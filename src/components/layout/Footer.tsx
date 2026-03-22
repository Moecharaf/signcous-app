import Link from "next/link";

const shopLinks = [
  { href: "/banners/vinyl-banner", label: "Vinyl Banners" },
  { href: "/shop/yard-signs", label: "Yard Signs" },
  { href: "/shop/aluminum-signs", label: "Aluminum Signs" },
  { href: "/shop/stickers", label: "Stickers & Decals" },
  { href: "/shop/business-cards", label: "Business Cards" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/why-signcous", label: "Why Signcous" },
  { href: "/blog", label: "Blog" },
];

const supportLinks = [
  { href: "/file-setup-guide", label: "File Setup Guide" },
  { href: "/shipping", label: "Shipping & Turnaround" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 sm:justify-between">
          <span>Trade Pricing</span>
          <span>Fast Reorder Workflow</span>
          <span>Proof Approval Ready</span>
          <span className="text-orange-400">Studio-Powered Ordering</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="rounded bg-orange-500/15 px-2 py-1 text-xs font-black tracking-widest text-orange-400 ring-1 ring-orange-500/35">
              SC
            </span>
            <div className="text-xl font-black text-zinc-100">
              SIGNCO<span className="text-orange-500">US</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Custom print ordering for businesses, events, and individuals. Fast turnaround, premium quality, nationwide delivery.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-300">
            Web-to-Print Platform
          </div>
        </div>

        {/* Shop */}
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Shop</div>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {shopLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Company</div>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Support</div>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {supportLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-800 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-zinc-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Signcous. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-zinc-300 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
