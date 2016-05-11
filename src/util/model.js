module.exports = function () {

    var getDB = function (req) {
        return req.client_db;
    };

    var getModel = function (req, model) {
        return getDB(req).model(model);
    };

    return {
        db: getDB,
        model: getModel
    };
}();