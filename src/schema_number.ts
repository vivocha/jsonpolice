import { enumerableAndDefined, SchemaOptions, ValidationError } from './global';
import { Schema } from './schema';

export class NumberSchema extends Schema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  validateType(data:any, path:string):any {
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

Schema.registerFactory('number', NumberSchema);
