import _ from 'lodash';
import * as refs from 'jsonref';
import * as vers from './versions';

var __schema = Symbol();
var __validating = Symbol();
var __salmon = Symbol();
var regexps = {
  'date-time': /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/,
  'email': /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  'hostname': /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
  'ipv4': /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
  'ipv6': /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/,
  'uri': /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/
};
var seps = {
  'csv': ',',
  'ssv': ' ',
  'tsv': '\t',
  'pipes': '|'
};

function defined(v) {
  return typeof v !== 'undefined';
}
function enumerableAndDefined(o, k) {
  return defined(o) && o.propertyIsEnumerable(k) && defined(o[k]);
}
function testRegExp(exp, value) {
  var r = regexps[exp];
  if (!r) {
    r = regexps[exp] = new RegExp(exp);
  }
  return r.test(value);
}
function linkProperty(o, i, k) {
  Object.defineProperty(o, k, {
    get: () => {
      return i[k];
    },
    set: (v) => { },
    configurable: false,
    enumerable: true
  });
}
function pushProperty(o, i, k) {
  Object.defineProperty(o, o.length, {
    get: () => {
      return i[k];
    },
    set: (v) => { },
    configurable: false,
    enumerable: true
  });
}
function mergeProperties(o, i, k) {
  if (o[i].allOf) {
    pushProperty(o[i].allOf, i, k);
  } else {
    var a = [];
    pushProperty(a, o, k);
    pushProperty(a, i, k);
    o[i] = { allOf: a };
  }
}
function mergeObjects(o, i, k) {
  if (!enumerableAndDefined(o, k)) {
    o[k] = {};
  }
  for (var j in i[k]) {
    if (enumerableAndDefined(o[k], j)) {
      mergeProperties(o[k], i[k], j);
    } else {
      linkProperty(o[k], i[k], j);
    }
  }
}
function assignIfEnumerableAndDefined(o, i, k) {
  if (enumerableAndDefined(i, k)) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndNotSet(o, i, k) {
  if (enumerableAndDefined(i, k) && !enumerableAndDefined(o[k])) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndLessThan(o, i, k) {
  if (enumerableAndDefined(i, k) && (!enumerableAndDefined(o[k]) || i[k] < o[k])) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndGreaterThan(o, i, k) {
  if (enumerableAndDefined(i, k) && (!enumerableAndDefined(o[k]) || i[k] > o[k])) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndNot(o, i, k, v) {
  if (enumerableAndDefined(i, k) && (!enumerableAndDefined(o[k]) || i[k] !== v)) o[k] = i[k];
}

class SchemaError extends Error {
  constructor(schemaScope, type, info) {
    super(type);
    this.name = 'SchemaError';
    this.scope = schemaScope;
    this.info = info;
  }
}
class ValidationError extends Error {
  constructor(dataScope, schemaScope, type, info) {
    super(type);
    this.name = 'ValidationError';
    this.path = dataScope;
    this.scope = schemaScope;
    this.info = info;
  }
}

function _createDefaultProperty(schema, obj, key) {
  Object.defineProperty(obj, key, {
    get: () => {
      var v = schema.default();
      if (typeof v === 'object') {
        v[__salmon] = { obj: obj, key: key };
      }
      return v;
    },
    set: (v) => {
      Object.defineProperty(obj, key, {
        value: v,
        configurable: true,
        enumerable: true,
        writable: true
      });
      if (obj[__salmon]) {
        obj[__salmon].obj[obj[__salmon].key] = obj;
        delete obj[__salmon];
      }
    },
    configurable: true,
    enumerable: false
  });
}

class Schema {
  constructor(data, opts) {
    this.data = data;
    this.opts = opts;
    this.scope = refs.scope(data) || data.id || opts.scope || '#';
  }
  init() {
    if (enumerableAndDefined(this.data, 'allOf')) {
      _.each(this.data.allOf, (data, i) => {
        Schema.create(this.data.allOf[i], this.scope + '/allOf/' + i);
      });
    }
    if (enumerableAndDefined(this.data, 'anyOf')) {
      _.each(this.data.anyOf, (data, i) => {
        Schema.create(this.data.anyOf[i], this.scope + '/anyOf/' + i);
      });
    }
    if (enumerableAndDefined(this.data, 'oneOf')) {
      _.each(this.data.oneOf, (data, i) => {
        Schema.create(this.data.oneOf[i], this.scope + '/oneOf/' + i);
      });
    }
    if (enumerableAndDefined(this.data, 'not')) {
      Schema.create(this.data.not, this.scope + '/not');
    }
  }
  default(data) {
    var def;
    if (defined(data)) {
      def = data;
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'allOf')) {
      for (var i = 0 ; !def && i < this.data.allOf.length ; i++) {
        def = this.data.allOf[i][__schema].default();
      }
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'anyOf')) {
      for (var i = 0 ; !def && i < this.data.anyOf.length ; i++) {
        def = this.data.anyOf[i][__schema].default();
      }
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'oneOf')) {
      for (var i = 0 ; !def && i < this.data.oneOf.length ; i++) {
        def = this.data.oneOf[i][__schema].default();
      }
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'default')) {
      def = _.cloneDeep(this.data.default);
    }
    return def;
  }
  validate(data, path) {
    if (this[__validating]) {
      return data;
    } else {
      this[__validating] = true;
    }
    path = path || '';
    data = this.default(data);
    if (typeof data !== 'undefined') {
      try {
        if (enumerableAndDefined(this.data, 'type')) {
          data = this.validateType(data, path);
        }
        if (enumerableAndDefined(this.data, 'enum')) {
          data = this.validateEnum(data, path);
        }
        if (enumerableAndDefined(this.data, 'allOf')) {
          data = this.validateAllOf(data, path);
        }
        if (enumerableAndDefined(this.data, 'anyOf')) {
          data = this.validateAnyOf(data, path);
        }
        if (enumerableAndDefined(this.data, 'oneOf')) {
          data = this.validateOneOf(data, path);
        }
        if (enumerableAndDefined(this.data, 'not')) {
          data = this.validateNot(data, path);
        }
      } catch(e) {
        delete this[__validating];
        throw e;
      }
    }
    delete this[__validating];
    return data;
  }
  validateType(data, path) {
    throw new SchemaError(this.scope, 'type', data.type);
  }
  validateEnum(data, path) {
    for (var i = 0, found = false ; !found && i < this.data.enum.length ; i++) {
      found = _.isEqual(data, this.data.enum[i]);
    }
    if (!found) {
      throw new ValidationError(path, this.scope, 'enum');
    }
    return data;
  }
  validateAllOf(data, path) {
    for (var i = 0 ; i < this.data.allOf.length ; i++) {
      data = this.data.allOf[i][__schema].validate(data, path);
    }
    return data;
  }
  validateAnyOf(data, path) {
    for (var i = 0, found = false, _data ; !found && i < this.data.anyOf.length ; i++) {
      try {
        _data = this.data.anyOf[i][__schema].validate(data, path);
        found = true;
      } catch(e) {}
    }
    if (!found) {
      throw new ValidationError(path, this.scope, 'anyOf');
    }
    return _data;
  }
  validateOneOf(data, path) {
    for (var i = 0, count = 0, _data ; count < 2 && i < this.data.oneOf.length ; i++) {
      try {
        _data = this.data.oneOf[i][__schema].validate(data, path);
        count++;
      } catch(e) {}
    }
    if (count !== 1) {
      throw new ValidationError(path, this.scope, 'oneOf');
    }
    return _data;
  }
  validateNot(data, path) {
    try {
      this.data.not[__schema].validate(data, path);
    } catch(e) {
      return data;
    }
    throw new ValidationError(path, this.scope, 'not');
  }
  static create(data, opts) {
    var schema;
    if (defined(data)) {
      if (data[__schema] instanceof Schema) {
        return data[__schema];
      } else {
        if (defined(data.type)) {
          if (Array.isArray(data.type)) {
            var _data = { anyOf: [ ] };
            _.each(data.type, function(type) {
              var _type = _.clone(data);
              _type.type = type;
              _data.anyOf.push(_type);
            });
            schema = new Schema(_data, opts);
          } else {
            switch (data.type) {
              case 'array':
                schema = new ArraySchema(data, opts);
                break;
              case 'boolean':
                schema = new BooleanSchema(data, opts);
                break;
              case 'integer':
                schema = new IntegerSchema(data, opts);
                break;
              case 'number':
                schema = new NumberSchema(data, opts);
                break;
              case 'null':
                schema = new NullSchema(data, opts);
                break;
              case 'object':
                schema = new ObjectSchema(data, opts);
                break;
              case 'string':
                schema = new StringSchema(data, opts);
                break;
              default:
                throw new SchemaError(opts.scope, 'type', data.type);
                break;
            }
          }
        } else {
          schema = new Schema(data, opts);
        }
        data[__schema] = schema;
        schema.init();
        return schema;
      }
    } else {
      throw new SchemaError(opts.scope, 'no_data');
    }
  }
  static flatten(data) {
    if (!enumerableAndDefined(data, 'allOf')) {
      return data;
    } else {
      var out = {};
      // Init the data that must be taken from the outer schema
      if (enumerableAndDefined(data, 'id')) out.id = data.id;
      if (enumerableAndDefined(data, '$schema')) out.$schema = data.$schema;

      return _.reduce(data.allOf.concat(data), function(o, i, k) {
        if (i !== data) {
          i = Schema.flatten(i);
        }
        assignIfEnumerableAndDefined(o, i, 'title');
        assignIfEnumerableAndDefined(o, i, 'description');
        assignIfEnumerableAndDefinedAndNotSet(o, i, 'default');
        assignIfEnumerableAndDefined(o, i, 'multipleOf');
        assignIfEnumerableAndDefinedAndLessThan(o, i, 'maximum');
        assignIfEnumerableAndDefinedAndNot(o, i, 'exclusiveMaximum', true);
        assignIfEnumerableAndDefinedAndGreaterThan(o, i, 'minimum');
        assignIfEnumerableAndDefinedAndNot(o, i, 'exclusiveMinimum', true);
        assignIfEnumerableAndDefinedAndLessThan(o, i, 'maxLength');
        assignIfEnumerableAndDefinedAndGreaterThan(o, i, 'minLength');
        assignIfEnumerableAndDefined(o, i, 'pattern');
        if (enumerableAndDefined(i, 'additionalItems')) {
          if (enumerableAndDefined(o, 'additionalItems')) {
            if (typeof i.additionalItems === 'object') {
              if (typeof o.additionalItems === 'object') {
                mergeProperties(o, i, 'additionalItems');
              } else if (o.additionalItems !== false) {
                linkProperty(o, i, 'additionalItems');
              }
            } else if (i.additionalItems === false) {
              o.additionalItems = false;
            }
          } else {
            linkProperty(o, i, 'additionalItems');
          }
        }
        if (enumerableAndDefined(i, 'items')) {
          mergeProperties(o, i, 'items');
        }
        assignIfEnumerableAndDefinedAndLessThan(o, i, 'maxItems');
        assignIfEnumerableAndDefinedAndGreaterThan(o, i, 'minItems');
        assignIfEnumerableAndDefinedAndNot(o, i, 'uniqueItems', true);
        assignIfEnumerableAndDefinedAndLessThan(o, i, 'maxProperties');
        assignIfEnumerableAndDefinedAndGreaterThan(o, i, 'minProperties');
        if (enumerableAndDefined(i, 'required')) {
          o.required = _.uniq((o.required || []).concat(i.required));
        }
        if (enumerableAndDefined(i, 'additionalProperties')) {
          if (enumerableAndDefined(o, 'additionalProperties')) {
            if (typeof i.additionalProperties === 'object') {
              if (typeof o.additionalProperties === 'object') {
                mergeProperties(o, i, 'additionalProperties');
              } else if (o.additionalProperties !== false) {
                linkProperty(o, i, 'additionalProperties');
              }
            } else if (i.additionalProperties === false) {
              o.additionalProperties = false;
            }
          } else {
            linkProperty(o, i, 'additionalProperties');
          }
        }
        if (enumerableAndDefined(i, 'definitions')) {
          mergeObjects(o, i , 'definitions');
        }
        if (enumerableAndDefined(i, 'properties')) {
          mergeObjects(o, i , 'properties');
        }
        if (enumerableAndDefined(i, 'patternProperties')) {
          mergeObjects(o, i , 'patternProperties');
        }
        if (enumerableAndDefined(i, 'dependencies')) {
          if (enumerableAndDefined(o, 'dependencies')) {
            if (Array.isArray(o.dependencies) && Array.isArray(i.dependencies)) {
              o.dependencies = _.uniq((o.dependencies || []).concat(i.dependencies));
            } else if (typeof o.dependencies === 'object' && typeof i.dependencies === 'object') {
              mergeProperties(o, i, 'dependencies');
            } else {
              linkProperty(o, i, 'dependencies');
            }
          } else {
            linkProperty(o, i, 'dependencies');
          }
        }
        assignIfEnumerableAndDefinedAndNotSet(o, i, 'enum');
        assignIfEnumerableAndDefinedAndNotSet(o, i, 'type');
        assignIfEnumerableAndDefined(o, i, 'anyOf');
        assignIfEnumerableAndDefined(o, i, 'oneOf');
        assignIfEnumerableAndDefined(o, i, 'not');
        return o;
      }, out);
    }
  }
}

