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
    productId: 26,
    name: "HD Banner",
    displayName: "HD BANNER",
    titleImage: "/card-images/HDBanner-Logo-V2.png",
    titleImageAlt: "HD Banner high-definition vinyl banner",
    href: "/banners/vinyl-banner",
    description: "Custom HD vinyl banner with live sizing, finishing options, and rush production.",
    label: "Builder",
    image: "/card-images/HD-Banner.png",
    imageAlt: "HD Banner",
  },
  {
    id: "manual-economical-stand",
    productId: 70,
    name: "Economical Banner Stand",
    displayName: "ECONO STAND",
    titleImage: "/card-images/EcoNoStand-Logo-V2.png",
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
    titleImage: "/card-images/HDPE-Logo-V2.png",
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
    titleImage: "/card-images/Canvas-Logo-V2.png",
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
    titleImage: "/card-images/Mesh-Logo-V2.png",
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
    titleImage: "/card-images/NoCurl-Logo-V2.png",
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
    titleImage: "/card-images/Poster-Logo-V2.png",
    titleImageAlt: "Poster Bright White Paper for Short-Term Indoor use",
    href: "/banners/poster",
    description: "Poster Builder with Upload and Rounded-Up Area Pricing",
    label: "Builder",
    image: "/card-images/Poster.png",
    imageAlt: "Poster",
  },
];

const MANUAL_RIGID_PRODUCTS: ManualBannerProductCard[] = [
  {
    id: "manual-coro",
    productId: 13,
    name: "CORO",
    displayName: "CORO",
    titleImage: "/card-images/Coro-Logo-V2.png",
    titleImageAlt: "CORO high definition yard signs",
    href: "/rigid/coro",
    description: "High definition yard signs with live sheet-layout pricing and builder ordering.",
    label: "Builder",
    image: "/card-images/CoroIMG.png",
    imageAlt: "CORO yard sign display",
    theme: "manual-coro",
  },
  {
    id: "manual-foamcore",
    productId: 0,
    name: "Foamcore",
    displayName: "FOAMCORE",
    titleImage: "/card-images/FoamBoard-Logo.png",
    titleImageAlt: "Foamcore logo",
    href: "/rigid/foamcore",
    description: "Lightweight foamcore signs with live sheet-layout pricing and builder ordering.",
    label: "Builder",
    image: "/card-images/FoamCoar-Image.png",
    imageAlt: "Foamcore rigid sign board",
    theme: "manual-foamcore",
  },
  {
    id: "manual-aluminum",
    productId: 0,
    name: "Aluminum",
    displayName: "ALUMINUM",
    titleImage: "/card-images/Aluminum-Logo2.png",
    titleImageAlt: "Aluminum heavy duty signage",
    href: "/rigid/aluminum",
    description: "Premium 0.040\" & 0.080\" aluminum signs — sheet or custom sq.in pricing with live builder.",
    label: "Builder",
    image: "/card-images/Aluminum-Image.png",
    imageAlt: "Aluminum rigid sign panel",
    theme: "manual-aluminum",
  },
  {
    id: "manual-jbond",
    productId: 0,
    name: "JBond",
    displayName: "JBOND",
    titleImage: "/card-images/Jbond-Logo.png",
    titleImageAlt: "JBond logo",
    href: "/rigid/jbond",
    description: "Aluminum composite panel signs in 3mm & 6mm — sheet or custom sq.in pricing.",
    label: "Builder",
    image: "/card-images/Jbond-Image.jpeg",
    imageAlt: "JBond composite panel sign",
    theme: "manual-jbond",
  },
  {
    id: "manual-pvc",
    productId: 0,
    name: "PVC",
    displayName: "PVC",
    titleImage: "/card-images/PVC-Logo.png",
    titleImageAlt: "PVC logo",
    href: "/rigid/pvc",
    description: "Durable PVC signs available in 3mm and 6mm with live sheet-layout pricing.",
    label: "Builder",
    image: "/card-images/PVC-Signs-Image.png",
    imageAlt: "PVC rigid sign board",
    theme: "manual-pvc",
  },
  {
    id: "manual-polystyrene",
    productId: 0,
    name: "Polystyrene",
    displayName: "POLYSTYRENE",
    titleImage: "/card-images/Polystyrene-Logo.png",
    titleImageAlt: "Polystyrene logo",
    href: "/rigid/polystyrene",
    description: ".03\" polystyrene signs with live sheet-layout pricing and builder ordering.",
    label: "Builder",
    image: "/card-images/Polystyrene-Image.png",
    imageAlt: "Polystyrene rigid sign board",
    theme: "manual-polystyrene",
  },
  {
    id: "manual-acrylic",
    productId: 0,
    name: "Acrylic Signs",
    displayName: "ACRYLIC",
    titleImage: "/card-images/Acylic-Logo-V2.png",
    titleImageAlt: "Acrylic Signs — Premium Look, Crystal Clear Finish",
    href: "/rigid/acrylic-signs",
    description: "Premium clear rigid signs for offices, lobbies, and wall-mounted displays.",
    label: "Builder",
    image: "/card-images/Acrylic.png",
    imageAlt: "Acrylic Signs",
    theme: "manual-acrylic",
  },
];

