/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '@js/components/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/FaIcon';
import isEqual from 'lodash/isEqual';
import FilterItems from './FilterItems';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { updateFilterFormItemsWithFacet, filterFormItemsContainFacet } from '@js/utils/SearchUtils';
import { Glyphicon } from 'react-bootstrap';


/**
 * FilterForm component allows to configure a list of field that can be used to apply filter on the page
 * @name FiltersForm
 * @memberof components
 * @prop {string} id the thumbnail is scaled based on the following configuration
 */
function FiltersForm({
    id,
    style,
    styleContainerForm,
    query,
    fields: fieldsProp,
    facets,
    onChange,
    onClose,
    onClear,
    extentProps,
    timeDebounce,
    onGetFacets,
    filters,
    setFilters
}) {

    const [fields, setFields] = useState([]);
    const [prevFieldsProp, setPrevFieldsProp] = useState();
    const [prevFacets, setPrevFacets] = useState();
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentFilterLevel, setCurrentFilterLevel] = useState(null);
    const [levelHistory, setLevelHistory] = useState([]);

    if (!isEqual(fieldsProp, prevFieldsProp) || !isEqual(facets, prevFacets)) {
        setPrevFieldsProp(fieldsProp);
        setPrevFacets(facets);
        setFields(updateFilterFormItemsWithFacet({ formItems: fieldsProp, facetItems: facets }));
    }

    useEffect(() => {
        if (fieldsProp && onGetFacets && filterFormItemsContainFacet(fieldsProp) && isEmpty(facets)) {
            onGetFacets(query);
        }
    }, [facets]);

    const handleFieldChange = (newParam) => {
        onChange(newParam);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
        if (isExpanded) {
            setCurrentFilterLevel(null);
            setLevelHistory([]);
        }
    };

    const handleFilterSectionClick = (index) => {
        setLevelHistory([...levelHistory, index]);
        setCurrentFilterLevel(index);
    };

    const handleBackClick = () => {
        if (levelHistory.length > 0) {
            const newHistory = levelHistory.slice(0, -1);
            setLevelHistory(newHistory);
            setCurrentFilterLevel(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null);
        }
    };

    const getFilterSectionLabel = (field) => {
        if (field.labelId) {
            return field.labelId;
        }
        return field.label || field.id || '';
    };

    const filterGroupSections = fields.filter(f => f.type !== 'search' && f.type !== 'link' && f.type !== 'divider');

    return (
        <div className={`gn-filter-form gn-filter-form-drawer ${isExpanded ? 'expanded' : 'collapsed'}`} style={styleContainerForm} >
            <div className="gn-filter-form-header" onClick={toggleExpanded}>
                <div className="gn-filter-form-title-label">
                    <div className="gn-filter-form-head-compact">
                        <FaIcon name="filter" />
                        <div>
                            <h3><Message msgId="gnhome.filters" /></h3>
                            <p>Filter your search</p>
                        </div>
                    </div>
                </div>
                <FaIcon name="caret-down" className="gn-filter-form-accordion-arrow" />
            </div>
            {isExpanded && (
                <div className="gn-filter-form-body">
                    <div className="gn-filter-form-drawer-content">
                        {/* Main Filters List */}
                        <div className={`gn-filter-drawer-page gn-filter-drawer-main ${currentFilterLevel !== null ? 'hidden' : 'active'}`}>
                            <div className="gn-filter-drawer-sections">
                                {filterGroupSections.map((field, index) => (
                                    <div
                                        key={field.id || index}
                                        className="gn-filter-drawer-section-item"
                                        onClick={() => handleFilterSectionClick(index)}
                                    >
                                        <span className="gn-filter-section-label">
                                            {getFilterSectionLabel(field)}
                                        </span>
                                        <FaIcon name="chevron-right" />
                                    </div>
                                ))}
                            </div>
                            <div className="gn-filter-drawer-actions">
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={onClear}
                                    disabled={isEmpty(omit(query, ['d', 'page', 'sort']))}
                                    block
                                >
                                    <Message msgId="gnhome.clearFilters" />
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => onClose()}
                                    className="square-button-md"
                                    block
                                >
                                    <Message msgId="gnhome.close" />
                                </Button>
                            </div>
                        </div>

                        {/* Filter Details Pages */}
                        {currentFilterLevel !== null && (
                            <div className={`gn-filter-drawer-page gn-filter-drawer-detail active`}>
                                <div className="gn-filter-drawer-header">
                                    <Button
                                        variant="default"
                                        onClick={handleBackClick}
                                        className="gn-filter-back-btn"
                                    >
                                        <FaIcon name="chevron-left" /> Back
                                    </Button>
                                </div>
                                <div className="gn-filter-drawer-detail-content">
                                    <form style={style}>
                                        <FilterItems
                                            id={id}
                                            items={[filterGroupSections[currentFilterLevel]]}
                                            values={query}
                                            extentProps={{ ...extentProps, timeDebounce }}
                                            onChange={handleFieldChange}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

FiltersForm.defaultProps = {
    id: PropTypes.string,
    style: PropTypes.object,
    styleContainerForm: PropTypes.object,
    query: PropTypes.object,
    fields: PropTypes.array,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onClear: PropTypes.func,
    extentProps: PropTypes.object,
    submitOnChangeField: PropTypes.bool,
    timeDebounce: PropTypes.number,
    formParams: PropTypes.object

};

FiltersForm.defaultProps = {
    query: {},
    fields: [],
    onChange: () => { },
    onClose: () => { },
    onClear: () => { },
    submitOnChangeField: true,
    timeDebounce: 500,
    formParams: {}
};

const arePropsEqual = (prevProps, nextProps) => {
    return isEqual(prevProps.query, nextProps.query)
        && isEqual(prevProps.fields, nextProps.fields)
        && isEqual(prevProps.facets, nextProps.facets)
        && isEqual(prevProps.filters, nextProps.filters);
};


export default memo(FiltersForm, arePropsEqual);
