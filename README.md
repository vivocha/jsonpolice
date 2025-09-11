# jsonpolice

A powerful JavaScript library implementing [JSON Schema](https://json-schema.org/specification) draft 7 specification with support for newer versions. Validate JSON data against schemas with comprehensive validation rules, default value assignment, and property filtering capabilities.

[![npm version](https://img.shields.io/npm/v/jsonpolice.svg)](https://www.npmjs.com/package/jsonpolice)
[![CI](https://github.com/vivocha/jsonpolice/actions/workflows/ci.yml/badge.svg)](https://github.com/vivocha/jsonpolice/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/vivocha/jsonpolice/badge.svg?branch=master)](https://coveralls.io/github/vivocha/jsonpolice?branch=master)

## Features

- ✅ **JSON Schema Draft 7, 2019-09 & 2020-12**: Full implementation with automatic version detection
- ✅ **Schema Validation**: Comprehensive validation with detailed error reporting
- ✅ **Default Values**: Automatic assignment of default values for undefined properties
- ✅ **Property Filtering**: Remove additional, readOnly, or writeOnly properties
- ✅ **Context-Aware**: Support for read/write contexts to handle property visibility
- ✅ **External References**: Resolve `$ref` references to external schemas
- ✅ **Modern Keywords**: Support for `dependentSchemas`, `dependentRequired`, `unevaluatedProperties`, `unevaluatedItems`, and `$defs`
- ✅ **Backwards Compatible**: Full compatibility with existing Draft 7 schemas
- ✅ **TypeScript Support**: Full TypeScript definitions included
- ✅ **Modern ES Modules**: Supports both ESM and CommonJS
- ✅ **Minimal Dependencies**: Lightweight with minimal dependencies (only jsonref)

## Installation

```bash
# npm
npm install jsonpolice

# pnpm
pnpm add jsonpolice

# yarn
yarn add jsonpolice
```

## Quick Start

### Basic Schema Validation

```javascript
import { create } from 'jsonpolice';

const schema = await create({
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0, maximum: 120 }
  },
  required: ['name', 'email']
});

// Valid data
const validData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

try {
  const result = await schema.validate(validData);
  console.log('Valid:', result);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Schema with Default Values

```javascript
import { create } from 'jsonpolice';

const schema = await create({
  type: 'object',
  properties: {
    name: { type: 'string' },
    role: { type: 'string', default: 'user' },
    preferences: {
      type: 'object',
      properties: {
        theme: { type: 'string', default: 'light' },
        notifications: { type: 'boolean', default: true }
      }
    }
  }
});

const data = { name: 'Alice' };
const result = await schema.validate(data, { setDefault: true });
console.log(result);
// Output: { name: 'Alice', role: 'user', preferences: { theme: 'light', notifications: true } }
```

## API Reference

### create(schemaOrUri, options?)

Creates a new schema validator instance.

**Parameters:**
- `schemaOrUri` (object | string): JSON Schema object or URI to fetch the schema
- `options` (object, optional): Configuration options
  - `version` (string): Explicit JSON Schema version ('draft-07', '2019-09', '2020-12'). Auto-detected from `$schema` if not provided
  - `scope` (string): Base URI for resolving relative references (optional for inline schemas)
  - `registry` (object): Cache object to store resolved references for reuse
  - `retriever` (function): Function to fetch external references `(url: string) => Promise<object>`

**Returns:** `Promise<Schema>` - A schema validator instance

**Example:**
```javascript
import { create } from 'jsonpolice';

// Create from schema object
const schema = await create({
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' }
  }
});

// Create from URI with custom retriever
const remoteSchema = await create('https://example.com/schema.json', {
  retriever: (url) => fetch(url).then(r => r.json())
});
```

### schema.validate(data, options?)

Validates data against the schema.

**Parameters:**
- `data` (any): The data to validate
- `options` (object, optional): Validation options
  - `setDefault` (boolean): Add default values for undefined properties
  - `removeAdditional` (boolean): Remove properties not allowed by `additionalProperties`
  - `context` (string): Set to `'read'` to remove writeOnly properties, `'write'` to remove readOnly properties

**Returns:** The validated and potentially modified data

**Throws:** `ValidationError` if validation fails

**Examples:**
```javascript
// Basic validation
const result = await schema.validate({ name: 'John' });

// Validation with default values
const withDefaults = await schema.validate(
  { name: 'John' }, 
  { setDefault: true }
);

// Remove additional properties
const cleaned = await schema.validate(
  { name: 'John', extra: 'removed' }, 
  { removeAdditional: true }
);

// Context-aware validation (API response context)
const forReading = await schema.validate(
  { password: 'secret', publicInfo: 'visible' }, 
  { context: 'read' }
);
```

## Usage Examples

### Complex Schema Validation

```javascript
import { create } from 'jsonpolice';

const userSchema = await create({
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    age: { type: 'integer', minimum: 0, maximum: 150 },
    roles: {
      type: 'array',
      items: { type: 'string', enum: ['admin', 'user', 'guest'] },
      uniqueItems: true
    },
    profile: {
      type: 'object',
      properties: {
        bio: { type: 'string', maxLength: 500 },
        website: { type: 'string', format: 'uri' },
        socialMedia: {
          type: 'object',
          additionalProperties: { type: 'string', format: 'uri' }
        }
      }
    }
  },
  required: ['id', 'email', 'name'],
  additionalProperties: false
});

const userData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'John Doe',
  age: 30,
  roles: ['user'],
  profile: {
    bio: 'Software developer',
    website: 'https://johndoe.dev',
    socialMedia: {
      twitter: 'https://twitter.com/johndoe',
      github: 'https://github.com/johndoe'
    }
  }
};

try {
  const validated = await userSchema.validate(userData);
  console.log('User data is valid:', validated);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Working with External Schema References

```javascript
import { create } from 'jsonpolice';

const schema = await create({
  type: 'object',
  properties: {
    user: { '$ref': 'https://json-schema.org/learn/examples/person.schema.json' },
    timestamp: { type: 'string', format: 'date-time' }
  }
}, {
  retriever: async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status}`);
    }
    return response.json();
  }
});
```

### Context-Aware Validation (Read/Write Operations)

```javascript
import { create } from 'jsonpolice';

