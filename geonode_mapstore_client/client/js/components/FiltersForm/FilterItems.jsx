/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import castArray from 'lodash/castArray';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import { FormGroup, Checkbox } from 'react-bootstrap';
import ReactSelect from 'react-select';

import Accordion from "@js/components/Accordion";
import SelectInfiniteScroll from '@js/components/SelectInfiniteScroll';
import { getFilterLabelById } from '@js/utils/SearchUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';

const SelectSync = localizedProps('placeholder')(ReactSelect);

function Facet({
    item,
    active,
    onChange
}) {
    return (
        <div key={item.id} className={`facet${active ? " active" : ""}`} onClick={onChange}>
            <input
                type="checkbox"
                id={item.id}
                name={item.id}
                checked={!!active}
                onKeyDown={(event) => event.key === 'Enter' ? onChange() : null}
                style={{ display: 'block', width: 0, height: 0, overflow: 'hidden', opacity: 0, padding: 0, margin: 0 }}
            />
            {item.labelId ? <Message msgId={item.labelId}/> : <span>{item.label}</span>}
            {!isNil(item.count) && <span className="facet-count">{`(${item.count})`}</span>}
        </div>
    );
}
function FilterItems({
    id,
    items,
    suggestionsRequestTypes,
    values,
    onChange
}) {
    return (
        <>
            {items.map((field) => {
                if (field.type === 'select' && field.loadItems) {
                    const filterKey = field.key;
                    const currentValues = castArray(values[filterKey] || []);
                    return (
                        <FormGroup
                            key={field.id}
                            controlId={field.id}
                        >
                            <label><strong>{field.labelId ? <Message msgId={field.labelId}/> : field.label}</strong></label>
                            <SelectInfiniteScroll
                                value={currentValues.map((value) => {
                                    return {
                                        value,
                                        label: getFilterLabelById(filterKey, value) || value
                                    };
                                })}
                                multi
                                placeholder={field.placeholderId}
                                onChange={(selected) => {
                                    onChange({
                                        [filterKey]: selected.map(({ value }) => value)
                                    });
                                }}
                                loadOptions={({ q, ...params }) => field.loadItems({
                                    ...params,
                                    ...(q && { topic_contains: q }),
                                    page: params.page - 1
                                })
                                    .then((response) => {
                                        return {
                                            ...response,
                                            results: response.items.map((item) => ({
                                                ...item,
                                                selectOption: {
                                                    value: item.id,
                                                    label: `${item.label} (${item.count})`
                                                }
                                            }))
                                        };
                                    })}
                            />
                        </FormGroup>
                    );
                }
                if (field.type === 'select') {
                    const {
                        id: formId,
                        labelId,
                        label,
                        placeholderId,
                        description,
                        options,
                        suggestionsRequestKey
                    } = field;
                    const key = `${id}-${formId || suggestionsRequestKey}`;
                    const filterKey = suggestionsRequestKey
                        ? suggestionsRequestTypes[suggestionsRequestKey]?.filterKey
                        : `filter{${formId}.in}`;

                    const currentValues = castArray(suggestionsRequestKey
                        ? values[suggestionsRequestTypes[suggestionsRequestKey]?.filterKey] || []
                        : values[filterKey] || []);

                    const optionsProp = suggestionsRequestKey
                        ? { loadOptions: suggestionsRequestTypes[suggestionsRequestKey]?.loadOptions }
                        : { options: options.map(option => ({ value: option, label: option })) };
                    const Select = suggestionsRequestKey ? SelectInfiniteScroll : SelectSync;
                    return (
                        <FormGroup
                            key={key}
                            controlId={key}
                        >
                            <label><strong>{labelId ? <Message msgId={labelId}/> : label}</strong></label>
                            <Select
                                value={currentValues.map((value) => ({ value, label: getFilterLabelById(filterKey, value) || value }))}
                                multi
                                placeholder={placeholderId}
                                onChange={(selected) => {
                                    onChange({
                                        [filterKey]: selected.map(({ value }) => value)
                                    });
                                }}
                                { ...optionsProp }
                            />
                            {description &&
                            <div className="text-muted">
                                {description}
                            </div>}
                        </FormGroup>
                    );
                }
                if (field.type === 'group') {
                    return (<>
                        <div className="gn-filter-form-group-title">
                            <strong><Message msgId={field.labelId}/> </strong>
                        </div>
                        <FilterItems
                            id={id}
                            items={field.items}
                            suggestionsRequestTypes={suggestionsRequestTypes}
                            values={values}
                            onChange={onChange}
                        />
                    </>);
                }
                if (field.type === 'divider') {
                    return <div key={field.id} className="gn-filter-form-divider"></div>;
                }
                if (field.type === 'link') {
                    return <div key={field.id} className="gn-filter-form-link"><a href={field.href}>{field.labelId && <Message msgId={field.labelId} /> || field.label}</a></div>;
                }
                if (field.type === 'filter') {
                    const filterKey = field.filterKey || "f";
                    const customFilters = castArray( values[filterKey] || []);
                    const isFacet = (item) => item.style === 'facet';
                    const renderFacet = ({item, active, onChangeFacet, renderChild}) => {
                        return (
                            <div className="gn-facet-wrapper">
                                <Facet item={item} active={active} onChange={onChangeFacet}/>
                                {item.items && renderChild && <div className="facet-children">{renderChild()}</div>}
                            </div>
                        );
                    };

                    const filterChild = () => {
                        return field.items && field.items.map((item) => {
                            const active = customFilters.find(value => value === item.id);
                            const onChangeFilter = () => {
                                onChange({
                                    f: active
                                        ? customFilters.filter(value => value !== item.id)
                                        : [...customFilters.filter(value => field.id !== value), item.id, field.id]
                                });
                            };
                            return (
                                <div className={'gn-sub-filter-items'}>
                                    {isFacet(item)
                                        ? renderFacet({item, active, onChangeFacet: onChangeFilter})
                                        : <Checkbox
                                            key={item.id}
                                            type="checkbox"
                                            checked={!!active}
                                            value={item.id}
                                            onChange={onChangeFilter}
                                        >
                                            {item.labelId ? <Message msgId={item.labelId}/> : item.label}
                                        </Checkbox>
                                    }
                                </div>
                            );
                        } );
                    };
                    const active = customFilters.find(value => value === field.id);
                    const parentFilterIds = [
                        field.id,
                        ...(field.items
                            ? field.items.map((item) => item.id)
                            : [])
                    ];
                    const onChangeFilterParent = () => {
                        onChange({
                            [filterKey]: active
                                ? customFilters.filter(value => !parentFilterIds.includes(value))
                                : [...customFilters, field.id]
                        });
                    };
                    return isFacet(field)
                        ? renderFacet({
                            item: field,
                            active,
                            onChangeFacet: onChangeFilterParent,
                            renderChild: filterChild
                        }) : (
                            <FormGroup key={field.id} controlId={'gn-radio-filter-' + field.id}>
                                <Checkbox
                                    type="checkbox"
                                    checked={!!active}
                                    value={field.id}
                                    onChange={onChangeFilterParent}>
                                    {field.labelId ? <Message msgId={field.labelId}/> : field.label}
                                    {filterChild()}
                                </Checkbox>
                            </FormGroup>
                        );
                }
                if (field.type === 'accordion' && !field.facet && field.id) {
                    const key = `${id}-${field.id}`;
                    return (<Accordion
                        key={key}
                        title={field.label}
                        titleId={field.labelId}
                        identifier={key}
                        loadItems={field.loadItems}
                        items={field.items}
                        content={(accordionItems) => (
                            <FilterItems
                                id={id}
                                items={accordionItems}
                                suggestionsRequestTypes={suggestionsRequestTypes}
                                values={values}
                                onChange={onChange}
                            />)
                        }
                    />);
                }
                return null;
            })}
        </>
    );
}

FilterItems.defaultProps = {
    id: PropTypes.string,
    items: PropTypes.array,
    suggestionsRequestTypes: PropTypes.object,
    values: PropTypes.object,
    onChange: PropTypes.func
};

FilterItems.defaultProps = {
    items: [],
    suggestionsRequestTypes: {},
    values: {},
    onChange: () => {}
};

export default FilterItems;
