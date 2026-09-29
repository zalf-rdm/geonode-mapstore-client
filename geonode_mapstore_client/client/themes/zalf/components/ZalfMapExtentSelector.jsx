/**
 * One-shot rectangle selector for the ZALF catalogue map.
 * Uses a local OpenLayers interaction and never writes to global map state.
 */

import { useEffect } from 'react';
import Draw, { createBox } from 'ol/interaction/Draw';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { primaryAction } from 'ol/events/condition';
import { reprojectBbox } from '@mapstore/framework/utils/CoordinatesUtils';

const style = new Style({
    fill: new Fill({ color: 'rgba(45, 126, 78, 0.14)' }),
    stroke: new Stroke({ color: '#2d7e4e', width: 2 })
});

export default function ZalfMapExtentSelector({ map, active, onSelect = () => {} }) {
    useEffect(() => {
        if (!map || !active) {
            return () => {};
        }
        const projection = map.getView().getProjection().getCode();
        const draw = new Draw({
            condition: primaryAction,
            freehand: true,
            source: new VectorSource({ wrapX: false }),
            type: 'Circle',
            geometryFunction: createBox(),
            style
        });
        const handleDrawEnd = (event) => {
            const extent = event.feature?.getGeometry()?.getExtent();
            if (extent) {
                onSelect(reprojectBbox(extent, projection, 'EPSG:4326'));
            }
        };
        draw.on('drawend', handleDrawEnd);
        map.addInteraction(draw);
        return () => {
            draw.un('drawend', handleDrawEnd);
            map.removeInteraction(draw);
        };
    }, [map, active, onSelect]);
    return null;
}
