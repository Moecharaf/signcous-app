"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

export type ManualBannerThemeKey =
  | "manual-economical-stand"
  | "manual-hd-banner"
  | "manual-hdpe"
  | "manual-canvas"
  | "manual-mesh"
  | "manual-no-curl"
  | "manual-poster"
  | "manual-coro"
  | "manual-foamcore"
  | "manual-aluminum"
  | "manual-jbond"
  | "manual-pvc"
  | "manual-polystyrene"
  | "manual-acrylic"
  | "manual-ij35c"
  | "manual-print-wrap-film"
  | "manual-window-cling"
  | "manual-gf2030"
  | "manual-gf830"
  | "manual-orajet-clear"
  | "manual-one-way-window"
  | "manual-dual-view"
  | "manual-footprints"
  | "manual-bootprints"
  | "manual-low-tac-wall"
  | "manual-dry-erase"
  | "manual-reflective-vinyl";

export interface ManualBannerProductCard {
  id: string;
  productId: number;
  name: string;
  displayName?: string;
  titleImage?: string;
  titleImageAlt?: string;
  href: string;
  description: string;
  label: string;
  image: string | null;
  imageAlt: string;
  theme?: ManualBannerThemeKey;
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
  manualRigidProducts: ManualBannerProductCard[];
  manualAdhesiveProducts: ManualBannerProductCard[];
}

const MANUAL_CARD_THEME: Record<ManualBannerThemeKey, { texture: string; ghost: string; eyebrow: string }> = {
  "manual-economical-stand": {
    texture: "from-[#ffffff]/95 via-[#f3f3f3]/78 to-[#ececec]/88",
    ghost: "STAND",
    eyebrow: "Display System",
  },
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
  "manual-coro": {
    texture: "from-[#ffffff]/95 via-[#edf4fb]/80 to-[#deebf9]/88",
    ghost: "CORO",
    eyebrow: "Yard Signs",
  },
  "manual-foamcore": {
    texture: "from-[#ffffff]/95 via-[#f4f6f8]/80 to-[#e7ecef]/88",
    ghost: "FOAM",
    eyebrow: "Lightweight Board",
  },
  "manual-aluminum": {
    texture: "from-[#ffffff]/95 via-[#f2f3f4]/80 to-[#dde0e4]/88",
    ghost: "ALU",
    eyebrow: "Premium Metal",
  },
  "manual-jbond": {
    texture: "from-[#ffffff]/95 via-[#edf3fb]/80 to-[#d6e8f7]/88",
    ghost: "ACM",
    eyebrow: "Composite Panel",
  },
  "manual-pvc": {
    texture: "from-[#ffffff]/95 via-[#f0f4f8]/80 to-[#dde7f0]/88",
    ghost: "PVC",
    eyebrow: "Durable Sheet",
  },
  "manual-polystyrene": {
    texture: "from-[#ffffff]/95 via-[#f7f7f7]/80 to-[#ececec]/88",
    ghost: "STYRENE",
    eyebrow: "Flexible Rigid",
  },
  "manual-acrylic": {
    texture: "from-[#ffffff]/95 via-[#eef8ff]/80 to-[#d8eeff]/88",
    ghost: "ACRYLIC",
    eyebrow: "Clear Rigid",
  },
  "manual-ij35c": {
    texture: "from-[#ffffff]/95 via-[#f7f8fb]/80 to-[#e7ecf4]/88",
    ghost: "IJ-35C",
    eyebrow: "Adhesive Vinyl",
  },
  "manual-print-wrap-film": {
    texture: "from-[#ffffff]/95 via-[#fff2ea]/80 to-[#ffe1d3]/88",
    ghost: "WRAP FILM",
    eyebrow: "Vehicle Wrap",
  },
  "manual-window-cling": {
    texture: "from-[#ffffff]/95 via-[#eef6ff]/80 to-[#dcecff]/88",
    ghost: "CLING",
    eyebrow: "Window Graphic",
  },
  "manual-gf2030": {
    texture: "from-[#ffffff]/95 via-[#f0f6fb]/80 to-[#dceef9]/88",
    ghost: "GF 2030",
    eyebrow: "Polymeric Vinyl",
  },
  "manual-gf830": {
    texture: "from-[#ffffff]/95 via-[#fef3e8]/80 to-[#fde0c2]/88",
    ghost: "GF830",
    eyebrow: "Wrap Vinyl",
  },
  "manual-orajet-clear": {
    texture: "from-[#ffffff]/95 via-[#ecf7ff]/80 to-[#d6eeff]/88",
    ghost: "CLEAR",
    eyebrow: "Clear Vinyl",
  },
  "manual-one-way-window": {
    texture: "from-[#ffffff]/95 via-[#edfaf3]/80 to-[#d4f5e2]/88",
    ghost: "PERF",
    eyebrow: "Perforated Vinyl",
  },
  "manual-dual-view": {
    texture: "from-[#ffffff]/95 via-[#f5f3ff]/80 to-[#e9e4ff]/88",
    ghost: "DUAL",
    eyebrow: "Window Graphic",
  },
  "manual-footprints": {
    texture: "from-[#ffffff]/95 via-[#f0fdf4]/80 to-[#dcfce7]/88",
    ghost: "FLOOR",
    eyebrow: "Floor Graphics",
  },
  "manual-bootprints": {
    texture: "from-[#ffffff]/95 via-[#fff7ed]/80 to-[#ffedd5]/88",
    ghost: "BOOT",
    eyebrow: "Outdoor Floor",
  },
  "manual-low-tac-wall": {
    texture: "from-[#ffffff]/95 via-[#f0f9ff]/80 to-[#e0f2fe]/88",
    ghost: "WALL",
    eyebrow: "Wall Decal",
  },
  "manual-dry-erase": {
    texture: "from-[#ffffff]/95 via-[#f8fafc]/80 to-[#f1f5f9]/88",
    ghost: "DRY ERASE",
    eyebrow: "Writable Surface",
  },
  "manual-reflective-vinyl": {
    texture: "from-[#ffffff]/95 via-[#fffbeb]/80 to-[#fef3c7]/88",
    ghost: "REFLECT",
    eyebrow: "High-Visibility",
  },
};

