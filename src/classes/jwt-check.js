const bearerToken = require('express-bearer-token');
module.exports=function (app) {
    const asyncer = app.get(`wrap`);
    app.use(bearerToken());
    app.all("*",asyncer( async function (req, res, next) {
        try {
            //let meta = require(`../auth/jwt/verify`)(res.token, res.email, res);
           //console.log("token is", req.token);
            let meta = await (require("../auth/jwt/jwt").getPayloadFromToken(req.token));
           //console.log(meta);
            if (!meta) {
                res.json({success: false, loggedOutError:true});
                res.end();
                return;
            }
            let DB = req.app.get(`db`)();
            let user = await DB.collection(`users`).findOne({email:meta.email});
            req.meta = user;
            req.User = meta;
            req.email = meta.email;
            next();
            return ;
        } catch (e) {
            console.error(e);
            res.json({success:false,loggedOutError:true});
            return ;
        }
    }));
};