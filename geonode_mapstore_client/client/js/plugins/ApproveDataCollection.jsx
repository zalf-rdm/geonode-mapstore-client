
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { FormGroup, Checkbox } from 'react-bootstrap';
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


const i18n = (shortId, msgParams={}) => {
    const msgId = `plugins.ApproveDataCollection.${shortId}`;
    return { msgId, msgParams };
}

const ApproveDataCollectionComponent = (props) => {
    const { open, onClose, style={"white-space": "pre-line"}, closeGlyph } = props;
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

                    {/* <FormGroup className="mb-3">
                        {
                            maplayers.map(layer =>
                                <>
                                    <Checkbox
                                        // checked={enabled}
                                        type="switch"
                                        // id="gn-filter-by-extent-switch"
                                        // onChange={handleOnSwitch}
                                    >
                                        {layer.name}
                                    </Checkbox>
                                </>
                            )
                        }

                    </FormGroup> */}



                </div>
                <div role="footer">
                    <Button
                        variant="primary"
                        //disabled={!this.props.downloadOptions.selectedFormat || this.props.loading}
                        //</div>onClick={this.handleExport}
                    >
                        <span><i class="fa fa-cog"></i></span> <Message { ...i18n("approve") } />
                    </Button>
                </div>
            </Dialog>
        </Portal>
    )
}

const ApproveDataCollectionDialogButton = ({
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
                id="approve-data-collection"
                tooltipPosition={enabled ? "left" : "top"}
                tooltip={ showText ? undefined : <Message { ...i18n("buttonTooltip") } /> }
                variant={variant}
                size={size}
                onClick={toggleDialog}
            >
                {showText ? <Message { ...i18n("button") } /> : <FaIcon name="thumbs-up" />}
            </TooltipButton>
            { isDialogOpen && <ApproveDataCollectionComponent {...props} /> }
        </>
    );
}

const ConnectedApproveDataCollectionDialogButton = connect(
    createStructuredSelector({
        resourceData: getResourceData,
        userPermissions: getResourcePerms,
        compactPermissions: getCompactPermissions,
    })
)(ApproveDataCollectionDialogButton);

export default createPlugin('ApproveDataCollection', {
    component: ApproveDataCollectionComponent,
    containers: {
        ActionNavbar: {
            name: 'ApproveDataCollection',
            Component: ConnectedApproveDataCollectionDialogButton,
            priority: 1
        },
    },
    epics: {},
    reducers: {}
});
