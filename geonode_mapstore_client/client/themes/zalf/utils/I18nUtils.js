/**
 * CUSTOM PATH: themes/zalf/utils/I18nUtils.js
 * REASON: shared localisation helpers for the ZALF components (zalf-rdm/geonode-mapstore-client#206).
 * `translate` used to be copied into each component; the CMS helpers resolve
 * the per-language content fields the backend sends (zalf-rdm/geonode#901).
 */

import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';

/** Locales the CMS content is authored in, besides the English base field. */
export const TRANSLATED_LANGUAGES = ['de', 'fr', 'es', 'it'];

// getMessageById returns the id itself when a message is missing, so fall back explicitly.
export function translate(messages, id, fallback) {
    const message = getMessageById(messages, id);
    return message && message !== id ? message : fallback;
}

/** `(messages, 'zalfTheme.landing')` -> `t(id, fallback)` reading `zalfTheme.landing.<id>`. */
export function createTranslator(messages, prefix) {
    return (id, fallback) => translate(messages, prefix ? `${prefix}.${id}` : id, fallback);
}

/** 'de-DE' -> 'de'. */
export function localeCode(locale) {
    return String(locale || 'en').split('-')[0].toLowerCase();
}

/**
 * The locale to format dates with. English keeps the day-month-year order the
 * ZALF pages always used ('en-GB'), so the landing page and the metadata page agree.
 */
export function dateLocale(locale) {
    return !locale || localeCode(locale) === 'en' ? 'en-GB' : locale;
}

/**
 * `('{n} of {total}', { n: 1, total: 2 })` -> '1 of 2'. A replacement function,
 * not a string, so `$&`-style patterns in the values are inserted literally.
 */
export function interpolate(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match);
}

/** 'tables' -> 'Tables', for labels shown at the start of a line. */
export function capitalize(text) {
    const value = String(text || '');
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * The value of `field` for `locale`, falling back to the base field when the
 * translation is blank. Mirrors LocalizedFieldsMixin.localized on the backend.
 *
 * The API also resolves values for Django's active language, but MapStore
 * switches locale client-side without a page reload, so the two can diverge;
 * for a React surface the raw fields plus the live locale are authoritative.
 */
export function localizeField(record = {}, field, locale) {
    const code = localeCode(locale);
    const translated = TRANSLATED_LANGUAGES.includes(code) ? String(record[`${field}_${code}`] || '').trim() : '';
    return translated || record[field] || '';
}

/** A copy of `record` with each of `fields` replaced by its value for `locale`. */
export function localizeRecord(record = {}, fields = [], locale) {
    return fields.reduce((localized, field) => ({ ...localized, [field]: localizeField(record, field, locale) }), { ...record });
}

/** The fields of each CMS record type that carry per-language variants. */
export const CMS_TRANSLATED_FIELDS = {
    cases: ['tab_label', 'eyebrow', 'title', 'button_text'],
    banners: ['kicker', 'title', 'description', 'button_text'],
    trainings: ['title', 'category', 'duration']
};
