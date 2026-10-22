/**
 * REFERENCE BRANCH: main-ui
 * REFERENCE PATH: geonode_mapstore_client/templates/geonode-mapstore-client/snippets/brand_navbar.html
 * CUSTOM PATH: themes/zalf/components/navigation/Navigation.jsx
 * REASON: custom homepage navigation for the ZALF theme
 */

import React from 'react';
import { connect } from 'react-redux';
import Message from '@mapstore/framework/components/I18N/Message';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import logoZalfMark from '../../../../../static/img/logo_zalf_white_mark.png';

const navigationItems = [
    { href: '/catalogue/', labelId: 'zalfTheme.nav.allData' },
    {
        key: 'topics',
        labelId: 'zalfTheme.nav.topics',
        children: [
            { href: '/catalogue/#/?q=Animals', labelId: 'zalfTheme.topic.animals' },
            { href: '/catalogue/#/?q=Atmosphere', labelId: 'zalfTheme.topic.atmosphere' },
            { href: '/catalogue/#/?q=Climate', labelId: 'zalfTheme.topic.climate' },
            { href: '/catalogue/#/?q=Forest', labelId: 'zalfTheme.topic.forest' },
            { href: '/catalogue/#/?q=Hydrology', labelId: 'zalfTheme.topic.hydrology' },
            { href: '/catalogue/#/?q=Landscape', labelId: 'zalfTheme.topic.landscape' },
            // The query stays "Long Term Field Experiment" — that is what the
            // catalogue matches; only the label was renamed.
            { href: '/catalogue/#/?q=Long%20Term%20Field%20Experiment', labelId: 'zalfTheme.topic.longTermExperiments' },
            { href: '/catalogue/#/?q=Plants', labelId: 'zalfTheme.topic.plants' },
            { href: '/catalogue/#/?q=Soil%20Profiles', labelId: 'zalfTheme.topic.soilProfiles' },
            { href: '/catalogue/#/?q=Water', labelId: 'zalfTheme.topic.water' }
        ],
        wide: true
    },
    {
        key: 'tools',
        labelId: 'zalfTheme.nav.tools',
        children: [
            { href: 'https://tools.bonares.de/ltfe/', labelId: 'zalfTheme.nav.lteMap', external: true },
            { href: 'https://tools.bonares.de/bp_db/', labelId: 'zalfTheme.nav.soilProfiles', external: true },
            { href: 'https://dqkit.bonares.de/', labelId: 'zalfTheme.nav.dqKit', external: true }
        ]
    },
    // Temporary submission page (zalf-rdm/geonode#867). Not /upload/: the ingress
    // routes that prefix to the separate Upload Tool deployment.
    { href: '/submit_data/', labelId: 'zalfTheme.nav.submitData' },
    // Resources and About merged into one menu (zalf-rdm/geonode#864): six entries
    // across two dropdowns, and the extra toggle widened a bar that is already
    // tight in German. The separator keeps the two halves scannable.
    {
        key: 'information',
        labelId: 'zalfTheme.nav.information',
        children: [
            { href: '/about/', labelId: 'zalfTheme.nav.aboutTheRepository' },
            { href: '/faq/', labelId: 'zalfTheme.nav.faq' },
            // Not /account/login/: repository_sso redirects that straight to
            // Keycloak, skipping the explanation entirely.
            { href: '/what_is_orcid/', labelId: 'zalfTheme.nav.whatIsOrcid' },
            { separator: true },
            { href: '/publications/', labelId: 'zalfTheme.nav.publications' },
            { href: '/data_policy/', labelId: 'zalfTheme.nav.dataPolicy' },
            { href: '/how_to_cite/', labelId: 'zalfTheme.nav.howToCiteData' }
        ]
    }
];

function isActiveLink(href, currentUrl) {
    if (!currentUrl) {
        return false;
    }
    return currentUrl.pathname + currentUrl.hash === href || currentUrl.pathname === href;
}

function getItemKey(item) {
    return item.key || item.labelId || item.label || item.href;
}

