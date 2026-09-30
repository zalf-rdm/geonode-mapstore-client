import expect from 'expect';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import ZalfMapSearch, { MAP_FIELDS } from '../../../themes/zalf/components/ZalfMapSearch';

const StubMap = ({ eventHandlers, children }) => {
    useEffect(() => {
        eventHandlers.onMapViewChanges({}, 5, {
            bounds: { minx: 1113194.91, miny: 6446275.84, maxx: 1558472.87, maxy: 6982997.92 },
            crs: 'EPSG:3857'
        });
    }, []);
    return <div data-map-stub>{children}</div>;
};

describe('ZALF catalogue map search', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
    });

    it('loads a lightweight spatial payload without applying map movement automatically', (done) => {
        const calls = [];
        const applied = [];
        const loadResources = (params) => {
            calls.push(params);
            return Promise.resolve({
                total: 1,
                resources: [{
                    id: 7,
                    name: 'Soil dataset',
                    detail_url: '/catalogue/soil-dataset',
                    extent: { coords: [11, 51, 12, 52] }
                }]
            });
        };

        act(() => {
            ReactDOM.render(
                <ZalfMapSearch
                    resources={[{ id: 7, name: 'Soil dataset' }]}
                    totalResources={1}
                    query={{ q: 'soil', catalogue_view: 'map' }}
                    loadResources={loadResources}
                    MapComponent={StubMap}
                    onApplyExtent={(extent) => applied.push(extent)}
                />,
                document.getElementById('container')
            );
        });

        setTimeout(() => {
            try {
                expect(calls.length).toBe(1);
                expect(calls[0].catalogue_view).toBe(undefined);
                expect(calls[0].include).toEqual(MAP_FIELDS);
                expect(applied).toEqual([]);
                expect(document.body.textContent).toContain('Soil dataset');
                expect(document.body.textContent).toContain('View');
                expect(document.querySelector('.zalf-map-search__view').getAttribute('href'))
                    .toBe('/catalogue/soil-dataset');
                expect(document.body.textContent).toNotContain('Approximate bounding box');
                expect(document.body.textContent).toNotContain('Location metadata only');
                expect(document.body.textContent).toNotContain('Recorded bounding boxes');
                expect(document.body.textContent).toNotContain('shown on this map');
                expect(document.body.textContent).toNotContain('without a reliable bounding box');
                expect(document.querySelector('.zalf-map-search__floating-tools').parentElement.className)
                    .toBe('zalf-map-search__map');
                act(() => {
                    document.querySelector('[aria-label="Search this map view"]')
                        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
                expect(applied.length).toBe(1);
                done();
            } catch (error) {
                done(error);
            }
        });
    });
});
