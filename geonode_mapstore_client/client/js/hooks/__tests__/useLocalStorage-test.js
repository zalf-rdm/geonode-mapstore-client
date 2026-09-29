
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, { act } from 'react-dom/test-utils';
import expect from 'expect';
import useLocalStorage from '@js/hooks/useLocalStorage';

function MockApp({ storageKey, initialValue }) {

    const [inTest, setInTest] = useLocalStorage(storageKey, initialValue);
    return (
        <div className="MockApp">
            <p id="lsValue" >{inTest}</p>
            <button type="button" onClick={() => setInTest((value) => `${value}-updated`)}>Update</button>
        </div>
    );

}
export default MockApp;


describe('Test useLocalStorage', () => {
    beforeEach((done) => {
        window.localStorage.clear();
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        window.localStorage.clear();
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('renders the initial value without updating state during render', () => {
        act(() => {
            ReactDOM.render(<MockApp storageKey="test_key" initialValue="test_value" />,
                document.getElementById("container"));
        });
        const container = document.getElementById('container');
        const el = container.querySelector('.MockApp');
        expect(el).toExist();
        expect(el.querySelector('#lsValue').textContent).toBe('test_value');
    });

    it('reads persisted state and stores functional updates', () => {
        window.localStorage.setItem('test_key', JSON.stringify('stored_value'));
        act(() => {
            ReactDOM.render(<MockApp storageKey="test_key" initialValue="test_value" />,
                document.getElementById("container"));
        });

        const app = document.querySelector('.MockApp');
        expect(app.querySelector('#lsValue').textContent).toBe('stored_value');

        act(() => {
            TestUtils.Simulate.click(app.querySelector('button'));
        });

        expect(app.querySelector('#lsValue').textContent).toBe('stored_value-updated');
        expect(JSON.parse(window.localStorage.getItem('test_key'))).toBe('stored_value-updated');
    });

    it('synchronizes updates between hook instances using the same key', () => {
        act(() => {
            ReactDOM.render(
                <>
                    <MockApp storageKey="shared_key" initialValue="shared" />
                    <MockApp storageKey="shared_key" initialValue="shared" />
                </>,
                document.getElementById("container")
            );
        });

        const apps = document.querySelectorAll('.MockApp');
        act(() => {
            TestUtils.Simulate.click(apps[0].querySelector('button'));
        });

        expect(apps[0].querySelector('#lsValue').textContent).toBe('shared-updated');
        expect(apps[1].querySelector('#lsValue').textContent).toBe('shared-updated');
    });
});
