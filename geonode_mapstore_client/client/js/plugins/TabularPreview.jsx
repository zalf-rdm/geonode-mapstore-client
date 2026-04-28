import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { describeFeatureType, getFeatureSimple } from '@mapstore/framework/api/WFS';

import FaIcon from '@js/components/FaIcon';
import resourceReducer from '@js/reducers/gnresource';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

function propertyToKey(property) {
    return `${property}`;
}

function headerFromFeatures(data) {
    const feature = data?.features?.[0];
    const properties = feature?.properties || {};
    return Object.keys(properties).map((property, index) => ({
        value: property,
        key: propertyToKey(property, index)
    }));
}

function headerFromDescribe(data) {
    const featureTypes = data?.featureTypes || data?.featureType || [];
    const currentFeatureType = Array.isArray(featureTypes) ? featureTypes[0] : featureTypes;
    const properties = currentFeatureType?.properties || currentFeatureType?.property || [];
    return properties
        .map((property, index) => property?.name ? ({
            value: property.name,
            key: propertyToKey(property.name, index)
        }) : null)
        .filter(Boolean);
}

function rowsFromFeatures(data) {
    const features = data?.features || [];
    return features.map((feature, index) => {
        const row = {};
        const properties = feature?.properties || {};
        Object.keys(properties).forEach((name) => {
            Object.assign(row, { [propertyToKey(name, index)]: properties[name] });
        });
        return row;
    });
}

export function buildOwsUrlCandidates(geoserverUrl) {
    const urls = [];
    const addUrl = (url) => {
        if (url && !urls.includes(url)) {
            urls.push(url);
        }
    };

    addUrl('/gs/ows');
    addUrl('/geoserver/ows');

    if (geoserverUrl) {
        const baseUrl = `${geoserverUrl}`.replace(/\/+$/, '');
        if (/\/ows$/i.test(baseUrl)) {
            addUrl(baseUrl);
        } else if (/\/(wms|wfs)$/i.test(baseUrl)) {
            addUrl(baseUrl.replace(/\/(wms|wfs)$/i, '/ows'));
        } else {
            addUrl(`${baseUrl}/ows`);
        }

        if (/\/geoserver(\/ows)?$/i.test(baseUrl) && !/^https?:\/\//i.test(baseUrl)) {
            addUrl(baseUrl.replace(/\/geoserver(\/ows)?$/i, '/gs/ows'));
        }
    }

    return urls;
}

function getErrorMessage(error) {
    const message = error?.message || '';
    if (message.includes('Unexpected token') || message.includes('<?xml')) {
        return 'GeoServer returned an XML error instead of JSON. Check the WFS layer name and permissions.';
    }
    return message || 'Could not load tabular data.';
}

function parseTotalFeatures(data, rowCount, pageIndex, pageSize) {
    const rawTotal = data?.totalFeatures ?? data?.numberMatched ?? data?.totalFeatureCount;
    const parsedTotal = Number(rawTotal);
    if (Number.isFinite(parsedTotal) && parsedTotal >= 0) {
        return parsedTotal;
    }
    if (rowCount < pageSize) {
        return pageIndex * pageSize + rowCount;
    }
    return null;
}

function formatCellValue(value) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return `${value}`;
}

function getRangeLabel(page, pageSize, total, currentCount) {
    if (!currentCount) {
        return 'Showing 0 entries';
    }
    const start = page * pageSize + 1;
    const end = start + currentCount - 1;
    if (total === null || total === undefined) {
        return `Showing ${start} - ${end} entries`;
    }
    return `Showing ${start} - ${end} of ${total} entries`;
}

function rowMatchesFilter(row, columns, filterText) {
    const query = `${filterText || ''}`.trim().toLowerCase();
    if (!query) {
        return true;
    }
    return columns.some((column) => formatCellValue(row[column.key]).toLowerCase().includes(query));
}

