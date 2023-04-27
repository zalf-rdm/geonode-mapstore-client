/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import uniq from 'lodash/uniq';
import PropTypes from "prop-types";

import Button from "@js/components/Button";
import FaIcon from "@js/components/FaIcon";
import useLocalStorage from "@js/hooks/useLocalStorage";
import Message from "@mapstore/framework/components/I18N/Message";

const Accordion = ({
    title,
    titleId,
    identifier,
    content
}) => {
    const [accordionsExpanded, setAccordionsExpanded] = useLocalStorage('accordionsExpanded', []);
    const isExpanded = accordionsExpanded.includes(identifier);
    const onClick = () => {
        const expandedList = isExpanded
            ? accordionsExpanded.filter(expanded => expanded !== identifier)
            : uniq(accordionsExpanded.concat(identifier));
        setAccordionsExpanded(expandedList);
    };
    return (
        <div className={'gn-accordion'}>
            <div className="accordion-title" onClick={onClick}>
                <Button>
                    <FaIcon name={`chevron-${isExpanded ? "down" : "right"}`}/>
                </Button>
                {titleId ? <Message msgId={titleId}/> : title}
            </div>
            {isExpanded && <div className="accordion-body">
                {content}
            </div>}
        </div>
    );
};

Accordion.propTypes = {
    title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    titleId: PropTypes.string,
    identifier: PropTypes.string,
    content: PropTypes.node
};

Accordion.defaultProps = {
    title: null,
    identifier: "",
    content: null
};
export default Accordion;
