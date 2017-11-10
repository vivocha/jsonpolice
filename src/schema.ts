import * as _ from 'lodash';
import * as refs from 'jsonref';
import { __schema, defined, enumerableAndDefined, SchemaOptions, SchemaError, ValidationError } from './global';

function linkProperty(o:any, i:any, k:string):void {
  o[k] = i[k];
}
function pushProperty(o:any, i:any, k:string):void {
  o.push(i[k]);
}
function mergeProperties(o:any, i:any, k:string):void {
  if (o[k].allOf) {
    pushProperty(o[k].allOf, i, k);
  } else {
    let a = [];
    pushProperty(a, o, k);
    pushProperty(a, i, k);
    o[k] = { allOf: a };
  }
}
function mergeObjects(o:any, i:any, k:string):void {
  if (!enumerableAndDefined(o, k)) {
    o[k] = {};
  }
  for (let j in i[k]) {
    if (!enumerableAndDefined(o[k], j)) {
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

export abstract class Schema {
  constructor(readonly scope:string, protected opts:SchemaOptions = {}) {
  }
  abstract async schema(): Promise<any>;
  abstract async validate(data:any, path?:string): Promise<any>;

  protected init(): void {}
  default(data?: any): any {
    return data;
  }

  static factories:{
    [type:string]: SchemaFactory
  } = {};
  static registerFactory(type:string, factory:SchemaFactory) {
    Schema.factories[type] = factory;
  }
  static attach(data: any, schema: Schema) {
    data[__schema] = schema;
  }
  static get(data: any): Schema {
    return data[__schema] as Schema;
  }
  static create(data:any, opts:SchemaOptions = {}): Schema {
    let schema: Schema;
    if (defined(data)) {
      if (data[__schema] instanceof Schema) {
        return data[__schema];
      } else {
        if (defined(data.type)) {
          if (Array.isArray(data.type)) {
            let _data = { anyOf: [ ] };
            _.each(data.type, function(type) {
              let _type = _.clone(data);
              _type.type = type;
              _data.anyOf.push(_type);
            });
            schema = new UntypedSchema(_data, opts);
          } else if (Schema.factories[data.type]) {
            schema = new Schema.factories[data.type](data, opts);
          } else {
            throw new SchemaError(opts.scope, 'type', data.type);
          }
        } else {
          schema = new UntypedSchema(data, opts);
        }
        Schema.attach(data, schema);
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
      let out:any = {};
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
          if (!enumerableAndDefined(o, 'dependencies')) {
            o.dependencies = {};
          }
          for (let k in i.dependencies) {
            if (enumerableAndDefined(o.dependencies, k)) {
              let _o = o.dependencies;
              let _i = i.dependencies;
              if (Array.isArray(_o[k]) && Array.isArray(_i[k])) {
                _o[k] = _.uniq(_o[k].concat(_i[k]));
              } else {
                if (Array.isArray(_o[k])) {
                  _o[k] = { dependencies: { [k]: _o[k] } }
                }
                if (Array.isArray(_i[k])) {
                  _i = { [k]: { dependencies: { [k]: _i[k] } } };
                }
                mergeProperties(_o, _i, k);
              }
            } else {
              linkProperty(o.dependencies, i.dependencies, k);
            }
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

export abstract class DynamicSchema extends Schema {
  async validate(data:any, path:string = ''): Promise<any> {
    let raw: any = await this.schema();
    let s: Schema = Schema.create(raw, Object.assign({}, this.opts, {
      store: Object.assign({}, this.opts.store)
    }));
    return s.validate(data, path);
  }
}

export class UntypedSchema extends Schema {
  constructor(protected data:any, protected opts:SchemaOptions) {
    super(refs.scope(data) || data.id || opts.scope || '#', opts);
  }
  protected init():void {
    if (enumerableAndDefined(this.data, 'allOf')) {
      _.each(this.data.allOf, (data, i) => {
        Schema.create(this.data.allOf[i], Object.assign({}, this.opts, { scope: this.scope + '/allOf/' + i }));
      });
    }
    if (enumerableAndDefined(this.data, 'anyOf')) {
      _.each(this.data.anyOf, (data, i) => {
        Schema.create(this.data.anyOf[i], Object.assign({}, this.opts, { scope: this.scope + '/anyOf/' + i }));
      });
    }
    if (enumerableAndDefined(this.data, 'oneOf')) {
      _.each(this.data.oneOf, (data, i) => {
        Schema.create(this.data.oneOf[i], Object.assign({}, this.opts, { scope: this.scope + '/oneOf/' + i }));
      });
    }
    if (enumerableAndDefined(this.data, 'not')) {
      Schema.create(this.data.not, Object.assign({}, this.opts, { scope: this.scope + '/not' }));
    }
  }

  default(data?: any): any {
    let def;
    if (defined(data)) {
      def = data;
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'allOf')) {
      for (let i = 0 ; !def && i < this.data.allOf.length ; i++) {
        def = Schema.get(this.data.allOf[i]).default();
      }
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'anyOf')) {
      for (let i = 0 ; !def && i < this.data.anyOf.length ; i++) {
        def = Schema.get(this.data.anyOf[i]).default();
      }
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'oneOf')) {
      for (let i = 0 ; !def && i < this.data.oneOf.length ; i++) {
        def = Schema.get(this.data.oneOf[i]).default();
      }
    }
    if (!defined(def) && enumerableAndDefined(this.data, 'default')) {
      def = _.cloneDeep(this.data.default);
    }
    return def;
  }

  async schema(): Promise<any> {
    return this.data;
  }
  async validate(data:any, path:string = ''): Promise<any> {
    data = this.default(data);
    if (enumerableAndDefined(this.data, 'type')) {
      data = await this.validateType(data, path);
    }
    if (enumerableAndDefined(this.data, 'enum')) {
      data = await this.validateEnum(data, path);
    }
    if (enumerableAndDefined(this.data, 'allOf')) {
      data = await this.validateAllOf(data, path);
    }
    if (enumerableAndDefined(this.data, 'anyOf')) {
      data = await this.validateAnyOf(data, path);
    }
    if (enumerableAndDefined(this.data, 'oneOf')) {
      data = await this.validateOneOf(data, path);
    }
    if (enumerableAndDefined(this.data, 'not')) {
      data = await this.validateNot(data, path);
    }
    return data;
  }
  protected async validateType(data:any, path:string): Promise<any> {
    throw new SchemaError(this.scope, 'type', data.type);
  }
  protected async validateEnum(data:any, path:string): Promise<any> {
    let found = false;
    for (let i = 0 ; !found && i < this.data.enum.length ; i++) {
      found = _.isEqual(data, this.data.enum[i]);
    }
    if (!found) {
      throw new ValidationError(path, this.scope, 'enum');
    }
    return data;
  }
  protected async validateAllOf(data:any, path:string): Promise<any> {
    for (let i = 0 ; i < this.data.allOf.length ; i++) {
      data = await Schema.get(this.data.allOf[i]).validate(data, path);
    }
    return data;
  }
  protected async validateAnyOf(data:any, path:string): Promise<any> {
    let found = false, _data;
    for (let i = 0 ; !found && i < this.data.anyOf.length ; i++) {
      try {
        _data = await Schema.get(this.data.anyOf[i]).validate(data, path);
        found = true;
      } catch(e) {}
    }
    if (!found) {
      throw new ValidationError(path, this.scope, 'anyOf');
    }
    return _data;
  }
  protected async validateOneOf(data:any, path:string): Promise<any> {
    let count = 0, _data;
    for (let i = 0 ; count < 2 && i < this.data.oneOf.length ; i++) {
      try {
        _data = await Schema.get(this.data.oneOf[i]).validate(data, path);
        count++;
      } catch(e) {}
    }
    if (count !== 1) {
      throw new ValidationError(path, this.scope, 'oneOf');
    }
    return _data;
  }
  protected async validateNot(data:any, path:string): Promise<any> {
    try {
      await Schema.get(this.data.not).validate(data, path);
    } catch(e) {
      return data;
    }
    throw new ValidationError(path, this.scope, 'not');
  }
}
