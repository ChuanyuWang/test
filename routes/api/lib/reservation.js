//var mongojs = require('mongojs');

var reservation = {};
var EPSILON = 2e-10; // Number.EPSILON is not big enough, e.g. (3.6-1.2-2.4) < Number.EPSILON => false

function validate(member, cls, quantity, error) {
    error.class = cls.name;

    //check duplicate booking
    if (cls.booking && cls.booking.length > 0) {
        for (var i = 0; i < cls.booking.length; i++) {
            if (cls.booking[i].member.equals(member._id)) {
                error.cause = new Error("已经预约，请勿重复报名");
                return false;
            }
        }
    }

    // only active members can book classes
    if (member.status != 'active') {
        error.cause = new Error("您的会员状态还未激活，如有问题，欢迎来电或到店咨询");
        return false;
    }

    //TODO, support multi membership card
    var membership = null;
    if (member.membership && member.membership.length > 0) {
        membership = member.membership[0];
    }

    // only members can book non-free classes
    if (cls.cost > 0 && !membership) {
        error.cause = new Error("您还未办理会员卡，如有问题，欢迎来电或到店咨询");
        return false;
    }

    // check the age limitation for current member
    if (cls.age && cls.age.max && member.birthday) {
        var oldest = new Date(cls.date.getTime());
        oldest.setHours(0);
        oldest.setMinutes(0);
        oldest.setMonth(oldest.getMonth() - cls.age.max);
        if (member.birthday < oldest) { // if the member is older than the oldest one
            // child is too old
            error.cause = new Error("小朋友年龄超出指定要求，无法预约，如有问题，欢迎来电或到店咨询");
            return false;
        }
    }

    if (cls.age && cls.age.min && member.birthday) {
        var youngest = new Date(cls.date.getTime());
        youngest.setHours(0);
        youngest.setMinutes(0);
        youngest.setMonth(youngest.getMonth() - cls.age.min);
        if (member.birthday > youngest) { // if the member is younger than the youngest one
            // child is too young
            error.cause = new Error("小朋友年龄不到指定要求，无法预约，如有问题，欢迎来电或到店咨询");
            return false;
        }
    }

    // calculate the remaining
    var booking = cls.booking || [];
    var reservation = 0, remaining = 0;
    booking.forEach(function(val, index, array) {
        reservation += (val.quantity || 0);
    })
    remaining = cls.capacity - reservation;
    if (remaining < quantity) {
        error.cause = new Error("名额不足，剩余 " + (remaining < 0 ? 0 : remaining) + " 人");
        return false;
    }

    // if it's a free course, then it's open for all kinds of membership
    if (cls.cost <= 0) {
        return true;
    }

    if (membership.expire && membership.expire < cls.date) {
        //TODO, use client locale date instead of server
        error.cause = new Error("您的会员卡有效期至" + membership.expire.toLocaleDateString() + "，无法预约，如有问题，欢迎来电或到店咨询");
        return false;
    }

    //check if the member is limited to some classroom
    if (membership.type === "LIMITED") {
        membership.room = membership.room || [];
        if (membership.room.indexOf(cls.classroom) === -1) {
            error.cause = new Error("您的会员卡不能预约此教室课程，如有问题，欢迎来电或到店咨询");
            return false;
        }
    }

    if (membership.credit + EPSILON < quantity * cls.cost) {
        error.cause = new Error("您的剩余课时不足，无法预约，如有问题，欢迎来电或到店咨询");
        return false;
    }

    return true;
}

function generateBooking(member, cls, quantity) {
    var newbooking = {
        member: member._id,
        quantity: quantity,
        bookDate: new Date()
    };

    cls.booking = cls.booking || [];
    cls.booking.push(newbooking);

    // deduct the expense
    if (cls.cost > 0) {
        //TODO, support multi membership card
        var membership = null;
        if (member.membership && member.membership.length > 0) {
            membership = member.membership[0];
        }
        // deduct the expense
        membership.credit -= quantity * cls.cost;
    }

    return newbooking;
}

reservation.add = function(memberOrMembers, classOrClasses, quantity, skipPastClass) {
    var members = Array.isArray(memberOrMembers) ? memberOrMembers : [memberOrMembers];
    var classes = Array.isArray(classOrClasses) ? classOrClasses : [classOrClasses];
    var quantity = quantity || 1;

    // sort the classes from past to future
    classes.sort(function(a, b) {
        if (a.date < b.date) return -1;
        else return 1;
    });

    // initialze the summary objects
    var memberSummary = {}, classSummary = {};
    members.forEach(function(value) {
        memberSummary[value._id] = {
            name: value.name,
            errors: [],
            expense: 0
        };
    });
    classes.forEach(function(value) {
        classSummary[value._id] = {
            name: value.name,
            newbookings: []
        };
    });

    classes.forEach(function(cls, i, classArray) {
        // don't add booking to past class
        if (skipPastClass && cls.date < new Date()) return;
        members.forEach(function(member, j, memberArray) {
            var memberStatus = memberSummary[member._id];
            var classStatus = classSummary[cls._id];
            var error = {};
            if (validate(member, cls, quantity, error)) {
                var newBooking = generateBooking(member, cls, quantity);
                classStatus.newbookings.push(newBooking);
                memberStatus.expense += cls.cost * quantity;
            } else {
                error.message = error.cause.message;
                memberStatus.errors.push(error);
            }
        });
    });
    return {
        "memberSummary": memberSummary,
        "classSummary": classSummary
    };
}

reservation.check = function(member, classToBook, quantity) {
    var error = {};
    if (validate(member, classToBook, quantity, error)) {
        return null; // no error found, proceed to book
    } else {
        return error.cause; // return error in details
    }
}

reservation.remove = function(memberOrMembers, classOrClasses) {

}

module.exports = reservation;
