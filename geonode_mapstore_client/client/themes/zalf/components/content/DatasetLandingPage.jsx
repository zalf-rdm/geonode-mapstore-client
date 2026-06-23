/**
 * CUSTOM PATH: themes/zalf/components/content/DatasetLandingPage.jsx
 * REASON: ZALF intermediate dataset landing page — shown between the catalogue
 * grid and the full dataset viewer. Layout inspired by NASA EarthData and the
 * ZALF main-ui metadata panel.
 * NOTE: uses React.createElement (no JSX) — themes/ is outside babel-loader include.
 */

import React, { useEffect, useRef, useState } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import './datasetlanding.css';

const ce = React.createElement;

function Icon({ name, className, size }) {
    const common = {
        className: className || '',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.9',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        style: {
            width: size || '1rem',
            height: size || '1rem',
            flexShrink: 0
        }
    };
    const paths = {
        back: [ce('path', { key: 'p1', d: 'M15 18l-6-6 6-6' })],
        map: [
            ce('path', { key: 'p1', d: 'M9 18l-5 2V6l5-2 6 2 5-2v14l-5 2-6-2z' }),
            ce('path', { key: 'p2', d: 'M9 4v14' }),
            ce('path', { key: 'p3', d: 'M15 6v14' })
        ],
        globe: [
            ce('circle', { key: 'p1', cx: '12', cy: '12', r: '9' }),
            ce('path', { key: 'p2', d: 'M3 12h18' }),
            ce('path', { key: 'p3', d: 'M12 3a14 14 0 010 18' }),
            ce('path', { key: 'p4', d: 'M12 3a14 14 0 000 18' })
        ],
        calendar: [
            ce('rect', { key: 'p1', x: '3', y: '5', width: '18', height: '16', rx: '2' }),
            ce('path', { key: 'p2', d: 'M16 3v4' }),
            ce('path', { key: 'p3', d: 'M8 3v4' }),
            ce('path', { key: 'p4', d: 'M3 10h18' })
        ],
        user: [
            ce('path', { key: 'p1', d: 'M20 21a8 8 0 00-16 0' }),
            ce('circle', { key: 'p2', cx: '12', cy: '8', r: '4' })
        ],
        eye: [
            ce('path', { key: 'p1', d: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z' }),
            ce('circle', { key: 'p2', cx: '12', cy: '12', r: '2.5' })
        ],
        download: [
            ce('path', { key: 'p1', d: 'M12 4v11' }),
            ce('path', { key: 'p2', d: 'M8 11l4 4 4-4' }),
            ce('path', { key: 'p3', d: 'M4 20h16' })
        ],
        external: [
            ce('path', { key: 'p1', d: 'M14 5h5v5' }),
            ce('path', { key: 'p2', d: 'M10 14L19 5' }),
            ce('path', { key: 'p3', d: 'M19 14v5H5V5h5' })
        ],
        link: [
            ce('path', { key: 'p1', d: 'M10 13a5 5 0 007.07 0l2.12-2.12a5 5 0 00-7.07-7.07L10.9 5' }),
            ce('path', { key: 'p2', d: 'M14 11a5 5 0 00-7.07 0L4.8 13.12a5 5 0 107.07 7.07L13.1 19' })
        ],
        description: [
            ce('path', { key: 'p1', d: 'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z' }),
            ce('path', { key: 'p2', d: 'M14 3v6h6' }),
            ce('path', { key: 'p3', d: 'M8 13h8' }),
            ce('path', { key: 'p4', d: 'M8 17h6' })
        ],
        purpose: [
            ce('circle', { key: 'p1', cx: '12', cy: '12', r: '8' }),
            ce('circle', { key: 'p2', cx: '12', cy: '12', r: '3' }),
            ce('path', { key: 'p3', d: 'M12 4v2' }),
            ce('path', { key: 'p4', d: 'M20 12h-2' }),
            ce('path', { key: 'p5', d: 'M12 20v-2' })
        ],
        people: [
            ce('path', { key: 'p1', d: 'M16 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2' }),
            ce('circle', { key: 'p2', cx: '9.5', cy: '8', r: '3.5' }),
            ce('path', { key: 'p3', d: 'M21 21v-2a4 4 0 00-3-3.87' }),
            ce('path', { key: 'p4', d: 'M16 4.13a4 4 0 010 7.75' })
        ],
        info: [
            ce('circle', { key: 'p1', cx: '12', cy: '12', r: '9' }),
            ce('path', { key: 'p2', d: 'M12 11v5' }),
            ce('circle', { key: 'p3', cx: '12', cy: '7.5', r: '1' })
        ],
        lock: [
            ce('rect', { key: 'p1', x: '5', y: '11', width: '14', height: '10', rx: '2' }),
            ce('path', { key: 'p2', d: 'M8 11V8a4 4 0 118 0v3' })
        ],
        quote: [
            ce('path', { key: 'p1', d: 'M9 9H6a3 3 0 00-3 3v3h6v-3H6a3 3 0 013-3V6' }),
            ce('path', { key: 'p2', d: 'M21 9h-3a3 3 0 00-3 3v3h6v-3h-3a3 3 0 013-3V6' })
        ],
        tag: [
            ce('path', { key: 'p1', d: 'M20 10l-8 8-9-9V4h5z' }),
            ce('circle', { key: 'p2', cx: '7.5', cy: '7.5', r: '1.2' })
        ],
        pin: [
            ce('path', { key: 'p1', d: 'M12 21s-6-5.2-6-11a6 6 0 1112 0c0 5.8-6 11-6 11z' }),
            ce('circle', { key: 'p2', cx: '12', cy: '10', r: '2.2' })
        ],
        copy: [
            ce('rect', { key: 'p1', x: '9', y: '9', width: '11', height: '11', rx: '2' }),
            ce('path', { key: 'p2', d: 'M6 15H5a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' })
        ],
        code: [
            ce('path', { key: 'p1', d: 'M8 8l-4 4 4 4' }),
            ce('path', { key: 'p2', d: 'M16 8l4 4-4 4' }),
            ce('path', { key: 'p3', d: 'M14 4l-4 16' })
        ],
        chevron: [ce('path', { key: 'p1', d: 'M9 6l6 6-6 6' })],
        dots: [
            ce('circle', { key: 'p1', cx: '12', cy: '5', r: '1.3', fill: 'currentColor', stroke: 'none' }),
            ce('circle', { key: 'p2', cx: '12', cy: '12', r: '1.3', fill: 'currentColor', stroke: 'none' }),
            ce('circle', { key: 'p3', cx: '12', cy: '19', r: '1.3', fill: 'currentColor', stroke: 'none' })
        ],
        layer: [
            ce('path', { key: 'p1', d: 'M12 3l9 5-9 5-9-5 9-5z' }),
            ce('path', { key: 'p2', d: 'M3 12l9 5 9-5' }),
            ce('path', { key: 'p3', d: 'M3 16l9 5 9-5' })
        ]
    };
    return ce('svg', common, ...(paths[name] || paths.info));
}

function formatUsernameFallback(username) {
    if (!username) return '';
    return String(username)
        .split(/[._\-\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || String(username);
}

function extractPkFromHash() {
    // Matches #/landing/<resource_type>/<pk>
    const match = window.location.hash.match(/#\/landing\/[^/]+\/([^/]+)/);
    return match ? match[1] : null;
}

function fetchResource(pk) {
    return axios.get('/api/v2/resources/' + pk + '/')
        .then(({ data }) => data.resource);
}

// ─── Resource-type helpers ────────────────────────────────────────────────────

function getResourceTypeLabel(r) {
    const rt = r.resource_type || 'dataset';
    const st = r.subtype || '';
    if (rt === 'dataset') {
        if (st === 'raster') return 'Raster Dataset';
        if (st === 'vector') return 'Vector Dataset';
        if (st === 'tabular' || st === 'table') return 'Table';
        if (st === 'remote') return 'Remote Service';
        return 'Dataset';
    }
    if (rt === 'map') return 'Map';
    if (rt === 'document') return 'Document';
    return rt.charAt(0).toUpperCase() + rt.slice(1);
}

function getViewerHref(pk, r) {
    const rt = r.resource_type || 'dataset';
    if (rt === 'map') return r.subtype === 'tabular-collection' ? '#/tabular-collection/' + pk : '#/map/' + pk;
    if (rt === 'document') return '#/document/' + pk;
    if (r.subtype === 'tabular') return '#/tabular/' + pk;
    return '#/dataset/' + pk;
}

function getViewerButtonLabel(r) {
    const rt = r.resource_type || 'dataset';
    if (rt === 'map') return 'Open Map';
    if (rt === 'document') return 'View Document';
    return 'Data Access';
}

function formatFileSize(bytes) {
    if (!bytes) return null;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyMenu({ pk }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        function onOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        if (open) {
            document.addEventListener('mousedown', onOutside);
        }
        return () => {
            if (open) {
                document.removeEventListener('mousedown', onOutside);
            }
        };
    }, [open]);

    function copy(text, key) {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key);
            setTimeout(() => {
                setCopied(null);
                setOpen(false);
            }, 1200);
        });
    }

    const landingUrl = window.location.origin + window.location.pathname + window.location.hash;
    const apiUrl = window.location.origin + '/api/v2/resources/' + pk + '/';
    const apiCmd = 'curl "' + apiUrl + '"';

    return ce('div', { className: 'zalf-lp-copy-menu', ref },
        ce('button', {
            className: 'zalf-lp-dots-btn',
            onClick: () => setOpen((v) => !v),
            title: 'More options',
            'aria-label': 'More options'
        }, ce(Icon, { name: 'dots', className: 'zalf-lp-inline-icon' })),
        open && ce('div', { className: 'zalf-lp-dropdown' },
            ce('button', { className: 'zalf-lp-dropdown-item', onClick: () => copy(landingUrl, 'url') },
                ce('span', { className: 'zalf-lp-dropdown-icon' }, ce(Icon, { name: 'copy', className: 'zalf-lp-inline-icon' })),
                copied === 'url' ? 'Copied!' : 'Copy URL'
            ),
            ce('button', { className: 'zalf-lp-dropdown-item', onClick: () => copy(apiCmd, 'api') },
                ce('span', { className: 'zalf-lp-dropdown-icon' }, ce(Icon, { name: 'code', className: 'zalf-lp-inline-icon' })),
                copied === 'api' ? 'Copied!' : 'Copy API command'
            )
        )
    );
}

