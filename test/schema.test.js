var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , Schema = require('../dist/schema').Schema
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

    it('should create a custom type with a corresponding factory is registered', function(done) {
      class CustomType extends Schema {
        constructor(data, opts) {
          super(data, opts);
          done();
        }
      }
      Schema.registerFactory('test', CustomType);
      var s = Schema.create({type: 'test'});
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

    it('should merge items', function() {
      var a1 = {
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
      var b1 = Schema.flatten(a1);
      b1.items.allOf.should.have.length(4);
    });

    it('should merge dependencies', function() {
      var a1 = {
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
      var b1 = Schema.flatten(a1);
      b1.dependencies.a.should.deep.equal([ 'x', 'y', 'z' ]);
      b1.dependencies.b.should.deep.equal([ 'x', 'y' ]);
      b1.dependencies.c.should.deep.equal({ allOf: [ { type: 'object' }, { dependencies: { c: [ 'z' ] } } ] });
      b1.dependencies.d.should.deep.equal({ allOf: [ { dependencies: { d: [ 'x' ] } }, { type: 'integer' } ] });
      b1.dependencies.e.should.deep.equal([ 'y' ]);
      b1.dependencies.f.should.deep.equal({ type: 'boolean' });
    });

    it('should merge additional items and properties', function() {
      var a1 = {
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
      var b1 = Schema.flatten(a1);
      b1.additionalProperties.allOf.should.have.length(4);
      b1.additionalItems.allOf.should.have.length(3);

      var a2 = {
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
      var b2 = Schema.flatten(a2);
      b2.additionalProperties.should.equal(false);
      b2.additionalItems.should.equal(false);

      var a3 = {
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
      var b3 = Schema.flatten(a3);
      b3.additionalProperties.should.equal(false);
      b3.additionalItems.should.equal(false);

      var a4 = {
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
      var b4 = Schema.flatten(a4);
      b4.additionalProperties.should.equal(false);
      b4.additionalItems.should.equal(false);

      var a5 = {
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
      var b5 = Schema.flatten(a5);
      b5.additionalProperties.should.equal(a5.allOf[1].additionalProperties);
      b5.additionalItems.should.equal(a5.allOf[1].additionalItems);

      var a6 = {
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
      var b6 = Schema.flatten(a6);
      b6.additionalProperties.should.equal(true);
      b6.additionalItems.should.equal(true);
    });

    it('should merge each property with its specific rules', function () {
      var a1 = {
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
      var b1 = Schema.flatten(a1);
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

      var a2 = {
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
      var b2 = Schema.flatten(a2);
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
      it('should throw if not all schemas validate', function() {
        var s = new Schema({
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
        should.throw(function() {
          s.validate(2);
        }, global.ValidationError, 'minimum');
        should.throw(function() {
          s.validate(6);
        }, global.ValidationError, 'maximum');
        should.not.throw(function() {
          s.validate(4);
        });
      });
      it('should use first encountered default as default', function() {
        var s = Schema.create({
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
        s.validate({}).a.should.equal(5);
      });
    });

    describe('anyOf', function() {
      it('should throw if none of schemas validate', function() {
        var s = new Schema({
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
        should.not.throw(function() {
          s.validate(3);
        });
        should.not.throw(function() {
          s.validate(7);
        });
        should.throw(function() {
          s.validate(2);
        }, global.ValidationError, 'anyOf');
      });
      it('should use first encountered default as default', function() {
        var s = Schema.create({
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
        s.validate({}).a.should.equal(5);
      });
    });

    describe('oneOf', function() {
      it('should throw if more than one schema validate', function() {
        var s = new Schema({
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
        should.not.throw(function() {
          s.validate(3);
        });
        should.not.throw(function() {
          s.validate(7);
        });
        should.throw(function() {
          s.validate(12);
        }, global.ValidationError, 'oneOf');
      });
      it('should use first encountered default as default', function() {
        var s = Schema.create({
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
        s.validate({}).a.should.equal(5);
      });
    });

    describe('not', function() {
      it('should throw if the schema validates', function() {
        var s = new Schema({
          not: {
            type: 'integer',
            multipleOf: 3
          }
        }, { });
        s.init();
        should.not.throw(function() {
          s.validate('ciao');
        });
        should.not.throw(function() {
          s.validate(7);
        });
        should.throw(function() {
          s.validate(6);
        }, global.ValidationError, 'not');
      });
    });

  });

});
