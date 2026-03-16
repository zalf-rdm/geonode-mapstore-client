/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Glyphicon } from 'react-bootstrap';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import DetailsInfo from './DetailsInfo';
import Spinner from '@js/components/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import moment from 'moment';
import { getResourceTypesInfo, getMetadataDetailUrl, getMetadataUrl, resourceHasPermission } from '@js/utils/ResourceUtils';
import debounce from 'lodash/debounce';
import CopyToClipboardCmp from 'react-copy-to-clipboard';
import ResourceStatus from '@js/components/ResourceStatus';
import AuthorInfo from '@js/components/AuthorInfo/AuthorInfo';
import { getUserName } from '@js/utils/SearchUtils';
import { useInView } from 'react-intersection-observer';
import DetailsResourcePreview from './DetailsResourcePreview';
import DetailsThumbnail from './DetailsThumbnail';
import Unadvertised from '@js/components/Unadvertised';

const CopyToClipboard = tooltip(CopyToClipboardCmp);

const getDateValue = (value) => value ? moment(value).format('MMM DD, YYYY') : null;
const toArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
const getReadableSize = (value) => {
    if (!value) {
        return null;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = value;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }
        return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }
    return null;
};
const getTagValue = (item) => {
    if (typeof item === 'string') {
        return item;
    }
    return item?.label || item?.name || item?.identifier || item?.title || item?.value;
};

const EditTitle = ({ title, onEdit, disabled }) => {
    const [textValue, setTextValue] = React.useState(title);
    return (
        <div className="gn-details-text">
            <input
                className="gn-details-text-input"
                onChange={(evt) => {
                    setTextValue(evt.target.value);
                    onEdit(evt.target.value);
                }}
                value={onEdit ? textValue : title}
                disabled={disabled}
            />
        </div>);
};