// ─── Citation card ────────────────────────────────────────────────────────────

const CITATION_STYLES = ['Chicago', 'APA', 'DataCite'];

function formatPersonName(person, style) {
    const last  = (person.last_name  || '').trim();
    const first = (person.first_name || '').trim();
    const fallbackName = formatUsernameFallback(person.username);
    const initials = first.split(/\s+/).filter(Boolean).map(n => n[0] + '.').join(' ');
    if (last && first) {
        // Chicago full name: Weber, Marta  — APA/DataCite initials: Weber, M.
        return style === 'Chicago' ? `${last}, ${first}` : `${last}, ${initials}`;
    }
    return last || first || fallbackName || '';
}

function buildAuthorList(people, style) {
    if (!people || people.length === 0) return null;
    const names = people.map(p => formatPersonName(p, style)).filter(Boolean);
    if (names.length === 0) return null;
    if (names.length === 1) return names[0];
    if (style === 'Chicago') {
        // Chicago: Weber, Marta and Nowak, Anna
        return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    }
    // APA / DataCite: Weber, M., & Nowak, A.
    if (names.length === 2) return names[0] + ' & ' + names[1];
    return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
}

function buildCitation(r, style) {
    const people = (r.author || []).length ? r.author : (r.owner ? [r.owner] : []);
    const authorList = buildAuthorList(people, style)
        || formatPersonName(r.owner || {}, style)
        || 'ZALF';
    const year = r.date ? new Date(r.date).getFullYear() : new Date().getFullYear();
    const title = r.title || 'Untitled Resource';
    const institution = r.attribution || 'Leibniz Centre for Agricultural Landscape Research (ZALF)';
    const doi = r.doi ? 'https://doi.org/' + r.doi : null;
    const version = r.edition ? ' Version ' + r.edition + '.' : '';
    const today = new Date().toISOString().split('T')[0];
    const typeLabel = getResourceTypeLabel(r);

    if (style === 'APA') {
        const apaDoi = doi ? ' ' + doi : '';
        return authorList + ' (' + year + '). ' + title + ' [' + typeLabel + '].' + version + ' ' + institution + '.' + apaDoi;
    }
    if (style === 'DataCite') {
        const dcDoi = doi ? ' ' + doi : '';
        return authorList + ' (' + year + '): ' + title + '.' + version + ' ' + institution + '.' + dcDoi;
    }
    // Chicago (default)
    const chiDoi = doi ? ' ' + doi : '';
    return authorList + '. (' + year + '). "' + title + '" [' + typeLabel + '].' + version
        + ' ' + institution + '.' + chiDoi
        + (doi ? ' Date Accessed: ' + today : '');
}

