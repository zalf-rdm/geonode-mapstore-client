import expect from 'expect';
import stylesheet from '!!raw-loader!../../../themes/zalf/less/overrides/_components.less';

describe('ZALF navigation search expansion styles', () => {
    it('limits the expanded layout to focus inside the search slot', () => {
        expect(stylesheet).toContain(
            '.zalf-navigation__content:has(.zalf-navigation__search-slot:focus-within)'
        );
        expect(stylesheet).toNotContain('.zalf-navigation__content:focus-within');
    });

    // zalf-rdm/geonode-mapstore-client#179: focus used to hide the menu and the
    // account controls, and the freed width went to the menu rather than the
    // field. The field now grows as an overlay so the bar does not reflow.
    it('expands the search as an overlay instead of reflowing the bar', () => {
        const focused = stylesheet.split(
            ':focus-within) .zalf-navigation__search-slot .gn-search-bar {'
        )[1].split('}')[0];
        expect(focused).toContain('position: absolute');
        expect(focused).toContain('width: 380px !important');
    });

    // zalf-rdm/geonode-mapstore-client#183: the overlay is a fixed width and CSS
    // cannot measure the free gap, so on a tight bar it covered menu items. The
    // menu is faded while the field has focus; the account controls are not.
    it('fades the menu while the search has focus, but not the account controls', () => {
        const menu = stylesheet.split(
            ':focus-within) .zalf-navigation__primary {'
        )[1].split('}')[0];
        expect(menu).toContain('opacity: 0');
        expect(menu).toContain('pointer-events: none');
        expect(stylesheet).toNotContain(
            ':focus-within) .zalf-navigation__utilities-slot'
        );
    });

    it('compacts search and navigation at intermediate desktop widths', () => {
        expect(stylesheet).toContain('@media (min-width: 1200px) and (max-width: 1439px)');
        expect(stylesheet).toContain('flex-basis: clamp(160px, 14vw, 190px)');
        expect(stylesheet).toContain('@media (max-width: 1199px)');
    });

    // zalf-rdm/geonode#835: the menu used to shrink below its contents while its
    // links stayed nowrap, so a long translation overflowed onto the search field.
    it('holds the primary menu at its natural width and wraps as a last resort', () => {
        const primary = stylesheet.split('.zalf-navigation__primary {')[1].split('}')[0];
        expect(primary).toContain('min-width: fit-content');
        expect(primary).toContain('flex-wrap: wrap');
        expect(primary).toNotContain('min-width: 0');
    });

    // The search field has to be the one that gives way, so the tools column
    // must be shrinkable and the field must have a floor of its own.
    it('lets the tools column shrink before the menu does', () => {
        const tools = stylesheet.split('.zalf-navigation__tools {')[1].split('}')[0];
        expect(tools).toContain('flex: 0 1 auto');
        const search = stylesheet.split('.zalf-navigation__search-slot {')[1].split('}')[0];
        expect(search).toContain('min-width: 190px');
    });

    it('keeps the menu clear of the search field', () => {
        const content = stylesheet.split('.zalf-navigation__content {')[1].split('}')[0];
        expect(content).toContain('gap: 32px');
    });

    it('spaces the ORCID icon from its label', () => {
        expect(stylesheet).toContain('.zalf-navigation__utilities-slot #sign-in');
    });

    // "What is ORCID?" lives in the About dropdown, so the bar needs no rule
    // to keep it on one line or to hide it when space runs short.
    it('carries no leftover rules for the ORCID explanation link', () => {
        expect(stylesheet).toNotContain('zalf-navigation__orcid-info');
        expect(stylesheet).toNotContain('a[title="Why do we use ORCID?"]');
    });

    // zalf-rdm/geonode#866: the merged menu is grouped under labelled headings
    // instead of being halved by a bare separator.
    it('styles the group headings in the merged menu', () => {
        const heading = stylesheet.split('.zalf-navigation__dropdown-heading {')[1].split('}')[0];
        expect(heading).toContain('text-transform: uppercase');
        // zalf-rdm/geonode#883 turned the panel white, so the heading takes the
        // dark green muted colour, not the white-on-dark one the bar uses.
        expect(heading).toContain('color: var(--zalf-nav-panel-text-muted)');
    });

    // zalf-rdm/geonode#883: one flat colour across the bar — no gradient, and
    // no hairline that only one of the two navigations ever showed.
    it('paints the bar in one flat colour', () => {
        const bar = stylesheet.split('.zalf-navigation {')[1].split('}')[0];
        expect(bar).toContain('background: var(--zalf-nav-bg)');
        expect(bar).toNotContain('linear-gradient');
        expect(bar).toNotContain('border-bottom');
        expect(bar).toNotContain('backdrop-filter');
    });

    // The dropdowns are white panels with dark green text, so nothing inside
    // them may keep a white-on-dark colour.
    it('skins the dropdown panels light', () => {
        const panel = stylesheet.split('.zalf-navigation__dropdown-menu {')[1].split('}')[0];
        expect(panel).toContain('background: var(--zalf-nav-panel-bg)');
        expect(panel).toContain('color: var(--zalf-nav-panel-text)');
        const link = stylesheet.split('.zalf-navigation__dropdown-link {')[1].split('}')[0];
        expect(link).toContain('color: var(--zalf-nav-panel-text)');
        expect(stylesheet).toNotContain('var(--zalf-nav-highlight)');
        expect(stylesheet).toNotContain('var(--zalf-nav-hover-bg)');
    });

    it('rules off a heading only when links come before it', () => {
        expect(stylesheet).toContain(
            '.zalf-navigation__dropdown-link + .zalf-navigation__dropdown-heading'
        );
    });

    it('carries no leftover separator rule', () => {
        expect(stylesheet).toNotContain('zalf-navigation__dropdown-separator');
    });

    // zalf-rdm/geonode#863: the Tools menu leaves the repository, so its links
    // carry an "open in new" marker. It is drawn by ::after, which needs no
    // markup of its own in either navigation.
    it('marks external dropdown links with a generated icon', () => {
        const marker = stylesheet.split(
            '.zalf-navigation__dropdown-link.zalf-navigation__dropdown-link--external::after {'
        )[1].split('}')[0];
        expect(marker).toContain("content: ''");
        expect(marker).toContain('mask-image: @zalf-icon-external-link');
        // currentColor is what keeps the marker in step with the link, so it
        // needs no second rule per dropdown skin.
        expect(marker).toContain('background-color: currentColor');
    });

    // The build prefixes theme rules with `.msgapi`, so the base class already
    // weighs two classes. A lone modifier lost to its `display: block`, which
    // left the marker an inline box that ignored its width and height.
    it('names the base class alongside the external modifier', () => {
        expect(stylesheet).toContain(
            '.zalf-navigation__dropdown-link.zalf-navigation__dropdown-link--external {'
        );
        expect(stylesheet).toNotContain('\n.zalf-navigation__dropdown-link--external');
        const layout = stylesheet.split(
            '.zalf-navigation__dropdown-link.zalf-navigation__dropdown-link--external {'
        )[1].split('}')[0];
        expect(layout).toContain('display: flex');
        expect(layout).toContain('justify-content: space-between');
    });

    // The spoken half of the marker. It must stay out of the flex row, or it
    // becomes a third item competing with the label and the icon.
    it('hides the external-link text visually but not from screen readers', () => {
        const srOnly = stylesheet.split('.zalf-navigation__sr-only {')[1].split('}')[0];
        expect(srOnly).toContain('position: absolute');
        expect(srOnly).toContain('clip: rect(0, 0, 0, 0)');
        // display:none or visibility:hidden would take it out of the accessible
        // name as well, which is the one thing it exists for.
        expect(srOnly).toNotContain('display: none');
        expect(srOnly).toNotContain('visibility: hidden');
    });
});
