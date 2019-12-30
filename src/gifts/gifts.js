const addBadge = require(`../badges/addBadge`);
const sendPushiOS=require(`../ios/pushIosGift`);
const sendPush = async function (fcm, tokens, eventID, gift, childname, ownername) {
    let payload = {
        collapse_key: 'New Invite',
        data: {
            type: `GIFT_ADD`,
            gift,
            eventId: eventID.toString(),
            Date: Date.now(),
            Action: `INVITE`,
            childname: childname,
            OwnerName: ownername
        }
    };
    payload["registration_ids"] = tokens;
   //console.log(payload, fcm);
    fcm(payload).then(()=> {
        //console.log
    }).catch(()=>{
        //console.log
    });
    return ;
};

function reverseMap(map) {
    let reverseMap={};
    for (let key in map) {
        reverseMap[map[key.toString()]]=key.toString();
    }
    return reverseMap;
};
var sendPushToGiftInvitee = async function (fcm, db, existing,addBadge) {
    console.log(`DELETE GIFT`,arguments);
   //console.log(arguments, `DELETE GIFT`);
    let user = await db.collection(`users`).findOne({_id: existing.selected_by_id});
    let event = await db.collection(`events`).findOne({_id: existing.eventId});
    let organiser = await db.collection(`users`).findOne({email: event.created_by});
    let payload = {
        collapse_key: 'New Invite',
        data: {
            type: `GIFT_DELETED`,
            Date: Date.now(),
            gift: existing.gift,
            eventId: existing.eventId,
            eventName: event.childName,
            organiser: organiser.name
        }
    };
    payload["registration_ids"] = user.FCM_Tokens;
   //console.log(payload, fcm);
    fcm(payload).then(()=>{}).catch(()=>{});
    console.log(`delete gift`,user);
    if (user.platform==="ios") {
        addBadge
            .userNotifyGiftBadgeDeleted(db,{email:user.email},existing.eventId.toHexString())
            .then(()=>{})
            .catch(()=>{});

        var payloadIos;
        if (user.language==="french") {
            payloadIos = {
                to:user.FCM_IOS,
                collapse_key: 'New Invite',
                notification:{
                    "sound": "default",
                    title:`Le cadeau que vous avez sélectionné ${existing.gift} a été supprimé par ${organiser.name}`,
                    body:`Appuyez ici pour sélectionner un nouveau cadeau pour une fête de ${event.childName}`
                    /*
                    * May work "click_action": "defaultCategory"
                    */
                },
                "content_available": true,
                "mutable_content": true,
                collapse_key: 'New Invite',
                data: {
                    "mutable_content": true,
                    type: `GIFT_DELETED`,
                    Date: Date.now(),
                    gift: existing.gift,
                    eventId: existing.eventId,
                    eventName: event.childName,
                    organiser: organiser.name
                }
            };
        } else {
            payloadIos = {
                to:user.FCM_IOS,
                collapse_key: 'New Invite',
                data: {
                    "mutable_content": true,
                    type: `GIFT_DELETED`,
                    Date: Date.now(),
                    gift: existing.gift,
                    eventId: existing.eventId,
                    eventName: event.childName,
                    organiser: organiser.name
                },
                notification:{
                    "sound": "default",
                    title:`Your selected gift ${existing.gift} was deleted by ${organiser.name}`,
                    body:`Tap here to select a new gift for party of ${event.childName}`
                    /*
                    * May work "click_action": "defaultCategory"
                    */
                },
                "content_available": true,
                "mutable_content": true
            };
        }
        console.log(`GIFT DELETED , `,payloadIos,fcm);
        fcm(payloadIos).then(()=>{}).catch(()=>{});
    }
    return ;
}
var sendPushGiftSelected = async function (fcm, tokens, eventID, childName, linkedName,user) {
    let payload = {
        collapse_key: 'New Invite',
        data: {
            type: `GIFT_SELECTED`,
            Date: Date.now(),
            eventId: eventID.toString(),
            childname: childName,
            InviteeName: linkedName
        }
    };
    payload["registration_ids"] = tokens;
   //console.log(payload, fcm);
    fcm(payload).then(()=>{}).catch(()=>{});
    console.log(`gift seletced`,`user`,user);
    if (user.platform==="ios") {
        var payloadIos;
        if (user.language==="french") {
            payloadIos = {
                to:user.FCM_IOS,
                collapse_key: 'New Invite',
                notification:{
                    "sound": "default",
                    title:`Nouveau cadeau sélectionné pour ${childName} fête`,
                    body:`startAppuyez ici pour voir le cadeau sélectionné par ${linkedName}`
                    /*
                    * May work "click_action": "defaultCategory"
                    */
                },
                "content_available": true,
                "mutable_content": true,
                collapse_key: 'New Invite',
                data: {
                    "mutable_content": true,
                    type: `GIFT_SELECTED`,
                    Date: Date.now(),
                    eventId: eventID.toString(),
                    childname: childName,
                    InviteeName: linkedName
                }
            };
        } else {
            payloadIos = {
                to:user.FCM_IOS,
                collapse_key: 'New Invite',
                data: {
                    "mutable_content": true,
                    type: `GIFT_SELECTED`,
                    Date: Date.now(),
                    eventId: eventID.toString(),
                    childname: childName,
                    InviteeName: linkedName
                },
                notification:{
                    "sound": "default",
                    title:`New gift selected for ${childName} party`,
                    body:`Tap here to view gift selected by ${linkedName}`
                    /*
                    * May work "click_action": "defaultCategory"
                    */
                },
                "content_available": true,
                "mutable_content": true
            };
        }
        console.log(`gift selected payload`,fcm,payloadIos);
        fcm(payloadIos).then(()=>{}).catch(()=>{});
    }


    return ;
};
const removeInner = require(`../ios/badges/removeBadgeInnerEvents`);
module.exports = function (app) {
    const asyncer = app.get(`wrap`);
    app.post(`/gifts/check`,asyncer( async function (request, response) {
        let email = await app.get(`db`)().collection(`users`).findOne({email: request.email});
        let userIdObj = email._id;
        let eventIdObject = request.app.get(`id`)(request.fields.eventId);
        let db = request.app.get(`db`)();
        removeInner(db,request.meta,"badgesInvitesGifts",request.fields.eventId);
        try {
            let directCheck = await db.collection(`responses`).findOne({
                email: request.email,
                eventID: eventIdObject
            });
            if (directCheck.marking !== true) {
                response.json({success: true, NEVER_SELECTED: true});
                response.end();
                return;
            }
        } catch (e) {
            console.error(e)
        }
        let giftObject = await db.collection(`gifts`).findOne({selected_by_id: userIdObj, eventId: eventIdObject});
       //console.log(({selected_by_id: userIdObj, eventId: eventIdObject}));
        if (giftObject === null) {
            response.json({success: true, NO_GIFT: true});
            return;
        } else {
            response.json({success: true, GIFT: giftObject.gift});
            return;
        }
        return;
    }));
    app.post(`/gifts/delete`,asyncer( async function (request, response) {
        let id = request.fields.giftId;
        let giftId = request.app.get(`id`)(id);
        let existing = await request.app.get(`db`)().collection(`gifts`).findOne({_id: giftId});
        if (existing.selected_by_id !== false) {
            sendPushToGiftInvitee(request.app.get(`FCM`), request.app.get(`db`)(), existing,addBadge)
                .then(()=>{}).catch((e)=>{
                    console.error(`delete gift`,e);
            });
        }
        let delete2 = await request.app.get(`db`)().collection(`gifts`).remove({_id: giftId});
        response.json({
            success: delete2.result.n === 1
        });
        response.end();
        return;
    }));
    app.post(`/gifts/getResponseId`, asyncer(async function (request, response) {
        let eventId = request.app.get(`id`)(request.fields.eventId);
        let eventIDQuery = await request.app.get(`db`)().collection(`responses`).findOne({
            email: request.User.email,
            eventID: eventId
        });
        response.json({
            success: true, responseId: eventIDQuery._id.toString()
        });
        return;
    }));
    app.post(`/gifts/list`,asyncer( async function (request, response) {
        let eventId = request.app.get(`id`)(request.fields.eventId);
        removeInner(request.app.get(`db`)(),request.meta,"badgesGifts",request.fields.eventId);
        let gifts = await app.get(`db`)().collection(`gifts`).find({
            created_by: request.email, eventId
        }).project({
            _id: 1,
            gift: 1,
            selected: 1,
            date_created: 1
        }).sort({gift: 1}).skip(parseInt(request.fields.offset)).limit(10).toArray();
        response.json({
            success: true, gifts
        })
        return;
    }))
    app.post(`/gifts/listInvitee`,asyncer( async function (request, response) {
        let event_id_obj = request.app.get(`id`)(request.fields.eventId);
        let email = await app.get(`db`)().collection(`users`).findOne({email: request.email});
        let userIdObj = email._id;
        removeInner(app.get(`db`)(),request.meta,"badgesInvitesGifts",request.fields.eventId);
        /**
         * Get selected gifts if there are any
         */
        let giftSelected = await app.get(`db`)().collection(`gifts`).findOne({
            eventId: event_id_obj,
            $or: [
                {
                    selected_by_id: userIdObj
                }
            ]
        }, {
            projection: {_id: 1, gift: 1, selected: 1, date_created: 1}
        });
        /**
         * Get non-selected gifts
         */
        let gifts = await app.get(`db`)().collection(`gifts`).find({
            eventId: event_id_obj,
            $or: [
                {selected: false}
            ]
        }).project({
            _id: 1,
            gift: 1,
            selected: 1,
            date_created: 1
        }).sort({gift: 1}).skip(parseInt(request.fields.offset)).limit(10).toArray();
        response.json({
            success: true, gifts, giftSelected: giftSelected
        });
        return;
    }))
    app.post(`/gifts/add`, asyncer(async function (request, response) {
        try {
            let gift = request.fields.todo;
            let eventId = request.app.get(`id`)(request.fields.eventId);
            let eventMembers = await app.get(`db`)().collection(`responses`).find({
                eventID: eventId,
                intention: true
            }).project({email: 1}).toArray();

            let eventDetails = await app.get(`db`)().collection(`events`).find({_id: eventId}).limit(1).toArray();
            let childName = eventDetails[0].childName;
            let created_by = eventDetails[0].created_by;
            let username = await app.get(`db`)().collection(`users`).find({email: created_by}).project({name: 1}).limit(1).toArray();
            let name = username[0].name;

            let emailsAll = [];
            eventMembers.forEach(response => {
                emailsAll.push(response.email);
            });
            //console.log(`ALL EMAILS`, emailsAll);
            let tokenss = await app.get(`db`)().collection(`users`).find({email: {$in: emailsAll}}).toArray();
            let AllTokens = [];
            tokenss.forEach(user => {
                try {
                    AllTokens.push(...user.FCM_Tokens);
                    //console.log(`IUHf`, user, AllTokens);
                } catch (e) {
                    console.error(e, `ErRROR`);
                }
            });
            console.log(`badge add gift,`, app.get(`db`)(), tokenss, request.fields.eventId);
            addBadge.usersNotifyGiftBadgeAdd(app.get(`db`)(), tokenss, request.fields.eventId).then(() => {
                }).catch(() => {
            })
            sendPush(request.app.get(`FCM`), AllTokens, request.fields.eventId, gift, childName, name).then(() => {
                }).catch(() => {
            });
            console.log(request.app.get(`FCM`), tokenss, request.fields.eventId, gift, childName, name, app.get(`db`)())

            sendPushiOS(request.app.get(`FCM`), tokenss, request.fields.eventId, gift, childName, name, app.get(`db`)()).then(() => {
                }).catch(() => {
            });

            let todoIns = await app.get(`db`)().collection(`gifts`).insertOne({
                gift,
                eventId,
                created_by: request.email,
                date_created: Date.now(),
                selected: false,
                selected_by_id: false
            });
            if (todoIns.insertedCount === 1) {
                response.json({success: true})
            } else {
                response.json({success: false, message: `Error creating your task`});
            }
            return;
        } catch (e) {
            console.error(e);
            next(e);
        }
    }))
    app.post(`/gifts/mark`,asyncer( async function (request, response) {
       //console.log(`MARKING`);
        let db = app.get(`db`)();
        let eventId = request.app.get(`id`)(request.fields.eventId);
        let email = await app.get(`db`)().collection(`users`).findOne({email: request.email});
        let userIdObj = email._id;
        let currentUserName = email.name;
        let myPhone = email.phone.number;
        let unselect = request.fields.unselect === "true";
        let responseIDOBJECT = app.get(`id`)(request.fields.responseId);
        try {
            let markchoosing = await db.collection(`responses`).findOneAndUpdate({
                _id: responseIDOBJECT
            }, {
                $set: {marking: true}
            });
        } catch (e) {
            console.error(e)
        }
        if (unselect) {
            let giftUnselect = await db.collection(`gifts`).findOneAndUpdate({
                selected_by_id: userIdObj,
                eventId: eventId
            }, {
                $set: {selected: false, selected_by_id: false}
            });
            if (giftUnselect.ok === 1) {
                let eventOwner = await db.collection(`events`).findOne({_id: eventId}, {
                    projection: {
                        created_by: 1,
                        childName: 1,
                        namesRefined:1
                    }
                });
                let names = eventOwner.namesRefined;
                let newMap = reverseMap(names);
                let myalias = newMap[myPhone];
                let emailOwner = eventOwner.created_by;
                let childName = eventOwner.childName;
                let user = await db.collection(`users`).findOne({email: emailOwner});
                let tokens = user.FCM_Tokens;
                sendPushGiftSelected(request.app.get(`FCM`), tokens, request.fields.eventId, childName, myalias,user).then(()=>{}).catch(()=>{});
                addBadge
                    .ownerNotifyGift(db,{email: emailOwner},request.fields.eventId)
                    .then(()=>{})
                    .catch(()=>{});
                response.json({success: true});
                response.end();
            } else {
                response.json({success: false})
                response.end();
            }
            return;
        }
        let gift = request.app.get(`id`)(request.fields.todo);
        let giftCheckExisting = await db.collection(`gifts`).findOne({
            _id: gift
        });
       //console.log(`GIFT CHECK EXIS`, giftCheckExisting);
       //console.log(giftCheckExisting.selected_by_id !== false);
       //console.log(giftCheckExisting.selected_by_id !== userIdObj);
       //console.log(userIdObj);

        try {
            if (giftCheckExisting.selected_by_id.equals(userIdObj)) {
               //console.log(`ALREADY SET IN DB`);
                response.json({
                    success: true
                });
                response.end();
                return;
            }
        } catch (e) {
            console.warn(e);
        }
        if (giftCheckExisting.selected_by_id !== false) {
            response.json({
                success: false,
                CODE: "ALREADY_SELECTED"
            });
            response.end();
            return;
        }
        let giftUnselect = await db.collection(`gifts`).findOneAndUpdate({
            selected_by_id: userIdObj,
            eventId: eventId
        }, {
            $set: {selected: false, selected_by_id: false}
        });
       //console.log(giftUnselect);
        let eventOwner = await db.collection(`events`).findOne({_id: eventId}, {
            projection: {
                created_by: 1,
                childName: 1,
                namesRefined:1
            }
        });



        let names = eventOwner.namesRefined;
        let newMap = reverseMap(names);
        let myalias = newMap[myPhone];
        let emailOwner = eventOwner.created_by;
        let childName = eventOwner.childName;
        let user = await db.collection(`users`).findOne({email: emailOwner});
        let tokens = user.FCM_Tokens;
        addBadge
            .ownerNotifyGift(db,{email: emailOwner},request.fields.eventId)
            .then(()=>{})
            .catch(()=>{});
        sendPushGiftSelected(request.app.get(`FCM`), tokens, request.fields.eventId, childName, myalias,user).then(()=>{}).catch(()=>{});
        let gidtUpdate = await db.collection(`gifts`).findOneAndUpdate({_id: gift}, {
            $set: {selected: true, selected_by_id: userIdObj}
        });
       //console.log(`gidupdate`, gidtUpdate);
        if (gidtUpdate.ok === 1) {
            response.json({success: true});
            return;
        }
        response.json({success: false});
       //console.log(`MARKING END`)
        return;
    }))
};