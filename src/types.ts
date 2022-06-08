import * as refs from 'jsonref';
import { Schema } from './schema.js';

export interface SchemaOptions extends refs.ParseOptions {}
export interface SchemaMeta extends refs.Meta {
  schema?: Schema;
}
export interface ValidationOptions {
  doNotAnnotate?: boolean;
  setDefault?: boolean;
  removeAdditional?: boolean;
  context?: 'read' | 'write';
}
