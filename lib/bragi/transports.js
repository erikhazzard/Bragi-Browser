/* =========================================================================
 *  transports
 *      Handles all transports
 *
 * ========================================================================= */
var files = require('./Transports/index');

var transports = {};

for(var file in files){ 
    transports[file] = files[file];
}

module.exports = transports;
