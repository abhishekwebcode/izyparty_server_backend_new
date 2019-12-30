const sendPush = function (fcm, message, userFCMTOKENS) {
    message["registration_ids"] = userFCMTOKENS;
    fcm(message).then(() => {
        }).catch(() => {
    });
    return;
};
const ownerIOSSEND=function (FCM,payload) {
    console.log("ios reject notification",payload);
    FCM(payload).then(e=>{}).catch(e=>{});
};
function reverseMap(map) {
    let reverseMap = {};
    for (let key in map) {
        reverseMap[map[key.toString()]] = key.toString();
    }
    return reverseMap;
};
const addBadge = require(`../badges/addBadge`);
const badgesRemove = require(`../ios/badges/badgeRemove`);
const removeInner = require(`../ios/badges/removeBadgeInnerEvents`);
module.exports = function (app) {
    const asyncer = app.get(`wrap`);
    app.post(`/invites/list`, asyncer(async function (request, response) {
        //console.log(arguments);

        let db = request.app.get(`db`)();
        badgesRemove(db,request.meta,"badgesMain.invites");
        //console.log(`inInviesliSt`);
        //console.log(db);
        let id = await db.collection(`users`).find({email: request.User.email}).limit(1).toArray();
        let _id = id[0]._id;
        let userID = request.app.get(`id`)(_id);
        let invites = await db.collection(`events`).find({
            users: {
                $in: [
                    userID
                ]
            }
        }).project({
            _id: 1, childName: 1, date: 1, guestSee: 1,datetext:1
        }).sort({date: 1}).skip(parseInt(request.fields.offset)).limit(10).toArray();
        for (i = 0; i < invites.length; i++) {
            try {
                let eventId = invites[i]._id;
                let response = await db.collection(`responses`).findOne({
                    eventID: eventId,
                    intention: true,
                    email: request.email
                });
                if (response != null && response.intention === true) {
                    if (true) {
                        let gifts = await db.collection(`gifts`).findOne({
                            eventId: eventId,
                            $or: [
                                {selected_by_id: userID},
                                {selected: false}
                            ]
                        })
                        if (gifts !== null) {
                            console.dir(response);
                            invites[i].showGiftOption = true;
                            invites[i].response_id = response._id.toString()
                        }
                    }
                }
            } catch (e) {
                //console.log(e)
            }
        }
        response.json({
            success: true, invites
        })
        return;
    }));
    app.post(`/invites/info`, asyncer(async function (request, response) {
        let db1 = request.app.get(`db`)();
        let eventID = request.app.get(`id`)(request.fields.eventId);
        console.log(`remove invites info`);
        removeInner(db1,request.meta,"badgesInvites",request.fields.eventId);
        let check1 = await db1.collection(`responses`).findOne({
            email: request.User.email,
            eventID,
            registered: true,
        });
        //console.log(`CHECKING EXISTING INVITE`);
        //console.log(check1);
        var checkObj;
        if (check1 === null) {
            checkObj = ({
                sent: false
            });
        } else {
            checkObj = ({
                sent: true,
                intention: (check1.intention === true ? `going` : `not going`)
            })
        }


        let eventID1 = request.fields.eventId;
        let eventIDOBJECT = request.app.get(`id`)(eventID1);
        //console.log(arguments);
        let eventINFO = await request.app.get(`db`)().collection(`events`).find({
            _id: eventIDOBJECT
        }).project({
            timeEnd: 1,
            zipCode: 1,
            country: 1,
            isSpecialTheme: 1,
            city: 1,
            timeStart: 1,
            date: 1,
            street: 1,
            childName: 1,
            latitude: 1,
            longitude: 1,
            district: 1,
            otherAddress: 1,
            theme: 1,
            created_by: 1,
            datetext:1
        }).toArray();
        if (eventINFO.length === 0) {
            response.json({success: false, message: "Invite does not exist"});
            return;
        } else {
            let email = eventINFO[0].created_by;
            let userInfo = await request.app.get(`db`)().collection(`users`).find({email: email}).toArray();
            response.json({
                success: true,
                invite: eventINFO[0],
                owner: userInfo[0],
                ...checkObj
            });
            return;
        }
        return;
    }));
    app.post(`/invites/reject`, asyncer(async function (request, response) {
        let db = request.app.get(`db`)();
        let eventID = request.app.get(`id`)(request.fields.eventId);
        await db.collection(`responses`).remove({
            email: request.User.email,
            eventID,
            registered: true
        });
        try {
            let user = await db.collection(`users`).findOne({email: request.email});
            let userID = user._id;
            await db.collection(`gifts`).findOneAndUpdate({
                eventId: eventID,
                selected_by_id: userID
            }, {
                $set: {
                    selected_by_id: false,
                    selected: false
                }
            });
        } catch (e) {

        }
        let email = await app.get(`db`)().collection(`users`).findOne({email: request.email});
        let userIdObj = email._id;
        let giftUnselect = await db.collection(`gifts`).findOneAndUpdate({
            selected_by_id: userIdObj,
            eventId: eventID
        }, {
            $set: {selected: false, selected_by_id: false}
        });
        let ins = await db.collection(`responses`).insertOne({
            registered: true,
            intention: false,
            email: request.User.email,
            eventID,
            date_created: Date.now()
        });
        if (ins.result.ok === 1) {
            //console.log(`hdisuf`,request.email,db);
            let userIdObj = await db.collection(`users`).findOne({email: request.email});
            let userOBJ = userIdObj._id;
            //console.log(`SELE`,userOBJ);
            //console.log(eventID);
            await db.collection(`gifts`).findOneAndUpdate({
                eventId: eventID, selected_by_id: userOBJ
            }, {$set: {selected: false, selected_by_id: false}});

            /*
                        ownerTokens.forEach(async token=>{
                           //console.log(`FOR DEBUG`,fcm,message);
                            let seObj=fcm(message);
                           //console.log(seObj)
                        });
                         */
            let fcm = app.get(`FCM`);
            let ownerEmail1 = await db.collection(`events`).findOne({_id: eventID}, {
                projection: {
                    created_by: 1,
                    childName: 1,
                    namesRefined: 1
                }
            });

            let names = ownerEmail1.namesRefined;
            let reverse = reverseMap(names);
            let myPhone = userIdObj.phone.number;
            let myAlias = reverse[myPhone];
            let ownerEmail = ownerEmail1.created_by;
            let ownerTokens = await db.collection(`users`).findOne({email: ownerEmail});
            let ownerObject = ownerTokens;
            addBadge.addInvitesBadge(
                db,{_id:ownerObject._id},request.fields.eventId
            ).then(()=>{}).catch(()=>{});
            ownerTokens = ownerTokens.FCM_Tokens;
            let message = {
                collapse_key: 'New Invite',
                data: {
                    type: `INVITE_RESPOND`,
                    eventId: eventID.toString(),
                    userName: myAlias,
                    eventName: ownerEmail1.childName,
                    Action: `REJECT`,
                    Date: Date.now()
                }
            };
            //console.log(`NOTIFICATION`,fcm,message,ownerTokens);
            sendPush(fcm, message, ownerTokens);
            var payload;
            if (ownerObject.platform==="ios") {
                if (ownerObject.language==="french") {
                    payload = {
                        to:ownerObject.FCM_IOS,
                        collapse_key: 'New Invite',
                        notification:{
                            "sound": "default",
                            title:`nouvelle réponse pour le parti de ${ownerEmail1.childName}`,
                            body:`${myAlias}  a répondu à votre invitation`
                            /*
                            * May work "click_action": "defaultCategory"
                            */
                        },
                        "content_available": true,
                        "mutable_content": true,
                        collapse_key: 'New Invite',
                        data: {
                            "mutable_content": true,
                            type: `INVITE_RESPOND`,
                            eventId: eventID.toString(),
                            userName: myAlias,
                            eventName: ownerEmail1.childName,
                            Action: `REJECT`,
                            Date: Date.now()
                        }
                    };
                } else {
                    payload = {
                        to:ownerObject.FCM_IOS,
                        collapse_key: 'New Invite',
                        notification:{
                            "sound": "default",
                            title:`New response for party of ${ownerEmail1.childName}`,
                            body:`${myAlias} has responded to your invitation`
                            /*
                            * May work "click_action": "defaultCategory"
                            */
                        },
                        "content_available": true,
                        "mutable_content": true,
                        collapse_key: 'New Invite',
                        data: {
                            "mutable_content": true,
                            type: `INVITE_RESPOND`,
                            eventId: eventID.toString(),
                            userName: myAlias,
                            eventName: ownerEmail1.childName,
                            Action: `REJECT`,
                            Date: Date.now()
                        }
                    };
                }
                ownerIOSSEND(fcm,payload);
            }

            response.json({
                success: true
            })
        } else {
            response.json({success: false})
        }
        return;
    }));

    app.post(`/invites/accept`, asyncer(async function (request, response) {
        try {
            let db = request.app.get(`db`)();
            let email = await app.get(`db`)().collection(`users`).findOne({email: request.email});
            let userIdObj = email._id;
            let eventID = request.app.get(`id`)(request.fields.eventId);
            await db.collection(`responses`).remove({
                email: request.User.email,
                eventID,
                registered: true
            });
            console.log(Date.now())
            let ins = await db.collection(`responses`).insertOne({
                registered: true,
                intention: true,
                email: request.User.email,
                eventID,
                childNameAllergy:request.fields.childName||"",
                allergy1: request.fields.allergy1,
                allergy2: request.fields.allergy2,
                allergy3: request.fields.allergy3,
                isAllergy: request.fields.isAllergy,
                date_created: Date.now()
            });
            console.log(Date.now())
            if (ins.result.ok === 1) {
                let gifts = await db.collection(`gifts`).find({
                    eventId: eventID,
                    $or: [
                        {selected: false}
                    ]
                }).toArray();
                //console.log(db.collection(`gifts`));
                //console.log(gifts);
                //console.log({eventId:eventID,});
                /*
                This code should work for both the cases!
                 */
                let userIdObj234 = await app.get(`db`)().collection(`users`).findOne({email: request.email}, {projection: {name: 1}});
                let named = userIdObj234.name;
                console.log(Date.now())
                let fcm = app.get(`FCM`);
                let ownerEmail1 = await db.collection(`events`).findOne({_id: eventID}, {
                    projection: {
                        date:1,
                        created_by: 1,
                        childName: 1,
                        namesRefined: 1
                    }
                });
                let eventDate=ownerEmail1.date.getTime();
                let ownerEmail = ownerEmail1.created_by;
                let ownerTokens = await db.collection(`users`).findOne({email: ownerEmail});
                let ownerObject = ownerTokens;
                addBadge.addInvitesBadge(
                    db,{_id:ownerObject._id},request.fields.eventId
                ).then(()=>{}).catch(()=>{});
                ownerTokens = ownerTokens.FCM_Tokens;
                let names = ownerEmail1.namesRefined;
                let reverse = reverseMap(names);
                let myPhone = email.phone.number;
                let myAlias = reverse[myPhone];
                console.log(Date.now());
                let message = {
                    collapse_key: 'New Invite',
                    data: {
                        type: `INVITE_RESPOND`,
                        eventId: eventID.toString(),
                        userName: myAlias,
                        eventName: ownerEmail1.childName,
                        Action: `ACCEPT`,
                        Date: Date.now()
                    }
                };
                //console.log(`NOTIFICATION`,fcm,message,ownerTokens);
                sendPush(fcm, message, ownerTokens);
                console.log(Date.now());

                var payload;
                console.log(`he is ios user testing`,ownerObject);
                if (ownerObject.platform==="ios") {
                    if (ownerObject.language==="french") {
                        payload = {
                            to:ownerObject.FCM_IOS,
                            collapse_key: 'New Invite',
                            notification:{
                                "sound": "default",
                                title:`nouvelle réponse pour le parti de ${ownerEmail1.childName}`,
                                body:`${myAlias}  a répondu à votre invitation`
                                /*
                                * May work "click_action": "defaultCategory"
                                */
                            },
                            "content_available": true,
                            "mutable_content": true,
                            collapse_key: 'New Invite',
                            data: {
                                "mutable_content": true,
                                type: `INVITE_RESPOND`,
                                eventId: eventID.toString(),
                                userName: myAlias,
                                eventName: ownerEmail1.childName,
                                Action: `ACCEPT`,
                                Date: Date.now()
                            }
                        };
                    } else {
                        payload = {
                            to:ownerObject.FCM_IOS,
                            collapse_key: 'New Invite',
                            notification:{
                                "sound": "default",
                                title:`New response for party of ${ownerEmail1.childName}`,
                                body:`${myAlias} has responded to your invitation`
                                /*
                                * May work "click_action": "defaultCategory"
                                */
                            },
                            "content_available": true,
                            "mutable_content": true,
                            collapse_key: 'New Invite',
                            data: {
                                "mutable_content": true,
                                type: `INVITE_RESPOND`,
                                eventId: eventID.toString(),
                                userName: myAlias,
                                eventName: ownerEmail1.childName,
                                Action: `ACCEPT`,
                                Date: Date.now()
                            }
                        };
                    }
                    ownerIOSSEND(fcm,payload);
                }


                if (gifts.length !== 0) {
                    response.json({
                        success: true,
                        chooseGifts: true,
                        gifts,
                        date:eventDate,
                        response_id: ins.insertedId.toString()
                    });
                } else {
                    response.json({
                        date:eventDate,
                        success: true
                    });
                }
            } else {
                console.log(Date.now());
                response.json({success: false})
            }
            return;
        } catch (e) {
            console.error(e)
        }
    }));
};