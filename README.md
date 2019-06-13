# e2e-key-checker

Refreshes device keys for users on request. Can also be used to show which
devices the homeserver knows about.

## How it works

When the user enters their MXID into the web interface, a web request is
made to the backend. The backend then calls the homeserver's `/keys/query`
endpoint to fetch keys. Homeservers sometimes cache this request, however
they often end up making requests to remote homeservers to fetch keys.

When users encounter problems with encryption, they can use this interface
to have the server update their device list. This can help users on the
homeserver encryption future messages for them.

## Built for t2bot.io

This sort of application is impractical for most use cases because device
lists are normally well synchronized between homeservers. t2bot.io is a
slight exception because it has been ignoring device list updates from
the general federation for the last year, making it out of date on nearly
everyone's devices. To combat this, an application is provided for people
to refresh their devices and fix encryption-capable bots.

**Note**: This uses a custom flag on the `/keys/query` endpoint. See
https://github.com/t2bot/synapse/commit/04c4a95ac0186aa58c23b61f8b811b298c18a5cd
for more information.

## Running

Requires NodeJS 12 or higher.

```
cp config/default.yaml config/production.yaml
nano config/production.yaml
NODE_ENV=production node app.js
```

The frontend is a simple web application which does not need compiling. The
app itself is also a single JavaScript file with very little logic to it.
