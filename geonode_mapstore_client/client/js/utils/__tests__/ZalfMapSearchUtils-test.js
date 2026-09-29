import expect from 'expect';
import {
    formatExtent,
    getMappableResources,
    getSpatialQuality,
    isSearchableExtent,
    parseExtent
} from '../../../themes/zalf/utils/MapSearchUtils';

describe('ZALF catalogue map search utilities', () => {
    it('normalizes API and query-string extents', () => {
        expect(parseExtent({ coords: [10, 20, 11, 21] })).toEqual([10, 20, 11, 21]);
        expect(parseExtent('10,20,11,21')).toEqual([10, 20, 11, 21]);
        expect(formatExtent([10, 20, 11, 21], 2)).toBe('10.00,20.00,11.00,21.00');
    });

    it('prevents applying the known unsupported wide bbox', () => {
        expect(isSearchableExtent('-89,-20,89,20')).toBe(true);
        expect(isSearchableExtent('-91,-20,91,20')).toBe(false);
        expect(isSearchableExtent('10,10,10,20')).toBe(false);
    });

    it('distinguishes reliable bbox, placeholder and metadata-only coverage', () => {
        expect(getSpatialQuality({ extent: { coords: [12, 51, 13, 52] } }).key).toBe('bbox');
        expect(getSpatialQuality({ extent: { coords: [-1, -1, 0, 0] } }).key).toBe('suspect');
        expect(getSpatialQuality({
            extent: { coords: [-179.999, -85.06, 179.999, 85.06] },
            geo_keywords: [{ name: 'Brazil' }]
        }).key).toBe('metadata');
        expect(getSpatialQuality({ geo_keywords: [{ name: 'Brandenburg' }] }).key).toBe('metadata');
    });

    it('maps only records with a reliable recorded bounding box', () => {
        const resources = [
            { id: 1, extent: { coords: [12, 51, 13, 52] } },
            { id: 2, extent: { coords: [0, 0, 22, 22] } },
            { id: 3, geo_keywords: [{ name: 'Germany' }] }
        ];
        expect(getMappableResources(resources).map(({ id }) => id)).toEqual([1]);
    });
});
