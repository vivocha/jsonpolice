import { SchemaOptions } from './global';
import { Schema, StaticSchema } from './schema';

export * from 'jsonref';
export { SchemaError, SchemaOptions, ValidationError, ValidationOptions } from './global';
export { Schema, StaticSchema } from './schema';


export function create(dataOrUri:any, opts:SchemaOptions): Promise<Schema> {
  return StaticSchema.create(dataOrUri, opts);
}
