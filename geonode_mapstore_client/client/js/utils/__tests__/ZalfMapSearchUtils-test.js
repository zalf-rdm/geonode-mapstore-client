import expect from 'expect';
import {
    formatExtent,
    getAvailabilityClusters,
    getAdministrativeBoundary,
    getMappableResources,
    getResourceFeature,
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

    it('uses the deepest verified GADM boundary for administrative resources', () => {
        const brazil = {
            source: 'GADM', level: 0, gid: 'BRA',
            geometry: { type: 'MultiPolygon', coordinates: [[[[-74, -34], [-34, -34], [-34, 6], [-74, 6], [-74, -34]]]] }
        };
        const municipality = {
            source: 'GADM', level: 2, gid: 'BRA.17.101_2',
            geometry: { type: 'MultiPolygon', coordinates: [[[[-41, -9], [-40, -9], [-40, -8], [-41, -8], [-41, -9]]]] }
        };
        const resource = {
            id: 3,
            extent: { coords: [-1, -1, 0, 0] },
            geo_keywords: [brazil, municipality]
        };

        expect(getAdministrativeBoundary(resource).gid).toBe('BRA.17.101_2');
        expect(getSpatialQuality(resource).key).toBe('administrative');
        expect(getMappableResources([resource]).map(({ id }) => id)).toEqual([3]);
        expect(getResourceFeature(resource).geometry).toEqual(municipality.geometry);
    });

    it('clusters resource availability without treating anchors as observation points', () => {
        const resources = [
            { id: 1, extent: { coords: [10, 50, 11, 51] } },
            { id: 2, extent: { coords: [11, 51, 12, 52] } },
            { id: 3, extent: { coords: [-70, -20, -69, -19] } }
        ];

        const clusters = getAvailabilityClusters(resources, 3);

        expect(clusters.length).toBe(2);
        expect(clusters.map(({ properties }) => properties.count).sort()).toEqual([1, 2]);
        expect(clusters.find(({ properties }) => properties.count === 2).properties.meaning)
            .toBe('Catalogue data availability');
    });
});
