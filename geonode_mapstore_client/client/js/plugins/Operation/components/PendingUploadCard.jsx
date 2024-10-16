/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PendingUploadFile from './PendingUploadFile';
import PendingUploadUrl from './PendingUploadUrl';

const pendingUploadCardTypes = {
    'remote': PendingUploadUrl,
    'file': PendingUploadFile
};

function PendingUploadCard(props) {
    const Card = pendingUploadCardTypes[props?.data?.type];
    return Card ? <Card {...props}/> : null;
}

export default PendingUploadCard;
