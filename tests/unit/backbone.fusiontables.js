define(function (require) {

    'use strict';

    var registerSuite = require('intern!object'),
        assert = require('intern/chai!assert'),
        fixtures = require('tests/support/fixtures');

    var FusionTables = require('fusiontables'),
        Backbone = require('backbone.fusiontables');

    function setupFT () {
        return new FusionTables({
            key: 'YOUR_API_KEY',
            tableId: 'YOUR_TABLE_ID',
            columns: ['column1', 'column2']
        });
    }

    function setupFTBB () {
        var ret = {};

        ret.ft = setupFT();

        ret.MockModel = Backbone.Model.extend({
            idAttribute: 'rowid',
            table: ret.ft,
            sync: Backbone.FusionTables
        });

        ret.MockCollection = Backbone.Collection.extend({
            model: ret.MockModel,
            table: ret.ft,
            sync: Backbone.FusionTables
        });

        return ret;
    }


    // ~ Test the constructor and option parsing ~ //

    registerSuite({
        name: 'Backbone.FusionTables',

        'on collection.fetch(), sync using .rows()': function () {
            var dfd = this.async(5000);

            var ftbb = setupFTBB();

            // Shim .rows() to return our test fixture
            ftbb.ft.rows = function(success) {
                success(fixtures.sqlResponseParsed);
            };

            var c = new ftbb.MockCollection();

            c.once('sync', function() {
                assert.deepEqual(this.toJSON(), fixtures.sqlResponseParsed);
                dfd.resolve();
            });

            c.fetch();
        },

        'on model.fetch(), sync using .row()': function () {
            var dfd = this.async(5000);

            var ftbb = setupFTBB();

            // Shim .rows() to return our test fixture
            var expect = fixtures.sqlResponseParsed[0];

            ftbb.ft.row = function(success) {
                success(expect);
            };

            var m = new ftbb.MockModel({rowid: 1});

            m.once('sync', function() {
                assert.deepEqual(this.toJSON(), expect);
                dfd.resolve();
            });

            m.fetch();
        },

        'on collection.fetch(), call success callback': function () {
            var dfd = this.async(5000);

            var ftbb = setupFTBB();

            // Shim .rows() to return our test fixture
            ftbb.ft.rows = function(success) {
                success(fixtures.sqlResponseParsed);
            };

            (new ftbb.MockCollection()).fetch({
                success: function(collection) {
                    assert.deepEqual(collection.toJSON(), fixtures.sqlResponseParsed);
                    dfd.resolve();
                }
            });
        },

        'on model.fetch() call success, sync using .row()': function () {
            var dfd = this.async(5000);

            var ftbb = setupFTBB();

            // Shim .rows() to return our test fixture
            var expect = fixtures.sqlResponseParsed[0];

            ftbb.ft.row = function(success, error, where) {
                assert.deepEqual(where, {'column': 'rowid', 'value': 1});
                success(expect);
            };

            (new ftbb.MockModel({rowid: 1})).fetch({
                success: function(model) {
                    assert.deepEqual(model.toJSON(), expect);
                    dfd.resolve();
                }
            });
        },

        "call collection.fetch()'s error function on FusionTables error": function () {
            var dfd = this.async(5000);

            var ftbb = setupFTBB();

            // Shims to call our passed function
            var errFixture = new Error();

            ftbb.ft.rows = function(success, error) {
                error(new Error());
            };

            (new ftbb.MockCollection()).fetch({
                error: function(collection, err) {
                    assert.deepEqual(err, errFixture);
                    dfd.resolve();
                }
            });
        },

        "call model.fetch()'s error function on FusionTables error": function () {
            var dfd = this.async(5000);

            var ftbb = setupFTBB();

            // Shims to call our passed function
            var errFixture = new Error();

            ftbb.ft.row = function(success, error) {
                error(new Error());
            };

            (new ftbb.MockModel({rowid: 1})).fetch({
                error: function(model, err) {
                    assert.deepEqual(err, errFixture);
                    dfd.resolve();
                }
            });
        },

        'throw an error if no table is defined on the collection': function () {
            var c = new (Backbone.Collection.extend({
                sync: Backbone.FusionTables
            }))();

            assert.throws(c.fetch.bind(c), 'You must specify a table');
        },

        'throw an error if no table is defined on the model': function () {
            var MockModel = Backbone.Model.extend({
                idAttribute: 'rowid',
                sync: Backbone.FusionTables
            });

            var m = new MockModel({
                id: 1
            });

            assert.throws(m.fetch.bind(m), 'You must specify a table');
        },

        "throw an error if options.columns isn't set on passed FusionTable": function () {
            var ft = new FusionTables({
                tableId: 'YOUR_TABLE_ID',
                key: 'YOUR_API_KEY'
            });

            var c = new (Backbone.Collection.extend({
                table: ft,
                sync: Backbone.FusionTables
            }))();

            assert.throws(c.fetch.bind(c), 'you must pass a columns value');
        },

        'throw an error for non-read actions': function () {
            var ftbb = setupFTBB();

            var m = new ftbb.MockModel();

            m.set('prop', 'val');
            assert.throws(m.save.bind(m), 'Backbone.FusionTables is read-only');
        }
    });

});