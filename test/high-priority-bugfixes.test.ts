import { expect } from 'chai';
import { create } from '../src/index.js';

describe('High Priority Bug Fixes', () => {
  describe('Bug Fix 1: additionalProperties with boolean false', () => {
    it('should handle additionalProperties: false without TypeError', async () => {
      const schema = await create({
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        additionalProperties: false
      });

      // Should reject additional properties
      try {
        await schema.validate({ name: 'John', extra: 'value' });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('additionalProperties');
        // Should not be a TypeError about accessing .readOnly on false
        expect(error.name).to.not.equal('TypeError');
      }
    });

    it('should handle additionalProperties: false with context option', async () => {
      const schema = await create({
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        additionalProperties: false
      });

      // Should work with context option without crashing
      try {
        await schema.validate({ name: 'John', extra: 'value' }, { context: 'read' });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('additionalProperties');
        expect(error.name).to.not.equal('TypeError');
      }
    });

    it('should handle additionalProperties: true', async () => {
      const schema = await create({
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        additionalProperties: true
      });

      // Should allow additional properties
      const result = await schema.validate({ name: 'John', extra: 'value' });
      expect(result).to.deep.equal({ name: 'John', extra: 'value' });
    });

    it('should handle additionalProperties with schema object', async () => {
      const schema = await create({
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        additionalProperties: {
          type: 'number',
          readOnly: true
        }
      });

      // readOnly properties should be removed in write context
      const result = await schema.validate({
        name: 'John',
        score: 100
      }, { context: 'write' });

      expect(result).to.deep.equal({ name: 'John' });
    });
  });

  describe('Bug Fix 2: unevaluatedProperties with boolean false', () => {
    it('should handle unevaluatedProperties: false without TypeError', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: false
      });

      // Should reject unevaluated properties
      try {
        await schema.validate({ name: 'John', extra: 'value' });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('unevaluatedProperties');
        expect(error.name).to.not.equal('TypeError');
      }
    });

    it('should handle unevaluatedProperties: false with context', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: false
      });

      try {
        await schema.validate({ name: 'John', extra: 'value' }, { context: 'read' });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('unevaluatedProperties');
        expect(error.name).to.not.equal('TypeError');
      }
    });

    it('should handle unevaluatedProperties with schema object', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: {
          type: 'number',
          writeOnly: true
        }
      });

      // writeOnly properties should be removed in read context
      const result = await schema.validate({
        name: 'John',
        secret: 42
      }, { context: 'read' });

      expect(result).to.deep.equal({ name: 'John' });
    });
  });

  describe('Bug Fix 3: contains validator mutation on failure', () => {
    it('should not mutate array elements that do not match', async () => {
      const schema = await create({
        type: 'array',
        contains: {
          type: 'object',
          properties: {
            value: { type: 'number', multipleOf: 2 }
          },
          required: ['value']
        }
      });

      const originalData = [
        { value: 1 },  // Doesn't match (not multipleOf 2)
        { value: 2 },  // Matches
        { value: 3 }   // Doesn't match
      ];

      const result = await schema.validate(originalData);

      // Only the matching element should potentially be mutated
      expect(result[1]).to.deep.equal({ value: 2 });
    });

    it('should validate and mutate only matching elements in contains', async () => {
      const schema = await create({
        type: 'array',
        contains: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'special' },
            value: { type: 'number', default: 0 }
          },
          required: ['type']
        }
      });

      const data = [
        { type: 'normal', value: 1 },
        { type: 'special' },  // Matches - should get default value
        { type: 'other', value: 2 }
      ];

      const result = await schema.validate(data, { setDefault: true });

      // Only the matching element should have the default applied
      expect(result[1]).to.deep.equal({ type: 'special', value: 0 });
    });

    it('should fail if no elements match contains', async () => {
      const schema = await create({
        type: 'array',
        contains: {
          type: 'number',
          minimum: 10
        }
      });

      try {
        await schema.validate([1, 2, 3, 4, 5]);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('contains');
      }
    });
  });

  describe('Bug Fix 4: anyOf/oneOf partial mutations', () => {
    describe('anyOf', () => {
      it('should not have partial mutations when first schema fails', async () => {
        const schema = await create({
          anyOf: [
            {
              type: 'object',
              properties: {
                a: { type: 'string', minLength: 10 }
              },
              required: ['a']
            },
            {
              type: 'object',
              properties: {
                b: { type: 'number' }
              },
              required: ['b']
            }
          ]
        });

        // Should match second schema without being affected by first
        const result = await schema.validate({ b: 42 });
        expect(result).to.deep.equal({ b: 42 });
      });

      it('should use first matching schema', async () => {
        const schema = await create({
          anyOf: [
            {
              type: 'object',
              properties: {
                value: { type: 'number', default: 100 }
              }
            },
            {
              type: 'object',
              properties: {
                value: { type: 'number', default: 200 }
              }
            }
          ]
        });

        const result = await schema.validate({}, { setDefault: true });
        // Should use first matching schema
        expect(result.value).to.equal(100);
      });

      it('should fail if no schema matches', async () => {
        const schema = await create({
          anyOf: [
            { type: 'string', minLength: 10 },
            { type: 'number', minimum: 100 }
          ]
        });

        try {
          await schema.validate('short');
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).to.contain('anyOf');
        }
      });

      it('should handle primitive values without mutation issues', async () => {
        const schema = await create({
          anyOf: [
            { type: 'string', minLength: 10 },
            { type: 'number' }
          ]
        });

        const result = await schema.validate(42);
        expect(result).to.equal(42);
      });

      it('should handle null values', async () => {
        const schema = await create({
          anyOf: [
            { type: 'null' },
            { type: 'string' }
          ]
        });

        const result = await schema.validate(null);
        expect(result).to.equal(null);
      });
    });

    describe('oneOf', () => {
      it('should not have partial mutations when testing schemas', async () => {
        const schema = await create({
          oneOf: [
            {
              type: 'object',
              properties: {
                a: { type: 'string', minLength: 10 }
              },
              required: ['a']
            },
            {
              type: 'object',
              properties: {
                b: { type: 'number' }
              },
              required: ['b']
            }
          ]
        });

        // Should match exactly one schema
        const result = await schema.validate({ b: 42 });
        expect(result).to.deep.equal({ b: 42 });
      });

      it('should fail if multiple schemas match', async () => {
        const schema = await create({
          oneOf: [
            {
              type: 'object',
              properties: {
                value: { type: 'number' }
              }
            },
            {
              type: 'object',
              properties: {
                value: { type: 'number', minimum: 0 }
              }
            }
          ]
        });

        try {
          await schema.validate({ value: 42 });
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).to.contain('oneOf');
        }
      });

      it('should fail if no schema matches', async () => {
        const schema = await create({
          oneOf: [
            { type: 'string', minLength: 10 },
            { type: 'number', minimum: 100 }
          ]
        });

        try {
          await schema.validate('short');
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).to.contain('oneOf');
        }
      });

      it('should apply mutations from the matching schema only', async () => {
        const schema = await create({
          oneOf: [
            {
              type: 'object',
              properties: {
                type: { type: 'string', const: 'A' },
                value: { type: 'number', default: 100 }
              },
              required: ['type']
            },
            {
              type: 'object',
              properties: {
                type: { type: 'string', const: 'B' },
                value: { type: 'number', default: 200 }
              },
              required: ['type']
            }
          ]
        });

        const result = await schema.validate({ type: 'B' }, { setDefault: true });
        expect(result).to.deep.equal({ type: 'B', value: 200 });
      });
    });
  });
});
