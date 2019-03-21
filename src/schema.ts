import * as refs from 'jsonref';
import * as _ from 'lodash';
import { SchemaError, SchemaOptions, testRegExp, ValidationError } from "./global";

export abstract class Schema {
  protected _validators: Set<string>;
  //protected _annotators: Set<string>;

  abstract spec(): Promise<any>;

  protected get validators(): Set<string> {
    if (!this._validators) {
      this._validators = new Set([
        'type',
        'enum',
        'const',
        'multipleOf',
        'maximum',
        'exclusiveMaximum',
        'minimum',
        'exclusiveMinimum',
        'maxLength',
        'minLength',
        'pattern',
        'format',
        'items',
        'additionalItems',
        'maxItems',
        'minItems',
        'uniqueItems',
        'contains',
        'maxProperties',
        'minProperties',
        'required',
        'properties',
        'patternProperties',
        'additionalProperties',
        'dependencies',
        'propertyNames',
        'if',
        'allOf',
        'anyOf',
        'oneOf',
        'not'
      ]);
    }
    return this._validators;
  }
  /*
  protected get annotators(): Set<string> {
    if (!this._annotators) {
      this._annotators = new Set([
        'title',
        'description',
        'default',
        'readOnly',
        'writeOnly',
        'examples'
      ]);
    }
    return this._annotators;
  }
  */

