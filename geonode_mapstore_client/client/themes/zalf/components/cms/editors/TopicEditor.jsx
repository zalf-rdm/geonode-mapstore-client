/**
 * CUSTOM PATH: themes/zalf/components/cms/editors/TopicEditor.jsx
 * REASON: Topics used to be hardcoded in three places (zalf-rdm/geonode#863).
 * This editor makes them CMS content and lets each topic say *how* it searches:
 * a free-text term, real metadata filters, or both.
 *
 * The field list and the selectable values come from the facets API, which is
 * the same vocabulary the catalogue's own filter sidebar uses — so anything
 * configurable here is guaranteed to be a filter the catalogue can apply.
 */

import React from 'react';
import { cmsGet, cmsRequest, buildFormData, errorMessage } from '../cmsApi';
import { buildTopicHref, toggleFilterValue } from '../../../utils/TopicUtils';
import CmsModal from './CmsModal';
import TopicIcon from '../../common/TopicIcon';
import { TOPIC_ICON_NAMES } from '../../../utils/TopicIcons';

const BASE = '/api/v2/cms/topics/';

const EMPTY = {
    name: '', name_de: '', name_fr: '', name_es: '', name_it: '',
    search_term: '', filters: [], icon: '',
    show_in_navbar: true, show_on_homepage: true,
    order: 0, is_active: true
};

// Facet filters not offered for topics. Keyed on the filter param rather than the
// facet name or type, because that is what the server's allowlist rejects too
// (geonode/zalf/api/topic_filters.py UNSUPPORTED_FILTER_KEYS) — keep the two in step.
//   date     — a range (gte/lte) over a DateTimeField, not a value picker
//   featured — a yes/no homepage flag, not a subject dimension
//   region   — geographic rather than thematic
//   author   — broken in this fork: the serializer maps it to the
//              `metadata_author` property, which has no ORM path, so the
//              request 500s. Use Owner instead.
const UNSUPPORTED_FILTER_KEYS = [
    'filter{date}',
    'filter{featured}',
    'filter{regions.code.in}',
    'filter{author.pk.in}'
];

// A homepage tile clamps its label to two lines. Past roughly this many
// characters a name starts being cut off at the narrowest grid column, so the
// editor says so while the admin can still shorten it, rather than letting them
// discover it on the live page. Advisory only -- a long name is still valid,
// and the navbar dropdown never clamps.
const TILE_LABEL_BUDGET = 28;

function isLongForTile(value) {
    return (value || '').trim().length > TILE_LABEL_BUDGET;
}

const LOCALE_FIELDS = [
    ['name_de', 'German'],
    ['name_fr', 'French'],
    ['name_es', 'Spanish'],
    ['name_it', 'Italian']
];

function useFacets() {
    const [facets, setFacets] = React.useState([]);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        // include_config=true because `order` lives in the provider's config,
        // not in the base get_info() payload — without it every facet would
        // sort equal and the list would not match the catalogue's own sidebar.
        cmsGet('/api/v2/facets?include_config=true')
            .then((data) => {
                const items = (data?.facets || [])
                    .filter((f) => f.filter && !UNSUPPORTED_FILTER_KEYS.includes(f.filter))
                    .sort((a, b) => ((a.config?.order ?? 99) - (b.config?.order ?? 99))
                        || String(a.label || a.name).localeCompare(String(b.label || b.name)));
                setFacets(items);
            })
            // Surfaced rather than swallowed: with no facets "+ Add filter" is
            // permanently disabled, and the save then fails with the
            // unrelated-looking "needs at least one filter or a search term".
            .catch((err) => setError(errorMessage(err, 'The filter fields could not be loaded.')));
    }, []);
    return { facets, error };
}

