# jsonpolice - Claude Development Guide

## Project Overview
JSON Schema parser and validator with comprehensive validation capabilities.

## Key Commands
- **build**: `pnpm run build` - Compiles TypeScript to JavaScript
- **test**: `pnpm run test` - Runs tests with full build
- **coverage**: `pnpm run cover` - Runs tests with coverage reporting
- **check-coverage**: `pnpm run check-coverage` - Verifies 100% coverage requirement
- **clean**: `pnpm run clean` - Removes build artifacts

## Project Structure
- `src/` - TypeScript source files
- `dist/` - Built JavaScript files
- `test/` - Test files

## Dependencies
- **jsonref**: ^9.0.0 - JSON reference resolution
- **lodash**: ^4.17.21 - Utility functions

## Build Configuration
- **TypeScript**: 5.5.2 with NodeNext modules targeting ES2022
- **Node.js**: >=18.17.0
- **Coverage**: 100% required (statements, branches, functions, lines)
- **Module**: ESM with .js exports

## Development Notes
- Uses pnpm as package manager
- Depends on jsonref for reference resolution
- All code must maintain 100% test coverage
- Source maps enabled for debugging