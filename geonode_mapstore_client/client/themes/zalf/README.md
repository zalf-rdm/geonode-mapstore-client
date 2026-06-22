# ZALF Theme Customization Workspace

Goal: keep theme and component customizations in this directory to make version migration and reuse in other projects easier.

## Structure

- `less/`: style variables and overrides
- `components/`: customized components used by the theme
- `plugins/`: plugin wrappers/overrides
- `patches/`: notes about integration points with base code

## Golden rule

When copying or overriding code from a base file, always keep a reference to the original path at the top of the file:

```js
// ORIGINAL PATH: js/plugins/ResourceDetails/containers/DetailsPanel.jsx
// CUSTOM PATH: themes/zalf/components/resource-details/DetailsPanel.jsx
```

If you change an import path, keep the original import commented immediately above the new import:

```js
// import DetailsPanel from '../../../js/plugins/ResourceDetails/containers/DetailsPanel';
import DetailsPanel from '../themes/zalf/components/resource-details/DetailsPanel';
```

## Recommended workflow

1. Create/edit customizations only inside `themes/zalf`.
2. Integrate into base code via wrapper (preferred) or targeted override.
3. Register touched base files in `patches/README.md`.
4. Compile and test.

