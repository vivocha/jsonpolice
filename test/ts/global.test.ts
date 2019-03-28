import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import * as global from '../../dist/global';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe('global', function() {

  describe('defined', function() {
    it('should return true if value is defined', function() {
      global.defined({}).should.equal(true);
    });
    it('should return false if value is undefined', function() {
      global.defined(undefined).should.equal(false);
      global.defined({}['a']).should.equal(false);
    });
  });
  
  describe('enumerableAndDefined', function() {
    it('should return true if value is enumerable and defined', function() {
      global.enumerableAndDefined({ a: 1 }, 'a').should.equal(true);
    });
    it('should return false if value is undefined', function() {
      global.enumerableAndDefined(undefined, 'a').should.equal(false);
      global.enumerableAndDefined({}['a'], 'a').should.equal(false);
    });
    it('should return false if value is defined, but not enumerable', function() {
      var o = {};
      Object.defineProperty(o, 'a', { enumerable: false, value: 1 });
      Object.defineProperty(o, 'b', { enumerable: true, value: 1 });
      global.enumerableAndDefined(o, 'a').should.equal(false);
      global.enumerableAndDefined(o, 'b').should.equal(true);
    });
  });

  describe('testRegExp', function() {
    it('should return true if regexp is sucessfully tested', function () {
      global.testRegExp('^a', 'aaa').should.equal(true);
      global.regexps.should.have.property('^a');
    });
    it('should return false if regexp is unsuccessfully tested', function () {
      global.testRegExp('^a', 'baa').should.equal(false);
    });
  });

});
