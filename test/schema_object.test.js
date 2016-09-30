var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , ObjectSchema = require('../dist/schema_object').ObjectSchema

chai.use(spies);

describe('ObjectSchema', function() {

  describe('validate', function() {

    var s = new ObjectSchema({
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
      should.throw(function() {
        s.validate(1);
      }, global.ValidationError, 'type');
      should.throw(function() {
        s.validate([ 1 ]);
      }, global.ValidationError, 'type');
    });

    it('should throw if minProperties not fulfilled', function() {
      should.throw(function() {
        s.validate({ a: 1, b: true });
      }, global.ValidationError, 'minProperties');
    });

    it('should throw if maxProperties not fulfilled', function() {
      should.throw(function() {
        s.validate({ a: 1, b: true, c: 'hi', z1: 1, z2: 2, z3: 3 });
      }, global.ValidationError, 'maxProperties');
    });

    it('should throw if a required property is missing', function() {
      should.throw(function() {
        s.validate({ a: 1, c: 'hi', z1: 1, z2: 2, z3: 3 });
      }, global.ValidationError, 'required');
    });

    it('should throw if a property if of the wrong type', function() {
      should.throw(function() {
        s.validate({ a: null, b: true, c: 'hi' });
      }, global.ValidationError, 'type');
      should.throw(function() {
        s.validate({ a: 1, b: null, c: 'hi' });
      }, global.ValidationError, 'type');
      should.throw(function() {
        s.validate({ a: 1, b: true, c: null });
      }, global.ValidationError, 'type');
      should.throw(function() {
        s.validate({ a: 1, b: true, c: 'hi', d: null });
      }, global.ValidationError, 'type');
      should.throw(function() {
        s.validate({ a: 1, b: true, c: 'hi', d: { e: null } });
      }, global.ValidationError, 'type');
      should.throw(function() {
        s.validate({ a: 1, b: true, c: 'hi', d: { e: 1 }, f: null });
      }, global.ValidationError, 'type');
      should.not.throw(function() {
        s.validate({ a: 1, b: true, c: 'hi', d: { e: 1 }, f: { } });
      });
    });

    it('should throw if a pattern property if of the wrong type', function() {
      should.throw(function() {
        s.validate({ a: 1, b: true, xtest: true });
      }, global.ValidationError, 'type');
      should.not.throw(function() {
        s.validate({ a: 1, b: true, xtest: {} });
      });
    });

    it('should not throw additionalProperties is not set and an additional property is found', function() {
      should.not.throw(function() {
        s.validate({ a: 1, b: true, test: true });
      });
      var s1 = new ObjectSchema({
        type: 'object',
        properties: {}
      }, {});
      s1.init();
      should.not.throw(function() {
        s1.validate({ test: true });
      });
    });

    it('should throw if an additional property if of the wrong type', function() {
      var s = new ObjectSchema({
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

      should.throw(function() {
        s.validate({ a: 1, b: true });
      }, global.ValidationError, 'type');
      should.not.throw(function() {
        s.validate({ a: 1, b: {} });
      });
    });

    it('should throw if additionalProperty is false, the option removeAdditional is not true and an additional property is encountered', function() {
      var s = new ObjectSchema({
        type: 'object',
        properties: {
          a: {
            type: 'integer'
          },
        },
        additionalProperties: false
      }, {});
      s.init();

      should.throw(function() {
        s.validate({ a: 1, b: true });
      }, global.ValidationError, 'property');
    });

    it('should not throw if additionalProperty is false, the option removeAdditional is true and an additional property is encountered', function() {
      var s = new ObjectSchema({
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

      var data = s.validate({ a: 1, b: true })
      data.should.have.property('a');
      data.should.not.have.property('b');
    });

    it('should throw if additionalProperty is neither a boolean nor an object', function() {
      var s = new ObjectSchema({
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
      var s = new ObjectSchema({
        type: 'object',
        dependencies: {
          a: [ 'b', 'c' ]
        }
      }, {});
      s.init();

      should.throw(function() {
        s.validate({ a: 1, b: true });
      }, global.ValidationError, 'dependencies');
      should.not.throw(function() {
        s.validate({ a: 1, b: true, c: null });
      }, global.ValidationError, 'dependencies');
      should.not.throw(function() {
        s.validate({ b: true, c: null });
      }, global.ValidationError, 'dependencies');
    });

    it('should throw if a schema dependency is not met', function() {
      var s = new ObjectSchema({
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

      should.throw(function() {
        s.validate({ a: 3 });
      }, global.ValidationError, 'minimum');
    });

    it('should return not return the default if a value is set', function() {
      var data = s.validate({ a: 1, b: true, c: 'hi' });
      data.c.should.equal('hi');
    });

    it('should return not return the default if a value is not set', function() {
      var data = s.validate({ a: 1, b: true, z: 1 });
      data.should.have.ownPropertyDescriptor('c').to.have.property('enumerable', false);
      data.should.have.ownPropertyDescriptor('d').to.have.property('enumerable', false);
      data.c.should.equal('test');
      data.d.e.should.equal(5);
    });

    it('should allow resetting a default value', function() {
      var data = s.validate({ a: 1, b: true, z: 1 });
      data.c = 'aaa';
      data.should.have.ownPropertyDescriptor('c').to.have.property('enumerable', true);
      data.c.should.equal('aaa');
      data.d.e = 10;
      data.should.have.ownPropertyDescriptor('d').to.have.property('enumerable', true);
      data.d.e.should.equal(10);
    });

  });

});
