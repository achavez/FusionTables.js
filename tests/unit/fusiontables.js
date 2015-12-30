define(function (require) {

    'use strict';

    var registerSuite = require('intern!object'),
        assert = require('intern/chai!assert'),
        fixtures = require('tests/support/fixtures');

    var FusionTables = require('src/fusiontables');

    function setupFT () {
        return new FusionTables({
            key: 'YOUR_API_KEY',
            tableId: 'YOUR_TABLE_ID'
        });
    }


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
        name: 'FusionTables.prototype.columns',

        'return an array of columns': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

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

            var ft = setupFT();

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