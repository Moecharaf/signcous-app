/**
 * Second-pass fix: handles CRLF line endings, uses robust string matching.
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
  return "addToCart";
}

function detectPriceDisplay(content) {
  if (content.includes("formatCurrency(pricing.grandTotal)") || content.includes("formatCurrency(pricing?.grandTotal")) {
    return "formatCurrency(pricing?.grandTotal ?? 0)";
  }
  return "formatPrice(pricing.totalPrice)";
}

function detectAddedState(content) {
  return content.includes("[addedToCart,") ? "addedToCart" : "added";
}

function processFile(raw, builderName) {
  // Normalize to LF for consistent processing
  let content = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // FIX 1: Replace outer wrapper
  if (content.includes("min-h-[calc(100vh-96px)]")) {
    // Find the lines containing the outer wrapper
    const lines = content.split("\n");
    const outIdx = lines.findIndex(l => l.includes("min-h-[calc(100vh-96px)]"));
    if (outIdx !== -1) {
      // Remove this line and the next (the w-full inner div) and replace with new wrapper
      const innerIdx = outIdx + 1;
      const hasInnerDiv = lines[innerIdx] && lines[innerIdx].includes('w-full px-3 py-3');
      
      const newWrapperLines = [
        '    <div className="flex h-[calc(100vh-88px)] overflow-hidden">',
        '      <BuilderLeftSidebar activeTool={activeTool} onToolChange={setActiveTool} />',
        '      <div',
        '        className="flex flex-1 flex-col overflow-hidden"',
        '        style={{ background: "radial-gradient(circle at top, rgba(0,127,255,.05), transparent 35%), #f0f0f0" }}',
        '      >',
        '      <div className="flex-1 overflow-y-auto p-3 md:p-4">',
      ];
      
      if (hasInnerDiv) {
        lines.splice(outIdx, 2, ...newWrapperLines);
      } else {
        lines.splice(outIdx, 1, ...newWrapperLines);
      }
      content = lines.join("\n");
    }
  }

  const addToCartFn = detectAddToCartFn(content);
  const priceDisplay = detectPriceDisplay(content);
  const addedState = detectAddedState(content);

  // FIX 2: Add sticky CTA after the last </aside> in the return block
  // Find all aside positions
  if (!content.includes("ADD TO CART")) {
    // Find the closing of the aside in the right panel
    // Look for </aside> followed shortly by closing divs and );
    // Strategy: find the LAST </aside> that is followed by </div></div></div>);
    
    // Split into lines and find the last </aside>
    const lines = content.split("\n");
    
    // Find the last line with </aside>
    let lastAsideIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes("</aside>")) {
        lastAsideIdx = i;
        break;
      }
    }
    
    if (lastAsideIdx !== -1) {
      // Get the indentation of the </aside> line
      const asideLine = lines[lastAsideIdx];
      const asideIndent = asideLine.match(/^(\s*)/)?.[1] ?? "          ";
      const panelIndent = asideIndent.replace(/  $/, ""); // 2 spaces less
      
      const ctaLines = [
        `        </div>`,
        `        {/* STICKY CTA */}`,
        `        <div className="flex-shrink-0 border-t border-zinc-200 bg-white p-4">`,
        `          <div className="rounded-2xl bg-zinc-900 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.20)]">`,
        `            <div className="flex items-start justify-between">`,
        `              <div>`,
        `                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#007fff]">Live Total</div>`,
        `                <div className="mt-0.5 text-3xl font-bold leading-none text-white">`,
        `                  {${priceDisplay}}`,
        `                </div>`,
        `              </div>`,
        `              <div className="text-right">`,
        `                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">`,
        `                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />`,
        `                  Ships Tomorrow`,
        `                </div>`,
        `              </div>`,
        `            </div>`,
        `          </div>`,
        `          <button`,
        `            type="button"`,
        `            onClick={${addToCartFn}}`,
        `            className="mt-3 w-full rounded-2xl bg-[#ff7f00] py-4 text-base font-bold text-white shadow-[0_4px_16px_rgba(255,127,0,0.35)] transition-all duration-200 hover:bg-[#e67200] hover:shadow-[0_6px_20px_rgba(255,127,0,0.45)] hover:scale-[1.01] active:scale-[0.99]"`,
        `          >`,
        `            {${addedState} ? "\u2713 Added to Cart" : "ADD TO CART"}`,
        `          </button>`,
        `          <p className="mt-2 text-center text-[10px] text-zinc-400">`,
        `            Free proofing &middot; Secure checkout &middot; No setup fees`,
        `          </p>`,
        `        </div>`,
        `      </div>`,
      ];
      
      // Insert CTA after the </aside> line
      lines.splice(lastAsideIdx + 1, 0, ...ctaLines);
      content = lines.join("\n");
    }
  }

  // FIX 3: Fix the closing divs - remove the extra old wrapper divs that are now orphaned
  // The old structure had: </div></div></div>); where 3 closing divs closed: grid, inner padding, outer wrapper
  // Now we have the CTA closing the right panel, and we need only 1 more closing div (for the 3-column flex container)
  // The pattern near the end should be:
  //   [CTA content]
  //   </div>  <- closes right panel
  // </div>   <- closes 3-column wrapper
  // );
  // But now there are extra closing divs... let's leave them for now and check errors
  
  // Write back with LF endings
  return content;
}

let fixedCount = 0;
let partialCount = 0;

for (const builderName of builders) {
  const filePath = join(buildersDir, `${builderName}.tsx`);
  try {
    const raw = readFileSync(filePath, "utf8");
    
    const needsWrapperFix = raw.replace(/\r\n/g, "\n").includes("min-h-[calc(100vh-96px)]");
    const needsCTAFix = !raw.includes("ADD TO CART");
    
    if (!needsWrapperFix && !needsCTAFix) {
      console.log(`SKIP ${builderName}`);
      continue;
    }

    const fixed = processFile(raw, builderName);
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
