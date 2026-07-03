/**
 * CUSTOM PATH: themes/zalf/components/footer/Footer.jsx
 * REASON: custom footer for ZALF catalogue pages, rendered via React portal
 * into the Django-rendered gn-footer-placeholder element so it sits below
 * the full-screen viewer in the normal document flow — visible by scrolling.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import Message from '@mapstore/framework/components/I18N/Message';
import logoCoreTrustSealWhite from '../../../../../static/img/logo_core_trust_seal_white.png';
import logoZalfWhite from '../../../../../static/img/logo_zalf_white.png';
import './footer.css';

const quickLinks = [
    { href: '/about', labelId: 'zalfTheme.footer.about' },
    { href: '/upload', labelId: 'zalfTheme.footer.upload' },
    { href: '/ogc_and_api', labelId: 'zalfTheme.footer.ogcServicesApi' },
    {
        href: 'https://www.zalf.de/en/struktur/cdp/fdm/Pages/default.aspx',
        labelId: 'zalfTheme.footer.researchDataManagement'
    }
];

const resources = [
    { href: '/publications', labelId: 'zalfTheme.footer.publications' },
    { href: '/data_policy', labelId: 'zalfTheme.footer.dataPolicy' },
    { href: '/how_to_cite', labelId: 'zalfTheme.footer.howToCiteUs' },
    { href: '/imprint', labelId: 'zalfTheme.footer.imprint' },
    { href: '/privacy', labelId: 'zalfTheme.footer.privacy' }
];

function renderLinkList(items) {
    return React.createElement(
        'ul',
        { className: 'list-unstyled fs-6 fw-normal m-0' },
        ...items.map(({ href, labelId }) => React.createElement(
            'li',
            { key: `${href}-${labelId}`, className: 'mb-2' },
            React.createElement(
                'a',
                {
                    className: 'link-light text-decoration-none',
                    href,
                    target: href.startsWith('http') ? '_blank' : undefined,
                    rel: href.startsWith('http') ? 'noreferrer' : undefined
                },
                React.createElement(Message, { msgId: labelId })
            )
        ))
    );
}

function FooterBody() {
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
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.repositoryTitle' })),
                        React.createElement(
                            'p',
                            { className: 'mb-0 fs-7 text-gray-3' },
                            React.createElement(Message, { msgId: 'zalfTheme.footer.repositoryDescription' })
                        )
                    ),
                    React.createElement(
                        'nav',
                        { className: 'col-6 col-md-6 col-lg-3', 'aria-label': 'Quick Links' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.quickLinks' })),
                        renderLinkList(quickLinks)
                    ),
                    React.createElement(
                        'nav',
                        { className: 'col-6 col-md-6 col-lg-3', 'aria-label': 'Resources' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.resources' })),
                        renderLinkList(resources)
                    ),
                    React.createElement(
                        'div',
                        { className: 'col-6 col-md-6 col-lg-3', 'aria-label': 'Certified' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.certifiedBy' })),
                        React.createElement(
                            'div',
                            { className: 'text-start text-md-start mb-2' },
                            React.createElement('img', {
                                className: 'img-fluid zalf-footer-logo',
                                src: logoCoreTrustSealWhite,
                                alt: 'Core Trust Seal'
                            })
                        ),
                        React.createElement(
                            'div',
                            { className: 'text-start text-md-start mb-2' },
                            React.createElement('h4', { className: 'fw-semibold mb-2 fs-7 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.poweredBy' })),
                            React.createElement('img', {
                                className: 'img-fluid zalf-footer-logo',
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
                React.createElement(Message, { msgId: 'zalfTheme.footer.copyright' })
            )
        )
    );
}

function Footer() {
    const [portalTarget, setPortalTarget] = React.useState(null);

    React.useEffect(() => {
        // Hide GeoNode's built-in footer
        const gnFooter = document.querySelector('.gn-footer');
        if (gnFooter) gnFooter.style.display = 'none';

        // Use gn-footer-placeholder as the portal target.
        // This element is rendered by Django after #ms-container so it sits
        // naturally below the viewer in the document flow.
        const placeholder = document.querySelector('.gn-footer-placeholder');
        if (placeholder) {
            // GeoNode's resize script sets height = gn-footer.clientHeight (0 since hidden).
            // Clear it so our content can expand the element naturally.
            placeholder.style.height = '';
            setPortalTarget(placeholder);
        }

        // On viewer pages, fix #ms-container to the viewport so the page can
        // scroll past it to reach the footer.
        // body/html cannot be targeted via LESS (build prefixes selectors with
        // .msgapi, making body/html targets invalid), so we set them here.
        if (document.querySelector('.gn-viewer-layout')) {
            document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
            document.documentElement.style.setProperty('height', 'auto', 'important');
            document.body.style.setProperty('overflow-y', 'auto', 'important');
            document.body.style.setProperty('height', 'auto', 'important');
        }
        return () => {
            document.documentElement.style.removeProperty('overflow-y');
            document.documentElement.style.removeProperty('height');
            document.body.style.removeProperty('overflow-y');
            document.body.style.removeProperty('height');
        };
    }, []);

    if (!portalTarget) return null;

    return ReactDOM.createPortal(
        React.createElement(FooterBody, {}),
        portalTarget
    );
}

export default Footer;
