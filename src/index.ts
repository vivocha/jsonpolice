import { Schema, StaticSchema } from './schema';
import { SchemaOptions } from './types';

export * from 'jsonref';
export * from './errors';
export * from './schema';
export * from './types';

export function create(dataOrUri: any, opts: SchemaOptions): Promise<Schema> {
  return StaticSchema.create(dataOrUri, opts);
}

export default create;
