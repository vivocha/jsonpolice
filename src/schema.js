import url from 'url';
import _ from 'lodash';

var schemas = {}
var options = {}
var regexps = {}
var basicValidators = {
  'default': 'validateDefault',
  'type': 'validateType',
  'enum': 'validateEnum',
  'allOf': 'validateAllOf',
  'anyOf': 'validateAnyOf',
  'oneOf': 'validateOneOf',
  'not': 'validateNot'
};
var typeValidators = {
  'number': 'validateNumber',
  'string': 'validateString',
  'array': 'validateArray',
  'object': 'validateObject'
};

function defined(v) {
  return typeof v !== 'undefined';
}
function testRegExp(exp, value) {
  var r = regexps[exp];
  if (!r) {
    r = regexps[exp] = new RegExp(exp);
  }
  return r.test(value);
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

export class Schema {
  constructor() {
  }

  static getNodeValidator(schema, dataScope, schemaScope, useThisData) {
    return function(data) {
      return Schema.validateNode(useThisData || data, schema, dataScope, schemaScope);
    }
  }
  static getPropertyValidator(owner, prop, schema, dataScope, schemaScope) {
    var rand = parseInt(100 * Math.random());
    console.log('getting prop val', prop, rand);
    var _data = owner[prop];
    var _dataScope = dataScope + '/' + prop;
    return function() {
      console.log('calling prop val', prop, rand);
      return Schema.validateNode(_data, schema, _dataScope, schemaScope).then(function(data) {
        _data = data;
        return data;
      });
    }
  }
  static validateNumber(data, schema, dataScope, schemaScope) {
    console.log('validateNumber', dataScope, schemaScope, schema, data);
    if (defined(schema.multipleOf) && (data % schema.multipleOf) !== 0) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'multipleOf'));
    } else if (defined(schema.maximum) && (data > schema.maximum || (schema.exclusiveMaximum !== false && data === schema.maximum))) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'maximum'));
    } else if (defined(schema.minimum) && (data < schema.minimum || (schema.exclusiveMinimum !== false && data === schema.minimum))) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'minimum'));
    } else {
      return data;
    }
  }
  static validateString(data, schema, dataScope, schemaScope) {
    console.log('validateString', dataScope, schemaScope, schema, data);
    if (defined(schema.minLength) && data.length < schema.minLength) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'minLength'));
    } else if (defined(schema.maxLength) && data.length > schema.maxLength) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'maxLength'));
    } else if (defined(schema.pattern) && !testRegExp(schema.pattern, data)) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'pattern'));
    } else {
      return data;
    }
    // TODO support the format property
  }
  static validateArray(data, schema, dataScope, schemaScope) {
    console.log('validateArray', dataScope, schemaScope, schema, data);
    if (defined(schema.minItems) && data.length < schema.minItems) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'minItems'));
    } else if (defined(schema.maxItems) && data.length > schema.maxItems) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'maxItems'));
    } else if (schema.uniqueItems === true && _.uniqWith(data, _.isEqual).length !== data.length) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'uniqueItems'));
    } else if (data.length && (defined(schema.items) || defined(schema.additionalItems))) {
      var p = Promise.resolve(data);
      var itemsIsArray = Array.isArray(schema.items);
      var itemsIsObject = !itemsIsArray && typeof schema.items === 'object';
      var addIsObject = typeof schema.additionalItems === 'object';
      for (var i = 0 ; i < data.length ; i++) {
        if (itemsIsArray && i < schema.items.length) {
          p = p.then(Schema.getPropertyValidator(data, i, schema.items[i], dataScope, schemaScope + '/items/' + i));
        } else if (itemsIsObject) {
          p = p.then(Schema.getPropertyValidator(data, i, schema.items, dataScope, schemaScope + '/items'));
        } else if (addIsObject) {
          p = p.then(Schema.getPropertyValidator(data, i, schema.additionalItems, dataScope, schemaScope + '/additionalItems'));
        } else if (schema.additionalItems === false) {
          return Promise.reject(new ValidationError(dataScope + '/' + i, schemaScope, 'additionalItems'));
        }
      }
      return p.then(function() {
        return data;
      });
    } else {
      return data;
    }
  }
  static validateObject(data, schema, dataScope, schemaScope) {
    console.log('validateObject', dataScope, schemaScope, schema, data);
    let i, j, k, props = Object.keys(data);
    if (defined(schema.maxProperties) && props.length > schema.maxProperties) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'maxProperties'));
    } else if (defined(schema.minProperties) && props.length < schema.minProperties) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'minProperties'));
    } else {
      if (defined(schema.required)) {
        for (i = 0 ; i < schema.required.length ; i++) {
          k = schema.required[i];
          if (!defined(data[k])) {
            return Promise.reject(new ValidationError(dataScope + '/' + k, schemaScope, 'required'));
          }
        }
      }
      var p = Promise.resolve(data);
      if (defined(schema.dependencies)) {
        for (k in schema.dependencies) {
          if (defined(data[k])) {
            i = schema.dependencies[k];
            if (Array.isArray(i)) {
              for (j = 0 ; j < i.length ; j++) {
                if (!defined(data[i[j]])) {
                  return Promise.reject(new ValidationError(dataScope + '/' + k, schemaScope, 'dependencies', i[j]));
                }
              }
            } else {
              p = p.then(Schema.getPropertyValidator(data, k, i, dataScope, schemaScope + '/dependencies/' + k));
            }
          }
        }
      }
      let found;
      if (defined(schema.properties) || defined(schema.additionalProperties) || defined(schema.patternProperties)) {
        while(k = props.pop()) {
          found = false;
          if (defined(schema.properties) && defined(schema.properties[k])) {
            found = true;
            p = p.then(Schema.getPropertyValidator(data, k, schema.properties[k], dataScope, schemaScope + '/properties/' + k));
          } else if (defined(schema.patternProperties)) {
            for (i in schema.patternProperties) {
              if (testRegExp(i, k)) {
                found = true;
                p = p.then(Schema.getPropertyValidator(data, k, schema.patternProperties[i], dataScope, schemaScope + '/patternProperties/' + i));
              }
            }
          }
          if (!found) {
            if (schema.additionalProperties === false) {
              return Promise.reject(new ValidationError(dataScope + '/' + k, schemaScope, 'property'));
            } else if (typeof schema.additionalProperties === 'object') {
              p = p.then(Schema.getPropertyValidator(data, k, schema.additionalProperties, dataScope, schemaScope + '/additionalProperties'));
            }
          }
        }
      }
      return p.then(function() {
        return data;
      });
    }
  }
  static validateDefault(data, schema, dataScope, schemaScope) {
    console.log('validateDefault', dataScope, schemaScope, schema.default, data);
    return data;
  }
  static validateType(data, schema, dataScope, schemaScope) {
    console.log('validateType', dataScope, schemaScope, schema.type, data);
    var dataType = typeof data;
    if (dataType === 'object' && Array.isArray(data)) {
      dataType = 'array';
    }
    if (dataType === 'number') {
      if (Array.isArray(schema.type)) {
        if (schema.type.indexOf('number') === -1 && schema.type.indexOf('integer') !== -1 && parseInt(data) !== data) {
          return Promise.reject(new ValidationError(dataScope, schemaScope, 'type'));
        }
      } else if ((schema.type === 'integer') && (parseInt(data) !== data)) {
        return Promise.reject(new ValidationError(dataScope, schemaScope, 'type'));
      }
    } else if (Array.isArray(schema.type) ? (schema.type.indexOf(dataType) === -1) : (schema.type !== dataType)) {
      return Promise.reject(new ValidationError(dataScope, schemaScope, 'type'));
    }
    return typeValidators[dataType] ? Schema[typeValidators[dataType]](data, schema, dataScope, schemaScope) : data;
  }
  static validateEnum(data, schema, dataScope, schemaScope) {
    console.log('validateEnum', dataScope, schemaScope, schema.enum, data);
    for (var i = 0, found = false ; !found && i < schema.enum.length ; i++) {
      found = _.isEqual(data, schema.enum[i]);
    }
    return found ? data : Promise.reject(new ValidationError(dataScope, schemaScope, 'enum'));
  }
  static validateAllOf(data, schema, dataScope, schemaScope) {
    console.log('validateAllOf', dataScope, schemaScope, schema.allOf, data);
    var p = Promise.resolve(data);
    for (var i = 0 ; i < schema.allOf.length ; i++) {
      p = p.then(Schema.getNodeValidator(schema.allOf[i], dataScope, schemaScope + '/allOf/' + i));
    }
    return p;
  }
  static validateAnyOf(data, schema, dataScope, schemaScope) {
    console.log('validateAnyOf', dataScope, schemaScope, schema.anyOf, data);
    var i, p = Promise.reject();
    for (i = 0 ; i < schema.anyOf.length ; i++) {
      p = p.catch(Schema.getNodeValidator(schema.anyOf[i], dataScope, schemaScope + '/anyOf/' + i, data));
    }
    return p;
  }
  static validateOneOf(data, schema, dataScope, schemaScope) {
    console.log('validateOneOf', dataScope, schemaScope, schema.oneOf, data);
    var count = 0;
    function inc() {
      count++;
    }
    var p = Promise.resolve(data);
    for (var i = 0 ; i < schema.oneOf.length ; i++) {
      p = p.then(Schema.getNodeValidator(schema.oneOf[i], dataScope, schemaScope + '/oneOf/' + i)).then(inc);
    }
    return p.then(function(data) {
      return count === 1 ? data : Promise.reject(new ValidationError(dataScope, schemaScope + '/oneOf', 'multiple'));
    });
  }
  static validateNot(data, schema, dataScope, schemaScope) {
    console.log('validateNot', dataScope, schemaScope, schema.not, data);
    return Promise.resolve(data).then(Schema.getNodeValidator(schema.not, dataScope, schemaScope + '/not')).then(function() {
      return Promise.reject(new ValidationError(dataScope, schemaScope + '/not', 'not'));
    }, function() {
      return data;
    });
  }
  static getBasicValidator(i) {
    return Schema[basicValidators[i]];
  }
  static getTypeValidator(i) {
    return Schema[typeValidators[i]];
  }
  static validateNode(data, schema, dataScope, schemaScope) {
    var _dataScope = dataScope || '#';
    var _schemaScope = schema.id || schemaScope || '#';
    let i, v, p = Promise.resolve(data);
    for (i in basicValidators) {
      if (typeof schema[i] !== 'undefined') {
        v = Schema.getBasicValidator(i);
        p = p.then(function(data) {
          return v(data, schema, _dataScope, _schemaScope);
        });
      }
    }
    return p;
  }
  static validate(data, schema) {
    return Promise.resolve(typeof schema === 'string' ? Schema.getSchema(schema) : Schema.parse(schema)).then(function(schema) {
      return Schema.validateNode(data, schema);
    });
  }
  static options(opts) {
    options = opts;
  }
  static parse(schema) {
    function parsePassOne(schema, scope) {
      console.log('parsePassOne', scope || '<no scope>', schema);
      var p = Promise.resolve(true);
      if (typeof schema === 'object') {
        let _scope;
        if (typeof schema.id === 'string') {
          _scope = Schema.resolve(schema.id, scope || '').url;
          console.log('registering new scope', _scope);
          Schema.register(_scope, schema);
        } else {
          _scope = scope;
        }
        function recurse(key, obj) {
          return p.then(function() {
            console.log('parsing', key);
            return parsePassOne(obj, _scope);
          });
        }
        let i, o;
        for (i in schema) {
          o = schema[i];
          if (typeof o === 'object' && !o.$ref) {
            p = recurse(i, o);
          }
        }
      }
      return p;
    }
    function parsePassTwo(schema, scope) {
      console.log('parsePassTwo', scope, schema);
      var p = Promise.resolve(true);
      if (typeof schema === 'object') {
        let _scope;
        if (typeof schema.id === 'string') {
          _scope = url.resolve(scope || '', schema.id);
        } else {
          _scope = scope;
        }
        function resolve(key, ref) {
          return p.then(function() {
            console.log('resolving', key, ref);
            return Schema.getSchema(ref, _scope).then(function(data) {
              console.log('resolved', key, ref, data);
              schema[key] = data;
              return true;
            });
          });
        }
        function recurse(key, obj) {
          return p.then(function() {
            console.log('parsing', key);
            return parsePassTwo(obj, _scope);
          });
        }
        let i, o;
        for (i in schema) {
          o = schema[i];
          if (typeof o === 'object') {
            if (o.$ref) {
              p = resolve(i, o.$ref);
            } else {
              p = recurse(i, o);
            }
          }
        }
      }
      return p;
    }
    return parsePassOne(schema).then(function() {
      return parsePassTwo(schema).then(function() {
        return schema;
      });
    });
  }
  static register(url, schema) {
    schemas[url] = schema;
    return schema;
  }
  static retrieve(url) {
    return options.retriever(url).then(function(data) {
      return Schema.parse(data).then(function(schema) {
        return Schema.register(url, schema);
      });
    });
  }
  static resolve(path, scope) {
    var resolvedPath = url.resolve(scope || '', path || '');
    var parsedPath = url.parse(resolvedPath);
    var hash = parsedPath.hash;
    delete parsedPath.hash;
    var out = {
      url: url.format(parsedPath)
    };
    if (hash && hash[0] === '#') {
      out.hash = hash.substr(1).split('/');
    } else {
      out.hash = [];
    }
    return out;
  }
  static getSchema(path, scope) {
    console.log('getting schema', path, scope);
    var resolved = Schema.resolve(path, scope);
    return Promise.resolve(schemas[resolved.url] || Schema.retrieve(resolved.url)).then(function(schema) {
      if (resolved.hash.length) {
        for (var i = 0, p = resolved.hash ; i < p.length ; i++) {
          if (p[i]) schema = schema[p[i]];
        }
      }
      return schema;
    });
  }
  static getSchemas() {
    return schemas;
  }
  static getSchemaIds() {
    return Object.keys(schemas);
  }
}