const MANUAL_ADHESIVE_PRODUCTS: ManualBannerProductCard[] = [
  {
    id: "manual-dual-view",
    productId: 0,
    name: "Dual View",
    displayName: "DUAL VIEW",
    titleImage: "/card-images/DUAL-View-logo-v2.png",
    titleImageAlt: "Dual View logo",
    href: "/adhesive/dual-view",
    description: "Single or double-sided window graphic with 52in panel logic, tiered pricing, and contour cut option.",
    label: "Builder",
    image: "/card-images/DUAL-View-Image-v2.png",
    imageAlt: "Dual View Window Graphic",
    theme: "manual-dual-view",
  },
  {
    id: "manual-one-way-window",
    productId: 0,
    name: "One Way Window",
    displayName: "ONE WAY WINDOW",
    titleImage: "/card-images/One-Way-Window-LOGO-v2.png",
    titleImageAlt: "One Way Window logo",
    href: "/adhesive/one-way-window",
    description: "Perforated vinyl with 50/50 & 70/30 options, 50in strict panel logic, optional laminate, contour cut, and tiered pricing.",
    label: "Builder",
    image: "/card-images/OneWayWindow-Image-v2.png",
    imageAlt: "One Way Window Perforated Vinyl",
    theme: "manual-one-way-window",
  },
  {
    id: "manual-orajet-clear",
    productId: 0,
    name: "Orajet Clear",
    displayName: "ORAJET CLEAR",
    titleImage: "/card-images/Orajet-Clear-Logo-v3.png",
    titleImageAlt: "Orajet Clear logo",
    href: "/adhesive/orajet-clear",
    description: "Translucent clear vinyl with tiered pricing, 54in panel splitting, contour cut, and rush production.",
    label: "Builder",
    image: "/card-images/Orajet_Clear-Image.png",
    imageAlt: "Orajet Clear Translucent Vinyl",
    theme: "manual-orajet-clear",
  },
  {
    id: "manual-gf830",
    productId: 0,
    name: "GF830 AutoMark",
    displayName: "GF830 AUTOWRAP",
    titleImage: "/card-images/GF-830-AutoWrap-LOGO-v2.png",
    titleImageAlt: "GF830 AutoWrap logo",
    href: "/adhesive/gf-830-autowrap",
    description: "Wrap vinyl with tiered area-based pricing, 60in panel splitting, contour cut, and rush production.",
    label: "Builder",
    image: "/card-images/GF830-AutoWrap-Image.png",
    imageAlt: "GF830 AutoMark Wrap Vinyl",
    theme: "manual-gf830",
  },
  {
    id: "manual-gf2030",
    productId: 138,
    name: "GF 2030APAE",
    displayName: "GF 2030APAE",
    titleImage: "/card-images/GF 203OAPAE-logo-v2.png",
    titleImageAlt: "GF 2030APAE logo",
    href: "/adhesive/gf-2030apae",
    description: "Air-egress polymeric vinyl builder with 52in panel splitting, laminate options, contour cut, and rush pricing.",
    label: "Builder",
    image: "/card-images/GF-2030APAE-Image.png",
    imageAlt: "GF 2030APAE Polymeric Vinyl",
    theme: "manual-gf2030",
  },
  {
    id: "manual-window-cling",
    productId: 137,
    name: "Window Cling",
    displayName: "WINDOW CLING",
    titleImage: "/card-images/Window-Cling-Logo-v2.png",
    titleImageAlt: "Window Cling logo",
    href: "/adhesive/window-cling",
    description: "Square-inch priced static cling builder with inside/outside application and viewable controls.",
    label: "Builder",
    image: "/card-images/Window-Cling-Image.png",
    imageAlt: "Window Cling",
    theme: "manual-window-cling",
  },
  {
    id: "manual-print-wrap-film",
    productId: 136,
    name: "3M PRINT WRAP FILM",
    displayName: "3M PRINT WRAP FILM",
    href: "/adhesive/3m-print-wrap-film",
    description: "Premium wrap film builder with custom size, contour cut, laminate options, rush pricing, and panel splitting.",
    label: "Builder",
    image: "/card-images/3M-Print-Wrap-Image.png",
    imageAlt: "3M Print Wrap Film",
    titleImage: "/card-images/3m-Print-Wrap-Logo-v3.png",
    titleImageAlt: "3M Print Wrap Film logo",
    theme: "manual-print-wrap-film",
  },
  {
    id: "manual-reflective-vinyl",
    productId: 0,
    name: "Reflective Vinyl",
    displayName: "REFLECTIVE",
    href: "/adhesive/reflective-vinyl",
    description: "High-visibility reflective vinyl graphics at $9.95/sq ft. Ideal for safety signage, vehicle markings, and outdoor installations. Contour cut and rush available.",
    label: "Builder",
    image: "/card-images/Reflective-Image.png",
    imageAlt: "Reflective Vinyl High-Visibility Graphics",
    titleImage: "/card-images/REFLECTIVE-LOGO-v2.png",
    titleImageAlt: "Reflective Vinyl logo",
    theme: "manual-reflective-vinyl",
  },
  {
    id: "manual-dry-erase",
    productId: 0,
    name: "Dry Erase Wall Graphics",
    displayName: "DRY ERASE",
    href: "/adhesive/dry-erase",
    description: "Writable dry erase wall graphics at $4.35/sq ft. Perfect for offices, classrooms, and collaborative spaces. Contour cut and rush available.",
    label: "Builder",
    image: "/card-images/DRY-ERASE-Image.png",
    imageAlt: "Dry Erase Wall Graphics",
    titleImage: "/card-images/Dry-Erase-LOGO-v2.png",
    titleImageAlt: "Dry Erase logo",
    theme: "manual-dry-erase",
  },
  {
    id: "manual-low-tac-wall",
    productId: 0,
    name: "Removable Wall Decals",
    displayName: "LOW TAC WALL",
    href: "/adhesive/low-tac-wall",
    description: "Repositionable low-tac wall graphics at $4.25/sq ft. Easy to apply and remove without residue. Contour cut and rush available.",
    label: "Builder",
    image: "/card-images/Low-Tac-Image.png",
    imageAlt: "Removable Wall Decals Low-Tac Wall Graphics",
    titleImage: "/card-images/Low-Tac-Wall-Logo-v2.png",
    titleImageAlt: "Low Tac Wall logo",
    theme: "manual-low-tac-wall",
  },
  {
    id: "manual-bootprints",
    productId: 0,
    name: "Outdoor Boot Prints",
    displayName: "BOOT PRINTS",
    href: "/adhesive/bootprints",
    description: "Heavy-duty outdoor floor graphic panels at $14.95/sq ft. Built for high-traffic exterior environments. Contour cut and rush available.",
    label: "Builder",
    image: "/card-images/Boot-Prints-Image.png",
    imageAlt: "Outdoor Boot Prints Heavy-Duty Floor Graphics",
    titleImage: "/card-images/Boot-Prints-Logo.png",
    titleImageAlt: "Boot Prints logo",
    theme: "manual-bootprints",
  },
  {
    id: "manual-footprints",
    productId: 0,
    name: "Footprints",
    displayName: "FOOTPRINTS",
    href: "/adhesive/footprints",
    description: "Floor graphic adhesive panels priced at $3.10/sq ft. Dimensions billed to the nearest whole foot. Contour cut and rush available.",
    label: "Builder",
    image: "/card-images/Foot-Print-IMG.png",
    imageAlt: "Footprints Floor Graphics",
    titleImage: "/card-images/Foot-Print-Logo.png",
    titleImageAlt: "Footprints logo",
    theme: "manual-footprints",
  },
  {
    id: "manual-ij35c",
    productId: 135,
    name: "3M IJ-35C",
    displayName: "3M IJ-35C",
    titleImage: "/card-images/3m-IJ-35C-logo.png",
    titleImageAlt: "3M IJ-35C Adhesive Vinyl",
    href: "/adhesive/3m-ij-35c",
    description: "Adhesive vinyl builder with panel splitting, laminate options, contour cut, and rush pricing.",
    label: "Builder",
    image: "/card-images/3M IJ-35CIMG.png",
    imageAlt: "3M IJ-35C adhesive vinyl",
    theme: "manual-ij35c",
  },
];

