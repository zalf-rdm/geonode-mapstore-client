import expect from 'expect';
import stylesheet from '!!raw-loader!../../../themes/zalf/less/overrides/_catalogue.less';

// zalf-rdm/geonode#812: the group logo stands in for the group on a catalogue card.
// The rules key off the logo image because the card renderer gives metadata entries
// no per-path class of their own, and the two layouts place it differently.
//
// These assertions exist because each of them was got wrong once: the name is a bare
// text node (so it cannot be hidden by selecting an element), the theme pins every
// list row to full width with !important (so the override has to match that weight),
// and the row is a wrapping flex container (so align-self moves an item vertically,
// not horizontally).
describe('ZALF catalogue group logo styles', () => {

    const listRule = () => stylesheet
        .split('> .ms-text:has(> .ms-resource-icon-logo) {')[1]
        .split('}')[0];

    it('removes the group name by collapsing the font, not by hiding an element', () => {
        const rule = stylesheet
            .split('.ms-resource-card .ms-text:has(> .ms-resource-icon-logo) {')[1]
            .split('}')[0];
        expect(rule).toContain('font-size: 0 !important');
        // the name is a text node, so there is nothing to select and hide
        expect(stylesheet).toNotContain(':has(> .ms-resource-icon-logo) > span');
    });

    it('puts the logo on the right-hand edge in the table view', () => {
        expect(listRule()).toContain('margin-left: auto !important');
        expect(listRule()).toContain('order: 1');
    });

    it('frees the table row from the full-width rules it would otherwise inherit', () => {
        const rule = listRule();
        expect(rule).toContain('width: auto !important');
        expect(rule).toContain('flex: 0 0 auto !important');
        expect(rule).toContain('max-width: none !important');
        // the theme forces display:-webkit-box on rows without a glyphicon
        expect(rule).toContain('display: block !important');
    });

    it('carries the ancestor chain needed to outweigh those rules', () => {
        expect(stylesheet).toContain(
            '.ms-resource-card-type-list .ms-resource-card-body > .ms-flex-fill.ms-flex-box._flex._flex-center-v > .ms-text:has(> .ms-resource-icon-logo)'
        );
    });

    it('anchors the logo to the bottom right in the tile view', () => {
        const rule = stylesheet
            .split('.ms-resource-card-type-grid .ms-text:has(> .ms-resource-icon-logo) {')[1]
            .split('}')[0];
        expect(rule).toContain('position: absolute');
        expect(rule).toContain('right: 0');
        expect(rule).toContain('bottom: var(--zalf-group-logo-offset)');
    });

    it('keeps the tile offset as a single tunable value', () => {
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
