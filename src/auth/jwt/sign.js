module.exports=function (payload,email) {
    const fs   = require('fs');
    const jwt  = require('jsonwebtoken');
    // PRIVATE and PUBLIC key
    var privateKEY  = fs.readFileSync('src/auth/jwt/private.key', 'utf8');
    var publicKEY  = fs.readFileSync('src/auth/jwt/public.key', 'utf8');
    var i  = 'MyJobsApp';          // Issuer
    var s  = email;
    var a  = 'http://http://myjobsapp.ml'; // Audience
    // SIGNING OPTIONS
    var signOptions = {
        issuer:  i,
        subject:  s,
        audience:  a,
        expiresIn:  "365 days",
        algorithm:  "RS256"
    };
    return token = jwt.sign(payload, privateKEY, signOptions);
}
