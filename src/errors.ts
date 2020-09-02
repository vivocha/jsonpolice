export class SchemaError extends Error {
  constructor(public scope: string, type: string, public info?: any) {
    super(type);
    this.name = 'SchemaError';
  }
}

export interface ValidationErrorInfo {
  type: string;
  path?: string;
  scope?: string;
  errors?: ValidationErrorInfo[];
}

export class ValidationError extends Error {
  constructor(public path: string, public scope: string, type: string, public errors?: Error[]) {
    super(type);
    this.name = 'ValidationError';
    if (!this.path) this.path = '/';
  }
  getInfo(): ValidationErrorInfo {
    return ValidationError.getInfo(this);
  }
  static getInfo(err: Error): ValidationErrorInfo {
    const out: ValidationErrorInfo = { type: err.message };
    if (err.name === 'ValidationError') {
      const verr: ValidationError = err as ValidationError;
      out.path = verr.path;
      out.scope = verr.scope;
      if (verr.errors) {
        out.errors = verr.errors.map((e) => ValidationError.getInfo(e));
      }
    }
    return out;
  }
}
