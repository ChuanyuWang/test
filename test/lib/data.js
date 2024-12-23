const testDB = "dummy";
const { ObjectId } = require('mongodb');

const nextMonth = new Date();
nextMonth.setDate(45); // some day in next month

module.exports = {
    testTenant: {
        name: testDB,
        displayName: "Test",
        status: "active",
        feature: "book",
        address: "xxx",
        contact: "123456789",
        version: 5,
        classroom: [
            { "id": "room1", "name": "Room 1" },
            { "id": "room2", "name": "Room 2" },
            { "id": "room3", "name": "Room 3", "visibility": "internal" }]
    },
    adminUser: {
        salt: "2fb1d214ee30ac9a3d97da67be019ab226df40d4ecda02660e2773dbdd930984", hash: "f153dafd85bc7be6a33d10399c3f85d0c9ceaa565d01cc658a753394d9bcbe763c8949e8b5e139383dc26314828b7e3fc319344d34c3e73e8b50a2528d2a36be52b4a7f20f7424bf7e1844049b1d9ebad03c6ab8fca399a486f692603189e6081191b4c2baba227d2d4527f7b61c086839de0cd000ba04db9acbc6f5cf1ba7ac06e43aa0991bee3b6c0ef148429b55a3b6c3dd41d5037a019eb45022433c7406f397574bf388a23a964e9f8270ac72a62fe04435b840225c320483d50413b6749934e93b75a2ac68f38c8b7f850647ea7eb72bb61d1ef871ffb0129063bd2da5ac0efc444511fb24a8c5a95f4526c21843a67a0f05e33e9ffb420ad9ee1823cc388a5d912e4a25ad4276f512ba6ee7be462cd98cc8c2baccbda0b3f33d692bee6cd170e60798bdc083613f663e5cc8547f94fd5088ab7ac28e7068b2cbea3d2621c9c6c7bd69ab63c30db2894e49238040954c49951c71c3e5cff3ac33d44850da2300b06325721672c7ba377855aff888032e31f8ed25c8629e81fd5d4dd9cf7b3d336f6519abdb06d84b766c111b494e78928c8a5fc9948516bfbdc005d0d3d89c663378d36f26fba8ca6c330ae3a070c1cfac532a55473912db9fb4b978769cc21e02d19fa9ba28b211f79df5750a6c5fcc7e99ff90589a69f792f90a4aa0ef60129c7ee47940a90f2b1e98f9d1253fb2ede19507d38956b6cf0fc9ce2c2b",
        username: "admin@dummy", // password: "1"
        tenant: testDB,
        displayName: "test",
        "__v": 0,
        role: "admin"
    },
    user: {
        salt: "dd9ea05b31dec016e5e711c20d932c124cca283236a86bfc69c19ea93de99ba4", hash: "90b191007bbfdca3567f9b94063f156cf1547260d51b19b81eae9766c5a91896d208c72a45fec1577a7d9ea9a0c5cbf16dac5d4c7509795159e935ba6d736f90283f67081d5917ff52c0e3429741602d524e01bc06dea89268d96b4c70bc6d13738eb2999d08c2b271fc19505afcbe7f46178405751d6411d6a0221720f6c74296237ffe775dd0dc19ea4721ee30ed7404260f28adfa3568fd607d7931da57fd36c30ce04a1c3449457cb64249cb41e11e92f5094a35f5ccb8412c273fea87e90c1eee11f0b813ebfd94e5b142f28bdc5badd759400f3cfd642c8526225f54a20e573ed6d1e318a01b87bdab54b0539ffc3b06ec934244b6f8fff9b4af723c25ab75649409c7b4ab5fe8e13efac655df61e1ae38e3b9f865244df8f357cdbed7af603862ad98a4a81b226092810e49b5ebd73afc2084b179117313092dc179382f5b55cfc4c33a47dd731dff4703326e50f8a977401c756b71ea03e286e8047f8655c37c0016592dcecf41a1b6779dda49d36f7273355582eb4d807d19dcb0ac20b437894f7ee55318a72d09d6a584fdbfb267b5b4855f069036a97550b69a387bfce406a6146b52217d415d4a22dda7e010e3fbf72bdba848ba138b27ab4a53d998a1890917c7ca4a3126c557426f609afb6cbbb7865a0b07bc580805f1bb4f4188a1f9db7ba6069b348cab884508408c9fce17bb800c684fa87a251dafe04e",
        username: "user1@dummy", // password: "2"
        tenant: testDB,
        displayName: "test",
        "__v": 0,
        role: "user"
    },
    classes: [
        { "name": "456", "date": new Date("2021-05-23T10:00:00.000Z"), "cost": 1, "capacity": 6, "classroom": "room1", "age": { "min": 24, "max": null }, "booking": [] },
        { _id: ObjectId("6241c5ac95fbe9165c55f5b1"), "name": "money", "date": nextMonth, "cost": 1, "capacity": 6, "classroom": "room1", "age": { "min": 24, "max": null }, "booking": [] }
    ],
    members: [
        { _id: ObjectId("623a8e1c802f1e687c080477"), "name": "John", "contact": "123456789", "status": "active", "membership": [], "since": new Date("2021-05-23T10:00:00.000Z") }
    ],
    orders: [
        { "name": "John", "contact": "123456789", "status": "success", "classid": ObjectId("6241c5ac95fbe9165c55f5b1"), "memberid": ObjectId("623a8e1c802f1e687c080477"), "prepayid": "prepayid1", "tradeno": "20220331000011t" }
    ],
    opportunities: [
        {
            _id: ObjectId("60bcde5c2a8a9af97b27a291"),
            "contact": "13512121115",
            "name": "John",
            "birthday": new Date("2011-06-11"),
            "remark": "remark",
            "since": new Date("2021-07-11"),
            "source": null,
            "status": "open"
        }
    ]
}
