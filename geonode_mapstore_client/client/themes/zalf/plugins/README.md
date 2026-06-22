# Plugin Overrides (ZALF)

Use this folder for MapStore/GeoNode plugin wrappers.

Recommended pattern:

1. Create a wrapper in the theme (`themes/zalf/plugins/...`).
2. Keep a reference to the original plugin in the file header.
3. Change plugin registration at the integration point only when necessary.
