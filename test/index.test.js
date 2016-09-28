var chai = require('chai')
  , spies = require('chai-spies')
  , chaiAsPromised = require('chai-as-promised')
  , should = chai.should()
  , jp = require('../dist/index')

chai.use(spies);
chai.use(chaiAsPromised);

describe('jsonpolice', function() {

  describe('create', function() {

    it('should throw a SchemaError when called with no args'/*, function() {
      should.throw(function() {
        jp.create();
      }, jp.SchemaError, 'no_data');
    }*/);

    it('should create a Schema'/*, function() {
      var data = {};
      return jp.create(data).then(function(s) {
        should.exist(s);
        should.exist(s.opts);
        should.exist(s.opts.store);
        should.exist(s.opts.store['#']);
        s.opts.store['#'].should.equal(data);
      });
    }*/);

    it('should return the passed data when creating a schema from data already used to create a schema'/*, function() {
      var data = {};
      return jp.create(data).then(function(s1) {
        should.exist(s1);
        return jp.create(s1).then(function(s2) {
          should.exist(s2);
          s2.should.equal(s1);
        });
      });
    }*/);

  });

  describe('flatten', function() {

  });

  describe('getVersion', function() {

  });

  describe('addVersion', function() {

  });

  describe('fireValidationError', function() {

    it('should fire a ValidationError', function() {
      should.throw(function() {
        jp.fireValidationError('a', 'b', 'c');
      }, jp.ValidationError, 'c');
    });

  });

});
