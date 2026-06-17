/**
 * CUSTOM PATH: themes/zalf/components/content/DatasetLandingPage.jsx
 * REASON: ZALF intermediate dataset landing page — shown between the catalogue
 * grid and the full dataset viewer. Layout inspired by NASA EarthData and the
 * ZALF main-ui metadata panel.
 * NOTE: uses React.createElement (no JSX) — themes/ is outside babel-loader include.
 */

import React, { useEffect, useState } from 'react';
import { getResourceByPk } from '@js/api/geonode/v2';
import './datasetlanding.css';

const ce = React.createElement;

function extractPkFromHash() {
    const match = window.location.hash.match(/#\/landing\/dataset\/([^/]+)/);
    return match ? match[1] : null;
}

// ─── Demo filler — merged over real API data so every section renders ─────────
// Remove or empty this object once real datasets have all fields populated.
const DEMO_FILL = {
    doi: '10.20387/bonares-zalf-soil-cx4r-2024',
    edition: '2.1',
    language: 'eng',
    attribution: 'Leibniz Centre for Agricultural Landscape Research (ZALF), Müncheberg, Germany',
    purpose: 'This dataset was collected to assess long-term changes in soil organic carbon (SOC) content and bulk density across agricultural landscapes in Brandenburg, Germany. Results support regional soil-carbon modelling and climate-smart land management decisions.',
    data_quality_statement: 'Quality assured according to ISO 19157. All gravimetric measurements cross-validated with VNIR spectroscopy. Outliers removed using a 3σ threshold. Spatial accuracy ±2 m (GNSS RTK).',
    data_lineage: 'Soil cores (0–30 cm) collected at 120 geo-referenced sites during spring campaigns 2019–2023. Organic carbon determined via dry combustion (DIN ISO 10694). Coordinates recorded with Trimble R10 GNSS receiver. Data processed in R 4.3 and archived in BIS-OK.',
    temporal_extent_start: '2019-03-15',
    temporal_extent_end: '2023-11-30',
    supplemental_information: 'Accompanying data descriptor: Silva et al. (2024) "Long-term SOC dynamics in Brandenburg agroecosystems", Scientific Data. See also DFG project 423521038.',
    spatial_representation_type: 'vector',
    maintenance_frequency: 'annually',
    srid: 'EPSG:25833',
    related_identifier: [
        { identifier: '10.20387/bonares-abc-000', relation_type: { label: 'IsDocumentedBy' }, related_identifier_type: { label: 'DOI' } },
        { identifier: '10.1038/s41597-024-03001-0', relation_type: { label: 'IsSupplementTo' }, related_identifier_type: { label: 'DOI' } },
        { identifier: '10.20387/bonares-zalf-water-2022', relation_type: { label: 'References' }, related_identifier_type: { label: 'DOI' } }
    ]
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function RelatedIdentifierList({ items }) {
    if (!items || !items.length) return null;
    return ce('ul', { className: 'zalf-lp-related-list' },
        ...items.map((ri, i) => {
            const id = ri.identifier || '';
            const type = ri.related_identifier_type?.label || 'ID';
            const rel = ri.relation_type?.label || '';
            const href = type === 'DOI' ? `https://doi.org/${id}` : null;
            return ce('li', { key: i, className: 'zalf-lp-related-item' },
                ce('span', { className: 'zalf-lp-related-rel' }, rel),
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
        if (!pk) { setError('No dataset identifier found in URL.'); setLoading(false); return; }
        getResourceByPk(pk)
            .then((res) => { setResource(res); setLoading(false); })
            .catch(() => { setError('Could not load dataset information.'); setLoading(false); });
    }, [pk]);

    if (loading) {
        return ce('div', { className: 'zalf-lp-shell' },
            ce('div', { className: 'zalf-lp-state zalf-lp-state--loading' },
                ce('div', { className: 'zalf-lp-spinner' }),
                ce('p', null, 'Loading dataset…')
            )
        );
    }

    if (error || !resource) {
        return ce('div', { className: 'zalf-lp-shell' },
            ce('div', { className: 'zalf-lp-state zalf-lp-state--error' },
                ce('p', null, error || 'Dataset not found.')
            )
        );
    }

    // Merge demo data for fields not yet populated in the real resource
    const r = Object.assign({}, DEMO_FILL, Object.fromEntries(
        Object.entries(resource).filter(([, v]) => v !== null && v !== undefined && v !== '')
    ));

    const viewerHref = `#/dataset/${pk}`;
    const metadataHref = `#/metadata/${pk}`;
    const backHref = '#/';

    const keywords = (r.keywords || []).map((k) => k.name || k).filter(Boolean);
    const categories = r.category
        ? [r.category.gn_description || r.category.identifier].filter(Boolean)
        : [];
    const regions = (r.regions || []).map((rg) => rg.name).filter(Boolean);
    const ownerName = r.owner?.full_name || r.owner?.username || '—';
    const ownerHref = r.owner?.username ? `/people/profile/${r.owner.username}` : null;
    const license = r.license?.name_long || r.license?.name || null;
    const licenseUrl = r.license?.url || null;
    const doiUrl = r.doi ? `https://doi.org/${r.doi}` : null;
    const pubDate = r.date
        ? new Date(r.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;
    const tempStart = r.temporal_extent_start
        ? new Date(r.temporal_extent_start).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })
        : null;
    const tempEnd = r.temporal_extent_end
        ? new Date(r.temporal_extent_end).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })
        : null;

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

                // Thumbnail
                r.thumbnail_url && ce('div', { className: 'zalf-lp-hero-thumb' },
                    ce('img', { src: r.thumbnail_url, alt: r.title })
                ),

                // Title block
                ce('div', { className: 'zalf-lp-hero-body' },

                    // Type + version row
                    ce('div', { className: 'zalf-lp-hero-tags' },
                        ce(Badge, { label: 'Dataset', variant: 'type' }),
                        r.subtype && ce(Badge, { label: r.subtype }),
                        r.edition && ce(Badge, { label: 'v' + r.edition }),
                        r.language && ce(Badge, { label: r.language.toUpperCase() })
                    ),

                    // Title
                    ce('h1', { className: 'zalf-lp-title' }, r.title),
                    r.title_translated && ce('p', { className: 'zalf-lp-title-alt' }, r.title_translated),

                    // DOI — prominently below title
                    r.doi && ce('div', { className: 'zalf-lp-doi-row' },
                        ce('span', { className: 'zalf-lp-doi-label' }, 'DOI'),
                        ce('a', {
                            className: 'zalf-lp-doi-value',
                            href: doiUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        }, r.doi)
                    ),

                    // Owner line
                    ce('div', { className: 'zalf-lp-hero-meta' },
                        r.attribution
                            ? ce('span', null, r.attribution)
                            : ownerName && ce('span', null,
                                'Published by ',
                                ownerHref
                                    ? ce('a', { href: ownerHref }, ownerName)
                                    : ownerName
                            ),
                        pubDate && ce('span', { className: 'zalf-lp-hero-date' },
                            ce('span', { className: 'zalf-lp-hero-sep' }, '·'),
                            r.date_type ? r.date_type.charAt(0).toUpperCase() + r.date_type.slice(1) + ': ' : '',
                            pubDate
                        )
                    ),

                    // Action buttons
                    ce('div', { className: 'zalf-lp-hero-actions' },
                        ce('a', { className: 'zalf-lp-btn zalf-lp-btn--primary', href: viewerHref },
                            ce('span', { className: 'zalf-lp-btn-icon' }, '▶'),
                            'Data Access'
                        ),
                        ce('a', { className: 'zalf-lp-btn zalf-lp-btn--outline', href: metadataHref },
                            'View Full Metadata'
                        )
                    )
                )
            )
        ),

        // ── Body (two-column) ────────────────────────────────────────────────
        ce('div', { className: 'zalf-lp-body' },

            // ── Main column ──────────────────────────────────────────────────
            ce('div', { className: 'zalf-lp-main' },

                ce(Section, { title: 'Description' },
                    ce(TextBlock, { text: r.abstract || 'No description available.' })
                ),

                r.purpose && ce(Section, { title: 'Purpose' },
                    ce(TextBlock, { text: r.purpose })
                ),

                (tempStart || tempEnd) && ce(Section, { title: 'Temporal Coverage' },
                    ce('div', { className: 'zalf-lp-temporal' },
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
                    )
                ),

                r.data_quality_statement && ce(Section, { title: 'Data Quality' },
                    ce(TextBlock, { text: r.data_quality_statement })
                ),

                r.data_lineage && ce(Section, { title: 'Data Lineage' },
                    ce(TextBlock, { text: r.data_lineage })
                ),

                r.supplemental_information && ce(Section, { title: 'Supplemental Information' },
                    ce(TextBlock, { text: r.supplemental_information })
                ),

                (r.related_identifier && r.related_identifier.length > 0) && ce(Section, { title: 'Related Identifiers' },
                    ce(RelatedIdentifierList, { items: r.related_identifier })
                )
            ),

            // ── Sidebar ──────────────────────────────────────────────────────
            ce('aside', { className: 'zalf-lp-sidebar' },

                // Dataset details card
                ce('div', { className: 'zalf-lp-card' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Dataset Details'),
                    ce('div', { className: 'zalf-lp-meta-list' },
                        ce(MetaItem, { label: 'Owner', value: ownerName, link: ownerHref }),
                        ce(MetaItem, { label: 'Attribution', value: r.attribution }),
                        ce(MetaItem, { label: 'Date', value: pubDate }),
                        ce(MetaItem, { label: 'Version', value: r.edition }),
                        ce(MetaItem, { label: 'Language', value: r.language }),
                        ce(MetaItem, { label: 'Subtype', value: r.subtype }),
                        ce(MetaItem, { label: 'Spatial Type', value: r.spatial_representation_type }),
                        ce(MetaItem, { label: 'SRID', value: r.srid }),
                        ce(MetaItem, { label: 'Update frequency', value: r.maintenance_frequency }),
                        license && ce(MetaItem, {
                            label: 'License',
                            value: license,
                            link: licenseUrl
                        })
                    )
                ),

                // Keywords card
                (keywords.length > 0 || categories.length > 0) && ce('div', { className: 'zalf-lp-card' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Keywords & Categories'),
                    ce('div', { className: 'zalf-lp-badge-cloud' },
                        ...categories.map((c) => ce(Badge, { key: 'cat-' + c, label: c, variant: 'category' })),
                        ...keywords.map((kw) => ce(Badge, {
                            key: 'kw-' + kw,
                            label: kw,
                            href: `/catalogue/#/?q=${encodeURIComponent(kw)}`
                        }))
                    )
                ),

                // Regions card
                regions.length > 0 && ce('div', { className: 'zalf-lp-card' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Regions'),
                    ce('div', { className: 'zalf-lp-badge-cloud' },
                        ...regions.map((rg) => ce(Badge, { key: rg, label: rg }))
                    )
                ),

                // Access card
                ce('div', { className: 'zalf-lp-card zalf-lp-card--access' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Data Access'),
                    ce('p', { className: 'zalf-lp-access-desc' },
                        'Explore, visualise, and download this dataset in the interactive viewer.'
                    ),
                    ce('a', { className: 'zalf-lp-btn zalf-lp-btn--primary zalf-lp-btn--full', href: viewerHref },
                        ce('span', { className: 'zalf-lp-btn-icon' }, '▶'),
                        'Open in Viewer'
                    ),
                    ce('a', { className: 'zalf-lp-btn zalf-lp-btn--ghost zalf-lp-btn--full', href: metadataHref },
                        'Full Metadata Record'
                    )
                )
            )
        )
    );
}
