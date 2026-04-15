/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const SELECT_OPERATION = 'GEONODE:SELECT_OPERATION';
export const RELOAD_OPERATION = 'GEONODE:RELOAD_OPERATION';

export const selectOperation = (selected) => ({
    type: SELECT_OPERATION,
    selected
});

export const reloadOperation = (skip, pageReload) => ({
    type: RELOAD_OPERATION,
    skip,
    pageReload
});
