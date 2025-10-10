
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { GXP_PTYPES, SOURCE_TYPES } from '@js/utils/ResourceUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import { setControlProperty, SET_CONTROL_PROPERTY } from '@mapstore/framework/actions/controls';
import Dialog from '@mapstore/framework/components/misc/Dialog';
import Portal from '@mapstore/framework/components/misc/Portal';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import FaIcon from '@js/components/FaIcon';
import {
    getResourceData,
    getResourcePerms,
    getCompactPermissions,
} from '@js/selectors/resource';
import { openPublishDataCollectionDialog } from '@js/actions/gnresource';


const i18n = (shortId, msgParams={}) => {
    const msgId = `plugins.PublishDataCollection.${shortId}`;
    return { msgId, msgParams };
}

const PublishDataCollectionComponent = (props) => {
    console.log(`Rendering PublishDataCollectionDialog`);
    const { open, onClose, style, closeGlyph } = props;
    const { title, maplayers=[], linkedResources={} } = props.resourceData;
    const { linkedTo=[], linkedBy=[] } = linkedResources;
    return (
        <Portal>
            <Dialog style={style} show={open} onHide={onClose} modal>
                <span role="header">
                    <span className="about-panel-title"><Message { ...i18n("title") } /></span>
                    <button onClick={onClose} className="settings-panel-close close">{closeGlyph ? <Glyphicon glyph={closeGlyph}/> : <span>×</span>}</button>
                </span>
                <div role="body">
                    <Message { ...i18n("description", { title }) } />
                    <ul>
                        { maplayers.map(layer => <li>{layer.name}</li>) }
                    </ul>

                </div>
            </Dialog>
        </Portal>
    )
}

const OpenDialogButton = ({
    variant,
    size,
    enabled,
    showText,
    ...rest
}) => {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const toggleDialog = () => setDialogOpen(!isDialogOpen);

    // TODO disable or confirmation when map state is dirty

    const TooltipButton = tooltip(Button);
    const props = {
        onClose: toggleDialog,
        open: isDialogOpen,
        ...rest
    }
    return (
        <>
            <TooltipButton
                id="publish-data-collection"
                tooltipPosition={enabled ? "left" : "top"}
                tooltip={ showText ? undefined : <Message { ...i18n("buttonTooltip") } /> }
                variant={variant}
                size={size}
                onClick={toggleDialog}
            >
                {showText ? <Message { ...i18n("button") } /> : <FaIcon name="bookmark" />}
            </TooltipButton>
            { isDialogOpen && <PublishDataCollectionComponent {...props} /> }
        </>
    );
}

const ConnectedOpenDialogButton = connect(
    createStructuredSelector({
        resourceData: getResourceData,
        userPermissions: getResourcePerms,
        compactPermissions: getCompactPermissions,
    })
)(OpenDialogButton);

export default createPlugin('PublishDataCollection', {
    component: PublishDataCollectionComponent,
    containers: {
        ActionNavbar: {
            name: 'PublishDataCollection',
            Component: ConnectedOpenDialogButton,
            priority: 1
        },
    },
    epics: {
        // openpublishDataCollectionDialog: (action$, { getState }) => {
        //     action$.ofType("publishdatacollectiondialog")
        //         .switchMap(props => {
        //             console.log("It is going to be epic ..")
        //             return Rx.Observable.empty()
        //         });
        // }
    },
    reducers: {
        // toggleDialog: (state = { open: false }, action) => {
        //     switch (action.type) {
        //         case (SET_CONTROL_PROPERTY): {
        //             const { property, value } = action.payload;
        //             console.log(`Control propery '${property}' changed to '${value}'`)
        //             return {
        //                 ...state,
        //                 [property]: value
        //             };
        //         }
        //         default:
        //             return state;
        //     }
        // }
    }
});
