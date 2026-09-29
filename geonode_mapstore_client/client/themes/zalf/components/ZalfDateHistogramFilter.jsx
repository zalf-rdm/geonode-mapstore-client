/**
 * CUSTOM PATH: themes/zalf/components/ZalfDateHistogramFilter.jsx
 * REASON: Renders the ZALF catalogue's temporal histogram, presets, year range,
 * and explicit date interval using the GeoNode date facet API.
 * Uses React.createElement — themes/ is outside babel-loader include.
 */

import React, { useEffect, useMemo, useState } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import { paramsSerializer } from '../../../js/utils/APIUtils';

const ce = React.createElement;
const DATE_FORMAT_LENGTH = 10;

const getDateKey = (filterKey, operator) => `filter{${filterKey}.${operator}}`;
const toInputDate = (value) => value ? String(value).slice(0, DATE_FORMAT_LENGTH) : '';
const toApiDate = (value, endOfDay = false) => value
    ? `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`
    : null;
const formatInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildPreset = (months) => {
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - months);
    return { from: formatInputDate(from), to: formatInputDate(to) };
};

export default function ZalfDateHistogramFilter({ query = {}, filterKey = 'date', onChange = () => {} }) {
    const fromKey = getDateKey(filterKey, 'gte');
    const toKey = getDateKey(filterKey, 'lte');
    const queryFrom = toInputDate(query[fromKey]);
    const queryTo = toInputDate(query[toKey]);
    const [buckets, setBuckets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draftFrom, setDraftFrom] = useState(queryFrom);
    const [draftTo, setDraftTo] = useState(queryTo);

    const facetParams = useMemo(() => Object.keys(query).reduce((params, key) => {
        if (key.startsWith('filter{') && key !== fromKey && key !== toKey) {
            params[key] = query[key];
        }
        return params;
    }, { page_size: 200 }), [query, fromKey, toKey]);
    const facetParamsKey = JSON.stringify(facetParams);

    useEffect(() => {
        let active = true;
        setLoading(true);
        axios.get('/api/v2/facets/date', { params: facetParams, ...paramsSerializer() })
            .then(({ data }) => {
                if (active) {
                    setBuckets(data?.topics?.items || []);
                }
            })
            .catch(() => {
                if (active) {
                    setBuckets([]);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => { active = false; };
    }, [facetParamsKey]);

    useEffect(() => {
        setDraftFrom(queryFrom);
        setDraftTo(queryTo);
    }, [queryFrom, queryTo]);

    const currentYear = new Date().getFullYear();
    const firstYear = buckets.length ? Number(buckets[0].key) : currentYear - 10;
    const lastYear = buckets.length ? Number(buckets[buckets.length - 1].key) : currentYear;
    const counts = buckets.reduce((result, bucket) => ({ ...result, [bucket.key]: bucket.count }), {});
    const years = Array.from({ length: Math.max(lastYear - firstYear + 1, 1) }, (_, index) => firstYear + index);
    const maxCount = Math.max(...years.map((year) => counts[year] || 0), 1);
    const selectedFromYear = Math.min(Math.max(Number((draftFrom || `${firstYear}`).slice(0, 4)), firstYear), lastYear);
    const selectedToYear = Math.max(Math.min(Number((draftTo || `${lastYear}`).slice(0, 4)), lastYear), firstYear);

    const applyDates = (from, to) => onChange({
        [fromKey]: toApiDate(from),
        [toKey]: toApiDate(to, true)
    });
    const applyPreset = (months) => {
        const range = buildPreset(months);
        setDraftFrom(range.from);
        setDraftTo(range.to);
        applyDates(range.from, range.to);
    };
    const selectYear = (year) => {
        const from = `${year}-01-01`;
        const to = `${year}-12-31`;
        setDraftFrom(from);
        setDraftTo(to);
        applyDates(from, to);
    };
    const updateRangeYear = (side, value) => {
        const year = Number(value);
        const fromYear = side === 'from' ? Math.min(year, selectedToYear) : selectedFromYear;
        const toYear = side === 'to' ? Math.max(year, selectedFromYear) : selectedToYear;
        const from = `${fromYear}-01-01`;
        const to = `${toYear}-12-31`;
        setDraftFrom(from);
        setDraftTo(to);
        applyDates(from, to);
    };

    return ce('fieldset', { className: 'zalf-date-filter' },
        ce('legend', null, 'Date'),
        ce('div', {
            className: `zalf-date-histogram${loading ? ' is-loading' : ''}`,
            'aria-label': loading ? 'Loading yearly resource distribution' : 'Resources by year'
        },
        years.map((year) => ce('button', {
            key: year,
            type: 'button',
            className: 'zalf-date-histogram__bar',
            style: { '--zalf-date-count': `${Math.max(((counts[year] || 0) / maxCount) * 100, counts[year] ? 8 : 2)}%` },
            title: `${year}: ${counts[year] || 0} resources`,
            'aria-label': `${year}: ${counts[year] || 0} resources`,
            onClick: () => selectYear(year)
        }))),
        ce('div', { className: 'zalf-date-range' },
            ce('div', { className: 'zalf-date-range__track', 'aria-hidden': 'true' }),
            ce('input', {
                type: 'range', min: firstYear, max: lastYear, value: selectedFromYear,
                'aria-label': 'Start year',
                onChange: (event) => updateRangeYear('from', event.target.value)
            }),
            ce('input', {
                type: 'range', min: firstYear, max: lastYear, value: selectedToYear,
                'aria-label': 'End year',
                onChange: (event) => updateRangeYear('to', event.target.value)
            })
        ),
        ce('div', { className: 'zalf-date-filter__years' },
            ce('span', null, firstYear),
            ce('span', null, lastYear)
        ),
        ce('div', { className: 'zalf-date-filter__presets' },
            [[6, 'Last 6 months'], [12, 'Last 1 year'], [60, 'Last 5 years']].map(([months, label]) => {
                const range = buildPreset(months);
                return ce('button', {
                    key: months,
                    type: 'button',
                    'aria-pressed': queryFrom === range.from && queryTo === range.to,
                    onClick: () => applyPreset(months)
                }, label);
            })
        ),
        ce('div', { className: 'zalf-date-filter__custom' },
            ce('label', null,
                ce('span', null, 'From'),
                ce('input', {
                    type: 'date', value: draftFrom, max: draftTo || undefined,
                    onChange: (event) => setDraftFrom(event.target.value)
                })
            ),
            ce('label', null,
                ce('span', null, 'To'),
                ce('input', {
                    type: 'date', value: draftTo, min: draftFrom || undefined,
                    onChange: (event) => setDraftTo(event.target.value)
                })
            ),
            ce('button', {
                type: 'button',
                className: 'zalf-date-filter__apply',
                disabled: !draftFrom && !draftTo,
                onClick: () => applyDates(draftFrom, draftTo)
            }, 'Apply')
        )
    );
}
