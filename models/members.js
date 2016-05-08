module.exports = function (database) {
    var collection = database.collection("members");
    return {
        curentWeek : function (callback) {},
        insert : function(item, callback) {
            var user_query = {
                name : item.name,
                contact : item.contact
            };
            
            collection.findOne(user_query, function(err, doc){
                if (err) {
                    callback(err, null);
                    return;
                }
                
                if (doc) {
                    var error = new Error("会员已经存在");
                    error.code = 2007;
                    callback(error, null);
                    return;
                }

                if (item && item.expire) {
                    item.expire = new Date(item.expire);
                }
                if (item && item.birthday) {
                    item.birthday = new Date(item.birthday);
                }
                if (item && item.since) {
                    item.since = new Date(item.since);
                }
                collection.insert(item, callback);
            });
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