function formatResourceLinkUrl(resource) {
    if (resource?.uuid) {
        return window.location.href.replace(/#.+$/, `uuid/${resource.uuid}`);
    }
    return window.location.href;
}

const ResourceMessage = ({ type, pathname, formatHref }) => {
    return (
        <span className="gn-details-panel-origin">
            <Message msgId="gnviewer.resourceOrigin.a" />{' '}
            <a
                href={formatHref({
                    pathname,
                    query: {
                        'f': type
                    }
                })}
            >
                {type || 'resource'}
            </a>
            {' '}<Message msgId="gnviewer.resourceOrigin.from" />{' '}
        </span>
    );
};


const DetailsPanelTools = ({
    resource,
    enableFavorite,
    favorite,
    onFavorite,
    detailUrl,
    editThumbnail,
    resourceCanPreviewed,
    canView,
    metadataDetailUrl,
    name
}) => {
    const isMounted = useRef();
    const [copiedUrl, setCopiedUrl] = useState({
        resource: false,
        datasetowsurl: false
    });

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleCopyPermalink = (type) => {
        setCopiedUrl({...copiedUrl, [type]: true});
        setTimeout(() => {
            if (isMounted.current) {
                setCopiedUrl({...copiedUrl, [type]: false});
            }
        }, 700);
    };

    const handleFavorite = (fav) => {
        onFavorite(!fav);
    };

    return (
        <div className="gn-details-panel-tools">
            <Unadvertised resource={resource}/>
            <ResourceStatus resource={resource} />
            {enableFavorite &&
            <Button
                variant="default"
                onClick={debounce(() => handleFavorite(favorite), 500)}>
                <FaIcon name={favorite ? 'star' : 'star-o'} />
            </Button>}
            <CopyToClipboard
                tooltipPosition="top"
                tooltipId={
                    copiedUrl.resource
                        ? 'gnhome.copiedResourceUrl'
                        : 'gnhome.copyResourceUrl'
                }
                text={formatResourceLinkUrl(resource)}
            >
                <Button
                    variant="default"
                    onClick={()=> handleCopyPermalink('resource')}>
                    <FaIcon name="share-alt" />
                </Button>
            </CopyToClipboard>
            {resource?.dataset_ows_url && <CopyToClipboard
                tooltipPosition="top"
                tooltipId={
                    copiedUrl.capabilities
                        ? 'gnhome.copiedDatasetOwsUrl'
                        : 'gnhome.copyDatasetOwsUrl'
                }
                text={resource.dataset_ows_url}
            >
                <Button
                    variant="default"
                    onClick={()=> handleCopyPermalink('datasetowsurl')}>
                    <FaIcon name="globe" />
                </Button>
            </CopyToClipboard>}
            {detailUrl && !editThumbnail && <Button
                variant="primary"
                href={(resourceCanPreviewed || canView) ? detailUrl : metadataDetailUrl}
                rel="noopener noreferrer">
                <Message msgId={`gnhome.view${((resourceCanPreviewed) ? name : 'Metadata')}`} />
            </Button>}
        </div>
    );
};

function DetailsPanel({
    resource,
    formatHref,
    linkHref,
    sectionStyle,
    pageLayout,
    loading,
    downloading,
    getTypesInfo,
    editTitle,
    editThumbnail,
    activeEditMode,
    closePanel,
    favorite,
    onFavorite,
    enableFavorite,
    onMapThumbnail,
    savingThumbnailMap,
    layers,
    isThumbnailChanged,
    onResourceThumbnail,
    resourceThumbnailUpdating,
    initialBbox,
    enableMapViewer,
    onClose,
    tabs,
    pathname,
    canDownload,
    onAction,
    onSetExtent
}) {
    const detailsContainerNode = useRef();
    const [titleNodeRef, titleInView] = useInView();
    if (!resource && !loading) {
        return null;
    }

    const types = getTypesInfo();
    const {
        formatDetailUrl = res => res?.detail_url,
        canPreviewed,
        hasPermission,
        icon,
        name
    } = resource && (types[resource.subtype] || types[resource.resource_type]) || {};
    const detailUrl = resource?.pk && formatDetailUrl(resource);
    const resourceCanPreviewed = resource?.pk && canPreviewed && canPreviewed(resource);
    const canView = resource?.pk && hasPermission && hasPermission(resource);
    const metadataDetailUrl = resource?.pk && getMetadataDetailUrl(resource);
    const metadataEditUrl = resource?.pk && getMetadataUrl(resource);
    const canEditMetadata = resourceHasPermission(resource, 'change_resourcebase') && metadataEditUrl;
    const previewDetailUrl = (resourceCanPreviewed || canView) ? detailUrl : metadataDetailUrl;
    const createdDate = getDateValue(resource?.date || resource?.created);
    const updatedDate = getDateValue(resource?.last_updated || resource?.date);
    const regionTags = [
        ...toArray(resource?.regions),
        ...toArray(resource?.places)
    ]
        .map(getTagValue)
        .filter(Boolean)
        .filter((tag, index, array) => array.indexOf(tag) === index)
        .slice(0, 6);
    const keywordTags = [
        ...toArray(resource?.keywords)
    ]
        .map(getTagValue)
        .filter(Boolean)
        .filter((tag, index, array) => array.indexOf(tag) === index)
        .slice(0, 8);
    const categoryTags = [
        ...toArray(resource?.category)
    ]
        .map(getTagValue)
        .filter(Boolean)
        .filter((tag, index, array) => array.indexOf(tag) === index)
        .slice(0, 4);
    const assetItems = [
        ...toArray(resource?.download_urls).map((download, index) => ({
            id: `download-${index}`,
            label: download?.label || download?.name || download?.format || download?.mime || download?.type || 'Download',
            size: getReadableSize(download?.size || download?.filesize),
            href: download?.url,
            icon: 'download'
        })),
        ...toArray(resource?.links)
            .filter(link => link?.href || link?.url)
            .map((link, index) => ({
                id: `link-${index}`,
                label: link?.extras?.content?.title || link?.title || link?.name || link?.link_type || link?.extension || 'Resource link',
                size: getReadableSize(link?.filesize || link?.size),
                href: link?.href || link?.url,
                icon: 'file-o'
            }))
    ].filter(item => item?.href && item?.label).slice(0, 3);
    const stats = [
        { icon: 'eye', label: `${resource?.popular_count ?? 0} Views` },
        { icon: 'download', label: `${resource?.download_count ?? resource?.downloads_count ?? toArray(resource?.download_urls).length ?? 0} Downloads` }
    ];
    const breadcrumbs = [
        { label: 'Home', href: formatHref({ pathname: '/' }) },
        { label: name || resource?.resource_type || 'Resource', href: formatHref({ pathname, query: { f: resource?.resource_type } }) },
        { label: resource?.title || resource?.name }
    ];
    const tools = (
        <DetailsPanelTools
            name={name}
            resource={resource}
            enableFavorite={enableFavorite}
            favorite={favorite}
            onFavorite={onFavorite}
            detailUrl={detailUrl}
            editThumbnail={editThumbnail}
            resourceCanPreviewed={resourceCanPreviewed}
            canView={canView}
            metadataDetailUrl={metadataDetailUrl}
        />
    );
    if (pageLayout) {
        return (
            <div
                ref={detailsContainerNode}
                className={`gn-details-panel${loading ? ' loading' : ''} page-layout`}
                style={{ width: sectionStyle?.width }}
            >
                <section style={sectionStyle}>
                    <div className="gn-details-panel-shell">
                        <div className="gn-details-panel-main">
                            <div className="gn-details-panel-hero">
                                <nav className="gn-details-panel-breadcrumbs">
                                    {breadcrumbs.map((item, idx) => (
                                        <React.Fragment key={`${item.label}-${idx}`}>
                                            {idx > 0 && <span className="gn-details-panel-breadcrumb-sep"><FaIcon name="angle-right" /></span>}
                                            {item.href
                                                ? <a href={item.href}>{item.label}</a>
                                                : <span className="current">{item.label}</span>}
                                        </React.Fragment>
                                    ))}
                                </nav>
                                <div className="gn-details-panel-preview-card">
                                    <DetailsResourcePreview
                                        resource={resource}
                                        getTypesInfo={getTypesInfo}
                                        loading={loading}
                                        enabled={!!(resourceCanPreviewed && !activeEditMode && !editThumbnail)}
                                    />
                                    {previewDetailUrl && !editThumbnail && (
                                        <a
                                            className="gn-details-panel-open-map"
                                            href={previewDetailUrl}
                                            rel="noopener noreferrer"
                                        >
                                            <FaIcon name="external-link" />
                                            {' '}
                                            Open in MapStore
                                        </a>
                                    )}
                                    <DetailsThumbnail
                                        enabled={!!editThumbnail}
                                        resource={resource}
                                        activeEditMode={activeEditMode}
                                        enableMapViewer={enableMapViewer && !resource.subtype?.includes("tabular")}
                                        onResourceThumbnail={onResourceThumbnail}
                                        editThumbnail={editThumbnail}
                                        resourceThumbnailUpdating={resourceThumbnailUpdating}
                                        isThumbnailChanged={isThumbnailChanged}
                                        layers={layers}
                                        onMapThumbnail={onMapThumbnail}
                                        onClose={onClose}
                                        savingThumbnailMap={savingThumbnailMap}
                                        initialBbox={initialBbox}
                                        icon={icon}
                                    />
                                </div>
                                <div className="gn-details-panel-map-actions">
                                    {canDownload && (
                                        <Button
                                            variant="primary"
                                            disabled={!!downloading}
                                            onClick={() => downloading ? null : onAction(resource)}
                                        >
                                            <FaIcon name="download" />
                                            {' '}
                                            <Message msgId="gnviewer.download" />
                                        </Button>
                                    )}
                                    {canEditMetadata && (
                                        <Button
                                            variant="default"
                                            href={metadataEditUrl}
                                            rel="noopener noreferrer"
                                        >
                                            <FaIcon name="pencil-square-o" />
                                            {' '}
                                            <Message msgId="gnviewer.editMetadata" />
                                        </Button>
                                    )}
                                    <CopyToClipboard
                                        tooltipPosition="top"
                                        tooltipId="gnviewer.shareThisResource"
                                        text={formatResourceLinkUrl(resource)}
                                    >
                                        <Button variant="default">
                                            <FaIcon name="share-alt" />
                                            {' '}
                                            <Message msgId="gnviewer.share" />
                                        </Button>
                                    </CopyToClipboard>
                                </div>
                            </div>
                            <aside className="gn-details-panel-summary">
                                <div className="gn-details-panel-summary-head">
                                    <div className="gn-details-panel-summary-pills">
                                        {name ? <span className="gn-details-panel-pill">{name}</span> : null}
                                        {resource?.srid ? <span className="gn-details-panel-pill is-muted">{resource.srid}</span> : null}
                                    </div>
                                    <div className="gn-details-panel-summary-title-block">
                                        {activeEditMode
                                            ? <EditTitle disabled={!activeEditMode} title={resource?.title} onEdit={editTitle} />
                                            : <h2 className="gn-details-panel-summary-title">{resource?.title}</h2>}
                                    </div>
                                    <div className="gn-details-panel-summary-owner">
                                        {resource?.owner?.avatar &&
                                            <img src={resource?.owner.avatar} alt={getUserName(resource?.owner)} className="gn-card-author-image" />
                                        }
                                        <div>
                                            <span className="gn-details-panel-summary-label">Owner</span>
                                            <div className="gn-details-panel-summary-value">
                                                <AuthorInfo resource={resource} formatHref={formatHref} pathname={pathname} style={{ margin: 0 }} detailsPanel />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="gn-details-panel-summary-body stitch">
                                    {resource?.abstract
                                        ? <div className="gn-details-panel-summary-section">
                                            <h3>Abstract</h3>
                                            <div className="gn-details-text gn-details-panel-description-modern">
                                                <span className="gn-details-text-body" dangerouslySetInnerHTML={{ __html: resource.abstract }} />
                                            </div>
                                        </div>
                                        : null}
                                    <div className="gn-details-panel-summary-grid stitch">
                                        {createdDate && (
                                            <div className="gn-details-panel-summary-item">
                                                <span className="gn-details-panel-summary-label">Created</span>
                                                <span className="gn-details-panel-summary-value with-icon"><FaIcon name="calendar" />{createdDate}</span>
                                            </div>
                                        )}
                                        {updatedDate && (
                                            <div className="gn-details-panel-summary-item">
                                                <span className="gn-details-panel-summary-label">Last Update</span>
                                                <span className="gn-details-panel-summary-value with-icon"><FaIcon name="refresh" />{updatedDate}</span>
                                            </div>
                                        )}
                                    </div>
                                    {assetItems.length > 0 && (
                                        <div className="gn-details-panel-summary-section">
                                            <h3>Assets &amp; Formats</h3>
                                            <div className="gn-details-panel-assets-list">
                                                {assetItems.map(asset => (
                                                    <a key={asset.id} href={asset.href} className="gn-details-panel-asset" target="_blank" rel="noopener noreferrer">
                                                        <span className="gn-details-panel-asset-main">
                                                            <FaIcon name={asset.icon} />
                                                            <span>{asset.label}</span>
                                                        </span>
                                                        {asset.size ? <span className="gn-details-panel-asset-size">{asset.size}</span> : null}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {regionTags.length > 0 && (
                                        <div className="gn-details-panel-summary-section">
                                            <h3>Region</h3>
                                            <div className="gn-details-panel-tags">
                                                {regionTags.map((tag, idx) => (
                                                    <span key={`${tag}-${idx}`} className="gn-details-panel-tag">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {keywordTags.length > 0 && (
                                        <div className="gn-details-panel-summary-section">
                                            <h3>Keywords</h3>
                                            <div className="gn-details-panel-tags">
                                                {keywordTags.map((tag, idx) => (
                                                    <span key={`${tag}-${idx}`} className="gn-details-panel-tag">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {categoryTags.length > 0 && (
                                        <div className="gn-details-panel-summary-section">
                                            <h3>Category</h3>
                                            <div className="gn-details-panel-tags">
                                                {categoryTags.map((tag, idx) => (
                                                    <span key={`${tag}-${idx}`} className="gn-details-panel-tag">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="gn-details-panel-summary-footer">
                                    {stats.map(stat => (
                                        <span key={stat.label} className="gn-details-panel-stat">
                                            <FaIcon name={stat.icon} />
                                            {stat.label}
                                        </span>
                                    ))}
                                </div>
                            </aside>
                        </div>
                        <div className="gn-details-panel-info-section">
                            <DetailsInfo tabs={tabs} formatHref={formatHref} allowEdit={activeEditMode} resourceTypesInfo={types} resource={resource} onSetExtent={onSetExtent}/>
                        </div>
                    </div>
                </section>
            </div>
        );
    }
    return (
        <div
            ref={detailsContainerNode}
            className={`gn-details-panel${loading ? ' loading' : ''}${pageLayout ? ' page-layout' : ''}`}
            style={{ width: sectionStyle?.width }}
        >
            <section style={sectionStyle}>
                {!pageLayout && (
                    <div className="gn-details-panel-header">
                        {(!titleInView && resource?.title) ? <FaIcon name={icon} /> : null}
                        <div className="gn-details-panel-header-title">
                            {(!titleInView && resource?.title) ? resource.title : null}
                        </div>
                        {(!titleInView && resource?.title) ? tools : null}
                        <Button
                            variant="default"
                            href={linkHref ? linkHref() : undefined}
                            onClick={closePanel}
                            className="square-button">
                            <Glyphicon glyph="1-close" />
                        </Button>
                    </div>
                )}
                <div className="gn-details-panel-shell">
                    <div className="gn-details-panel-main">
                        <div className="gn-details-panel-hero">
                            <div className="gn-details-panel-preview-card">
                                <DetailsResourcePreview
                                    resource={resource}
                                    getTypesInfo={getTypesInfo}
                                    loading={loading}
                                    enabled={!!(resourceCanPreviewed && !activeEditMode && !editThumbnail)}
                                />
                                <DetailsThumbnail
                                    enabled={!!editThumbnail}
                                    resource={resource}
                                    activeEditMode={activeEditMode}
                                    enableMapViewer={enableMapViewer && !resource.subtype?.includes("tabular")}
                                    onResourceThumbnail={onResourceThumbnail}
                                    editThumbnail={editThumbnail}
                                    resourceThumbnailUpdating={resourceThumbnailUpdating}
                                    isThumbnailChanged={isThumbnailChanged}
                                    layers={layers}
                                    onMapThumbnail={onMapThumbnail}
                                    onClose={onClose}
                                    savingThumbnailMap={savingThumbnailMap}
                                    initialBbox={initialBbox}
                                    icon={icon}
                                />
                            </div>
                            <div className="gn-details-panel-primary-actions">
                                {!resourceCanPreviewed && metadataDetailUrl && !editThumbnail && (
                                    <Button
                                        variant="primary"
                                        href={metadataDetailUrl}
                                        rel="noopener noreferrer"
                                    >
                                        <FaIcon name="file-text-o" />
                                        {' '}
                                        <Message msgId="gnviewer.viewMetadata" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <aside className="gn-details-panel-summary">
                            <div className="gn-details-panel-summary-head">
                                <div className="gn-details-panel-summary-pills">
                                    {name ? <span className="gn-details-panel-pill">{name}</span> : null}
                                    {resource?.srid ? <span className="gn-details-panel-pill is-muted">{resource.srid}</span> : null}
                                </div>
                                <div ref={titleNodeRef} className="gn-details-panel-title">
                                    <span className="gn-details-panel-title-icon">{!downloading ? <FaIcon name={icon} /> : <Spinner />}</span>
                                    <EditTitle disabled={!activeEditMode} title={resource?.title} onEdit={editTitle} />
                                </div>
                                <div className="gn-details-panel-summary-owner">
                                    {resource?.owner?.avatar &&
                                        <img src={resource?.owner.avatar} alt={getUserName(resource?.owner)} className="gn-card-author-image" />
                                    }
                                    <div>
                                        <span className="gn-details-panel-summary-label">Owner</span>
                                        <div className="gn-details-panel-summary-value">
                                            <AuthorInfo resource={resource} formatHref={formatHref} pathname={pathname} style={{ margin: 0 }} detailsPanel />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="gn-details-panel-summary-body">
                                <div className="gn-details-panel-tools-wrap">
                                    {tools}
                                </div>
                                <div className="gn-details-panel-meta-text">
                                    {resource?.owner && <ResourceMessage type={resource?.resource_type} pathname={pathname} formatHref={formatHref} />}
                                </div>
                                {resource?.abstract
                                    ? <div className="gn-details-text gn-details-panel-description-modern">
                                        <span className="gn-details-text-body" dangerouslySetInnerHTML={{ __html: resource.abstract }} />
                                    </div>
                                    : null}
                                <div className="gn-details-panel-summary-grid">
                                    {createdDate && (
                                        <div className="gn-details-panel-summary-item">
                                            <span className="gn-details-panel-summary-label">Created</span>
                                            <span className="gn-details-panel-summary-value">{createdDate}</span>
                                        </div>
                                    )}
                                    {updatedDate && (
                                        <div className="gn-details-panel-summary-item">
                                            <span className="gn-details-panel-summary-label">Last Update</span>
                                            <span className="gn-details-panel-summary-value">{updatedDate}</span>
                                        </div>
                                    )}
                                </div>
                                {regionTags.length > 0 && (
                                    <div className="gn-details-panel-summary-section">
                                        <h3>Region</h3>
                                        <div className="gn-details-panel-tags">
                                            {regionTags.map((tag, idx) => (
                                                <span key={`${tag}-${idx}`} className="gn-details-panel-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {keywordTags.length > 0 && (
                                    <div className="gn-details-panel-summary-section">
                                        <h3>Keywords</h3>
                                        <div className="gn-details-panel-tags">
                                            {keywordTags.map((tag, idx) => (
                                                <span key={`${tag}-${idx}`} className="gn-details-panel-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {categoryTags.length > 0 && (
                                    <div className="gn-details-panel-summary-section">
                                        <h3>Category</h3>
                                        <div className="gn-details-panel-tags">
                                            {categoryTags.map((tag, idx) => (
                                                <span key={`${tag}-${idx}`} className="gn-details-panel-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>

                    <div className="gn-details-panel-info-section">
                        <DetailsInfo tabs={tabs} formatHref={formatHref} allowEdit={activeEditMode} resourceTypesInfo={types} resource={resource} onSetExtent={onSetExtent}/>
                    </div>
                </div>
            </section>
        </div>
    );
}

DetailsPanel.defaultProps = {
    onClose: () => { },
    formatHref: () => '#',
    linkHref: () => '#',
    onResourceThumbnail: () => '#',
    onAction: () => {},
    width: 696,
    getTypesInfo: getResourceTypesInfo,
    isThumbnailChanged: false,
    pageLayout: false
};

export default DetailsPanel;
