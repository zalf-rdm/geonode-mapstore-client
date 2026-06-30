import React from 'react';
import { cmsRequest, buildFormData } from '../cmsApi';

const BASE = '/api/v2/cms/banners/';
const EMPTY = { kicker: '', title: '', description: '', button_text: '', href: '', order: 0, is_active: true };

function CharCount({ value, max }) {
    const len = (value || '').length;
    return React.createElement('small', { style: { color: len > max ? 'red' : '#888' } }, `${len} / ${max}`);
}

function Modal({ item, onClose, onSaved }) {
    const [form, setForm] = React.useState({ ...EMPTY, ...item });
    const [imageFile, setImageFile] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState(item?.image_url || null);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const isNew = !item?.id;

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
        cmsRequest(url, isNew ? 'POST' : 'PUT', body)
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
            React.createElement('h2', { className: 'cms-modal__title' }, isNew ? 'Add Spotlight Banner' : 'Edit Spotlight Banner'),
            React.createElement(
                'form',
                { onSubmit: handleSubmit },
                React.createElement('div', { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Kicker (short line)'),
                    React.createElement('input', { type: 'text', value: form.kicker, maxLength: 80, required: true, onChange: e => set('kicker', e.target.value) }),
                    React.createElement(CharCount, { value: form.kicker, max: 80 })
                ),
                React.createElement('div', { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Title (main headline)'),
                    React.createElement('input', { type: 'text', value: form.title, maxLength: 120, required: true, onChange: e => set('title', e.target.value) }),
                    React.createElement(CharCount, { value: form.title, max: 120 })
                ),
                React.createElement('div', { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Description (optional)'),
                    React.createElement('textarea', { value: form.description, maxLength: 240, rows: 2, onChange: e => set('description', e.target.value) }),
                    React.createElement(CharCount, { value: form.description, max: 240 })
                ),
                React.createElement('div', { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Button text'),
                    React.createElement('input', { type: 'text', value: form.button_text, maxLength: 40, required: true, onChange: e => set('button_text', e.target.value) }),
                    React.createElement(CharCount, { value: form.button_text, max: 40 })
                ),
                React.createElement('div', { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Link (href)'),
                    React.createElement('input', { type: 'text', value: form.href, required: true, placeholder: '/catalogue/#/?q=climate or https://…', onChange: e => set('href', e.target.value) })
                ),
                React.createElement('div', { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Image'),
                    previewUrl && React.createElement('img', { src: previewUrl, alt: '', style: { width: 120, height: 120, objectFit: 'cover', marginBottom: 8, display: 'block', borderRadius: 6 } }),
                    React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleImage })
                ),
                React.createElement('div', { className: 'cms-modal__field' },
                    React.createElement('label', null, 'Order'),
                    React.createElement('input', { type: 'number', value: form.order, min: 0, style: { width: 80 }, onChange: e => set('order', parseInt(e.target.value, 10) || 0) })
                ),
                React.createElement('div', { className: 'cms-modal__field cms-modal__field--check' },
                    React.createElement('input', { type: 'checkbox', id: 'banner-active', checked: form.is_active, onChange: e => set('is_active', e.target.checked) }),
                    React.createElement('label', { htmlFor: 'banner-active' }, 'Active (visible on homepage)')
                ),
                error && React.createElement('p', { style: { color: 'red' } }, error),
                React.createElement('div', { className: 'cms-modal__actions' },
                    React.createElement('button', { type: 'button', className: 'btn btn-default', onClick: onClose }, 'Cancel'),
                    React.createElement('button', { type: 'submit', className: 'btn btn-primary', disabled: saving }, saving ? 'Saving…' : 'Save')
                )
            )
        )
    );
}

function SpotlightBannerEditor() {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [editItem, setEditItem] = React.useState(null);
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
        if (!window.confirm('Delete this banner?')) return;
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
        React.createElement('div', { className: 'cms-editor__toolbar' },
            React.createElement('button', { type: 'button', className: 'btn btn-primary', onClick: openNew }, '+ Add banner')
        ),
        items.length === 0
            ? React.createElement('p', { className: 'cms-editor__empty' }, 'No spotlight banners yet.')
            : React.createElement('ul', { className: 'cms-editor__list' },
                ...items.map(item =>
                    React.createElement('li', { key: item.id, className: `cms-editor__row${item.is_active ? '' : ' is-inactive'}` },
                        item.image_url
                            ? React.createElement('img', { src: item.image_url, className: 'cms-editor__thumb', alt: '' })
                            : React.createElement('div', { className: 'cms-editor__thumb cms-editor__thumb--empty' }),
                        React.createElement('div', { className: 'cms-editor__info' },
                            React.createElement('strong', null, item.kicker),
                            React.createElement('span', null, item.title),
                            !item.is_active && React.createElement('span', { className: 'cms-editor__badge' }, 'Hidden')
                        ),
                        React.createElement('div', { className: 'cms-editor__actions' },
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

export default SpotlightBannerEditor;
