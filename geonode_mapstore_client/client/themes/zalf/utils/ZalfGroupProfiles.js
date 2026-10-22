/**
 * CUSTOM PATH: themes/zalf/utils/ZalfGroupProfiles.js
 * REASON: zalf-rdm/geonode#812 asks the catalogue cards to show a resource's group —
 * its logo, or its name when it has none. A resource only carries { pk, name } for its
 * group (geonode/base/api/serializers.py: GroupSerializer), so the title and logo have
 * to come from /api/v2/groups/ (the group_profiles endpoint, registered under the
 * `groups` prefix).
 *
 * That endpoint serves anonymous requests and returns `logo: null` — not the default
 * placeholder that GroupProfile.logo_url would substitute — so "has no logo" is a
 * reliable test here.
 *
 * Profiles are cached for the lifetime of the page: a catalogue page shows the same few
 * groups over and over, and they do not change while it is open.
 */

import { useEffect, useState } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import { paramsSerializer } from '../../../js/utils/APIUtils';

// group pk -> { title, logo } | null (null = looked up, no profile exists)
const cache = new Map();
// group pks currently in flight, so two cards do not fetch the same group twice
const pending = new Set();

/** Test seam: drop everything the page has learned about groups. */
export function clearGroupProfileCache() {
    cache.clear();
    pending.clear();
}

/** The cached profile for a group pk, or undefined when it has not been fetched. */
export function getCachedGroupProfile(groupPk) {
    return cache.get(String(groupPk));
}

function groupPkOf(resource) {
    const pk = resource && resource.group && resource.group.pk;
    return pk === undefined || pk === null ? null : String(pk);
}

/**
 * Fill in group.title and group.logo from the cache.
 *
 * Returns the resource untouched when it has no group or the profile is not cached
 * yet, so a card never renders a half-populated group.
 */
export function withGroupProfile(resource) {
    const pk = groupPkOf(resource);
    if (!pk) {
        return resource;
    }
    const profile = cache.get(pk);
    if (!profile) {
        return resource;
    }
    return {
        ...resource,
        group: {
            ...resource.group,
            // The name is the fallback: a group always has one, a title it may not.
            title: profile.title || resource.group.name,
            logo: profile.logo || null
        }
    };
}

/**
 * Fetch the group profiles for a list of resources, once per group.
 *
 * @param {array} resources resources as the catalogue received them
 * @returns {number} a counter that changes whenever new profiles arrive, so a
 *                   component can re-render with them
 */
export function useGroupProfiles(resources) {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const missing = [...new Set(
            (resources || []).map(groupPkOf).filter((pk) => pk && !cache.has(pk) && !pending.has(pk))
        )];
        if (!missing.length) {
            return;
        }
        missing.forEach((pk) => pending.add(pk));
        axios.get('/api/v2/groups/', {
            params: {
                'filter{group.pk.in}': missing,
                page_size: missing.length
            },
            // dynamic-rest repeats the key per value rather than bracketing it
            ...paramsSerializer()
        })
            .then(({ data }) => {
                (data.group_profiles || []).forEach((profile) => {
                    const pk = profile.group && profile.group.pk;
                    if (pk !== undefined && pk !== null) {
                        cache.set(String(pk), { title: profile.title, logo: profile.logo || null });
                    }
                });
                // Record the misses too, so a group without a profile is not re-fetched
                // for every page of results.
                missing.forEach((pk) => {
                    if (!cache.has(pk)) {
                        cache.set(pk, null);
                    }
                });
            })
            .catch(() => {
                // A failed lookup must not wedge the cards: forget the attempt so a
                // later render can try again, and leave the cards showing the name.
                missing.forEach((pk) => cache.delete(pk));
            })
            .then(() => {
                missing.forEach((pk) => pending.delete(pk));
                setVersion((v) => v + 1);
            });
    }, [resources]);

    return version;
}
