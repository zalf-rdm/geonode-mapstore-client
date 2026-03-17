/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import FaIcon from '@js/components/FaIcon';
import { getDatasetAttributeStats } from '@js/api/geonode/v2';

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

const formatStat = (val) => {
    if (val === null || val === undefined) return '—';
    const num = Number(val);
    if (!isFinite(num)) return String(val);
    return num % 1 === 0 ? num.toLocaleString() : num.toFixed(4);
};

const hasNumeric = (v) => {
    const n = Number(v);
    return isFinite(n);
};

const getDisplayHistogram = (stats) => {
    if (!stats?.histogram?.length) return null;

    // When backend histogram is estimated and flat, model a more informative
    // traditional shape using mean/stddev (if available).
    if (
        stats.histogram_estimated
        && hasNumeric(stats.mean)
        && hasNumeric(stats.stddev)
        && Number(stats.stddev) > 0
        && hasNumeric(stats.count)
    ) {
        const mu = Number(stats.mean);
        const sigma = Number(stats.stddev);
        const total = Math.max(1, Number(stats.count));
        const weighted = stats.histogram.map((bin) => {
            const low = Number(bin.range?.[0]);
            const high = Number(bin.range?.[1]);
            const mid = (low + high) / 2;
            const z = (mid - mu) / sigma;
            const weight = Math.exp(-0.5 * z * z);
            return { ...bin, _weight: weight };
        });
        const sumW = weighted.reduce((acc, b) => acc + b._weight, 0) || 1;
        return weighted.map((bin) => ({
            ...bin,
            count: Math.max(1, Math.round((bin._weight / sumW) * total))
        }));
    }

    return stats.histogram;
};

const MiniHistogram = ({ histogram }) => {
    if (!histogram || histogram.length === 0) return null;
    const maxCount = Math.max(...histogram.map(b => b.count), 1);
    return (
        <div className="gn-attr-histogram">
            {histogram.map((bin, i) => (
                <div key={i} className="gn-attr-histogram-col">
                    <div
                        className="gn-attr-histogram-bar"
                        style={{ height: `${Math.round((bin.count / maxCount) * 100)}%` }}
                        title={`${bin.range[0]} – ${bin.range[1]}: ${bin.count}`}
                    />
                    <span className="gn-attr-histogram-label">{bin.range[0]}</span>
                </div>
            ))}
        </div>
    );
};

