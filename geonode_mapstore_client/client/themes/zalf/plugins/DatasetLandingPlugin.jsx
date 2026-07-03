/**
 * CUSTOM PATH: themes/zalf/plugins/DatasetLandingPlugin.jsx
 * REASON: ZALF dataset landing page plugin — intermediate page between the
 * catalogue grid and the full dataset viewer, registered on the
 * dataset_landing route (/catalogue/#/dataset/:pk/landing).
 */

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import DatasetLandingPage from '../components/content/DatasetLandingPage';

export default createPlugin('ZalfDatasetLanding', {
    component: DatasetLandingPage
});
