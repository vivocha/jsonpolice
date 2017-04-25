const chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , NullSchema = require('../dist/schema_null').NullSchema

chai.use(spies);

describe('NullSchema', function() {

  describe('validate', function() {

    let s = new NullSchema({
      type: 'null'
    }, {});

    it('should throw if not null', function() {
      return s.validate('ciao').should.be.rejectedWith(global.ValidationError, 'type');
    });

    it('should validate a null', function() {
      return s.validate(null).should.eventually.equal(null);
    });

  });

});
