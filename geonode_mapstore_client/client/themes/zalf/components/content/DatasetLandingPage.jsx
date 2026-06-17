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
    if (rt === 'map') return '#/map/' + pk;
    if (rt === 'document') return '#/document/' + pk;
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
        if (!open) return;
        function onOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onOutside);
        return () => document.removeEventListener('mousedown', onOutside);
    }, [open]);

    function copy(text, key) {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key);
            setTimeout(() => { setCopied(null); setOpen(false); }, 1200);
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
        }, '⋮'),
        open && ce('div', { className: 'zalf-lp-dropdown' },
            ce('button', { className: 'zalf-lp-dropdown-item', onClick: () => copy(landingUrl, 'url') },
                ce('span', { className: 'zalf-lp-dropdown-icon' }, '🔗'),
                copied === 'url' ? 'Copied!' : 'Copy URL'
            ),
            ce('button', { className: 'zalf-lp-dropdown-item', onClick: () => copy(apiCmd, 'api') },
                ce('span', { className: 'zalf-lp-dropdown-icon' }, '⌨'),
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
    const initials = first.split(/\s+/).filter(Boolean).map(n => n[0] + '.').join(' ');
    if (last && first) {
        // Chicago full name: Weber, Marta  — APA/DataCite initials: Weber, M.
        return style === 'Chicago' ? `${last}, ${first}` : `${last}, ${initials}`;
    }
    return last || first || person.username || '';
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
            ce('span', { className: 'zalf-lp-btn-icon' }, copied ? '✓' : '⎘'),
            copied ? 'Copied!' : 'Copy Citation'
        )
    );
}

