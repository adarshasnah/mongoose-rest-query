var ObjectId = require('mongoose').Types.ObjectId;
var ServerResponse = require('http').ServerResponse;
var _ = require('lodash');
var moment = require('moment');

module.exports = function (ModelName) {

    var model = require('../util/model').model,
        getQuery = require('../').getQuery;

    function getModel(req) {
        return model(req, ModelName);
    }

    var list = function (req, res) {
        var Model = getModel(req);

        var query = {};

        if (req.query) {
            query = getQuery(req.query, Object.keys(Model.schema.paths));
        }

        Model
            .find(query.filter)
            .select(query.select)
            .populate(query.populate)
            .sort(query.sort)
            .limit(query.limit)
            .skip(query.skip)
            .exec(function (err, data) {
                if (err)
                    res.status(500).send(err);
                else
                    res.json(data);
            });
    };

    var count = function (req, res) {
        var Model = getModel(req);

        var query = {
            filter: {}
        };

        if (req.query) {
            query = getQuery(req.query, Object.keys(Model.schema.paths));
        }

        Model.count(query.filter, function (err, data) {
            if (err)
                res.status(500).send(err);
            else
                res.json(data);
        });

    };

    var create = function (req, res) {
        var Model = getModel(req);

        Model.create(req.body, function (err, data) {
            if (err)
                res.status(500).send(err);
            else
                res.status(201).send(data);

        });
    };

    var get = function (req, res) {
        var Model = getModel(req);

        var query = {};

        if (req.query) {
            query = getQuery(req.query, Object.keys(Model.schema.paths));
        }

        Model
            .findById(req.params.id)
            .select(query.select)
            .populate(query.populate)
            .exec(function (err, data) {
                if (err)
                    res.status(500).send(err);
                else if (data) {
                    res.status(200).send(data);
                } else {
                    res.status(404).send('Not found');
                }
            });
    };

    var update = function (req, res) {

        var Model = getModel(req);

        Model.findById(req.params.id, function (err, model) {

            /*for (var p in req.body) {
                if (req.body[p] == 'null')
                    model[p] = null;
                else
                    model[p] = req.body[p];
            }*/

            _.mergeWith(model, req.body, (objValue, srcValue) => {
                if (_.isArray(objValue)) {
                    return srcValue;
                }
            });


            model.save(function (err, data) {
                if (err)
                    res.status(500).send(err);
                else {
                    Model.findById(data.id, function (err, m) {
                        if (err)
                            res.status(500).send(err);
                        else {
                            res.status(201).send(m);
                        }
                    });
                }
            });

        });

        //methods below do not trigger hook pre

        /*var option = {
            new: true
        };

        delete req.body._id;
        delete req.body.id;

        Model.findByIdAndUpdate(req.params.id, req.body, option, function (err, data) {
            if (err)
                res.status(500).send(err);
            else {
                res.status(201).send(data);
            }
        });*/

    };

    var updateMany = async function (req, res) {

        const Model = getModel(req);

        const ids = req.body.map(doc => doc.id);

        const docs = await Model
            .find({ _id: { $in: ids } })
            .catch(e => res.status(500).send(e));

        if (docs instanceof ServerResponse) return null;

        const savedDocs = [];

        for (const document of req.body) {
            const model = docs.find(doc => doc._id.toString() === document.id);

            const body = _.omit(document, 'id');

            Object.assign(model, body);

            Object.keys(body).forEach(field => model.markModified(field));

            const response = await model
                .save()
                .catch(e => res.status(500).send(e));

            if (response instanceof ServerResponse) return null;

            savedDocs.push(model);
        }

        res.send(savedDocs);

    }

    var deleteById = function (req, res) {

        var Model = getModel(req);

        Model.findByIdAndRemove(req.params.id, function (err) {
            if (err)
                res.status(500).send(err);
            else {
                res.status(204).send('Deleted');
            }
        });

    };

    var remove = function (req, res) {

        var Model = getModel(req);

        var query = {
            filter: {},
            sort: {},
            populate: ''
        };

        if (req.query) {
            query = getQuery(req.query, Object.keys(Model.schema.paths));
        }


        Model.remove(query.filter, function (err) {
            if (err)
                res.status(500).send(err);
            else {
                res.status(204).send('Deleted');
            }
        });

    };

    var aggregate = function (req, res) {

        var Model = getModel(req);
        parse(req.body);

        Model
            .aggregate(req.body)
            .exec(function (err, data) {

                if (err)
                    res.status(500).send(err);
                else {
                    res.send(data);
                }

            });

    }

    function parse(obj) {

        for (var key in obj) {

            if (typeof obj[key] === 'object')
                obj[key] = parse(obj[key]);

            else if (typeof obj[key] === 'string') {

                if (ObjectId.isValid(obj[key]) && obj[key].length === 24)
                    obj[key] = new ObjectId(obj[key]);

                else if (moment(obj[key], 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).isValid()) {
                    obj[key] = moment(obj[key]).toDate();
                }
            }
        }

        return obj;
    }

    var bulkWrite = function (req, res) {

        var Model = getModel(req);

        var operations = req.body || [];

        var bulkWrite = Model.bulkWrite || Model.collection.bulkWrite;

        bulkWrite(operations)
            .then(bulkWriteOpResult => res.send(bulkWriteOpResult))
            .catch(e => res.status(500).send(e));
    }

    return {
        list: list,
        count: count,
        create: create,
        get: get,
        update: update,
        updateMany: updateMany,
        deleteById: deleteById,
        remove: remove,
        aggregate: aggregate,
        bulkWrite: bulkWrite
    };

};