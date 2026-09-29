import get from 'lodash/get';

export const hasCatalogueMetadataValue = (resource, path) => {
    const value = get(resource, path);
    return value !== undefined && value !== null && value !== '';
};

export const filterCatalogueMetadata = (metadata = [], resource = {}) => metadata
    .filter((entry) => !entry.hideIfEmpty || hasCatalogueMetadataValue(resource, entry.path));

export const ensureCatalogueThumbnail = (resource = {}) => {
    const resourceInfo = resource?.['@extras']?.info || {};
    const thumbnailUrl = resource.thumbnail_url || resourceInfo.thumbnailUrl;
    if (!thumbnailUrl) {
        return resource;
    }
    return {
        ...resource,
        '@extras': {
            ...resource['@extras'],
            info: {
                ...resourceInfo,
                thumbnailUrl
            }
        }
    };
};
