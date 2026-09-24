import expect from 'expect';
import {
    getRegionLabels,
    getResearchDomainLabels
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
