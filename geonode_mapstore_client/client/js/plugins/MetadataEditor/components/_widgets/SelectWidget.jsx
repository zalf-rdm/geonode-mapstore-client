/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import get from 'lodash/get';
import DefaultSelectWidget from '@rjsf/core/lib/components/widgets/SelectWidget';

/**
 * Enhanced SelectWidget that supports `geonode-ui:uniqueInArray`.
 *
 * When the ui:option `geonode-ui:uniqueInArray` is set on a field inside an
 * array item, this widget filters out enumOptions that are already selected
 * by sibling array items — preventing duplicate selections.
 *
 * Schema usage (set by the handler on the server):
 *   "ui:options": {
 *       "geonode-ui:uniqueInArray": {
 *           "arrayPath": "contacts.contact_roles",  // dot-path into formData
 *           "valueProp": "role"                      // key within each item
 *       }
 *   }
 */
function SelectWidget(props) {
    const { options, formContext, id } = props;
    // geonode-ui:uniqueInArray may arrive as a ui:options entry in the uiSchema
    // or directly in the widget options (RJSF flattens ui:options into options).
    const uniqueConfig = options?.['geonode-ui:uniqueInArray']
        || props.uiSchema?.['ui:options']?.['geonode-ui:uniqueInArray'];

    if (uniqueConfig && formContext?.metadata) {
        const { arrayPath, valueProp } = uniqueConfig;
        const arrayData = get(formContext.metadata, arrayPath) || [];

        // Extract the current item's index from the RJSF id.
        // RJSF ids look like: root_contacts_contact_roles_0_role
        // We need the index of this item inside the array.
        const match = id.match(/_([0-9]+)_[^_]+$/);
        const currentIndex = match ? parseInt(match[1], 10) : -1;

        // Collect values already chosen by OTHER items in the array
        const usedValues = new Set();
        arrayData.forEach((item, idx) => {
            if (idx !== currentIndex && item?.[valueProp]) {
                usedValues.add(item[valueProp]);
            }
        });

        // Filter enumOptions to exclude already-used values
        if (usedValues.size > 0 && options?.enumOptions) {
            const filteredEnumOptions = options.enumOptions.filter(
                (opt) => !usedValues.has(opt.value)
            );
            return (
                <DefaultSelectWidget
                    {...props}
                    options={{ ...options, enumOptions: filteredEnumOptions }}
                />
            );
        }
    }

    return (
        <DefaultSelectWidget {...props}/>
    );
}

export default SelectWidget;