class ArraySchema extends Schema {
  constructor(data, opts) {
    super(data, opts);
  }
  init() {
    super.init();
    if (enumerableAndDefined(this.data, 'items')) {
      if (Array.isArray(this.data.items)) {
        _.each(this.data.items, (data, i) => {
          Schema.create(this.data.items[i], this.scope + '/items/' + i);
        });
      } else if (typeof this.data.items === 'object') {
        Schema.create(this.data.items, this.scope + '/items');
      } else {
        throw new SchemaError(this.scope, 'items', data.items);
      }
    }
    if (enumerableAndDefined(this.data, 'additionalItems')) {
      if (typeof this.data.additionalItems === 'object') {
        Schema.create(this.data.additionalItems, this.scope + '/additionalItems');
      } else if (typeof this.data.additionalItems !== 'boolean') {
        throw new SchemaError(this.scope, 'additionalItems', data.additionalItems);
      }
    }
  }
  validateType(data, path) {
    if (typeof data === 'string') {
      var sep = seps[this.data.collectionFormat || 'csv'];
      if (!sep) {
        throw new SchemaError(this.scope, 'collectionFormat', this.data.collectionFormat);
      }
      data = data.split(sep);
    }
    if (!Array.isArray(data)) {
      throw new ValidationError(path, this.scope, 'type');
    } else if (enumerableAndDefined(this.data, 'minItems') && data.length < this.data.minItems) {
      throw new ValidationError(path, this.scope, 'minItems');
    } else if (enumerableAndDefined(this.data, 'maxItems') && data.length > this.data.maxItems) {
      throw new ValidationError(path, this.scope, 'maxItems');
    } else if (this.data.uniqueItems === true && _.uniqWith(data, _.isEqual).length !== data.length) {
      throw new ValidationError(path, this.scope, 'uniqueItems');
    } else if (data.length && (enumerableAndDefined(this.data, 'items') || enumerableAndDefined(this.data, 'additionalItems'))) {
      var itemsIsArray = Array.isArray(this.data.items);
      var itemsIsObject = !itemsIsArray && typeof this.data.items === 'object';
      var addIsObject = typeof this.data.additionalItems === 'object';
      for (var i = 0 ; i < data.length ; i++) {
        if (itemsIsArray && i < this.data.items.length) {
          data[i] = this.data.items[i][__schema].validate(data[i], path + '/' + i);
        } else if (itemsIsObject) {
          data[i] = this.data.items[__schema].validate(data[i], path + '/' + i);
        } else if (addIsObject) {
          data[i] = this.data.additionalItems[__schema].validate(data[i], path + '/' + i);
        } else if (this.data.additionalItems === false) {
          throw new ValidationError(path + '/' + i, this.scope, 'additionalItems');
        }
      }
    }
    return data;
  }
}

