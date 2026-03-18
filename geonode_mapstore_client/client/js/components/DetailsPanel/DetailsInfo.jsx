/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon';
import Tabs from '@js/components/Tabs';
import DetailsAttributeTable from '@js/components/DetailsPanel/DetailsAttributeTable';
import DetailsLinkedResources from '@js/components/DetailsPanel/DetailsLinkedResources';
import Message from '@mapstore/framework/components/I18N/Message';
import DetailsLocations from '@js/components/DetailsPanel/DetailsLocations';
import DetailsAssets from '@js/components/DetailsPanel/DetailsAssets';
import { getUserByPk } from '@js/api/geonode/v2';

const replaceTemplateString = (properties, str) => {
    return Object.keys(properties).reduce((updatedStr, key) => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        return updatedStr.replace(regex, properties[key]);
    }, str);
};

const getDateRangeValue = (startValue, endValue, format) => {
    if (startValue && endValue) {
        return `${moment(startValue).format(format)} - ${moment(endValue).format(format)}`;
    }
    return moment(startValue ? startValue : endValue).format(format);
};
const isEmptyValue = (value) => {
    if (Array.isArray(value)) {
        return isEmpty(value);
    }
    if (typeof value === 'object') {
        return isEmpty(value) || (isEmpty(value.start) && isEmpty(value.end));
    }
    return value === 'None' || !value;
};
const isStyleLabel = (style) => style === "label";
const isFieldLabelOnly = ({ style, value }) => isEmptyValue(value) && isStyleLabel(style);

const getDisplayText = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'string' || typeof value === 'number') {
        return `${value}`;
    }
    if (Array.isArray(value)) {
        return value.map(getDisplayText).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
        return value.name
            || value.label
            || value.value
            || value.title
            || value.username
            || value.email
            || value.organization
            || '';
    }
    return '';
};

const DetailInfoFieldLabel = ({ field }) => {
    const label = field.labelId ? <Message msgId={field.labelId} /> : field.label;
    return isStyleLabel(field.style) && field.href
        ? (<a href={field.href} target={field.target}>{label}</a>)
        : label;
};

function DetailsInfoField({ field, children }) {
    const values = castArray(field.value);
    const isLinkLabel = isFieldLabelOnly(field);
    return (
        <div className={`gn-details-info-row${isLinkLabel ? ' link' : ''}`}>
            <div className={`gn-details-info-label`}><DetailInfoFieldLabel field={field} /></div>
            {!isLinkLabel && <div className="gn-details-info-value">{children(values)}</div>}
        </div>
    );
}

function DetailsHTML({ value, placeholder }) {
    const [expand, setExpand] = useState(false);
    if (placeholder) {
        return (
            <div className={`gn-details-info-html${expand ? '' : ' collapsed'}`}>
                {expand
                    ? <div className="gn-details-info-html-value" dangerouslySetInnerHTML={{ __html: value }} />
                    : <div className="gn-details-info-html-value">{placeholder}</div>}
                <Button onClick={() => setExpand(!expand)}>
                    <Message msgId={expand ? 'gnviewer.readLess' : 'gnviewer.readMore'} />
                </Button>
            </div>);
    }
    return (
        <div dangerouslySetInnerHTML={{ __html: value }} />
    );
}

function DetailsInfoFields({ fields, formatHref }) {
    return (<div className="gn-details-info-fields">
        {fields.map((field, filedIndex) => {
            if (field.type === 'link') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => {
                            if (value === null || value === undefined) {
                                return null;
                            }
                            const href = field.href || value?.href;
                            const text = getDisplayText(field.href ? value : (value?.value ?? value));
                            if (!text) {
                                return null;
                            }
                            return href
                                ? <a key={idx} href={href}>{text}</a>
                                : <span key={idx}>{text}</span>;
                        })}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'query') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => {
                            if (value === null || value === undefined) {
                                return null;
                            }
                            const queryText = getDisplayText(field.valueKey ? value?.[field.valueKey] : value);
                            if (!queryText) {
                                return null;
                            }
                            return (<a key={idx} href={formatHref({
                                query: field.queryTemplate
                                    ? Object.keys(field.queryTemplate)
                                        .reduce((acc, key) => ({
                                            ...acc,
                                            [key]: replaceTemplateString(value, field.queryTemplate[key])
                                        }), {})
                                    : field.query,
                                pathname: field.pathname
                            })}>{queryText}</a>);
                        })}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'date') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <span key={idx}>{(value?.start || value?.end) ? getDateRangeValue(value.start, value.end, field.format || 'MMMM Do YYYY') : moment(value).format(field.format || 'MMMM Do YYYY')}</span>
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'html') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <DetailsHTML key={idx} value={value} placeholder={field.placeholder} />
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'text') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <span key={idx}>{getDisplayText(value)}</span>
                        ))}
                    </DetailsInfoField>
                );
            }
            return null;
        })}
    </div>);
}

