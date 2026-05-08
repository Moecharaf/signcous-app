import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Signcous",
  description:
    "Learn about Signcous, our trade print focus, and how we help customers order premium signage faster.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
      <div className="overflow-hidden rounded-3xl border border-[#d8d8d8] bg-gradient-to-br from-[#f5f5f5] via-[#faf6ee] to-[#ececec] shadow-[0_18px_45px_rgba(0,0,0,0.08)] dark:border-[#2a2a2a] dark:from-[#111111] dark:via-[#1a1408] dark:to-[#151515]">
        <div className="border-b border-[#ddd2b8] px-7 py-8 dark:border-[#332a18] md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)] dark:text-[var(--brand-primary)]">
            About Signcous
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f1f1f] dark:text-[#f1f1f1] md:text-5xl">
            Built for faster custom print ordering
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#505050] dark:text-[#ababab]">
            Signcous is a web-to-print platform focused on quality signage, clear pricing, and smooth production workflows.
            We help businesses and organizations get banners, rigid signs, adhesive graphics, and magnets ordered with confidence.
          </p>
        </div>

        <div className="grid gap-6 px-7 py-8 md:grid-cols-3 md:px-10">
          <article className="rounded-2xl border border-[#d6d6d6] bg-white/80 p-6 dark:border-[#2d2d2d] dark:bg-[#171717]">
            <h2 className="text-lg font-extrabold tracking-tight text-[#2b2b2b] dark:text-[#f0f0f0]">What We Prioritize</h2>
            <p className="mt-3 text-sm leading-7 text-[#595959] dark:text-[#aeaeae]">
              Consistent print quality, practical product options, and timelines that support real deadlines.
            </p>
          </article>

          <article className="rounded-2xl border border-[#d6d6d6] bg-white/80 p-6 dark:border-[#2d2d2d] dark:bg-[#171717]">
            <h2 className="text-lg font-extrabold tracking-tight text-[#2b2b2b] dark:text-[#f0f0f0]">How We Work</h2>
            <p className="mt-3 text-sm leading-7 text-[#595959] dark:text-[#aeaeae]">
              Live category pricing, builder-based product flows, and a support-first process from artwork upload to final delivery.
            </p>
          </article>

          <article className="rounded-2xl border border-[#d6d6d6] bg-white/80 p-6 dark:border-[#2d2d2d] dark:bg-[#171717]">
            <h2 className="text-lg font-extrabold tracking-tight text-[#2b2b2b] dark:text-[#f0f0f0]">Need Help?</h2>
            <p className="mt-3 text-sm leading-7 text-[#595959] dark:text-[#aeaeae]">
              Reach us at
              <a href="mailto:info@signcous.com" className="ml-1 font-semibold text-[var(--brand-primary)] underline decoration-[var(--brand-primary)] underline-offset-4 dark:text-[var(--brand-primary)]">
                info@signcous.com
              </a>
              for quotes, product guidance, and order support.
            </p>
          </article>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-[#ddd2b8] px-7 py-6 dark:border-[#332a18] md:px-10">
          <Link
            href="/contact"
            className="rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)]"
          >
            Contact Us
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[#cfcfcf] bg-white px-5 py-2.5 text-sm font-semibold text-[#3d3d3d] transition-colors hover:bg-[#f2f2f2] dark:border-[#333] dark:bg-[#181818] dark:text-[#d0d0d0] dark:hover:bg-[#222]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
