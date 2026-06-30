import React from 'react';

function getCsrfToken() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

function MarkdownEditor({ value, onChange }) {
    const [preview, setPreview] = React.useState('');
    const [tab, setTab] = React.useState('write'); // 'write' | 'preview'
    const debounceRef = React.useRef(null);

    React.useEffect(() => {
        if (tab !== 'preview') return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetch('/api/v2/cms/preview-markdown/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),
                },
                body: JSON.stringify({ text: value || '' }),
            })
                .then(r => r.ok ? r.json() : { html: '' })
                .then(data => setPreview(data.html || ''));
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [value, tab]);

    return React.createElement(
        'div',
        { className: 'cms-md-editor' },
        React.createElement(
            'div',
            { className: 'cms-md-editor__tabs' },
            React.createElement(
                'button',
                {
                    type: 'button',
                    className: `cms-md-editor__tab${tab === 'write' ? ' is-active' : ''}`,
                    onClick: () => setTab('write'),
                },
                'Write'
            ),
            React.createElement(
                'button',
                {
                    type: 'button',
                    className: `cms-md-editor__tab${tab === 'preview' ? ' is-active' : ''}`,
                    onClick: () => setTab('preview'),
                },
                'Preview'
            )
        ),
        tab === 'write'
            ? React.createElement('textarea', {
                className: 'cms-md-editor__input',
                value: value || '',
                onChange: e => onChange(e.target.value),
                placeholder: 'Write Markdown here…\n\n# Heading\n**bold**, *italic*, [link](https://…)',
                rows: 14,
            })
            : React.createElement('div', {
                className: 'cms-md-editor__preview',
                dangerouslySetInnerHTML: { __html: preview || '<em style="color:#999">Nothing to preview yet.</em>' },
            })
    );
}

export default MarkdownEditor;
