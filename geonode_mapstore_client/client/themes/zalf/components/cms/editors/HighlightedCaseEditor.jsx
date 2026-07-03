import React from 'react';
import MarkdownEditor from './MarkdownEditor';
import { cmsRequest, buildFormData } from '../cmsApi';

const BASE = '/api/v2/cms/cases/';
const EMPTY = {
    tab_label: '', eyebrow: 'HIGHLIGHTED CASE', title: '',
    button_text: 'View case', href: '', body_markdown: '',
    order: 0, is_active: true,
};

function CharCount({ value, max }) {
    const len = (value || '').length;
    return React.createElement('small', { style: { color: len > max ? 'red' : '#888' } }, `${len} / ${max}`);
}

function useCategories() {
    const [cats, setCats] = React.useState([]);
    React.useEffect(() => {
        fetch('/api/v2/categories/?page_size=100')
            .then(r => r.json())
            .then(data => setCats((data.categories || []).map(c => c.gn_description).filter(Boolean).sort()))
            .catch(() => {});
    }, []);
    return cats;
}

function Modal({ item, onClose, onSaved }) {
    const [form, setForm] = React.useState({ ...EMPTY, ...item });
    const [imageFile, setImageFile] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState(item?.image_url || null);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const isNew = !item?.id;
    const categories = useCategories();

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
        const { id, image_url, ...fields } = form;
        const body = buildFormData(fields, 'image', imageFile);
        const url = isNew ? BASE : `${BASE}${id}/`;
        const method = isNew ? 'POST' : 'PUT';
        cmsRequest(url, method, body)
            .then(saved => { onSaved(saved, isNew); onClose(); })
            .catch(err => setError(JSON.stringify(err)))
            .finally(() => setSaving(false));
    }

    return React.createElement(
        'div',
        { className: 'cms-modal-backdrop', onClick: e => e.target === e.currentTarget && onClose() },
        React.createElement(
            'div',
            { className: 'cms-modal' },
            React.createElement('h2', { className: 'cms-modal__title' }, isNew ? 'Add Highlighted Case' : 'Edit Highlighted Case'),
            React.createElement(
                'form',
                { onSubmit: handleSubmit },
                React.createElement(
                    'div',
                    { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Tab label (topic)'),
                    React.createElement(
                        'select',
                        { value: form.tab_label, required: true, onChange: e => set('tab_label', e.target.value) },
                        React.createElement('option', { value: '' }, '— choose a topic —'),
                        ...categories.map(cat =>
                            React.createElement('option', { key: cat, value: cat }, cat)
                        )
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Title'),
                    React.createElement('input', { type: 'text', value: form.title, maxLength: 160, required: true, onChange: e => set('title', e.target.value) }),
                    React.createElement(CharCount, { value: form.title, max: 160 })
                ),
                React.createElement(
                    'div',
                    { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Button text'),
                    React.createElement('input', { type: 'text', value: form.button_text, maxLength: 20, onChange: e => set('button_text', e.target.value) }),
                    React.createElement(CharCount, { value: form.button_text, max: 20 })
                ),
                React.createElement(
                    'div',
                    { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Link (href)'),
                    React.createElement('input', { type: 'text', value: form.href, required: true, placeholder: '/catalogue/#/?q=Soil or https://…', onChange: e => set('href', e.target.value) })
                ),
                React.createElement(
                    'div',
                    { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Image'),
                    previewUrl && React.createElement('img', { src: previewUrl, alt: '', style: { width: 120, height: 120, objectFit: 'cover', marginBottom: 8, display: 'block', borderRadius: 6 } }),
                    React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleImage })
                ),
                React.createElement(
                    'div',
                    { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Order'),
                    React.createElement('input', { type: 'number', value: form.order, min: 0, style: { width: 80 }, onChange: e => set('order', parseInt(e.target.value, 10) || 0) })
                ),
                React.createElement(
                    'div',
                    { className: 'cms-modal__field cms-modal__field--check' },
                    React.createElement('input', { type: 'checkbox', id: 'case-active', checked: form.is_active, onChange: e => set('is_active', e.target.checked) }),
                    React.createElement('label', { htmlFor: 'case-active' }, 'Active (visible on homepage)')
                ),
                React.createElement(
                    'div',
                    { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Detail page content (Markdown)'),
                    React.createElement(MarkdownEditor, { value: form.body_markdown, onChange: v => set('body_markdown', v) })
                ),
                error && React.createElement('p', { style: { color: 'red' } }, error),
                React.createElement(
                    'div',
                    { className: 'cms-modal__actions' },
                    React.createElement('button', { type: 'button', className: 'btn btn-default', onClick: onClose }, 'Cancel'),
                    React.createElement('button', { type: 'submit', className: 'btn btn-primary', disabled: saving }, saving ? 'Saving…' : 'Save')
                )
            )
        )
    );
}

function HighlightedCaseEditor() {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [editItem, setEditItem] = React.useState(null);  // null = closed, EMPTY = new, obj = edit
    const [showModal, setShowModal] = React.useState(false);

    React.useEffect(() => {
        fetch(BASE).then(r => r.json()).then(setItems).catch(() => {}).finally(() => setLoading(false));
    }, []);

    function openNew() { setEditItem({ ...EMPTY }); setShowModal(true); }
    function openEdit(item) { setEditItem(item); setShowModal(true); }
    function closeModal() { setShowModal(false); setEditItem(null); }

    function handleSaved(saved, isNew) {
        setItems(prev => isNew ? [...prev, saved] : prev.map(i => i.id === saved.id ? saved : i));
    }

    function handleDelete(id) {
        if (!window.confirm('Delete this item?')) return;
        cmsRequest(`${BASE}${id}/`, 'DELETE').then(() => setItems(prev => prev.filter(i => i.id !== id)));
    }

    function handleToggle(item) {
        cmsRequest(`${BASE}${item.id}/`, 'PATCH', { is_active: !item.is_active })
            .then(saved => setItems(prev => prev.map(i => i.id === saved.id ? saved : i)));
    }

    if (loading) return React.createElement('p', null, 'Loading…');

    return React.createElement(
        'div',
        { className: 'cms-editor' },
        React.createElement(
            'div',
            { className: 'cms-editor__toolbar' },
            React.createElement('button', { type: 'button', className: 'btn btn-primary', onClick: openNew }, '+ Add case')
        ),
        items.length === 0
            ? React.createElement('p', { className: 'cms-editor__empty' }, 'No highlighted cases yet. Add one above.')
            : React.createElement(
                'ul',
                { className: 'cms-editor__list' },
                ...items.map(item =>
                    React.createElement(
                        'li',
                        { key: item.id, className: `cms-editor__row${item.is_active ? '' : ' is-inactive'}` },
                        item.image_url
                            ? React.createElement('img', { src: item.image_url, className: 'cms-editor__thumb', alt: '' })
                            : React.createElement('div', { className: 'cms-editor__thumb cms-editor__thumb--empty' }),
                        React.createElement(
                            'div',
                            { className: 'cms-editor__info' },
                            React.createElement('strong', null, item.tab_label),
                            React.createElement('span', null, item.title),
                            !item.is_active && React.createElement('span', { className: 'cms-editor__badge' }, 'Hidden')
                        ),
                        React.createElement(
                            'div',
                            { className: 'cms-editor__actions' },
                            React.createElement('button', { type: 'button', className: 'btn btn-xs btn-default', onClick: () => handleToggle(item) }, item.is_active ? 'Hide' : 'Show'),
                            React.createElement('button', { type: 'button', className: 'btn btn-xs btn-default', onClick: () => openEdit(item) }, 'Edit'),
                            React.createElement('button', { type: 'button', className: 'btn btn-xs btn-danger', onClick: () => handleDelete(item.id) }, 'Delete')
                        )
                    )
                )
            ),
        showModal && React.createElement(Modal, { item: editItem, onClose: closeModal, onSaved: handleSaved })
    );
}

export default HighlightedCaseEditor;
