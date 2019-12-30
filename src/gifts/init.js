/**
 *
 * @param {number} app
 */
module.exports=function(app) {
    //register main events handler
    require(`./gifts`)(app);
};

