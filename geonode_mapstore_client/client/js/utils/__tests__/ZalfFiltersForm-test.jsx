import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import ZalfFiltersForm from '../../../themes/zalf/components/ZalfFiltersForm';

describe('ZALF catalogue filters', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
    });

    it('starts open and does not duplicate the global search', () => {
        act(() => {
            ReactDOM.render(
                <ZalfFiltersForm
                    fields={[{ type: 'search' }, { id: 'category', type: 'select' }]}
                    query={{}}
                />,
                document.getElementById('container')
            );
        });

        const panel = document.querySelector('.zalf-filter-panel');
        expect(panel.classList.contains('zalf-filter-panel--open')).toBe(true);
        expect(document.querySelector('.zalf-filter-panel-body')).toExist();
        expect(document.querySelector('input[type="search"]')).toBe(null);
        expect(document.querySelector('.zalf-catalogue-search__submit')).toBe(null);
    });

    it('hides the detailed filters when controlled as collapsed', () => {
        act(() => {
            ReactDOM.render(
                <ZalfFiltersForm fields={[]} query={{}} expanded={false} />,
                document.getElementById('container')
            );
        });

        expect(document.querySelector('.zalf-filter-panel--closed')).toExist();
        expect(document.querySelector('.zalf-filter-panel-body')).toBe(null);
    });

    it('offers an accessible close control that collapses through its owner', () => {
        let closeCalls = 0;
        act(() => {
            ReactDOM.render(
                <ZalfFiltersForm
                    fields={[]}
                    query={{}}
                    onClose={() => { closeCalls += 1; }}
                />,
                document.getElementById('container')
            );
        });

        const closeButton = document.querySelector('.zalf-filter-panel-close');
        expect(closeButton.getAttribute('aria-label')).toBe('Close filters');
        act(() => closeButton.click());
        expect(closeCalls).toBe(1);
    });
});
