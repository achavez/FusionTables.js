FusionTables.js
=====

FusionTables.js allows you to retrieve data from the [Google Fusion Tables API v1.0](https://developers.google.com/fusiontables/docs/v1/getting_started) using a few lines of JavaScript.

Usage
-----
You'll need two pieces of information to get your data out of Fusion Tables:

- **Table ID**: An encryped string value that identifies your table (should look something like `1e7y6mtqv891111111111_aaaaaaaaa_CvWhg9gc`). You can get the Table ID by going to File > About in the Fusion Tables Web app.
- **Fusion Tables API key**: You can obtain an API key from the Google Developers Console. The Fusion Tables API documentation has a step-by-step guide for obtaining a key: [https://developers.google.com/fusiontables/docs/v1/using#APIKey](https://developers.google.com/fusiontables/docs/v1/using#APIKey)

You'll also need to ensure that you're Fusion Table is published and accessible. Do that by going to Tools > Share and changing the visiblity to either *Anyone with the link* or *Public on the web*.

Be sure to include `fusiontables.min.js` as well as its two dependencies -- [Underscore.js](https://github.com/jashkenas/underscore/) and [jQuery](https://github.com/jquery/jquery) -- in your HTML file:

```html
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/underscore-min.js"></script>
<script src="/path/to/fusiontables.min.js"></script>
```

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

###**`rows(success, error, where, limit, cols)`**
#####Usage
Fetch all rows from Fusion Tables or a subset of rows using a `WHERE` clause.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- optional *object* `where`: can be used to filter the results: `{'column': 'First Name', 'value': 'John'}` would return any rows where the *First Name* column is *John*; can also include an optional `operator` property (see the Fusion Tables docs for supported operators); by default the operator is `=`
- optional *number* `limit`: the maximum number of rows to retrieve
- optional *array* `cols`: the columns to return data for
- *array* **returns** an array of objects, each of which is a Fusion Tables row

###**`row(success, error, where, cols)`**
#####Usage
Fetch a single row from the Fusion Table, using a `WHERE` clause to fetch the specific row you're looking for.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- *object* `where`: can be used to filter the results: `{'column': 'First Name', 'value': 'John'}` would return any rows where the *First Name* column is *John*; can also include an optional `operator` property (see the Fusion Tables docs for supported operators); by default the operator is `=`
- optional *array* `cols`: the columns to return data for
- *object* **returns** a single Fusion Tables row as an object

###**`columns(success, error)`**
#####Usage
Fetch a list of columns that are available in the table. This could theoretically be used to set the list of default columns for the instance or as a parameter for one of the other methods, but that's probably a bad idea because it's an unnecessary API call.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- *array* **returns** all columns in the bale

###**`query(success, error, sql, parser)`**
#####Usage
Run a query using custom SQL and (optionally) a custom parser for the data returned by Fusion Tables. This will allow you to use `GROUP BY`, `ORDER BY` and other more advanced SQL.
#####Parameters
- *function* `success`: a function that will be passed a single argument with the parsed response from the Google Fusion Tables API
- *function* `error`: a function that will be passed a single argument with any errors from the Fusion Tables API
- *string* `sql`: a raw SQL string that will be URI-encoded and sent directly to the Fusion Tables API; to see what the API supports, see [https://developers.google.com/fusiontables/docs/v1/sql-reference#Select](https://developers.google.com/fusiontables/docs/v1/sql-reference#Select)
- optional *function* `parser`: a function that is passed the raw response from the Fusion Tables API; whatever is returned by this function will be passed to the `success` function; see `FusionTables.prototype.rowParser` and `FusionTables.prototype.columnParser`
- *fusiontables#sqlresponse object* **returns** the raw response from the Fusion Tables API -- unless you've overriden the parser function, in which case it'll return whatever your parser returns; if you want to use rows like the other methods, just pass it the `rowParser`

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