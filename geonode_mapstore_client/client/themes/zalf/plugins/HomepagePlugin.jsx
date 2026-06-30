/**
 * CUSTOM PATH: themes/zalf/plugins/HomepagePlugin.jsx
 * REASON: register ZALF homepage as a plugin for catalogue components route
 */

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Homepage from '../components/home/Homepage';

export default createPlugin('ZalfHomepage', {
    component: Homepage
});
