/**
 * CUSTOM PATH: themes/zalf/components/content/DatasetLandingPage.jsx
 * REASON: ZALF intermediate dataset landing page — shown between the catalogue
 * grid and the full dataset viewer. Layout inspired by NASA EarthData and the
 * ZALF main-ui metadata panel.
 * NOTE: uses React.createElement (no JSX) — themes/ is outside babel-loader include.
 */

import React, { useEffect, useRef, useState } from 'react';
import { getResourceByPk } from '@js/api/geonode/v2';
import './datasetlanding.css';

const ce = React.createElement;

function extractPkFromHash() {
    const match = window.location.hash.match(/#\/landing\/dataset\/([^/]+)/);
    return match ? match[1] : null;
}

// ─── Demo filler ──────────────────────────────────────────────────────────────
// Merged UNDER real API data — real fields always win.
// Remove once datasets are fully populated.
const DEMO_FILL = {
    title: 'Southern Colonies Map — Agricultural Soil Carbon Inventory',
    title_translated: 'Agrarlandschaft Südliche Kolonien — Bodeninventar Organischer Kohlenstoff',
    abstract: `This dataset contains a comprehensive inventory of soil organic carbon (SOC) stocks and bulk density measured at 247 georeferenced sampling sites across the Southern Colonies agricultural landscape (Brandenburg, Germany). Measurements were conducted between 2019 and 2023 at depths of 0–10 cm, 10–30 cm and 30–60 cm using standardised soil-coring protocols.

The dataset includes SOC content (%), bulk density (g cm⁻³), pH, texture class, land-use category and GNSS-referenced coordinates. All analyses were performed at the ZALF soil laboratory following DIN ISO 10694 (organic carbon via dry combustion) and DIN ISO 11272 (bulk density).`,
    abstract_de: `Dieses Datensatz enthält ein umfassendes Inventar der organischen Kohlenstoffvorräte im Boden (SOC) und der Rohdichte an 247 georeferenzierten Probenahmestandorten in der Agrarlandschaft „Südliche Kolonien" (Brandenburg, Deutschland). Die Messungen wurden zwischen 2019 und 2023 in Tiefen von 0–10 cm, 10–30 cm und 30–60 cm nach standardisierten Protokollen durchgeführt.

Der Datensatz umfasst SOC-Gehalt (%), Rohdichte (g cm⁻³), pH-Wert, Texturklasse, Landnutzungskategorie sowie GNSS-referenzierte Koordinaten.`,
    doi: '10.20387/bonares-zalf-soc-scm-2024',
    edition: '2.1',
    language: 'eng',
    attribution: 'Leibniz Centre for Agricultural Landscape Research (ZALF) e.V., Müncheberg, Germany',
    purpose: 'To quantify long-term dynamics of soil organic carbon across a gradient of agricultural management intensities and land-use histories in north-eastern Germany, supporting regional SOC modelling, climate-smart land-management decisions and national greenhouse-gas inventory reporting.',
    data_quality_statement: 'Quality assured according to ISO 19157 and internal ZALF QA protocol v3.2. All gravimetric measurements were cross-validated with VNIR spectroscopy (R² = 0.93). Spatial positional accuracy ±1.8 m (GNSS RTK Trimble R10). Outliers removed using a 3σ threshold; flagged values retained in auxiliary file.',
    data_lineage: 'Soil cores (0–60 cm) collected at 247 georeferenced sites during spring and autumn field campaigns 2019–2023. Organic carbon determined by dry combustion (DIN ISO 10694) at ZALF soil laboratory. Raw spectral data acquired with ASD FieldSpec 4. Data harmonised and archived in BIS-OK v4.1 and exported as GeoPackage (EPSG:25833).',
    supplemental_information: 'Accompanying data descriptor: Silva et al. (2024) "Long-term SOC dynamics in Brandenburg agroecosystems", Scientific Data 11:312. See also DFG project 423521038 (CarboSense). Uncertainty estimates provided in companion file uncertainty_report_v2.pdf.',
    spatial_representation_type: 'vector',
    maintenance_frequency: 'annually',
    srid: 'EPSG:25833',
    temporal_extent_start: '2019-03-15',
    temporal_extent_end: '2023-11-30',
    date: '2024-06-01T00:00:00Z',
    date_type: 'publication',
    subtype: 'vector',
    owner: {
        username: 'igor.silva',
        full_name: 'Igor Silva de Almeida',
        avatar: null
    },
    // Contact roles — arrays of user objects
    author: [
        { username: 'igor.silva', full_name: 'Igor Silva de Almeida', order: 0 },
        { username: 'maria.schmidt', full_name: 'Maria Schmidt', order: 1 },
        { username: 'thomas.weber', full_name: 'Thomas Weber', order: 2 }
    ],
    poc: [
        { username: 'katrin.mueller', full_name: 'Katrin Müller', order: 0 },
        { username: 'jan.hoffmann', full_name: 'Jan Hoffmann', order: 1 }
    ],
    publisher: [
        { username: 'zalf.rdm', full_name: 'ZALF Research Data Management Office', order: 0 }
    ],
    originator: [
        { username: 'igor.silva', full_name: 'Igor Silva de Almeida', order: 0 },
        { username: 'petra.braun', full_name: 'Petra Braun', order: 1 }
    ],
    principal_investigator: [
        { username: 'prof.bauer', full_name: 'Prof. Dr. Axel Bauer', order: 0 }
    ],
    data_curator: [
        { username: 'lena.frank', full_name: 'Lena Frank', order: 0 }
    ],
    // Fundings
    fundings: [
        {
            organization: { organization: 'Deutsche Forschungsgemeinschaft (DFG)', ror: 'https://ror.org/018mejw64', abbreviation: 'DFG' },
            award_title: 'CarboSense: Carbon Sensing in Agricultural Landscapes',
            award_number: '423521038',
            award_uri: 'https://gepris.dfg.de/gepris/projekt/423521038'
        },
        {
            organization: { organization: 'European Commission — Horizon Europe', ror: 'https://ror.org/00k4n6c32', abbreviation: 'EC' },
            award_title: 'SoilMission — European Soil Observatory Research Initiative',
            award_number: '101059249',
            award_uri: 'https://cordis.europa.eu/project/id/101059249'
        },
        {
            organization: { organization: 'Bundesministerium für Bildung und Forschung (BMBF)', ror: 'https://ror.org/04pz7b180', abbreviation: 'BMBF' },
            award_title: 'BonaRes — Soil as a Sustainable Resource for the Bioeconomy',
            award_number: '031B0511A',
            award_uri: 'https://bonares.de'
        }
    ],
    // Keywords
    keywords: [
        { name: 'Soil Organic Carbon' }, { name: 'SOC' }, { name: 'Bulk Density' },
        { name: 'Agricultural Landscape' }, { name: 'Brandenburg' }, { name: 'Germany' },
        { name: 'Land Use' }, { name: 'Field Campaign' }, { name: 'VNIR Spectroscopy' },
        { name: 'Climate Change Mitigation' }
    ],
    // Category
    category: { gn_description: 'Farming', identifier: 'farming' },
    // Regions
    regions: [
        { name: 'Europe' }, { name: 'Germany' }, { name: 'Brandenburg' }
    ],
    // License
    license: {
        name: 'CC BY 4.0',
        name_long: 'Creative Commons Attribution 4.0 International',
        url: 'https://creativecommons.org/licenses/by/4.0/'
    },
    // Related identifiers
    related_identifier: [
        {
            identifier: '10.1038/s41597-024-03001-0',
            relation_type: { label: 'IsDescribedBy' },
            related_identifier_type: { label: 'DOI' }
        },
        {
            identifier: '10.20387/bonares-zalf-water-cx3r-2022',
            relation_type: { label: 'References' },
            related_identifier_type: { label: 'DOI' }
        },
        {
            identifier: '10.20387/bonares-abc-predecessor-2018',
            relation_type: { label: 'IsContinuedBy' },
            related_identifier_type: { label: 'DOI' }
        },
        {
            identifier: 'https://github.com/zalf-rdm/soc-inventory-scripts',
            relation_type: { label: 'IsSupplementedBy' },
            related_identifier_type: { label: 'URL' }
        }
    ]
};

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

    const landingUrl = window.location.origin + '/catalogue/#/landing/dataset/' + pk;
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

function buildCitation(r, style) {
    const authors = (r.author || []).map((a) => a.full_name || a.username).filter(Boolean);
    const authorList = authors.length
        ? authors.join(', ')
        : (r.owner?.full_name || r.owner?.username || 'ZALF');
    const year = r.date ? new Date(r.date).getFullYear() : new Date().getFullYear();
    const title = r.title || 'Untitled Dataset';
    const institution = r.attribution || 'Leibniz Centre for Agricultural Landscape Research (ZALF)';
    const doi = r.doi ? 'https://doi.org/' + r.doi : null;
    const version = r.edition ? ' Version ' + r.edition + '.' : '';
    const today = new Date().toISOString().split('T')[0];

    if (style === 'APA') {
        const apaDoi = doi ? ' ' + doi : '';
        return authorList + ' (' + year + '). ' + title + ' [Dataset].' + version + ' ' + institution + '.' + apaDoi;
    }
    if (style === 'DataCite') {
        const dcDoi = doi ? ' ' + doi : '';
        return authorList + ' (' + year + '): ' + title + '.' + version + ' ' + institution + '.' + dcDoi;
    }
    // Chicago (default)
    const chiDoi = doi ? ' ' + doi : '';
    return authorList + '. (' + year + '). “' + title + '” [Dataset].' + version
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
            'This dataset is openly shared. Please cite it when used in publications.'
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
    const name = person.full_name || person.username || '—';
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
    const orgName = org?.organization || '—';
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
            const id = ri.identifier || '';
            const type = ri.related_identifier_type?.label || 'ID';
            const rel = ri.relation_type?.label || '';
            const isDoi = type === 'DOI';
            const isUrl = type === 'URL' || id.startsWith('http');
            const href = isDoi ? 'https://doi.org/' + id : (isUrl ? id : null);
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

    // Merge: DEMO_FILL provides defaults; real API values always override
    const r = Object.assign({}, DEMO_FILL, Object.fromEntries(
        Object.entries(resource).filter(([, v]) => {
            if (v === null || v === undefined || v === '') return false;
            if (Array.isArray(v) && v.length === 0) return false;
            return true;
        })
    ));

    // ── Derived values ──────────────────────────────────────────────────────
    const viewerHref = '#/dataset/' + pk;
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
    const ownerName = r.owner?.full_name || r.owner?.username || '—';
    const ownerHref = r.owner?.username ? '/people/profile/' + r.owner.username : null;
    const license = r.license?.name_long || r.license?.name || null;
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

    const hasContactRoles = r.author?.length || r.poc?.length || r.publisher?.length
        || r.originator?.length || r.principal_investigator?.length
        || r.data_curator?.length;

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
                        ce(Badge, { label: 'Dataset', variant: 'type' }),
                        r.subtype && ce(Badge, { label: r.subtype }),
                        r.edition && ce(Badge, { label: 'v' + r.edition }),
                        r.language && ce(Badge, { label: r.language.toUpperCase() })
                    ),
                    ce('h1', { className: 'zalf-lp-title' }, r.title),
                    r.title_translated && ce('p', { className: 'zalf-lp-title-alt' }, r.title_translated),
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
                            ce('span', { className: 'zalf-lp-btn-icon' }, '▶'), 'Data Access'
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
                    ce(TextBlock, { text: r.abstract || 'No description available.' }),
                    r.abstract_de && ce('details', { className: 'zalf-lp-details' },
                        ce('summary', null, 'Beschreibung (Deutsch)'),
                        ce(TextBlock, { text: r.abstract_de })
                    )
                ),

                // Purpose
                r.purpose && ce(Section, { title: 'Purpose' },
                    ce(TextBlock, { text: r.purpose })
                ),

                // People / Contact Roles
                hasContactRoles && ce(Section, { title: 'People' },
                    ce('div', { className: 'zalf-lp-roles' },
                        ce(ContactRoleBlock, { label: 'Authors', people: r.author }),
                        ce(ContactRoleBlock, { label: 'Point of Contact', people: r.poc }),
                        ce(ContactRoleBlock, { label: 'Publisher', people: r.publisher }),
                        ce(ContactRoleBlock, { label: 'Originator', people: r.originator }),
                        ce(ContactRoleBlock, { label: 'Principal Investigator', people: r.principal_investigator }),
                        ce(ContactRoleBlock, { label: 'Data Curator', people: r.data_curator })
                    )
                ),

                // Funders
                r.fundings && r.fundings.length > 0 && ce(Section, { title: 'Funding' },
                    ce('div', { className: 'zalf-lp-funders' },
                        ...r.fundings.map((f, i) => ce(FunderCard, { key: i, funder: f }))
                    )
                ),

                // Temporal Coverage
                (tempStart || tempEnd) && ce(Section, { title: 'Temporal Coverage' },
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
                ),

                // Data Quality
                r.data_quality_statement && ce(Section, { title: 'Data Quality Statement' },
                    ce(TextBlock, { text: r.data_quality_statement })
                ),

                // Data Lineage
                r.data_lineage && ce(Section, { title: 'Data Lineage' },
                    ce(TextBlock, { text: r.data_lineage })
                ),

                // Supplemental
                r.supplemental_information && ce(Section, { title: 'Supplemental Information' },
                    ce(TextBlock, { text: r.supplemental_information })
                ),

                // Related Identifiers
                r.related_identifier && r.related_identifier.length > 0 && ce(Section, { title: 'Related Identifiers' },
                    ce(RelatedIdentifierList, { items: r.related_identifier })
                )
            ),

            // ── Sidebar ──────────────────────────────────────────────────────
            ce('aside', { className: 'zalf-lp-sidebar' },

                // Dataset Details
                ce('div', { className: 'zalf-lp-card' },
                    ce('div', { className: 'zalf-lp-card-header' },
                        ce('h3', { className: 'zalf-lp-card-title' }, 'Dataset Details'),
                        ce(CopyMenu, { pk })
                    ),
                    ce('div', { className: 'zalf-lp-meta-list' },
                        ce(MetaItem, { label: 'Owner', value: ownerName, link: ownerHref }),
                        ce(MetaItem, { label: 'Attribution', value: r.attribution }),
                        ce(MetaItem, { label: dateTypeLabel, value: pubDate }),
                        ce(MetaItem, { label: 'Version', value: r.edition }),
                        ce(MetaItem, { label: 'Language', value: r.language }),
                        ce(MetaItem, { label: 'Subtype', value: r.subtype }),
                        ce(MetaItem, { label: 'Spatial Type', value: r.spatial_representation_type }),
                        ce(MetaItem, { label: 'SRID', value: r.srid }),
                        ce(MetaItem, { label: 'Update Freq.', value: r.maintenance_frequency }),
                        license && ce(MetaItem, { label: 'License', value: license, link: licenseUrl })
                    )
                ),

                // Access card
                ce('div', { className: 'zalf-lp-card zalf-lp-card--access' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Data Access'),
                    ce('p', { className: 'zalf-lp-access-desc' },
                        'Explore, visualise, and download this dataset in the interactive viewer.'
                    ),
                    ce('a', { className: 'zalf-lp-btn zalf-lp-btn--primary zalf-lp-btn--full', href: viewerHref },
                        ce('span', { className: 'zalf-lp-btn-icon' }, '▶'), 'Open in Viewer'
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
                (keywords.length > 0 || categories.length > 0) && ce('div', { className: 'zalf-lp-card' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Keywords & Categories'),
                    ce('div', { className: 'zalf-lp-badge-cloud' },
                        ...categories.map((c) => ce(Badge, { key: 'cat-' + c, label: c, variant: 'category' })),
                        ...keywords.map((kw) => ce(Badge, {
                            key: 'kw-' + kw, label: kw,
                            href: '/catalogue/#/?q=' + encodeURIComponent(kw)
                        }))
                    )
                ),

                // Regions
                regions.length > 0 && ce('div', { className: 'zalf-lp-card' },
                    ce('h3', { className: 'zalf-lp-card-title' }, 'Regions'),
                    ce('div', { className: 'zalf-lp-badge-cloud' },
                        ...regions.map((rg) => ce(Badge, { key: rg, label: rg }))
                    )
                )
            )
        )
    );
}
