/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useEffect } from 'react';
import axios from '@mapstore/framework/libs/ajax';

const DATACITE_PREFIXES_URL = '/api/v2/datacite-prefixes/';

function useDatacitePrefixes(enabled = true) {
    const [prefixes, setPrefixes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        axios.get(DATACITE_PREFIXES_URL)
            .then(({ data }) => {
                if (!cancelled) {
                    setPrefixes(data.prefixes || []);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err);
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [enabled]);

    return { prefixes, loading, error };
}

export default useDatacitePrefixes;
