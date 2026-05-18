import { Observable } from 'rxjs';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { forceUpdateMapLayout } from '@mapstore/framework/actions/maplayout';
import { MAP_CONFIG_LOADED } from '@mapstore/framework/actions/config';

const openDetailViewer = () => Observable.of(
    setControlProperty('rightOverlay', 'enabled', 'DetailViewer'),
    forceUpdateMapLayout()
);

const openMapDetailViewerEpic = (action$, store) =>
    action$.ofType(MAP_CONFIG_LOADED)
        .filter(() => {
            const state = store.getState();
            return state?.gnresource?.data?.resource_type === 'map'
                && state?.controls?.rightOverlay?.enabled !== 'DetailViewer';
        })
        .switchMap(() =>
            Observable.timer(300)
                .switchMap(() => openDetailViewer())
        );

const EmptyComponent = () => null;

export default createPlugin('ZALFAutoOpenMapDetailViewer', {
    component: EmptyComponent,
    epics: {
        openMapDetailViewerEpic
    }
});
