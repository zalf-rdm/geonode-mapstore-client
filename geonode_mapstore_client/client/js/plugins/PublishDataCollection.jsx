
import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { FormGroup, Checkbox, FormControl, ControlLabel, Glyphicon, MenuItem } from 'react-bootstrap';
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
    const msgId = `plugins.PublishDataCollection.${shortId}`;
    return { msgId, msgParams };
}

const PublishDataCollectionComponent = ({
    resourceData,
    open,
    onClose,
    style,
    closeGlyph,
    dispatch 
}) => {

    const { title, pk, owner, maplayers=[], linkedResources={} } = resourceData;
    const { linkedTo=[] } = linkedResources;

    const maplayersData = maplayers.map(ml => ({
        pk: ml.dataset.pk,
        title: ml.dataset.title,
        source: "maplayer",
    }));
    const maplayerPks = new Set(maplayersData.map(ml => ml.pk));
    const uniqueLinkedTo = new Map();
    linkedTo.forEach(lt => {
        if (!maplayerPks.has(lt.pk) && !uniqueLinkedTo.has(lt.pk)) {
            uniqueLinkedTo.set(lt.pk, {
                pk: lt.pk,
                title: lt.title,
                source: "linked " + lt.resource_type,
            });
        }
    });
    const doiResourceCandidates = [
        ...maplayersData,
        ...Array.from(uniqueLinkedTo.values()),
    ];
    
    const doiResourceCandidatesUnique = Object.assign({},
        doiResourceCandidates.reduce((acc, value) => ({...acc, [value.pk]: value}), {})
    );
    const [ checkedItems, setCheckedItems ] = useState({});
    const handleSelectionChange = useCallback((event) => {
        // we use resource pk as name
        const { name, checked } = event.target;
        setCheckedItems(prev => ({
            ...prev,
            [name]: checked,
        }));
    }, []);

    // DOI prefixes are embedded in the page by the Django context processor.
    const { prefixes: doiPrefixes, loading: prefixesLoading } = useDatacitePrefixes();

    const [ iconPublishButton, setIconPublishButton ] = useState("bookmark");
    const [ publishError, setPublishError ] = useState(null);
    const [ selectionError, setSelectionError ] = useState(null);

    const [ doiPrefix, setDoiPrefix ] = useState();
    const [ skipDoiPrefix, setSkipDoiPrefix ] = useState(false);
    const toggleSkipDoiPrefix = () => setSkipDoiPrefix(prev => !prev);

    useEffect(() => {
        // example: ?id__in=3,2&filter{owner}=1000&exclude[]=*&include[]=owner&include[]=pk
        const params = {
            "id__in": Object.keys(doiResourceCandidatesUnique).join(","),
            "filter{owner}": owner.pk,
            "exclude[]": "*",
            "include[]": "pk"
        }

        const url = "/api/v2/resources";
        axios.get(url, { params }).then(response => {
            const ownedResources = (response.data.resources || []);
            setCheckedItems( prev => ({
                    ...prev,
                    ...ownedResources.reduce((acc, value) => ({ ...acc, [value.pk]: true}), {})
                })
            );
        }).catch(e => {
            setSelectionError('Could not load resource ownership data. Some items may not be pre-selected.');
            console.error(`Could not send request! ${e}`);
        });
    }, [maplayers, linkedResources])

    const onPublish = useCallback(() => {
        setIconPublishButton("cog fa-spin");
        setPublishError(null);

        const payload = {
            "owner": owner.pk,
            "doi_prefix": skipDoiPrefix ? undefined : (doiPrefix || doiPrefixes?.[0]),
            "resources": Object.keys(checkedItems).filter(itemPk => checkedItems[itemPk])
        }

        const url = parseDevHostname(`/api/v2/publish/${pk}/`);
        axios.post(url, payload).then(response => {
            setIconPublishButton("check");
            const data = response.data;

            if (data?.success) {
                dispatch(updateResourceProperties({
                    resourceData,
                    // TODO upstream bug? Status seems not reactive
                    // see https://github.com/GeoNode/geonode-mapstore-client/blob/18986963cf435b963dcb98be25a7b65674741b95/geonode_mapstore_client/client/js/components/ResourceStatus/ResourceStatus.jsx#L20-L27
                    // Unfortunately, handling of ResourceStatus will change in next versions 
                    // so we may just accept the status flag not being updated
                    is_published: true
                }));
            }
            
            setTimeout(onClose, 200);
        }).catch(error => {
            setIconPublishButton("exclamation-circle");
            setPublishError(error?.response?.data?.message || 'An error occurred during publish.');
            console.error(`An error occured during publish: ${error.statusText}`);
        });
    }, [pk, owner, skipDoiPrefix, doiPrefix, doiPrefixes, checkedItems, resourceData, dispatch, onClose]);

    return (
        <Portal>
            <Dialog id="publish-dialog" bsStyle={style} show={open} onHide={onClose} modal>
                <span role="header">
                    <span className="about-panel-title"><Message { ...i18n("title") } /></span>
                    <button onClick={onClose} className="settings-panel-close close">{closeGlyph ? <Glyphicon glyph={closeGlyph}/> : <span>×</span>}</button>
                </span>
                <div role="body">
                    <Message { ...i18n("description", { title }) } />
                    { selectionError && <div className="alert alert-warning" role="alert" style={{ marginTop: 8 }}>{selectionError}</div> }
                    { publishError && <div className="alert alert-danger" role="alert" style={{ marginTop: 8 }}>{publishError}</div> }

                    <FormGroup className="mb-3">
                        {
                            Object.values(doiResourceCandidatesUnique).map(resource =>
                                <Checkbox
                                    // checked={enabled}
                                    type="switch"
                                    key={resource.pk}
                                    name={resource.pk}
                                    checked={!!checkedItems[resource.pk]}
                                    // id="gn-filter-by-extent-switch"
                                    onChange={handleSelectionChange}
                                >
                                    {resource.title + " (" + resource.source + ")"}
                                </Checkbox>
                            )
                        }
                    </FormGroup>
                    
                    <FormGroup className="mb-3">
                        <ControlLabel>
                            <Message { ...i18n("selectDoiPrefix") } />
                        </ControlLabel>
                        <Checkbox
                            checked={skipDoiPrefix}
                            type="switch"
                            onChange={toggleSkipDoiPrefix}
                        >
                             <Message { ...i18n("skipDoiPrefix") } />
                        </Checkbox>
                        <FormControl id="doi-select" 
                            componentClass="select"
                            onChange={(e) => setDoiPrefix(e.target.value)}
                            // TODO allow "empty"/"undefined" select for random DOI prefixes
                            disabled={ prefixesLoading || doiPrefixes.length===0 || skipDoiPrefix }
                        >
                            {
                                prefixesLoading
                                    ? <option value="">Loading...</option>
                                    : doiPrefixes.map((prefix, i) => 
                                        <option key={i} value={prefix}>{prefix}</option>
                                    )
                            }
                        </FormControl>
                    </FormGroup>

                </div>
                <div role="footer">
                    <Button onClick={onClose}>
                        <span></span> <Message { ...i18n("cancel") } />
                    </Button>
                    <Button
                        variant="primary" onClick={onPublish}
                        //disabled={!this.props.downloadOptions.selectedFormat || this.props.loading}
                        //</div>onClick={this.handleExport}
                    >
                        <span><i className={"fa fa-" + iconPublishButton}></i></span> <Message { ...i18n("publish") } />
                    </Button>
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
    resourceData,
    ...rest
}) => {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const toggleDialog = () => setDialogOpen(!isDialogOpen);
    // Publishing is restricted to managers of an allowed DataCite group
    const { canPublish } = useDatacitePrefixes();

    if (!canPublish || resourceData?.is_published || !resourceData?.is_approved) {
        return null;
    }

    // TODO disable or confirmation 
    //   - when map state is dirty
    //   - shall a dataset be set read_only somehow?

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
                id="publish-data-collection"
                tooltipPosition={enabled ? "left" : "top"}
                tooltip={ showText ? undefined : <Message { ...i18n("buttonTooltip") } /> }
                variant={variant}
                size={size}
                onClick={toggleDialog}
            >
                {showText ? <Message { ...i18n("button") } /> : <i className="fa fa-bookmark" />}
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

const PublishDataCollectionMenuItem = ({
    resource,
    ...rest
}) => {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const toggleDialog = () => setDialogOpen(!isDialogOpen);
    // Publishing is restricted to managers of an allowed DataCite group
    const { canPublish } = useDatacitePrefixes();
    const props = {
        onClose: toggleDialog,
        open: isDialogOpen,
        resourceData: resource,
        ...rest
    };

    if (!canPublish || resource?.is_published || !resource?.is_approved) {
        return null;
    }

    return (
        <>
            <MenuItem onClick={toggleDialog}>
                <i className="fa fa-bookmark" />{' '}
                <Message { ...i18n("button") } />
            </MenuItem>
            { isDialogOpen && <PublishDataCollectionComponent {...props} /> }
        </>
    );
};

const ConnectedPublishDataCollectionMenuItem = connect()(PublishDataCollectionMenuItem);

export default createPlugin('PublishDataCollection', {
    component: PublishDataCollectionComponent,
    containers: {
        ActionNavbar: {
            name: 'PublishDataCollection',
            Component: ConnectedOpenDialogButton,
            priority: 1
        },
        ResourcesGrid: {
            name: 'PublishDataCollection',
            target: 'cardOptions',
            Component: ConnectedPublishDataCollectionMenuItem
        }
    },
    epics: {},
    reducers: {}
});
