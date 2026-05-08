/**
 * Bulk transforms all remaining product builders to the new 3-column premium layout.
 * Strategy:
 *  1. Add BuilderLeftSidebar import
 *  2. Add activeTool state to the component function
 *  3. Replace outer wrapper div with 3-column flex layout (sidebar + center + right panel)
 *  4. Convert the <aside> into a sticky right panel with premium styling
 *  5. Update canvas workspace background + grid opacity
 *  6. Add prominent ADD TO CART CTA to the aside (right panel)
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildersDir = join(__dirname, "../src/components/product-builder");

const builders = [
  "CoroBuilder",
  "AluminumBuilder",
  "PvcBuilder",
  "AcrylicBuilder",
  "JBondBuilder",
  "FoamcoreBuilder",
  "PolystyreneBuilder",
  "CustomMagnetBuilder",
  "VehicleMagnetBuilder",
  "BootprintsBuilder",
  "FootprintsBuilder",
  "WindowClingBuilder",
  "OrajetClearBuilder",
  "ReflectiveVinylBuilder",
  "PrintWrapFilmBuilder",
  "Ij35cBuilder",
  "GF830Builder",
  "GF2030Builder",
  "DualViewBuilder",
  "DryEraseBuilder",
  "LowTacWallBuilder",
  "OneWayWindowBuilder",
  "HdpeBuilder",
];

// Detect add-to-cart function name patterns used across builders
function detectAddToCartFn(content) {
  if (content.includes("function handleAddToCart")) return "handleAddToCart";
  if (content.includes("function addToCart")) return "addToCart";
  if (content.includes("onClick={addToCart}")) return "addToCart";
  if (content.includes("onClick={handleAddToCart}")) return "handleAddToCart";
  return "addToCart";
}

// Detect price variable used in live total display
function detectPriceVar(content) {
  // Look for existing live total display patterns
  const patterns = [
    /\{formatPrice\(pricing\.totalPrice\)\}/,
    /\{pricing \? formatCurrency\(pricing\.grandTotal\)/,
    /\{formatPrice\(totalPrice\)\}/,
    /\{formatCurrency\(pricing\.totalPrice\)\}/,
  ];
  if (/formatCurrency\(pricing\.grandTotal\)/.test(content)) return "formatCurrency(pricing?.grandTotal ?? 0)";
  if (/formatPrice\(pricing\.totalPrice\)/.test(content)) return "formatPrice(pricing.totalPrice)";
  if (/formatPrice\(totalPrice\)/.test(content)) return "formatPrice(totalPrice)";
  return "formatPrice(pricing?.totalPrice ?? 0)";
}

// Detect "added" state variable name
function detectAddedState(content) {
  if (/const \[added, setAdded\]/.test(content)) return "added";
  if (/const \[addedToCart, setAddedToCart\]/.test(content)) return "addedToCart";
  return "added";
}

// Detect product name display
function detectProductNameDisplay(content) {
  // Try to get productName prop or h1 title
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/s);
  if (h1Match) {
    const inner = h1Match[1].trim();
    // If it's a JSX expression, keep it; otherwise wrap in string
    if (inner.startsWith("{")) return inner.slice(1, -1).trim();
    return `"${inner.replace(/<[^>]*>/g, "").trim()}"`;
  }
  const h2Match = content.match(/<h2[^>]*>(.*?)<\/h2>/s);
  if (h2Match) {
    const inner = h2Match[1].trim();
    if (inner.startsWith("{")) return inner.slice(1, -1).trim();
    return `"${inner.replace(/<[^>]*>/g, "").trim()}"`;
  }
  return '"Product Builder"';
}

function transform(content, builderName) {
  let result = content;

  // 1. Add BuilderLeftSidebar import if not already there
  if (!result.includes("BuilderLeftSidebar")) {
    // Find first import line and add after it
    result = result.replace(
      /^("use client";\n)/,
      `"use client";\n\nimport BuilderLeftSidebar from "@/components/product-builder/BuilderLeftSidebar";\n`
    );
    // If no "use client", add at top
    if (!result.includes("BuilderLeftSidebar")) {
      result = `import BuilderLeftSidebar from "@/components/product-builder/BuilderLeftSidebar";\n` + result;
    }
  }

  // 2. Add activeTool state after the first useCart() line (or first useState)
  if (!result.includes("activeTool")) {
    result = result.replace(
      /( {2}const cart = useCart\(\);)/,
      `$1\n  const [activeTool, setActiveTool] = useState("design");`
    );
    // Fallback: add after first useState
    if (!result.includes("activeTool")) {
      result = result.replace(
        /(  const \[)([^\]]+\] = useState)/,
        `  const [activeTool, setActiveTool] = useState("design");\n  $1$2`
      );
    }
  }

  const addToCartFn = detectAddToCartFn(result);
  const priceDisplay = detectPriceVar(result);
  const addedState = detectAddedState(result);

  // 3. Replace outer wrapper: the big min-h div + the w-full inner div
  // Replace:
  //   <div className="min-h-[calc(100vh-96px)] bg-[...]">
  //     <div className="w-full px-3 py-3 md:px-4">
  // With the 3-column flex wrapper
  result = result.replace(
    /    <div className="min-h-\[calc\(100vh-96px\)\][^"]*" text-zinc-800">\n      <div className="w-full px-3 py-3 md:px-4">/,
    `    <div className="flex h-[calc(100vh-88px)] overflow-hidden">
      <BuilderLeftSidebar activeTool={activeTool} onToolChange={setActiveTool} />
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top, rgba(0,127,255,.05), transparent 35%), #f0f0f0" }}
      >
      <div className="flex-1 overflow-y-auto p-3 md:p-4">`
  );

  // 4. Update canvas workspace grid opacity (make lighter)
  result = result.replace(
    /rgba\(63,63,70,0\.08\)/g,
    "rgba(100,100,120,0.10)"
  );
  result = result.replace(
    /"backgroundSize": "26px 26px"/g,
    '"backgroundSize": "40px 40px"'
  );
  result = result.replace(
    /backgroundSize: "26px 26px"/g,
    'backgroundSize: "40px 40px"'
  );

  // 5. Update the canvas section height for the new layout
  result = result.replace(
    /h-\[calc\(100vh-290px\)\]/g,
    "h-[calc(100vh-200px)]"
  );

  // 6. Transform <aside className="space-y-3"> into the new right panel
  // The aside becomes the right panel. We need to:
  // a) Close the center flex-col div before the aside
  // b) Open the right panel div
  // c) Update aside content with premium styling
  // d) Add sticky CTA before closing the right panel
  // e) Close the right panel
  
  // Find and replace the aside opening
  if (result.includes('          <aside className="space-y-3">')) {
    // Close center column, open right panel, transform aside
    result = result.replace(
      '          <aside className="space-y-3">',
      `      </div>
      </div>
      {/* RIGHT PANEL */}
      <div className="flex w-[400px] flex-shrink-0 flex-col border-l border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#007fff]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#007fff]">
            Signcous Studio
          </div>
          <div className="mt-1 text-lg font-bold tracking-tight text-zinc-900">${builderName.replace("Builder", "").replace(/([A-Z])/g, " $1").trim()}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <aside className="space-y-4">`
    );
  }

  // 7. Find and replace the closing </aside> to add the sticky CTA
  // We need to close the aside + add CTA + close right panel
  // The closing pattern is:  </aside>\n        </div>\n      </div>\n    </div>
  // We replace the first </aside> in the right panel section
  
  // Find the closing aside + old closing divs pattern
  const asideClosePattern = /          <\/aside>\n        <\/div>\n      <\/div>\n    <\/div>\n  \);/;
  if (asideClosePattern.test(result)) {
    result = result.replace(
      asideClosePattern,
      `          </aside>
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
      </div>
    </div>
  );`
    );
  }

  // 8. Update grid gap-3 / gap-4 inside the center column to use flex layout
  // This makes canvas take most space and aside be on right
  result = result.replace(
    /<div className="grid gap-3">/,
    `<div className="flex gap-3">`
  );
  result = result.replace(
    /<div className="grid gap-4">/,
    `<div className="flex gap-4">`
  );

  // 9. Update the top title card to be more compact (it's now inside center column)
  result = result.replace(
    /className="mb-3 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-\[1fr_auto\] md:items-end"/g,
    `className="mb-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"`
  );
  result = result.replace(
    /className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"/g,
    `className="mb-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"`
  );

  return result;
}

let successCount = 0;
let failCount = 0;

for (const builderName of builders) {
  const filePath = join(buildersDir, `${builderName}.tsx`);
  try {
    const content = readFileSync(filePath, "utf8");
    
    // Skip if already transformed
    if (content.includes("BuilderLeftSidebar")) {
      console.log(`SKIP ${builderName} (already transformed)`);
      continue;
    }

    const transformed = transform(content, builderName);
    
    // Basic validation: ensure key markers are present
    const hasLeftSidebar = transformed.includes("BuilderLeftSidebar");
    const hasActiveTool = transformed.includes("activeTool");
    const hasNewWrapper = transformed.includes("h-[calc(100vh-88px)]");
    const hasRightPanel = transformed.includes("RIGHT PANEL");
    const hasAddToCart = transformed.includes("ADD TO CART");
    
    if (!hasLeftSidebar || !hasActiveTool || !hasNewWrapper || !hasRightPanel || !hasAddToCart) {
      console.warn(`PARTIAL ${builderName}:`, {
        hasLeftSidebar,
        hasActiveTool,
        hasNewWrapper,
        hasRightPanel,
        hasAddToCart,
      });
    }
    
    writeFileSync(filePath, transformed, "utf8");
    console.log(`✓ ${builderName}`);
    successCount++;
  } catch (err) {
    console.error(`✗ ${builderName}: ${err.message}`);
    failCount++;
  }
}

console.log(`\nDone: ${successCount} transformed, ${failCount} failed`);
