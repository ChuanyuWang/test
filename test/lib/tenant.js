const connectionManager = require('../../server/databaseManager');
const testData = require("./data");
const testDB = "dummy";

let buildInfo = null;

module.exports = {
    name: testDB,
    init: async function(insertTestData) {
        let configDB = await connectionManager.connect("config");
        // print the version of Mongodb
        if (!buildInfo) {
            let adminDB = configDB.admin();
            buildInfo = await adminDB.buildInfo();
            console.log(`Mongodb version: ${buildInfo.version}`);
        }

        await configDB.collection("tenants").updateOne({ name: testDB }, {
            $set: testData.testTenant
        }, { upsert: true });

        await configDB.collection("accounts").updateOne({ tenant: testDB, username: "1" }, {
            $set: testData.adminUser
        }, { upsert: true });

        await configDB.collection("accounts").updateOne({ tenant: testDB, username: "2" }, {
            $set: testData.user
        }, { upsert: true });
        if (insertTestData !== false) {
            let db = await connectionManager.connect(testDB);
            await db.collection("classes").insertMany(testData.classes);
            await db.collection("members").insertMany(testData.members);
            await db.collection("orders").insertMany(testData.orders);
            await db.collection("opportunities").insertMany(testData.opportunities);
        }
    },
    addClasses: async function(data) {
        let db = await connectionManager.connect(testDB);
        await db.collection("classes").insertMany(data);
    },
    addCourses: async function(data) {
        let db = await connectionManager.connect(testDB);
        await db.collection("courses").insertMany(data);
    },
    addMembers: async function(data) {
        let db = await connectionManager.connect(testDB);
        await db.collection("members").insertMany(data);
    },
    clean: async function(cleanConfig) {
        try {
            let db = await connectionManager.connect(testDB);
            let collections = await db.collections();
            for (let i = 0; i < collections.length; i++) {
                console.log(`drop collection "${collections[i].collectionName}" from Db "${testDB}"`);
                await db.dropCollection(collections[i].collectionName);
            }
            if (cleanConfig) {
                let configDB = await connectionManager.connect("config");
                await configDB.collection("accounts").deleteMany({ tenant: testDB });
                await configDB.collection("tenants").deleteMany({ name: testDB });
            }
        } catch (error) {
            console.error(error);
        }
    }
}
