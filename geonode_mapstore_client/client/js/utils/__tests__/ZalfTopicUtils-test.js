/*
 * Tests for the shared Topic helpers (zalf-rdm/geonode#863).
 *
 * The buildTopicHref expectations are deliberately the same literal strings as
 * TestTopicCatalogueHref in geonode/zalf/tests/test_cms_topics.py. The href is
 * computed in Python for every public surface and mirrored here only for the CMS
 * editor's live preview, so pairing the assertions is what keeps the two
 * implementations honest: if either drifts, one of the two suites goes red.
 */

import expect from 'expect';
import {
    buildTopicHref,
    localizeTopicName,
    selectTopics,
    toggleFilterValue
} from '../../../themes/zalf/utils/TopicUtils';
import {
    DEFAULT_SECTION_ORDER,
    selectSectionOrder
} from '../../../themes/zalf/utils/SectionUtils';

const CATEGORY_KEY = 'filter{category.identifier.in}';
const REGION_KEY = 'filter{regions.code.in}';

describe('ZALF TopicUtils - buildTopicHref', () => {
    it('encodes a single filter the way Python urlencode(quote_via=quote) does', () => {
        expect(buildTopicHref('', [{ key: CATEGORY_KEY, values: ['farming'] }]))
            .toBe('/catalogue/#/?filter%7Bcategory.identifier.in%7D=farming');
    });

    it('repeats the key for multiple values (the OR contract)', () => {
        expect(buildTopicHref('', [{ key: CATEGORY_KEY, values: ['farming', 'soil'] }]))
            .toBe('/catalogue/#/?filter%7Bcategory.identifier.in%7D=farming'
                + '&filter%7Bcategory.identifier.in%7D=soil');
    });

    it('combines distinct keys (the AND contract)', () => {
        expect(buildTopicHref('', [
            { key: CATEGORY_KEY, values: ['farming'] },
            { key: REGION_KEY, values: ['DEU'] }
        ])).toBe('/catalogue/#/?filter%7Bcategory.identifier.in%7D=farming&filter%7Bregions.code.in%7D=DEU');
    });

    it('appends the search term as q', () => {
        expect(buildTopicHref('soil', [{ key: CATEGORY_KEY, values: ['farming'] }]))
            .toBe('/catalogue/#/?filter%7Bcategory.identifier.in%7D=farming&q=soil');
    });

    // Not "+": every link this replaced used %20.
    it('percent-encodes spaces in a search term', () => {
        expect(buildTopicHref('Soil Profiles')).toBe('/catalogue/#/?q=Soil%20Profiles');
        expect(buildTopicHref('Long Term Field Experiment'))
            .toBe('/catalogue/#/?q=Long%20Term%20Field%20Experiment');
    });

    it('falls back to the bare catalogue when nothing is configured', () => {
        expect(buildTopicHref('', [])).toBe('/catalogue/#/');
        expect(buildTopicHref()).toBe('/catalogue/#/');
        expect(buildTopicHref('', [{ key: CATEGORY_KEY, values: [] }])).toBe('/catalogue/#/');
    });

    it('skips rows without a key and blank values', () => {
        expect(buildTopicHref('', [{ values: ['x'] }, { key: CATEGORY_KEY, values: ['a', '', null] }]))
            .toBe('/catalogue/#/?filter%7Bcategory.identifier.in%7D=a');
    });
});

