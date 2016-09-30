import { SchemaOptions, ValidationError } from './global';
import { Schema } from './schema';

export class NullSchema extends Schema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  validateType(data:any, path:string):any {
    if (data !== null) {
      throw new ValidationError(path, this.scope, 'type');
    }
    return data;
  }
}

Schema.registerFactory('null', NullSchema);
