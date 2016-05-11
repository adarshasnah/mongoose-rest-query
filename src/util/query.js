var _ = require('lodash');

module.exports = function () {

    return {
        getQuery: getQuery
    };

    function getQuery(query, validKeys) {

        var filter = {},
            sort = {},
            select = {},
            populate = '',
            criterias = [],
            limit = null,
            skip = null;

        for (var field in query) {

            if (_.indexOf(validKeys, field) > -1) {

                if (_.isArray(query[field])) {
                    for (var x = 0; x < query[field].length; x++) {
                        criterias.push(getCriteria(field, query[field][x]));
                    }
                } else {
                    criterias.push(getCriteria(field, query[field]));
                }
            }

            if (field.toString().toLowerCase() == 'sort')
                sort = getSort(query[field]);

            if (field.toString().toLowerCase() == 'select')
                select = getSelect(query[field]);

            if (field.toString().toLowerCase() == 'limit')
                limit = query[field];

            if (field.toString().toLowerCase() == 'skip')
                skip = query[field];

            if (field.toString().toLowerCase() == 'populate')
                populate = query[field].replace(/,/g, " ");
        }

        if (criterias.length > 0)
            filter = {
                $and: criterias
            };

        return {
            filter: filter,
            select: select,
            sort: sort,
            populate: populate,
            limit: limit,
            skip: skip
        };

    }

    function getCriteria(field, value) {

        var criteria = {};
        criteria[field] = formatCriteriaValue(value);

        return criteria;
    }

    function formatCriteriaValue(value) {

        if (_.startsWith(value, '~'))
            return new RegExp(value.slice(1), 'i');

        else if (_.startsWith(value, '>='))
            return {
                $gte: value.slice(2)
            };

        else if (_.startsWith(value, '>'))
            return {
                $gt: value.slice(1)
            };

        else if (_.startsWith(value, '<='))
            return {
                $lte: value.slice(2)
            };

        else if (_.startsWith(value, '<'))
            return {
                $lt: value.slice(1)
            };

        else
            return (value.toLowerCase() == 'null') ? null : value;

    }

    function getSort(fields) {
        var sort = {};

        var fieldList = fields.toString().split(',');

        for (var x = 0; x < fieldList.length; x++) {
            if (_.startsWith(fieldList[x], '-'))
                sort[fieldList[x].slice(1)] = -1;
            else
                sort[fieldList[x]] = 1;
        }

        return sort;
    }

    function getSelect(fields) {
        var select = {};

        var fieldList = fields.toString().split(',');

        for (var x = 0; x < fieldList.length; x++) {
            if (_.startsWith(fieldList[x], '-'))
                select[fieldList[x].slice(1)] = 0;
            else
                select[fieldList[x]] = 1;
        }

        return select;
    }

}();