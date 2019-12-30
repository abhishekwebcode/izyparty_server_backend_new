function reverseMap(map) {
    let reverseMap={};
    for (let key in map) {
        reverseMap[map[key.toString()]]=key.toString();
    }
    return reverseMap;
};
module.exports = function (app) {
    const asyncer= app.get(`wrap`);
    app.post(`/events/listResponses`,asyncer( async function (request, response) {
        let db = request.app.get(`db`)();
        let isGuest = (request.fields.isGuest) === "true";
        let eventIdObject = request.app.get(`id`)(request.fields.eventId);
        let eventDetails = await db.collection(`events`).findOne({_id:eventIdObject});
        let responses = await db
            .collection(`responses`)
            .find({
                eventID: eventIdObject,
            })
            .project({
                _id: 1,
                registered: 1,
                intention: 1,
                email: 1,
                date_created: 1,
                isAllergy: 1,
                allergy1: 1,
                allergy2: 1,
                childNameAllergy:1,
                allergy3: 1,
                giftSelected:1
            })
            .sort({date_created: -1}).skip(parseInt(request.fields.offset)).limit(10).toArray();
        for (let i = 0; i < responses.length; i++) {
            responses[i].isGift=false;
            let objCurrent = responses[i];
            try {
               //console.log(isGuest,objCurrent.giftSelected,`GIFT SHOW`);
                if (!isGuest) {
                        if (false) {
                            let giftID = request.app.get(`id`)(objCurrent.giftSelected);
                            let gift = await db.collection(`gifts`).findOne({
                                _id: giftID
                            }, {
                                gift: 1
                            });
                            //let userGIFTID = request.app.get(`id`)(gift.selected_by_id );
                            //let user_full_name = await db.collection(`users`).findOne({_id:userGIFTID}, {name:1});
                            //let users_final_name = user_full_name.name;
                        }
                        let email = await app.get(`db`)().collection(`users`).findOne({email:responses[i].email});
                        let userIdObject = email._id;
                        let gift = await db.collection(`gifts`).findOne({selected:true,selected_by_id:userIdObject,eventId:eventIdObject});
                        if (gift!=null) {
                            responses[i].gift=gift.gift;
                            responses[i].isGift=true;
                        }
                }
            } catch (e) {
                console.error(e);
            }
            let reverse=reverseMap(eventDetails.namesRefined);
            try {
                if (responses[i].registered !== true) continue;
                let email = responses[i].email;
                delete responses[i].email;
                let linkedNumber= (await db.collection(`users`).findOne({email}, {
                    projection: {
                        "phone.number": 1
                    }
                })).phone.number;
                console.dir(reverse);
                console.dir(linkedNumber);
                responses[i].name=reverse[linkedNumber];
            } catch (e) {
                console.error(e);
            }
        }
        response.json({
            success: true,
            responses
        });
        return;
    }));
};