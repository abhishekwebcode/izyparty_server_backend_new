module.exports=function (app) {
    const wrapper = app.get(`wrap`);
    app.all(`/badge/overview`,
        wrapper(async function (request,response,next) {
            let db = app.get(`db`)();
            let badges = await db.collection(`users`).findOne({email: request.email},{
                projection: {
                    badgesMain:1
                }
            });
            response.json({success:true,data:badges})
        })
    )
    app.all(`/badge/events_test`,wrapper(async function(request,response,next) {
        next();
    }));
    app.all(`/badge/events`,wrapper(async function(request,response,next) {
        let db = app.get(`db`)();
        let badges = await db.collection(`users`).findOne({email: request.email},{
            projection: {
                badgesEvents:1
            }
        });
        response.json({success:true,data:badges})
    }));
    app.all(`/badge/invites`,wrapper(async function(request,response,next) {
        let db = app.get(`db`)();
        let badgesDEBYG = await db.collection(`users`).findOne({email: request.email},{
            projection: {
                badgesInvitesGifts:1
            }
        });
        console.log(`DEBUG GIFTS ADD`,badgesDEBYG);
        let badges = await db.collection(`users`).findOne({email: request.email},{
            projection: {
                badgesInvites:1
            }
        });
        response.json({success:true,data:badges})
    }));
    app.all(`/badge/gifts`,wrapper(async function(request,response,next) {
        let db = app.get(`db`)();
        let badges = await db.collection(`users`).findOne({email: request.email},{
            projection: {
                badgesGifts:1
            }
        });
        response.json({success:true,data:badges})
    }));
    app.all(`/badge/invitesGifts`,wrapper(async function(request,response,next) {
        console.log(`badges invites triggered`);
        let db = app.get(`db`)();
        let badges = await db.collection(`users`).findOne({email: request.email},{
            projection: {
                badgesInvitesGifts:1
            }
        });
        response.json({success:true,data:badges})
    }));
};