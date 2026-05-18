/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import DetailsInfo from './DetailsInfo';
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
import ResourceCitationSection from '../../zalf/components/DetailsPanel/ResourceCitationSection';

const CopyToClipboard = tooltip(CopyToClipboardCmp);

const getDateValue = (value) => value ? moment(value).format('MMM DD, YYYY') : null;
const toArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
const getPreviewActionLabel = (resource) => resource?.subtype === 'tabular' ? 'View Table' : 'Open in MapStore';
const getTagValue = (item) => {
    if (typeof item === 'string') {
        return item;
    }
    return item?.label || item?.name || item?.identifier || item?.title || item?.value;
};

const DOI_REGEX = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
const DOI_URL_REGEX = /https?:\/\/(?:dx\.)?doi\.org\/([^\s]+)/i;
const DOI_KEY_REGEX = /(^|[_-])(doi|doi_url|dataseturi|dataset_uri|identifier|identifiers|citation|supplemental_information|supplementalinformation|metadata_identifier|md_identifier)([_-]|$)/i;

const normalizeDoi = (value = '') => {
    const text = `${value}`.trim();
    if (!text) {
        return '';
    }
    const fromUrl = text.match(DOI_URL_REGEX);
    if (fromUrl?.[1]) {
        return fromUrl[1].trim();
    }
    const cleaned = text.replace(/^doi\s*:\s*/i, '').trim();
    const fromText = cleaned.match(DOI_REGEX);
    return fromText ? fromText[0].trim() : '';
};

const findDoiInValue = (input, depth = 0) => {
    if (!input || depth > 6) {
        return '';
    }
    if (typeof input === 'string' || typeof input === 'number') {
        return normalizeDoi(input);
    }
    if (Array.isArray(input)) {
        for (let index = 0; index < input.length; index++) {
            const found = findDoiInValue(input[index], depth + 1);
            if (found) {
                return found;
            }
        }
        return '';
    }
    if (typeof input !== 'object') {
        return '';
    }
    const entries = Object.entries(input);

    for (let index = 0; index < entries.length; index++) {
        const [key, value] = entries[index];
        if (DOI_KEY_REGEX.test(key)) {
            const found = findDoiInValue(value, depth + 1);
            if (found) {
                return found;
            }
        }
    }

    for (let index = 0; index < entries.length; index++) {
        const [, value] = entries[index];
        const found = findDoiInValue(value, depth + 1);
        if (found) {
            return found;
        }
    }

    return '';
};

const getDoiInfo = (resource = {}) => {
    const directCandidates = [
        resource?.doi,
        resource?.doi_url,
        resource?.identifier,
        resource?.alternate,
        resource?.citation,
        resource?.source
    ];

    const directDoi = directCandidates
        .map(normalizeDoi)
        .find(Boolean);

    const links = toArray(resource?.links);
    const doiLink = links.find((link) => {
        const href = link?.href || link?.url || '';
        const title = `${link?.title || link?.name || link?.link_type || ''}`;
        return DOI_URL_REGEX.test(href) || /doi/i.test(title);
    });

    const doiFromLinkHref = normalizeDoi(doiLink?.href || doiLink?.url || '');
    const doiFromLinkTitle = normalizeDoi(doiLink?.title || doiLink?.name || '');
    const nestedDoi = findDoiInValue({
        metadata: resource?.metadata,
        extra_metadata: resource?.extra_metadata,
        extras: resource?.extras,
        identifiers: resource?.identifiers,
        identification: resource?.identification,
        supplemental_information: resource?.supplemental_information,
        attribution: resource?.attribution,
        raw: resource
    });
    const doi = directDoi || doiFromLinkHref || doiFromLinkTitle || nestedDoi;
    const url = doi ? `https://doi.org/${doi}` : '';

    return {
        doi,
        url
    };
};

