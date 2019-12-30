module.exports= async function (db,user_email) {
    let user = await db.findOne({email:user_email}).toArray()[0];
    return user;
}
