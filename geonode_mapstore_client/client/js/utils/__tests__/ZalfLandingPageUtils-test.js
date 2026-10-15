import expect from 'expect';
import {
    getCategoryFilterHref,
    getContributorGroups,
    getKeywordItems,
    getLandingHref,
    getResourceDates,
    getRestrictionLabels,
    getThesaurusKeywordGroups,
    getProjectLabels,
    getRegionLabels,
    getResearchDomainLabels,
    parseSupplementalInformation
} from '../ZalfLandingPageUtils';

describe('ZALF landing-page metadata helpers', () => {
    it('orders structured research domains and ignores empty entries', () => {
        expect(getResearchDomainLabels({
            research_domains: [
                { name: 'Remote Sensing', order_id: 2 },
                { name: '', order_id: 0 },
                { name: 'Soil Science', order_id: 1 }
            ]
        })).toEqual(['Soil Science', 'Remote Sensing']);
    });

    it('renders grouped research-domain names as separate labels', () => {
        expect(getResearchDomainLabels({
            research_domains: [{
                name: 'Crop Production, Plant Nutrition, Agricultural Engineering',
                order_id: 3
            }]
        })).toEqual([
            'Crop Production',
            'Plant Nutrition',
            'Agricultural Engineering'
        ]);
    });

    it('uses the display name for each related project', () => {
        expect(getProjectLabels({
            related_projects: [
                { display_name: 'BonaRes - DiControl', label: 'DiControl' },
                { label: 'Legacy project' },
                'Project supplied as text',
                null
            ]
        })).toEqual([
            'BonaRes - DiControl',
            'Legacy project',
            'Project supplied as text'
        ]);
    });

    it('splits supplemental information into label and value rows', () => {
        expect(parseSupplementalInformation(
            'Submission reference: 202606051868\nResearch question: What is the background?'
        )).toEqual([
            { label: 'Submission reference', value: '202606051868' },
            { label: 'Research question', value: 'What is the background?' }
        ]);
    });

    it('keeps supplemental values containing colons intact', () => {
        expect(parseSupplementalInformation('Source: https://example.org/data')).toEqual([
            { label: 'Source', value: 'https://example.org/data' }
        ]);
    });

    it('prefers geo keywords ordered by hierarchy level', () => {
        expect(getRegionLabels({
            geo_keywords: [
                { name: 'Lagoa Grande', level: 2 },
                { name: 'Brazil', level: 0 },
                { name: 'Pernambuco', level: 1 }
            ],
            regions: [{ name: 'Legacy region' }]
        })).toEqual(['Brazil', 'Pernambuco', 'Lagoa Grande']);
    });

    it('falls back to legacy regions when geo keywords are absent', () => {
        expect(getRegionLabels({
            geo_keywords: [],
            regions: [{ name: 'Brazil' }]
        })).toEqual(['Brazil']);
    });
});

describe('ZALF landing-page links and grouped metadata (#823)', () => {
    it('builds landing links from the resource type, including tabular datasets', () => {
        expect(getLandingHref({ pk: 1, resource_type: 'dataset', subtype: 'tabular', detail_url: '/catalogue/#/tabular/1' }))
            .toBe('/catalogue/#/landing/dataset/1');
        expect(getLandingHref({ pk: 2, resource_type: 'dataset', subtype: 'vector' })).toBe('/catalogue/#/landing/dataset/2');
        expect(getLandingHref({ pk: 3, resource_type: 'map' })).toBe('/catalogue/#/landing/map/3');
        expect(getLandingHref({ pk: 4, resource_type: 'map', subtype: 'tabular-collection' }))
            .toBe('/catalogue/#/landing/tabular-collection/4');
        expect(getLandingHref({ pk: 5, resource_type: 'document' })).toBe('/catalogue/#/landing/document/5');
        expect(getLandingHref({ pk: 6, resource_type: 'geostory', detail_url: '/catalogue/#/geostory/6' }))
            .toBe('/catalogue/#/geostory/6');
        expect(getLandingHref({})).toBe(null);
    });

    it('lists every non-empty contributor role once, authors first', () => {
        const groups = getContributorGroups({
            metadata_author: [{ username: 'a' }],
            author: [{ username: 'a' }],
            publisher: [{ username: 'p' }],
            sponsor: [],
            rights_holder: null
        });
        expect(groups.map((group) => group.key)).toEqual(['author', 'publisher']);
        expect(groups[0].label).toBe('Authors');
    });

    it('links a category to the catalogue category filter', () => {
        expect(getCategoryFilterHref({ identifier: 'farming' }))
            .toBe('/catalogue/#/?filter%7Bcategory.identifier.in%7D=farming');
        expect(getCategoryFilterHref(null)).toBe(null);
    });

    it('sorts keywords and links them to the keyword filter', () => {
        expect(getKeywordItems({ keywords: [{ name: 'soil', slug: 'soil' }, { name: 'Crop' }, 'yield'] })).toEqual([
            { name: 'Crop', href: '/catalogue/#/?q=Crop' },
            { name: 'soil', href: '/catalogue/#/?filter%7Bkeywords.slug.in%7D=soil' },
            { name: 'yield', href: '/catalogue/#/?q=yield' }
        ]);
    });

    it('groups thesaurus keywords by thesaurus', () => {
        expect(getThesaurusKeywordGroups({
            tkeywords: [
                { name: 'Soil', uri: 'http://x/soil', thesaurus: { name: 'GEMET' } },
                { name: 'Agriculture', thesaurus: { name: 'GEMET' } },
                { name: '' }
            ]
        })).toEqual([{
            thesaurus: 'GEMET',
            keywords: [{ name: 'Agriculture', uri: null }, { name: 'Soil', uri: 'http://x/soil' }]
        }]);
    });

    it('returns only the dates that are set, in DataCite order', () => {
        expect(getResourceDates({ date_available: '2026-01-02', date_created: '2025-05-01', date_valid: null })
            .map((date) => date.key)).toEqual(['date_created', 'date_available']);
    });

    it('reads restriction identifiers from objects or plain values', () => {
        expect(getRestrictionLabels([{ identifier: 'license' }, 'copyright', null])).toEqual(['license', 'copyright']);
        expect(getRestrictionLabels(undefined)).toEqual([]);
    });
});
