var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , ArraySchema = require('../dist/schema_array').ArraySchema

chai.use(spies);

describe('ArraySchema', function() {

  describe('validate', function() {

    var s = new ArraySchema({
      type: 'array',
      minItems: 3,
      maxItems: 6,
      uniqueItems: true
    }, {});

    it('should throw if not an array and not a string', function() {
      should.throw(function() {
        s.validate(1);
      }, global.ValidationError, 'type');
    });

    it('should throw if data is a string and collectionFormat is unsupported', function() {
      var s = new ArraySchema({
        type: 'array',
        collectionFormat: 'aaa'
      }, {});
      should.throw(function() {
        s.validate('a');
      }, global.SchemaError, 'collectionFormat');
    });

    it('should throw if minItems not fulfilled', function() {
      should.throw(function() {
        s.validate([ 1, 2 ]);
      }, global.ValidationError, 'minItems');
    });

    it('should throw if maxItems not fulfilled', function() {
      should.throw(function() {
        s.validate([ 1, 1, 1, 1, 1, 1, 1 ]);
      }, global.ValidationError, 'maxItems');
    });

    it('should throw if exclusive uniqueItems not fulfilled', function() {
      should.throw(function() {
        s.validate([ 1, 1, 1, 1, 1 ]);
      }, global.ValidationError, 'uniqueItems');
    });

    it('should throw if the items don\'t match a list of schemas', function() {
      var s = new ArraySchema({
        type: 'array',
        minItems: 3,
        maxItems: 6,
        uniqueItems: true,
        items: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' }
        ]
      }, {});
      s.init();
      should.throw(function() {
        s.validate([ 1, 2, 3, 4 ]);
      }, global.ValidationError);
      should.throw(function() {
        s.validate([ '1', 2, 3, 4 ]);
      }, global.ValidationError);
      should.not.throw(function() {
        s.validate([ '1', 2, true, 4 ]);
      }, global.ValidationError);
    });

    it('should throw if the items exceed a list of specified items and additionalItems is false', function() {
      var s = new ArraySchema({
        type: 'array',
        minItems: 3,
        maxItems: 6,
        uniqueItems: true,
        items: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' }
        ],
        additionalItems: false
      }, {});
      s.init();
      should.throw(function() {
        s.validate([ '1', 2, true, 4 ]);
      }, global.ValidationError);
    });

    it('should throw if the items exceed a list of specified items and do not validate additionalItems', function() {
      var s = new ArraySchema({
        type: 'array',
        minItems: 3,
        maxItems: 6,
        uniqueItems: true,
        items: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' }
        ],
        additionalItems: { type: 'null' }
      }, {});
      s.init();
      should.throw(function() {
        s.validate([ '1', 2, true, 4 ]);
      }, global.ValidationError);
      should.not.throw(function() {
        s.validate([ '1', 2, true, null ]);
      }, global.ValidationError);
    });

    it('should throw if the items do not validate items', function() {
      var s = new ArraySchema({
        type: 'array',
        minItems: 3,
        maxItems: 6,
        uniqueItems: true,
        items: { type: 'string' }
      }, {});
      s.init();
      should.throw(function() {
        s.validate([ '1', 2, true ]);
      }, global.ValidationError);
      should.not.throw(function() {
        s.validate([ '1', '2', 'true' ]);
      }, global.ValidationError);
    });

    it('should throw if items is neither an array nor an object', function() {
      var s = new ArraySchema({
        type: 'array',
        minItems: 3,
        maxItems: 6,
        uniqueItems: true,
        items: 5
      }, {});
      should.throw(function() {
        s.init();
      }, global.SchemaError, 'items');
    });

    it('should throw if additionalItems is neither an object nor a boolean', function() {
      var s = new ArraySchema({
        type: 'array',
        minItems: 3,
        maxItems: 6,
        uniqueItems: true,
        additionalItems: 5
      }, {});
      should.throw(function() {
        s.init();
      }, global.SchemaError, 'additionalItems');
    });

    it('should successfully validate an array fulfilling all the criteria', function() {
      var a = [ 'a', 'b', 'c' ];
      s.validate(a).should.equal(a);
    });

    it('should successfully validate an array represented as string fulfilling all the criteria', function() {
      var a = s.validate('a,b,c');
      a.should.be.a.instanceOf(Array);
      a.should.have.length(3);
    });

  });

});
