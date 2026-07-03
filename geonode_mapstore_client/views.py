import json
import logging
import os

from dateutil import parser
from django.conf import settings
from django.core.cache import cache
from django.http import Http404  # noqa: F401
from django.shortcuts import render
from django.templatetags.static import static  # noqa: F401
from django.urls import reverse
from django.utils.translation.trans_real import get_language_from_request
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


def _parse_value(value, schema):
    schema_type = schema.get("type")
    fmt = schema.get("format")
    if schema_type == "string" and fmt in ["date-time"]:
        if isinstance(value, str):
            try:
                return parser.parse(value)
            except (ValueError, TypeError):
                return value
        return value
    if schema_type == "string":
        if "oneOf" in schema:
            for option in schema.get("oneOf"):
                if option.get("const") == value:
                    return option.get("title")
    return value


def _parse_schema_instance(instance, schema):
    schema_type = schema.get("type")
    metadata = {}
    metadata["schema"] = schema
    if schema_type == "object":
        metadata["value"] = {}
        for key in instance:
            property_schema = None
            if key in schema.get("properties"):
                property_schema = schema.get("properties")[key]
            if instance[key] and property_schema:
                metadata["value"][key] = _parse_schema_instance(instance[key], property_schema)
        return metadata
    if schema_type == "array":
        metadata["value"] = []
        for entry in instance:
            if schema.get("items"):
                metadata["value"].append(_parse_schema_instance(entry, schema.get("items")))
        return metadata
    metadata["value"] = _parse_value(instance, schema)
    return metadata


def metadata(request, pk, template="geonode-mapstore-client/metadata.html"):

    from geonode.base.models import ResourceBase
    from geonode.metadata.manager import metadata_manager
    from geonode.utils import build_absolute_uri

    lang = get_language_from_request(request)[:2]
    schema = metadata_manager.get_schema(lang)
    resource = ResourceBase.objects.get(pk=pk)
    schema_instance = metadata_manager.build_schema_instance(resource, lang)

    full_metadata = _parse_schema_instance(schema_instance, schema)
    metadata_data = full_metadata["value"]
    metadata_groups = {}

    for key in metadata_data:
        if key not in ("extraErrors", "contacts"):
            prop = metadata_data[key]
            ui_options = prop.get("schema", {}).get("ui:options", {})
            group = "General"
            if ui_options.get("geonode-ui:group"):
                group = ui_options.get("geonode-ui:group")
            if group not in metadata_groups:
                metadata_groups[group] = {}
            metadata_groups[group][key] = prop

    if resource.owner:
        metadata_groups["Responsible"] = {
            k: v
            for k, v in {
                "Name": resource.owner.name_long,
                "Email": resource.owner.email,
                "Position": resource.owner.position,
                "Organization": resource.owner.organization,
                "Location": resource.owner.location,
                "Voice": resource.owner.voice,
                "Fax": resource.owner.fax,
            }.items()
            if v and str(v) not in ("None", "")
        }

    metadata_groups["Information"] = {
        "Identification Image": {"type": "thumbnail", "value": resource.thumbnail_url},
        "Projection System": resource.srid,
        "Bounding Box": resource.bbox,
        "Extension X0": resource.bbox_x0,
        "Extension X1": resource.bbox_x1,
        "Extension Y0": resource.bbox_y0,
        "Extension Y1": resource.bbox_y1,
    }

    metadata_groups["References"] = {
        **{
            "Link Online": {
                "type": "link",
                "url": build_absolute_uri(resource.detail_url),
                "text": build_absolute_uri(resource.detail_url),
            },
            "Metadata page": {
                "type": "link",
                "url": build_absolute_uri(reverse("metadata", args=[resource.id])),
                "text": build_absolute_uri(reverse("metadata", args=[resource.id])),
            },
        },
        **{
            link.name: {
                "type": "link",
                "url": link.url,
                "text": f"{resource.title}.{link.extension}",
            }
            for link in resource.link_set.exclude(link_type="html")
        },
    }

    contact_roles_data = []
    try:
        owner = resource.owner
        if owner:
            owner_name = (owner.get_full_name() or "").strip() or owner.username or ""
            contact_roles_data.append(
                {
                    "label": "Owner",
                    "people": [
                        {
                            "name": owner_name,
                            "initial": owner_name[0].upper() if owner_name else "?",
                            "profile_url": f"/people/profile/{owner.username}" if owner.username else None,
                        }
                    ],
                }
            )
        for role_label, contacts in resource.get_defined_multivalue_contact_roles().items():
            people = []
            for p in contacts:
                name = (p.get_full_name() or "").strip() or p.username or ""
                people.append(
                    {
                        "name": name,
                        "initial": name[0].upper() if name else "?",
                        "profile_url": f"/people/profile/{p.username}" if p.username else None,
                    }
                )
            if people:
                contact_roles_data.append({"label": role_label, "people": people})
    except (AttributeError, TypeError, ValueError) as e:
        logger.warning("Could not build contact roles for resource %s: %s", pk, e)
        contact_roles_data = []

    return render(
        request,
        template,
        context={
            "resource": resource,
            "metadata_groups": metadata_groups,
            "contact_roles_data": contact_roles_data,
        },
    )


