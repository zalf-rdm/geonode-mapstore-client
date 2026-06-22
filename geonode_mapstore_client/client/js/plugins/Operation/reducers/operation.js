/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    SELECT_OPERATION
} from '../actions/operation';

function operation(state = {}, action) {
    switch (action.type) {
    case SELECT_OPERATION: {
        return {
            ...state,
            selected: action.selected
        };
    }
    default:
        return state;
    }
}

export default operation;
