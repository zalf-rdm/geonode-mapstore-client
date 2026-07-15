/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef, useEffect } from 'react';
import CopyToClipboardCmp from 'react-copy-to-clipboard';
import Button from '@js/components/Button';
import Dropdown from '@js/components/Dropdown';
import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';

const TooltipButton = tooltip(Button);

const FORMATS = [
    { key: 'apa',       label: 'APA' },
    { key: 'harvard',   label: 'Harvard' },
    { key: 'mla',       label: 'MLA' },
    { key: 'vancouver', label: 'Vancouver' },
    { key: 'chicago',   label: 'Chicago' },
    { key: 'ieee',      label: 'IEEE' },
    { key: 'bibtex',    label: 'BibTeX' },
    { key: 'ris',       label: 'RIS' }
];

function formatAuthorName(person, style) {
    const last = (person.last_name || '').trim();
    const first = (person.first_name || '').trim();
    const initials = first.split(/\s+/).filter(Boolean).map(n => n[0] + '.').join(' ');
    switch (style) {
    case 'firstInitials': return last && first ? `${last}, ${initials}` : last || first || person.username || '';
    case 'firstFull':     return last && first ? `${last}, ${first}` : last || first || person.username || '';
    case 'fullNormal':    return last && first ? `${first} ${last}` : last || first || person.username || '';
    default:              return last && first ? `${last}, ${first}` : last || first || person.username || '';
    }
}

function getSortedAuthors(resource) {
    const authors = resource?.author;
    if (!authors || authors.length === 0) return [];
    return [...authors].sort((a, b) => {
        if (a.order === null && b.order === null) return 0;
        if (a.order === null) return 1;
        if (b.order === null) return -1;
        return a.order - b.order;
    });
}

function getPublisher(resource) {
    const publishers = resource?.publisher;
    if (!publishers || publishers.length === 0) return null;
    const pub = publishers[0];
    const fullName = [pub.first_name, pub.last_name].filter(Boolean).join(' ');
    if (fullName) return fullName;
    if (pub.department) return pub.department;
    return pub.username || null;
}

function getYear(resource) {
    const dateStr = resource?.date_issued || resource?.date;
    if (!dateStr) return null;
    const year = new Date(dateStr).getFullYear();
    return isNaN(year) ? null : String(year);
}

function getResourceUrl(resource) {
    if (resource?.doi) return resource.doi.startsWith('http') ? resource.doi : `https://doi.org/${resource.doi}`;
    if (resource?.uuid) return `${window.location.origin}/catalogue/#/uuid/${resource.uuid}`;
    const raw = resource?.detail_url || '';
    return raw ? (raw.startsWith('http') ? raw : `${window.location.origin}${raw}`) : '';
}

function formatAuthorList(authors, style, maxBeforeEtAl) {
    if (authors.length === 0) return '';
    if (maxBeforeEtAl && authors.length > maxBeforeEtAl) {
        return formatAuthorName(authors[0], style) + ' et al.';
    }
    const names = authors.map(a => formatAuthorName(a, style));
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + ' & ' + names[1];
    return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
}

function sanitizeRisField(value) {
    return (value || '').replace(/[\r\n]+/g, ' ').trim();
}

function sanitizeBibTeXField(value) {
    return (value || '').replace(/[{}\\]/g, '').trim();
}

