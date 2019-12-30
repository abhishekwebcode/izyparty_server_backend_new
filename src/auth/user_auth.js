var GoogleSignIn = require('google-sign-in');
var project = new GoogleSignIn.Project(`38743765127-elsf2nslqrmd5ce9nak3rfc2r3rn5s9s.apps.googleusercontent.com`);
const {FacebookSignIn} = require('@coolgk/facebook-sign-in');
const facebookSignIn = new FacebookSignIn({
    clientId: '405278700287006',
    secret: '091015732c5ff74759b137843f3f17c9'
});
var Accountkit = require('node-accountkit');
Accountkit.set(`303423527243659`, `c2bff7ffc2d663722eabdc1579324795`)

// to register user for new events

const userPushEvents = async function (DB, phone, user) {
    let events = await DB.collection(`events`).find(
        {
            unRegisteredNumbersInternational : {
                $in : [phone.number.toString()]
            }
        }
    ).toArray();
    let ObjectId = await DB.collection(`users`).find({email:user}).toArray()[0].ObjectId;
    await DB.collection(`events`).updateMany(
        {
            unRegisteredNumbersInternational : {
                $in : [phone.number.toString()]
            }
        },
        {
            "$pull": {"unRegisteredNumbersInternational": phone.number.toString()},
            "$addToSet" : {
                users : ObjectId
            }
        }
    );
    return ;
};


var resolveAccountKit = function (code) {
    return new Promise((resolve, reject) => {
        Accountkit.getAccountInfo(code, function (err, resp) {
            if (err) {
                reject(err);
            }
            resolve(resp);
        });
    });
};

