FILE=VERSION
VERSION=`cat $(FILE)`

.PHONY: build geonode package release lint

build:
	npm run dist

geonode: build
	npm run geonode:deploy

package: geonode
	python setup.py sdist bdist_wheel

release: package
	twine upload dist/django-geonode-mapstore-client-$(VERSION).tar.gz

lint:
	black --check geonode_mapstore_client
	flake8 geonode_mapstore_client --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=geonode_mapstore_client/client
	flake8 geonode_mapstore_client --count --max-line-length=120 --extend-ignore=W503 --show-source --statistics --exclude=geonode_mapstore_client/client