def metadata_embed(request, pk):
    return metadata(request, pk, template="geonode-mapstore-client/metadata_embed.html")


class ExtensionsView(APIView):
    permission_classes = []

    def get(self, request, *args, **kwargs):
        from geonode_mapstore_client.models import Extension
        from geonode_mapstore_client.utils import (
            MAPSTORE_EXTENSIONS_CACHE_KEY,
            MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        cached_data = cache.get(MAPSTORE_EXTENSIONS_CACHE_KEY)
        if cached_data:
            return Response(cached_data)

        final_extensions = {}
        legacy_file_path = os.path.join(settings.STATIC_ROOT, "mapstore", "extensions", "index.json")

        try:
            with open(legacy_file_path, "r") as f:
                final_extensions = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass

        active_extensions = Extension.objects.filter(active=True)
        dynamic_extensions = {}
        for ext in active_extensions:
            dynamic_extensions[ext.name] = {
                "bundle": f"{ext.name}/index.js",
                "translations": f"{ext.name}/translations",
                "assets": f"{ext.name}/assets",
            }

        final_extensions.update(dynamic_extensions)

        cache.set(
            MAPSTORE_EXTENSIONS_CACHE_KEY,
            final_extensions,
            timeout=MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        return Response(final_extensions)


class PluginsConfigView(APIView):
    permission_classes = []

    def get(self, request, *args, **kwargs):
        from geonode_mapstore_client.models import Extension
        from geonode_mapstore_client.utils import (
            MAPSTORE_PLUGINS_CACHE_KEY,
            MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        cached_data = cache.get(MAPSTORE_PLUGINS_CACHE_KEY)
        if cached_data:
            return Response(cached_data)

        base_config_path = os.path.join(settings.STATIC_ROOT, "mapstore", "configs", "pluginsConfig.json")

        config_data = {"plugins": []}

        try:
            with open(base_config_path, "r") as f:
                config_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass

        plugins = config_data.get("plugins", [])
        existing_plugin_names = {p.get("name") for p in plugins if isinstance(p, dict)}

        map_extensions = Extension.objects.filter(active=True, is_map_extension=True)

        for ext in map_extensions:
            if ext.name not in existing_plugin_names:
                plugins.append(
                    {
                        "name": ext.name,
                        "bundle": f"{ext.name}/index.js",
                        "translations": f"{ext.name}/translations",
                        "assets": f"{ext.name}/assets",
                    }
                )

        cache.set(
            MAPSTORE_PLUGINS_CACHE_KEY,
            config_data,
            timeout=MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        return Response({"plugins": plugins})
