/**
 * CUSTOM PATH: themes/zalf/plugins/ZalfResourcesGridPlugin.jsx
 * REASON: Replaces the core ResourcesGrid plugin + container to move ResourcesMenu
 * outside ResourcesContainer, enabling position:sticky to work correctly when the
 * catalogue page does not have a local overflow scroll context.
 *
 * Derived from:
 *   MapStore2/web/client/plugins/ResourcesCatalog/ResourcesGrid.jsx  (plugin wrapper)
 *   MapStore2/web/client/plugins/ResourcesCatalog/containers/ResourcesGrid.jsx (container)
 *
 * Only structural difference from upstream: ResourcesMenu is rendered as a sibling
 * BEFORE ResourcesContainer (not as ResourcesContainer's header prop).
 */

// Uses React.createElement — themes/zalf/ is outside babel-loader include, JSX not supported here.
import React, { useEffect, useRef } from 'react';
const ce = React.createElement;
import { push } from 'connected-react-router';
import isArray from 'lodash/isArray';
import url from 'url';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { withResizeDetector } from 'react-resize-detector';
import { Glyphicon } from 'react-bootstrap';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { userSelector } from '@mapstore/framework/selectors/security';
import {
    getMonitoredStateSelector,
    getRouterLocation
} from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import useQueryResourcesByLocation from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useQueryResourcesByLocation';
import useParsePluginConfigExpressions from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useParsePluginConfigExpressions';
import useCardLayoutStyle from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useCardLayoutStyle';
import useLocalStorage from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useLocalStorage';
import ZalfResourcesContainer from '../components/ZalfResourcesContainer';
import Button from '@mapstore/framework/components/layout/Button';
import TargetSelectorPortal from '@mapstore/framework/plugins/ResourcesCatalog/components/TargetSelectorPortal';
import PaginationCustom from '@mapstore/framework/plugins/ResourcesCatalog/components/PaginationCustom';
import ResourcesMenu from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourcesMenu';
import useResourcePanelWrapper from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useResourcePanelWrapper';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import { isMenuItemSupportedSupported } from '@mapstore/framework/utils/ResourcesUtils';
import usePluginItems from '@mapstore/framework/hooks/usePluginItems';
import { hashLocationToHref } from '@mapstore/framework/utils/ResourcesFiltersUtils';
import { getCatalogResources } from '@mapstore/framework/api/persistence';
import {
    loadingResources,
    resetSearchResources,
    setResourceTypes,
    updateResources,
    updateResourcesMetadata
} from '@mapstore/framework/plugins/ResourcesCatalog/actions/resources';
import {
    getResourcesLoading,
    getResourcesError,
    getIsFirstRequest,
    getTotalResources,
    getCurrentPage,
    getSearch,
    getCurrentParams,
    getResources,
    getSelectedResource
} from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import resourcesEpics from '@mapstore/framework/plugins/ResourcesCatalog/epics/resources';
import resourcesReducer from '@mapstore/framework/plugins/ResourcesCatalog/reducers/resources';
import { formatUsernameFallback } from '@js/utils/SearchUtils';

// ─── Resource pre-processing (replaces MapStore2 ResourcesUtils virtual paths) ──

const formatAuthorCitation = (person = {}) => {
    if (!person.last_name && !person.first_name) {
        return formatUsernameFallback(person.username);
    }
    const initial = person.first_name ? person.first_name.charAt(0).toUpperCase() + '.' : '';
    return [person.last_name, initial].filter(Boolean).join(', ');
};

const resolveVirtualPaths = (resource) => {
    if (!resource) return resource;
    const authors = Array.isArray(resource.author) ? resource.author : [];
    const authorDisplay = authors.map(formatAuthorCitation).filter(Boolean).join('; ')
        || formatAuthorCitation(resource.owner);
    return {
        ...resource,
        author: authorDisplay || resource.author,
        author_citation: authorDisplay || resource.author,
        catalogue_summary: resource.abstract || resource.raw_abstract
            || resource.description || resource.catalogue_summary
    };
};

// ─── Container ───────────────────────────────────────────────────────────────

const defaultGetMainMessageId = ({ id, query, user, isFirstRequest, error, resources, loading }) => {
    const hasResources = resources?.length > 0;
    const hasFilter = Object.keys(query || {}).filter(key => key !== 'sort').length > 0;
    const hasQuery = !!(query?.q);
    const isLoggedIn = !!user;
    const messageId = !hasResources && !isFirstRequest && !loading
        ? error && `resourcesCatalog.errorResourcePage`
        || hasQuery && `resourcesCatalog.noResultsWithQuery`
        || hasFilter && `resourcesCatalog.noResultsWithFilter`
        || isLoggedIn && `resourcesCatalog.${id}Section.noContentYet`
        || `resourcesCatalog.${id}Section.noPublicContent`
        : undefined;
    return messageId;
};