const MANUAL_MAGNET_PRODUCTS: ManualBannerProductCard[] = [
  {
    id: "manual-custom-magnet",
    productId: 164,
    name: "Custom Magnets",
    displayName: "CUSTOM MAGNETS",
    titleImage: "/card-images/Custom-Magnet-Logo.png",
    titleImageAlt: "Custom Magnet logo",
    href: "/magnet",
    description: "Custom-size single-sided magnets with contour cut, rounded corners, rush production, and artwork upload.",
    label: "Builder",
    image: "/card-images/Custom_Magnet_Image.png",
    imageAlt: "Custom magnet on vehicle door",
    theme: "manual-custom-magnet",
  },
  {
    id: "manual-vehicle-magnet",
    productId: 48,
    name: "Vehicle Magnet",
    displayName: "VEHICLE MAGNET",
    titleImage: "/card-images/Vehicle-Magnet-Logo.png",
    titleImageAlt: "Vehicle Magnet logo",
    href: "/magnet/vehicle-magnet",
    description: "Fixed-size single-sided vehicle magnets with rounded corners, rush production, and artwork upload.",
    label: "Builder",
    image: "/card-images/Vehicle-Magnet-IMG.png",
    imageAlt: "Vehicle magnet on truck door",
    theme: "manual-vehicle-magnet",
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
  const normalizedName = product.name.toLowerCase();

  // Route CORO products to the custom rigid builder.
  if (product.id === 13 || normalizedName.includes("coro") || normalizedName.includes("coroplast")) {
    return "/rigid/coro";
  }

  // Route Foamcore products to the custom rigid builder.
  if (normalizedName.includes("foamcore") || normalizedName.includes("foam core")) {
    return "/rigid/foamcore";
  }

  // Route PVC products to the custom rigid builder.
  if (normalizedName.includes("pvc") || normalizedName.includes("sintra")) {
    return "/rigid/pvc";
  }

  // Route Aluminum products to the custom rigid builder.
  if (normalizedName.includes("aluminum")) {
    return "/rigid/aluminum";
  }

  // Route JBond products to the custom rigid builder.
  if (normalizedName.includes("jbond") || normalizedName.includes("j-bond") || normalizedName.includes("dibond")) {
    return "/rigid/jbond";
  }

  // Route Polystyrene products to the custom rigid builder.
  if (normalizedName.includes("polystyrene") || normalizedName.includes("styrene")) {
    return "/rigid/polystyrene";
  }

  if (normalizedName.includes("ij-35c") || normalizedName.includes("ij35c")) {
    return "/adhesive/3m-ij-35c";
  }

  if (normalizedName.includes("print wrap") || normalizedName.includes("wrap film")) {
    return "/adhesive/3m-print-wrap-film";
  }

  if (normalizedName.includes("window cling")) {
    return "/adhesive/window-cling";
  }

  if (normalizedName.includes("2030") || normalizedName.includes("gf 2030")) {
    return "/adhesive/gf-2030apae";
  }

  if (normalizedName.includes("vehicle magnet")) {
    return "/magnet/vehicle-magnet";
  }

  if (normalizedName.includes("custom magnet") || normalizedName.includes("magnet")) {
    return "/magnet";
  }

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

  const manualAdhesiveProducts = MANUAL_ADHESIVE_PRODUCTS.map((product) => {
    const visual = imageByProductId.get(product.productId);

    return {
      ...product,
      image: product.image ?? visual?.image ?? null,
      imageAlt: product.imageAlt || visual?.imageAlt || product.name,
    };
  });

  const manualMagnetProducts = MANUAL_MAGNET_PRODUCTS.map((product) => {
    const visual = imageByProductId.get(product.productId);

    return {
      ...product,
      image: product.image ?? visual?.image ?? null,
      imageAlt: product.imageAlt || visual?.imageAlt || product.name,
    };
  });

  const sectionsWithManualBuilders = sections.map((section) => {
    if (section.key === "rigid") {
      const alreadyHasCoro = section.products.some(
        (product) =>
          product.href === "/rigid/coro" ||
          product.name.toLowerCase().includes("coro") ||
          product.name.toLowerCase().includes("coroplast")
      );

      const alreadyHasFoamcore = section.products.some(
        (product) =>
          product.href === "/rigid/foamcore" ||
          product.name.toLowerCase().includes("foamcore") ||
          product.name.toLowerCase().includes("foam core")
      );

      const alreadyHasAluminum = section.products.some(
        (product) =>
          product.href === "/rigid/aluminum" ||
          product.name.toLowerCase().includes("aluminum")
      );

      const alreadyHasJBond = section.products.some(
        (product) =>
          product.href === "/rigid/jbond" ||
          product.name.toLowerCase().includes("jbond") ||
          product.name.toLowerCase().includes("j-bond")
      );

      const alreadyHasPvc = section.products.some(
        (product) =>
          product.href === "/rigid/pvc" ||
          product.name.toLowerCase().includes("pvc") ||
          product.name.toLowerCase().includes("sintra")
      );

      const alreadyHasPolystyrene = section.products.some(
        (product) =>
          product.href === "/rigid/polystyrene" ||
          product.name.toLowerCase().includes("polystyrene") ||
          product.name.toLowerCase().includes("styrene")
      );

      const missingManualCount = MANUAL_RIGID_PRODUCTS.filter((manualProduct) => {
        if (manualProduct.id === "manual-coro") return !alreadyHasCoro;
        if (manualProduct.id === "manual-foamcore") return !alreadyHasFoamcore;
        if (manualProduct.id === "manual-aluminum") return !alreadyHasAluminum;
        if (manualProduct.id === "manual-jbond") return !alreadyHasJBond;
        if (manualProduct.id === "manual-pvc") return !alreadyHasPvc;
        if (manualProduct.id === "manual-polystyrene") return !alreadyHasPolystyrene;
        return true;
      }).length;

      if (missingManualCount === 0) return section;

      return {
        ...section,
        productCount: section.productCount + missingManualCount,
      };
    }

    if (section.key === "adhesive") {
      const missingManualCount = MANUAL_ADHESIVE_PRODUCTS.filter((manualProduct) => {
        const normalizedTarget = manualProduct.name.toLowerCase();

        return !section.products.some((product) => {
          const normalizedName = product.name.toLowerCase();
          return (
            product.href === manualProduct.href ||
            normalizedName.includes(normalizedTarget) ||
            (manualProduct.id === "manual-ij35c" && (normalizedName.includes("ij-35c") || normalizedName.includes("ij35c"))) ||
            (manualProduct.id === "manual-print-wrap-film" && (normalizedName.includes("print wrap") || normalizedName.includes("wrap film"))) ||
            (manualProduct.id === "manual-window-cling" && normalizedName.includes("window cling"))
          );
        });
      }).length;

      if (missingManualCount === 0) return section;

      return {
        ...section,
        productCount: section.productCount + missingManualCount,
      };
    }

    if (section.key === "magnet") {
      const missingManualCount = MANUAL_MAGNET_PRODUCTS.filter((manualProduct) => {
        const normalizedTarget = manualProduct.name.toLowerCase();

        return !section.products.some((product) => {
          const normalizedName = product.name.toLowerCase();
          return product.href === manualProduct.href || normalizedName.includes(normalizedTarget);
        });
      }).length;

      if (missingManualCount === 0) return section;

      return {
        ...section,
        productCount: section.productCount + missingManualCount,
      };
    }

    return section;
  });

  return (
    <HomeCatalogClient
      sections={sectionsWithManualBuilders}
      manualBannerProducts={manualBannerProducts}
      manualRigidProducts={MANUAL_RIGID_PRODUCTS}
      manualAdhesiveProducts={manualAdhesiveProducts}
      manualMagnetProducts={manualMagnetProducts}
    />
  );
}

