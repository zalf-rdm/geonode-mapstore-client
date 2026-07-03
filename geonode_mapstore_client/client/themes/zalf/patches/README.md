# Patch Log (ZALF)

Record here any change made to files outside `themes/zalf`.

## Format

- DATE:
- BASE FILE:
- CHANGE:
- REASON:
- UPGRADE RISK:

## Entries

- DATE: 2026-06-01
- BASE FILE: static/img/logo_core_trust_seal_white.png
- CHANGE: Added footer certification logo copied from `main-ui`.
- REASON: Support ZALF custom footer branding from the theme.
- UPGRADE RISK: Low (static asset only).

- DATE: 2026-06-01
- BASE FILE: static/img/logo_zalf_white.png
- CHANGE: Added footer brand logo copied from `main-ui`.
- REASON: Support ZALF custom footer branding from the theme.
- UPGRADE RISK: Low (static asset only).

- DATE: 2026-06-01
- BASE FILE: static/img/logo_zalf_white_half.png
- CHANGE: Added navbar brand logo copied from `main-ui`.
- REASON: Support ZALF custom navigation branding from the theme.
- UPGRADE RISK: Low (static asset only).

- DATE: 2026-06-17
- BASE FILE: js/utils/AppRoutesUtils.js
- CHANGE: Added `DATASET_LANDING` to `appRouteComponentTypes` and route `/landing/dataset/:pk` to `CATALOGUE_ROUTES`.
- REASON: ZALF intermediate dataset landing page before entering the full viewer. URL uses `/landing/dataset/:pk` (not `/dataset/:pk/landing`) to avoid collision with the wildcard route `/dataset/:subtype/:pk` — the Router has no Switch so overlapping 3-segment paths render simultaneously.
- UPGRADE RISK: Medium — check that no upstream route conflicts with `/landing/dataset/:pk` after upgrades.

- DATE: 2026-06-17
- BASE FILE: js/apps/gn-catalogue.js
- CHANGE: Added `DATASET_LANDING: ComponentsRoute` mapping in `getViewer`.
- REASON: Map the new landing route type to the generic ComponentsRoute renderer.
- UPGRADE RISK: Low — additive change to the viewers map.

- DATE: 2026-06-17
- BASE FILE: js/utils/ResourceUtils.js
- CHANGE: Overrode `formatDetailUrl` for `ResourceTypes.DATASET` to rewrite `#/dataset/:pk` → `#/landing/dataset/:pk`.
- REASON: Redirect catalogue card clicks to the ZALF landing page instead of directly to the viewer.
- UPGRADE RISK: Medium — if GeoNode changes the `detail_url` format (e.g. adds a subtype segment), the regex `/#\/dataset\/([^/]+)$/` must be updated.

- DATE: 2026-06-17
- BASE FILE: js/plugins/index.js
- CHANGE: Imported and registered `ZalfDatasetLandingPlugin`.
- REASON: Make the plugin available to the MapStore plugin system.
- UPGRADE RISK: Low — additive import.

- DATE: 2026-06-18
- BASE FILE: js/apps/gn-catalogue.js
- CHANGE: Added `resources.sections.catalog.showFiltersForm: true` to `initialState.defaultState`.
- REASON: Open the filter sidebar by default on the catalogue page (Zenodo-style permanent left column).
- UPGRADE RISK: Low — only sets an initial Redux state; user can still toggle it off.

- DATE: 2026-06-18
- BASE FILE: js/plugins/index.js
- CHANGE: Replaced `ResourcesFiltersFormPlugin` import from `@mapstore/framework/plugins/ResourcesCatalog` with `ZalfResourcesFiltersFormPlugin` from `themes/zalf/plugins/`, exported under the same `ResourcesFiltersFormPlugin` key.
- REASON: Use the ZALF collapsible filter sidebar (ZalfFiltersForm) instead of the core floating overlay. Filter is static in the CSS Grid layout and collapses/expands via a toggle header.
- UPGRADE RISK: Medium — if core ResourcesFiltersForm API changes (new required props, hook renames), the ZALF plugin must be updated accordingly.
