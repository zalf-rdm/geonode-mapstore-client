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

import Message from '@mapstore/framework/components/I18N/Message';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import { parseCatalogResource } from '@js/utils/ResourceUtils';

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
        <FlexBox column gap="xs">
            <Text fontSize="sm">
                <Message msgId={`gnviewer.linkedResources.${type}`} />
            </Text>
            {resources.map((field, key) => {
                const icon = field?.['@extras']?.info?.icon;
                return (
                    <FlexBox key={key} component={Text} centerChildrenVertically gap="sm" fontSize="sm" className="_row _padding-b-xs">
                        {icon && <Glyphicon {...icon} />}
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
        </FlexBox>
    );
};

const DetailsLinkedResources = ({ fields }) => {

    const linkedToFields = fields?.linkedTo?.map(parseCatalogResource);
    const linkedByFields = fields?.linkedBy?.map(parseCatalogResource);

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
    fields: PropTypes.array
};

DetailsLinkedResources.defaultProps = {
    fields: []
};

export default DetailsLinkedResources;
