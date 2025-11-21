import { expect } from 'chai';
import { create } from '../src/index.js';

describe('JSON Schema 2020-12 Support', () => {
  describe('Version Detection', () => {
    it('should auto-detect draft-07 schema', async () => {
      const schema = await create({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string'
      });
      
      expect(await schema.validate('test')).to.equal('test');
    });

    it('should auto-detect 2019-09 schema', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2019-09/schema',
        type: 'string'
      });
      
      expect(await schema.validate('test')).to.equal('test');
    });

    it('should auto-detect 2020-12 schema', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'string'
      });
      
      expect(await schema.validate('test')).to.equal('test');
    });

    it('should support explicit version option', async () => {
      const schema = await create({
        type: 'string'
      }, { version: '2020-12' });
      
      expect(await schema.validate('test')).to.equal('test');
    });
  });

  describe('dependentSchemas', () => {
    it('should validate dependent schemas correctly', async () => {
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

      // Should pass when name is present and surname is also present
      expect(await schema.validate({
        name: 'John',
        surname: 'Doe',
        age: 30
      })).to.deep.equal({
        name: 'John',
        surname: 'Doe', 
        age: 30
      });

      // Should pass when name is not present
      expect(await schema.validate({
        age: 30
      })).to.deep.equal({
        age: 30
      });

      // Should fail when name is present but surname is missing
      try {
        await schema.validate({
          name: 'John',
          age: 30
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('dependentSchemas');
      }
    });

    it('should handle invalid dependentSchemas definition', async () => {
      try {
        const schema = await create({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          dependentSchemas: null  // Invalid - should be object
        });
        await schema.validate({});
        expect.fail('Should have thrown schema error');
      } catch (error: any) {
        expect(error.message).to.contain('dependentSchemas');
      }
    });
  });

  describe('dependentRequired', () => {
    it('should validate dependent required properties correctly', async () => {
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

      // Should pass when name is present and surname is also present
      expect(await schema.validate({
        name: 'John',
        surname: 'Doe',
        age: 30
      })).to.deep.equal({
        name: 'John',
        surname: 'Doe',
        age: 30
      });

      // Should pass when name is not present
      expect(await schema.validate({
        age: 30
      })).to.deep.equal({
        age: 30
      });

      // Should fail when name is present but surname is missing
      try {
        await schema.validate({
          name: 'John',
          age: 30
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('dependentRequired');
      }
    });

    it('should handle invalid dependentRequired definition', async () => {
      try {
        const schema = await create({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          dependentRequired: null  // Invalid - should be object
        });
        await schema.validate({});
        expect.fail('Should have thrown schema error');
      } catch (error: any) {
        expect(error.message).to.contain('dependentRequired');
      }
    });

    it('should handle invalid dependentRequired array format', async () => {
      try {
        const schema = await create({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          dependentRequired: {
            name: 'not-an-array'  // Invalid - should be array
          }
        });
        await schema.validate({ name: 'test' });
        expect.fail('Should have thrown schema error');
      } catch (error: any) {
        expect(error.message).to.contain('dependentRequired');
      }
    });

    it('should handle invalid dependentRequired string in array', async () => {
      try {
        const schema = await create({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          dependentRequired: {
            name: [123]  // Invalid - should be string
          }
        });
        await schema.validate({ name: 'test' });
        expect.fail('Should have thrown schema error');
      } catch (error: any) {
        expect(error.message).to.contain('dependentRequired');
      }
    });
  });

  describe('unevaluatedProperties', () => {
    it('should handle unevaluated properties like additional properties', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        unevaluatedProperties: false
      });

      // Should pass with only defined properties
      expect(await schema.validate({
        name: 'John'
      })).to.deep.equal({
        name: 'John'
      });

      // Should remove additional properties when removeAdditional is true
      expect(await schema.validate({
        name: 'John',
        extra: 'removed'
      }, { removeAdditional: true })).to.deep.equal({
        name: 'John'
      });

      // Should fail with additional properties when removeAdditional is false
      try {
        await schema.validate({
          name: 'John',
          extra: 'not allowed'
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('unevaluatedProperties');
      }
    });

    it('should handle context-aware unevaluatedProperties removal', async () => {
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
        extra: 'should be removed'
      }, { context: 'write' })).to.deep.equal({
        name: 'John'
      });
    });
  });

  describe('unevaluatedItems', () => {
    it('should handle unevaluated items like additional items', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' }
        ],
        unevaluatedItems: false
      });

      // Should pass with items matching the schema
      expect(await schema.validate(['John', 42])).to.deep.equal(['John', 42]);

      // Should fail with additional items
      try {
        await schema.validate(['John', 42, 'extra']);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('unevaluatedItems');
      }
    });
  });

  describe('$defs', () => {
    it('should support $defs keyword', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          person: { $ref: '#/$defs/person' }
        },
        $defs: {
          person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' }
            },
            required: ['name']
          }
        }
      });

      expect(await schema.validate({
        person: {
          name: 'John',
          age: 30
        }
      })).to.deep.equal({
        person: {
          name: 'John',
          age: 30
        }
      });
    });

    it('should warn when both definitions and $defs are present', async () => {
      // Capture console.warn
      const originalWarn = console.warn;
      let warningMessage = '';
      console.warn = (message: string) => {
        warningMessage = message;
      };

      try {
        const schema = await create({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            person: { $ref: '#/$defs/person' }
          },
          definitions: {  // Old way
            person: { type: 'object' }
          },
          $defs: {  // New way
            person: {
              type: 'object',
              properties: {
                name: { type: 'string' }
              }
            }
          }
        });

        await schema.validate({
          person: { name: 'John' }
        });

        expect(warningMessage).to.contain('Both "definitions" and "$defs" found');
        expect(warningMessage).to.contain('Use "$defs" instead');
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  describe('Backwards Compatibility', () => {
    it('should continue to support dependencies keyword', async () => {
      const schema = await create({
        type: 'object',
        properties: {
          name: { type: 'string' },
          surname: { type: 'string' }
        },
        dependencies: {
          name: ['surname']
        }
      });

      expect(await schema.validate({
        name: 'John',
        surname: 'Doe'
      })).to.deep.equal({
        name: 'John',
        surname: 'Doe'
      });
    });

    it('should continue to support definitions keyword', async () => {
      const schema = await create({
        type: 'object',
        properties: {
          person: { $ref: '#/definitions/person' }
        },
        definitions: {
          person: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          }
        }
      });

      expect(await schema.validate({
        person: { name: 'John' }
      })).to.deep.equal({
        person: { name: 'John' }
      });
    });
  });
});