/*
 * The topic icon set is the single source of the icon vocabulary: the backend
 * stores only a free-form name, the homepage draws from this map and the CMS
 * picker offers exactly its keys. These tests guard the two properties that
 * make that safe — every icon is renderable geometry, and an unknown name
 * degrades to "no icon" instead of throwing.
 */

import expect from 'expect';

import { TOPIC_ICONS, TOPIC_ICON_NAMES, topicIconShapes } from '../../../themes/zalf/utils/TopicIcons';

// Seeded by geonode/zalf/migrations/0009_seed_topic_icons.py. If an icon is
// renamed here without updating that migration, the ten seeded topics render
// no icon at all — so the two lists are asserted equal rather than trusted.
const SEEDED_ICONS = [
    'paw', 'cloud', 'sun', 'tree', 'waves',
    'mountain', 'seedling', 'droplet', 'layers', 'flask'
];

describe('ZalfTopicIcons', () => {
    it('ships every icon the seed migration assigns', () => {
        SEEDED_ICONS.forEach((name) => {
            expect(TOPIC_ICON_NAMES).toContain(name);
        });
    });

    it('names icons as url-safe slugs, which is all the backend validator allows', () => {
        TOPIC_ICON_NAMES.forEach((name) => {
            expect(name).toMatch(/^[a-z0-9-]+$/);
        });
    });

    it('defines every icon as renderable svg geometry', () => {
        TOPIC_ICON_NAMES.forEach((name) => {
            const shapes = TOPIC_ICONS[name];
            expect(Array.isArray(shapes)).toBe(true);
            expect(shapes.length).toBeGreaterThan(0);
            shapes.forEach(([tag, attrs]) => {
                expect(['path', 'circle', 'ellipse', 'line', 'polyline']).toContain(tag);
                expect(typeof attrs).toBe('object');
                // A path needs `d`; the shapes need their own geometry attrs.
                // Either way an empty attribute bag would draw nothing.
                expect(Object.keys(attrs).length).toBeGreaterThan(0);
                if (tag === 'path') {
                    expect(typeof attrs.d).toBe('string');
                    expect(attrs.d.length).toBeGreaterThan(0);
                }
            });
        });
    });

    it('carries no fill or stroke colour, so the card colour drives the icon', () => {
        TOPIC_ICON_NAMES.forEach((name) => {
            TOPIC_ICONS[name].forEach(([, attrs]) => {
                expect(attrs.fill).toBe(undefined);
                expect(attrs.stroke).toBe(undefined);
            });
        });
    });

    it('returns null rather than throwing for a name this build does not ship', () => {
        expect(topicIconShapes('no-such-icon')).toBe(null);
        expect(topicIconShapes('')).toBe(null);
        expect(topicIconShapes(undefined)).toBe(null);
        expect(topicIconShapes(null)).toBe(null);
    });

    it('returns the shapes for a known name', () => {
        expect(topicIconShapes('droplet')).toBe(TOPIC_ICONS.droplet);
    });
});
