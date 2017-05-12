import * as refs from 'jsonref';
import { __schema, SchemaOptions, SchemaError } from './global';
import { Schema } from './schema';
import './schema_array';
import './schema_boolean';
import './schema_integer';
import './schema_number';
import './schema_null';
import './schema_object';
import './schema_string';

export { Schema, DynamicSchema } from './schema';
export { SchemaError, ValidationError, SchemaOptions } from './global';

export async function create(dataOrUri:any, opts:SchemaOptions = {}): Promise<Schema> {
  if (!dataOrUri) {
    throw new SchemaError(opts.scope, 'no_data');
  }
  if (typeof dataOrUri === 'object' && dataOrUri[__schema] && typeof dataOrUri[__schema].validate === 'function') {
    return dataOrUri[__schema];
  } else {
    if (!opts.store) opts.store = {};
    let data = await refs.parse(dataOrUri, opts);
    return Schema.create(data, Object.assign({ store: {} }, opts));
  }
}
export async function flatten(dataOrUri:any, opts:SchemaOptions = {}) {
  let schema = await create(dataOrUri, opts);
  return Schema.flatten((schema as any).data);
}
