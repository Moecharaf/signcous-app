import Link from "next/link";

const shopLinks = [
  { href: "/#banner", label: "Banner" },
  { href: "/banners/vinyl-banner", label: "HD Banner" },
  { href: "/banners/hdpe", label: "HDPE" },
  { href: "/#rigid", label: "Rigid" },
  { href: "/#adhesive", label: "Adhesive" },
  { href: "/#magnet", label: "Magnet" },
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
    <footer className="border-t border-[#d4d4d4] bg-[#f1f1f1] text-[#4b4b4b]">
      <div className="border-b border-[#dadada] bg-[#ececec] px-6 py-2">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-6 text-[11px] font-medium uppercase tracking-[0.14em] text-[#666] sm:justify-between">
          <span>Trade Pricing</span>
          <span>Fast Reorder Workflow</span>
          <span>Proof Approval Ready</span>
          <span className="font-semibold text-[#c87500]">Studio-Powered Ordering</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-10 px-6 py-12 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="rounded bg-[#ffd100] px-2 py-1 text-xs font-black tracking-widest text-[#262626] ring-1 ring-[#c3ab31]">
              SC
            </span>
            <div className="text-xl font-black text-[#2c2c2c]">
              SIGNCO<span className="text-[#c87500]">US</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-[#5f5f5f]">
            Custom print ordering for businesses, events, and individuals. Fast turnaround, premium quality, nationwide delivery.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d8b72d] bg-[#fff4bf] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a5100]">
            Web-to-Print Platform
          </div>
        </div>

        {/* Shop */}
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#666]">Shop</div>
          <ul className="mt-4 space-y-3 text-sm text-[#555]">
            {shopLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-[#1f1f1f]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#666]">Company</div>
          <ul className="mt-4 space-y-3 text-sm text-[#555]">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-[#1f1f1f]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#666]">Support</div>
          <ul className="mt-4 space-y-3 text-sm text-[#555]">
            {supportLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-[#1f1f1f]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#d8d8d8] px-6 py-5">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-3 text-xs text-[#777] sm:flex-row">
          <span>© {new Date().getFullYear()} Signcous. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/terms" className="transition-colors hover:text-[#333]">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-[#333]">Privacy</Link>
            <Link href="/refund-policy" className="transition-colors hover:text-[#333]">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
