var chai = require('chai')
  , spies = require('chai-spies')
  , chaiAsPromised = require('chai-as-promised')
  , should = chai.should()
  , jp = require('../dist/index')
  , global = require('../dist/global')
  , versions = require('../dist/versions')

chai.use(spies);
chai.use(chaiAsPromised);

describe('jsonpolice', function() {

  describe('create', function() {

    it('should throw a SchemaError when called with no args', function() {
      should.throw(function() {
        jp.create();
      }, jp.SchemaError, 'no_data');
    });

    it('should create a Schema', function() {
      var data = {};
      return jp.create(data).then(function(s) {
        should.exist(s);
        should.exist(s.opts);
        should.exist(s.opts.store);
        should.exist(s.opts.store['#']);
        data[global.__schema].should.equal(s);
        s.opts.store['#'].should.equal(data);
      });
    });

    it('should create a Schema with a scope and a store', function() {
      var opts = {
        scope: 'test',
        store: {}
      };
      var data = {
        id: 'pippo'
      };
      return jp.create(data, opts).then(function() {
        opts.store['test#'].should.equal(data);
        opts.store['pippo#'].should.equal(data);
      });
    });

    it('should create a known Schema by uri', function() {
      var opts = {
        scope: 'test',
        store: {}
      };
      var data = {};
      return jp.create(data, opts).then(function() {
        return jp.create('test', opts).then(function(s) {
          s.should.equal(data[global.__schema]);
        });
      });
    });

    it('should create a unknown Schema by uri', function() {
      var spy = chai.spy(function() {
        return Promise.resolve({ id: 'test' });
      });
      var opts = {
        store: {},
        retriever: spy
      };
      return jp.create('uriuriuri', opts).then(function(s) {
        spy.should.have.been.called.once();
        opts.store['test#'].should.deep.equal({ id: 'test'});
      });
    });

    it('should return the passed data when creating a schema from data already used to create a schema', function() {
      var data = {};
      return jp.create(data).then(function(s1) {
        should.exist(s1);
        return jp.create(data).then(function(s2) {
          should.exist(s2);
          s2.should.equal(s1);
        });
      });
    });

  });

  describe('flatten', function() {

    it('should flatten a schema', function() {
      var a1 = {
        allOf: [
          {
            type: 'number',
            default: 5,
            minimum: 1,
            maximum: 2,
            minLength: 1,
            maxLength: 2,
            exclusiveMinimum: true,
            exclusiveMaximum: true,
            required: [ 'a', 'b' ],
            definitions: {
              x: 1,
              y: 2
            },
            properties: {
              m: 1,
              n: 2
            },
            patternProperties: {
              m: 1,
              n: 2
            }
          }, {
            type: 'number',
            default: 6,
            minimum: 0,
            maximum: 3,
            minLength: 0,
            maxLength: 3,
            exclusiveMinimum: false,
            exclusiveMaximum: false,
            required: [ 'b', 'c' ],
            definitions: {
              y: 3,
              z: 4
            },
            properties: {
              n: 3,
              o: 4
            },
            patternProperties: {
              n: 3,
              o: 4
            }
          }
        ]
      };
      return jp.flatten(a1).then(function(b1) {
        b1.default.should.equal(5);
        b1.minimum.should.equal(1);
        b1.maximum.should.equal(2);
        b1.minLength.should.equal(1);
        b1.maxLength.should.equal(2);
        b1.exclusiveMinimum.should.equal(false);
        b1.exclusiveMaximum.should.equal(false);
        b1.required.should.have.length(3).and.deep.equal(['a', 'b', 'c']);
        b1.definitions.should.deep.equal({x: 1, y: 2, z: 4});
        b1.properties.should.deep.equal({m: 1, n: 2, o: 4});
        b1.patternProperties.should.deep.equal({m: 1, n: 2, o: 4});
      });
    });

  });

  describe('getVersion', function() {

    it('should get the default spec version', function() {
      var id = 'http://json-schema.org/draft-04/schema#';
      return jp.getVersion(id).then(function(s) {
        s.id.should.equal(id);
      });
    });

  });

  describe('addVersion', function() {

    afterEach(function() {
      versions.reset();
    });

    it('should allow adding a new spec version', function() {
      return jp.addVersion({
        id: 'test',
        type: 'number'
      }).then(function(s1) {
        return jp.getVersion('test').then(function(s2) {
          s2.should.equal(s1);
        });
      });
    });

  });

  describe('fireValidationError', function() {

    it('should fire a ValidationError', function() {
      should.throw(function() {
        jp.fireValidationError('a', 'b', 'c');
      }, jp.ValidationError, 'c');
    });

  });

});