/** Selectable values for one facet, filtered server-side by `search`. */
function useFacetValues(facetName, search) {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => {
        if (!facetName) {
            setItems([]);
            return () => {};
        }
        const controller = new AbortController();
        const timer = setTimeout(() => {
            setLoading(true);
            const query = search ? `&topic_contains=${encodeURIComponent(search)}` : '';
            cmsGet(`/api/v2/facets/${encodeURIComponent(facetName)}?page_size=50${query}`, { signal: controller.signal })
                .then((data) => setItems(data?.topics?.items || []))
                .catch(() => {})
                .finally(() => setLoading(false));
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [facetName, search]);
    return { items, loading };
}

function FilterRow({ row, index, facets, usedFields, onChange, onRemove }) {
    const [search, setSearch] = React.useState('');
    // Rows are keyed by index, so removing one reuses this instance for the row
    // that shifts into its place. Without this the surviving row would keep the
    // removed row's search text and query its own facet with it.
    React.useEffect(() => { setSearch(''); }, [row.field]);
    const { items, loading } = useFacetValues(row.field, search);
    const facet = facets.find((f) => f.name === row.field);
    const values = row.values || [];
    const labels = row.labels || [];

    function changeField(name) {
        const next = facets.find((f) => f.name === name);
        // Values belong to the old facet, so clear them with the field.
        onChange(index, { field: name, key: next ? next.filter : '', values: [], labels: [] });
        setSearch('');
    }

    function removeValue(key) {
        if (!values.includes(String(key))) return;
        onChange(index, toggleFilterValue(row, key, items));
    }

    function toggleValue(rawKey) {
        onChange(index, toggleFilterValue(row, rawKey, items));
    }

    return React.createElement(
        'div',
        { className: 'cms-topic-filter' },
        React.createElement(
            'div',
            { className: 'cms-topic-filter__head' },
            React.createElement(
                'select',
                { value: row.field || '', onChange: (e) => changeField(e.target.value) },
                React.createElement('option', { value: '' }, '— choose a field —'),
                ...facets.map((f) => React.createElement(
                    'option',
                    {
                        key: f.name,
                        value: f.name,
                        // One row per field: the server rejects a duplicate key
                        // and asks for the values to be combined instead.
                        disabled: f.name !== row.field && usedFields.includes(f.name)
                    },
                    f.label || f.name
                ))
            ),
            React.createElement(
                'button',
                { type: 'button', className: 'btn btn-xs btn-default', onClick: () => onRemove(index) },
                'Remove'
            )
        ),
        facet && facet.type === 'thesaurus'
            ? React.createElement(
                'p',
                { className: 'cms-topic-filter__warning' },
                'Thesaurus keywords are stored as database ids, which differ between environments. '
                + 'Prefer Category or Keyword for a topic that must survive a data migration.'
            )
            : null,
        values.length > 0
            ? React.createElement(
                'div',
                { className: 'cms-topic-filter__chips' },
                ...values.map((value, i) => React.createElement(
                    'span',
                    { key: value, className: 'cms-topic-filter__chip' },
                    labels[i] || value,
                    React.createElement(
                        'button',
                        { type: 'button', 'aria-label': `Remove ${labels[i] || value}`, onClick: () => removeValue(value) },
                        '×'
                    )
                ))
            )
            : null,
        row.field
            ? React.createElement(
                'div',
                { className: 'cms-topic-filter__picker' },
                React.createElement('input', {
                    type: 'search',
                    value: search,
                    placeholder: 'Search values…',
                    onChange: (e) => setSearch(e.target.value)
                }),
                // A list of toggle buttons rather than a <select>: a controlled
                // select forced selectedIndex back to -1 after every change, so
                // a click never stuck. Buttons also show selection inline and
                // let the same value be clicked again to remove it.
                React.createElement(
                    'div',
                    { className: 'cms-topic-filter__options', role: 'group' },
                    loading
                        ? React.createElement('span', { className: 'cms-topic-filter__loading' }, 'Loading…')
                        : null,
                    ...items.map((item) => {
                        const key = String(item.key);
                        const selected = values.includes(key);
                        return React.createElement(
                            'button',
                            {
                                key,
                                type: 'button',
                                // A count of 0 means the filter matches nothing
                                // right now — worth seeing before saving.
                                className: 'cms-topic-filter__option'
                                    + (selected ? ' is-selected' : '')
                                    + (item.count ? '' : ' is-empty'),
                                'aria-pressed': selected ? 'true' : 'false',
                                onClick: () => toggleValue(item.key)
                            },
                            `${item.label} (${item.count ?? 0})`
                        );
                    }),
                    items.length === 0 && !loading
                        ? React.createElement('span', { className: 'cms-topic-filter__empty' }, 'No values match.')
                        : null
                )
            )
            : null
    );
}

function FilterBuilder({ value, facets, onChange }) {
    const rows = value || [];
    const usedFields = rows.map((r) => r.field).filter(Boolean);

    function updateRow(index, next) {
        onChange(rows.map((r, i) => (i === index ? next : r)));
    }

    function removeRow(index) {
        onChange(rows.filter((_, i) => i !== index));
    }

    function addRow() {
        const free = facets.find((f) => !usedFields.includes(f.name));
        onChange([...rows, { field: free ? free.name : '', key: free ? free.filter : '', values: [], labels: [] }]);
    }

    return React.createElement(
        'div',
        { className: 'cms-topic-filters' },
        ...rows.map((row, index) => React.createElement(FilterRow, {
            key: index,
            row, index, facets, usedFields,
            onChange: updateRow,
            onRemove: removeRow
        })),
        React.createElement(
            'button',
            {
                type: 'button',
                className: 'btn btn-xs btn-default',
                disabled: facets.length === 0 || usedFields.length >= facets.length,
                onClick: addRow
            },
            '+ Add filter'
        )
    );
}

function Modal({ item, onClose, onSaved }) {
    const [form, setForm] = React.useState({ ...EMPTY, ...item });
    const [imageFile, setImageFile] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState(item?.image_url || null);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const isNew = !item?.id;
    const { facets, error: facetsError } = useFacets();

    function set(key, value) { setForm(f => ({ ...f, [key]: value })); }

    function handleImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = ev => setPreviewUrl(ev.target.result);
        reader.readAsDataURL(file);
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        // Drop the server-computed read-only fields before posting.
        const { id, image_url: imageUrl, name_localized: nameLocalized,
            catalogue_href: catalogueHref, slug, filters, ...fields } = form;
        // filters MUST be stringified: buildFormData does String(v) on every
        // value, so an array would arrive as "[object Object]". The write
        // serializer parses a JSON string back into a list.
        const body = buildFormData({ ...fields, filters: JSON.stringify(filters || []) }, 'image', imageFile);
        const url = isNew ? BASE : `${BASE}${id}/`;
        cmsRequest(url, isNew ? 'POST' : 'PUT', body)
            .then(saved => { onSaved(saved, isNew); onClose(); })
            .catch(err => setError(errorMessage(err, 'The topic could not be saved.')))
            .finally(() => setSaving(false));
    }

    const previewHref = buildTopicHref(form.search_term, form.filters);

    return React.createElement(
        CmsModal,
        { title: isNew ? 'Add Topic' : 'Edit Topic', onClose, saving },
        React.createElement(
            'form',
            { onSubmit: handleSubmit },
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Name (English)'),
                React.createElement('input', {
                    type: 'text', value: form.name, maxLength: 120, required: true,
                    onChange: e => set('name', e.target.value)
                }),
                form.show_on_homepage && isLongForTile(form.name)
                    ? React.createElement(
                        'small',
                        { className: 'cms-modal__warning' },
                        `Over ${TILE_LABEL_BUDGET} characters: the homepage tile clamps its label to two lines, so this name will be cut off. The navbar shows it in full.`
                    )
                    : null
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Translations'),
                React.createElement(
                    'small',
                    null,
                    'Leave a language blank to fall back to the English name.'
                ),
                ...LOCALE_FIELDS.map(([field, label]) => React.createElement(
                    'input',
                    {
                        key: field,
                        type: 'text',
                        value: form[field] || '',
                        maxLength: 120,
                        placeholder: label,
                        onChange: e => set(field, e.target.value)
                    }
                )),
                // Checked per language: a translation can overflow the tile
                // while the English name fits, and German routinely does.
                (() => {
                    const over = LOCALE_FIELDS
                        .filter(([field]) => isLongForTile(form[field]))
                        .map(([, label]) => label);
                    return form.show_on_homepage && over.length > 0
                        ? React.createElement(
                            'small',
                            { className: 'cms-modal__warning' },
                            `Too long for the homepage tile in ${over.join(', ')}: the label will be cut off after two lines.`
                        )
                        : null;
                })()
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Filters'),
                facetsError
                    ? React.createElement('p', { className: 'cms-editor__error', role: 'alert' }, facetsError)
                    : null,
                React.createElement(FilterBuilder, {
                    value: form.filters,
                    facets,
                    onChange: (filters) => set('filters', filters)
                })
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Also match this text (optional)'),
                React.createElement('input', {
                    type: 'text', value: form.search_term || '', maxLength: 200,
                    placeholder: 'e.g. Long Term Field Experiment',
                    onChange: e => set('search_term', e.target.value)
                }),
                React.createElement(
                    'small',
                    null,
                    'Searches titles, abstracts, keywords and more — the same as typing into the catalogue search box.'
                )
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Resulting catalogue search'),
                React.createElement('code', { className: 'cms-topic-preview' }, previewHref),
                React.createElement(
                    'a',
                    { href: previewHref, target: '_blank', rel: 'noreferrer' },
                    'Preview in catalogue →'
                )
            ),
            // The picker offers exactly the icons the homepage can draw: both
            // read the same TOPIC_ICON_NAMES, so an admin can never choose one
            // that renders blank on the card.
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Icon (homepage card only)'),
                React.createElement(
                    'div',
                    { className: 'cms-editor__icon-picker' },
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: `cms-editor__icon-option${form.icon ? '' : ' is-selected'}`,
                            title: 'No icon',
                            'aria-pressed': !form.icon,
                            onClick: () => set('icon', '')
                        },
                        React.createElement('span', { className: 'cms-editor__icon-none' }, '\u2014')
                    ),
                    ...TOPIC_ICON_NAMES.map(name => React.createElement(
                        'button',
                        {
                            key: name,
                            type: 'button',
                            className: `cms-editor__icon-option${form.icon === name ? ' is-selected' : ''}`,
                            title: name,
                            'aria-label': name,
                            'aria-pressed': form.icon === name,
                            onClick: () => set('icon', name)
                        },
                        React.createElement(TopicIcon, { name, className: 'cms-editor__icon-glyph' })
                    ))
                )
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Thumbnail (replaces the icon on the card)'),
                previewUrl && React.createElement('img', {
                    src: previewUrl, alt: '',
                    style: { width: 160, height: 90, objectFit: 'cover', marginBottom: 8, display: 'block', borderRadius: 6 }
                }),
                React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleImage })
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field' },
                React.createElement('label', null, 'Order'),
                React.createElement('input', {
                    type: 'number', value: form.order, min: 0, style: { width: 80 },
                    onChange: e => set('order', parseInt(e.target.value, 10) || 0)
                })
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field cms-modal__field--check' },
                React.createElement('input', {
                    type: 'checkbox', id: 'topic-navbar', checked: form.show_in_navbar,
                    onChange: e => set('show_in_navbar', e.target.checked)
                }),
                React.createElement('label', { htmlFor: 'topic-navbar' }, 'Show in the navbar menu')
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field cms-modal__field--check' },
                React.createElement('input', {
                    type: 'checkbox', id: 'topic-homepage', checked: form.show_on_homepage,
                    onChange: e => set('show_on_homepage', e.target.checked)
                }),
                React.createElement('label', { htmlFor: 'topic-homepage' }, 'Show on the homepage grid')
            ),
            React.createElement(
                'div',
                { className: 'cms-modal__field cms-modal__field--check' },
                React.createElement('input', {
                    type: 'checkbox', id: 'topic-active', checked: form.is_active,
                    onChange: e => set('is_active', e.target.checked)
                }),
                React.createElement('label', { htmlFor: 'topic-active' }, 'Active (visible to visitors)')
            ),
            error && React.createElement('p', { className: 'cms-editor__error', role: 'alert' }, error),
            React.createElement(
                'div',
                { className: 'cms-modal__actions' },
                React.createElement('button', { type: 'button', className: 'btn btn-default', onClick: onClose }, 'Cancel'),
                React.createElement('button', { type: 'submit', className: 'btn btn-primary', disabled: saving }, saving ? 'Saving…' : 'Save')
            )
        )
    );
}

