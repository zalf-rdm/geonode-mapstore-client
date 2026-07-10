import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import axios from '@mapstore/framework/libs/ajax';
import { getFeatureSimple, describeFeatureType } from '@mapstore/framework/api/WFS';
import { Tabs, Tab, FormControl, Button } from 'react-bootstrap';
import '../../themes/zalf/components/content/zalftabularcollectionviewer.css';

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 15;
const MAX_VISIBLE_TABS = 6;
const SEARCH_FETCH_LIMIT = 5000;
const TABLE_DOWNLOAD_FORMATS = ['csv', 'xlsx', 'xls', 'excel'];

function parseTotalFeatures(data, fallback) {
    const total = data?.totalFeatures ?? data?.totalfeatures ?? data?.numberMatched;
    if (Number.isFinite(total)) {
        return Number(total);
    }
    if (typeof total === 'string' && total !== 'unknown' && total !== '') {
        const parsed = Number(total);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return fallback;
}

function normalizeColumnsFromSchema(schema) {
    const featureType = schema?.featureTypes?.[0];
    const properties = Array.isArray(featureType?.properties) ? featureType.properties : [];
    return properties
        .filter((property) => property?.name)
        .map((property) => ({
            key: property.name,
            label: property.name,
            type: `${property?.type || property?.localType || ''}`.toLowerCase()
        }));
}

function normalizeColumnsFromFeatures(data) {
    const feature = data?.features?.[0];
    const properties = feature?.properties || {};
    return Object.keys(properties).map((key) => ({ key, label: key, type: '' }));
}

function rowsFromFeatures(data, columns) {
    const features = data?.features || [];
    return features.map((feature) => {
        const row = {};
        columns.forEach((column) => {
            row[column.key] = feature?.properties?.[column.key];
        });
        return row;
    });
}

function escapeCqlLiteral(value = '') {
    return value.replace(/'/g, "''");
}

function normalizeSearchString(value = '') {
    return `${value}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatCellValue(value) {
    if (value === null || value === undefined || value === '') {
        return 'N/A';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return `${value}`;
}

function stripNamespace(value) {
    return `${value || ''}`.replace(/^[^:]+:/, '');
}

function getDatasetDisplayTitle(dataset = {}) {
    const title = `${dataset?.title || ''}`.trim();
    const name = `${dataset?.name || ''}`.trim();
    if (title && !/^[^:]+:.+/.test(title)) {
        return title;
    }
    if (name) {
        return name;
    }
    if (title) {
        return stripNamespace(title);
    }
    return stripNamespace(dataset?.alternate);
}

function getDatasetDisplaySubtitle(dataset = {}) {
    const subtitle = `${dataset?.subtitle || ''}`.trim();
    if (subtitle) {
        return stripNamespace(subtitle);
    }
    const alternate = stripNamespace(dataset?.alternate);
    return alternate || getDatasetDisplayTitle(dataset);
}

function getVisibleDatasetSubtitle(dataset = {}) {
    const title = getDatasetDisplayTitle(dataset);
    const subtitle = getDatasetDisplaySubtitle(dataset);
    return subtitle && subtitle !== title ? subtitle : '';
}

function escapeRegExp(value = '') {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedText(text, searchText) {
    const normalizedQuery = normalizeSearchString(searchText);
    if (!normalizedQuery) {
        return text;
    }
    const tokens = Array.from(new Set(normalizedQuery.split(' ').filter(Boolean)));
    if (!tokens.length) {
        return text;
    }
    const pattern = new RegExp(`(${tokens.map((token) => escapeRegExp(token)).join('|')})`, 'ig');
    const parts = `${text}`.split(pattern);
    return parts.map((part, index) => (
        tokens.some((token) => normalizeSearchString(part) === token)
            ? <mark key={`${part}-${index}`} className="ztcv-highlight">{part}</mark>
            : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ));
}

function rowMatchesSearch(row, term, columns) {
    const normalizedQuery = normalizeSearchString(term);
    if (!normalizedQuery) {
        return true;
    }
    const tokens = normalizedQuery.split(' ').filter(Boolean);
    const searchableRow = normalizeSearchString(columns.map((column) => {
        const rawValue = row?.[column.key];
        return [
            column.label,
            column.key,
            rawValue === null || rawValue === undefined ? '' : rawValue
        ].join(' ');
    }).join(' '));
    return tokens.every((token) => searchableRow.includes(token));
}

function getDatasetDownloadOptions(dataset) {
    const links = Array.isArray(dataset?.links) ? dataset.links : [];
    const preferredLinks = links.filter((link) => (
        link?.link_type === 'data'
        && TABLE_DOWNLOAD_FORMATS.includes(`${link?.extension || ''}`.toLowerCase())
        && link?.url
    ));
    const uniqueOptions = [];
    const seen = new Set();
    preferredLinks.forEach((link) => {
        const extension = `${link.extension || ''}`.toLowerCase();
        const url = `${link.url || ''}`;
        const isGeoServerExcelLink = extension === 'excel' && /[?&]outputFormat=excel(?:&|$)/i.test(url);
        if (isGeoServerExcelLink) {
            return;
        }
        const key = `${extension}:${url}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        uniqueOptions.push({
            id: extension,
            label: ['xlsx', 'xls', 'excel'].includes(extension) ? 'Excel (.xlsx)' : 'CSV (.csv)',
            url
        });
    });
    return uniqueOptions;
}

