/* @license
 *                ____
 *  _____________|    |_
 * |_____________|    |_|
 * | ____  ____  |    | |
 * ||____||    | |____| |
 * || /\/||    |        |
 * ||/   ||____|        |
 * ||____|              |
 *  ————————————————————
 *
 * FusionTables.js v1.1.1
 * https://github.com/achavez/FusionTables.js
 *
 * Copyright (c) 2014 Andrew Chavez
 * Licensed under the MIT license.
 */

// Implement AMD and export FusionTables, if AMD is
// being used on the page
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'underscore'], factory);
    } else {
        root.FusionTables = factory($, _);
    }
}(this, function ($, _) {

    'use strict';

    // Constructor function
    function FusionTables(options) {
        this.options = options || {};
        if (!this.options.tableId) {
            throw new Error('A Fusion Tables Table ID is required.');
        }
        if (!this.options.key && !this.options.proxy) {
            throw new Error('Either an API key or a URL to a proxy that will sign your requests is required.');
        }
        this.options.columns = this.options.columns || [];
        this.options.uri = this.options.proxy || 'https://www.googleapis.com/';
        this.options.cache = this.options.cache || false;
    }

    FusionTables.prototype = {

        // Send a request to the Fusion Tables v1.0 API and pass the results
        // to the passed success and error functions
        request: function (endpoint, params, success, error, parser, cache) {

            var req = 'fusiontables/v1/' + endpoint;
            params = params || {};

            // Sign request, if key's set
            if (this.options.key) {
                params.key = this.options.key;
            }

            // Hit the proxy cache if the global cache option is
            // set, but allow it to be overridden at the request level
            if ((this.options.cache === true || cache === true) && cache !== false) {
                if (typeof console !== 'undefined' && console.warn && !this.options.proxy) {
                    console.warn('FusionTables.js: The cache parameter has no effect on direct Fusion Tables API requests.');
                }
                // Don't send the API key to the proxy, it's up to the
                // proxy to sign the cache.
                if (params.key) {
                    delete params.key;
                }
                params.cache = true;
            }

            // Setup the request options
            var ajax_options = {
                url: this.options.uri + req,
                contentType: 'application/json',
                data: params
            };

            // Use JSONP if there's no proxy
            if (!this.options.proxy) {
                ajax_options.dataType = 'jsonp';
            } else {
                ajax_options.dataType = 'json';
            }

            // Make the request, parse the response and
            // hand it off to the callback function
            $.ajax(ajax_options).done(function (data) {
                if (typeof parser === 'function') {
                    data = parser(data);
                }
                success(data);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                error(errorThrown);
            });

        },

        // Transform the fusiontables#sqlresponse JSON response into an
        // array of JavaScript objects
        rowsParser: function (data) {
            if(!data.rows) {
                return null;
            }
            return _.map(data.rows, function (row) {
                var rowObj = {};
                _.each(row, function (el, index) {
                    if (data.columns[index] === 'rowid') {
                        el = parseInt(el, 10);
                    }
                    rowObj[data.columns[index]] = el;
                });
                return rowObj;
            });
        },

        // Transform the fusiontables#sqlresponse JSON response into a
        // single JavaScript object
        rowParser: function (data) {
            if(!data.rows) {
                return null;
            }
            var rowObj = {};
            _.each(data.rows[0], function (el, index) {
                if (data.columns[index] === 'rowid') {
                    el = parseInt(el, 10);
                }
                rowObj[data.columns[index]] = el;
            });
            return rowObj;
        },

        // Transform the fusiontables#columnList JSON response
        // into an array of column names
        columnParser: function (data) {
            return _.pluck(data.items, 'name');
        },

        // SQL SELECT string builder
        sqlSelect: function (cols) {
            cols = cols || this.options.columns;
            if (cols !== ['*'] && !_.contains(cols, 'ROWID')) {
                cols.push('ROWID');
            }
            return 'SELECT ' + cols.join(', ') + ' FROM ' + this.options.tableId;
        },

        // SQL WHERE string builder
        // Operator is optional
        sqlWhere: function (column, value, operator) {
            if (!column || typeof value === 'undefined') {
                throw new Error('The column and value properties are required in the where object.');
            }
            operator = operator || '=';
            return 'WHERE ' + column + ' ' + operator + ' ' + value;
        },

        // SQL LIMIT string builder
        sqlLimit: function (limit) {
            return 'LIMIT ' + limit;
        },

        // Builds a SQL query out of all the provided pieces:
        // SELECT, WHERE, LIMIT, etc.
        // More info: https://developers.google.com/fusiontables/docs/v1/sql-reference
        sqlQuery: function (where, limit, cols) {
            var query = [this.sqlSelect(cols)];
            if (where) {
                query.push(this.sqlWhere(where.column, where.value, where.operator));
            }
            if (limit) {
                query.push(this.sqlLimit(limit));
            }
            var sql = query.join(' '),
                params = {
                    'sql': sql,
                    'typed': true,
                    'hdrs': false
                };
            return params;
        },

        // Fetch a single row
        row: function (success, error, where, options) {
            if (typeof where === 'undefined') {
                throw new Error('The where clause is required when calling FusionTables.row');
            }
            var opts = options || {},
                parser = opts.parser || this.rowParser,
                params = this.sqlQuery(where, 1, opts.columns);
            this.request('query', params, success, error, parser, opts.cache);
        },

        // Fetch all rows in the table
        rows: function (success, error, where, options) {
            var opts = options || {},
                parser = opts.parser || this.rowsParser,
                params = this.sqlQuery(where, opts.limit, opts.columns);
            this.request('query', params, success, error, parser, opts.cache);
        },

        // Fetch an array of columns in the table
        columns: function (success, error, options) {
            var opts = options || {},
                parser = opts.parser || this.columnParser,
                endpoint = 'tables/' + this.options.tableId + '/columns';
            this.request(endpoint, null, success, error, parser, opts.cache);
        },

        // Pass a raw SQL query with an optional custom parser
        query: function (success, error, sql, options) {
            var opts = options || {},
                parser = opts.parser || this.rowsParser,
                params = {
                    'sql': sql,
                    'typed': true,
                    'hdrs': false
                };
            this.request('query', params, success, error, parser, opts.cache);
        }

    };

    return FusionTables;

}));