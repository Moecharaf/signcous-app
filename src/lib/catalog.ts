export interface CatalogCollection {
  key: "banner" | "rigid" | "adhesive" | "magnet";
  slug: string;
  name: string;
  supplierFamily: string;
  description: string;
  href: string;
  highlight: string;
  matchTerms: string[];
}

export const SIGNCOUS_COLLECTIONS: CatalogCollection[] = [
  {
    key: "banner",
    slug: "banner",
    name: "Banner",
    supplierFamily: "Banner",
    description: "Premium vinyl scrim, HDPE, mesh, and banner materials for indoor and outdoor use.",
    href: "/#banner",
    highlight: "Includes HD Banner and HDPE",
    matchTerms: ["banner", "banners"],
  },
  {
    key: "rigid",
    slug: "rigid",
    name: "Rigid",
    supplierFamily: "Rigid",
    description: "Rigid substrates for photo-quality and durable signage applications.",
    href: "/#rigid",
    highlight: "Coroplast, acrylic, foamcore, PVC and more",
    matchTerms: ["rigid", "signs", "sign"],
  },
  {
    key: "adhesive",
    slug: "adhesive",
    name: "Adhesive",
    supplierFamily: "Adhesive",
    description: "Window, wall, and vehicle adhesive films with short-term and durable options.",
    href: "/#adhesive",
    highlight: "Vehicle wrap, window cling, one-way and cast films",
    matchTerms: ["adhesive", "stickers", "decals", "sticker"],
  },
  {
    key: "magnet",
    slug: "magnet",
    name: "Magnet",
    supplierFamily: "Magnet",
    description: "Vehicle-ready magnetic products for mobile promotion and custom cut sizes.",
    href: "/#magnet",
    highlight: "Vehicle magnet and custom magnet products",
    matchTerms: ["magnet", "magnets"],
  },
];

export interface CategoryMatcherInput {
  slug: string;
  name: string;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getCollectionBySlug(slug: string): CatalogCollection | undefined {
  const normalizedSlug = normalize(slug);
  return SIGNCOUS_COLLECTIONS.find((collection) =>
    [collection.slug, ...collection.matchTerms].some((term) => normalize(term) === normalizedSlug)
  );
}

export function getCollectionForCategory(category: CategoryMatcherInput): CatalogCollection | undefined {
  const normalizedName = normalize(category.name);
  const normalizedSlug = normalize(category.slug);

  return SIGNCOUS_COLLECTIONS.find((collection) =>
    [collection.slug, ...collection.matchTerms].some((term) => {
      const normalizedTerm = normalize(term);
      return normalizedSlug.includes(normalizedTerm) || normalizedName.includes(normalizedTerm);
    })
  );
}

export function isAllowedPrimaryCategory(category: CategoryMatcherInput): boolean {
  return Boolean(getCollectionForCategory(category));
}
