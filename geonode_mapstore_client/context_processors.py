# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from django.conf import settings

from geonode.upload.utils import get_max_upload_size, get_max_upload_parallelism_limit
from geonode.utils import get_supported_datasets_file_types


# Resolver used when geonode.zalf is not installed (plain upstream GeoNode).
_DEFAULT_DOI_RESOLVER = "https://doi.org"


def _get_doi_resolver_base_url():
    """
    Base URL DOIs resolve at, derived from ``ZALF_DATACITE_BASE_URL``.

    DOIs minted against the DataCite *test* API do not resolve at doi.org, so the frontend
    cannot hardcode it (#95).  The derivation already exists server-side; this only exposes
    it.  Guarded the same way as ``get_doi_prefixes_for_user`` below, so the client package
    keeps working on a GeoNode without ``geonode.zalf``.
    """
    try:
        from geonode.zalf.api.datacite import doi_resolver_base_url

        return doi_resolver_base_url()
    except ImportError:
        return _DEFAULT_DOI_RESOLVER


def _get_datacite_settings(request):
    """
    Return DataCite publishing info for the current user, embedded directly
    into the page so the frontend needs no extra HTTP round-trip.

    ``can_approve`` (any member of an allowed group) and ``can_publish``
    (group managers only) are derived from group membership — no DataCite API
    call.  ``prefixes`` are fetched from the DataCite API and cached per
    account — they are only fetched when the user can publish.

    ``resolver_base_url`` is included for *every* caller, signed in or not: landing pages
    are public, and anonymous readers are precisely the ones following DOI links.  Returning
    it only on the authenticated branch would leave the reported bug in place for them.
    """
    resolver_base_url = _get_doi_resolver_base_url()

    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return {
            "can_approve": False,
            "can_publish": False,
            "prefixes": [],
            "resolver_base_url": resolver_base_url,
        }

    can_approve = user.can_approve_data_collection()
    can_publish = user.can_publish_data_collection()

    prefixes = []
    if can_publish:
        try:
            from geonode.zalf.api.datacite import get_doi_prefixes_for_user

            prefixes = get_doi_prefixes_for_user(user)
        except ImportError:
            prefixes = []

    return {
        "can_approve": can_approve,
        "can_publish": can_publish,
        "prefixes": prefixes,
        "resolver_base_url": resolver_base_url,
    }


def resource_urls(request):
    """Global values to pass to templates"""
    defaults = dict(GEOAPPS=["GeoStory", "GeoDashboard", "MapViewer"])
    defaults["GEONODE_SETTINGS"] = {
        "MAP_BASELAYERS": getattr(settings, "MAPSTORE_BASELAYERS", []),
        "MAP_BASELAYERS_SOURCES": getattr(settings, "MAPSTORE_BASELAYERS_SOURCES", {}),
        "CATALOGUE_SERVICES": getattr(settings, "MAPSTORE_CATALOGUE_SERVICES", {}),
        "CATALOGUE_SELECTED_SERVICE": getattr(settings, "MAPSTORE_CATALOGUE_SELECTED_SERVICE", None),
        "DASHBOARD_CATALOGUE_SERVICES": getattr(settings, "MAPSTORE_DASHBOARD_CATALOGUE_SERVICES", {}),
        "DASHBOARD_CATALOGUE_SELECTED_SERVICE": getattr(
            settings, "MAPSTORE_DASHBOARD_CATALOGUE_SELECTED_SERVICE", None
        ),
        "CREATE_LAYER": getattr(settings, "CREATE_LAYER", False),
        "DEFAULT_MAP_CENTER_X": getattr(settings, "DEFAULT_MAP_CENTER_X", 0),
        "DEFAULT_MAP_CENTER_Y": getattr(settings, "DEFAULT_MAP_CENTER_Y", 0),
        "DEFAULT_MAP_CRS": getattr(settings, "DEFAULT_MAP_CRS", "EPSG:3857"),
        "DEFAULT_MAP_ZOOM": getattr(settings, "DEFAULT_MAP_ZOOM", 0),
        "DEFAULT_TILE_SIZE": getattr(settings, "DEFAULT_TILE_SIZE", 512),
        "DATASET_MAX_UPLOAD_SIZE": get_max_upload_size("dataset_upload_size"),
        "DOCUMENT_MAX_UPLOAD_SIZE": get_max_upload_size("document_upload_size"),
        "DEFAULT_LAYER_FORMAT": getattr(settings, "DEFAULT_LAYER_FORMAT", "image/png"),
        "DEFAULT_THUMBNAIL_SIZE": getattr(settings, "THUMBNAIL_SIZE", {"width": 500, "height": 200}),
        "MAX_PARALLEL_UPLOADS": get_max_upload_parallelism_limit("default_max_parallel_uploads"),
        "ALLOWED_DOCUMENT_TYPES": getattr(settings, "ALLOWED_DOCUMENT_TYPES", []),
        "LANGUAGES": getattr(settings, "LANGUAGES", []),
        "TRANSLATIONS_PATH": getattr(
            settings,
            "MAPSTORE_TRANSLATIONS_PATH",
            ["/static/mapstore/ms-translations", "/static/mapstore/gn-translations"],
        ),
        "PROJECTION_DEFS": getattr(settings, "MAPSTORE_PROJECTION_DEFS", []),
        "PLUGINS_CONFIG_PATCH_RULES": getattr(settings, "MAPSTORE_PLUGINS_CONFIG_PATCH_RULES", []),
        "EXTENSIONS_FOLDER_PATH": settings.STATIC_URL
        + getattr(settings, "MAPSTORE_EXTENSIONS_FOLDER_PATH", "mapstore/extensions/"),
        "CUSTOM_FILTERS": getattr(settings, "MAPSTORE_CUSTOM_FILTERS", None),
        "TIME_ENABLED": getattr(settings, "UPLOADER", dict()).get("OPTIONS", dict()).get("TIME_ENABLED", False),
        "MOSAIC_ENABLED": getattr(settings, "UPLOADER", dict()).get("OPTIONS", dict()).get("MOSAIC_ENABLED", False),
        "SUPPORTED_DATASET_FILE_TYPES": get_supported_datasets_file_types(),
        "RESOURCE_PUBLISHING": getattr(settings, "RESOURCE_PUBLISHING", False),
        "ADMIN_MODERATE_UPLOADS": getattr(settings, "ADMIN_MODERATE_UPLOADS", False),
        "DATACITE": _get_datacite_settings(request),
    }
    return defaults
