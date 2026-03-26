"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

export interface ManualBannerProductCard {
  id: string;
  productId: number;
  name: string;
  href: string;
  description: string;
  label: string;
  image: string | null;
  imageAlt: string;
}

export interface HomeCatalogProductCard {
  id: number;
  name: string;
  href: string;
  priceLabel: string;
  summary: string;
  image: string | null;
  imageAlt: string;
}

export interface HomeCatalogSection {
  key: "banner" | "rigid" | "adhesive" | "magnet";
  name: string;
  supplierFamily: string;
  description: string;
  highlight: string;
  categorySlug: string | null;
  productCount: number;
  heroImages: string[];
  products: HomeCatalogProductCard[];
}

interface HomeCatalogClientProps {
  sections: HomeCatalogSection[];
  manualBannerProducts: ManualBannerProductCard[];
}

const MANUAL_CARD_THEME: Record<string, { texture: string; ghost: string; eyebrow: string }> = {
  "manual-hd-banner": {
    texture: "from-[#ffffff]/95 via-[#f3f3f3]/78 to-[#ececec]/88",
    ghost: "VINYL",
    eyebrow: "Flexible Print",
  },
  "manual-hdpe": {
    texture: "from-[#ffffff]/95 via-[#edf3f8]/78 to-[#e4edf5]/88",
    ghost: "HDPE",
    eyebrow: "Rigid Sheet",
  },
  "manual-canvas": {
    texture: "from-[#ffffff]/95 via-[#f7f0e9]/78 to-[#efe5dc]/88",
    ghost: "CANVAS",
    eyebrow: "Fine Art",
  },
  "manual-mesh": {
    texture: "from-[#ffffff]/95 via-[#f1f1f1]/78 to-[#e7e7e7]/88",
    ghost: "MESH",
    eyebrow: "Outdoor Airflow",
  },
  "manual-no-curl": {
    texture: "from-[#ffffff]/95 via-[#f6f2eb]/78 to-[#ece3d8]/88",
    ghost: "NO CURL",
    eyebrow: "Premium Flat",
  },
  "manual-poster": {
    texture: "from-[#ffffff]/95 via-[#f0f5fb]/78 to-[#e7eef7]/88",
    ghost: "POSTER",
    eyebrow: "Retail Prints",
  },
};

const CATEGORY_ICON: Record<HomeCatalogSection["key"], string> = {
  banner: "▦",
  rigid: "▣",
  adhesive: "◫",
  magnet: "∪",
};

const CATEGORY_THEME: Record<HomeCatalogSection["key"], { hero: string; chip: string }> = {
  banner: {
    hero: "from-[#d97706] via-[#f2bd1f] to-[#ffe69e]",
    chip: "bg-[#fff3c5] text-[#7d5200]",
  },
  rigid: {
    hero: "from-[#2f6fa8] via-[#70b6ed] to-[#cfeaff]",
    chip: "bg-[#dfefff] text-[#184a76]",
  },
  adhesive: {
    hero: "from-[#b32222] via-[#ec5a5a] to-[#ffd6a1]",
    chip: "bg-[#ffe6cd] text-[#7d3018]",
  },
  magnet: {
    hero: "from-[#1e1e1e] via-[#454545] to-[#aaaaaa]",
    chip: "bg-[#e7e7e7] text-[#2f2f2f]",
  },
};

const CATEGORY_KEYS: HomeCatalogSection["key"][] = ["banner", "rigid", "adhesive", "magnet"];