function describeTopic(item) {
    const parts = (item.filters || []).map((row) => {
        const labels = (row.labels || []).length ? row.labels : row.values || [];
        return `${row.field}: ${labels.join(', ')}`;
    });
    if (item.search_term) {
        parts.push(`text: “${item.search_term}”`);
    }
    return parts.join(' · ') || 'no filter';
}

function TopicEditor() {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [editItem, setEditItem] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [error, setError] = React.useState(null);

    const loadItems = React.useCallback(() => {
        setLoading(true);
        setError(null);
        cmsGet(BASE).then(setItems).catch(err => setError(errorMessage(err))).finally(() => setLoading(false));
    }, []);
    React.useEffect(() => { loadItems(); }, [loadItems]);

    function openNew() { setEditItem({ ...EMPTY }); setShowModal(true); }
    function openEdit(item) { setEditItem(item); setShowModal(true); }
    function closeModal() { setShowModal(false); setEditItem(null); }

    function handleSaved(saved, isNew) {
        setItems(prev => isNew ? [...prev, saved] : prev.map(i => i.id === saved.id ? saved : i));
    }

    function handleDelete(id) {
        if (!window.confirm('Delete this topic?')) return;
        setError(null);
        cmsRequest(`${BASE}${id}/`, 'DELETE')
            .then(() => setItems(prev => prev.filter(i => i.id !== id)))
            .catch(err => setError(errorMessage(err)));
    }

    function handleToggle(item) {
        cmsRequest(`${BASE}${item.id}/`, 'PATCH', { is_active: !item.is_active })
            .then(saved => setItems(prev => prev.map(i => i.id === saved.id ? saved : i)))
            .catch(err => setError(errorMessage(err)));
    }

    if (loading) return React.createElement('p', null, 'Loading…');

    return React.createElement(
        'div',
        { className: 'cms-editor' },
        React.createElement(
            'div',
            { className: 'cms-editor__toolbar' },
            React.createElement('button', { type: 'button', className: 'btn btn-primary', onClick: openNew }, '+ Add topic')
        ),
        error && React.createElement(
            'div',
            { className: 'cms-editor__error', role: 'alert' },
            error, ' ',
            React.createElement('button', { type: 'button', className: 'btn btn-link', onClick: loadItems }, 'Try again')
        ),
        items.length === 0
            ? React.createElement('p', { className: 'cms-editor__empty' }, 'No topics yet. Add one above.')
            : React.createElement(
                'ul',
                { className: 'cms-editor__list' },
                ...items.map(item => React.createElement(
                    'li',
                    { key: item.id, className: `cms-editor__row${item.is_active ? '' : ' is-inactive'}` },
                    item.image_url
                        ? React.createElement('img', { src: item.image_url, className: 'cms-editor__thumb', alt: '' })
                        : React.createElement(
                            'div',
                            { className: 'cms-editor__thumb cms-editor__thumb--empty' },
                            React.createElement(TopicIcon, { name: item.icon, className: 'cms-editor__thumb-glyph' })
                        ),
                    React.createElement(
                        'div',
                        { className: 'cms-editor__info' },
                        React.createElement('strong', null, item.name),
                        React.createElement('span', null, describeTopic(item)),
                        React.createElement(
                            'span',
                            { className: 'cms-editor__meta' },
                            item.show_in_navbar ? 'navbar' : null,
                            item.show_in_navbar && item.show_on_homepage ? ' + ' : null,
                            item.show_on_homepage ? 'homepage' : null,
                            !item.show_in_navbar && !item.show_on_homepage ? 'not shown anywhere' : null
                        ),
                        !item.is_active && React.createElement('span', { className: 'cms-editor__badge' }, 'Hidden')
                    ),
                    React.createElement(
                        'div',
                        { className: 'cms-editor__actions' },
                        React.createElement('button', { type: 'button', className: 'btn btn-xs btn-default', onClick: () => handleToggle(item) }, item.is_active ? 'Hide' : 'Show'),
                        React.createElement('button', { type: 'button', className: 'btn btn-xs btn-default', onClick: () => openEdit(item) }, 'Edit'),
                        React.createElement('button', { type: 'button', className: 'btn btn-xs btn-danger', onClick: () => handleDelete(item.id) }, 'Delete')
                    )
                ))
            ),
        showModal && React.createElement(Modal, { item: editItem, onClose: closeModal, onSaved: handleSaved })
    );
}

export default TopicEditor;
