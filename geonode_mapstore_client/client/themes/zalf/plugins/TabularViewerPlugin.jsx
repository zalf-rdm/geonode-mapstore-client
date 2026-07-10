import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import ZalfTabularViewer from '../../../js/plugins/ZalfTabularViewer';

const TabularViewer = connect(
    createSelector([
        (state) => state?.gnresource?.data,
        (state) => state?.gnsettings?.geoserverUrl
    ], (dataset, geoserverUrl) => ({
        dataset,
        geoserverUrl
    }))
)(ZalfTabularViewer);

export default createPlugin('ZalfTabularViewer', {
    component: TabularViewer
});
