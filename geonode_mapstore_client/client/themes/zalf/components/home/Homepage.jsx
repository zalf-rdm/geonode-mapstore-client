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
        image: '/static/mapstore/img/s2cloudless.png'
    },
    {
        kicker: 'Campaign card',
        title: 'Promote a thematic climate collection',
        description: 'This can point to a custom page, a filtered catalogue view, or a fully editorial landing page.',
        button: 'View collection',
        href: '/catalogue/#/?q=climate',
        image: '/static/mapstore/img/s2cloudless.png'
    },
    {
        kicker: 'Announcement card',
        title: 'Surface updates, calls, and repository news',
        description: 'The design supports any number of cards, with automatic sliding and manual navigation.',
        button: 'Learn more',
        href: '/catalogue/#/?q=water',
        image: '/static/mapstore/img/s2cloudless.png'
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

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveSpotlight((current) => (current + 1) % spotlightItems.length);
        }, 6000);
        return () => window.clearInterval(timer);
    }, []);

    const currentCase = highlightedCases[activeCase];

    return React.createElement(
        'main',
        { className: 'zalf-homepage' },

        React.createElement(
            'section',
            { className: 'zalf-homepage__section zalf-homepage__hero' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container zalf-homepage__hero-grid' },
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__hero-copy' },
                    React.createElement('span', { className: 'zalf-homepage__eyebrow' }, 'Research data platform'),
                    React.createElement('h1', { className: 'zalf-homepage__title' }, 'BonaRes Repository'),
                    React.createElement(
                        'p',
                        { className: 'zalf-homepage__description' },
                        'This new homepage is structured in five sections so the catalogue can evolve into a proper front door for data, collections, and editorial content.'
                    ),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__actions' },
                        React.createElement('a', { className: 'zalf-homepage__button zalf-homepage__button--primary', href: '/catalogue/#/' }, 'Explore data'),
                        React.createElement('a', { className: 'zalf-homepage__button zalf-homepage__button--secondary', href: '/upload' }, 'Submit a Dataset')
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__hero-panel' },
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__hero-stat' },
                        React.createElement('span', { className: 'zalf-homepage__hero-stat-value' }, '01'),
                        React.createElement('span', { className: 'zalf-homepage__hero-stat-label' }, 'Curated discovery paths')
                    ),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__hero-stat' },
                        React.createElement('span', { className: 'zalf-homepage__hero-stat-value' }, '02'),
                        React.createElement('span', { className: 'zalf-homepage__hero-stat-label' }, 'Interoperable metadata and services')
                    ),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__hero-stat' },
                        React.createElement('span', { className: 'zalf-homepage__hero-stat-value' }, '03'),
                        React.createElement('span', { className: 'zalf-homepage__hero-stat-label' }, 'Reusable research outputs')
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
                    'Section 02',
                    'Why this homepage structure works',
                    'These cards explain the architectural intent behind the custom homepage and keep the messaging aligned with product goals.'
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
                renderSectionHead('Section 04', 'Browse by topic'),
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
            { className: 'zalf-homepage__section zalf-homepage__section--dark' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                renderSectionHead(
                    'Section 06',
                    'Dynamic spotlight cards',
                    'This carousel is the foundation for the Apple-style editorial section you described: image, phrase, button, link, and unlimited items managed later by an admin workflow.',
                    true
                ),
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__spotlight-shell' },
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'zalf-homepage__spotlight-arrow',
                            'aria-label': 'Previous slide',
                            onClick: () => setActiveSpotlight((activeSpotlight + spotlightItems.length - 1) % spotlightItems.length)
                        },
                        '‹'
                    ),
                    React.createElement(
                        'div',
                        { className: 'zalf-homepage__spotlight-stage' },
                        React.createElement(
                            'div',
                            {
                                className: 'zalf-homepage__spotlight-track',
                                style: { transform: `translateX(-${activeSpotlight * 100}%)` }
                            },
                            ...spotlightItems.map(({ kicker, title, description, button, href, image }) => React.createElement(
                                'article',
                                { key: title, className: 'zalf-homepage__spotlight-slide' },
                                React.createElement(
                                    'a',
                                    {
                                        className: 'zalf-homepage__spotlight-card',
                                        href,
                                        style: {
                                            backgroundImage: `linear-gradient(135deg, rgba(5, 19, 35, 0.2), rgba(5, 19, 35, 0.82)), url(${image})`
                                        }
                                    },
                                    React.createElement(
                                        'div',
                                        { className: 'zalf-homepage__spotlight-content' },
                                        React.createElement('span', { className: 'zalf-homepage__spotlight-kicker' }, kicker),
                                        React.createElement('h3', null, title),
                                        React.createElement('p', null, description),
                                        React.createElement('span', { className: 'zalf-homepage__button zalf-homepage__button--light' }, button)
                                    )
                                )
                            ))
                        )
                    ),
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'zalf-homepage__spotlight-arrow',
                            'aria-label': 'Next slide',
                            onClick: () => setActiveSpotlight((activeSpotlight + 1) % spotlightItems.length)
                        },
                        '›'
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
        )
    );
}

export default Homepage;
