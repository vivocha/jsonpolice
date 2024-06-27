import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as jp from './index.js';

chai.should();
chai.use(chaiAsPromised);

describe('jsonpolice', function () {
  describe('create', function () {
    it('should failed to create a schema from an invalid value', async function () {
      return jp.create(1, { scope: 'http://example.com' }).should.be.rejectedWith(jp.SchemaError, /schema/);
    });
    it('should create a "true" schema', async function () {
      const schema = await jp.create(true, { scope: 'http://example.com' });
      schema.should.be.a.instanceOf(jp.Schema);
      return schema.validate({}).should.eventually.deep.equal({});
    });
    it('should create a "false" schema', async function () {
      const schema = await jp.create(false, { scope: 'http://example.com' });
      schema.should.be.a.instanceOf(jp.Schema);
      return schema.validate({}).should.be.rejectedWith(jp.ValidationError, /false/);
    });
  });

  describe('compliance', function () {
    it('should create a validator of the JSON-Schema draft 4 specification', async function () {
      const spec = {
        id: 'http://json-schema.org/draft-04/schema#',
        $schema: 'http://json-schema.org/draft-04/schema#',
        description: 'Core schema meta-schema',
        definitions: {
          schemaArray: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#' },
          },
          positiveInteger: {
            type: 'integer',
            minimum: 0,
          },
          positiveIntegerDefault0: {
            allOf: [{ $ref: '#/definitions/positiveInteger' }, { default: 0 }],
          },
          simpleTypes: {
            enum: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
          },
          stringArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            uniqueItems: true,
          },
        },
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uri',
          },
          $schema: {
            type: 'string',
            format: 'uri',
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          default: {},
          multipleOf: {
            type: 'number',
            minimum: 0,
            exclusiveMinimum: true,
          },
          maximum: {
            type: 'number',
          },
          exclusiveMaximum: {
            type: 'boolean',
            default: false,
          },
          minimum: {
            type: 'number',
          },
          exclusiveMinimum: {
            type: 'boolean',
            default: false,
          },
          maxLength: { $ref: '#/definitions/positiveInteger' },
          minLength: { $ref: '#/definitions/positiveIntegerDefault0' },
          pattern: {
            type: 'string',
            format: 'regex',
          },
          additionalItems: {
            anyOf: [{ type: 'boolean' }, { $ref: '#' }],
            default: {},
          },
          items: {
            anyOf: [{ $ref: '#' }, { $ref: '#/definitions/schemaArray' }],
            default: {},
          },
          maxItems: { $ref: '#/definitions/positiveInteger' },
          minItems: { $ref: '#/definitions/positiveIntegerDefault0' },
          uniqueItems: {
            type: 'boolean',
            default: false,
          },
          maxProperties: { $ref: '#/definitions/positiveInteger' },
          minProperties: { $ref: '#/definitions/positiveIntegerDefault0' },
          required: { $ref: '#/definitions/stringArray' },
          additionalProperties: {
            anyOf: [{ type: 'boolean' }, { $ref: '#' }],
            default: {},
          },
          definitions: {
            type: 'object',
            additionalProperties: { $ref: '#' },
            default: {},
          },
          properties: {
            type: 'object',
            additionalProperties: { $ref: '#' },
            default: {},
          },
          patternProperties: {
            type: 'object',
            additionalProperties: { $ref: '#' },
            default: {},
          },
          dependencies: {
            type: 'object',
            additionalProperties: {
              anyOf: [{ $ref: '#' }, { $ref: '#/definitions/stringArray' }],
            },
          },
          enum: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
          },
          type: {
            anyOf: [
              { $ref: '#/definitions/simpleTypes' },
              {
                type: 'array',
                items: { $ref: '#/definitions/simpleTypes' },
                minItems: 1,
                uniqueItems: true,
              },
            ],
          },
          allOf: { $ref: '#/definitions/schemaArray' },
          anyOf: { $ref: '#/definitions/schemaArray' },
          oneOf: { $ref: '#/definitions/schemaArray' },
          not: { $ref: '#' },
        },
        dependencies: {
          exclusiveMaximum: ['maximum'],
          exclusiveMinimum: ['minimum'],
        },
        default: {},
      };
      const opts = {
        scope: 'http://json-schema.org/draft-04/schema#',
      };
      const schema = await jp.create(spec, opts);
      await schema.validate({ type: true }).should.be.rejectedWith(jp.ValidationError, 'properties');
      return schema.validate({
        type: 'object',
        properties: {
          a: {
            type: 'integer',
          },
        },
        additionalProperties: { $ref: '#' },
      }).should.be.fulfilled;
    });

    it('should create a validator of the JSON-Schema draft 7 specification', async function () {
      const spec = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'http://json-schema.org/draft-07/schema#',
        title: 'Core schema meta-schema',
        definitions: {
          schemaArray: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#' },
          },
          nonNegativeInteger: {
            type: 'integer',
            minimum: 0,
          },
          nonNegativeIntegerDefault0: {
            allOf: [{ $ref: '#/definitions/nonNegativeInteger' }, { default: 0 }],
          },
          simpleTypes: {
            enum: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
          },
          stringArray: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
            default: [],
          },
        },
        type: ['object', 'boolean'],
        properties: {
          $id: {
            type: 'string',
            format: 'uri-reference',
          },
          $schema: {
            type: 'string',
            format: 'uri',
          },
          $ref: {
            type: 'string',
            format: 'uri-reference',
          },
          $comment: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          default: true,
          readOnly: {
            type: 'boolean',
            default: false,
          },
          examples: {
            type: 'array',
            items: true,
          },
          multipleOf: {
            type: 'number',
            exclusiveMinimum: 0,
          },
          maximum: {
            type: 'number',
          },
          exclusiveMaximum: {
            type: 'number',
          },
          minimum: {
            type: 'number',
          },
          exclusiveMinimum: {
            type: 'number',
          },
          maxLength: { $ref: '#/definitions/nonNegativeInteger' },
          minLength: { $ref: '#/definitions/nonNegativeIntegerDefault0' },
          pattern: {
            type: 'string',
            format: 'regex',
          },
          additionalItems: { $ref: '#' },
          items: {
            anyOf: [{ $ref: '#' }, { $ref: '#/definitions/schemaArray' }],
            default: true,
          },
          maxItems: { $ref: '#/definitions/nonNegativeInteger' },
          minItems: { $ref: '#/definitions/nonNegativeIntegerDefault0' },
          uniqueItems: {
            type: 'boolean',
            default: false,
          },
          contains: { $ref: '#' },
          maxProperties: { $ref: '#/definitions/nonNegativeInteger' },
          minProperties: { $ref: '#/definitions/nonNegativeIntegerDefault0' },
          required: { $ref: '#/definitions/stringArray' },
          additionalProperties: { $ref: '#' },
          definitions: {
            type: 'object',
            additionalProperties: { $ref: '#' },
            default: {},
          },
          properties: {
            type: 'object',
            additionalProperties: { $ref: '#' },
            default: {},
          },
          patternProperties: {
            type: 'object',
            additionalProperties: { $ref: '#' },
            propertyNames: { format: 'regex' },
            default: {},
          },
          dependencies: {
            type: 'object',
            additionalProperties: {
              anyOf: [{ $ref: '#' }, { $ref: '#/definitions/stringArray' }],
            },
          },
          propertyNames: { $ref: '#' },
          const: true,
          enum: {
            type: 'array',
            items: true,
            minItems: 1,
            uniqueItems: true,
          },
          type: {
            anyOf: [
              { $ref: '#/definitions/simpleTypes' },
              {
                type: 'array',
                items: { $ref: '#/definitions/simpleTypes' },
                minItems: 1,
                uniqueItems: true,
              },
            ],
          },
          format: { type: 'string' },
          contentMediaType: { type: 'string' },
          contentEncoding: { type: 'string' },
          if: { $ref: '#' },
          then: { $ref: '#' },
          else: { $ref: '#' },
          allOf: { $ref: '#/definitions/schemaArray' },
          anyOf: { $ref: '#/definitions/schemaArray' },
          oneOf: { $ref: '#/definitions/schemaArray' },
          not: { $ref: '#' },
        },
        default: true,
      };
      const opts = {
        scope: 'http://json-schema.org/draft-07/schema#',
      };
      const schema = await jp.create(spec, opts);
      await schema.validate({ type: true }).should.be.rejectedWith(jp.ValidationError, 'properties');
      return schema.validate({
        type: 'object',
        properties: {
          a: {
            type: 'integer',
          },
        },
        additionalProperties: { $ref: '#' },
      }).should.be.fulfilled;
    });
  });
});
