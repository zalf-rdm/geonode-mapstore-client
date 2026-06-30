/**
 * CUSTOM PATH: themes/zalf/plugins/NavigationPlugin.jsx
 * REASON: register ZALF custom navigation as plugin
 */

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Navigation from '../components/navigation/Navigation';

export default createPlugin('ZalfNavigation', {
    component: Navigation
});
