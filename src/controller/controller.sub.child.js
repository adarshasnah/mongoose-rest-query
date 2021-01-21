module.exports = function (ModelName, subItemName, childName) {

    var _ = require('lodash'),
        model = require('../util/model').model;

    function getModel(req) {
        return model(req, ModelName);
    }

    function extractObjectIdFromList(items) {
        var ids = [];

        for (var x = 0; x < items.length; x++) {
            ids.push(items[x].id);
        }

        return ids;
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

    function save(req, res, initalKeys, keysToReturn) {

        req.model.save(function (err, data) {
            if (err)
                return res.status(500).send(err);

            var result = [];

            var updatedItem = data[subItemName].id(req.params.itemId);
            var childKeys = extractObjectIdFromList(updatedItem[childName]);
            var newKey = _.difference(childKeys, initalKeys);

            if ((keysToReturn) && (keysToReturn.length > 0)) {
                for (var y = 0; y < keysToReturn.length; y++) {
                    result.push(updatedItem[childName].id(keysToReturn[y]));
                }
            } else {
                for (var x = 0; x < newKey.length; x++) {
                    result.push(updatedItem[childName].id(newKey[x]));
                }
            }

            if (result.length == 1)
                res.status(201).send(result[0]);
            else
                res.status(201).send(result);

        });
    }

    var set = function (req, res, next) {

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
                    req.subItem = data[subItemName].id(req.params.itemId);
                    next();
                } else {
                    res.status(404).send('Not found');
                }
            });

    };

    var list = function (req, res) {
        res.send(req.subItem[childName]);
    };

    var create = function (req, res) {

        var initalKeys = extractObjectIdFromList(req.subItem[childName]);

        if (_.isArray(req.body)) {
            for (var x = 0; x < req.body.length; x++) {
                req.subItem[childName] = req.subItem[childName].concat(req.body[x]);
            }

        } else
            req.subItem[childName].push(req.body);

        save(req, res, initalKeys);

    };

    var updateMany = function (req, res) {

        var keysToReturn = extractObjectIdFromList(req.body);

        for (var x = 0; x < req.body.length; x++) {

            var item = req.subItem[childName].id(req.body[x].id);

            for (var p in req.body[x]) {
                item[p] = req.body[x][p];
            }
        }

        save(req, res, [], keysToReturn);

    };

    var get = function (req, res) {
        res.send(req.subItem[childName].id(req.params.childId));
    };

    var update = function (req, res) {

        var child = req.subItem[childName].id(req.params.childId);

        for (var p in req.body) {
            child[p] = req.body[p];
        }

        req.model.save(function (err, updatedModel) {

            var subitem = updatedModel[subItemName].id(req.params.itemId);
            var child = subitem[childName].id(req.params.childId);

            res.send(child);
        });

    };

    var remove = function (req, res) {

        req.subItem[childName].pull({
            _id: req.params.childId
        });

        req.model.save(function (err, updatedModel) {
            res.send(updatedModel);
        });

    };

    return {
        set: set,
        list: list,
        create: create,
        updateMany: updateMany,
        get: get,
        update: update,
        remove: remove
    };

};