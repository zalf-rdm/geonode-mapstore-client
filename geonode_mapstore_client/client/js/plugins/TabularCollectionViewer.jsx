import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Tabs, Tab } from 'react-bootstrap';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';

import resourceReducer from '@js/reducers/gnresource';
import { TableComponent } from './TabularPreview';

function TabbedTablesComponent({ owsUrl, tableLayers }) {
    const [activeKey, setActiveKey] = useState(0);

    if (!tableLayers || tableLayers.length === 0) {
        return <div>No layers available</div>;
    }

    if (tableLayers.length === 1) {
        const typeName = tableLayers[0].name;
        return (
            <TableComponent owsUrl={owsUrl} typeName={typeName} />
        );
    }

    return (
        <Tabs
            justified
            id="tabular-data-collection-tabs"
            activeKey={activeKey}
            onSelect={k => setActiveKey(parseInt(k, 10))}
        >
            {tableLayers.map((layer, i) => (
                <Tab key={i} eventKey={i} title={layer.name}>
                    {activeKey === i
                        ? <TableComponent owsUrl={owsUrl} typeName={layer.name} />
                        : null}
                </Tab>
            ))}
        </Tabs>
    );
}

TabbedTablesComponent.propTypes = {
    owsUrl: PropTypes.string,
    tableLayers: PropTypes.array
};

const TabularCollectionViewerPlugin = connect(
    createSelector([
        state => state?.gnresource?.data || null,
        (state) => state?.gnsettings?.geoserverUrl
    ], (resource, geoserverUrl) => {
        const owsUrl = geoserverUrl ? `${geoserverUrl}ows` : '';
        const tableLayers = resource?.maplayers || [];
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
