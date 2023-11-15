import React, { useEffect, useState, useRef } from 'react';
import head from 'lodash/head';
import isObject from 'lodash/isObject';
import { connect } from 'react-redux';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { layerSelector, groupSelector } from '../selectors/layersSelectors';
import { updateNode } from '@mapstore/framework/actions/layers';

function ExclusiveLayer(props) {
    const layers = props.layers;
    const groups = props.groups.filter((group) => group.id !== "Default");
    const previousLayersAndGroups = useRef("");
    const [ prevVals, updatePrevVals ] = useState(false);
    useEffect(() => {
        previousLayersAndGroups.current = {
            "layers": layers,
            "groups": groups,
        };
    }, [prevVals])

    let onGroup = false;
    window.onclick = (e) => {
        const clickedItem = e.target
        if ( clickedItem.className.includes("glyphicon-record") || clickedItem.className.includes("glyphicon-unchecked") || 
                clickedItem.className.includes("glyphicon-eye-open") || clickedItem.className.includes("glyphicon-eye-close")) {
            onGroup = checkIfClickedOnGroup( clickedItem );
            if ( onGroup.clicked && onGroup.open ) {
                checkExclusiveGroupsForConsistency( groups, layers, props );
            } else {
                changeLayerVisibility( props, previousLayersAndGroups, layers );
            }
            updatePrevVals( !prevVals );
        }
    }

//  if ( previousLayersAndGroups.current.groups && groups.length === previousLayersAndGroups.current.groups.length ) {
    if ( previousLayersAndGroups.current.groups && groups ) {
        for ( let i=0; i<groups.length; i++ ) {
            const oldGroup = previousLayersAndGroups.current.groups.filter((curr_gr) => groups[i].id === curr_gr.id)[0];
            if ( oldGroup ) {
            //check if a group was changed from non-exclusive to exclusive
            if ( groups[i].exclusiveLayer && !oldGroup.exclusiveLayer ) {
                const layersInGroup = getLayersInGroup( layers, groups[i].id );
                const visibleLayers = countVisibleLayers( layersInGroup );
                if ( visibleLayers>1 ) {
                    layersInGroup.forEach( ( layer ) => {
                        props.updateLayerVisibility( layer.id, 'layer', { visibility: false } );
                    })
                }
            }
            //check if a layer was moved from one group to another. If so, check if the target group is exclusive and act accordingly
            checkIfLayerMoved( groups[i], oldGroup, layers, previousLayersAndGroups.current.layers, props );
            }
        }
    }
    return (
        <div></div>
    )
}

const getLayersInGroup = (layers, group) => {
    return layers.filter((layer) => group === layer.group);
}

const countVisibleLayers = (layers) => {
    let visibleLayers = 0;
    layers.forEach(( layer ) => {
        if ( layer.visibility ) visibleLayers++;
    });
    return visibleLayers;
}

const changeLayerVisibility = (props, previousLayersAndGroups, layers) => {
    if ( props && previousLayersAndGroups.current ) {
        findLayerThatChangedVisibility( layers, previousLayersAndGroups.current.layers, props );
    }
}

const checkIfLayerMoved = ( newGroup, oldGroup, newLayers, oldLayers, props ) => {
    if ( ( newGroup.nodes.length - oldGroup.nodes.length ) === 1 ) { //if this is true, newGroup is the group where the layer was moved to.
        if ( newGroup.exclusiveLayer ) {
            const layersInNewGroup = getLayersInGroup( newLayers, newGroup.id );
            const oldLayersInGroup = getLayersInGroup( oldLayers, newGroup.id);
            const visibleLayers = countVisibleLayers(layersInNewGroup)
            if ( visibleLayers > 1 ) {
                for ( let i=0; i<layersInNewGroup.length; i++ ) {
                    const tmpLyr = oldLayersInGroup.filter((ol)=>ol.id===layersInNewGroup[i].id)[0];
                    if ( tmpLyr && tmpLyr.visibility ) {
                        props.updateLayerVisibility( layersInNewGroup[i].id, 'layer', {visibility:false} );
                    }
                    if ( tmpLyr === undefined) { //if tmpLayer is undefined, it means that an older 'version' of the layer does not exist, meaning it was just added.
                        const visible = layersInNewGroup[i].visibility;
                        props.updateLayerVisibility( layersInNewGroup[i].id, 'layer', {visibility:!visible});
                    }
                }
            }
        }
    }
}

const checkExclusiveGroupsForConsistency = ( groups, layers, props ) => {
    if ( groups ) {
        groups.forEach( group => {
            if ( group.exclusiveLayer ) {
                let allLayersInGroup = getLayersInGroup( layers, group.id );
                const visibleLayers = countVisibleLayers( allLayersInGroup );
                if ( visibleLayers > 1 ) {
                    allLayersInGroup = allLayersInGroup.reverse();
                    props.updateLayerVisibility( allLayersInGroup[0].id, 'layer', {visibility:true} );
                    for ( let i=1; i<allLayersInGroup.length; i++ ) {
                        props.updateLayerVisibility( allLayersInGroup[i].id, 'layer', {visibility:false} );
                    }
                }
            }
        })
    }
}

const findLayerThatChangedVisibility = ( newLayers, oldLayers, props ) => {
    let changedLayers=[];
    for ( let i = 0; i < newLayers.length; i++ ) {
        const tmpOldLayer = oldLayers.filter( ( oldLayer ) => newLayers[i].id === oldLayer.id )[0];
        if ( tmpOldLayer && newLayers[i].visibility && !tmpOldLayer.visibility ) {
            changedLayers.push( newLayers[i] )
        }
    }
    if ( changedLayers.length === 1 ) {
        const correspondingGroup = getCorrespondingGroup( props, changedLayers[0] ); 
        if ( correspondingGroup && correspondingGroup.exclusiveLayer ) {
            const allLayersInCorrespondingGroup = getLayersInGroup( newLayers, changedLayers[0].group );
            allLayersInCorrespondingGroup.forEach( layer => {
                if ( layer.id !== changedLayers[0].id ) {
                    props.updateLayerVisibility( layer.id, 'layer', {visibility: false} );
                }
            });
        }
    }
}

const checkIfClickedOnGroup = (click) =>{
    if ( click.parentElement.attributes.class.nodeValue.includes("toc-default-group-head") ) {
        if ( click.className.includes("glyphicon-eye-open") ) {
            return {
                "clicked": true,
                "open": true,
            }
        } else {
            return {
                "clicked": true,
                "open": false,
            }
        }                
    } else {
        return {
            "clicked": false,
            "open": null,
        }
    }
}

const getCorrespondingGroup = ( props, layer ) => {
    const corrGr = head(props.groups.filter((group) => isObject(group) && group.id === layer.group));
    if ( corrGr !== undefined ) {
        return corrGr;
    } else {
        return head(props.groups.filter((group) => isObject(group) && group.id === "Default"));
    }
}

const ExclusiveLayerPlugin = connect((state) => ({
    layers: layerSelector(state),
    groups: groupSelector(state),
}), {
    updateLayerVisibility: updateNode,
})(ExclusiveLayer);

export default createPlugin('ExclusiveLayer', {
    component: ExclusiveLayerPlugin,
});