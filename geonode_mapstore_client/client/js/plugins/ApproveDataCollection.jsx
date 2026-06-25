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
import { error as errorNotification, success as successNotification } from '@mapstore/framework/actions/notifications';
import axios from '@mapstore/framework/libs/ajax';
import { getResourceData } from '@js/selectors/resource';
import { requestResource } from '@js/actions/gnresource';
import { getGeoNodeLocalConfig } from '@js/utils/APIUtils';

function ApproveDataCollection({ resource, onReload, onSuccess, onError }) {
    const [loading, setLoading] = useState(false);

    const canPublish = getGeoNodeLocalConfig('geoNodeSettings.canPublishDataCollection', false);

    if (!canPublish || resource?.resource_type !== 'map' || resource?.is_approved) {
        return null;
    }

    function handleApprove() {
        if (!window.confirm(
            'Approve this data collection and all linked resources owned by the author?'
        )) return;

        setLoading(true);
        axios.post(`/api/v2/approve/${resource.pk}/`, { owner: resource.owner?.pk })
            .then(() => {
                setLoading(false);
                onSuccess({ title: 'gnviewer.approveSuccess' });
                onReload(resource);
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
        <Button variant="default" onClick={handleApprove} disabled={loading}>
            {loading && <Spinner animation="border" role="status"><span className="sr-only">Loading...</span></Spinner>}
            {' '}<Message msgId="gnviewer.approveDataCollection" />
        </Button>
    );
}

const ApproveDataCollectionPlugin = connect(
    createSelector([getResourceData], (resource) => ({ resource })),
    {
        onReload: requestResource,
        onSuccess: successNotification,
        onError: errorNotification
    }
)(ApproveDataCollection);

export default createPlugin('ApproveDataCollection', {
    component: () => null,
    containers: {
        ActionNavbar: {
            name: 'ApproveDataCollection',
            Component: ApproveDataCollectionPlugin
        }
    }
});
