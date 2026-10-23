import expect from 'expect';
import stylesheet from '!!raw-loader!../../../themes/zalf/less/overrides/_catalogue.less';

// zalf-rdm/geonode#812: the group logo stands in for the group on a catalogue card.
// The rules key off the logo image because the card renderer gives metadata entries
// no per-path class of their own, and the layouts place it differently.
describe('ZALF catalogue group logo styles', () => {

    it('hides the group name wherever a logo is shown', () => {
        expect(stylesheet).toContain(
            '.ms-resource-card .ms-text:has(> .ms-resource-icon-logo) > span'
        );
    });

    it('puts the logo on the right-hand edge in the table view', () => {
        const row = stylesheet
            .split('.ms-resource-card-type-list .ms-text:has(> .ms-resource-icon-logo) {')[1]
            .split('}')[0];
        expect(row).toContain('margin-left: auto');
        expect(row).toContain('order: 1');
    });

    it('anchors the logo to the bottom right in the tile view', () => {
        const row = stylesheet
            .split('.ms-resource-card-type-grid .ms-text:has(> .ms-resource-icon-logo) {')[1]
            .split('}')[0];
        expect(row).toContain('position: absolute');
        expect(row).toContain('right: 0');
        expect(row).toContain('bottom: var(--zalf-group-logo-offset)');
    });

    it('clears the tile footer with a single tunable offset', () => {
        const body = stylesheet
            .split('.ms-resource-card-type-grid .ms-resource-card-body {')[1]
            .split('}')[0];
        expect(body).toContain('position: relative');
        expect(body).toContain('--zalf-group-logo-offset');
    });

    it('draws the logo larger than the inherited 1em', () => {
        const list = stylesheet
            .split('.ms-resource-card-type-list .ms-resource-icon-logo {')[1]
            .split('}')[0];
        const grid = stylesheet
            .split('.ms-resource-card-type-grid .ms-resource-icon-logo {')[1]
            .split('}')[0];
        expect(list).toContain('width: 30px');
        expect(grid).toContain('width: 26px');
    });
});
