# Signcous Catalog Governance

## Goal
Keep the public storefront aligned with supplier-supported products while preserving Signcous branding, pricing UX, and checkout flow.

## Public catalog rule
Only categories and products mapped through `src/lib/catalog.ts` should be visible on the website.

## Source of truth
1. Supplier-supported category tree
2. Approved WooCommerce categories and products
3. `src/lib/catalog.ts` for public storefront exposure

## When adding a new supplier-backed line
1. Add or confirm the WooCommerce category exists
2. Add the approved slug to `APPROVED_CATEGORY_SLUGS`
3. Add or update the matching collection entry in `SIGNCOUS_COLLECTIONS`
4. If the product needs a configurator, add a dedicated branded route under `src/app`
5. Push and deploy

## When a Woo category should not appear publicly
1. Leave it in WooCommerce if operations still need it
2. Remove its slug from `APPROVED_CATEGORY_SLUGS`
3. Remove storefront links pointing to it

## Branding rule
The supplier determines fulfillment availability and broad category structure.
Signcous controls:
1. Visual design
2. Copy tone
3. Pricing presentation
4. Checkout flow
5. Customer support experience

## Current implementation
- Homepage collection cards are driven by `src/lib/catalog.ts`
- Shop index only shows approved collections
- Recent products are filtered to approved categories only
