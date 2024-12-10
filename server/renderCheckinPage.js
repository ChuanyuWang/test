const { ObjectId } = require('mongodb');
const moment = require('moment/min/moment-with-locales');

exports.getCheckinPage = async function(req, res, next) {
    // skip to 404 page if class ID is not valid
    if (!ObjectId.isValid(req.params.classID)) return next();
    let classes = req.db.collection("classes");
    let pipelines = [{
        $match: {
            _id: ObjectId(req.params.classID)
        }
    }, {
        $lookup: {
            from: "members",
            //localField: "booking.member",
            //foreignField: "_id",
            let: {
                // define the variable "memberList" as empty array when no booking, 
                // otherwise the "$in" operation will throw error in pipeline
                memberList: {
                    $cond: {
                        if: { $isArray: ['$booking.member'] },
                        then: '$booking.member',
                        else: []
                    }
                }
            },
            pipeline: [{
                $match: {
                    $expr: { $in: ["$_id", "$$memberList"] }
                }
            }, {
                $project: { name: 1, contact: 1, _id: 0 }
            }],
            as: "members"
        }
    }, {
        $lookup: {
            from: "teachers",
            localField: "teacher",
            foreignField: "_id",
            as: "teacherInfo"
        }
    }];
    let docs = await classes.aggregate(pipelines).toArray();
    if (docs.length === 0) return next(); //404

    let acceptLang = req.acceptsLanguages().length > 0 ? req.acceptsLanguages()[0] : "zh-cn";
    res.render('bqsq/pages/checkin-table', {
        title: res.__('checkin_table'),
        class_name: docs[0].name,
        class_date: moment(docs[0].date).locale(acceptLang === "zh" ? "zh-cn" : acceptLang).format("lll"),
        class_cost: docs[0].cost,
        members: docs[0].members,
        teacher: docs[0].teacherInfo.find(v => { return v._id.equals(docs[0].teacher); }) || {},
        classroom: req.tenant.classroom.find(v => { return v.id === docs[0].classroom; }) || {}
    });
}
