
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
import Badge from '@js/components/Badge';
import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@js/components/Spinner';
import ErrorMessageWithTooltip from './ErrorMessageWithTooltip';

function getUploadErrorText(error) {
    if (!error || error === true) {
        return null;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (Array.isArray(error)) {
        return error.map(getUploadErrorText).filter(Boolean).join(' ');
    }
    if (typeof error === 'object') {
        return error.detail
            || error.message
            || error.error
            || error.non_field_errors?.join?.(' ')
            || Object.values(error).map(getUploadErrorText).filter(Boolean).join(' ');
    }
    return null;
}

function PendingUploadFile({
    missingExt,
    baseName,
    onRemove,
    filesExt,
    loading,
    progress,
    size,
    onAbort,
    error,
    addMissingFiles
}) {
    const uploadErrorText = getUploadErrorText(error);
    return (
        <div className="gn-upload-card">
            <div className="gn-upload-card-header">
                {(missingExt.length > 0 || addMissingFiles) ? <div className="gn-upload-card-error"><FaIcon name="exclamation" /></div> : null}
                <div className="gn-upload-card-title">{baseName}</div>
                <div>
                    {error ? <ErrorMessageWithTooltip tooltipPosition="left" {...(uploadErrorText
                        ? { tooltip: uploadErrorText }
                        : { tooltipId: <Message msgId="gnviewer.invalidUploadMessageErrorTooltip" /> }
                    )} /> : null}
                    {onRemove
                        ? (!loading || !(progress?.[baseName])) ? <Button size="xs" onClick={onRemove}>
                            <FaIcon name="trash" />
                        </Button> : <Button size="xs" onClick={() => onAbort(baseName)}>
                            <FaIcon name="stop" />
                        </Button>
                        : null}
                </div>
            </div>
            {missingExt.length > 0 && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId="gnviewer.missingFiles" />: {missingExt.join(', ')}
                </div>
            </div>}
            {addMissingFiles && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId="gnviewer.addMainFiles" />
                </div>
            </div>}
            {uploadErrorText && <div className="gn-upload-card-body">
                <div className="text-danger">
                    {uploadErrorText}
                </div>
            </div>}
            <div className="gn-upload-card-bottom">
                <ul>
                    {filesExt.map(ext => {
                        return (
                            <li key={ext}>
                                <Badge>.{ext}</Badge>
                            </li>
                        );
                    })}
                </ul>
                {
                    (loading && progress && progress?.[baseName]) ?
                        <div className="gn-upload-card-progress-read">
                            {progress[baseName] ? `${progress[baseName]}%` : <Spinner />}
                        </div> :
                        <div>{size}{' '}MB</div>
                }
            </div>
            {loading && progress && progress?.[baseName] && <div style={{ position: 'relative' }}>
                <div
                    className="gn-upload-card-progress"
                    style={{
                        width: '100%',
                        height: 2
                    }}
                >
                    <div
                        style={{
                            width: `${progress[baseName]}%`,
                            height: 2,
                            transition: '0.3s all'
                        }}
                    >
                    </div>
                </div>
            </div>}
        </div>
    );
}

export default PendingUploadFile;