function Section({ title, children }) {
    return ce('section', { className: 'zalf-lp-section' },
        ce('h2', { className: 'zalf-lp-section-title' }, title),
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

function TextBlock({ text }) {
    if (!text) return null;
    return ce('p', { className: 'zalf-lp-text' }, text);
}

function PersonChip({ person }) {
    const name = person.full_name || [person.first_name, person.last_name].filter(Boolean).join(' ') || person.username || '—';
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DatasetLandingPage() {
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pk = extractPkFromHash();

    useEffect(() => {
        if (!pk) { setError('No resource identifier found in URL.'); setLoading(false); return; }
        fetchResource(pk)
            .then((res) => { setResource(res); setLoading(false); })
            .catch(() => { setError('Could not load resource information.'); setLoading(false); });
    }, [pk]);

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
        ? (r.owner.full_name || [r.owner.first_name, r.owner.last_name].filter(Boolean).join(' ') || r.owner.username || '—')
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
            ce('a', { href: backHref, className: 'zalf-lp-breadcrumb-link' }, '← Catalogue'),
            ce('span', { className: 'zalf-lp-breadcrumb-sep' }, '/'),
            ce('span', { className: 'zalf-lp-breadcrumb-current' }, r.title)
        ),

        // ── Hero ──────────────────────────────────────────────────────────────
        ce('div', { className: 'zalf-lp-hero' },
            ce('div', { className: 'zalf-lp-hero-inner' },
                r.thumbnail_url && ce('div', { className: 'zalf-lp-hero-thumb' },
                    ce('img', { src: r.thumbnail_url, alt: r.title })
                ),
                ce('div', { className: 'zalf-lp-hero-body' },
                    ce('div', { className: 'zalf-lp-hero-tags' },
                        ce(Badge, { label: typeLabel, variant: 'type' }),
                        r.edition && ce(Badge, { label: 'v' + r.edition }),
                        r.language && ce(Badge, { label: r.language.toUpperCase() }),
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
                                'Published by ',
                                ownerHref ? ce('a', { href: ownerHref }, ownerName) : ownerName
                            ),
                        pubDate && ce('span', { className: 'zalf-lp-hero-date' },
                            ce('span', { className: 'zalf-lp-hero-sep' }, '·'),
                            dateTypeLabel + ': ', pubDate
                        )
                    ),
                    ce('div', { className: 'zalf-lp-hero-actions' },
                        ce('a', { className: 'zalf-lp-btn zalf-lp-btn--primary', href: viewerHref },
                            ce('span', { className: 'zalf-lp-btn-icon' }, '▶'), viewerBtnLabel
                        ),
                        ce('a', { className: 'zalf-lp-btn zalf-lp-btn--outline', href: metadataHref },
                            'View Full Metadata'
                        )
                    )
                )
            )
        ),

        // ── Body ──────────────────────────────────────────────────────────────
        ce('div', { className: 'zalf-lp-body' },

            // ── Main column ──────────────────────────────────────────────────
            ce('div', { className: 'zalf-lp-main' },

                // Description
                ce(Section, { title: 'Description' },
                    ce(TextBlock, { text: abstract || 'No description available.' }),
                    abstractDe && ce('details', { className: 'zalf-lp-details' },
                        ce('summary', null, 'Beschreibung (Deutsch)'),
                        ce(TextBlock, { text: abstractDe })
                    )
                ),

                // Purpose
                purpose && ce(Section, { title: 'Purpose' },
                    ce(TextBlock, { text: purpose })
                ),

                // People / Contact Roles
                hasContactRoles ? ce(Section, { title: 'People' },
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
                fundings.length > 0 ? ce(Section, { title: 'Funding' },
                    ce('div', { className: 'zalf-lp-funders' },
                        ...fundings.map((f, i) => ce(FunderCard, { key: i, funder: f }))
                    )
                ) : null,

                // Temporal Coverage
                (tempStart || tempEnd) ? ce(Section, { title: 'Temporal Coverage' },
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
                dataQuality ? ce(Section, { title: 'Data Quality Statement' },
                    ce(TextBlock, { text: dataQuality })
                ) : null,

                // Data Lineage
                dataLineage ? ce(Section, { title: 'Data Lineage' },
                    ce(TextBlock, { text: dataLineage })
                ) : null,

                // Supplemental
                supplemental ? ce(Section, { title: 'Supplemental Information' },
                    ce(TextBlock, { text: supplemental })
                ) : null,

                // Related Identifiers
                relatedIdentifiers.length > 0 ? ce(Section, { title: 'Related Identifiers' },
                    ce(RelatedIdentifierList, { items: relatedIdentifiers })
                ) : null
            ),

            // ── Sidebar ──────────────────────────────────────────────────────
            ce('aside', { className: 'zalf-lp-sidebar' },

                // Resource Details card
                ce('div', { className: 'zalf-lp-card' },
                    ce('div', { className: 'zalf-lp-card-header' },
                        ce('h3', { className: 'zalf-lp-card-title' }, 'Resource Details'),
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
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Access'),
                    ce('p', { className: 'zalf-lp-access-desc' },
                        'Explore and interact with this resource in the viewer.'
                    ),
                    ce('a', { className: 'zalf-lp-btn zalf-lp-btn--primary zalf-lp-btn--full', href: viewerHref },
                        ce('span', { className: 'zalf-lp-btn-icon' }, '▶'), viewerBtnLabel
                    ),
                    downloadHref
                        ? ce('a', {
                            className: 'zalf-lp-btn zalf-lp-btn--outline zalf-lp-btn--full',
                            href: downloadHref
                        }, ce('span', { className: 'zalf-lp-btn-icon' }, '↓'), 'Download')
                        : ce('span', { className: 'zalf-lp-btn zalf-lp-btn--disabled zalf-lp-btn--full' },
                            ce('span', { className: 'zalf-lp-btn-icon' }, '↓'), 'Download (login required)'
                        ),
                    ce('a', { className: 'zalf-lp-btn zalf-lp-btn--ghost zalf-lp-btn--full', href: metadataHref },
                        'Full Metadata Record'
                    )
                ),

                // Citation card
                ce(CitationCard, { r }),

                // Keywords & Categories
                (keywords.length > 0 || categories.length > 0) ? ce('div', { className: 'zalf-lp-card' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Keywords & Categories'),
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
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Regions'),
                    ce('div', { className: 'zalf-lp-badge-cloud' },
                        ...regions.map((rg) => ce(Badge, { key: rg, label: rg }))
                    )
                ) : null
            )
        )
    );
}
