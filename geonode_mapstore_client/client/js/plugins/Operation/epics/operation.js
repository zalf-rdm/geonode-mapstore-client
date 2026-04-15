/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import { RELOAD_OPERATION } from '../actions/operation';
import { requestResourceConfig } from '@js/actions/gnresource';
import { getResourceData } from '@js/selectors/resource';

export const gnReloadOperation = (action$, { getState } = {}) =>
    action$.ofType(RELOAD_OPERATION)
        .filter(action => !action.skip)
        .switchMap((action) => {
            if (action.pageReload) {
                window.location.reload();
                return Observable.empty();
            }
            const state = getState();
            const resource = getResourceData(state);
            return Observable.of(
                requestResourceConfig(resource.resource_type, resource.pk, {
                    params: state?.gnresource?.params
                })
            );
        });

export default {
    gnReloadOperation
};