describe('ZALF TopicUtils - localizeTopicName', () => {
    const topic = {
        name: 'Soil Profiles',
        name_de: 'Bodenprofile',
        name_it: 'Profili del suolo',
        name_fr: '',
        name_es: '   '
    };

    it('picks the field for the active locale', () => {
        expect(localizeTopicName(topic, 'de-DE')).toBe('Bodenprofile');
        expect(localizeTopicName(topic, 'it-IT')).toBe('Profili del suolo');
    });

    it('falls back to name for a blank or whitespace-only translation', () => {
        expect(localizeTopicName(topic, 'fr-FR')).toBe('Soil Profiles');
        expect(localizeTopicName(topic, 'es-ES')).toBe('Soil Profiles');
    });

    it('falls back to name for English and unknown locales', () => {
        expect(localizeTopicName(topic, 'en-US')).toBe('Soil Profiles');
        expect(localizeTopicName(topic, 'pl-PL')).toBe('Soil Profiles');
        expect(localizeTopicName(topic)).toBe('Soil Profiles');
    });

    it('tolerates a missing topic', () => {
        expect(localizeTopicName()).toBe('');
        expect(localizeTopicName({}, 'de-DE')).toBe('');
    });
});

describe('ZALF TopicUtils - selectTopics', () => {
    const rows = [
        { id: 3, order: 1, name: 'b', is_active: true, show_in_navbar: true, show_on_homepage: false },
        { id: 1, order: 0, name: 'a', is_active: true, show_in_navbar: true, show_on_homepage: true },
        { id: 2, order: 0, name: 'x', is_active: false, show_in_navbar: true, show_on_homepage: true },
        { id: 4, order: 2, name: 'c', is_active: true, show_in_navbar: false, show_on_homepage: true }
    ];

    it('drops inactive topics and respects the navbar flag', () => {
        expect(selectTopics(rows, 'navbar').map((t) => t.name)).toEqual(['a', 'b']);
    });

    it('respects the homepage flag', () => {
        expect(selectTopics(rows, 'homepage').map((t) => t.name)).toEqual(['a', 'c']);
    });

    it('sorts by order then id', () => {
        const tied = [
            { id: 9, order: 0, name: 'late', is_active: true, show_in_navbar: true },
            { id: 2, order: 0, name: 'early', is_active: true, show_in_navbar: true }
        ];
        expect(selectTopics(tied, 'navbar').map((t) => t.name)).toEqual(['early', 'late']);
    });

    it('tolerates a non-array input, which is what the fetch error path yields', () => {
        expect(selectTopics(null, 'navbar')).toEqual([]);
        expect(selectTopics(undefined, 'homepage')).toEqual([]);
        expect(selectTopics({}, 'navbar')).toEqual([]);
    });
});

describe('ZALF SectionUtils - selectSectionOrder', () => {
    it('orders the active sections by order then id', () => {
        expect(selectSectionOrder([
            { id: 3, key: 'trainings', order: 2, is_active: true },
            { id: 1, key: 'cases', order: 0, is_active: true },
            { id: 2, key: 'topics', order: 1, is_active: true }
        ])).toEqual(['cases', 'topics', 'trainings']);
    });

    it('drops hidden sections, which staff receive but visitors must not see', () => {
        expect(selectSectionOrder([
            { id: 1, key: 'cases', order: 0, is_active: true },
            { id: 2, key: 'topics', order: 1, is_active: false },
            { id: 3, key: 'trainings', order: 2, is_active: true }
        ])).toEqual(['cases', 'trainings']);
    });

    it('reflects a reordering', () => {
        expect(selectSectionOrder([
            { id: 1, key: 'cases', order: 2, is_active: true },
            { id: 3, key: 'trainings', order: 0, is_active: true },
            { id: 2, key: 'topics', order: 1, is_active: true }
        ])).toEqual(['trainings', 'topics', 'cases']);
    });

    // Only a failed request falls back; the hook passes null for that.
    it('falls back to the default order when the request failed', () => {
        expect(selectSectionOrder(null)).toEqual(DEFAULT_SECTION_ORDER);
        expect(selectSectionOrder(undefined)).toEqual(DEFAULT_SECTION_ORDER);
        expect(selectSectionOrder({})).toEqual(DEFAULT_SECTION_ORDER);
    });

    // Regression: falling back here made every section reappear for visitors.
    // The visitor-facing API strips inactive rows, so an admin who hid all four
    // sends [] — and the staff member would not notice, because staff receive
    // all rows and filter client-side.
    it('renders nothing when the admin hid every section', () => {
        expect(selectSectionOrder([])).toEqual([]);
    });

    it('renders nothing when every row is inactive', () => {
        expect(selectSectionOrder([
            { id: 1, key: 'cases', order: 0, is_active: false },
            { id: 2, key: 'topics', order: 1, is_active: false }
        ])).toEqual([]);
    });

    it('skips rows without a key', () => {
        expect(selectSectionOrder([
            { id: 1, order: 0, is_active: true },
            { id: 2, key: 'topics', order: 1, is_active: true }
        ])).toEqual(['topics']);
    });

    // Must match HOMEPAGE_SECTION_CHOICES in geonode/zalf/models.py.
    it('keeps the default order in step with the backend choices', () => {
        expect(DEFAULT_SECTION_ORDER).toEqual(['cases', 'topics', 'banners', 'trainings']);
    });

    it('orders all four sections, spotlight banners included', () => {
        expect(selectSectionOrder([
            { id: 4, key: 'trainings', order: 3, is_active: true },
            { id: 3, key: 'banners', order: 2, is_active: true },
            { id: 1, key: 'cases', order: 0, is_active: true },
            { id: 2, key: 'topics', order: 1, is_active: true }
        ])).toEqual(['cases', 'topics', 'banners', 'trainings']);
    });
});

