/**
 * REFERENCE BRANCH: main-ui
 * REFERENCE PATH: geonode_mapstore_client/templates/geonode-mapstore-client/snippets/brand_navbar.html
 * CUSTOM PATH: themes/zalf/components/navigation/Navigation.jsx
 * REASON: custom homepage navigation for the ZALF theme
 */

import React from 'react';
import logoZalfWhite from '../../../../../static/img/logo_zalf_white_half.png';
import './navigation.css';

const navigationItems = [
    { href: '/catalogue', label: 'All Data' },
    {
        label: 'Topics',
        children: [
            { href: '/catalogue/#/?q=Animals', label: 'Animals' },
            { href: '/catalogue/#/?q=Atmosphere', label: 'Atmosphere' },
            { href: '/catalogue/#/?q=Climate', label: 'Climate' },
            { href: '/catalogue/#/?q=Forest', label: 'Forest' },
            { href: '/catalogue/#/?q=Hydrology', label: 'Hydrology' },
            { href: '/catalogue/#/?q=Landscape', label: 'Landscape' },
            { href: '/catalogue/#/?q=Long%20Term%20Field%20Experiment', label: 'Long Term Field Experiment' },
            { href: '/catalogue/#/?q=Plants', label: 'Plants' },
            { href: '/catalogue/#/?q=Soil%20Profiles', label: 'Soil Profiles' },
            { href: '/catalogue/#/?q=Water', label: 'Water' }
        ],
        wide: true
    },
    {
        label: 'Tools & Services',
        children: [
            { href: 'https://tools.bonares.de/ltfe/', label: 'LTE Maps', external: true },
            { href: 'https://tools.bonares.de/bp_db/', label: 'Soil Profiles', external: true },
            { href: 'https://dqkit.bonares.de/', label: 'DQ Kit', external: true }
        ]
    },
    { href: '/upload', label: 'Upload' },
    {
        label: 'About',
        children: [
            { href: '/development', label: 'Development' },
            { href: '/services', label: 'OGC Services and API' },
            { href: '/faq', label: 'FAQ' },
            { href: '#', label: 'Contact Us' },
            { href: '#', label: 'Version 2.0.1', muted: true }
        ]
    }
];

function isActiveLink(href, currentUrl) {
    if (!currentUrl) {
        return false;
    }
    return currentUrl.pathname + currentUrl.hash === href || currentUrl.pathname === href;
}

function Navigation() {
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
    }, []);

    function renderNavLink(link, className) {
        const active = isActiveLink(link.href, currentUrl);
        return React.createElement(
            'a',
            {
                key: link.label,
                href: link.href,
                className: `${className}${active ? ' is-active' : ''}${link.accent ? ' is-accent' : ''}`
            },
            link.label
        );
    }

    function renderDropdownItem(item, idx) {
        return React.createElement(
            'a',
            {
                key: `${item.label}-${idx}`,
                href: item.href,
                className: `zalf-navigation__dropdown-link${item.muted ? ' is-muted' : ''}`,
                target: item.external ? '_blank' : undefined,
                rel: item.external ? 'noreferrer' : undefined,
                onClick: () => setOpenDropdown(null)
            },
            item.label
        );
    }

    function renderPrimaryItem(item, idx) {
        if (!item.children) {
            return renderNavLink(item, 'zalf-navigation__link');
        }

        const isOpen = openDropdown === item.label;
        const columns = item.wide ? [item.children.slice(0, 5), item.children.slice(5)] : [item.children];

        return React.createElement(
            'div',
            {
                key: `${item.label}-${idx}`,
                className: `zalf-navigation__dropdown${isOpen ? ' is-open' : ''}`,
                onMouseEnter: () => window.innerWidth >= 992 && setOpenDropdown(item.label),
                onMouseLeave: () => window.innerWidth >= 992 && setOpenDropdown(null)
            },
            React.createElement(
                'button',
                {
                    type: 'button',
                    className: `zalf-navigation__link zalf-navigation__dropdown-toggle${isOpen ? ' is-active' : ''}`,
                    'aria-expanded': isOpen ? 'true' : 'false',
                    onClick: () => setOpenDropdown(isOpen ? null : item.label)
                },
                item.label,
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
                        key: `${item.label}-column-${columnIndex}`,
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
                        src: logoZalfWhite,
                        alt: 'ZALF'
                    })
                ),
                React.createElement(
                    'button',
                    {
                        type: 'button',
                        className: `zalf-navigation__toggle${mobileMenuOpen ? ' is-open' : ''}`,
                        'aria-expanded': mobileMenuOpen ? 'true' : 'false',
                        'aria-label': 'Toggle navigation menu',
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
                        { className: 'zalf-navigation__primary', 'aria-label': 'Primary navigation' },
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

export default Navigation;
