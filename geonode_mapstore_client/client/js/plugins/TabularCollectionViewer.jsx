import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Tabs, Tab } from 'react-bootstrap';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';

import resourceReducer from '@js/reducers/gnresource';
import { TableComponent } from './TabularPreview';

function TabbedTablesComponent({ owsUrl, tableLayers }) {
    const [tabs, setTabs] = useState([])
    const [key, setKey] = useState(0);

    useEffect(() => {
        setTabs(tableLayers.map((layer, i) => {
            return (
                <Tab key={i} eventKey={i} title={layer.name}>
                    <TableComponent owsUrl={owsUrl} typeName={layer.name} />
                </Tab>
            )
        }));
    }, [owsUrl, tableLayers]);

    if (tableLayers && tableLayers.length == 1) {
        const typeName = tableLayers[0].name;
        return (
            <TableComponent owsUrl={owsUrl} typeName={typeName} />
        )
    }

    return (
        <Tabs
            justified
            id="tabular-data-collection-tabs"
            defaultActiveKey={key}
            onSelect={ k => setKey(k) }
            >
            {tabs}
        </Tabs>
    );

};

TabbedTablesComponent.propTypes = {
    owsUrl: PropTypes.string,
    typeName: PropTypes.array,
};

const TabularCollectionViewerPlugin = connect(
    createSelector([
        state => state?.gnresource?.data || null,
        (state) => state?.gnsettings?.geoserverUrl,
    ], (resource, geoserverUrl) => { 
        const owsUrl = `${geoserverUrl}ows`
        const tableLayers = resource.maplayers || []
        return { owsUrl, tableLayers };
    })
)(TabbedTablesComponent);

export default createPlugin('TabularCollectionViewer', {
    component: TabularCollectionViewerPlugin,
    containers: {},
    epics: {},
    reducers: {
        resourceReducer
    }
});
