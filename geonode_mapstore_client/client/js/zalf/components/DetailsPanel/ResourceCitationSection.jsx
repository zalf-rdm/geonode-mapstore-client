import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import CopyToClipboard from 'react-copy-to-clipboard';
import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@js/components/Spinner';
import { downloadMetaData } from '@js/actions/gndownload';

const METADATA_EXPORTS = [
    { key: 'DataCite', stateKey: 'DataCite', label: 'DataCite' },
    { key: 'Dublin Core', stateKey: 'DublinCore', label: 'Dublin Core' },
    { key: 'ISO', stateKey: 'ISO', label: 'ISO' }
];

const toArray = (value) => Array.isArray(value) ? value : value ? [value] : [];

const getPersonLabel = (person) => {
    if (!person) {
        return '';
    }
    if (typeof person === 'string') {
        return person;
    }
    return person.full_name
        || person.name
        || [person.first_name, person.last_name].filter(Boolean).join(' ')
        || person.username
        || '';
};

const getPublicationYear = (resource) => {
    const source = resource?.date || resource?.created || resource?.last_updated;
    const year = source ? new Date(source).getFullYear() : null;
    return Number.isFinite(year) ? year : 'n.d.';
};

const getSuggestedCitation = (resource, doiInfo) => {
    const contributors = [
        ...toArray(resource?.author),
        ...toArray(resource?.authors),
        ...toArray(resource?.poc)
    ]
        .map(getPersonLabel)
        .filter(Boolean);
    const uniqueContributors = contributors.filter((item, index) => contributors.indexOf(item) === index);
    const authorLabel = uniqueContributors.length > 3
        ? `${uniqueContributors.slice(0, 3).join(', ')}, et al.`
        : uniqueContributors.join(', ');
    const lead = authorLabel || getPersonLabel(resource?.owner) || 'Unknown author';
    const title = resource?.title || resource?.name || 'Untitled resource';
    const year = getPublicationYear(resource);
    const doiUrl = doiInfo?.url || '';
    return `${lead} (${year}). ${title}.${doiUrl ? ` ${doiUrl}` : ''}`;
};

function ResourceCitationSection({
    resource,
    doiInfo,
    downloads,
    onDownload
}) {
    const [copied, setCopied] = React.useState('');

    if (!resource?.pk) {
        return null;
    }

    const citationText = getSuggestedCitation(resource, doiInfo);
    const availableExports = METADATA_EXPORTS.filter(({ key }) =>
        (resource?.links || []).some((link) => link?.name === key && link?.url)
    );

    return (
        <div className="gn-details-panel-summary-section gn-details-panel-summary-section-citation">
            <div className="gn-details-panel-summary-section-head">
                <div>
                    <h3>Cite</h3>
                    <div className="gn-details-panel-summary-value gn-details-panel-citation-text">
                        {citationText}
                    </div>
                </div>
            </div>
            <div className="gn-details-panel-citation-actions">
                <CopyToClipboard
                    text={citationText}
                    onCopy={() => setCopied('citation')}
                >
                    <Button variant="default" className="gn-details-panel-citation-button">
                        <FaIcon name="copy" />
                        {copied === 'citation' ? 'Copied' : 'Copy Citation'}
                    </Button>
                </CopyToClipboard>
                {doiInfo?.url && (
                    <CopyToClipboard
                        text={doiInfo.url}
                        onCopy={() => setCopied('doi')}
                    >
                        <Button variant="default" className="gn-details-panel-citation-button">
                            <FaIcon name="link" />
                            {copied === 'doi' ? 'Copied DOI' : 'Copy DOI'}
                        </Button>
                    </CopyToClipboard>
                )}
                {availableExports.map(({ key, stateKey, label }) => (
                    <Button
                        key={key}
                        variant="default"
                        className="gn-details-panel-citation-button"
                        onClick={() => onDownload(key, resource.pk)}
                        disabled={!!downloads[stateKey]}
                    >
                        {downloads[stateKey] && (
                            <Spinner animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                        )}
                        <FaIcon name="download" />
                        {label}
                    </Button>
                ))}
            </div>
            {availableExports.length > 0 && (
                <div className="gn-details-panel-citation-note">
                    <Message msgId="gnviewer.download" /> metadata exports
                </div>
            )}
        </div>
    );
}

ResourceCitationSection.propTypes = {
    resource: PropTypes.object,
    doiInfo: PropTypes.object,
    downloads: PropTypes.object,
    onDownload: PropTypes.func
};

ResourceCitationSection.defaultProps = {
    resource: null,
    doiInfo: null,
    downloads: {},
    onDownload: () => {}
};

export default connect(
    createSelector([
        state => state?.gnDownload?.downloads || {},
        (_, props) => props?.resource?.pk
    ], (downloadState, resourcePk) => ({
        downloads: {
            DataCite: !!downloadState?.DataCite?.[resourcePk],
            DublinCore: !!downloadState?.DublinCore?.[resourcePk],
            ISO: !!downloadState?.ISO?.[resourcePk]
        }
    })),
    {
        onDownload: downloadMetaData
    }
)(ResourceCitationSection);
