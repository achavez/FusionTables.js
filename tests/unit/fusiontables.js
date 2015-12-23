define(function (require) {
    var registerSuite = require('intern!object');

    var assert = require('intern/chai!assert');

    var FusionTables = require('src/fusiontables');

    registerSuite({
        name: 'hello',

        justtesting: function () {
            assert.strictEqual(typeof(FusionTables), 'function',
                'describe it');
        }
    });
});