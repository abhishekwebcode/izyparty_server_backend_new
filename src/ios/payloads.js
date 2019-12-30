/*
These are the payloads , same are made for french for each one of them
 */

//ADD EVENT

let message = {
    collapse_key: 'New Invite',
    notification:{
        "sound": "default",
        title:`New invite for ${childName} party`,
        body:`You have been sent RSVP to a party by ${OwnerName}`
        /*
        * May work "click_action": "defaultCategory"
        */
    },
    "content_available": true,
    "mutable_content": true,
    data: {
        "mutable-content" : true,
        type: `NEW_INVITE`,
        eventId: eventIdObject.toString(),
        Date: Date.now(),
        OwnerName:OwnerName,
        Action: `INVITE`,
        childname: childName
    },
};

// CHANGE EVENT

let payloadEnglish = {
    notification:{
        "sound": "default",
        title:`Some changes were done for ${childName} party`,
        body:`Tap here to view changes made by ${ownerName}`
        /*
        * May work "click_action": "defaultCategory"
        */
    },
    "content_available": true,
    "mutable_content": true,
    collapse_key: 'New Invite',
    data: {
        "mutable_content": true,
        type: `CHANGE_EVENT`,
        eventId: eventIDObj.toString(),
        Date: Date.now(),
        OwnerName: ownerName,
        Action: `INVITE`,
        childname: childName
    }
};

//GIFT ADDED

let message = {
    collapse_key: 'New Invite',
    notification: {
        title: `New gift choice added for ${childname} party`,
        body: `New gift choice ${gift}. Tap here to select this gift choice before it is gone.The gift choice
        was added by ${ownername} `
        /*
        * May work "click_action": "defaultCategory"
        */
    },
    "content_available": true,
    "mutable_content": true,
    data: {
        "mutable-content": true,
        type: `GIFT_ADD`,
        gift,
        eventId: eventID.toString(),
        Date: Date.now(),
        Action: `INVITE`,
        childname: childname,
        OwnerName: ownername
    }
};


// GIFT SELECTED

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
        title:`New gift selected for ${childName} party`,
        body:`Tap here to view gift selected by ${linkedName}`
        /*
        * May work "click_action": "defaultCategory"
        */
    },
    "content_available": true,
    "mutable_content": true
};

// GIFT DELETED

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
        title:`Your selected gift ${existing.gift} was deleted by ${organiser.name}`,
        body:`Tap here to select a new gift for party of ${event.childName}`
        /*
        * May work "click_action": "defaultCategory"
        */
    },
    "content_available": true,
    "mutable_content": true
};

// REJECT OR ACCEPT EVENT - EVENT RESPONDED this is sent to owner of event

payload = {
    to:ownerObject.FCM_IOS,
    collapse_key: 'New Invite',
    notification:{
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