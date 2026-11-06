/**
 * CUSTOM PATH: themes/zalf/components/home/Homepage.jsx
 * REASON: custom homepage layout for ZALF catalogue route
 */

import React from 'react';
import { connect } from 'react-redux';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TOPICS_URL, localizeTopicName, selectTopics } from '../../utils/TopicUtils';
import { SECTIONS_URL, DEFAULT_SECTION_ORDER, selectSectionOrder } from '../../utils/SectionUtils';
import TopicIcon from '../common/TopicIcon';
import './homepage.css';

gsap.registerPlugin(ScrollTrigger);

// Photo: Yulian Alexeyev (Unsplash), resized to 1920px WebP (was a 4.9 MB JPEG).
const heroBackground = '/static/img/home-hero.webp';

function useCmsData() {
    const [cases, setCases] = React.useState([]);
    const [trainings, setTrainings] = React.useState([]);
    const [banners, setBanners] = React.useState([]);
    const [topics, setTopics] = React.useState([]);
    // Start from the historical order so the first paint matches the seeded
    // configuration even before the request resolves.
    const [sectionOrder, setSectionOrder] = React.useState(DEFAULT_SECTION_ORDER);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        Promise.all([
            fetch('/api/v2/cms/cases/').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/v2/cms/trainings/').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/v2/cms/banners/').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(TOPICS_URL).then(r => r.ok ? r.json() : []).catch(() => []),
            // null, not [], on failure: selectSectionOrder treats an empty
            // array as "the admin hid every section" and must not fall back.
            fetch(SECTIONS_URL).then(r => r.ok ? r.json() : null).catch(() => null)
        ]).then(([c, t, b, p, s]) => {
            // Staff users receive inactive records too so the CMS can manage
            // them. Public-facing pages must never render those records.
            const activeOnly = (items) => Array.isArray(items)
                ? items.filter((item) => item.is_active !== false)
                : [];
            setCases(activeOnly(c));
            setTrainings(activeOnly(t));
            setBanners(activeOnly(b));
            // selectTopics also drops topics the CMS marked navbar-only, and
            // applies the configured display order.
            setTopics(selectTopics(p, 'homepage'));
            setSectionOrder(selectSectionOrder(s));
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return { cases, banners, trainings, topics, sectionOrder, loading };
}

// getMessageById returns the id itself when a message is missing, so fall back explicitly.
function translate(messages, id, fallback) {
    const message = getMessageById(messages, id);
    return message && message !== id ? message : fallback;
}

function Homepage({ messages = {}, currentLocale = 'en-US' }) {
    const t = (id, fallback) => translate(messages, id, fallback);
    const [activeCase, setActiveCase] = React.useState(0);
    const [activeSpotlight, setActiveSpotlight] = React.useState(0);
    const [heroQuery, setHeroQuery] = React.useState('');

    const { cases, banners, trainings, topics, sectionOrder, loading } = useCmsData();

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

    React.useEffect(() => {
        if (banners.length === 0) {
            return () => {};
        }
        const timer = window.setInterval(() => {
            setActiveSpotlight((current) => (current + 1) % banners.length);
        }, 6000);
        return () => window.clearInterval(timer);
    }, [banners.length]);

    const spotlightCount = banners.length;
    const previousSpotlight = spotlightCount > 0 ? (activeSpotlight + spotlightCount - 1) % spotlightCount : 0;
    const nextSpotlight = spotlightCount > 0 ? (activeSpotlight + 1) % spotlightCount : 0;

    const currentCase = cases[activeCase] || null;

    // Hero — static chrome, always first and not reorderable.
    const hero = React.createElement(
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
                React.createElement('span', { className: 'zalf-homepage__eyebrow' }, t('zalfTheme.home.heroEyebrow', 'Discover and share soil and agricultural research data')),
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
                    React.createElement('a', { className: 'zalf-homepage__button zalf-homepage__button--primary', href: '/catalogue/#/' }, t('zalfTheme.home.exploreDatasets', 'Explore Datasets'))
                )
            )
        )
    );

    // Each CMS-driven section, keyed so the order below can place it. A section
    // still disappears on its own when it has no content; `sectionOrder` is the
    // admin's ordering and visibility choice on top of that.
    const sectionElements = {
        // Highlighted Cases — background images cross-fade (Copernicus pattern),
        // content box stays visible always
        cases: cases.length > 0 ? React.createElement(
            'section',
            { key: 'cases', className: 'zalf-homepage__cases-panel' },
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
                    { className: 'zalf-homepage__cases-tabs', role: 'tablist', 'aria-label': t('zalfTheme.home.highlightedCases', 'Highlighted Datasets') },
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
        ) : loading ? React.createElement('section', { key: 'cases', className: 'zalf-homepage__cases-panel zalf-homepage__cases-panel--skeleton' }) : null,

        // Browse by topic — CMS content (zalf-rdm/geonode#863). Published only
        // while there is content, like the training section below: with no
        // topics this would otherwise be a heading over an empty grid. The href
        // is always the one the server computed, so the link a visitor follows
        // is the same string the navbar uses.
        topics: topics.length > 0 ? React.createElement(
            'section',
            { key: 'topics', className: 'zalf-homepage__section' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__container' },
                // No section heading and no per-card call to action: the cards
                // name their own topic, so both were redundant chrome.
                React.createElement(
                    'div',
                    { className: 'zalf-homepage__topic-grid' },
                    // The whole tile is the link, so there is no inner call
                    // to action to miss. A CMS thumbnail, when there is one,
                    // takes the icon's place rather than stacking above it, so
                    // a tile is always an image-or-glyph plus its label.
                    ...topics.map((topic) => React.createElement(
                        'a',
                        {
                            key: topic.id,
                            className: 'zalf-homepage__topic-card',
                            href: topic.catalogue_href,
                            // The label is clamped to two lines, so a long
                            // topic name is only fully readable here.
                            title: localizeTopicName(topic, currentLocale)
                        },
                        topic.image_url ? React.createElement('img', {
                            className: 'zalf-homepage__topic-image',
                            src: topic.image_url,
                            // Decorative: the label right below names the topic.
                            alt: '',
                            loading: 'lazy'
                        }) : React.createElement(TopicIcon, {
                            name: topic.icon,
                            className: 'zalf-homepage__topic-icon'
                        }),
                        React.createElement('span', { className: 'zalf-homepage__topic-label' }, localizeTopicName(topic, currentLocale))
                    ))
                )
            )
        ) : null,

        // Spotlight / dynamic banners — restored from commit 09f2524d0, which
        // removed the section while leaving the model, API, CMS tab and CSS in
        // place. It is now an ordinary CMS section like the others.
        banners: banners.length > 0 ? React.createElement(
            'section',
            { key: 'banners', className: 'zalf-homepage__section zalf-homepage__section--gallery' },
            React.createElement(
                'div',
                { className: 'zalf-homepage__gallery-shell' },
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
        trainings: trainings.length > 0 ? React.createElement(
            'section',
            { key: 'trainings', className: 'zalf-homepage__section zalf-homepage__section--training' },
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
        ) : null
    };

    return React.createElement(
        'main',
        { className: 'zalf-homepage' },
        hero,
        // The admin's order, from the CMS. Unknown keys are ignored so a section
        // removed from the code cannot break the page.
        ...sectionOrder.map((key) => sectionElements[key] || null)
    );
}

export default connect((state) => ({
    messages: state?.locale?.messages || {},
    // The label is resolved here rather than server-side: MapStore switches
    // locale without a page reload, so state.locale.current is the locale the
    // page is actually rendered in.
    currentLocale: state?.locale?.current || 'en-US'
}))(Homepage);
