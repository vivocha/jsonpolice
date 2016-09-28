var chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , StringSchema = require('../dist/schema_string').StringSchema

chai.use(spies);

describe('StringSchema', function() {

  describe('validate', function() {

    var s = new StringSchema({
      type: 'number',
      minLength: 3,
      maxLength: 6,
      pattern: /^a.*b$/
    }, {});

    it('should throw if not a string', function() {
      should.throw(function() {
        s.validate(1);
      }, global.ValidationError, 'type');
    });

    it('should throw if minLength not fulfilled', function() {
      should.throw(function() {
        s.validate('aa');
      }, global.ValidationError, 'minLength');
    });

    it('should throw if maxLength not fulfilled', function() {
      should.throw(function() {
        s.validate('aaaaaaa');
      }, global.ValidationError, 'maxLength');
    });

    it('should throw if pattern not fulfilled', function() {
      should.throw(function() {
        s.validate('aaaaaa');
      }, global.ValidationError, 'pattern');
    });

    it('should throw if format is \'email\' and data is malformed', function() {
      var s = new StringSchema({
        type: 'number',
        format: 'email'
      }, {});
      should.throw(function() {
        s.validate('aaaaaa');
      }, global.ValidationError, 'format');
    });

    it('should throw if format is \'hostname\' and data is malformed', function() {
      var s = new StringSchema({
        type: 'number',
        format: 'hostname'
      }, {});
      should.throw(function() {
        s.validate('aaa_aaa');
      }, global.ValidationError, 'format');
    });

    it('should throw if format is \'ipv4\' and data is malformed', function() {
      var s = new StringSchema({
        type: 'number',
        format: 'ipv4'
      }, {});
      should.throw(function() {
        s.validate('aaaaaa');
      }, global.ValidationError, 'format');
    });

    it('should throw if format is \'ipv6\' and data is malformed', function() {
      var s = new StringSchema({
        type: 'number',
        format: 'ipv6'
      }, {});
      should.throw(function() {
        s.validate('aaaaaa');
      }, global.ValidationError, 'format');
    });

    it('should throw if format is \'uri\' and data is malformed'/*, function() {
      var s = new StringSchema({
        type: 'number',
        format: 'uri'
      }, {});
      should.throw(function() {
        s.validate('aaa');
      }, global.ValidationError, 'format');
    }*/);

    it('should successfully validate if format is \'date-time\' and a Date instance is passed', function() {
      var s = new StringSchema({
        type: 'number',
        format: 'date-time'
      }, {});
      var now = new Date();
      s.validate(now).should.equal(now);
    });

    it('should successfully validate if format is \'date-time\' and a ISO date string is passed', function() {
      var s = new StringSchema({
        type: 'number',
        format: 'date-time'
      }, {});
      var now = new Date();
      s.validate(now.toISOString()).should.be.a.instanceOf(Date);
    });

    it('should throw if format is \'date-time\' and data is malformed', function() {
      var s = new StringSchema({
        type: 'number',
        format: 'date-time'
      }, {});
      should.throw(function() {
        s.validate('aaaaaa');
      }, global.ValidationError, 'format');
      should.throw(function() {
        s.validate(1);
      }, global.ValidationError, 'type');
    });

    it('should successfully validate a string fulfilling all the criteria', function() {
      s.validate('axxb').should.equal('axxb');
    });

  });

});
