const chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , NumberSchema = require('../dist/schema_number').NumberSchema

chai.use(spies);

describe('NumberSchema', function() {

  describe('validate', function() {

    let s = new NumberSchema({
      type: 'number',
      multipleOf: 3,
      minimum: 6,
      maximum: 27
    }, {});

    it('should throw if not a number', function() {
      return s.validate('ciao').should.be.rejectedWith(global.ValidationError, 'type');
    });

    it('should throw if NaN', function() {
      return s.validate(12 - 'a').should.be.rejectedWith(global.ValidationError, 'type');
    });

    it('should throw if multipleOf not fulfilled', function() {
      return s.validate(4).should.be.rejectedWith(global.ValidationError, 'multipleOf');
    });

    it('should throw if minimum not fulfilled', function() {
      return s.validate(3).should.be.rejectedWith(global.ValidationError, 'minimum');
    });

    it('should throw if exclusive minimum not fulfilled', function() {
      let s = new NumberSchema({
        type: 'number',
        minimum: 6,
        exclusiveMinimum: true
      }, {});
      return s.validate(6).should.be.rejectedWith(global.ValidationError, 'minimum');
    });

    it('should throw if maximum not fulfilled', function() {
      return s.validate(30).should.be.rejectedWith(global.ValidationError, 'maximum');
    });

    it('should throw if exclusive maximum not fulfilled', function() {
      let s = new NumberSchema({
        type: 'number',
        maximum: 27,
        exclusiveMaximum: true
      }, {});
      return s.validate(27).should.be.rejectedWith(global.ValidationError, 'maximum');
    });

    it('should successfully validate a number fulfilling all the criteria', function() {
      return s.validate(12.0).should.eventually.equal(12.0);
    });

    it('should successfully validate a number represented as string fulfilling all the criteria', function() {
      return s.validate('12').should.eventually.equal(12);
    });

  });

});
