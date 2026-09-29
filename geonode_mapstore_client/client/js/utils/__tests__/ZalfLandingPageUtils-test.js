import expect from 'expect';
import {
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
