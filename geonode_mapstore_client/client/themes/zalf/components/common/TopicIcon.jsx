/*
 * Renders one outline icon from the shared topic icon set
 * (zalf-rdm/geonode#863). Used by the homepage cards and by the icon picker in
 * the CMS topic editor, so both always draw from the same vocabulary and an
 * admin is never offered an icon the homepage cannot render.
 *
 * Written with React.createElement like the rest of themes/zalf.
 */

import React from 'react';

import { topicIconShapes } from '../../utils/TopicIcons';

export default function TopicIcon({ name, className }) {
    const shapes = topicIconShapes(name);
    if (!shapes) {
        return null;
    }
    return React.createElement(
        'svg',
        {
            className,
            viewBox: '0 0 24 24',
            // Decorative: every place this is used shows the topic name as
            // text right beside it, so announcing the icon would duplicate it.
            'aria-hidden': 'true',
            focusable: 'false',
            fill: 'none',
            // currentColor is what makes one icon set work on the white card
            // and in the editor's picker without a second colour to maintain.
            stroke: 'currentColor',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
        },
        ...shapes.map(([tag, attrs], index) => React.createElement(tag, { key: index, ...attrs }))
    );
}
