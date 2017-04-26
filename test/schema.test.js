const chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , Schema = require('../dist/schema').Schema
  , UntypedSchema = require('../dist/schema').UntypedSchema
  , util = require('util')

chai.use(spies);

describe('Schema', function() {

  describe('create', function() {

    it('should throw a SchemaError when called with no data', function() {
      should.throw(function() {
        Schema.create();
      }, global.SchemaError, 'no_data');
    });

    it('should create a Schema when called with an empty object', function() {
      let data = {};
      let s = Schema.create(data);
      should.exist(s);
      should.exist(s.opts);
      should.exist(data[global.__schema]);
      data[global.__schema].should.equal(s);
    });

    it('should return the passed data when creating a schema from data already used to create a schema', function() {
      let data = {};
      let s1 = Schema.create(data);
      should.exist(s1);
      let s2 = Schema.create(data);
      should.exist(s2);
      s1.should.equal(s2);
    });

    it('should throw a SchemaError when called with a bad type', function() {
      should.throw(function() {
        Schema.create({ type: 'pippo' });
      }, global.SchemaError, 'type');
    });

    it('should create a ArraySchema when called with type array', function() {
      let s = Schema.create({ type: 'array' });
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
      let s = Schema.create({ type: 'boolean' });
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
      let s = Schema.create({ type: 'integer' });
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
      let s = Schema.create({ type: 'null' });
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
      let s = Schema.create({ type: 'number' });
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
      let s = Schema.create({ type: 'object' });
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
      let s = Schema.create({ type: 'string' });
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
      let s = Schema.create({ type: [ 'object', 'string' ] });
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

    it('should create a custom type with a corresponding factory is registered', function(done) {
      class CustomType extends Schema {
        constructor(data, opts) {
          super(data, opts);
          done();
        }
      }
      Schema.registerFactory('test', CustomType);
      let s = Schema.create({type: 'test'});
      should.exist(s);
      s.should.be.a.instanceOf(Schema);
      s.should.be.a.instanceOf(CustomType);
    });

  });

  describe('flatten', function() {

    it('should do nothing when called with no data', function () {
      should.not.exist(Schema.flatten());
    });

    it('should do nothing when called with data not containing an allOf', function () {
      let a = {};
      let b = Schema.flatten(a);
      should.exist(b);
      b.should.equal(a);
    });

    it('should return a new object called with data containing an empty allOf', function () {
      let a = {
        allOf: []
      };
      let b = Schema.flatten(a);
      should.exist(b);
      b.should.not.equal(a);
    });

    it('should preserve id and $schema of the top level object', function () {
      let a = {
        id: 'a',
        $schema: 'b',
        allOf: [{
          id: 'c',
          $schema: 'd',
        }]
      };
      let b = Schema.flatten(a);
      should.exist(b);
      b.should.not.equal(a);
      should.exist(b.id);
      b.id.should.equal(a.id);
      should.exist(b.$schema);
      b.$schema.should.equal(a.$schema);
    });

    it('should use the last one of: title, format, description, multipleOf, pattern (top level is last)', function () {
      let a1 = {
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
      let a2 = {
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
      let b = Schema.flatten(a1);
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

    it('should merge items', function() {
      let a1 = {
        items: {
          type: 'object',
          properties: {
            d: {
              type: 'null'
            }
          }
        },
        allOf: [
          {
            items: {
              type: 'object',
              properties: {
                a: {
                  type: 'number'
                }
              }
            }
          }, {
            items: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            }
          }, {
            items: {
              type: 'object',
              properties: {
                c: {
                  type: 'string'
                }
              }
            }
          }
        ]
      };
      let b1 = Schema.flatten(a1);
      b1.items.allOf.should.have.length(4);
    });

    it('should merge dependencies', function() {
      let a1 = {
        allOf: [
          {
            dependencies: {
              a: [ 'x', 'y' ],
              b: [ 'x' ],
              c: {
                type: 'object'
              },
              d: [ 'x' ],
              e: [ 'y' ]
            }
          }, {
            dependencies: {
              a: [ 'y', 'z' ],
              b: [ 'y'],
              c: [ 'z' ],
              d: {
                type: 'integer'
              },
              f: {
                type: 'boolean'
              }
            }
          }
        ]
      };
      let b1 = Schema.flatten(a1);
      b1.dependencies.a.should.deep.equal([ 'x', 'y', 'z' ]);
      b1.dependencies.b.should.deep.equal([ 'x', 'y' ]);
      b1.dependencies.c.should.deep.equal({ allOf: [ { type: 'object' }, { dependencies: { c: [ 'z' ] } } ] });
      b1.dependencies.d.should.deep.equal({ allOf: [ { dependencies: { d: [ 'x' ] } }, { type: 'integer' } ] });
      b1.dependencies.e.should.deep.equal([ 'y' ]);
      b1.dependencies.f.should.deep.equal({ type: 'boolean' });
    });

    it('should merge additional items and properties', function() {
      let a1 = {
        additionalProperties: {
          type: 'object',
          properties: {
            d: {
              type: 'null'
            }
          }
        },
        allOf: [
          {
            additionalProperties: {
              type: 'object',
              properties: {
                a: {
                  type: 'number'
                }
              }
            },
            additionalItems: {
              type: 'object',
              properties: {
                a: {
                  type: 'number'
                }
              }
            }
          }, {
            additionalProperties: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            },
            additionalItems: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            }
          }, {
            additionalProperties: {
              type: 'object',
              properties: {
                c: {
                  type: 'string'
                }
              }
            },
            additionalItems: {
              type: 'string',
              properties: {
                c: {
                  type: 'string'
                }
              }
            }
          }
        ]
      };
      let b1 = Schema.flatten(a1);
      b1.additionalProperties.allOf.should.have.length(4);
      b1.additionalItems.allOf.should.have.length(3);

      let a2 = {
        allOf: [
          {
            additionalProperties: false,
            additionalItems: false
          }, {
            additionalProperties: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            },
            additionalItems: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            }
          }
        ]
      };
      let b2 = Schema.flatten(a2);
      b2.additionalProperties.should.equal(false);
      b2.additionalItems.should.equal(false);

      let a3 = {
        allOf: [
          {
            additionalProperties: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            },
            additionalItems: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            }
          }, {
            additionalProperties: false,
            additionalItems: false
          }
        ]
      };
      let b3 = Schema.flatten(a3);
      b3.additionalProperties.should.equal(false);
      b3.additionalItems.should.equal(false);

      let a4 = {
        allOf: [
          {
            additionalProperties: true,
            additionalItems: true
          }, {
            additionalProperties: false,
            additionalItems: false
          }
        ]
      };
      let b4 = Schema.flatten(a4);
      b4.additionalProperties.should.equal(false);
      b4.additionalItems.should.equal(false);

      let a5 = {
        allOf: [
          {
            additionalProperties: true,
            additionalItems: true
          },
          {
            additionalProperties: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            },
            additionalItems: {
              type: 'object',
              properties: {
                b: {
                  type: 'boolean'
                }
              }
            }
          }
        ]
      };
      let b5 = Schema.flatten(a5);
      b5.additionalProperties.should.equal(a5.allOf[1].additionalProperties);
      b5.additionalItems.should.equal(a5.allOf[1].additionalItems);

      let a6 = {
        allOf: [
          {
            additionalProperties: true,
            additionalItems: true
          }, {
            additionalProperties: true,
            additionalItems: true
          }
        ]
      };
      let b6 = Schema.flatten(a6);
      b6.additionalProperties.should.equal(true);
      b6.additionalItems.should.equal(true);
    });

    it('should merge each property with its specific rules', function () {
      let a1 = {
        type: 'test',
        allOf: [
          {
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
      let b1 = Schema.flatten(a1);
      b1.type.should.equal('test');
      b1.default.should.equal(5);
      b1.minimum.should.equal(1);
      b1.maximum.should.equal(2);
      b1.minLength.should.equal(1);
      b1.maxLength.should.equal(2);
      b1.exclusiveMinimum.should.equal(false);
      b1.exclusiveMaximum.should.equal(false);
      b1.required.should.have.length(3).and.deep.equal([ 'a', 'b', 'c' ]);
      b1.definitions.should.deep.equal({ x: 1, y: 2, z: 4 });
      b1.properties.should.deep.equal({ m: 1, n: 2, o: 4 });
      b1.patternProperties.should.deep.equal({ m: 1, n: 2, o: 4 });

      let a2 = {
        type: 'test',
        allOf: [
          {
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
          }, {
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
          }
        ]
      };
      let b2 = Schema.flatten(a2);
      b2.type.should.equal('test');
      b2.default.should.equal(6);
      b2.minimum.should.equal(1);
      b2.maximum.should.equal(2);
      b2.minLength.should.equal(1);
      b2.maxLength.should.equal(2);
      b1.exclusiveMinimum.should.equal(false);
      b1.exclusiveMaximum.should.equal(false);
      b2.required.should.have.length(3).and.deep.equal([ 'b', 'c', 'a' ]);
      b2.definitions.should.deep.equal({ x: 1, y: 3, z: 4 });
      b2.properties.should.deep.equal({ m: 1, n: 3, o: 4 });
      b2.patternProperties.should.deep.equal({ m: 1, n: 3, o: 4 });
    });

  });

  describe('schema', function() {

    it('should resolve the the raw schema object', function() {
      let s = new UntypedSchema({ enum: [ 'a', true, 5 ] }, {});
      s.schema().should.eventually.equal(s.data);
    });

  });

  describe('validate', function() {

    it('should validate an empty schema', function() {
      let s = new UntypedSchema({}, {});
      return s.validate(1).should.eventually.equal(1);
    });

    describe('type', function() {
      it('should reject on a basic Schema instance', function() {
        let s = new UntypedSchema({ type: 'x' }, {});
        return s.validate({}).should.be.rejectedWith(global.SchemaError, 'type');
      });
    });

    describe('enum', function() {
      it('should reject if the (scalar) value is not included in the enum', function() {
        let s = new UntypedSchema({ enum: [ 'a', true, 5 ] }, {});
        return Promise.all([
          s.validate('a').should.eventually.equal('a'),
          s.validate(true).should.eventually.equal(true),
          s.validate(5).should.eventually.equal(5),
          s.validate('b').should.be.rejectedWith(global.ValidationError, 'enum')
        ]);
      });
    });

    describe('allOf', function() {
      it('should reject if not all schemas validate', function() {
        let s = new UntypedSchema({
          allOf: [
            {
              type: 'integer',
              minimum: 3
            },
            {
              type: 'integer',
              maximum: 5
            }
          ]
        }, { });
        s.init();
        return Promise.all([
          s.validate(2).should.be.rejectedWith(global.ValidationError, 'minimum'),
          s.validate(6).should.be.rejectedWith(global.ValidationError, 'maximum'),
          s.validate(4).should.be.fulfilled
        ]);
      });
      it('should use first encountered default as default', function() {
        let s = Schema.create({
          type: 'object',
          properties: {
            a: {
              allOf: [
                {
                  type: 'integer',
                  default: 5
                },
                {
                  type: 'integer',
                  default: 6
                }
              ]
            }
          }
        }, { });
        return s.validate({}).should.eventually.have.property('a', 5);
      });
    });

    describe('anyOf', function() {
      it('should throw if none of schemas validate', function() {
        let s = new UntypedSchema({
          anyOf: [
            {
              type: 'integer',
              minimum: 6
            },
            {
              type: 'integer',
              multipleOf: 3
            }
          ]
        }, { });
        s.init();
        return Promise.all([
          s.validate(3).should.be.fulfilled,
          s.validate(7).should.be.fulfilled,
          s.validate(2).should.be.rejectedWith(global.ValidationError, 'anyOf')
        ]);
      });
      it('should use first encountered default as default', function() {
        let s = Schema.create({
          type: 'object',
          properties: {
            a: {
              anyOf: [
                {
                  type: 'integer',
                  default: 5
                },
                {
                  type: 'string',
                  default: 'test'
                }
              ]
            }
          }
        }, { });
        return s.validate({}).should.eventually.have.property('a', 5);
      });
    });

    describe('oneOf', function() {
      it('should throw if more than one schema validate', function() {
        let s = new UntypedSchema({
          oneOf: [
            {
              type: 'integer',
              minimum: 6
            },
            {
              type: 'integer',
              multipleOf: 3
            }
          ]
        }, { });
        s.init();
        return Promise.all([
          s.validate(3).should.be.fulfilled,
          s.validate(7).should.be.fulfilled,
          s.validate(12).should.be.rejectedWith(global.ValidationError, 'oneOf')
        ]);
      });
      it('should use first encountered default as default', function() {
        let s = Schema.create({
          type: 'object',
          properties: {
            a: {
              oneOf: [
                {
                  type: 'integer',
                  default: 5
                },
                {
                  type: 'string',
                  default: 'test'
                }
              ]
            }
          }
        }, { });
        return s.validate({}).should.eventually.have.property('a', 5);
      });
    });

    describe('not', function() {
      it('should throw if the schema validates', function() {
        let s = new UntypedSchema({
          not: {
            type: 'integer',
            multipleOf: 3
          }
        }, { });
        s.init();
        return Promise.all([
          s.validate('ciao').should.be.fulfilled,
          s.validate(7).should.be.fulfilled,
          s.validate(6).should.be.rejectedWith(global.ValidationError, 'not')
        ]);
      });
    });

  });

});
