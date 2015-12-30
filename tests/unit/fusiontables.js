define(function (require) {

    'use strict';

    var registerSuite = require('intern!object'),
        assert = require('intern/chai!assert'),
        fixtures = require('tests/support/fixtures');

    var FusionTables = require('fusiontables');

    function setupFT () {
        return new FusionTables({
            key: 'YOUR_API_KEY',
            tableId: 'YOUR_TABLE_ID'
        });
    }


    // ~ Test the constructor and option parsing ~ //

    registerSuite({
        name: 'FusionTables constructor',

        'throw an error if no tableID is passed': function () {
            assert.throws(function() {
                new FusionTables();
            }, 'A Fusion Tables Table ID is required.');
        },

        "throw an error if an API key or proxy URL isn't passed": function () {
            assert.throws(function() {
                new FusionTables({
                    tableId: 'table'
                });
            }, 'Either an API key or a URL to a proxy that will sign your requests is required.');
        },

        'custom options are stored when passed': function () {
            var custom = {
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID',
                columns: ['column1', 'column2'],
                uri: 'http://www.example.com/',
                cache: true
            };

            var ft = new FusionTables(custom);

            assert.deepEqual(ft.options, custom);
        },

        'default options are stored if none is passed': function () {
            var ft = setupFT();

            assert.deepEqual(ft.options, {
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID',
                columns: [],
                uri: 'https://www.googleapis.com/',
                cache: false
            });
        }
    });


    // ~ Tests for browser request handlers (XMLHttpRequest and JSONP) ~ //

    registerSuite({
        name: 'FusionTables.prototype._json_request',

        'fires success function with JSON data': function () {
            if (typeof window === 'undefined') {
                this.skip('Browser-only test');
            }

            var dfd = this.async(5000);

            var ft = setupFT();

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
            if (typeof window === 'undefined') {
                this.skip('Browser-only test');
            }

            var dfd = this.async(5000);

            var ft = setupFT();

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
            if (typeof window === 'undefined') {
                this.skip('Browser-only test');
            }

            var dfd = this.async(5000);

            var ft = setupFT();

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
            if (typeof window === 'undefined') {
                this.skip('Browser-only test');
            }

            var dfd = this.async(5000);

            var ft = setupFT();

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
            if (typeof window === 'undefined') {
                this.skip('Browser-only test');
            }

            var dfd = this.async(5000);

            var ft = setupFT();

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


    // ~ Tests for shared logic among request handlers ~ //

    registerSuite({
        name: 'FusionTables.prototype._endpoint_url',

        'builds direct API URLs': function () {
            var ft = setupFT();

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


    // ~ Tests for API response parsers ~ //

    registerSuite({
        name: 'FusionTables.prototype.rowsParser',

        'parse fusiontables#sqlResponse into an array of objects': function () {
            var ft = setupFT();

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
            var ft = setupFT();

            // Create fixture with an empty rows array
            var fixture = JSON.parse(JSON.stringify(fixtures.sqlresponse));
            fixture.rows = [];

            assert.isNull(ft.rowsParser(fixture));
        },

        'throw an error if passed data is not a fusiontables#sqlresponse': function () {
            var ft = setupFT();

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
            var ft = setupFT();

            var expected = {
                "Inventory": "1251500558",
                "Product": "Amber Bead",
                "rowid": 1
            };

            assert.deepEqual(ft.rowParser(fixtures.sqlresponse), expected);
        },

        'return `null` if the response contains no items': function () {
            var ft = setupFT();

            // Create fixture with an empty rows array
            var fixture = JSON.parse(JSON.stringify(fixtures.sqlresponse));
            fixture.rows = [];

            assert.isNull(ft.rowParser(fixture));
        },

        'throw an error if passed data is not a fusiontables#sqlresponse': function () {
            var ft = setupFT();

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
            var ft = setupFT();

            assert.deepEqual(
                ft.columnParser(fixtures.columnList),
                ["Mammal Type", "Group Size", "Year 1st Tracked"]
            );
        },

        'throw an error if passed data is not a fusiontables#columnList': function () {
            var ft = setupFT();

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
            var ft = setupFT();
            assert.strictEqual(ft.sqlWhere('column', 'value'), 'WHERE column = value');
        },

        'return a valid WHERE statement with a custom operator': function () {
            var ft = setupFT();
            assert.strictEqual(ft.sqlWhere('column', 'value', '>'), 'WHERE column > value');
        },

        'throw an error if not passed both column and value': function () {
            var ft = setupFT();

            assert.throws(ft.sqlWhere, Error);
            assert.throws(function() {
                ft.sqlWhere('column');
            }, Error);
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.sqlLimit',

        'return a valid LIMIT statement': function () {
            var ft = setupFT();
            assert.strictEqual(ft.sqlLimit(5), 'LIMIT 5');
        },

        'throw an error if not passed a valid number': function () {
            var ft = setupFT();

            assert.throws(ft.sqlLimit, TypeError);
            assert.throws(function() {
                ft.sqlLimit('five');
            }, TypeError);
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.sqlSelect',

        'auto-append ROWID when cols is passed without it': function () {
            var ft = setupFT();
            assert.strictEqual(
                ft.sqlSelect(['column1', 'column2']),
                'SELECT column1, column2, ROWID FROM YOUR_TABLE_ID'
            );
        },

        "don't re-append ROWID when it's passed as part of cols": function () {
            var ft = setupFT();
            assert.strictEqual(
                ft.sqlSelect(['column1', 'column2', 'ROWID']),
                'SELECT column1, column2, ROWID FROM YOUR_TABLE_ID'
            );
        },

        "don't append ROWID when `['*']` is passed in cols": function () {
            var ft = setupFT();
            assert.strictEqual(
                ft.sqlSelect(['*']),
                'SELECT * FROM YOUR_TABLE_ID'
            );
        },

        'use columns from constructor options if none is passed': function () {
            var ft = setupFT();
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
            var ft = setupFT();
            ft.options.columns = ['column1'];

            assert.deepEqual(ft.sqlQuery(), {
                sql: 'SELECT column1, ROWID FROM YOUR_TABLE_ID',
                typed: true,
                hdrs: false
            });
        },

        'append a WHERE statement when a `where` object is passed': function () {
            var ft = setupFT();

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
            var ft = setupFT();

            assert.deepEqual(ft.sqlQuery(false, 5), {
                sql: 'SELECT ROWID FROM YOUR_TABLE_ID LIMIT 5',
                typed: true,
                hdrs: false
            });
        },

        "used `cols` array if it's passed": function () {
            var ft = setupFT();

            assert.deepEqual(ft.sqlQuery(false, false, ['column1', 'column2']), {
                sql: 'SELECT column1, column2, ROWID FROM YOUR_TABLE_ID',
                typed: true,
                hdrs: false
            });
        }
    });


    // ~ Tests for public instance methods ~ //

    registerSuite({
        name: 'FusionTables.prototype.rows',

        'return rows as an array of row objects': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            // Shim to return our fixture, skipping an actual API request
            function mockRequest (url, success) {
                success(fixtures.sqlresponse);
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Object);
                var expect = [
                    {rowid: 1, Product: "Amber Bead", Inventory: "1251500558"},
                    {rowid: 201, Product: "Black Shoes", Inventory: "356"},
                    {rowid: 401, Product: "White Shoes", Inventory: "100"}
                ];
                assert.deepEqual(data, expect);
            });

            ft.rows(success);
        },

        'make an API request to v1/query': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            var expect = 'https://www.googleapis.com/fusiontables/v1/query?' +
                         'sql=SELECT%20ROWID%20FROM%20YOUR_TABLE_ID&typed=t' +
                         'rue&hdrs=false&key=YOUR_API_KEY';

            // Ensure the proper URL is being requested
            function mockRequest (url, success) {
                assert.strictEqual(url, expect);
                dfd.resolve();
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            ft.rows(function() {});
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.row',

        'return an single row as an object': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            // Shim to return our fixture, skipping an actual API request
            function mockRequest (url, success) {
                success(fixtures.sqlresponse);
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Object);
                var expect = {rowid: 1, Product: "Amber Bead", Inventory: "1251500558"};
                assert.deepEqual(data, expect);
            });

            ft.row(success, function() {}, {column: 'column', value: 'value'});
        },

        'make an API request to v1/query': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            var expect = 'https://www.googleapis.com/fusiontables/v1/query?' +
                         'sql=SELECT%20ROWID%20FROM%20YOUR_TABLE_ID%20WHERE' +
                         '%20col%20%3D%20val%20LIMIT%201&typed=true&hdrs=fa' +
                         'lse&key=YOUR_API_KEY';

            // Ensure the proper URL is being requested
            function mockRequest (url, success) {
                assert.strictEqual(url, expect);
                dfd.resolve();
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            ft.row(function() {}, function () {}, {column: 'col', value: 'val'});
        },

        'throw an error if no where clause is passed': function () {
            var ft = setupFT();

            assert.throws(function() {
                ft.row(function() {}, function() {});
            }, 'The where clause is required');
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.columns',

        'return an array of columns': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            // Shim to return our fixture, skipping an actual API request
            function mockRequest (url, success) {
                success(fixtures.columnList);
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Array);
                assert.deepEqual(data, ["Mammal Type", "Group Size", "Year 1st Tracked"]);
            });

            ft.columns(success);
        },

        'make an API request to tables/TABLE/columns': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            // Ensure the proper URL is being requested
            function mockRequest (url, success) {
                assert.strictEqual(
                    url,
                    'https://www.googleapis.com/fusiontables/v1/tables/YOUR_TABLE_ID/columns?key=YOUR_API_KEY'
                );
                dfd.resolve();
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            ft.columns(function() {});
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.query',

        'return rows as an array of objects': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            // Shim to return our fixture, skipping an actual API request
            function mockRequest (url, success) {
                success(fixtures.sqlresponse);
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Array);
                var expect = [
                    {rowid: 1, Product: "Amber Bead", Inventory: "1251500558"},
                    {rowid: 201, Product: "Black Shoes", Inventory: "356"},
                    {rowid: 401, Product: "White Shoes", Inventory: "100"}
                ];
                assert.deepEqual(data, expect);
            });

            ft.query(success);
        },

        'pass our custom SQL in an API request to v1/query': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            var expect = 'https://www.googleapis.com/fusiontables/v1/query?' +
                         'sql=SELECT%20*%20FROM%20table&typed=true&hdrs=fal' +
                         'se&key=YOUR_API_KEY';

            // Ensure the proper URL is being requested
            function mockRequest (url, success) {
                assert.strictEqual(url, expect);
                dfd.resolve();
            }
            ft._jsonp_request = mockRequest;
            ft._node_request = mockRequest;

            ft.query(function() {}, function () {}, 'SELECT * FROM table');
        }
    });

});