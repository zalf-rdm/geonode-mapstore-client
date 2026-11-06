/*
 * Outline icons for the homepage topic cards (zalf-rdm/geonode#863).
 *
 * This module is the single source of the icon vocabulary. The backend stores
 * only the chosen name as a free-form slug and deliberately has no `choices`
 * enum, so there is no second list to keep in step across the two repos. An
 * unknown or empty name renders nothing, which degrades the card to a plain
 * label rather than breaking it.
 *
 * Every icon is drawn as stroked geometry on a 24x24 grid with no fill, so it
 * inherits the card's colour through `currentColor` and matches the label in
 * the navigation bar's dark petrol green. Each entry is a list of
 * [tagName, attributes] pairs rather than a single path string, because the
 * sun and the paw need circles and ellipses alongside their paths.
 */

export const TOPIC_ICONS = {
    paw: [
        ['ellipse', { cx: 5.6, cy: 13.2, rx: 1.9, ry: 2.4 }],
        ['ellipse', { cx: 9.6, cy: 8.6, rx: 2, ry: 2.6 }],
        ['ellipse', { cx: 14.4, cy: 8.6, rx: 2, ry: 2.6 }],
        ['ellipse', { cx: 18.4, cy: 13.2, rx: 1.9, ry: 2.4 }],
        ['path', { d: 'M12 13.6c2.8 0 5.1 2.2 5.1 4.7 0 1.7-1.3 2.9-3 2.9-1.1 0-1.5-.4-2.1-.4s-1 .4-2.1.4c-1.7 0-3-1.2-3-2.9 0-2.5 2.3-4.7 5.1-4.7z' }]
    ],
    cloud: [
        ['path', { d: 'M17.4 19.5a4.6 4.6 0 0 0 .4-9.2A6.2 6.2 0 0 0 5.9 11.6a4 4 0 0 0 .5 7.9h11z' }]
    ],
    sun: [
        ['circle', { cx: 12, cy: 12, r: 4.2 }],
        ['path', { d: 'M12 2.2v2.3M12 19.5v2.3M4.1 4.1l1.6 1.6M18.3 18.3l1.6 1.6M2.2 12h2.3M19.5 12h2.3M4.1 19.9l1.6-1.6M18.3 5.7l1.6-1.6' }]
    ],
    tree: [
        ['path', { d: 'M12 2.4 7.4 9.2H10L5.9 15.3H11V21.6h2V15.3h5.1L14 9.2h2.6L12 2.4z' }]
    ],
    waves: [
        ['path', { d: 'M3 8q3-2 6 0t6 0t6 0M3 13q3-2 6 0t6 0t6 0M3 18q3-2 6 0t6 0t6 0' }]
    ],
    mountain: [
        ['path', { d: 'M2.4 19.6 9 7.4l4.5 7.6L16 11l5.6 8.6H2.4z' }]
    ],
    seedling: [
        ['path', { d: 'M12 21.6V11.4' }],
        ['path', { d: 'M12 11.9c0-3.4 2.8-6.2 6.2-6.2 0 3.4-2.8 6.2-6.2 6.2z' }],
        ['path', { d: 'M12 16.1c0-2.9-2.3-5.2-5.2-5.2 0 2.9 2.3 5.2 5.2 5.2z' }]
    ],
    droplet: [
        ['path', { d: 'M12 2.7 17.7 8.4a8 8 0 1 1-11.4 0L12 2.7z' }]
    ],
    layers: [
        ['path', { d: 'M12 2.8 2.9 7.4 12 12l9.1-4.6L12 2.8z' }],
        ['path', { d: 'M2.9 12 12 16.6 21.1 12M2.9 16.6 12 21.2l9.1-4.6' }]
    ],
    flask: [
        ['path', { d: 'M9.4 2.6v6.3l-4.8 9.1a2.4 2.4 0 0 0 2.1 3.6h10.6a2.4 2.4 0 0 0 2.1-3.6l-4.8-9.1V2.6' }],
        ['path', { d: 'M8.4 2.6h7.2M6.6 15.6h10.8' }]
    ],
    leaf: [
        ['path', { d: 'M4.2 19.8c0-8.1 5.2-13.1 16.1-14.1 0 11.1-5.1 15.1-12.1 15.1-2 0-4-.4-4-1z' }],
        ['path', { d: 'M4.2 19.8c3-5 6.1-7.6 10.1-9.6' }]
    ],
    globe: [
        ['circle', { cx: 12, cy: 12, r: 9.2 }],
        ['path', { d: 'M2.8 12h18.4M12 2.8c2.5 2.7 3.9 5.9 3.9 9.2s-1.4 6.5-3.9 9.2c-2.5-2.7-3.9-5.9-3.9-9.2s1.4-6.5 3.9-9.2z' }]
    ],
    'map-pin': [
        ['path', { d: 'M12 21.6s7.1-6.2 7.1-11.1a7.1 7.1 0 1 0-14.2 0c0 4.9 7.1 11.1 7.1 11.1z' }],
        ['circle', { cx: 12, cy: 10.4, r: 2.6 }]
    ],
    chart: [
        ['path', { d: 'M3.2 20.4h17.6M7.2 20.4v-6.2M12 20.4V7.8M16.8 20.4v-9.2' }]
    ]
};

/** The icon names an editor may choose from, in a stable display order. */
export const TOPIC_ICON_NAMES = Object.keys(TOPIC_ICONS);

/**
 * The [tag, attrs] pairs for `name`, or null when the name is empty or unknown.
 * Callers render null as "no icon" rather than as an error: a topic configured
 * against an icon this build does not ship must still show its label.
 */
export function topicIconShapes(name) {
    return (name && TOPIC_ICONS[name]) || null;
}