function CitationCard({ r }) {
    const [style, setStyle] = useState('Chicago');
    const [copied, setCopied] = useState(false);
    const citation = buildCitation(r, style);

    function copy() {
        navigator.clipboard.writeText(citation).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    }

    return ce('div', { className: 'zalf-lp-card zalf-lp-card--citation' },
        ce('h3', { className: 'zalf-lp-card-title' }, 'Citation'),
        ce('p', { className: 'zalf-lp-citation-note' },
            'This resource is openly shared. Please cite it when used in publications.'
        ),
        ce('div', { className: 'zalf-lp-citation-style-row' },
            ce('span', { className: 'zalf-lp-citation-style-lbl' }, 'Style'),
            ce('div', { className: 'zalf-lp-citation-tabs' },
                ...CITATION_STYLES.map((s) =>
                    ce('button', {
                        key: s,
                        className: 'zalf-lp-citation-tab' + (style === s ? ' zalf-lp-citation-tab--active' : ''),
                        onClick: () => setStyle(s)
                    }, s)
                )
            )
        ),
        ce('div', { className: 'zalf-lp-citation-text' }, citation),
        ce('button', {
            className: 'zalf-lp-btn zalf-lp-btn--primary zalf-lp-btn--full zalf-lp-citation-copy',
            onClick: copy
        },
        ce('span', { className: 'zalf-lp-btn-icon' }, ce(Icon, { name: copied ? 'copy' : 'quote', className: 'zalf-lp-inline-icon' })),
        copied ? 'Copied!' : 'Copy Citation'
        )
    );
}

function Section({ title, icon, children }) {
    return ce('section', { className: 'zalf-lp-section' },
        ce('div', { className: 'zalf-lp-section-header' },
            ce('span', { className: 'zalf-lp-section-icon' }, ce(Icon, { name: icon || 'info', className: 'zalf-lp-inline-icon' })),
            ce('h2', { className: 'zalf-lp-section-title' }, title)
        ),
        children
    );
}

function MetaItem({ label, value, link }) {
    if (!value) return null;
    return ce('div', { className: 'zalf-lp-meta-item' },
        ce('span', { className: 'zalf-lp-meta-label' }, label),
        ce('span', { className: 'zalf-lp-meta-value' },
            link ? ce('a', { href: link, target: '_blank', rel: 'noopener noreferrer' }, value) : value
        )
    );
}

function Badge({ label, href, variant }) {
    const cls = 'zalf-lp-badge' + (variant ? ' zalf-lp-badge--' + variant : '');
    if (href) return ce('a', { className: cls, href }, label);
    return ce('span', { className: cls }, label);
}

function CardTitle({ title, icon }) {
    return ce('div', { className: 'zalf-lp-card-title-row' },
        ce('span', { className: 'zalf-lp-card-title-icon' }, ce(Icon, { name: icon || 'info', className: 'zalf-lp-inline-icon' })),
        ce('h3', { className: 'zalf-lp-card-title' }, title)
    );
}

