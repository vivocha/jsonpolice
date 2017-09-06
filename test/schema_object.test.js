const chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , ObjectSchema = require('../dist/schema_object').ObjectSchema

chai.use(spies);

describe('ObjectSchema', function() {

  describe('validate', function() {

    let s = new ObjectSchema({
      type: 'object',
      minProperties: 3,
      maxProperties: 5,
      required: [ 'a', 'b' ],
      properties: {
        a: {
          type: 'integer'
        },
        b: {
          type: 'boolean'
        },
        c: {
          type: 'string',
          default: 'test'
        },
        d: {
          type: 'object',
          default: {},
          properties: {
            e: {
              type: 'integer',
              default: 5
            }
          }
        },
        f: {
          type: 'object'
        }
      },
      patternProperties: {
        '^x': {
          type: 'object'
        }
      }
    }, {});
    s.init();

    it('should throw if not an object', function() {
      return Promise.all([
        s.validate(1).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate([ 1 ]).should.be.rejectedWith(global.ValidationError, 'type')
      ]);
    });

    it('should throw if minProperties not fulfilled', function() {
      return s.validate({ a: 1, b: true }).should.be.rejectedWith(global.ValidationError, 'minProperties');
    });

    it('should throw if maxProperties not fulfilled', function() {
      return s.validate({ a: 1, b: true, c: 'hi', z1: 1, z2: 2, z3: 3 }).should.be.rejectedWith(global.ValidationError, 'maxProperties');
    });

    it('should throw if a required property is missing', function() {
      return s.validate({ a: 1, c: 'hi', z1: 1, z2: 2, z3: 3 }).should.be.rejectedWith(global.ValidationError, 'required');
    });

    it('should throw if a property if of the wrong type', function() {
      return Promise.all([
        s.validate({ a: null, b: true, c: 'hi' }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: null, c: 'hi' }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: true, c: null }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: true, c: 'hi', d: null }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: true, c: 'hi', d: { e: null } }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: true, c: 'hi', d: { e: 1 }, f: null }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: true, c: 'hi', d: { e: 1 }, f: { } }).should.be.fulfilled
      ]);
    });

    it('should throw if a pattern property if of the wrong type', function() {
      return Promise.all([
        s.validate({ a: 1, b: true, xtest: true }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: true, xtest: {} }).should.be.fulfilled
      ]);
    });

    it('should not throw additionalProperties is not set and an additional property is found', function() {
      let s1 = new ObjectSchema({
        type: 'object',
        properties: {}
      }, {});
      s1.init();
      return Promise.all([
        s1.validate({ test: true }).should.be.fulfilled,
        s.validate({ a: 1, b: true, test: true }).should.be.fulfilled
      ]);
    });

    it('should throw if an additional property if of the wrong type', function() {
      let s = new ObjectSchema({
        type: 'object',
        properties: {
          a: {
            type: 'integer'
          },
        },
        additionalProperties: {
          type: 'object'
        }
      }, {});
      s.init();
      return Promise.all([
        s.validate({ a: 1, b: true }).should.be.rejectedWith(global.ValidationError, 'type'),
        s.validate({ a: 1, b: {} }).should.be.fulfilled
      ]);
    });

    it('should throw if additionalProperty is false, the option removeAdditional is not true and an additional property is encountered', function() {
      let s = new ObjectSchema({
        type: 'object',
        properties: {
          a: {
            type: 'integer'
          },
        },
        additionalProperties: false
      }, {});
      s.init();
      return s.validate({ a: 1, b: true }).should.be.rejectedWith(global.ValidationError, 'property');
    });

    it('should not throw if additionalProperty is false, the option removeAdditional is true and an additional property is encountered', function() {
      let s = new ObjectSchema({
        type: 'object',
        properties: {
          a: {
            type: 'integer'
          },
        },
        additionalProperties: false
      }, {
        removeAdditional: true
      });
      s.init();

      let data = s.validate({ a: 1, b: true });
      return Promise.all([
        data.should.eventually.have.property('a'),
        data.should.eventually.not.have.property('b')
      ]);
    });

    it('should throw if additionalProperty is neither a boolean nor an object', function() {
      let s = new ObjectSchema({
        type: 'object',
        properties: {
          a: {
            type: 'integer'
          },
        },
        additionalProperties: 1
      }, {});

      should.throw(function() {
        s.init();
      }, global.SchemaError, 'additionalProperties');
    });

    it('should throw if an array of dependencies is not met', function() {
      let s = new ObjectSchema({
        type: 'object',
        dependencies: {
          a: [ 'b', 'c' ]
        }
      }, {});
      s.init();
      return Promise.all([
        s.validate({ a: 1, b: true }).should.be.rejectedWith(global.ValidationError, 'dependencies'),
        s.validate({ a: 1, b: true, c: null }).should.be.fulfilled,
        s.validate({ b: true, c: null }).should.be.fulfilled
      ]);
    });

    it('should throw if a schema dependency is not met', function() {
      let s = new ObjectSchema({
        type: 'object',
        properties: {
          a: {
            type: 'number'
          }
        },
        dependencies: {
          a: {
            type: 'number',
            minimum: 5
          }
        }
      }, {});
      s.init();
      return s.validate({ a: 3 }).should.be.rejectedWith(global.ValidationError, 'minimum');
    });

    it('should not return the default if a value is set', function() {
      let data = s.validate({ a: 1, b: true, c: 'hi' });
      return data.should.eventually.have.property('c', 'hi');
    });

    it('should return the default if a value is not set', async function() {
      let data = await s.validate({ a: 1, b: true, z: 1 });
      return Promise.all([
        data.should.have.ownPropertyDescriptor('c').to.have.property('enumerable', false),
        data.should.have.ownPropertyDescriptor('d').to.have.property('enumerable', false),
        data.c.should.equal('test'),
        data.d.e.should.equal(5)
      ]);
    });

    it('should allow resetting a default value', function() {
      return s.validate({ a: 1, b: true, z: 1 }).then(data => {
        data.c = 'aaa';
        data.should.have.ownPropertyDescriptor('c').to.have.property('enumerable', true);
        data.c.should.equal('aaa');
        data.d.e = 10;
        data.should.have.ownPropertyDescriptor('d').to.have.property('enumerable', true);
        data.d.e.should.equal(10);
      });
    });

  });

});
