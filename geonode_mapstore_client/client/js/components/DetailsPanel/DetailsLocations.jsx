/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import turfCenter from "@turf/center";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import { getPolygonFromExtent } from "@mapstore/framework/utils/CoordinatesUtils";
import FaIcon from "@js/components/FaIcon/FaIcon";

const REFERENCE_SYSTEM_NAMES = {
    'EPSG:3857': 'WGS 84 / Pseudo-Mercator',
    'EPSG:4326': 'WGS 84'
};

const getReferenceSystemName = (resource, crsCode, fields) => {
    const explicitName = [
        resource?.bbox?.crs_name,
        resource?.bbox?.name,
        resource?.crs_name,
        resource?.spatial_reference,
        resource?.crs?.name,
        fields?.extent?.crs_name,
        fields?.extent?.name
    ].find((value) => `${value || ''}`.trim());

    if (explicitName) {
        return `${explicitName}`.trim();
    }
    return REFERENCE_SYSTEM_NAMES[crsCode] || (crsCode || '-');
};

const toCrsCode = (value) => {
    if (!value && value !== 0) {
        return '';
    }
    const strValue = `${value}`.trim();
    if (!strValue) {
        return '';
    }
    return /^EPSG:/i.test(strValue) ? strValue.toUpperCase() : `EPSG:${strValue}`;
};

const formatCoordinate = (value) => {
    return Number.isFinite(value) ? value.toFixed(6) : '-';
};

const DetailsLocations = ({ fields, resource } = {}) => {
    const extent = get(fields, 'extent.coords');
    const [minx, miny, maxx, maxy] = extent || [];

    const polygon = !isEmpty(extent) ? getPolygonFromExtent(extent) : null;
    const center = !isEmpty(extent) && polygon ? turfCenter(polygon) : null;
    const centerLon = get(center, 'geometry.coordinates.[0]');
    const centerLat = get(center, 'geometry.coordinates.[1]');

    const crsCode = toCrsCode(
        resource?.bbox?.crs
        || resource?.srid
        || resource?.crs?.code
        || fields?.extent?.crs
    );
    const referenceSystemName = getReferenceSystemName(resource, crsCode, fields);

    return (
        <div className="gn-location-cards-grid">
            <div className="gn-location-card">
                <div className="gn-location-card-head">
                    <div className="gn-location-card-icon">
                        <FaIcon name="globe" />
                    </div>
                    <h3>Reference System</h3>
                </div>
                <div className="gn-location-card-content">
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">Standard Name</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{referenceSystemName}</p>
                    </div>
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">EPSG Code</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{crsCode || '-'}</p>
                    </div>
                </div>
            </div>

            <div className="gn-location-card">
                <div className="gn-location-card-head">
                    <div className="gn-location-card-icon">
                        <FaIcon name="th-large" />
                    </div>
                    <h3>Bounding Box</h3>
                </div>
                <div className="gn-location-card-content gn-location-card-content-grid">
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">North</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{formatCoordinate(maxy)}</p>
                    </div>
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">South</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{formatCoordinate(miny)}</p>
                    </div>
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">East</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{formatCoordinate(maxx)}</p>
                    </div>
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">West</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{formatCoordinate(minx)}</p>
                    </div>
                </div>
            </div>

            <div className="gn-location-card">
                <div className="gn-location-card-head">
                    <div className="gn-location-card-icon">
                        <FaIcon name="crosshairs" />
                    </div>
                    <h3>Geometric Center</h3>
                </div>
                <div className="gn-location-card-content">
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">Latitude</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{formatCoordinate(centerLat)}</p>
                    </div>
                    <div className="gn-location-card-row">
                        <p className="gn-info-section-label">Longitude</p>
                        <p className="gn-info-section-value gn-info-section-value--mono">{formatCoordinate(centerLon)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsLocations;
