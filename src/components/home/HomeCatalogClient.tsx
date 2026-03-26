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
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {manualBannerProducts.map((manualProduct) => {
              const visual = MANUAL_CARD_THEME[manualProduct.id] ?? {
                texture: "from-[#ffffff]/95 via-[#f3f3f3]/78 to-[#ececec]/88",
                ghost: "PRINT",
                eyebrow: "Builder",
              };

              return (
                <Link
                  key={manualProduct.id}
                  href={manualProduct.href}
                  className="group relative isolate aspect-[3/4] overflow-hidden rounded-sm bg-[#111]"
                >
                  {/* Full-bleed product image */}
                  {manualProduct.image ? (
                    <Image
                      src={manualProduct.image}
                      alt={manualProduct.imageAlt}
                      fill
                      quality={70}
                      loading="lazy"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.07]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#111]" />
                  )}

                  {/* Permanent dark footer gradient — always visible */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                    aria-hidden="true"
                  />

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 bg-black/55 opacity-0 transition duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  />

                  {/* Default: name at bottom-left */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 transition duration-300 group-hover:opacity-0">
                    <div className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/50">
                      {visual.eyebrow}
                    </div>
                    <h2 className="mt-0.5 text-xs font-black uppercase leading-tight tracking-[0.03em] text-white">
                      {manualProduct.name}
                    </h2>
                  </div>

                  {/* Hover: centered CTA panel */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 opacity-0 transition duration-300 group-hover:opacity-100">
                    <h2 className="text-center text-sm font-black uppercase leading-tight tracking-[0.03em] text-white">
                      {manualProduct.name}
                    </h2>
                    <p className="text-center text-[9px] leading-4 text-white/80">
                      {manualProduct.description}
                    </p>
                    <span className="mt-1 border border-white px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                      Configure Now
                    </span>
                  </div>
                </Link>
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
