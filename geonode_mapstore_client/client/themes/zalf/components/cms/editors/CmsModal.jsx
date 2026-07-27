import React from 'react';

export default function CmsModal({ title, onClose, saving = false, children }) {
    const dialogRef = React.useRef(null);
    const restoreFocusRef = React.useRef(null);
    const onCloseRef = React.useRef(onClose);
    const savingRef = React.useRef(saving);
    const titleId = React.useId ? React.useId() : 'cms-modal-title';

    React.useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    React.useEffect(() => { savingRef.current = saving; }, [saving]);

    React.useEffect(() => {
        restoreFocusRef.current = document.activeElement;
        const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && !savingRef.current) onCloseRef.current();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('keydown', onKeyDown);
            restoreFocusRef.current?.focus?.();
        };
    }, []);

    return React.createElement(
        'div',
        { className: 'cms-modal-backdrop', onMouseDown: (event) => event.target === event.currentTarget && !saving && onClose() },
        React.createElement(
            'div',
            { className: 'cms-modal', ref: dialogRef, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, tabIndex: -1 },
            React.createElement('h2', { id: titleId, className: 'cms-modal__title' }, title),
            children
        )
    );
}
