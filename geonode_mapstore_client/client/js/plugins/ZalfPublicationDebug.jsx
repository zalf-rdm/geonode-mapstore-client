/*
 * Debug plugin — always renders an unconditional button in the ActionNavbar.
 * Remove once Approve/Publish buttons are confirmed working.
 */

import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Button from '@mapstore/framework/components/layout/Button';

function ZalfPublicationDebug() {
    return (
        <Button variant="primary" style={{ marginLeft: 4 }}>
            ZALF Debug
        </Button>
    );
}

export default createPlugin('ZalfPublicationDebug', {
    component: () => null,
    containers: {
        ActionNavbar: {
            name: 'ZalfPublicationDebug',
            Component: ZalfPublicationDebug
        }
    }
});
