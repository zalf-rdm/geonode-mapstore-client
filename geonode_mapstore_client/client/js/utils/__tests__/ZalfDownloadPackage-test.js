/*
 * Map download packages (zalf-rdm/geonode#659): the landing page shows the
 * Download button only once a package exists, and data stewards can build one.
 */

import expect from 'expect';
import { downloadPackageUrl, getPackageDownload } from '../../../themes/zalf/utils/DownloadPackageUtils';

describe('ZalfDownloadPackage', () => {
    describe('getPackageDownload', () => {
        it('offers nothing before a package exists', () => {
            expect(getPackageDownload(null)).toBe(null);
            expect(getPackageDownload({ state: null, asset_id: null, download_url: null })).toBe(null);
            expect(getPackageDownload({ state: 'building', asset_id: null, download_url: null })).toBe(null);
            expect(getPackageDownload({ state: 'failed', asset_id: null, download_url: null })).toBe(null);
        });

        it('offers the package once it has an asset, also while a rebuild runs', () => {
            const ready = { state: 'ready', asset_id: 5, download_url: '/api/v2/maps/3/download_package/download/', size: 2048 };
            expect(getPackageDownload(ready)).toEqual({ href: ready.download_url, size: 2048 });
            expect(getPackageDownload({ ...ready, state: 'building' })).toEqual({ href: ready.download_url, size: 2048 });
        });

        it('builds the state url for a map', () => {
            expect(downloadPackageUrl(3)).toBe('/api/v2/maps/3/download_package/');
        });
    });
});
