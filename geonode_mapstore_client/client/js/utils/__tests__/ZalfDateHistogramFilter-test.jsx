import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, { act } from 'react-dom/test-utils';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import ZalfDateHistogramFilter from '../../../themes/zalf/components/ZalfDateHistogramFilter';

describe('ZALF catalogue date histogram filter', () => {
    let mockAxios;

    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
        mockAxios = new MockAdapter(axios);
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        mockAxios.restore();
        document.body.innerHTML = '';
    });

    it('renders real yearly buckets, fills gaps, and applies a selected year', (done) => {
        let changedQuery;
        mockAxios.onGet('/api/v2/facets/date').reply(200, {
            topics: {
                items: [
                    { key: 2020, label: '2020', count: 1 },
                    { key: 2022, label: '2022', count: 3 }
                ]
            }
        });

        act(() => {
            ReactDOM.render(
                <ZalfDateHistogramFilter query={{}} onChange={(query) => { changedQuery = query; }}/>,
                document.getElementById('container')
            );
        });

        setTimeout(() => {
            expect(document.querySelector('.zalf-date-filter legend').textContent).toBe('Publication date');
            const bars = document.querySelectorAll('.zalf-date-histogram__bar');
            expect(bars.length).toBe(3);
            expect(bars[1].getAttribute('aria-label')).toBe('2021: 0 resources');
            expect(bars[2].style.getPropertyValue('--zalf-date-count')).toBe('100%');

            TestUtils.Simulate.click(bars[0]);
            expect(changedQuery).toEqual({
                'filter{date.gte}': '2020-01-01T00:00:00',
                'filter{date.lte}': '2020-12-31T23:59:59'
            });
            done();
        }, 0);
    });

    it('keeps other facets but omits the active date range from the histogram request', (done) => {
        mockAxios.onGet('/api/v2/facets/date').reply(200, { topics: { items: [] } });
        act(() => {
            ReactDOM.render(
                <ZalfDateHistogramFilter query={{
                    'filter{category.identifier.in}': ['farming'],
                    'filter{date.gte}': '2020-01-01T00:00:00'
                }}/>,
                document.getElementById('container')
            );
        });

        setTimeout(() => {
            const request = mockAxios.history.get[0];
            expect(request.params['filter{category.identifier.in}']).toEqual(['farming']);
            expect(request.params['filter{date.gte}']).toBe(undefined);
            done();
        }, 0);
    });
});
