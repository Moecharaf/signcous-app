/**
 * Second pass: fix the outer wrapper replacement and add the sticky CTA to each builder.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildersDir = join(__dirname, "../src/components/product-builder");

const builders = [
  "CoroBuilder", "AluminumBuilder", "PvcBuilder", "AcrylicBuilder", "JBondBuilder",
  "FoamcoreBuilder", "PolystyreneBuilder", "CustomMagnetBuilder", "VehicleMagnetBuilder",
  "BootprintsBuilder", "FootprintsBuilder", "WindowClingBuilder", "OrajetClearBuilder",
  "ReflectiveVinylBuilder", "PrintWrapFilmBuilder", "Ij35cBuilder", "GF830Builder",
  "GF2030Builder", "DualViewBuilder", "DryEraseBuilder", "LowTacWallBuilder",
  "OneWayWindowBuilder", "HdpeBuilder",
];

function detectAddToCartFn(content) {
  if (content.includes("function handleAddToCart")) return "handleAddToCart";
  if (content.includes("function addToCart")) return "addToCart";
  return "addToCart";
}

function detectPriceDisplay(content) {
  if (/formatCurrency\(pricing\.grandTotal\)/.test(content)) return "formatCurrency(pricing?.grandTotal ?? 0)";
  if (/formatPrice\(pricing\.totalPrice\)/.test(content)) return "formatPrice(pricing.totalPrice)";
  return "formatPrice(pricing?.totalPrice ?? 0)";
}

function detectAddedState(content) {
  if (/\[addedToCart,/.test(content)) return "addedToCart";
  return "added";
}

function fix(content, builderName) {
  let result = content;

  // FIX 1: Replace outer wrapper (exact string replacement, no regex complexity)
  // The outer wrapper always has the same structure. Try several known variants.
  const wrapperPatterns = [
    `    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">\n      <div className="w-full px-3 py-3 md:px-4">`,
    `    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f0f4f8_0%,#e8edf2_55%,#dde4ec_100%)] text-zinc-800">\n      <div className="w-full px-3 py-3 md:px-4">`,
    `    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">\n      <div className="w-full px-3 py-3 md:px-4">`,
    `    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f0f7f2_0%,#e8f2ea_55%,#dceee0_100%)] text-zinc-800">\n      <div className="w-full px-3 py-3 md:px-4">`,
    `    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f0f4f8_0%,#e8ecf0_55%,#dde4ec_100%)] text-zinc-800">\n      <div className="w-full px-3 py-3 md:px-4">`,
  ];

  const newWrapper = `    <div className="flex h-[calc(100vh-88px)] overflow-hidden">
      <BuilderLeftSidebar activeTool={activeTool} onToolChange={setActiveTool} />
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top, rgba(0,127,255,.05), transparent 35%), #f0f0f0" }}
      >
      <div className="flex-1 overflow-y-auto p-3 md:p-4">`;

  for (const pattern of wrapperPatterns) {
    if (result.includes(pattern)) {
      result = result.replace(pattern, newWrapper);
      break;
    }
  }

  // FIX 2: Add sticky CTA before/after the closing </aside>
  // The pattern after transformation is:
  //   </aside>
  // followed by:
  //   </div>  (closes the "flex-1 overflow-y-auto px-5 py-4 space-y-4" div)
  //   </div>  (closes the old grid/flex div)
  //   </div>  (closes the old inner padding div)
  //   </div>  (closes the old outer wrapper)
  //   );      (closes the return)
  
  const addToCartFn = detectAddToCartFn(result);
  const priceDisplay = detectPriceDisplay(result);
  const addedState = detectAddedState(result);

  const ctaBlock = `
        </div>
        {/* STICKY CTA */}
        <div className="flex-shrink-0 border-t border-zinc-200 bg-white p-4">
          <div className="rounded-2xl bg-zinc-900 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#007fff]">Live Total</div>
                <div className="mt-0.5 text-3xl font-bold leading-none text-white">
                  {${priceDisplay}}
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Ships Tomorrow
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={${addToCartFn}}
            className="mt-3 w-full rounded-2xl bg-[#ff7f00] py-4 text-base font-bold text-white shadow-[0_4px_16px_rgba(255,127,0,0.35)] transition-all duration-200 hover:bg-[#e67200] hover:shadow-[0_6px_20px_rgba(255,127,0,0.45)] hover:scale-[1.01] active:scale-[0.99]"
          >
            {${addedState} ? "\\u2713 Added to Cart" : "ADD TO CART"}
          </button>
          <p className="mt-2 text-center text-[10px] text-zinc-400">
            Free proofing &middot; Secure checkout &middot; No setup fees
          </p>
        </div>
      </div>`;

  // The closing sequence we need to find (with exact indentation from the transformation output)
  // Looking at CoroBuilder: </aside> at col 10, then </div></div></div></div>);
  const closingPatterns = [
    // Pattern from partially transformed files
    `          </aside>\n        </div>\n      </div>\n    </div>\n  );`,
    // Alternative - some builders have different nesting
    `          </aside>\n        </div>\n      </div>\n    </div>\n  );\n}`,
  ];

  for (const pattern of closingPatterns) {
    if (result.includes(pattern)) {
      const replacement = `          </aside>${ctaBlock}\n    </div>\n  );`;
      result = result.replace(pattern, replacement);
      break;
    }
  }

  return result;
}

let fixedCount = 0;
let partialCount = 0;

for (const builderName of builders) {
  const filePath = join(buildersDir, `${builderName}.tsx`);
  try {
    const content = readFileSync(filePath, "utf8");
    
    const hasOldWrapper = content.includes("min-h-[calc(100vh-96px)]");
    const hasNoCTA = !content.includes("ADD TO CART");
    
    if (!hasOldWrapper && !hasNoCTA) {
      console.log(`SKIP ${builderName} (already fully fixed)`);
      continue;
    }

    const fixed = fix(content, builderName);
    
    const hasNewWrapper = fixed.includes("h-[calc(100vh-88px)]");
    const hasCTA = fixed.includes("ADD TO CART");
    
    writeFileSync(filePath, fixed, "utf8");
    
    if (hasNewWrapper && hasCTA) {
      console.log(`✓ ${builderName}`);
      fixedCount++;
    } else {
      console.warn(`PARTIAL ${builderName}: wrapper=${hasNewWrapper}, cta=${hasCTA}`);
      partialCount++;
    }
  } catch (err) {
    console.error(`✗ ${builderName}: ${err.message}`);
  }
}

console.log(`\nDone: ${fixedCount} fully fixed, ${partialCount} partial`);
