/**
 * CUSTOM PATH: themes/zalf/components/training/TrainingPage.jsx
 * REASON: beautiful client-side landing page for ZALF training entries
 */

import React from 'react';
import { withRouter } from 'react-router';
import EditorialPageShell from '../editorial/EditorialPageShell';
import './training-page.css';

const CMS_ENDPOINT = '/api/v2/zalf-cms/trainings/';

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

function renderBodyBlock(block, index) {
    if (!block) {
        return null;
    }

    const key = `${block.type || 'block'}-${index}`;
    const value = block.value;

    if (block.type === 'heading') {
        return React.createElement('h2', { key, className: 'zalf-training-page__body-heading' }, value);
    }

    if (block.type === 'quote') {
        return React.createElement('blockquote', { key, className: 'zalf-training-page__body-quote' }, value);
    }

    if (block.type === 'image') {
        const imageUrl = resolveImageUrl(value);
        const caption = value?.caption || value?.alt || '';
        return imageUrl
            ? React.createElement(
                'figure',
                { key, className: 'zalf-training-page__body-figure' },
                React.createElement('img', { src: imageUrl, alt: caption || 'Training illustration' }),
                caption ? React.createElement('figcaption', null, caption) : null
            )
            : null;
    }

    if (block.type === 'paragraph') {
        return React.createElement('p', {
            key,
            className: 'zalf-training-page__body-paragraph',
            dangerouslySetInnerHTML: { __html: value }
        });
    }

    if (typeof value === 'string') {
        return React.createElement('p', {
            key,
            className: 'zalf-training-page__body-paragraph',
            dangerouslySetInnerHTML: { __html: value }
        });
    }

    return React.createElement('pre', { key, className: 'zalf-training-page__body-raw' }, JSON.stringify(block, null, 2));
}

function TrainingPage({ match }) {
    const slug = match?.params?.slug;
    const [training, setTraining] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (!slug) {
            setTraining(null);
            setError('Missing training slug.');
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

                setTraining({
                    title: firstNonEmptyString(data?.title, 'Training'),
                    subtitle: firstNonEmptyString(data?.subtitle),
                    summary: firstNonEmptyString(data?.summary),
                    heroImage: resolveImageUrl(data?.hero_image),
                    body: Array.isArray(data?.body) ? data.body : [],
                    level: firstNonEmptyString(data?.level),
                    duration: firstNonEmptyString(data?.duration),
                    source: firstNonEmptyString(data?.source),
                    externalLink: firstNonEmptyString(data?.external_link)
                });
            })
            .catch((err) => {
                if (controller.signal.aborted) {
                    return;
                }
                setError(err?.message || 'Unable to load this training page.');
                setTraining(null);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [slug]);

    const heroStyle = training?.heroImage
        ? { backgroundImage: `linear-gradient(135deg, rgba(7, 19, 31, 0.26), rgba(7, 19, 31, 0.62)), url(${training.heroImage})` }
        : undefined;

    return React.createElement(
        EditorialPageShell,
        null,
        React.createElement(
            'main',
            { className: 'zalf-training-page' },
            React.createElement(
                'section',
                { className: 'zalf-training-page__hero', style: heroStyle },
                React.createElement(
                    'div',
                    { className: 'zalf-training-page__hero-inner' },
                    React.createElement('span', { className: 'zalf-training-page__eyebrow' }, 'Training'),
                    React.createElement('h1', { className: 'zalf-training-page__title' }, loading ? 'Loading training...' : (training?.title || 'Training page')),
                    training?.subtitle ? React.createElement('p', { className: 'zalf-training-page__subtitle' }, training.subtitle) : null,
                    training?.summary ? React.createElement('p', { className: 'zalf-training-page__summary' }, training.summary) : null,
                    React.createElement(
                        'div',
                        { className: 'zalf-training-page__meta' },
                        training?.level ? React.createElement('span', { className: 'zalf-training-page__chip' }, training.level) : null,
                        training?.duration ? React.createElement('span', { className: 'zalf-training-page__chip' }, training.duration) : null,
                        training?.source ? React.createElement('span', { className: 'zalf-training-page__chip' }, training.source) : null
                    ),
                    training?.externalLink ? React.createElement(
                        'a',
                        {
                            className: 'zalf-training-page__cta',
                            href: training.externalLink,
                            target: '_blank',
                            rel: 'noreferrer'
                        },
                        'Open external resource'
                    ) : null
                )
            ),
            React.createElement(
                'section',
                { className: 'zalf-training-page__content' },
                React.createElement(
                    'div',
                    { className: 'zalf-training-page__content-inner' },
                    loading ? React.createElement('div', { className: 'zalf-training-page__state' }, 'Loading…') : null,
                    error ? React.createElement('div', { className: 'zalf-training-page__state zalf-training-page__state--error' }, error) : null,
                    !loading && !error && training ? React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(
                            'article',
                            { className: 'zalf-training-page__article' },
                            ...((training.body || []).map(renderBodyBlock))
                        )
                    ) : null
                )
            )
        )
    );
}

export default withRouter(TrainingPage);
