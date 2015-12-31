define({
  columnList: {
    "kind": "fusiontables#columnList",
    "items": [{
      "kind": "fusiontables#column",
      "columnId": 0,
      "name": "Mammal Type",
      "type": "STRING"
    }, {
      "kind": "fusiontables#column",
      "columnId": 1,
      "name": "Group Size",
      "type": "NUMBER"
    }, {
      "kind": "fusiontables#column",
      "columnId": 2,
      "name": "Year 1st Tracked",
      "type": "DATETIME"
    }]
  },
  sqlresponse: {
    "kind": "fusiontables#sqlresponse",
    "columns": [
      "rowid",
      "Product",
      "Inventory"
    ],
    "rows": [
      [
        "1",
        "Amber Bead",
        "1251500558"
      ],
      [
        "201",
        "Black Shoes",
        "356"
      ],
      [
        "401",
        "White Shoes",
        "100"
      ]
    ]
  },
  sqlResponseParsed: [
    {rowid: 1, Product: "Amber Bead", Inventory: "1251500558"},
    {rowid: 201, Product: "Black Shoes", Inventory: "356"},
    {rowid: 401, Product: "White Shoes", Inventory: "100"}
  ]
});