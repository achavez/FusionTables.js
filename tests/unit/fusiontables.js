define(function (require) {
    var registerSuite = require('intern!object'),
        assert = require('intern/chai!assert'),
        fixtures = require('tests/support/fixtures');

    var FusionTables = require('src/fusiontables');

    registerSuite({
        name: 'FusionTables.prototype._endpoint_url',

        'builds direct API URLs': function () {
            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

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

            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

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

            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

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

            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

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

            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

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

            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

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

    registerSuite({
        name: 'FusionTables.prototype.columnParser',

        'parse fusiontables#columnList into an array of column names': function () {
            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

            var parsed = ft.columnParser(fixtures.columnList);

            assert.deepEqual(parsed, ["Mammal Type", "Group Size", "Year 1st Tracked"]);
        },

        'throw an error if passed data is not a fusiontables#columnList': function () {
            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

            // Deep-clone and alter the fixture to have an incorrect kind
            var fixture = JSON.parse(JSON.stringify(fixtures.columnList));
            fixture.kind = 'notColumnList';

            assert.throws(function() {
                ft.columnParser(fixture);
            }, 'Expected fusiontables#columnList');
        }
    });

    registerSuite({
        name: 'FusionTables.prototype.columns',

        'return an array of columns': function () {
            var dfd = this.async(5000);

            var ft = new FusionTables({
                key: 'YOUR_API_KEY',
                tableId: 'YOUR_TABLE_ID'
            });

            // Shim to return our mocked response
            ft._endpoint_url = function() {
                return 'http://www.mocky.io/v2/5682cb94100000d01c1538b2';
            };

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Array);
                assert.deepEqual(data, ["Mammal Type", "Group Size", "Year 1st Tracked"]);
            });

            ft.columns(success);
        }
    });
});