import { create, register, meta } from '../../index'


register('Security', {
  type: 'object',
  value: {
    mode: {
      type: 'select',
      required: true,
      default: 'none',
      value: [ 'none', 'client', 'server' ]
    }
  }
});
register('Subscription', {
  type: 'object',
  value: {
    id: {
      type: 'string',
      required: true
    },
    parent: {
      type: 'string'
    }
  }
});
register('Account', {
  type: 'object',
  loose: true,
  value: {
    id: {
      type: 'string',
      required: true,
      minLength: 6
    },
    ver: {
      type: 'number',
      readonly: true,
      default: 6
    },
    active: {
      type: 'boolean'
    },
    language: {
      type: 'select',
      required: true,
      default: 'en',
      value: [ 'en', 'it', 'fr' ]
    },
    limitations: {
      type: 'object',
      value: {
        users: {
          type: 'number',
          max: 30
        },
        zendesk: {
          type: 'boolean'
        }
      }
    },
    security: 'Security',
    subscriptions: {
      type: 'array',
      minLength: 1,
      maxLength: 2,
      value: 'Subscription'
    }
  }
});

try {
  window.errors = [];
  //window.o = create('Account', { limitations: { users: 35 } }, { errors: errors, loose: true });
  //window.o = create({ type: 'object', readonly: true, loose: true, value: { x: { type: 'number', required: true, min: 5 }, z: { type: 'object' } } }, { x: '15', y: 56, z: '{ "a": 10 }' }, { errors: errors });

  window.o = create({
    type: 'object',
    value: {
      x: {
        type: 'number',
        min: 5,
        max: 10
      },
      y: {
        type: 'number',
        min: 5,
        max: 15
      },
      z: {
        type: 'array',
        value: {
          type: 'string',
          minLength: 5
        },
        default: [ "aaaaa", "bbbbb" ]
      }
    }
  }, {
    x: 10,
    y: 11
  });


  window.meta = meta;
} catch(e) {
  console.error(e.message, e.path);
}
