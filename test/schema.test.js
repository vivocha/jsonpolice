var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , Schema = require('../dist/schema').Schema

chai.use(spies);

describe('Schema', function() {

  describe('create', function() {

    it('should throw a SchemaError when called with no data', function() {
      should.throw(function() {
        Schema.create();
      }, global.SchemaError, 'no_data');
    });

    it('should create a Schema when called with an empty object', function() {
      var data = {};
      var s = Schema.create(data);
      should.exist(s);
      should.exist(s.opts);
      should.exist(data[global.__schema]);
      data[global.__schema].should.equal(s);
    });

    it('should return the passed data when creating a schema from data already used to create a schema', function() {
      var data = {};
      var s1 = Schema.create(data);
      should.exist(s1);
      var s2 = Schema.create(data);
      should.exist(s2);
      s1.should.equal(s2);
    });

    it('should throw a SchemaError when called with a bad type', function() {
      should.throw(function() {
        Schema.create({ type: 'pippo' });
      }, global.SchemaError, 'type');
    });

    it('should create a ArraySchema when called with type array', function() {
      var s = Schema.create({ type: 'array' });
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.be.a.instanceOf(Schema.factories['array']);
      s.should.not.be.a.instanceOf(Schema.factories['boolean']);
      s.should.not.be.a.instanceOf(Schema.factories['integer']);
      s.should.not.be.a.instanceOf(Schema.factories['null']);
      s.should.not.be.a.instanceOf(Schema.factories['number']);
      s.should.not.be.a.instanceOf(Schema.factories['object']);
      s.should.not.be.a.instanceOf(Schema.factories['string']);
    });

    it('should create a BooleanSchema when called with type boolean', function() {
      var s = Schema.create({ type: 'boolean' });
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.not.be.a.instanceOf(Schema.factories['array']);
      s.should.be.a.instanceOf(Schema.factories['boolean']);
      s.should.not.be.a.instanceOf(Schema.factories['integer']);
      s.should.not.be.a.instanceOf(Schema.factories['null']);
      s.should.not.be.a.instanceOf(Schema.factories['number']);
      s.should.not.be.a.instanceOf(Schema.factories['object']);
      s.should.not.be.a.instanceOf(Schema.factories['string']);
    });

    it('should create a IntegerSchema when called with type integer', function() {
      var s = Schema.create({ type: 'integer' });
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.not.be.a.instanceOf(Schema.factories['array']);
      s.should.not.be.a.instanceOf(Schema.factories['boolean']);
      s.should.be.a.instanceOf(Schema.factories['integer']);
      s.should.not.be.a.instanceOf(Schema.factories['null']);
      s.should.be.a.instanceOf(Schema.factories['number']);
      s.should.not.be.a.instanceOf(Schema.factories['object']);
      s.should.not.be.a.instanceOf(Schema.factories['string']);
    });

    it('should create a NullSchema when called with type null', function() {
      var s = Schema.create({ type: 'null' });
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.not.be.a.instanceOf(Schema.factories['array']);
      s.should.not.be.a.instanceOf(Schema.factories['boolean']);
      s.should.not.be.a.instanceOf(Schema.factories['integer']);
      s.should.be.a.instanceOf(Schema.factories['null']);
      s.should.not.be.a.instanceOf(Schema.factories['number']);
      s.should.not.be.a.instanceOf(Schema.factories['object']);
      s.should.not.be.a.instanceOf(Schema.factories['string']);
    });

    it('should create a NumberSchema when called with type number', function() {
      var s = Schema.create({ type: 'number' });
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.not.be.a.instanceOf(Schema.factories['array']);
      s.should.not.be.a.instanceOf(Schema.factories['boolean']);
      s.should.not.be.a.instanceOf(Schema.factories['integer']);
      s.should.not.be.a.instanceOf(Schema.factories['null']);
      s.should.be.a.instanceOf(Schema.factories['number']);
      s.should.not.be.a.instanceOf(Schema.factories['object']);
      s.should.not.be.a.instanceOf(Schema.factories['string']);
    });

    it('should create a ObjectSchema when called with type object', function() {
      var s = Schema.create({ type: 'object' });
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.not.be.a.instanceOf(Schema.factories['array']);
      s.should.not.be.a.instanceOf(Schema.factories['boolean']);
      s.should.not.be.a.instanceOf(Schema.factories['integer']);
      s.should.not.be.a.instanceOf(Schema.factories['null']);
      s.should.not.be.a.instanceOf(Schema.factories['number']);
      s.should.be.a.instanceOf(Schema.factories['object']);
      s.should.not.be.a.instanceOf(Schema.factories['string']);
    });

    it('should create a StringSchema when called with type string', function() {
      var s = Schema.create({ type: 'string' });
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.not.be.a.instanceOf(Schema.factories['array']);
      s.should.not.be.a.instanceOf(Schema.factories['boolean']);
      s.should.not.be.a.instanceOf(Schema.factories['integer']);
      s.should.not.be.a.instanceOf(Schema.factories['null']);
      s.should.not.be.a.instanceOf(Schema.factories['number']);
      s.should.not.be.a.instanceOf(Schema.factories['object']);
      s.should.be.a.instanceOf(Schema.factories['string']);
    });

    it('should create a Schema with anyOf when called with an array of valid types', function() {
      var s = Schema.create({ type: [ 'object', 'string' ] });
      should.exist(s);
      should.exist(s.data);
      should.exist(s.data.anyOf);
      s.data.anyOf.should.and.have.length(2);
      should.exist(s.data.anyOf[0][global.__schema]);
      should.exist(s.data.anyOf[1][global.__schema]);
      s.data.anyOf[0][global.__schema].should.a.instanceOf(Schema.factories['object']);
      s.data.anyOf[1][global.__schema].should.a.instanceOf(Schema.factories['string']);
    });

    it('should throw a SchemaError when called with an array of types, some of which not valid', function() {
      should.throw(function() {
        Schema.create({ type: [ 'object', 'pippo' ] });
      }, global.SchemaError, 'type');
    });

  });

  describe('flatten', function() {

    it('should do nothing when called with no data', function () {
      should.not.exist(Schema.flatten());
    });

    it('should do nothing when called with data not containing an allOf', function () {
      var a = {};
      var b = Schema.flatten(a);
      should.exist(b);
      b.should.equal(a);
    });

    it('should return a new object called with data containing an empty allOf', function () {
      var a = {
        allOf: []
      };
      var b = Schema.flatten(a);
      should.exist(b);
      b.should.not.equal(a);
    });

    it('should preserve id and $schema of the top level object', function () {
      var a = {
        id: 'a',
        $schema: 'b',
        allOf: [{
          id: 'c',
          $schema: 'd',
        }]
      };
      var b = Schema.flatten(a);
      should.exist(b);
      b.should.not.equal(a);
      should.exist(b.id);
      b.id.should.equal(a.id);
      should.exist(b.$schema);
      b.$schema.should.equal(a.$schema);
    });

    it('should use the last one of: title, format, description, multipleOf, pattern (top level is last)', function () {
      var a1 = {
        allOf: [
          {
            title: 'title2',
            format: 'format2',
            description: 'description2',
            multipleOf: 2,
            pattern: /p2/,
          }, {
            title: 'title3',
            format: 'format3',
            description: 'description3',
            multipleOf: 3,
            pattern: /p3/,
          }
        ]
      };
      var a2 = {
        title: 'title1',
        format: 'format1',
        description: 'description1',
        multipleOf: 1,
        pattern: /p1/,
        allOf: [
          {
            title: 'title2',
            format: 'format2',
            description: 'description2',
            multipleOf: 2,
            pattern: /p2/,
          }, {
            title: 'title3',
            format: 'format3',
            description: 'description3',
            multipleOf: 3,
            pattern: /p3/,
          }
        ]
      };
      var b = Schema.flatten(a1);
      b.title.should.equal(a1.allOf[1].title);
      b.format.should.equal(a1.allOf[1].format);
      b.description.should.equal(a1.allOf[1].description);
      b.multipleOf.should.equal(a1.allOf[1].multipleOf);
      b.pattern.should.equal(a1.allOf[1].pattern);

      b = Schema.flatten(a2);
      b.title.should.equal(a2.title);
      b.format.should.equal(a2.format);
      b.description.should.equal(a2.description);
      b.multipleOf.should.equal(a2.multipleOf);
      b.pattern.should.equal(a2.pattern);
    });

    it('should merge each property with its specific rules');

  });

  describe('validate', function() {

    it('should validate an empty schema', function() {
      var s = new Schema({}, {});
      s.validate(1).should.equal(1);
      should.not.exist(s.validate());
    });

    describe('type', function() {
      it('should throw on a basic Schema instance', function() {
        should.throw(function() {
          var s = new Schema({ type: 'x' }, {});
          s.validate({});
        }, global.SchemaError, 'type');
      });
    });

    describe('enum', function() {
      it('should throw if the (scalar) value is not included in the enum', function() {
        var s = new Schema({ enum: [ 'a', true, 5 ] }, {});
        s.validate('a').should.equal('a');
        s.validate(true).should.equal(true);
        s.validate(5).should.equal(5);
        should.throw(function() {
          s.validate('b');
        }, global.ValidationError, 'enum');
      });
    });

    describe('allOf', function() {
    });

    describe('anyOf', function() {
    });

    describe('oneOf', function() {
    });

    describe('not', function() {
    });

  });

});
