import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, { act } from 'react-dom/test-utils';
import ZalfFiltersForm from '../../../themes/zalf/components/ZalfFiltersForm';

describe('ZALF catalogue search and filters', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
    });

    it('starts collapsed and submits the persistent search field', () => {
        let submittedQuery;
        act(() => {
            ReactDOM.render(
                <ZalfFiltersForm
                    fields={[{ type: 'search' }]}
                    query={{}}
                    onChange={(query) => { submittedQuery = query; }}
                />,
                document.getElementById('container')
            );
        });

        const panel = document.querySelector('.zalf-filter-panel');
        const input = document.querySelector('input[type="search"]');
        const form = document.querySelector('.zalf-catalogue-search');
        expect(panel.classList.contains('zalf-filter-panel--closed')).toBe(true);
        expect(input).toExist();
        expect(document.querySelector('.zalf-catalogue-search__submit .fa')).toBe(null);

        act(() => {
            TestUtils.Simulate.change(input, { target: { value: ' crop ' } });
        });
        act(() => {
            TestUtils.Simulate.submit(form);
        });
        expect(submittedQuery).toEqual({ q: 'crop' });
    });

    it('opens the detailed filters without duplicating search', () => {
        act(() => {
            ReactDOM.render(
                <ZalfFiltersForm fields={[{ type: 'search' }]} query={{}} />,
                document.getElementById('container')
            );
        });

        const toggle = document.querySelector('.zalf-filter-panel-toggle');
        TestUtils.Simulate.click(toggle);

        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(document.querySelector('.zalf-filter-panel-body')).toExist();
        expect(document.querySelectorAll('input[type="search"]').length).toBe(1);
    });
});
