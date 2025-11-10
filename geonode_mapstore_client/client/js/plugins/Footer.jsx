import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';

const Footer = () => (
    <div className="">


        <footer >
            
test
        </footer>

    </div>
);

export default createPlugin('Footer', {
    component: Footer,
    containers: {}
});
