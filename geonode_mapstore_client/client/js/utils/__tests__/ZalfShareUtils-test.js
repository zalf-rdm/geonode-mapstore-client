import expect from 'expect';
import { getLandingShareUrl, shareLink } from '../../../themes/zalf/utils/ZalfShareUtils';

// navigator.share and navigator.clipboard are read-only accessors on
// Navigator.prototype, so they cannot be assigned. Shadowing them with a
// configurable own property works for both stubbing and removal: defining
// `undefined` hides a real implementation from feature detection, and deleting
// the own property puts the original back.
function stubNavigator(name, value) {
    Object.defineProperty(navigator, name, { value, configurable: true, writable: true });
}

function restoreNavigator(name) {
    delete navigator[name];
}

describe('ZALF resource share links', () => {

    afterEach(() => {
        restoreNavigator('share');
        restoreNavigator('clipboard');
    });

    it('builds the stable landing link, not the current page URL', () => {
        expect(getLandingShareUrl('abc-123')).toBe(window.location.origin + '/landing/abc-123/');
    });

    it('has nothing to share without a uuid', () => {
        expect(getLandingShareUrl(undefined)).toBe(null);
        expect(getLandingShareUrl('')).toBe(null);
    });

    it('prefers the system share dialog and reports no copy', (done) => {
        let shared;
        stubNavigator('share', (data) => {
            shared = data;
            return Promise.resolve();
        });
        shareLink({ url: 'http://example.org/landing/x/', title: 'A map' }).then((wasCopied) => {
            expect(shared.url).toBe('http://example.org/landing/x/');
            expect(shared.title).toBe('A map');
            // a successful share needs no "copied" feedback
            expect(wasCopied).toBe(false);
            done();
        });
    });

    it('does not fall back to the clipboard when the user cancels', (done) => {
        let copied = false;
        stubNavigator('share', () => Promise.reject(Object.assign(new Error('cancelled'), { name: 'AbortError' })));
        stubNavigator('clipboard', { writeText: () => { copied = true; return Promise.resolve(); } });
        shareLink({ url: 'http://example.org/landing/x/' }).then((wasCopied) => {
            expect(copied).toBe(false);
            expect(wasCopied).toBe(false);
            done();
        });
    });

    it('copies when the share dialog genuinely fails', (done) => {
        let written;
        stubNavigator('share', () => Promise.reject(new Error('boom')));
        stubNavigator('clipboard', { writeText: (text) => { written = text; return Promise.resolve(); } });
        shareLink({ url: 'http://example.org/landing/x/' }).then((wasCopied) => {
            expect(written).toBe('http://example.org/landing/x/');
            expect(wasCopied).toBe(true);
            done();
        });
    });

    it('copies when there is no share dialog at all', (done) => {
        let written;
        stubNavigator('share', undefined);
        stubNavigator('clipboard', { writeText: (text) => { written = text; return Promise.resolve(); } });
        shareLink({ url: 'http://example.org/landing/x/' }).then((wasCopied) => {
            expect(written).toBe('http://example.org/landing/x/');
            expect(wasCopied).toBe(true);
            done();
        });
    });

    it('reports no copy when neither share nor clipboard is available', (done) => {
        stubNavigator('share', undefined);
        stubNavigator('clipboard', undefined);
        shareLink({ url: 'http://example.org/landing/x/' }).then((wasCopied) => {
            expect(wasCopied).toBe(false);
            done();
        });
    });

    it('has nothing to do without a url', (done) => {
        shareLink({ url: null }).then((wasCopied) => {
            expect(wasCopied).toBe(false);
            done();
        });
    });
});
