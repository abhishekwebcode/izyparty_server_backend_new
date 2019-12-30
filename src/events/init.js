
module.exports=function(app) {
    //register main events handler
    require(`./event`)(app);
    // register add event handler
    require(`./addEvent`)(app);
    // register invites handler
    require(`./invites`)(app);
    // register responses handler
    require(`./responses`)(app);
    // register change contacts handler
    require(`./changeContacts`)(app);
    //attendees handler
    require(`./attendees`)(app);
    //events overview handler
    require(`./overview`)(app);
};

