/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from "prop-types";
import isNil from 'lodash/isNil';
import { Tabs as RTabs, Tab } from 'react-bootstrap';
import useLocalStorage from '@js/hooks/useLocalStorage';

const Tabs = ({
    tabs = [],
    identifier,
    selectedTabId,
    onSelect,
    className
}) => {
    const [eventKeys, setEventKeys] = useLocalStorage('tabSelected', {});
    const persistSelection = isNil(selectedTabId);
    const selectedKey = !persistSelection ? selectedTabId : (eventKeys[identifier] ?? 0);

    const onSelectTab = (key) => {
        const updatedEventKeys = {
            ...eventKeys,
            [identifier]: key
        };
        setEventKeys(updatedEventKeys);
    };
    return (
        <RTabs
            bsStyle="pills"
            className={className}
            animation={false}
            key={identifier}
            {...!persistSelection ? {
                activeKey: selectedTabId
            } : {
                defaultActiveKey: eventKeys[identifier] ?? 0
            }}
            onSelect={onSelect ? onSelect : onSelectTab}
        >
            {tabs.map((tab, index)=> {
                const eventKey = !isNil(tab.eventKey) ? tab.eventKey : index;
                const component = selectedKey === eventKey ? tab.component : null;
                return (
                    <Tab key={`tab-${index}`} eventKey={eventKey} title={tab.title}>
                        {component}
                    </Tab>);
            })}
        </RTabs>
    );
};

Tabs.propTypes = {
    className: PropTypes.string,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
        component: PropTypes.node,
        eventKey: PropTypes.string
    })),
    identifier: PropTypes.string,
    selectedTabId: PropTypes.string,
    onSelect: PropTypes.func
};

Tabs.defaultProps = {
    tabs: [],
    className: "gn-tabs tabs-underline"
};

export default Tabs;
