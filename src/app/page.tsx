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
    id: "manual-economical-stand",
    productId: 124,
    name: "Economical Banner Stand",
    displayName: "ECONO STAND",
    titleImage: "/card-images/ECONOSTAND.png",
    titleImageAlt: "Economical Banner Stand Solution",
    href: "/banners/economical-banner-stand",
    description: "Standard 33.5 x 80 single-sided banner stand at a fixed $130 per banner.",
    label: "Builder",
    image: "/card-images/Ecostand.png",
    imageAlt: "Economical Banner Stand display",
  },
  {
    id: "manual-hdpe",
    productId: 56,
    name: "HDPE",
    displayName: "HDPE",
    titleImage: "/card-images/HDPE Logo_.png",
    titleImageAlt: "HDPE Water and Tear Resistant Paper",
    href: "/banners/hdpe",
    description: "Water & Tear Resistant Paper",
    label: "Builder",
    image: "/card-images/HDPE.png",
    imageAlt: "HDPE",
  },
  {
    id: "manual-canvas",
    productId: 60,
    name: "Canvas",
    displayName: "CANVAS",
    titleImage: "/card-images/Canvas Logo_.png",
    titleImageAlt: "Canvas Poly-Cotton Blend Stretch and Frame",
    href: "/banners/canvas",
    description: "Poly-Cotton Blend, Stretch & Frame",
    label: "Builder",
    image: "/card-images/canva.png",
    imageAlt: "Canvas",
  },
  {
    id: "manual-mesh",
    productId: 27,
    name: "Mesh Banner",
    displayName: "MESH",
    titleImage: "/card-images/MESH Logo_.png",
    titleImageAlt: "Mesh Polyester with Air-Flow Perforation",
    href: "/banners/mesh-banner",
    description: "Durable 8oz Coated Polyester Mesh with 37% Air-Flow Perforation",
    label: "Builder",
    image: "/card-images/Mesh Banner.png",
    imageAlt: "Mesh Banner",
  },
  {
    id: "manual-no-curl",
    productId: 67,
    name: "No-Curl Banner",
    displayName: "NOCURL BANNER",
    titleImage: "/card-images/No Curl Logo_.png",
    titleImageAlt: "No Curl Banner lays flat and stays flat",
    href: "/banners/no-curl-banner",
    description: "Premium 8mil No-Curl Banner for Flat, High-End Displays",
    label: "Builder",
    image: "/card-images/No Curl.png",
    imageAlt: "No-Curl Banner",
  },
  {
    id: "manual-poster",
    productId: 54,
    name: "Poster",
    displayName: "POSTER",
    titleImage: "/card-images/Poster Logo_.png",
    titleImageAlt: "Poster Bright White Paper for Short-Term Indoor use",
    href: "/banners/poster",
    description: "Poster Builder with Upload and Rounded-Up Area Pricing",
    label: "Builder",
    image: "/card-images/Poster.png",
    imageAlt: "Poster",
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
  const imageByProductId = new Map<number, { image: string | null; imageAlt: string }>();

  for (const section of sections) {
    for (const product of section.products) {
      if (!imageByProductId.has(product.id)) {
        imageByProductId.set(product.id, {
          image: product.image,
          imageAlt: product.imageAlt,
        });
      }
    }
  }

  const manualBannerProducts = MANUAL_BANNER_PRODUCTS.map((product) => {
    const visual = imageByProductId.get(product.productId);

    return {
      ...product,
      image: product.image ?? visual?.image ?? null,
      imageAlt: product.imageAlt || visual?.imageAlt || product.name,
    };
  });

  return (
    <HomeCatalogClient
      sections={sections}
      manualBannerProducts={manualBannerProducts}
    />
  );
}

