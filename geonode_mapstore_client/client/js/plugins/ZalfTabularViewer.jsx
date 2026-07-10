import React from 'react';
import PropTypes from 'prop-types';
import { DatasetTable } from './ZalfTabularCollectionViewer';
import '../../themes/zalf/components/content/zalftabularcollectionviewer.css';

export default function ZalfTabularViewer({ dataset, geoserverUrl }) {
    if (!dataset?.pk) {
        return <div className="alert alert-info ztcv-state">No table available.</div>;
    }

    return (
        <div className="ztcv-root">
            <DatasetTable
                dataset={dataset}
                geoserverUrl={geoserverUrl}
                activeIndex={0}
                totalDatasets={1}
            />
        </div>
    );
}

ZalfTabularViewer.propTypes = {
    dataset: PropTypes.object,
    geoserverUrl: PropTypes.string
};
