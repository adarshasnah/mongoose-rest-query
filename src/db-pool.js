var mongoose = require('mongoose'),
    autoNumber = require('mongoose-auto-number'),
    _ = require('lodash');

module.exports = function () {

    var db_pool = [];

    function mapModels(db) {

        var schemas = require('./config').schemas;

        Object.keys(schemas).map(function (item) {
            db.model(_.capitalize(item), schemas[item]);
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