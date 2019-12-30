//logging for all requests
var fs = require('fs');
var util = require('util');
//console.error =//console.log;
// initialize express app
var path = require('path');
const formidableMiddleware = require('express-formidable');
const events = require(`events`);
const eventEmitter = new events.EventEmitter();
const ObjectId = require('mongodb').ObjectId;
const mongo = require("../mongodb/mongodb");
var getDB = mongo;
const {parse, stringify} = require('flatted/cjs');
process.env.NODE_ENV = 'production';
const fcm = require(`../FCM/init`);
const express = require('express');
const asyncer = require('../util/asyncHandler');
const app = express();
const getRawBody = require('raw-body');
app.use(function (req, res, next) {
    return next();
    getRawBody(
        stream = req,
        options = {
            length: req.headers['content-length'],
            limit: '10kb',
        },
        callback = function (err, reslt) {
            if (err) {
                return res.status(500).end();
            }
            next();
        })
});
app.set('wrap',asyncer);
app.set(`FCM`,fcm);
app.use(formidableMiddleware());
function modifyResponseBody(req, res, next) {
    console.log(`===============================================================`);
    console.log(`REQUEst`,req);
    var oldSend = res.send;
    res.send = function (data) {
        // arguments[0] (or `data`) contains the response body
        console.log(`OUTPUT\n`,data);
        oldSend.apply(res, arguments);
    }
    next();
}
app.use(modifyResponseBody);
//app.use(express.urlencoded({extended: true}));
//app.use(cookieParser());
app.set(`db`, mongo);
app.set(`id`, ObjectId);
app.set(`event`, eventEmitter);
app.set(`invite_link`,`https://izyparty.com/install?autodetect`);
// Do all auth functions
let user_auth = require(`../auth/user_auth`);
app.all(`/`,function (req,res) {
    res.json({
        date : new Date()
    });
    res.end();
    return;
})
app.all(`/app/*`,function(req,res) {
    res.send(`Forgot password content will be hosted here when hosting from client is received,thanks`);
    res.end();
    return;
});
app.all('/password/reset', asyncer(user_auth.resetPassword));
app.all('/signup', asyncer(user_auth.sign_up));
app.all(`/login`, asyncer(user_auth.login));
app.all('/google_auth', asyncer(user_auth.google_auth));
app.all('/facebook_auth', asyncer(user_auth.facebook));
// require auth to proceed
require(`../classes/jwt-check`)(app);
//All other session related functions below
//remove FIREBASE TOKEN on logout
app.post(`/logout`,function (request,response,next) {
   let db = request.app.get(`db`)();
   db.collection(`users`).findOneAndUpdate({
       email:request.email
   },{
       $set : {FCM_Tokens:[]}
   }).then((e)=>{
       //console.error(e);
   }).catch((e)=>{
       //console.error(e);
   });
   response.end();
   return;
});
//enable self identity functions
require(`../me/init`)(app);
// enable event handlers and functions
require(`../events/init`)(app);
// enable to-do functions
require(`../todo/init`)(app);
// enable gifts functions
require(`../gifts/init`)(app);
// enable badges for iOS
require(`../badges/badges`)(app);
// add error handler
app.use((err, req, res, next) => {
    // log the error...
    console.debug(arguments);
    res.json({success:false,message:`Server error occurred`});
    res.end();
    return;
});
app.listen(
    process.env.PORT || 2082,
    () => {
        console.log(`Example app listening on port ${process.env.PORT || 2082} !`)
    }
);
process.on("uncaughtException", function () {
   //console.log(arguments);
});
process.on("uncaughtRejection", function () {
   //console.log(arguments);
});

//console.log(app);