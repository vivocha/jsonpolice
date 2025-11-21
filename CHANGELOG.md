# jsonpolice

## 13.0.0 (2025-01-21)

### Major Changes

#### New Features
- **JSON Schema 2019-09 & 2020-12 Support**: Full implementation with automatic version detection
  - Support for `dependentSchemas` and `dependentRequired` keywords
  - Support for `unevaluatedProperties` and `unevaluatedItems` keywords
  - Support for `$defs` keyword (preferred over `definitions`)
  - Full backwards compatibility with Draft 7 schemas
  - Automatic version detection from `$schema` property

- **Extensible Validator System**: Support for custom validators via class extension
  - Extend `StaticSchema` to add custom validation keywords
  - Implement custom validator methods with consistent patterns

#### Critical Bug Fixes (12 total)

**Critical** (Could cause incorrect validation results):
1. Fixed floating point precision in `multipleOf` validator using epsilon-based comparison
2. Fixed integer validation with large numbers by replacing `parseInt()` with `Number.isInteger()`
3. Fixed race condition in version detection for concurrent `validate()` calls

**High Priority** (Prevented runtime errors and data corruption):
4. Fixed TypeError with `additionalProperties: false` and context options
5. Fixed TypeError with `unevaluatedProperties: false`
6. Fixed `contains` validator data mutation on validation failure
7. Fixed `anyOf`/`oneOf` partial mutations from failed schema attempts

**Medium Priority** (Improved validation accuracy):
8. Fixed version detection precision for custom schema URIs
9. Fixed semver regex double escaping
10. Fixed regex format validation to properly reject invalid patterns
11. Fixed date validation to reject invalid dates like `2024-02-31`
12. Fixed pattern validator Date object mutation

#### Performance Optimizations
- Optimized `contains` validator from O(2n) to O(n) complexity
- Optimized `anyOf`/`oneOf` cloning with intelligent primitive detection
- Added `cloneForValidation()` helper for efficient deep cloning

#### Project Improvements
- **Build System**: Corrected TypeScript output structure for cleaner npm package
  - `src/` contains only TypeScript source files
  - `dist/` contains compiled output ready for npm publish
  - `test/` properly separated from published package
- **Documentation**: Comprehensive README improvements
  - Added missing sections (Exports, Extensibility, Compatibility)
  - Fixed all code examples to match implementation
  - Added detailed usage examples for new features
  - Added CommonJS usage guide
- **Testing**: Reorganized test files into dedicated test/ directory
- **Coverage**: Maintained 100% code coverage with 211 tests

### Breaking Changes
- Pure ESM package (no CommonJS support - use dynamic imports if needed)
- Some validation behaviors corrected (may affect code relying on buggy behavior)

## 12.0.0

### Major Changes

- Update deps
