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
 * FusionTables.js v1.0.0
 * https://github.com/achavez/FusionTables.js
 *
 * Copyright (c) 2014 Andrew Chavez
 * Licensed under the MIT license.
 */

// Constructor function
function FusionTables(options) {
	this.options = options || {};
	if(!this.options.key || !this.options.tableId) {
		throw new Error('A Fusion Tables Table ID and API key are required.');
	}
	this.options.columns = this.options.columns || [];
	this.options.uri = this.options.uri || 'https://www.googleapis.com/fusiontables/v1/';
};

FusionTables.prototype = {

	// Send a request to the Fusion Tables v1.0 API and pass the results
	// to the passed success and error functions
	request: function(endpoint, params, success, error, parser) {

		var req = endpoint;

		// Write individual querystring parameters
		var qs = [];
		if(params) {
			_.each(params, function(value, key) {
				qs.push(key + '=' + value);
			});
		}

		// Sign request, if key's set
		if(this.options.key) {
			qs.push('key=' + this.options.key);
		}

		// Build querystring
		if(qs) {
			req += '?' + qs.join('&');
		}

		r = new XMLHttpRequest();
		r.open('GET', this.options.uri + req, true);

		r.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status >= 200 && this.status < 400) {
					data = JSON.parse(this.responseText);
					if(typeof parser == 'function') {
						data = parser(data);
					}
					success(data);
				}
				else {
					error(JSON.parse(this.responseText));
				}
			}
		};
		r.send();

		r = null;
	},

	// Transform the fusiontables#sqlresponse JSON response into an
	// array of JavaScript objects
	rowsParser: function(data) {
		return _.map(data.rows, function(row){
			var rowObj = {};
			_.each(row, function(el, index) {
				if(data.columns[index] != 'rowid') {
					rowObj[data.columns[index]] = el;
				}
				else {
					rowObj.id = parseInt(el, 10);
				}
			});
			return rowObj;
		});
	},

	// Transform the fusiontables#sqlresponse JSON response into a
	// single JavaScript object
	rowParser: function(data) {
		var rowObj = {};
		_.each(data.rows[0], function(el, index) {
			if(data.columns[index] == 'rowid') {
				el = parseInt(el, 10);
			}
			rowObj[data.columns[index]] = el;
		});
		return rowObj;
	},

	// Transform the fusiontables#columnList JSON response
	// into an array of column names
	columnParser: function(data) {
		return _.pluck(data.items, 'name');
	},

	// SQL SELECT string builder
	sqlSelect: function(cols) {
		cols = cols || this.options.columns;
		if(cols != ['*'] && !_.contains(cols, 'ROWID')) {
			cols.push('ROWID');
		}
		return 'SELECT ' + cols.join(', ') + ' FROM ' + this.options.tableId;
	},

	// SQL WHERE string builder
	// Operator is optional
	sqlWhere: function(column, value, operator) {
		if(!column || !value) {
			throw new Error('The column and value properties are required in the where object.');
		}
		operator = operator || '=';
		return 'WHERE ' + column + ' ' + operator + ' ' + value;
	},

	// SQL LIMIT string builder
	sqlLimit: function(limit) {
		return 'LIMIT ' + limit;
	},

	// Builds a SQL query out of all the provided pieces:
	// SELECT, WHERE, LIMIT, etc.
	// More info: https://developers.google.com/fusiontables/docs/v1/sql-reference
	sqlQuery: function(where, limit, cols) {
		var query = [this.sqlSelect(cols)];
		if(where) {
			query.push(this.sqlWhere(where.column, where.value, where.operator));
		}
		if(limit) {
			query.push(this.sqlLimit(limit));
		}
		var sql = query.join(' ');
		// Build that ish
		var params = {
			'sql': encodeURIComponent(sql),
			'typed': true,
			'hdrs': false
		}
		return params;
	},

	// Fetch a single row
	row: function(success, error, where, cols) {
		var params = this.sqlQuery(where, 1, cols);
		this.request('query', params, success, error, this.rowParser);
	},

	// Fetch all rows in the table
	rows: function(success, error, where, limit, cols) {
		var params = this.sqlQuery(where, limit, cols);
		this.request('query', params, success, error, this.rowsParser);
	},

	// Fetch an array of columns in the table
	columns: function(success, error) {
		var endpoint = 'tables/' + this.options.tableId + '/columns';
		this.request(endpoint, null, success, error, this.columnParser);
	},

	// Pass a raw SQL query with an optional custom parser
	query: function(success, error, sql, parser) {
		var params = {
			'sql': encodeURIComponent(sql),
			'typed': true,
			'hdrs': false
		};
		this.request('query', params, success, error, parser);
	}

};