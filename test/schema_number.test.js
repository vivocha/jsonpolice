var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , NumberSchema = require('../dist/schema_number').NumberSchema

chai.use(spies);

describe('NumberSchema', function() {

  describe('validate', function() {

    var s = new NumberSchema({
      type: 'number',
      multipleOf: 3,
      minimum: 6,
      maximum: 27
    }, {});

    it('should throw if not a number', function() {
      should.throw(function() {
        s.validate('ciao');
      }, global.ValidationError, 'type');
    });

    it('should throw if NaN', function() {
      should.throw(function() {
        s.validate(12 - 'a');
      }, global.ValidationError, 'type');
    });

    it('should throw if multipleOf not fulfilled', function() {
      should.throw(function() {
        s.validate(4);
      }, global.ValidationError, 'multipleOf');
    });

    it('should throw if minimum not fulfilled', function() {
      should.throw(function() {
        s.validate(3);
      }, global.ValidationError, 'minimum');
    });

    it('should throw if exclusive minimum not fulfilled', function() {
      var s = new NumberSchema({
        type: 'number',
        minimum: 6,
        exclusiveMinimum: true
      }, {});

      should.throw(function() {
        s.validate(6);
      }, global.ValidationError, 'minimum');
    });

    it('should throw if maximum not fulfilled', function() {
      should.throw(function() {
        s.validate(30);
      }, global.ValidationError, 'maximum');
    });

    it('should throw if exclusive maximum not fulfilled', function() {
      var s = new NumberSchema({
        type: 'number',
        maximum: 27,
        exclusiveMaximum: true
      }, {});

      should.throw(function() {
        s.validate(27);
      }, global.ValidationError, 'maximum');
    });

    it('should successfully validate a number fulfilling all the criteria', function() {
      s.validate(12.0).should.equal(12.0);
    });

    it('should successfully validate a number represented as string fulfilling all the criteria', function() {
      s.validate('12').should.equal(12);
    });

  });

});
