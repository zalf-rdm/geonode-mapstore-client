/**
 * CUSTOM PATH: themes/zalf/utils/MetadataViewUtils.js
 * REASON: Normalise the GeoNode metadata schema instance for the ZALF read-only
 * metadata page without coupling the presentation to the metadata editor.
 */

const NON_VALUES = ['none', 'null', 'undefined'];

export function isMetadataValuePresent(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return !!normalized && !NON_VALUES.includes(normalized);
    }
    if (Array.isArray(value)) return value.some(isMetadataValuePresent);
    if (typeof value === 'object') return Object.values(value).some(isMetadataValuePresent);
    return true;
}

export function getSchemaOptionLabel(schema = {}, value) {
    const option = (schema.oneOf || schema.anyOf || []).find((entry) => entry.const === value);
    return option?.title || value;
}

export function humanizeMetadataKey(key = '') {
    return key
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function visibleObjectEntries(value = {}, schema = {}) {
    return Object.keys(value)
        .filter((key) => schema?.properties?.[key]?.['ui:widget'] !== 'hidden')
        .filter((key) => isMetadataValuePresent(value[key]))
        .map((key) => ({
            key,
            label: schema?.properties?.[key]?.title || humanizeMetadataKey(key),
            value: value[key],
            schema: schema?.properties?.[key] || {}
        }));
}

export function metadataSectionId(title = '') {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function buildMetadataSections(metadata = {}, schema = {}) {
    const grouped = new Map();
    Object.keys(metadata).forEach((key) => {
        if (key === 'extraErrors' || !isMetadataValuePresent(metadata[key])) return;
        const propertySchema = schema?.properties?.[key] || {};
        if (propertySchema?.['ui:widget'] === 'hidden') return;
        let title = propertySchema?.['ui:options']?.['geonode-ui:group'] || 'General';
        if (key === 'contacts') title = 'People';
        const fields = grouped.get(title) || [];
        fields.push({
            key,
            label: propertySchema.title || humanizeMetadataKey(key),
            value: metadata[key],
            schema: propertySchema,
            wide: ['array', 'object'].includes(propertySchema.type)
                || (typeof metadata[key] === 'string' && metadata[key].length > 120)
        });
        grouped.set(title, fields);
    });

    const priority = ['People', 'General', 'Attributes'];
    return [...grouped.entries()]
        .map(([title, fields]) => ({ title, id: metadataSectionId(title), fields }))
        .sort((a, b) => {
            const ai = priority.indexOf(a.title);
            const bi = priority.indexOf(b.title);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
}

export function getResourceTypeLabel(resource = {}) {
    const type = resource.resource_type || 'dataset';
    const subtype = resource.subtype || '';
    if (type === 'dataset' && ['tabular', 'table'].includes(subtype)) return 'Table';
    if (type === 'dataset' && subtype === 'raster') return 'Raster Dataset';
    if (type === 'dataset' && subtype === 'vector') return 'Vector Dataset';
    if (type === 'map' && subtype === 'tabular-collection') return 'Table Collection';
    return humanizeMetadataKey(type);
}

export function getResourceIconName(resource = {}) {
    if (resource.subtype === 'tabular-collection') return 'table-collection';
    if (['tabular', 'table'].includes(resource.subtype)) return 'table';
    if (resource.resource_type === 'document') return 'document';
    if (resource.resource_type === 'map') return 'map';
    return 'dataset';
}

export function getLandingUrl(resource = {}) {
    const pk = resource.pk;
    if (!pk) return '#/';
    if (resource.resource_type === 'map') {
        return resource.subtype === 'tabular-collection'
            ? `#/landing/tabular-collection/${pk}`
            : `#/landing/map/${pk}`;
    }
    if (resource.resource_type === 'document') return `#/landing/document/${pk}`;
    return `#/landing/dataset/${pk}`;
}
