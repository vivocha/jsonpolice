import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as jp from './index.js';

chai.should();
chai.use(chaiAsPromised);

describe('Schema', function () {
  describe('validators', function () {
    describe('type', function () {
      it('should validate a null value', async function () {
        const schema = await jp.create(
          {
            type: 'null',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(null).should.eventually.equal(null);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a boolean value', async function () {
        const schema = await jp.create(
          {
            type: 'boolean',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(true).should.eventually.equal(true);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate an array value', async function () {
        const schema = await jp.create(
          {
            type: 'array',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate([]).should.eventually.deep.equal([]);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a number value', async function () {
        const schema = await jp.create(
          {
            type: 'number',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(10).should.eventually.equal(10);
        await schema.validate(10.5).should.eventually.equal(10.5);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a integer value', async function () {
        const schema = await jp.create(
          {
            type: 'integer',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(10).should.eventually.equal(10);
        await schema.validate(10.5).should.be.rejectedWith(jp.ValidationError, 'type');
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a string value', async function () {
        const schema = await jp.create(
          {
            type: 'string',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('test').should.eventually.equal('test');
        await schema.validate('').should.eventually.equal('');
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate an object value', async function () {
        const schema = await jp.create(
          {
            type: 'object',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({}).should.eventually.deep.equal({});
        return schema.validate('test').should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate with an array of types', async function () {
        const schema = await jp.create(
          {
            type: ['string', 'number'],
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('test').should.eventually.equal('test');
        await schema.validate(10).should.eventually.equal(10);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should fail to validate an unknown type', async function () {
        const schema = await jp.create(
          {
            type: 'foo',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate({}).should.be.rejectedWith(jp.SchemaError, 'type');
      });
    });
    describe('enum', async function () {
      it('should fail with an invalid enum', async function () {
        const schema1 = await jp.create(
          {
            enum: true,
          },
          { scope: 'http://example.com' }
        );
        await schema1.validate(true).should.be.rejectedWith(jp.SchemaError, 'enum');
        const schema2 = await jp.create(
          {
            enum: [],
          },
          { scope: 'http://example.com' }
        );
        return schema2.validate(true).should.be.rejectedWith(jp.SchemaError, 'enum');
      });
      it('should validate with enum', async function () {
        const schema = await jp.create(
          {
            enum: ['test', 10],
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('test').should.eventually.equal('test');
        await schema.validate(10).should.eventually.equal(10);
        return schema.validate(11).should.be.rejectedWith(jp.ValidationError, 'enum');
      });
    });
    describe('const', async function () {
      it('should fail with an invalid const', async function () {
        const schema = await jp.create(
          {
            const: undefined,
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(true).should.be.rejectedWith(jp.SchemaError, 'const');
      });
      it('should validate with const', async function () {
        const schema = await jp.create(
          {
            const: 10,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(10).should.eventually.equal(10);
        return schema.validate(11).should.be.rejectedWith(jp.ValidationError, 'const');
      });
    });
    describe('multipleOf', async function () {
      it('should fail with an invalid multipleOf', async function () {
        const schema = await jp.create(
          {
            multipleOf: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(10).should.be.rejectedWith(jp.SchemaError, 'multipleOf');
      });
      it('should validate with multipleOf', async function () {
        const schema = await jp.create(
          {
            multipleOf: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(15).should.eventually.equal(15);
        await schema.validate('15').should.eventually.equal('15');
        return schema.validate(11).should.be.rejectedWith(jp.ValidationError, 'multipleOf');
      });
    });
    describe('maximum', async function () {
      it('should fail with an invalid maximum', async function () {
        const schema = await jp.create(
          {
            maximum: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(10).should.be.rejectedWith(jp.SchemaError, 'maximum');
      });
      it('should validate with maximum', async function () {
        const schema = await jp.create(
          {
            maximum: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(2).should.eventually.equal(2);
        await schema.validate(3).should.eventually.equal(3);
        return schema.validate(4).should.be.rejectedWith(jp.ValidationError, 'maximum');
      });
    });
    describe('exclusiveMaximum', async function () {
      it('should fail with an invalid exclusiveMaximum', async function () {
        const schema = await jp.create(
          {
            exclusiveMaximum: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(10).should.be.rejectedWith(jp.SchemaError, 'exclusiveMaximum');
      });
      it('should validate with exclusiveMaximum', async function () {
        const schema = await jp.create(
          {
            exclusiveMaximum: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(2).should.eventually.equal(2);
        await schema.validate('2').should.eventually.equal('2');
        await schema.validate(3).should.be.rejectedWith(jp.ValidationError, 'exclusiveMaximum');
        return schema.validate(4).should.be.rejectedWith(jp.ValidationError, 'exclusiveMaximum');
      });
    });
    describe('minimum', async function () {
      it('should fail with an invalid minimum', async function () {
        const schema = await jp.create(
          {
            minimum: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(10).should.be.rejectedWith(jp.SchemaError, 'minimum');
      });
      it('should validate with minimum', async function () {
        const schema = await jp.create(
          {
            minimum: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(4).should.eventually.equal(4);
        await schema.validate(3).should.eventually.equal(3);
        await schema.validate('4').should.eventually.equal('4');
        return schema.validate(2).should.be.rejectedWith(jp.ValidationError, 'minimum');
      });
    });
    describe('exclusiveMinimum', async function () {
      it('should fail with an invalid exclusiveMinimum', async function () {
        const schema = await jp.create(
          {
            exclusiveMinimum: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(10).should.be.rejectedWith(jp.SchemaError, 'exclusiveMinimum');
      });
      it('should validate with exclusiveMinimum', async function () {
        const schema = await jp.create(
          {
            exclusiveMinimum: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(4).should.eventually.equal(4);
        await schema.validate('4').should.eventually.equal('4');
        await schema.validate(3).should.be.rejectedWith(jp.ValidationError, 'exclusiveMinimum');
        return schema.validate(2).should.be.rejectedWith(jp.ValidationError, 'exclusiveMinimum');
      });
    });
    describe('maxLength', async function () {
      it('should fail with an invalid maxLength', async function () {
        const schema = await jp.create(
          {
            maxLength: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate('abc').should.be.rejectedWith(jp.SchemaError, 'maxLength');
      });
      it('should validate with maxLength', async function () {
        const schema = await jp.create(
          {
            maxLength: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('abc').should.eventually.equal('abc');
        return schema.validate('abcd').should.be.rejectedWith(jp.ValidationError, 'maxLength');
      });
    });
    describe('minLength', async function () {
      it('should fail with an invalid minLength', async function () {
        const schema = await jp.create(
          {
            minLength: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate('abc').should.be.rejectedWith(jp.SchemaError, 'minLength');
      });
      it('should validate with minLength', async function () {
        const schema = await jp.create(
          {
            minLength: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('abc').should.eventually.equal('abc');
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate('ab').should.be.rejectedWith(jp.ValidationError, 'minLength');
      });
    });
    describe('pattern', async function () {
      it('should fail with an invalid pattern', async function () {
        const schema = await jp.create(
          {
            pattern: 10,
          },
          { scope: 'http://example.com' }
        );
        return schema.validate('abc').should.be.rejectedWith(jp.SchemaError, 'pattern');
      });
      it('should validate with pattern', async function () {
        const schema = await jp.create(
          {
            pattern: '^a.*b$',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('a_b').should.eventually.equal('a_b');
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate('abc').should.be.rejectedWith(jp.ValidationError, 'pattern');
      });
      it('should validate a Date with pattern', async function () {
        const schema = await jp.create(
          {
            pattern: '^202[12]',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(new Date('2021-01-01')).should.eventually.equal('2021-01-01T00:00:00.000Z');
        return schema.validate(new Date('2020-01-01')).should.be.rejectedWith(jp.ValidationError, 'pattern');
      });
    });
    describe('format', async function () {
      it('should fail with an invalid format', async function () {
        const schema = await jp.create(
          {
            format: 10,
          },
          { scope: 'http://example.com' }
        );
        return schema.validate('abc').should.be.rejectedWith(jp.SchemaError, 'format');
      });
      it('should validate a valid date with a date-time format', async function () {
        const schema = await jp.create(
          {
            format: 'date-time',
          },
          { scope: 'http://example.com' }
        );

        await schema.validate('2022-03-29T00:00:00Z').should.eventually.be.a('Date');
        debugger;
        await schema.validate(new Date('2022-03-29T10:10:10Z')).should.eventually.be.a('Date');
      });
      it('should fail with an invalid date with a date-time format', async function () {
        const schema = await jp.create(
          {
            format: 'date-time',
          },
          { scope: 'http://example.com' }
        );

        await schema.validate('aaaaa').should.be.rejectedWith(jp.SchemaError, 'format');
      });
      it('should validate a valid date with a date format', async function () {
        const schema = await jp.create(
          {
            format: 'date',
          },
          { scope: 'http://example.com' }
        );

        await schema.validate('2022-03-29').should.eventually.be.a('Date');
        debugger;
        await schema.validate(new Date('2022-03-29')).should.eventually.be.a('Date');
      });
      it('should fail with an invalid date with a date format', async function () {
        const schema = await jp.create(
          {
            format: 'date',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('2022-03-32').should.be.rejectedWith(jp.SchemaError, 'format');
        await schema.validate('2022-03-29T00:00:00Z').should.be.rejectedWith(jp.SchemaError, 'format');
      });
      it('should validate a valid time with a time format', async function () {
        const schema = await jp.create(
          {
            format: 'time',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('12:32:10').should.eventually.equal('12:32:10');
        await schema.validate('12:32:10.333').should.eventually.equal('12:32:10.333');
      });
      it('should fail with an invalid time with a time format', async function () {
        const schema = await jp.create(
          {
            format: 'time',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('aaaa').should.be.rejectedWith(jp.SchemaError, 'format');
        await schema.validate('26:12:99').should.be.rejectedWith(jp.SchemaError, 'format');
      });
      it('should validate a valid email with a email format', async function () {
        const schema = await jp.create(
          {
            format: 'email',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('joe@example.com').should.eventually.equal('joe@example.com');
      });
      it('should fail with an invalid email with a email format', async function () {
        const schema = await jp.create(
          {
            format: 'email',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('aaaa').should.be.rejectedWith(jp.SchemaError, 'format');
      });
      it('should validate other valid formats', async function () {
        let schema = await jp.create(
          {
            format: 'hostname',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('example.com').should.eventually.equal('example.com');
        await schema.validate('a b c').should.be.rejectedWith(jp.SchemaError, 'format');
        schema = await jp.create(
          {
            format: 'ipv4',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('1.2.3.4').should.eventually.equal('1.2.3.4');
        await schema.validate('300.2').should.be.rejectedWith(jp.SchemaError, 'format');
        schema = await jp.create(
          {
            format: 'uri',
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('http://a.b.c').should.eventually.equal('http://a.b.c');
      });
    });
    describe('items', async function () {
      it('should validate with an empty array', async function () {
        const schema = await jp.create(
          {
            items: {
              type: 'string',
            },
          },
          { scope: 'http://example.com' }
        );
        return schema.validate([]).should.eventually.deep.equal([]);
      });
      it('should validate with a single schema', async function () {
        const schema = await jp.create(
          {
            items: {
              type: 'string',
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(['test', 'other']).should.eventually.deep.equal(['test', 'other']);
        return schema.validate([10]).should.be.rejectedWith(jp.ValidationError, 'items');
      });
      it('should validate with a multiple schemas', async function () {
        const schema = await jp.create(
          {
            items: [
              {
                type: 'string',
              },
              {
                type: 'boolean',
              },
              {
                type: 'integer',
              },
            ],
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(['test', true, 10]).should.eventually.deep.equal(['test', true, 10]);
        const p = schema.validate([1, true, 10.2]);
        const err = await p.should.be.rejectedWith(jp.ValidationError, 'items');
        err.errors.length.should.equal(2);

        const schema2 = await jp.create(
          {
            items: [
              {
                type: 'string',
              },
              undefined,
            ],
          },
          { scope: 'http://example.com' }
        );
        await schema2.validate([0, true]).should.be.rejectedWith(jp.ValidationError, 'items');
      });
    });
    describe('additionalItems', async function () {
      it('should ignore additionalItems if items is not an array', async function () {
        const schema1 = await jp.create(
          {
            additionalItems: {
              type: 'string',
            },
          },
          { scope: 'http://example.com' }
        );
        await schema1.validate([5, 10, 12.5]).should.eventually.deep.equal([5, 10, 12.5]);
        const schema2 = await jp.create(
          {
            items: {
              type: 'number',
            },
            additionalItems: {
              type: 'string',
            },
          },
          { scope: 'http://example.com' }
        );
        await schema2.validate([5, 10, 12.5]).should.eventually.deep.equal([5, 10, 12.5]);
      });
      it('should validate with additionalItems', async function () {
        const schema = await jp.create(
          {
            items: [
              {
                type: 'string',
              },
              {
                type: 'boolean',
              },
              {
                type: 'integer',
              },
            ],
            additionalItems: {
              type: 'string',
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(['test', true, 12, 'aaa', 'bbb', 'ccc']).should.be.fulfilled;
        const p = schema.validate(['test', true, 12, true, null, 'ccc']);
        const err = await p.should.be.rejectedWith(jp.ValidationError, 'additionalItems');
        err.errors.length.should.equal(2);
      });
    });
    describe('maxItems', async function () {
      it('should fail with an invalid maxItems', async function () {
        const schema = await jp.create(
          {
            maxItems: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(['abc']).should.be.rejectedWith(jp.SchemaError, 'maxItems');
      });
      it('should validate with maxItems', async function () {
        const schema = await jp.create(
          {
            maxItems: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(['a', 'b']).should.be.fulfilled;
        await schema.validate(['a', 'b', 'c']).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate(['a', 'b', 'c', 'd']).should.be.rejectedWith(jp.ValidationError, 'maxItems');
      });
    });
    describe('minItems', async function () {
      it('should fail with an invalid minItems', async function () {
        const schema = await jp.create(
          {
            minItems: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(['abc']).should.be.rejectedWith(jp.SchemaError, 'minItems');
      });
      it('should validate with minItems', async function () {
        const schema = await jp.create(
          {
            minItems: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(['a', 'b', 'c', 'd']).should.be.fulfilled;
        await schema.validate(['a', 'b', 'c']).should.be.fulfilled;
        return schema.validate(['a', 'b']).should.be.rejectedWith(jp.ValidationError, 'minItems');
      });
    });
    describe('uniqueItems', async function () {
      it('should fail with an invalid uniqueItems', async function () {
        const schema = await jp.create(
          {
            uniqueItems: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate(['abc']).should.be.rejectedWith(jp.SchemaError, 'uniqueItems');
      });
      it('should validate with uniqueItems', async function () {
        const schema = await jp.create(
          {
            uniqueItems: true,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(['a', 'b', 'c', 'd']).should.be.fulfilled;
        return schema.validate(['a', 'b', 'a', 'd']).should.be.rejectedWith(jp.ValidationError, 'uniqueItems');
      });
    });
    describe('contains', async function () {
      it('should validate a contains', async function () {
        const schema = await jp.create(
          {
            contains: {
              type: 'number',
              maximum: 3,
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(['a', 'b', 7, 3]).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate(['a', 'b', 7]).should.be.rejectedWith(jp.ValidationError, 'contains');
      });
    });
    describe('maxProperties', async function () {
      it('should fail with an invalid maxProperties', async function () {
        const schema = await jp.create(
          {
            maxProperties: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'maxProperties');
      });
      it('should validate with maxProperties', async function () {
        const schema = await jp.create(
          {
            maxProperties: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: 1, b: 2 }).should.be.fulfilled;
        await schema.validate({ a: 1, b: 2, c: 3 }).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate({ a: 1, b: 2, c: 3, d: 4 }).should.be.rejectedWith(jp.ValidationError, 'maxProperties');
      });
    });
    describe('minProperties', async function () {
      it('should fail with an invalid minProperties', async function () {
        const schema = await jp.create(
          {
            minProperties: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'minProperties');
      });
      it('should validate with minProperties', async function () {
        const schema = await jp.create(
          {
            minProperties: 3,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: 1, b: 2, c: 3, d: 4 }).should.be.fulfilled;
        await schema.validate({ a: 1, b: 2, c: 3 }).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate({ a: 1, b: 2 }).should.be.rejectedWith(jp.ValidationError, 'minProperties');
      });
    });
    describe('required', async function () {
      it('should fail with an invalid required', async function () {
        const schema1 = await jp.create(
          {
            required: 'test',
          },
          { scope: 'http://example.com' }
        );
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'required');
        const schema2 = await jp.create(
          {
            required: [1],
          },
          { scope: 'http://example.com' }
        );
        return schema2.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'required');
      });
      it('should validate with required', async function () {
        const schema = await jp.create(
          {
            required: ['a', 'b', 'c'],
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: 1, b: 2, c: 3, d: 4 }).should.be.fulfilled;
        await schema.validate({ a: 1, b: 2, c: 3 }).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate({ a: 1, b: 2 }).should.be.rejectedWith(jp.ValidationError, 'required');
      });
      it('should handle validation of required properties that have readOnly flag', async function () {
        const schema = await jp.create(
          {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: {
                type: 'string',
                readOnly: true,
              },
              b: {
                type: 'number',
              },
            },
          },
          { scope: 'http://example.com' }
        );

        await schema.validate({ b: 1 }).should.be.rejectedWith(jp.ValidationError, 'required');
        await schema.validate({ b: 1 }, { context: 'write' }).should.be.fulfilled;
        await schema.validate({ a: 1 }, { context: 'write' }).should.be.rejectedWith(jp.ValidationError, 'required');
        await schema.validate({ b: 1 }, { context: 'read' }).should.be.rejectedWith(jp.ValidationError, 'required');
        await schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'required');
      });
      it('should handle validation of required properties that have writeOnly flag', async function () {
        const schema = await jp.create(
          {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: {
                type: 'string',
                writeOnly: true,
              },
              b: {
                type: 'number',
              },
            },
          },
          { scope: 'http://example.com' }
        );

        await schema.validate({ b: 5 }).should.be.rejectedWith(jp.ValidationError, 'required');
        await schema.validate({ b: 5 }, { context: 'read' }).should.be.fulfilled;
      });
    });
    describe('properties', async function () {
      it('should fail with an invalid properties', async function () {
        const schema1 = await jp.create(
          {
            properties: 'test',
          },
          { scope: 'http://example.com' }
        );
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'properties');
        const schema2 = await jp.create(
          {
            properties: [1],
          },
          { scope: 'http://example.com' }
        );
        return schema2.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'properties');
      });
      it('should validate with properties', async function () {
        const schema = await jp.create(
          {
            properties: {
              a: {
                type: 'number',
              },
              c: {
                type: 'string',
              },
            },
          },
          { scope: 'http://example.com' }
        );

        await schema.validate({ a: 1, b: true, c: 'test', d: 4 }).should.be.fulfilled;
        await schema.validate({}, { setDefault: true }).should.be.fulfilled;
        const p = schema.validate({ a: 1, b: 2, c: 3 });
        const err = await p.should.be.rejectedWith(jp.ValidationError, 'properties');
        err.errors.length.should.equal(1);
        err.errors[0].message.should.equal('type');
        await schema.validate(1).should.eventually.equal(1);
      });
      it('should purge out-of-context properties', async function () {
        const schema = await jp.create(
          {
            properties: {
              a: {
                type: 'number',
                readOnly: true,
              },
              c: {
                type: 'string',
                writeOnly: true,
              },
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: 1, b: true, c: 'test', d: 4 }, { context: 'read' }).should.eventually.deep.equal({ a: 1, b: true, d: 4 });
        return schema.validate({ a: 1, b: true, c: 'test', d: 4 }, { context: 'write' }).should.eventually.deep.equal({ b: true, c: 'test', d: 4 });
      });
    });
    describe('patternProperties', async function () {
      it('should fail with an invalid patternProperties', async function () {
        const schema1 = await jp.create(
          {
            patternProperties: 'test',
          },
          { scope: 'http://example.com' }
        );
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'patternProperties');
        const schema2 = await jp.create(
          {
            patternProperties: [1],
          },
          { scope: 'http://example.com' }
        );
        return schema2.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'patternProperties');
      });
      it('should validate with patternProperties', async function () {
        const schema = await jp.create(
          {
            patternProperties: {
              '^a': {
                type: 'number',
              },
              b: {
                maxLength: 2,
                maximum: 6,
              },
              c$: {
                type: 'string',
              },
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ aaa: 1, b1: true, b2: 'tt', cc: 'aaa' }).should.be.fulfilled;
        await schema.validate({ aaa: true, b1: true }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
        await schema.validate({ aaa: 1, b1: 7 }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
        await schema.validate({ aba: 8 }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate({ bbc: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
      });
      it('should purge out-of-context patternProperties', async function () {
        const schema = await jp.create(
          {
            patternProperties: {
              '^a': {
                type: 'number',
                readOnly: true,
              },
              b: {
                maxLength: 2,
                maximum: 6,
              },
              c$: {
                type: 'string',
                writeOnly: true,
              },
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ aaa: 1, b1: true, b2: 'tt', cc: 'aaa' }, { context: 'read' }).should.eventually.deep.equal({ aaa: 1, b1: true, b2: 'tt' });
        return schema.validate({ aaa: 1, b1: true, b2: 'tt', cc: 'aaa' }, { context: 'write' }).should.eventually.deep.equal({ b1: true, b2: 'tt', cc: 'aaa' });
      });
    });
    describe('additionalProperties', async function () {
      it('should validate with a schema additionalProperties', async function () {
        const schema = await jp.create(
          {
            properties: {
              b: {
                type: 'string',
              },
            },
            patternProperties: {
              '^a': {
                type: 'number',
              },
            },
            additionalProperties: {
              type: 'boolean',
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ aaa: 1, b: 'x', c: true }).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        return schema.validate({ bbc: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'additionalProperties');
      });
      it('should validate with a boolean additionalProperties', async function () {
        const schema = await jp.create(
          {
            properties: {
              b: {
                type: 'string',
              },
            },
            patternProperties: {
              '^a': {
                type: 'number',
              },
            },
            additionalProperties: false,
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ aaa: 1, b: 'x' }).should.be.fulfilled;
        return schema.validate({ bbc: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'additionalProperties');
      });
      it('should purge additionalProperties, when the option is set', async function () {
        const schema = await jp.create(
          {
            properties: {
              b: {
                type: 'string',
              },
            },
            patternProperties: {
              '^a': {
                type: 'number',
              },
            },
            additionalProperties: false,
          },
          { scope: 'http://example.com' }
        );
        return schema.validate({ b: 'x', bbc: 'aaa' }, { removeAdditional: true }).should.eventually.deep.equal({ b: 'x' });
      });
      it('should purge out-of-context additionalProperties', async function () {
        const schema1 = await jp.create(
          {
            additionalProperties: {
              type: 'string',
              readOnly: true,
            },
          },
          { scope: 'http://example.com' }
        );
        await schema1.validate({ b: 'x' }, { context: 'read' }).should.eventually.deep.equal({ b: 'x' });
        await schema1.validate({ b: 'x' }, { context: 'write' }).should.eventually.deep.equal({});
        const schema2 = await jp.create(
          {
            additionalProperties: {
              type: 'string',
              writeOnly: true,
            },
          },
          { scope: 'http://example.com' }
        );
        await schema2.validate({ b: 'x' }, { context: 'read' }).should.eventually.deep.equal({});
        return schema2.validate({ b: 'x' }, { context: 'write' }).should.eventually.deep.equal({ b: 'x' });
      });
    });
    describe('dependencies', async function () {
      it('should fail with an invalid dependencies', async function () {
        const schema1 = await jp.create(
          {
            dependencies: 'test',
          },
          { scope: 'http://example.com' }
        );
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'dependencies');
        const schema2 = await jp.create(
          {
            dependencies: [1],
          },
          { scope: 'http://example.com' }
        );
        await schema2.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'dependencies');
        const schema3 = await jp.create(
          {
            dependencies: { a: [true] },
          },
          { scope: 'http://example.com' }
        );
        return schema3.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'dependencies');
      });
      it('should validate with dependencies', async function () {
        const schema = await jp.create(
          {
            dependencies: {
              a: ['b', 'c'],
              b: ['d'],
              d: {
                minProperties: 4,
              },
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ b: true, d: 'aaa', e: 1, f: 2 }).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        await schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'dependencies');
        await schema.validate({ d: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'dependencies');
        return schema.validate({ b: true }).should.be.rejectedWith(jp.ValidationError, 'dependencies');
      });
    });
    describe('propertyNames', async function () {
      it('should validate with propertyNames', async function () {
        const schema = await jp.create(
          {
            propertyNames: {
              minLength: 3,
              pattern: '^x-',
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ 'x-a': 3, 'x-b': true }).should.be.fulfilled;
        await schema.validate(1).should.eventually.equal(1);
        await schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'propertyNames');
        return schema.validate({ 'x-': true }).should.be.rejectedWith(jp.ValidationError, 'propertyNames');
      });
    });
    describe('if', async function () {
      it('should validate with if (when then and else are absent)', async function () {
        const schema = await jp.create(
          {
            if: {
              properties: {
                a: {
                  type: 'boolean',
                },
              },
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: true }).should.be.fulfilled;
        return schema.validate({ a: 1 }).should.be.fulfilled;
      });
      it('should validate with if (true branch)', async function () {
        const schema = await jp.create(
          {
            if: {
              properties: {
                a: {
                  type: 'boolean',
                },
              },
            },
            then: {
              required: ['b'],
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: true, b: 1 }).should.be.fulfilled;
        return schema.validate({ a: true }).should.be.rejectedWith(jp.ValidationError, 'required');
      });
      it('should validate with if (false branch)', async function () {
        const schema = await jp.create(
          {
            if: {
              properties: {
                a: {
                  type: 'boolean',
                },
              },
            },
            else: {
              required: ['c'],
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: true }).should.be.fulfilled;
        await schema.validate({ a: 1, c: true }).should.be.fulfilled;
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'required');
      });
    });
    describe('allOf', async function () {
      it('should fail with an invalid allOf', async function () {
        const schema = await jp.create(
          {
            allOf: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'allOf');
      });
      it('should validate with allOf', async function () {
        const schema = await jp.create(
          {
            allOf: [
              {
                type: 'string',
              },
              {
                maxLength: 3,
              },
            ],
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('aaa').should.be.fulfilled;
        await schema.validate(true).should.be.rejectedWith(jp.ValidationError, 'allOf');
        return schema.validate('aaaa').should.be.rejectedWith(jp.ValidationError, 'allOf');
      });
    });
    describe('anyOf', async function () {
      it('should fail with an invalid anyOf', async function () {
        const schema = await jp.create(
          {
            anyOf: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'anyOf');
      });
      it('should validate with anyOf', async function () {
        const schema = await jp.create(
          {
            anyOf: [
              {
                type: 'string',
              },
              {
                maximum: 3,
              },
            ],
          },
          { scope: 'http://example.com' }
        );
        await schema.validate('aaa').should.be.fulfilled;
        await schema.validate(2).should.be.fulfilled;
        await schema.validate(true).should.be.fulfilled;
        return schema.validate(5).should.be.rejectedWith(jp.ValidationError, 'anyOf');
      });
    });
    describe('oneOf', async function () {
      it('should fail with an invalid oneOf', async function () {
        const schema = await jp.create(
          {
            oneOf: 'test',
          },
          { scope: 'http://example.com' }
        );
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.SchemaError, 'oneOf');
      });
      it('should validate with oneOf', async function () {
        const schema = await jp.create(
          {
            oneOf: [
              {
                properties: {
                  a: true,
                  b: true,
                },
                additionalProperties: false,
              },
              {
                properties: {
                  b: true,
                  c: true,
                },
                additionalProperties: false,
              },
            ],
          },
          { scope: 'http://example.com' }
        );
        await schema.validate({ a: 1 }).should.be.fulfilled;
        await schema.validate({ c: 1 }).should.be.fulfilled;
        return schema.validate({ b: 1 }).should.be.rejectedWith(jp.ValidationError, 'oneOf');
      });
      it('should validate with oneOf which includes an array type', async function () {
        const schema = await jp.create(
          {
            oneOf: [
              {
                type: 'object',
                properties: {
                  a: true,
                  b: true,
                },
                additionalProperties: false,
              },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    a: true,
                    b: true,
                  },
                  additionalProperties: false,
                },
              },
            ],
          },
          { scope: 'http://example.com' }
        );
        schema.validate({ a: 1 }).should.be.fulfilled;
        schema.validate({ b: 1 }).should.be.fulfilled;
        schema.validate({ c: 1 }).should.be.rejected;
        return schema.validate([{ a: 1 }]).should.be.fulfilled;
      });
    });
    describe('not', async function () {
      it('should validate with not', async function () {
        const schema = await jp.create(
          {
            not: {
              type: 'string',
            },
          },
          { scope: 'http://example.com' }
        );
        await schema.validate(true).should.be.fulfilled;
        await schema.validate(1).should.be.fulfilled;
        return schema.validate('test').should.be.rejectedWith(jp.ValidationError, 'not');
      });
    });
  });

  describe('default', function () {
    it('should not add default values if the option is not set', async function () {
      const schema = await jp.create(
        {
          default: 5,
        },
        { scope: 'http://example.com' }
      );
      await schema.validate(null).should.eventually.equal(null);
      await schema.validate(undefined).should.eventually.equal(undefined);
    });
    it('should return the default value if the option is set', async function () {
      const schema = await jp.create(
        {
          default: 5,
        },
        { scope: 'http://example.com' }
      );
      await schema.validate(null, { setDefault: true }).should.eventually.equal(null);
      await schema.validate(undefined, { setDefault: true }).should.eventually.equal(5);
    });
    it('should return the first default value when multiple schemas are validated', async function () {
      const schema = await jp.create(
        {
          type: 'object',
          properties: {
            a: {
              default: 1,
            },
            b: {
              default: 2,
            },
            d: {
              default: undefined,
            },
          },
          allOf: [
            {
              properties: {
                a: {
                  default: 3,
                },
                c: {
                  default: 4,
                },
              },
            },
            {
              properties: {
                c: {
                  default: 5,
                },
              },
            },
          ],
        },
        { scope: 'http://example.com' }
      );
      const res = await schema.validate({}, { setDefault: true });
      res.a.should.equal(1);
      res.b.should.equal(2);
      res.c.should.equal(4);
    });
    it('should ignore clauses not relevant for a type', async function () {
      const schema = await jp.create(
        {
          type: 'object',
          properties: {
            a: {
              type: 'string',
              multipleOf: 1,
              maximum: 1,
              minimum: 1,
              exclusiveMinimum: 1,
              exclusiveMaximum: 1,
            },
            b: {
              type: 'number',
              maxLength: 1,
              minLength: 1,
              pattern: 'a',
              format: 'uri',
              maxItems: 1,
              contains: {},
              maxProperties: 1,
              minProperties: 1,
              required: ['c'],
              properties: {},
              patternProperties: {},
              additionalProperties: {},
              propertyNames: {},
              dependencies: {},
            },
          },
        },
        { scope: 'http://example.com' }
      );
      return schema.validate({ a: 'test', b: 0 });
    });
  });
});