function PaginationCustom({ activePage, items, onSelect }) {
    if (!items || items <= 1) {
        return null;
    }
    const pageItems = [];
    const pushPage = (page) => pageItems.push({ type: 'page', key: `page-${page}`, page });
    const pushEllipsis = (key) => pageItems.push({ type: 'ellipsis', key });
    const windowStart = Math.max(2, activePage - 2);
    const windowEnd = Math.min(items - 1, activePage + 2);

    pushPage(1);
    if (windowStart > 2) {
        pushEllipsis('left');
    }
    for (let page = windowStart; page <= windowEnd; page++) {
        pushPage(page);
    }
    if (windowEnd < items - 1) {
        pushEllipsis('right');
    }
    if (items > 1) {
        pushPage(items);
    }
    return (
        <ul className="ztcv-pagination" role="navigation" aria-label="Table pagination">
            <li className={`ztcv-page-item ${activePage <= 1 ? 'disabled' : ''}`}>
                <button type="button" className="ztcv-page-link" disabled={activePage <= 1} onClick={() => activePage > 1 && onSelect(activePage - 1)} aria-label="Previous page">
                    ‹
                </button>
            </li>
            {pageItems.map((item) => item.type === 'ellipsis'
                ? (
                    <li key={item.key} className="ztcv-page-item disabled ztcv-page-item-ellipsis" aria-hidden="true">
                        <span className="ztcv-page-link">…</span>
                    </li>
                )
                : (
                    <li key={item.key} className={`ztcv-page-item ${item.page === activePage ? 'active' : ''}`}>
                        <button
                            type="button"
                            className="ztcv-page-link"
                            onClick={() => item.page !== activePage && onSelect(item.page)}
                            aria-current={item.page === activePage ? 'page' : undefined}>
                            {item.page}
                        </button>
                    </li>
                ))}
            <li className={`ztcv-page-item ${activePage >= items ? 'disabled' : ''}`}>
                <button type="button" className="ztcv-page-link" disabled={activePage >= items} onClick={() => activePage < items && onSelect(activePage + 1)} aria-label="Next page">
                    ›
                </button>
            </li>
        </ul>
    );
}

PaginationCustom.propTypes = {
    activePage: PropTypes.number,
    items: PropTypes.number,
    onSelect: PropTypes.func
};

