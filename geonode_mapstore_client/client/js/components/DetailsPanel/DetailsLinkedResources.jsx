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

const DetailLinkedResource = ({ resources = [], type }) => {
    if (isEmpty(resources)) {
        return null;
    }
    return (
        <section className="gn-details-linked-resources-section">
            <header className="gn-details-linked-resources-header">
                <span className="gn-details-linked-resources-label">
                    <Message msgId={`gnviewer.linkedResources.${type}`} />
                </span>
                <span className="gn-details-linked-resources-count">{resources.length}</span>
            </header>
            <div className="gn-details-linked-resources-list">
                {resources.map((field, key) => {
                    const typeLabel = (field?.resource_type || 'resource').toString().toUpperCase();
                    const previewUrl = getCataloguePreviewUrl(field);
                    const downloadUrl = getDownloadUrl(field);
                    const hasDownload = !!downloadUrl;
                    return (
                        <div key={field.pk || key} className="gn-details-linked-resource-card">
                            <span className="gn-details-linked-resource-main">
                                <span className="gn-details-linked-resource-icon">
                                    {field.icon ? <FaIcon name={field.icon} /> : <FaIcon name="file-o" />}
                                </span>
                                <span className="gn-details-linked-resource-meta">
                                    <span className="gn-details-linked-resource-title">{field.title}</span>
                                    <span className="gn-details-linked-resource-subtitle">{typeLabel} linked resource</span>
                                </span>
                            </span>
                            <span className="gn-details-linked-resource-actions">
                                <a
                                    className="gn-details-linked-resource-action ghost"
                                    href={previewUrl}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    aria-label="View resource"
                                >
                                    <FaIcon name="eye" />
                                </a>
                                {hasDownload ? (
                                    <a
                                        className="gn-details-linked-resource-action"
                                        href={downloadUrl}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        <FaIcon name="download" />
                                        Download
                                    </a>
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
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

const DetailsLinkedResources = ({ fields, resourceTypesInfo }) => {
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
                linkedResources.map(({ resources, type }) => <DetailLinkedResource key={type} resources={resources} type={type} />)
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
