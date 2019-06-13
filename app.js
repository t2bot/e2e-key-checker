const express = require("express");
const rateLimit = require("express-rate-limit");
const {MatrixClient, LogService} = require("matrix-bot-sdk");
const config = require("config");
const NodeCache = require("node-cache");

const cache = new NodeCache({stdTTL: 120, checkPeriod: 240});

const limit = rateLimit({
    windowMs: Number(config.get("rateLimit.windowMs")),
    max: Number(config.get("rateLimit.maxReqs")),
});

const app = express();
app.use(express.static('public'));
app.use('/api/', limit); // apply rate limit to API only

const client = new MatrixClient(config.get("homeserver.url"), config.get("homeserver.accessToken"));
client.getUserId().then(userId => {
    LogService.info("app", `Matrix account belongs to ${userId}`);
});

app.get('/api/v1/lookup/:userId', (req, res) => {
    const reqUserId = req.params.userId;
    const skipCache = !cache.get(reqUserId);
    cache.set(reqUserId, "t");

    client.doRequest('POST', '/_matrix/client/r0/keys/query', null, {
        timeout: 30000,
        device_keys: {
            [reqUserId]: []
        },
        "io.t2bot.skip_cache": skipCache,
    }).then(deviceRes => {
        if (deviceRes["failures"] && Object.keys(deviceRes["failures"]).length) {
            LogService.error("app", "Failures: " + JSON.stringify(deviceRes['failures']));
            throw new Error("Failed to download keys");
        }

        const devices = [];
        if (deviceRes['device_keys'] && deviceRes['device_keys'][reqUserId]) {
            for (const deviceId of Object.keys(deviceRes['device_keys'][reqUserId])) {
                const device = deviceRes['device_keys'][reqUserId][deviceId];
                let name = null;
                if (device['unsigned'] && device['unsigned']['device_display_name']) {
                    name = device['unsigned']['device_display_name'].toString();
                }

                devices.push({
                    deviceId: deviceId,
                    name: name,
                });
            }
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(devices));
    }).catch(err => {
        LogService.error("app", err);
        res.setHeader('Content-Type', 'application/json');
        res.status(500);
        res.end(JSON.stringify({error:"Failed to get keys", errcode: "M_UNKNOWN"}));
    });
});

const bindPort = Number(config.get("bind.port"));
const bindAddress = config.get("bind.address");
app.listen(bindPort, bindAddress, () => {
    LogService.info("app", `Ready to serve requests at http://${bindAddress}:${bindPort}`);
});
