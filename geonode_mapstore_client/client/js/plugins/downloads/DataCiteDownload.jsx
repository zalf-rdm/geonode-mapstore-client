/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Button from '@mapstore/framework/components/layout/Button';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';
import { error as errorNotification } from '@mapstore/framework/actions/notifications';
import { getGeoNodeLocalConfig } from '@mapstore/framework/utils/GeoNodeUtils';
import axios from '@mapstore/framework/libs/ajax';
import { saveAs } from 'file-saver';
import { getResourceData } from '@js/selectors/resource';

function DataCiteDownload({ resource, onError }) {
    const [loading, setLoading] = useState(false);

    const dataciteEnabled = getGeoNodeLocalConfig('GEONODE_SETTINGS.ZALF_DATACITE_ENABLED', false);

    if (!dataciteEnabled || !resource?.is_published || !resource?.pk) {
        return null;
    }

    function handleDownload() {
        setLoading(true);
        const title = (resource.title || String(resource.pk)).replace(/[\.\s]/g, '_');
        axios.get(`/api/v2/datacite_metadata/${resource.pk}/`, { responseType: 'blob' })
            .then(({ data, headers }) => {
                setLoading(false);
                saveAs(new Blob([data], { type: headers['content-type'] || 'application/xml' }), `${title}_DataCite_Metadata.xml`);
            })
            .catch((err) => {
                setLoading(false);
                onError({
                    title: 'gnviewer.cannotPerfomAction',
                    message: err?.data?.message || err?.data?.detail || 'gnviewer.syncErrorDefault'
                });
            });
    }

    return (
        <Button variant="default" onClick={handleDownload} disabled={loading}>
            {loading && <Spinner animation="border" role="status"><span className="sr-only">Loading...</span></Spinner>}
            {' '}<Message msgId="gnviewer.dataciteMetadata" />
        </Button>
    );
}

const DataCiteDownloadPlugin = connect(
    createSelector([getResourceData], (resource) => ({ resource })),
    { onError: errorNotification }
)(DataCiteDownload);

export default createPlugin('DataCiteDownload', {
    component: () => null,
    containers: {
        ActionNavbar: {
            name: 'DataCiteDownload',
            Component: DataCiteDownloadPlugin
        }
    }
});