  async validate(data: any): Promise<boolean> {
    const spec = await this.spec();
    return this.rootValidator(data, spec, '', true);
  }
  protected rootValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof spec === 'boolean') {
      if (spec) {
        return spec;
      } else {
        throw new ValidationError(path, Schema.scope(spec), 'false');
      }
    }

    const toAnnotate: string[] = [];
    const errors: Error[] = [];
    for (let i in spec) {
      if (this.validators.has(i)) {
        try {
          this[`${i}Validator`](data, spec, `${path}/${i}`, annotate);
        } catch(err) {
          errors.push(err);
        }
      } /*else if (annotate && this.annotators.has(i)) {
        toAnnotate.push(i);
      }*/
    }
    /*
    if (annotate) {
      for (let i of toAnnotate) {
        try {
          this[`${i}Annotator`](data, spec, `${path}/${i}`);
        } catch(err) {}
      }
    }
    */
    if (errors.length) {
      if (errors.length === 1 && errors[0] instanceof ValidationError) {
        throw errors[0];
      } else {
        throw new ValidationError(path, Schema.scope(spec), 'schema', errors);
      }
    }
    return true;
  }

  protected typeValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    const types: string[] = Array.isArray(spec.type) ? [ ...spec.type ] : [ spec.type ];
    let t: string, found: boolean = false;

    while(!found && (t = types.shift() || '')) {
      switch(t) {
      case 'null':
        found = data === null;
        break;
      case 'boolean':
        found = typeof data === 'boolean';
        break;
      case 'object':
        found = data !== null && typeof data === 'object';
        break;
      case 'array':
        found = Array.isArray(data);
        break;
      case 'number':
        found = typeof data === 'number' && !isNaN(data);
        break;
      case 'integer':
        found = typeof data === 'number' && !isNaN(data) && parseInt('' + data) === data;
        break;
      case 'string':
        found = typeof data === 'string';
        break;
      default:
        throw Schema.error(spec, 'type');
      }
    }
    if (!found) {
      throw new ValidationError(path, Schema.scope(spec), 'type');
    }
    return true;
  }
  protected enumValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (!Array.isArray(spec.enum) || spec.enum.length < 1) {
      throw Schema.error(spec, 'enum');
    } else if (!spec.enum.find(v => _.isEqual(v, data))) {
      throw new ValidationError(path, Schema.scope(spec), 'enum');
    }
    return true;
  }
  protected constValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof spec.const === 'undefined') {
      throw Schema.error(spec, 'const');
    } else if (!_.isEqual(spec.const, data)) {
      throw new ValidationError(path, Schema.scope(spec), 'const');
    }
    return true;
  }
  protected multipleOfValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'number') {
      if (typeof spec.multipleOf !== 'number') {
        throw Schema.error(spec, 'multipleOf');
      } else if ((data % spec.multipleOf) !== 0) {
        throw new ValidationError(path, Schema.scope(spec), 'multipleOf');
      }
    }
    return true;
  }
  protected maximumValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'number') {
      if (typeof spec.maximum !== 'number') {
        throw Schema.error(spec, 'maximum');
      } else if (data > spec.maximum) {
        throw new ValidationError(path, Schema.scope(spec), 'maximum');
      }
    }
    return true;
  }
  protected exclusiveMaximumValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'number') {
      if (typeof spec.exclusiveMaximum !== 'number') {
        throw Schema.error(spec, 'exclusiveMaximum');
      } else if (data >= spec.exclusiveMaximum) {
        throw new ValidationError(path, Schema.scope(spec), 'exclusiveMaximum');
      }
    }
    return true;
  }
  protected minimumValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'number') {
      if (typeof spec.minimum !== 'number') {
        throw Schema.error(spec, 'minimum');
      } else if (data < spec.minimum) {
        throw new ValidationError(path, Schema.scope(spec), 'minimum');
      }
    }
    return true;
  }
  protected exclusiveMinimumValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'number') {
      if (typeof spec.exclusiveMinimum !== 'number') {
        throw Schema.error(spec, 'exclusiveMinimum');
      } else if (data <= spec.exclusiveMinimum) {
        throw new ValidationError(path, Schema.scope(spec), 'exclusiveMinimum');
      }
    }
    return true;
  }
  protected maxLengthValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'string') {
      if (typeof spec.maxLength !== 'number') {
        throw Schema.error(spec, 'maxLength');
      } else if (data.length > spec.maxLength) {
        throw new ValidationError(path, Schema.scope(spec), 'maxLength');
      }
    }
    return true;
  }
  protected minLengthValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'string') {
      if (typeof spec.minLength !== 'number') {
        throw Schema.error(spec, 'minLength');
      } else if (data.length < spec.minLength) {
        throw new ValidationError(path, Schema.scope(spec), 'minLength');
      }
    }
    return true;
  }
  protected patternValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'string') {
      if (typeof spec.pattern !== 'string') {
        throw Schema.error(spec, 'pattern');
      } else if (!testRegExp(spec.pattern, data)) {
        throw new ValidationError(path, Schema.scope(spec), 'pattern');
      }
    }
    return true;
  }
  protected formatValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (typeof data === 'string') {
      if (typeof spec.format !== 'string') {
        throw Schema.error(spec, 'format');
      }
      // TODO validate format
    }
    return true;
  }
  protected itemsValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (Array.isArray(data)) {
      const errors: Error[] = [];
      for (let i = 0 ; i < data.length ; i++) {
        const subSpec = Array.isArray(spec.items) ? spec.items[i] : spec.items;
        if (typeof subSpec !== 'undefined') {
          try {
            this.rootValidator(data[i], subSpec, `${path}/${i}`, annotate);
          } catch(err) {
            errors.push(err);
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'items', errors);
      }
    }
    return true;
  }
  protected additionalItemsValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (Array.isArray(data) && Array.isArray(spec.items)) {
      const errors: Error[] = [];
      for (let i = 0 ; i < data.length ; i++) {
        if (typeof spec.items[i] === 'undefined') {
          try {
            this.rootValidator(data[i], spec.additionalItems, `${path}/${i}`, annotate);
          } catch(err) {
            errors.push(err);
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'additionalItems', errors);
      }
    }
    return true;
  }
  protected maxItemsValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (Array.isArray(data)) {
      if (typeof spec.maxItems !== 'number') {
        throw Schema.error(spec, 'maxItems');
      } else if (data.length > spec.maxItems) {
        throw new ValidationError(path, Schema.scope(spec), 'maxItems');
      }
    }
    return true;
  }
  protected minItemsValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (Array.isArray(data)) {
      if (typeof spec.minItems !== 'number') {
        throw Schema.error(spec, 'minItems');
      } else if (data.length < spec.minItems) {
        throw new ValidationError(path, Schema.scope(spec), 'minItems');
      }
    }
    return true;
  }
  protected uniqueItemsValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (Array.isArray(data)) {
      if (typeof spec.uniqueItems !== 'boolean') {
        throw Schema.error(spec, 'uniqueItems');
      } else if (spec.uniqueItems && _.uniqWith(data, _.isEqual).length !== data.length) {
        throw new ValidationError(path, Schema.scope(spec), 'uniqueItems');
      }
    }
    return true;
  }
  protected containsValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (Array.isArray(data)) {
      let found = false;
      for (let i = 0 ; i < data.length ; i++) {
        try {
          this.rootValidator(data[i], spec.contains, `${path}/${i}`, annotate);
          found = true;
        } catch(err) { }
      }
      if (!found) {
        throw new ValidationError(path, Schema.scope(spec), 'contains');
      }
    }
    return true;
  }
  protected maxPropertiesValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (typeof spec.maxProperties !== 'number') {
        throw Schema.error(spec, 'maxProperties');
      } else if (Object.keys(data).length > spec.maxProperties) {
        throw new ValidationError(path, Schema.scope(spec), 'maxProperties');
      }
    }
    return true;
  }
  protected minPropertiesValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (typeof spec.minProperties !== 'number') {
        throw Schema.error(spec, 'minProperties');
      } else if (Object.keys(data).length < spec.minProperties) {
        throw new ValidationError(path, Schema.scope(spec), 'minProperties');
      }
    }
    return true;
  }
  protected requiredValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (!Array.isArray(spec.required)) {
        throw Schema.error(spec, 'required');
      }
      for (let i of spec.required) {
        if (typeof i !== 'string') {
          throw Schema.error(spec, 'required');
        } else if (!(i in data)) {
          throw new ValidationError(`${path}/${i}`, Schema.scope(spec), 'required');
        }
      }
    }
    return true;
  }
  protected propertiesValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (spec.properties === null || typeof spec.properties !== 'object' || Array.isArray(spec.properties)) {
        throw Schema.error(spec, 'properties');
      }
      const errors: Error[] = [];
      for (let i in spec.properties) {
        try {
          if (i in data) {
            this.rootValidator(data[i], spec.properties[i], `${path}/${i}`, annotate);
          }
        } catch(err) {
          errors.push(err);
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'properties', errors);
      }
    }
    return true;
  }
  protected patternPropertiesValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (spec.patternProperties === null || typeof spec.patternProperties !== 'object' || Array.isArray(spec.patternProperties)) {
        throw Schema.error(spec, 'patternProperties');
      }
      const errors: Error[] = [];
      for (let i in data) {
        for (let p in spec.patternProperties) {
          if (testRegExp(p, i)) {
            try {
              this.rootValidator(data[i], spec.patternProperties[p], `${path}/${i}`, annotate);
            } catch(err) {
              errors.push(err);
            }
          }          
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'patternProperties', errors);
      }
    }
    return true;
  }
  protected additionalPropertiesValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      const errors: Error[] = [];
      for (let i in data) {
        if ((!spec.properties || !spec.properties[i]) && (!spec.patternProperties || !Object.keys(spec.patternProperties).find(p => testRegExp(p, i)))) {
          try {
            this.rootValidator(data[i], spec.additionalProperties, `${path}/${i}`, annotate);
          } catch(err) {
            errors.push(err);
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'additionalProperties', errors);
      }
    }
    return true;
  }
  protected dependenciesValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (spec.dependencies === null || typeof spec.dependencies !== 'object' || Array.isArray(spec.dependencies)) {
        throw Schema.error(spec, 'dependencies');
      }
      const errors: Error[] = [];
      for (let i in spec.dependencies) {
        if (i in data) {
          if (Array.isArray(spec.dependencies[i])) {
            for (let j of spec.dependencies[i]) {
              if (typeof j !== 'string') {
                throw Schema.error(spec, 'dependencies');
              } else if (!(j in data)) {
                errors.push(new ValidationError(`${path}/dependencies/${i}`, Schema.scope(spec.dependencies[i]), 'dependencies'));
              }
            }
          } else {
            try {
              this.rootValidator(data, spec.dependencies[i], `${path}/dependencies/${i}`, annotate);
            } catch(err) {
              errors.push(err);
            }
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'dependencies', errors);
      }
    }
    return true;
  }
  protected propertyNamesValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      const errors: Error[] = [];
      for (let i in data) {
        try {
          this.rootValidator(i, spec.propertyNames, `${path}/${i}#`, annotate);
        } catch(err) {
          errors.push(err);
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'propertyNames', errors);
      }
    }
    return true;
  }
  protected ifValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    try {
      this.rootValidator(data, spec.if, path, annotate);
    } catch(err) {
      if (spec.else) {
        this.rootValidator(data, spec.else, path, annotate);
      }
      return true;
    }
    if (spec.then) {
      this.rootValidator(data, spec.then, path, annotate);
    }
    return true;
  }
  protected allOfValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (!Array.isArray(spec.allOf)) {
      throw Schema.error(spec, 'allOf');
    }
    const errors: Error[] = [];
    for (let i of spec.allOf) {
      try {
        this.rootValidator(data, i, path, annotate);
      } catch(err) {
        errors.push(err);
      }
    }
    if (errors.length) {
      throw new ValidationError(path, Schema.scope(spec), 'allOf', errors);
    }
    return true;
  }
  protected anyOfValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (!Array.isArray(spec.anyOf)) {
      throw Schema.error(spec, 'anyOf');
    }
    let found = false;
    for (let i of spec.anyOf) {
      try {
        this.rootValidator(data, i, path, annotate);
        found = true;
      } catch(err) { }
    }
    if (!found) {
      throw new ValidationError(path, Schema.scope(spec), 'anyOf');
    }
    return true;
  }
  protected oneOfValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    if (!Array.isArray(spec.oneOf)) {
      throw Schema.error(spec, 'anyOf');
    }
    let found = 0;
    for (let i of spec.oneOf) {
      try {
        this.rootValidator(data, i, path, annotate);
        found++;
      } catch(err) { }
    }
    if (found !== 1) {
      throw new ValidationError(path, Schema.scope(spec), 'oneOf');
    }
    return true;
  }
  protected notValidator(data: any, spec: any, path: string, annotate: boolean): boolean {
    try {
      this.rootValidator(data, spec.not, path, annotate);
    } catch(err) {
      return true;
    }
    throw new ValidationError(path, Schema.scope(spec), 'not');
  }

  /*
  protected titleAnnotator(data: any, spec: any, path: string): boolean {
    return false;
  }
  protected descriptionAnnotator(data: any, spec: any, path: string): boolean {
    return false;
  }
  protected defaultAnnotator(data: any, spec: any, path: string): boolean {
    return false;
  }
  protected readOnlyAnnotator(data: any, spec: any, path: string): boolean {
    return false;
  }
  protected writeOnlyAnnotator(data: any, spec: any, path: string): boolean {
    return false;
  }
  protected examplesAnnotator(data: any, spec: any, path: string): boolean {
    return false;
  }
  */

  static scope(data: any): string {
    return refs.scope(data) || '';
  }
  static error(spec: any, prop: string): SchemaError {
    return new SchemaError(Schema.scope(spec[prop]), prop, spec[prop]);
  }
}

export class StaticSchema extends Schema {
  protected _spec: Promise<any>;

  protected constructor(dataOrUri: any, opts: SchemaOptions) {
    super();
    const t = typeof dataOrUri;
    if (t === 'boolean') {
      this._spec = Promise.resolve(dataOrUri);
    } else if (dataOrUri !== null && (t === 'string' || t === 'object')) {
      this._spec = refs.parse(dataOrUri, opts);
    } else {
      throw new SchemaError(opts.scope, 'schema', dataOrUri);
    }
  }
  spec(): Promise<any> {
    return this._spec;
  }
  
  static async create(dataOrUri:any, opts:SchemaOptions): Promise<Schema> {
    const schema = new StaticSchema(dataOrUri, opts);
    await schema.spec();
    return schema;
  }
}