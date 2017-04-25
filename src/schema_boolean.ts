import { SchemaOptions, ValidationError } from './global';
import { Schema, UntypedSchema } from './schema';

export class BooleanSchema extends UntypedSchema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  async validateType(data:any, path:string): Promise<any> {
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

Schema.registerFactory('boolean', BooleanSchema);
