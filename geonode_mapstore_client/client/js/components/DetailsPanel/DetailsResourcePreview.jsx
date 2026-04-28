/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import FaIcon from '@js/components/FaIcon';
import ThumbnailPreview from './ThumbnailPreview';
import Spinner from '@js/components/Spinner';
import { getResourceTypesInfo } from '@js/utils/ResourceUtils';

function DetailsResourcePreview({
    resource,
    getTypesInfo = getResourceTypesInfo,
    loading,
    enabled
}) {

    const types = getTypesInfo();
    const {
        formatEmbedUrl = res => res?.embed_url,
        icon
    } = resource && (types[resource.subtype] || types[resource.resource_type]) || {};

    if (!enabled) {
        // Show thumbnail or fallback icon for non-previewable resources (e.g. documents)
        if (resource?.thumbnail_url) {
            return (
                <div className="gn-details-panel-preview">
                    <ThumbnailPreview
                        src={resource.thumbnail_url}
                        icon={icon}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: 0,
                            backgroundColor: 'inherit'
                        }}
                    />
                </div>
            );
        }
        if (icon) {
            return (
                <div className="gn-details-panel-preview gn-details-panel-preview-placeholder">
                    <FaIcon name={icon} />
                </div>
            );
        }
        return null;
    }

    const embedUrl = resource?.embed_url && formatEmbedUrl(resource);
    return (
        <div className="gn-details-panel-preview">
            <div
                className="gn-loader-placeholder"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                <FaIcon name={icon} />
            </div>
            {embedUrl
                ? <iframe
                    key={embedUrl}
                    src={embedUrl}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                    }}
                    frameBorder="0"
                />
                : (!embedUrl ? (<ThumbnailPreview
                    src={resource?.thumbnail_url}
                    icon={icon}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        backgroundColor: 'inherit'
                    }} />)
                    : undefined)
            }
            {loading && <div
                className="gn-details-panel-preview-loader"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                <Spinner animation="border" role="status">
                    <span className="sr-only">Loading resource detail...</span>
                </Spinner>
            </div>}
        </div>
    );
}

export default DetailsResourcePreview;