const apiSchema = await create({
  type: 'object',
  properties: {
    id: { type: 'string', readOnly: true },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', writeOnly: true, minLength: 8 },
    createdAt: { type: 'string', format: 'date-time', readOnly: true },
    updatedAt: { type: 'string', format: 'date-time', readOnly: true }
  },
  required: ['email']
});

// When creating a user (write context) - password is allowed, read-only fields are removed
const createData = {
  email: 'user@example.com',
  password: 'secretpassword',
  createdAt: '2023-01-01T00:00:00Z' // This will be removed
};

const forCreation = await apiSchema.validate(createData, { context: 'write' });
console.log(forCreation); // { email: 'user@example.com', password: 'secretpassword' }

// When returning user data (read context) - password is removed, read-only fields are kept
const responseData = {
  id: '123',
  email: 'user@example.com',
  password: 'secretpassword', // This will be removed
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

const forResponse = await apiSchema.validate(responseData, { context: 'read' });
console.log(forResponse); // { id: '123', email: 'user@example.com', createdAt: '...', updatedAt: '...' }
```

### Advanced Validation with Custom Formats

```javascript
import { create } from 'jsonpolice';

const schema = await create({
  type: 'object',
  properties: {
    username: { 
      type: 'string', 
      pattern: '^[a-zA-Z0-9_]{3,20}$' 
    },
    birthDate: { 
      type: 'string', 
      format: 'date' 
    },
    phoneNumber: { 
      type: 'string', 
      pattern: '^\\+?[1-9]\\d{1,14}$' 
    },
    metadata: {
      type: 'object',
      patternProperties: {
        '^[a-z_]+$': { type: 'string' }
      },
      additionalProperties: false
    }
  }
});

const data = {
  username: 'john_doe_123',
  birthDate: '1990-05-15',
  phoneNumber: '+1234567890',
  metadata: {
    department: 'engineering',
    team_lead: 'jane_smith'
  }
};

const result = await schema.validate(data);
```

### Performance Optimization with Shared Registry

```javascript
import { create } from 'jsonpolice';

const registry = {}; // Shared registry for caching

const userSchema = await create(userSchemaDefinition, { registry });
const productSchema = await create(productSchemaDefinition, { registry });
const orderSchema = await create(orderSchemaDefinition, { registry });

// All schemas will share the same registry, improving performance
// when they reference common schema definitions
```

## Error Handling

jsonpolice provides detailed error information when validation fails:

```javascript
import { create } from 'jsonpolice';

const schema = await create({
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0 }
  },
  required: ['email']
});

