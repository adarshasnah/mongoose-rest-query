module.exports = function (ModelName) {

    var _ = require('lodash'),
        model = require('../util/model').model,
        getQuery = require('../').getQuery;

    function getModel(req) {
        return model(req, ModelName);
    }

    function isFilterDependent(req) {
        var Model = getModel(req);

        return _.indexOf(Object.keys(Model.schema.paths), req.filter.field) > -1;
    }

    function getFilterValue(req) {
        return req.filter.value || null;
    }

    function applyDefaultFilter(req, query) {
        if (isFilterDependent(req))
            query.filter[req.filter.field] = getFilterValue(req);
    }

    var list = function (req, res) {
        var Model = getModel(req);

        var query = {};

        if (req.query) {
            query = getQuery(req.query, Object.keys(Model.schema.paths));
        }

        applyDefaultFilter(req, query);

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

        applyDefaultFilter(req, query);

        Model.count(query.filter, function (err, data) {
            if (err)
                res.status(500).send(err);
            else
                res.json(data);
        });

    };

    var create = function (req, res) {
        var Model = getModel(req);

        var isDependent = isFilterDependent(req);
        var filterValue = getFilterValue(req);

        function save(data) {
            var model = new Model(data);

            if (isDependent)
                model[req.filter.field] = filterValue;

            model.save();
            return model;
        }

        if (_.isArray(req.body)) {

            var out = [];

            for (var x = 0; x < req.body.length; x++) {
                out.push(save(req.body[x]));
            }

            res.status(201).send(out);

        } else {

            var model = new Model(req.body);

            if (isDependent)
                model[req.filter.field] = filterValue;

            model.save(function (err, data) {

                Model.findById(data.id, function (err, m) {
                    if (err)
                        res.status(500).send(err);
                    else {
                        res.status(201).send(m);
                    }
                });
            });
        }
    };

    var set = function (req, res, next) {
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
                    req.model = data;
                    next();
                } else {
                    res.status(404).send('Not found');
                }
            });
    };

    var get = function (req, res) {
        res.json(req.model);
    };

    var update = function (req, res) {

        var Model = getModel(req);

        if (req.params.id) {

            if (req.body._id)
                delete req.body._id;

            for (var p in req.body) {
                if (req.body[p] == 'null')
                    req.model[p] = null;
                else
                    req.model[p] = req.body[p];
            }

            req.model.save(function (err, data) {
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
        }
    };

    var deleteById = function (req, res) {

        if (req.params.id) {
            req.model.remove(function (err) {
                if (err)
                    res.status(500).send(err);
                else {
                    res.status(204).send('Deleted');
                }
            });
        }
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

        applyDefaultFilter(req, query);


        Model.remove(query.filter, function (err) {
            if (err)
                res.status(500).send(err);
            else {
                res.status(204).send('Deleted');
            }
        });

    };

    return {
        list: list,
        count: count,
        create: create,
        get: get,
        set: set,
        update: update,
        deleteById: deleteById,
        remove: remove
    };

};