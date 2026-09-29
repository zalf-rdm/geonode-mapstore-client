/**
 * CUSTOM PATH: themes/zalf/plugins/MetadataViewPlugin.jsx
 * REASON: register the ZALF read-only metadata page without replacing the
 * generic metadata editor plugin.
 */
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import MetadataViewPage from '../components/content/MetadataViewPage';

export default createPlugin('ZalfMetadataView', {
    component: MetadataViewPage
});
