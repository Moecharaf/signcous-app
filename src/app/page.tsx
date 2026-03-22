import Link from "next/link";

const categories = [
  { name: "Vinyl Banners", href: "/shop/vinyl-banners", desc: "Custom size, full-color banners for any event." },
  { name: "Yard Signs", href: "/shop/yard-signs-coroplast", desc: "Coroplast signs for campaigns, retail, and real estate." },
  { name: "Aluminum Signs", href: "/shop/aluminum-signs", desc: "Durable metal signage for long-term exterior use." },
  { name: "Stickers & Decals", href: "/shop/stickers-decals", desc: "Indoor and outdoor adhesive vinyl in any shape." },
  { name: "Business Cards", href: "/shop/business-cards", desc: "Premium full-color cards that make an impression." },
  { name: "Mesh Banners", href: "/shop/mesh-banners", desc: "Wind-resistant mesh for outdoor installations." },
];

const featuredProducts = [
  { name: "Vinyl Banners", href: "/shop/vinyl-banners", price: "From $12.00", specs: "Any size · 13-oz material · Full color" },
  { name: "Yard Signs", href: "/shop/yard-signs-coroplast", price: "From $2.45/ea", specs: "18×24 · Coroplast · Double-sided" },
  { name: "Aluminum Signs", href: "/shop/aluminum-signs", price: "From $8.00", specs: "24×36 · .040 Aluminum · UV print" },
  { name: "Custom Stickers", href: "/shop/stickers-decals", price: "From $0.30/ea", specs: "Die-cut · Waterproof · Any shape" },
  { name: "Business Cards", href: "/shop/business-cards", price: "From $19.00/500", specs: "3.5×2 · 16pt · Full color" },
];

const trustBlocks = [
  { icon: "⚡", title: "Fast Turnaround", desc: "Standard 2–3 business days. Rush same/next day available." },
  { icon: "🎨", title: "Premium Print Quality", desc: "High-resolution UV and latex printing on professional substrates." },
  { icon: "🖥️", title: "Easy Online Ordering", desc: "Configure, price, and order in minutes with live pricing." },
  { icon: "📁", title: "File Check Support", desc: "Free preflight review on every order before production." },
  { icon: "🔒", title: "Secure Checkout", desc: "WooCommerce-powered checkout with SSL and encrypted payments." },
];

const steps = [
  { n: "01", title: "Choose Your Product", desc: "Browse categories or search for your product type." },
  { n: "02", title: "Customize Size & Options", desc: "Enter dimensions, pick materials, and select finishing options." },
  { n: "03", title: "Upload Your Artwork", desc: "Upload press-ready files or request our design support." },
  { n: "04", title: "Checkout & Approve", desc: "Review your order, approve the proof, and we ship fast." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_25%)]" />
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="relative z-10">
            <div className="mb-5 inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
              Fast turnaround · Premium quality
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Custom printing,{" "}
              <span className="text-orange-500">delivered fast</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
              Banners, yard signs, aluminum signs, stickers, and more — all with live online pricing, easy file upload, and nationwide shipping.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold shadow-xl shadow-orange-500/20 hover:bg-orange-400 transition-colors"
              >
                Shop Products
              </Link>
              <Link
                href="/quote"
                className="rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/5 transition-colors"
              >
                Custom Quote
              </Link>
            </div>
          </div>

          {/* Hero pricing card */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-900/80 p-8 shadow-2xl">
              <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Live pricing example</div>
              <div className="mt-4 text-2xl font-bold">Vinyl Banner — 4×8 ft</div>
              <div className="mt-2 text-sm text-zinc-400">Standard material · Single-sided · Grommets</div>
              <div className="mt-6 space-y-2 text-sm text-zinc-300">
                <div className="flex justify-between rounded-xl bg-white/5 px-4 py-2.5">
                  <span>Base price (32 sq ft)</span><span>$24.00</span>
                </div>
                <div className="flex justify-between rounded-xl bg-white/5 px-4 py-2.5">
                  <span>Grommets</span><span>$4.00</span>
                </div>
                <div className="flex justify-between rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 font-bold text-white">
                  <span>Total</span><span className="text-orange-400">$28.00</span>
                </div>
              </div>
              <Link
                href="/banners/vinyl-banner"
                className="mt-6 block w-full rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold hover:bg-orange-400 transition-colors"
              >
                Build Your Banner →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="categories" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">Product categories</div>
          <h2 className="mt-3 text-4xl font-black tracking-tight">What do you need to print?</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group rounded-3xl border border-white/10 bg-zinc-950 p-6 transition hover:-translate-y-1 hover:border-orange-500/30 hover:bg-zinc-900"
            >
              <div className="mb-6 flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 ring-1 ring-white/10">
                <div className="h-20 w-32 rounded-2xl border border-white/10 bg-white/5 shadow-xl" />
              </div>
              <div className="text-xl font-bold">{cat.name}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{cat.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-orange-400 group-hover:underline">
                Shop now →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trust blocks ── */}
      <section className="border-y border-white/10 bg-zinc-950/60">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">Why Signcous</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Built around your print needs</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {trustBlocks.map((block) => (
              <div key={block.title} className="rounded-3xl border border-white/10 bg-black p-5">
                <div className="text-2xl">{block.icon}</div>
                <div className="mt-3 font-bold">{block.title}</div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">Best sellers</div>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Popular products</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {featuredProducts.map((product) => (
            <Link
              key={product.name}
              href={product.href}
              className="group rounded-3xl border border-white/10 bg-zinc-950 p-5 transition hover:border-orange-500/30 hover:bg-zinc-900"
            >
              <div className="mb-4 flex h-28 items-center justify-center rounded-2xl bg-zinc-900 ring-1 ring-white/10">
                <div className="h-16 w-24 rounded-xl border border-white/10 bg-white/5" />
              </div>
              <div className="font-bold">{product.name}</div>
              <div className="mt-1 text-sm font-semibold text-orange-400">{product.price}</div>
              <p className="mt-1 text-xs text-zinc-500">{product.specs}</p>
              <span className="mt-3 inline-block text-sm text-orange-400 group-hover:underline">Shop →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-white/10 bg-zinc-950/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">How it works</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Order in 4 simple steps</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n} className="rounded-[2rem] border border-white/10 bg-black p-7">
                <div className="text-3xl font-black text-orange-500/40">{step.n}</div>
                <div className="mt-4 text-lg font-bold">{step.title}</div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote CTA ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-zinc-900 p-8 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">Bulk or custom orders</div>
              <h3 className="mt-3 text-3xl font-black md:text-4xl">Need a custom quote?</h3>
              <p className="mt-3 max-w-xl text-zinc-300">
                For large quantities, special sizes, or unique materials — request a quote and we&apos;ll get back to you quickly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-400 transition-colors"
              >
                Request a Quote
              </Link>
              <Link
                href="/contact"
                className="rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/5 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

