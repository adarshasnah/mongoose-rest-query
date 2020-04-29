var _ = require('lodash');

module.exports = function() {

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

            /*if (_.indexOf(validKeys, field) > -1) {

                if (_.isArray(query[field])) {
                    for (var x = 0; x < query[field].length; x++) {
                        criterias.push(getCriteria(field, query[field][x]));
                    }
                } else {
                    criterias.push(getCriteria(field, query[field]));
                }
            }*/

            if (field.toString().toLowerCase() == 'sort')
                sort = getSort(query[field]);

            else if (field.toString().toLowerCase() == 'select')
                select = getSelect(query[field]);

            else if (field.toString().toLowerCase() == 'limit')
                limit = parseInt(query[field]);

            else if (field.toString().toLowerCase() == 'skip')
                skip = parseInt(query[field]);

            else if (field.toString().toLowerCase() == 'populate'){
                if(typeof query[field] == 'object')
                    populate = query[field];
                else
                    populate = query[field].replace(/,/g, " ");
            }

            else {
                if (_.isArray(query[field])) {
                    for (var x = 0; x < query[field].length; x++) {
                        criterias.push(getCriteria(field, query[field][x]));
                    }
                } else {
                    criterias.push(getCriteria(field, query[field]));
                }
            }
        }

        if (criterias.length > 0)
            filter = {
                $and: criterias
            };


        //force null because of update in mongoose 4.6.7   
        if (!populate)
            populate = 'null';

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

        else if (_.startsWith(value, '!='))
           return {
               $ne: value.slice(2)
           };

       else if (_.startsWith(value, '!in='))
           return {
               $nin: value.slice(4).split(',')
           };

       else if (_.startsWith(value, 'in='))
           return {
               $in: value.slice(3).split(',')
           };

        else
            return (value.toLowerCase && value.toLowerCase() === 'null') ? null : value;

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
