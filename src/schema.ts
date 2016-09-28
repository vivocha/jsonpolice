import * as _ from 'lodash';
import * as refs from 'jsonref';
import { __schema, defined, enumerableAndDefined, SchemaOptions, SchemaError, ValidationError } from './global';

var __validating = Symbol();

function linkProperty(o:any, i:any, k:string):void {
  Object.defineProperty(o, k, {
    get: () => {
      return i[k];
    },
    set: () => { },
    configurable: false,
    enumerable: true
  });
}
function pushProperty(o:any, i:any, k:string):void {
  Object.defineProperty(o, o.length, {
    get: () => {
      return i[k];
    },
    set: (v) => { },
    configurable: false,
    enumerable: true
  });
}
function mergeProperties(o:any, i:any, k:string):void {
  if (o[k].allOf) {
    pushProperty(o[k].allOf, i, k);
  } else {
    var a = [];
    pushProperty(a, o, k);
    pushProperty(a, i, k);
    o[k] = { allOf: a };
  }
}
function mergeObjects(o:any, i:any, k:string):void {
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
function assignIfEnumerableAndDefined(o:any, i:any, k:string):void {
  if (enumerableAndDefined(i, k)) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndNotSet(o:any, i:any, k:string):void {
  if (enumerableAndDefined(i, k) && !enumerableAndDefined(o, k)) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndLessThan(o:any, i:any, k:string):void {
  if (enumerableAndDefined(i, k) && (!enumerableAndDefined(o, k) || i[k] < o[k])) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndGreaterThan(o:any, i:any, k:string):void {
  if (enumerableAndDefined(i, k) && (!enumerableAndDefined(o, k) || i[k] > o[k])) o[k] = i[k];
}
function assignIfEnumerableAndDefinedAndNot(o:any, i:any, k:string, v:any):void {
  if (enumerableAndDefined(i, k) && (!enumerableAndDefined(o, k) || i[k] !== v)) o[k] = i[k];
}

export interface SchemaFactory {
  new (data:any, opts:SchemaOptions): Schema;
}

export class Schema {
  protected scope:string;

  constructor(protected data:any, protected opts:SchemaOptions) {
    this.scope = refs.scope(data) || data.id || opts.scope || '#';
  }
  init():void {
    if (enumerableAndDefined(this.data, 'allOf')) {
      _.each(this.data.allOf, (data, i) => {
        Schema.create(this.data.allOf[i], _.defaults(this.opts, { scope: this.scope + '/allOf/' + i }));
      });
    }
    if (enumerableAndDefined(this.data, 'anyOf')) {
      _.each(this.data.anyOf, (data, i) => {
        Schema.create(this.data.anyOf[i], _.defaults(this.opts, { scope: this.scope + '/anyOf/' + i }));
      });
    }
    if (enumerableAndDefined(this.data, 'oneOf')) {
      _.each(this.data.oneOf, (data, i) => {
        Schema.create(this.data.oneOf[i], _.defaults(this.opts, { scope: this.scope + '/oneOf/' + i }));
      });
    }
    if (enumerableAndDefined(this.data, 'not')) {
      Schema.create(this.data.not, _.defaults(this.opts, { scope: this.scope + '/not' }));
    }
  }
  default(data:any):any {
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
  validate(data:any, path:string = ''):any {
    if (this[__validating]) {
      return data;
    } else {
      this[__validating] = true;
    }
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
  validateType(data:any, path:string):any {
    throw new SchemaError(this.scope, 'type', data.type);
  }
  validateEnum(data:any, path:string):any {
    for (var i = 0, found = false ; !found && i < this.data.enum.length ; i++) {
      found = _.isEqual(data, this.data.enum[i]);
    }
    if (!found) {
      throw new ValidationError(path, this.scope, 'enum');
    }
    return data;
  }
  validateAllOf(data:any, path:string):any {
    for (var i = 0 ; i < this.data.allOf.length ; i++) {
      data = this.data.allOf[i][__schema].validate(data, path);
    }
    return data;
  }
  validateAnyOf(data:any, path:string):any {
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
  validateOneOf(data:any, path:string):any {
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
  validateNot(data:any, path:string):any {
    try {
      this.data.not[__schema].validate(data, path);
    } catch(e) {
      return data;
    }
    throw new ValidationError(path, this.scope, 'not');
  }

  static factories:{
    [type:string]: SchemaFactory
  } = {};
  static registerFactory(type:string, factory:SchemaFactory) {
    Schema.factories[type] = factory;
  }
  static create(data:any, opts:SchemaOptions = {}):Schema {
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
          } else if (Schema.factories[data.type]) {
            schema = new Schema.factories[data.type](data, opts);
          } else {
            throw new SchemaError(opts.scope, 'type', data.type);
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
  static flatten(data:any):any {
    if (!enumerableAndDefined(data, 'allOf')) {
      return data;
    } else {
      var out:any = {};
      // Init the data that must be taken from the outer schema
      if (enumerableAndDefined(data, 'id')) out.id = data.id;
      if (enumerableAndDefined(data, '$schema')) out.$schema = data.$schema;

      return _.reduce(data.allOf.concat(data), function(o:any, i:any) {
        if (i !== data) {
          i = Schema.flatten(i);
        }
        assignIfEnumerableAndDefined(o, i, 'title');
        assignIfEnumerableAndDefined(o, i, 'format');
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
          if (enumerableAndDefined(o, 'items')) {
            mergeProperties(o, i, 'items');
          } else {
            linkProperty(o, i, 'items');
          }
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
