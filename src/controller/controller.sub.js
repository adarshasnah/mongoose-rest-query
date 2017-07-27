module.exports = function (ModelName, subItemName) {

    var _ = require('lodash'),
        model = require('../util/model').model;

    function getModel(req) {
        return model(req, ModelName);
    }

    function save(req, res, initalItemKeys, keysToReturn) {
        req.model.save(function (err, data) {

            var result = [];
            var itemKeys = extractObjectIdFromList(data[subItemName]);
            var newItemKey = _.difference(itemKeys, initalItemKeys);

            if ((keysToReturn) && (keysToReturn.length > 0)) {
                for (var y = 0; y < keysToReturn.length; y++) {
                    result.push(data[subItemName].id(keysToReturn[y]));
                }
            } else {
                for (var x = 0; x < newItemKey.length; x++) {
                    result.push(data[subItemName].id(newItemKey[x]));
                }
            }

            if (err)
                res.status(500).send(err);
            else {
                if (result.length == 1)
                    res.status(201).send(result[0]);
                else
                    res.status(201).send(result);
            }

        });
    }

    function getAutoIncrementFields(Model) {
        var autofields = '';

        var fields = Object.keys(Model.schema.paths);

        for (var x = 0; x < fields.length; x++) {
            var fieldOption = Model.schema.paths[fields[x]].options;

            if (fieldOption.autoIncrement) {
                autofields += fields[x] + ' ';
            }
        }

        return autofields;
    }

    function extractObjectIdFromList(items) {
        var ids = [];

        for (var x = 0; x < items.length; x++) {
            ids.push(items[x].id);
        }

        return ids;
    }

    var subResourceName = function () {
        return subItemName.toLowerCase() + 's';
    };

    var setModel = function (req, res, next) {
        var Model = getModel(req);

        //var fieldsToSelect = getAutoIncrementFields(Model) + subItemName;

        Model
            .findById(req.params.id)
            //.select(fieldsToSelect)
            .exec(function (err, data) {
                if (err)
                    res.status(500).send(err);
                else if (data) {
                    req.model = data;
                    next();
                } else {
                    res.status(404).send('Not found');
                }
            });
    };

    var list = function (req, res) {
        res.status(200).send(req.model[subItemName]);
    };

    var create = function (req, res) {

        var initalItemKeys = extractObjectIdFromList(req.model[subItemName]);

        if (_.isArray(req.body)) {
            for (var x = 0; x < req.body.length; x++) {
                req.model[subItemName].push(req.body[x]);
            }

        } else
            req.model[subItemName].push(req.body);

        save(req, res, initalItemKeys);
    };

    var getById = function (req, res) {
        res.status(200).send(req.model[subItemName].id(req.params.itemId));
    };

    var updateById = function (req, res) {

        var item = req.model[subItemName].id(req.params.itemId);

        for (var p in req.body) {
            item[p] = req.body[p];
        }

        req.model.save(function (err, data) {
            if (err)
                res.status(500).send(err);
            else
                res.status(201).send(data[subItemName].id(req.params.itemId));
        });

    };

    var updateMany = function (req, res) {

        var keysToReturn = extractObjectIdFromList(req.body);

        for (var x = 0; x < req.body.length; x++) {

            var item = req.model[subItemName].id(req.body[x].id);

            for (var p in req.body[x]) {
                item[p] = req.body[x][p];
            }
        }

        save(req, res, [], keysToReturn);

    };

    var deleteById = function (req, res) {
        req.model[subItemName].pull({
            _id: req.params.itemId
        });

        save(req, res);

    };

    var deleteMany = function (req, res) {

        for (var x = 0; x < req.body.length; x++) {
            req.model[subItemName].pull({
                _id: req.body[x].id
            });
        }

        save(req, res);

    };

    return {
        subResourceName: subResourceName,
        setModel: setModel,
        list: list,
        create: create,
        getById: getById,
        updateById: updateById,
        updateMany: updateMany,
        deleteById: deleteById,
        deleteMany: deleteMany
    };
};