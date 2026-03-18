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

function buildOwsUrlCandidates(geoserverUrl) {
    const urls = [];
    const addUrl = (url) => {
        if (url && !urls.includes(url)) {
            urls.push(url);
        }
    };

    if (geoserverUrl) {
        const baseUrl = `${geoserverUrl}`.replace(/\/+$/, '');
        if (/\/ows$/i.test(baseUrl)) {
            addUrl(baseUrl);
        } else if (/\/(wms|wfs)$/i.test(baseUrl)) {
            addUrl(baseUrl.replace(/\/(wms|wfs)$/i, '/ows'));
        } else {
            addUrl(`${baseUrl}/ows`);
        }

        if (/\/geoserver(\/ows)?$/i.test(baseUrl)) {
            addUrl(baseUrl.replace(/\/geoserver(\/ows)?$/i, '/gs/ows'));
        }
    }

    addUrl('/gs/ows');
    return urls;
}

function getErrorMessage(error) {
    return error?.message || 'Could not load tabular data.';
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

function getPageButtons(currentPage, totalPages) {
    if (!totalPages || totalPages <= 1) {
        return [1];
    }
    const pages = new Set([1, totalPages, currentPage + 1]);
    if (currentPage > 0) {
        pages.add(currentPage);
    }
    if (currentPage + 2 <= totalPages) {
        pages.add(currentPage + 2);
    }
    const orderedPages = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    const items = [];
    orderedPages.forEach((page, index) => {
        if (index > 0 && page - orderedPages[index - 1] > 1) {
            items.push('ellipsis');
        }
        items.push(page);
    });
    return items;
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

    const pageButtons = useMemo(() => getPageButtons(page, totalPages), [page, totalPages]);
    const rangeLabel = useMemo(() => getRangeLabel(page, pageSize, totalRows, rows.length), [page, pageSize, totalRows, rows.length]);
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

                <div className="gn-tabular-preview-toolbar">
                    <div className="gn-tabular-preview-toolbar-left">
                        <span className="gn-tabular-preview-chip gn-tabular-preview-chip-primary">
                            {resource?.subtype || 'tabular'}
                        </span>
                        {totalRows !== null && (
                            <span className="gn-tabular-preview-chip">
                                {totalRows} rows
                            </span>
                        )}
                        <span className="gn-tabular-preview-chip">
                            {header.length} columns
                        </span>
                    </div>
                    <div className="gn-tabular-preview-toolbar-right">
                        <div className="gn-tabular-preview-rows-control">
                            <label htmlFor={`rows-per-page-${typeName}`}>Rows per page:</label>
                            <select
                                id={`rows-per-page-${typeName}`}
                                value={pageSize}
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
                    </div>
                </div>

                <div className="gn-tabular-preview-table-wrap">
                    <div className="gn-tabular-preview-table-scroll">
                        <table className="gn-tabular-preview-table">
                            <thead>
                                <tr>
                                    {header.map((column) => {
                                        const isSorted = sortConfig.key === column.key;
                                        const sortIcon = isSorted && sortConfig.direction === 'desc'
                                            ? 'sort-desc'
                                            : 'sort-asc';
                                        return (
                                            <th key={column.key}>
                                                <button type="button" onClick={() => onSort(column.key)}>
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
                                        <td className="gn-tabular-preview-state" colSpan={Math.max(header.length, 1)}>
                                            <FaIcon name="spinner" />
                                            Loading rows...
                                        </td>
                                    </tr>
                                )}
                                {!loading && error && (
                                    <tr>
                                        <td className="gn-tabular-preview-state gn-tabular-preview-state-error" colSpan={Math.max(header.length, 1)}>
                                            {error}
                                        </td>
                                    </tr>
                                )}
                                {!loading && !error && rows.length === 0 && (
                                    <tr>
                                        <td className="gn-tabular-preview-state" colSpan={Math.max(header.length, 1)}>
                                            No data available for this dataset.
                                        </td>
                                    </tr>
                                )}
                                {!loading && !error && rows.map((row, rowIndex) => (
                                    <tr key={`${typeName}-row-${page}-${rowIndex}`}>
                                        {header.map((column) => (
                                            <td key={`${typeName}-${column.key}-${rowIndex}`}>
                                                {formatCellValue(row[column.key])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="gn-tabular-preview-footer">
                    <div className="gn-tabular-preview-footer-summary">
                        {rangeLabel}
                    </div>
                    <div className="gn-tabular-preview-pagination">
                        <button
                            type="button"
                            disabled={page === 0 || loading}
                            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                        >
                            <FaIcon name="chevron-left" />
                        </button>
                        {pageButtons.map((button, index) => button === 'ellipsis'
                            ? <span key={`ellipsis-${index}`} className="gn-tabular-preview-ellipsis">...</span>
                            : (
                                <button
                                    key={`page-${button}`}
                                    type="button"
                                    className={button - 1 === page ? 'active' : ''}
                                    disabled={loading}
                                    onClick={() => setPage(button - 1)}
                                >
                                    {button}
                                </button>
                            )
                        )}
                        <button
                            type="button"
                            disabled={loading || rows.length < pageSize || (totalRows !== null && page >= totalPages - 1)}
                            onClick={() => setPage((currentPage) => currentPage + 1)}
                        >
                            <FaIcon name="chevron-right" />
                        </button>
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
