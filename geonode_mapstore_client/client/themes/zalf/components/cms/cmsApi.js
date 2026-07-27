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
        body: isFormData ? body : JSON.stringify(body),
    }).then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(e));
        if (r.status === 204) return null;
        return r.json();
    });
}

export function cmsGet(url) {
    return fetch(url).then(async (response) => {
        if (response.ok) return response.json();
        let detail;
        try { detail = await response.json(); } catch (e) { detail = null; }
        return Promise.reject(detail || { detail: `Request failed (${response.status})` });
    });
}

export function errorMessage(error, fallback = 'The request could not be completed. Please try again.') {
    if (typeof error === 'string') return error;
    if (error?.detail) return error.detail;
    if (error?.message) return error.message;
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
