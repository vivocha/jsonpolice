import { expect } from 'chai';
import { create } from '../dist/index.js';

describe('Missing JSON Schema Features', () => {
  describe('Additional Format Validators', () => {
    it('should validate uuid format', async () => {
      const schema = await create({
        type: 'string',
        format: 'uuid'
      });

      expect(await schema.validate('123e4567-e89b-12d3-a456-426614174000')).to.equal('123e4567-e89b-12d3-a456-426614174000');
      
      try {
        await schema.validate('not-a-uuid');
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should validate json-pointer format', async () => {
      const schema = await create({
        type: 'string',
        format: 'json-pointer'
      });

      expect(await schema.validate('/foo/bar')).to.equal('/foo/bar');
      expect(await schema.validate('/foo~1bar')).to.equal('/foo~1bar');
      expect(await schema.validate('')).to.equal('');
      
      try {
        await schema.validate('foo/bar'); // should start with /
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should validate relative-json-pointer format', async () => {
      const schema = await create({
        type: 'string',
        format: 'relative-json-pointer'
      });

      expect(await schema.validate('1/foo')).to.equal('1/foo');
      expect(await schema.validate('0#')).to.equal('0#');
      expect(await schema.validate('2/bar/baz')).to.equal('2/bar/baz');
    });

    it('should validate uri-reference format', async () => {
      const schema = await create({
        type: 'string',
        format: 'uri-reference'
      });

      expect(await schema.validate('https://example.com')).to.equal('https://example.com');
      expect(await schema.validate('/path/to/resource')).to.equal('/path/to/resource');
      expect(await schema.validate('#fragment')).to.equal('#fragment');
    });

    it('should validate regex format', async () => {
      const schema = await create({
        type: 'string',
        format: 'regex'
      });

      expect(await schema.validate('[a-z]+')).to.equal('[a-z]+');
      expect(await schema.validate('\\d{3}-\\d{2}-\\d{4}')).to.equal('\\d{3}-\\d{2}-\\d{4}');
    });

    it('should fail validation with invalid uuid format', async () => {
      const schema = await create({
        type: 'string',
        format: 'uuid'
      });

      try {
        await schema.validate('invalid-uuid-format');
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should fail validation with invalid json-pointer format', async () => {
      const schema = await create({
        type: 'string',
        format: 'json-pointer'
      });

      try {
        await schema.validate('invalid~2pointer'); // ~2 is not valid escape
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });
  });

  describe('Metadata Keywords', () => {
    it('should accept title and description', async () => {
      const schema = await create({
        type: 'string',
        title: 'User Name',
        description: 'The name of the user'
      });

      expect(await schema.validate('John Doe')).to.equal('John Doe');
    });

    it('should accept examples', async () => {
      const schema = await create({
        type: 'number',
        examples: [42, 3.14, -1]
      });

      expect(await schema.validate(100)).to.equal(100);
    });

    it('should accept readOnly and writeOnly', async () => {
      const schema = await create({
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          password: { type: 'string', writeOnly: true },
          name: { type: 'string' }
        }
      });

      expect(await schema.validate({
        id: '123',
        password: 'secret',
        name: 'John'
      })).to.deep.equal({
        id: '123',
        password: 'secret',
        name: 'John'
      });
    });
  });

  describe('Content Keywords', () => {
    it('should accept contentEncoding', async () => {
      const schema = await create({
        type: 'string',
        contentEncoding: 'base64'
      });

      expect(await schema.validate('SGVsbG8gV29ybGQ=')).to.equal('SGVsbG8gV29ybGQ=');
    });

    it('should accept contentMediaType', async () => {
      const schema = await create({
        type: 'string',
        contentMediaType: 'application/json'
      });

      expect(await schema.validate('{"hello": "world"}')).to.equal('{"hello": "world"}');
    });

    it('should accept both contentEncoding and contentMediaType', async () => {
      const schema = await create({
        type: 'string',
        contentEncoding: 'base64',
        contentMediaType: 'application/json'
      });

      expect(await schema.validate('eyJoZWxsbyI6ICJ3b3JsZCJ9')).to.equal('eyJoZWxsbyI6ICJ3b3JsZCJ9');
    });
  });

  describe('Deprecated Keyword (2019-09+)', () => {
    it('should accept deprecated in 2019-09 schema', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2019-09/schema',
        type: 'string',
        deprecated: true
      });

      expect(await schema.validate('test')).to.equal('test');
    });

    it('should accept deprecated in 2020-12 schema', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          oldField: { type: 'string', deprecated: true },
          newField: { type: 'string' }
        }
      });

      expect(await schema.validate({
        oldField: 'legacy',
        newField: 'current'
      })).to.deep.equal({
        oldField: 'legacy',
        newField: 'current'
      });
    });
  });

  describe('Complex Schema with All Features', () => {
    it('should handle schema with multiple metadata and content keywords', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: 'User Profile',
        description: 'A comprehensive user profile schema',
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            title: 'User ID',
            description: 'Unique identifier for the user',
            readOnly: true
          },
          email: {
            type: 'string',
            format: 'email',
            title: 'Email Address',
            examples: ['user@example.com', 'admin@test.org']
          },
          avatar: {
            type: 'string',
            title: 'Avatar Image',
            contentEncoding: 'base64',
            contentMediaType: 'image/jpeg'
          },
          settings: {
            type: 'string',
            contentMediaType: 'application/json',
            title: 'User Settings'
          },
          legacyField: {
            type: 'string',
            deprecated: true,
            title: 'Legacy Field'
          }
        },
        required: ['id', 'email']
      });

      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        avatar: '/9j/4AAQSkZJRgABAQEAYABgAAD',
        settings: '{"theme": "dark"}',
        legacyField: 'old value'
      };

      expect(await schema.validate(validData)).to.deep.equal(validData);
    });
  });
});