try {
  await schema.validate({
    email: 'invalid-email',
    age: -5
  });
} catch (error) {
  console.log(error.name); // 'ValidationError'
  console.log(error.message); // Detailed error message
  console.log(error.errors); // Array of specific validation errors
  
  // Each error contains:
  // - path: JSON Pointer to the invalid property
  // - message: Human-readable error description
  // - constraint: The violated constraint
  // - value: The invalid value
}
```

## Supported JSON Schema Keywords

jsonpolice implements the complete JSON Schema Draft 7 specification:

### Type Validation
- `type` - Validate basic types (string, number, integer, boolean, array, object, null)
- `enum` - Validate against enumerated values
- `const` - Validate against a constant value

### String Validation
- `minLength`, `maxLength` - String length constraints
- `pattern` - Regular expression pattern matching
- `format` - Built-in format validation including:
  - **Date/Time**: `date`, `time`, `date-time`
  - **Email**: `email`, `idn-email`
  - **Hostnames**: `hostname`, `idn-hostname`
  - **IP Addresses**: `ipv4`, `ipv6`
  - **URIs**: `uri`, `uri-reference`, `iri`, `iri-reference`, `uri-template`
  - **JSON Pointers**: `json-pointer`, `relative-json-pointer`
  - **Other**: `uuid`, `regex`

### Number Validation
- `minimum`, `maximum` - Numeric range validation
- `exclusiveMinimum`, `exclusiveMaximum` - Exclusive numeric ranges
- `multipleOf` - Multiple validation

### Array Validation
- `items` - Validate array items against schema(s)
- `additionalItems` - Handle additional items beyond defined schemas
- `minItems`, `maxItems` - Array length constraints
- `uniqueItems` - Ensure array items are unique
- `contains` - At least one item must match schema

### Object Validation
- `properties` - Define property schemas
- `patternProperties` - Properties matching regex patterns
- `additionalProperties` - Handle additional properties
- `required` - Required properties
- `minProperties`, `maxProperties` - Object size constraints
- `dependencies` - Property dependencies (Draft 7)
- `propertyNames` - Validate property names

### Schema Composition
- `allOf` - Must match all schemas
- `anyOf` - Must match at least one schema
- `oneOf` - Must match exactly one schema
- `not` - Must not match schema
- `if`/`then`/`else` - Conditional validation

### Meta-Schema Support
- `$ref` - Reference resolution
- `$id` - Schema identification
- `definitions` - Schema definitions (Draft 7)
- `$defs` - Schema definitions (2019-09+, preferred over `definitions`)

### Metadata Keywords
- `title` - Schema title for documentation
- `description` - Schema description for documentation  
- `default` - Default values for properties
- `examples` - Example values for documentation
- `readOnly` - Properties that should not be sent in requests
- `writeOnly` - Properties that should not be sent in responses
- `deprecated` - Mark properties as deprecated (2019-09+)

### Content Keywords
- `contentEncoding` - Describe string content encoding (e.g., base64)
- `contentMediaType` - Describe string content media type (e.g., application/json)

### New Features in JSON Schema 2019-09 & 2020-12
- `dependentSchemas` - Schema-based dependencies (replaces object-form `dependencies`)
- `dependentRequired` - Property-based dependencies (replaces array-form `dependencies`) 
- `unevaluatedProperties` - Handle properties not evaluated by other keywords
- `unevaluatedItems` - Handle array items not evaluated by other keywords
- Automatic version detection from `$schema` property
- Full backwards compatibility with Draft 7 schemas

## JSON Schema Version Support

jsonpolice automatically detects the JSON Schema version from the `$schema` property:

```javascript
// Draft 7 (default)
const draft7Schema = await create({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'string'
});

// JSON Schema 2019-09
const schema2019 = await create({
  $schema: 'https://json-schema.org/draft/2019-09/schema',
  type: 'object',
  dependentRequired: {
    name: ['surname']
  }
});

// JSON Schema 2020-12
const schema2020 = await create({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  unevaluatedProperties: false
});

// Explicit version
const explicitSchema = await create({
  type: 'string'
}, { version: '2020-12' });
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import { create, Schema, ValidationError } from 'jsonpolice';

interface User {
  id: string;
  email: string;
  name: string;
}

const schema: Schema = await create({
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' }
  },
  required: ['id', 'email', 'name']
});

try {
  const validated: User = await schema.validate(data);
} catch (error: ValidationError) {
  console.error('Validation failed:', error.message);
}
```

## Performance Tips

1. **Reuse schema instances** - Create schemas once and reuse them for multiple validations
2. **Use shared registries** - Share registries between related schemas to cache external references
3. **Optimize external references** - Implement efficient retriever functions with caching
4. **Consider validation options** - Only use `setDefault`, `removeAdditional`, and `context` when needed

## Browser Support

jsonpolice works in all modern browsers and Node.js environments. It requires:
- ES2015+ support
- Promise support
- JSON.parse/JSON.stringify

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please ensure all tests pass:

```bash
pnpm install
pnpm test
pnpm run coverage
```
