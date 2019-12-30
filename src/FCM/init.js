const FCM = require('fcm-push');
const FCMSERVERKEY=`AAAA3A1C3N8:APA91bGoFcg956dbUIlP3tdIlo-xJz3fe9EKRTwwE6WL1mWuxl4Uv4wbbkTrwMmYNvLkc6Lk57FgWQkVg_8gSjwsFolKbcoLJChEH7KnBZVQUrxdQrzhI1G3bywnGkdqrxrYTm8MNzno`;
const fcm = new FCM(FCMSERVERKEY);
module.exports=function (payload) {
    return fcm.send(payload);
};