/**
 * CUSTOM PATH: themes/zalf/plugins/FooterPlugin.jsx
 * REASON: register ZALF custom footer as plugin
 */

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Footer from '../components/footer/Footer';

export default createPlugin('ZalfFooter', {
    component: Footer
});
