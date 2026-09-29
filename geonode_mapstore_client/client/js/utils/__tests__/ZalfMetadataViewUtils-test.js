import expect from 'expect';
import {
    buildContactPeople,
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
            other_description: JSON.stringify({ submission: { reference_number: '42' }, dataset: { title: 'Dataset' } }),
            contacts: { owner: { label: 'Ada' } },
            attribute_set: [{ attribute: 'temperature' }, { attribute: 'precipitation' }],
            category: { id: 'farming', label: 'Farming' },
            license: { id: 'cc-by', label: 'CC BY' },
            keywords: ['soil', 'water']
        }, {
            properties: {
                title: { title: 'Title', type: 'string' },
                empty: { title: 'Empty', type: 'string' },
                other_description: { title: 'Other description', type: 'string' },
                contacts: { title: 'Contacts', type: 'object' },
                attribute_set: {
                    title: 'Attributes',
                    type: 'array',
                    'ui:options': { 'geonode-ui:group': 'Attributes' }
                }
            }
        });
        expect(sections.map(({ title }) => title)).toEqual(['People', 'General', 'Attributes']);
        expect(sections[0].itemCount).toBe(1);
        expect(sections[0].itemLabel).toBe('person');
        expect(sections[1].fields.map(({ key }) => key)).toEqual(['title', 'category', 'license', 'keywords']);
        expect(sections[1].fields.map(({ wide }) => wide)).toEqual([false, false, false, false]);
        expect(sections[2].itemCount).toBe(2);
        expect(sections[2].itemLabel).toBe('attributes');
    });

    it('enriches and de-duplicates contact people from the resource API', () => {
        const people = buildContactPeople({
            owner: { id: '1', label: 'admin' },
            contact_roles: [
                { role: 'pointOfContact', users: [{ id: '1', label: 'admin' }] },
                { role: 'author', users: [{ id: '2', label: 'Ada' }] }
            ]
        }, {
            owner: { pk: 1, username: 'admin', email: 'admin@example.org' },
            author: [{ pk: 2, full_name: 'Ada Lovelace', email: 'ada@example.org', orcid_identifier: '0000-0001' }]
        }, {
            oneOf: [
                { 'const': 'pointOfContact', title: 'Point of contact' },
                { 'const': 'author', title: 'Author' }
            ]
        });

        expect(people.length).toBe(2);
        expect(people[0].roles).toEqual(['Owner', 'Point of contact']);
        expect(people[1].label).toBe('Ada Lovelace');
        expect(people[1].email).toBe('ada@example.org');
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
