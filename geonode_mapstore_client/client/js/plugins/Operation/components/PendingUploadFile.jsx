/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@js/components/Button/Button';
import FaIcon from '@js/components/FaIcon';
import Badge from '@js/components/Badge';
import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@js/components/Spinner';
import ErrorMessageWithTooltip from './ErrorMessageWithTooltip';
import { getSize } from '../../../utils/UploadUtils';

function PendingUploadFile({
    data,
    loading,
    progress,
    error,
    onCancel,
    onRemove
}) {
    const { id, missingExtensions: uploadMissingExtension = [], baseName, ext: extensions, files } = data;
    const missingMainFile = uploadMissingExtension.length === 1 && uploadMissingExtension[0] === '*';
    const missingExtensions = missingMainFile ? [] : uploadMissingExtension;
    return (
        <div className="gn-upload-card">
            <div className="gn-upload-card-header">
                {(missingExtensions.length > 0 || missingMainFile) ? <div className="gn-upload-card-error"><FaIcon name="exclamation" /></div> : null}
                <div className="gn-upload-card-title">{baseName}</div>
                <div>
                    {error ? <ErrorMessageWithTooltip tooltipId={<Message msgId="gnviewer.invalidUploadMessageErrorTooltip" />} /> : null}
                    {onRemove
                        ? (!loading || !progress) ? <Button size="xs" onClick={() => onRemove(id)}>
                            <FaIcon name="trash" />
                        </Button> : <Button size="xs" onClick={() => onCancel([id])}>
                            <FaIcon name="stop" />
                        </Button>
                        : null}
                </div>
            </div>
            {missingExtensions.length > 0 && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId="gnviewer.missingFiles" />: {missingExtensions.join(', ')}
                </div>
            </div>}
            {missingMainFile && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId="gnviewer.addMainFiles" />
                </div>
            </div>}
            <div className="gn-upload-card-bottom">
                <ul>
                    {extensions.map(ext => {
                        return (
                            <li key={ext}>
                                <Badge>.{ext}</Badge>
                            </li>
                        );
                    })}
                </ul>
                {
                    (loading && progress) ?
                        <div className="gn-upload-card-progress-read">
                            {progress < 100 ? `${progress}%` : <Spinner />}
                        </div> :
                        <div>{getSize(files, true)}</div>
                }
            </div>
            {(loading && progress) ? <div style={{ position: 'relative' }}>
                <div
                    className="gn-upload-card-progress"
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
            </div> : null}
        </div>
    );
}

export default PendingUploadFile;
