module.exports = function (database) {
    var collection = database.collection("classes");
    return {
        curentWeek : function (callback) {},
        insert : function(item, callback) {
            if (item && item.date) {
                item.date = new Date(item.date);
            }
            collection.insert(item, callback);
        },
        all : function (callback) {
            var classes = db.get().collection("classes");
            classes.find(function (err, docs) {
                if (err) {
                    console.error(err);
                }
                console.log("fetch all classes: " + String(docs[0]));
                console.log(docs);
            })
        },
        recent : function (cb) {
            var collection = db.get().collection('comments')

                collection.find().sort({
                    'date' : -1
                }).limit(100).toArray(function (err, docs) {
                    cb(err, docs)
                })
        }
    }
}
