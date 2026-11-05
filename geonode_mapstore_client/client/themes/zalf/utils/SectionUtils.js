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
 * filtered here as well. An empty or failed response falls back to the default
 * order rather than rendering no sections at all.
 */
export function selectSectionOrder(sections = []) {
    if (!Array.isArray(sections) || sections.length === 0) {
        return DEFAULT_SECTION_ORDER;
    }
    return sections
        .filter((section) => section && section.key && section.is_active !== false)
        .sort((a, b) => (a.order - b.order) || (a.id - b.id))
        .map((section) => section.key);
}
