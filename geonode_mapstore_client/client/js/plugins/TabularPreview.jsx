import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TabularPreview.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { describeFeatureType, getFeatureSimple } from '@mapstore/framework/api/WFS';

import Table from '@js/components/Table';
import resourceReducer from '@js/reducers/gnresource';

const PAGE_SIZE = 200;

function propertyToKey(property) {
    return `${property}`;
}

function headerFromFeatures(data) {
    const feature = data?.features?.[0];
    const properties = feature?.properties || {};
    return Object.keys(properties).map((p) => ({ value: p, key: propertyToKey(p) }));
}

function rowsFromFeatures(data) {
    const features = data?.features || [];
    return features.map((feature) => {
        const row = {};
        const properties = feature?.properties || {};
        Object.keys(properties)
            .forEach(name => Object.assign(row, { [propertyToKey(name)]: properties[name] }));
        return row;
    });
}

export function TableComponent({ owsUrl, typeName }) {
    const [header, setHeader] = useState(null);
    const [rows, setRows] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const offsetRef = useRef(0);
    const fetchingRef = useRef(false);
    const scrollRef = useRef(null);
    const activeRequestRef = useRef(0);

    const fetchPage = useCallback(async (startIndex) => {
        if (!owsUrl || fetchingRef.current) return;
        const requestId = ++activeRequestRef.current;
        fetchingRef.current = true;
        setLoading(true);
        try {
            const data = await getFeatureSimple(owsUrl, {
                typeName,
                maxFeatures: PAGE_SIZE,
                startIndex
            });
            if (requestId !== activeRequestRef.current) return;
            if (data.features?.length > 0) {
                setHeader(prev => prev || headerFromFeatures(data));
            }
            const newRows = rowsFromFeatures(data);
            setRows(prev => [...prev, ...newRows]);
            offsetRef.current = startIndex + newRows.length;
            if (newRows.length < PAGE_SIZE) {
                setHasMore(false);
            }
        } catch (e) {
            if (requestId === activeRequestRef.current) setError(e);
        } finally {
            if (requestId === activeRequestRef.current) {
                fetchingRef.current = false;
                setLoading(false);
            }
        }
    }, [owsUrl, typeName]);

    // Reset and fetch first page when owsUrl/typeName change
    useEffect(() => {
        if (owsUrl && typeName) {
            activeRequestRef.current++;
            setRows([]);
            setHeader(null);
            setHasMore(true);
            setError(null);
            offsetRef.current = 0;
            fetchingRef.current = false;
            fetchPage(0);
        }
    }, [owsUrl, typeName, fetchPage]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !fetchingRef.current) {
            fetchPage(offsetRef.current);
        }
    }, [hasMore, fetchPage]);

    if (error) {
        console.error(error);
    }
    if (!header && !loading) {
        return <div>No data available!</div>;
    }
    return (
        <div id="tabular-preview" className="tabular-preview-outer">
            <div className="tableFixHead" ref={scrollRef}>
                <Table
                    head={header || []}
                    body={rows}
                    loading={loading}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    scrollContainerRef={scrollRef}
                />
            </div>
        </div>
    );
}

TableComponent.propTypes = {
    owsUrl: PropTypes.string,
    typeName: PropTypes.string
};

const TabularPreviewPlugin = connect(
    createSelector([
        (state) => state?.gnsettings?.geoserverUrl,
        (state) => state?.gnresource?.data
    ], (geoserverUrl, resource) => {
        if (!resource?.subtype || !geoserverUrl) {
            return {};
        }
        const owsUrl = `${geoserverUrl}ows`;
        const typeName = resource.alternate;
        return { owsUrl, typeName };
    })
)(TableComponent);

export default createPlugin('TabularPreview', {
    component: TabularPreviewPlugin,
    containers: {},
    epics: {},
    reducers: {
        resourceReducer
    }
});
