var chai = require('chai')
  , spies = require('chai-spies')
  , chaiAsPromised = require('chai-as-promised')
  , should = chai.should()
  , versions = require('../dist/versions')

chai.use(spies);
chai.use(chaiAsPromised);

describe('versions', function() {

  describe('parseKnown', function() {

    it('should return a object with a single known server and it should parse only once', function() {
      return versions.parseKnown().then(function(data) {
        data.should.have.property('http://json-schema.org/draft-04/schema#');
        Object.keys(data).should.have.length(1);
        return versions.parseKnown().then(function(data2) {
          data2.should.equal(data);
        });
      });
    });

  });

  describe('add', function() {

    it('should not add a new valid schema without scope', function() {
      return versions.add({}).then(function() {
        return versions.parseKnown().then(function(data) {
          Object.keys(data).should.have.length(1);
        });
      });
    });

    it('should add a new valid schema with explicit scope', function() {
      return versions.add({
        id: 'test1',
      }).then(function() {
        return versions.parseKnown().then(function(data) {
          data.should.have.property('test1#');
          Object.keys(data).should.have.length(2);
        });
      });
    });

    it('should add a new valid schema with implicit scope', function() {
      return versions.add({
      }, {
        scope: 'test2'
      }).then(function() {
        return versions.parseKnown().then(function(data) {
          data.should.have.property('test2#');
          Object.keys(data).should.have.length(3);
          return versions.get('test2#').should.eventually.equal(data['test2#']);
        });
      });
    });

  });

  describe('get', function() {

    it('should return the default schema version when called with no args', function() {
      versions.reset();
      return versions.get().should.eventually.have.property('id').equal('http://json-schema.org/draft-04/schema#');
    });

    it('should return add a new schema when called with a schema with an explicit scope', function() {
      return versions.get({
        id: 'test3'
      }).then(function() {
        return versions.parseKnown().then(function(data) {
          data.should.have.property('test3#');
          Object.keys(data).should.have.length(2);
        });
      });
    });

    it('should return add a new schema when called with a schema with an implicit scope', function() {
      return versions.get({
      }, {
        scope: 'test4'
      }).then(function() {
        return versions.parseKnown().then(function(data) {
          data.should.have.property('test4#');
          Object.keys(data).should.have.length(3);
        });
      });
    });

  });
});