function resolveManualBannerTheme(value?: string | null): ManualBannerThemeKey | null {
  if (!value) {
    return null;
  }

  return value in MANUAL_CARD_THEME ? (value as ManualBannerThemeKey) : null;
}

const CATEGORY_ICON: Record<HomeCatalogSection["key"], string> = {
  banner: "▦",
  rigid: "▣",
  adhesive: "◫",
  magnet: "∪",
};

const HERO_IMAGE_OVERRIDE: Partial<Record<HomeCatalogSection["key"], string>> = {
  banner: "/card-images/HDbanner-Banner.png",
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

interface ShowcaseCardData {
  id: string;
  name: string;
  displayName?: string;
  titleImage?: string;
  titleImageAlt?: string;
  href: string;
  description: string;
  image: string | null;
  imageAlt: string;
  eyebrow: string;
  texture: string;
  ghost: string;
  priceLabel?: string;
}

function createGhostLabel(value: string): string {
  return value
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ")
    .toUpperCase();
}

function inferShowcaseTheme(
  sectionKey: HomeCatalogSection["key"],
  productName: string
): { texture: string; ghost: string; eyebrow: string } {
  const normalized = productName.toLowerCase();

  if (sectionKey === "rigid") {
    if (normalized.includes("coro") || normalized.includes("coroplast")) {
      return MANUAL_CARD_THEME["manual-coro"];
    }
    if (normalized.includes("acrylic") || normalized.includes("plex")) {
      return {
        texture: "from-[#ffffff]/95 via-[#eef7ff]/80 to-[#dcecff]/88",
        ghost: "ACRYLIC",
        eyebrow: "Clear Rigid",
      };
    }
    if (normalized.includes("foam") || normalized.includes("foamcore")) {
      return {
        texture: "from-[#ffffff]/95 via-[#f4f6f8]/80 to-[#e7ecef]/88",
        ghost: "FOAM",
        eyebrow: "Lightweight Board",
      };
    }
    if (normalized.includes("pvc") || normalized.includes("sintra")) {
      return {
        texture: "from-[#ffffff]/95 via-[#f0f4f8]/80 to-[#dde7f0]/88",
        ghost: "PVC",
        eyebrow: "Durable Sheet",
      };
    }
    if (normalized.includes("aluminum") || normalized.includes("dibond") || normalized.includes("metal")) {
      return {
        texture: "from-[#ffffff]/95 via-[#f3f4f5]/80 to-[#dde1e5]/88",
        ghost: "METAL",
        eyebrow: "Premium Panel",
      };
    }
    if (normalized.includes("styrene")) {
      return {
        texture: "from-[#ffffff]/95 via-[#f7f7f7]/80 to-[#ececec]/88",
        ghost: "STYRENE",
        eyebrow: "Flexible Rigid",
      };
    }

    return {
      texture: "from-[#ffffff]/95 via-[#edf4fb]/80 to-[#deebf9]/88",
      ghost: createGhostLabel(productName),
      eyebrow: "Rigid Print",
    };
  }

  if (sectionKey === "adhesive") {
    if (normalized.includes("wrap")) {
      return {
        texture: "from-[#ffffff]/95 via-[#fff2e7]/80 to-[#ffe0c8]/88",
        ghost: "WRAP",
        eyebrow: "Vehicle Film",
      };
    }
    if (normalized.includes("window") || normalized.includes("cling") || normalized.includes("perf")) {
      return {
        texture: "from-[#ffffff]/95 via-[#eef5ff]/80 to-[#dfeaff]/88",
        ghost: "WINDOW",
        eyebrow: "Glass Graphics",
      };
    }
    if (normalized.includes("wall")) {
      return {
        texture: "from-[#ffffff]/95 via-[#f8f2ec]/80 to-[#eedfce]/88",
        ghost: "WALL",
        eyebrow: "Interior Surface",
      };
    }
    if (normalized.includes("floor")) {
      return {
        texture: "from-[#ffffff]/95 via-[#f7f4ef]/80 to-[#e8dfd0]/88",
        ghost: "FLOOR",
        eyebrow: "Walk-Safe Graphic",
      };
    }

    return {
      texture: "from-[#ffffff]/95 via-[#fff0ea]/80 to-[#ffe0d3]/88",
      ghost: createGhostLabel(productName),
      eyebrow: "Adhesive Film",
    };
  }

  if (sectionKey === "magnet") {
    if (normalized.includes("vehicle")) {
      return {
        texture: "from-[#ffffff]/95 via-[#eef0f2]/80 to-[#dfe3e8]/88",
        ghost: "VEHICLE",
        eyebrow: "Mobile Branding",
      };
    }

    return {
      texture: "from-[#ffffff]/95 via-[#f2f3f5]/80 to-[#e2e5e8]/88",
      ghost: createGhostLabel(productName),
      eyebrow: "Magnetic Sign",
    };
  }

  return {
    texture: "from-[#ffffff]/95 via-[#f3f3f3]/78 to-[#ececec]/88",
    ghost: createGhostLabel(productName),
    eyebrow: "Builder",
  };
}

function ShowcaseCard({
  card,
  isCoarsePointer,
  isExpanded,
  onExpand,
}: {
  card: ShowcaseCardData;
  isCoarsePointer: boolean;
  isExpanded: boolean;
  onExpand: () => void;
}) {
  return (
    <div
      className="group relative aspect-[1.82/1] overflow-hidden rounded-2xl border border-[#e8e8e8] bg-[#fdfdfd] shadow-[0_1px_0_rgba(0,0,0,0.04)] focus:outline-none"
      tabIndex={0}
      onClick={(event) => {
        if (!isCoarsePointer) return;
        if ((event.target as HTMLElement).closest("a, button")) return;

        if (isExpanded) {
          window.location.href = card.href;
          return;
        }

        onExpand();
      }}
    >
      {card.image && (
        <Image
          src={card.image}
          alt=""
          fill
          quality={60}
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover opacity-65 saturate-110 transition duration-500 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0 ${isExpanded ? "opacity-0" : ""}`}
          aria-hidden="true"
        />
      )}

      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.texture} transition duration-300 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0 ${isExpanded ? "opacity-0" : "opacity-100"}`}
        aria-hidden="true"
      />

      <div
        className={`pointer-events-none absolute inset-0 bg-white/68 backdrop-blur-[1px] transition duration-300 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0 ${isExpanded ? "opacity-0" : ""}`}
        aria-hidden="true"
      />

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-5 transition duration-300 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0 ${isExpanded ? "opacity-0" : ""}`}
      >
        {card.titleImage ? (
          <Image
            src={card.titleImage}
            alt={card.titleImageAlt ?? `${card.name} title`}
            width={900}
            height={260}
            className="w-[82%] max-w-[420px] object-contain"
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 36vw, 20vw"
          />
        ) : (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[clamp(2.6rem,5vw,4.8rem)] font-black uppercase tracking-[0.08em] text-[#1a1a1a]/[0.06]">
              {card.ghost}
            </div>
            <h2 className="text-center text-3xl font-black uppercase leading-none tracking-[0.02em] text-[#1a1a1a] md:text-4xl">
              {card.displayName ?? card.name}
            </h2>
            <p className="mt-2 text-center text-xs font-medium text-[#666]">
              {card.description}
            </p>
          </>
        )}
      </div>

      <div className="absolute inset-0 flex overflow-hidden">
        <div
          className={`relative flex w-[55%] -translate-x-full flex-col justify-center gap-2 bg-white p-5 transition duration-500 ease-out group-hover:translate-x-0 group-focus:translate-x-0 group-focus-within:translate-x-0 ${isExpanded ? "translate-x-0" : ""}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.texture} opacity-55`} aria-hidden="true" />
          <div className="pointer-events-none absolute right-3 top-2 text-[2rem] font-black uppercase tracking-[0.08em] text-[#1a1a1a]/[0.05]">
            {card.ghost}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#888]">
            {card.eyebrow}
          </div>
          <h2 className="relative text-xl font-black uppercase leading-tight tracking-[0.01em] text-[#1a1a1a]">
            {card.displayName ?? card.name}
          </h2>
          <p className="relative text-[11px] leading-5 text-[#555]">
            {card.description}
          </p>
          {card.priceLabel && (
            <div className="relative text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f2f2f]">
              {card.priceLabel}
            </div>
          )}
          <div className="relative mt-1 flex flex-col gap-1.5">
            <Link
              href={card.href}
              className="border border-[#bbb] px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#333] transition hover:border-[#333] hover:bg-[#f5f5f5]"
            >
              More Info
            </Link>
            <Link
              href={card.href}
              className="bg-[#f5c800] px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#1a1a1a] transition hover:bg-[#e6b800]"
            >
              Order
            </Link>
          </div>
        </div>

        <div
          className={`relative w-[45%] translate-x-full transition duration-500 ease-out group-hover:translate-x-0 group-focus:translate-x-0 group-focus-within:translate-x-0 ${isExpanded ? "translate-x-0" : ""}`}
        >
          {card.image ? (
            <Image
              src={card.image}
              alt={card.imageAlt}
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
}

export default function HomeCatalogClient({
  sections,
  manualBannerProducts,
  manualRigidProducts,
  manualAdhesiveProducts,
}: HomeCatalogClientProps) {
  const currentHash = useSyncExternalStore(subscribeToHashChange, getHashSnapshot, getServerSnapshot);
  const activeKeyFromHash = getCategoryFromHash(currentHash);
  const activeKey = activeKeyFromHash ?? sections[0]?.key ?? "banner";
  const [heroFrame, setHeroFrame] = useState(0);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [expandedMobileCardId, setExpandedMobileCardId] = useState<string | null>(null);

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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const updatePointerMode = () => setIsCoarsePointer(mediaQuery.matches);

    updatePointerMode();

    mediaQuery.addEventListener("change", updatePointerMode);
    return () => mediaQuery.removeEventListener("change", updatePointerMode);
  }, []);

  if (!activeSection) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] px-4 py-10 text-[#3a3a3a] md:px-8">
        <div className="mx-auto max-w-[1500px] rounded-lg border border-[#d2d2d2] bg-white p-8 text-sm">
          No category data is available right now.
        </div>
      </div>
    );
  }

  const theme = CATEGORY_THEME[activeSection.key];
  const heroOverride = HERO_IMAGE_OVERRIDE[activeSection.key] ?? null;
  const activeHeroImage = heroOverride ??
    activeSection.heroImages[heroFrame % Math.max(activeSection.heroImages.length, 1)] ?? null;
  const activeManualProducts =
    activeSection.key === "banner"
      ? manualBannerProducts
      : activeSection.key === "rigid"
        ? manualRigidProducts
        : activeSection.key === "adhesive"
          ? manualAdhesiveProducts
        : [];
  const visibleProducts = activeSection.products.filter((product) => {
    const normalizedName = product.name.toLowerCase();

    if (activeSection.key === "rigid") {
      return (
        product.href !== "/rigid/coro" &&
        !normalizedName.includes("coro") &&
        !normalizedName.includes("coroplast") &&
        product.href !== "/rigid/foamcore" &&
        !normalizedName.includes("foamcore") &&
        !normalizedName.includes("foam core") &&
        product.href !== "/rigid/pvc" &&
        !normalizedName.includes("pvc") &&
        !normalizedName.includes("sintra") &&
        product.href !== "/rigid/polystyrene" &&
        !normalizedName.includes("polystyrene") &&
        !normalizedName.includes("styrene") &&
        product.href !== "/rigid/aluminum" &&
        !normalizedName.includes("aluminum") &&
        product.href !== "/rigid/jbond" &&
        !normalizedName.includes("jbond") &&
        !normalizedName.includes("j-bond")
      );
    }

    if (activeSection.key === "adhesive") {
      return (
        product.href !== "/adhesive/3m-ij-35c" &&
        product.href !== "/adhesive/3m-print-wrap-film" &&
        product.href !== "/adhesive/window-cling" &&
        product.href !== "/adhesive/gf-2030apae" &&
        !normalizedName.includes("ij-35c") &&
        !normalizedName.includes("ij35c") &&
        !normalizedName.includes("print wrap") &&
        !normalizedName.includes("wrap film") &&
        !normalizedName.includes("window cling") &&
        !normalizedName.includes("2030") &&
        !normalizedName.includes("gf 2030")
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#2f2f2f]">
      <section className="bg-[#f3f3f3]">
        <div className="px-4 py-7 md:px-6 md:py-8">
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

      <section className="w-full bg-[#f3f3f3] px-4 pb-4 pt-1 md:px-6 md:pb-5 md:pt-1">
        {(activeSection.key === "banner" || activeSection.key === "rigid" || activeSection.key === "adhesive" || activeSection.key === "magnet") && (
          <h2 className="mb-4 text-[25px] font-normal leading-none tracking-[-0.01em] text-[#3b3b3b] [font-family:'Roboto_Condensed','Arial_Narrow',Arial,sans-serif] md:mb-5 md:text-[29px]">
            {activeSection.key === "banner"
              ? "Banner Products"
              : activeSection.key === "rigid"
                ? "Rigid Products"
                : activeSection.key === "adhesive"
                  ? "Adhesive Products"
                  : "Magnet Products"}
          </h2>
        )}

        {activeManualProducts.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {activeManualProducts.map((manualProduct) => {
              const themeKey =
                resolveManualBannerTheme(manualProduct.theme) ??
                resolveManualBannerTheme(manualProduct.id);
              const visual = (themeKey ? MANUAL_CARD_THEME[themeKey] : undefined) ?? {
                texture: "from-[#ffffff]/95 via-[#f3f3f3]/78 to-[#ececec]/88",
                ghost: "PRINT",
                eyebrow: "Builder",
              };
              const isMobileExpanded = isCoarsePointer && expandedMobileCardId === manualProduct.id;

              return (
                <ShowcaseCard
                  key={manualProduct.id}
                  card={{
                    id: manualProduct.id,
                    name: manualProduct.name,
                    displayName: manualProduct.displayName,
                    titleImage: manualProduct.titleImage,
                    titleImageAlt: manualProduct.titleImageAlt,
                    href: manualProduct.href,
                    description: manualProduct.description,
                    image: manualProduct.image,
                    imageAlt: manualProduct.imageAlt,
                    eyebrow: visual.eyebrow,
                    texture: visual.texture,
                    ghost: visual.ghost,
                  }}
                  isCoarsePointer={isCoarsePointer}
                  isExpanded={isMobileExpanded}
                  onExpand={() => setExpandedMobileCardId(manualProduct.id)}
                />
              );
            })}
          </div>
        )}

        {visibleProducts.length === 0 ? (
          <div className="rounded-lg border border-[#d4d4d4] bg-white p-6 text-sm text-[#666]">
            No products are currently available in this category.
          </div>
        ) : activeSection.key === "rigid" || activeSection.key === "adhesive" || activeSection.key === "magnet" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product) => {
              const cardId = `${activeSection.key}-${product.id}`;
              const isMobileExpanded = isCoarsePointer && expandedMobileCardId === cardId;
              const visual = inferShowcaseTheme(activeSection.key, product.name);

              return (
                <ShowcaseCard
                  key={product.id}
                  card={{
                    id: cardId,
                    name: product.name,
                    href: product.href,
                    description: product.summary || `Custom ${activeSection.name.toLowerCase()} print product.`,
                    image: product.image,
                    imageAlt: product.imageAlt,
                    eyebrow: visual.eyebrow,
                    texture: visual.texture,
                    ghost: visual.ghost,
                    priceLabel: product.priceLabel,
                  }}
                  isCoarsePointer={isCoarsePointer}
                  isExpanded={isMobileExpanded}
                  onExpand={() => setExpandedMobileCardId(cardId)}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
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
