import logging
import requests

from django import template
from django.conf import settings

import xml.etree.cElementTree as ET

logger = logging.getLogger(__name__)

register = template.Library()

geoserver_url = settings.GEOSERVER_LOCATION

def create_wfs_request(request: str, type_name: str):
    return f"{geoserver_url}/ows?service=wfs&version=2.0.0&request={request}&typeName={type_name}"

@register.filter
def get_obj_attr(obj, attr):
    return obj[attr]

def to_dict(member):
    member_dict = {}
    for data in member:
        # ugly .. switch to lxml is an option
        local_name = data.tag.split("}")[-1]
        member_dict[local_name] = data.text
    return member_dict

def parse_data(xml_content):
    root = ET.fromstring(xml_content)
    xpath = "{*}member/{*}*"
    member = root.findall(xpath)
    return list(map(lambda m: to_dict(m), member))

@register.simple_tag
def get_tabular_data(resource, max_features=0):
    type_name = resource.alternate
    url = create_wfs_request("GetFeature", type_name)
    if max_features > 0:
        url += f"&count={max_features}"
    response = requests.get(url)
    return parse_data(response.content)

def parse_attributes(xsd_content, type_name):
    root = ET.fromstring(xsd_content)
    xsd_type = "{type_name}Type".format(type_name=type_name)
    xpath = f"{{*}}complexType[@name='{xsd_type}']/{{*}}*/{{*}}*/{{*}}sequence/{{*}}element"
    elements = root.findall(xpath)
    return list(map(lambda e: e.attrib['name'], elements))

@register.simple_tag
def describe_tabular_data(resource):
    type_name = resource.alternate
    url = create_wfs_request("DescribeFeatureType", type_name)
    response = requests.get(url)
    return parse_attributes(response.content, resource.name)
