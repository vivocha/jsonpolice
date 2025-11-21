import { expect } from 'chai';
import { create } from '../dist/index.js';
import { SchemaError } from '../dist/errors.js';

describe('Coverage Completion Tests', () => {
  describe('Schema Constructor Error Cases', () => {
    it('should throw SchemaError for invalid schema data', async () => {
      try {
        await create(undefined as any);
        expect.fail('Should have thrown SchemaError');
      } catch (error: any) {
        expect(error).to.be.instanceOf(SchemaError);
        expect(error.message).to.contain('schema');
      }
    });

    it('should throw SchemaError for invalid data type', async () => {
      try {
        await create(123 as any);
        expect.fail('Should have thrown SchemaError');
      } catch (error: any) {
        expect(error).to.be.instanceOf(SchemaError);
        expect(error.message).to.contain('schema');
      }
    });
  });

  describe('unevaluatedProperties Context-Aware Validation', () => {
    it('should remove writeOnly unevaluated properties in read context', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: {
          type: 'string',
          writeOnly: true
        }
      });

      // In read context, writeOnly unevaluated properties should be removed
      expect(await schema.validate({
        name: 'John',
        secret: 'should be removed'
      }, { context: 'read' })).to.deep.equal({
        name: 'John'
      });
    });

    it('should remove readOnly unevaluated properties in write context', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: {
          type: 'string',
          readOnly: true
        }
      });

      // In write context, readOnly unevaluated properties should be removed
      expect(await schema.validate({
        name: 'John',
        computed: 'should be removed'
      }, { context: 'write' })).to.deep.equal({
        name: 'John'
      });
    });

    it('should handle unevaluated properties with patternProperties', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        patternProperties: {
          '^prefix_': { type: 'string' }
        },
        unevaluatedProperties: false
      });

      // Properties matching patternProperties should be allowed
      expect(await schema.validate({
        name: 'John',
        prefix_test: 'allowed'
      })).to.deep.equal({
        name: 'John',
        prefix_test: 'allowed'
      });

      // Properties not matching should be removed with removeAdditional
      expect(await schema.validate({
        name: 'John',
        prefix_test: 'allowed',
        other: 'should be removed'
      }, { removeAdditional: true })).to.deep.equal({
        name: 'John',
        prefix_test: 'allowed'
      });
    });
  });

  describe('Format Validation Edge Cases', () => {
    it('should handle format validation failure correctly', async () => {
      const schema = await create({
        type: 'string',
        format: 'uuid'
      });

      let errorThrown = false;
      try {
        await schema.validate('not-a-uuid');
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('format');
      }
      expect(errorThrown).to.be.true;
    });

    it('should handle json-pointer format validation failure correctly', async () => {
      const schema = await create({
        type: 'string',
        format: 'json-pointer'
      });

      let errorThrown = false;
      try {
        await schema.validate('foo/bar'); // should start with /
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('format');
      }
      expect(errorThrown).to.be.true;
    });

    it('should handle invalid json-pointer format correctly', async () => {
      const schema = await create({
        type: 'string',
        format: 'json-pointer'
      });

      let errorThrown = false;
      try {
        await schema.validate('invalid~2pointer'); // ~2 is not valid escape
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('format');
      }
      expect(errorThrown).to.be.true;
    });

    it('should handle invalid uuid format correctly', async () => {
      const schema = await create({
        type: 'string',
        format: 'uuid'
      });

      let errorThrown = false;
      try {
        await schema.validate('invalid-uuid-format');
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('format');
      }
      expect(errorThrown).to.be.true;
    });
  });

  describe('Dependency Validation Edge Cases', () => {
    it('should handle dependentSchemas validation failure correctly', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        dependentSchemas: {
          name: {
            properties: {
              surname: { type: 'string' }
            },
            required: ['surname']
          }
        }
      });

      let errorThrown = false;
      try {
        await schema.validate({
          name: 'John',
          age: 30
        });
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('dependentSchemas');
      }
      expect(errorThrown).to.be.true;
    });

    it('should handle dependentRequired validation failure correctly', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
          surname: { type: 'string' },
          age: { type: 'number' }
        },
        dependentRequired: {
          name: ['surname']
        }
      });

      let errorThrown = false;
      try {
        await schema.validate({
          name: 'John',
          age: 30
        });
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('dependentRequired');
      }
      expect(errorThrown).to.be.true;
    });

    it('should handle unevaluatedItems validation failure correctly', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' }
        ],
        unevaluatedItems: false
      });

      let errorThrown = false;
      try {
        await schema.validate(['John', 42, 'extra']);
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('unevaluatedItems');
      }
      expect(errorThrown).to.be.true;
    });

    it('should handle unevaluatedProperties validation failure correctly', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: false
      });

      let errorThrown = false;
      try {
        await schema.validate({
          name: 'John',
          extra: 'not allowed'
        });
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.contain('unevaluatedProperties');
      }
      expect(errorThrown).to.be.true;
    });
  });
});