var google_auth = async function (request, response) {
    try {
        let googleSignInResult = await project.verifyToken(request.fields.google_token);
        let userObjectGoogle = {
            email: googleSignInResult.email,
            email_verified: googleSignInResult.email_verified,
            name: googleSignInResult.name,
            picture: googleSignInResult.picture,
            given_name: googleSignInResult.given_name,
            family_name: googleSignInResult.family_name,
            locale: googleSignInResult.locale
        };
        let checkExisting = await request.app.get(`db`)().collection(`users`).find({email: userObjectGoogle.email}).limit(1).toArray();
        if (checkExisting.length === 0) {
            await googleSignUp(request, response, userObjectGoogle);
        } else {
            await googleSignIn(request, response, userObjectGoogle);
        }
    } catch (e) {
        response.json({success: false, CODE: e.message});
        response.end();
        return;
    }
};
var forgotPassword = async function (request, response) {
    let newPassword = request.fields.password;
    let db = request.app.get(`db`)();
    try {
        var response1 = await resolveAccountKit(request.fields.code);
        phone = response1.phone;
        let existing = await db.collection(`users`).findOne({
            "phone.number": phone.number
        });
        if (existing == null) {
            response.json({success: false, message: "USER_NOT_FOUND"});
            response.end();
            return;
        } else {
            let update = await db.collection(`users`).findOneAndUpdate({_id: existing._id}, {
                $set: {
                    password: newPassword
                }
            });
            if (update) {
                response.json({success: true});
                response.end();
                return;
            }
        }
        //console.log(phone);
    } catch (e) {
        console.error(e);
        response.json({success: false, CODE: `INVALID_FAK`});
        response.end();
        return;
    }
}
var googleSignUp = async function (request, response, new_one) {
    let insResult = await request.app.get("db")().collection(`users`).insertOne({
        google_meta: new_one,
        email: new_one.email,
        password: false,
    });
    if (insResult.insertedCount !== 1) {
        response.json({success: false, CODE: "DB_ERROR"});
    }
    let jwt_token = await (require("../auth/jwt/jwt")).generateToken({email: new_one.email, time: Date.now()});
    response.json({
        success: true,
        token: jwt_token
    });
};
var googleSignIn = async function (request, response, existing_one) {
    let jwt_token = await (require("../auth/jwt/jwt")).generateToken({email: existing_one.email, time: Date.now()});
    response.json({
        success: true,
        token: jwt_token
    });
};
var userLogIn = async function (request, response) {
    let phoneNumber = request.fields.number;
    if (phoneNumber.charAt(3)==0) phoneNumber = `+33`+phoneNumber.slice(4);
    let password = request.fields.password;
    let res = await request.app.get('db')().collection('users').find({
        "phone.number": phoneNumber,
        password
    }).limit(1).toArray();
    if (res.length === 0) {
        response.json({success: false, CODE: `USER_DOESNT_EXIST`});
        return;
    } else {
        let platform = request.fields.platform || "android";
        let updateToken = await request.app.get('db')().collection('users').findOneAndUpdate({
            "phone.number": phoneNumber,
            password
        }, {
            $set: {
                language: request.fields.language || "",
                platform,
                FCM_IOS: request.fields.iOSTOKEN,
                FCM_Tokens: [request.fields.token || ""],
                badgesMain: {
                    events: 0,
                    invites: 0,
                    gifts: 0
                },
                badgesEvents: [],
                badgesInvites: [],
                badgesGifts: [],
                badgesInvitesGifts: []
            }
        });
        //console.log(updateToken);
        let token_new = await (require("../auth/jwt/jwt")).generateToken({
            phone: res[0].phone,
            email: res[0].email,
            time: Date.now()
        });
        response.json({success: true, CODE: `USER_SUCCESS`, number: res[0].phone, token: token_new});
        return;
    }
};
var userSignUp = async function (request, response) {
    var phone;
    let email = request.fields.email;
    let name = request.fields.name;
    let password = request.fields.password;
    let passwordConfirm = request.fields.passwordConfirm;
    if (password !== passwordConfirm) {
        response.json({
            success: false,
            message: "Passwords do not match"
        });
        return;
    }
    if (email == "" || password == "" || name == "" || passwordConfirm == "") {
        response.json({success: false, message: ` Please Fill all the fields correctly`});
        return;
    } else {
        try {
            var response1 = await resolveAccountKit(request.fields.code);
            phone = response1.phone;
            //console.log(phone);
        } catch (e) {
            console.error(e);
            response.json({success: false});
            return;
        }
        //console.log(request.fields, "FIELDS");
        /**
         * Added email <b>AND</b> Mobile number duplicated check
         */
        let res = await request.app.get("db")().collection(`users`).find({
            $or: [
                {email: email},
                {"phone.number": phone.number}
            ]
        }).limit(1).toArray();
        if (res.length === 0) {
            let rr = await request.app.get("db")().collection(`users`).insertOne({
                email,
                name,
                password,
                phone,
                email_verified: false,
                invited: [],
                meta: {},
                FCM_Tokens: []
            });
            //let token = await (require("../auth/jwt/jwt")).generateToken({email, time: Date.now()});
            if (rr.insertedCount === 1) {
                let DB = request.app.get("db")();
                userPushEvents(DB, phone, email).then(() => {
                    }).catch(() => {
                });
                response.json({success: true, CODE: `EMAIL_VERIFICATION_PENDING`})
            } else {
                response.json({
                    success: false,
                    CODE: `BACKEND_ERROR`,
                    message: "Somethings seems wrong! Let us know via feedback on the app store"
                })
            }
        } else {
            if (res[0].email_verified || true) {
                response.json({success: false, CODE: `ALREADY_SIGNED_UP`, message: "You are already signed up"});
                response.end();
            } else {
                response.json({
                    success: false,
                    CODE: `EMAIL_VERIFICATION_PENDING`,
                    message: "You are already signed up"
                });
                response.end();
            }
        }
    }
    return;
};

async function facebook(request, response) {
    //console.log(arguments);
    let user = await facebookSignIn.verify(request.fields.facebook_token);
    if (!user) {
        response.json({success: false, CODE: `FACEBOOK_AUTH_FAILED`})
    } else {
        let email = user.email;
        if (email !== undefined && email !== null && email.indexOf('@') > -1) {
            let resfb = await request.app.get('db')().collection(`users`).find({email}).limit(1).toArray();
            if (resfb.length == 0) {
                await request.app.get('db')().collection(`users`).insertOne({
                    username: false,
                    email,
                    facebook_meta: user,
                    password: false
                });
                let jwt_token = await (require("../auth/jwt/jwt")).generateToken({email, time: Date.now()});
                response.json({
                    success: true,
                    token: jwt_token
                });
            } else {
                let jwt_token = await (require("../auth/jwt/jwt")).generateToken({email: email, time: Date.now()});
                response.json({
                    success: true,
                    token: jwt_token
                });
            }
        } else {
            response.json({success: false, CODE: `EMAIL_DENIED`})
        }
    }
};
module.exports.sign_up = userSignUp;
module.exports.login = userLogIn;
module.exports.google_auth = google_auth;
module.exports.facebook = facebook;
module.exports.resetPassword = forgotPassword;
