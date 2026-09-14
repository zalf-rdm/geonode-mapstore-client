/*
 * DOI resolver helpers.
 *
 * DOIs minted against the DataCite *test* API are not resolvable at doi.org — they resolve
 * at handle.test.datacite.org. Which one applies follows from the Django setting
 * ZALF_DATACITE_BASE_URL, so the resolver base is published to the page by
 * geonode_mapstore_client.context_processors._get_datacite_settings() rather than being
 * hardcoded here (#95).
 *
 * Deliberately dependency-free and hook-free: DOIs are rendered on public landing pages and
 * from plain (non-React) helpers such as getCitationUrl, where a hook cannot be used.
 */

/** Resolver used when the page carries no DataCite config at all. */
export const DEFAULT_DOI_RESOLVER = 'https://doi.org';

/**
 * Resolver prefixes stripped by bareDoi().
 *
 * The stored value is supposed to be a bare DOI, but records created through other paths can
 * carry a fully-qualified one, and it may have been minted against either environment.
 */
const KNOWN_RESOLVER_PREFIXES = [
    /^https?:\/\/(dx\.)?doi\.org\//i,
    /^https?:\/\/handle\.test\.datacite\.org\//i,
    /^https?:\/\/doi\.test\.datacite\.org\//i
];

/** Configured resolver base, without a trailing slash. */
export function getDoiResolverBase() {
    const configured = window?.__GEONODE_CONFIG__?.localConfig
        ?.geoNodeSettings?.datacite?.resolver_base_url;
    const base = typeof configured === 'string' && configured.trim()
        ? configured.trim()
        : DEFAULT_DOI_RESOLVER;
    return base.replace(/\/+$/, '');
}

/**
 * Resolvable URL for a DOI, or null.
 *
 * An already-absolute value is returned untouched: it was stored fully qualified, and
 * rewriting it could point a production DOI at the test resolver or vice versa.
 */
export function doiToUrl(doi) {
    const value = String(doi || '').trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    return getDoiResolverBase() + '/' + value.replace(/^\/+/, '');
}

/** The bare DOI, with any known resolver prefix removed. */
export function bareDoi(doi) {
    let value = String(doi || '').trim();
    if (!value) return null;
    KNOWN_RESOLVER_PREFIXES.forEach((pattern) => {
        value = value.replace(pattern, '');
    });
    return value || null;
}

export default { DEFAULT_DOI_RESOLVER, getDoiResolverBase, doiToUrl, bareDoi };
