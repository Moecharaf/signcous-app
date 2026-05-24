import Image from "next/image";
import Link from "next/link";
import { Manrope, Oswald } from "next/font/google";

const displayFont = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export default function LandingPage() {
  return (
    <section className={`${bodyFont.className} relative isolate min-h-[calc(100vh-80px)] overflow-hidden bg-[#060a14] text-white`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(0,122,255,.32),transparent_52%),radial-gradient(circle_at_82%_20%,rgba(255,124,0,.28),transparent_42%),linear-gradient(180deg,rgba(3,7,18,.32),rgba(3,7,18,.88))]"
      />
      <Image
        src="/card-images/landing-hero-signcous.png"
        alt="Signcous banner, rigid signs, and storefront graphics showcase"
        fill
        priority
        className="object-cover object-center opacity-65"
        sizes="100vw"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-end gap-4 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl rounded-2xl border border-white/20 bg-black/45 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-[#ff8a1a] uppercase">
            Trade Print Portal
          </p>
          <h1 className={`${displayFont.className} mt-4 text-4xl leading-[0.95] font-bold tracking-[0.02em] sm:text-5xl lg:text-6xl`}>
            Make Your Brand
            <span className="block bg-gradient-to-r from-[#ff8a1a] via-[#ffa64d] to-[#2a8cff] bg-clip-text text-transparent">
              Unmissable
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm text-white/85 sm:text-base">
            Live pricing, fast-turn production, and consistent quality for banners, rigid signs, wraps, and magnets.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/portal"
              className="sc-cta-sweep inline-flex items-center justify-center rounded-lg bg-[#ff7f00] px-5 py-3 text-sm font-extrabold tracking-[0.05em] text-black transition hover:bg-[#ff9f3f]"
            >
              Enter Main Website
            </Link>
            <Link
              href="/login?next=/portal"
              className="inline-flex items-center justify-center rounded-lg border border-white/50 bg-white/5 px-5 py-3 text-sm font-extrabold tracking-[0.05em] text-white transition hover:bg-white/15"
            >
              Login
            </Link>
            <Link
              href="/signup?next=/portal"
              className="inline-flex items-center justify-center rounded-lg border border-[#4d8ff5]/80 bg-[#0a1a3a] px-5 py-3 text-sm font-extrabold tracking-[0.05em] text-[#90beff] transition hover:bg-[#102654]"
            >
              Apply
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
