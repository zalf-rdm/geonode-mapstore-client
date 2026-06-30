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

export function buildFormData(fields, imageKey, imageFile) {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    if (imageFile) fd.append(imageKey, imageFile);
    return fd;
}
