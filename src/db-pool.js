var mongoose = require('mongoose'),
    autoNumber = require('mongoose-auto-number');

module.exports = function() {

    var db_pool = [];

    function mapModels(db) {

        var modelSchemas = require('./config').modelSchemas;

        Object.keys(modelSchemas).map(function(item) {
            db.model(item, modelSchemas[item]);
        });

        autoNumber.init(db);
    }

    function createDB(conn) {

        var db;

        if (typeof conn == 'string') {

            db = mongoose.createConnection(conn);
            db_pool[conn] = db;

        } else if (typeof conn == 'object') {

            db = mongoose.createConnection(conn.uri, conn.options);
            db_pool[conn.uri] = db;

        }

        mapModels(db);

        return db;
    }

    var getDB = function(conn) {

        if (typeof conn == 'string')
            return db_pool[conn] || createDB(conn);

        else if (typeof conn == 'object')
            return db_pool[conn.uri] || createDB(conn);
    };
    return {
        getDB: getDB
    };
}();
