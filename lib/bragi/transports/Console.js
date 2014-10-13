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
