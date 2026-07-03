/**
 * CUSTOM PATH: themes/zalf/components/faq/FaqPage.jsx
 * REASON: dedicated FAQ page for the ZALF theme using the standard shell
 */

import React from 'react';
import './faqpage.css';

const faqSections = [
    {
        title: 'Discovering Data',
        items: [
            {
                question: 'How can I find datasets relevant to my topic?',
                answer: 'Use the catalogue search, browse topic entry points, or filter results by resource type, keywords, and ownership.'
            },
            {
                question: 'Can I preview data before downloading it?',
                answer: 'Yes. Many resources provide metadata, previews, thumbnails, or viewers so you can inspect them before deciding to reuse them.'
            },
            {
                question: 'What kinds of resources are available?',
                answer: 'The repository can expose datasets, documents, maps, geostories, dashboards, and related research outputs.'
            }
        ]
    },
    {
        title: 'Publishing and Uploads',
        items: [
            {
                question: 'How do I upload a new dataset?',
                answer: 'Open the upload area from the main navigation and follow the guided flow for dataset or document submission.'
            },
            {
                question: 'Do resources become public immediately?',
                answer: 'That depends on the repository configuration. Some uploads may require moderation, approval, or additional metadata before publication.'
            },
            {
                question: 'Which metadata should I prepare first?',
                answer: 'At minimum you should prepare a clear title, description, ownership details, licensing information, and enough context for reuse.'
            }
        ]
    },
    {
        title: 'Access and Reuse',
        items: [
            {
                question: 'How should I cite a dataset from this repository?',
                answer: 'Use the citation guidance provided on the dataset page or the repository citation policy page when available.'
            },
            {
                question: 'Can I access data through services or APIs?',
                answer: 'Yes. Depending on the resource, you may find direct downloads, OGC services, or API endpoints for programmatic access.'
            },
            {
                question: 'Who can I contact if something is missing or unclear?',
                answer: 'If the metadata, access conditions, or reuse instructions are unclear, contact the repository support team or the resource owner.'
            }
        ]
    }
];

function FaqPage() {
    return React.createElement(
        'main',
        { className: 'zalf-faq' },
        React.createElement(
            'section',
            { className: 'zalf-faq__hero' },
            React.createElement(
                'div',
                { className: 'zalf-faq__container' },
                React.createElement('span', { className: 'zalf-faq__eyebrow' }, 'Support'),
                React.createElement('h1', { className: 'zalf-faq__title' }, 'Frequently Asked Questions'),
                React.createElement(
                    'p',
                    { className: 'zalf-faq__lead' },
                    'A compact entry point for common questions about discovery, publication, and reuse in the repository.'
                )
            )
        ),
        React.createElement(
            'section',
            { className: 'zalf-faq__section' },
            React.createElement(
                'div',
                { className: 'zalf-faq__container zalf-faq__grid' },
                ...faqSections.map(({ title, items }) => React.createElement(
                    'section',
                    { key: title, className: 'zalf-faq__card' },
                    React.createElement('h2', { className: 'zalf-faq__section-title' }, title),
                    ...items.map(({ question, answer }) => React.createElement(
                        'article',
                        { key: question, className: 'zalf-faq__item' },
                        React.createElement('h3', { className: 'zalf-faq__question' }, question),
                        React.createElement('p', { className: 'zalf-faq__answer' }, answer)
                    ))
                ))
            )
        )
    );
}

export default FaqPage;