class BooleanSchema extends Schema {
  constructor(data, opts) {
    super(data, opts);
  }
  validateType(data, path) {
    if (typeof data === 'string') {
      if (data === 'true' || data === '1') {
        data = true;
      } else if (data === 'false' || data === '0') {
        data = false;
      }
    }
    if (typeof data !== 'boolean') {
      throw new ValidationError(path, this.scope, 'type');
    }
    return data;
  }
}

class NumberSchema extends Schema {
  constructor(data, opts) {
    super(data, opts);
  }
  validateType(data, path) {
    if (typeof data === 'string') {
      data = +data;
    }
    if (typeof data !== 'number' || isNaN(data)) {
      throw new ValidationError(path, this.scope, 'type');
    } else if (enumerableAndDefined(this.data, 'multipleOf') && (data % this.data.multipleOf) !== 0) {
      throw new ValidationError(path, this.scope, 'multipleOf');
    } else if (enumerableAndDefined(this.data, 'maximum') && (data > this.data.maximum || (this.data.exclusiveMaximum === true && data === this.data.maximum))) {
      throw new ValidationError(path, this.scope, 'maximum');
    } else if (enumerableAndDefined(this.data, 'minimum') && (data < this.data.minimum || (this.data.exclusiveMinimum === true && data === this.data.minimum))) {
      throw new ValidationError(path, this.scope, 'minimum');
    }
    return data;
  }
}

