import * as refs from 'jsonref';
import { Schema } from './schema';

export const regexps:{
  [name:string]: RegExp
}  = {
  'date-time': /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/,
  'email': /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  'hostname': /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
  'ipv4': /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
  'ipv6': /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/,
  'uri': /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/
};

export interface SchemaOptions extends refs.ParseOptions {
}
export interface SchemaMeta extends refs.Meta {
  schema?: Schema;
}
export interface ValidationOptions {
  doNotAnnotate?: boolean;
  setDefault?: boolean
  removeAdditional?:boolean;
  context?: 'read'|'write';
}

export class SchemaError extends Error {
  constructor(public scope:string, type:string, public info?:any) {
    super(type);
    this.name = 'SchemaError';
  }
}
export class ValidationError extends Error {
  constructor(public path:string, public scope:string, type:string, public errors?: Error[]) {
    super(type);
    this.name = 'ValidationError';
    if (!this.path) this.path = '/';
  }
}

export function defined(v:any):boolean {
  return typeof v !== 'undefined';
}
export function enumerableAndDefined(o:any, k:string):boolean {
  return defined(o) && o.propertyIsEnumerable(k) && defined(o[k]);
}
export function testRegExp(exp:string, value:string):boolean {
  var r = regexps[exp];
  if (!r) {
    r = regexps[exp] = new RegExp(exp);
  }
  return r.test(value);
}
