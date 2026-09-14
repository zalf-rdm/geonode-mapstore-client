import os
import shutil
import zipfile
from io import BytesIO

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from .utils import validate_zip_file
from .admin import ExtensionAdminForm
from .models import Extension
from unittest import mock  # noqa: F401

# Define temporary directories for testing to avoid affecting the real media/static roots
TEST_MEDIA_ROOT = os.path.join(settings.PROJECT_ROOT, "test_media")
TEST_STATIC_ROOT = os.path.join(settings.PROJECT_ROOT, "test_static")


@override_settings(
    MEDIA_ROOT=TEST_MEDIA_ROOT,
    STATIC_ROOT=TEST_STATIC_ROOT,
)
class ExtensionFeatureTestCase(TestCase):
    """
    A comprehensive test case for the MapStore Extension feature, updated to match
    the latest code with constants and new API response structures.
    """

    def setUp(self):
        """Set up the test environment."""
        self.tearDown()
        os.makedirs(TEST_MEDIA_ROOT, exist_ok=True)
        os.makedirs(TEST_STATIC_ROOT, exist_ok=True)
        self.client = APIClient()
        cache.clear()

    def tearDown(self):
        """Clean up the test directories after each test."""
        if os.path.exists(TEST_MEDIA_ROOT):
            shutil.rmtree(TEST_MEDIA_ROOT)
        if os.path.exists(TEST_STATIC_ROOT):
            shutil.rmtree(TEST_STATIC_ROOT)

    def _create_mock_zip_file(self, filename="SampleExtension.zip", add_index_js=True, add_index_json=True):
        """Creates an in-memory zip file for testing uploads."""
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            if add_index_js:
                zf.writestr("index.js", 'console.log("hello");')
            if add_index_json:
                zf.writestr("index.json", '{"name": "test"}')
        zip_buffer.seek(0)
        return SimpleUploadedFile(filename, zip_buffer.read(), content_type="application/zip")

    def test_model_save_derives_name_from_file(self):
        """Test that the Extension.save() method correctly sets the name."""
        mock_zip = self._create_mock_zip_file()
        ext = Extension.objects.create(uploaded_file=mock_zip)
        self.assertEqual(ext.name, "SampleExtension")

    def test_form_prevents_duplicate_names(self):
        """Test that ExtensionAdminForm validation fails for a duplicate name."""
        Extension.objects.create(uploaded_file=self._create_mock_zip_file())
        form_data = {}
        file_data = {"uploaded_file": self._create_mock_zip_file()}
        form = ExtensionAdminForm(data=form_data, files=file_data)
        self.assertFalse(form.is_valid())
        self.assertIn("uploaded_file", form.errors)
        self.assertIn("already exists", form.errors["uploaded_file"][0])

    def test_zip_validator_raises_error_for_invalid_file(self):
        """Test that validate_zip_file raises an error for non-zip files."""
        invalid_file = SimpleUploadedFile("test.txt", b"not a zip file")
        with self.assertRaises(ValidationError) as context:
            validate_zip_file(invalid_file)
        self.assertIn("not a valid zip archive", str(context.exception))

    def test_zip_validator_raises_error_for_missing_required_files(self):
        """Test that validate_zip_file fails if index.js or index.json is missing."""
        missing_js_zip = self._create_mock_zip_file(add_index_js=False)
        with self.assertRaises(ValidationError) as context:
            validate_zip_file(missing_js_zip)
        self.assertIn("must contain index.js and index.json", str(context.exception))

    def test_post_save_signal_unzips_file_and_clears_cache(self):
        """Test that the post_save signal unzips the file and clears the cache."""
        ext = Extension.objects.create(uploaded_file=self._create_mock_zip_file())
        self.assertEqual(ext.name, "SampleExtension")

        expected_dir = os.path.join(TEST_STATIC_ROOT, settings.MAPSTORE_EXTENSIONS_FOLDER_PATH, ext.name)

        self.assertTrue(os.path.isdir(expected_dir), f"Directory {expected_dir} was not created.")
        self.assertTrue(os.path.exists(os.path.join(expected_dir, "index.js")))

    def test_post_delete_signal_removes_files_and_clears_cache(self):
        """Test that the post_delete signal removes files and clears the cache."""
        ext = Extension.objects.create(uploaded_file=self._create_mock_zip_file())
        zip_path = ext.uploaded_file.path
        unzipped_dir = os.path.join(TEST_STATIC_ROOT, settings.MAPSTORE_EXTENSIONS_FOLDER_PATH, ext.name)
        self.assertTrue(os.path.exists(zip_path))
        self.assertTrue(os.path.isdir(unzipped_dir))
        ext.delete()
        self.assertFalse(os.path.exists(zip_path))
        self.assertFalse(os.path.isdir(unzipped_dir))

    def test_extensions_view(self):
        """Test the extensions index API endpoint with isolated static folder."""
        # Create mock uploaded extensions
        Extension.objects.create(name="ActiveExt", active=True, uploaded_file=self._create_mock_zip_file())
        Extension.objects.create(name="InactiveExt", active=False, uploaded_file=self._create_mock_zip_file())

        url = reverse("mapstore-extension")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("ActiveExt", data)
        self.assertNotIn("InactiveExt", data)

    def test_plugins_config_view_structure(self):
        """Test the plugins config API endpoint and its new response structure."""
        mock_file = self._create_mock_zip_file()
        Extension.objects.create(
            name="MapPlugin",
            active=True,
            is_map_extension=True,
            uploaded_file=mock_file,
        )
        Extension.objects.create(
            name="NotAMapPlugin",
            active=True,
            is_map_extension=False,
            uploaded_file=mock_file,
        )

        url = reverse("mapstore-pluginsconfig")

        mock_config_dir = os.path.join(settings.STATIC_ROOT, "mapstore", "configs")
        os.makedirs(mock_config_dir, exist_ok=True)
        with open(os.path.join(mock_config_dir, "pluginsConfig.json"), "w") as f:
            f.write('{"plugins": [{"name": "BasePlugin"}]}')

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("plugins", data)

        plugin_list = data["plugins"]
        plugin_names = {p.get("name") for p in plugin_list}

        self.assertIn("MapPlugin", plugin_names)
        self.assertIn("BasePlugin", plugin_names)
        self.assertNotIn("NotAMapPlugin", plugin_names)

        map_plugin_data = next((p for p in plugin_list if p.get("name") == "MapPlugin"), None)
        self.assertIsNotNone(map_plugin_data)
        self.assertIn("bundle", map_plugin_data)
        self.assertTrue(map_plugin_data["bundle"].endswith("MapPlugin/index.js"))


