import React, { useMemo, useState } from 'react';
import FaIcon from '@js/components/FaIcon';

const SORT_OPTIONS = {
    sizeDesc: 'sizeDesc',
    name: 'name',
    type: 'type'
};

const readSize = (asset = {}, field = {}) => {
    const value = asset?.size || asset?.file_size || field?.size || field?.filesize;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatSize = (bytes) => {
    if (!bytes) {
        return '';
    }
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < sizes.length - 1) {
        value /= 1024;
        unit++;
    }
    const precision = value >= 100 || unit === 0 ? 0 : 1;
    return `${value.toFixed(precision)} ${sizes[unit]}`;
};

const normalizeAsset = (field = {}) => {
    const asset = field?.extras?.content || {};
    const title = asset?.title || field?.name || 'Asset';
    const extension = (field?.extension || asset?.type || '').toUpperCase();
    const sizeValue = readSize(asset, field);
    const viewUrl = field?.url || asset?.url || asset?.download_url;
    const downloadUrl = asset?.download_url || field?.url;
    return {
        title,
        extension,
        sizeValue,
        sizeLabel: formatSize(sizeValue),
        viewUrl: viewUrl || downloadUrl,
        downloadUrl,
        icon: extension === 'CSV' ? 'table' : extension === 'PDF' ? 'file-pdf-o' : 'file'
    };
};

const endpointDownloadUrl = (serviceType, endpoint = '') => {
    if (!endpoint) {
        return '';
    }
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}service=${serviceType}&request=GetCapabilities`;
};

function DetailsAssets({ fields, resource }) {
    const [sortBy, setSortBy] = useState(SORT_OPTIONS.sizeDesc);
    const assets = useMemo(() => (fields || []).map(normalizeAsset), [fields]);
    const sortedAssets = useMemo(() => {
        const list = [...assets];
        if (sortBy === SORT_OPTIONS.name) {
            return list.sort((a, b) => a.title.localeCompare(b.title));
        }
        if (sortBy === SORT_OPTIONS.type) {
            return list.sort((a, b) => a.extension.localeCompare(b.extension));
        }
        return list.sort((a, b) => b.sizeValue - a.sizeValue);
    }, [assets, sortBy]);

    const serviceEndpoints = useMemo(() => {
        const links = resource?.links || [];
        const wms = links.find(({ link_type: linkType }) => linkType === 'OGC:WMS');
        const wfs = links.find(({ link_type: linkType }) => linkType === 'OGC:WFS');
        return [
            wms ? { type: 'WMS', url: wms.url } : null,
            wfs ? { type: 'WFS', url: wfs.url } : null
        ].filter(Boolean);
    }, [resource]);

    return (
        <div className="gn-details-assets">
            <div className="gn-details-assets-toolbar">
                <h3 className="gn-details-assets-title">
                    Downloadable Resources ({sortedAssets.length} files)
                </h3>
                <div className="gn-details-assets-sort">
                    <span>Sort by:</span>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value={SORT_OPTIONS.sizeDesc}>Size (Descending)</option>
                        <option value={SORT_OPTIONS.name}>Name</option>
                        <option value={SORT_OPTIONS.type}>Type</option>
                    </select>
                </div>
            </div>

            <div className="gn-details-assets-list">
                {sortedAssets.map((asset, idx) => (
                    <div key={`${asset.title}-${idx}`} className="gn-details-asset-card">
                        <div className="gn-details-asset-main">
                            <span className="gn-details-asset-icon">
                                <FaIcon name={asset.icon} />
                            </span>
                            <div className="gn-details-asset-meta">
                                <h4>{asset.title}</h4>
                                <p>{asset.extension || 'FILE'}</p>
                            </div>
                        </div>
                        <div className="gn-details-asset-actions">
                            {asset.sizeLabel && <span className="gn-details-asset-size">{asset.sizeLabel}</span>}
                            {asset.viewUrl && (
                                <a className="gn-details-asset-action ghost" href={asset.viewUrl} rel="noopener noreferrer" target="_blank">
                                    <FaIcon name="eye" />
                                    View
                                </a>
                            )}
                            {asset.downloadUrl && (
                                <a className="gn-details-asset-action" download href={asset.downloadUrl}>
                                    <FaIcon name="download" />
                                    Download
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {serviceEndpoints.length > 0 && (
                <div className="gn-details-assets-endpoints">
                    <div className="gn-details-assets-endpoints-header">
                        <FaIcon name="plug" />
                        <h3>WMS / WFS Endpoint</h3>
                    </div>
                    {serviceEndpoints.map(({ type, url }) => (
                        <div key={type} className="gn-details-assets-endpoint-card">
                            <div className="gn-details-assets-endpoint-main">
                                <strong>{type}</strong>
                                <span>{url}</span>
                            </div>
                            <div className="gn-details-assets-endpoint-actions">
                                <a href={url} rel="noopener noreferrer" target="_blank">View</a>
                                <a href={endpointDownloadUrl(type, url)} rel="noopener noreferrer" target="_blank">Download</a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DetailsAssets;
