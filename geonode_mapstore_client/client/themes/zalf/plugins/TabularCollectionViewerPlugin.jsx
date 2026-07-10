import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import ZalfTabularCollectionViewer from '../../../js/plugins/ZalfTabularCollectionViewer';

const TabularCollectionViewer = connect(
    createSelector([
        (state) => state?.gnresource?.data?.pk,
        (state) => state?.gnsettings?.geoserverUrl
    ], (mapId, geoserverUrl) => ({
        mapId,
        geoserverUrl
    }))
)(ZalfTabularCollectionViewer);

export default createPlugin('ZalfTabularCollectionViewer', {
    component: TabularCollectionViewer
});
