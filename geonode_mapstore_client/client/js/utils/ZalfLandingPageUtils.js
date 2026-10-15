/** Return ordered labels from structured research-domain metadata. */
export function getResearchDomainLabels(resource = {}) {
    return (resource.research_domains || [])
        .map((domain) => typeof domain === 'string'
            ? { name: domain, order_id: Number.MAX_SAFE_INTEGER }
            : domain)
        .filter((domain) => domain && domain.name)
        .slice()
        .sort((left, right) => {
            const leftOrder = Number.isFinite(left.order_id) ? left.order_id : Number.MAX_SAFE_INTEGER;
            const rightOrder = Number.isFinite(right.order_id) ? right.order_id : Number.MAX_SAFE_INTEGER;
            return leftOrder - rightOrder || left.name.localeCompare(right.name);
        })
        .reduce((labels, domain) => [
            ...labels,
            ...domain.name.split(',').map((label) => label.trim()).filter(Boolean)
        ], []);
}

/** Return display labels for the projects already related to the resource. */
export function getProjectLabels(resource = {}) {
    return (resource.related_projects || [])
        .map((project) => typeof project === 'string'
            ? project
            : project && (project.display_name || project.label))
        .filter(Boolean);
}

/** Split supplemental metadata into readable label/value rows. */
export function parseSupplementalInformation(text = '') {
    return String(text)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const separator = line.indexOf(':');
            if (separator < 0) {
                return { label: '', value: line };
            }
            return {
                label: line.slice(0, separator).trim(),
                value: line.slice(separator + 1).trim()
            };
        })
        .filter((item) => item.value);
}

/** Prefer the complete geographic hierarchy and retain legacy-region fallback. */
export function getRegionLabels(resource = {}) {
    const geoKeywords = (resource.geo_keywords || [])
        .filter((keyword) => keyword && keyword.name)
        .slice()
        .sort((left, right) => {
            const leftLevel = Number.isFinite(left.level) ? left.level : Number.MAX_SAFE_INTEGER;
            const rightLevel = Number.isFinite(right.level) ? right.level : Number.MAX_SAFE_INTEGER;
            return leftLevel - rightLevel || left.name.localeCompare(right.name);
        });

    if (geoKeywords.length > 0) {
        return geoKeywords.map((keyword) => keyword.name);
    }

    return (resource.regions || [])
        .map((region) => region && (region.name || region))
        .filter(Boolean);
}

/**
 * Landing page URL of a resource, built from its type instead of its detail_url:
 * the detail_url of a tabular dataset is `#/tabular/<pk>`, which has no landing route
 * (zalf-rdm/geonode#823). Mirrors the type segments the landing page expects.
 */
export function getLandingHref(resource = {}) {
    if (!resource || !resource.pk) {
        return null;
    }
    const type = resource.resource_type || 'dataset';
    if (type === 'map') {
        const segment = resource.subtype === 'tabular-collection' ? 'tabular-collection' : 'map';
        return '/catalogue/#/landing/' + segment + '/' + resource.pk;
    }
    if (type === 'document' || type === 'dataset') {
        return '/catalogue/#/landing/' + type + '/' + resource.pk;
    }
    // other types (e.g. geoapps) have no landing page
    return resource.detail_url || null;
}

/**
 * Contact roles shown under "Contributors", in display order.
 * Keys are the resource API fields; `metadata_author` is left out because it is
 * the same role as `author`.
 */
export const CONTRIBUTOR_ROLES = [
    { key: 'author', label: 'Authors' },
    { key: 'principal_investigator', label: 'Principal Investigator' },
    { key: 'researcher', label: 'Researcher' },
    { key: 'data_collector', label: 'Data Collector' },
    { key: 'data_curator', label: 'Data Curator' },
    { key: 'originator', label: 'Originator' },
    { key: 'producer', label: 'Producer' },
    { key: 'processor', label: 'Processor' },
    { key: 'editor', label: 'Editor' },
    { key: 'project_leader', label: 'Project Leader' },
    { key: 'project_manager', label: 'Project Manager' },
    { key: 'project_member', label: 'Project Member' },
    { key: 'work_package_leader', label: 'Work Package Leader' },
    { key: 'supervisor', label: 'Supervisor' },
    { key: 'research_group', label: 'Research Group' },
    { key: 'related_person', label: 'Related Person' },
    { key: 'poc', label: 'Point of Contact' },
    { key: 'publisher', label: 'Publisher' },
    { key: 'distributor', label: 'Distributor' },
    { key: 'custodian', label: 'Custodian' },
    { key: 'host_institution', label: 'Hosting Institution' },
    { key: 'rights_holder', label: 'Rights Holder' },
    { key: 'sponsor', label: 'Sponsor' },
    { key: 'resource_provider', label: 'Resource Provider' },
    { key: 'resource_user', label: 'Resource User' },
    { key: 'registration_agency', label: 'Registration Agency' },
    { key: 'registration_authority', label: 'Registration Authority' },
    { key: 'other', label: 'Other' }
];

