/**
 * Hook that returns the current user's DataCite publishing permission and
 * available DOI prefixes.
 *
 * The data is embedded into the page by the Django context processor
 * (geonode_mapstore_client.context_processors.resource_urls) as
 * window.__GEONODE_CONFIG__.localConfig.geoNodeSettings.datacite,
 * so no extra HTTP request is needed.
 *
 * Returns:
 *   prefixes      - array of prefix strings (e.g. ["10.20387"])
 *   loading       - always false (data is synchronously available)
 *   canPublish    - true when the user is a member of an allowed group
 */

const useDatacitePrefixes = () => {
    const datacite = window?.__GEONODE_CONFIG__?.localConfig?.geoNodeSettings?.datacite
        ?? { can_publish: false, prefixes: [] };

    return {
        prefixes: Array.isArray(datacite.prefixes) ? datacite.prefixes : [],
        loading: false,
        canPublish: datacite.can_publish === true
    };
};

export default useDatacitePrefixes;