class DataciteResolverBaseUrlTests(TestCase):
    """
    The DOI resolver base must follow ZALF_DATACITE_BASE_URL (#95).

    DOIs minted against the DataCite test API resolve at handle.test.datacite.org, not
    doi.org, so the frontend cannot hardcode a resolver — it reads this value out of the
    page config.
    """

    def _context(self, authenticated=False):
        from django.contrib.auth import get_user_model
        from django.contrib.auth.models import AnonymousUser
        from django.test.client import RequestFactory

        from .context_processors import _get_datacite_settings

        request = RequestFactory().get("/")
        if authenticated:
            user, _ = get_user_model().objects.get_or_create(username="datacite_resolver_user")
            request.user = user
        else:
            request.user = AnonymousUser()
        return _get_datacite_settings(request)

    @override_settings(ZALF_DATACITE_BASE_URL="https://api.datacite.org/")
    def test_production_api_yields_doi_org(self):
        self.assertEqual("https://doi.org", self._context()["resolver_base_url"])

    @override_settings(ZALF_DATACITE_BASE_URL="https://api.test.datacite.org/")
    def test_test_api_yields_the_test_handle(self):
        """The reported bug: on the test API, doi.org links are dead."""
        self.assertEqual("https://handle.test.datacite.org", self._context()["resolver_base_url"])

    @override_settings(ZALF_DATACITE_BASE_URL="https://api.test.datacite.org/")
    def test_anonymous_callers_get_the_resolver_too(self):
        """
        Landing pages are public, and anonymous readers are the ones following DOI links.
        _get_datacite_settings early-returns for them, so the resolver has to be on that
        branch as well or the fix does nothing for the audience that matters.
        """
        anonymous = self._context(authenticated=False)
        self.assertEqual("https://handle.test.datacite.org", anonymous["resolver_base_url"])
        # the permission flags must keep their safe defaults
        self.assertFalse(anonymous["can_approve"])
        self.assertFalse(anonymous["can_publish"])
        self.assertEqual([], anonymous["prefixes"])

    @override_settings(ZALF_DATACITE_BASE_URL="https://api.test.datacite.org/")
    def test_authenticated_callers_get_the_resolver_too(self):
        self.assertEqual(
            "https://handle.test.datacite.org",
            self._context(authenticated=True)["resolver_base_url"],
        )