function getPocName(user) {
    if (!user) return '';
    const firstName = getDisplayText(user.first_name);
    const lastName = getDisplayText(user.last_name);
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || getDisplayText(user.username) || getDisplayText(user.name);
}

function getContactValue(contact, keys = []) {
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = key.split('.').reduce((acc, part) => acc?.[part], contact);
        const text = getDisplayText(value);
        if (text) {
            return text;
        }
    }
    return '';
}

function findValueByKeyPattern(input, keyPattern, depth = 0) {
    if (!input || depth > 5) {
        return '';
    }
    if (Array.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
            const found = findValueByKeyPattern(input[i], keyPattern, depth + 1);
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
    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        if (keyPattern.test(key)) {
            const text = getDisplayText(value);
            if (text) {
                return text;
            }
        }
    }
    for (let i = 0; i < entries.length; i++) {
        const [, value] = entries[i];
        const found = findValueByKeyPattern(value, keyPattern, depth + 1);
        if (found) {
            return found;
        }
    }
    return '';
}

function DetailsInfoGeneralSection({ resource }) {
    if (!resource) return null;
    const { uuid, license, category } = resource;
    const publicationDate = resource?.date || resource?.created || resource?.last_updated;
    const sourceName = getDisplayText(resource?.sourcetype || resource?.source || resource?.subtype);
    const licenseName = getDisplayText(license?.name_long || license?.name || license?.identifier || license);
    const categoryName = getDisplayText(category?.gn_description || category?.name || category);
    const identifier = getDisplayText(uuid);
    const identifierValue = identifier || '-';
    const publicationValue = publicationDate ? moment(publicationDate).format('MMM DD, YYYY') : '-';
    const sourceValue = sourceName || '-';
    const licenseValue = licenseName || '-';
    const categoryValue = categoryName || '-';
    return (
        <div className="gn-info-section-card gn-info-general-card">
            <div className="gn-info-general-card-head">
                <div className="gn-info-general-card-icon">
                    <FaIcon name="info-circle" />
                </div>
                <h3>General Information</h3>
            </div>
            <div className="gn-info-section-card-body gn-info-section-grid gn-info-general-grid gn-info-general-card-content">
                <div className="gn-info-section-item">
                    <p className="gn-info-section-label">Identifier (UUID)</p>
                    <p className="gn-info-section-value gn-info-section-value--mono">{identifierValue}</p>
                </div>
                <div className="gn-info-section-item">
                    <p className="gn-info-section-label">Publication</p>
                    <p className="gn-info-section-value gn-info-section-value--mono">{publicationValue}</p>
                </div>
                <div className="gn-info-section-item">
                    <p className="gn-info-section-label">Source</p>
                    <p className="gn-info-section-value gn-info-section-value--mono">{sourceValue}</p>
                </div>
                <div className="gn-info-section-item">
                    <p className="gn-info-section-label">License</p>
                    <p className="gn-info-section-value gn-info-section-value--mono">{licenseValue}</p>
                </div>
                <div className="gn-info-section-item">
                    <p className="gn-info-section-label">Category</p>
                    <p className="gn-info-section-value gn-info-section-value--mono">{categoryValue}</p>
                </div>
            </div>
        </div>
    );
}

