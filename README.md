# pino-http-buffer-transport

This pino transport allows to output debug logs only when request has errored.
This way AWS Cloudwatch (or any other log provider) bill will be smaller, as there useless logs will not be outputted.

By default pino logs all logs, unless otherwise specified by log levels. You can ignore debug logs in production by specifying logLevel in options, but it is very useful to have debug logs in production in case any issue happens.

## Dependencies

This library depends on:

- pino-http to attach request context to log objects.
- pino-pretty to prettify logs.

## Usage

You can use this transport in pinoHttp options like so:

```javascript
pinoHttp: {
    quietReqLogger: true,
    genReqId: (req: any) => generateRequestId(), // Your id generation function
    level: 'debug',
    transport: {
        target: 'pino-http-buffer-transport',
        options: {
            logLevelOnlyOnStatus: {
                debug: {
                    statusCode: 500,
                },
                trace: {
                    statusCode: {
                        from: 499,
                        to: 501,
                    },
                },
            },
        },
    },
}
```
