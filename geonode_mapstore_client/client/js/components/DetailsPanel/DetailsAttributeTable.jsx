/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import {
    getDatasetByPk
} from '@js/api/geonode/v2'

import Table from '@js/components/Table';


const parseAttributeData = (dataset) => {
    if (dataset?.attribute_set) {
        const header = [{
            value: "Name",
            key: "name"
        }, {
            value: "Label",
            key: "label"
        }, {
            value: "Description",
            key: "description"
        }]

        const rows = dataset.attribute_set.map(attribute => ({
            name: attribute.attribute,
            label: attribute.attribute_label || "",
            description: attribute.description || "",
        }));

        return { header, rows };
    }

    return { header: [], rows: [] };
};


const DetailsAttributeTable = ({
    resource,
}) => {
    const [attributeData, setAttributeData] = useState({ header: [], rows: [] });
    useEffect(() => {
        const getAttributes = async () => {
            if (resource.resource_type === "dataset") {
                const dataset = await getDatasetByPk(resource.pk);
                setAttributeData(parseAttributeData(dataset));
            }
        }
        getAttributes();
    }, [])
    return (
        <div className="gn-details-info-table">
            <Table head={attributeData.header} body={attributeData.rows} />
        </div>
    )
}

DetailsAttributeTable.propTypes = {
    resource: PropTypes.object
};

DetailsAttributeTable.defaultProps = {
    resource: {}
};

export default DetailsAttributeTable;
