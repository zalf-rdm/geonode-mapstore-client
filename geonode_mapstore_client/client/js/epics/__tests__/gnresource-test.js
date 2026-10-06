/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import Rx from 'rxjs';
import { ActionsObservable } from 'redux-observable';
import { testEpic } from '@mapstore/framework/epics/__tests__/epicTestUtils';
import {
    gnViewerSetNewResourceThumbnail,
    gnViewerRequestResourceConfig,
    closeInfoPanelOnMapClick,
    closeDatasetCatalogPanel,
    gnZoomToFitBounds,
    closeResourceDetailsOnMapInfoOpen
} from '@js/epics/gnresource';
import {
    setResourceThumbnail,
    requestResourceConfig,
    LOADING_RESOURCE_CONFIG,
    UPDATE_RESOURCE_PROPERTIES,
    UPDATE_SINGLE_RESOURCE
} from '@js/actions/gnresource';
import { ResourceTypes } from '@js/utils/ResourceUtils';
import { clickOnMap, changeMapView, ZOOM_TO_EXTENT } from '@mapstore/framework/actions/map';
import { SET_CONTROL_PROPERTY, setControlProperty } from '@mapstore/framework/actions/controls';
import {
    SHOW_NOTIFICATION
} from '@mapstore/framework/actions/notifications';
import { newMapInfoRequest } from '@mapstore/framework/actions/mapInfo';
import { SET_SHOW_DETAILS } from '@mapstore/framework/plugins/ResourcesCatalog/actions/resources';

let mockAxios;

