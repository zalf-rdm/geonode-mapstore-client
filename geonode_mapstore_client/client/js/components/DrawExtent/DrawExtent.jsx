/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { useEffect } from 'react';
import VectorSource from "ol/source/Vector";
import Draw, { createBox } from "ol/interaction/Draw";
import PropTypes from 'prop-types';
import { Fill, Stroke, Style, Circle } from "ol/style";

const drawInteraction = new Draw({
    source: new VectorSource({wrapX: false}),
    type: 'Circle',
    geometryFunction: createBox(),
    style: new Style({
        fill: new Fill({
            color: "rgba(255, 170, 1, 0.1)"
        }),
        stroke: new Stroke({
            color: "#ffaa01",
            width: 2
        }),
        image: new Circle({
            stroke: new Stroke({
                color: "#ffaa01",
                width: 2
            }),
            fill: new Fill({
                color: "rgba(255, 170, 1, 0.1)"
            }),
            radius: 5
        })
    })
});

const DrawExtext = ({map, onSetExtent} = {}) => {
    useEffect(() => {
        let draw;
        if (map) {
            draw = drawInteraction;
            draw.on('drawend', (evt) => {
                const feature = evt.feature.clone();
                const geometry = feature.getGeometry();
                if (geometry.getCoordinates) {
                    const extent = geometry.getExtent();
                    onSetExtent(extent);
                }
            });
            map.addInteraction(draw);
        }
        return () => {
            map.removeInteraction(draw);
        };
    }, []);
    return null;
};

DrawExtext.propTypes = {
    map: PropTypes.object,
    onSetExtent: PropTypes.func
};

DrawExtext.defaultProps = {
    onSetExtent: () => {}
};

export default DrawExtext;