function TableDownloadMenu({ options, disabled, onSelect }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const onDocumentClick = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocumentClick);
        return () => document.removeEventListener('mousedown', onDocumentClick);
    }, [open]);

    if (!options.length) {
        return null;
    }

    return (
        <div className={`ztcv-download-menu ${open ? 'is-open' : ''}`} ref={rootRef}>
            <Button className="ztcv-download-btn" onClick={() => setOpen((value) => !value)}>
                {disabled ? 'Preparing download...' : 'Download table'}
                <span className="ztcv-download-caret">{open ? '▴' : '▾'}</span>
            </Button>
            {open ? (
                <div className="ztcv-download-popover" role="menu" aria-label="Download table">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className="ztcv-download-option"
                            onClick={() => {
                                setOpen(false);
                                onSelect(option);
                            }}>
                            {option.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

TableDownloadMenu.propTypes = {
    options: PropTypes.array,
    disabled: PropTypes.bool,
    onSelect: PropTypes.func
};

function CollectionNavigator({ datasets, activeKey, onSelect }) {
    const activeDataset = datasets[activeKey];
    if (!datasets.length || datasets.length <= 1) {
        return null;
    }
    const useTabs = datasets.length <= MAX_VISIBLE_TABS;
    if (useTabs) {
        return (
            <Tabs id="zalf-tabular-collection-tabs" activeKey={activeKey} onSelect={(key) => onSelect(parseInt(key, 10))}>
                {datasets.map((dataset, index) => (
                    <Tab key={dataset.pk || index} eventKey={index} title={dataset.title || dataset.name || dataset.alternate} />
                ))}
            </Tabs>
        );
    }
    return (
        <div className="ztcv-collection-nav">
            <div className="ztcv-collection-nav-main">
                <div className="ztcv-collection-nav-copy">
                    <div className="ztcv-collection-nav-kicker">Table collection</div>
                    <div className="ztcv-collection-nav-title">Browse tables in this collection</div>
                </div>
                <div className="ztcv-collection-nav-controls">
                    <button
                        type="button"
                        className="ztcv-collection-btn"
                        disabled={activeKey <= 0}
                        onClick={() => activeKey > 0 && onSelect(activeKey - 1)}>
                        Previous
                    </button>
                    <div className="ztcv-collection-select-wrap">
                        <label className="ztcv-collection-label" htmlFor="ztcv-collection-select">Table</label>
                        <select
                            id="ztcv-collection-select"
                            className="ztcv-collection-select"
                            value={activeKey}
                            onChange={(event) => onSelect(parseInt(event.target.value, 10))}>
                            {datasets.map((dataset, index) => (
                                <option key={dataset.pk || index} value={index}>
                                    {index + 1}. {dataset.title || dataset.name || dataset.alternate}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        className="ztcv-collection-btn"
                        disabled={activeKey >= datasets.length - 1}
                        onClick={() => activeKey < datasets.length - 1 && onSelect(activeKey + 1)}>
                        Next
                    </button>
                </div>
            </div>
            <div className="ztcv-collection-nav-meta">
                <span className="ztcv-collection-nav-badge">Table {activeKey + 1} of {datasets.length}</span>
                {activeDataset?.title || activeDataset?.name || activeDataset?.alternate}
            </div>
        </div>
    );
}

CollectionNavigator.propTypes = {
    datasets: PropTypes.array,
    activeKey: PropTypes.number,
    onSelect: PropTypes.func
};

export function DatasetTable({ dataset, geoserverUrl, activeIndex, totalDatasets }) {
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchDraft, setSearchDraft] = useState('');
    const [searchText, setSearchText] = useState('');
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const requestRef = useRef(0);
    const tableWrapRef = useRef(null);
    const typeName = dataset?.alternate;
    const owsUrl = useMemo(() => `${geoserverUrl}ows`, [geoserverUrl]);
    const downloadOptions = useMemo(() => getDatasetDownloadOptions(dataset), [dataset]);

    useEffect(() => {
        let mounted = true;
        if (!owsUrl || !typeName) {
            return undefined;
        }
        describeFeatureType(owsUrl, typeName)
            .then((schema) => {
                if (mounted) {
                    setColumns(normalizeColumnsFromSchema(schema));
                }
            })
            .catch(() => {
                if (mounted) {
                    setColumns([]);
                }
            });
        return () => {
            mounted = false;
        };
    }, [owsUrl, typeName]);

    useEffect(() => {
        setSearchDraft('');
        setSearchText('');
        setPageSize(DEFAULT_PAGE_SIZE);
        setCurrentPage(1);
    }, [typeName]);

    useEffect(() => {
        const handle = setTimeout(() => {
            const nextSearch = searchDraft.trim();
            if (nextSearch !== searchText) {
                setCurrentPage(1);
                setSearchText(nextSearch);
            }
        }, 180);
        return () => clearTimeout(handle);
    }, [searchDraft, searchText]);

    useEffect(() => {
        if (!owsUrl || !typeName) {
            return;
        }
        const requestId = ++requestRef.current;
        const fetchData = async() => {
            setLoading(true);
            setError(null);
            try {
                const params = searchText
                    ? {
                        typeName,
                        maxFeatures: SEARCH_FETCH_LIMIT,
                        startIndex: 0
                    }
                    : {
                        typeName,
                        maxFeatures: pageSize,
                        startIndex: (currentPage - 1) * pageSize
                    };
                const data = await getFeatureSimple(owsUrl, params);
                if (requestRef.current !== requestId) {
                    return;
                }
                const resolvedColumns = columns.length ? columns : normalizeColumnsFromFeatures(data);
                if (!columns.length && resolvedColumns.length) {
                    setColumns(resolvedColumns);
                }
                const nextRows = rowsFromFeatures(data, resolvedColumns);
                if (searchText) {
                    const filteredRows = nextRows.filter((row) => rowMatchesSearch(row, searchText, resolvedColumns));
                    const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                    setRows(pagedRows);
                    setTotalRows(filteredRows.length);
                } else {
                    setRows(nextRows);
                    setTotalRows(parseTotalFeatures(data, nextRows.length));
                }
            } catch (e) {
                if (requestRef.current === requestId) {
                    setError(e);
                    setRows([]);
                    setTotalRows(0);
                }
            } finally {
                if (requestRef.current === requestId) {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [owsUrl, typeName, pageSize, currentPage, searchText, columns]);

    useEffect(() => {
        const element = tableWrapRef.current;
        if (!element) {
            return undefined;
        }
        const updateScrollState = () => {
            const hasHorizontalOverflow = element.scrollWidth > element.clientWidth + 4;
            const canScrollFurther = element.scrollLeft + element.clientWidth < element.scrollWidth - 4;
            setShowScrollHint(hasHorizontalOverflow && canScrollFurther);
        };
        updateScrollState();
        element.addEventListener('scroll', updateScrollState);
        window.addEventListener('resize', updateScrollState);
        return () => {
            element.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [columns, rows, pageSize, activeIndex]);

    const totalPages = totalRows > 0 ? Math.ceil(totalRows / pageSize) : 0;
    const from = totalRows === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const to = totalRows === 0 ? 0 : Math.min(currentPage * pageSize, totalRows);

    return (
        <div className="ztcv-panel panel panel-default">
            <div className="panel-heading ztcv-panel-heading">
                <div className="ztcv-toolbar">
                    <div className="ztcv-toolbar-left">
                        {totalDatasets > 1 ? (
                            <div className="ztcv-eyebrow">
                                <span className="ztcv-badge">Table {activeIndex + 1} of {totalDatasets}</span>
                                <span className="ztcv-badge ztcv-badge-soft">Table collection</span>
                            </div>
                        ) : (
                            <div className="ztcv-eyebrow">
                                <span className="ztcv-badge ztcv-badge-soft">Table</span>
                            </div>
                        )}
                        <h4 className="panel-title ztcv-title">{getDatasetDisplayTitle(dataset)}</h4>
                        {getVisibleDatasetSubtitle(dataset)
                            ? <div className="ztcv-subtitle">{getVisibleDatasetSubtitle(dataset)}</div>
                            : null}
                    </div>
                    <div className="ztcv-toolbar-right form-inline">
                        <TableDownloadMenu
                            options={downloadOptions}
                            disabled={false}
                            onSelect={(option) => {
                                if (!option?.url) {
                                    return;
                                }
                                window.open(option.url, '_blank', 'noopener,noreferrer');
                            }}
                        />
                        <FormControl
                            type="text"
                            value={searchDraft}
                            className="ztcv-search"
                            placeholder="Filter rows by text"
                            onChange={(event) => setSearchDraft(event.target.value)}
                        />
                        <Button onClick={() => {
                            setSearchDraft('');
                            setSearchText('');
                            setCurrentPage(1);
                        }}>Clear</Button>
                    </div>
                </div>
            </div>
            <div className="panel-body ztcv-panel-body">
                {error ? <div className="alert alert-warning">Failed to load table data.</div> : null}
                <div className="ztcv-table-stage">
                    <div className="ztcv-table-stage-head">
                        <div className="ztcv-table-context">
                            <span className="ztcv-table-kicker">Data preview</span>
                            <span className="ztcv-table-caption">
                                Showing the first {Math.min(pageSize, totalRows || pageSize)} rows on this page. Filtering updates as you type.
                            </span>
                        </div>
                        {showScrollHint ? (
                            <div className="ztcv-scroll-hint">Scroll horizontally to see more columns</div>
                        ) : null}
                    </div>
                <div ref={tableWrapRef} className="table-responsive ztcv-table-wrap">
                    <table className="table table-striped table-hover table-bordered ztcv-table">
                        <thead>
                            <tr>
                                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && rows.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={Math.max(columns.length, 1)} className="ztcv-empty">No rows found.</td>
                                    </tr>
                                )
                                : rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {columns.map((column) => <td key={column.key}>{renderHighlightedText(formatCellValue(row[column.key]), searchText)}</td>)}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                </div>
                <div className="ztcv-footer">
                    <div className="ztcv-footer-meta">
                        <div className="ztcv-summary">
                            {loading ? 'Loading rows...' : `${from}-${to} of ${totalRows} rows`}
                        </div>
                        <label className="ztcv-page-size">
                            <span>Rows per page</span>
                            <select value={pageSize} onChange={(event) => {
                                setPageSize(Number(event.target.value));
                                setCurrentPage(1);
                            }}>
                                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="ztcv-footer-pagination">
                        <PaginationCustom activePage={currentPage} items={totalPages} onSelect={(page) => setCurrentPage(page)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

DatasetTable.propTypes = {
    dataset: PropTypes.object,
    geoserverUrl: PropTypes.string,
    activeIndex: PropTypes.number,
    totalDatasets: PropTypes.number
};

export default function ZalfTabularCollectionViewer({ mapId, geoserverUrl }) {
    const [datasets, setDatasets] = useState([]);
    const [activeKey, setActiveKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        if (!mapId) {
            return undefined;
        }
        setLoading(true);
        setError(null);
        axios.get(`/api/v2/maps/${mapId}/datasets/`)
            .then(({ data }) => {
                if (!mounted) {
                    return;
                }
                setDatasets(Array.isArray(data) ? data : []);
                setActiveKey(0);
            })
            .catch((err) => {
                if (mounted) {
                    setError(err);
                    setDatasets([]);
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });
        return () => {
            mounted = false;
        };
    }, [mapId]);

    if (loading) {
        return <div className="ztcv-loading">Loading data collection...</div>;
    }

    if (error) {
        return <div className="alert alert-warning ztcv-state">Failed to load data collection.</div>;
    }

    if (!datasets.length) {
        return <div className="alert alert-info ztcv-state">No datasets available.</div>;
    }

    if (datasets.length === 1) {
        return <DatasetTable dataset={datasets[0]} geoserverUrl={geoserverUrl} activeIndex={0} totalDatasets={1} />;
    }

    return (
        <div className="ztcv-root">
            <CollectionNavigator datasets={datasets} activeKey={activeKey} onSelect={setActiveKey} />
            <DatasetTable dataset={datasets[activeKey]} geoserverUrl={geoserverUrl} activeIndex={activeKey} totalDatasets={datasets.length} />
        </div>
    );
}

ZalfTabularCollectionViewer.propTypes = {
    mapId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    geoserverUrl: PropTypes.string
};
