/**
 * CUSTOM PATH: themes/zalf/components/home/Homepage.jsx
 * REASON: custom homepage layout for ZALF catalogue route
 */

import React from 'react';
import { connect } from 'react-redux';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './homepage.css';

gsap.registerPlugin(ScrollTrigger);

const topicItems = [
    { label: 'Animals', labelId: 'zalfTheme.home.topics.animals', href: '/catalogue/#/?q=Animals' },
    { label: 'Atmosphere', labelId: 'zalfTheme.home.topics.atmosphere', href: '/catalogue/#/?q=Atmosphere' },
    { label: 'Climate', labelId: 'zalfTheme.home.topics.climate', href: '/catalogue/#/?q=Climate' },
    { label: 'Forest', labelId: 'zalfTheme.home.topics.forest', href: '/catalogue/#/?q=Forest' },
    { label: 'Hydrology', labelId: 'zalfTheme.home.topics.hydrology', href: '/catalogue/#/?q=Hydrology' },
    { label: 'Landscape', labelId: 'zalfTheme.home.topics.landscape', href: '/catalogue/#/?q=Landscape' },
    { label: 'Plants', labelId: 'zalfTheme.home.topics.plants', href: '/catalogue/#/?q=Plants' },
    { label: 'Soil Profiles', labelId: 'zalfTheme.home.topics.soilProfiles', href: '/catalogue/#/?q=Soil%20Profiles' }
];

const valueItems = [
    {
        title: 'Section-driven storytelling',
        description: 'Each section has a clear job: orient the visitor, expose topics, explain value, and promote curated content.'
    },
    {
        title: 'Frontend-ready for CMS data',
        description: 'The spotlight section already follows a stable card model that can later be loaded from an API or admin panel.'
    },
    {
        title: 'Consistent with catalogue growth',
        description: 'The layout is designed to absorb more content without collapsing into a single static landing page.'
    }
];

const idasSites = [
    {
        name: 'ZALF.DE',
        href: 'https://www.zalf.de/',
        accent: 'var(--zalf-home-idas-zalf)',
        textColor: 'var(--zalf-home-idas-zalf-text)',
        descriptionId: 'zalfTheme.home.idas.zalf',
        description:
            'ZALF is the Leibniz Centre for Agricultural Landscape Research. It develops solutions for economically, environmentally, and socially sustainable agriculture together with society, with a strong focus on agricultural landscapes and long-term research.'
    },
    {
        name: 'BONARES.DE',
        href: 'https://www.bonares.de/',
        accent: 'var(--zalf-home-idas-bonares)',
        textColor: 'var(--zalf-home-idas-bonares-text)',
        descriptionId: 'zalfTheme.home.idas.bonares',
        description:
            'BonaRes is a free repository for soil, agricultural, and ecology-related research data. It helps researchers publish, find, preserve, and reuse data, including long-term field experiments and their metadata.'
    },
    {
        name: 'FAIRAGRO.NET',
        href: 'https://fairagro.net/en/',
        accent: 'var(--zalf-home-idas-fairagro)',
        textColor: 'var(--zalf-home-idas-fairagro-text)',
        descriptionId: 'zalfTheme.home.idas.fairagro',
        description:
            'FAIRagro builds FAIR research data infrastructure for agricultural systems research. It focuses on interoperable tools, workflows, and services that support open, collaborative data management across the community.'
    }
];

// Photo: Yulian Alexeyev (Unsplash), resized to 1920px WebP (was a 4.9 MB JPEG).
const heroBackground = '/static/img/home-hero.webp';

