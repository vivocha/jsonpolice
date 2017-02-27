import * as _ from 'lodash';
import { __schema, enumerableAndDefined, SchemaOptions, SchemaError, ValidationError } from './global';
import { Schema } from './schema';

let seps = {
  'csv': ',',
  'ssv': ' ',
  'tsv': '\t',
  'pipes': '|'
};

export class ArraySchema extends Schema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  init():void {
    super.init();
    if (enumerableAndDefined(this.data, 'items')) {
      if (Array.isArray(this.data.items)) {
        _.each(this.data.items, (data, i) => {
          Schema.create(this.data.items[i], _.defaults(this.opts, { scope: this.scope + '/items/' + i }));
        });
      } else if (typeof this.data.items === 'object') {
        Schema.create(this.data.items, _.defaults(this.opts, { scope: this.scope + '/items' }));
      } else {
        throw new SchemaError(this.scope, 'items', this.data.items);
      }
    }
    if (enumerableAndDefined(this.data, 'additionalItems')) {
      if (typeof this.data.additionalItems === 'object') {
        Schema.create(this.data.additionalItems, _.defaults(this.opts, { scope: this.scope + '/additionalItems' }));
      } else if (typeof this.data.additionalItems !== 'boolean') {
        throw new SchemaError(this.scope, 'additionalItems', this.data.additionalItems);
      }
    }
  }
  validateType(data:any, path:string):any {
    if (typeof data === 'string') {
      let sep = seps[this.data.collectionFormat || 'csv'];
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
      let itemsIsArray = Array.isArray(this.data.items);
      let itemsIsObject = !itemsIsArray && typeof this.data.items === 'object';
      let addIsObject = typeof this.data.additionalItems === 'object';
      for (let i = 0 ; i < data.length ; i++) {
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

Schema.registerFactory('array', ArraySchema);
