import Link from "next/link";
import {
  APPROVED_CATEGORY_SLUGS,
  SIGNCOUS_COLLECTIONS,
  getCollectionBySlug,
} from "@/lib/catalog";
import { getProductCategories, getProducts } from "@/lib/woo";

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export const metadata = {
  title: "Shop | Signcous",
  description: "Browse all print categories and products.",
};

export default async function ShopPage() {
  const [categories, products] = await Promise.all([
    getProductCategories(),
    getProducts({ perPage: 18 }),
  ]);

  const topLevel = SIGNCOUS_COLLECTIONS
    .map((collection) => categories.find((c) => c.slug === collection.slug) ?? null)
    .filter((category): category is NonNullable<typeof category> => category !== null);
  const childrenByParent = new Map<number, typeof categories>();

  for (const category of categories) {
    if (category.parent === 0) continue;
    if (!APPROVED_CATEGORY_SLUGS.has(category.slug)) continue;
    const list = childrenByParent.get(category.parent) ?? [];
    list.push(category);
    childrenByParent.set(category.parent, list);
  }

  const approvedProducts = products.filter((product) =>
    product.categories.some((category) => APPROVED_CATEGORY_SLUGS.has(category.slug))
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Catalog</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Approved Signcous collections</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            The public storefront only surfaces supplier-backed collections that fit the Signcous brand and fulfillment workflow.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {topLevel.map((parent) => {
            const children = childrenByParent.get(parent.id) ?? [];
            const collection = getCollectionBySlug(parent.slug);

            return (
              <div key={parent.id} className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
                <Link href={`/shop/${parent.slug}`} className="text-2xl font-bold text-white hover:text-orange-400">
                  {parent.name}
                </Link>
                <p className="mt-2 text-sm text-zinc-400">{collection?.description ?? `${parent.count} products`}</p>
                {collection && (
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Supplier family: {collection.supplierFamily}
                  </div>
                )}

                {children.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/shop/${child.slug}`}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300 hover:border-orange-500/40 hover:text-orange-300"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/10 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">New arrivals</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Recently added products</h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {approvedProducts.map((product) => {
              const summary = stripHtml(product.short_description || product.description);
              const image = product.images?.[0]?.src || null;

              return (
                <article key={product.id} className="rounded-2xl border border-white/10 bg-black p-4">
                  <Link href={`/shop/${product.categories?.[0]?.slug ?? ""}`} className="block">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-900">
                      {image ? (
                        <img src={image} alt={product.images?.[0]?.alt || product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-zinc-500">No image</div>
                      )}
                    </div>
                  </Link>

                  <div className="mt-4">
                    <h3 className="line-clamp-2 text-base font-semibold text-white">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{summary || "Custom print product"}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-orange-400">
                        {product.price ? `$${product.price}` : "Request quote"}
                      </span>
                      <Link
                        href={`/shop/${product.categories?.[0]?.slug ?? ""}`}
                        className="text-sm font-medium text-zinc-300 hover:text-white"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
