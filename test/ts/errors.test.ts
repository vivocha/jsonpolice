import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import * as jp from '../../dist/index';
import { ValidationError } from '../../dist/index';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe('ValidationError', function () {
  describe('getInfo', function () {
    it('should return a json representation of an error', async function () {
      const schema = await jp.create(
        {
          items: [
            {
              type: 'string',
            },
            {
              type: 'boolean',
            },
            {
              type: 'integer',
            },
          ],
        },
        { scope: 'http://example.com' }
      );
      const p = schema.validate([1, true, 10.2]);
      const err = await p.should.be.rejectedWith(jp.ValidationError, 'items');
      const info = (err as ValidationError).getInfo();
      info.should.deep.equal({
        type: 'items',
        path: '/',
        scope: 'http://example.com/#',
        errors: [
          {
            path: '/0',
            scope: 'http://example.com/#/items/0',
            type: 'type',
          },
          {
            path: '/2',
            scope: 'http://example.com/#/items/2',
            type: 'type',
          },
        ],
      });
      ValidationError.getInfo(new Error('test')).should.deep.equal({ type: 'test' });
    });
  });
});