const BoxPlot = ({ min, max, mean, median, stddev }) => {
    if (!hasNumeric(min) || !hasNumeric(max) || Number(max) <= Number(min)) return null;

    const mn = Number(min);
    const mx = Number(max);
    const med = hasNumeric(median)
        ? Number(median)
        : (hasNumeric(mean) ? Number(mean) : (mn + mx) / 2);

    let q1 = mn + 0.25 * (mx - mn);
    let q3 = mn + 0.75 * (mx - mn);

    let quartilesEstimated = true;
    let quartileSource = 'range interpolation';

    if (hasNumeric(mean) && hasNumeric(stddev) && Number(stddev) > 0) {
        const mu = Number(mean);
        const sd = Number(stddev);
        // Approximate quartiles assuming near-normal distribution.
        q1 = mu - 0.6745 * sd;
        q3 = mu + 0.6745 * sd;
        quartileSource = 'normal approximation from mean/stddev';
    } else if (hasNumeric(median)) {
        q1 = mn + (med - mn) * 0.5;
        q3 = med + (mx - med) * 0.5;
        quartileSource = 'median-weighted interpolation';
    }

    const clamp = (v) => Math.max(mn, Math.min(mx, Number(v)));
    q1 = clamp(q1);
    q3 = clamp(q3);
    let medianClamped = clamp(med);
    const range = mx - mn;

    // Enforce monotonic order for visual consistency and hover quartile labels.
    // Final invariant: min <= q1 <= median <= q3 <= max
    q1 = Math.min(q1, q3);
    q3 = Math.max(q1, q3);
    if (medianClamped < q1) {
        q1 = medianClamped;
    }
    if (medianClamped > q3) {
        q3 = medianClamped;
    }
    q1 = clamp(q1);
    q3 = clamp(q3);
    medianClamped = Math.max(q1, Math.min(q3, medianClamped));

    const toRatio = (v) => {
        if (range <= 0) return 0;
        return Math.max(0, Math.min(1, (Number(v) - mn) / range));
    };
    const toPercent = (v) => `${toRatio(v) * 100}%`;
    const summaryParts = [
        `Min: ${formatStat(mn)}`,
        `Q1: ${formatStat(q1)}`,
        `Median: ${formatStat(medianClamped)}`,
        `Q3: ${formatStat(q3)}`,
        `Max: ${formatStat(mx)}`,
        `Quartiles: ${quartilesEstimated ? `Estimated (${quartileSource})` : 'Observed'}`
    ];
    const summaryTitle = summaryParts.join(' | ');

    return (
        <div className="gn-attr-boxplot-wrap">
            <p className="gn-attr-stats-section-label">
                Box Plot
                {quartilesEstimated && <span className="gn-attr-estimated-badge">Estimated Quartiles</span>}
            </p>
            <div
                className="gn-attr-boxplot-track"
                title={summaryTitle}
            >
                <div
                    className="gn-attr-boxplot-whisker"
                    style={{ left: toPercent(mn), width: `calc(${toPercent(mx)} - ${toPercent(mn)})` }}
                />
                <div className="gn-attr-boxplot-cap gn-attr-boxplot-cap-min" style={{ left: toPercent(mn) }} />
                <div className="gn-attr-boxplot-cap gn-attr-boxplot-cap-max" style={{ left: toPercent(mx) }} />
                <div
                    className="gn-attr-boxplot-box"
                    style={{ left: toPercent(q1), width: `calc(${toPercent(q3)} - ${toPercent(q1)})` }}
                    title={summaryTitle}
                />
                <div
                    className="gn-attr-boxplot-median"
                    style={{ left: toPercent(medianClamped) }}
                    title={summaryTitle}
                />
            </div>
            <div className="gn-attr-boxplot-axis">
                <span>Min {formatStat(mn)}</span>
                <span>Q1 {formatStat(q1)}</span>
                <span>Median {formatStat(medianClamped)}</span>
                <span>Q3 {formatStat(q3)}</span>
                <span>Max {formatStat(mx)}</span>
            </div>
        </div>
    );
};

