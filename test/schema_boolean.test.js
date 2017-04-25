const chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , BooleanSchema = require('../dist/schema_boolean').BooleanSchema

chai.use(spies);

describe('BooleanSchema', function() {

  describe('validate', function() {

    let s = new BooleanSchema({
      type: 'boolean'
    }, {});

    it('should throw if not a boolean', function() {
      return s.validate('ciao').should.be.rejectedWith(global.ValidationError, 'type');
    });

    it('should validate a \'true\' and \'1\' as true', function() {
      return Promise.all([
        s.validate('true').should.eventually.equal(true),
        s.validate('1').should.eventually.equal(true)
      ]);
    });

    it('should validate a \'false\' and \'0\' as false', function() {
      return Promise.all([
        s.validate('false').should.eventually.equal(false),
        s.validate('0').should.eventually.equal(false)
      ]);
    });

    it('should validate a boolean', function() {
      return Promise.all([
        s.validate(true).should.eventually.equal(true),
        s.validate(false).should.eventually.equal(false)
      ]);
    });
  });

});
