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
