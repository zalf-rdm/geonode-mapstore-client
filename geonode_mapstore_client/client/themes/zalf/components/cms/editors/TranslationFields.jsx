/**
 * CUSTOM PATH: themes/zalf/components/cms/editors/TranslationFields.jsx
 * REASON: per-language inputs for the CMS content fields (zalf-rdm/geonode#901),
 * shared by the case, banner and training editors. The Topic editor keeps its
 * own block because it also warns about the homepage tile length.
 */

import React from 'react';
import MarkdownEditor from './MarkdownEditor';
import { TRANSLATED_LANGUAGES } from '../../../utils/I18nUtils';

const LANGUAGE_NAMES = { de: 'German', fr: 'French', es: 'Spanish', it: 'Italian' };

// Derived from the list localizeField reads, so every language it resolves can be entered here.
export const TRANSLATION_LANGUAGES = TRANSLATED_LANGUAGES.map((code) => [code, LANGUAGE_NAMES[code] || code.toUpperCase()]);

/** One input per language for `<field>_<code>`; a blank one falls back to the English value. */
function TranslationFields({ form, field, label, set, maxLength, markdown = false }) {
    // Expand the languages that already have content, once. `open` must not follow
    // the value afterwards, or clearing a body to rewrite it would collapse its editor.
    const [initiallyOpen] = React.useState(() =>
        TRANSLATION_LANGUAGES.reduce((acc, [code]) => ({ ...acc, [code]: Boolean(form[`${field}_${code}`]) }), {}));
    if (markdown) {
        return React.createElement(
            'div',
            { className: 'cms-modal__field' },
            React.createElement('label', null, `${label} — translations`),
            React.createElement('small', null, 'Leave a language blank to fall back to the English content.'),
            ...TRANSLATION_LANGUAGES.map(([code, language]) => React.createElement(
                'details',
                { key: code, open: initiallyOpen[code] },
                React.createElement('summary', null, language),
                React.createElement(MarkdownEditor, { value: form[`${field}_${code}`] || '', onChange: v => set(`${field}_${code}`, v) })
            ))
        );
    }
    return React.createElement(
        'div',
        { className: 'cms-modal__field' },
        React.createElement('label', null, `${label} — translations`),
        React.createElement('small', null, 'Leave a language blank to fall back to the English text.'),
        ...TRANSLATION_LANGUAGES.map(([code, language]) => React.createElement('input', {
            key: code,
            type: 'text',
            value: form[`${field}_${code}`] || '',
            maxLength,
            placeholder: language,
            'aria-label': `${label} (${language})`,
            onChange: e => set(`${field}_${code}`, e.target.value)
        }))
    );
}

export default TranslationFields;