function subscribeToHashChange(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot(): string {
  return window.location.hash.toLowerCase();
}

function getServerSnapshot(): string {
  return "";
}

function getCategoryFromHash(hash: string): HomeCatalogSection["key"] | null {
  const clean = hash.replace("#", "").trim().toLowerCase();
  return CATEGORY_KEYS.includes(clean as HomeCatalogSection["key"])
    ? (clean as HomeCatalogSection["key"])
    : null;
}

export default function HomeCatalogClient({ sections, manualBannerProducts }: HomeCatalogClientProps) {
  const currentHash = useSyncExternalStore(subscribeToHashChange, getHashSnapshot, getServerSnapshot);
  const activeKeyFromHash = getCategoryFromHash(currentHash);
  const activeKey = activeKeyFromHash ?? sections[0]?.key ?? "banner";
  const [heroFrame, setHeroFrame] = useState(0);

  const activeSection = useMemo(() => {
    return sections.find((section) => section.key === activeKey) ?? sections[0] ?? null;
  }, [activeKey, sections]);

  useEffect(() => {
    if (!activeSection || activeSection.heroImages.length < 2) return;

    const interval = window.setInterval(() => {
      setHeroFrame((prev) => (prev + 1) % activeSection.heroImages.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [activeSection]);

  if (!activeSection) {
    return (
      <div className="min-h-screen bg-[#e6e6e6] px-4 py-10 text-[#3a3a3a] md:px-8">
        <div className="mx-auto max-w-[1500px] rounded-lg border border-[#d2d2d2] bg-white p-8 text-sm">
          No category data is available right now.
        </div>
      </div>
    );
  }

  const theme = CATEGORY_THEME[activeSection.key];
  const activeHeroImage =
    activeSection.heroImages[heroFrame % Math.max(activeSection.heroImages.length, 1)] ?? null;

  return (
    <div className="min-h-screen bg-[#e6e6e6] text-[#2f2f2f]">
      <section className="border-b border-[#d5d5d5] bg-[#eeeeee]">
        <div className="mx-auto max-w-[1500px] px-4 py-7 md:px-8 md:py-8">
          <div
            className={`relative overflow-hidden rounded-lg border border-[#cfcfcf] bg-gradient-to-r ${theme.hero} p-5 md:p-7`}
          >
            {activeHeroImage && (
              <div
                className="absolute inset-y-0 right-0 hidden w-[42%] bg-cover bg-center opacity-35 md:block"
                style={{ backgroundImage: `url(${activeHeroImage})` }}
                aria-hidden="true"
              />
            )}
            <div className="relative max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
                <span className="mr-2 text-sm leading-none">{CATEGORY_ICON[activeSection.key]}</span>
                Signcous {activeSection.supplierFamily} Collection
              </div>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-[#242424] md:text-4xl">
                {activeSection.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#2f2f2f] md:text-base">{activeSection.description}</p>
              <div className="mt-3 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-[#2f2f2f]">
                {activeSection.highlight}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${theme.chip}`}>
                  {activeSection.productCount} Live Products
                </div>
                {activeSection.heroImages.length > 1 && (
                  <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#3b3b3b]">
                    Rotating Preview
                  </div>
                )}
                {activeSection.categorySlug && (
                  <Link
                    href={`/shop/${activeSection.categorySlug}`}
                    className="rounded-sm border border-[#cfcfcf] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#2f2f2f] hover:bg-[#fff7d6]"
                  >
                    Open Category
                  </Link>
                )}
              </div>
              {activeSection.heroImages.length > 1 && (
                <div className="mt-4 flex items-center gap-2">
                  {activeSection.heroImages.map((_, index) => {
                    const isActiveDot = index === (heroFrame % activeSection.heroImages.length);

                    return (
                      <button
                        key={`dot-${activeSection.key}-${index}`}
                        type="button"
                        onClick={() => setHeroFrame(index)}
                        className={`h-2.5 w-2.5 rounded-full border transition ${
                          isActiveDot
                            ? "border-[#2f2f2f] bg-[#2f2f2f]"
                            : "border-[#2f2f2f]/45 bg-white/65 hover:bg-white"
                        }`}
                        aria-label={`Show slide ${index + 1}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-10">
        {activeSection.key === "banner" && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {manualBannerProducts.map((manualProduct) => {
              const visual = MANUAL_CARD_THEME[manualProduct.id] ?? {
                texture: "from-[#ffffff]/95 via-[#f3f3f3]/78 to-[#ececec]/88",
                ghost: "PRINT",
                eyebrow: "Builder",
              };

              return (
                <div
                  key={manualProduct.id}
                  className="group relative aspect-[16/7] overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-sm"
                >
                  {/* Faded background image — default state only */}
                  {manualProduct.image && (
                    <Image
                      src={manualProduct.image}
                      alt=""
                      fill
                      quality={60}
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover opacity-20 grayscale transition duration-500 group-hover:opacity-0"
                      aria-hidden="true"
                    />
                  )}

                  {/* DEFAULT STATE: large product name + subtitle */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 transition duration-300 group-hover:opacity-0">
                    <h2 className="text-3xl font-black uppercase leading-none tracking-[0.02em] text-[#1a1a1a] md:text-4xl">
                      {manualProduct.name}
                    </h2>
                    <p className="mt-1.5 text-xs font-medium text-[#666]">
                      {manualProduct.description}
                    </p>
                  </div>

                  {/* HOVER STATE: split — left info slides in from left, right photo slides in from right */}
                  <div className="absolute inset-0 flex overflow-hidden">
                    {/* Left panel */}
                    <div className="flex w-[55%] -translate-x-full flex-col justify-center gap-2 bg-white p-5 transition duration-500 ease-out group-hover:translate-x-0">
                      <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#888]">
                        {visual.eyebrow}
                      </div>
                      <h2 className="text-xl font-black uppercase leading-tight tracking-[0.01em] text-[#1a1a1a]">
                        {manualProduct.name}
                      </h2>
                      <p className="text-[11px] leading-5 text-[#555]">
                        {manualProduct.description}
                      </p>
                      <div className="mt-1 flex flex-col gap-1.5">
                        <Link
                          href={manualProduct.href}
                          className="border border-[#bbb] px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#333] transition hover:border-[#333] hover:bg-[#f5f5f5]"
                        >
                          More Info
                        </Link>
                        <Link
                          href={manualProduct.href}
                          className="bg-[#f5c800] px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#1a1a1a] transition hover:bg-[#e6b800]"
                        >
                          Order
                        </Link>
                      </div>
                    </div>

                    {/* Right panel: slides in from right */}
                    <div className="relative w-[45%] translate-x-full transition duration-500 ease-out group-hover:translate-x-0">
                      {manualProduct.image ? (
                        <Image
                          src={manualProduct.image}
                          alt={manualProduct.imageAlt}
                          fill
                          quality={75}
                          loading="lazy"
                          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 15vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full bg-[#f0f0f0]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSection.products.length === 0 ? (
          <div className="rounded-lg border border-[#d4d4d4] bg-white p-6 text-sm text-[#666]">
            No products are currently available in this category.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeSection.products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-lg border border-[#d0d0d0] bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.03)]"
              >
                <Link href={product.href} className="block">
                  <div className="relative aspect-[16/7] w-full bg-[#efefef]">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.imageAlt}
                        fill
                        quality={65}
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#888]">
                        No Product Image
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <h3 className="line-clamp-2 text-lg font-bold uppercase text-[#2a2a2a]">{product.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5a5a5a]">{product.summary}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#2f2f2f]">{product.priceLabel}</span>
                    <Link
                      href={product.href}
                      className="border border-[#d0d0d0] bg-[#f8f8f8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#222] hover:bg-[#fff2ae]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
