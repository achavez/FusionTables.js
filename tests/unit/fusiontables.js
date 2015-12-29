define(function (require) {
    var registerSuite = require('intern!object'),
        assert = require('intern/chai!assert'),
        fixtures = require('tests/support/fixtures');

    var FusionTables = require('src/fusiontables');

    function ftSetup() {
        return new FusionTables({
            key: 'YOUR_API_KEY',
            tableId: 'YOUR_TABLE_ID'
        });
    }


    // ~ Tests for request handlers ~ //

    registerSuite({
        name: 'FusionTables.prototype._endpoint_url',

        'builds direct API URLs': function () {
            var ft = ftSetup();

            assert.strictEqual(
                ft._endpoint_url('some_endpoint'),
                'https://www.googleapis.com/fusiontables/v1/some_endpoint'
            );
        },

        'substitutes proxy URL when it\'s set': function () {
            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID',
                proxy: 'http://www.some-proxy.com/'
            });

            assert.strictEqual(
                ft._endpoint_url('some_endpoint'),
                'http://www.some-proxy.com/fusiontables/v1/some_endpoint'
            );
        },

        'correctly build querystring': function () {
            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID',
                proxy: 'http://www.some-proxy.com/'
            });

            assert.strictEqual(
                ft._endpoint_url('some_endpoint', {'key': 'value', 'key2': 'value2'}),
                'http://www.some-proxy.com/fusiontables/v1/some_endpoint?key=value&key2=value2'
            );
        }
    });

    registerSuite({
        name: 'FusionTables.prototype._json_request',

        'fires success function with JSON data': function () {
            var dfd = this.async(5000);

            var ft = ftSetup();

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Object);
                assert.strictEqual(data.hello, "world");
            });

            ft._json_request(
                'http://www.mocky.io/v2/5681b3ea120000952293a28b',
                success
            );
        },

        'fires error function on network error': function () {
            var dfd = this.async(5000);

            var ft = ftSetup();

            var error = dfd.callback(function (e) {
                assert.instanceOf(e, Error);
            });

            ft._json_request(
                'http://www.a5681b3ea120000952293a28b.com/',
                function() {},
                error
            );
        },

        'fires error function on HTTP error': function () {
            var dfd = this.async(5000);

            var ft = ftSetup();

            var error = dfd.callback(function (e) {
                assert.instanceOf(e, Error);
            });

            ft._json_request(
                'http://www.example.com/404',
                function() {},
                error
            );
        }
    });

    registerSuite({
        name: 'FusionTables.prototype._jsonp_request',

        'fires success function with JSON data': function () {
            var dfd = this.async(5000);

            var ft = ftSetup();

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Object);
                assert.deepEqual(data, { hello : "world" });
            });

            ft._jsonp_request(
                'http://www.mocky.io/v2/5681b3ea120000952293a28b',
                success
            );
        },

        'fires error function on network/HTTP error': function () {
            var dfd = this.async(5000);

            var ft = ftSetup();

            var error = dfd.callback(function (e) {
                assert.instanceOf(e, Error);
            });

            ft._jsonp_request(
                'http://www.a5681b3ea120000952293a28b.com/',
                function() {},
                error
            );
        }
    });


    // ~ Tests for API response parsers ~ //

    registerSuite({
        name: 'FusionTables.prototype.rowsParser',

        'parse fusiontables#sqlResponse into an array of objects': function () {
            var ft = ftSetup();

            var expected = [{
                "Inventory": "1251500558",
                "Product": "Amber Bead",
                "rowid": 1
            }, {
                "Inventory": "356",
                "Product": "Black Shoes",
                "rowid": 201
            }, {
                "Inventory": "100",
                "Product": "White Shoes",
                "rowid": 401
            }];

            assert.deepEqual(ft.rowsParser(fixtures.sqlresponse), expected);
        },

        'return `null` if the response contains no items': function () {
            var ft = ftSetup();

            // Create fixture with an empty rows array
            var fixture = JSON.parse(JSON.stringify(fixtures.sqlresponse));
            fixture.rows = [];

            assert.isNull(ft.rowsParser(fixture));
        },

        'throw an error if passed data is not a fusiontables#sqlresponse': function () {
            var ft = ftSetup();

            // Deep-clone and alter the fixture to have an incorrect kind
            var fixture = JSON.parse(JSON.stringify(fixtures.sqlresponse));
            fixture.kind = 'notsqlresponse';

            assert.throws(function() {
                ft.rowsParser(fixture);
            }, 'Expected fusiontables#sqlresponse');
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.rowParser',

        'parse first row of fusiontables#sqlResponse into an object': function () {
            var ft = ftSetup();

            var expected = {
                "Inventory": "1251500558",
                "Product": "Amber Bead",
                "rowid": 1
            };

            assert.deepEqual(ft.rowParser(fixtures.sqlresponse), expected);
        },

        'return `null` if the response contains no items': function () {
            var ft = ftSetup();

            // Create fixture with an empty rows array
            var fixture = JSON.parse(JSON.stringify(fixtures.sqlresponse));
            fixture.rows = [];

            assert.isNull(ft.rowParser(fixture));
        },

        'throw an error if passed data is not a fusiontables#sqlresponse': function () {
            var ft = ftSetup();

            // Deep-clone and alter the fixture to have an incorrect kind
            var fixture = JSON.parse(JSON.stringify(fixtures.sqlresponse));
            fixture.kind = 'notsqlresponse';

            assert.throws(function() {
                ft.rowParser(fixture);
            }, 'Expected fusiontables#sqlresponse');
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.columnParser',

        'parse fusiontables#columnList into an array of column names': function () {
            var ft = ftSetup();

            assert.deepEqual(
                ft.columnParser(fixtures.columnList),
                ["Mammal Type", "Group Size", "Year 1st Tracked"]
            );
        },

        'throw an error if passed data is not a fusiontables#columnList': function () {
            var ft = ftSetup();

            // Deep-clone and alter the fixture to have an incorrect kind
            var fixture = JSON.parse(JSON.stringify(fixtures.columnList));
            fixture.kind = 'notColumnList';

            assert.throws(function() {
                ft.columnParser(fixture);
            }, 'Expected fusiontables#columnList');
        }
    });


    // ~ Tests for for SQL query helpers ~ //

    registerSuite({
        name: 'FusionTables.prototype.sqlWhere',

        'return a valid WHERE statement with the default operator': function () {
            var ft = ftSetup();
            assert.strictEqual(ft.sqlWhere('column', 'value'), 'WHERE column = value');
        },

        'return a valid WHERE statement with a custom operator': function () {
            var ft = ftSetup();
            assert.strictEqual(ft.sqlWhere('column', 'value', '>'), 'WHERE column > value');
        },

        'throw an error if not passed both column and value': function () {
            var ft = ftSetup();

            assert.throws(ft.sqlWhere, Error);
            assert.throws(function() {
                ft.sqlWhere('column');
            }, Error);
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.sqlLimit',

        'return a valid LIMIT statement': function () {
            var ft = ftSetup();
            assert.strictEqual(ft.sqlLimit(5), 'LIMIT 5');
        },

        'throw an error if not passed a valid number': function () {
            var ft = ftSetup();

            assert.throws(ft.sqlLimit, TypeError);
            assert.throws(function() {
                ft.sqlLimit('five');
            }, TypeError);
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.sqlSelect',

        'auto-append ROWID when cols is passed without it': function () {
            var ft = ftSetup();
            assert.strictEqual(
                ft.sqlSelect(['column1', 'column2']),
                'SELECT column1, column2, ROWID FROM YOUR_TABLE_ID'
            );
        },

        "don't re-append ROWID when it's passed as part of cols": function () {
            var ft = ftSetup();
            assert.strictEqual(
                ft.sqlSelect(['column1', 'column2', 'ROWID']),
                'SELECT column1, column2, ROWID FROM YOUR_TABLE_ID'
            );
        },

        "don't append ROWID when `['*']` is passed in cols": function () {
            var ft = ftSetup();
            assert.strictEqual(
                ft.sqlSelect(['*']),
                'SELECT * FROM YOUR_TABLE_ID'
            );
        },

        'use columns from constructor options if none is passed': function () {
            var ft = ftSetup();
            ft.options.columns = ['column1', 'column2'];

            assert.strictEqual(
                ft.sqlSelect(),
                'SELECT column1, column2, ROWID FROM YOUR_TABLE_ID'
            );
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.sqlQuery',

        'return a simple SELECT query when nothing is passed': function () {
            var ft = ftSetup();
            ft.options.columns = ['column1'];

            assert.deepEqual(ft.sqlQuery(), {
                sql: 'SELECT column1, ROWID FROM YOUR_TABLE_ID',
                typed: true,
                hdrs: false
            });
        },

        'append a WHERE statement when a `where` object is passed': function () {
            var ft = ftSetup();

            var where = {
                column: 'column3',
                value: 5,
                operator: '>'
            };

            assert.deepEqual(ft.sqlQuery(where), {
                sql: 'SELECT ROWID FROM YOUR_TABLE_ID WHERE column3 > 5',
                typed: true,
                hdrs: false
            });
        },

        'append a LIMIT statement when a `limit` is passed': function () {
            var ft = ftSetup();

            assert.deepEqual(ft.sqlQuery(false, 5), {
                sql: 'SELECT ROWID FROM YOUR_TABLE_ID LIMIT 5',
                typed: true,
                hdrs: false
            });
        },

        "used `cols` array if it's passed": function () {
            var ft = ftSetup();

            assert.deepEqual(ft.sqlQuery(false, false, ['column1', 'column2']), {
                sql: 'SELECT column1, column2, ROWID FROM YOUR_TABLE_ID',
                typed: true,
                hdrs: false
            });
        }
    });


    // ~ Tests for public instance methods ~ //

    registerSuite({
        name: 'FusionTables.prototype.columns',

        'return an array of columns': function () {
            var dfd = this.async(5000);

            var ft = ftSetup();

            // Shim to return our fixture, skipping an actual API request
            ft._jsonp_request = function(url, success) {
                success(fixtures.columnList);
            };

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Array);
                assert.deepEqual(data, ["Mammal Type", "Group Size", "Year 1st Tracked"]);
            });

            ft.columns(success);
        },

        'make an API request to tables/TABLE/columns': function () {
            var dfd = this.async(5000);

            var ft = ftSetup();

            // Ensure the proper URL is being requested
            ft._jsonp_request = function(url, success, error) {
                assert.strictEqual(
                    url,
                    'https://www.googleapis.com/fusiontables/v1/tables/YOUR_TABLE_ID/columns?key=YOUR_API_KEY'
                );
                dfd.resolve();
            };

            ft.columns(function() {});
        }
    });
});