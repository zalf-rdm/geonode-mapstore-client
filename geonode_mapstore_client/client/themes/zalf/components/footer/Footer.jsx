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

const repositoryLinks = [
    { href: '/about', labelId: 'zalfTheme.footer.aboutTheRepository' },
    // /upload is routed to the separate Upload Tool deployment by the ingress.
    { href: '/upload/', labelId: 'zalfTheme.footer.upload' },
    { href: '/ogc_and_api', labelId: 'zalfTheme.footer.apiServices' },
    { href: '/data_policy', labelId: 'zalfTheme.footer.dataPolicy' },
    { href: '/how_to_cite', labelId: 'zalfTheme.footer.howToCite' }
];

const legalLinks = [
    { href: '/imprint', labelId: 'zalfTheme.footer.imprint' },
    { href: '/privacy', labelId: 'zalfTheme.footer.privacyPolicy' }
];

// Certification record for the repository, valid to 2028-06-12.
const CORE_TRUST_SEAL_RECORD = 'https://doi.org/10.34894/YPU0UO';
const ZALF_URL = 'https://www.zalf.de/';

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
                        { className: 'col-12 col-md-4' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.repositoryTitle' })),
                        React.createElement(
                            'p',
                            { className: 'mb-4 fs-7 text-gray-3' },
                            React.createElement(Message, { msgId: 'zalfTheme.footer.repositoryDescription' })
                        ),
                        React.createElement(
                            'nav',
                            { 'aria-label': 'Legal' },
                            React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.legal' })),
                            renderLinkList(legalLinks)
                        )
                    ),
                    React.createElement(
                        'nav',
                        { className: 'col-12 col-md-4', 'aria-label': 'Repository' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.repository' })),
                        renderLinkList(repositoryLinks)
                    ),
                    React.createElement(
                        'div',
                        { className: 'col-12 col-md-4', 'aria-label': 'Certification' },
                        React.createElement('h3', { className: 'fs-5 fw-bold mb-3 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.certification' })),
                        React.createElement(
                            'div',
                            { className: 'text-start text-md-start mb-2' },
                            React.createElement(
                                'a',
                                { href: CORE_TRUST_SEAL_RECORD, target: '_blank', rel: 'noreferrer' },
                                React.createElement('img', {
                                    className: 'img-fluid zalf-footer-logo',
                                    src: logoCoreTrustSealWhite,
                                    alt: 'CoreTrustSeal certification record'
                                })
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: 'text-start text-md-start mb-2' },
                            React.createElement('h4', { className: 'fw-semibold mb-2 fs-7 text-light' }, React.createElement(Message, { msgId: 'zalfTheme.footer.operatedByZalf' })),
                            React.createElement(
                                'a',
                                { href: ZALF_URL, target: '_blank', rel: 'noreferrer' },
                                React.createElement('img', {
                                    className: 'img-fluid zalf-footer-logo',
                                    src: logoZalfWhite,
                                    alt: 'ZALF'
                                })
                            )
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
