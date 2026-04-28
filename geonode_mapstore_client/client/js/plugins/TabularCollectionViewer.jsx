import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Tabs, Tab } from 'react-bootstrap';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';

import resourceReducer from '@js/reducers/gnresource';
import { TableComponent, buildOwsUrlCandidates } from './TabularPreview';

function TabbedTablesComponent({ owsUrls, tableLayers }) {
    const [tabs, setTabs] = useState([]);
    const [key, setKey] = useState(0);

    useEffect(() => {
        setTabs(tableLayers.map((layer, i) => {
            return (
                <Tab key={i} eventKey={i} title={layer.name}>
                    <TableComponent owsUrls={owsUrls} typeName={layer.name} />
                </Tab>
            );
        }));
    }, [owsUrls, tableLayers]);

    if (tableLayers && tableLayers.length === 1) {
        const typeName = tableLayers[0].name;
        return (
            <TableComponent owsUrls={owsUrls} typeName={typeName} />
        );
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

}

TabbedTablesComponent.propTypes = {
    owsUrls: PropTypes.arrayOf(PropTypes.string),
    typeName: PropTypes.array
};

const TabularCollectionViewerPlugin = connect(
    createSelector([
        state => state?.gnresource?.data || null,
        (state) => state?.gnsettings?.geoserverUrl
    ], (resource, geoserverUrl) => {
        const owsUrls = buildOwsUrlCandidates(geoserverUrl);
        const tableLayers = resource?.maplayers || [];
        return { owsUrls, tableLayers };
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
