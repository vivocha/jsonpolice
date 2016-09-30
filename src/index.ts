import * as _ from 'lodash';
import * as refs from 'jsonref';
import * as vers from './versions';
import { __schema, SchemaOptions, SchemaError, ValidationError } from './global';
import { Schema } from './schema';
import './schema_array';
import './schema_boolean';
import './schema_integer';
import './schema_number';
import './schema_null';
import './schema_object';
import './schema_string';

export function create(dataOrUri:any, opts:SchemaOptions = {}) {
  if (!dataOrUri) {
    throw new SchemaError(opts.scope, 'no_data');
  }
  if (typeof dataOrUri === 'object' && dataOrUri[__schema] instanceof Schema) {
    return Promise.resolve(dataOrUri[__schema]);
  } else {
    return vers.parseKnown().then(function(versions) {
      if (!opts.scope) opts.scope = (typeof dataOrUri === 'string' ? dataOrUri : '#');
      if (!opts.store) opts.store = {};
      _.defaults(opts.store, versions);
      return refs.parse(dataOrUri, opts).then(function(data) {
        return vers.get(data.$schema, opts).then(function(schemaVersion) {
          var _schemaVersion = Schema.create(schemaVersion, _.defaults(opts, { scope: refs.scope(schemaVersion) }));
          _schemaVersion.validate(data);
          return Schema.create(data, opts);
        });
      });
    });
  }
}
export function flatten(dataOrUri:any, opts:SchemaOptions = {}) {
  return create(dataOrUri, opts).then(function(schema) {
    return Schema.flatten(schema.data);
  });
}
export function getVersion(dataOrUri:any, opts:SchemaOptions = {}) {
  return vers.get(dataOrUri, opts);
}
export function addVersion(dataOrUri:any, opts:SchemaOptions = {}) {
  return vers.parseKnown().then(function() {
    return vers.add(dataOrUri, opts);
  });
}
export function fireValidationError(dataScope:string, schemaScope:string, type:string, info?:any) {
  throw new ValidationError(dataScope, schemaScope, type, info);
}
