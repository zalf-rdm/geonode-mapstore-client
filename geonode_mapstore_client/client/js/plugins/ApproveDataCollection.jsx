
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Glyphicon } from 'react-bootstrap';
import { createStructuredSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import Dialog from '@mapstore/framework/components/misc/Dialog';
import Portal from '@mapstore/framework/components/misc/Portal';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import axios from '@mapstore/framework/libs/ajax';
import FaIcon from '@js/components/FaIcon';
import Dropdown from '@js/components/Dropdown';
import { parseDevHostname } from '@js/utils/APIUtils';
import { updateResourceProperties } from '@js/actions/gnresource';
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
    const { open, onClose, style={"white-space": "pre-line"}, closeGlyph, dispatch } = props;
    const { title, owner } = props.resourceData;

    const [ iconApproveButton, setIconApproveButton ] = useState("thumbs-up");

    const onApprove = function () {
        const pk = props.resourceData.pk;
        const url = parseDevHostname(`/api/v2/approve/${pk}/`);
        setIconApproveButton("cog");
        axios.post(url, { owner: owner.pk }).then(() => {
            setIconApproveButton("check");
            if (dispatch) {
                dispatch(updateResourceProperties({
                    resourceData: props.resourceData,
                    is_approved: true
                }));
            }
            //const data = response.data;
            setTimeout(onClose, 200);
        }).catch(error => {
            setIconApproveButton("circle-exclamation");
            console.error(`An error occured during approval: ${error}`);
        });
    }

    return (
        <Portal>
            <Dialog style={style} show={open} onHide={onClose} modal>
                <span role="header">
                    <span className="about-panel-title"><Message { ...i18n("title") } /></span>
                    <button onClick={onClose} className="settings-panel-close close">{closeGlyph ? <Glyphicon glyph={closeGlyph}/> : <span>×</span>}</button>
                </span>
                <div role="body">
                    <Message { ...i18n("description", { title }) } />
                </div>
                <div role="footer">
                    <Button variant="secondary" onClick={onClose}>
                        <span></span> <Message { ...i18n("cancel") } />
                    </Button>
                    <Button variant="primary" onClick={onApprove}>
                        <span><i className={"fa fa-" + iconApproveButton}></i></span> <Message { ...i18n("approve") } />
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
        resourceData,
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

const ApproveDataCollectionMenuItem = ({
    resource,
    ...rest
}) => {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const toggleDialog = () => setDialogOpen(!isDialogOpen);
    const props = {
        onClose: toggleDialog,
        open: isDialogOpen,
        resourceData: resource,
        ...rest
    };
    if (resourceData?.is_approved || !resourceData?.perms?.includes('change_resourcebase')) {
        return null;
    }

    return (
        <>
            <Dropdown.Item onClick={toggleDialog}>
                <FaIcon name="thumbs-up" />{' '}
                <Message { ...i18n("button") } />
            </Dropdown.Item>
            { isDialogOpen && <ApproveDataCollectionComponent {...props} /> }
        </>
    );
};

const ConnectedApproveDataCollectionMenuItem = connect()(ApproveDataCollectionMenuItem);

export default createPlugin('ApproveDataCollection', {
    component: ApproveDataCollectionComponent,
    containers: {
        ActionNavbar: {
            name: 'ApproveDataCollection',
            Component: ConnectedApproveDataCollectionDialogButton,
            priority: 1
        },
        ResourcesGrid: {
            name: 'ApproveDataCollection',
            target: 'cardOptions',
            Component: ConnectedApproveDataCollectionMenuItem
        }
    },
    epics: {},
    reducers: {}
});
