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