function TextBlock({ text }) {
    if (!text) return null;
    return ce('p', { className: 'zalf-lp-text' }, text);
}

function PersonChip({ person }) {
    const name = person.full_name || [person.first_name, person.last_name].filter(Boolean).join(' ') || formatUsernameFallback(person.username) || '—';
    const href = person.username ? `/people/profile/${person.username}` : null;
    return ce('div', { className: 'zalf-lp-person' },
        ce('div', { className: 'zalf-lp-person-avatar' }, name.charAt(0).toUpperCase()),
        href
            ? ce('a', { className: 'zalf-lp-person-name', href }, name)
            : ce('span', { className: 'zalf-lp-person-name' }, name)
    );
}

function ContactRoleBlock({ label, people }) {
    if (!people || !people.length) return null;
    return ce('div', { className: 'zalf-lp-role-block' },
        ce('div', { className: 'zalf-lp-role-label' }, label),
        ce('div', { className: 'zalf-lp-role-people' },
            ...people.map((p, i) => ce(PersonChip, { key: i, person: p }))
        )
    );
}

function FunderCard({ funder }) {
    const org = funder.organization;
    const orgName = org?.organization || org?.name || '—';
    const abbr = org?.abbreviation || null;
    const ror = org?.ror || null;
    return ce('div', { className: 'zalf-lp-funder-card' },
        ce('div', { className: 'zalf-lp-funder-org' },
            abbr && ce('span', { className: 'zalf-lp-funder-abbr' }, abbr),
            ror
                ? ce('a', { href: ror, target: '_blank', rel: 'noopener noreferrer', className: 'zalf-lp-funder-name' }, orgName)
                : ce('span', { className: 'zalf-lp-funder-name' }, orgName)
        ),
        funder.award_title && ce('div', { className: 'zalf-lp-funder-award' },
            ce('span', { className: 'zalf-lp-funder-award-title' }, funder.award_title),
            funder.award_number && ce('span', { className: 'zalf-lp-funder-award-num' }, '#' + funder.award_number)
        ),
        funder.award_uri && ce('a', {
            className: 'zalf-lp-funder-link',
            href: funder.award_uri,
            target: '_blank',
            rel: 'noopener noreferrer'
        }, 'View grant →')
    );
}

function RelatedIdentifierList({ items }) {
    if (!items || !items.length) return null;
    return ce('ul', { className: 'zalf-lp-related-list' },
        ...items.map((ri, i) => {
            const id = ri.identifier || ri.related_identifier || '';
            const type = ri.related_identifier_type?.label || ri.related_identifier_type || 'ID';
            const rel = ri.relation_type?.label || ri.relation_type || '';
            const isDoi = type === 'DOI';
            const isUrl = type === 'URL' || id.startsWith('http');
            const href = isDoi ? 'https://doi.org/' + id : (isUrl ? id : null);
            return ce('li', { key: i, className: 'zalf-lp-related-item' },
                rel && ce('span', { className: 'zalf-lp-related-rel' }, rel),
                href
                    ? ce('a', { href, target: '_blank', rel: 'noopener noreferrer' }, id)
                    : ce('span', null, id),
                ce('span', { className: 'zalf-lp-related-type' }, type)
            );
        })
    );
}

// ─── Map layers & linked resources ───────────────────────────────────────────

function subtypeLabel(st) {
    if (!st) return null;
    const map = { vector: 'Vector', raster: 'Raster', tabular: 'Table', table: 'Table', remote: 'Remote' };
    return map[st] || (st.charAt(0).toUpperCase() + st.slice(1));
}

function MapStatsBar({ layers }) {
    const total = layers.length;
    const vectorCount = layers.filter(l => l.datasetDetail && l.datasetDetail.subtype === 'vector').length;
    const rasterCount = layers.filter(l => l.datasetDetail && l.datasetDetail.subtype === 'raster').length;
    const totalAttrs = layers.reduce((acc, l) => acc + ((l.datasetDetail && l.datasetDetail.attribute_set) ? l.datasetDetail.attribute_set.length : 0), 0);

    return ce('div', { className: 'zalf-lp-stats-bar' },
        ce('div', { className: 'zalf-lp-stat-item' },
            ce('span', { className: 'zalf-lp-stat-value' }, total),
            ce('span', { className: 'zalf-lp-stat-label' }, 'Layers')
        ),
        vectorCount > 0 && ce('div', { className: 'zalf-lp-stat-item' },
            ce('span', { className: 'zalf-lp-stat-value' }, vectorCount),
            ce('span', { className: 'zalf-lp-stat-label' }, 'Vector')
        ),
        rasterCount > 0 && ce('div', { className: 'zalf-lp-stat-item' },
            ce('span', { className: 'zalf-lp-stat-value' }, rasterCount),
            ce('span', { className: 'zalf-lp-stat-label' }, 'Raster')
        ),
        totalAttrs > 0 && ce('div', { className: 'zalf-lp-stat-item' },
            ce('span', { className: 'zalf-lp-stat-value' }, totalAttrs),
            ce('span', { className: 'zalf-lp-stat-label' }, 'Attributes')
        )
    );
}