/** The non-empty contributor roles of a resource: [{ key, label, people }]. */
export function getContributorGroups(resource = {}) {
    return CONTRIBUTOR_ROLES
        .map((role) => ({ ...role, people: (resource[role.key] || []).filter(Boolean) }))
        .filter((role) => role.people.length > 0);
}

/** Catalogue search filtered by a category (same filter as the catalogue facets). */
export function getCategoryFilterHref(category) {
    if (!category || !category.identifier) {
        return null;
    }
    return '/catalogue/#/?' + encodeURIComponent('filter{category.identifier.in}') + '=' + encodeURIComponent(category.identifier);
}

/** Catalogue search filtered by a free keyword; falls back to a text search without slug. */
export function getKeywordFilterHref(keyword) {
    if (!keyword) {
        return null;
    }
    if (typeof keyword === 'object' && keyword.slug) {
        return '/catalogue/#/?' + encodeURIComponent('filter{keywords.slug.in}') + '=' + encodeURIComponent(keyword.slug);
    }
    const name = typeof keyword === 'string' ? keyword : keyword.name;
    return name ? '/catalogue/#/?q=' + encodeURIComponent(name) : null;
}

/** Free keywords as { name, href }, alphabetical. */
export function getKeywordItems(resource = {}) {
    return (resource.keywords || [])
        .map((keyword) => ({
            name: typeof keyword === 'string' ? keyword : keyword && keyword.name,
            href: getKeywordFilterHref(keyword)
        }))
        .filter((keyword) => keyword.name)
        .sort((left, right) => left.name.localeCompare(right.name));
}

/** Thesaurus (controlled vocabulary) keywords grouped by thesaurus: [{ thesaurus, keywords }]. */
export function getThesaurusKeywordGroups(resource = {}) {
    const groups = {};
    (resource.tkeywords || []).forEach((keyword) => {
        const label = keyword && (keyword.name || keyword.keyword);
        if (!label) {
            return;
        }
        const thesaurus = (keyword.thesaurus && keyword.thesaurus.name) || 'Thesaurus';
        groups[thesaurus] = [...(groups[thesaurus] || []), { name: label, uri: keyword.uri || null }];
    });
    return Object.keys(groups).sort().map((thesaurus) => ({
        thesaurus,
        keywords: groups[thesaurus].sort((left, right) => left.name.localeCompare(right.name))
    }));
}

/** DataCite dates of the resource, in DataCite order: [{ key, label, value }]. */
export const RESOURCE_DATE_FIELDS = [
    { key: 'date_created', label: 'Created' },
    { key: 'date_submitted', label: 'Submitted' },
    { key: 'date_accepted', label: 'Accepted' },
    { key: 'date_issued', label: 'Issued' },
    { key: 'date_available', label: 'Available' },
    { key: 'date_updated', label: 'Updated' },
    { key: 'date_copyrighted', label: 'Copyrighted' },
    { key: 'date_valid', label: 'Valid' }
];

export function getResourceDates(resource = {}) {
    return RESOURCE_DATE_FIELDS
        .map((field) => ({ ...field, value: resource[field.key] || null }))
        .filter((field) => field.value);
}

/** Identifiers of a many-valued restriction field (e.g. use_constraint_restrictions). */
export function getRestrictionLabels(restrictions) {
    return (Array.isArray(restrictions) ? restrictions : [restrictions])
        .map((restriction) => restriction && (restriction.identifier || restriction))
        .filter((label) => typeof label === 'string' && label);
}
