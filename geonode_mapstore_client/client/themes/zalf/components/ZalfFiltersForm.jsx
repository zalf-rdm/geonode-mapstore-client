/**
 * CUSTOM PATH: themes/zalf/components/ZalfFiltersForm.jsx
 * REASON: Adds a search-first toolbar and a collapsible filter drawer around
 * the core FiltersForm without a floating overlay.
 * Uses React.createElement — themes/ is outside babel-loader include.
 */

import React, { useEffect, useState } from 'react';
import CoreFiltersForm from '@mapstore/framework/plugins/ResourcesCatalog/components/FiltersForm';

const ce = React.createElement;

export default function ZalfFiltersForm(props) {
    const { fields = [], onChange = () => {}, query = {} } = props;
    const [expanded, setExpanded] = useState(false);
    const [searchValue, setSearchValue] = useState(query.q || '');

    useEffect(() => {
        setSearchValue(query.q || '');
    }, [query.q]);

    const filterFields = fields.filter((field) => field.type !== 'search');
    const handleSearch = (event) => {
        event.preventDefault();
        onChange({ q: searchValue.trim() });
    };
    const panelClassName = 'zalf-filter-panel'
        + (expanded ? ' zalf-filter-panel--open' : ' zalf-filter-panel--closed');

    return ce('div', { className: panelClassName },
        ce('form', { className: 'zalf-catalogue-search', onSubmit: handleSearch },
            ce('label', { className: 'zalf-catalogue-search__field' },
                ce('span', { className: 'sr-only' }, 'Search resources'),
                ce('span', { className: 'fa fa-search', 'aria-hidden': 'true' }),
                ce('input', {
                    type: 'search',
                    value: searchValue,
                    placeholder: 'Search resources',
                    onChange: (event) => setSearchValue(event.target.value)
                })
            ),
            ce('button', { type: 'submit', className: 'zalf-catalogue-search__submit' },
                ce('span', null, 'Search')
            ),
            ce('button', {
                type: 'button',
                className: 'zalf-filter-panel-toggle',
                onClick: () => setExpanded(value => !value),
                'aria-expanded': expanded,
                'aria-controls': 'zalf-catalogue-filter-drawer'
            },
            ce('span', { className: 'fa fa-filter', 'aria-hidden': 'true' }),
            ce('span', null, 'Filters'),
            ce('span', {
                className: 'fa fa-chevron-down zalf-filter-panel-caret',
                'aria-hidden': 'true'
            })
            )
        ),
        expanded
            ? ce('div', { id: 'zalf-catalogue-filter-drawer', className: 'zalf-filter-panel-body' },
                ce(CoreFiltersForm, { ...props, fields: filterFields })
            )
            : null
    );
}
