/**
 * CUSTOM PATH: themes/zalf/components/highlightCase/HighlightCasePage.jsx
 * REASON: beautiful client-side landing page for ZALF highlight cases
 */

import React from 'react';
import { withRouter } from 'react-router';
import EditorialPageShell from '../editorial/EditorialPageShell';
import './highlight-case-page.css';

const CMS_ENDPOINT = '/api/v2/zalf-cms/highlight-cases/';

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function firstNonEmptyString(...values) {
    return values.find(isNonEmptyString) || '';
}

function fetchJson(url, signal) {
    return fetch(url, {
        signal,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json'
        }
    }).then((response) => {
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
    });
}

function resolveImageUrl(imageValue) {
    if (!imageValue) {
        return '';
    }
    if (typeof imageValue === 'string') {
        return imageValue;
    }
    return imageValue?.url || imageValue?.src || imageValue?.image || '';
}

function HighlightCasePage({ match }) {
    const slug = match?.params?.slug;
    const [highlightCase, setHighlightCase] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (!slug) {
            setHighlightCase(null);
            setError('Missing highlight case slug.');
            setLoading(false);
            return () => {};
        }

        const controller = new AbortController();

        setLoading(true);
        setError('');

        fetchJson(`${CMS_ENDPOINT}${encodeURIComponent(slug)}/`, controller.signal)
            .then((data) => {
                if (controller.signal.aborted) {
                    return;
                }

                setHighlightCase({
                    title: firstNonEmptyString(data?.title, 'Highlighted case'),
                    subtitle: firstNonEmptyString(data?.subtitle),
                    description: firstNonEmptyString(data?.description),
                    image: resolveImageUrl(data?.image),
                    buttonText: firstNonEmptyString(data?.button_text, 'Explore now'),
                    link: firstNonEmptyString(data?.link)
                });
            })
            .catch((err) => {
                if (controller.signal.aborted) {
                    return;
                }
                setError(err?.message || 'Unable to load this highlight case.');
                setHighlightCase(null);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [slug]);

    const heroStyle = highlightCase?.image
        ? { backgroundImage: `linear-gradient(135deg, rgba(7, 19, 31, 0.24), rgba(7, 19, 31, 0.60)), url(${highlightCase.image})` }
        : undefined;

    const hasExternalLink = /^https?:/i.test(highlightCase?.link || '');

    return React.createElement(
        EditorialPageShell,
        null,
        React.createElement(
            'main',
            { className: 'zalf-highlight-case-page' },
            React.createElement(
                'section',
                { className: 'zalf-highlight-case-page__hero', style: heroStyle },
                React.createElement(
                    'div',
                    { className: 'zalf-highlight-case-page__hero-inner' },
                    React.createElement('span', { className: 'zalf-highlight-case-page__eyebrow' }, 'Highlighted case'),
                    React.createElement('h1', { className: 'zalf-highlight-case-page__title' }, loading ? 'Loading case...' : (highlightCase?.title || 'Highlighted case')),
                    highlightCase?.subtitle ? React.createElement('p', { className: 'zalf-highlight-case-page__subtitle' }, highlightCase.subtitle) : null,
                    highlightCase?.description ? React.createElement('p', { className: 'zalf-highlight-case-page__summary' }, highlightCase.description) : null,
                    highlightCase?.link ? React.createElement(
                        'a',
                        {
                            className: 'zalf-highlight-case-page__cta',
                            href: highlightCase.link,
                            target: hasExternalLink ? '_blank' : undefined,
                            rel: hasExternalLink ? 'noreferrer' : undefined
                        },
                        highlightCase.buttonText
                    ) : null
                )
            ),
            React.createElement(
                'section',
                { className: 'zalf-highlight-case-page__content' },
                React.createElement(
                    'div',
                    { className: 'zalf-highlight-case-page__content-inner' },
                    loading ? React.createElement('div', { className: 'zalf-highlight-case-page__state' }, 'Loading…') : null,
                    error ? React.createElement('div', { className: 'zalf-highlight-case-page__state zalf-highlight-case-page__state--error' }, error) : null,
                    !loading && !error && highlightCase ? React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(
                            'article',
                            { className: 'zalf-highlight-case-page__article' },
                            React.createElement('p', { className: 'zalf-highlight-case-page__article-text' }, highlightCase.description || highlightCase.subtitle || 'This case is curated in the CMS and presented as an editorial landing page.')
                        )
                    ) : null
                )
            )
        )
    );
}

export default withRouter(HighlightCasePage);
