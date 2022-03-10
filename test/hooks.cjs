const app = require("../app");

// can be async or not
// a global setup fixture is execute once and only once in both parallel and serial mode
exports.mochaGlobalSetup = async function() {
    console.log('--- mocha test started ---');
};

// can be async or not
// a global teardown fixture is execute once and only once in both parallel and serial mode
exports.mochaGlobalTeardown = async function() {
    console.log('--- mocha test completed ---');
    // close the database connection so that testing process could exit
    app.stop();
};