class IntegerSchema extends NumberSchema {
  constructor(data, opts) {
    super(data, opts);
  }
  validateType(data, path) {
    data = super.validateType(data, path)
    if (parseInt(data) !== data) {
      throw new ValidationError(path, this.scope, 'type');
    }
    return data;
  }
}

class NullSchema extends Schema {
  constructor(data, opts) {
    super(data, opts);
  }
  validateType(data, path) {
    if (typeof data !== 'null') {
      throw new ValidationError(path, this.scope, 'type');
    }
    return data;
  }
}

class ObjectSchema extends Schema {
  constructor(data, opts) {
    super(data, opts);
  }
  init() {
    super.init();
    var i;
    if (enumerableAndDefined(this.data, 'properties')) {
      for (i in this.data.properties) {
        Schema.create(this.data.properties[i], this.scope + '/properties/' + i);
      }
    }
    if (enumerableAndDefined(this.data, 'patternProperties')) {
      for (i in this.data.patternProperties) {
        Schema.create(this.data.patternProperties[i], this.scope + '/patternProperties/' + i);
      }
    }
    if (enumerableAndDefined(this.data, 'additionalProperties')) {
      if (typeof this.data.additionalProperties === 'object') {
        Schema.create(this.data.additionalProperties, this.scope + '/additionalProperties');
      } else if (typeof this.data.additionalProperties !== 'boolean') {
        throw new SchemaError(this.scope, 'additionalProperties', data.additionalProperties);
      }
    }
    if (enumerableAndDefined(this.data, 'dependencies')) {
      for (i in this.data.dependencies) {
        if (typeof this.data.dependencies[i] === 'object' && !Array.isArray(this.data.dependencies[i])) {
          Schema.create(this.data.dependencies[i], this.scope + '/dependencies/' + i);
        }
      }
    }
  }
  default(data) {
    var def = super.default(data);
    if (defined(def)) {
      if (enumerableAndDefined(this.data, 'properties')) {
        for (var k in this.data.properties) {
          if (!defined(def[k])) {
            _createDefaultProperty(this.data.properties[k][__schema], def, k);
          }
        }
      }
    }
    return def;
  }
  validateType(data, path) {
    var props = Object.keys(data);
    if (typeof data !== 'object' || Array.isArray(data)) {
      throw new ValidationError(path, this.scope, 'type');
    } else if (enumerableAndDefined(this.data, 'maxProperties') && props.length > this.data.maxProperties) {
      throw new ValidationError(path, this.scope, 'maxProperties');
    } else if (enumerableAndDefined(this.data, 'minProperties') && props.length < this.data.minProperties) {
      throw new ValidationError(path, this.scope, 'minProperties');
    } else {
      var i, j, k, found;
      if (enumerableAndDefined(this.data, 'required')) {
        for (i = 0 ; i < this.data.required.length ; i++) {
          k = this.data.required[i];
          if (!enumerableAndDefined(data, k)) {
            throw new ValidationError(path + '/' + k, this.scope, 'required');
          }
        }
      }
      if (defined(data) && enumerableAndDefined(this.data, 'dependencies')) {
        for (k in this.data.dependencies) {
          if (enumerableAndDefined(data, k)) {
            if (Array.isArray(this.data.dependencies[k])) {
              for (j = 0 ; j < this.data.dependencies[k].length ; j++) {
                if (!enumerableAndDefined(data, this.data.dependencies[k][j])) {
                  throw new ValidationError(path + '/' + k, this.scope, 'dependencies', this.data.dependencies[k][j]);
                }
              }
            } else {
              data[k] = this.data.dependencies[k][__schema].validate(data[k], path + '/' + k);
            }
          }
        }
      }
      if (enumerableAndDefined(this.data, 'properties') || enumerableAndDefined(this.data, 'additionalProperties') || enumerableAndDefined(this.data, 'patternProperties')) {
        while(k = props.shift()) {
          found = false;
          if (enumerableAndDefined(this.data, 'properties') && this.data.properties[k]) {
            found = true;
            data[k] = this.data.properties[k][__schema].validate(data[k], path + '/' + k);
          } else if (enumerableAndDefined(this.data, 'patternProperties')) {
            for (i in this.data.patternProperties) {
              if (testRegExp(i, k)) {
                found = true;
                data[k] = this.data.patternProperties[i][__schema].validate(data[k], path + '/' + k);
              }
            }
          }
          if (!found) {
            if (this.data.additionalProperties === false) {
              if (this.opts.removeAdditional) {
                delete data[k];
              } else {
                throw new ValidationError(path + '/' + k, this.scope, 'property');
              }
            } else if (typeof this.data.additionalProperties === 'object') {
              let s = this.data.additionalProperties[__schema];
              if(s) {
                data[k] = s.validate(data[k], path + '/' + k);
              }
            }
          }
        }
      }
      return data;
    }
  }
}

