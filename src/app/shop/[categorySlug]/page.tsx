import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductCategories, getProductsByCategorySlug } from "@/lib/woo";

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const [{ category, products }, categories] = await Promise.all([
    getProductsByCategorySlug(categorySlug),
    getProductCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const childCategories = categories.filter((c) => c.parent === category.id);

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-14">
        <Link href="/shop" className="text-sm text-zinc-400 hover:text-white">
          Shop
        </Link>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{category.name}</h1>
        <p className="mt-2 text-zinc-400">{category.count} products in this category</p>

        {childCategories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {childCategories.map((child) => (
              <Link
                key={child.id}
                href={`/shop/${child.slug}`}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-zinc-300 hover:border-orange-500/40 hover:text-orange-300"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-zinc-950 p-8 text-zinc-300">
            No products yet in this category. Add products in WooCommerce and they will appear here automatically.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const image = product.images?.[0]?.src || null;
              const summary = stripHtml(product.short_description || product.description);

              return (
                <article key={product.id} className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-900">
                    {image ? (
                      <img src={image} alt={product.images?.[0]?.alt || product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-500">No image</div>
                    )}
                  </div>

                  <h2 className="mt-4 line-clamp-2 text-lg font-semibold">{product.name}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{summary || "Custom print product"}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-orange-400">
                      {product.price ? `$${product.price}` : "Request quote"}
                    </span>
                    <a
                      href={product.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-zinc-300 hover:text-white"
                    >
                      Open product
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
