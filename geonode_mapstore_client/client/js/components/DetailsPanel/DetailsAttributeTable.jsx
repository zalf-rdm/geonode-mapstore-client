/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import FaIcon from '@js/components/FaIcon';

const DATA_TYPE_COLORS = {
    integer: 'type-integer',
    int: 'type-integer',
    bigint: 'type-integer',
    smallint: 'type-integer',
    double: 'type-double',
    float: 'type-double',
    real: 'type-double',
    numeric: 'type-double',
    decimal: 'type-double',
    string: 'type-string',
    varchar: 'type-string',
    char: 'type-string',
    text: 'type-string',
    date: 'type-date',
    datetime: 'type-date',
    timestamp: 'type-date',
    time: 'type-date',
    boolean: 'type-boolean',
    bool: 'type-boolean',
    geometry: 'type-geometry',
    point: 'type-geometry',
    polygon: 'type-geometry',
    linestring: 'type-geometry',
    multipolygon: 'type-geometry',
};

const getTypeColorClass = (type = '') => {
    const normalized = type.toLowerCase().replace(/\s+/g, '');
    for (const key of Object.keys(DATA_TYPE_COLORS)) {
        if (normalized.includes(key)) {
            return DATA_TYPE_COLORS[key];
        }
    }
    return 'type-default';
};

const PAGE_SIZE = 10;

const DetailsAttributeTable = ({ fields = [] }) => {
    const [filterText, setFilterText] = useState('');
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        const lower = filterText.toLowerCase();
        let result = fields.filter((f) =>
            !filterText
            || (f.attribute || '').toLowerCase().includes(lower)
            || (f.attribute_label || '').toLowerCase().includes(lower)
            || (f.description || '').toLowerCase().includes(lower)
        );
        if (sortAsc) {
            result = [...result].sort((a, b) => (a.attribute || '').localeCompare(b.attribute || ''));
        } else {
            result = [...result].sort((a, b) => (b.attribute || '').localeCompare(a.attribute || ''));
        }
        return result;
    }, [fields, filterText, sortAsc]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const handleFilterChange = (e) => {
        setFilterText(e.target.value);
        setPage(0);
    };

    return (
        <div className="gn-attr-table-wrap">
            {/* Filters and Search */}
            <div className="gn-attr-table-toolbar">
                <div className="gn-attr-table-search-wrap">
                    <FaIcon name="filter" className="gn-attr-table-search-icon" />
                    <input
                        className="gn-attr-table-search-input"
                        type="text"
                        placeholder="Filter attribute fields..."
                        value={filterText}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="gn-attr-table-toolbar-right">
                    <span>Showing <b>{filtered.length}</b> attribute{filtered.length !== 1 ? 's' : ''}</span>
                    <span className="gn-attr-table-divider">|</span>
                    <button
                        className="gn-attr-table-sort-btn"
                        onClick={() => { setSortAsc(v => !v); setPage(0); }}
                    >
                        <FaIcon name={sortAsc ? 'sort-alpha-asc' : 'sort-alpha-desc'} />
                        Sort
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="gn-attr-table-container">
                <table className="gn-attr-table">
                    <thead>
                        <tr>
                            <th>Field Name</th>
                            <th>Data Type</th>
                            <th>Description</th>
                            <th className="gn-attr-table-th-center">Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="gn-attr-table-empty">
                                    No attributes found.
                                </td>
                            </tr>
                        ) : pageItems.map((attr, idx) => {
                            const rawType = (attr.attribute_type || '').toUpperCase() || 'UNKNOWN';
                            const typeClass = getTypeColorClass(attr.attribute_type || '');
                            const description = attr.description || '-';
                            const unit = attr.attribute_label && attr.attribute_label !== attr.attribute
                                ? attr.attribute_label
                                : '-';
                            return (
                                <tr key={attr.attribute || idx} className="gn-attr-table-row">
                                    <td>
                                        <div className="gn-attr-table-field-name">
                                            <FaIcon name="columns" className="gn-attr-table-field-icon" />
                                            <span className="gn-attr-table-field-text">{attr.attribute}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`gn-attr-table-type-badge ${typeClass}`}>{rawType}</span>
                                    </td>
                                    <td className="gn-attr-table-description">{description}</td>
                                    <td className="gn-attr-table-unit">{unit}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="gn-attr-table-pagination">
                    <span className="gn-attr-table-page-label">Page {currentPage + 1} of {totalPages}</span>
                    <div className="gn-attr-table-page-btns">
                        <button
                            className="gn-attr-table-page-btn"
                            disabled={currentPage === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                        >
                            <FaIcon name="chevron-left" />
                        </button>
                        <button
                            className="gn-attr-table-page-btn"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        >
                            <FaIcon name="chevron-right" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Deep Attribute Analysis hint */}
            <div className="gn-attr-table-hint">
                <FaIcon name="info-circle" className="gn-attr-table-hint-icon" />
                <h4>Deep Attribute Analysis</h4>
                <p>Select an attribute from the table above to view detailed statistics, distribution histograms, and range values.</p>
            </div>
        </div>
    );
};

DetailsAttributeTable.propTypes = {
    fields: PropTypes.array
};

DetailsAttributeTable.defaultProps = {
    fields: []
};

export default DetailsAttributeTable;
