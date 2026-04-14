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
import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';

const CopyToClipboard = tooltip(CopyToClipboardCmp);

function formatAuthorName(person) {
    const last = (person.last_name || '').trim();
    const first = (person.first_name || '').trim();
    if (last && first) return `${last}, ${first}`;
    if (last) return last;
    if (first) return first;
    return person.username || '';
}

function getSortedAuthors(resource) {
    const authors = resource?.author;
    if (!authors || authors.length === 0) return [];
    return [...authors].sort((a, b) => {
        if (a.order == null && b.order == null) return 0;
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
    });
}

function getPublisher(resource) {
    const publishers = resource?.publisher;
    if (!publishers || publishers.length === 0) return null;
    const pub = publishers[0];
    return [pub.first_name, pub.last_name].filter(Boolean).join(' ') || pub.username || null;
}

function getYear(resource) {
    const dateStr = resource?.date_issued || resource?.date;
    if (!dateStr) return null;
    const year = new Date(dateStr).getFullYear();
    return isNaN(year) ? null : String(year);
}

function generateBibTeX(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);
    const firstAuthorLast = (authors[0]?.last_name || '').replace(/\s+/g, '');
    const key = firstAuthorLast && year
        ? `${firstAuthorLast}${year}`
        : (resource?.uuid || String(resource?.pk || 'unknown')).replace(/-/g, '').slice(0, 12);

    const entries = [];
    entries.push(`  title     = {${resource?.title || ''}}`);
    if (authors.length > 0) {
        entries.push(`  author    = {${authors.map(formatAuthorName).join(' and ')}}`);
    }
    if (publisher) {
        entries.push(`  publisher = {${publisher}}`);
    }
    if (year) {
        entries.push(`  year      = {${year}}`);
    }
    if (resource?.doi) {
        entries.push(`  doi       = {${resource.doi}}`);
    }
    const url = resource?.detail_url
        ? `${window.location.origin}${resource.detail_url}`
        : '';
    if (url) {
        entries.push(`  url       = {${url}}`);
    }
    return `@misc{${key},\n${entries.join(',\n')}\n}`;
}

function generateRIS(resource) {
    const authors = getSortedAuthors(resource);
    const year = getYear(resource);
    const publisher = getPublisher(resource);

    const lines = [];
    lines.push('TY  - DATA');
    lines.push(`TI  - ${resource?.title || ''}`);
    authors.forEach(a => {
        lines.push(`AU  - ${formatAuthorName(a)}`);
    });
    if (publisher) {
        lines.push(`PB  - ${publisher}`);
    }
    if (year) {
        lines.push(`PY  - ${year}`);
    }
    if (resource?.doi) {
        lines.push(`DO  - ${resource.doi}`);
    }
    const url = resource?.detail_url
        ? `${window.location.origin}${resource.detail_url}`
        : '';
    if (url) {
        lines.push(`UR  - ${url}`);
    }
    lines.push('ER  -');
    return lines.join('\n');
}

function DetailsCitation({ resource }) {
    const [activeFormat, setActiveFormat] = useState('bibtex');
    const [copied, setCopied] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const citationText = activeFormat === 'bibtex'
        ? generateBibTeX(resource)
        : generateRIS(resource);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => {
            if (isMounted.current) setCopied(false);
        }, 700);
    };

    return (
        <div className="gn-details-citation">
            <div className="gn-details-citation-header">
                <div className="gn-details-citation-title">
                    <Message msgId="gnviewer.citation" />
                </div>
                <div className="gn-details-citation-actions">
                    <Button
                        className={`gn-details-citation-format-btn${activeFormat === 'bibtex' ? ' active' : ''}`}
                        variant="default"
                        bsSize="xs"
                        onClick={() => setActiveFormat('bibtex')}
                    >
                        <Message msgId="gnviewer.citationBibTeX" />
                    </Button>
                    <Button
                        className={`gn-details-citation-format-btn${activeFormat === 'ris' ? ' active' : ''}`}
                        variant="default"
                        bsSize="xs"
                        onClick={() => setActiveFormat('ris')}
                    >
                        <Message msgId="gnviewer.citationRIS" />
                    </Button>
                    <CopyToClipboard
                        tooltipPosition="top"
                        tooltipId={copied ? 'gnviewer.citationCopied' : 'gnviewer.copyCitation'}
                        text={citationText}
                    >
                        <Button
                            variant="default"
                            bsSize="xs"
                            onClick={handleCopy}
                        >
                            <FaIcon name={copied ? 'check' : 'copy'} />
                        </Button>
                    </CopyToClipboard>
                </div>
            </div>
            <pre className="gn-details-citation-code">{citationText}</pre>
        </div>
    );
}

export default DetailsCitation;
