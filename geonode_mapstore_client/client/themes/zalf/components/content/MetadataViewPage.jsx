/**
 * CUSTOM PATH: themes/zalf/components/content/MetadataViewPage.jsx
 * REASON: ZALF read-only full metadata page. This intentionally lives beside
 * the landing page instead of changing the generic MapStore metadata editor.
 * NOTE: uses React.createElement because themes/ is outside babel-loader's JSX include.
 */
/* eslint-disable no-use-before-define */

import React, { useEffect, useState } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import {
    buildMetadataSections,
    getLandingUrl,
    getResourceIconName,
    getResourceTypeLabel,
    getSchemaOptionLabel,
    isMetadataValuePresent,
    visibleObjectEntries
} from '../../utils/MetadataViewUtils';
import './metadata-view.css';

const ce = React.createElement;

function extractPkFromHash() {
    const match = window.location.hash.match(/#\/metadata-view\/([^/?]+)/);
    return match ? match[1] : null;
}

function Icon({ name, size = '1rem' }) {
    const common = {
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8',
        strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
        style: { width: size, height: size }
    };
    const paths = {
        back: [ce('path', { key: 1, d: 'M15 18l-6-6 6-6' })],
        metadata: [
            ce('path', { key: 1, d: 'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z' }),
            ce('path', { key: 2, d: 'M14 3v6h6M8 13h8M8 17h6' })
        ],
        dataset: [
            ce('ellipse', { key: 1, cx: '12', cy: '5.5', rx: '8', ry: '3' }),
            ce('path', { key: 2, d: 'M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6' })
        ],
        table: [
            ce('rect', { key: 1, x: '3', y: '5', width: '18', height: '14', rx: '2' }),
            ce('path', { key: 2, d: 'M3 10h18M3 14h18M9 5v14M15 5v14' })
        ],
        'table-collection': [
            ce('rect', { key: 1, x: '6', y: '4', width: '13', height: '10', rx: '1.8' }),
            ce('path', { key: 2, d: 'M6 8h13M10 4v10M4 9H3v10a2 2 0 002 2h12v-2' })
        ],
        map: [
            ce('path', { key: 1, d: 'M9 18l-5 2V6l5-2 6 2 5-2v14l-5 2-6-2z' }),
            ce('path', { key: 2, d: 'M9 4v14M15 6v14' })
        ],
        document: [
            ce('path', { key: 1, d: 'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z' }),
            ce('path', { key: 2, d: 'M14 3v6h6' })
        ],
        external: [ce('path', { key: 1, d: 'M14 5h5v5M10 14l9-9M19 14v5H5V5h5' })]
    };
    return ce('svg', common, ...(paths[name] || paths.metadata));
}

function isUrl(value) {
    return typeof value === 'string' && /^(https?:\/\/|mailto:)/i.test(value.trim());
}

function formatDate(value, includeTime) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, includeTime
        ? { dateStyle: 'medium', timeStyle: 'short' }
        : { dateStyle: 'medium' });
}

