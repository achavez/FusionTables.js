define(function (require) {

    'use strict';

    var registerSuite = require('intern!object'),
        assert = require('intern/chai!assert'),
        fixtures = require('tests/support/fixtures');

    var FusionTables = require('intern/dojo/node!../../..../../src/fusiontables');

    function setupFT () {
        return new FusionTables({
            key: 'YOUR_API_KEY',
            tableId: 'YOUR_TABLE_ID'
        });
    }


    // ~ Tests for Node.js/io.js request handlers ~ //

    registerSuite({
        name: 'FusionTables.prototype._node_request',

        'fires success function with JSON data': function () {
            var dfd = this.async(5000);

            var ft = setupFT();

            var success = dfd.callback(function (data) {
                assert.instanceOf(data, Object);
                assert.strictEqual(data.hello, "world");
            });

            ft._node_request(
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

            ft._node_request(
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

            ft._node_request(
                'http://www.example.com/404',
                function() {},
                error
            );
        }
    });

});