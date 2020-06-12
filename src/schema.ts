import * as refs from 'jsonref';
import * as _ from 'lodash';
import { SchemaError, ValidationError } from './errors';
import { SchemaOptions, ValidationOptions } from './types';
import { testRegExp } from './utils';

export abstract class Schema {
  protected _validators: Set<string>;

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
        'not',
      ]);
    }
    return this._validators;
  }

  async validate(data: any, opts: ValidationOptions = {}, path = ''): Promise<any> {
    const spec = await this.spec();
    return this.validateSpec(Schema.scope(spec), data, spec, path, opts);
  }

  protected validateSpec(scope: string, data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (spec === true) {
      return data;
    } else if (spec === false) {
      throw new ValidationError(path, scope, 'false');
    } else {
      return this.rootValidator(data, spec, path, opts);
    }
  }

  protected rootValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'undefined' && !opts.doNotAnnotate && opts.setDefault) {
      data = this.default(spec, path);
    }
    let out: any = data;
    const toAnnotate: string[] = [];
    const errors: Error[] = [];
    for (let i in spec) {
      if (this.validators.has(i)) {
        try {
          out = this[`${i}Validator`](out, spec, path, opts);
        } catch (err) {
          errors.push(err);
        }
      }
    }
    if (errors.length) {
      if (errors.length === 1) {
        throw errors[0];
      } else {
        throw new ValidationError(path, Schema.scope(spec), 'multiple', errors);
      }
    }
    return out;
  }

  protected typeValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    const types: string[] = Array.isArray(spec.type) ? [...spec.type] : [spec.type];
    let t: string,
      found: boolean = false;

    while (!found && (t = types.shift() || '')) {
      switch (t) {
        case 'null':
          found = data === null;
          break;
        case 'boolean':
          found = typeof data === 'boolean';
          break;
        case 'object':
          found = data !== null && typeof data === 'object' && !Array.isArray(data);
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
    return data;
  }
  protected enumValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (!Array.isArray(spec.enum) || spec.enum.length < 1) {
      throw Schema.error(spec, 'enum');
    } else if (!spec.enum.find((v) => _.isEqual(v, data))) {
      throw new ValidationError(path, Schema.scope(spec), 'enum');
    }
    return data;
  }
  protected constValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof spec.const === 'undefined') {
      throw Schema.error(spec, 'const');
    } else if (!_.isEqual(spec.const, data)) {
      throw new ValidationError(path, Schema.scope(spec), 'const');
    }
    return data;
  }
  protected multipleOfValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'number') {
      if (typeof spec.multipleOf !== 'number') {
        throw Schema.error(spec, 'multipleOf');
      } else if (data % spec.multipleOf !== 0) {
        throw new ValidationError(path, Schema.scope(spec), 'multipleOf');
      }
    }
    return data;
  }
  protected maximumValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'number') {
      if (typeof spec.maximum !== 'number') {
        throw Schema.error(spec, 'maximum');
      } else if (data > spec.maximum) {
        throw new ValidationError(path, Schema.scope(spec), 'maximum');
      }
    }
    return data;
  }
  protected exclusiveMaximumValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'number') {
      if (typeof spec.exclusiveMaximum !== 'number') {
        throw Schema.error(spec, 'exclusiveMaximum');
      } else if (data >= spec.exclusiveMaximum) {
        throw new ValidationError(path, Schema.scope(spec), 'exclusiveMaximum');
      }
    }
    return data;
  }
  protected minimumValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'number') {
      if (typeof spec.minimum !== 'number') {
        throw Schema.error(spec, 'minimum');
      } else if (data < spec.minimum) {
        throw new ValidationError(path, Schema.scope(spec), 'minimum');
      }
    }
    return data;
  }
  protected exclusiveMinimumValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'number') {
      if (typeof spec.exclusiveMinimum !== 'number') {
        throw Schema.error(spec, 'exclusiveMinimum');
      } else if (data <= spec.exclusiveMinimum) {
        throw new ValidationError(path, Schema.scope(spec), 'exclusiveMinimum');
      }
    }
    return data;
  }
  protected maxLengthValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'string') {
      if (typeof spec.maxLength !== 'number') {
        throw Schema.error(spec, 'maxLength');
      } else if (data.length > spec.maxLength) {
        throw new ValidationError(path, Schema.scope(spec), 'maxLength');
      }
    }
    return data;
  }
  protected minLengthValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'string') {
      if (typeof spec.minLength !== 'number') {
        throw Schema.error(spec, 'minLength');
      } else if (data.length < spec.minLength) {
        throw new ValidationError(path, Schema.scope(spec), 'minLength');
      }
    }
    return data;
  }
  protected patternValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'string') {
      if (typeof spec.pattern !== 'string') {
        throw Schema.error(spec, 'pattern');
      } else if (!testRegExp(spec.pattern, data)) {
        throw new ValidationError(path, Schema.scope(spec), 'pattern');
      }
    }
    return data;
  }
  protected formatValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (typeof data === 'string') {
      if (typeof spec.format !== 'string') {
        throw Schema.error(spec, 'format');
      }
      // TODO validate format
    }
    return data;
  }
  protected itemsValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (Array.isArray(data)) {
      const errors: Error[] = [];
      if (Array.isArray(spec.items)) {
        for (let i = 0; i < spec.items.length; i++) {
          try {
            data[i] = this.validateSpec(Schema.scope(spec), data[i], spec.items[i], `${path}/${i}`, opts);
          } catch (err) {
            errors.push(err);
          }
        }
      } else {
        for (let i = 0; i < data.length; i++) {
          try {
            data[i] = this.validateSpec(Schema.scope(spec), data[i], spec.items, `${path}/${i}`, opts);
          } catch (err) {
            errors.push(err);
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'items', errors);
      }
    }
    return data;
  }
  protected additionalItemsValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (Array.isArray(data) && Array.isArray(spec.items)) {
      const errors: Error[] = [];
      for (let i = 0; i < data.length; i++) {
        if (typeof spec.items[i] === 'undefined') {
          try {
            data[i] = this.validateSpec(Schema.scope(spec), data[i], spec.additionalItems, `${path}/${i}`, opts);
          } catch (err) {
            errors.push(err);
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'additionalItems', errors);
      }
    }
    return data;
  }
  protected maxItemsValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (Array.isArray(data)) {
      if (typeof spec.maxItems !== 'number') {
        throw Schema.error(spec, 'maxItems');
      } else if (data.length > spec.maxItems) {
        throw new ValidationError(path, Schema.scope(spec), 'maxItems');
      }
    }
    return data;
  }
  protected minItemsValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (Array.isArray(data)) {
      if (typeof spec.minItems !== 'number') {
        throw Schema.error(spec, 'minItems');
      } else if (data.length < spec.minItems) {
        throw new ValidationError(path, Schema.scope(spec), 'minItems');
      }
    }
    return data;
  }
  protected uniqueItemsValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (Array.isArray(data)) {
      if (typeof spec.uniqueItems !== 'boolean') {
        throw Schema.error(spec, 'uniqueItems');
      } else if (spec.uniqueItems && _.uniqWith(data, _.isEqual).length !== data.length) {
        throw new ValidationError(path, Schema.scope(spec), 'uniqueItems');
      }
    }
    return data;
  }
  protected containsValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (Array.isArray(data)) {
      let found = false;
      for (let i = 0; i < data.length; i++) {
        try {
          data[i] = this.validateSpec(Schema.scope(spec), data[i], spec.contains, `${path}/${i}`, opts);
          found = true;
        } catch (err) {}
      }
      if (!found) {
        throw new ValidationError(path, Schema.scope(spec), 'contains');
      }
    }
    return data;
  }
  protected maxPropertiesValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (typeof spec.maxProperties !== 'number') {
        throw Schema.error(spec, 'maxProperties');
      } else if (Object.keys(data).length > spec.maxProperties) {
        throw new ValidationError(path, Schema.scope(spec), 'maxProperties');
      }
    }
    return data;
  }
  protected minPropertiesValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (typeof spec.minProperties !== 'number') {
        throw Schema.error(spec, 'minProperties');
      } else if (Object.keys(data).length < spec.minProperties) {
        throw new ValidationError(path, Schema.scope(spec), 'minProperties');
      }
    }
    return data;
  }
  protected requiredValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (!Array.isArray(spec.required)) {
        throw Schema.error(spec, 'required');
      }
      for (let i of spec.required) {
        if (typeof i !== 'string') {
          throw Schema.error(spec, 'required');
        } else if (
          !(i in data) &&
          (typeof spec.properties?.[i]?.readOnly === 'undefined' || (spec.properties[i].readOnly === true && opts.context !== 'write')) &&
          (typeof spec.properties?.[i]?.writeOnly === 'undefined' || (spec.properties[i].writeOnly === true && opts.context !== 'read'))
        ) {
          throw new ValidationError(`${path}/${i}`, Schema.scope(spec), 'required');
        }
      }
    }
    return data;
  }
  protected propertiesValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (spec.properties === null || typeof spec.properties !== 'object' || Array.isArray(spec.properties)) {
        throw Schema.error(spec, 'properties');
      }
      const errors: Error[] = [];
      for (let i in spec.properties) {
        try {
          if (i in data) {
            if ((opts.context === 'write' && spec.properties[i].readOnly === true) || (opts.context === 'read' && spec.properties[i].writeOnly === true)) {
              delete data[i];
            } else {
              data[i] = this.validateSpec(Schema.scope(spec), data[i], spec.properties[i], `${path}/${i}`, opts);
            }
          } else if (opts.setDefault) {
            const def = this.default(spec.properties[i], `${path}/${i}`);
            if (typeof def !== 'undefined') {
              data[i] = def;
            }
          }
        } catch (err) {
          errors.push(err);
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'properties', errors);
      }
    }
    return data;
  }
  protected patternPropertiesValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (spec.patternProperties === null || typeof spec.patternProperties !== 'object' || Array.isArray(spec.patternProperties)) {
        throw Schema.error(spec, 'patternProperties');
      }
      const errors: Error[] = [];
      for (let i in data) {
        for (let p in spec.patternProperties) {
          if (testRegExp(p, i)) {
            try {
              if (
                (opts.context === 'write' && spec.patternProperties[p].readOnly === true) ||
                (opts.context === 'read' && spec.patternProperties[p].writeOnly === true)
              ) {
                delete data[i];
              } else {
                data[i] = this.validateSpec(Schema.scope(spec), data[i], spec.patternProperties[p], `${path}/${i}`, opts);
              }
            } catch (err) {
              errors.push(err);
            }
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'patternProperties', errors);
      }
    }
    return data;
  }
  protected additionalPropertiesValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      const errors: Error[] = [];
      for (let i in data) {
        if ((!spec.properties || !spec.properties[i]) && (!spec.patternProperties || !Object.keys(spec.patternProperties).find((p) => testRegExp(p, i)))) {
          try {
            if (
              (opts.context === 'write' && spec.additionalProperties.readOnly === true) ||
              (opts.context === 'read' && spec.additionalProperties.writeOnly === true)
            ) {
              delete data[i];
            } else {
              data[i] = this.validateSpec(Schema.scope(spec), data[i], spec.additionalProperties, `${path}/${i}`, opts);
            }
          } catch (err) {
            if (opts.removeAdditional) {
              delete data[i];
            } else {
              errors.push(err);
            }
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'additionalProperties', errors);
      }
    }
    return data;
  }
  protected dependenciesValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
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
              data = this.validateSpec(Schema.scope(spec), data, spec.dependencies[i], `${path}/dependencies/${i}`, opts);
            } catch (err) {
              errors.push(err);
            }
          }
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'dependencies', errors);
      }
    }
    return data;
  }
  protected propertyNamesValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      const errors: Error[] = [];
      for (let i in data) {
        try {
          // TODO should we change the key in data to reflect the result?
          this.validateSpec(Schema.scope(spec), i, spec.propertyNames, `${path}/${i}#`, opts);
        } catch (err) {
          errors.push(err);
        }
      }
      if (errors.length) {
        throw new ValidationError(path, Schema.scope(spec), 'propertyNames', errors);
      }
    }
    return data;
  }
  protected ifValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    try {
      data = this.validateSpec(Schema.scope(spec), data, spec.if, path, opts);
    } catch (err) {
      if (spec.else) {
        data = this.validateSpec(Schema.scope(spec), data, spec.else, path, opts);
      }
      return data;
    }
    if (spec.then) {
      data = this.validateSpec(Schema.scope(spec), data, spec.then, path, opts);
    }
    return data;
  }
  protected allOfValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (!Array.isArray(spec.allOf)) {
      throw Schema.error(spec, 'allOf');
    }
    const errors: Error[] = [];
    for (let i of spec.allOf) {
      try {
        data = this.validateSpec(Schema.scope(spec), data, i, path, opts);
      } catch (err) {
        errors.push(err);
      }
    }
    if (errors.length) {
      throw new ValidationError(path, Schema.scope(spec), 'allOf', errors);
    }
    return data;
  }
  protected anyOfValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (!Array.isArray(spec.anyOf)) {
      throw Schema.error(spec, 'anyOf');
    }
    let found = false;
    for (let i of spec.anyOf) {
      try {
        data = this.validateSpec(Schema.scope(spec), data, i, path, opts);
        found = true;
      } catch (err) {}
    }
    if (!found) {
      throw new ValidationError(path, Schema.scope(spec), 'anyOf');
    }
    return data;
  }
  protected oneOfValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    if (!Array.isArray(spec.oneOf)) {
      throw Schema.error(spec, 'oneOf');
    }
    let found = 0;
    for (let i of spec.oneOf) {
      try {
        const newData = this.validateSpec(Schema.scope(spec), data, i, path, opts);
        if (++found === 1) {
          data = newData;
        }
      } catch (err) {}
    }
    if (found !== 1) {
      throw new ValidationError(path, Schema.scope(spec), 'oneOf');
    }
    return data;
  }
  protected notValidator(data: any, spec: any, path: string, opts: ValidationOptions): any {
    try {
      this.validateSpec(Schema.scope(spec), data, spec.not, path, Object.assign({}, opts, { doNotAnnotate: true }));
    } catch (err) {
      return data;
    }
    throw new ValidationError(path, Schema.scope(spec), 'not');
  }

  protected default(spec: any, path: string): any {
    return spec.default;
  }

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

  static async create(dataOrUri: any, opts: SchemaOptions): Promise<Schema> {
    const schema = new StaticSchema(dataOrUri, opts);
    await schema.spec();
    return schema;
  }
}