function DetailsInfoContactSection({ resource }) {
    if (!resource?.poc) return null;
    const contact = Array.isArray(resource.poc)
        ? resource.poc.find((item) => item && typeof item === 'object') || resource.poc[0]
        : resource.poc;
    const [contactDetails, setContactDetails] = useState(null);
    const [ownerDetails, setOwnerDetails] = useState(null);
    const contactPk = contact?.pk || contact?.id;
    const ownerPk = resource?.owner?.pk || resource?.owner?.id;

    useEffect(() => {
        let mounted = true;
        if (!contactPk) {
            setContactDetails(null);
            return () => {
                mounted = false;
            };
        }
        getUserByPk(contactPk)
            .then((data) => {
                if (mounted) {
                    setContactDetails(data || null);
                }
            })
            .catch(() => {
                if (mounted) {
                    setContactDetails(null);
                }
            });
        return () => {
            mounted = false;
        };
    }, [contactPk]);

    useEffect(() => {
        let mounted = true;
        if (!ownerPk) {
            setOwnerDetails(null);
            return () => {
                mounted = false;
            };
        }
        getUserByPk(ownerPk)
            .then((data) => {
                if (mounted) {
                    setOwnerDetails(data || null);
                }
            })
            .catch(() => {
                if (mounted) {
                    setOwnerDetails(null);
                }
            });
        return () => {
            mounted = false;
        };
    }, [ownerPk]);

    if (!contact) return null;
    const name = getPocName(contact) || getDisplayText(contact);
    const email = getContactValue(contact, [
        'email',
        'profile.email',
        'details.email'
    ]);
    const organization = getContactValue(contact, [
        'organization',
        'organization.name',
        'profile.organization',
        'profile.organization.name',
        'details.organization'
    ]);
    const department = getContactValue(contact, [
        'department',
        'organization_department',
        'org_department',
        'profile.department',
        'details.department',
        'organization.department'
    ]) || getContactValue(contactDetails, [
        'department',
        'organization_department',
        'org_department',
        'profile.department',
        'details.department',
        'organization.department'
    ]) || getContactValue(ownerDetails, [
        'department',
        'organization_department',
        'org_department',
        'profile.department',
        'details.department',
        'organization.department'
    ]);
    const orcidFromContact = getContactValue(contact, [
        'orcid',
        'ORCID',
        'orcid_identifier',
        'orcid_id',
        'orcidId',
        'profile.orcid',
        'profile.orcid_identifier',
        'profile.orcid_id',
        'details.orcid',
        'extra.orcid'
    ]);
    const orcidFromOwner = getContactValue(resource?.owner, [
        'orcid',
        'ORCID',
        'orcid_identifier',
        'orcid_id',
        'orcidId',
        'profile.orcid',
        'profile.orcid_identifier',
        'profile.orcid_id',
        'details.orcid',
        'extra.orcid'
    ]);
    const orcidFromResource = getContactValue(resource, [
        'orcid',
        'ORCID',
        'orcid_identifier',
        'orcid_id',
        'orcidId',
        'metadata.orcid',
        'extra_metadata.orcid',
        'extra.orcid'
    ]);
    const orcid = orcidFromContact
        || orcidFromOwner
        || orcidFromResource
        || getContactValue(contactDetails, [
            'orcid',
            'ORCID',
            'orcid_identifier',
            'orcid_id',
            'orcidId',
            'profile.orcid',
            'profile.orcid_identifier',
            'profile.orcid_id',
            'details.orcid',
            'extra.orcid'
        ])
        || getContactValue(ownerDetails, [
            'orcid',
            'ORCID',
            'orcid_identifier',
            'orcid_id',
            'orcidId',
            'profile.orcid',
            'profile.orcid_identifier',
            'profile.orcid_id',
            'details.orcid',
            'extra.orcid'
        ])
        || findValueByKeyPattern(contact, /orcid/i)
        || findValueByKeyPattern(contactDetails, /orcid/i)
        || findValueByKeyPattern(resource?.owner, /orcid/i)
        || findValueByKeyPattern(ownerDetails, /orcid/i)
        || findValueByKeyPattern(resource, /orcid/i);
    const avatar = getDisplayText(contact?.avatar || contact?.avatar_url || contact?.profile_image);
    const displayName = name || '-';
    const displayEmail = email || '-';
    const displayOrcid = orcid || '-';
    const displayOrganization = organization || '-';
    const displayDepartment = department || '-';
    return (
        <div className="gn-info-section-card">
            <div className="gn-info-section-card-header">
                <h3>Point of Contact</h3>
            </div>
            <div className="gn-info-section-card-body">
                <div className="gn-info-poc">
                    <div className="gn-info-poc-person">
                        <div className="gn-info-poc-avatar">
                            {avatar
                                ? <img src={avatar} alt={displayName} />
                                : <FaIcon name="user" />}
                        </div>
                        <div className="gn-info-poc-details">
                            <h4>{displayName}</h4>
                            <p className="gn-info-poc-email">
                                {displayEmail !== '-' && <><FaIcon name="envelope" />{' '}</>}
                                {displayEmail}
                            </p>
                            <div className="gn-info-poc-orcid">
                                <p className="gn-info-section-label">ORCID</p>
                                <p className="gn-info-section-value">
                                    {displayOrcid !== '-'
                                        ? (
                                            <a href={`https://orcid.org/${displayOrcid.replace(/^(https?:\/\/orcid\.org\/)?/, '')}`} target="_blank" rel="noopener noreferrer">
                                                {displayOrcid}
                                            </a>
                                        )
                                        : displayOrcid}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="gn-info-poc-org">
                        <p className="gn-info-section-label">Organization</p>
                        <p className="gn-info-section-value">{displayOrganization}</p>
                        <div className="gn-info-poc-department">
                            <p className="gn-info-section-label">Department</p>
                            <p className="gn-info-section-value">{displayDepartment}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailsInfoEnhanced({ fields, formatHref, resource }) {
    return (
        <div className="gn-details-info-enhanced">
            <DetailsInfoGeneralSection resource={resource} />
            <DetailsInfoContactSection resource={resource} />
            {fields && fields.length > 0 && <DetailsInfoFields fields={fields} formatHref={formatHref} />}
        </div>
    );
}

const tabTypes = {
    'attribute-table': DetailsAttributeTable,
    'linked-resources': DetailsLinkedResources,
    'locations': DetailsLocations,
    'tab': DetailsInfoFields,
    'assets': DetailsAssets
};

const hiddenInfoFieldLabelIds = new Set([
    'gnviewer.title',
    'gnviewer.owner',
    'gnviewer.regions',
    'gnviewer.resourceType',
    'gnviewer.publication',
    'gnviewer.publicationDate',
    'gnviewer.date',
    'gnviewer.source',
    'gnviewer.sourcetype',
    'gnviewer.sourceType',
    'gnviewer.dataSource',
    'gnviewer.category',
    'gnviewer.pointOfContact',
    'gnviewer.pointofcontact',
    'gnviewer.poc'
]);

const hiddenInfoFieldLabels = new Set([
    'title',
    'owner',
    'regions',
    'region',
    'resource type',
    'publication',
    'publication date',
    'source',
    'source type',
    'sourcetype',
    'category',
    'point of contact',
    'pointofcontact',
    'poc'
]);

const isInfoTab = (tab = {}) => tab?.id === 'info' || tab?.labelId === 'gnviewer.info';

const shouldHideInfoField = (tab, item = {}) => {
    if (!isInfoTab(tab)) {
        return false;
    }
    const labelId = (item?.labelId || '').toString();
    if (hiddenInfoFieldLabelIds.has(labelId) || /source|publication/i.test(labelId)) {
        return true;
    }
    const normalizedLabel = (item?.label || '').toString().trim().toLowerCase();
    return hiddenInfoFieldLabels.has(normalizedLabel);
};

const parseTabItems = (items, tab) => {
    return (items || []).filter(({ value, style }) => {
        return !(isEmptyValue(value) && !isStyleLabel(style));
    }).filter((item) => !shouldHideInfoField(tab, item));
};
const isDefaultTabType = (type) => type === 'tab';

const getLinkedResourcesCount = (fields = {}) => {
    // Count total resources across all linked resource types
    const linkedTo = (fields?.linkedTo || []).length;
    const linkedBy = (fields?.linkedBy || []).length;
    return linkedTo + linkedBy;
};

function DetailsInfo({
    tabs = [],
    ...props
}) {
    const filteredTabs = tabs
        .filter((tab) => tab?.id !== 'assets' && tab?.type !== 'assets' && tab?.labelId !== 'gnviewer.assets')
        .filter((tab) => !tab?.disableIf)
        .map((tab) =>
        ({
            ...tab,
            items: isDefaultTabType(tab.type) ? parseTabItems(tab?.items, tab) : tab?.items,
            Component: isInfoTab(tab) ? DetailsInfoEnhanced : (tabTypes[tab.type] || tabTypes.tab)
        }))
        .filter(tab => !isEmpty(tab?.items));
    const [selectedTabId, onSelect] = useState(filteredTabs?.[0]?.id);
    return (
        <Tabs
            className="gn-details-info tabs-underline"
            selectedTabId={selectedTabId}
            onSelect={onSelect}
            tabs={filteredTabs.map(({ Component, ...tab } = {}) => ({
                title: tab?.type === 'linked-resources' ? (
                    <><DetailInfoFieldLabel field={tab} /> ({getLinkedResourcesCount(tab?.items)})</>
                ) : (
                    <DetailInfoFieldLabel field={tab} />
                ),
                eventKey: tab?.id,
                component: <Component fields={tab?.items} {...props} />
            }))}
        />
    );
}

export default DetailsInfo;
