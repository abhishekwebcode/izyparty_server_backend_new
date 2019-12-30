module.exports=function (token,email,res) {
    const fs   = require('fs');
    const jwt  = require('jsonwebtoken');
   //console.log(process.cwd())
    var privateKEY  = fs.readFileSync('src/auth/jwt/private.key', 'utf8');
    var publicKEY  = fs.readFileSync('src/auth/jwt/public.key', 'utf8');
    var i  = 'MyJobsApp';          // Issuer
    var s  = email;
    var a  = 'http://http://myjobsapp.ml'; // Audience

    var verifyOptions = {
        issuer:  i,
        subject:  s,
        audience:  a,
        expiresIn:  "12h",
        algorithm:  ["RS256"]
    };

    try {
        var legit = jwt.verify(token, publicKEY, verifyOptions);
        return legit;
    } catch (e) {
        res.json({
            success:false,message:"Invalid auth",CODE:'INVALID_AUTH'
        })
        res.end()
        return false;
    }
}
