module.exports=function (app) {
    const asyncer = app.get(`wrap`);
    app.all(`/me/profile`,asyncer(async function (request,response) {
        let email = request.email;
       //console.log(email);
        let res=await request.app.get("db")().collection(`users`).find({email}).project({email:1,name:1}).limit(1).toArray();
        response.json({
            success:true,
            data:(res.length==0)?[{email:"Not found",name:"..."}]:res[0]
        })
    }));
    app.all(`/me/changePassword`,asyncer(async function(request,response) {
        let exisitng = request.fields.existing;
        let new1 = request.fields.new;
        let confirm = request.fields.confirm;
        let email = request.email;
        let res=await request.app.get("db")().collection(`users`).find({email,password:exisitng}).project({password:1}).limit(1).toArray();
        if (res.length==0) {
            response.json({success:false});return ;
        }
        else {
                await request.app.get("db")().collection(`users`).findOneAndUpdate(
                    {email},
                    {
                        $set: {password: new1}
                    }
                );
            response.json({success:true});
            return ;
        }
    }));
}