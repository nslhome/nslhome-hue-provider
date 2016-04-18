var hue = require('node-hue-api');
var HueApi = hue.HueApi;

var description = "nslhome hue-provider";
var api = new HueApi();

hue.nupnpSearch(function(err, result) {
    if (err) return console.error(err);
    console.log("Hue Bridges Found: " + JSON.stringify(result));

    for (var i in result) {
        var bridge =  result[i];
        api.registerUser(bridge.ipaddress, description, function(err, user) {
            if (err) return console.error(err);
            console.log("Created user: " + JSON.stringify(user));
        });
    }
});


