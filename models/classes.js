var db = require('../db');

exports.all = function (cb) {
    var classes = db.get().collection("classes");
    classes.find(function (err, docs) {
        if (err) {
            console.error(err);
        }
        console.log("fetch all classes: " + String(docs[0]));
        console.log(docs);
    })
}

exports.recent = function (cb) {
    var collection = db.get().collection('comments')

        collection.find().sort({
            'date' : -1
        }).limit(100).toArray(function (err, docs) {
            cb(err, docs)
        })
}
