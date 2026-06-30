
import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { Glyphicon, MenuItem } from 'react-bootstrap';
import { createStructuredSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import Dialog from '@mapstore/framework/components/misc/Dialog';
import Portal from '@mapstore/framework/components/misc/Portal';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import axios from '@mapstore/framework/libs/ajax';
import { parseDevHostname } from '@js/utils/APIUtils';
import { updateResourceProperties } from '@js/actions/gnresource';
import {
    getResourceData,
    getResourcePerms,
    getCompactPermissions,
} from '@js/selectors/resource';
import useDatacitePrefixes from '@js/hooks/useDatacitePrefixes';


const i18n = (shortId, msgParams={}) => {
    const msgId = `plugins.ApproveDataCollection.${shortId}`;
    return { msgId, msgParams };
}

const DEFAULT_DIALOG_STYLE = { "white-space": "pre-line" };

const ApproveDataCollectionComponent = (props) => {
    const { open, onClose, style=DEFAULT_DIALOG_STYLE, closeGlyph, dispatch } = props;
    const { title, owner } = props.resourceData;

    const [ iconApproveButton, setIconApproveButton ] = useState("thumbs-up");
    const [ approveError, setApproveError ] = useState(null);

    const onApprove = useCallback(() => {
        const pk = props.resourceData.pk;
        const url = parseDevHostname(`/api/v2/approve/${pk}/`);
        setIconApproveButton("cog");
        setApproveError(null);
        axios.post(url, { owner: owner.pk }).then(() => {
            setIconApproveButton("check");
            if (dispatch) {
                dispatch(updateResourceProperties({
                    resourceData: props.resourceData,
                    is_approved: true
                }));
            }
            setTimeout(onClose, 200);
        }).catch(error => {
            setIconApproveButton("thumbs-up");
            setApproveError(error?.response?.data?.message || 'An error occurred during approval.');
            console.error('An error occurred during approval:', error);
        });
    }, [props.resourceData, owner, dispatch, onClose]);

    return (
        <Portal>
            <Dialog style={style} show={open} onHide={onClose} modal>
                <span role="header">
                    <span className="about-panel-title"><Message { ...i18n("title") } /></span>
                    <button onClick={onClose} className="settings-panel-close close">{closeGlyph ? <Glyphicon glyph={closeGlyph}/> : <span>×</span>}</button>
                </span>
                <div role="body">
                    <Message { ...i18n("description", { title }) } />
                    { approveError && <div className="alert alert-danger" role="alert" style={{ marginTop: 12 }}>{approveError}</div> }
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
    resourceData,
    ...rest
}) => {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const toggleDialog = () => setDialogOpen(!isDialogOpen);
    const { canPublish } = useDatacitePrefixes();

    // Only show the approve button to users who belong to an allowed group
    // (canPublish = true means the datacite/prefixes/ API returned ≥1 prefix for this user).
    if (!canPublish || resourceData?.is_approved) {
        return null;
    }

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
                {showText ? <Message { ...i18n("button") } /> : <i className="fa fa-thumbs-up" />}
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
    const { canPublish } = useDatacitePrefixes();
    const props = {
        onClose: toggleDialog,
        open: isDialogOpen,
        resourceData: resource,
        ...rest
    };
    if (!canPublish || resource?.is_approved) {
        return null;
    }

    return (
        <>
            <MenuItem onClick={toggleDialog}>
                <i className="fa fa-thumbs-up" />{' '}
                <Message { ...i18n("button") } />
            </MenuItem>
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
