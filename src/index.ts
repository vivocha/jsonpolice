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

export { Schema } from './schema';

export function create(dataOrUri:any, opts:SchemaOptions = {}): Promise<Schema> {
  if (!dataOrUri) {
    throw new SchemaError(opts.scope, 'no_data');
  }
  if (typeof dataOrUri === 'object' && dataOrUri[__schema] instanceof Schema) {
    return Promise.resolve(dataOrUri[__schema]);
  } else {
    if (!opts.store) opts.store = {};
    return refs.parse(dataOrUri, opts).then(function(data) {
      return Schema.create(data, Object.assign({ store: {} }, opts));
    });
  }
}
export function flatten(dataOrUri:any, opts:SchemaOptions = {}) {
  return create(dataOrUri, opts).then(function(schema) {
    return Schema.flatten((schema as any).data);
  });
}
