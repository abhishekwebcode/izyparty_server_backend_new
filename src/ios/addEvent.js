const updateBadges=async function(DB,users) {
    const ids = [];
    users.forEach(e=>{

    });
};

const sendPushIos=async function(FCM,registeredUsers, ids, db, eventIdObject, app, OwnerName, childName) {
    /*
        iOS adaption to notifications
    */
    console.log(`ARGUMENTS adD EVENT IOS`,arguments);
    let iosTokensEnglish=[];
    let iosTokensFrench=[];
    registeredUsers.forEach(e=>{
        try {
            if (e.FCM_IOS) {
                if (e.language==="french") {
                    iosTokensFrench.push(e.FCM_IOS);
                } else {
                    iosTokensEnglish.push(e.FCM_IOS);
                }
            }
        } catch (e) {
            console.error(e)
        }
    });


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
    let messageFrench = {
        collapse_key: 'New Invite',
        notification:{
            "sound": "default",
            title:`Nouvelle invitation pour ${childName} fête`,
            body:`RSVP vous a envoyé à une fête par ${OwnerName}`
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
    message["registration_ids"] = iosTokensEnglish;
    messageFrench["registration_ids"] = iosTokensFrench;
    console.log(messageFrench,message);
    console.log(`Add event debug`,FCM,messageFrench);
    console.log(`add event debug`,FCM,message);
    FCM(messageFrench).then(e=>{
        console.log(`french add event send`,messageFrench,e,FCM);
    }).catch((e)=>{
        console.log(`french add event not sent`,messageFrench,e,FCM);
    });
    FCM(message).then(e=>{
        console.log(`english add event send`,message,e,FCM);
    }).catch((e)=>{
        console.log(`english add event not sent`,message,e,FCM);
    });
    /*
        Update badges for ios devices
    */
    Promise.resolve(updateBadges(db,registeredUsers)).then(e=>{}).catch(e=>{
        console.error(e)
    });
    return 1;
};  //dsfliohdoifh
module.exports=sendPushIos;