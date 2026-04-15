/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useRef, useState } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import { deleteExecutionRequest } from '@js/api/geonode/v2';
import { getUploadFileName } from '@js/utils/UploadUtils';

const useExecutionRequest = ({
    api,
    forceRequests,
    refreshTime,
    onRefresh = () => {}
}) => {
    const isMounted = useRef(true);
    const [requests, setRequests] = useState([]);
    const _props = useRef();
    _props.current = {
        onRefresh,
        requests
    };

    useEffect(() => {
        isMounted.current = true;
        const updateExecutions = () => {
            axios.get(api.url, {
                params: {
                    page_size: 9999,
                    ...api.params
                }
            })
                .then(({ data }) => {
                    if (isMounted.current) {
                        const newRequests = data?.requests || [];
                        const tmpRequests = (_props.current.requests || [])
                            .filter((request) => request['@tmp']
                            && !newRequests.some(({ exec_id: execId }) => execId === request.exec_id));
                        const updatedRequests = [...newRequests, ...tmpRequests];
                        setRequests(updatedRequests);
                        _props.current.onRefresh(updatedRequests);
                    }
                });
        };
        updateExecutions();
        const interval = setInterval(() => {
            updateExecutions();
        }, refreshTime);
        return () => {
            clearInterval(interval);
            isMounted.current = false;
        };
    }, [refreshTime, forceRequests]);

    return {
        requests,
        setRequests,
        uploadsToRequest: (uploads) => {
            setRequests(prevRequests =>[
                ...uploads.map(({ data, upload }) => {
                    return {
                        '@tmp': true,
                        exec_id: data.execution_id,
                        name: getUploadFileName({ upload }, true),
                        created: Date.now(),
                        status: 'running'
                    };
                }),
                ...prevRequests
            ]);
        },
        deleteRequest: (id) => {
            if (isMounted.current) {
                setRequests(prevRequests => prevRequests.filter(request => request.exec_id !== id));
            }
            deleteExecutionRequest(id);
        }
    };
};

export default useExecutionRequest;
