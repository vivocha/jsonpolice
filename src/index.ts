import { SchemaOptions } from './global';
import { Schema, StaticSchema } from './schema';

export { SchemaError, SchemaOptions, ValidationError } from './global';
export { Schema, StaticSchema } from './schema';

export function create(dataOrUri:any, opts:SchemaOptions): Promise<Schema> {
  return StaticSchema.create(dataOrUri, opts);
}
