import HomeCatalogClient, {
  type HomeCatalogProductCard,
  type HomeCatalogSection,
  type ManualBannerProductCard,
} from "@/components/home/HomeCatalogClient";
import {
  SIGNCOUS_COLLECTIONS,
  getCollectionForCategory,
} from "@/lib/catalog";
import {
  WooCategory,
  WooProduct,
  getAllProducts,
  getProductCategories,
} from "@/lib/woo";

const MANUAL_BANNER_PRODUCTS: ManualBannerProductCard[] = [
  {
    id: "manual-hd-banner",
    name: "HD Banner",
    href: "/banners/vinyl-banner",
    description: "Premium vinyl scrim banner with live configuration and upload.",
    label: "Builder",
  },
  {
    id: "manual-hdpe",
    name: "HDPE",
    href: "/banners/hdpe",
    description: "Water and tear resistant HDPE sign builder with size-based pricing.",
    label: "Builder",
  },
  {
    id: "manual-canvas",
    name: "Canvas",
    href: "/banners/canvas",
    description: "Canvas builder with quantity-tier pricing and a $20 minimum order.",
    label: "Builder",
  },
];

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function collectDescendantCategoryIds(rootId: number, categories: WooCategory[]): number[] {
  const found = new Set<number>([rootId]);
  const queue = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) continue;

    for (const category of categories) {
      if (category.parent !== current || found.has(category.id)) continue;
      found.add(category.id);
      queue.push(category.id);
    }
  }

  return Array.from(found);
}

function findTopLevelCategory(
  collection: (typeof SIGNCOUS_COLLECTIONS)[number],
  categories: WooCategory[]
): WooCategory | null {
  const topLevel = categories.filter((category) => category.parent === 0);
  return (
    topLevel.find(
      (category) => getCollectionForCategory(category)?.key === collection.key
    ) ?? null
  );
}

function buildProductHref(product: WooProduct, fallbackCategorySlug?: string): string {
  const matched = product.categories.find(
    (category) => getCollectionForCategory(category) !== undefined
  );

  if (matched?.slug) return `/shop/${matched.slug}`;
  if (fallbackCategorySlug) return `/shop/${fallbackCategorySlug}`;
  return "/shop";
}

function mapProductCard(product: WooProduct, fallbackCategorySlug?: string): HomeCatalogProductCard {
  const image = product.images?.[0] ?? null;
  const summary = stripHtml(product.short_description || product.description);

  return {
    id: product.id,
    name: product.name,
    href: buildProductHref(product, fallbackCategorySlug),
    priceLabel: product.price ? `$${product.price}` : "Request quote",
    summary: summary || "Custom print product",
    image: image?.src ?? null,
    imageAlt: image?.alt || product.name,
  };
}

async function loadSections(): Promise<HomeCatalogSection[]> {
  const categories = await getProductCategories();

  const sections = await Promise.all(
    SIGNCOUS_COLLECTIONS.map(async (collection) => {
      const parentCategory = findTopLevelCategory(collection, categories);

      if (!parentCategory) {
        return {
          key: collection.key,
          name: collection.name,
          supplierFamily: collection.supplierFamily,
          description: collection.description,
          highlight: collection.highlight,
          categorySlug: null,
          productCount: 0,
          heroImages: [],
          products: [],
        };
      }

      const categoryIds = collectDescendantCategoryIds(parentCategory.id, categories);
      const productLists = await Promise.all(
        categoryIds.map((categoryId) => getAllProducts({ categoryId }))
      );
      const dedupedProducts = new Map<number, WooProduct>();

      for (const list of productLists) {
        for (const product of list) {
          dedupedProducts.set(product.id, product);
        }
      }

      const products = Array.from(dedupedProducts.values())
        .map((product) => mapProductCard(product, parentCategory.slug))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        key: collection.key,
        name: collection.name,
        supplierFamily: collection.supplierFamily,
        description: collection.description,
        highlight: collection.highlight,
        categorySlug: parentCategory.slug,
        productCount: products.length,
        heroImages: products
          .map((product) => product.image)
          .filter((image): image is string => Boolean(image))
          .slice(0, 6),
        products,
      };
    })
  );

  return sections;
}

export default async function HomePage() {
  const sections = await loadSections();

  return (
    <HomeCatalogClient
      sections={sections}
      manualBannerProducts={MANUAL_BANNER_PRODUCTS}
    />
  );
}

