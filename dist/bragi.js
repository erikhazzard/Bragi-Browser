(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* =========================================================================
 * Bragi (Javascript Logger - Browser)
 *
 * ----------------------------------
 *
 * Distributed under MIT license
 * Author : Erik Hazzard ( http://vasir.net )
 *
 * Provides a LOGGER object which can be used to perform logging
 *      LOGGER.log('group1', 'hello world');
 *
 *      // Also, parasm can be passed in
 *      LOGGER.log('group1', 'message', param1, param2, etc...);
 *      
 *      // And subgroups can be logged
 *      LOGGER.log('group1:subgroup', 'message %j', param1); 
 *      
 * To change logger options:
 *      // Shows ALL messages (false to show none)
 *      LOGGER.options.groupsEnabled = true; 
 *
 *      // Shows only specific groups
 *      LOGGER.options.groupsEnabled = ['error', 'debug']; // only shows passed in groups 
 *
 *      // Can also filter on subgroups
 *      LOGGER.options.groupsEnabled = ['group1:subgroup1']; 
 *
 *      // Or regular expressions
 *      LOGGER.options.groupsEnabled = [/^start:to:end$/]
 *
 * To change storing stack traces (gives more info, but adds a nontrivial amount 
 *      of time), change the `storeStackTrace` property. It is `false` by default
 *
 *      LOGGER.options.storeStackTrace = true;
 *
 * TRANSPORTS
 *      Logs are output / written to a file / pipped to a server by means
 *      of transports
 *
 * ========================================================================= */
var util = require('util');

var canLog = require('./bragi/canLog');

// Transports is an object which we can add / remove transport objects to
var Transports = require('./bragi/transports/Transports');

// transports is an object containing all available transports
var transports = require('./bragi/transports');

// TODO: This should probably be in the transports
var STYLES = require('./bragi/styles');
var SYMBOLS = require('./bragi/symbols');

(function(root, factory) {
    // Setup logger for the environment
    if(typeof define === 'function' && define.amd) {
        // RequireJS / AMD
        define(['exports'], function(exports) {
            root = factory(root, exports);
            return root;
        });
    } else if (typeof exports !== 'undefined') {
        // CommonJS
        factory(root, exports); 
        module.exports = factory();
    } else {
        // browser global if neither are supported
        root.logger = factory(root, {});
    }
}(this, function(root, logger) {

    // --------------------------------------
    //
    // Setup logger object
    //
    // --------------------------------------
    // Here, we use only a single LOGGER object which is shared among all files
    // which import Bragi. 
    // NOTE: Why use a single object? What are benefits? Could expose a "new"
    //  logger object

    // NOTE: It might be useful to have multiple loggers?
    var LOGGER = {
        util: {},

        // reference to canLog function
        canLog: canLog
    };

    // Setup line number / function name logging 
    // --------------------------------------
    LOGGER.util.__stack = function() {
        // Utility to get stack information
        var stack = null;
        try{
            var orig = Error.prepareStackTrace;
            Error.prepareStackTrace = function(_, stack) { return stack; };
            var err = new Error();
            Error.captureStackTrace(err, arguments.callee);
            stack = err.stack;
            Error.prepareStackTrace = orig;
        } catch(e){ }

        return stack;
    };

    // --------------------------------------
    // Expose styles to users
    // --------------------------------------
    LOGGER.util.colors = STYLES.colors;

    // some symbols for the user
    LOGGER.util.symbols = SYMBOLS; 

    // --------------------------------------
    //
    // Setup options
    //
    // --------------------------------------
    LOGGER.options = {
        // default options
        // Primary configuration options
        // ----------------------------------
        // groupsEnabled: specifies what logs to display. Can be either:
        //      1. an {array} of log levels 
        //          e.g,. ['error', 'myLog1', 'myLog2']
        //    or 
        //
        //      2. a {Boolean} : true to see *all* log messages, false to 
        //          see *no* messages
        //
        // groupsEnabled acts as a "whitelist" for what messages to log
        groupsEnabled: true,

        // blackList is an array of log level groups which will always be excluded.
        // Levels specified here take priority over log groups specified in groupsEnabled
        groupsDisabled: [],

        // Store stack trace? Provides more info, but adds overhead. Very useful 
        // when in development, tradeoffs should be considered when in production
        storeStackTrace: false
    };


    // Setup default transports
    // --------------------------------------
    // transports is the transports array the logger users. 
    LOGGER.transports = new Transports();

    // Default transports
    // ----------------------------------
    // NOTE:  see the Console transport for info on the configuration options.
    // NOTE: Do not 
    var _defaultTransports = [
        new transports.Console({
            showMeta: true, 
            showStackTrace: false
        })
    ];

    // Other transports include:
    //      new transports.ConsoleJSON({}) 
    //      
    //      new transports.History({
    //          storeEverything: false
    //      }) 
    //
    //      new transports.File({
    //          filename: '/tmp/test.json'
    //         })

    for(var i=0; i < _defaultTransports.length; i++){
        LOGGER.transports.add( _defaultTransports[i] );
    }

    // Expose a reference to all available transports
    // NOTE: This isn't the cleanest way to do this, could use improvement
    LOGGER.transportClasses = transports;

    // ----------------------------------
    //
    // Group Addition / Removal Functions
    //
    // ----------------------------------
    LOGGER.addGroup = function addGroup ( group ){
        // Add a passed in group (either a {String} or {RegExp}) to the 
        // groupsEnabled array
        
        // If groupsEnabled is true or false, turn it into an array
        var groupsEnabled = LOGGER.options.groupsEnabled;

        if(groupsEnabled === true || groupsEnabled === false){
            LOGGER.options.groupsEnabled = groupsEnabled = [];
        }

        // Ensure it does not exist
        var i=0, len=groupsEnabled.length;
        for(i=0;i<len;i++){
            if(groupsEnabled[i].toString() === group.toString()){
                return LOGGER;
            }
        }

        // Group wasn't found yet, add it
        groupsEnabled.push( group );

        return LOGGER;
    };

    LOGGER.removeGroup = function removeGroup ( group ){
        // Takes in a group and removes all occurences of it from 
        // groupsEnabled
        
        // If groupsEnabled is true or false, turn it into an array
        var groupsEnabled = LOGGER.options.groupsEnabled;

        if(groupsEnabled === true || groupsEnabled === false){
            LOGGER.options.groupsEnabled = groupsEnabled = [];
        }

        // Ensure it does not exist
        var i=0, len=groupsEnabled.length;
        var groupsEnabledWithoutGroup = [];

        for(i=0;i<len;i++){
            if(groupsEnabled[i].toString() !== group.toString()){
                groupsEnabledWithoutGroup.push( groupsEnabled[i] );
            }
        }

        // update the groupsEnabled
        LOGGER.options.groupsEnabled = groupsEnabledWithoutGroup;

        return LOGGER;
    };

    // ----------------------------------
    //
    // UTIL functions
    //
    // ----------------------------------
    LOGGER.util.print = function print(message, color){
        // Utility function for printing a passed in message and giving it some 
        // color
        //
        // Color can be any one of 'red', 'white',', 'grey', 'black', 'blue',
        // 'cyan', 'green', 'magenta', 'red', or 'yellow',
        //
        // It returns a string that is colored based on the passed in color
        // 
        // If no color was passed in, use black
        color = color ? color : 'black';

        return LOGGER.util.colors[color] + message  + LOGGER.util.colors.reset;
    };

    // ----------------------------------
    //
    // LOG function
    //
    // ----------------------------------
    LOGGER.log = function loggerLog(group, message){
        // Main logging function. Takes in two (plus n) parameters:
        //   group: {String} specifies the log level, or log group
        //
        //   message: {String} the message to log. The message must be a single
        //      string, but can have multiple objects inside using `%O`. e.g.,
        //          logger.log('test', 'some object: %O', {answer: 42});
        //
        //   all other parameters are objects or strings that will be formatted
        //   into the message
        //
        var groupsEnabled, groupsDisabled, currentTransport;
        var transportFuncsToCall = [];

        // Check if this can be logged or not. All transports must be checked as
        // well, as they can override LOGGER.options.groupsEnabled 
        // ----------------------------------
        // For each transport, if it can be logged, log it
        for(var transport in LOGGER.transports._transports){
            currentTransport = LOGGER.transports._transports[transport];

            // by default, use the groupsEnabled and groupsDisabled specified in 
            // options
            groupsEnabled = LOGGER.options.groupsEnabled;
            groupsDisabled = LOGGER.options.groupsDisabled;

            // If transport overrides exist, use them
            if(currentTransport.groupsEnabled !== undefined){
                groupsEnabled = currentTransport.groupsEnabled;
            }
            if(currentTransport.groupsDisabled !== undefined){
                groupsDisabled = currentTransport.groupsDisabled;
            }

            // check if message can be logged
            if(canLog(group, groupsEnabled, groupsDisabled)){
                transportFuncsToCall.push( currentTransport );
            }
        }

        // can this message be logged? If not, do nothing
        if(transportFuncsToCall.length < 1){ 
            // Can NOT be logged if there are no transportFuncs to call 
            //
            // If storeAllHistory is not true, return immediately (if it is
            // true, the message will get stored just not passed to any
            // transports)
            if(!LOGGER.options.storeAllHistory){
                return false;
            }
        }

        // get all arguments
        // ----------------------------------
        // remove the group and message from the args array, so the new args array will
        // just be an array of the passed in arguments
        var extraArgs = Array.prototype.slice.call(arguments, 2);
        
        // ----------------------------------
        // Build up a `loggedObject`, a structured object containing log 
        // information. It can be output to the console, to another file, to
        // a remote host, etc.
        // ------------------------------
        var loggedObject = {};
        
        // Caller info
        var caller = null;

        // Only capture caller if storeStackTrace is true.
        // NOTE: This will not work in strict mode, as we cannot access
        // the caller's name
        if(LOGGER.options.storeStackTrace){
            caller = 'global scope';
            if(loggerLog.caller && loggerLog.caller.name){
                caller = loggerLog.caller.name;
            } else if((loggerLog.caller+'').indexOf('function ()') === 0){
                caller = 'anonymous function'; 
            } 
        }

        // Setup properties on the loggedObject based on passed in properties
        // ----------------------------------
        // These are set before any of our library setters to ensure clients do not
        // override properties set by Bragi
        // NOTE: All properties set by Bragi are prefixed with an underscore
        loggedObject.properties = {};
        loggedObject.originalArgs = [];
        
        for(var i=0; i< extraArgs.length; i++){
            // For each argument, we need to check its type. If it's an object, then
            // we'll extend the loggedObject `properties` object 
            // (if there are multiple keys, the last
            // key found takes priority). If it's an array or any other data type,
            // we'll set a new property called `argumentX` and set the value

            if(!(extraArgs[i] instanceof Array) && typeof extraArgs[i] === 'object'){
                for(var key in extraArgs[i]){
                    loggedObject.properties[key] = extraArgs[i][key];
                }
            } else {
                loggedObject.properties['_argument' + i] = extraArgs[i];
            }

            // add to originalArgs array, so we can know by index what args were
            // passed in
            loggedObject.originalArgs.push(extraArgs[i]);
        }

        // setup meta
        // ----------------------------------
        loggedObject.meta = {
            caller: caller,
            date: new Date().toJSON()
        };
        loggedObject.unixTimestamp = new Date().getTime() / 1000;

        var stack = false;
        if(LOGGER.options.storeStackTrace){
            // Store and use stack trace if set. Aides in developing, but adds
            // some overhead
            stack = LOGGER.util.__stack();
            // Currently, getting stack info via this method
            // is unsupported in many browsers
            if(stack){
                var stackLength = stack.length;
                var trace = [];

                for(i=1; i < stack.length; i++){
                    trace.push(stack[i] + '');
                }
                
                loggedObject.meta.file = stack[1].getFileName();
                loggedObject.meta.line = stack[1].getLineNumber();
                loggedObject.meta.column = stack[1].getColumnNumber();
                loggedObject.meta.trace = trace;
            }
        }

        // Setup group, message, other params
        // ----------------------------------
        loggedObject.group = group;

        // Setup the message
        // ----------------------------------
        loggedObject.message = message;

        // Send loggedObject to each transport
        // ----------------------------------
        // The loggedObject is setup now, call each of the transport log calls that
        // can be called
        for(i=0, len=transportFuncsToCall.length; i<len; i++){
            transportFuncsToCall[i].log.call( transportFuncsToCall[i], loggedObject );
        }
    };

    // Expose this to the window
    if(!(typeof define === 'function' && define.amd)) {
        window.BRAGI = LOGGER;
    }
    return LOGGER;
}));

},{"./bragi/canLog":2,"./bragi/styles":3,"./bragi/symbols":4,"./bragi/transports":5,"./bragi/transports/Transports":8,"util":13}],2:[function(require,module,exports){
/* =========================================================================
 *
 * canLog
 *
 *      Function which takes in a gropu and groupsEnabled and returns a {Boolean}
 *      indicating if message can be logged
 *
 * ========================================================================= */
function canLog(group, groupsEnabled, groupsDisabled){ 
    // Check if a passed in group {string} can be logged based on the passed in
    // groupsEnabled ({Array} or {Boolean}). 
    // If the message cannot be logged, return false - otherwise, return true
    //
    //  NOTE: errors will always be logged unless explictly disabled

    if(groupsEnabled === undefined){
        groupsEnabled = true;
    }
    var i,len;

    // by default, allow logging
    var canLogIt = true;

    // First, check for allowed groups (whitelist)
    // ----------------------------------
    if(groupsEnabled === true){
        canLogIt = true;

    } else if(groupsEnabled === false || groupsEnabled === null){
        // Don't ever log if logging is disabled
        canLogIt = false;

    } else if(groupsEnabled instanceof Array){
        // if an array of log levels is set, check it
        canLogIt = false;

        for(i=0, len=groupsEnabled.length; i<len; i++){
            // the current groupsEnabled will be a string we check group against;
            // for instance,
            //      if group is "group1:group2", and if the current log level
            //      is "group1:group3", it will NOT match; but, "group1:group2" 
            //      would match.
            //          Likewise, "group1:group2:group3" WOULD match

            // If the current item is a regular expression, run the regex
            if(groupsEnabled[i] instanceof RegExp){
                if(groupsEnabled[i].test(group)){
                    canLogIt = true;
                    break;
                }
            } else if(group.indexOf(groupsEnabled[i]) === 0){
                canLogIt = true;
                break;
            }
        }
    } 

    // set error and warn to be always on unless explictly disabled
    if(group.indexOf('error') === 0 || group.indexOf('warn') === 0){
        canLogIt = true;
    }

    // Second, check disallowed groups (blacklist)
    if(groupsDisabled && groupsDisabled instanceof Array){
        for(i=0, len=groupsDisabled.length; i<len; i++){
            // Same logic as checking groupsEnabled, just the inverse
            //
            // If the current item is a regular expression, run the regex
            if(groupsDisabled[i] instanceof RegExp){
                if(groupsDisabled[i].test(group)){
                    canLogIt = false;
                    break;
                }
            } else if(group.indexOf(groupsDisabled[i]) === 0){
                canLogIt = false;
                break;
            }
        }
    }

    return canLogIt;
}

module.exports = canLog;

},{}],3:[function(require,module,exports){
/* =========================================================================
 *
 *  styles
 *      Defines styles / colors for logger
 *
 * ========================================================================= */
module.exports = {
    colors: {
        white: '\x1B[37m',
        grey: '\x1B[90m',
        gray: '\x1B[90m',
        black: '\x1B[30m',
        blue: '\x1B[34m',
        cyan: '\x1B[36m',
        green: '\x1B[32m',
        magenta: '\x1B[35m',
        red: '\x1B[31m',
        yellow: '\x1B[33m',
        reset: '\033[0m'
    },
    styles: {
        blink: '\x1B[49;5;8m',
        underline: '\x1B[4m', 
        bold: '\x1B[1m'
    },
    backgrounds: {
        white: '\x1B[47m',
        black: '\x1B[40m',
        blue: '\x1B[44m',
        cyan: '\x1B[46m',
        green: '\x1B[42m',
        magenta: '\x1B[45m',
        red: '\x1B[41m',
        yellow: '\x1B[43m'
    }
};

},{}],4:[function(require,module,exports){
/* =========================================================================
 *
 *  symbols
 *      Defines special symbols used by logger
 *
 * ========================================================================= */
var STYLES = require('./styles');

module.exports = {
    success: STYLES.colors.green + '✔︎ ' + STYLES.colors.reset,
    error: STYLES.colors.red + '✘ ' + STYLES.colors.reset,
    warn: STYLES.colors.yellow + '⚑ ' + STYLES.colors.reset,
    arrow: '➤ ',
    star: '☆ ',
    box: STYLES.colors.yellow + '☐ ' + STYLES.colors.reset,
    boxSuccess: STYLES.colors.green + '☑︎ ' + STYLES.colors.reset,
    boxError: STYLES.colors.red + '☒ ' + STYLES.colors.reset,
    circle: '◯ ',
    circleFilled: '◉ ',
    asterisk: '✢',
    floral: '❧',
    snowflake: '❄︎',
    fourDiamond:'❖',
    spade: '♠︎',
    club: '♣︎',
    heart: '♥︎',
    diamond: '♦︎',
    queen: '♛',
    rook: '♜',
    pawn: '♟',
    atom: '⚛'
};

},{"./styles":3}],5:[function(require,module,exports){
/* =========================================================================
 *  transports
 *      Handles all transports
 *
 * ========================================================================= */
var files = require('./transports/index');

var transports = {};

for(var file in files){ 
    transports[file] = files[file];
}

module.exports = transports;

},{"./transports/index":9}],6:[function(require,module,exports){
/* =========================================================================
 *
 * Console
 *      Default transport - console
 *
 * ========================================================================= */
var STYLES = require('../styles');
var SYMBOLS = require('../symbols');

// In < IE10 console is undefined unless the developer tools have at some 
// point been opened in that tab. However, even after console and console.log
// exist, typeof console.log still evaluate to object, not function, so
// methods like .apply will cause errors
if (window.console && window.console.log) {
    if (typeof window.console.log !== 'function') {
        window.console.log = function () {};
    }
} else {
    window.console = {};
    window.console.log = function () {};
}

// --------------------------------------
//
// Setup group Colors to print
//
// --------------------------------------
GROUP_COLORS = [
    // first is BG color, second is foreground color, third is border
    ['#3182bd', '#ffffff', '#225588'], 
    ['#f38630', '#ffffff'], 
    ['#e0e4cc', '#000000', '#c8cbb6'],
    ['#8c510a', '#ffffff'], 
    ['#35978f', '#ffffff', "#13756d"], 
    ['#c51b7d', '#ffffff'], 
    ['#c6dbef', '#000000'], 
    ['#af8dc3', '#000000'], 
    ['#543005', '#ffffff', "#321002"], 
    ['#7fbf7b', '#000000'], 
    ['#dfc27d', '#000000', "#bda05b"], 
    ['#f5f5f5', '#000000'], 
    ['#e9a3c9', '#000000'], 
    ['#59323C', '#ffffff'], 
    ['#66c2a5', '#000000'], 
    ['#f6e8c3', '#000000'], 
    ['#606060', '#f0f0f0'], 
    ['#8c510a', '#ffffff'], 
    ['#80cdc1', '#000000'], 
    ['#542788', '#ffffff'], 
    ['#FB8AFE', '#343434'],
    ['#003c30', '#ffffff'], 
    ['#e6f598', '#000000'], 
    ['#c7eae5', '#000000'],
    ['#000000', '#f0f0f0'], 
    ['#C3FF0E', '#343434']
];
OVERFLOW_SYMBOLS = [
    'asterisk', 'floral', 'snowflake', 'fourDiamond', 'spade', 'club', 'heart', 
    'diamond', 'queen', 'rook', 'pawn', 'atom' 
];

var BASE_CSS = 'padding: 2px; margin:2px; line-height: 1.8em;';
var META_STYLE = BASE_CSS + 'font-size:0.9em; color: #cdcdcd; padding-left:30px;';

// ======================================
//
// Console Transport
//
// ======================================
function TransportConsole ( options ){
    options = options || {};
    // Transport must set groupsEnabled and groupsDisabled to provide transport 
    // level support for overriding what groups to log
    // (NOTE - the user does not need to pass in groupsEnabled, but the 
    // transport must set these properties)
    this.groupsEnabled = options.groupsEnabled;
    this.groupsDisabled = options.groupsDisabled;

    // Display / meta related config options
    // ----------------------------------
    // Add a line break after the last thing sent?
    this.addLineBreak = options.addLineBreak !== undefined ? options.addLineBreak : false;

    // showMeta: {Boolean} Show the meta info (calling func, time, line num, etc)
    //  `false` by default
    //  NOTE: This is primarily used only if you want to disable everything.
    //  If this is true and showStackTrace 
    //  options will be checked. If it is set to false, nothing will be shown
    this.showMeta = options.showMeta !== undefined ? options.showMeta : false;

    // showStackTrace: {Boolean} provide the full stack trace? Enabled by default,
    // but will only be shown if meta is shown
    this.showStackTrace = options.showStackTrace !== undefined ? options.showStackTrace: true;

    // Transport specific settings
    // ----------------------------------
    this.showColors = options.showColors === undefined ? true : options.showColor;

    this._foundColors = [];
    this._colorDict = { 
        error: BASE_CSS + 'background: #ff0000; color: #ffffff; font-style: bold; border: 4px solid #cc0000;',
        warn: BASE_CSS + 'padding: 2px; background: #ffff00; color: #343434; font-style: bold; border: 4px solid #cccc00;'
    };

    this.curSymbolIndex = 0;

    return this;
}

TransportConsole.prototype.getColor = function getColor(group){
    // Color Formatting
    // ----------------------------------
    // Returns the background color for a passed in log group
    // TODO: if more found colors exist than the original length of the
    // COLOR array, cycle back and modify the original color
    //
    var color = '';
    var baseColor = '';
    var curSymbol;
    var cssString = '';

    // For color, get the first group
    group = group.split(':')[0];

    // if a color exists for the passed in log group, use it
    if(this._colorDict[group]){ 
        return this._colorDict[group];
    }

    if(this._foundColors.length >= GROUP_COLORS.length){
        // is the index too high? loop around if so
        color = GROUP_COLORS[this._foundColors.length % GROUP_COLORS.length];
        baseColor = color;

        // add underline if odd
        // ------------------------------
        cssString += 'font-style: italic;';

    } else {

        // We haven't yet exhausted all the colors
        color = GROUP_COLORS[this._foundColors.length];
    }

    var borderColor = color[2];
    // If no border color was provided, just bring all values down by 3
    // and use the result
    if(!color[2]){
        borderColor = '#';
        for(var i=1; i<color[0].length; i++){
            borderColor += (
                (Math.max( 0, (parseInt(color[0][i], 16) - 2) )).toString(16)
            );
        }
    }


    cssString += BASE_CSS + 
        "background: " + color[0] + ";" +
        "border: 1px solid " + borderColor + ";" + 
        "color: " + color[1] + ";";

    // update the stored color info
    this._foundColors.push(color);
    this._colorDict[group] = cssString;

    return cssString;
};


// Prototype properties (All these must exist to be a valid transport)
// --------------------------------------
TransportConsole.prototype.name = 'Console';

TransportConsole.prototype.log = function transportConsoleLog( loggedObject ){
    // log
    //  Logs a passed object to the console
    //
    //  params:
    //      loggedObject: {Object} the log object to log
    //      options : {Object} the logger options
    //
    // Setup message for console output
    // ------------------------------
    //  The final message will look like: 
    //      [ group ]      message 
    //      meta info (function caller, time, file info)
    //
    var consoleMessage = "";
    if(this.showColors){
        consoleMessage += "%c";
    }

    // Setup final log message format, depending on if it's a browser or not
    // ------------------------------
    consoleMessage += 
        "[ " + 
            loggedObject.group + ' ' + 
        " ] \t";

    // NOTE: Use the full styledMessage property
    consoleMessage += loggedObject.message + ' \t'; 

    // add line break to console messages if set
    if(this.addLineBreak){ 
        consoleMessage += '\n';
    }

    // Setup final log array to call console.log with
    var toLogArray = [];
    toLogArray.push(consoleMessage);

    if(this.showColors){
        toLogArray.push(this.getColor(loggedObject.group));
    }
    toLogArray = toLogArray.concat(loggedObject.originalArgs);

    // Log it
    // ------------------------------
    console.log.apply( console, toLogArray );

    // ----------------------------------
    // Log meta info?
    // ----------------------------------
    var metaConsoleMessage = '';
    var metaLogArray = [];

    if(this.showMeta){
        // push style for meta if there is meta
        if(this.showColors){
            metaConsoleMessage += '%c'; 
        }

        // JSON timestamp
        metaConsoleMessage += new Date().toJSON() + ' \t \t ';

        // Show the name of the calling function
        if(loggedObject.meta.caller){
            metaConsoleMessage += 'caller: ' + loggedObject.meta.caller + ' \t \t ';
        }

        // For node, log line number and filename
        if(loggedObject.meta.file && loggedObject.meta.line ){
            metaConsoleMessage +=  loggedObject.meta.file +
                ':' + loggedObject.meta.line +
                ':' + loggedObject.meta.column +
                '';
        }
    }

    if(this.showMeta && this.showStackTrace && loggedObject.meta.trace){ 
        // Show full stack trace if set
        // --------------------------
        metaConsoleMessage += '\n' + 
            '(Stack Trace)' +
            '\n';
        
        // Skip the first item in the stack (this function)
        for(i=0; i<loggedObject.meta.trace.length; i++){
            metaConsoleMessage += '\t' + 
                loggedObject.meta.trace[i] + '\n';
        }
    }

    // push style for meta if there is meta
    if(this.showMeta && this.showColors){
        metaLogArray.push(metaConsoleMessage);
        metaLogArray.push(META_STYLE);
    }

    if(metaLogArray.length > 0){
        console.log.apply(console, metaLogArray);
    }

    return this;
};

module.exports = TransportConsole;

},{"../styles":3,"../symbols":4}],7:[function(require,module,exports){
/* =========================================================================
 *
 * History
 *      Logs to console, but just outputs raw JSON
 *
 * ========================================================================= */
function TransportHistory ( options ){
    options = options || {};

    this.groupsEnabled = options.groupsEnabled;
    this.groupsDisabled = options.groupsDisabled;

    // Store *everything*?
    this.storeEverything = false;
    if(options.storeEverything === true){
        this.storeEverything = true;

        // Also, log *everything*
        this.groupsEnabled = true;
    }

    // Set history size per log group
    //  NOTE: if historySize is 0 or false, it has no limit
    this.historySize = options.historySize !== undefined ? options.historySize : 200;

    // History object
    this.history = {};

    return this;
}

// Prototype properties (All these must exist to be a valid transport)
// --------------------------------------
TransportHistory.prototype.name = 'History';

TransportHistory.prototype.log = function transportHistoryLog( loggedObject ){
    // log
    //  Logs a passed object to the console
    //
    //  params:
    //      loggedObject: {Object} the log object to log
    //      options : {Object} the logger options
    //
    // Setup message for console output
    // ------------------------------
    // store the key by the first root group
    var group = loggedObject.group.split(':')[0];

    // Keep track of message
    if(this.history[group] === undefined){
        this.history[group] = [];
    }

    // store the key by the first root group
    this.history[group].push(loggedObject);

    // Trim history
    if(this.historySize > 0 && 
       this.history[group].length > this.historySize
    ){
        this.history[group].shift();
    }

    return this;
};

module.exports = TransportHistory;

},{}],8:[function(require,module,exports){
/* =========================================================================
 *
 * Transports
 *      Transports is an object which contains transports the logger uses
 *      to output logs
 *
 * ========================================================================= */
function Transports (){
    // This function is used by Bragi to keep track of what the currently
    // enabled transports to be used are
    
    this._transports = {};

    // Contains a count of # of transports by type
    this._transportCount = {};
    
    return this;
}

// ======================================
//
// access
//
// ======================================
Transports.prototype.get = function get( transportName ){
    // Returns a transport object that matches the passed in name
    var returnedTransportObjects = new Array();

    for(var key in this._transports){
        // If the name is part of of the key, remove it
        if(key.toLowerCase().indexOf(transportName.toLowerCase()) > -1){
            returnedTransportObjects.push(this._transports[key]);
        }
    }

    returnedTransportObjects.property = function transportProperty( keyOrObject, value ){
        // Allow `.property()` to be called, which will return an array of 
        // values if just the `keyOrObject` is passed in. If `value` is also passed in 
        // as a string, it will set all returned transports's key to that value
        //
        // An object containing property keys and values can also be passed in
        // as the first and only argument to set multiple properties at once
        //
        // example calls: .property( 'showMeta', true );
        //                .property( {showMeta: true} );

        var i = 0;
        var len = this.length;

        if(typeof keyOrObject === 'string' && value === undefined){
            // Getter called. called like `.property('showMeta');`
            var vals = [];
            for(i=0; i<len; i++){ 
                vals.push(this[i][keyOrObject]);
            }
            return vals;

        } 
        else if( typeof keyOrObject === 'string' && value !== undefined ){
            // Setter called. called like `.property('showMeta', true);`
            for(i=0; i<len; i++){ 
                this[i][keyOrObject] = value;
            }
        }
        else if( typeof keyOrObject === 'object' ){
            // Object passed in like `.property( {showMeta: true} )`
            for(i=0; i<len; i++){ 
                for( var keyName in keyOrObject ){
                    this[i][keyName] = keyOrObject[keyName];
                }
            }
        }

        return this;
    };

    return returnedTransportObjects;
};

// ======================================
//
// Add / Remove
//
// ======================================
Transports.prototype.add = function add( transport ){
    // Takes in a transport object and adds it to the transport object.
    //  If a transport object already exists (e.g., if there are two "File"
    //  transports already), the transport name will be transport.name + number

    if(this._transportCount[transport.name] === undefined){
        // Transport does not yet exist
        this._transportCount[transport.name] = 1;
        this._transports[transport.name] = transport;
    } else {
        // Transport already exists
        this._transportCount[transport.name] += 1;
        this._transports[transport.name + '' + (this._transportCount[transport.name] - 1)] = transport;
    }

    return this;
};

Transports.prototype.remove = function remove( transportName, index ){
    // Takes in the name of a transport (e.g., Console) and an optional index.
    // If no index is passed in, all transports that match the name will be 
    // removed. If an index is passed in, only the index will be removed. e.g.,
    // if there are two `File` transports, passed in index `1` will remove the
    // second file transport

    transportName = transportName;
    // if a transport object was passed in, remove the transport by name
    if(transportName.name){ transportName = transportName.name; }

    for(var key in this._transports){
        if(index !== undefined){
            if((transportName + '' + index) === key){
                delete this._transports[key];
            }
        } else {
            // If the name is part of of the key, remove it
            if(key.indexOf(transportName) > -1){
                delete this._transports[key];
            }
        }
    }

    return this;
};

Transports.prototype.empty = function empty (){
    // Removes all transports
    for(var key in this._transports){
        delete this._transports[key];
    }

    return this;
};

module.exports = Transports;

},{}],9:[function(require,module,exports){
/* =========================================================================
 *
 * index.js
 *      Exports all available transports
 *
 * ========================================================================= */
module.exports.Console = require('./Console');
module.exports.History = require('./History');

},{"./Console":6,"./History":7}],10:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],11:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],12:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],13:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":12,"_process":11,"inherits":10}]},{},[1]);
