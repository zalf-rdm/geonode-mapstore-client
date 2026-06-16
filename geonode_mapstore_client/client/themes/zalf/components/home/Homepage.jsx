/**
 * CUSTOM PATH: themes/zalf/components/home/Homepage.jsx
 * REASON: custom homepage layout for ZALF catalogue route
 */

import React from 'react';
import './homepage.css';

const topicItems = [
    { label: 'Animals', href: '/catalogue/#/?q=Animals' },
    { label: 'Atmosphere', href: '/catalogue/#/?q=Atmosphere' },
    { label: 'Climate', href: '/catalogue/#/?q=Climate' },
    { label: 'Forest', href: '/catalogue/#/?q=Forest' },
    { label: 'Hydrology', href: '/catalogue/#/?q=Hydrology' },
    { label: 'Landscape', href: '/catalogue/#/?q=Landscape' },
    { label: 'Plants', href: '/catalogue/#/?q=Plants' },
    { label: 'Soil Profiles', href: '/catalogue/#/?q=Soil%20Profiles' }
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

const highlightedCases = [
    {
        tabLabel: 'Soil Health',
        eyebrow: 'HIGHLIGHTED CASE',
        title: 'Track soil health patterns across curated agricultural datasets.',
        button: 'View case',
        href: '/catalogue/#/?q=Soil%20Profiles',
        image: '/static/img/photo-1715766911065-83723bc00d2f-unsplash.avif'
    },
    {
        tabLabel: 'Climate Signals',
        eyebrow: 'HIGHLIGHTED CASE',
        title: 'Connect climate indicators with discoverable long-term observation records.',
        button: 'View case',
        href: '/catalogue/#/?q=Climate',
        image: '/static/img/photo-1582033665011-60ccbb964168-unsplash.avif'
    },
    {
        tabLabel: 'Hydrology',
        eyebrow: 'HIGHLIGHTED CASE',
        title: 'Surface water, field monitoring, and hydrology collections in one focused entry point.',
        button: 'View case',
        href: '/catalogue/#/?q=Hydrology',
        image: '/static/img/photo-1437482078695-73f5ca6c96e2-unsplash.avif'
    },
    {
        tabLabel: 'Land Use',
        eyebrow: 'HIGHLIGHTED CASE',
        title: 'Highlight land use transitions and landscape data with an editorial presentation.',
        button: 'View case',
        href: '/catalogue/#/?q=Landscape',
        image: '/static/img/photo-1471289660181-7feae98d61ae-unsplash.avif'
    },
    {
        tabLabel: 'Biodiversity',
        eyebrow: 'HIGHLIGHTED CASE',
        title: 'Feature biodiversity-related records through a guided, visual discovery experience.',
        button: 'View case',
        href: '/catalogue/#/?q=Animals',
        image: '/static/img/photo-1691183213834-3b182d3f01ff-unsplash.avif'
    }
];

const workflowItems = [
    {
        title: 'Discover',
        description: 'Guide users into the catalogue with strong entry points and topic-led navigation.'
    },
    {
        title: 'Understand',
        description: 'Add contextual blocks that explain collections, quality, provenance, and expected usage.'
    },
    {
        title: 'Promote',
        description: 'Feature campaigns, announcements, and editorial stories in reusable spotlight cards.'
    }
];

const spotlightItems = [
    {
        kicker: 'Editorial card',
        title: 'Highlight a featured soil data story',
        description: 'Use this format for a large visual card with one message, one destination, and strong editorial emphasis.',
        button: 'Open story',
        href: '/catalogue/#/?q=soil',
        image: '/static/img/photo-1715766911065-83723bc00d2f-unsplash.avif'
    },
    {
        kicker: 'Campaign card',
        title: 'Promote a thematic climate collection',
        description: 'This can point to a custom page, a filtered catalogue view, or a fully editorial landing page.',
        button: 'View collection',
        href: '/catalogue/#/?q=climate',
        image: '/static/img/photo-1582033665011-60ccbb964168-unsplash.avif'
    },
    {
        kicker: 'Announcement card',
        title: 'Surface updates, calls, and repository news',
        description: 'The design supports any number of cards, with automatic sliding and manual navigation.',
        button: 'Learn more',
        href: '/catalogue/#/?q=water',
        image: '/static/img/photo-1471289660181-7feae98d61ae-unsplash.avif'
    }
];

const heroBackground = '/static/img/yulian-alexeyev-xDLEUTWCZdc-unsplash.jpg';

const trainingResources = [
    {
        title: 'How to make your Data FAIR 101',
        source: 'ZALF RDM'
    },
    {
        title: 'Data Quality Dimensions',
        source: 'Leibniz Hannover University'
    },
    {
        title: 'Creating a KA6 Soil Dataset',
        source: 'Leibniz Hannover University'
    },
    {
        title: 'Connecting WFS/WMS Services in QGIS',
        source: 'Geosolutions'
    }
];

const idasSites = [
    {
        name: 'ZALF.DE',
        href: 'https://www.zalf.de/',
        accent: '#a5b600',
        description:
            'ZALF is the Leibniz Centre for Agricultural Landscape Research. It develops solutions for economically, environmentally, and socially sustainable agriculture together with society, with a strong focus on agricultural landscapes and long-term research.'
    },
    {
        name: 'BONARES.DE',
        href: 'https://www.bonares.de/',
        accent: '#5db600',
        description:
            'BonaRes is a free repository for soil, agricultural, and ecology-related research data. It helps researchers publish, find, preserve, and reuse data, including long-term field experiments and their metadata.'
    },
    {
        name: 'FAIRAGRO.NET',
        href: 'https://fairagro.net/en/',
        accent: '#78c13b',
        description:
            'FAIRagro builds FAIR research data infrastructure for agricultural systems research. It focuses on interoperable tools, workflows, and services that support open, collaborative data management across the community.'
    }
];

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

function Homepage() {
    const [activeSpotlight, setActiveSpotlight] = React.useState(0);
    const [activeCase, setActiveCase] = React.useState(0);
    const [heroQuery, setHeroQuery] = React.useState('');

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveSpotlight((current) => (current + 1) % spotlightItems.length);
        }, 6000);
        return () => window.clearInterval(timer);
    }, []);

    const handleHeroSearchSubmit = (event) => {
        event.preventDefault();
        const query = heroQuery.trim();
        const target = query ? `/catalogue/#/?q=${encodeURIComponent(query)}` : '/catalogue/#/';
        window.location.href = target;
    };

    const currentCase = highlightedCases[activeCase];
    const spotlightCount = spotlightItems.length;
    const previousSpotlight = (activeSpotlight + spotlightCount - 1) % spotlightCount;
    const nextSpotlight = (activeSpotlight + 1) % spotlightCount;

    return React.createElement(
        'main',
        { className: 'zalf-homepage' },

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
                    React.createElement('span', { className: 'zalf-homepage__eyebrow' }, 'The global hub for agricultural data'),
                    React.createElement('h1', { className: 'zalf-homepage__title' }, 'BonaRes Repository'),
                    React.createElement(
                        'form',
                        { className: 'zalf-homepage__hero-search', onSubmit: handleHeroSearchSubmit, role: 'search' },
                        React.createElement('label', { className: 'zalf-homepage__sr-only', htmlFor: 'zalf-homepage-hero-search' }, 'Search datasets'),
                        React.createElement('input', {
                            id: 'zalf-homepage-hero-search',
                            className: 'zalf-homepage__hero-search-input',
                            type: 'search',
                            value: heroQuery,
                            onChange: (event) => setHeroQuery(event.target.value),
                            placeholder: 'What type of agricultural data are you searching for?',
                            autoComplete: 'off'
                        }),
                        React.createElement(
                            'button',
                            {
                                type: 'submit',
                                className: 'zalf-homepage__hero-search-button',
                                'aria-label': 'Search datasets'
                            },
                            React.createElement(
                                'svg',
                                {
                                    className: 'zalf-homepage__hero-search-icon',
                                    viewBox: '0 0 24 24',
                                    'aria-hidden': 'true'
                                },
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
                        React.createElement('a', { className: 'zalf-homepage__button zalf-homepage__button--primary', href: '/catalogue/#/' }, 'Explore Datasets'),
                        React.createElement('a', { className: 'zalf-homepage__button zalf-homepage__button--secondary', href: '/about' }, 'About BonaRes')
                    )
                )
            )
        ),

        React.createElement(
            'section',
            { className: 'zalf-homepage__section' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                renderSectionHead(
                    'How to Publish your Data with us',
                    'Steps of Publication.'
                ),
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

        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--cases' },
            React.createElement(
                React.Fragment,
                null,
                React.createElement(
                    'div',
                    {
                        className: 'zalf-homepage__cases-panel',
                        style: {
                            backgroundImage: `linear-gradient(135deg, rgba(8, 49, 39, 0.10), rgba(8, 49, 39, 0.38)), url(${currentCase.image})`
                        }
                    },
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__cases-inner' },
                        React.createElement(
                            'div',
                            { className: 'zalf-homepage__cases-tabs', role: 'tablist', 'aria-label': 'Highlighted cases' },
                            ...highlightedCases.map(({ tabLabel }, index) => React.createElement(
                                'button',
                                {
                                    key: tabLabel,
                                    type: 'button',
                                    role: 'tab',
                                    'aria-selected': index === activeCase ? 'true' : 'false',
                                    className: `zalf-homepage__cases-tab${index === activeCase ? ' is-active' : ''}`,
                                    onClick: () => setActiveCase(index)
                                },
                                tabLabel
                            ))
                        ),
                        React.createElement(
                            'div',
                            { className: 'zalf-homepage__cases-content' },
                            React.createElement('span', { className: 'zalf-homepage__cases-eyebrow' }, currentCase.eyebrow),
                            React.createElement('h3', { className: 'zalf-homepage__cases-title' }, currentCase.title),
                            React.createElement(
                                'a',
                                { className: 'zalf-homepage__button zalf-homepage__button--light', href: currentCase.href },
                                currentCase.button
                            )
                        )
                    )
                )
            )
        ),

        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--alt' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                renderSectionHead('Browse by topic'),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__topic-grid' },
                    ...topicItems.map(({ label, href }) => React.createElement(
                        'a',
                        { key: label, className: 'zalf-homepage__topic-card', href },
                        React.createElement('span', { className: 'zalf-homepage__topic-label' }, label),
                        React.createElement('span', { className: 'zalf-homepage__topic-link' }, 'View topic')
                    ))
                )
            )
        ),

        React.createElement(
            'section',
            { className: 'zalf-homepage__section' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                renderSectionHead(
                    'Section 05',
                    'A clear path from discovery to reuse',
                    'This section can later connect to real catalogue flows, editorial pages, and submission guidance.'
                ),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__workflow-grid' },
                    ...workflowItems.map(({ title, description }, index) => React.createElement(
                        'article',
                        { key: title, className: 'zalf-homepage__workflow-card' },
                        React.createElement('span', { className: 'zalf-homepage__workflow-index' }, `0${index + 1}`),
                        React.createElement('h3', null, title),
                        React.createElement('p', null, description)
                    ))
                )
            )
        ),

        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--gallery' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__gallery-shell' },
                renderSectionHead(
                    '',
                    false
                ),
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
                                'aria-label': `Previous slide: ${spotlightItems[previousSpotlight].title}`,
                                onClick: () => setActiveSpotlight((activeSpotlight + spotlightItems.length - 1) % spotlightItems.length),
                                style: {
                                    backgroundImage: `linear-gradient(180deg, rgba(247, 250, 246, 0.18), rgba(247, 250, 246, 0.4)), url(${spotlightItems[previousSpotlight].image})`
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
                                    href: spotlightItems[activeSpotlight].href,
                                    style: {
                                        backgroundImage: `linear-gradient(135deg, rgba(5, 19, 35, 0.12), rgba(5, 19, 35, 0.58)), url(${spotlightItems[activeSpotlight].image})`
                                    }
                                },
                                React.createElement(
                                    'div',
                                    { className: 'zalf-homepage__spotlight-content' },
                                    React.createElement(
                                        'div',
                                        { className: 'zalf-homepage__spotlight-footer' },
                                        React.createElement('span', { className: 'zalf-homepage__button zalf-homepage__button--light' }, spotlightItems[activeSpotlight].button),
                                        React.createElement(
                                            'div',
                                            { className: 'zalf-homepage__spotlight-copy' },
                                            React.createElement('span', { className: 'zalf-homepage__spotlight-kicker' }, spotlightItems[activeSpotlight].kicker),
                                            React.createElement('h3', null, spotlightItems[activeSpotlight].title),
                                            React.createElement('p', null, spotlightItems[activeSpotlight].description)
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
                                'aria-label': `Next slide: ${spotlightItems[nextSpotlight].title}`,
                                onClick: () => setActiveSpotlight((activeSpotlight + 1) % spotlightItems.length),
                                style: {
                                    backgroundImage: `linear-gradient(180deg, rgba(247, 250, 246, 0.18), rgba(247, 250, 246, 0.4)), url(${spotlightItems[nextSpotlight].image})`
                                }
                            }
                        )
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__spotlight-dots', role: 'tablist', 'aria-label': 'Spotlight pagination' },
                    ...spotlightItems.map(({ title }, index) => React.createElement(
                        'button',
                        {
                            key: title,
                            type: 'button',
                            role: 'tab',
                            'aria-selected': index === activeSpotlight ? 'true' : 'false',
                            className: `zalf-homepage__spotlight-dot${index === activeSpotlight ? ' is-active' : ''}`,
                            onClick: () => setActiveSpotlight(index)
                        }
                    ))
                ),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__spotlight-note' },
                    React.createElement('strong', null, 'Next phase:'),
                    ' replace the local spotlight array with an admin-managed source and keep the same card schema.'
                )
            )
        ),

        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--training' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__training-shell' },
                    React.createElement('h2', { className: 'zalf-homepage__training-title' }, 'Training Resources'),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__training-grid' },
                        ...trainingResources.map(({ title, source }) => React.createElement(
                            'article',
                            { key: title, className: 'zalf-homepage__training-card' },
                            React.createElement('div', { className: 'zalf-homepage__training-thumb' }),
                            React.createElement(
                                'div',
                                { className: 'zalf-homepage__training-copy' },
                                React.createElement('h3', null, title),
                                React.createElement('span', { className: 'zalf-homepage__training-source' }, source)
                            )
                        ))
                    ),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__training-footer' },
                        React.createElement('span', { className: 'zalf-homepage__training-rule' }),
                        React.createElement('a', { className: 'zalf-homepage__training-link', href: '/about' }, 'Click here for more trainings'),
                        React.createElement('span', { className: 'zalf-homepage__training-rule' })
                    )
                )
            )
        ),

        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__section--idas' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                React.createElement('h2', { className: 'zalf-homepage__idas-title' }, 'Information, Data & Analytics Services(IDAS) Sites'),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__idas-list' },
                    ...idasSites.map(({ name, accent, description }) => React.createElement(
                        'article',
                        { key: name, className: 'zalf-homepage__idas-row' },
                        React.createElement('span', { className: 'zalf-homepage__idas-badge', style: { backgroundColor: accent } }),
                        React.createElement('h3', { className: 'zalf-homepage__idas-name' }, name),
                        React.createElement('p', { className: 'zalf-homepage__idas-description' }, description)
                    ))
                )
            )
        )
    );
}

export default Homepage;
