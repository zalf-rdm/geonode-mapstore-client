/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';
import { getDownloadUrlInfo } from '@js/utils/ResourceUtils';
import { getResourceByPk } from '@js/api/geonode/v2';

const getCataloguePreviewUrl = (field = {}) => {
    const pk = field?.pk;
    const resourceType = field?.resource_type;
    if (!pk || !resourceType) {
        return field?.detail_url || '#';
    }
    const descriptor = `${pk};${resourceType}${field?.subtype ? `;${field.subtype}` : ''}`;
    return `/catalogue/#/all?d=${encodeURIComponent(descriptor)}`;
};

const getDownloadUrl = (field = {}) => {
    const { url: resolvedUrl } = getDownloadUrlInfo(field) || {};
    const linkDownloadUrl = (field?.links || [])
        .map((link) => link?.download_url || link?.downloadUrl || link?.href || link?.url)
        .find(Boolean);
    const assetDownloadUrl = (field?.assets || [])
        .map((asset) => asset?.download_url || asset?.downloadUrl || asset?.url)
        .find(Boolean);
    return resolvedUrl
        || field?.download_url
        || field?.downloadUrl
        || assetDownloadUrl
        || linkDownloadUrl
        || null;
};

const getPrimaryDataLink = (field = {}) => {
    const links = field?.links || [];
    return links.find((link) => link?.link_type === 'data')
        || links.find((link) => link?.extras?.content?.download_url)
        || links.find((link) => link?.extension)
        || null;
};

