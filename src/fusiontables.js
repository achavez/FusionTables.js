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
 * FusionTables.js v1.2.0
 * https://github.com/achavez/FusionTables.js
 *
 * Copyright (c) 2014 Andrew Chavez
 * Licensed under the MIT license.
 */

// Implement UMD to export AMD and Node modules or, as a last resort,
// export FusionTables as a global
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        if(typeof window === 'undefined' && typeof XMLHttpRequest === 'undefined') {
            module.exports = factory(require('request'));
        }
        else {
            /* istanbul ignore next */
            module.exports = factory();
        }
    } else {
        /* istanbul ignore next */
        root.FusionTables = factory();
    }
}(this, function (request) {

    'use strict';

    /**
     * Our main class, which represents a single FusionTable and the auth
     * required to reach it
     * @constructor
     * @param {Object} options - an object with at least settings for the table
     *   ID and API key
     * @return {FusionTables} - an instance of the FusionTables class
     */
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


    // ~ Internal methods to handle API requests ~ //

    /**
     * Return a fully-qualified URL to an API endpoint given the endpoint
     * name
     * @private
     * @param {string} [endpoint] - the endpoint name (ex: query)
     * @param {Object} [params] - an object with key-value pairs to be
     *   converted into a query string and appended to the returned URL
     * @return {string} - the fully-qualified URL for the endpoint
     */
    FusionTables.prototype._endpoint_url = function (endpoint, params) {
        endpoint = endpoint || '';
        params = params || {};

        var url = this.options.uri + 'fusiontables/v1/' + endpoint,
            queryParams = [];

        for(var key in params) {
            queryParams.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }

        if(queryParams.length > 0) {
            url += ('?' + queryParams.join('&'));
        }

        return url;
    };

    /**
     * Make a request for JSON data using XMLHttpRequest; can be used
     * interchangeably with _jsonp_request
     * @private
     * @param {string} url - the URL to make the request to
     * @param {function} success - a function to pass the parsed response to;
     *   will be passed a JavaScript object with the returned data
     * @param {function} error - a function to call if an error occurs; will
     *   be passed a JavaScript Error object
     */
    /* istanbul ignore next (this is browser-only and we can't instrument it) */
    FusionTables.prototype._json_request = function (url, success, error) {
        var req = new XMLHttpRequest();

        req.open('GET', url, true);
        req.setRequestHeader('Accept', 'application/json');

        req.onload = function() {
            if (req.status >= 200 && req.status < 400) {
                var data = JSON.parse(req.responseText);
                success(data);

                // TODO: Catch API errors here

            } else {
                error(new Error(req.statusText));
            }
        };

        req.onerror = function() {
            error(new Error(req.statusText));
        };

        req.send();
    };

    /**
     * Make a request for JSON data using JSONP; can be used interchangeably
     * with _json_request
     * @private
     * @see http://oscargodson.com/posts/unmasking-jsonp.html
     * @param {string} url - the URL to make the request to
     * @param {function} success - a function to pass the parsed response to;
     *   will be passed a JavaScript object with the returned data
     * @param {function} error - a function to call if an error occurs; will
     *   be passed a JavaScript Error object
     */
    /* istanbul ignore next (this is browser-only and we can't instrument it) */
    FusionTables.prototype._jsonp_request = function (url, success, error) {
        var complete = false,
            timeout = 3000;

        // Generate the callback name and add it to the global namespace
        var generatedFunction = 'ft_' + Math.round(Math.random() * 1000001);

        window[generatedFunction] = function(data) {
            success(data);

            // TODO: Catch API errors here

            window.clearTimeout(timer);
            complete = true;
            delete window[generatedFunction];
        };

        var timer = window.setTimeout(function() {
            if(!complete) {
                error(new Error('jsonp request to ' + url + ' timed out after ' + timeout + 'ms'));
            }
            delete window[generatedFunction];
        }, timeout);

        // Append the callback name
        if (url.indexOf('?') === -1) {
            url += '?';
        } else {
            url += '&';
        }
        url += 'callback=' + generatedFunction;

        // Add the script to the DOM
        var jsonpScript = document.createElement('script');
        jsonpScript.setAttribute("src", url);
        document.getElementsByTagName("head")[0].appendChild(jsonpScript);
    };

    /**
     * Make a request for JSON data using the request Node module; this is the
     * server-side version of _json_request
     * @private
     * @see https://github.com/request/request
     * @param {string} url - the URL to make the request to
     * @param {function} success - a function to pass the parsed response to;
     *   will be passed a JavaScript object with the returned data
     * @param {function} error - a function to call if an error occurs; will
     *   be passed a JavaScript Error object
     */
    FusionTables.prototype._node_request = function (url, success, error) {
        request({
            url: url,
            json: true
        }, function (err, response, data) {
            if(err) {
                error(err);
            }
            else if(response.statusCode !== 200) {
                error(new Error('FusionTables API responded with an HTTP ' + response.statusCode + ' error: ' + response.statusText));
            }
            else {
                success(data);
            }
        });
    };

    /**
     * Make a request to the Fusion Tables v1.0 API and pass the results
     * to the passed success and error functions
     * @private
     * @param {string} endpoint - the FusionTables API endpoint to make the
     *   request to (ex: query)
     * @param {Object} params - an object of attribute-value pairs
     *   that will be converted into the URL's query string
     * @param {function} success - a function that will be called
     *   with the data returned from the API
     * @param {function} error - a function that will be called if
     *   an error occurs during the request
     * @param {function} [parser] - a function that will be used to
     *   parse the API response
     * @param {boolean} [cache] - a boolean indicating whether the
     *   proxy cache should be used, if the proxy is enabled
     */
    FusionTables.prototype._api_request = function (endpoint, params, success, error, parser, cache) {
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

        // Determine which of our HTTP request helpers to use
        var req = this._jsonp_request;

        if(this.options.proxy) {
            req = this._json_request;
        }
        else if(typeof request !== 'undefined') { // Node.js/io.js
            req = this._node_request;
        }

        var url = this._endpoint_url(endpoint, params);

        // Wrap the success function in the parser, if provided
        var callback = function(data) {
            if (typeof parser === 'function') {
                try {
                    data = parser(data);
                }
                catch(e) {
                    error(e);
                }
            }

            success(data);
        };

        // Make the request
        req(url, callback, error);
    };


    // ~ Parsers for API responses ~ //

    /**
     * Transform the fusiontables#sqlresponse JSON response into an
     * array of JavaScript objects
     * @param {Object} data - a fusiontables#sqlResponse API response, parsed
     *   from JSON into a JavaScript object
     * @return {Array, null} - an array of objects, each representing a row (ex:
     *   [{column1: 'val', column2: 'val'}, {column1: 'val', column2: 'val'}])
     *   or null if no rows are returned
     */
    FusionTables.prototype.rowsParser = function (data) {
        if(data.hasOwnProperty('kind') && data.kind !== 'fusiontables#sqlresponse') {
            throw new Error('Expected fusiontables#sqlresponse response. ' + data.kind + ' returned instead.');
        }
        if(!data.rows || data.rows.length === 0) {
            return null;
        }
        return data.rows.map(function (row) {
            var rowObj = {};
            row.forEach(function (el, index) {
                if (data.columns[index] === 'rowid') {
                    el = parseInt(el, 10);
                }
                rowObj[data.columns[index]] = el;
            });
            return rowObj;
        });
    };

    /**
     * Transform the first row in a fusiontables#sqlresponse response into a
     * single JavaScript objects
     * @param {Object} data - a fusiontables#sqlResponse API response, parsed
     *   from JSON into a JavaScript object
     * @return {Object, null} - an objects, with each item representing a column
     *   (ex: {column1: 'val', column2: 'val'}) or null if no rows are returned
     */
    FusionTables.prototype.rowParser = function (data) {
        if(data.hasOwnProperty('kind') && data.kind !== 'fusiontables#sqlresponse') {
            throw new Error('Expected fusiontables#sqlresponse response. ' + data.kind + ' returned instead.');
        }
        if(!data.rows || data.rows.length === 0) {
            return null;
        }
        var rowObj = {};
        data.rows[0].forEach(function (el, index) {
            if (data.columns[index] === 'rowid') {
                el = parseInt(el, 10);
            }
            rowObj[data.columns[index]] = el;
        });
        return rowObj;
    };

    /**
     * Parse the fusiontables#columnList JSON response into an array of
     * column names
     * @see https://developers.google.com/fusiontables/docs/v2/reference/column/list
     * @param {Object} data - a fusiontables#columnList API response, parsed
     *   from JSON into a JavaScript object
     * @param {Array} - an array of column names
     */
    FusionTables.prototype.columnParser = function (data) {
        if(data.hasOwnProperty('kind') && data.kind !== 'fusiontables#columnList') {
            throw new Error('Expected fusiontables#columnList response. ' + data.kind + ' returned instead.');
        }
        return data.items.map(function (item) {
            return item.name;
        });
    };


    // ~ Helpers to build SQL statements ~ //

    /**
     * Write a SQL SELECT statement for the passed columns, adding the ROWID if
     * necessary
     * @param {Array} [cols=this.options.columns] - an array of strings with
     *   the names of the columns to write the SELECT statement for;
     *   ex: ['column1', 'column2']
     * @return {string} - a SQL SELECT statement; ex: 'SELECT column1, column2,
     *   ROWID FROM table'
     */
    FusionTables.prototype.sqlSelect = function (cols) {
        cols = cols || this.options.columns;
        if (cols.indexOf('*') === -1 && cols.indexOf('ROWID') === -1) {
            cols.push('ROWID');
        }
        return 'SELECT ' + cols.join(', ') + ' FROM ' + this.options.tableId;
    };

    /**
     * Write a single SQL WHERE statement based on the passed values
     * @param {string} column - the column to compare against
     * @param {string, integer} value - the value to use for the comparison
     * @param {string} [operator='='] - a SQL operator ('=', '<', '>', etc.)
     * @return {string} - a fully-formed WHERE statement; ex: 'WHERE column < 5'
     */
    FusionTables.prototype.sqlWhere = function (column, value, operator) {
        if (typeof column === 'undefined' || typeof value === 'undefined') {
            throw new Error('The column and value properties are required in the where object.');
        }
        operator = operator || '=';
        return 'WHERE ' + column + ' ' + operator + ' ' + value;
    };

    /**
     * Return a SQL LIMIT statement based on the passed integer
     * @param {int} limit - the row count to build the LIMIT statement from
     * @return {string} - a SQL LIMIT statement, ex: LIMIT 5
     */
    FusionTables.prototype.sqlLimit = function (limit) {
        if (isNaN(limit)) {
            throw new TypeError('The limit parameter is required when calling .sqlLimit()');
        }
        return 'LIMIT ' + limit;
    };

    /**
     * Build the URL parameters, including a valid SQL query, to begin building
     * a request to the FusionTables API
     * @see https://developers.google.com/fusiontables/docs/v1/reference/query/sql
     * @param {Object} [where] - an object that will be turned into a where
     *   statement; ex: {column: 'column1', value: 'somevalue', operator: '>'};
     *   where.operator is optional
     * @param {int} [limit] - a number, which will be used to generate a LIMIT
     *   statement
     * @param {Array} [cols] - columns to use for the query, if not included
     *   this.sqlSelect() will handle fallbacks
     * @return {Object} - an object of key-value pairs (including a SQL query),
     *   which can be turned into a querystring and sent to the FusionTables
     *   SQL API
     */
    FusionTables.prototype.sqlQuery = function (where, limit, cols) {
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
    };


    // ~ Public instance methods ~ //

    // Fetch a single row
    FusionTables.prototype.row = function (success, error, where, options) {
        if (typeof where === 'undefined') {
            throw new Error('The where clause is required when calling FusionTables.row');
        }
        var opts = options || {},
            parser = opts.parser || this.rowParser,
            params = this.sqlQuery(where, 1, opts.columns);
        this._api_request('query', params, success, error, parser, opts.cache);
    };

    // Fetch all rows in the table
    FusionTables.prototype.rows = function (success, error, where, options) {
        var opts = options || {},
            parser = opts.parser || this.rowsParser,
            params = this.sqlQuery(where, opts.limit, opts.columns);
        this._api_request('query', params, success, error, parser, opts.cache);
    };

    /**
     * Get the names of all columns in the table
     * @param {function} success - a function to call with the results once
     *   the API response returns, will be called with an Array of column names
     * @param {function} error - a function that will be called if any error
     *   occurs; will be passed an Error
     * @param {Object} [options] - any options for this specific request; will
     *   override any options set during instance construction; takes the same
     *   options as all other methods
     */
    FusionTables.prototype.columns = function (success, error, options) {
        var opts = options || {},
            parser = opts.parser || this.columnParser,
            endpoint = 'tables/' + this.options.tableId + '/columns';

        this._api_request(endpoint, null, success, error, parser, opts.cache);
    };

    // Pass a raw SQL query with an optional custom parser
    FusionTables.prototype.query = function (success, error, sql, options) {
        var opts = options || {},
            parser = opts.parser || this.rowsParser,
            params = {
                'sql': sql,
                'typed': true,
                'hdrs': false
            };
        this._api_request('query', params, success, error, parser, opts.cache);
    };

    return FusionTables;

}));