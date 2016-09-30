var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , IntegerSchema = require('../dist/schema_integer').IntegerSchema

chai.use(spies);

describe('IntegerSchema', function() {

  describe('validate', function() {

    var s = new IntegerSchema({
      type: 'number',
      minimum: 3,
      maximum: 5
    }, {});

    it('should throw if not a integer', function() {
      should.throw(function() {
        s.validate(3.5);
      }, global.ValidationError, 'type');
    });

    it('should successfully validate an integer fulfilling all the criteria', function() {
      s.validate(3).should.equal(3);
    });

  });

});
