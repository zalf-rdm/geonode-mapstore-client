import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import {
    clearGroupProfileCache,
    getCachedGroupProfile,
    useGroupProfiles,
    withGroupProfile
} from '../../../themes/zalf/utils/ZalfGroupProfiles';

// Renders nothing; it exists so the hook runs inside a component.
function Probe({ resources }) {
    useGroupProfiles(resources);
    return null;
}

const GROUPS = {
    group_profiles: [
        { pk: 1, title: 'Group With Logo', logo: 'http://example.org/logo.png', group: { pk: 4, name: 'with-logo' } },
        { pk: 2, title: 'Group Without Logo', logo: null, group: { pk: 5, name: 'no-logo' } }
    ]
};

describe('ZALF catalogue group profiles', () => {
    let mockAxios;

    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
        mockAxios = new MockAdapter(axios);
        clearGroupProfileCache();
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        mockAxios.restore();
        clearGroupProfileCache();
        document.body.innerHTML = '';
    });

    it('leaves a resource without a group untouched', () => {
        const resource = { pk: 1, title: 'No group' };
        expect(withGroupProfile(resource)).toBe(resource);
    });

    it('leaves the group untouched until its profile has been fetched', () => {
        const resource = { pk: 1, group: { pk: 4, name: 'with-logo' } };
        expect(withGroupProfile(resource)).toBe(resource);
    });

    it('fills in the title and logo once fetched', (done) => {
        mockAxios.onGet(/groups/).reply(200, GROUPS);
        act(() => {
            ReactDOM.render(
                <Probe resources={[{ pk: 1, group: { pk: 4 } }, { pk: 2, group: { pk: 5 } }]}/>,
                document.getElementById('container')
            );
        });
        setTimeout(() => {
            const withLogo = withGroupProfile({ pk: 1, group: { pk: 4, name: 'with-logo' } });
            expect(withLogo.group.title).toBe('Group With Logo');
            expect(withLogo.group.logo).toBe('http://example.org/logo.png');

            // No logo on the profile: the card falls back to the name, so logo stays null
            // rather than becoming GroupProfile.logo_url's placeholder image.
            const noLogo = withGroupProfile({ pk: 2, group: { pk: 5, name: 'no-logo' } });
            expect(noLogo.group.title).toBe('Group Without Logo');
            expect(noLogo.group.logo).toBe(null);
            done();
        }, 0);
    });

    it('falls back to the group name when the profile has no title', (done) => {
        mockAxios.onGet(/groups/).reply(200, {
            group_profiles: [{ pk: 1, title: '', logo: null, group: { pk: 7, name: 'raw-name' } }]
        });
        act(() => {
            ReactDOM.render(
                <Probe resources={[{ pk: 1, group: { pk: 7, name: 'raw-name' } }]}/>,
                document.getElementById('container')
            );
        });
        setTimeout(() => {
            expect(withGroupProfile({ pk: 1, group: { pk: 7, name: 'raw-name' } }).group.title).toBe('raw-name');
            done();
        }, 0);
    });

    it('asks for each group once, however many resources share it', (done) => {
        mockAxios.onGet(/groups/).reply(200, GROUPS);
        const resources = [
            { pk: 1, group: { pk: 4 } },
            { pk: 2, group: { pk: 4 } },
            { pk: 3, group: { pk: 5 } }
        ];
        act(() => {
            ReactDOM.render(<Probe resources={resources}/>, document.getElementById('container'));
        });
        setTimeout(() => {
            expect(mockAxios.history.get.length).toBe(1);
            const requested = mockAxios.history.get[0].params['filter{group.pk.in}'];
            expect(requested.length).toBe(2);
            done();
        }, 0);
    });

    it('records a group with no profile so it is not fetched again', (done) => {
        mockAxios.onGet(/groups/).reply(200, { group_profiles: [] });
        act(() => {
            ReactDOM.render(
                <Probe resources={[{ pk: 1, group: { pk: 99 } }]}/>,
                document.getElementById('container')
            );
        });
        setTimeout(() => {
            expect(getCachedGroupProfile(99)).toBe(null);
            // and the resource still renders with whatever the API gave it
            const res = { pk: 1, group: { pk: 99, name: 'orphan' } };
            expect(withGroupProfile(res)).toBe(res);
            done();
        }, 0);
    });

    it('forgets a failed lookup so a later render can retry', (done) => {
        mockAxios.onGet(/groups/).reply(500);
        act(() => {
            ReactDOM.render(
                <Probe resources={[{ pk: 1, group: { pk: 4 } }]}/>,
                document.getElementById('container')
            );
        });
        setTimeout(() => {
            expect(getCachedGroupProfile(4)).toBe(undefined);
            done();
        }, 0);
    });
});