const AttributeStatsPanel = ({ pk, attribute, onClose }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        if (!pk || !attribute) return;
        setLoading(true);
        setStats(null);
        setError(null);
        getDatasetAttributeStats(pk, attribute)
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => { setError('Could not load statistics.'); setLoading(false); });
    }, [pk, attribute]);

    return (
        <div className="gn-attr-stats-panel">
            <div className="gn-attr-stats-panel-header">
                <div>
                    <span className="gn-attr-stats-panel-title">
                        <FaIcon name="bar-chart" /> {attribute}
                    </span>
                    <span className="gn-attr-stats-panel-subtitle">Attribute Analysis</span>
                </div>
                <button className="gn-attr-stats-panel-close" onClick={onClose} aria-label="Close">
                    <FaIcon name="times" />
                </button>
            </div>
            <div className="gn-attr-stats-panel-body">
                {loading && <div className="gn-attr-stats-loading"><FaIcon name="spinner" /> Loading statistics...</div>}
                {error && <div className="gn-attr-stats-error">{error}</div>}
                {stats && !loading && (
                    <>
                        {stats.has_stats ? (
                            <>
                                <div className="gn-attr-stats-grid">
                                    {[
                                        { label: 'Count', val: stats.count },
                                        { label: 'Min', val: stats.min },
                                        { label: 'Max', val: stats.max },
                                        { label: 'Mean', val: stats.mean },
                                        { label: 'Median', val: stats.median },
                                        { label: 'Std Dev', val: stats.stddev },
                                        { label: 'Sum', val: stats.sum },
                                    ].map(({ label, val }) => (
                                        <div key={label} className="gn-attr-stats-item">
                                            <span className="gn-attr-stats-label">{label}</span>
                                            <span className="gn-attr-stats-value">{formatStat(val)}</span>
                                        </div>
                                    ))}
                                </div>
                                {(stats.histogram || (hasNumeric(stats.min) && hasNumeric(stats.max))) && (
                                    <div className="gn-attr-stats-visuals">
                                        <BoxPlot
                                            min={stats.min}
                                            max={stats.max}
                                            mean={stats.mean}
                                            median={stats.median}
                                            stddev={stats.stddev}
                                        />
                                        {stats.histogram && (
                                            <div className="gn-attr-stats-histogram-wrap">
                                                <p className="gn-attr-stats-section-label">
                                                    Distribution {stats.histogram_estimated ? '(estimated from mean/stddev)' : ''}
                                                </p>
                                                <MiniHistogram histogram={getDisplayHistogram(stats)} />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {stats.unique_values && !stats.histogram && (
                                    <div className="gn-attr-stats-unique-wrap">
                                        <p className="gn-attr-stats-section-label">Unique Values ({stats.unique_values.length})</p>
                                        <div className="gn-attr-stats-unique-list">
                                            {stats.unique_values.slice(0, 30).map((v, i) => (
                                                <span key={i} className="gn-attr-stats-unique-val">{String(v)}</span>
                                            ))}
                                            {stats.unique_values.length > 30 && (
                                                <span className="gn-attr-stats-unique-more">+{stats.unique_values.length - 30} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="gn-attr-stats-no-stats">
                                <FaIcon name="info-circle" />
                                <p>No statistics available for this attribute.</p>
                                <small>Statistics are computed for numeric fields during dataset ingestion.</small>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const DetailsAttributeTable = ({ fields = [], resource }) => {
    const [filterText, setFilterText] = useState('');
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(0);
    const [selectedAttr, setSelectedAttr] = useState(null);

    const datasetPk = resource?.pk;

    // Debug: log what resource we receive
    React.useEffect(() => {
        // eslint-disable-next-line no-console
        console.log('[DetailsAttributeTable] resource:', resource, 'pk:', datasetPk);
    }, [resource, datasetPk]);

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

    const handleRowClick = useCallback((attr) => {
        setSelectedAttr(prev => (prev === attr ? null : attr));
    }, []);

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
                            const unit = attr.attribute_unit || '-';
                            const isSelected = selectedAttr === attr.attribute;
                            return (
                                <React.Fragment key={attr.attribute || idx}>
                                    <tr
                                        className={`gn-attr-table-row${isSelected ? ' gn-attr-table-row--selected' : ''}`}
                                        onClick={() => handleRowClick(attr.attribute)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            <div className="gn-attr-table-field-name">
                                                <FaIcon name="columns" className="gn-attr-table-field-icon" />
                                                <span className="gn-attr-table-field-text">{attr.attribute}</span>
                                                {isSelected && <FaIcon name="chevron-down" className="gn-attr-table-selected-icon" />}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`gn-attr-table-type-badge ${typeClass}`}>{rawType}</span>
                                        </td>
                                        <td className="gn-attr-table-description">{description}</td>
                                        <td className="gn-attr-table-unit">{unit}</td>
                                    </tr>
                                    {isSelected && (
                                        <tr className="gn-attr-table-stats-row">
                                            <td colSpan={4} style={{ padding: 0 }}>
                                                {datasetPk
                                                    ? (
                                                        <AttributeStatsPanel
                                                            pk={datasetPk}
                                                            attribute={attr.attribute}
                                                            onClose={() => setSelectedAttr(null)}
                                                        />
                                                    ) : (
                                                        <div className="gn-attr-stats-panel">
                                                            <div className="gn-attr-stats-no-stats">
                                                                <FaIcon name="info-circle" />
                                                                <p>Statistics unavailable — resource PK not found.</p>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
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

            {/* Hint when nothing selected */}
            {!selectedAttr && (
                <div className="gn-attr-table-hint">
                    <FaIcon name="info-circle" className="gn-attr-table-hint-icon" />
                    <h4>Deep Attribute Analysis</h4>
                    <p>Click any attribute row above to view detailed statistics, value distribution, and range values.</p>
                </div>
            )}
        </div>
    );
};

DetailsAttributeTable.propTypes = {
    fields: PropTypes.array,
    resource: PropTypes.object
};

DetailsAttributeTable.defaultProps = {
    fields: [],
    resource: null
};

export default DetailsAttributeTable;
