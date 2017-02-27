import * as _ from 'lodash';
import { __schema, defined, enumerableAndDefined, testRegExp, SchemaOptions, SchemaError, ValidationError } from './global';
import { Schema } from './schema';

let __salmon = Symbol();

function createDefaultProperty(schema, obj, key) {
  Object.defineProperty(obj, key, {
    get: () => {
      let v = schema.default();
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

export class ObjectSchema extends Schema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  init():void {
    super.init();
    let i;
    if (enumerableAndDefined(this.data, 'properties')) {
      for (i in this.data.properties) {
        Schema.create(this.data.properties[i], _.defaults(this.opts, { scope: this.scope + '/properties/' + i }));
      }
    }
    if (enumerableAndDefined(this.data, 'patternProperties')) {
      for (i in this.data.patternProperties) {
        Schema.create(this.data.patternProperties[i], _.defaults(this.opts, { scope: this.scope + '/patternProperties/' + i }));
      }
    }
    if (enumerableAndDefined(this.data, 'additionalProperties')) {
      if (typeof this.data.additionalProperties === 'object') {
        Schema.create(this.data.additionalProperties, _.defaults(this.opts, { scope: this.scope + '/additionalProperties' }));
      } else if (typeof this.data.additionalProperties !== 'boolean') {
        throw new SchemaError(this.scope, 'additionalProperties', this.data.additionalProperties);
      }
    }
    if (enumerableAndDefined(this.data, 'dependencies')) {
      for (i in this.data.dependencies) {
        if (typeof this.data.dependencies[i] === 'object' && !Array.isArray(this.data.dependencies[i])) {
          Schema.create(this.data.dependencies[i], _.defaults(this.opts, { scope: this.scope + '/dependencies/' + i }));
        }
      }
    }
  }
  default(data:any):any {
    let def = super.default(data);
    if (defined(def) && def !== null && typeof def === 'object') {
      if (enumerableAndDefined(this.data, 'properties')) {
        for (let k in this.data.properties) {
          if (!defined(def[k])) {
            createDefaultProperty(this.data.properties[k][__schema], def, k);
          }
        }
      }
    }
    return def;
  }
  validateType(data:any, path:string):any {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new ValidationError(path, this.scope, 'type');
    }
    let props = Object.keys(data);
    if (enumerableAndDefined(this.data, 'maxProperties') && props.length > this.data.maxProperties) {
      throw new ValidationError(path, this.scope, 'maxProperties');
    } else if (enumerableAndDefined(this.data, 'minProperties') && props.length < this.data.minProperties) {
      throw new ValidationError(path, this.scope, 'minProperties');
    } else {
      let i, j, k, found;
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
              if (s) {
                s.validate(data[k], path + '/' + k);
              }
            }
          }
        }
      }
      return data;
    }
  }
}

Schema.registerFactory('object', ObjectSchema);
