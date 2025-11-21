import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as utils from '../src/utils.js';

chai.should();
chai.use(chaiAsPromised);

describe('global', function () {
  describe('defined', function () {
    it('should return true if value is defined', function () {
      utils.defined({}).should.equal(true);
    });
    it('should return false if value is undefined', function () {
      utils.defined(undefined).should.equal(false);
      utils.defined({}['a']).should.equal(false);
    });
  });

  describe('enumerableAndDefined', function () {
    it('should return true if value is enumerable and defined', function () {
      utils.enumerableAndDefined({ a: 1 }, 'a').should.equal(true);
    });
    it('should return false if value is undefined', function () {
      utils.enumerableAndDefined(undefined, 'a').should.equal(false);
      utils.enumerableAndDefined({}['a'], 'a').should.equal(false);
    });
    it('should return false if value is defined, but not enumerable', function () {
      var o = {};
      Object.defineProperty(o, 'a', { enumerable: false, value: 1 });
      Object.defineProperty(o, 'b', { enumerable: true, value: 1 });
      utils.enumerableAndDefined(o, 'a').should.equal(false);
      utils.enumerableAndDefined(o, 'b').should.equal(true);
    });
  });

  describe('testRegExp', function () {
    it('should return true if regexp is sucessfully tested', function () {
      utils.testRegExp('^a', 'aaa').should.equal(true);
    });
    it('should return false if regexp is unsuccessfully tested', function () {
      utils.testRegExp('^a', 'baa').should.equal(false);
    });
  });
});
