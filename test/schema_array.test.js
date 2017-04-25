const chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , ArraySchema = require('../dist/schema_array').ArraySchema

chai.use(spies);

describe('ArraySchema', function() {

  describe('validate', function() {

    let  s = new ArraySchema({
      type: 'array',
      minItems: 3,
      maxItems: 6,
      uniqueItems: true
    }, {});

    it('should reject if not an array and not a string', function() {
      return s.validate(1).should.be.rejectedWith(global.ValidationError, 'type');
    });

    it('should reject if data is a string and collectionFormat is unsupported', function() {
      let  s = new ArraySchema({
        type: 'array',
        collectionFormat: 'aaa'
      }, {});
      return s.validate('a').should.be.rejectedWith(global.SchemaError, 'collectionFormat');
    });

    it('should reject if minItems not fulfilled', function() {
      return s.validate([ 1, 2 ]).should.be.rejectedWith(global.ValidationError, 'minItems');
    });

    it('should reject if maxItems not fulfilled', function() {
      return s.validate([ 1, 1, 1, 1, 1, 1, 1 ]).should.be.rejectedWith(global.ValidationError, 'maxItems');
    });

    it('should reject if exclusive uniqueItems not fulfilled', function() {
      return s.validate([ 1, 1, 1, 1, 1 ]).should.be.rejectedWith(global.ValidationError, 'uniqueItems');
    });

    it('should reject if the items don\'t match a list of schemas', function() {
      let  s = new ArraySchema({
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
      return Promise.all([
        s.validate([ 1, 2, 3, 4 ]).should.be.rejectedWith(global.ValidationError),
        s.validate([ '1', 2, 3, 4 ]).should.be.rejectedWith(global.ValidationError),
        s.validate([ '1', 2, true, 4 ]).should.be.fulfilled
      ]);
    });

    it('should reject if the items exceed a list of specified items and additionalItems is false', function() {
      let  s = new ArraySchema({
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
      return s.validate([ '1', 2, true, 4 ]).should.be.rejectedWith(global.ValidationError);
    });

    it('should reject if the items exceed a list of specified items and do not validate additionalItems', function() {
      let  s = new ArraySchema({
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
      return Promise.all([
        s.validate([ '1', 2, true, 4 ]).should.be.rejectedWith(global.ValidationError),
        s.validate([ '1', 2, true, null ]).should.be.fulfilled
      ]);
    });

    it('should reject if the items do not validate items', function() {
      let  s = new ArraySchema({
        type: 'array',
        minItems: 3,
        maxItems: 6,
        uniqueItems: true,
        items: { type: 'string' }
      }, {});
      s.init();
      return Promise.all([
        s.validate([ '1', 2, true ]).should.be.rejectedWith(global.ValidationError),
        s.validate([ '1', '2', 'true' ]).should.be.fulfilled
      ]);
    });

    it('should reject if items is neither an array nor an object', function() {
      let  s = new ArraySchema({
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

    it('should reject if additionalItems is neither an object nor a boolean', function() {
      let  s = new ArraySchema({
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
      let  a = [ 'a', 'b', 'c' ];
      return s.validate(a).should.eventually.deep.equal(a);
    });

    it('should successfully validate an array represented as string fulfilling all the criteria', function() {
      return s.validate('a,b,c').should.eventually.have.length(3);
    });

  });

});