const formatFileSize = (sizeBytes) => {
    const size = Number(sizeBytes);
    if (!Number.isFinite(size) || size < 0) {
        return null;
    }
    if (size < 1024) return `${size} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = size / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    const decimals = value >= 10 ? 0 : 1;
    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
};

const getResourceSizeLabel = (field = {}) => {
    const dataLink = getPrimaryDataLink(field);
    const sizeBytes = dataLink?.extras?.content?.size_bytes
        ?? dataLink?.extras?.content?.sizeBytes
        ?? field?.size_bytes
        ?? field?.sizeBytes;
    return formatFileSize(sizeBytes);
};

const getResourceDimensionLabel = (field = {}) => {
    const dataLink = getPrimaryDataLink(field);
    const width = dataLink?.extras?.content?.width
        ?? dataLink?.extras?.content?.pixel_width
        ?? field?.width
        ?? field?.pixel_width;
    const height = dataLink?.extras?.content?.height
        ?? dataLink?.extras?.content?.pixel_height
        ?? field?.height
        ?? field?.pixel_height;
    if (Number.isFinite(Number(width)) && Number.isFinite(Number(height))) {
        return `${width} x ${height} px`;
    }
    return null;
};

const getReadableDataType = (field = {}) => {
    const dataLink = getPrimaryDataLink(field);
    const extension = (dataLink?.extension || '').toLowerCase();
    const contentType = (dataLink?.extras?.content?.type || '').toLowerCase();
    const subtype = (field?.subtype || '').toLowerCase();

    if (['tif', 'tiff', 'geotiff'].includes(extension) || contentType.includes('tiff')) {
        return 'GeoTIFF Raster Data';
    }
    if (subtype === 'raster') {
        return 'Raster Data';
    }
    if (subtype === 'vector') {
        return 'Vector Data';
    }
    if (extension) {
        return `${extension.toUpperCase()} Data`;
    }
    if (contentType) {
        return `${contentType.toUpperCase()} Data`;
    }
    if (dataLink?.name) {
        return dataLink.name;
    }
    const resourceType = field?.resource_type || 'resource';
    return resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
};

const getResourceDescription = (field = {}) => {
    const parts = [getReadableDataType(field)];
    const dimensionLabel = getResourceDimensionLabel(field);
    if (dimensionLabel) {
        parts.push(dimensionLabel);
    }
    return parts.filter(Boolean).join(' • ');
};

const getFileIconAndColor = (field = {}) => {
    const dataLink = getPrimaryDataLink(field);
    const extension = (dataLink?.extension || '').toLowerCase();
    const contentType = (dataLink?.extras?.content?.type || '').toLowerCase();
    const subtype = (field?.subtype || '').toLowerCase();

    // Raster format detection
    if (['tif', 'tiff', 'geotiff', 'jpg', 'jpeg', 'png', 'img'].includes(extension)
        || contentType.includes('image')
        || contentType.includes('tiff')) {
        return { icon: 'image', color: 'blue' }; // 📷 image icon for raster
    }

    // Vector format detection (BEFORE raster check since some might overlap)
    if (['shp', 'gpkg', 'geojson', 'json', 'kml', 'gpx'].includes(extension)
        || subtype === 'vector'
        || contentType.includes('geojson')
        || contentType.includes('kml')
        || contentType.includes('gpx')) {
        return { icon: 'map', color: 'purple' }; // 🗺️ map icon for vector
    }

    // Style/Symbology files
    if (['qml', 'sld', 'css'].includes(extension)) {
        return { icon: 'palette', color: 'red' }; // 🎨 palette icon for style
    }

    // Document/Report format
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension)) {
        return { icon: 'file-text', color: 'amber' }; // 📄 file-text icon for documents
    }

    // Spreadsheet format
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return { icon: 'table', color: 'emerald' }; // 📊 table icon for data
    }

    // Compressed/Archive format
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(extension)) {
        return { icon: 'archive', color: 'slate' }; // 📦 archive icon for archives
    }

    // Default fallback
    return { icon: 'file', color: 'gray' };
};

const SORT_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' }
];

const sortResources = (resources, sortBy) => {
    const sorted = [...resources];
    if (sortBy === 'name') {
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'type') {
        sorted.sort((a, b) => (a.resource_type || '').localeCompare(b.resource_type || ''));
    }
    return sorted;
};

const DetailLinkedResource = ({ resources = [], type, downloadingByPk, setDownloadingByPk }) => {
    const [sortBy, setSortBy] = React.useState('name');
    const [fullResourcesData, setFullResourcesData] = React.useState({});

    if (isEmpty(resources)) {
        return null;
    }

    // Fetch full resource data for all resources (to get extension, etc.)
    React.useEffect(() => {
        const fetchFullData = async () => {
            const pksToFetch = resources
                .filter(r => r.pk && !fullResourcesData[String(r.pk)])
                .map(r => r.pk);

            if (pksToFetch.length === 0) return;

            const newData = { ...fullResourcesData };
            await Promise.all(
                pksToFetch.map(pk =>
                    getResourceByPk(pk)
                        .then(data => {
                            // Store with string key to match API pk format
                            newData[String(data.pk)] = data;
                        })
                        .catch((err) => {
                            // ignore errors, use fallback
                            console.warn(`Failed to fetch resource ${pk}:`, err);
                        })
                )
            );
            setFullResourcesData(newData);
        };

        fetchFullData();
    }, [resources]);

    const sortedResources = sortResources(resources, sortBy);

    const handleDownload = async (field = {}, fallbackUrl) => {
        const pk = field?.pk;
        if (pk) {
            const pkString = String(pk);
            setDownloadingByPk((prev) => ({ ...prev, [pkString]: true }));
            try {
                const fullResource = await getResourceByPk(pk);
                const { url } = getDownloadUrlInfo(fullResource) || {};
                if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                    return;
                }
            } catch (_e) {
                // ignore, fall through to fallbackUrl
            } finally {
                setDownloadingByPk((prev) => ({ ...prev, [pkString]: false }));
            }
        }
        if (fallbackUrl) {
            window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <section className="gn-details-linked-resources-section">
            <header className="gn-details-linked-resources-header">
                <span className="gn-details-linked-resources-label">
                    {type === 'uses'
                        ? `Downloadable Resources (${resources.length} ${resources.length === 1 ? 'File' : 'Files'})`
                        : <Message msgId={`gnviewer.linkedResources.${type}`} />
                    }
                </span>
                <span className="gn-details-linked-resources-sort">
                    <span className="gn-details-linked-resources-sort-label">Sort by:</span>
                    <select
                        className="gn-details-linked-resources-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </span>
                {type !== 'uses' && <span className="gn-details-linked-resources-count">{resources.length}</span>}
            </header>
            <div className="gn-details-linked-resources-list">
                {sortedResources.map((field, key) => {
                    const pkString = String(field.pk);
                    const fullData = pkString && fullResourcesData[pkString];
                    const mergedField = fullData ? {
                        ...field,
                        // Preserve full data's format information
                        extension: fullData.extension || field.extension,
                        extras: fullData.extras || field.extras,
                        mime: fullData.mime || field.mime,
                        name: fullData.name || field.name,
                        links: fullData.links || field.links,
                        assets: fullData.assets || field.assets
                    } : field;

                    const previewUrl = getCataloguePreviewUrl(mergedField);
                    const downloadUrl = getDownloadUrl(mergedField);
                    const canDownload = !!mergedField?.pk || !!downloadUrl;
                    const isDownloading = !!(mergedField?.pk && downloadingByPk[pkString]);
                    const sizeLabel = getResourceSizeLabel(mergedField);
                    const { icon, color } = getFileIconAndColor(mergedField);
                    return (
                        <div key={field.pk || key} className="gn-details-linked-resource-card">
                            <span className="gn-details-linked-resource-main">
                                <span className={`gn-details-linked-resource-icon gn-details-linked-resource-icon-${color}`}>
                                    <FaIcon name={icon} />
                                </span>
                                <span className="gn-details-linked-resource-meta">
                                    <span className="gn-details-linked-resource-title">{mergedField.title}</span>
                                    <span className="gn-details-linked-resource-subtitle">{getResourceDescription(mergedField)}</span>
                                </span>
                            </span>
                            <span className="gn-details-linked-resource-actions">
                                {sizeLabel && (
                                    <span className="gn-details-linked-resource-size">{sizeLabel}</span>
                                )}
                                <span className="gn-details-linked-resource-buttons">
                                    <a
                                        className="gn-details-linked-resource-action ghost"
                                        href={previewUrl}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        aria-label="View resource"
                                    >
                                        <FaIcon name="eye" />
                                    </a>
                                    {canDownload ? (
                                        <button
                                            className="gn-details-linked-resource-action"
                                            type="button"
                                            onClick={() => handleDownload(mergedField, downloadUrl)}
                                            disabled={isDownloading}
                                        >
                                            <FaIcon name="download" />
                                            {isDownloading ? 'Downloading...' : 'Download'}
                                        </button>
                                    ) : (
                                        <button
                                            className="gn-details-linked-resource-action"
                                            type="button"
                                            disabled
                                            aria-disabled="true"
                                            title="Download unavailable"
                                        >
                                            <FaIcon name="download" />
                                            Download
                                        </button>
                                    )}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

const DetailsLinkedResources = ({ fields, resourceTypesInfo }) => {
    const [downloadingByPk, setDownloadingByPk] = React.useState({});
    const linkedToFields = fields?.linkedTo?.map(resource => ({ ...resource, icon: resourceTypesInfo[resource.resource_type]?.icon }));
    const linkedByFields = fields?.linkedBy?.map(resource => ({ ...resource, icon: resourceTypesInfo[resource.resource_type]?.icon }));

    const linkedResources = [
        {
            resources: linkedToFields?.filter(resource => !resource.internal) ?? [],
            type: 'linkedTo'
        },
        {
            resources: linkedByFields?.filter(resource => !resource.internal) ?? [],
            type: 'linkedBy'
        },
        {
            resources: linkedToFields.filter(resource => resource.internal) ?? [],
            type: 'uses'
        },
        {
            resources: linkedByFields.filter(resource => resource.internal) ?? [],
            type: 'usedBy'
        }
    ];

    return (
        <div className="gn-details-linked-resources">
            {
                linkedResources.map(({ resources, type }) => (
                    <DetailLinkedResource
                        key={type}
                        resources={resources}
                        type={type}
                        downloadingByPk={downloadingByPk}
                        setDownloadingByPk={setDownloadingByPk}
                    />
                ))
            }
        </div>
    );
};

DetailsLinkedResources.propTypes = {
    fields: PropTypes.object,
    resourceTypesInfo: PropTypes.object
};

DetailsLinkedResources.defaultProps = {
    fields: {},
    resourceTypesInfo: {}
};

export default DetailsLinkedResources;
