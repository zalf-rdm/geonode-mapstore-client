/**
 * CUSTOM PATH: themes/zalf/plugins/FaqPlugin.jsx
 * REASON: register ZALF FAQ page as plugin
 */

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import FaqPage from '../components/faq/FaqPage';

export default createPlugin('ZalfFaq', {
    component: FaqPage
});
