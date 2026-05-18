/*
 * ZALF custom plugin to auto-open resource details for maps
 * without forking the core DetailViewer implementation.
 */

import { Observable } from 'rxjs';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { forceUpdateMapLayout } from '@mapstore/framework/actions/maplayout';
import { SET_RESOURCE } from '@js/actions/gnresource';

const openMapDetailViewerEpic = (action$, store) =>
    action$.ofType(SET_RESOURCE)
        .filter(({ data }) => {
            const state = store.getState();
            return data?.resource_type === 'map'
                && state?.controls?.rightOverlay?.enabled !== 'DetailViewer';
        })
        .switchMap(() =>
            Observable.of(
                setControlProperty('rightOverlay', 'enabled', 'DetailViewer'),
                forceUpdateMapLayout()
            )
        );

const EmptyComponent = () => null;

export default createPlugin('ZALFAutoOpenMapDetailViewer', {
    component: EmptyComponent,
    epics: {
        openMapDetailViewerEpic
    }
});
