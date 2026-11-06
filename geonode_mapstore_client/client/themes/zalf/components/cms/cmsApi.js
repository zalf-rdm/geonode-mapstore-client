export function getCsrfToken() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

export function cmsRequest(url, method, body) {
    const isFormData = body instanceof FormData;
    const headers = { 'X-CSRFToken': getCsrfToken() };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return fetch(url, {
        method,
        headers,
        body: isFormData ? body : JSON.stringify(body)
    }).then(async(r) => {
        if (!r.ok) {
            let detail;
            try {
                detail = await r.json();
            } catch (e) {
                // Not JSON (an HTML error page, a proxy failure): surface the
                // status rather than a confusing JSON parse error.
                detail = { detail: `Request failed (${r.status} ${r.statusText})` };
            }
            return Promise.reject(detail);
        }
        if (r.status === 204) return null;
        return r.json();
    });
}

// `init` is optional and additive: the topic editor passes an AbortSignal so a
// fast-typing facet search can cancel its in-flight request.
export function cmsGet(url, init) {
    return fetch(url, init).then(async(response) => {
        if (response.ok) return response.json();
        let detail;
        try { detail = await response.json(); } catch (e) { detail = null; }
        return Promise.reject(detail || { detail: `Request failed (${response.status})` });
    });
}

export function errorMessage(error, fallback = 'The request could not be completed. Please try again.') {
    if (typeof error === 'string') return error;
    if (!error) return fallback;
    // GeoNode's exception handler wraps validation errors as
    // {success: false, errors: [...], code: "invalid"} — without this branch
    // every 400 collapsed into the generic fallback and hid the real reason.
    if (Array.isArray(error.errors) && error.errors.length) {
        return error.errors.join(' ');
    }
    if (error.detail) return error.detail;
    // Plain DRF shape: {field: ["message", ...], non_field_errors: [...]}.
    const fieldErrors = Object.keys(error)
        .filter((key) => Array.isArray(error[key]) && error[key].length)
        .map((key) => (key === 'non_field_errors' ? error[key].join(' ') : `${key}: ${error[key].join(' ')}`));
    if (fieldErrors.length) return fieldErrors.join(' ');
    if (error.message) return error.message;
    return fallback;
}

export function buildFormData(fields, imageKey, imageFile) {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    if (imageFile) fd.append(imageKey, imageFile);
    return fd;
}
