import React from 'react';
import './cms.css';
import HighlightedCaseEditor from './editors/HighlightedCaseEditor';
import SpotlightBannerEditor from './editors/SpotlightBannerEditor';
import TrainingResourceEditor from './editors/TrainingResourceEditor';

const TABS = [
    { key: 'cases', label: 'Highlighted Cases' },
    { key: 'banners', label: 'Spotlight Banners' },
    { key: 'trainings', label: 'Training Resources' },
];

function CmsPage() {
    const [activeTab, setActiveTab] = React.useState('cases');

    return React.createElement(
        'div',
        { className: 'zalf-cms' },
        React.createElement(
            'div',
            { className: 'zalf-cms__header-band' },
            React.createElement(
                'div',
                { className: 'zalf-cms__header' },
                React.createElement('h1', { className: 'zalf-cms__title' }, 'Content Management System'),
                React.createElement(
                    'a',
                    { href: '/', className: 'zalf-cms__back' },
                    '← Back to site'
                )
            )
        ),
        React.createElement(
            'div',
            { className: 'zalf-cms__tabs', role: 'tablist' },
            ...TABS.map(({ key, label }) =>
                React.createElement(
                    'button',
                    {
                        key,
                        type: 'button',
                        role: 'tab',
                        'aria-selected': activeTab === key ? 'true' : 'false',
                        className: `zalf-cms__tab${activeTab === key ? ' is-active' : ''}`,
                        onClick: () => setActiveTab(key),
                    },
                    label
                )
            )
        ),
        React.createElement(
            'div',
            { className: 'zalf-cms__panel' },
            activeTab === 'cases' && React.createElement(HighlightedCaseEditor, null),
            activeTab === 'banners' && React.createElement(SpotlightBannerEditor, null),
            activeTab === 'trainings' && React.createElement(TrainingResourceEditor, null)
        )
    );
}

export default CmsPage;
