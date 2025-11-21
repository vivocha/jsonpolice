import * as refs from 'jsonref';
import { Schema } from './schema.js';

export type JsonSchemaVersion = 
  | 'draft-07' 
  | '2019-09' 
  | '2020-12' 
  | 'https://json-schema.org/draft/2019-09/schema'
  | 'https://json-schema.org/draft/2020-12/schema'
  | 'http://json-schema.org/draft-07/schema'
  | 'http://json-schema.org/draft-07/schema#';

export interface SchemaOptions extends Omit<refs.ParseOptions, 'scope'> {
  /** JSON Schema version to use. If not specified, will be auto-detected from $schema property */
  version?: JsonSchemaVersion;
  /** Base URI for resolving relative references. Optional for inline schemas */
  scope?: string;
}

export interface SchemaMeta extends refs.Meta {
  schema?: Schema;
}

export interface ValidationOptions {
  doNotAnnotate?: boolean;
  setDefault?: boolean;
  removeAdditional?: boolean;
  context?: 'read' | 'write';
}

export interface EvaluationContext {
  /** Properties that have been evaluated by validation keywords */
  evaluatedProperties?: Set<string>;
  /** Array indices that have been evaluated by validation keywords */
  evaluatedItems?: Set<number>;
}
