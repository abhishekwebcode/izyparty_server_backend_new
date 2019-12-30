const removeInner = function (DB,user,key,eventID) {
    //console.trace(`badges remove inner`);
    console.log(arguments);
    let update={};
    update[key]=eventID;
    console.log(`paramters remove inner`,
        DB,
        {
            email:user.email
        },
        {
            $pull : update
        }
    );
    DB.collection(`users`).findOneAndUpdate(
        {
            email:user.email
        },
        {
            $pull : update
        }
    )
        .then((e)=>{
            console.log(`remove inner`,e)
        })
        .catch((e)=>{
            console.log(`remove inner`,e)
        });
};
module.exports=removeInner;