function parseJsonValue(value) {
    if (typeof value !== 'string' || !/^[\[{]/.test(value.trim())) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function PrimitiveValue({ value, schema }) {
    const normalized = getSchemaOptionLabel(schema, value);
    if (typeof normalized === 'boolean') return normalized ? 'Yes' : 'No';
    if (schema?.format === 'date-time') return formatDate(normalized, true);
    if (schema?.format === 'date') return formatDate(normalized, false);
    if (isUrl(normalized)) {
        return ce('a', {
            href: normalized, target: '_blank', rel: 'noopener noreferrer',
            className: 'zalf-mv-link'
        }, normalized, ce(Icon, { name: 'external', size: '0.8rem' }));
    }
    const parsedJson = parseJsonValue(normalized);
    if (parsedJson) {
        const itemCount = Array.isArray(parsedJson) ? parsedJson.length : Object.keys(parsedJson).length;
        return ce('details', { className: 'zalf-mv-structured' },
            ce('summary', null, `Structured upload metadata · ${itemCount} ${itemCount === 1 ? 'group' : 'groups'}`),
            ce('pre', null, JSON.stringify(parsedJson, null, 2))
        );
    }
    return ce('span', { className: 'zalf-mv-text' }, String(normalized));
}

function ObjectValue({ value, schema, compact = false }) {
    const entries = visibleObjectEntries(value, schema);
    if (!entries.length) return null;
    if (entries.length === 1 && ['label', 'name', 'title'].includes(entries[0].key)) {
        return ce(Value, entries[0]);
    }
    return ce('dl', { className: `zalf-mv-object${compact ? ' zalf-mv-object--compact' : ''}` },
        ...entries.flatMap((entry) => [
            ce('dt', { key: `${entry.key}-label` }, entry.label),
            ce('dd', { key: `${entry.key}-value` }, ce(Value, { ...entry, compact: true }))
        ])
    );
}

function RecordList({ value, schema, fieldKey }) {
    const itemSchema = schema?.items || {};
    const modifier = fieldKey === 'fundings'
        ? ' zalf-mv-records--funding'
        : fieldKey === 'related_identifier'
            ? ' zalf-mv-records--related'
            : '';
    return ce('div', { className: `zalf-mv-records${modifier}` },
        ...value.filter(isMetadataValuePresent).map((item, index) => ce('article', {
            className: 'zalf-mv-record', key: `${fieldKey}-${index}`
        }, typeof item === 'object'
            ? ce(ObjectValue, { value: item, schema: itemSchema, compact: true })
            : ce(PrimitiveValue, { value: item, schema: itemSchema })))
    );
}

function AttributeTable({ value, schema }) {
    const properties = schema?.items?.properties || {};
    const columns = ['attribute', 'attribute_type', 'attribute_label', 'description', 'attribute_unit', 'attribute_method']
        .filter((key) => value.some((row) => isMetadataValuePresent(row?.[key])));
    return ce('div', { className: 'zalf-mv-table-wrap' },
        ce('table', { className: 'zalf-mv-table' },
            ce('thead', null, ce('tr', null,
                ...columns.map((key) => ce('th', { key }, properties[key]?.title || key))
            )),
            ce('tbody', null,
                ...value.map((row, index) => ce('tr', { key: row.pk || index },
                    ...columns.map((key) => ce('td', { key },
                        isMetadataValuePresent(row[key])
                            ? ce(Value, { value: row[key], schema: properties[key] || {}, fieldKey: key })
                            : ce('span', { className: 'zalf-mv-empty-cell' }, '—')
                    ))
                ))
            )
        )
    );
}

function ContactsValue({ value, schema }) {
    const roleSchema = schema?.properties?.contact_roles?.items?.properties?.role || {};
    const roles = [
        value?.owner?.label && { role: 'Owner', users: [value.owner] },
        ...(value?.contact_roles || []).map((entry) => ({
            role: getSchemaOptionLabel(roleSchema, entry.role),
            users: entry.users || []
        }))
    ].filter((entry) => entry && entry.users.some((user) => isMetadataValuePresent(user?.label)));
    return ce('div', { className: 'zalf-mv-contacts' },
        ...roles.map((entry, index) => ce('div', { className: 'zalf-mv-contact-role', key: `${entry.role}-${index}` },
            ce('div', { className: 'zalf-mv-contact-role-label' }, entry.role),
            ce('ul', null, ...entry.users.filter((user) => isMetadataValuePresent(user?.label)).map((user, userIndex) =>
                ce('li', { key: user.id || userIndex }, user.label)
            ))
        ))
    );
}

function Value({ value, schema = {}, fieldKey = '', compact = false }) {
    if (!isMetadataValuePresent(value)) return null;
    if (fieldKey === 'contacts' && typeof value === 'object') {
        return ce(ContactsValue, { value, schema });
    }
    if (fieldKey === 'attribute_set' && Array.isArray(value)) {
        return ce(AttributeTable, { value, schema });
    }
    if (Array.isArray(value)) {
        if (value.some((entry) => typeof entry === 'object' && entry !== null)) {
            return ce(RecordList, { value, schema, fieldKey });
        }
        return ce('ul', { className: 'zalf-mv-values' },
            ...value.filter(isMetadataValuePresent).map((entry, index) =>
                ce('li', { key: index }, ce(PrimitiveValue, { value: entry, schema: schema?.items || {} })))
        );
    }
    if (typeof value === 'object') return ce(ObjectValue, { value, schema, compact });
    return ce(PrimitiveValue, { value, schema });
}

function MetadataField({ field }) {
    return ce('div', {
        className: `zalf-mv-field${field.wide ? ' zalf-mv-field--wide' : ''}`,
        'data-field': field.key
    },
    ce('div', { className: 'zalf-mv-field-label' }, field.label),
    field.schema?.description && ce('div', { className: 'zalf-mv-field-description' }, field.schema.description),
    ce('div', { className: 'zalf-mv-field-value' }, ce(Value, {
        value: field.value, schema: field.schema, fieldKey: field.key
    })));
}

function MetadataSection({ section }) {
    return ce('section', { id: `metadata-section-${section.id}`, className: 'zalf-mv-section' },
        ce('header', { className: 'zalf-mv-section-header' },
            ce('h2', null, section.title),
            ce('span', null, `${section.fields.length} ${section.fields.length === 1 ? 'field' : 'fields'}`)
        ),
        ce('div', { className: 'zalf-mv-fields' },
            ...section.fields.map((field) => ce(MetadataField, { key: field.key, field }))
        )
    );
}

function LoadingState() {
    return ce('main', { className: 'zalf-mv-page' },
        ce('div', { className: 'zalf-mv-state', role: 'status' },
            ce('div', { className: 'zalf-mv-spinner' }), ce('p', null, 'Loading metadata…'))
    );
}

export default function MetadataViewPage() {
    const pk = extractPkFromHash();
    const [state, setState] = useState({ loading: true, resource: null, metadata: null, schema: null, error: null });

    useEffect(() => {
        let active = true;
        setState({ loading: true, resource: null, metadata: null, schema: null, error: null });
        if (!pk) {
            setState({ loading: false, resource: null, metadata: null, schema: null, error: 'No resource identifier found.' });
            return () => { active = false; };
        }
        Promise.all([
            axios.get(`/api/v2/resources/${pk}/`),
            axios.get(`/api/v2/metadata/instance/${pk}/`),
            axios.get('/api/v2/metadata/schema/')
        ])
            .then(([resourceResponse, metadataResponse, schemaResponse]) => {
                if (!active) return;
                setState({
                    loading: false,
                    resource: resourceResponse?.data?.resource,
                    metadata: metadataResponse?.data || {},
                    schema: schemaResponse?.data || {},
                    error: null
                });
            })
            .catch(() => active && setState({
                loading: false, resource: null, metadata: null, schema: null,
                error: 'The metadata record could not be loaded.'
            }));
        return () => { active = false; };
    }, [pk]);

    if (state.loading) return ce(LoadingState);
    if (state.error || !state.resource) {
        return ce('main', { className: 'zalf-mv-page' },
            ce('div', { className: 'zalf-mv-state zalf-mv-state--error', role: 'alert' }, state.error || 'Resource not found.'));
    }

    const { resource } = state;
    const sections = buildMetadataSections(state.metadata, state.schema);
    const iconName = getResourceIconName(resource);

    return ce('main', { className: 'zalf-mv-page' },
        ce('nav', { className: 'zalf-mv-breadcrumb', 'aria-label': 'Breadcrumb' },
            ce('a', { href: getLandingUrl(resource) }, ce(Icon, { name: 'back' }), 'Resource landing page'),
            ce('span', { 'aria-hidden': 'true' }, '/'),
            ce('span', null, 'Full metadata record')
        ),
        ce('header', { className: 'zalf-mv-hero-band' },
            ce('div', { className: 'zalf-mv-hero' },
                resource.thumbnail_url
                    ? ce('div', { className: 'zalf-mv-visual' }, ce('img', { src: resource.thumbnail_url, alt: '' }))
                    : ce('div', { className: 'zalf-mv-visual zalf-mv-visual--placeholder' }, ce(Icon, { name: iconName, size: '4.5rem' })),
                ce('div', { className: 'zalf-mv-hero-content' },
                    ce('div', { className: 'zalf-mv-badges' },
                        ce('span', { className: 'zalf-mv-badge' }, getResourceTypeLabel(resource)),
                        resource.language && ce('span', { className: 'zalf-mv-badge zalf-mv-badge--soft' }, resource.language.toUpperCase()),
                        ce('span', { className: 'zalf-mv-badge zalf-mv-badge--soft' }, `${sections.length} sections`)
                    ),
                    ce('h1', null, resource.title),
                    resource.title_translated && ce('p', { className: 'zalf-mv-title-alt' }, resource.title_translated),
                    ce('p', { className: 'zalf-mv-hero-summary' }, 'Complete structured metadata for discovery, interpretation and reuse of this resource.'),
                    ce('div', { className: 'zalf-mv-hero-actions' },
                        ce('a', { className: 'zalf-mv-button zalf-mv-button--primary', href: getLandingUrl(resource) },
                            ce(Icon, { name: 'back' }), 'Back to resource'),
                        ce('a', { className: 'zalf-mv-button', href: '#metadata-sections' },
                            ce(Icon, { name: 'metadata' }), 'Browse sections')
                    )
                )
            )
        ),
        ce('div', { id: 'metadata-sections', className: 'zalf-mv-layout' },
            ce('aside', { className: 'zalf-mv-sidebar' },
                ce('div', { className: 'zalf-mv-sidebar-inner' },
                    ce('div', { className: 'zalf-mv-sidebar-title' }, 'On this page'),
                    ce('nav', { className: 'zalf-mv-section-nav', 'aria-label': 'Metadata sections' },
                        ...sections.map((section) => ce('a', {
                            key: section.id, href: `#metadata-section-${section.id}`
                        }, ce('span', null, section.title), ce('small', null, section.fields.length)))
                    )
                )
            ),
            ce('div', { className: 'zalf-mv-content' },
                sections.length
                    ? sections.map((section) => ce(MetadataSection, { key: section.id, section }))
                    : ce('div', { className: 'zalf-mv-state' }, 'No metadata values are available.')
            )
        )
    );
}
