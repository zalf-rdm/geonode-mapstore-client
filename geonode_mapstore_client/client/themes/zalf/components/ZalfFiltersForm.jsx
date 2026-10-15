/**
 * CUSTOM PATH: themes/zalf/components/ZalfFiltersForm.jsx
 * REASON: Renders the controlled filter drawer without duplicating the global
 * navbar search. The catalogue toolbar owns the open/close control.
 * Uses React.createElement — themes/ is outside babel-loader include.
 */

import React, { useEffect, useRef } from 'react';
import FilterItems from '@mapstore/framework/plugins/ResourcesCatalog/components/FilterItems';
import ZalfDateHistogramFilter from './ZalfDateHistogramFilter';

const ce = React.createElement;

// Upstream FilterItems renders a visible <label> next to each react-select, but
// the label is not associated with the select's input, so screen readers announce
// an unnamed text field. Copy the label text onto unlabelled inputs.
const labelFilterInputs = (root) => {
    root.querySelectorAll('.form-group').forEach((group) => {
        const label = group.querySelector(':scope > label');
        const text = label?.textContent?.trim();
        if (!text) {
            return;
        }
        group.querySelectorAll('input:not([type=hidden])').forEach((input) => {
            if (!input.labels?.length && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                input.setAttribute('aria-label', text);
            }
        });
    });
};

export default function ZalfFiltersForm(props) {
    const { fields = [], onChange = () => {}, query = {}, expanded = true } = props;

    const filterFields = fields.filter((field) => field.type !== 'search');
    const panelClassName = 'zalf-filter-panel'
        + (expanded ? ' zalf-filter-panel--open' : ' zalf-filter-panel--closed');

    const panelRef = useRef(null);
    useEffect(() => {
        const root = panelRef.current;
        if (!root) {
            return undefined;
        }
        labelFilterInputs(root);
        // Select inputs are re-created when options load, so keep labelling them.
        const observer = new MutationObserver(() => labelFilterInputs(root));
        observer.observe(root, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [expanded]);

    return ce('div', { ref: panelRef, className: panelClassName },
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
