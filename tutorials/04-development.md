
### Develop with a remote GeoNode instance

This setup allows to develop only the GeoNode MapStore  javascript applications.

- clone the repository in your workspace:

```
git clone --recursive https://github.com/GeoNode/geonode-mapstore-client.git
```

- navigate to the client directory

```
cd geonode-mapstore-client/geonode_mapstore_client/client/
```

- create an .env file in the client directory

```
touch .env
```

- add following variables to the .env file (example)

```
DEV_SERVER_PROTOCOL=https
DEV_SERVER_HOSTNAME=localhost
DEV_SERVER_PORT=8081
DEV_TARGET_GEONODE_HOST=mygeonodeinstance.org
```

`DEV_SERVER_HOSTNAME` and `DEV_SERVER_PORT` are sent to GeoNode as the `Host`
header, and GeoNode builds the OIDC `redirect_uri` from it. They must therefore
name the address you open in the browser, and that address must be registered as
a valid redirect URI on the Keycloak client — otherwise login fails with
`Invalid parameter: redirect_uri`, or returns to a port nothing is serving.

Note that `env.json` holds similar keys under different names; it is not read by
`devServer.js`, so changing it has no effect on the development proxy.

- install all package dependencies with the command

```
npm install
```

- Start the development application locally

```
npm start
```

Now open the url `https://localhost:8081/` to work on the client.

Note: the protocol of the local development url change based on the target instance of GeoNode defined in the .env file
