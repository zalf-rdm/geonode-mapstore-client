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
import Badge from "@js/components/Badge";
import SelectInfiniteScroll from '@js/components/SelectInfiniteScroll';
import { getFilterLabelById } from '@js/utils/SearchUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';

const SelectSync = localizedProps('placeholder')(ReactSelect);
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
                    const customFilters = castArray(values.f || []);
                    const isFacet = (item) => item.style === 'facet';
                    const renderFacet = ({item, active, onChangeFacet, renderChild}) => {
                        return (
                            <div className="gn-facet-wrapper">
                                <div key={item.id} className={`facet${active ? " active" : ""}`} onClick={onChangeFacet}>
                                    <Message msgId={item.labelId}/>
                                    {!isNil(item.count) && <Badge>{item.count}</Badge>}

                                </div>
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
                                            <Message msgId={item.labelId}/>
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
                            f: active
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
                                    <Message msgId={field.labelId}/>
                                    {filterChild()}
                                </Checkbox>
                            </FormGroup>
                        );
                }
                if (field.type === 'accordion') {
                    const key = `${id}-${field.id}`;
                    return (<Accordion
                        key={key}
                        titleId={field.labelId}
                        identifier={key}
                        content={<div className={'accordion-items'}>
                            <FilterItems
                                id={id}
                                items={field.items}
                                suggestionsRequestTypes={suggestionsRequestTypes}
                                values={values}
                                onChange={onChange}
                            />
                        </div>}
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
