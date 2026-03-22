// WooCommerce REST API client for Signcous
// Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/

const WOO_BASE_URL = process.env.NEXT_PUBLIC_WOO_BASE_URL ?? "";
const WOO_KEY = process.env.WOO_CONSUMER_KEY ?? "";
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET ?? "";

/**
 * Metadata attached to each WooCommerce cart/order line item
 * for custom-configured products.
 */
export interface BannerOrderMeta {
  width: number;
  height: number;
  unit: "inches" | "feet";
  quantity: number;
  material: string;
  doubleSided: boolean;
  grommets: boolean;
  polePockets: boolean;
  windSlits: boolean;
  hemming: boolean;
  rush: boolean;
  uploadedFileUrl: string | null;
  customerNotes: string;
  calculatedUnitPrice: number;
  calculatedTotalPrice: number;
}

interface WooHeaders {
  "Content-Type": string;
  Authorization: string;
  [key: string]: string;
}

function getAuthHeaders(): WooHeaders {
  const token = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${token}`,
  };
}

/**
 * Adds a configured banner product to WooCommerce via Next.js API route.
 * The API route handles authentication and WooCommerce communication server-side.
 */
export async function addBannerToCart(
  productId: number,
  meta: BannerOrderMeta
): Promise<{ success: boolean; orderId?: number; error?: string }> {
  try {
    const res = await fetch("/api/cart/add-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: meta.quantity,
        itemData: buildLineItemMeta(meta),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err?.error ?? "Failed to add to cart" };
    }

    const data = await res.json();
    return { success: true, orderId: data?.orderId };
  } catch (err) {
    console.error("Add to cart error:", err);
    return { success: false, error: "Network error. Please try again." };
  }
}

/**
 * Fetches the current WooCommerce cart contents.
 */
export async function getCart(): Promise<unknown | null> {
  const url = `${WOO_BASE_URL}/wp-json/wc/store/v1/cart`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches a single WooCommerce product by ID.
 */
export async function getProduct(productId: number): Promise<unknown | null> {
  const url = `${WOO_BASE_URL}/wp-json/wc/v3/products/${productId}`;
  try {
    const res = await fetch(url, { headers: getAuthHeaders(), next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildLineItemMeta(meta: BannerOrderMeta): Record<string, string> {
  return {
    custom_width: String(meta.width),
    custom_height: String(meta.height),
    custom_unit: meta.unit,
    custom_material: meta.material,
    custom_double_sided: meta.doubleSided ? "yes" : "no",
    custom_grommets: meta.grommets ? "yes" : "no",
    custom_pole_pockets: meta.polePockets ? "yes" : "no",
    custom_wind_slits: meta.windSlits ? "yes" : "no",
    custom_hemming: meta.hemming ? "yes" : "no",
    custom_rush: meta.rush ? "yes" : "no",
    custom_file_url: meta.uploadedFileUrl ?? "",
    custom_notes: meta.customerNotes,
    custom_unit_price: meta.calculatedUnitPrice.toFixed(2),
    custom_total_price: meta.calculatedTotalPrice.toFixed(2),
  };
}
