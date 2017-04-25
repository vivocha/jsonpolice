import { defined, enumerableAndDefined, regexps, testRegExp, SchemaOptions, ValidationError } from './global';
import { Schema, UntypedSchema } from './schema';

export class StringSchema extends UntypedSchema {
  constructor(data:any, opts:SchemaOptions) {
    super(data, opts);
  }
  async validateType(data:any, path:string): Promise<any> {
    if (this.data.format === 'date-time') {
      if (!(data instanceof Date)) {
        if (typeof data !== 'string') {
          throw new ValidationError(path, this.scope, 'type');
        } else if (!testRegExp(this.data.format, data)) {
          throw new ValidationError(path, this.scope, 'format');
        } else {
          data = new Date(data);
        }
      }
    } else {
      if (typeof data !== 'string') {
        throw new ValidationError(path, this.scope, 'type');
      } else if (enumerableAndDefined(this.data, 'minLength') && data.length < this.data.minLength) {
        throw new ValidationError(path, this.scope, 'minLength');
      } else if (enumerableAndDefined(this.data, 'maxLength') && data.length > this.data.maxLength) {
        throw new ValidationError(path, this.scope, 'maxLength');
      } else if (enumerableAndDefined(this.data, 'pattern') && !testRegExp(this.data.pattern, data)) {
        throw new ValidationError(path, this.scope, 'pattern');
      } else if (enumerableAndDefined(this.data, 'format') && defined(regexps[this.data.format]) && !testRegExp(this.data.format, data)) {
        throw new ValidationError(path, this.scope, 'format');
      }
    }
    return data;
  }
}

Schema.registerFactory('string', StringSchema);
