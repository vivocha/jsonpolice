import { expect } from 'chai';
import { Schema, StaticSchema } from '../dist/schema.js';
import { ValidationError } from '../dist/errors.js';
import { JsonSchemaVersion } from '../dist/types.js';

class CustomValidatorSchema extends StaticSchema {
  protected addCustomValidators(validators: Set<string>, version: JsonSchemaVersion): void {
    // Add a custom validator for testing
    validators.add('customValidator');
    validators.add('discriminator');
  }

  protected customValidatorValidator(data: any, spec: any, path: string, opts: any): any {
    if (spec.customValidator && data !== spec.customValidator) {
      throw new ValidationError(path, Schema.scope(spec), 'customValidator');
    }
    return data;
  }

  protected discriminatorValidator(data: any, spec: any, path: string, opts: any): any {
    if (spec.discriminator && !data[spec.discriminator.propertyName]) {
      throw new ValidationError(path, Schema.scope(spec), 'discriminator');
    }
    return data;
  }

  static async create(dataOrUri: any, opts: any): Promise<CustomValidatorSchema> {
    const schema = new CustomValidatorSchema(dataOrUri, opts);
    await schema.spec();
    return schema;
  }
}

describe('Schema Extensibility', function() {
  describe('addCustomValidators hook', function() {
    it('should allow derived classes to add custom validators', async function() {
      const schema = await CustomValidatorSchema.create({
        type: 'string',  
        customValidator: 'expected-value'
      }, { scope: 'http://example.com' });
      
      // Should pass validation when data matches
      await schema.validate('expected-value').should.eventually.equal('expected-value');
      
      // Should fail validation when data doesn't match
      return schema.validate('wrong-value').should.be.rejectedWith(ValidationError, 'customValidator');
    });

    it('should support discriminator validator via custom validators', async function() {
      const schema = await CustomValidatorSchema.create({
        discriminator: {
          propertyName: 'type'
        },
        type: 'object'
      }, { scope: 'http://example.com' });
      
      // Should pass validation when discriminator property is present
      await schema.validate({ type: 'animal', name: 'fluffy' }).should.eventually.deep.equal({ type: 'animal', name: 'fluffy' });
      
      // Should fail validation when discriminator property is missing
      return schema.validate({ name: 'fluffy' }).should.be.rejectedWith(ValidationError, 'discriminator');
    });

    it('should not affect base schema functionality', async function() {
      const baseSchema = await StaticSchema.create({
        type: 'string',
        minLength: 3
      }, { scope: 'http://example.com' });
      
      // Base validators should still work
      await baseSchema.validate('hello').should.eventually.equal('hello');
      return baseSchema.validate('hi').should.be.rejectedWith(ValidationError, 'minLength');
    });

    it('should include custom validators in validators set', async function() {
      const schema = await CustomValidatorSchema.create({}, { scope: 'http://example.com' });
      const validators = (schema as any).validators;
      
      expect(validators.has('customValidator')).to.be.true;
      expect(validators.has('discriminator')).to.be.true;
      expect(validators.has('type')).to.be.true; // Base validator should still be there
    });
  });
});