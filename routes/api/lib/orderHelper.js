const db_utils = require('../../../server/databaseManager');

/**
 * The error will be returned instead of thrown.
 * @param {Object} order 
 * @param {String} tenantName 
 */
exports.addReservationByOrder = async function(order, tenantName) {
    try {
        if (order.status !== "success") {
            throw new Error(`order status "${order.status}" is not succcess`);
        }
        let tenantDB = await db_utils.connect(tenantName);
        let classes = tenantDB.collection("classes");
        let session = classes.findOne({ _id: order.classid, "booking.member": { $ne: order.memberid } });
        if (!session) {
            // the reservation has been added or the class been deleted :(
            console.log(`member ${order.name} has already reserved session by order ${order.tradeno}`);
            return false;
        }
        let remaining = getRemaining(session);
        if (order.quantity > remaining) {
            // here is not enough seat to reserve. It should not happen ever.
            console.warn(`order ${order.tradeno} doesn't have enough seat, will reserve anyway`);
        }

        // Will not check the expire date or member status because it's been paid.
        let result = await classes.findOneAndUpdate(
            {
                _id: session._id,
                "booking.member": { $ne: order.memberid }
            },
            {
                $push: {
                    booking: {
                        member: order.memberid,
                        quantity: order.quantity,
                        bookDate: order.timestart,
                        order: order._id
                    }
                }
            },
            { returnDocument: "after" }
        );
        if (!result.value) {
            // the reservation has been added or the class been deleted :(
            // It should not happen ever
            console.warn(`member ${order.memberid} reserved class ${session._id}!!?`);
            return false;
        }
        console.log(`member ${order.name} reserved successfully via order ${order.tradeno}`);
        return true;
    } catch (error) {
        console.error(error);
        return error;
    }
};

/**
 * The error will be returned instead of thrown.
 * @param {String} tradeNo 
 * @param {String} tenantName 
 */
exports.addReservationByTradeNo = async function(tradeNo, tenantName) {
    try {
        if (!tradeNo) {
            throw new Error(`tradeNo "${tradeNo}" is not defined`);
        }
        let tenantDB = await db_utils.connect(tenantName);
        let orders = tenantDB.collection("orders");
        let query = { "tradeno": tradeNo };
        let doc = await orders.findOne(query);
        if (!doc) {
            throw new Error(`Can't find order by trandeNo ${tradeNo}`);
        }
        return exports.addReservationByOrder(doc, tenantName);
    } catch (error) {
        console.error(error);
        return error;
    }
};

function getRemaining(cls) {
    // calculate the remaining
    var booking = cls.booking || [];
    var reservation = 0
    booking.forEach(function(val, index, array) {
        reservation += (val.quantity || 0);
    })
    return cls.capacity - reservation;
}
