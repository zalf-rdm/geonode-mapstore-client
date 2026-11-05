import React from 'react';
import './cms.css';
import HighlightedCaseEditor from './editors/HighlightedCaseEditor';
import TopicEditor from './editors/TopicEditor';
import HomepageSectionEditor from './editors/HomepageSectionEditor';
import SpotlightBannerEditor from './editors/SpotlightBannerEditor';
import TrainingResourceEditor from './editors/TrainingResourceEditor';

const TABS = [
    // Visitors see this section as "Highlighted Datasets" (zalf-rdm/geonode#838);
    // the model and API keep the HighlightedCase name.
    { key: 'cases', label: 'Highlighted Datasets' },
    { key: 'topics', label: 'Topics' },
    { key: 'banners', label: 'Spotlight Banners' },
    { key: 'trainings', label: 'Training Resources' },
    { key: 'sections', label: 'Homepage Layout' }
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
                        onClick: () => setActiveTab(key)
                    },
                    label
                )
            )
        ),
        React.createElement(
            'div',
            { className: 'zalf-cms__panel' },
            activeTab === 'cases' && React.createElement(HighlightedCaseEditor, null),
            activeTab === 'topics' && React.createElement(TopicEditor, null),
            activeTab === 'banners' && React.createElement(SpotlightBannerEditor, null),
            activeTab === 'trainings' && React.createElement(TrainingResourceEditor, null),
            activeTab === 'sections' && React.createElement(HomepageSectionEditor, null)
        )
    );
}

export default CmsPage;
