import { expect } from 'chai';
import { create } from '../src/index.js';

describe('Critical Bug Fixes', () => {
  describe('Bug Fix 1: Floating Point Precision in multipleOf', () => {
    it('should correctly validate 0.3 as multipleOf 0.1', async () => {
      const schema = await create({
        type: 'number',
        multipleOf: 0.1
      });

      // This used to fail due to floating point precision: 0.3 % 0.1 = 0.09999999999999998
      expect(await schema.validate(0.3)).to.equal(0.3);
    });

    it('should correctly validate 4.5 as multipleOf 0.5', async () => {
      const schema = await create({
        type: 'number',
        multipleOf: 0.5
      });

      expect(await schema.validate(4.5)).to.equal(4.5);
    });

    it('should correctly validate 10.25 as multipleOf 0.25', async () => {
      const schema = await create({
        type: 'number',
        multipleOf: 0.25
      });

      expect(await schema.validate(10.25)).to.equal(10.25);
    });

    it('should fail validation for 0.35 as multipleOf 0.1 (not a true multiple)', async () => {
      const schema = await create({
        type: 'number',
        multipleOf: 0.1
      });

      try {
        await schema.validate(0.35);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('multipleOf');
      }
    });

    it('should correctly validate large floating point multiples', async () => {
      const schema = await create({
        type: 'number',
        multipleOf: 0.01
      });

      expect(await schema.validate(123.45)).to.equal(123.45);
    });

    it('should fail for non-multiples with floating point', async () => {
      const schema = await create({
        type: 'number',
        multipleOf: 0.3
      });

      try {
        await schema.validate(0.5);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('multipleOf');
      }
    });
  });

  describe('Bug Fix 2: Integer Validation with Large Numbers', () => {
    it('should correctly validate Number.MAX_SAFE_INTEGER as integer', async () => {
      const schema = await create({
        type: 'integer'
      });

      const maxSafeInt = Number.MAX_SAFE_INTEGER; // 9007199254740991
      expect(await schema.validate(maxSafeInt)).to.equal(maxSafeInt);
    });

    it('should correctly validate Number.MIN_SAFE_INTEGER as integer', async () => {
      const schema = await create({
        type: 'integer'
      });

      const minSafeInt = Number.MIN_SAFE_INTEGER; // -9007199254740991
      expect(await schema.validate(minSafeInt)).to.equal(minSafeInt);
    });

    it('should correctly reject floating point numbers', async () => {
      const schema = await create({
        type: 'integer'
      });

      try {
        await schema.validate(123.456);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('type');
      }
    });

    it('should correctly validate zero as integer', async () => {
      const schema = await create({
        type: 'integer'
      });

      expect(await schema.validate(0)).to.equal(0);
    });

    it('should correctly validate negative integers', async () => {
      const schema = await create({
        type: 'integer'
      });

      expect(await schema.validate(-42)).to.equal(-42);
    });

    it('should reject NaN', async () => {
      const schema = await create({
        type: 'integer'
      });

      try {
        await schema.validate(NaN);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('type');
      }
    });

    it('should reject Infinity', async () => {
      const schema = await create({
        type: 'integer'
      });

      try {
        await schema.validate(Infinity);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('type');
      }
    });
  });

  describe('Bug Fix 3: Race Condition in Version Detection', () => {
    it('should handle concurrent validate() calls correctly', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'string'
      });

      // Execute multiple validations concurrently
      const results = await Promise.all([
        schema.validate('test1'),
        schema.validate('test2'),
        schema.validate('test3'),
        schema.validate('test4'),
        schema.validate('test5')
      ]);

      // All should succeed
      expect(results).to.deep.equal(['test1', 'test2', 'test3', 'test4', 'test5']);
    });

    it('should not override explicitly set version', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2019-09/schema',
        type: 'string'
      }, { version: '2020-12' });

      // Should use the explicitly set version (2020-12) not the schema version (2019-09)
      const result = await schema.validate('test');
      expect(result).to.equal('test');
    });

    it('should correctly detect version on first validate call', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: false
      });

      // First validation should detect version and enable 2020-12 features
      const result = await schema.validate({ name: 'test' });
      expect(result).to.deep.equal({ name: 'test' });
    });

    it('should maintain consistent version detection across multiple validations', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        dependentRequired: {
          name: ['surname']
        }
      });

      // First validation
      const result1 = await schema.validate({ name: 'John', surname: 'Doe' });
      expect(result1).to.deep.equal({ name: 'John', surname: 'Doe' });

      // Second validation should use same version
      const result2 = await schema.validate({ name: 'Jane', surname: 'Smith' });
      expect(result2).to.deep.equal({ name: 'Jane', surname: 'Smith' });

      // Third validation should fail correctly with 2020-12 keywords
      try {
        await schema.validate({ name: 'Bob' }); // Missing required 'surname'
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('dependentRequired');
      }
    });
  });
});
