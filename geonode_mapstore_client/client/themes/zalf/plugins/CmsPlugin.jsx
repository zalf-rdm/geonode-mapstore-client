/**
 * CUSTOM PATH: themes/zalf/plugins/CmsPlugin.jsx
 * REASON: register ZALF CMS page as a plugin for the /cms/ route
 */

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import CmsPage from '../components/cms/CmsPage';

export default createPlugin('ZalfCms', {
    component: CmsPage
});
