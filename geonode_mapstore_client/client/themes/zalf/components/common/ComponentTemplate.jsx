/**
 * ORIGINAL PATH: js/path/to/OriginalComponent.jsx
 * CUSTOM PATH: themes/zalf/components/common/ComponentTemplate.jsx
 * REASON: visual/functional customization for the ZALF theme
 */

import React from 'react';

const ComponentTemplate = (props) => {
    return (
        <div className="zalf-component-template">
            {props.children}
        </div>
    );
};

export default ComponentTemplate;
