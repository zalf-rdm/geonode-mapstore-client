/*
 * ORCID iD helpers.
 *
 * Deliberately dependency-free: SearchUtils imports from here to keep ORCID iDs out of
 * formatUsernameFallback()'s title-casing, so importing SearchUtils back would create a
 * cycle. Anything needing a display name should use SearchUtils.getUserName().
 */

/** ORCID iD form, e.g. 0000-0002-1825-0097 (the last character may be X). */
export const ORCID_ID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/** True when a string is shaped like an ORCID iD. */
export function isOrcidId(value) {
    return ORCID_ID_PATTERN.test(String(value || ''));
}

/**
 * The ORCID iD for a person, or null.
 *
 * Prefers the dedicated field. Falls back to the username only when it really looks like
 * an iD: an ORCID-only deployment names accounts after the iD, but an ordinary username
 * such as "jane.doe" must never be mistaken for one.
 */
export function getOrcidId(person) {
    if (!person) return null;
    if (person.orcid_identifier) return person.orcid_identifier;
    return isOrcidId(person.username) ? person.username : null;
}

/**
 * Resolvable ORCID record URL, or null.
 *
 * Prefers the server-built `orcid_url` so deployments keep following
 * SOCIALACCOUNT_ORCID_BASE_URL (sandbox installs must not link to production orcid.org).
 */
export function getOrcidUrl(person) {
    if (person && person.orcid_url) return person.orcid_url;
    const id = getOrcidId(person);
    return id ? 'https://orcid.org/' + id : null;
}

export default { ORCID_ID_PATTERN, isOrcidId, getOrcidId, getOrcidUrl };