class StringSchema extends Schema {
  constructor(data, opts) {
    super(data, opts);
  }
  validateType(data, path) {
    if (this.data.format === 'date-time') {
      if (!(data instanceof Date)) {
        if (typeof data !== 'string') {
          throw new ValidationError(path, this.scope, 'type');
        } else if (!testRegExp(this.data.format, data)) {
          throw new ValidationError(path, this.scope, 'format');
        } else {
          data = new Date(data);
        }
      }
    } else {
      if (typeof data !== 'string') {
        throw new ValidationError(path, this.scope, 'type');
      } else if (enumerableAndDefined(this.data, 'minLength') && data.length < this.data.minLength) {
        throw new ValidationError(path, this.scope, 'minLength');
      } else if (enumerableAndDefined(this.data, 'maxLength') && data.length > this.data.maxLength) {
        throw new ValidationError(path, this.scope, 'maxLength');
      } else if (enumerableAndDefined(this.data, 'pattern') && !testRegExp(this.data.pattern, data)) {
        throw new ValidationError(path, this.scope, 'pattern');
      } else if (enumerableAndDefined(this.data, 'format') && defined(regexps[this.data.format]) && !testRegExp(this.data.format, data)) {
        throw new ValidationError(path, this.scope, 'format');
      }
    }
    return data;
  }
}

