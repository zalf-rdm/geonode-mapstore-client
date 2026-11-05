/*
 * Tests for the CMS error-message extraction (zalf-rdm/geonode#863).
 *
 * Every failed save used to show the generic fallback, because errorMessage only
 * understood `detail` and `message` while GeoNode's exception handler returns
 * {success: false, errors: [...], code: "invalid"}. The shapes below were
 * captured from real 400 responses of /api/v2/cms/topics/.
 */

import expect from 'expect';
import { errorMessage } from '../../../themes/zalf/components/cms/cmsApi';

describe('ZALF cmsApi - errorMessage', () => {
    it("reads GeoNode's wrapped validation errors", () => {
        expect(errorMessage({
            success: false,
            errors: ['A topic needs at least one filter or a search term.'],
            code: 'invalid'
        })).toBe('A topic needs at least one filter or a search term.');
    });

    it('joins several wrapped errors', () => {
        expect(errorMessage({ success: false, errors: ['First.', 'Second.'], code: 'invalid' }))
            .toBe('First. Second.');
    });

    it('reports the filter-spec message the server produced', () => {
        expect(errorMessage({
            success: false,
            errors: ["filters[0].key 'filter{nope}' is not a filter advertised by any registered facet."],
            code: 'invalid'
        })).toContain('not a filter advertised');
    });

    it('reads a plain DRF field-error dict', () => {
        expect(errorMessage({ name: ['This field is required.'] })).toBe('name: This field is required.');
    });

    it('reads DRF non_field_errors without prefixing them', () => {
        expect(errorMessage({ non_field_errors: ['Needs a filter.'] })).toBe('Needs a filter.');
    });

    it('still reads detail and message', () => {
        expect(errorMessage({ detail: 'Staff access required.' })).toBe('Staff access required.');
        expect(errorMessage({ message: 'Network down' })).toBe('Network down');
    });

    it('passes a plain string through', () => {
        expect(errorMessage('boom')).toBe('boom');
    });

    it('falls back only when there is genuinely nothing to show', () => {
        expect(errorMessage(undefined, 'fallback')).toBe('fallback');
        expect(errorMessage({}, 'fallback')).toBe('fallback');
        expect(errorMessage({ success: false, errors: [] }, 'fallback')).toBe('fallback');
    });
});
