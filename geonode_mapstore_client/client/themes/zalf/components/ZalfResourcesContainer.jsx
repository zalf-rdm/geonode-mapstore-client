/**
 * CUSTOM PATH: themes/zalf/components/ZalfResourcesContainer.jsx
 * REASON: Extends upstream ResourcesContainer to pass msgParams (search query term)
 * to the HTML i18n component, enabling interpolation in empty-state messages
 * (e.g. 'No results for "Animals"').
 * Upstream: MapStore2/web/client/plugins/ResourcesCatalog/components/ResourcesContainer.jsx
 */

// Uses React.createElement — themes/zalf/ is outside babel-loader include, JSX not supported here.
import React, { useEffect, useRef } from 'react';
const ce = React.createElement;
import HTML from '@mapstore/framework/components/I18N/HTML';
import ResourceCard from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourceCard';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import { getResourceStatus } from '@mapstore/framework/utils/ResourcesUtils';
import {
    ensureCatalogueThumbnail,
    filterCatalogueMetadata
} from '../utils/CatalogueUtils';

const renderSkeletons = (cardLayoutStyle) => Array.from({ length: cardLayoutStyle === 'list' ? 8 : 6 })
    .map((_, idx) => ce('li', { key: `catalogue-skeleton-${idx}`, 'aria-hidden': 'true' },
        ce('div', { className: `zalf-catalogue-skeleton zalf-catalogue-skeleton--${cardLayoutStyle}` },
            ce('span', { className: 'zalf-catalogue-skeleton__icon' }),
            ce('span', { className: 'zalf-catalogue-skeleton__content' },
                ce('span', { className: 'zalf-catalogue-skeleton__line zalf-catalogue-skeleton__line--title' }),
                ce('span', { className: 'zalf-catalogue-skeleton__line' }),
                ce('span', { className: 'zalf-catalogue-skeleton__line zalf-catalogue-skeleton__line--short' })
            )
        )
    ));

const ZalfResourcesContainer = (props) => {
    const containerRef = useRef();
    const {
        resources,
        isCardActive,
        containerStyle,
        header,
        cardOptions,
        children,
        footer,
        cardLayoutStyle,
        loading,
        getMainMessageId = () => '',
        onSelect,
        theme = 'main',
        cardButtons,
        cardComponent,
        query,
        columns,
        metadata,
        formatHref,
        hideThumbnail,
        target
    } = props;
    const messageId = getMainMessageId(props);
    const msgParams = { q: (query && query.q) || '' };

    useEffect(() => {
        containerRef.current
            ?.querySelectorAll('.ms-resource-card-action-buttons .dropdown-toggle')
            .forEach((button) => button.setAttribute('aria-label', 'Resource actions'));
    }, [resources, cardLayoutStyle, cardOptions]);

    return ce('div',
        {
            ref: containerRef,
            className: `ms-resources-container${theme ? ` ms-${theme}-colors` : ''} _padding-lr-md`
        },
        ce('div',
            { className: '_relative _margin-auto', style: containerStyle },
            header,
            children,
            ce(FlexBox, {
                component: 'ul',
                column: cardLayoutStyle === 'list',
                wrap: cardLayoutStyle !== 'list',
                gap: cardLayoutStyle === 'list' ? 'md' : 'lg',
                className: `ms-resources-container-${cardLayoutStyle}`,
                classNames: ['_relative', '_padding-tb-lg']
            },
            ...(loading && !resources.length ? renderSkeletons(cardLayoutStyle) : resources.map((resource, idx) => {
                const cardResource = ensureCatalogueThumbnail(resource);
                const { isProcessing, items: statusItems } = getResourceStatus(cardResource);
                const allowedOptions = !isProcessing ? cardOptions : [];
                return ce('li', { key: `${idx}:${resource && resource.id}` },
                    ce(ResourceCard, {
                        component: cardComponent,
                        active: isCardActive(cardResource),
                        data: cardResource,
                        options: allowedOptions,
                        buttons: cardButtons,
                        layoutCardsStyle: cardLayoutStyle,
                        loading: isProcessing,
                        readOnly: isProcessing,
                        statusItems,
                        formatHref,
                        onClick: onSelect,
                        query,
                        columns,
                        metadata: filterCatalogueMetadata(metadata, cardResource),
                        hideThumbnail,
                        target
                    })
                );
            })),
            messageId
                ? ce(Text, { textAlign: 'center', classNames: ['_margin-auto', '_padding-lr-sm'] },
                    ce('h1', null, ce(HTML, { msgId: `${messageId}Title`, msgParams })),
                    ce('p', null, ce(HTML, { msgId: `${messageId}Content`, msgParams }))
                )
                : null,
            loading && resources.length
                ? ce(FlexBox, {
                    centerChildren: true,
                    classNames: [
                        resources.length ? '_absolute' : '_relative',
                        '_fill',
                        '_padding-lr-sm',
                        '_overlay',
                        '_corner-tl'
                    ]
                },
                ce(Text, { fontSize: 'xxl' }, ce(Spinner, null))
                )
                : null
            ),
            footer
        )
    );
};

ZalfResourcesContainer.defaultProps = {
    resources: [],
    loading: false,
    formatHref: () => '#',
    isCardActive: () => false,
    getMessageId: () => undefined
};

export default ZalfResourcesContainer;