function ZalfResourcesGridContainer({
    id,
    location,
    user,
    totalResources,
    loading,
    defaultQuery,
    order = {},
    menuItems = [],
    pageSize = 12,
    panel,
    cardLayoutStyle: cardLayoutStyleProp = null,
    defaultCardLayoutStyle: defaultCardLayoutStyleProp = 'grid',
    selectedResource,
    configuredItems,
    targetSelector = '',
    monitoredState,
    headerNodeSelector = '#ms-brand-navbar',
    navbarNodeSelector = '',
    footerNodeSelector = '#ms-footer',
    width,
    height,
    error,
    onPush,
    setLoading,
    setResources,
    setResourcesMetadata,
    resources,
    isFirstRequest,
    requestResources,
    titleId,
    queryPage,
    page: pageProp,
    theme = 'main',
    metadata: metadataProp,
    getMainMessageId = defaultGetMainMessageId,
    search,
    onResetSearch,
    hideWithNoResults,
    formatHref,
    storedParams,
    hideThumbnail,
    openInNewTab,
    resourcesFoundMsgId,
    availableResourceTypes
}, context) {

    const { query } = url.parse(location.search, true);
    const _page = queryPage ? query.page : pageProp;
    const page = _page ? parseFloat(_page) : 1;

    const { search: onSearch } = useQueryResourcesByLocation({
        id,
        request: requestResources,
        location,
        onPush,
        setLoading,
        setResources,
        setResourcesMetadata,
        defaultQuery,
        pageSize,
        monitoredState,
        user,
        queryPage,
        onReset: () => onResetSearch(id),
        search,
        storedParams
    });

    const { cardLayoutStyle, setCardLayoutStyle, hideCardLayoutButton } = useCardLayoutStyle({
        cardLayoutStyle: cardLayoutStyleProp,
        defaultCardLayoutStyle: defaultCardLayoutStyleProp
    });

    const { stickyTop, stickyBottom } = useResourcePanelWrapper({
        headerNodeSelector,
        navbarNodeSelector,
        footerNodeSelector,
        width,
        height,
        active: !panel
    });

    const defaultTarget = openInNewTab ? '_blank' : undefined;
    const parsedConfig = useParsePluginConfigExpressions(
        monitoredState,
        { menuItems, order, metadata: metadataProp },
        context?.plugins?.requires,
        { filterFunc: item => isMenuItemSupportedSupported(item, availableResourceTypes, user) }
    );

    const isValidItem = (target) => (item) =>
        item.target === target && (!item?.cfg?.resourcesGridId || item?.cfg?.resourcesGridId === id);

    const cardOptions = configuredItems.filter(isValidItem('card-options')).sort((a, b) => a.position - b.position);
    const cardButtons = configuredItems.filter(isValidItem('card-buttons')).sort((a, b) => a.position - b.position);
    const menuItemsLeft = configuredItems.filter(isValidItem('left-menu')).sort((a, b) => a.position - b.position);
    const menuItemsRight = configuredItems.filter(isValidItem('right-menu')).sort((a, b) => a.position - b.position);
    const { Component: cardComponent } = configuredItems.find(isValidItem('card')) || {};

    function handleUpdate(newParams) {
        onSearch(newParams);
    }

    const [metadataColumns, setMetadataColumns] = useLocalStorage('metadataColumns', {});
    const columnsId = user?.name ? 'authenticated' : 'anonymous';
    const columns = metadataColumns?.[columnsId] || [];
    const metadata = isArray(parsedConfig.metadata) ? parsedConfig.metadata : parsedConfig.metadata[cardLayoutStyle];

    // ZALF: ResourcesMenu is rendered OUTSIDE ResourcesContainer so that
    // `position: sticky` (set via CSS on .ms-resources-grid > .ms-resources-menu)
    // works correctly regardless of the scroll context.
    // Resources are pre-processed here to resolve virtual paths (author, catalogue_summary)
    // without modifying MapStore2's ResourcesUtils.js.
    const processedResources = resources.map(resolveVirtualPaths);

    return ce(TargetSelectorPortal, { targetSelector },
        ce('div', {
            className: `ms-resources-grid${panel ? ' _panel' : ''}${hideWithNoResults && !resources.length ? ' _hidden' : ''}`,

        },
            ce(ResourcesMenu, {
                key: columnsId,
                theme,
                titleId,
                resourcesGridId: id,
                menuItemsLeft,
                menuItems: [...parsedConfig.menuItems, ...menuItemsRight],
                orderConfig: parsedConfig.order,
                totalResources,
                loading,
                cardLayoutStyle,
                setCardLayoutStyle,
                hideCardLayoutButton,
                query,
                metadata,
                columns,
                setColumns: (newColumns) => setMetadataColumns({ ...metadataColumns, [columnsId]: newColumns }),
                formatHref,
                target: defaultTarget,
                resourcesFoundMsgId
            }),
            ce(ZalfResourcesContainer, {
                id,
                theme,
                resources: processedResources,
                isFirstRequest,
                loading,
                error,
                cardLayoutStyle,
                query,
                columns,
                metadata,
                target: defaultTarget,
                footer: ce(FlexBox, {
                    classNames: [`ms-${theme}-colors`, '_padding-tb-sm', 'ms-resources-grid-footer'],
                    centerChildren: true
                },
                    error
                        ? ce(Button, { variant: 'primary', href: '#/' }, ce(Glyphicon, { glyph: 'refresh' }))
                        : (!loading || !!totalResources) && ce(PaginationCustom, {
                            items: Math.ceil(totalResources / pageSize),
                            activePage: page,
                            onSelect: (value) => handleUpdate({ page: value })
                        })
                ),
                user,
                cardOptions,
                cardButtons,
                cardComponent,
                isCardActive: res => res?.id === selectedResource?.id,
                getMainMessageId,
                formatHref,
                hideThumbnail
            })
        )
    );
}

