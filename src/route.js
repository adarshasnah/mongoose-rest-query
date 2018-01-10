module.exports = function (modelName) {

    var express = require('express'),
        router = express.Router(),
        mainController = require('./controller/controller')(modelName),
        schema = require('./config').modelSchemas[modelName];

    router.route('/')
        .get(mainController.list)
        .post(mainController.create)
        .delete(mainController.remove);

    router.route('/count')
        .get(mainController.count);

    router.route('/aggregate')
        .post(mainController.aggregate);

    router.route('/:id')
        .get(mainController.get)
        .put(mainController.update)
        .delete(mainController.deleteById);

    var schemaFields = Object.keys(schema.paths);

    for (var x = 0; x < schemaFields.length; x++) {
        if (schema.path(schemaFields[x]).instance == 'Array') {

            var resource = '/:id/' + schemaFields[x].toLowerCase();
            var subController = require('./controller/controller.sub')(modelName, schemaFields[x]);

            router.use(resource, subController.setModel);

            router.route(resource)
                .get(subController.list)
                .post(subController.create)
                .put(subController.updateMany)
                .delete(subController.deleteMany);

            router.use(resource + '/:itemId', subController.setModel);

            router.route(resource + '/:itemId')
                .get(subController.getById)
                .put(subController.updateById)
                .delete(subController.deleteById);

            if (schema.path(schemaFields[x]).schema) {

                var childPaths = schema.path(schemaFields[x]).schema.paths;
                var childFields = Object.keys(childPaths);

                for (var y = 0; y < childFields.length; y++) {

                    if (childPaths[childFields[y]].instance == 'Array') {

                        var childResource = resource + '/:itemId/' + childFields[y].toLowerCase();
                        var childController = require('./controller/controller.sub.child')(modelName, schemaFields[x], childFields[y]);

                        router.use(childResource, childController.set);

                        router.route(childResource)
                            .get(childController.list)
                            .post(childController.create)
                            .put(childController.updateMany);

                        router.use(childResource + '/:childId', childController.set);

                        router.route(childResource + '/:childId')
                            .get(childController.get)
                            .put(childController.update)
                            .delete(childController.remove);

                    }
                }

            }

        }
    }

    return router;
};