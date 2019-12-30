const updateBadges=async function(DB,users) {
    const ids = [];
    users.forEach(e=>{

    });
};
const changeEvent=async function(FCM,tokens,eventIDObj,ownerName,childName) {
    console.log(arguments)
    /*
        iOS adaption to notifications
    */
    let iosTokensEnglish=[];
    let iosTokensFrench=[];
    tokens.forEach(e=>{
        try {
            if (e.FCM_IOS) {
                if (e.language==="french") {
                    iosTokensFrench.push(e.FCM_IOS);
                } else {
                    iosTokensEnglish.push(e.FCM_IOS);
                }
            }
        } catch (e) {
        }
    });
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
    let payloadFrench = {
        notification:{
            "sound": "default",
            title:`Certains changements ont été effectués pour ${childName} fête`,
            body:`Appuyez ici pour voir les modifications apportées par ${ownerName}`
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
    // asdiuh
    payloadEnglish["registration_ids"] = iosTokensEnglish;
    payloadFrench["registration_ids"] = iosTokensFrench;
    FCM(payloadEnglish).then(()=>{}).catch(()=>{});
    FCM(payloadFrench).then(()=>{}).catch(()=>{});
    console.log(`event update`,payloadFrench,payloadEnglish);
    /*
        Update badges for ios devices
    */
    Promise.resolve(updateBadges(db,tokens)).then(e=>{}).catch(e=>{});
    return 1;
};
module.exports=changeEvent;