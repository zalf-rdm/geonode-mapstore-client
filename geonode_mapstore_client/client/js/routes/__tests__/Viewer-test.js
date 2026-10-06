/*
 * Copyright 2026, ZALF.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    canRequestResource,
    DATASET_VIEWER_DEFERRED_PLUGINS,
    getInitialPluginsConfiguration
} from '@js/routes/Viewer';

describe('Viewer route critical path', () => {
    const pluginsConfig = [
        { name: 'Map' },
        { name: 'Identify' },
        { name: 'Save' },
        { name: 'Print' },
        'Measure'
    ];

    it('keeps secondary dataset tools out of the initial module load', () => {
        const initialConfig = getInitialPluginsConfiguration('dataset_viewer', pluginsConfig, false);

        expect(initialConfig.map((plugin) => typeof plugin === 'string' ? plugin : plugin.name))
            .toEqual(['Map', 'Identify']);
        expect(DATASET_VIEWER_DEFERRED_PLUGINS).toContain('Save');
        expect(DATASET_VIEWER_DEFERRED_PLUGINS).toContain('Print');
    });

    it('restores the complete dataset plugin configuration after the critical load', () => {
        expect(getInitialPluginsConfiguration('dataset_viewer', pluginsConfig, true))
            .toEqual(pluginsConfig);
    });

    it('does not defer tools on other viewer types', () => {
        expect(getInitialPluginsConfiguration('map_viewer', pluginsConfig, false))
            .toEqual(pluginsConfig);
    });

    it('allows dataset metadata to start while critical plugins are loading', () => {
        expect(canRequestResource('dataset_viewer', true)).toBe(true);
        expect(canRequestResource('map_viewer', true)).toBe(false);
        expect(canRequestResource('map_viewer', false)).toBe(true);
    });
});
