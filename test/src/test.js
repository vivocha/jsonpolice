import { create, safeCreate, register, meta } from '../../index'


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
  window.o = safeCreate('Account', { limitations: { users: 35 } });
  window.meta = meta;
} catch(e) {
  console.log(e.toString());
}

/*
{
  name:
  type: "string|number|boolean|date|select|array|object"
  required:
  readonly:
  hidden:
  default:
  validator:

  // string
  minLength
  maxLength
  pattern

  // number
  min
  max

  // array
  minLength
  maxLength
  value

  //select
  value: [ 'opt1', 'opt2', 'opt3' ]

  // object
  value: object (each key corresponds)
}



{
  id: 'schema_id'
}
  */