function renderLabel(item) {
    if (item.labelId) {
        return React.createElement(Message, { msgId: item.labelId, msgParams: item.msgParams });
    }
    return item.label;
}

// getMessageById returns the id itself when a message is missing, so fall back explicitly.
function translate(messages, id, fallback) {
    const message = getMessageById(messages, id);
    return message && message !== id ? message : fallback;
}

function Navigation({ messages }) {
    const hasServerNavigation = typeof document !== 'undefined'
        && document.querySelector('.zalf-navigation-shell[data-zalf-source="server"]');
    if (hasServerNavigation) {
        return null;
    }

    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [openDropdown, setOpenDropdown] = React.useState(null);
    const [currentUrl, setCurrentUrl] = React.useState(() => ({
        pathname: window.location.pathname,
        hash: window.location.hash || ''
    }));
    const searchSlotRef = React.useRef(null);
    const utilitiesSlotRef = React.useRef(null);

    React.useEffect(() => {
        const mainHeader = document.querySelector('.gn-main-header');
        const mainHeaderPlaceholder = document.querySelector('.gn-main-header-placeholder');
        const bottomNavbar = document.querySelector('#gn-brand-navbar-bottom');
        const searchBar = document.querySelector('#gn-search-bar');
        const utilitiesMenu = document.querySelector('.gn-brand-navbar-right-menu-container');
        const searchInput = searchBar?.querySelector('input');

        if (searchInput) {
            searchInput.placeholder = translate(messages, 'zalfTheme.nav.searchDatasets', 'Search Datasets');
        }

        const movedNodes = [
            {
                node: searchBar,
                target: searchSlotRef.current
            },
            {
                node: utilitiesMenu,
                target: utilitiesSlotRef.current
            }
        ]
            .filter(({ node, target }) => node && target)
            .map(({ node, target }) => ({
                node,
                target,
                parent: node.parentNode,
                nextSibling: node.nextSibling
            }));

        movedNodes.forEach(({ node, target }) => {
            target.appendChild(node);
        });

        const hiddenNodes = [mainHeader, mainHeaderPlaceholder, bottomNavbar].filter(Boolean);
        const previousDisplay = hiddenNodes.map((node) => node.style.display);
        hiddenNodes.forEach((node) => {
            node.style.display = 'none';
        });

        function syncLocation() {
            setCurrentUrl({
                pathname: window.location.pathname,
                hash: window.location.hash || ''
            });
        }

        function closeMenu() {
            setMobileMenuOpen(false);
            setOpenDropdown(null);
            syncLocation();
        }

        window.addEventListener('hashchange', closeMenu);
        window.addEventListener('resize', closeMenu);

        return () => {
            movedNodes.forEach(({ node, parent, nextSibling }) => {
                if (!parent) {
                    return;
                }
                if (nextSibling && nextSibling.parentNode === parent) {
                    parent.insertBefore(node, nextSibling);
                } else {
                    parent.appendChild(node);
                }
            });
            hiddenNodes.forEach((node, index) => {
                node.style.display = previousDisplay[index] || '';
            });
            window.removeEventListener('hashchange', closeMenu);
            window.removeEventListener('resize', closeMenu);
        };
    }, [messages]);

    function renderNavLink(link, className) {
        const active = isActiveLink(link.href, currentUrl);
        return React.createElement(
            'a',
            {
                key: getItemKey(link),
                href: link.href,
                className: `${className}${active ? ' is-active' : ''}${link.accent ? ' is-accent' : ''}`
            },
            renderLabel(link)
        );
    }

    function renderDropdownItem(item, idx) {
        if (item.separator) {
            return React.createElement('span', {
                key: `separator-${idx}`,
                className: 'zalf-navigation__dropdown-separator',
                role: 'separator'
            });
        }
        return React.createElement(
            'a',
            {
                key: `${getItemKey(item)}-${idx}`,
                href: item.href,
                className: `zalf-navigation__dropdown-link${item.muted ? ' is-muted' : ''}`,
                target: item.external ? '_blank' : undefined,
                rel: item.external ? 'noreferrer' : undefined,
                onClick: () => setOpenDropdown(null)
            },
            renderLabel(item)
        );
    }

    function renderPrimaryItem(item, idx) {
        if (!item.children) {
            return renderNavLink(item, 'zalf-navigation__link');
        }

        const itemKey = getItemKey(item);
        const isOpen = openDropdown === itemKey;
        const columns = item.wide ? [item.children.slice(0, 5), item.children.slice(5)] : [item.children];

        return React.createElement(
            'div',
            {
                key: `${itemKey}-${idx}`,
                className: `zalf-navigation__dropdown${isOpen ? ' is-open' : ''}`,
                onMouseEnter: () => window.innerWidth >= 992 && setOpenDropdown(itemKey),
                onMouseLeave: () => window.innerWidth >= 992 && setOpenDropdown(null)
            },
            React.createElement(
                'button',
                {
                    type: 'button',
                    className: `zalf-navigation__link zalf-navigation__dropdown-toggle${isOpen ? ' is-active' : ''}`,
                    'aria-expanded': isOpen ? 'true' : 'false',
                    onClick: () => setOpenDropdown(isOpen ? null : itemKey)
                },
                renderLabel(item),
                React.createElement('span', { className: 'zalf-navigation__dropdown-caret' }, '▾')
            ),
            React.createElement(
                'div',
                {
                    className: `zalf-navigation__dropdown-menu${item.wide ? ' is-wide' : ''}${isOpen ? ' is-open' : ''}`
                },
                ...columns.map((column, columnIndex) => React.createElement(
                    'div',
                    {
                        key: `${itemKey}-column-${columnIndex}`,
                        className: 'zalf-navigation__dropdown-column'
                    },
                    ...column.map(renderDropdownItem)
                ))
            )
        );
    }

    return React.createElement(
        'div',
        { className: 'zalf-navigation-shell' },
        React.createElement(
            'header',
            { className: 'zalf-navigation', role: 'banner' },
            React.createElement(
                'div',
                { className: 'zalf-navigation__inner' },
                React.createElement(
                    'a',
                    { className: 'zalf-navigation__brand', href: '/' },
                    React.createElement('img', {
                        className: 'zalf-navigation__brand-logo',
                        src: logoZalfMark,
                        alt: 'ZALF'
                    }),
                    React.createElement('span', {
                        className: 'zalf-navigation__brand-divider',
                        'aria-hidden': 'true'
                    }),
                    React.createElement(
                        'span',
                        { className: 'zalf-navigation__brand-name' },
                        'BonaRes Repository'
                    )
                ),
                React.createElement(
                    'button',
                    {
                        type: 'button',
                        className: `zalf-navigation__toggle${mobileMenuOpen ? ' is-open' : ''}`,
                        'aria-expanded': mobileMenuOpen ? 'true' : 'false',
                        'aria-label': translate(messages, 'zalfTheme.nav.toggleNavigationMenu', 'Toggle navigation menu'),
                        onClick: () => setMobileMenuOpen(!mobileMenuOpen)
                    },
                    React.createElement('span', null),
                    React.createElement('span', null),
                    React.createElement('span', null)
                ),
                React.createElement(
                    'div',
                    {
                        className: `zalf-navigation__content${mobileMenuOpen ? ' is-open' : ''}`
                    },
                    React.createElement(
                        'nav',
                        {
                            className: 'zalf-navigation__primary',
                            'aria-label': translate(messages, 'zalfTheme.nav.primaryNavigation', 'Primary navigation')
                        },
                        ...navigationItems.map(renderPrimaryItem)
                    ),
                    React.createElement(
                        'div',
                        { className: 'zalf-navigation__tools' },
                        React.createElement('div', {
                            ref: searchSlotRef,
                            className: 'zalf-navigation__search-slot'
                        }),
                        React.createElement('div', {
                            ref: utilitiesSlotRef,
                            className: 'zalf-navigation__utilities-slot'
                        })
                    )
                )
            )
        )
    );
}

export default connect((state) => ({
    messages: state?.locale?.messages || {}
}))(Navigation);
