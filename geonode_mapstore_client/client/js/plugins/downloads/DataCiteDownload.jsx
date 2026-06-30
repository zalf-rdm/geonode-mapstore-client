/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import { downloadMetaData } from '@js/actions/gndownload';
import { gnDownloadMetaData } from '@js/epics/gndownload';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import gnDownload from '@js/reducers/gndownload';

function DataCiteDownload({ onDownload, resourcePk, isDownloading }) {
    const handleDownload = useCallback(() => onDownload('DataCite', resourcePk), [onDownload, resourcePk]);
    return (
        <Button variant="default" onClick={handleDownload} className="datacitebutton">
            {isDownloading && <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
            </Spinner>} <Message msgId="gnviewer.dataCite" />
        </Button>
    );
}

const DataCiteDownloadPlugin = connect(
    createSelector([
        state => state?.gnresource?.data.pk || null,
        state => state?.gnDownload?.downloads?.DataCite || {}
    ], (resourcePk, downloadingResources) => ({
        resourcePk,
        isDownloading: downloadingResources[resourcePk]
    })),
    {
        onDownload: downloadMetaData
    }
)(DataCiteDownload);

DataCiteDownload.defaultProps = {
    onDownload: () => { },
    resourcePk: null,
    isDownloading: false
};


export default createPlugin('DataCiteDownload', {
    component: () => null,
    containers: {
        ActionNavbar: {
            name: 'DataCiteDownload',
            Component: DataCiteDownloadPlugin
        }
    },
    epics: { gnDownloadMetaData },
    reducers: { gnDownload }
});
