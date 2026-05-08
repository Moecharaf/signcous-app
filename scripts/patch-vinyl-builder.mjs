import { readFileSync, writeFileSync } from "fs";

const filePath = new URL(
  "../src/components/product-builder/VinylBannerBuilder.tsx",
  import.meta.url
).pathname.replace(/^\/([A-Z]:)/, "$1");

const lines = readFileSync(filePath, "utf8").split("\n");

// Keep everything up to (but not including) the `return (` at line 645 (index 644)
const keepLines = lines.slice(0, 644);

const newEnding = `
  return (
    <div className="flex h-[calc(100vh-88px)] overflow-hidden">
      {/* LEFT SIDEBAR */}
      <BuilderLeftSidebar activeTool={activeTool} onToolChange={setActiveTool} />

      {/* CENTER WORKSPACE */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at top, rgba(0,127,255,.05), transparent 35%), #f0f0f0",
        }}
      >
        {/* Top info bar */}
        <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007fff]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#007fff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#007fff]" />
              Live Preview
            </span>
            {!isEconomicalStandProduct && (
              <span className="text-xs text-zinc-500">
                {(widthIn / 12).toFixed(2)} ft &times; {(heightIn / 12).toFixed(2)} ft
              </span>
            )}
          </div>
          {/* Zoom controls */}
          {!isEconomicalStandProduct && (
            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, parseFloat((z - 0.1).toFixed(2))))}
                className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 transition-colors text-sm font-medium"
                title="Zoom out"
              >
                &minus;
              </button>
              <span className="min-w-[42px] text-center text-xs font-semibold text-zinc-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, parseFloat((z + 0.1).toFixed(2))))}
                className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 transition-colors text-sm font-medium"
                title="Zoom in"
              >
                +
              </button>
              <div className="mx-1 h-4 w-px bg-zinc-200" />
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="rounded px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Fit
              </button>
            </div>
          )}
        </div>

        {/* Canvas workspace */}
        <div
          ref={workspaceRef}
          className={\`relative flex-1 overflow-hidden \${isMeshProduct ? "bg-[#eeede9]" : ""}\`}
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(100,100,120,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,100,120,0.10) 1px, transparent 1px)",
            backgroundSize: isMeshProduct ? "32px 32px" : "40px 40px",
          }}
        >
          {/* Hint */}
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm backdrop-blur-sm">
            Drag {isHdpeProduct ? "sign" : "artwork"} to reposition &middot; Corner handle to resize
          </div>

          {/* Draggable banner/sign */}
          <div
            className={\`absolute left-1/2 top-1/2 cursor-move select-none transition-shadow \${
              isMeshProduct || isEconomicalStandProduct
                ? "rounded-md border border-zinc-400 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
                : "rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
            }\`}
            onPointerDown={startMove}
            style={{
              width: artWidth,
              height: artHeight,
              transform: \`translate(calc(-50% + \${artPos.x}px), calc(-50% + \${artPos.y}px))\`,
              background:
                !isMeshProduct && !isEconomicalStandProduct && !uploadedImage
                  ? "repeating-linear-gradient(45deg,rgba(0,127,255,0.04) 0px,rgba(0,127,255,0.04) 10px,transparent 10px,transparent 20px),linear-gradient(135deg,#eef6ff 0%,#f8fbff 100%)"
                  : undefined,
              border:
                !isMeshProduct && !isEconomicalStandProduct
                  ? "2px dashed rgba(0,127,255,0.35)"
                  : undefined,
            }}
          >
            {isMeshProduct && (
              <>
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Top Of Image
                </div>
                <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] text-zinc-500">
                  {widthNum.toFixed(2)} {form.unit === "feet" ? "ft" : "in"}
                </div>
                <div className="pointer-events-none absolute -right-7 top-1/2 -translate-y-1/2 rotate-90 text-[11px] text-zinc-500">
                  {heightNum.toFixed(2)} {form.unit === "feet" ? "ft" : "in"}
                </div>
              </>
            )}

            {isEconomicalStandProduct && (
              <>
                <div className="pointer-events-none absolute -top-11 left-1/2 flex -translate-x-1/2 flex-col items-center text-[11px] font-semibold text-zinc-600">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Top Of Image</span>
                  <div className="mt-1 flex items-center gap-2 text-zinc-600">
                    <span className="h-px w-12 bg-zinc-400" />
                    <span>{widthLabelInches}</span>
                    <span className="h-px w-12 bg-zinc-400" />
                  </div>
                </div>
                <div className="pointer-events-none absolute -right-14 top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-600">
                  <span className="h-16 w-px bg-zinc-400" />
                  <span className="my-2 -rotate-90">{heightLabelInches}</span>
                  <span className="h-16 w-px bg-zinc-400" />
                </div>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
                  Front Side
                </div>
              </>
            )}

            {uploadedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={uploadedImage}
                alt="Artwork preview"
                className="h-full w-full rounded object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <div>
                  <div className="text-sm font-semibold text-[#007fff]/60">Drop Artwork Here</div>
                  <div className="mt-1 text-[11px] text-zinc-400">Upload from the panel &rarr;</div>
                </div>
              </div>
            )}

            {meshGrommetPoints.map((point, index) => (
              <span
                key={\`grommet-\${index}\`}
                className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-500 bg-zinc-100 shadow"
                style={{ left: \`\${point.xPct}%\`, top: \`\${point.yPct}%\` }}
              >
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-400" />
              </span>
            ))}

            {!isEconomicalStandProduct && (
              <button
                type="button"
                data-role="resize-handle"
                onPointerDown={startResize}
                className="absolute -bottom-3 -right-3 h-7 w-7 rounded-full border-2 border-white bg-[#007fff] shadow-lg transition-transform hover:scale-110"
                aria-label="Resize"
                title="Drag to resize"
              />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT CONFIGURATION PANEL */}
      <div className="flex w-[400px] flex-shrink-0 flex-col border-l border-zinc-200 bg-white">
        {/* Product header */}
        <div className="border-b border-zinc-100 px-5 py-4">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#007fff]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#007fff]">
            Signcous Studio
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">{productName}</h2>
          {productDescription && (
            <p className="mt-0.5 text-xs text-zinc-500">{productDescription}</p>
          )}
        </div>

        {/* Scrollable config */}
        <div className="flex-1 overflow-y-auto">

          {/* SIZE */}
          <section className="border-b border-zinc-100 px-5 py-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Size</h3>
            {isEconomicalStandProduct ? (
              <div className="flex h-10 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700">
                33.5&Prime; &times; 80&Prime; (Standard)
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_1fr_80px] gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-500">Width</label>
                    <input
                      type="number"
                      value={form.width}
                      onChange={(e) => set("width", e.target.value)}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-[#007fff] focus:bg-white focus:ring-2 focus:ring-[#007fff]/20"
                      placeholder="W"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-500">Height</label>
                    <input
                      type="number"
                      value={form.height}
                      onChange={(e) => set("height", e.target.value)}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-[#007fff] focus:bg-white focus:ring-2 focus:ring-[#007fff]/20"
                      placeholder="H"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-500">Unit</label>
                    <select
                      value={form.unit}
                      onChange={(e) => set("unit", e.target.value as Unit)}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2 text-sm text-zinc-800 outline-none transition focus:border-[#007fff] focus:bg-white focus:ring-2 focus:ring-[#007fff]/20"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>{u === "inches" ? "in" : "ft"}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(errors.width || errors.height) && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.width || errors.height}</p>
                )}
                <div className="mt-3">
                  <p className="mb-2 text-[11px] font-semibold text-zinc-400">Popular Sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "2×4 ft", w: "24", h: "48" },
                      { label: "3×6 ft", w: "36", h: "72" },
                      { label: "4×8 ft", w: "48", h: "96" },
                      { label: "2×8 ft", w: "24", h: "96" },
                      { label: "4×4 ft", w: "48", h: "48" },
                    ].map((sz) => (
                      <button
                        key={sz.label}
                        type="button"
                        onClick={() => { set("width", sz.w); set("height", sz.h); set("unit", "inches"); }}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 transition hover:border-[#007fff] hover:bg-[#007fff]/5 hover:text-[#007fff]"
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* MATERIAL */}
          {!isPosterProduct && (
            <section className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Material</h3>
              {isCanvasProduct ? (
                <FixedField label="Canvas" />
              ) : isNoCurlProduct ? (
                <FixedField label="No-Curl Banner" />
              ) : isMeshProduct ? (
                <FixedField label="Mesh Banner" />
              ) : isHdpeProduct ? (
                <FixedField label="HDPE" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {materialOptions.map((mat) => {
                    const isSelected = form.material === mat;
                    const swatches: Record<string, string> = {
                      "13oz Vinyl": "linear-gradient(135deg,#c8d8e8,#a0b8cc)",
                      "15oz Vinyl": "linear-gradient(135deg,#b8ccd8,#8aacc0)",
                      "Mesh Banner": "repeating-linear-gradient(45deg,#ccc 0,#ccc 2px,#eee 2px,#eee 8px)",
                      "Fabric Banner": "linear-gradient(135deg,#e8d8c0,#d0b898)",
                    };
                    return (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => set("material", mat as Material)}
                        className={\`flex flex-col items-start overflow-hidden rounded-xl border-2 text-left transition-all duration-200 \${
                          isSelected
                            ? "border-[#ff7f00] shadow-[0_0_0_3px_rgba(255,127,0,0.15)]"
                            : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                        }\`}
                      >
                        <div className="h-12 w-full" style={{ background: swatches[mat] ?? "#e5e7eb" }} />
                        <div className="px-2.5 py-2">
                          <div className={\`text-[11px] font-semibold \${isSelected ? "text-[#ff7f00]" : "text-zinc-700"}\`}>{mat}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* OPTIONS */}
          {!(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
            <section className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Options</h3>
              <div className="space-y-1">
                {!isMeshProduct && (
                  <OptionRow
                    label="Double-Sided Print"
                    checked={form.doubleSided}
                    disabled={isMeshMaterial}
                    note={isMeshMaterial ? "Not available for mesh" : undefined}
                    onChange={() => { if (!isMeshMaterial) set("doubleSided", !form.doubleSided); }}
                  />
                )}
                {!isMeshProduct && (
                  <>
                    <OptionRow
                      label="Hem &amp; Grommets"
                      checked={form.grommets}
                      onChange={() => set("grommets", !form.grommets)}
                    />
                    {form.grommets && (
                      <div className="ml-7 mt-1">
                        <select
                          value={form.grommetMode}
                          onChange={(e) => set("grommetMode", e.target.value as GrommetMode)}
                          className="h-8 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-700 outline-none focus:border-[#007fff]"
                        >
                          <option value="every-2ft">Every 2–3 ft</option>
                          <option value="per-corner">Per corner only</option>
                        </select>
                      </div>
                    )}
                    <OptionRow label="Pole Pockets" checked={form.polePockets} onChange={() => set("polePockets", !form.polePockets)} />
                  </>
                )}
                {isMeshProduct ? (
                  <>
                    <OptionRow label="Welding" checked={form.meshWelding} onChange={() => set("meshWelding", !form.meshWelding)} />
                    <OptionRow label="Webbing" checked={form.meshWebbing} onChange={() => set("meshWebbing", !form.meshWebbing)} />
                    <OptionRow label="Rope" checked={form.meshRope} onChange={() => set("meshRope", !form.meshRope)} />
                    <OptionRow label="Pole Pockets" checked={form.polePockets} onChange={() => set("polePockets", !form.polePockets)} />
                    <OptionRow
                      label="Rush Production"
                      checked={form.rush}
                      onChange={() => set("rush", !form.rush)}
                      note={form.rush ? "+100% surcharge" : undefined}
                    />
                  </>
                ) : isMeshMaterial ? (
                  <div className="pt-1">
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-500">Edge Finish</label>
                    <select
                      value={form.edgeFinish}
                      onChange={(e) => set("edgeFinish", e.target.value as EdgeFinish)}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none focus:border-[#007fff] focus:ring-2 focus:ring-[#007fff]/20"
                    >
                      <option value="none">None</option>
                      <option value="welding">Welding</option>
                      <option value="webbing">Webbing</option>
                      <option value="rope">Rope</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <OptionRow label="Wind Slits" checked={form.windSlits} onChange={() => set("windSlits", !form.windSlits)} />
                    <OptionRow label="Hemming" checked={form.hemming} onChange={() => set("hemming", !form.hemming)} />
                  </>
                )}
              </div>
            </section>
          )}

          {isNoCurlProduct && (
            <section className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Options</h3>
              <OptionRow
                label="Rush Production"
                checked={form.rush}
                onChange={() => set("rush", !form.rush)}
                note={form.rush ? "+100% surcharge" : undefined}
              />
            </section>
          )}

          {isEconomicalStandProduct && (
            <section className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Format</h3>
              <FixedField label="Single-Sided" />
            </section>
          )}

          {/* QUANTITY */}
          {!isPosterProduct && (
            <section className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Quantity</h3>
              {errors.quantity && (
                <p className="mb-2 text-xs font-semibold text-rose-500">{errors.quantity}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set("quantity", String(Math.max(1, qtyNum - 1)))}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-lg font-bold text-zinc-700 transition hover:border-[#007fff] hover:bg-[#007fff]/5 hover:text-[#007fff]"
                >
                  &minus;
                </button>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  className="h-10 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-center text-sm font-semibold text-zinc-800 outline-none focus:border-[#007fff] focus:ring-2 focus:ring-[#007fff]/20"
                />
                <button
                  type="button"
                  onClick={() => set("quantity", String(Math.min(10000, qtyNum + 1)))}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-lg font-bold text-zinc-700 transition hover:border-[#007fff] hover:bg-[#007fff]/5 hover:text-[#007fff]"
                >
                  +
                </button>
              </div>
            </section>
          )}

          {/* ARTWORK */}
          <section className="border-b border-zinc-100 px-5 py-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Artwork</h3>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center transition hover:border-[#007fff] hover:bg-[#007fff]/5">
              <div className="text-sm font-semibold text-zinc-600">
                {uploadingArtwork ? "Uploading…" : "Upload Artwork"}
              </div>
              <div className="mt-1 text-[11px] text-zinc-400">PDF, AI, EPS, PNG, JPG, TIFF up to 100MB</div>
              <input
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
                onChange={onUploadArtwork}
                disabled={uploadingArtwork}
                className="hidden"
              />
            </label>
            {uploadedFileName && (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                &#10003; {uploadedFileName}
              </div>
            )}
            {uploadError && (
              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {uploadError}
              </div>
            )}
          </section>

          {/* PRICING BREAKDOWN */}
          <section className="px-5 py-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Pricing Breakdown</h3>
            <div className="space-y-1.5 text-sm">
              <Row label="Base (per unit)" value={formatPrice(pricing.basePricePerUnit)} />
              {isCanvasProduct ? (
                <>
                  <Row label="Canvas Rate" value={\`\${formatPrice(canvasRate)} / sqft\`} />
                  <Row label="Formula" value="max(W × H × rate × qty, $20)" />
                </>
              ) : isHdpeProduct ? (
                <>
                  <Row label="Rate" value={\`\${formatPrice(hdpeRate)} / sqft\`} />
                  <Row label="Sq Ft" value={String(pricing.sqFt)} />
                  <Row label="Min Order" value="$20.00" />
                </>
              ) : isNoCurlProduct ? (
                <>
                  <Row label="Rate" value={\`\${formatPrice(noCurlRate)} / sqft\`} />
                  <Row label="Billable Area" value={\`\${pricing.sqFt} sqft\`} />
                  <Row label="Grommets" value="Included" />
                  <Row label="Rush" value={formatPrice(pricing.rushSurchargePerUnit)} />
                </>
              ) : isEconomicalStandProduct ? (
                <>
                  <Row label="Standard Size" value='33.5" × 80"' />
                  <Row label="Fixed Price" value={formatPrice(ECONOMICAL_STAND_UNIT_PRICE)} />
                </>
              ) : isPosterProduct ? (
                <>
                  <Row label="Poster Rate" value={\`\${formatPrice(posterRate)} / sqft\`} />
                  <Row label="Billable Area" value={\`\${pricing.sqFt} sqft\`} />
                </>
              ) : isMeshProduct ? (
                <>
                  <Row label="Mesh Rate" value={\`\${formatPrice(meshRate)} / sqft\`} />
                  <Row label="Billable Area" value={\`\${pricing.sqFt} sqft\`} />
                  <Row label="Grommets" value="Free" />
                  <Row label="Pole Pockets" value={formatPrice(pricing.polePocketCostPerUnit)} />
                  <Row label="Rush" value={formatPrice(pricing.rushSurchargePerUnit)} />
                </>
              ) : (
                <>
                  <Row label="Grommets" value={formatPrice(pricing.grommetCostPerUnit)} />
                  <Row label="Edge Finish" value={formatPrice(pricing.edgeFinishCostPerUnit)} />
                  <Row label="Pole Pockets" value={formatPrice(pricing.polePocketCostPerUnit)} />
                  <Row label="Wind Slits" value={formatPrice(pricing.windSlitsCostPerUnit)} />
                  <Row label="Hemming" value={formatPrice(pricing.hemmingCostPerUnit)} />
                  <Row label="Rush" value={formatPrice(pricing.rushSurchargePerUnit)} />
                </>
              )}
              <div className="my-2 border-t border-zinc-100" />
              <Row label="Unit Price" value={formatPrice(pricing.unitPrice)} strong />
              <Row
                label={\`Order Total (\${effectiveQtyNum} unit\${effectiveQtyNum !== 1 ? "s" : ""})\`}
                value={formatPrice(pricing.totalPrice)}
                strong
                className="text-[#007fff]"
              />
            </div>
          </section>
        </div>

        {/* STICKY CTA */}
        <div className="flex-shrink-0 border-t border-zinc-200 bg-white p-4">
          <div className="rounded-2xl bg-zinc-900 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#007fff]">Live Total</div>
                <div className="mt-0.5 text-3xl font-bold leading-none text-white">
                  {formatPrice(pricing.totalPrice)}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {pricing.sqFt} sqft &middot; {effectiveQtyNum} unit{effectiveQtyNum !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Ships Tomorrow
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">Nationwide Delivery</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-3 w-full rounded-2xl bg-[#ff7f00] py-4 text-base font-bold text-white shadow-[0_4px_16px_rgba(255,127,0,0.35)] transition-all duration-200 hover:bg-[#e67200] hover:shadow-[0_6px_20px_rgba(255,127,0,0.45)] hover:scale-[1.01] active:scale-[0.99]"
          >
            {addedToCart ? "\\u2713 Added to Cart" : "ADD TO CART"}
          </button>
          <p className="mt-2 text-center text-[10px] text-zinc-400">
            Free proofing &middot; Secure checkout &middot; No setup fees
          </p>
        </div>
      </div>
    </div>
  );
}

function FixedField({ label }: { label: string }) {
  return (
    <div className="flex h-10 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700">
      {label}
    </div>
  );
}

function OptionRow({
  label,
  checked,
  disabled,
  note,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  note?: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={\`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 \${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-zinc-50"
      }\`}
    >
      <span className={\`font-medium \${checked ? "text-zinc-900" : "text-zinc-600"}\`}
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <div className="flex items-center gap-2">
        {note && <span className="text-[10px] text-zinc-400">{note}</span>}
        <div
          className={\`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors \${
            checked
              ? "border-[#007fff] bg-[#007fff]"
              : "border-zinc-300 bg-white"
          }\`}
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

function Row({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div
      className={\`flex items-center justify-between \${
        strong ? "font-semibold text-zinc-900" : "text-zinc-600"
      } \${className ?? ""}\`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
`;

const newContent = keepLines.join("\n") + newEnding;
writeFileSync(filePath, newContent, "utf8");
console.log("Done! New file has", newContent.split("\n").length, "lines");
