const ObjectID = require('mongodb').ObjectID;
module.exports=function (app) {
    const asyncer = app.get(`wrap`);
    app.post(`/todos/delete`,asyncer(async function (request,response) {
        let id = request.fields.todoId;
        let todoId = request.app.get(`id`)(id);
        let delete2 = await request.app.get(`db`)().collection(`todo`).remove({_id:todoId});
        response.json({
            success:delete2.result.n===1
        })
        return ;
    }));
    app.post(`/todos/list`,asyncer(async function (request,response) {
       //console.log(arguments);
        let todos = await app.get(`db`)().collection(`todo`).find({
            created_by:request.email,eventId:request.fields.eventId
        }).project({_id:1,todo:1,done:1,date_created:1}).sort({}).skip(parseInt(request.fields.offset)).limit(10).toArray();
        response.json({
            success:true,todos
        })
        return ;
    }));
    app.post(`/todos/update`,asyncer(async function (request,response) {
       //console.log(arguments);
        let todo = request.fields.itemID;
        let status = request.fields.status==="true";
       //console.log(todo);
       //console.log(status);
        let result = await request.app.get(`db`)().collection(`todo`).updateOne({_id:request.app.get(`id`)(todo)},{$set:{done:status}},{upsert:true})
       //console.log(result);
        response.json({success:result.modifiedCount==1});
        return ;
    }));
    app.post(`/todos/create`,asyncer(async function (request,response) {
        let todo = request.fields.todo;
        let eventId = request.fields.eventId;
        let todoIns = await app.get(`db`)().collection(`todo`).insertOne({
            todo,eventId,created_by:request.email,date_created:Date.now(),done:false
        });
        if (todoIns.insertedCount==1) {response.json({success: true})}
        else {response.json({success: false,message:`Error creating your task`});}
        return ;
    }));
};