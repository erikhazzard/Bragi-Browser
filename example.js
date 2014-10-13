"use strict";
// Bragi is defined globally here since this example does not use 
// CommonJS or RequireJS
var BRAGI = window.BRAGI;

// Disable storing stack trace and hide meta info
BRAGI.options.storeStackTrace = false; // NOTE: false by default. Will not work in strict mode if set to true
// Configure showing / hiding meta info
BRAGI.transports.get('Console').property({showMeta: false});

//// To store the stack trace, store it in Bragi and have the logger transport 
//// show it: (NOTE This will not work if strict mode is enabled, and it will
//// add a bit of overhead - you may not want to use this setting in production)
//BRAGI.options.storeStackTrace = true;
//BRAGI.transports.get('Console').property({showMeta: true});

BRAGI.log('group1', 'Hello world');

// Configuring Bragi - Groups
BRAGI.options.groupsEnabled = [ 'group1', 'group2' ];
BRAGI.log('group1', 'I am logged');
BRAGI.log('group2', 'I am logged');
BRAGI.log('group3', 'I am not');

// Enable all logs
BRAGI.options.groupsEnabled = true;

// Note: when logged from a function, the name of the function will be shown
// log some groups
(function logFromFunc (){
    for(var i=1; i<30; i++){
        BRAGI.log('group' + i, 'This is a test for colors. props: %O', {answer: 42});
    }
})();

// History transport demonstration (stores all messages by type)
BRAGI.transports.add( new BRAGI.transportClasses.History( {} ) );

(function(){
    BRAGI.log('error', 'This is an error message');
    BRAGI.log('warn', 'Danger danger');
})();

// Now, history can be accessed via:
var historyGroupName = 'error'; // or whatever group name you want
BRAGI.log('historyExample', historyGroupName + ' history: %O', BRAGI.transports.get('History')[0].history[historyGroupName]);


// --------------------------------------
// addGroup example
// --------------------------------------
BRAGI.transports.remove('History'); // remove history transport
BRAGI.options.groupsEnabled = []; // no groups

BRAGI.log('test1', 'will NOT log');

// enable test1 by called addGroup
BRAGI.addGroup('test1');
BRAGI.log('test1', 'WILL log');

// then remove it
BRAGI.removeGroup('test1');
BRAGI.log('test1', 'will NOT log');
