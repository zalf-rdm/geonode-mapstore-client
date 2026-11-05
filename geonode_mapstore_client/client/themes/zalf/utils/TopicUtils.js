/**
 * CUSTOM PATH: themes/zalf/utils/TopicUtils.js
 * REASON: Topics are CMS content (zalf-rdm/geonode#863). They used to be three
 * hardcoded lists — the server navbar, the client navbar (now deleted) and the
 * homepage grid — which had already drifted apart.
 */

export const TOPICS_URL = '/api/v2/cms/topics/';

const LOCALE_NAME_FIELDS = {
    de: 'name_de',
    fr: 'name_fr',
    es: 'name_es',
    it: 'name_it'
};

/**
 * The topic label for the given locale, falling back to `name` when the
 * translation is blank.
 *
 * The API also sends `name_localized`, but that is resolved from Django's active
 * language. MapStore switches locale client-side without a page reload, so the
 * two can diverge; for a React surface the raw fields plus the live locale are
 * authoritative.
 */
export function localizeTopicName(topic = {}, currentLocale = 'en-US') {
    const code = String(currentLocale || 'en').split('-')[0].toLowerCase();
    const field = LOCALE_NAME_FIELDS[code];
    const translated = field ? (topic[field] || '').trim() : '';
    return translated || topic.name || '';
}

/**
 * Active topics for one surface ('navbar' | 'homepage'), in display order.
 * Tolerates a non-array input, which is what the fetch error path yields.
 */
export function selectTopics(topics = [], surface = 'navbar') {
    const flag = surface === 'homepage' ? 'show_on_homepage' : 'show_in_navbar';
    return (Array.isArray(topics) ? topics : [])
        // Staff receive inactive rows so the CMS can manage them; public-facing
        // pages must never render those.
        .filter((topic) => topic && topic.is_active !== false && topic[flag] !== false)
        .sort((a, b) => (a.order - b.order) || (a.id - b.id));
}

/**
 * Mirrors geonode/zalf/models.py::topic_catalogue_href.
 *
 * Used ONLY for the CMS editor's live preview of an unsaved topic — every public
 * surface renders the `catalogue_href` the server computed. The paired tests in
 * ZalfTopicUtils-test.js assert byte-identical output against the Python test
 * fixtures, so a drift on either side turns one of the two suites red.
 */
export function buildTopicHref(searchTerm = '', filters = []) {
    const pairs = [];
    (Array.isArray(filters) ? filters : []).forEach((row) => {
        if (!row || !row.key) {
            return;
        }
        (row.values || []).forEach((value) => {
            if (value !== undefined && value !== null && `${value}` !== '') {
                pairs.push([row.key, `${value}`]);
            }
        });
    });
    if (searchTerm) {
        pairs.push(['q', searchTerm]);
    }
    if (pairs.length === 0) {
        return '/catalogue/#/';
    }
    // encodeURIComponent agrees with Python's urlencode(quote_via=quote) for the
    // values topics actually hold (identifiers, slugs, region codes, words):
    // braces become %7B/%7D and a space becomes %20, not "+". The two differ only
    // on characters no facet key or value uses — "/" (left alone by Python,
    // escaped here) and "!*'()" (the reverse) — and this string is a preview
    // anyway; the stored href is always the server's.
    return '/catalogue/#/?' + pairs
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

/**
 * Add or remove one value from a filter row, keeping `values` and `labels` in
 * lockstep — they are positional, so a desync makes the CMS list show the wrong
 * label for a filter.
 *
 * `items` is the facet's current value list, used to look up the label of a
 * newly selected value; a value missing from it falls back to its own key.
 */
export function toggleFilterValue(row = {}, rawKey, items = []) {
    const key = String(rawKey);
    const values = row.values || [];
    const labels = row.labels || [];
    const at = values.indexOf(key);
    if (at !== -1) {
        return {
            ...row,
            values: values.filter((value) => value !== key),
            labels: labels.filter((unused, i) => i !== at)
        };
    }
    const item = (items || []).find((i) => String(i.key) === key);
    return {
        ...row,
        values: [...values, key],
        labels: [...labels, item ? String(item.label) : key]
    };
}
