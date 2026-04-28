/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Spinner from '@js/components/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';
import moment from 'moment';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { getUploadErrorMessageFromCode } from '@js/utils/ErrorUtils';
import { getCataloguePath } from '@js/utils/ResourceUtils';

function ErrorMessage(props) {
    return (
        <div {...props} className="gn-upload-card-error-message">
            <Message msgId="gnviewer.invalidUploadMessageError" /> <FaIcon name="info-circle"/>
        </div>
    );
}

function UploadCard({
    name,
    state,
    detailUrl,
    progress,
    createDate,
    resumeUrl,
    onRemove,
    error,
    type,
    status,
    errorLog,
    importUrl
}) {

    const { datasetMaxUploadSize, documentMaxUploadSize, maxParallelUploads } = getConfigProp('geoNodeSettings') || {};
    const maxAllowedBytes = type !== 'document' ? datasetMaxUploadSize : documentMaxUploadSize;
    const maxAllowedSize = Math.floor(maxAllowedBytes / (1024 * 1024));
    const hasError = state === 'INVALID' || status === 'failed';
    const errorMessageId = getUploadErrorMessageFromCode(error?.code);
    const errorText = errorLog ? getUploadErrorMessageFromCode(null, errorLog) : null;

    return (
        <div className="gn-upload-card">
            <div className="gn-upload-card-header">
                {hasError ? <div className="gn-upload-card-error"><FaIcon name="exclamation" /></div> : null}
                <div className="gn-upload-card-title">
                    {(detailUrl || importUrl.length === 1)
                        ? <a
                            href={detailUrl || importUrl?.[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {name}
                        </a>
                        : name}
                </div>
                {((progress < 100 && progress > 0) || status === 'running') ? <Spinner /> : null}
                {onRemove
                    ? <Button size="xs" onClick={onRemove}>
                        <FaIcon name="trash" />
                    </Button>
                    : null}
            </div>
            <div className="gn-upload-card-footer">
                <div className="gn-upload-card-date">
                    {createDate && <div>{moment(createDate).format('MMMM Do YYYY, h:mm:ss a')}</div>}
                </div>
                <div className="gn-upload-card-tools">
                    {resumeUrl
                        ? <Button
                            variant="primary"
                            href={resumeUrl}
                        >
                            <Message msgId="gnviewer.completeUpload" />
                        </Button>
                        : null}
                    {(detailUrl || status === 'finished')
                        ? <Button
                            variant="primary"
                            {...(!detailUrl && {onClick: () => {
                                onRemove();
                            }})}
                            href={detailUrl || (importUrl.length === 1 ? importUrl[0] : getCataloguePath('/catalogue/#/search/?f=dataset'))}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Message msgId={`${(detailUrl || importUrl.length === 1) ? 'gnviewer.view' : 'gnhome.viewDatasets'}`} />
                        </Button>
                        : null}
                    {hasError
                        ? <ErrorMessage />
                        : null}
                </div>
            </div>
            {hasError && (
                <div className="gn-upload-card-error-detail">
                    {errorText
                        ? errorText
                        : <Message
                            msgId={`gnviewer.${errorMessageId}`}
                            msgParams={{ limit: errorMessageId === 'fileExceeds' ? maxAllowedSize : maxParallelUploads }}
                        />}
                </div>
            )}
            <div
                className={`gn-upload-card-progress ${state && state.toLowerCase() || ''}`}
                style={{
                    width: '100%',
                    height: 2
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: 2,
                        transition: '0.3s all'
                    }}
                >
                </div>
            </div>
        </div>
    );
}

UploadCard.defaultProps = {
    name: '',
    state: '',
    progress: 0,
    type: 'document',
    status: '',
    importUrl: []
};

export default UploadCard;
