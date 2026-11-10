/*
 * Map download packages (zalf-rdm/geonode#659): the landing page shows the
 * Download button only once a package exists, and data stewards can build one.
 */

import expect from 'expect';
import { downloadPackageUrl, getPackageDownload, packagesEnabled } from '../../../themes/zalf/utils/DownloadPackageUtils';

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

        it('offers nothing while the feature is switched off', () => {
            const off = { enabled: false, state: null, asset_id: null, download_url: null };
            expect(getPackageDownload(off)).toBe(null);
            // ... not even a package built before it was switched off
            expect(getPackageDownload({ ...off, asset_id: 5, download_url: '/d/', size: 10 })).toBe(null);
        });

        it('builds the state url for a map', () => {
            expect(downloadPackageUrl(3)).toBe('/api/v2/maps/3/download_package/');
        });
    });

    describe('packagesEnabled', () => {
        it('is off only when the backend says so', () => {
            expect(packagesEnabled({ enabled: false })).toBe(false);
            expect(packagesEnabled({ enabled: true })).toBe(true);
            // a backend without the field (older deployment) counts as on
            expect(packagesEnabled({ state: 'ready' })).toBe(true);
            expect(packagesEnabled(null)).toBe(true);
        });
    });
});
