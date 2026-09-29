/**
 * CUSTOM PATH: themes/zalf/components/ZalfFiltersForm.jsx
 * REASON: Renders the controlled filter drawer without duplicating the global
 * navbar search. The catalogue toolbar owns the open/close control.
 * Uses React.createElement — themes/ is outside babel-loader include.
 */

import React from 'react';
import FilterItems from '@mapstore/framework/plugins/ResourcesCatalog/components/FilterItems';
import ZalfDateHistogramFilter from './ZalfDateHistogramFilter';

const ce = React.createElement;

export default function ZalfFiltersForm(props) {
    const { fields = [], onChange = () => {}, query = {}, expanded = true } = props;

    const filterFields = fields.filter((field) => field.type !== 'search');
    const panelClassName = 'zalf-filter-panel'
        + (expanded ? ' zalf-filter-panel--open' : ' zalf-filter-panel--closed');

    return ce('div', { className: panelClassName },
        expanded
            ? ce('div', { id: 'zalf-catalogue-filter-drawer', className: 'zalf-filter-panel-body' },
                ce('div', { className: 'ms-filters-form' },
                    ce('form', { className: '_padding-lr-md' },
                        filterFields.map((field, index) => field.type === 'date-range'
                            ? ce(ZalfDateHistogramFilter, {
                                key: field.uuid || field.id || `date-${index}`,
                                query,
                                filterKey: field.filterKey,
                                onChange
                            })
                            : ce(FilterItems, {
                                key: field.uuid || field.id || `field-${index}`,
                                id: props.id,
                                items: [field],
                                values: query,
                                onChange,
                                extentProps: props.extentProps,
                                timeDebounce: props.timeDebounce,
                                root: true
                            })
                        )
                    )
                )
            )
            : null
    );
}
