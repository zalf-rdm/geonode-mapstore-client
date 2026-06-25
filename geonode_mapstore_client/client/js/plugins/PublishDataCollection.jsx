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
import Portal from '@mapstore/framework/components/misc/Portal';
import ResizableModal from '@mapstore/framework/components/misc/ResizableModal';
import { error as errorNotification, success as successNotification } from '@mapstore/framework/actions/notifications';
import { getGeoNodeLocalConfig } from '@js/utils/APIUtils';
import axios from '@mapstore/framework/libs/ajax';
import { getResourceData } from '@js/selectors/resource';
import { requestResource } from '@js/actions/gnresource';
import useDatacitePrefixes from '@js/hooks/useDatacitePrefixes';

function PublishDialog({ resource, onConfirm, onClose }) {
    const linkedResources = (resource?.linkedResources?.linkedTo ?? []);
    const [selectedPks, setSelectedPks] = useState(() => linkedResources.map(r => r.pk));
    const [doiPrefix, setDoiPrefix] = useState('');
    const { prefixes, loading: prefixLoading } = useDatacitePrefixes(true);

    // Set default prefix when prefixes load
    React.useEffect(() => {
        if (prefixes.length > 0 && !doiPrefix) {
            setDoiPrefix(prefixes[0]);
        }
    }, [prefixes]);

    function toggleResource(pk) {
        setSelectedPks(prev =>
            prev.includes(pk) ? prev.filter(p => p !== pk) : [...prev, pk]
        );
    }

    function handleConfirm() {
        onConfirm({
            owner: resource.owner?.pk,
            resources: selectedPks,
            doi_prefix: doiPrefix
        });
    }

    return (
        <ResizableModal
            show
            title={<Message msgId="gnviewer.publishDialogTitle" />}
            onClose={onClose}
            buttons={[
                {
                    text: <Message msgId="gnviewer.confirmPublish" />,
                    bsStyle: 'primary',
                    onClick: handleConfirm,
                    disabled: !doiPrefix || selectedPks.length === 0 || prefixLoading
                },
                {
                    text: <Message msgId="gnviewer.cancel" />,
                    onClick: onClose
                }
            ]}
        >
            <div style={{ padding: '0.5rem' }}>
                <p><Message msgId="gnviewer.publishConfirm" /></p>
                {linkedResources.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
                        {linkedResources.map(r => (
                            <li key={r.pk} style={{ padding: '0.25rem 0' }}>
                                <label style={{ cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPks.includes(r.pk)}
                                        onChange={() => toggleResource(r.pk)}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    {r.title}
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="gn-doi-prefix"><Message msgId="gnviewer.doiPrefixLabel" /></label>
                    {prefixLoading
                        ? <Spinner animation="border" role="status" />
                        : (
                            <select
                                id="gn-doi-prefix"
                                value={doiPrefix}
                                onChange={e => setDoiPrefix(e.target.value)}
                                style={{ flex: 1 }}
                            >
                                {prefixes.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        )
                    }
                </div>
            </div>
        </ResizableModal>
    );
}

function PublishDataCollection({ resource, onReload, onSuccess, onError }) {
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    const canPublish = getGeoNodeLocalConfig('geoNodeSettings.canPublishDataCollection', false);

    if (!canPublish || resource?.resource_type !== 'map' || !resource?.is_approved || resource?.is_published) {
        return null;
    }

    function handleConfirm(payload) {
        setShowDialog(false);
        setLoading(true);
        axios.post(`/api/v2/publish/${resource.pk}/`, payload)
            .then(() => {
                setLoading(false);
                onSuccess({ title: 'gnviewer.publishSuccess' });
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
        <>
            <Button variant="default" onClick={() => setShowDialog(true)} disabled={loading}>
                {loading && <Spinner animation="border" role="status"><span className="sr-only">Loading...</span></Spinner>}
                {' '}<Message msgId="gnviewer.publishDataCollection" />
            </Button>
            {showDialog && (
                <Portal>
                    <PublishDialog
                        resource={resource}
                        onConfirm={handleConfirm}
                        onClose={() => setShowDialog(false)}
                    />
                </Portal>
            )}
        </>
    );
}

const PublishDataCollectionPlugin = connect(
    createSelector([getResourceData], (resource) => ({ resource })),
    {
        onReload: requestResource,
        onSuccess: successNotification,
        onError: errorNotification
    }
)(PublishDataCollection);

export default createPlugin('PublishDataCollection', {
    component: () => null,
    containers: {
        ActionNavbar: {
            name: 'PublishDataCollection',
            Component: PublishDataCollectionPlugin
        }
    }
});
