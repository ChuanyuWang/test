const serverPromise = require("../app");

// can be async or not
// a global setup fixture is execute once and only once in both parallel and serial mode
exports.mochaGlobalSetup = async function() {
    console.log('--- mocha test started ---');
    // wait 1 second for database connection establishing
    await new Promise(r => setTimeout(r, 1000));
};

// can be async or not
// a global teardown fixture is execute once and only once in both parallel and serial mode
exports.mochaGlobalTeardown = async function() {
    console.log('--- mocha test completed ---');
    // close the database connection so that testing process could exit
    let app = await serverPromise;
    app.stop();
};
