export class SchemaError extends Error {
  constructor(public scope: string, type: string, public info?: any) {
    super(type);
    this.name = 'SchemaError';
  }
}
export class ValidationError extends Error {
  constructor(public path: string, public scope: string, type: string, public errors?: Error[]) {
    super(type);
    this.name = 'ValidationError';
    if (!this.path) this.path = '/';
  }
}
