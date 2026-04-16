import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { describeFeatureType, getFeatureSimple } from '@mapstore/framework/api/WFS';

import Table from '@js/components/Table';
import resourceReducer from '@js/reducers/gnresource';

function propertyToKey(property, index) {
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




export function TableComponent({ owsUrl, typeName }) {
    const [header, setHeader] = useState();
    const [rows, setRows] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        const getFeatures = async () => {
            try {
                const data = await getFeatureSimple(owsUrl, { typeName });
                setHeader(headerFromFeatures(data));
                setRows(rowsFromFeatures(data));
            } catch(error) {
                setError(error)
            }
        }
        if (owsUrl) {
            getFeatures()
        }
    }, [owsUrl, typeName])

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
    owsUrl: PropTypes.string,
    typeName: PropTypes.string,
};

const TabularPreviewPlugin = connect(
    createSelector([
        (state) => state?.gnsettings?.geoserverUrl,
        (state) => state?.gnresource?.data
    ], (geoserverUrl, resource) => { 
        if (!resource.subtype || !geoserverUrl) {
            return {}
        }
        const owsUrl = `${geoserverUrl}ows`
        const typeName = resource.alternate
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
