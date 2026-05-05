import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | Signcous",
  description: "Contact Signcous support and sales for quotes, order help, and production questions.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14 md:py-20">
      <div className="overflow-hidden rounded-3xl border border-[#d8d8d8] bg-gradient-to-br from-[#fdf7ea] via-[#f5f5f5] to-[#ececec] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:border-[#2a2a2a] dark:from-[#1a1408] dark:via-[#111111] dark:to-[#161616]">
        <div className="border-b border-[#d9d1bd] px-7 py-7 dark:border-[#302819] md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6a0c] dark:text-[#d79a2e]">Contact Signcous</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#202020] dark:text-[#f1f1f1] md:text-4xl">
            We are ready to help with your next print order
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4f4f4f] dark:text-[#a8a8a8]">
            Reach out for product guidance, file setup support, bulk quote requests, or order status updates.
            Our team will route your message to the right specialist.
          </p>
        </div>

        <div className="grid gap-6 px-7 py-7 md:grid-cols-2 md:px-10 md:py-10">
          <article className="rounded-2xl border border-[#ddd4be] bg-[#fff8e6] p-6 dark:border-[#453716] dark:bg-[#1f1707]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b5f0a] dark:text-[#d79a2e]">Email</p>
            <a
              href="mailto:info@signcous.com"
              className="mt-3 inline-block text-2xl font-extrabold tracking-tight text-[#1f1f1f] underline decoration-[#d79a2e] decoration-2 underline-offset-4 hover:text-[#000] dark:text-[#fff1d6] dark:hover:text-white"
            >
              info@signcous.com
            </a>
            <p className="mt-4 text-sm text-[#5d5d5d] dark:text-[#b1b1b1]">
              Best for quotes, artwork prep questions, and general support.
            </p>
          </article>

          <article className="rounded-2xl border border-[#d7d7d7] bg-white/80 p-6 dark:border-[#2a2a2a] dark:bg-[#171717]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6a6a] dark:text-[#9b9b9b]">Response Window</p>
            <p className="mt-3 text-xl font-extrabold tracking-tight text-[#232323] dark:text-[#eeeeee]">
              Usually within one business day
            </p>
            <p className="mt-4 text-sm text-[#5d5d5d] dark:text-[#aeaeae]">
              Include your order number, product type, dimensions, and timeline to get the fastest answer.
            </p>
          </article>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-[#d9d1bd] px-7 py-6 dark:border-[#302819] md:px-10">
          <Link
            href="mailto:info@signcous.com"
            className="rounded-xl bg-[#d68500] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#bb7500]"
          >
            Email Signcous
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[#cfcfcf] bg-white px-5 py-2.5 text-sm font-semibold text-[#3b3b3b] transition-colors hover:bg-[#f2f2f2] dark:border-[#333] dark:bg-[#181818] dark:text-[#d0d0d0] dark:hover:bg-[#222]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
