/**
 * CUSTOM PATH: themes/zalf/components/cms/editors/HomepageSectionEditor.jsx
 * REASON: the order of the CMS-driven homepage sections is itself CMS content
 * (zalf-rdm/geonode#863), rather than being fixed by the order they happen to
 * appear in Homepage.jsx.
 *
 * The row set is fixed and seeded by migration, so there is no add or delete —
 * only reorder and show/hide. Move up/down is used instead of a raw order number
 * because the meaningful operation is relative position, and it keeps the stored
 * `order` values contiguous.
 */

import React from 'react';
import { cmsGet, cmsRequest, errorMessage } from '../cmsApi';

const BASE = '/api/v2/cms/homepage-sections/';

function HomepageSectionEditor() {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);

    // `showSpinner` only on first load: re-entering the loading state unmounts
    // the list, which destroys the move button that was just pressed and drops
    // keyboard focus, making multi-step reordering unusable from the keyboard.
    const loadItems = React.useCallback((showSpinner = false) => {
        if (showSpinner) setLoading(true);
        setError(null);
        return cmsGet(BASE)
            .then((data) => setItems(Array.isArray(data) ? data : []))
            .catch((err) => setError(errorMessage(err)))
            .finally(() => { if (showSpinner) setLoading(false); });
    }, []);
    React.useEffect(() => { loadItems(true); }, [loadItems]);

    // Persist the whole list: a swap changes two rows, and renumbering from 0
    // keeps the values contiguous however often the admin reorders.
    function persist(ordered) {
        setSaving(true);
        setError(null);
        // Optimistic: the local list already holds the intended order, and
        // renumbering it is exactly what we are about to send.
        setItems(ordered.map((item, index) => ({ ...item, order: index })));
        Promise.all(ordered.map((item, index) => (
            item.order === index
                ? Promise.resolve(item)
                : cmsRequest(`${BASE}${item.key}/`, 'PATCH', { order: index })
        )))
            .catch((err) => {
                setError(errorMessage(err, 'The order could not be saved.'));
                // Not a rollback to the previous list: Promise.all rejects on
                // the first failure while earlier PATCHes have already been
                // committed, so the only honest state is whatever the server
                // actually holds. Re-reading also avoids showing an order the
                // database does not have.
                return loadItems();
            })
            .finally(() => setSaving(false));
    }

    function move(index, delta) {
        const target = index + delta;
        if (target < 0 || target >= items.length) {
            return;
        }
        const ordered = items.slice();
        [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
        persist(ordered);
    }

    function toggle(item) {
        setError(null);
        cmsRequest(`${BASE}${item.key}/`, 'PATCH', { is_active: !item.is_active })
            .then((saved) => setItems((prev) => prev.map((i) => (i.key === saved.key ? saved : i))))
            .catch((err) => setError(errorMessage(err)));
    }

    if (loading) {
        return React.createElement('p', null, 'Loading…');
    }

    return React.createElement(
        'div',
        { className: 'cms-editor' },
        React.createElement(
            'p',
            { className: 'cms-editor__hint' },
            'The order these sections appear on the start page, below the hero. '
            + 'Hiding a section removes it even when it has content; a section with no '
            + 'content is hidden automatically either way.'
        ),
        error && React.createElement(
            'div',
            { className: 'cms-editor__error', role: 'alert' },
            error, ' ',
            React.createElement('button', { type: 'button', className: 'btn btn-link', onClick: () => loadItems(true) }, 'Try again')
        ),
        items.length === 0
            ? React.createElement('p', { className: 'cms-editor__empty' }, 'No homepage sections are configured.')
            : React.createElement(
                'ol',
                { className: 'cms-editor__list cms-editor__list--ordered' },
                ...items.map((item, index) => React.createElement(
                    'li',
                    { key: item.key, className: `cms-editor__row${item.is_active ? '' : ' is-inactive'}` },
                    React.createElement(
                        'div',
                        { className: 'cms-editor__info' },
                        React.createElement('strong', null, item.label || item.key),
                        !item.is_active && React.createElement('span', { className: 'cms-editor__badge' }, 'Hidden')
                    ),
                    React.createElement(
                        'div',
                        { className: 'cms-editor__actions' },
                        React.createElement(
                            'button',
                            {
                                type: 'button',
                                className: 'btn btn-xs btn-default',
                                disabled: saving || index === 0,
                                'aria-label': `Move ${item.label || item.key} up`,
                                onClick: () => move(index, -1)
                            },
                            '↑'
                        ),
                        React.createElement(
                            'button',
                            {
                                type: 'button',
                                className: 'btn btn-xs btn-default',
                                disabled: saving || index === items.length - 1,
                                'aria-label': `Move ${item.label || item.key} down`,
                                onClick: () => move(index, 1)
                            },
                            '↓'
                        ),
                        React.createElement(
                            'button',
                            {
                                type: 'button',
                                className: 'btn btn-xs btn-default',
                                disabled: saving,
                                onClick: () => toggle(item)
                            },
                            item.is_active ? 'Hide' : 'Show'
                        )
                    )
                ))
            )
    );
}

export default HomepageSectionEditor;
