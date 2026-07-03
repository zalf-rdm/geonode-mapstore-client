import React from 'react';
import MarkdownEditor from './MarkdownEditor';
import { cmsRequest, buildFormData } from '../cmsApi';

const BASE = '/api/v2/cms/trainings/';

const FORMAT_OPTIONS = [
    { value: '', label: '— choose format —' },
    { value: 'on-demand', label: 'On-demand / Self-paced' },
    { value: 'video', label: 'Recorded video' },
    { value: 'live', label: 'Live webinar' },
    { value: 'workshop', label: 'In-person workshop' },
];

const EMPTY = {
    title: '', organizer: '', category: '', format: '',
    duration: '', start_date: '', end_date: '', course_url: '',
    body_markdown: '', order: 0, is_active: true,
};

function CharCount({ value, max }) {
    const len = (value || '').length;
    return React.createElement('small', { style: { color: len > max ? 'red' : '#888' } }, `${len} / ${max}`);
}

function Field({ label, children }) {
    return React.createElement(
        'div',
        { className: 'cms-modal__field' },
        React.createElement('label', null, label),
        children
    );
}

function Modal({ item, onClose, onSaved }) {
    const [form, setForm] = React.useState({ ...EMPTY, ...item });
    const [imageFile, setImageFile] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState(item?.thumbnail_url || null);
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
        const { id, thumbnail_url, ...fields } = form;
        const body = buildFormData(fields, 'thumbnail', imageFile);
        const url = isNew ? BASE : `${BASE}${id}/`;
        cmsRequest(url, isNew ? 'POST' : 'PUT', body)
            .then(saved => { onSaved(saved, isNew); onClose(); })
            .catch(err => setError(JSON.stringify(err)))
            .finally(() => setSaving(false));
    }

    const isScheduled = form.format === 'live' || form.format === 'workshop';

    return React.createElement(
        'div',
        { className: 'cms-modal-backdrop', onClick: e => e.target === e.currentTarget && onClose() },
        React.createElement(
            'div',
            { className: 'cms-modal' },
            React.createElement('h2', { className: 'cms-modal__title' }, isNew ? 'Add Training Resource' : 'Edit Training Resource'),
            React.createElement(
                'form',
                { onSubmit: handleSubmit },

                React.createElement(Field, { label: 'Course title' },
                    React.createElement('input', { type: 'text', value: form.title, maxLength: 160, required: true, onChange: e => set('title', e.target.value) }),
                    React.createElement(CharCount, { value: form.title, max: 160 })
                ),

                React.createElement(Field, { label: 'Organizer / Provider' },
                    React.createElement('input', { type: 'text', value: form.organizer, maxLength: 120, required: true, onChange: e => set('organizer', e.target.value) }),
                    React.createElement(CharCount, { value: form.organizer, max: 120 })
                ),

                React.createElement(Field, { label: 'Category / Topic' },
                    React.createElement('input', { type: 'text', value: form.category, maxLength: 80, placeholder: 'e.g. Data Management, Remote Sensing, GIS…', onChange: e => set('category', e.target.value) }),
                    React.createElement(CharCount, { value: form.category, max: 80 })
                ),

                React.createElement(Field, { label: 'Format' },
                    React.createElement(
                        'select',
                        { value: form.format, onChange: e => set('format', e.target.value) },
                        ...FORMAT_OPTIONS.map(o => React.createElement('option', { key: o.value, value: o.value }, o.label))
                    )
                ),

                React.createElement(Field, { label: 'Duration' },
                    React.createElement('input', { type: 'text', value: form.duration, maxLength: 60, placeholder: 'e.g. 3 hours, 90 minutes, 2 days…', onChange: e => set('duration', e.target.value) })
                ),

                isScheduled && React.createElement(
                    'div',
                    { className: 'cms-modal__field cms-modal__field--row' },
                    React.createElement(
                        'div',
                        { style: { flex: 1 } },
                        React.createElement('label', null, 'Start date'),
                        React.createElement('input', { type: 'date', value: form.start_date ? form.start_date.split('T')[0] : '', onChange: e => set('start_date', e.target.value || null) })
                    ),
                    React.createElement(
                        'div',
                        { style: { flex: 1 } },
                        React.createElement('label', null, 'End date'),
                        React.createElement('input', { type: 'date', value: form.end_date ? form.end_date.split('T')[0] : '', onChange: e => set('end_date', e.target.value || null) })
                    )
                ),

                React.createElement(Field, { label: 'Course URL (optional — links card directly to external page)' },
                    React.createElement('input', {
                        type: 'text', value: form.course_url, maxLength: 500,
                        placeholder: 'https://partner.org/course or leave blank for internal page',
                        onChange: e => set('course_url', e.target.value)
                    })
                ),

                React.createElement(Field, { label: 'Thumbnail' },
                    previewUrl && React.createElement('img', { src: previewUrl, alt: '', style: { width: 120, height: 120, objectFit: 'cover', marginBottom: 8, display: 'block', borderRadius: 6 } }),
                    React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleImage })
                ),

                React.createElement(Field, { label: 'Order' },
                    React.createElement('input', { type: 'number', value: form.order, min: 0, style: { width: 80 }, onChange: e => set('order', parseInt(e.target.value, 10) || 0) })
                ),

                React.createElement(
                    'div',
                    { className: 'cms-modal__field cms-modal__field--check' },
                    React.createElement('input', { type: 'checkbox', id: 'training-active', checked: form.is_active, onChange: e => set('is_active', e.target.checked) }),
                    React.createElement('label', { htmlFor: 'training-active' }, 'Active (visible on homepage)')
                ),

                React.createElement(Field, { label: 'Course page content (Markdown) — shown when no Course URL is set' },
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

function TrainingResourceEditor() {
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
        if (!window.confirm('Delete this training resource?')) return;
        cmsRequest(`${BASE}${id}/`, 'DELETE').then(() => setItems(prev => prev.filter(i => i.id !== id)));
    }

    function handleToggle(item) {
        cmsRequest(`${BASE}${item.id}/`, 'PATCH', { is_active: !item.is_active })
            .then(saved => setItems(prev => prev.map(i => i.id === saved.id ? saved : i)));
    }

    if (loading) return React.createElement('p', null, 'Loading…');

    const FORMAT_LABEL = { 'on-demand': 'On-demand', 'video': 'Video', 'live': 'Live', 'workshop': 'Workshop' };

    return React.createElement(
        'div',
        { className: 'cms-editor' },
        React.createElement('div', { className: 'cms-editor__toolbar' },
            React.createElement('button', { type: 'button', className: 'btn btn-primary', onClick: openNew }, '+ Add training')
        ),
        items.length === 0
            ? React.createElement('p', { className: 'cms-editor__empty' }, 'No training resources yet.')
            : React.createElement('ul', { className: 'cms-editor__list' },
                ...items.map(item =>
                    React.createElement('li', { key: item.id, className: `cms-editor__row${item.is_active ? '' : ' is-inactive'}` },
                        item.thumbnail_url
                            ? React.createElement('img', { src: item.thumbnail_url, className: 'cms-editor__thumb', alt: '' })
                            : React.createElement('div', { className: 'cms-editor__thumb cms-editor__thumb--empty' }),
                        React.createElement('div', { className: 'cms-editor__info' },
                            React.createElement('strong', null, item.title),
                            React.createElement('span', null, [item.organizer, item.category].filter(Boolean).join(' · ')),
                            React.createElement('span', null, [FORMAT_LABEL[item.format], item.duration].filter(Boolean).join(' · ')),
                            !item.is_active && React.createElement('span', { className: 'cms-editor__badge' }, 'Hidden'),
                            item.course_url && React.createElement('span', { className: 'cms-editor__badge', style: { background: '#d8eaff', color: '#1a4a8a', borderColor: 'rgba(26,74,138,0.2)' } }, 'External link')
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

export default TrainingResourceEditor;
