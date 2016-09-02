var mongoose = require('mongoose'),
    autoNumber = require('mongoose-auto-number');

module.exports = function () {

    var db_pool = [];

    function mapModels(db) {

        var modelSchemas = require('./config').modelSchemas;

        Object.keys(modelSchemas).map(function (item) {
            db.model(item, modelSchemas[item]);
        });

        autoNumber.init(db);
    }

    function createDB(uri) {

        var db = mongoose.createConnection(uri);

        db_pool[uri] = db;

        mapModels(db);

        return db;
    }

    var getDB = function (uri) {
        return db_pool[uri] || createDB(uri);
    };

    return {
        getDB: getDB
    };
}();