const ABSTRACT_PREVIEW_LIMIT = 400;
const stripHtml = (value = '') => value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const DetailsPanelAbstract = ({ abstract = '' }) => {
    const [expanded, setExpanded] = useState(false);
    const plainText = stripHtml(abstract);
    const needsCollapse = plainText.length > ABSTRACT_PREVIEW_LIMIT;
    const collapsedText = needsCollapse
        ? `${plainText.slice(0, ABSTRACT_PREVIEW_LIMIT).trimEnd()}...`
        : plainText;

    return (
        <div className="gn-details-text gn-details-panel-description-modern">
            {expanded && needsCollapse
                ? <span className="gn-details-text-body" dangerouslySetInnerHTML={{ __html: abstract }} />
                : <span className="gn-details-text-body">{collapsedText}</span>}
            {needsCollapse && (
                <span
                    role="button"
                    tabIndex={0}
                    className="gn-details-abstract-toggle"
                    onClick={() => setExpanded(!expanded)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setExpanded(!expanded);
                        }
                    }}
                >
                    {expanded ? 'View Less' : 'View More'}
                </span>
            )}
        </div>
    );
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
        setCopiedUrl({ ...copiedUrl, [type]: true });
        setTimeout(() => {
            if (isMounted.current) {
                setCopiedUrl({ ...copiedUrl, [type]: false });
            }
        }, 700);
    };

    const handleFavorite = (fav) => {
        onFavorite(!fav);
    };

    return (
        <div className="gn-details-panel-tools">
            <Unadvertised resource={resource} />
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
                    onClick={() => handleCopyPermalink('resource')}>
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
                    onClick={() => handleCopyPermalink('datasetowsurl')}>
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
    const doiInfo = getDoiInfo(resource);
    const hasDoi = !!doiInfo?.doi;
    const doiValue = doiInfo?.doi || '-';
    const createdDateValue = createdDate || '-';
    const updatedDateValue = updatedDate || '-';
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
                                            {getPreviewActionLabel(resource)}
                                        </a>
                                    )}
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
                                    <div className="gn-details-panel-summary-section">
                                        <h3>DOI</h3>
                                        <div className="gn-details-panel-summary-value">
                                            {hasDoi
                                                ? (
                                                    <a
                                                        className="gn-details-panel-doi-link"
                                                        href={doiInfo.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {doiValue}
                                                    </a>
                                                )
                                                : doiValue}
                                        </div>
                                    </div>
                                    <div className="gn-details-panel-summary-section">
                                        <h3>Abstract</h3>
                                        {resource?.abstract
                                            ? <DetailsPanelAbstract abstract={resource.abstract} />
                                            : <div className="gn-details-text gn-details-panel-description-modern"><span className="gn-details-text-body">-</span></div>}
                                    </div>
                                    <div className="gn-details-panel-summary-grid stitch">
                                        <div className="gn-details-panel-summary-item">
                                            <span className="gn-details-panel-summary-label">Created</span>
                                            <span className="gn-details-panel-summary-value with-icon"><FaIcon name="calendar" />{createdDateValue}</span>
                                        </div>
                                        <div className="gn-details-panel-summary-item">
                                            <span className="gn-details-panel-summary-label">Last Update</span>
                                            <span className="gn-details-panel-summary-value with-icon"><FaIcon name="refresh" />{updatedDateValue}</span>
                                        </div>
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
                            <DetailsInfo tabs={tabs} formatHref={formatHref} allowEdit={activeEditMode} resourceTypesInfo={types} resource={resource} onSetExtent={onSetExtent} />
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
                            <FaIcon name="times" />
                        </Button>
                    </div>
                )}
                <div className="gn-details-panel-shell">
                    <div className="gn-details-panel-main">

                        <aside className="gn-details-panel-summary">
                            <div className="gn-details-panel-summary-head">
                                <div className="gn-details-panel-summary-pills">
                                    {name ? <span className="gn-details-panel-pill">{name}</span> : null}
                                    {resource?.srid ? <span className="gn-details-panel-pill is-muted">{resource.srid}</span> : null}
                                </div>
                                <div ref={titleNodeRef} className="gn-details-panel-title">
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
                                <div className="gn-details-panel-summary-section gn-details-panel-summary-section-doi">
                                    <div className="gn-details-panel-summary-section-head">
                                        <div>
                                            <h3>DOI</h3>
                                            <div className="gn-details-panel-summary-value">
                                                {hasDoi
                                                    ? (
                                                        <a
                                                            className="gn-details-panel-doi-link"
                                                            href={doiInfo.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {doiValue}
                                                        </a>
                                                    )
                                                    : doiValue}
                                            </div>
                                        </div>
                                        <div className="gn-details-panel-tools-wrap">
                                            {tools}
                                        </div>
                                    </div>
                                </div>
                                <div className="gn-details-panel-summary-section">
                                    <h3>Abstract</h3>
                                    {resource?.abstract
                                        ? <DetailsPanelAbstract abstract={resource.abstract} />
                                        : <div className="gn-details-text gn-details-panel-description-modern"><span className="gn-details-text-body">-</span></div>}
                                </div>
                                <ResourceCitationSection resource={resource} doiInfo={doiInfo} />
                                <div className="gn-details-panel-summary-grid">
                                    <div className="gn-details-panel-summary-item">
                                        <span className="gn-details-panel-summary-label">Created</span>
                                        <span className="gn-details-panel-summary-value with-icon"><FaIcon name="calendar" />{createdDateValue}</span>
                                    </div>
                                    <div className="gn-details-panel-summary-item">
                                        <span className="gn-details-panel-summary-label">Last Update</span>
                                        <span className="gn-details-panel-summary-value with-icon"><FaIcon name="refresh" />{updatedDateValue}</span>
                                    </div>
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
                        <DetailsInfo tabs={tabs} formatHref={formatHref} allowEdit={activeEditMode} resourceTypesInfo={types} resource={resource} onSetExtent={onSetExtent} />
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
    onAction: () => { },
    width: 696,
    getTypesInfo: getResourceTypesInfo,
    isThumbnailChanged: false,
    pageLayout: false
};

export default DetailsPanel;