ZalfResourcesGridContainer.contextTypes = {
    plugins: PropTypes.object
};

const ConnectedZalfResourcesGrid = connect(
    createStructuredSelector({
        user: userSelector,
        location: getRouterLocation,
        monitoredState: getMonitoredStateSelector
    }),
    { onPush: push }
)(withResizeDetector(ZalfResourcesGridContainer));

// ─── Plugin wrapper ───────────────────────────────────────────────────────────

function ZalfResourcesGrid({
    items,
    order = {
        defaultLabelId: 'resourcesCatalog.orderBy',
        options: [
            { label: 'Most recent', labelId: 'resourcesCatalog.mostRecent', value: '-creation' },
            { label: 'Less recent', labelId: 'resourcesCatalog.lessRecent', value: 'creation' },
            { label: 'A Z', labelId: 'resourcesCatalog.aZ', value: 'name' },
            { label: 'Z A', labelId: 'resourcesCatalog.zA', value: '-name' }
        ]
    },
    metadata = {
        list: [
            { path: 'name', target: 'header', width: 20, labelId: 'resourcesCatalog.columnName' },
            { path: 'description', width: 20, labelId: 'resourcesCatalog.columnDescription' },
            {
                path: 'tags', filter: 'filter{tag.in}', itemValue: 'name', itemColor: 'color',
                width: 30, type: 'tag', noDataLabelId: 'resourcesCatalog.emptyNA',
                labelId: 'resourcesCatalog.columnTags'
            },
            {
                path: 'lastUpdate', type: 'date', format: 'MMM Do YY, h:mm:ss a', width: 20,
                icon: { glyph: 'time' }, labelId: 'resourcesCatalog.columnLastModified',
                noDataLabelId: 'resourcesCatalog.emptyNA'
            },
            {
                path: 'author_citation',
                showFullContent: true,
                icon: { glyph: 'user' }, width: 10, labelId: 'resourcesCatalog.columnCreatedBy',
                noDataLabelId: 'resourcesCatalog.emptyUnknown'
            }
        ],
        grid: [
            { path: 'name', target: 'header' },
            {
                path: 'tags', filter: 'filter{tag.in}', itemValue: 'name', itemColor: 'color',
                type: 'tag', showFullContent: true
            },
            {
                path: 'author_citation',
                showFullContent: true,
                icon: { glyph: 'user' }, noDataLabelId: 'resourcesCatalog.emptyUnknown',
                tooltipId: 'resourcesCatalog.columnCreatedBy'
            }
        ]
    },
    resourceTypes = ['MAP', 'DASHBOARD', 'GEOSTORY', 'CONTEXT'],
    onSetResourceTypes,
    ...props
}, context) {

    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins }, []);
    const init = useRef(false);

    useEffect(() => {
        if (!init.current) {
            init.current = true;
            onSetResourceTypes(resourceTypes);
        }
    });

    const updatedLocation = useRef();
    updatedLocation.current = props.location;

    function handleFormatHref(options) {
        return hashLocationToHref({
            location: updatedLocation.current,
            excludeQueryKeys: ['page'],
            ...options
        });
    }

    return ce(ConnectedZalfResourcesGrid, {
        ...props,
        order,
        requestResources: (...args) => getCatalogResources(...args, resourceTypes).toPromise(),
        configuredItems,
        metadata,
        formatHref: handleFormatHref,
        availableResourceTypes: resourceTypes
    });
}

ZalfResourcesGrid.contextTypes = {
    plugins: PropTypes.object
};

const ZalfResourcesGridPlugin = connect(
    createStructuredSelector({
        totalResources: getTotalResources,
        loading: getResourcesLoading,
        location: getRouterLocation,
        resources: getResources,
        selectedResource: getSelectedResource,
        error: getResourcesError,
        isFirstRequest: getIsFirstRequest,
        page: getCurrentPage,
        search: getSearch,
        storedParams: getCurrentParams
    }),
    {
        setLoading: loadingResources,
        setResources: updateResources,
        setResourcesMetadata: updateResourcesMetadata,
        onResetSearch: resetSearchResources,
        onSetResourceTypes: setResourceTypes
    }
)(ZalfResourcesGrid);

export default createPlugin('ResourcesGrid', {
    component: ZalfResourcesGridPlugin,
    containers: {},
    epics: resourcesEpics,
    reducers: {
        resources: resourcesReducer
    }
});
