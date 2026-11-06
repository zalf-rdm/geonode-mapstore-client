/**
 * CUSTOM PATH: themes/zalf/utils/SectionUtils.js
 * REASON: the order and visibility of the CMS-driven homepage sections is itself
 * CMS content (zalf-rdm/geonode#863), instead of being fixed by the order the
 * sections happen to appear in Homepage.jsx.
 */

export const SECTIONS_URL = '/api/v2/cms/homepage-sections/';

/**
 * The order the sections were hardcoded in, used until the request resolves and
 * as the fallback if it fails. Must match HOMEPAGE_SECTION_CHOICES in
 * geonode/zalf/models.py.
 */
export const DEFAULT_SECTION_ORDER = ['cases', 'topics', 'banners', 'trainings'];

/**
 * The keys of the active sections, in display order.
 *
 * Staff receive hidden rows too so the CMS can manage them, so `is_active` is
 * filtered here as well.
 *
 * Only a *failed* request (null/not an array) falls back to the default order.
 * An empty array is a real answer — the visitor-facing API strips inactive rows,
 * so an admin who hid every section sends `[]`, and falling back there would
 * make all four reappear for visitors while looking correct to the staff member
 * who hid them (staff receive all rows and filter client-side).
 */
export function selectSectionOrder(sections) {
    if (!Array.isArray(sections)) {
        return DEFAULT_SECTION_ORDER;
    }
    return sections
        .filter((section) => section && section.key && section.is_active !== false)
        .sort((a, b) => (a.order - b.order) || (a.id - b.id))
        .map((section) => section.key);
}
