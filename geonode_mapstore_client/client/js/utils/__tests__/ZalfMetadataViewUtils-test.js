import expect from 'expect';
import {
    buildMetadataSections,
    getLandingUrl,
    getResourceIconName,
    getResourceTypeLabel,
    getSchemaOptionLabel,
    isMetadataValuePresent,
    visibleObjectEntries
} from '../../../themes/zalf/utils/MetadataViewUtils';

describe('ZALF metadata view utilities', () => {
    it('filters empty values without hiding false or zero', () => {
        expect(isMetadataValuePresent(null)).toBe(false);
        expect(isMetadataValuePresent(' None ')).toBe(false);
        expect(isMetadataValuePresent([])).toBe(false);
        expect(isMetadataValuePresent({ label: '' })).toBe(false);
        expect(isMetadataValuePresent(false)).toBe(true);
        expect(isMetadataValuePresent(0)).toBe(true);
    });

    it('groups populated fields and moves contacts into People', () => {
        const sections = buildMetadataSections({
            title: 'Dataset',
            empty: '',
            contacts: { owner: { label: 'Ada' } },
            attribute_set: [{ attribute: 'temperature' }]
        }, {
            properties: {
                title: { title: 'Title', type: 'string' },
                empty: { title: 'Empty', type: 'string' },
                contacts: { title: 'Contacts', type: 'object' },
                attribute_set: {
                    title: 'Attributes',
                    type: 'array',
                    'ui:options': { 'geonode-ui:group': 'Attributes' }
                }
            }
        });
        expect(sections.map(({ title }) => title)).toEqual(['People', 'General', 'Attributes']);
        expect(sections[1].fields.map(({ key }) => key)).toEqual(['title']);
    });

    it('uses schema labels and hides nested editor-only properties', () => {
        expect(getSchemaOptionLabel({ oneOf: [{ 'const': 'pub', title: 'Publication' }] }, 'pub')).toBe('Publication');
        expect(visibleObjectEntries({ id: 1, label: 'Ada' }, {
            properties: { id: { 'ui:widget': 'hidden' }, label: { title: 'Name' } }
        })).toEqual([{ key: 'label', label: 'Name', value: 'Ada', schema: { title: 'Name' } }]);
    });

    it('derives consistent resource presentation and landing links', () => {
        const resource = { pk: 80, resource_type: 'dataset', subtype: 'tabular' };
        expect(getResourceTypeLabel(resource)).toBe('Table');
        expect(getResourceIconName(resource)).toBe('table');
        expect(getLandingUrl(resource)).toBe('#/landing/dataset/80');
    });
});
