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

function isUploadToolSnapshot(key, value) {
    if (key !== 'other_description' || typeof value !== 'string') return false;
    try {
        const parsed = JSON.parse(value);
        return !!(parsed?.submission?.reference_number && parsed?.dataset);
    } catch (error) {
        return false;
    }
}

function isWideMetadataField(key, value) {
    if (['contacts', 'attribute_set', 'fundings', 'related_identifier', 'geo_keywords'].includes(key)) return true;
    if (typeof value === 'string') return value.length > 120;
    if (Array.isArray(value)) return value.some((entry) => typeof entry === 'object' && entry !== null);
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 3;
    return false;
}

function resourcePeopleById(resource = {}) {
    const people = new Map();
    Object.values(resource).forEach((value) => {
        const candidates = Array.isArray(value) ? value : [value];
        candidates.forEach((candidate) => {
            if (!candidate || typeof candidate !== 'object' || candidate.pk === undefined) return;
            if (!candidate.email && !candidate.username && !candidate.full_name && !candidate.first_name) return;
            people.set(String(candidate.pk), candidate);
        });
    });
    return people;
}

export function buildContactPeople(contacts = {}, resource = {}, roleSchema = {}) {
    const detailedPeople = resourcePeopleById(resource);
    const assignments = [
        contacts?.owner && { role: 'Owner', users: [contacts.owner] },
        ...(contacts?.contact_roles || []).map(({ role, users = [] }) => ({
            role: getSchemaOptionLabel(roleSchema, role), users
        }))
    ].filter(Boolean);
    const people = new Map();

    assignments.forEach(({ role, users }) => users.forEach((user) => {
        const id = user?.id ?? user?.pk;
        const details = detailedPeople.get(String(id)) || user || {};
        const key = id === undefined ? String(user?.label || '').toLowerCase() : String(id);
        if (!key) return;
        const current = people.get(key) || { ...details, roles: [] };
        current.roles = [...new Set([...current.roles, role])];
        current.label = details.full_name
            || [details.first_name, details.last_name].filter(Boolean).join(' ')
            || user?.label || details.username || 'Unnamed person';
        people.set(key, current);
    }));

    return [...people.values()];
}

export function buildMetadataSections(metadata = {}, schema = {}, resource = {}) {
    const grouped = new Map();
    Object.keys(metadata).forEach((key) => {
        if (key === 'extraErrors' || !isMetadataValuePresent(metadata[key])) return;
        if (isUploadToolSnapshot(key, metadata[key])) return;
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
            wide: isWideMetadataField(key, metadata[key])
        });
        grouped.set(title, fields);
    });

    const priority = ['People', 'General', 'Attributes'];
    return [...grouped.entries()]
        .map(([title, fields]) => {
            if (title === 'People') {
                const contacts = fields.find(({ key }) => key === 'contacts');
                const roleSchema = contacts?.schema?.properties?.contact_roles?.items?.properties?.role || {};
                const count = buildContactPeople(contacts?.value, resource, roleSchema).length;
                return { title, id: metadataSectionId(title), fields, itemCount: count, itemLabel: count === 1 ? 'person' : 'people' };
            }
            if (title === 'Attributes') {
                const count = fields.reduce((total, field) => total + (Array.isArray(field.value) ? field.value.length : 1), 0);
                return { title, id: metadataSectionId(title), fields, itemCount: count, itemLabel: count === 1 ? 'attribute' : 'attributes' };
            }
            const count = fields.length;
            return { title, id: metadataSectionId(title), fields, itemCount: count, itemLabel: count === 1 ? 'field' : 'fields' };
        })
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