function LayerCard({ layer }) {
    const ds = layer.datasetDetail || layer.dataset || {};
    const title = ds.title || layer.dataset?.title || 'Untitled Layer';
    const dspk = ds.pk || layer.dataset?.pk;
    const thumb = ds.thumbnail_url || null;
    const subtype = ds.subtype || null;
    const attrs = ds.attribute_set ? ds.attribute_set.length : null;
    const layerHref = dspk ? '/catalogue/#/landing/dataset/' + dspk : null;

    return ce('div', { className: 'zalf-lp-layer-card' },
        thumb
            ? ce('img', { className: 'zalf-lp-layer-thumb', src: thumb, alt: title })
            : ce('div', { className: 'zalf-lp-layer-thumb zalf-lp-layer-thumb--icon' },
                ce('span', { className: 'zalf-lp-layer-icon' }, ce(Icon, { name: 'layer', className: 'zalf-lp-inline-icon' }))
            ),
        ce('div', { className: 'zalf-lp-layer-info' },
            layerHref
                ? ce('a', { className: 'zalf-lp-layer-title', href: layerHref }, title)
                : ce('span', { className: 'zalf-lp-layer-title' }, title),
            ce('div', { className: 'zalf-lp-layer-meta' },
                subtype && ce(Badge, { label: subtypeLabel(subtype), variant: 'type' }),
                attrs !== null && ce('span', { className: 'zalf-lp-layer-attrs' }, attrs + ' attributes')
            )
        )
    );
}

