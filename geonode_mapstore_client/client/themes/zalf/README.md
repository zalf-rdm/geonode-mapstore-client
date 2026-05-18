# ZALF Customization Layer

This directory is the visual/theme layer for the ZALF customization of the GeoNode MapStore client.

The goal is to keep upstream GeoNode/MapStore code as intact as possible, so ZALF-specific work can be carried across future version upgrades with less merge pain.

## Design Principle

The customization is intentionally split into two layers:

- `client/themes/zalf/`
  Visual customization only: LESS, theme entrypoints, typography, colors, spacing, layout styling, and other presentational overrides.
- `client/js/zalf/`
  Behavioral customization: React components, plugins, epics, and other JS logic that cannot live in the theme folder because it must go through the JS/JSX build pipeline.

This separation exists because files inside `client/themes/...` are processed as theme assets, while JSX components must live under `client/js/...` to be transpiled correctly.

## Current Structure

### Theme files

- `theme.less`
  ZALF theme entrypoint. Imported by `client/themes/geonode/theme.less`.
- `bootstrap5.less`
  Utility and responsive helpers used by the ZALF UI.
- `zalf.less`
  Main ZALF styling layer, including layout overrides and custom visual treatment.

### JS customization files

Related JS files currently live in:

- `client/js/zalf/components/DetailsPanel/ResourceCitationSection.jsx`
- `client/js/zalf/plugins/AutoOpenMapDetailViewer.jsx`

These are part of the ZALF customization layer even though they are outside `client/themes/zalf/`.

## Upgrade Strategy

When upgrading GeoNode or MapStore:

1. Keep original upstream components whenever possible.
2. Prefer adding ZALF-specific styling in `client/themes/zalf/`.
3. Prefer adding ZALF-specific behavior in `client/js/zalf/`.
4. Keep direct edits to upstream core files limited to small integration points.
5. Avoid rewriting original components unless there is no practical extension point.

## Allowed Core Touch Points

Small changes in core files are acceptable only when they act as integration bridges, for example:

- importing the ZALF theme entrypoint
- registering a ZALF plugin
- wiring a ZALF component into an existing screen
- enabling a custom plugin in configuration

These bridge edits should remain minimal and easy to reapply after upstream upgrades.

## What Should Not Go Here

Do not place JSX components inside `client/themes/zalf/`.

That breaks the build pipeline, because the theme directory is not treated as a JS transpilation source.

## Practical Rule

Use this rule when adding new customization:

- If the change is about appearance, put it in `client/themes/zalf/`.
- If the change is about behavior or React rendering logic, put it in `client/js/zalf/`.
- If a core file must be touched, keep the edit as small as possible and document the reason.

## Intent

This layer is meant to make ZALF-specific UI and UX portable.

The long-term objective is:

- keep upstream upgrade paths realistic
- reduce conflicts during version changes
- preserve original components whenever possible
- centralize ZALF customization in a predictable place
