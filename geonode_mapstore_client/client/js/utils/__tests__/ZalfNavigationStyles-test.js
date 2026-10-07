import expect from 'expect';
import stylesheet from '!!raw-loader!../../../themes/zalf/less/overrides/_components.less';

describe('ZALF navigation search expansion styles', () => {
    it('limits the expanded layout to focus inside the search slot', () => {
        expect(stylesheet).toContain(
            '.zalf-navigation__content:has(.zalf-navigation__search-slot:focus-within)'
        );
        expect(stylesheet).toNotContain('.zalf-navigation__content:focus-within');
    });

    it('compacts search and navigation at intermediate desktop widths', () => {
        expect(stylesheet).toContain('@media (min-width: 1200px) and (max-width: 1439px)');
        expect(stylesheet).toContain('flex-basis: clamp(160px, 14vw, 190px)');
        expect(stylesheet).toContain('@media (max-width: 1199px)');
    });
});
