/**
 * CUSTOM PATH: themes/zalf/plugins/ZalfShareResourcePlugin.jsx
 * REASON: zalf-rdm/geonode#812 asks for the map landing page's share button in the
 * catalogue view as well. That button shares the stable /landing/<uuid>/ link — the
 * DOI target (zalf-rdm/geonode#823) — which is not what either of the existing share
 * affordances offers: upstream's Share plugin shares the *viewer* URL and builds embed
 * code, and the detail panel's own copy button copies the current catalogue URL.
 *
 * One component serves both placements, because the card dropdown and the detail
 * panel toolbar pass the same props: { resource, component, showIcon }, where
 * `component` is the host's own button/menu-item element type.
 */

// Uses React.createElement — themes/zalf/ is outside babel-loader include, JSX not supported here.
import React, { useRef, useState, useEffect } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { getLandingShareUrl, shareLink } from '../utils/ZalfShareUtils';

const ce = React.createElement;

const COPIED_RESET_MS = 1600;

function ZalfShareResourceButton({ resource, component, showIcon }) {
    const [copied, setCopied] = useState(false);
    const timeout = useRef(null);
    const Component = component;

    useEffect(() => () => {
        // The card unmounts as soon as the dropdown closes, so the reset timer has
        // to go with it or it sets state on an unmounted component.
        if (timeout.current) {
            clearTimeout(timeout.current);
        }
    }, []);

    const url = getLandingShareUrl(resource && resource.uuid);

    // No uuid means no stable link to share, so offer nothing rather than a dead one.
    if (!url || !Component) {
        return null;
    }

    function handleClick() {
        shareLink({ url, title: resource && resource.title }).then((wasCopied) => {
            // A successful system share needs no feedback; only a clipboard copy does.
            if (wasCopied) {
                setCopied(true);
                timeout.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
            }
        });
    }

    return ce(Component, {
        iconType: 'glyphicon',
        glyph: copied ? 'ok' : 'share-alt',
        labelId: copied ? 'zalfTheme.share.linkCopied' : 'zalfTheme.share.shareLink',
        showIcon,
        onClick: handleClick
    });
}

const CONTRIBUTION = {
    name: 'zalf-share-resource',
    Component: ZalfShareResourceButton,
    // After the viewer button, before Copy/Delete.
    position: 1
};

export default createPlugin('ZalfShareResource', {
    // Contributes only to other plugins' containers; it renders nothing of its own.
    component: () => null,
    containers: {
        ResourcesGrid: { ...CONTRIBUTION, target: 'card-options' },
        ResourceDetails: { ...CONTRIBUTION, target: 'toolbar' }
    },
    epics: {},
    reducers: {}
});
