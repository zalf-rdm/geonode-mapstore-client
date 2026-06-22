/**
 * CUSTOM PATH: themes/zalf/components/ZalfFiltersForm.jsx
 * REASON: Adds a collapsible toggle header around the core FiltersForm so the
 * ZALF catalogue sidebar can expand/collapse without a floating overlay.
 * Uses React.createElement — themes/ is outside babel-loader include.
 */

import React, { useState } from 'react';
import CoreFiltersForm from '@mapstore/framework/plugins/ResourcesCatalog/components/FiltersForm';

const ce = React.createElement;

export default function ZalfFiltersForm(props) {
    const [expanded, setExpanded] = useState(true);
    const panelClassName = 'zalf-filter-panel'
        + (expanded ? ' zalf-filter-panel--open' : ' zalf-filter-panel--closed');

    return ce('div', { className: panelClassName },
        ce('button', {
            type: 'button',
            className: 'zalf-filter-panel-toggle',
            onClick: () => setExpanded(v => !v),
            'aria-expanded': expanded
        },
            ce('span', { className: 'zalf-filter-panel-toggle-icon fa fa-filter', 'aria-hidden': 'true' }),
            ce('span', { className: 'zalf-filter-panel-toggle-copy' },
                ce('span', { className: 'zalf-filter-panel-toggle-label' }, 'Filters'),
                ce('span', { className: 'zalf-filter-panel-toggle-description' }, 'Refine catalogue results')
            ),
            ce('span', {
                className: 'fa fa-chevron-down zalf-filter-panel-caret',
                'aria-hidden': 'true'
            })
        ),
        expanded
            ? ce('div', { className: 'zalf-filter-panel-body' },
                ce(CoreFiltersForm, props)
            )
            : null
    );
}
