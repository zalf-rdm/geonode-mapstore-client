/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import url from 'url';
import isArray from 'lodash/isArray';
import { getMonitoredState } from '@mapstore/framework/utils/PluginsUtils';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import PluginsContainer from '@mapstore/framework/components/plugins/PluginsContainer';
import { requestResourceConfig, requestNewResourceConfig } from '@js/actions/gnresource';
import MetaTags from '@js/components/MetaTags';
import MainEventView from '@js/components/MainEventView';
import ViewerLayout from '@js/components/ViewerLayout';
import { createShallowSelector } from '@mapstore/framework/utils/ReselectUtils';
import { getResourceImageSource } from '@js/utils/ResourceUtils';
import useModulePlugins from '@mapstore/framework/hooks/useModulePlugins';
import { getPlugins } from '@mapstore/framework/utils/ModulePluginsUtils';

const urlQuery = url.parse(window.location.href, true).query;

const ConnectedPluginsContainer = connect(
    createShallowSelector(
        state => urlQuery.mode || (urlQuery.mobile || state.browser && state.browser.mobile ? 'mobile' : 'desktop'),
        state => getMonitoredState(state, getConfigProp('monitorState')),
        state => state?.controls,
        (mode, monitoredState, controls) => ({
            mode,
            monitoredState,
            pluginsState: controls
        })
    )
)(PluginsContainer);

const DEFAULT_PLUGINS_CONFIG = [];

// These tools are not required to request a dataset or render its first map.
// Load them shortly after the resource configuration so their chunks do not
// compete with metadata and initial WMS requests on a cold visit.
export const DATASET_VIEWER_DEFERRED_PLUGINS = [
    'SaveAs',
    'Save',
    'DeleteResource',
    'DownloadResource',
    'Measure',
    'Print',
    'PrintScale',
    'PrintGraticule',
    'PrintAuthor',
    'PrintCopyright',
    'Timeline',
    'Playback',
    'IsoDownload',
    'DublinCoreDownload',
    'DataCiteDownload',
    'LayerDownload',
    'AddLayer',
    'FilterLayer',
    'QueryPanel',
    'Locate',
    'ExecutionTracker'
];

const DATASET_VIEWER_DEFERRED_PLUGINS_SET = new Set(DATASET_VIEWER_DEFERRED_PLUGINS);

export function getPluginsConfiguration(name, pluginsConfig) {
    if (!pluginsConfig) {
        return DEFAULT_PLUGINS_CONFIG;
    }
    if (isArray(pluginsConfig)) {
        return pluginsConfig;
    }
    const { isMobile } = getConfigProp('geoNodeSettings') || {};
    if (isMobile && pluginsConfig) {
        return pluginsConfig[`${name}_mobile`] || pluginsConfig[name] || DEFAULT_PLUGINS_CONFIG;
    }
    return pluginsConfig[name] || DEFAULT_PLUGINS_CONFIG;
}

export function getInitialPluginsConfiguration(name, pluginsConfig, loadDeferredPlugins) {
    const configuration = getPluginsConfiguration(name, pluginsConfig);
    if (name !== 'dataset_viewer' || loadDeferredPlugins) {
        return configuration;
    }
    return configuration.filter((plugin) => {
        const pluginName = typeof plugin === 'string' ? plugin : plugin?.name;
        return !DATASET_VIEWER_DEFERRED_PLUGINS_SET.has(pluginName);
    });
}

export const canRequestResource = (name, pluginLoading) =>
    name === 'dataset_viewer' || !pluginLoading;

function ViewerRoute({
    name,
    pluginsConfig: propPluginsConfig,
    params,
    onUpdate,
    onCreate = () => {},
    loaderComponent,
    plugins,
    match,
    resource,
    siteName,
    resourceType,
    loadingConfig,
    configError,
    loaderStyle
}) {

    const { pk } = match.params || {};
    const shouldDeferPlugins = name === 'dataset_viewer' && pk !== 'new';
    const [loadDeferredPlugins, setLoadDeferredPlugins] = useState(!shouldDeferPlugins);
    const pluginsConfig = getInitialPluginsConfiguration(name, propPluginsConfig, loadDeferredPlugins);
    const pluginsCfgLength = pluginsConfig?.length;

    const { plugins: loadedPlugins, pending } = useModulePlugins({
        pluginsEntries: getPlugins(plugins, 'module'),
        pluginsConfig
    });

    const viewer = useRef({ requestedPk: undefined, prevPluginsLength: null });
    const { requestedPk, prevPluginsLength } = viewer.current ?? {};
    useEffect(() => {
        if (!prevPluginsLength || pluginsCfgLength === 0) {
            // to ensure and prevent loading and requesting of resource configurations
            // post initialization when user plugin is employed
            viewer.current.prevPluginsLength = pluginsCfgLength;
        }
    }, [pluginsCfgLength]);

    const pluginLoading = prevPluginsLength !== null && prevPluginsLength !== pluginsCfgLength ? false : pending;
    useEffect(() => {
        if (canRequestResource(name, pluginLoading) && pk !== requestedPk) {
            viewer.current.requestedPk = pk;
            if (pk === 'new') {
                onCreate(resourceType, {
                    params: match.params
                });
            } else {
                onUpdate(resourceType, pk, {
                    page: name,
                    params: match.params
                });
            }
        }
    }, [name, pluginLoading, pk, resourceType]);

    useEffect(() => {
        let timeout;
        if (shouldDeferPlugins && !loadDeferredPlugins && String(resource?.pk) === String(pk)) {
            timeout = setTimeout(() => setLoadDeferredPlugins(true), 1000);
        }
        return () => clearTimeout(timeout);
    }, [loadDeferredPlugins, pk, resource?.pk, shouldDeferPlugins]);

    const loading = loadingConfig || (!loadDeferredPlugins && pluginLoading);
    const parsedPlugins = useMemo(() => ({ ...loadedPlugins, ...getPlugins(plugins) }), [loadedPlugins]);
    const Loader = loaderComponent;
    const pageName = name === 'tabular-collection_viewer'
        ? 'tabular-collection'
        : name === 'tabular_viewer'
            ? 'tabular'
            : (resourceType || name);
    const className = `page-${pageName}-viewer page-viewer`;

    return (
        <>
            {resource && <MetaTags
                logo={() => getResourceImageSource(resource?.thumbnail_url)}
                title={(resource?.title) ? `${resource?.title} - ${siteName}` : siteName }
                siteName={siteName}
                contentURL={resource?.detail_url}
                content={resource?.abstract}
            />}
            <ConnectedPluginsContainer
                key={className}
                id={className}
                className={className}
                component={ViewerLayout}
                pluginsConfig={pluginsConfig}
                plugins={parsedPlugins}
                allPlugins={plugins}
                params={params}
            />
            {loading && Loader && <Loader style={loaderStyle}/>}
            {configError && <MainEventView msgId={configError}/>}
        </>
    );
}

ViewerRoute.propTypes = {
    onUpdate: PropTypes.func
};

const ConnectedViewerRoute = connect(
    createSelector([
        state => state?.gnresource?.data,
        state => state?.gnsettings?.siteName || 'GeoNode',
        state => state?.gnresource?.loadingResourceConfig,
        state => state?.gnresource?.configError
    ], (resource, siteName, loadingConfig, configError) => ({
        resource,
        siteName,
        loadingConfig,
        configError
    })),
    {
        onUpdate: requestResourceConfig,
        onCreate: requestNewResourceConfig

    }
)(ViewerRoute);

ConnectedViewerRoute.displayName = 'ConnectedViewerRoute';

export default ConnectedViewerRoute;
