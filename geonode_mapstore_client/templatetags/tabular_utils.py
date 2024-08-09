import logging
from django import template

logger = logging.getLogger(__name__)
register = template.Library()


@register.simple_tag()
def is_tabular(resource):
    if resource.subtype == "tabular":
        return True
    elif resource.resource_type == "map":
        # TODO
        from geonode.maps.models import Map
        map = Map.objects.get(id=resource.id)
        # alternative route for tabular data collection
        tabular_data_collection = False
        for layer in map.datasets:
            tabular_data_collection = layer.subtype == "tabular"
            if not tabular_data_collection:
                break
        return tabular_data_collection
    else:
        return False
