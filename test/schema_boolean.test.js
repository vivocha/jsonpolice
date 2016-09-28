var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , BooleanSchema = require('../dist/schema_boolean').BooleanSchema

chai.use(spies);

describe('BooleanSchema', function() {

  describe('validate', function() {

    var s = new BooleanSchema({
      type: 'boolean'
    }, {});

    it('should throw if not a boolean', function() {
      should.throw(function() {
        s.validate('ciao');
      }, global.ValidationError, 'type');
    });

    it('should validate a \'true\' and \'1\' as true', function() {
      s.validate('true').should.equal(true);
      s.validate('1').should.equal(true);
    });

    it('should validate a \'false\' and \'0\' as false', function() {
      s.validate('false').should.equal(false);
      s.validate('0').should.equal(false);
    });

    it('should validate a boolean', function() {
      s.validate(true).should.equal(true);
      s.validate(false).should.equal(false);
    });
  });

});
