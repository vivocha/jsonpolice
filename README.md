# jsonpolice

A Javascript library implementing the [JSON Schema](http://json-schema.org/documentation.html) specifications.
Version 4 (draft) of the specification is supported by default, additional versions can be registered via the
addVersion function.

The library decorates parsed objects in order to have them return default values defined the in the schema, for
undefined properties.

[![travis build](https://img.shields.io/travis/vivocha/jsonpolice.svg)](https://travis-ci.org/vivocha/jsonpolice)
[![codecov coverage](https://img.shields.io/codecov/c/github/vivocha/jsonpolice.svg)](https://codecov.io/gh/vivocha/jsonpolice)
[![npm version](https://img.shields.io/npm/v/jsonpolice.svg)](https://www.npmjs.com/package/jsonpolice)

## Install

```bash
$ npm install jsonpolice
```

## create(dataOrUri _[, options]_)

Create a new instance of schema validator.

* `dataOrUri`, the schema to parse or a fully qualified URI to pass to `retriever` to download the schema
* `options` (optional), parsing options, the following optional properties are supported:
  * `scope`, the current resolution scope (base href) of URLs and paths.
  * `store`, an object to use to cache resolved `id`  and `$ref` values. If no store is passed,
one is automatically created. Pass a `store` if you are going to parse several schemas or URIs referencing
the same `id` and `$ref` values.
  * `retriever`, a function accepting a URL in input and returning a promise resolved to an object
representing the data downloaded for the URI. Whenever a `$ref` to a new URI is found, if the URI is not
already cached in the store in use, it'll be fetched using this `retriever`. If not `retriever` is passed
and a URI needs to be downloaded, a `no_retriever` exception is thrown. Refer to the documentation of
[jsonref](https://github.com/vivocha/jsonref) for sample retriever functions to use in the browser or
with Node.js.
 * `removeAdditional`, if `true` unknown properties are filtered out. Unknown properties are properties
not passing the validation of none of `properties`, `patternProperties` and `additionalProperties`) If
omitted or set to `false`, an unknown property triggers a ValidationError.

The function returns a Promise resolving to a new instance of Schema. Once created, a schema instance can be used
repeatedly to validate data, calling the method `Schema.validate`.

### Example

```javascript
var jsonpolice = require('jsonpolice');

jsonpolice.create({
  type: 'object',
  properties: {
    d: {
      type: 'string',
      format: 'date-time'
    },
    i: {
      type: 'integer'
    },
    b: {
      type: [ 'boolean', 'number' ]
    },
    c: {
      default: 5
    }
  }
}).then(function(schema) {
  console.log(schema.validate({
    d: (new Date()).toISOString(),
    i: 6,
    b: true
  }));
});
```

## Schema.validate(data)

Validates the input data

* `data`, the data to parse

Returns a decorated version of data, that returns default values of undefined properties, according to the
schema used to validate the data. Throws a ValidationError exception in case an error is encountered.

Additionally, type coercion is applied when possible and needed, as described in the following table:

| Type | Format | Input type | Output type | Conversion |
| --- | --- | --- | --- | --- |
| string | date-time | string | Date | output = new Date(input) |
| number | | string | number | output = +input |
| boolean | | string | boolean | true if "true" or "1", false if "false" or "0" |
| Array | | string | Array | output = input.split(',') |

For arrays, the library supports coercion from strings using by the default the comma-separated format (csv).
Similarly to the [OpenAPI specification (Swagger)](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#parameter-object),
it's possible to specify a different format using the `collectionFormat` property: the supported formats are
`csv`, `ssv`, `tsv` and `pipes`.

### Example

Using the following schema:

```javascript
{
  type: 'object',
  properties: {
    d: {
      type: 'string',
      format: 'date-time'
    },
    i: {
      type: 'integer'
    },
    b: {
      type: [ 'boolean', 'number' ]
    },
    c: {
      default: 5
    }
  }
}
```

And parsing the following data:

```javascript
var output = schema.validate({
  d: '2016-03-18T16:33:46.651Z',
  i: '10',
  b: '1',
  a: "5,7"
});
```

Produces the following output:

```javascript
{
  "d": "2016-03-18T16:33:46.651Z",
  "i": 10,
  "b": true,
  "a": [
    5,
    7
  ]
}

output.c === 5; // true
result.d instanceof Date; // true
```