describe('gnresource epics', () => {
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

    it('requests compact permissions and dataset metadata concurrently', (done) => {
        const pk = 1;
        let resolvePermissions;
        let permissionsResolved = false;
        let datasetStartedBeforePermissions = false;
        let completed = false;
        let timeout;
        const actionSubject = new Rx.Subject();
        const actions$ = new ActionsObservable(actionSubject);
        const state = {
            router: { location: { search: '' } },
            security: { user: { username: 'test' } },
            gnresource: {}
        };
        const mapConfig = {
            map: {
                center: { x: 0, y: 0, crs: 'EPSG:4326' },
                zoom: 1,
                layers: []
            }
        };
        const dataset = {
            pk,
            resource_type: ResourceTypes.DATASET,
            subtype: 'vector',
            alternate: 'geonode:test_layer',
            title: 'Test layer',
            perms: ['view_resourcebase'],
            links: [{
                link_type: 'OGC:WMS',
                url: 'http://localhost/geoserver/ows'
            }]
        };

        mockAxios.onGet(/resources\/1\/permissions/).reply(() => new Promise((resolve) => {
            resolvePermissions = () => {
                permissionsResolved = true;
                resolve([200, { users: [], groups: [], organizations: [] }]);
            };
        }));
        mockAxios.onGet(/datasets\/1/).reply(() => {
            datasetStartedBeforePermissions = !permissionsResolved;
            resolvePermissions();
            return [200, { dataset }];
        });
        mockAxios.onGet('/static/mapstore/configs/map.json').reply(200, mapConfig);

        const subscription = gnViewerRequestResourceConfig(actions$, { getState: () => state })
            .subscribe((action) => {
                if (action.type === LOADING_RESOURCE_CONFIG && action.loading === false && !completed) {
                    completed = true;
                    clearTimeout(timeout);
                    subscription.unsubscribe();
                    try {
                        expect(datasetStartedBeforePermissions).toBe(true);
                        expect(mockAxios.history.get.some(({ url }) => /resources\/1\/permissions/.test(url))).toBe(true);
                        expect(mockAxios.history.get.some(({ url }) => /datasets\/1/.test(url))).toBe(true);
                        done();
                    } catch (error) {
                        done(error);
                    }
                }
            });
        timeout = setTimeout(() => {
            if (!completed) {
                subscription.unsubscribe();
                done(new Error('Resource loading did not complete; requests may still be sequential.'));
            }
        }, 2000);

        actionSubject.next(requestResourceConfig(ResourceTypes.DATASET, pk, {
            page: 'dataset_viewer',
            params: { subtype: 'vector' }
        }));
    });

    it('should apply new resource thumbnail', (done) => {
        const NUM_ACTIONS = 3;
        const pk = 1;
        const testState = {
            gnresource: {
                id: pk,
                data: {
                    'title': 'Map',
                    'thumbnail_url': 'thumbnail.jpeg'
                }
            }
        };
        mockAxios.onPut(new RegExp(`resources/${pk}/set_thumbnail`))
            .reply(() => [200, { thumbnail_url: 'test_url' }]);

        testEpic(
            gnViewerSetNewResourceThumbnail,
            NUM_ACTIONS,
            setResourceThumbnail(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            UPDATE_RESOURCE_PROPERTIES,
                            UPDATE_SINGLE_RESOURCE,
                            SHOW_NOTIFICATION
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );
    });
    it('should remove resource thumbnail', (done) => {
        const NUM_ACTIONS = 3;
        const pk = 1;
        const testState = {
            gnresource: {
                id: pk,
                data: {
                    'title': 'Map'
                }
            }
        };
        mockAxios.onPost(new RegExp(`resources/${pk}/delete_thumbnail`))
            .reply(() => [200, { thumbnail_url: undefined }]);

        testEpic(
            gnViewerSetNewResourceThumbnail,
            NUM_ACTIONS,
            setResourceThumbnail(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            UPDATE_RESOURCE_PROPERTIES,
                            UPDATE_SINGLE_RESOURCE,
                            SHOW_NOTIFICATION
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );
    });

    it('should close share panels on map click', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            controls: {
                rightOverlay: {
                    enabled: 'Share'
                }
            }
        };

        testEpic(closeInfoPanelOnMapClick,
            NUM_ACTIONS,
            clickOnMap(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SET_CONTROL_PROPERTY
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });

    it('should close info panel on map click', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            controls: {
                rightOverlay: {
                    enabled: 'Share'
                }
            }
        };

        testEpic(closeInfoPanelOnMapClick,
            NUM_ACTIONS,
            clickOnMap(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SET_CONTROL_PROPERTY
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });
    it('close dataset panels on map info panel open', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            context: {
                currentContext: {
                    plugins: {
                        desktop: [
                            {name: "Identify"}
                        ]
                    }
                }
            },
            mapInfo: {
                requests: ["something"]
            },
            controls: {
                datasetsCatalog: {
                    enabled: true
                }
            }
        };

        testEpic(closeDatasetCatalogPanel,
            NUM_ACTIONS,
            newMapInfoRequest(),
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(SET_CONTROL_PROPERTY);
                    expect(actions[0].control).toBe("datasetsCatalog");
                    expect(actions[0].value).toBe(false);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });
    it('close resource details panels on map info panel open', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            context: {
                currentContext: {
                    plugins: {
                        desktop: [
                            {name: "Identify"}
                        ]
                    }
                }
            },
            mapInfo: {
                requests: ["something"]
            },
            resources: {
                showDetails: true
            }
        };

        testEpic(closeResourceDetailsOnMapInfoOpen,
            NUM_ACTIONS,
            newMapInfoRequest(),
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(SET_SHOW_DETAILS);
                    expect(actions[0].show).toBe(false);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });

    it('should zoom to extent with the fitBounds control', (done) => {
        const NUM_ACTIONS = 2;
        const testState = {};
        testEpic(gnZoomToFitBounds,
            NUM_ACTIONS,
            [setControlProperty('fitBounds', 'geometry', [-180, -90, 180, 90]), changeMapView()],
            (actions) => {
                try {
                    expect(actions.length).toBe(2);
                    expect(actions[0].type).toBe(ZOOM_TO_EXTENT);
                    expect(actions[1].type).toBe(SET_CONTROL_PROPERTY);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });
});
