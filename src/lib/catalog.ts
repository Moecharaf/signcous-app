export interface CatalogCollection {
  slug: string;
  name: string;
  supplierFamily: string;
  description: string;
  href: string;
  highlight: string;
}

export const SIGNCOUS_COLLECTIONS: CatalogCollection[] = [
  {
    slug: "banners",
    name: "Banners",
    supplierFamily: "Banner",
    description: "Supplier-backed banner products with live Signcous pricing, artwork upload, and fast turnaround.",
    href: "/shop/banners",
    highlight: "Vinyl, mesh, fabric, retractable, and event displays",
  },
  {
    slug: "signs",
    name: "Signs",
    supplierFamily: "Rigid",
    description: "Rigid sign products sourced through the supplier catalog and presented with Signcous branding.",
    href: "/shop/signs",
    highlight: "Coroplast, aluminum, PVC, acrylic, and foam board",
  },
  {
    slug: "stickers-decals",
    name: "Stickers & Decals",
    supplierFamily: "Adhesive",
    description: "Adhesive graphics and decals aligned to supplier-supported materials and production methods.",
    href: "/shop/stickers-decals",
    highlight: "Window, wall, floor, die-cut, and kiss-cut",
  },
  {
    slug: "marketing-materials",
    name: "Marketing Materials",
    supplierFamily: "Handheld",
    description: "Portable print collateral and business handouts, curated under the Signcous storefront experience.",
    href: "/shop/marketing-materials",
    highlight: "Business cards, flyers, brochures, postcards, and booklets",
  },
  {
    slug: "large-format-events",
    name: "Large Format & Events",
    supplierFamily: "Display",
    description: "Large event graphics and show hardware organized around supplier-supported display products.",
    href: "/shop/large-format-events",
    highlight: "Backdrops, table covers, step and repeat, and trade show displays",
  },
];

export const APPROVED_CATEGORY_SLUGS = new Set([
  "banners",
  "vinyl-banners",
  "mesh-banners",
  "fabric-banners",
  "retractable-banners",
  "pole-banners",
  "double-sided-banners",
  "signs",
  "yard-signs-coroplast",
  "aluminum-signs",
  "pvc-signs",
  "acrylic-signs",
  "foam-board-signs",
  "stickers-decals",
  "die-cut-stickers",
  "kiss-cut-stickers",
  "sticker-sheets",
  "window-decals",
  "wall-decals",
  "floor-decals",
  "marketing-materials",
  "business-cards",
  "flyers",
  "brochures",
  "postcards",
  "door-hangers",
  "booklets",
  "large-format-events",
  "step-and-repeat-banners",
  "backdrops",
  "table-covers",
  "tension-fabric-displays",
  "trade-show-displays",
  "posters",
]);

export function getCollectionBySlug(slug: string): CatalogCollection | undefined {
  return SIGNCOUS_COLLECTIONS.find((collection) => collection.slug === slug);
}
