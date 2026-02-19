import os
import json
from django import template
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

register = template.Library()

def _extract_provider_id(providers_dict):
    """
    SOCIALACCOUNT_PROVIDERS = {
      "openid_connect": {
        "OAUTH_PKCE_ENABLED": True,
        "APPS": [
          {
            "provider_id": "the-id-we-want",
            "name": "name",
            "client_id": "client-id",
            "secret": "a-secret",
            "settings": {
                "server_url": "https://example.com/realms/realm-name/.well-known/openid-configuration",
            },
          }
        ]
      }
    }
    """
    if not providers_dict or not isinstance(providers_dict, dict):
        return None

    first_key = list(providers_dict.keys())[0]

    if first_key == "openid_connect":
        apps = providers_dict.get("openid_connect", {}).get("APPS", [])
        if apps and isinstance(apps, list) and "provider_id" in apps[0]:
            return apps[0]["provider_id"]

    return first_key

@register.simple_tag
def get_primary_social_provider():
    """

    Order of evaluation:
    environment variable "SOCIALACCOUNT_PROVIDER"
    → environment variable "SOCIALACCOUNT_PROVIDERS": id of first provider
    → settings.SOCIALACCOUNT_PROVIDER
    → settings.SOCIALACCOUNT_PROVIDERS: id of first provider
    → DEFAULT: "openid_connect"

    """
    env_provider = os.environ.get("SOCIALACCOUNT_PROVIDER")
    if env_provider:
        return env_provider

    env_providers = os.environ.get("SOCIALACCOUNT_PROVIDERS")
    if env_providers:
        try:
            parsed_env_providers = json.loads(env_providers)
        except json.JSONDecodeError as e:
            raise ImproperlyConfigured(f"Invalid JSON in env SOCIALACCOUNT_PROVIDERS: {e}")

        provider_id = _extract_provider_id(parsed_env_providers)
        if provider_id:
            return provider_id

    settings_provider = getattr(settings, "SOCIALACCOUNT_PROVIDER", None)
    if settings_provider:
        return settings_provider

    settings_providers = getattr(settings, "SOCIALACCOUNT_PROVIDERS", None)
    provider_id = _extract_provider_id(settings_providers)
    if provider_id:
        return provider_id

    return "openid_connect"