describe('ZALF TopicUtils - toggleFilterValue', () => {
    const items = [
        { key: 'biota', label: 'Biota', count: 12 },
        { key: 'boundaries', label: 'Boundaries', count: 3 }
    ];

    it('adds a value with the label from the facet list', () => {
        expect(toggleFilterValue({ key: CATEGORY_KEY, values: [], labels: [] }, 'biota', items))
            .toEqual({ key: CATEGORY_KEY, values: ['biota'], labels: ['Biota'] });
    });

    it('removes a value that is already selected', () => {
        const row = { key: CATEGORY_KEY, values: ['biota', 'boundaries'], labels: ['Biota', 'Boundaries'] };
        expect(toggleFilterValue(row, 'biota', items))
            .toEqual({ key: CATEGORY_KEY, values: ['boundaries'], labels: ['Boundaries'] });
    });

    // values and labels are positional, so a desync mislabels the CMS list.
    it('keeps values and labels in lockstep when removing from the middle', () => {
        const row = { key: CATEGORY_KEY, values: ['a', 'b', 'c'], labels: ['A', 'B', 'C'] };
        const next = toggleFilterValue(row, 'b', items);
        expect(next.values).toEqual(['a', 'c']);
        expect(next.labels).toEqual(['A', 'C']);
    });

    it('round-trips: adding then removing restores the original row', () => {
        const row = { key: CATEGORY_KEY, values: ['biota'], labels: ['Biota'] };
        expect(toggleFilterValue(toggleFilterValue(row, 'boundaries', items), 'boundaries', items)).toEqual(row);
    });

    it('coerces numeric keys to strings, as owner/group facets return', () => {
        const next = toggleFilterValue({ key: 'filter{owner.pk.in}', values: [], labels: [] }, 7,
            [{ key: 7, label: 'Jane Doe', count: 2 }]);
        expect(next.values).toEqual(['7']);
        expect(next.labels).toEqual(['Jane Doe']);
    });

    it('falls back to the key when the value is not in the current list', () => {
        const next = toggleFilterValue({ key: CATEGORY_KEY, values: [], labels: [] }, 'farming', items);
        expect(next.values).toEqual(['farming']);
        expect(next.labels).toEqual(['farming']);
    });

    it('tolerates a row with no values or labels yet', () => {
        expect(toggleFilterValue({ key: CATEGORY_KEY }, 'biota', items).values).toEqual(['biota']);
    });
});