export function create(dataOrUri, opts) {
  if (!dataOrUri) {
    throw new SchemaError(opts.scope, 'no_data');
  }
  if (typeof dataOrUri === 'object' && dataOrUri[__schema] instanceof Schema) {
    return Promise.resolve(dataOrUri[__schema]);
  } else {
    return vers.parseKnown().then(function(versions) {
      var _opts = opts || {};
      if (!_opts.scope) _opts.scope = (typeof dataOrUri === 'string' ? dataOrUri : '#');
      if (!_opts.store) _opts.store = {};
      _.defaults(_opts.store, versions);
      return refs.parse(dataOrUri, _opts).then(function(data) {
        return vers.get(data.$schema, opts).then(function(schemaVersion) {
          var _schemaVersion = Schema.create(schemaVersion, refs.scope(schemaVersion));
          _schemaVersion.validate(data);
          return Schema.create(data, _opts);
        });
      });
    });
  }
}
export function flatten(dataOrUri, opts) {
  return create(dataOrUri, opts).then(function(schema) {
    return Schema.flatten(schema.data);
  });
}
export function getVersion(dataOrUri, opts) {
  return vers.get(dataOrUri, opts);
}
export function addVersion(dataOrUri, opts) {
  return vers.parseKnown().then(function() {
    return vers.add(dataOrUri, opts);
  });
}
export function fireValidationError(dataScope, schemaScope, type, info) {
  throw new ValidationError(dataScope, schemaScope, type, info);
}
