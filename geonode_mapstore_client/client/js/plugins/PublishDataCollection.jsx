
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { FormGroup, Checkbox, FormControl, ControlLabel, Glyphicon } from 'react-bootstrap';
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
    const msgId = `plugins.PublishDataCollection.${shortId}`;
    return { msgId, msgParams };
}

const PublishDataCollectionComponent = ({
    resourceData,
    doiPrefixes=[],
    open,
    onClose,
    style,
    closeGlyph,
    dispatch 
}) => {

    const { title, pk, owner, maplayers=[], linkedResources={} } = resourceData;
    const { linkedTo=[] } = linkedResources;

    const doiResourceCandidates = [
        ...maplayers
            .map(ml => {
                return {
                    pk: ml.dataset.pk,
                    title: ml.dataset.title,
                    source: "maplayer",
                }
            }),
        ...linkedTo
            .map(lt => {
                return {
                    pk: lt.pk,
                    title: lt.title,
                    source: "linked " + lt.resource_type,
                }
            })
            .filter(((lt, i) => {
                const unique = i === linkedTo.findIndex(test => test.pk === lt.pk);
                const maplayer = maplayers.findIndex(test => test.pk === lt.pk) >= 0;
                return !maplayer && unique;
            }))
    ];
    
    const doiResourceCandidatesUnique = Object.assign({},
        doiResourceCandidates.reduce((acc, value) => ({...acc, [value.pk]: value}), {})
    );
    const [ checkedItems, setCheckedItems ] = useState({});
    const handleSelectionChange = (event) => {
        // we use resource pk as name
        const { name, checked } = event.target;
        setCheckedItems(prev => ({
            ...prev,
            [name]: checked,
        }));
    };

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
        }).catch(e => console.error(`Could not send request! ${e}`));
    }, [maplayers, linkedResources])

    const [ iconPublishButton, setIconPublishButton ] = useState("bookmark");
    
    const [ doiPrefix, setDoiPrefix ] = useState();
    const [ skipDoiPrefix, setSkipDoiPrefix ] = useState(false);
    const toggleSkipDoiPrefix = () => setSkipDoiPrefix(prev => !prev);

    const onPublish = function () {
        setIconPublishButton("cog fa-spin");

        const payload = {
            "owner": owner.pk,
            "doi_prefix": skipDoiPrefix ? undefined : (doiPrefix || doiPrefixes?.[0]),
            "resources": Object.keys(checkedItems)
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
            console.error(`An error occured during publish: ${error.statusText}`);
        });
    }

    return (
        <Portal>
            <Dialog id="publish-dialog" bsStyle={style} show={open} onHide={onClose} modal>
                <span role="header">
                    <span className="about-panel-title"><Message { ...i18n("title") } /></span>
                    <button onClick={onClose} className="settings-panel-close close">{closeGlyph ? <Glyphicon glyph={closeGlyph}/> : <span>×</span>}</button>
                </span>
                <div role="body">
                    <Message { ...i18n("description", { title }) } />

                    <FormGroup className="mb-3">
                        {
                            Object.values(doiResourceCandidatesUnique).map(resource =>
                                <>
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
                                </>
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
                            disabled={ doiPrefixes.length===0 || skipDoiPrefix }
                        >
                            {
                                doiPrefixes.map((prefix, i) => 
                                    <>
                                        <option key={i} value={prefix}>{prefix}</option>
                                    </>
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

    if (resourceData?.is_published || !resourceData?.is_approved || !resourceData?.perms?.includes('change_resourcebase')) {
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

const PublishDataCollectionMenuItem = ({
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

    if (!resource?.perms?.includes('change_resourcebase') || resource?.is_published || !resource?.is_approved) {
        return null;
    }

    return (
        <>
            <Dropdown.Item onClick={toggleDialog}>
                <FaIcon name="bookmark" />{' '}
                <Message { ...i18n("button") } />
            </Dropdown.Item>
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
