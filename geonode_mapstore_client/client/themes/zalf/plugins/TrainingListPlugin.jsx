import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import TrainingListPage from '../components/trainings/TrainingListPage';

export default createPlugin('ZalfTrainingList', {
    component: TrainingListPage,
});
