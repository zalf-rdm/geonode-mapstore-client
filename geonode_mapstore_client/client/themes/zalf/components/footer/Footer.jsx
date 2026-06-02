/**
 * REFERENCE BRANCH: main-ui
 * REFERENCE PATH: geonode_mapstore_client/client/js/plugins/Footer.jsx
 * CUSTOM PATH: themes/zalf/components/footer/Footer.jsx
 * REASON: custom footer for ZALF catalogue pages
 */

import React from 'react';
import logoCoreTrustSealWhite from '../../../../../static/img/logo_core_trust_seal_white.png';
import logoZalfWhite from '../../../../../static/img/logo_zalf_white.png';
import './footer.css';

const quickLinks = [
    { href: '/about', label: 'About' },
    { href: '/upload', label: 'Upload' },
    { href: '/ogc_and_api', label: 'OGC Services and API' },
    {
        href: 'https://www.zalf.de/en/struktur/cdp/fdm/Pages/default.aspx',
        label: 'Research Data Management'
    }
];

const resources = [
    { href: '/publications', label: 'Publications' },
    { href: '/data_policy', label: 'Data Policy' },
    { href: '/how_to_cite', label: 'How to Cite Us' },
    { href: '/imprint', label: 'Imprint' },
    { href: '/privacy', label: 'Privacy' }
];

function renderLinkList(items) {
    return React.createElement(
        'ul',
        { className: 'list-unstyled fs-6 fw-normal m-0' },
        ...items.map(({ href, label }) => React.createElement(
            'li',
            { key: label, className: 'mb-2' },
            React.createElement(
                'a',
                {
                    className: 'link-light text-decoration-none',
                    href,
                    target: href.startsWith('http') ? '_blank' : undefined,
                    rel: href.startsWith('http') ? 'noreferrer' : undefined
                },
                label
            )
        ))
    );
}

function Footer() {
    React.useEffect(() => {
        const footer = document.querySelector('.gn-footer');
        const footerPlaceholder = document.querySelector('.gn-footer-placeholder');
        if (footer) {
            footer.style.display = 'none';
        }
        if (footerPlaceholder) {
            footerPlaceholder.style.display = 'none';
        }
    }, []);

    return React.createElement(
        'div',
        { className: 'ms-footer zalf-footer-shell' },
        React.createElement(
            'footer',
            { className: 'footer font-inter bg-dark text-white py-5', role: 'contentinfo' },
            React.createElement(
                'div',
                { className: 'container pb-5' },
                React.createElement(
                    'div',
                    { className: 'row gy-4 text-start text-md-start' },
                    React.createElement(
                        'div',
                        { className: 'col-6 col-md-6 col-lg-3' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, 'BonaRes Repository'),
                        React.createElement(
                            'p',
                            { className: 'mb-0 fs-7 text-gray-3' },
                            'Discover, visualize, and share high-quality datasets powering open science, policy, and innovation.'
                        )
                    ),
                    React.createElement(
                        'nav',
                        { className: 'col-6 col-md-6 col-lg-3', 'aria-label': 'Quick Links' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, 'Quick Links'),
                        renderLinkList(quickLinks)
                    ),
                    React.createElement(
                        'nav',
                        { className: 'col-6 col-md-6 col-lg-3', 'aria-label': 'Resources' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, 'Resources'),
                        renderLinkList(resources)
                    ),
                    React.createElement(
                        'div',
                        { className: 'col-6 col-md-6 col-lg-3', 'aria-label': 'Certified' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, 'Certified By'),
                        React.createElement(
                            'div',
                            { className: 'text-start text-md-start mb-2' },
                            React.createElement('img', {
                                className: 'img-fluid mx-auto mx-md-0 zalf-footer-logo',
                                src: logoCoreTrustSealWhite,
                                alt: 'Core Trust Seal'
                            })
                        ),
                        React.createElement(
                            'div',
                            { className: 'text-start text-md-start mb-2' },
                            React.createElement('h4', { className: 'fw-semibold mb-2 fs-7 text-light' }, 'Powered by'),
                            React.createElement('img', {
                                className: 'img-fluid mx-auto mx-md-0 zalf-footer-logo',
                                src: logoZalfWhite,
                                alt: 'ZALF'
                            })
                        )
                    )
                )
            ),
            React.createElement(
                'div',
                { className: 'fs-6 border-top border-gray mt-5 pt-4 text-center text-gray-3' },
                'BonaRes Repository'
            )
        )
    );
}

export default Footer;
