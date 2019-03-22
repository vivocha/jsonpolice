# jsonpolice

A Javascript library implementing the [JSON Schema](http://json-schema.org/documentation.html) draft 7.

The library can optionally decorate parsed objects in order to have them return default values defined in the schema, for
undefined properties.

[![travis build](https://img.shields.io/travis/vivocha/jsonpolice.svg)](https://travis-ci.org/vivocha/jsonpolice)
[![Coverage Status](https://coveralls.io/repos/github/vivocha/jsonpolice/badge.svg?branch=master)](https://coveralls.io/github/vivocha/jsonpolice?branch=master)
[![npm version](https://img.shields.io/npm/v/jsonpolice.svg)](https://www.npmjs.com/package/jsonpolice)

## Install

```bash
$ npm install jsonpolice
```

## create(dataOrUri, options)

Create a new instance of schema validator.

* `dataOrUri`, the schema to parse or a fully qualified URI to pass to `retriever` to download the schema
* `options`, parsing options, the following optional properties are supported:
  * `scope` (required), the current resolution scope (absolute URL) of URLs and paths.
  * `registry`, an object to use to cache resolved `id`  and `$ref` values. If no registry is passed,
one is automatically created. Pass a `registry` if you are going to parse several schemas or URIs referencing
the same `id` and `$ref` values.
  * `retriever`, a function accepting a URL in input and returning a promise resolved to an object
representing the data downloaded for the URI. Whenever a `$ref` to a new URI is found, if the URI is not
already cached in the store in use, it'll be fetched using this `retriever`. If not `retriever` is passed
and a URI needs to be downloaded, a `no_retriever` exception is thrown. Refer to the documentation of
[jsonref](https://github.com/vivocha/jsonref) for sample retriever functions to use in the browser or
with Node.js.

The function returns a Promise resolving to a new instance of Schema. Once created, a schema instance can be used
repeatedly to validate data, calling the method `Schema.validate`.

### Example

```javascript
import * as jp from 'jsonpolice';

(async () => {

  const schema = jp.create({
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
  });
  
  try {
    const result = await schema.validate({
      d: (new Date()).toISOString(),
      i: 6,
      b: true
    });
  } catch(err) {
    // validation failed
  }

})();
```

## Schema.validate(data _[, options]_)

Validates the input data

* `data`, the data to parse
* `options`, validation options, the following optional properties are supported:
  * `setDefault`, if `true` returns the default value specified in the schema (if any) for undefined properties
  * `removeAdditional`, if `true` deletes properties not validating against additionalProperties, without failing 
  * `context`, if set to `read` deletes writeOnly properties, if set to `write` delete readOnly properties

Returns a decorated version of data, according to the specified options.

### Example

Using the following schema:

```javascript
{
  type: 'object',
  properties: {
    d: {
      type: 'string',
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
  d: 'test',
  i: 10,
  b: true
});
```

Produces the following output:

```javascript
{
  "d": "test",
  "i": 10,
  "b": true,
  "c": 5
}
```
