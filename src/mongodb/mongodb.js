let options = {
        auto_reconnect: true,
        keepAlive: 1,
        connectTimeoutMS: 6000000,
        socketTimeoutMS: 6000000,
    useNewUrlParser: true,
    reconnectTries: Number.MAX_SAFE_INTEGER,
    reconnectInterval: 1000,
    poolSize: 10,
    bufferMaxEntries: 0
};
const uri = "mongodb://localhost:27017";
const MongoClient = require('mongodb').MongoClient;
var db;
function createDBconnection() {
    MongoClient.connect(uri, options, function (err, client) {
        if (err) {
            console.error(err);
           //console.log(`DB FAILED CONNECTION`)
        };
        db = client.db(`test`);
       //console.log(`MONGODB CONNECTED NOW`);
        try {
            db.on('reconnectFailed', (err) => {
               //console.log(`MONGODB ERROR RECONNECT FAILED`);
                console.warn(err);
                createDBconnection()
            });
            db.s.topology.on('close', () => {
               //console.log('Connection closed');
            });
            db.s.topology.on('reconnect', () => {
                //console.log('Reconnected MONGODB'));
            });
        } catch (e) {
            console.error(e);
        }
    });
}

MongoClient.connect(uri, options, function (err, client) {
    if (err) {
        console.error(err);
       //console.log(`DB FAILED CONNECTION`)
    };
    db = client.db(`test`);
   //console.log(`MONGODB CONNECTED NOW`);
    try {
        db.on('error', function (err) {
            if (err)  {
                createDBconnection();
                return err;
            }
            return ;
        });
        db.on('reconnectFailed', (err) => {
           //console.log(`MONGODB ERROR RECONNECT FAILED`);
            console.warn(err);
            createDBconnection()
        });
        db.s.topology.on('close', () => {
           //console.log('Connection closed');
        });
        db.s.topology.on('reconnect', () => {
            //console.log('Reconnected MONGODB'));
        });
    } catch (e) {
        console.error(e);
    }
});
/**
 * Returns the sum of a and b
 * @returns {MongoClient} Promise object represents the sum of a and b
 */
function getDB() {
    return db;
}

module.exports = getDB;