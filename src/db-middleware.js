module.exports = function (req, res, next) {

    var getDB = require('./db-pool').getDB,
        config = require('./config');

    if (config.multiDB) {
        req.client_db = getDB(req.headers[config.dbReqHeader]);
        next();

    } else {
        req.client_db = getDB(config.dbPath);
        next();
    }

};