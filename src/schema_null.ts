import { SchemaOptions, ValidationError } from './global';
import { Schema, UntypedSchema } from './schema';

export class NullSchema extends UntypedSchema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  async validateType(data:any, path:string): Promise<any> {
    if (data !== null) {
      throw new ValidationError(path, this.scope, 'type');
    }
    return data;
  }
}

Schema.registerFactory('null', NullSchema);
