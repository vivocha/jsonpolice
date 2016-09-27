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
  
});
