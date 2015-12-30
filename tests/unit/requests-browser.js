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


    // ~ Tests for browser request handlers (XMLHttpRequest and JSONP) ~ //

    registerSuite({
        name: 'FusionTables.prototype._json_request',

        'fires success function with JSON data': function () {
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

});