export function TableComponent({ owsUrls, typeName, resource }) {
    const [header, setHeader] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalRows, setTotalRows] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [refreshToken, setRefreshToken] = useState(0);
    const [filterText, setFilterText] = useState('');

    const loadHeaders = useCallback(async() => {
        for (let index = 0; index < (owsUrls || []).length; index++) {
            try {
                const data = await describeFeatureType(owsUrls[index], typeName);
                const describeHeader = headerFromDescribe(data);
                if (describeHeader.length) {
                    setHeader(describeHeader);
                    return;
                }
            } catch (e) {
                // continue with next candidate
            }
        }
    }, [owsUrls, typeName]);

    const loadPage = useCallback(async() => {
        if (!owsUrls?.length || !typeName) {
            return;
        }
        setLoading(true);
        setError(null);
        let lastError;
        for (let index = 0; index < owsUrls.length; index++) {
            try {
                const data = await getFeatureSimple(owsUrls[index], {
                    typeName,
                    maxFeatures: pageSize,
                    startIndex: page * pageSize,
                    ...(sortConfig.key ? {
                        sortBy: `${sortConfig.key}+${sortConfig.direction === 'desc' ? 'D' : 'A'}`
                    } : {})
                });
                const nextHeader = headerFromFeatures(data);
                if (nextHeader.length) {
                    setHeader(nextHeader);
                } else if (!header.length) {
                    loadHeaders();
                }
                const nextRows = rowsFromFeatures(data);
                setRows(nextRows);
                setTotalRows(parseTotalFeatures(data, nextRows.length, page, pageSize));
                setLoading(false);
                return;
            } catch (e) {
                lastError = e;
            }
        }
        setRows([]);
        setLoading(false);
        if (lastError) {
            setError(getErrorMessage(lastError));
        }
    }, [owsUrls, typeName, pageSize, page, sortConfig, header.length, loadHeaders]);

    useEffect(() => {
        setPage(0);
    }, [typeName]);

    useEffect(() => {
        loadHeaders();
    }, [loadHeaders]);

    useEffect(() => {
        loadPage();
    }, [loadPage, refreshToken]);

    const totalPages = useMemo(() => {
        if (totalRows === null || totalRows === undefined) {
            return rows.length < pageSize ? page + 1 : page + 2;
        }
        return Math.max(1, Math.ceil(totalRows / pageSize));
    }, [totalRows, rows.length, pageSize, page]);

    const rangeLabel = useMemo(() => getRangeLabel(page, pageSize, totalRows, rows.length), [page, pageSize, totalRows, rows.length]);
    const visibleRows = useMemo(() => rows.filter((row) => rowMatchesFilter(row, header, filterText)), [rows, header, filterText]);
    const datasetTitle = resource?.title || typeName;
    const datasetDescription = resource?.abstract || 'Tabular dataset preview';
    const datasetCategory = resource?.category?.gn_description || resource?.category?.name || resource?.subtype || 'Tabular';

    const onSort = (columnKey) => {
        setPage(0);
        setSortConfig((prev) => ({
            key: columnKey,
            direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const onToggleSort = () => {
        const nextKey = sortConfig.key || header[0]?.key;
        if (nextKey) {
            onSort(nextKey);
        }
    };

    return (
        <div id="tabular-preview">
            <div className="gn-tabular-preview-shell">
                <div className="gn-tabular-preview-header">
                    <div className="gn-tabular-preview-heading">
                        <div className="gn-tabular-preview-breadcrumb">
                            <span>Datasets</span>
                            <FaIcon name="chevron-right" />
                            <span>{datasetCategory}</span>
                            <FaIcon name="chevron-right" />
                            <span className="gn-tabular-preview-breadcrumb-current">{datasetTitle}</span>
                        </div>
                        <h2>Dataset: {datasetTitle}</h2>
                        <p>{datasetDescription}</p>
                    </div>
                    <div className="gn-tabular-preview-actions">
                        <button type="button" onClick={() => setRefreshToken((value) => value + 1)}>
                            <FaIcon name="refresh" />
                            Refresh Data
                        </button>
                    </div>
                </div>

                <div className="gn-attr-table-wrap gn-tabular-preview-data-wrap">
                    <div className="gn-attr-table-toolbar">
                        <div className="gn-attr-table-search-wrap">
                            <FaIcon name="filter" className="gn-attr-table-search-icon" />
                            <input
                                className="gn-attr-table-search-input"
                                type="text"
                                placeholder="Filter visible rows..."
                                value={filterText}
                                onChange={(event) => setFilterText(event.target.value)}
                            />
                        </div>
                        <div className="gn-attr-table-toolbar-right">
                            <span>Showing <b>{visibleRows.length}</b> row{visibleRows.length !== 1 ? 's' : ''}</span>
                            <span className="gn-attr-table-divider">|</span>
                            <span><b>{header.length}</b> column{header.length !== 1 ? 's' : ''}</span>
                            <span className="gn-attr-table-divider">|</span>
                            <span>{rangeLabel}</span>
                            <span className="gn-attr-table-divider">|</span>
                            <button
                                className="gn-attr-table-sort-btn"
                                type="button"
                                disabled={!header.length}
                                onClick={onToggleSort}
                            >
                                <FaIcon name={sortConfig.direction === 'desc' ? 'sort-alpha-desc' : 'sort-alpha-asc'} />
                                Sort
                            </button>
                        </div>
                    </div>

                    <div className="gn-attr-table-container gn-tabular-preview-table-container">
                        <div className="gn-tabular-preview-table-scroll">
                            <table className="gn-attr-table gn-tabular-preview-table">
                                <thead>
                                    <tr>
                                        {header.map((column) => {
                                            const isSorted = sortConfig.key === column.key;
                                            const sortIcon = isSorted && sortConfig.direction === 'desc'
                                                ? 'sort-desc'
                                                : 'sort-asc';
                                            return (
                                                <th key={column.key}>
                                                    <button
                                                        className="gn-tabular-preview-column-btn"
                                                        type="button"
                                                        onClick={() => onSort(column.key)}
                                                    >
                                                        <span>{column.value}</span>
                                                        <FaIcon name={sortIcon} />
                                                    </button>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td className="gn-attr-table-empty gn-tabular-preview-state" colSpan={Math.max(header.length, 1)}>
                                                <FaIcon name="spinner" />
                                                Loading rows...
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && error && (
                                        <tr>
                                            <td className="gn-attr-table-empty gn-tabular-preview-state gn-tabular-preview-state-error" colSpan={Math.max(header.length, 1)}>
                                                {error}
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && !error && visibleRows.length === 0 && (
                                        <tr>
                                            <td className="gn-attr-table-empty gn-tabular-preview-state" colSpan={Math.max(header.length, 1)}>
                                                {filterText ? 'No visible rows match the filter.' : 'No data available for this dataset.'}
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && !error && visibleRows.map((row, rowIndex) => (
                                        <tr className="gn-attr-table-row" key={`${typeName}-row-${page}-${rowIndex}`}>
                                            {header.map((column, columnIndex) => (
                                                <td key={`${typeName}-${column.key}-${rowIndex}`}>
                                                    {columnIndex === 0
                                                        ? (
                                                            <div className="gn-attr-table-field-name">
                                                                <FaIcon name="columns" className="gn-attr-table-field-icon" />
                                                                <span className="gn-attr-table-field-text">{formatCellValue(row[column.key])}</span>
                                                            </div>
                                                        )
                                                        : formatCellValue(row[column.key])
                                                    }
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="gn-attr-table-pagination">
                            <div className="gn-tabular-preview-rows-control">
                                <label htmlFor={`rows-per-page-${typeName}`}>Rows per page:</label>
                                <select
                                    id={`rows-per-page-${typeName}`}
                                    value={pageSize}
                                    disabled={loading}
                                    onChange={(event) => {
                                        setPageSize(Number(event.target.value));
                                        setPage(0);
                                    }}
                                >
                                    {PAGE_SIZE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <span className="gn-attr-table-page-label">Page {page + 1} of {totalPages}</span>
                            <div className="gn-attr-table-page-btns">
                                <button
                                    className="gn-attr-table-page-btn"
                                    type="button"
                                    disabled={page === 0 || loading}
                                    onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                                >
                                    <FaIcon name="chevron-left" />
                                </button>
                                <button
                                    className="gn-attr-table-page-btn"
                                    type="button"
                                    disabled={loading || rows.length < pageSize || (totalRows !== null && page >= totalPages - 1)}
                                    onClick={() => setPage((currentPage) => currentPage + 1)}
                                >
                                    <FaIcon name="chevron-right" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="gn-attr-table-hint gn-tabular-preview-hint">
                        <FaIcon name="info-circle" className="gn-attr-table-hint-icon" />
                        <h4>Tabular Data Preview</h4>
                        <p>Use the column headers for server-side sorting and the filter field to search the rows currently loaded on this page.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

TableComponent.propTypes = {
    owsUrls: PropTypes.arrayOf(PropTypes.string),
    typeName: PropTypes.string,
    resource: PropTypes.object
};

TableComponent.defaultProps = {
    owsUrls: [],
    typeName: '',
    resource: null
};

const TabularPreviewPlugin = connect(
    createSelector([
        (state) => state?.gnsettings?.geoserverUrl,
        (state) => state?.gnresource?.data
    ], (geoserverUrl, resource) => {
        const owsUrls = buildOwsUrlCandidates(geoserverUrl);
        if (!resource?.subtype || !owsUrls?.length) {
            return {};
        }
        const typeName = resource.alternate;
        return { owsUrls, typeName, resource };
    })
)(TableComponent);

export default createPlugin('TabularPreview', {
    component: TabularPreviewPlugin,
    containers: {},
    epics: {},
    reducers: {
        resourceReducer
    }
});
