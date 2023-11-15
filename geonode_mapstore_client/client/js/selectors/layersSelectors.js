import isObject from 'lodash/isObject';

function filterLayers(layer) {
    return layer.group !== 'background' ? layer : undefined;
}

export const layerSelector = (state) => {
    return state.layers.flat.filter(layer => filterLayers(layer));
};

const returnGroup = (groups) => {
    if ( Array.isArray(groups) ) {
        const listOfGroups = [];
        let getGroups = (list) => {
            list.forEach(element => {
                if ( isObject(element) ) {
                    listOfGroups.push(element);
                    if ( element.nodes ) {
                        getGroups(element.nodes);
                    }
                }
            });
        }        
        getGroups(groups);
        return listOfGroups;
    } else {
        return [];
    }
}

export const groupSelector = (state) => {
    return returnGroup(state.layers.groups);
}

export const getStyleeditor = (state) => {
    return state.styleeditor;
}