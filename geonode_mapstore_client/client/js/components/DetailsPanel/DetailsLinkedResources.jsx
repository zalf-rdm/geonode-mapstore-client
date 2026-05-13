/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { Tooltip } from 'react-bootstrap';
import OverlayTrigger from '@mapstore/framework/components/misc/OverlayTrigger';

import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';

const downloadAll = (urls) => {
    urls.forEach((url) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 10000);
    });
};

const DetailLinkedResource = ({resources, type}) => {
    return !isEmpty(resources) && (
        <>
            <Message msgId={`gnviewer.linkedResources.${type}`} />
            {resources.map((field, key) => {
                return (<div key={key} className="gn-details-info-fields">
                    <div className="gn-details-info-row linked-resources">
                        {field.icon && <FaIcon name={field.icon} />}
                        <a key={field.pk} href={field.detail_url}>
                            {field.title}
                        </a>
                        {field.download_url && (
                            <a href={field.download_url} download className="btn btn-primary btn-xs gn-linked-resource-download">
                                <Message msgId="gnviewer.download" />
                            </a>
                        )}
                    </div>
                </div>);
            })}
        </>
    );
};

const DetailsLinkedResources = ({ fields, resourceTypesInfo }) => {
    const linkedToFields = fields?.linkedTo?.map(resource=> ({...resource, icon: resourceTypesInfo[resource.resource_type]?.icon}));
    const linkedByFields = fields?.linkedBy?.map(resource=> ({...resource, icon: resourceTypesInfo[resource.resource_type]?.icon}));

    const linkedResources = [
        {
            resources: linkedToFields?.filter(resource => !resource.internal) ?? [],
            type: 'linkedTo'
        },
        {
            resources: linkedByFields?.filter(resource => !resource.internal) ?? [],
            type: 'linkedBy'
        },
        {
            resources: linkedToFields.filter(resource => resource.internal) ?? [],
            type: 'uses'
        },
        {
            resources: linkedByFields.filter(resource => resource.internal) ?? [],
            type: 'usedBy'
        }
    ];

    const allDownloadUrls = linkedResources
        .flatMap(({resources}) => resources)
        .map(r => r.download_url)
        .filter(Boolean);

    return (
        <div className="linked-resources">
            {allDownloadUrls.length > 0 && (
                <div className="gn-linked-resources-download-all">
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip id="download-all-tooltip">
                                <Message msgId="gnviewer.downloadAllHint" />
                            </Tooltip>
                        }
                    >
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => downloadAll(allDownloadUrls)}
                        >
                            <Message msgId="gnviewer.downloadAll" />
                        </button>
                    </OverlayTrigger>
                </div>
            )}
            {
                linkedResources.map(({resources, type})=> <DetailLinkedResource resources={resources} type={type}/>)
            }
        </div>
    );
};

DetailsLinkedResources.propTypes = {
    fields: PropTypes.array,
    resourceTypesInfo: PropTypes.object
};

DetailsLinkedResources.defaultProps = {
    fields: [],
    resourceTypesInfo: {}
};

export default DetailsLinkedResources;
