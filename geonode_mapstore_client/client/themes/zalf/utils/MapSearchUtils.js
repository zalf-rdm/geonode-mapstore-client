/**
 * Spatial-search helpers kept in the ZALF theme so catalogue-specific
 * heuristics do not leak into the generic MapStore resource catalogue.
 */

import { getFeatureFromExtent } from '@mapstore/framework/plugins/ResourcesCatalog/utils/ResourcesCoordinatesUtils';

const PLACEHOLDER_EXTENTS = [
    [-1, -1, 0, 0],
    [0, 0, 22, 22]
];

const approximatelyEqual = (first = [], second = []) =>
    first.length === second.length
    && first.every((value, index) => Math.abs(value - second[index]) < 0.000001);

export const parseExtent = (extent) => {
    const value = Array.isArray(extent)
        ? extent
        : typeof extent === 'string'
            ? extent.split(',')
            : extent?.coords;
    const coords = (value || []).map(Number);
    return coords.length >= 4 && coords.every(Number.isFinite) ? coords : null;
};

export const formatExtent = (extent, precision = 4) => {
    const coords = parseExtent(extent);
    return coords ? coords.map((value) => value.toFixed(precision)).join(',') : undefined;
};

const parseGeometry = (geometry) => {
    if (!geometry) {
        return null;
    }
    if (typeof geometry === 'string') {
        try {
            return JSON.parse(geometry);
        } catch (error) {
            return null;
        }
    }
    return geometry;
};

export const getAdministrativeBoundary = (resource = {}) => (resource.geo_keywords || [])
    .filter(({ source, geometry }) => String(source).toUpperCase() === 'GADM' && parseGeometry(geometry))
    .sort((first, second) => Number(second.level) - Number(first.level))
    .map((keyword) => ({ ...keyword, geometry: parseGeometry(keyword.geometry) }))[0] || null;

export const isSearchableExtent = (extent) => {
    const coords = parseExtent(extent);
    if (!coords || ![4, 8].includes(coords.length)) {
        return false;
    }
    return Array.from({ length: coords.length / 4 }).every((_, index) => {
        const [minx, miny, maxx, maxy] = coords.slice(index * 4, (index + 1) * 4);
        return minx >= -180 && maxx <= 180
            && miny >= -90 && maxy <= 90
            && minx < maxx && miny < maxy
            // GeoNode currently misinterprets a single bbox wider than 180°
            // as a date-line crossing. Keep the UI honest until that backend
            // limitation is fixed.
            && maxx - minx <= 180;
    });
};

export const getSpatialQuality = (resource = {}) => {
    const coords = parseExtent(resource.extent);
    const geoKeywords = resource.geo_keywords || [];
    const administrativeBoundary = getAdministrativeBoundary(resource);
    if (!coords || coords.length !== 4) {
        return administrativeBoundary
            ? { key: 'administrative', label: 'Administrative region', mapped: true }
            : geoKeywords.length
                ? { key: 'metadata', label: 'Location metadata only', mapped: false }
                : { key: 'missing', label: 'No spatial coverage', mapped: false };
    }

    const [minx, miny, maxx, maxy] = coords;
    const isValid = coords.every(Number.isFinite)
        && minx >= -180 && maxx <= 180 && miny >= -90 && maxy <= 90
        && minx < maxx && miny < maxy;
    if (!isValid) {
        return { key: 'invalid', label: 'Invalid recorded extent', mapped: false };
    }
    if (maxx - minx > 180 || maxy - miny >= 170) {
        return administrativeBoundary
            ? { key: 'administrative', label: 'Administrative region', mapped: true }
            : geoKeywords.length
                ? { key: 'metadata', label: 'Location metadata only', mapped: false }
                : { key: 'global', label: 'Global or unspecified extent', mapped: false };
    }
    if (PLACEHOLDER_EXTENTS.some((placeholder) => approximatelyEqual(coords, placeholder))) {
        return administrativeBoundary
            ? { key: 'administrative', label: 'Administrative region', mapped: true }
            : geoKeywords.length
                ? { key: 'metadata', label: 'Location metadata only', mapped: false }
                : { key: 'suspect', label: 'Unverified recorded extent', mapped: false };
    }
    return { key: 'bbox', label: 'Approximate bounding box', mapped: true };
};

export const getMappableResources = (resources = []) => resources
    .filter((resource) => getSpatialQuality(resource).mapped);

export const getResourceFeature = (resource = {}) => {
    const quality = getSpatialQuality(resource);
    if (quality.key === 'bbox') {
        return getFeatureFromExtent(formatExtent(resource.extent));
    }
    if (quality.key === 'administrative') {
        const boundary = getAdministrativeBoundary(resource);
        return boundary && {
            type: 'Feature',
            geometry: boundary.geometry,
            properties: {}
        };
    }
    return null;
};
