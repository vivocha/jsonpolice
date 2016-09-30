var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , NullSchema = require('../dist/schema_null').NullSchema

chai.use(spies);

describe('NullSchema', function() {

  describe('validate', function() {

    var s = new NullSchema({
      type: 'null'
    }, {});

    it('should throw if not null', function() {
      should.throw(function() {
        s.validate('ciao');
      }, global.ValidationError, 'type');
    });

    it('should validate a null', function() {
      should.not.exist(s.validate(null));
    });

  });

});