function getRawDoi(resource) {
    if (!resource?.doi) return null;
    return resource.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

function generateBibTeX(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const firstAuthorLast = (authors[0]?.last_name || '').replace(/[^a-zA-Z0-9]/g, '');
    const key = firstAuthorLast && year
        ? `${firstAuthorLast}${year}`
        : (resource?.uuid || String(resource?.pk || 'unknown')).replace(/-/g, '').slice(0, 12);

    const entries = [];
    entries.push(`  title     = {${sanitizeBibTeXField(resource?.title)}}`);
    if (authors.length > 0) {
        entries.push(`  author    = {${authors.map(a => sanitizeBibTeXField(formatAuthorName(a, 'firstFull'))).join(' and ')}}`);
    }
    if (publisher) entries.push(`  publisher = {${sanitizeBibTeXField(publisher)}}`);
    if (year) entries.push(`  year      = {${year}}`);
    const doi = getRawDoi(resource);
    if (doi) entries.push(`  doi       = {${doi}}`);
    const url = getResourceUrl(resource);
    if (url) entries.push(`  url       = {${url}}`);
    return `@misc{${key},\n${entries.join(',\n')}\n}`;
}

function generateRIS(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);

    const lines = ['TY  - DATASET'];
    lines.push(`TI  - ${sanitizeRisField(resource?.title)}`);
    if (resource?.title_translated) {
        lines.push(`T2  - ${sanitizeRisField(resource.title_translated)}`);
    }
    authors.forEach(a => lines.push(`AU  - ${sanitizeRisField(formatAuthorName(a, 'firstFull'))}`));
    if (publisher) lines.push(`PB  - ${sanitizeRisField(publisher)}`);
    if (year) lines.push(`PY  - ${year}`);
    if (resource?.edition) lines.push(`ET  - ${sanitizeRisField(resource.edition)}`);
    const doi = getRawDoi(resource);
    if (doi) lines.push(`DO  - ${doi}`);
    const url = getResourceUrl(resource);
    if (url) lines.push(`UR  - ${url}`);
    lines.push('ER  - ');
    return lines.join('\r\n');
}

function generateAPA(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const link = getResourceUrl(resource);

    const authorStr = formatAuthorList(authors, 'firstInitials', 20);
    const yearStr = year ? ` (${year}).` : '.';
    const titleStr = resource?.title ? ` ${resource.title}.` : '';
    const publisherStr = publisher ? ` ${publisher}.` : '';
    const linkStr = link ? ` ${link}` : '';
    return `${authorStr}${yearStr}${titleStr}${publisherStr}${linkStr}`.trim();
}

function generateHarvard(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const link = getResourceUrl(resource);

    const authorStr = formatAuthorList(authors, 'firstInitials', 0);
    const yearStr = year ? ` ${year}.` : '.';
    const titleStr = resource?.title ? ` ${resource.title}.` : '';
    const publisherStr = publisher ? ` ${publisher}.` : '';
    const linkStr = link ? ` Available at: ${link}` : '';
    return `${authorStr}${yearStr}${titleStr}${publisherStr}${linkStr}`.trim();
}

function generateMLA(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const link = getResourceUrl(resource);

    let authorStr = '';
    if (authors.length === 1) {
        authorStr = formatAuthorName(authors[0], 'firstFull') + '.';
    } else if (authors.length === 2) {
        authorStr = formatAuthorName(authors[0], 'firstFull') + ', and ' + formatAuthorName(authors[1], 'fullNormal') + '.';
    } else if (authors.length > 2) {
        authorStr = formatAuthorName(authors[0], 'firstFull') + ', et al.';
    }
    const titleStr = resource?.title ? ` "${resource.title}."` : '';
    const publisherStr = publisher ? ` ${publisher},` : '';
    const yearStr = year ? ` ${year}.` : '';
    const linkStr = link ? ` ${link}.` : '';
    return `${authorStr}${titleStr}${publisherStr}${yearStr}${linkStr}`.trim();
}

function generateVancouver(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const link = getResourceUrl(resource);

    const authorStr = authors.length > 6
        ? authors.slice(0, 6).map(a => formatAuthorName(a, 'firstInitials')).join(', ') + ' et al.'
        : authors.map(a => formatAuthorName(a, 'firstInitials')).join(', ');
    const yearStr = year ? ` ${year}.` : '.';
    const titleStr = resource?.title ? ` ${resource.title}.` : '';
    const publisherStr = publisher ? ` ${publisher};` : '';
    const linkStr = link ? ` Available from: ${link}` : '';
    return `${authorStr}${yearStr}${titleStr}${publisherStr}${linkStr}`.trim();
}

function generateChicago(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const link = getResourceUrl(resource);

    let authorStr = '';
    if (authors.length === 1) {
        authorStr = formatAuthorName(authors[0], 'firstFull') + '.';
    } else if (authors.length > 1) {
        authorStr = formatAuthorName(authors[0], 'firstFull');
        const rest = authors.slice(1).map(a => formatAuthorName(a, 'fullNormal'));
        if (rest.length === 1) {
            authorStr += ' and ' + rest[0] + '.';
        } else {
            authorStr += ', ' + rest.slice(0, -1).join(', ') + ', and ' + rest[rest.length - 1] + '.';
        }
    }
    const titleStr = resource?.title ? ` "${resource.title}."` : '';
    const publisherStr = publisher ? ` ${publisher},` : '';
    const yearStr = year ? ` ${year}.` : '';
    const linkStr = link ? ` ${link}.` : '';
    return `${authorStr}${titleStr}${publisherStr}${yearStr}${linkStr}`.trim();
}

