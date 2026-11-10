/*
 * Localisation of the ZALF theme (zalf-rdm/geonode-mapstore-client#206).
 *
 * The components fall back to their English text when a message is missing, so
 * a gap never shows up as a broken page — only as English on a German, French
 * or Spanish one. These tests make that gap visible: every zalfTheme key must
 * exist, non-empty, in all five catalogues.
 */

import expect from 'expect';

import {
    capitalize,
    createTranslator,
    dateLocale,
    interpolate,
    localeCode,
    localizeField,
    localizeRecord,
    translate
} from '../../../themes/zalf/utils/I18nUtils';
import { CONTRIBUTOR_ROLES, RESOURCE_DATE_FIELDS } from '../ZalfLandingPageUtils';
import enUS from '../../../../static/mapstore/gn-translations/data.en-US.json';
import deDE from '../../../../static/mapstore/gn-translations/data.de-DE.json';
import frFR from '../../../../static/mapstore/gn-translations/data.fr-FR.json';
import esES from '../../../../static/mapstore/gn-translations/data.es-ES.json';
import itIT from '../../../../static/mapstore/gn-translations/data.it-IT.json';

const CATALOGUES = { 'en-US': enUS, 'de-DE': deDE, 'fr-FR': frFR, 'es-ES': esES, 'it-IT': itIT };

function flatten(node, prefix = '') {
    return Object.keys(node).reduce((acc, key) => {
        const value = node[key];
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'object' && value !== null
            ? { ...acc, ...flatten(value, path) }
            : { ...acc, [path]: value };
    }, {});
}

const zalfKeys = (catalogue) => flatten(catalogue.messages.zalfTheme);

describe('ZalfI18n', () => {
    describe('I18nUtils', () => {
        const messages = { zalfTheme: { landing: { share: 'Teilen' } } };

        it('translate falls back when the message is missing', () => {
            expect(translate(messages, 'zalfTheme.landing.share', 'Share')).toBe('Teilen');
            expect(translate(messages, 'zalfTheme.landing.missing', 'Missing')).toBe('Missing');
            expect(translate({}, 'zalfTheme.landing.share', 'Share')).toBe('Share');
        });

        it('createTranslator prefixes the id', () => {
            const t = createTranslator(messages, 'zalfTheme.landing');
            expect(t('share', 'Share')).toBe('Teilen');
        });

        it('localeCode normalises the locale', () => {
            expect(localeCode('de-DE')).toBe('de');
            expect(localeCode('FR')).toBe('fr');
            expect(localeCode()).toBe('en');
        });

        it('interpolate inserts values literally and keeps unknown placeholders', () => {
            expect(interpolate('{n} of {total}', { n: 1, total: 2 })).toBe('1 of 2');
            expect(interpolate('Terms from "{name}".', { name: 'Cost $& Benefit' })).toBe('Terms from "Cost $& Benefit".');
            expect(interpolate('{missing}', {})).toBe('{missing}');
        });

        it('dateLocale keeps day-month-year order for English', () => {
            expect(dateLocale('en-US')).toBe('en-GB');
            expect(dateLocale()).toBe('en-GB');
            expect(dateLocale('de-DE')).toBe('de-DE');
        });

        it('capitalize upper-cases the first letter only', () => {
            expect(capitalize('tables')).toBe('Tables');
            expect(capitalize('Tabellen')).toBe('Tabellen');
            expect(capitalize()).toBe('');
        });

        it('localizeField uses the translation and falls back to the base field', () => {
            const record = { title: 'Soil', title_de: 'Boden', title_fr: '   ' };
            expect(localizeField(record, 'title', 'de-DE')).toBe('Boden');
            expect(localizeField(record, 'title', 'fr-FR')).toBe('Soil');
            expect(localizeField(record, 'title', 'en-US')).toBe('Soil');
            expect(localizeField(record, 'title', 'xx')).toBe('Soil');
        });

        it('localizeRecord replaces only the listed fields and does not mutate', () => {
            const record = { title: 'Soil', title_es: 'Suelo', href: '/x' };
            const localized = localizeRecord(record, ['title'], 'es-ES');
            expect(localized.title).toBe('Suelo');
            expect(localized.href).toBe('/x');
            expect(record.title).toBe('Soil');
        });
    });

    describe('catalogues', () => {
        const english = Object.keys(zalfKeys(enUS)).sort();

        Object.keys(CATALOGUES).forEach((locale) => {
            it(`${locale} carries every zalfTheme key, non-empty`, () => {
                const keys = zalfKeys(CATALOGUES[locale]);
                expect(Object.keys(keys).sort()).toEqual(english);
                Object.keys(keys).forEach((key) => {
                    expect(typeof keys[key]).toBe('string');
                    expect(keys[key].trim().length).toBeGreaterThan(0);
                });
            });
        });

        it('carries every PublishDataCollection message in every locale', () => {
            const publishKeys = Object.keys(flatten(enUS.messages.plugins.PublishDataCollection)).sort();
            Object.keys(CATALOGUES).forEach((locale) => {
                const keys = flatten(CATALOGUES[locale].messages.plugins.PublishDataCollection);
                expect(Object.keys(keys).sort()).toEqual(publishKeys);
            });
        });

        it('has a label for every contributor role and date type the landing page shows', () => {
            const keys = zalfKeys(enUS);
            CONTRIBUTOR_ROLES.forEach(({ key }) => expect(keys[`landing.roles.${key}`]).toExist());
            RESOURCE_DATE_FIELDS.forEach(({ key }) => expect(keys[`landing.dates.${key}`]).toExist());
        });
    });
});
