const chai = require('chai')
  , spies = require('chai-spies')
  , should = chai.should()
  , global = require('../dist/global')
  , StringSchema = require('../dist/schema_string').StringSchema

chai.use(spies);

describe('StringSchema', function() {

  describe('validate', function() {

    let s = new StringSchema({
      type: 'number',
      minLength: 3,
      maxLength: 6,
      pattern: /^a.*b$/
    }, {});

    it('should throw if not a string', function() {
      return s.validate(1).should.be.rejectedWith(global.ValidationError, 'type');
    });

    it('should throw if minLength not fulfilled', function() {
      return s.validate('aa').should.be.rejectedWith(global.ValidationError, 'minLength');
    });

    it('should throw if maxLength not fulfilled', function() {
      return s.validate('aaaaaaa').should.be.rejectedWith(global.ValidationError, 'maxLength');
    });

    it('should throw if pattern not fulfilled', function() {
      return s.validate('aaaaaa').should.be.rejectedWith(global.ValidationError, 'pattern');
    });

    it('should throw if format is \'email\' and data is malformed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'email'
      }, {});
      return s.validate('aaaaaa').should.be.rejectedWith(global.ValidationError, 'format');
    });

    it('should throw if format is \'hostname\' and data is malformed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'hostname'
      }, {});
      return s.validate('aaa_aaa').should.be.rejectedWith(global.ValidationError, 'format');
    });

    it('should throw if format is \'ipv4\' and data is malformed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'ipv4'
      }, {});
      return s.validate('aaaaaa').should.be.rejectedWith(global.ValidationError, 'format');
    });

    it('should throw if format is \'ipv6\' and data is malformed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'ipv6'
      }, {});
      return s.validate('aaaaaa').should.be.rejectedWith(global.ValidationError, 'format');
    });

    it.skip('should throw if format is \'uri\' and data is malformed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'uri'
      }, {});
      return s.validate('http://x:-100').should.be.rejectedWith(global.ValidationError, 'format');
    });

    it('should successfully validate if format is \'date-time\' and a Date instance is passed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'date-time'
      }, {});
      let now = new Date();
      return s.validate(now).should.eventually.equal(now);
    });

    it('should successfully validate if format is \'date-time\' and a ISO date string is passed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'date-time'
      }, {});
      let now = new Date();
      return s.validate(now.toISOString()).should.eventually.be.a.instanceOf(Date);
    });

    it('should throw if format is \'date-time\' and data is malformed', function() {
      let s = new StringSchema({
        type: 'number',
        format: 'date-time'
      }, {});
      return Promise.all([
        s.validate('aaaaaa').should.be.rejectedWith(global.ValidationError, 'format'),
        s.validate(1).should.be.rejectedWith(global.ValidationError, 'type')
      ]);
    });

    it('should successfully validate a string fulfilling all the criteria', function() {
      return s.validate('axxb').should.eventually.equal('axxb');
    });

  });

});
