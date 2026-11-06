/*
 * The catalogue is restricted to map resources, so that All Data, a topic card
 * and any other link into /catalogue/ all land on the same list.
 *
 * The restriction has to be declared TWICE in localConfig.json -- once on
 * ResourcesGrid, which fetches the results, and once on ResourcesFiltersForm,
 * which fetches the facet counts in the sidebar. Only the grid was set at
 * first, and the sidebar then advertised counts across every resource type
 * while the list showed maps only: a category could read "12" and return 2.
 * Nothing in the two plugins makes one follow the other, so these tests are
 * what keeps them in step.
 */

import expect from 'expect';

import localConfig from '../../../../static/mapstore/configs/localConfig.json';

const RESOURCE_TYPE_FILTER = 'filter{resource_type.in}';

function cataloguePlugin(name) {
    return (localConfig.plugins.catalogue || [])
        .filter((plugin) => plugin && plugin.name === name)[0];
}

describe('ZALF catalogue default query', () => {
    it('restricts the resource list to maps', () => {
        const cfg = cataloguePlugin('ResourcesGrid').cfg;
        expect(cfg.defaultQuery).toExist();
        expect(cfg.defaultQuery[RESOURCE_TYPE_FILTER]).toBe('map');
    });

    it('restricts the sidebar facet counts to maps as well', () => {
        const cfg = cataloguePlugin('ResourcesFiltersForm').cfg;
        expect(cfg.defaultQuery).toExist();
        expect(cfg.defaultQuery[RESOURCE_TYPE_FILTER]).toBe('map');
    });

    it('asks both plugins for exactly the same query', () => {
        // A mismatch is the failure mode that is invisible in the UI: results
        // and counts would disagree without either looking broken.
        expect(cataloguePlugin('ResourcesGrid').cfg.defaultQuery)
            .toEqual(cataloguePlugin('ResourcesFiltersForm').cfg.defaultQuery);
    });

    it('points the filters form at the grid it filters', () => {
        // defaultQuery on the form only describes the same resources if the
        // form is bound to that grid.
        expect(cataloguePlugin('ResourcesFiltersForm').cfg.resourcesGridId)
            .toBe(cataloguePlugin('ResourcesGrid').cfg.id);
    });

    it('uses the filter key the facets API publishes, not the `f` shorthand', () => {
        // `f` is resolved against `geoNodeCustomFilters`, which is empty in
        // this deployment -- getQueryParams drops an unmatched `f` entirely, so
        // `f: "map"` would silently filter nothing.
        expect(localConfig.geoNodeCustomFilters || {}).toEqual({});
        expect(cataloguePlugin('ResourcesGrid').cfg.defaultQuery.f).toBe(undefined);
    });
});
