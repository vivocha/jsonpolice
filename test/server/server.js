var request = require('request');

function nodeRetriever(url, method, query, body) {
  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      method: method || 'GET',
      json: true
    };
    if (query) {
      opts.qs = query;
    }
    if (body) {
      opts.body = body;
    }
    console.log('opts', opts);
    request(opts, function(err, response, data) {
      if (err) {
        reject(err);
      } else if (response.statusCode !== 200) {
        reject(response.statusCode);
      } else {
        resolve(data);
      }
    });
  });
}

var Schema = require('../../lib/schema').Schema;
Schema.options({
  retriever: nodeRetriever
});

/*
schema.parse({
  a: {
    id: 'pippo',
    x: 1,
    y: 2,
    z: {
      aa: true,
    }
  },
  b: {
    c: { $ref: 'pippo' },
    d: false
  }
});
*/

var s2 = {
  "id": "http://my.site/myschema#",
  "definitions": {
    "schema1": {
      "id": "schema1",
      "type": "integer"
    },
    "schema2": {
      "type": "array",
      "items": { "$ref": "schema1"}
    }
  }
};

var s1 = {
  "id": "http://json-schema.org/draft-04/schema#",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "description": "Core schema meta-schema",
  "definitions": {
    "schemaArray": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#" }
    },
    "positiveInteger": {
      "type": "integer",
      "minimum": 0
    },
    "positiveIntegerDefault0": {
      "allOf": [ { "$ref": "#/definitions/positiveInteger" }, { "default": 0 } ]
    },
    "simpleTypes": {
      "enum": [ "array", "boolean", "integer", "null", "number", "object", "string" ]
    },
    "stringArray": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "uniqueItems": true
    }
  },
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uri"
    },
    "$schema": {
      "type": "string",
      "format": "uri"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "default": {},
    "multipleOf": {
      "type": "number",
      "minimum": 0,
      "exclusiveMinimum": true
    },
    "maximum": {
      "type": "number"
    },
    "exclusiveMaximum": {
      "type": "boolean",
      "default": false
    },
    "minimum": {
      "type": "number"
    },
    "exclusiveMinimum": {
      "type": "boolean",
      "default": false
    },
    "maxLength": { "$ref": "#/definitions/positiveInteger" },
    "minLength": { "$ref": "#/definitions/positiveIntegerDefault0" },
    "pattern": {
      "type": "string",
      "format": "regex"
    },
    "additionalItems": {
      "anyOf": [
        { "type": "boolean" },
        { "$ref": "#" }
      ],
      "default": {}
    },
    "items": {
      "anyOf": [
        { "$ref": "#" },
        { "$ref": "#/definitions/schemaArray" }
      ],
      "default": {}
    },
    "maxItems": { "$ref": "#/definitions/positiveInteger" },
    "minItems": { "$ref": "#/definitions/positiveIntegerDefault0" },
    "uniqueItems": {
      "type": "boolean",
      "default": false
    },
    "maxProperties": { "$ref": "#/definitions/positiveInteger" },
    "minProperties": { "$ref": "#/definitions/positiveIntegerDefault0" },
    "required": { "$ref": "#/definitions/stringArray" },
    "additionalProperties": {
      "anyOf": [
        { "type": "boolean" },
        { "$ref": "#" }
      ],
      "default": {}
    },
    "definitions": {
      "type": "object",
      "additionalProperties": { "$ref": "#" },
      "default": {}
    },
    "properties": {
      "type": "object",
      "additionalProperties": { "$ref": "#" },
      "default": {}
    },
    "patternProperties": {
      "type": "object",
      "additionalProperties": { "$ref": "#" },
      "default": {}
    },
    "dependencies": {
      "type": "object",
      "additionalProperties": {
        "anyOf": [
          { "$ref": "#" },
          { "$ref": "#/definitions/stringArray" }
        ]
      }
    },
    "enum": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true
    },
    "type": {
      "anyOf": [
        { "$ref": "#/definitions/simpleTypes" },
        {
          "type": "array",
          "items": { "$ref": "#/definitions/simpleTypes" },
          "minItems": 1,
          "uniqueItems": true
        }
      ]
    },
    "allOf": { "$ref": "#/definitions/schemaArray" },
    "anyOf": { "$ref": "#/definitions/schemaArray" },
    "oneOf": { "$ref": "#/definitions/schemaArray" },
    "not": { "$ref": "#" }
  },
  "dependencies": {
    "exclusiveMaximum": [ "maximum" ],
    "exclusiveMinimum": [ "minimum" ]
  },
  "default": {}
};

//Schema.parse(s2).then(function(data) {
Schema.validate({
  type: 'boolean',
  exclusiveMaximum: true,
  exclusiveMinimum: undefined,
  maximum: 5,
  minProperties: 3,
  enum: [ 'aa', 'bb', 'cc' ]
}, s1).then(function(data) {
  console.log('data', data);
  console.log('ids', Schema.getSchemaIds());
},function(err) {
  console.error('failed', err, err.stack);
});