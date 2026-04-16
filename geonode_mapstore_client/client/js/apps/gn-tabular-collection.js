/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ResourceTypes } from '@js/utils/ResourceUtils';
import { TABULARCOLLECTION_ROUTES } from '@js/utils/AppRoutesUtils';
import { initTabularApp } from '@js/apps/initTabularApp';

initTabularApp({ appRoutes: TABULARCOLLECTION_ROUTES, resourceType: ResourceTypes.MAP });
