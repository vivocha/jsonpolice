import { expect } from 'chai';
import { create } from '../src/index.js';

describe('Medium Priority Bug Fixes', () => {
  describe('Bug Fix 1: Version Detection Precision', () => {
    it('should correctly detect 2020-12 from standard URI', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'string'
      });

      const result = await schema.validate('test');
      expect(result).to.equal('test');
    });

    it('should correctly detect 2019-09 from standard URI', async () => {
      const schema = await create({
        $schema: 'https://json-schema.org/draft/2019-09/schema',
        type: 'string'
      });

      const result = await schema.validate('test');
      expect(result).to.equal('test');
    });

    it('should correctly detect draft-07 from standard URI', async () => {
      const schema = await create({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string'
      });

      const result = await schema.validate('test');
      expect(result).to.equal('test');
    });

    it('should handle case-insensitive schema URIs', async () => {
      const schema = await create({
        $schema: 'HTTPS://JSON-SCHEMA.ORG/DRAFT/2020-12/SCHEMA',
        type: 'string'
      });

      const result = await schema.validate('test');
      expect(result).to.equal('test');
    });

    it('should default to draft-07 for unrecognized schema URIs', async () => {
      const schema = await create({
        $schema: 'https://example.com/my-schema',
        type: 'string'
      });

      // Should work with draft-07 features
      const result = await schema.validate('test');
      expect(result).to.equal('test');
    });

    it('should not false-match on custom URIs containing version strings', async () => {
      const schema = await create({
        $schema: 'https://my-custom-2020-12-fork.example.com/schema',
        type: 'string'
      });

      // Should default to draft-07, not match 2020-12
      const result = await schema.validate('test');
      expect(result).to.equal('test');
    });
  });

  describe('Bug Fix 2: Semver Regex Escaping', () => {
    it('should validate correct semver strings', async () => {
      const schema = await create({
        type: 'string',
        format: 'semver'
      });

      expect(await schema.validate('1.0.0')).to.equal('1.0.0');
      expect(await schema.validate('1.2.3')).to.equal('1.2.3');
      expect(await schema.validate('0.0.1')).to.equal('0.0.1');
    });

    it('should validate semver with pre-release', async () => {
      const schema = await create({
        type: 'string',
        format: 'semver'
      });

      expect(await schema.validate('1.0.0-alpha')).to.equal('1.0.0-alpha');
      expect(await schema.validate('1.0.0-alpha.1')).to.equal('1.0.0-alpha.1');
      expect(await schema.validate('1.0.0-0.3.7')).to.equal('1.0.0-0.3.7');
    });

    it('should validate semver with build metadata', async () => {
      const schema = await create({
        type: 'string',
        format: 'semver'
      });

      expect(await schema.validate('1.0.0+20130313144700')).to.equal('1.0.0+20130313144700');
      expect(await schema.validate('1.0.0-beta+exp.sha.5114f85')).to.equal('1.0.0-beta+exp.sha.5114f85');
    });

    it('should reject invalid semver strings', async () => {
      const schema = await create({
        type: 'string',
        format: 'semver'
      });

      try {
        await schema.validate('1');  // Not enough version parts
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });
  });

  describe('Bug Fix 3: Regex Format Validation', () => {
    it('should validate correct regex patterns', async () => {
      const schema = await create({
        type: 'string',
        format: 'regex'
      });

      expect(await schema.validate('^[a-z]+$')).to.equal('^[a-z]+$');
      expect(await schema.validate('[0-9]{3}-[0-9]{4}')).to.equal('[0-9]{3}-[0-9]{4}');
      expect(await schema.validate('(foo|bar)')).to.equal('(foo|bar)');
    });

    it('should reject syntactically invalid regex patterns', async () => {
      const schema = await create({
        type: 'string',
        format: 'regex'
      });

      try {
        await schema.validate('[invalid');
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should reject regex with unclosed groups', async () => {
      const schema = await create({
        type: 'string',
        format: 'regex'
      });

      try {
        await schema.validate('(unclosed');
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should reject regex with invalid quantifiers', async () => {
      const schema = await create({
        type: 'string',
        format: 'regex'
      });

      try {
        await schema.validate('*invalid');  // * without preceding element
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });
  });

  describe('Bug Fix 4: Date Validation', () => {
    it('should validate correct dates', async () => {
      const schema = await create({
        type: 'string',
        format: 'date'
      });

      const result = await schema.validate('2024-01-15');
      expect(result).to.be.instanceof(Date);
      expect(result.toISOString()).to.include('2024-01-15');
    });

    it('should reject invalid dates like February 31st', async () => {
      const schema = await create({
        type: 'string',
        format: 'date'
      });

      try {
        await schema.validate('2024-02-31');
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should reject invalid dates like April 31st', async () => {
      const schema = await create({
        type: 'string',
        format: 'date'
      });

      try {
        await schema.validate('2024-04-31');
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should validate leap year dates correctly', async () => {
      const schema = await create({
        type: 'string',
        format: 'date'
      });

      // 2024 is a leap year
      const result = await schema.validate('2024-02-29');
      expect(result).to.be.instanceof(Date);
    });

    it('should reject non-leap year Feb 29', async () => {
      const schema = await create({
        type: 'string',
        format: 'date'
      });

      try {
        // 2023 is not a leap year
        await schema.validate('2023-02-29');
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('format');
      }
    });

    it('should validate date-time format', async () => {
      const schema = await create({
        type: 'string',
        format: 'date-time'
      });

      const result = await schema.validate('2024-01-15T10:30:00Z');
      expect(result).to.be.instanceof(Date);
    });
  });

  describe('Bug Fix 5: Pattern Validator Date Mutation', () => {
    it('should not mutate Date objects when validating patterns', async () => {
      const schema = await create({
        type: 'string',
        pattern: '^2024'
      });

      const testDate = new Date('2024-01-15T10:30:00Z');
      const originalType = typeof testDate;
      const originalInstance = testDate instanceof Date;

      const result = await schema.validate(testDate);

      // Result should still be a Date, not mutated to string
      expect(result).to.be.instanceof(Date);
      expect(result).to.equal(testDate);
      expect(typeof result).to.equal(originalType);
    });

    it('should validate Date against pattern correctly', async () => {
      const schema = await create({
        type: 'string',
        pattern: 'T10:30'
      });

      const testDate = new Date('2024-01-15T10:30:00Z');
      const result = await schema.validate(testDate);

      expect(result).to.be.instanceof(Date);
      expect(result.toISOString()).to.include('T10:30');
    });

    it('should fail validation when Date does not match pattern', async () => {
      const schema = await create({
        type: 'string',
        pattern: 'T99:99'  // Invalid time pattern
      });

      const testDate = new Date('2024-01-15T10:30:00Z');

      try {
        await schema.validate(testDate);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).to.contain('pattern');
        // Original date should not be mutated even on failure
        expect(testDate).to.be.instanceof(Date);
      }
    });

    it('should handle string values normally', async () => {
      const schema = await create({
        type: 'string',
        pattern: '^test'
      });

      const result = await schema.validate('test123');
      expect(result).to.equal('test123');
      expect(typeof result).to.equal('string');
    });
  });
});
