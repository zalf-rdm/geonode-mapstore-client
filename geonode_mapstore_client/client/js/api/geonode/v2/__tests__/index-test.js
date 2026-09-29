/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import {
    createMap,
    getResources,
    RESOURCE_SEARCH_FIELDS,
    updateMap
} from '@js/api/geonode/v2';

let mockAxios;

describe('GeoNode v2 api', () => {
    beforeEach(done => {
        global.__DEVTOOLS__ = true;
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });

    afterEach(done => {
        delete global.__DEVTOOLS__;
        mockAxios.restore();
        setTimeout(done);
    });
    it('should post new configuration to mapstore rest (createMap)', (done) => {
        const mapConfiguration = {
            id: 1,
            attributes: [],
            data: {},
            name: 'Map'
        };
        mockAxios.onPost(/\/api\/v2\/maps/)
            .reply((config) => {
                try {
                    expect(config.data).toBe(JSON.stringify(mapConfiguration));
                } catch (e) {
                    done(e);
                }
                done();
                return [ 200, { }];
            });

        createMap(mapConfiguration);
    });
    it('should patch configuration to mapstore rest (updateMap)', (done) => {
        const id = 1;
        const mapConfiguration = {
            id: 1,
            attributes: [],
            data: {},
            name: 'Map'
        };
        mockAxios.onPatch(new RegExp(`/api/v2/maps/${id}`))
            .reply((config) => {
                try {
                    expect(config.data).toBe(JSON.stringify(mapConfiguration));
                } catch (e) {
                    done(e);
                }
                done();
                return [ 200, { }];
            });

        updateMap(id, mapConfiguration);
    });
    it('should search resources across discovery metadata (getResources)', (done) => {
        mockAxios.onGet(/\/api\/v2\/resources/)
            .reply((config) => {
                try {
                    expect(config.params.search).toBe('Wenbin');
                    expect(config.params.search_fields).toEqual(RESOURCE_SEARCH_FIELDS);
                    expect(config.params.search_fields).toContain('contacts__last_name');
                    expect(config.params.search_fields).toContain('related_projects__display_name');
                    expect(config.params.search_fields).toContain('fundings__award_title');
                    expect(config.params.search_fields).toContain('keywords__name');
                    expect(config.params.search_fields).toContain('geo_keywords__name');
                    expect(config.params.search_fields).toContain('research_domains__name');
                } catch (e) {
                    done(e);
                }
                done();
                return [200, {
                    total: 0,
                    links: {},
                    resources: []
                }];
            });

        getResources({ q: 'Wenbin' });
    });
});
