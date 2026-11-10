/*
 * The data stewards' download package button (zalf-rdm/geonode#659).
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';

import { DownloadPackageButton } from '../PublishDataCollection';

describe('DownloadPackageButton', () => {
    let mockAxios;
    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
        mockAxios = new MockAdapter(axios);
    });
    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        mockAxios.restore();
    });

    const wait = () => new Promise((resolve) => setTimeout(resolve, 20));

    it('offers to build when there is no package, and posts the build request', async() => {
        mockAxios.onGet('/api/v2/maps/3/download_package/').reply(200, { state: null, asset_id: null });
        mockAxios.onPost('/api/v2/maps/3/download_package/').reply(202, { state: 'pending', asset_id: null, started: true });
        await act(async() => {
            ReactDOM.render(<DownloadPackageButton pk={3} />, document.getElementById('container'));
            await wait();
        });
        const button = document.getElementById('build-download-package');
        expect(button).toExist();
        expect(button.textContent).toContain('buildDownloadPackageNow');
        await act(async() => {
            button.click();
            await wait();
        });
        expect(mockAxios.history.post.length).toBe(1);
        expect(document.getElementById('build-download-package').disabled).toBe(true);
    });

    it('reports why a build was declined', async() => {
        mockAxios.onGet('/api/v2/maps/3/download_package/').reply(200, { enabled: true, state: null, asset_id: null });
        // MapStore's axios interceptor rejects with the response itself, so the
        // detail sits at e.data.detail, not e.response.data.detail.
        mockAxios.onPost('/api/v2/maps/3/download_package/').reply(409, { detail: 'Only a published data collection has a download package.' });
        await act(async() => {
            ReactDOM.render(<DownloadPackageButton pk={3} />, document.getElementById('container'));
            await wait();
        });
        await act(async() => {
            document.getElementById('build-download-package').click();
            await wait();
        });
        const button = document.getElementById('build-download-package');
        expect(button).toExist();
        expect(button.textContent).toContain('buildDownloadPackageNow');
        expect(button.querySelector('i').className).toContain('exclamation-circle');
    });

    it('hides itself while the feature is switched off', async() => {
        mockAxios.onGet('/api/v2/maps/3/download_package/').reply(200, { enabled: false, state: null, asset_id: null });
        await act(async() => {
            ReactDOM.render(<DownloadPackageButton pk={3} />, document.getElementById('container'));
            await wait();
        });
        expect(document.getElementById('build-download-package')).toBe(null);
    });

    it('hides itself when the endpoint is not there', async() => {
        mockAxios.onGet('/api/v2/maps/3/download_package/').reply(404);
        await act(async() => {
            ReactDOM.render(<DownloadPackageButton pk={3} />, document.getElementById('container'));
            await wait();
        });
        expect(document.getElementById('build-download-package')).toBe(null);
    });

    it('offers to rebuild an existing package', async() => {
        mockAxios.onGet('/api/v2/maps/3/download_package/').reply(200, { state: 'ready', asset_id: 5 });
        await act(async() => {
            ReactDOM.render(<DownloadPackageButton pk={3} />, document.getElementById('container'));
            await wait();
        });
        expect(document.getElementById('build-download-package').textContent).toContain('rebuildDownloadPackage');
    });
});
