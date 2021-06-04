const connectionManager = require('../../server/databaseManager');
const testData = require("./data");
const testDB = "dummy";

module.exports = {
    init: async function(insertTestData) {
        let configDB = await connectionManager.connect("config");
        await configDB.collection("tenants").updateOne({ name: testDB }, {
            $set: testData.testTenant
        }, { upsert: true });

        await configDB.collection("accounts").updateOne({ tenant: testDB, username: "1" }, {
            $set: testData.adminUser
        }, { upsert: true });

        await configDB.collection("accounts").updateOne({ tenant: testDB, username: "2" }, {
            $set: testData.user
        }, { upsert: true });
        if (insertTestData) {
            let db = await connectionManager.connect(testDB);
            await db.collection("classes").insert(testData.classes);
        }
    },
    addClasses: async function(data) {
        let db = await connectionManager.connect(testDB);
        await db.collection("classes").insert(data);
    },
    addCourses: async function(data) {
        let db = await connectionManager.connect(testDB);
        await db.collection("courses").insert(data);
    },
    addMembers: async function(data) {
        let db = await connectionManager.connect(testDB);
        await db.collection("members").insert(data);
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
                await configDB.collection("accounts").remove({ tenant: testDB });
                await configDB.collection("tenants").remove({ name: testDB });
            }
        } catch (error) {
            console.error(error);
        }
    }
}