/**
 * CUSTOM PATH: themes/zalf/plugins/ZalfResourcesFiltersFormPlugin.jsx
 * REASON: Replaces the core ResourcesFiltersForm plugin with a ZALF version
 * that uses ZalfFiltersForm (collapsible toggle header) and always renders
 * the panel as a static sidebar (no floating overlay, no toolbar toggle).
 *
 * Adapted from MapStore2 ResourcesFiltersForm — only the FiltersForm component
 * and the createPlugin registration differ.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import url from 'url';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import resourcesReducer from '@mapstore/framework/plugins/ResourcesCatalog/reducers/resources';
import ZalfFiltersForm from '../components/ZalfFiltersForm';
import {
    getAvailableResourceTypes,
    getMonitoredStateSelector,
    getRouterLocation
} from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import { searchResources } from '@mapstore/framework/plugins/ResourcesCatalog/actions/resources';
import useParsePluginConfigExpressions from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useParsePluginConfigExpressions';
import useFilterFacets from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useFilterFacets';
import ResourcesPanelWrapper from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourcesPanelWrapper';
import TargetSelectorPortal from '@mapstore/framework/plugins/ResourcesCatalog/components/TargetSelectorPortal';
import { userSelector } from '@mapstore/framework/selectors/security';
import { getCatalogFacets } from '@mapstore/framework/api/persistence';
import { isMenuItemSupportedSupported } from '@mapstore/framework/utils/ResourcesUtils';
import { mergeDefaultQuery } from '@mapstore/framework/utils/ResourcesFiltersUtils';

function ZalfResourcesFiltersForm({
    id = 'ms-filter-form',
    resourcesGridId,
    onSearch,
    defaultQuery,
    extent = {
        layers: [{ type: 'osm', title: 'Open Street Map', name: 'mapnik', source: 'osm', group: 'background', visibility: true }],
        style: { color: '#397AAB', opacity: 0.8, fillColor: '#397AAB', fillOpacity: 0.4, weight: 4 }
    },
    fields: fieldsProp = [],
    monitoredState,
    location,
    targetSelector,
    user,
    availableResourceTypes
}, context) {

    const { query } = url.parse(location.search, true);
    const updatedQuery = defaultQuery ? mergeDefaultQuery(query, defaultQuery) : query;

    const parsedConfig = useParsePluginConfigExpressions(
        monitoredState,
        { extent, fields: fieldsProp },
        context?.plugins?.requires,
        { filterFunc: item => isMenuItemSupportedSupported(item, availableResourceTypes, user) }
    );

    const { fields } = useFilterFacets({
        query: updatedQuery,
        fields: parsedConfig.fields,
        request: (...args) => getCatalogFacets(...args).toPromise(),
        monitoredState,
        visible: true
    }, [user]);

    return React.createElement(
        TargetSelectorPortal,
        { targetSelector },
        React.createElement(
            ResourcesPanelWrapper,
            {
                className: 'ms-resources-filter',
                top: 0,
                bottom: 0,
                show: true,
                enabled: true
            },
            React.createElement(ZalfFiltersForm, {
                id,
                extentProps: parsedConfig.extent,
                fields,
                query: updatedQuery,
                defaultQuery,
                onChange: (params) => onSearch({ params }, resourcesGridId),
                onClear: () => onSearch({ clear: true }, resourcesGridId),
                onClose: () => {}
            })
        )
    );
}

ZalfResourcesFiltersForm.contextTypes = {
    plugins: PropTypes.object
};

const Connected = connect(
    createStructuredSelector({
        user: userSelector,
        location: getRouterLocation,
        monitoredState: getMonitoredStateSelector,
        availableResourceTypes: getAvailableResourceTypes
    }),
    { onSearch: searchResources }
)(ZalfResourcesFiltersForm);

export default createPlugin('ResourcesFiltersForm', {
    component: Connected,
    containers: {},
    epics: {},
    reducers: { resources: resourcesReducer }
});
