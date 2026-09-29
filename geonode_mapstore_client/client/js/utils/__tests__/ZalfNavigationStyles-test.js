import expect from 'expect';
import stylesheet from '!!raw-loader!../../../themes/zalf/less/overrides/_components.less';

describe('ZALF navigation search expansion styles', () => {
    it('limits the expanded layout to focus inside the search slot', () => {
        expect(stylesheet).toContain(
            '.zalf-navigation__content:has(.zalf-navigation__search-slot:focus-within)'
        );
        expect(stylesheet).toNotContain('.zalf-navigation__content:focus-within');
    });
});
