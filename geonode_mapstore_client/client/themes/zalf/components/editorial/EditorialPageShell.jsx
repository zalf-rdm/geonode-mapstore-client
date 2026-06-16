/**
 * CUSTOM PATH: themes/zalf/components/editorial/EditorialPageShell.jsx
 * REASON: shared chrome for editorial ZALF pages rendered standalone
 */

import React from 'react';
import Navigation from '../navigation/Navigation';
import Footer from '../footer/Footer';
import './editorial-page-shell.css';

function EditorialPageShell({ children }) {
    return React.createElement(
        'div',
        { className: 'zalf-editorial-page-shell' },
        React.createElement(Navigation, null),
        React.createElement(
            'div',
            { className: 'zalf-editorial-page-shell__content' },
            children
        ),
        React.createElement(Footer, null)
    );
}

export default EditorialPageShell;
