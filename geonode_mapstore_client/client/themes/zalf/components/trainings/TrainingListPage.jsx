import React from 'react';
import './trainings.css';

function unique(arr) {
    return [...new Set(arr.filter(Boolean))].sort();
}

function TrainingCard({ item }) {
    return React.createElement(
        'a',
        { href: `/trainings/${item.slug}/`, className: 'zalf-trainings__card' },
        React.createElement(
            'div',
            {
                className: 'zalf-trainings__thumb',
                style: item.thumbnail_url
                    ? { backgroundImage: `url(${item.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : {}
            }
        ),
        React.createElement(
            'div',
            { className: 'zalf-trainings__info' },
            React.createElement('h3', { className: 'zalf-trainings__card-title' }, item.title),
            React.createElement('span', { className: 'zalf-trainings__organizer' }, item.organizer),
            item.duration
                ? React.createElement('span', { className: 'zalf-trainings__duration' }, item.duration)
                : null
        )
    );
}

function TrainingListPage() {
    const [all, setAll] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [filterOrg, setFilterOrg] = React.useState('');
    const [filterDur, setFilterDur] = React.useState('');

    React.useEffect(() => {
        fetch('/api/v2/cms/trainings/')
            .then(r => r.ok ? r.json() : [])
            .then(data => setAll([...data].sort((a, b) => b.id - a.id)))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const organizers = unique(all.map(t => t.organizer));
    const durations = unique(all.map(t => t.duration));
    const hasDurations = durations.length > 0;

    const q = search.toLowerCase().trim();
    const visible = all.filter(t => {
        if (filterOrg && t.organizer !== filterOrg) return false;
        if (filterDur && t.duration !== filterDur) return false;
        if (q && !(t.title || '').toLowerCase().includes(q) && !(t.organizer || '').toLowerCase().includes(q)) return false;
        return true;
    });

    return React.createElement(
        'div',
        { className: 'zalf-trainings' },

        React.createElement(
            'div',
            { className: 'zalf-trainings__header' },
            React.createElement(
                'div',
                { className: 'zalf-trainings__header-inner' },
                React.createElement('h1', { className: 'zalf-trainings__title' }, 'Training Resources'),
                React.createElement('p', { className: 'zalf-trainings__subtitle' }, 'Courses, workshops, and self-study materials for researchers working with agricultural and environmental data.')
            )
        ),

        React.createElement(
            'div',
            { className: 'zalf-trainings__body' },

            React.createElement(
                'div',
                { className: 'zalf-trainings__filters' },
                React.createElement('input', {
                    type: 'search',
                    className: 'zalf-trainings__search',
                    placeholder: 'Search by title or topic…',
                    value: search,
                    onChange: e => setSearch(e.target.value)
                }),
                React.createElement(
                    'select',
                    { className: 'zalf-trainings__select', value: filterOrg, onChange: e => setFilterOrg(e.target.value) },
                    React.createElement('option', { value: '' }, 'All providers'),
                    ...organizers.map(o => React.createElement('option', { key: o, value: o }, o))
                ),
                hasDurations
                    ? React.createElement(
                        'select',
                        { className: 'zalf-trainings__select', value: filterDur, onChange: e => setFilterDur(e.target.value) },
                        React.createElement('option', { value: '' }, 'Any duration'),
                        ...durations.map(d => React.createElement('option', { key: d, value: d }, d))
                    )
                    : null,
                (search || filterOrg || filterDur)
                    ? React.createElement(
                        'button',
                        { type: 'button', className: 'zalf-trainings__clear', onClick: () => { setSearch(''); setFilterOrg(''); setFilterDur(''); } },
                        'Clear filters'
                    )
                    : null
            ),

            loading
                ? React.createElement(
                    'div',
                    { className: 'zalf-trainings__grid' },
                    ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => React.createElement('div', { key: i, className: 'zalf-trainings__card zalf-trainings__card--skeleton' }))
                )
                : visible.length > 0
                    ? React.createElement(
                        'div',
                        { className: 'zalf-trainings__grid' },
                        ...visible.map(item => React.createElement(TrainingCard, { key: item.id, item }))
                    )
                    : React.createElement(
                        'p',
                        { className: 'zalf-trainings__empty' },
                        'No training resources match your search.'
                    ),

            !loading && React.createElement(
                'p',
                { className: 'zalf-trainings__count' },
                `${visible.length} of ${all.length} resource${all.length !== 1 ? 's' : ''}`
            )
        )
    );
}

export default TrainingListPage;
