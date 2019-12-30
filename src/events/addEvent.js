const PhoneNumber = require('awesome-phonenumber');
const eventIOS = require('../ios/addEvent');
const addBadge = require(`../badges/addBadge`);

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

//const firebaseAdmin = require(`firebase-admin`);
function isPlus(phone) {
    return phone.indexOf(`+`) !== -1;
}

function parsePhone(no, intlArray, localArray, prefix) {
    if (isPlus(no)) {
        intlArray.push(new PhoneNumber(no).getNumber());
        return;
    }
    intlArray.push(prefix + parseInt(no).toString());
}

function remove(element, array) {
    if (array.indexOf(element) !== -1) {
        array.splice(array.indexOf(element), 1);
    }
    return array;
}

async function searchUsers(intlArray, localarray1, db, emails) {
    //console.log(db);
    //console.log(intlArray)
    let attendees = await db.collection(`users`).find({
        $or: [
            {"phone.number": {$in: intlArray}},
            {email: {$in: emails}}
        ]
    }).project({
        _id: 1,
        phone: 1,
        email: 1,
        FCM_Tokens: 1,
        FCM_IOS: 1,
        platform: 1,
        badgesMain: 1,
        badgesEvents: 1,
        badgesInvites: 1,
        badgesGifts: 1,
        badgesInvitesGifts: 1,
        language: 1
    }).toArray();
    //console.log(attendees);
    let final = [];
    for (i = 0; i < attendees.length; i++) {
        let item = attendees[i];
        let id = true;
        if (intlArray.indexOf(item.phone.number) !== -1) {
            id = false;
            intlArray = remove(item.phone.number, intlArray);
        }
        if (emails.indexOf(item.email) !== -1) {
            emails = remove(item.email, emails);
            id = false;
        }
        if (!id) {
            final.push(item);
        }
    }
    return {users: final, localArray: localarray1, emails, intlArray};
}

async function temPtoken(token, eventIdObject, fcm, sends, OwnerName, childname) {
    let message = {
        to: token,
        collapse_key: 'New Invite',
        data: {
            type: `NEW_INVITE`,
            eventId: eventIdObject.toString(),
            Date: Date.now(),
            OwnerName,
            Action: `INVITE`,
            childname: childname
        }
    };
    //console.log(`FOR DEBUG`,fcm,message);
    let seObj = fcm(message).then(() => {
    }).catch(() => {
    });
    sends.push(seObj);
    //console.log(seObj)
    return;
}

async function sendPush(registeredUsers, ids, db, eventIdObject, app, OwnerName, childName) {
    let allTokens = [];
    let fcm = app.get(`FCM`);
    registeredUsers.forEach(e => {
        try {

            allTokens.push(...(e.FCM_Tokens));
        } catch (e) {
            console.warn(`ERROR`, e);
        }
    });
    let sends = [];
    for (let i = 0; i < allTokens.length; i++) {
        let token = allTokens[i];
        temPtoken(token, eventIdObject, fcm, sends, OwnerName, childName).catch(() => {
        });
    }
    console.log(`nnow ios`);
    eventIOS(fcm, registeredUsers, ids, db, eventIdObject, app, OwnerName, childName)
        .then(()=>{})
        .catch((e)=>{
            console.log(`uis add event error `,e);
        })
    return 1;
}

async function sendSMS(nonRegisteredUsers) {
    return -1;
}

async function sendEmails(emails) {
    return -1;
}

async function createEvent(numbers, emails1, db, prefix) {
    let intlArray1 = [];
    let localArray1 = [];
    numbers.forEach(e => parsePhone(e, intlArray1, localArray1, prefix));
    let {users, localArray, emails, intlArray} = await searchUsers(intlArray1, localArray1, db, emails1);
    intlArray1 = (intlArray1).filter(onlyUnique);
    return {users, localArray, emails, intlArray};
}

async function getRealData(rawData) {
    let numbers1 = [];
    let emails1 = [];
    rawData.forEach(e => {
        if (e.indexOf(`@`) !== -1) emails1.push(e);
        else numbers1.push(e);
    });
    return {numbers1, emails1};
};
var parseIt = function (names, prefix) {
    let nameRefined = {};
    for (let name in names) {
        let no = names[name];
        let number;
        if (isPlus(no)) {
            number = (new PhoneNumber(no).getNumber());
        } else {
            number = (prefix + parseInt(no).toString());
        }
        nameRefined[name] = number;
    }
    return nameRefined;
};
module.exports = function (app) {
    const asyncer = app.get(`wrap`);
    app.post(`/events/add`, asyncer(async function (request, response) {
        let prefix = `+` + request.User.phone.country_prefix;
        var names1 = JSON.parse(request.fields.names);
        var namesRefined = parseIt(names1, prefix);
        //console.log(`PREFIX`,prefix);
        //console.log(arguments);
        let rawData = JSON.parse(request.fields.data);
        let {numbers1, emails1} = await getRealData(rawData);
        let event = JSON.parse(request.fields.event);
        let sms_invite_link = request.app.get(`invite_link`);
        //let numberResult = await app.get(`db`)().collection(`events`).find({});
        let {users, localArray, emails, intlArray} = await createEvent(numbers1, emails1, request.app.get(`db`)(), prefix);
        remove(request.email, emails);
        //remove(request.User.phone.national_number,localArray);
        remove(request.User.phone.number, intlArray);
        let usersIdsobjs = [];
        users.forEach(e => usersIdsobjs.push(e._id));

        let theDate = new Date(parseInt(event["date"]));
        theDate.setDate(theDate.getDate() + 1);
        event["date"] = theDate;

        event["isSpecialTheme"] = (event["isSpecialTheme"] === "true");
        event["guestSee"] = (event["guestSee"] === "true");
        //console.log(event);
        var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress || ``;
        let events = await app.get(`db`)().collection(`events`).insertOne(
            {
                ...event,
                namesRefined,
                created_by: request.email,
                date_created: Date.now(),
                users: usersIdsobjs,
                unRegisteredNumbersLocal: localArray,
                unRegisteredNumbersInternational: intlArray,
                unRegisteredEmails: emails,
                ip_created: ip
            }
        );
        let OwnerName = await request.app.get(`db`)().collection(`users`).findOne({email: request.email}, {projection: {name: 1}});
        OwnerName = OwnerName.name;
        let DB = request.app.get(`db`)();
        console.log(`here goes users for push`, users);
            sendPush(users, usersIdsobjs, DB, events.insertedId, app, OwnerName, event.childName).then(() => {
        }).catch(() => {
        });
        //sendSMS([...localArray, ...intlArray]);
        let sendString = "";
        sendEmails(emails).then(() => {
            }).catch(() => {
        });
        addBadge.addEventBadges(DB,users,events.insertedId).then(()=>{}).catch(()=>{});
        //console.log(events);
        let send_sms = intlArray.length > 0;
        if (events.insertedCount === 1) {
            response.json({success: true, send_sms, sms_invite_link, send_sms_datas: intlArray.join(";")})
        } else {
            response.json({success: false, message: `Error creating your party`});
        }
        return;
    }));
};