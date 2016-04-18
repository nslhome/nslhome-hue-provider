Philips Hue Provider
=========

NslHome provider for Philips Hue and Friends of Hue

## Installation

`git clone https://github.com/nslhome/nslhome-hue-provider.git`

MongoDB and RabbitMQ configuration should be provided via the environment variables `NSLHOME_MONGO_URL` and `NSLHOME_RABBIT_URL`.

You can optionally use the file `.nslhome.env` to store your configuration.
```
export NSLHOME_MONGO_URL=mongodb://HOST/DATABASE
export NSLHOME_RABBIT_URL=amqp://USERNAME:PASSWORD@HOST
```

## Basic Usage

Provider Config
```
{
    "provider" : "hue-provider",
    "name" : "CONFIG_NAME",
    "config" : {
        "apiKey" : "API_KEY__USE_REGISTER_USER_TO_GET_ONE"
    }
}
```

Run as a standalone application

`node nslhome-hue-provider <CONFIG_NAME>`

Include as a module

`require('nslhome-hue-provider')(CONFIG_NAME)`

## Release History

1.0.0
* Initial Release