function generateIEEE(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const link = getResourceUrl(resource);

    const authorStr = authors.length > 6
        ? authors.slice(0, 6).map(a => formatAuthorName(a, 'firstInitials')).join(', ') + ' et al.,'
        : authors.map(a => formatAuthorName(a, 'firstInitials')).join(', ') + (authors.length ? ',' : '');
    const titleStr = resource?.title ? ` "${resource.title},"` : '';
    const publisherStr = publisher ? ` ${publisher},` : '';
    const yearStr = year ? ` ${year}.` : '';
    const linkStr = link ? ` [Online]. Available: ${link}` : '';
    return `${authorStr}${titleStr}${publisherStr}${yearStr}${linkStr}`.trim();
}

const generators = {
    bibtex: generateBibTeX,
    ris: generateRIS,
    apa: generateAPA,
    harvard: generateHarvard,
    mla: generateMLA,
    vancouver: generateVancouver,
    chicago: generateChicago,
    ieee: generateIEEE
};

const FILE_EXTENSIONS = {
    bibtex: 'bib',
    ris: 'ris'
};

function getCitationFilename(resource, format) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const firstAuthorLast = (authors[0]?.last_name || '').replace(/[^a-zA-Z0-9]/g, '');
    const base = firstAuthorLast && year
        ? `${firstAuthorLast}${year}`
        : (resource?.uuid || String(resource?.pk || 'citation')).replace(/-/g, '').slice(0, 12);
    const ext = FILE_EXTENSIONS[format] || 'txt';
    return `${base}-${format}.${ext}`;
}

function downloadCitation(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function DetailsCitation({ resource }) {
    const [activeFormat, setActiveFormat] = useState('apa');
    const [copied, setCopied] = useState(false);
    const timeoutIdRef = useRef(null);

    useEffect(() => {
        return () => { clearTimeout(timeoutIdRef.current); };
    }, []);

    const citationText = (generators[activeFormat] || generateAPA)(resource);
    const activeLabel = FORMATS.find(f => f.key === activeFormat)?.label || activeFormat;

    const handleCopy = () => {
        setCopied(true);
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = setTimeout(() => {
            setCopied(false);
        }, 700);
    };

    const handleDownload = () => {
        downloadCitation(citationText, getCitationFilename(resource, activeFormat));
    };

    return (
        <div className="gn-details-citation">
            <div className="gn-details-citation-header">
                <div className="gn-details-citation-title">
                    <Message msgId="gnviewer.citation" />
                </div>
                <div className="gn-details-citation-actions">
                    <Dropdown id="gn-citation-format-dropdown" className="gn-details-citation-dropdown">
                        <Dropdown.Toggle variant="default" size="xs" noCaret>
                            {activeLabel} <FaIcon name="caret-down" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {FORMATS.map(f => (
                                <Dropdown.Item
                                    key={f.key}
                                    active={activeFormat === f.key}
                                    onSelect={() => setActiveFormat(f.key)}
                                >
                                    {f.label}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                    <CopyToClipboardCmp
                        text={citationText}
                        onCopy={handleCopy}
                    >
                        <TooltipButton
                            tooltipPosition="top"
                            tooltipId={copied ? 'gnviewer.citationCopied' : 'gnviewer.copyCitation'}
                            variant="default"
                            size="xs"
                        >
                            <FaIcon name={copied ? 'check' : 'copy'} />
                        </TooltipButton>
                    </CopyToClipboardCmp>
                    <TooltipButton
                        tooltipPosition="top"
                        tooltipId="gnviewer.downloadCitation"
                        variant="default"
                        size="xs"
                        onClick={handleDownload}
                    >
                        <FaIcon name="download" />
                    </TooltipButton>
                </div>
            </div>
            <pre className="gn-details-citation-code">{citationText}</pre>
        </div>
    );
}

export default DetailsCitation;
