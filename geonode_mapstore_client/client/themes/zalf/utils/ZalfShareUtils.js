/**
 * CUSTOM PATH: themes/zalf/utils/ZalfShareUtils.js
 * REASON: the landing page's share button (zalf-rdm/geonode#823) shares the stable
 * /landing/<uuid>/ link, which is the DOI target. zalf-rdm/geonode#812 asks for that
 * same button in the catalogue, so the behaviour lives here instead of being
 * duplicated: the landing page, the catalogue cards and the catalogue detail panel
 * all share one implementation.
 */

/**
 * The stable landing page link for a resource — the DOI target, not the current
 * catalogue or viewer URL.
 * @param {string} uuid resource uuid
 * @returns {string|null} absolute URL, or null when there is no uuid to share
 */
export function getLandingShareUrl(uuid) {
    if (!uuid) {
        return null;
    }
    return window.location.origin + '/landing/' + uuid + '/';
}

/**
 * Copy a link to the clipboard.
 * @returns {Promise<boolean>} true when the link reached the clipboard
 */
export function copyLink(url) {
    if (!url || !navigator.clipboard || !navigator.clipboard.writeText) {
        // No clipboard in insecure contexts or older browsers; the caller shows
        // nothing rather than claiming a copy that did not happen.
        return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(url)
        .then(() => true)
        .catch((err) => {
            console.error('Failed to copy link: ', err);
            return false;
        });
}

/**
 * Hand a link to the system share dialog, falling back to the clipboard.
 *
 * The resolved value says whether the link was *copied*, which is the only case
 * the caller has to report — a successful system share already told the user.
 *
 * @param {object} options
 * @param {string} options.url link to share
 * @param {string} [options.title] title passed to the system share dialog
 * @returns {Promise<boolean>} true when the link was copied to the clipboard
 */
export function shareLink({ url, title }) {
    if (!url) {
        return Promise.resolve(false);
    }
    if (navigator.share) {
        return navigator.share({ title, url })
            .then(() => false)
            .catch((err) => {
                // A cancelled share dialog rejects with AbortError; only fall back
                // to the clipboard on a real failure.
                if (err && err.name === 'AbortError') {
                    return false;
                }
                return copyLink(url);
            });
    }
    return copyLink(url);
}