function useCmsData() {
    const [cases, setCases] = React.useState([]);
    const [banners, setBanners] = React.useState([]);
    const [trainings, setTrainings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        Promise.all([
            fetch('/api/v2/cms/cases/').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/v2/cms/banners/').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/v2/cms/trainings/').then(r => r.ok ? r.json() : []).catch(() => []),
        ]).then(([c, b, t]) => {
            // Staff users receive inactive records too so the CMS can manage
            // them. Public-facing pages must never render those records.
            const activeOnly = (items) => Array.isArray(items)
                ? items.filter((item) => item.is_active !== false)
                : [];
            setCases(activeOnly(c));
            setBanners(activeOnly(b));
            setTrainings(activeOnly(t));
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return { cases, banners, trainings, loading };
}

// getMessageById returns the id itself when a message is missing, so fall back explicitly.
function translate(messages, id, fallback) {
    const message = getMessageById(messages, id);
    return message && message !== id ? message : fallback;
}

function renderSectionHead(eyebrow, title, description, light) {
    return React.createElement(
        'div',
        {
            className: `zalf-homepage__section-head${light ? ' zalf-homepage__section-head--light' : ''}`
        },
        React.createElement('span', { className: 'zalf-homepage__eyebrow' }, eyebrow),
        React.createElement('h2', { className: 'zalf-homepage__section-title' }, title),
        description ? React.createElement('p', { className: 'zalf-homepage__section-description' }, description) : null
    );
}

function Homepage({ messages = {} }) {
    const t = (id, fallback) => translate(messages, id, fallback);
    const [activeSpotlight, setActiveSpotlight] = React.useState(0);
    const [activeCase, setActiveCase] = React.useState(0);
    const [heroQuery, setHeroQuery] = React.useState('');

    const { cases, banners, trainings, loading } = useCmsData();

    React.useEffect(() => {
        if (banners.length === 0) return;
        const timer = window.setInterval(() => {
            setActiveSpotlight((current) => (current + 1) % banners.length);
        }, 6000);
        return () => window.clearInterval(timer);
    }, [banners.length]);

    React.useEffect(() => {
        setActiveCase(0);
    }, [cases.length]);

    React.useEffect(() => {
        if (cases.length <= 1) return;
        const timer = window.setInterval(() => {
            setActiveCase(i => (i + 1) % cases.length);
        }, 7000);
        return () => window.clearInterval(timer);
    }, [cases.length]);

    const handleHeroSearchSubmit = (event) => {
        event.preventDefault();
        const query = heroQuery.trim();
        const target = query ? `/catalogue/#/?q=${encodeURIComponent(query)}` : '/catalogue/#/';
        window.location.href = target;
    };

    const currentCase = cases[activeCase] || null;
    const spotlightCount = banners.length;
    const previousSpotlight = spotlightCount > 0 ? (activeSpotlight + spotlightCount - 1) % spotlightCount : 0;
    const nextSpotlight = spotlightCount > 0 ? (activeSpotlight + 1) % spotlightCount : 0;

    return React.createElement(
        'main',
        { className: 'zalf-homepage' },

        // Hero
        React.createElement(
            'section',
            {
                className: 'zalf-homepage__section zalf-homepage__hero',
                style: {
                    backgroundImage: `linear-gradient(90deg, rgba(16, 31, 12, 0.32) 0%, rgba(16, 31, 12, 0.24) 28%, rgba(16, 31, 12, 0.15) 80%), url(${heroBackground})`
                }
            },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container zalf-homepage__hero-grid' },
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__hero-copy' },
                    React.createElement('span', { className: 'zalf-homepage__eyebrow' }, t('zalfTheme.home.heroEyebrow', 'The global hub for agricultural data')),
                    React.createElement('h1', { className: 'zalf-homepage__title' }, 'BonaRes Repository'),
                    React.createElement(
                        'form',
                        { className: 'zalf-homepage__hero-search', onSubmit: handleHeroSearchSubmit, role: 'search' },
                        React.createElement('label', { className: 'zalf-homepage__sr-only', htmlFor: 'zalf-homepage-hero-search' }, t('zalfTheme.home.searchDatasets', 'Search datasets')),
                        React.createElement('input', {
                            id: 'zalf-homepage-hero-search',
                            className: 'zalf-homepage__hero-search-input',
                            type: 'search',
                            value: heroQuery,
                            onChange: (event) => setHeroQuery(event.target.value),
                            placeholder: t('zalfTheme.home.searchPlaceholder', 'What type of agricultural data are you searching for?'),
                            autoComplete: 'off'
                        }),
                        React.createElement(
                            'button',
                            { type: 'submit', className: 'zalf-homepage__hero-search-button', 'aria-label': t('zalfTheme.home.searchDatasets', 'Search datasets') },
                            React.createElement(
                                'svg',
                                { className: 'zalf-homepage__hero-search-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
                                React.createElement('path', {
                                    d: 'M10.5 4a6.5 6.5 0 1 0 4.07 11.57l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z',
                                    fill: 'currentColor'
                                })
                            )
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__actions' },
                        React.createElement('a', { className: 'zalf-homepage__button zalf-homepage__button--primary', href: '/catalogue/#/' }, t('zalfTheme.home.exploreDatasets', 'Explore Datasets')),
                        React.createElement('a', { className: 'zalf-homepage__button zalf-homepage__button--secondary', href: '/about' }, t('zalfTheme.home.aboutBonaRes', 'About BonaRes'))
                    )
                )
            )
        ),

        // Steps of publication
        React.createElement(
            'section',
            { className: 'zalf-homepage__section' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                renderSectionHead(t('zalfTheme.home.publishEyebrow', 'How to Publish your Data with us'), t('zalfTheme.home.publishTitle', 'Steps of Publication.')),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__value-grid' },
                    ...valueItems.map(({ title, description }) => React.createElement(
                        'article',
                        { key: title, className: 'zalf-homepage__value-card' },
                        React.createElement('h3', null, title),
                        React.createElement('p', null, description)
                    ))
                )
            )
        ),

        // Highlighted Cases — background images cross-fade (Copernicus pattern),
        // content box stays visible always
        cases.length > 0 ? React.createElement(
            'section',
            { className: 'zalf-homepage__cases-panel' },
            // Stacked background images — only the active one has opacity 1
            React.createElement(
                'div',
                { className: 'zalf-homepage__cases-bg' },
                ...cases.map(({ image_url, tab_label }, index) => React.createElement(
                    'img',
                    {
                        key: tab_label,
                        src: image_url || '',
                        alt: tab_label,
                        className: `zalf-homepage__cases-bg-img${index === activeCase ? ' is-active' : ''}`,
                        'aria-hidden': 'true'
                    }
                ))
            ),
            // Content box — always visible, no fade
            React.createElement(
                'div',
                { className: 'zalf-homepage__cases-inner' },
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__cases-tabs', role: 'tablist', 'aria-label': t('zalfTheme.home.highlightedCases', 'Highlighted cases') },
                    ...cases.map(({ tab_label }, index) => React.createElement(
                        'button',
                        {
                            key: tab_label,
                            type: 'button',
                            role: 'tab',
                            'aria-selected': index === activeCase ? 'true' : 'false',
                            className: `zalf-homepage__cases-tab${index === activeCase ? ' is-active' : ''}`,
                            onClick: () => setActiveCase(index)
                        },
                        tab_label
                    ))
                ),
                currentCase ? React.createElement(
                    'div',
                    { className: 'zalf-homepage__cases-content' },
                    React.createElement('span', { className: 'zalf-homepage__cases-eyebrow' }, currentCase.eyebrow),
                    React.createElement('h3', { className: 'zalf-homepage__cases-title' }, currentCase.title),
                    React.createElement(
                        'a',
                        { className: 'zalf-homepage__button zalf-homepage__button--light', href: currentCase.href },
                        currentCase.button_text
                    )
                ) : null
            )
        ) : loading ? React.createElement('section', { className: 'zalf-homepage__cases-panel zalf-homepage__cases-panel--skeleton' }) : null,

        // Browse by topic
        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--alt' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                renderSectionHead(t('zalfTheme.home.browseByTopic', 'Browse by topic')),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__topic-grid' },
                    ...topicItems.map(({ label, labelId, href }) => React.createElement(
                        'a',
                        { key: label, className: 'zalf-homepage__topic-card', href },
                        React.createElement('span', { className: 'zalf-homepage__topic-label' }, t(labelId, label)),
                        React.createElement('span', { className: 'zalf-homepage__topic-link' }, t('zalfTheme.home.viewTopic', 'View topic'))
                    ))
                )
            )
        ),

        // Spotlight / dynamic banners
        banners.length > 0 ? React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--gallery' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__gallery-shell' },
                renderSectionHead('', false),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__spotlight-shell zalf-homepage__spotlight-shell--panels' },
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__spotlight-stage zalf-homepage__spotlight-stage--panels' },
                        React.createElement(
                            'button',
                            {
                                type: 'button',
                                className: 'zalf-homepage__spotlight-card zalf-homepage__spotlight-card--preview zalf-homepage__spotlight-card--left',
                                'aria-label': `${t('zalfTheme.home.previousSlide', 'Previous slide')}: ${banners[previousSpotlight]?.title}`,
                                onClick: () => setActiveSpotlight((activeSpotlight + banners.length - 1) % banners.length),
                                style: {
                                    backgroundImage: `linear-gradient(180deg, rgba(247, 250, 246, 0.18), rgba(247, 250, 246, 0.4)), url(${banners[previousSpotlight]?.image_url || ''})`
                                }
                            }
                        ),
                        React.createElement(
                            'article',
                            { className: 'zalf-homepage__spotlight-slide zalf-homepage__spotlight-slide--active' },
                            React.createElement(
                                'a',
                                {
                                    className: 'zalf-homepage__spotlight-card zalf-homepage__spotlight-card--active',
                                    href: banners[activeSpotlight]?.href,
                                    style: {
                                        backgroundImage: `linear-gradient(135deg, rgba(5, 19, 35, 0.12), rgba(5, 19, 35, 0.58)), url(${banners[activeSpotlight]?.image_url || ''})`
                                    }
                                },
                                React.createElement(
                                    'div',
                                    { className: 'zalf-homepage__spotlight-content' },
                                    React.createElement(
                                        'div',
                                        { className: 'zalf-homepage__spotlight-footer' },
                                        React.createElement('span', { className: 'zalf-homepage__button zalf-homepage__button--light' }, banners[activeSpotlight]?.button_text),
                                        React.createElement(
                                            'div',
                                            { className: 'zalf-homepage__spotlight-copy' },
                                            React.createElement('span', { className: 'zalf-homepage__spotlight-kicker' }, banners[activeSpotlight]?.kicker),
                                            React.createElement('h3', null, banners[activeSpotlight]?.title),
                                            React.createElement('p', null, banners[activeSpotlight]?.description)
                                        )
                                    )
                                )
                            )
                        ),
                        React.createElement(
                            'button',
                            {
                                type: 'button',
                                className: 'zalf-homepage__spotlight-card zalf-homepage__spotlight-card--preview zalf-homepage__spotlight-card--right',
                                'aria-label': `${t('zalfTheme.home.nextSlide', 'Next slide')}: ${banners[nextSpotlight]?.title}`,
                                onClick: () => setActiveSpotlight((activeSpotlight + 1) % banners.length),
                                style: {
                                    backgroundImage: `linear-gradient(180deg, rgba(247, 250, 246, 0.18), rgba(247, 250, 246, 0.4)), url(${banners[nextSpotlight]?.image_url || ''})`
                                }
                            }
                        )
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__spotlight-dots', role: 'tablist', 'aria-label': t('zalfTheme.home.spotlightPagination', 'Spotlight pagination') },
                    ...banners.map(({ title }, index) => React.createElement(
                        'button',
                        {
                            key: title,
                            type: 'button',
                            role: 'tab',
                            'aria-selected': index === activeSpotlight ? 'true' : 'false',
                            className: `zalf-homepage__spotlight-dot${index === activeSpotlight ? ' is-active' : ''}`,
                            'aria-label': `${t('zalfTheme.home.slide', 'Slide')} ${index + 1}: ${title}`,
                            onClick: () => setActiveSpotlight(index)
                        }
                    ))
                )
            )
        ) : null,

        // Training Resources — published only while there is content (#189).
        // With an empty CMS this used to render a heading over an empty grid, plus
        // four skeleton cards on every load. zalf-rdm/geonode#850 makes /trainings/
        // 404 on the same condition, so these cards and the page they link to stay
        // in step. Adding resources in the CMS brings the section back on its own.
        trainings.length > 0 ? React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--training' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__training-shell' },
                    React.createElement('h2', { className: 'zalf-homepage__training-title' }, t('zalfTheme.home.trainingResources', 'Training Resources')),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__training-grid' },
                        (() => {
                            const sorted = [...trainings].sort((a, b) => b.id - a.id).slice(0, 8);
                            if (sorted.length > 0) {
                                return sorted.map(({ id, title, organizer, duration, thumbnail_url, slug }) => React.createElement(
                                    'a',
                                    { key: id, className: 'zalf-homepage__training-card', href: `/trainings/${slug}/` },
                                    React.createElement(
                                        'div',
                                        {
                                            className: 'zalf-homepage__training-thumb',
                                            style: thumbnail_url ? { backgroundImage: `url(${thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}
                                        }
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'zalf-homepage__training-copy' },
                                        React.createElement('h3', null, title),
                                        React.createElement('span', { className: 'zalf-homepage__training-source' }, organizer),
                                        duration ? React.createElement('span', { className: 'zalf-homepage__training-duration' }, duration) : null
                                    )
                                ));
                            }
                            if (loading) {
                                return [1, 2, 3, 4].map(i => React.createElement('div', { key: i, className: 'zalf-homepage__training-card zalf-homepage__training-card--skeleton' }));
                            }
                            return null;
                        })()
                    ),
                    trainings.length > 8
                        ? React.createElement(
                            'div',
                            { className: 'zalf-homepage__training-footer' },
                            React.createElement('span', { className: 'zalf-homepage__training-rule' }),
                            React.createElement('a', { className: 'zalf-homepage__training-link', href: '/trainings/' }, t('zalfTheme.home.viewAllTrainings', 'View all training resources')),
                            React.createElement('span', { className: 'zalf-homepage__training-rule' })
                        )
                        : null
                )
            )
        ) : null,

        // IDAS Sites
        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--idas' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                React.createElement('h2', { className: 'zalf-homepage__idas-title' }, t('zalfTheme.home.idasTitle', 'Information, Data & Analytics Services (IDAS) Sites')),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__idas-list' },
                    ...idasSites.map(({ name, accent, textColor, descriptionId, description }) => React.createElement(
                        'article',
                        { key: name, className: 'zalf-homepage__idas-row' },
                        React.createElement('span', { className: 'zalf-homepage__idas-badge', style: { backgroundColor: accent } }),
                        React.createElement('h3', { className: 'zalf-homepage__idas-name', style: { color: textColor } }, name),
                        React.createElement('p', { className: 'zalf-homepage__idas-description' }, t(descriptionId, description))
                    ))
                )
            )
        )
    );
}

export default connect((state) => ({
    messages: state?.locale?.messages || {}
}))(Homepage);
