/**
 * Dedicated spatial-discovery view for the ZALF catalogue.
 *
 * The URL remains the source of truth for applied filters. Map movement only
 * updates a local candidate extent; the catalogue request changes after the
 * user explicitly presses "Search this area".
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import omit from 'lodash/omit';
import BaseMap from '@mapstore/framework/components/map/BaseMap';
import mapTypeHOC from '@mapstore/framework/components/map/enhancers/mapType';
import ZoomTo from '@mapstore/framework/plugins/ResourcesCatalog/components/ZoomTo';
import { boundsToExtentString, getFeatureFromExtent } from '@mapstore/framework/plugins/ResourcesCatalog/utils/ResourcesCoordinatesUtils';
import { getCatalogResources } from '@mapstore/framework/api/persistence';
import { CATALOGUE_CARD_FIELDS } from '@js/api/geonode/v2';
import ZalfMapExtentSelector from './ZalfMapExtentSelector';
import {
    formatExtent,
    getAvailabilityClusters,
    getMappableResources,
    getResourceFeature,
    getSpatialQuality,
    isSearchableExtent
} from '../utils/MapSearchUtils';

const ce = React.createElement;
const Map = mapTypeHOC(BaseMap);
Map.displayName = 'ZalfCatalogueMap';

const MAP_RESULT_LIMIT = 200;
const MAP_FIELDS = [...CATALOGUE_CARD_FIELDS, 'extent', 'geo_keywords'];

const resultStyle = {
    color: '#256d46',
    opacity: 0.88,
    fillColor: '#6dbb8b',
    fillOpacity: 0.18,
    weight: 1.5
};

const activeResultStyle = {
    color: '#0f5132',
    opacity: 1,
    fillColor: '#f2c94c',
    fillOpacity: 0.34,
    weight: 3
};

const administrativeResultStyle = {
    color: '#725b18',
    opacity: 0.92,
    fillColor: '#f2c94c',
    fillOpacity: 0.14,
    weight: 2,
    dashArray: [6, 4]
};

const selectionStyle = {
    color: '#163f2b',
    opacity: 1,
    fillColor: '#2d7e4e',
    fillOpacity: 0.1,
    weight: 2.5,
    dashArray: [7, 5]
};

const getAvailabilityStyle = (count) => {
    const radius = Math.min(18, 9 + Math.log2(Math.max(1, count)) * 2);
    return [
        {
            radius,
            color: '#fff',
            opacity: 1,
            fillColor: '#256d46',
            fillOpacity: 0.94,
            weight: 2,
            zIndex: 1000
        },
        {
            label: String(count),
            font: '700 12px Arial',
            fontSize: 12,
            offsetY: 1,
            color: '#163f2b',
            weight: 3,
            fillColor: '#fff',
            fillOpacity: 1,
            zIndex: 1001
        }
    ];
};

const joinSpatialMetadata = (resources, spatialResources) => {
    const byId = spatialResources.reduce((acc, resource) => ({
        ...acc,
        [String(resource.id || resource.pk)]: resource
    }), {});
    return resources.map((resource) => ({
        ...resource,
        ...(byId[String(resource.id || resource.pk)] || {})
    }));
};

const buildResourceFeatures = (resources, activeResourceId) => resources.map((resource) => {
    const id = String(resource.id || resource.pk);
    const feature = getResourceFeature(resource);
    const quality = getSpatialQuality(resource);
    if (!feature) {
        return null;
    }
    return {
        ...feature,
        id: `catalogue-resource-${id}`,
        properties: {
            resourceId: id,
            title: resource.name || resource.title
        },
        style: id === String(activeResourceId)
            ? activeResultStyle
            : quality.key === 'administrative'
                ? administrativeResultStyle
                : resultStyle
    };
}).filter(Boolean);

const getIntersectedResourceId = (event) => event?.intersectedFeatures
    ?.find(({ id }) => id === 'zalf-map-search-results')
    ?.features?.[0]?.properties?.resourceId;

const ResultItem = ({ resource, active, onActivate }) => {
    const id = String(resource.id || resource.pk);
    const title = resource.name || resource.title || 'Untitled resource';
    const summary = resource.catalogue_summary || resource.abstract || resource.description;
    const viewerUrl = resource?.['@extras']?.info?.viewerUrl || resource.detail_url;
    const quality = getSpatialQuality(resource);
    return ce('li', {
        id: `zalf-map-result-${id}`,
        className: `zalf-map-search__result${active ? ' is-active' : ''}`,
        onMouseEnter: () => onActivate(id),
        onMouseLeave: () => onActivate(null),
        onFocus: () => onActivate(id),
        onBlur: () => onActivate(null)
    },
    ce('div', { className: 'zalf-map-search__result-heading' },
        ce('span', { className: 'zalf-map-search__resource-type' }, resource.subtype || resource.resource_type || 'resource')
    ),
    viewerUrl
        ? ce('a', { className: 'zalf-map-search__result-title', href: viewerUrl }, title)
        : ce('span', { className: 'zalf-map-search__result-title' }, title),
    summary ? ce('p', { className: 'zalf-map-search__result-summary' }, summary) : null,
    quality.key === 'metadata' && resource.geo_keywords?.length
        ? ce('p', { className: 'zalf-map-search__places' },
            ce('span', { className: 'fa fa-map-marker', 'aria-hidden': 'true' }),
            ' ', resource.geo_keywords.map(({ name }) => name).filter(Boolean).join(' · ')
        )
        : null,
    viewerUrl
        ? ce('div', { className: 'zalf-map-search__result-actions' },
            ce('a', { className: 'zalf-map-search__view', href: viewerUrl },
                'View', ce('span', { className: 'fa fa-arrow-right', 'aria-hidden': 'true' })))
        : null
    );
};

export default function ZalfMapSearch({
    resources = [],
    totalResources = 0,
    loading,
    query = {},
    monitoredState,
    onApplyExtent = () => {},
    onClearExtent = () => {},
    footer,
    loadResources,
    MapComponent = Map
}) {
    const appliedExtent = query.extent;
    const [viewportExtent, setViewportExtent] = useState(appliedExtent);
    const [candidateExtent, setCandidateExtent] = useState(appliedExtent);
    const [drawing, setDrawing] = useState(false);
    const [activeResourceId, setActiveResourceId] = useState(null);
    const [spatialResources, setSpatialResources] = useState([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState(false);
    const [mobileView, setMobileView] = useState('map');
    const [mapZoom, setMapZoom] = useState(3);
    const loadResourcesRef = useRef(loadResources);
    loadResourcesRef.current = loadResources;

    const requestQuery = useMemo(() => omit(query, ['page', 'catalogue_view']), [JSON.stringify(query)]);

    useEffect(() => {
        let mounted = true;
        setMapLoading(true);
        setMapError(false);
        const loader = loadResourcesRef.current || ((params) => getCatalogResources({
            params,
            monitoredState
        }).toPromise());
        loader({
            ...requestQuery,
            page: 1,
            pageSize: MAP_RESULT_LIMIT,
            include: MAP_FIELDS
        })
            .then((response = {}) => {
                if (mounted) {
                    setSpatialResources(response.resources || []);
                }
            })
            .catch(() => {
                if (mounted) {
                    setSpatialResources([]);
                    setMapError(true);
                }
            })
            .finally(() => mounted && setMapLoading(false));
        return () => {
            mounted = false;
        };
    }, [JSON.stringify(requestQuery), monitoredState]);

    useEffect(() => {
        setCandidateExtent(appliedExtent);
    }, [appliedExtent]);

    const handleMapViewChanges = useCallback((center, zoom, bbox) => {
        if (Number.isFinite(zoom)) {
            setMapZoom(zoom);
        }
        if (!bbox?.bounds) {
            return;
        }
        const nextExtent = boundsToExtentString(bbox.bounds, bbox.crs);
        setViewportExtent(nextExtent);
    }, []);

    const handleDrawnExtent = useCallback((extent) => {
        const nextExtent = formatExtent(extent);
        setCandidateExtent(nextExtent);
        setDrawing(false);
        if (isSearchableExtent(nextExtent)) {
            onApplyExtent(nextExtent);
        }
    }, [onApplyExtent]);

    const useCurrentView = () => {
        if (!isSearchableExtent(viewportExtent)) {
            return;
        }
        setCandidateExtent(viewportExtent);
        setDrawing(false);
        onApplyExtent(viewportExtent);
    };

    const clearArea = () => {
        setCandidateExtent(undefined);
        setDrawing(false);
        onClearExtent();
    };

    const mappableResources = useMemo(() => getMappableResources(spatialResources), [spatialResources]);
    const enrichedResources = useMemo(
        () => joinSpatialMetadata(resources, spatialResources),
        [resources, spatialResources]
    );
    const resultFeatures = useMemo(
        () => buildResourceFeatures(mappableResources, activeResourceId),
        [mappableResources, activeResourceId]
    );
    const availabilityFeatures = useMemo(
        () => getAvailabilityClusters(mappableResources, mapZoom)
            .map((feature) => ({
                ...feature,
                style: getAvailabilityStyle(feature.properties.count)
            })),
        [mappableResources, mapZoom]
    );
    const candidateIsValid = isSearchableExtent(candidateExtent);
    const selectedFeature = candidateExtent && candidateIsValid
        ? { ...getFeatureFromExtent(candidateExtent), id: 'search-area', style: selectionStyle }
        : null;
    const viewportIsValid = isSearchableExtent(viewportExtent);

    const handleMapClick = (event) => {
        const resourceId = getIntersectedResourceId(event);
        if (resourceId) {
            setActiveResourceId(resourceId);
            document.getElementById(`zalf-map-result-${resourceId}`)?.scrollIntoView({ block: 'nearest' });
        }
    };

    return ce('section', {
        className: 'zalf-map-search',
        'data-mobile-view': mobileView,
        'aria-label': 'Search catalogue by map'
    },
    ce('div', { className: 'zalf-map-search__mobile-switch', role: 'group', 'aria-label': 'Map search view' },
        ce('button', {
            type: 'button',
            className: mobileView === 'map' ? 'is-active' : '',
            'aria-pressed': mobileView === 'map',
            onClick: () => setMobileView('map')
        }, ce('span', { className: 'fa fa-map-o', 'aria-hidden': 'true' }), ' Map'),
        ce('button', {
            type: 'button',
            className: mobileView === 'results' ? 'is-active' : '',
            'aria-pressed': mobileView === 'results',
            onClick: () => setMobileView('results')
        }, ce('span', { className: 'fa fa-list', 'aria-hidden': 'true' }), ` Results (${totalResources})`)
    ),
    ce('aside', { className: 'zalf-map-search__results', 'aria-label': 'Catalogue results' },
        ce('ul', { className: 'zalf-map-search__result-list' },
            ...(loading && !enrichedResources.length
                ? [ce('li', { key: 'loading', className: 'zalf-map-search__loading' }, 'Loading results…')]
                : enrichedResources.map((resource) => ce(ResultItem, {
                    key: resource.id || resource.pk,
                    resource,
                    active: String(resource.id || resource.pk) === String(activeResourceId),
                    onActivate: setActiveResourceId
                })))
        ),
        footer
    ),
    ce('div', { className: 'zalf-map-search__map-column' },
        ce('div', {
            className: `zalf-map-search__map${drawing ? ' is-drawing' : ''}`,
            role: 'region',
            'aria-label': 'Interactive catalogue search map'
        },
        ce(MapComponent, {
            id: 'zalf-catalogue-map-search',
            mapType: 'openlayers',
            map: {
                registerHooks: false,
                projection: 'EPSG:3857',
                center: { x: 10, y: 25, crs: 'EPSG:4326' },
                zoom: 3
            },
            styleMap: { position: 'absolute', width: '100%', height: '100%' },
            eventHandlers: {
                onMapViewChanges: handleMapViewChanges,
                onClick: handleMapClick,
                onMouseMove: (event) => setActiveResourceId(getIntersectedResourceId(event) || null)
            },
            layers: [
                {
                    type: 'osm', title: 'OpenStreetMap', name: 'mapnik', source: 'osm',
                    group: 'background', visibility: true
                },
                { id: 'zalf-map-search-results', type: 'vector', features: resultFeatures },
                { id: 'zalf-map-search-availability', type: 'vector', features: availabilityFeatures },
                ...(selectedFeature
                    ? [{ id: 'zalf-map-search-area', type: 'vector', features: [selectedFeature] }]
                    : [])
            ]
        },
        appliedExtent ? ce(ZoomTo, { extent: appliedExtent, nearest: false }) : null,
        ce(ZalfMapExtentSelector, { active: drawing, onSelect: handleDrawnExtent })
        ),
        !appliedExtent && !mapLoading
            ? ce('div', { className: 'zalf-map-search__map-guide', role: 'note' },
                ce('span', { className: 'fa fa-map-marker', 'aria-hidden': 'true' }),
                ce('div', null,
                    ce('strong', null, 'Choose an area to search'),
                    ce('span', null, 'Draw a rectangle or click “Use map view” to filter the catalogue.'),
                    ce('small', null, 'Green numbered markers show where catalogue data is available.')))
            : null,
        ce('div', { className: 'zalf-map-search__floating-tools', role: 'group', 'aria-label': 'Choose search area' },
            ce('button', {
                type: 'button',
                disabled: !appliedExtent,
                title: 'Clear search area',
                'aria-label': 'Clear search area',
                onClick: clearArea
            },
            ce('span', { className: 'fa fa-eraser', 'aria-hidden': 'true' }),
            ce('span', { className: 'zalf-map-search__tool-label' }, ' Clear area')),
            ce('button', {
                type: 'button',
                className: drawing ? 'is-active' : '',
                title: drawing ? 'Cancel drawing' : 'Draw rectangle and search',
                'aria-label': drawing ? 'Cancel drawing' : 'Draw rectangle and search',
                'aria-pressed': drawing,
                onClick: () => setDrawing(!drawing)
            },
            ce('span', { className: 'fa fa-object-group', 'aria-hidden': 'true' }),
            ce('span', { className: 'zalf-map-search__tool-label' }, drawing ? ' Cancel drawing' : ' Draw rectangle')),
            ce('button', {
                type: 'button',
                disabled: !viewportIsValid,
                title: viewportIsValid ? 'Search this map view' : 'Zoom in before searching this map view',
                'aria-label': viewportIsValid ? 'Search this map view' : 'Zoom in before searching this map view',
                onClick: useCurrentView
            },
            ce('span', { className: 'fa fa-arrows-alt', 'aria-hidden': 'true' }),
            ce('span', { className: 'zalf-map-search__tool-label' }, ' Use map view'))
        ),
        ce('span', { className: 'sr-only', 'aria-live': 'polite' },
            drawing ? 'Drawing mode active. Drag on the map to select and search an area.' : ''),
        (mapLoading || mapError)
            ? ce('div', { className: 'zalf-map-search__map-message', role: mapError ? 'alert' : 'status' },
                mapError ? 'Map coverage could not be loaded. The result list is still available.' : 'Loading map coverage…')
            : null
        )
    ));
}

export { MAP_FIELDS, MAP_RESULT_LIMIT, joinSpatialMetadata };
