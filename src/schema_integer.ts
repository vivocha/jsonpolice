import { SchemaOptions, ValidationError } from './global';
import { Schema } from './schema';
import { NumberSchema } from './schema_number';

export class IntegerSchema extends NumberSchema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  validateType(data:any, path:string):any {
    data = super.validateType(data, path);
    if (parseInt(data) !== data) {
      throw new ValidationError(path, this.scope, 'type');
    }
    return data;
  }
}

Schema.registerFactory('integer', IntegerSchema);
