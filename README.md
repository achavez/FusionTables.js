FusionTables.js
=====

[![GitHub version](https://badge.fury.io/gh/achavez%2FFusionTables.js.svg)](http://badge.fury.io/gh/achavez%2FFusionTables.js)

FusionTables.js allows you to retrieve data from the [Google Fusion Tables API v1.0](https://developers.google.com/fusiontables/docs/v1/getting_started) using a few lines of JavaScript.

Usage
-----
For the most basic usage you'll need two pieces of information to get your data out of Fusion Tables:

- **Table ID**: An encryped string value that identifies your table (should look something like `1e7y6mtqv891111111111_aaaaaaaaa_CvWhg9gc`). You can get the Table ID by going to File > About in the Fusion Tables Web app.
- **Fusion Tables API key**: You can obtain an API key from the Google Developers Console. The Fusion Tables API documentation has a step-by-step guide for obtaining a key: [https://developers.google.com/fusiontables/docs/v1/using#APIKey](https://developers.google.com/fusiontables/docs/v1/using#APIKey)

You'll also need to ensure that you're Fusion Table is published and accessible. Do that by going to Tools > Share and changing the visiblity to either *Anyone with the link* or *Public on the web*.

Be sure to include `[fusiontables.min.js](https://github.com/achavez/FusionTables.js/blob/master/fusiontables.min.js)` as well as its two dependencies -- [Underscore.js](https://github.com/jashkenas/underscore/) and [jQuery](https://github.com/jquery/jquery) -- in your HTML file:

```html
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/underscore-min.js"></script>
<script src="/path/to/fusiontables.min.js"></script>
```

If you're using [Require.js](https://github.com/jrburke/requirejs) or another module loader the script exports the `FusionTables` class and delcares `jquery` and `underscore` as dependencies.

Next, create a new `FusionTables` instance and pass in an object with your API key, Table ID and an array with the columns you'd like included. The columns property is optional and the `ROWID` will automatically be appended unless you pass in a `*`:

```javascript
var ft = new FusionTables({
  key: 'YOUR_API_KEY',
  tableId: 'YOUR_TABLE_ID',
  columns: ["First Name", "Last Name"]
});
```

Now you can query your `FusionTables` instance by calling the `rows` method and passing `success` and `error` functions:

```javascript
var success = function(data) {
  console.log(data);
};
var error = function(error) {
  console.log(error);
};
ft.rows(success, error);
// [{"First Name": "John", "Last Name": "Smith"}, {"First Name": "Jane", "Last Name": "Smith"}]
```

Methods
-----

###`rows(success, error, where, options)`
#####Usage
Fetch all rows from Fusion Tables or a subset of rows using a `WHERE` clause.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- optional *object* `where`: can be used to filter the results: `{'column': 'First Name', 'value': 'John'}` would return any rows where the *First Name* column is *John*; can also include an optional `operator` property (see the Fusion Tables docs for supported operators); by default the operator is `=`
- optional *number* `options.limit`: the maximum number of rows to retrieve
- optional *array* `options.columns`: the columns to return data for
- optional *function* `options.parser`: a function that is passed the raw response from the Fusion Tables API; whatever is returned by this function will be passed to the `success` function; see `FusionTables.prototype.rowParser` and `FusionTables.prototype.columnParser`
- optional *boolean* `options.cache`: a boolean indicating whether to request cached results from the proxy; has no effect on direct API requests (*see Proxying and caching requests* below)
- *array* **returns** an array of objects, each of which is a Fusion Tables row, or `null` if there are no matching rows

###`row(success, error, where, options)`
#####Usage
Fetch a single row from the Fusion Table, using a `WHERE` clause to fetch the specific row you're looking for.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- *object* `where`: can be used to filter the results: `{'column': 'First Name', 'value': 'John'}` would return any rows where the *First Name* column is *John*; can also include an optional `operator` property (see the Fusion Tables docs for supported operators); by default the operator is `=`
- optional *array* `options.columns`: the columns to return data for
- optional *function* `options.parser`: a function that is passed the raw response from the Fusion Tables API; whatever is returned by this function will be passed to the `success` function; see `FusionTables.prototype.rowParser` and `FusionTables.prototype.columnParser`
- optional *boolean* `options.cache`: a boolean indicating whether to request cached results from the proxy; has no effect on direct API requests (*see Proxying and caching requests* below)
- *object* **returns** a single Fusion Tables row as an object or `null` if there's no match 

###`columns(success, error, options)`
#####Usage
Fetch a list of columns that are available in the table. This could theoretically be used to set the list of default columns for the instance or as a parameter for one of the other methods, but that's probably a bad idea because it's an unnecessary API call.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- optional *function* `options.parser`: a function that is passed the raw response from the Fusion Tables API; whatever is returned by this function will be passed to the `success` function; see `FusionTables.prototype.rowParser` and `FusionTables.prototype.columnParser`
- optional *boolean* `options.cache`: a boolean indicating whether to request cached results from the proxy; has no effect on direct API requests (*see Proxying and caching requests* below)
- *array* **returns** all columns in the table

###`query(success, error, sql, options)`
#####Usage
Run a query using custom SQL and (optionally) a custom parser for the data returned by Fusion Tables. This will allow you to use `GROUP BY`, `ORDER BY` and other more advanced SQL.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- *string* `sql`: a raw SQL string that will be URI-encoded and sent directly to the Fusion Tables API; to see what the API supports, see [https://developers.google.com/fusiontables/docs/v1/sql-reference#Select](https://developers.google.com/fusiontables/docs/v1/sql-reference#Select)
- optional *function* `options.parser`: a function that is passed the raw response from the Fusion Tables API; whatever is returned by this function will be passed to the `success` function; see `FusionTables.prototype.rowParser` and `FusionTables.prototype.columnParser`
- optional *boolean* `options.cache`: a boolean indicating whether to request cached results from the proxy; has no effect on direct API requests (*see Proxying and caching requests* below)
- *fusiontables#sqlresponse object* **returns** the raw response from the Fusion Tables API -- unless you've overriden the parser function, in which case it'll return whatever your parser returns; if you want to use rows like the other methods, just pass it the `rowParser`

Backbone.FusionTables
-----

This repository also includes a [Backbone.js driver](https://github.com/achavez/FusionTables.js/blob/master/backbone.fusiontables.js) that works for collections and models. Models are fetched using the row number, which is also used as the model's `ID`.

Any options used with FusionTables.js can be passed to Backbone.FusionTables, including cache settings on a per-request or global basis and request proxying.

To use the drive, create a `FusionTables` instance to pass to the drive. It works exactly the same as usual, except the `columns` property is required:

```javascript
// Initialize FusionTables.js
var ft = new FusionTables({
  key: 'YOUR_API_KEY',
  tableId: 'YOUR_TABLE_ID', 
  columns: ['ISBN', 'Title', 'Author', 'Pages'] // required with Backbone.FusionTables
});
```

Then, when creating your models and collections, pass your `FusionTables` instance with the `table` property and set `sync`:

```javascript
var Book = Backbone.Model.extend({
  idAttribute: 'rowid', // specify rowid as the model ID
  table: ft,
  sync: Backbone.FusionTables
});

var Library = Backbone.Collection.extend({
  model: Book,
  table: ft,
  sync: Backbone.FusionTables
});
```

Now you can populate your collection and render the data:

```javascript
var library = new Library();
library.fetch({
  success: function(data) {
    console.log(data.toJSON());
  },
  error: function(error) { // optional
    console.log(error);
  },
  where: { // optional, see .rows for details
    column: 'rowid',
    value: 1,
    operator: '>' // optional, defaults to =
  },
  options: { // optional, see .rows for details
    limit: 15
  }
});
```

All that is required when calling `.fetch()` is a `success` function. Everything else is optional. Because the driver is just calling the [`rows`](#rowssuccess-error-where-options) method, anything supported by that method can be passed here, as shown above.

Backbone.FusionTables implements AMD and specifies `['backbone']` as its only dependency and returns `Backbone` with `Backbone.FusionTables` added in.

Proxying requests
-----

It's possible to proxy requests by setting a `proxy` value in the `options` object that's past to the `FusionTables` constructor. When doing so, there's no need to pass a `key` value because the proxy should handle request signing.

Example:

```javascript
var ft = new FusionTables({
  tableId: 'YOUR_TABLE_ID',
  proxy: 'https://your-proxy.com/'
  columns: ["First Name", "Last Name"]
});
```

There's a Node.js-based proxy, [FusionTables-proxy](https://github.com/achavez/FusionTables-proxy), that is built specifically for use with this library.

Requests passed to the proxy will be exactly the same as those sent to the Google Fusion Tables API, except the base URL will be changed to the proxy URL and the key will not be passed, even if it was set when you instantiated your table.

Fetching cached data
-----

When using [FusionTables-proxy](https://github.com/achavez/FusionTables-proxy) it's possible to ask the proxy to store data from Fusion Tables in the proxy's Redis-backed cache. If you want to cache all requests by default, you can specify that when constructing the instance by passing the `cache` paramter:

```javascript
var ft = new FusionTables({
  tableId: 'YOUR_TABLE_ID',
  proxy: 'https://your-proxy.com/',
  cache: true,
  columns: ["First Name", "Last Name"]
});
```

Caching can also be disabled/enabled on a per-request basis by passing setting `cache` in a call's `options` parameter: 

```javascript
ft.columns(success, error, {cache: true}); // enable the cache for this request
ft.columns(success, error, {cache: false}); // disable for this one, even if it was set on instantiation of ft
```

License
-----
The MIT License (MIT)

Copyright (c) 2014 Andrew Chavez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.