function LinkedResourceCard({ res }) {
    const title = res.title || 'Untitled';
    const typeLabel = res.resource_type
        ? res.resource_type.charAt(0).toUpperCase() + res.resource_type.slice(1)
        : 'Resource';
    const href = res.detail_url
        ? res.detail_url.replace('/catalogue/#/', '/catalogue/#/landing/')
        : null;
    const thumb = res.thumbnail_url || null;

    return ce('div', { className: 'zalf-lp-linked-card' },
        thumb
            ? ce('img', { className: 'zalf-lp-linked-thumb', src: thumb, alt: title })
            : ce('div', { className: 'zalf-lp-linked-thumb zalf-lp-linked-thumb--icon' },
                ce('span', { className: 'zalf-lp-layer-icon' }, ce(Icon, { name: 'layer', className: 'zalf-lp-inline-icon' }))
            ),
        ce('div', { className: 'zalf-lp-linked-info' },
            href
                ? ce('a', { className: 'zalf-lp-linked-title', href }, title)
                : ce('span', { className: 'zalf-lp-linked-title' }, title),
            ce('div', { className: 'zalf-lp-layer-meta' },
                ce(Badge, { label: typeLabel, variant: 'type' })
            )
        )
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DatasetLandingPage() {
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapLayers, setMapLayers] = useState(null);
    const [linkedResources, setLinkedResources] = useState(null);
    const pk = extractPkFromHash();

    useEffect(() => {
        if (!pk) { setError('No resource identifier found in URL.'); setLoading(false); return; }
        fetchResource(pk)
            .then((res) => { setResource(res); setLoading(false); })
            .catch(() => { setError('Could not load resource information.'); setLoading(false); });
    }, [pk]);

    useEffect(() => {
        if (!resource || !pk) return;

        axios.get('/api/v2/resources/' + pk + '/linked_resources/')
            .then(({ data }) => setLinkedResources(data))
            .catch(() => setLinkedResources({ linked_to: [], linked_by: [] }));

        if (resource.resource_type === 'map') {
            axios.get('/api/v2/maps/' + pk + '/maplayers/')
                .then(({ data }) => {
                    const promises = data.map((layer) => {
                        const dsPk = layer.dataset && layer.dataset.pk;
                        if (!dsPk) return Promise.resolve(layer);
                        return axios.get('/api/v2/datasets/' + dsPk + '/')
                            .then(({ data: dsData }) => ({ ...layer, datasetDetail: dsData.dataset }))
                            .catch(() => layer);
                    });
                    return Promise.all(promises);
                })
                .then((layers) => setMapLayers(layers))
                .catch(() => setMapLayers([]));
        }
    }, [resource]);

    if (loading) {
        return ce('div', { className: 'zalf-lp-shell' },
            ce('div', { className: 'zalf-lp-state zalf-lp-state--loading' },
                ce('div', { className: 'zalf-lp-spinner' }),
                ce('p', null, 'Loading…')
            )
        );
    }

    if (error || !resource) {
        return ce('div', { className: 'zalf-lp-shell' },
            ce('div', { className: 'zalf-lp-state zalf-lp-state--error' },
                ce('p', null, error || 'Resource not found.')
            )
        );
    }

    const r = resource;

    // ── Derived values ──────────────────────────────────────────────────────
    const typeLabel = getResourceTypeLabel(r);
    const viewerHref = getViewerHref(pk, r);
    const viewerBtnLabel = getViewerButtonLabel(r);
    const metadataHref = '#/metadata/' + pk;
    const backHref = '#/';

    const canDownload = (r.perms || []).includes('download_resourcebase');
    const downloadUrls = r.download_urls || [];
    const defaultDownload = downloadUrls.find((d) => d.default) || downloadUrls[0] || null;
    const downloadHref = canDownload && defaultDownload ? defaultDownload.url : null;

    const keywords = (r.keywords || []).map((k) => k.name || k).filter(Boolean);
    const categories = r.category
        ? [r.category.gn_description || r.category.identifier].filter(Boolean)
        : [];
    const regions = (r.regions || []).map((rg) => rg.name).filter(Boolean);
    const ownerName = r.owner
        ? (r.owner.full_name || [r.owner.first_name, r.owner.last_name].filter(Boolean).join(' ') || formatUsernameFallback(r.owner.username) || '—')
        : '—';
    const ownerHref = r.owner?.username ? '/people/profile/' + r.owner.username : null;
    const license = r.license?.name_long || r.license?.name || r.license?.identifier || null;
    const licenseUrl = r.license?.url || null;
    const doiUrl = r.doi ? 'https://doi.org/' + r.doi : null;
    const pubDate = r.date
        ? new Date(r.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;
    const tempStart = r.temporal_extent_start
        ? new Date(r.temporal_extent_start).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })
        : null;
    const tempEnd = r.temporal_extent_end
        ? new Date(r.temporal_extent_end).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })
        : null;
    const dateTypeLabel = r.date_type
        ? r.date_type.charAt(0).toUpperCase() + r.date_type.slice(1)
        : 'Date';
    const fileSizeLabel = formatFileSize(r.file_size);

    const isDataset = !r.resource_type || r.resource_type === 'dataset';

    // abstract_translated is the API field name for the German translation
    const abstractDe = r.abstract_translated || null;
    const titleTranslated = r.title_translated || null;

    // Normalise: raw_* fields strip placeholder text GeoNode inserts
    const abstract = (r.raw_abstract && r.raw_abstract !== 'No abstract provided') ? r.raw_abstract : null;
    const supplemental = (r.raw_supplemental_information && r.raw_supplemental_information !== 'No information provided') ? r.raw_supplemental_information : null;
    const purpose = (r.raw_purpose && r.raw_purpose !== 'None') ? r.raw_purpose : r.purpose || null;
    const dataQuality = (r.raw_data_quality_statement && r.raw_data_quality_statement !== 'None') ? r.raw_data_quality_statement : r.data_quality_statement || null;
    const dataLineage = r.data_lineage || null;

    const hasContactRoles = (r.author || []).length || (r.poc || []).length || (r.publisher || []).length
        || (r.originator || []).length || (r.principal_investigator || []).length
        || (r.data_curator || []).length;

    const fundings = r.fundings || [];
    const relatedIdentifiers = r.related_identifier || [];

    return ce('div', { className: 'zalf-lp-shell' },

        // ── Breadcrumb ────────────────────────────────────────────────────────
        ce('nav', { className: 'zalf-lp-breadcrumb' },
            ce('a', { href: backHref, className: 'zalf-lp-breadcrumb-link' },
                ce(Icon, { name: 'back', className: 'zalf-lp-breadcrumb-icon' }),
                'Catalogue'
            ),
            ce('span', { className: 'zalf-lp-breadcrumb-sep' }, '/'),
            ce('span', { className: 'zalf-lp-breadcrumb-current' }, r.title)
        ),

        // ── Hero ──────────────────────────────────────────────────────────────
        ce('div', { className: 'zalf-lp-hero-band' },
            ce('div', { className: 'zalf-lp-hero-inner' },
                ce('div', { className: 'zalf-lp-hero-card' },
                    r.thumbnail_url
                        ? ce('div', { className: 'zalf-lp-hero-thumb' },
                            ce('img', { src: r.thumbnail_url, alt: r.title })
                        )
                        : ce('div', { className: 'zalf-lp-hero-thumb zalf-lp-hero-thumb--placeholder' },
                            ce(Icon, { name: r.resource_type === 'map' ? 'map' : 'layer', className: 'zalf-lp-hero-thumb-icon', size: '5rem' })
                        ),
                    ce('div', { className: 'zalf-lp-hero-body' },
                        ce('div', { className: 'zalf-lp-hero-tags' },
                            ce(Badge, { label: typeLabel, variant: 'type' }),
                            r.edition && ce(Badge, { label: 'v' + r.edition }),
                            r.language && ce(Badge, {
                                label: r.language.toUpperCase(),
                                variant: 'soft'
                            }),
                            r.extension && ce(Badge, { label: r.extension.toUpperCase() })
                        ),
                        ce('h1', { className: 'zalf-lp-title' }, r.title),
                        titleTranslated && ce('p', { className: 'zalf-lp-title-alt' }, titleTranslated),
                        r.doi && ce('div', { className: 'zalf-lp-doi-row' },
                            ce('span', { className: 'zalf-lp-doi-label' }, 'DOI'),
                            ce('a', { className: 'zalf-lp-doi-value', href: doiUrl, target: '_blank', rel: 'noopener noreferrer' }, r.doi)
                        ),
                        ce('div', { className: 'zalf-lp-hero-meta' },
                            r.attribution
                                ? ce('span', null, r.attribution)
                                : ownerName && ce('span', null,
                                    ce(Icon, { name: 'user', className: 'zalf-lp-meta-inline-icon' }),
                                    'Published by ',
                                    ownerHref ? ce('a', { href: ownerHref }, ownerName) : ownerName
                                ),
                            pubDate && ce('span', { className: 'zalf-lp-hero-date' },
                                ce(Icon, { name: 'calendar', className: 'zalf-lp-meta-inline-icon' }),
                                dateTypeLabel + ': ', pubDate
                            )
                        ),
                        ce('div', { className: 'zalf-lp-hero-stats' },
                            ce('span', { className: 'zalf-lp-hero-stat', title: 'Page views' },
                                ce('span', { className: 'zalf-lp-hero-stat-icon' }, ce(Icon, { name: 'eye', className: 'zalf-lp-inline-icon' })),
                                ce('span', { className: 'zalf-lp-hero-stat-value' }, r.popular_count !== null && r.popular_count !== undefined ? r.popular_count : '—')
                            ),
                            ce('span', { className: 'zalf-lp-hero-stat', title: 'Shares' },
                                ce('span', { className: 'zalf-lp-hero-stat-icon' }, ce(Icon, { name: 'download', className: 'zalf-lp-inline-icon' })),
                                ce('span', { className: 'zalf-lp-hero-stat-value' }, r.share_count !== null && r.share_count !== undefined ? r.share_count : '—')
                            )
                        ),
                        ce('div', { className: 'zalf-lp-hero-actions' },
                            ce('a', { className: 'zalf-lp-btn zalf-lp-btn--primary', href: viewerHref },
                                ce('span', { className: 'zalf-lp-btn-icon' }, ce(Icon, { name: 'map', className: 'zalf-lp-inline-icon' })), viewerBtnLabel
                            ),
                            ce('a', { className: 'zalf-lp-btn zalf-lp-btn--outline', href: metadataHref },
                                ce('span', { className: 'zalf-lp-btn-icon' }, ce(Icon, { name: 'external', className: 'zalf-lp-inline-icon' })),
                                'View Full Metadata'
                            )
                        )
                    ))
            )
        ),

        // ── Body ──────────────────────────────────────────────────────────────
        ce('div', { className: 'zalf-lp-body' },

            // ── Main column ──────────────────────────────────────────────────
            ce('div', { className: 'zalf-lp-main' },

                // Description
                ce(Section, { title: 'Description', icon: 'description' },
                    ce(TextBlock, { text: abstract || 'No description available.' }),
                    abstractDe && ce('details', { className: 'zalf-lp-details' },
                        ce('summary', null,
                            ce(Icon, { name: 'globe', className: 'zalf-lp-meta-inline-icon' }),
                            'Beschreibung (Deutsch)',
                            ce(Icon, { name: 'chevron', className: 'zalf-lp-summary-chevron' })
                        ),
                        ce(TextBlock, { text: abstractDe })
                    )
                ),

                // Purpose
                purpose && ce(Section, { title: 'Purpose', icon: 'purpose' },
                    ce(TextBlock, { text: purpose })
                ),

                // People / Contact Roles
                hasContactRoles ? ce(Section, { title: 'People', icon: 'people' },
                    ce('div', { className: 'zalf-lp-roles' },
                        ce(ContactRoleBlock, { label: 'Authors', people: r.author }),
                        ce(ContactRoleBlock, { label: 'Point of Contact', people: r.poc }),
                        ce(ContactRoleBlock, { label: 'Publisher', people: r.publisher }),
                        ce(ContactRoleBlock, { label: 'Originator', people: r.originator }),
                        ce(ContactRoleBlock, { label: 'Principal Investigator', people: r.principal_investigator }),
                        ce(ContactRoleBlock, { label: 'Data Curator', people: r.data_curator })
                    )
                ) : null,

                // Funders
                fundings.length > 0 ? ce(Section, { title: 'Funding', icon: 'info' },
                    ce('div', { className: 'zalf-lp-funders' },
                        ...fundings.map((f, i) => ce(FunderCard, { key: i, funder: f }))
                    )
                ) : null,

                // Temporal Coverage
                (tempStart || tempEnd) ? ce(Section, { title: 'Temporal Coverage', icon: 'calendar' },
                    ce('div', { className: 'zalf-lp-temporal-bar' },
                        ce('div', { className: 'zalf-lp-temporal-start' },
                            ce('span', { className: 'zalf-lp-temporal-lbl' }, 'Start'),
                            ce('strong', null, tempStart || '—')
                        ),
                        ce('div', { className: 'zalf-lp-temporal-arrow' }, '→'),
                        ce('div', { className: 'zalf-lp-temporal-end' },
                            ce('span', { className: 'zalf-lp-temporal-lbl' }, 'End'),
                            ce('strong', null, tempEnd || 'Ongoing')
                        )
                    )
                ) : null,

                // Data Quality
                dataQuality ? ce(Section, { title: 'Data Quality Statement', icon: 'info' },
                    ce(TextBlock, { text: dataQuality })
                ) : null,

                // Data Lineage
                dataLineage ? ce(Section, { title: 'Data Lineage', icon: 'layer' },
                    ce(TextBlock, { text: dataLineage })
                ) : null,

                // Supplemental
                supplemental ? ce(Section, { title: 'Supplemental Information', icon: 'description' },
                    ce(TextBlock, { text: supplemental })
                ) : null,

                // Related Identifiers
                relatedIdentifiers.length > 0 ? ce(Section, { title: 'Related Identifiers', icon: 'external' },
                    ce(RelatedIdentifierList, { items: relatedIdentifiers })
                ) : null,

                // Map Layers (only for maps)
                r.resource_type === 'map' && mapLayers && mapLayers.length > 0
                    ? ce(Section, { title: 'Layers in this Map', icon: 'map' },
                        ce(MapStatsBar, { layers: mapLayers }),
                        ce('div', { className: 'zalf-lp-layers-grid' },
                            ...mapLayers.map((layer, i) => ce(LayerCard, { key: i, layer }))
                        )
                    ) : null,

                // Linked Resources
                (linkedResources && linkedResources.linked_to && linkedResources.linked_to.length > 0)
                    ? ce(Section, { title: 'Linked Resources', icon: 'tag' },
                        ce('div', { className: 'zalf-lp-linked-grid' },
                            ...linkedResources.linked_to.map((res, i) => ce(LinkedResourceCard, { key: i, res }))
                        )
                    ) : null,

                (linkedResources && linkedResources.linked_by && linkedResources.linked_by.length > 0)
                    ? ce(Section, { title: 'Used by', icon: 'link' },
                        ce('div', { className: 'zalf-lp-linked-grid' },
                            ...linkedResources.linked_by.map((res, i) => ce(LinkedResourceCard, { key: i, res }))
                        )
                    ) : null
            ),

            // ── Sidebar ──────────────────────────────────────────────────────
            ce('aside', { className: 'zalf-lp-sidebar' },

                // Resource Details card
                ce('div', { className: 'zalf-lp-card' },
                    ce('div', { className: 'zalf-lp-card-header' },
                        ce(CardTitle, { title: 'Resource Details', icon: 'info' }),
                        ce(CopyMenu, { pk })
                    ),
                    ce('div', { className: 'zalf-lp-meta-list' },
                        ce(MetaItem, { label: 'Type', value: typeLabel }),
                        ce(MetaItem, { label: 'Owner', value: ownerName, link: ownerHref }),
                        ce(MetaItem, { label: 'Attribution', value: r.attribution }),
                        ce(MetaItem, { label: dateTypeLabel, value: pubDate }),
                        ce(MetaItem, { label: 'Version', value: r.edition }),
                        ce(MetaItem, { label: 'Language', value: r.language }),
                        isDataset && ce(MetaItem, { label: 'Spatial Type', value: r.spatial_representation_type }),
                        isDataset && ce(MetaItem, { label: 'SRID', value: r.srid }),
                        isDataset && ce(MetaItem, { label: 'Update Freq.', value: r.maintenance_frequency }),
                        r.subtype === 'remote' && r.ows_url && ce(MetaItem, { label: 'Service URL', value: r.ows_url, link: r.ows_url }),
                        r.resource_type === 'document' && r.extension && ce(MetaItem, { label: 'Format', value: r.extension.toUpperCase() }),
                        r.resource_type === 'document' && fileSizeLabel && ce(MetaItem, { label: 'File Size', value: fileSizeLabel }),
                        license && ce(MetaItem, { label: 'License', value: license, link: licenseUrl })
                    )
                ),

                // Access card
                ce('div', { className: 'zalf-lp-card zalf-lp-card--access' },
                    ce(CardTitle, { title: 'Access', icon: 'lock' }),
                    ce('p', { className: 'zalf-lp-access-desc' },
                        'Explore and interact with this resource in the viewer.'
                    ),
                    ce('a', { className: 'zalf-lp-btn zalf-lp-btn--primary zalf-lp-btn--full', href: viewerHref },
                        ce('span', { className: 'zalf-lp-btn-icon' }, ce(Icon, { name: 'map', className: 'zalf-lp-inline-icon' })), viewerBtnLabel
                    ),
                    downloadHref
                        ? ce('a', {
                            className: 'zalf-lp-btn zalf-lp-btn--outline zalf-lp-btn--full',
                            href: downloadHref
                        }, ce('span', { className: 'zalf-lp-btn-icon' }, ce(Icon, { name: 'download', className: 'zalf-lp-inline-icon' })), 'Download')
                        : ce('span', { className: 'zalf-lp-btn zalf-lp-btn--disabled zalf-lp-btn--full' },
                            ce('span', { className: 'zalf-lp-btn-icon' }, ce(Icon, { name: 'download', className: 'zalf-lp-inline-icon' })), 'Download (login required)'
                        ),
                    ce('a', { className: 'zalf-lp-btn zalf-lp-btn--ghost zalf-lp-btn--full', href: metadataHref },
                        ce('span', { className: 'zalf-lp-btn-icon' }, ce(Icon, { name: 'description', className: 'zalf-lp-inline-icon' })),
                        'Full Metadata Record'
                    )
                ),

                // Citation card
                ce(CitationCard, { r }),

                // Keywords & Categories
                (keywords.length > 0 || categories.length > 0) ? ce('div', { className: 'zalf-lp-card' },
                    ce(CardTitle, { title: 'Keywords & Categories', icon: 'tag' }),
                    ce('div', { className: 'zalf-lp-badge-cloud' },
                        ...categories.map((c) => ce(Badge, { key: 'cat-' + c, label: c, variant: 'category' })),
                        ...keywords.map((kw) => ce(Badge, {
                            key: 'kw-' + kw, label: kw,
                            href: '/catalogue/#/?q=' + encodeURIComponent(kw)
                        }))
                    )
                ) : null,

                // Regions
                regions.length > 0 ? ce('div', { className: 'zalf-lp-card' },
                    ce(CardTitle, { title: 'Regions', icon: 'pin' }),
                    ce('div', { className: 'zalf-lp-badge-cloud' },
                        ...regions.map((rg) => ce(Badge, { key: rg, label: rg }))
                    )
                ) : null
            )
        )
    );
}
