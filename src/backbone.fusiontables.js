/* @license
 *
 * Backbone.FusionTables.js v1.2.0
 * https://github.com/achavez/FusionTables.js
 *
 * Copyright (c) 2014 Andrew Chavez
 * Licensed under the MIT license.
 */

// Implement UMD to add FusionTables driver to Backbone and re-export
(function (root, factory) {
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['backbone'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('backbone'));
    } else {
        root.Backbone = factory(root.Backbone);
    }
}(this, function (Backbone) {

    'use strict';

    Backbone.FusionTables = function(method, model, options) {

        // Make sure there's actually a FusionTables instance defined
        if (typeof model.table === 'undefined'/* && typeof model.collection.table === 'undefined'*/) {
            throw new Error('You must specify a table to use Backbone.FusionTables.');
        }

        // Get the FusionTables instance
        var ft = model.table/* || model.collection.table*/;

        if (ft.options.columns.length === 1 && ft.options.columns[0] === '*') {
            throw new Error('When using Backbone.FusionTables, you must pass a columns value to FusionTables.js.');
        }

        function success(result) {
            // Handle successful results from FusionTables
            if (options.success) {
                options.success(result);
            }
        }

        function error(err) {
            // Handle error results from FusionTables
            if (options.error) {
                options.error(err);
            }
        }

        // Support reads and fail for everything else
        if (method === 'read') {
            if (model.id) {
                // Model lookup
                var where = {
                    column: model.idAttribute,
                    value: model.id
                };
                return ft.row(success, error, where, options.options);
            } else {
                // Collection lookup
                return ft.rows(success, error, options.where, options.options);
            }
        }
        else {
            throw new Error('Backbone.FusionTables is read-only.');
        }

    };

    return Backbone;

}));