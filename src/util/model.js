var config = require('../config');

module.exports = function () {

    var getDB = function (req) {
        return req.client_db;
    };

    var getModel = function (req, modelName) {
        
        var model = getDB(req).model(modelName);
        
        if(config.model)
            return config.model(model, modelName);

        return model;
    };

    return {
        db: getDB,
        model: getModel
    };
}();