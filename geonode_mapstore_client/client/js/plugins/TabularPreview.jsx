import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { getFeatureSimple } from '@mapstore/framework/api/WFS';

import Table from '@js/components/Table';
import resourceReducer from '@js/reducers/gnresource';

function propertyToKey(property) {
    return `${property}`;
};

function headerFromFeatures(data) {
    const feature = data.features[0] || []
    const properties = feature.properties;
    return Object.keys(properties).map((p, index) => ({ value: p, key: propertyToKey(p, index) }));
};

function rowsFromFeatures(data) {
    const features = data.features || []
    // [{col1: "value"}]
    return features.map((feature, index) => {
        const row = {}
        const properties = feature.properties
        Object.keys(properties)
              .forEach(name => Object.assign(row, { [propertyToKey(name, index)]: properties[name] }))
        return row;
    });
};

function buildOwsUrlCandidates(geoserverUrl) {
    const urls = [];
    const addUrl = (url) => {
        if (url && !urls.includes(url)) {
            urls.push(url);
        }
    };

    if (geoserverUrl) {
        const baseUrl = `${geoserverUrl}`.replace(/\/+$/, '');
        if (/\/ows$/i.test(baseUrl)) {
            addUrl(baseUrl);
        } else if (/\/(wms|wfs)$/i.test(baseUrl)) {
            addUrl(baseUrl.replace(/\/(wms|wfs)$/i, '/ows'));
        } else {
            addUrl(`${baseUrl}/ows`);
        }

        if (/\/geoserver(\/ows)?$/i.test(baseUrl)) {
            addUrl(baseUrl.replace(/\/geoserver(\/ows)?$/i, '/gs/ows'));
        }
    }

    // Local dev-server proxy route used by GeoNode (`localhost:8081` -> backend).
    addUrl('/gs/ows');
    return urls;
}




export function TableComponent({ owsUrls, typeName }) {
    const [header, setHeader] = useState();
    const [rows, setRows] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        const getFeatures = async () => {
            let lastError;
            for (let i = 0; i < (owsUrls || []).length; i++) {
                try {
                    const data = await getFeatureSimple(owsUrls[i], { typeName });
                    setHeader(headerFromFeatures(data));
                    setRows(rowsFromFeatures(data));
                    setError(null);
                    return;
                } catch (e) {
                    lastError = e;
                }
            }
            if (lastError) {
                setError(lastError);
            }
        }
        if (owsUrls?.length) {
            getFeatures()
        }
    }, [owsUrls, typeName])

    if (error) {
        console.error(error);
    }
    if (!rows) {
        return <div>No data available!</div>
    }
    return (
        <div id="tabular-preview">
            <div className="tableFixHead" style={{ overflow:"auto" }}>
                <Table head={header} body={rows} />
            </div>
        </div>
    );

};

TableComponent.propTypes = {
    owsUrls: PropTypes.arrayOf(PropTypes.string),
    typeName: PropTypes.string,
};

const TabularPreviewPlugin = connect(
    createSelector([
        (state) => state?.gnsettings?.geoserverUrl,
        (state) => state?.gnresource?.data
    ], (geoserverUrl, resource) => { 
        const owsUrls = buildOwsUrlCandidates(geoserverUrl);
        if (!resource?.subtype || !owsUrls?.length) {
            return {}
        }
        const typeName = resource.alternate
        return { owsUrls, typeName };
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
