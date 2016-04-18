var hue = require('node-hue-api');  // https://github.com/peter-murray/node-hue-api
var HueApi = hue.HueApi;
var lightState = hue.lightState;
var core = require('nslhome-core');

var PROVIDER_TYPE = "hue-provider";

var provider = core.provider(PROVIDER_TYPE);
var logger = core.logger(PROVIDER_TYPE);

var bridges = [];
var lights = {};

var setDeviceStateFromHueState = function(device, state) {
    device.powerState = state.on;
    device.powerLevel = Math.round(state.bri / 255.0 * 100.0);
    device.hueEffect = state.effect;

    if (state.colormode) {
        switch (state.colormode) {
            case "hs":
                device.hueColor = {
                    "hs": {
                        "hue": state.hue,
                        "sat": state.sat
                    }
                };
                break;
            case "ct":
                device.hueColor = {"ct": state.ct};
                break;
            case "xy":
                device.hueColor = {"xy": state.xy};
                break;
        }
    }
};


var connectBridge = function(bridgeid, ipaddress, apiKey) {
    var api = new HueApi(ipaddress, apiKey);
    api.lights(function(err, result) {
        if (err) return logger.error(err);

        bridges.push(api);

        for (var i in result.lights)
        {
            var l = result.lights[i];

            var light = {
                bridge: api,
                device: {
                    id: provider.name + ":" + bridgeid + ":" + l.id,
                    name: l.name,
                    type: 'light',
                    lightType: 'unknown'
                },
                raw: l
            };

            switch (l.type) {
                case 'Dimmable light':
                    light.device.lightType = 'dimmable';
                    break;
                case 'Extended color light':
                case 'Color light':
                    light.device.lightType = 'hue';
                    break;
            }

            setDeviceStateFromHueState(light.device, l.state);

            lights[light.device.id] = light;

            if (light.device.id != null)
                provider.send({name: 'device', body: light.device});
            else
                console.log("WTF");
        }
    });
};

var findAndConnectBridges = function(apiKey) {
    hue.nupnpSearch(function(err, result) {
        if (err) return logger.error(err);
        logger.info("Hue Bridges Found", result);

        for (var i in result) {
            connectBridge(result[i].id, result[i].ipaddress, apiKey);
        }
    });
};


var providerStarted = function(err, config) {
    if (err) {
        logger.error(err);
        process.exit(1);
    }
    logger.info("initialize with config", config);

    findAndConnectBridges(config.apiKey);
};

provider.on('setDevicePower', function(id, isOn) {
    var light = lights[id];
    if (light) {
        light.bridge.setLightState(light.raw.id, lightState.create().on(isOn), function(err, success) {
            if (success) {
                var update = {
                    id: light.device.id,
                    powerState: isOn
                };

                provider.send({name: 'device', body: update});
            }
            else
                logger.warning("setLightState: failed", err);
        });
    }
    else
        logger.warning("setDevicePower: Unknown device " + id);
});

provider.on('setDeviceState', function(id, state) {
    var light = lights[id];
    if (light) {
        light.bridge.setLightState(light.raw.id, state, function(err, success) {
            if (success) {
                light.bridge.getLightStatus(light.raw.id, function(err, result) {
                    if (err) {
                        return logger.warning("getLightStatus: failed", err);

                        var update = {
                            id: light.device.id
                        };

                        light.raw = result;
                        setDeviceStateFromHueState(update, light.raw.state);

                        provider.send({name: 'device', body: update});
                    }
                });
            }
            else
                logger.warning("setLightState: failed", err);
        });
    }
    else
        logger.warning("setDeviceState: Unknown device " + id);
});

module.exports = exports = start = function(configName) {
    provider.initialize(configName, providerStarted);
};

if (require.main === module) {
    start(process.argv[2]);
}
