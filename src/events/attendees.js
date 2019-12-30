function reverseMap(map) {
    let reverseMap={};
    for (let key in map) {
        reverseMap[map[key.toString()]]=key.toString();
    }
    return reverseMap;
};
module.exports=function (app) {
    const asyncer = app.get(`wrap`);
    app.post(`/event/getAttendees`,asyncer(async function(request,response,next) {
        let db = request.app.get(`db`)();
        let eventIDObject = request.app.get(`id`)(request.fields.eventId);
        let eventDetails = await db.collection(`events`).find({_id:eventIDObject}).project({users:1,unRegisteredNumbersInternational:1,namesRefined:1}).limit(1).toArray();
        eventDetails=eventDetails[0];
        //console.log(eventDetails);
       //console.log(eventIDObject);
       //console.log(eventDetails);
        let numbers = eventDetails.unRegisteredNumbersInternational;
       //console.log(eventDetails.users,`array $In`);
        let users = await db.collection(`users`).find({
            _id: { $in : eventDetails.users }
        }).project({name:1,"phone.number":1}).toArray();
        let usersToSend = {};
        let usersMap = eventDetails.namesRefined;
        let reverse = reverseMap(usersMap);
        for (let i = 0; i < users.length; i++) {
            let number = users[i].phone.number;
            if (reverse[number]) {
                delete usersMap[reverse[number]];
                usersToSend[reverse[number]]=number;
            }
        }
        response.json({
            success:true,
            data : {
                users:usersToSend,
                numbers:usersMap
            }
        });
        console.dir({
            success:true,
            data : {
                users:usersToSend,
                numbers:usersMap
            }
        });
        return ;
    }));
};