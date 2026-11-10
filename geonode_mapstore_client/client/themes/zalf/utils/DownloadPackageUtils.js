/**
 * CUSTOM PATH: themes/zalf/utils/DownloadPackageUtils.js
 * REASON: map download packages (zalf-rdm/geonode#659): one ZIP per published
 * data collection, served from S3 through /api/v2/maps/<pk>/download_package/download/.
 */

export const downloadPackageUrl = (pk) => `/api/v2/maps/${pk}/download_package/`;

/**
 * Whether the backend has the feature switched on (ZALF_DOWNLOAD_PACKAGE_ENABLED).
 * The state endpoint answers `enabled: false` while it is off; an older backend
 * without the field is treated as on.
 */
export function packagesEnabled(pkg) {
    return pkg?.enabled !== false;
}

/**
 * The map's package download, or null when there is nothing to download yet.
 * A package with an asset stays downloadable while a rebuild runs, since the
 * previous file keeps being served until the new one replaces it.
 */
export function getPackageDownload(pkg) {
    if (!pkg || !packagesEnabled(pkg) || !pkg.asset_id || !pkg.download_url) {
        return null;
    }
    return { href: pkg.download_url, size: pkg.size || null };
}
