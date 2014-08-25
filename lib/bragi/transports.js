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
