# Bragi : Javascript Logger - Browser
![Bragi](https://s3.amazonaws.com/vasir-assets/bragi/bragi-log-browser.gif)

**This is for the browser. [View the NodeJS version](https://github.com/enoex/Bragi-Node)**

*NOTE : This is an early release and the API is subject to change. This is designed for Chrome and some features (e.g., color) will not work in all browsers. The API is likely to change. Improvements and pull requests are welcome. [View the post which describes the purpose behind this library and some of its features](http://vasir.net/blog/development/how-logging-made-me-a-better-developer)*

Bragi is javascript logging library with colors, custom log levels, and server reporting functionality. Bragi allows you to write log messages that you can leave in your code, and allows you to specify what logs get output to the console.

This repository is for the Web Browser version of Bragi. [Access the NodeJS version](https://github.com/enoex/Bragi-Node)

![Bragi](http://38.media.tumblr.com/tumblr_lcdao4PDgj1qbz35lo1_500.jpg)

*Bragi is the Norse god of Poetry*

# Installation and Usage

Pre-built Bragi files are located in `dist`. Bragi supports CommonJS, RequireJS, or just including the script in your code. 


## Base usage (without CommonJS / Browserify or RequireJS)
If CommonJS or RequireJS are not used, when including Bragi a global `BRAGI` object will be exposed globally.

```javascript
// If exposed globally
BRAGI.log('groupname', 'message');
```

## Browserify / CommonJS
If using Browserify, install this with NPM: `npm install bragi-browser`. Then, you can 

```javascript
var logger = require('bragi-browser');
logger.log('group', 'hello there');
```

## RequireJS
You can require it and use it like other modules (use bragi.js or bragi.min.js).


# Logging
Calls to `log` take in two required parameters: `groupName` and `message`. Any additional parameters (such as object info) will be included in the log message also. For instance:
    
```javascript
BRAGI.log('groupname', 'Here is some user info', { name: 'Ironman', weaknesses: null });
```

One of the benefits Bragi provides is the ability to supply arbitrary group names and namespace for groups (separated by a colon). For instance:

```javascript
BRAGI.log('userController:fetchInfo', 'fetching user information...');
```

Because the groupname is a string, you can dynamically create it:
    
```javascript
BRAGI.log('userController:fetchInfo:ironman', 'fetching user information...');
```

With group names, we're able to filter messages by groups and their namespaces, or by a regular expression (e.g., we have the ability to show ALL logs for the `ironman` user)

## Log Groups (log levels)
Unlike other libraries where log levels are linear, in Bragi log levels are discrete and arbitrary. You can have nested log levels, e.g.: `BRAGI.log("group1:subgroup1", "Log message %O", {key: 42});`. 

By having arbitrary log levels, you can have fine grain control over what log messages are outputted. 

## Specifying what to log

`groupsEnabled`: An {Array} of {String}s or {RegExp} regular expressions, specifying which groups can be logged. NOTE: Can also be a {Boolean} : if `true`, *everything* is logged; if `false`, nothing is logged

`groupsDisabled`: An {Array} of {String}s {RegExp} regular expressions, specifying which groups to exclude from logging. This is useful if you want to log everything *except* some particular groups.


These properties can be accessed directly via `BRAGI.options.groupsEnabled` or `BRAGI.options.groupsDisabled`.


### addGroup() and removeGroup()

It's possible to modify the groups directly, but often it's simpler to call addGroup or removeGroup. You can pass in either a string or a regular expression. For instance:
    
    BRAGI.addGroup('myGroup');
    BRAG.removeGroup('myGroup');

Note that the first time `addGroup` is called, Bragi will no longer log everything by default. 

**Examples**:
Now, let's enable all `group1:subgroup1` logs and any log message that contains the user ironman, denoted by `:ironman`:

```javascript
BRAGI.options.groupsEnabled = [ 'group1:subgroup1', '.*:ironman' ]
```

The this would log all `group1:subgroup1` logs, including nested subgroups: for instance, `group1:subgroup1:subsubgroup1`. 

`.*:ironman` would match anything that contained ":ironman" (You could even dynamically build this to look for logs based on some variable).

To specify a blacklist, use `groupsDisabled`. This would log everything *except* `group1`:

```javascript
BRAGI.options.groupsEnabled = true; 
BRAGI.options.groupsDisabled = ['group1'];
```

### Built in log types
Currently only two built in log types exist: `error` and `warn`. These types can also be namespaced (e.g., `error:group1:subgroup1` is valid). For error messages, the background will always be red and the foreground white. For warn messages, the background is yellow and foreground is white. The text will also blink. These are reserved colors, so anywhere a red background and white text exist you can immediately know an error has been logged.

Note that if you want to include these, you'll need to specify "error" and "warn" in the `groupsEnabled` array.

### Examples
See `example.html` for example usage.

## Util
Bragi provides a utility functions to help you write logs messages that have strong visual cues.

* `BRAGI.util.symbols` : This is a dictionary of UTF-8 symbols - such as `success` (a green ✔︎) and  `error` (a red '✘'). All the symbols can be viewed in `lib/bragi/symbols.js`

# Configuration

## Bragi config ##
To configure bragi, require it then set the properties defined in the `options` object. For instance:

```javascript
BRAGI.options.PROPERTY = VALUE;
```

The available options are:

* `groupsEnabled`: An array of {Strings} or {RegExp} (regular expressions) specifying which groups to log - which messages will be sent to all available transports
* `groupsDisabled`: An array of {Strings} or {RegExp} (regular expressions) specifying which groups to exclude from logs. This acts a blacklist, and will take priority over logs defined in `groupsEnabled`.
* `storeStackTrace`: `false` by default. Will store the stack trace if set to `true`. This provides more info, but adds overhead. Very useful when in development, tradeoffs should be considered when in production


# Output - Transports

The web browser version of Bragi currently supports logging to Console and storing History. Coming soon is the ability to send the file to remote hosts.  Other possible transports could include writing logs to LocalStorage or IndexedDB

## Changing Transports

Currently, you can use `BRAGI.transports.empty();` to remove all transports.

To add a transport, use `BRAGI.transports.add( new BRAGI.transportClasses.Transport( {} ) )` (where Transport is a transport, found in `lib/bragi/transports/`).

Currently available transports are `Console` and `History`

## Configuring Transports

All transports take in, at a minimum, `groupsEnabled` and `groupsDisabled`. This allows transport level configuration of what log messages to use. By default, they will use whatever is set on the global logger object. This is useful, for instance, if you want to send *all* logs to a remote host but only want to show error logs in the console output.

To configure a transport that is already added to the logger, you can use `BRAGI.transports.get("TransportName");`. Note that this returns an {Array} of transports (this is because you may have multiple transports of the same type - e.g., it's possible to have multiple File transports).

### Setting properties 
To set properties, you can:

1. access a transport object individually (e.g., `BRAGI.transports.get('console')[0].PROPERTY= VALUE`) or 
2. set options for ALL returned transports by calling `.property( key, value )`. 

For instance, to show the stack trace in the console output: `BRAGI.transports.get('console').property('showStackTrace', true);`

If only a key is passed in, it acts as getter (and returns an array of values). If key and value are passed in, it will set the property for *each* returned transports. NOTE: This is useful when you have a single transport, just be aware that if you use this on a file transport and change the output path, and you have multiple files transports, all file transports would log to that file.

See `examples/example-simple.json` (or `test/test.js`) for example usage.


### Console Transport - Configuration

`showMeta`: {Boolean} `true` by default. Specifies whether to show the meta info (caller, time, etc.) as a new line after each message
`showStackTrace`: {Boolean} `false` by default. If set to true, requires the logger's `storeStackTrace` to be set to {true}. Will print the stack trace for each log

## Writing Custom Transports

All transports must be functions that containg a prototype a prototype `name` property and `log` function. The transport function itself must take in an options object and allow `groupsEnabled` and `groupsDisabled` to be passed into it. This allows transport level white listing / black listing of log groups (for instance, maybe the console should only capture `group1`, but the file transport should capture *all* log messages)

The `log` function expects a `loggedObject` to be passed into it, which is an object created after log() is called. It will have a `meta` property, along with a `message` (the log message itself), a `group` (what group the log message belongs to), and a `properties` key containing any additional arguments passed into BRAGI.log() calls.

NOTE: See `examples/example-json.js` to see what a loggedObject looks like.

Here is what a simple transport definition looks like:

```javascript
function MyTransport ( options ){
    options = options || {};

    // Transport must set groupsEnabled and groupsDisabled to provide transport 
    // level support for overriding what groups to log
    // (NOTE - the user does not need to pass in groupsEnabled, but the 
    // transport must set these properties)
    this.groupsEnabled = options.groupsEnabled;
    this.groupsDisabled = options.groupsDisabled;

    // Transport specific settings
    // ------------------------------
    this.spacing = options.spacing === undefined ? 4 : options.spacing;

    return this;
}

MyTransport.prototype.name = 'MyTransport';
MyTransport.prototype.log = function MyTransportLog( loggedObject ){
    // Do something with loggedObject 
    return this;
};
```


See `lib/bragi/transports/ConsoleJSON` for a simple example of a working transport.

## Running Tests

While Bragi itself has no dependencies, the tests depend on Mocha and Chai. Install dev dependencies (`npm install -d`). Run `npm test`

# Building Yourself

To build Bragi yourself, run `npm install -d` to setup the build dependencies. Then, run `make`.  The files will be output to the `dist` folder.

# Ideas Behind Bragi

Some of the core concepts driving Bragi are:

* By design, there should be many calls to log() inside the application’s codebase and these calls should never need to be removed. 

* Log output should not be coupled to calls to log(). It should be easy to send the output of log() calls to the console, to a file, or to a remote host. It should even be simple to have the library send your phone a push notifications for certain types of logs.

* Logs messages should be structured data - for Bragi, all calls to log() should produce a JSON object with the logged message and some meta info. This makes working with logs easier and allows better integration with third party services like Graylog or Kibana

* The logging library should itself not care what you do with the logs, but enable you to effortlessly do whatever you wish with them.


## Usefulness of logging

[View an overview of how logging can be a powerful tool](http://vasir.net/blog/development/how-logging-made-me-a-better-developer).

Logging is a powerful and often underused tool. Like anything, there are tradeoffs. Some of the benefits of persisting log statements in your code include:

* Doubles as explicit documentation. In some ways, they're like actionable comments
* Makes it significantly easier to debug the flow of execution
* Aides in refactoring
* Helps you to maintain context of what your code is doing



Happy logging!
