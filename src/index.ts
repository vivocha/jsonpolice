import { Schema, StaticSchema } from './schema.js';
import { SchemaOptions } from './types.js';

export * from 'jsonref';
export * from './errors.js';
export * from './schema.js';
export * from './types.js';

export function create(dataOrUri: any, opts: SchemaOptions): Promise<Schema> {
  return StaticSchema.create(dataOrUri, opts);
}

export default create;
