'use strict';

import { deepExtend as extend } from 'eredita';

var __sym = Symbol();

function defined(v) {
   return typeof v !== 'undefined';
}

class DataError extends Error {
  constructor(name, path) {
    super(name);
    this.name = 'DataError';
    this.path = path;
  }
}

class InitError extends Error {
  constructor(value, errors) {
    super();
    this.name = 'InitError';
    this.value = value;
    this.errors = errors;
  }
}

class Property {
  constructor(config, value, parent, key, errors) {
    this.config = Property.getConfig(config);
    if (defined(parent) && defined(key)) {
      this.attach(parent, key);
    }
    this.setValue(defined(value) ? value : this.config.default, errors);
  }
  attach(parent, key) {
    this.detach();
    if (defined(parent) && defined(key)) {
      this.parent = parent;
      this.key = key;
      Object.defineProperty(this.parent, this.key, {
        configurable: !this.config.required,
        enumerable: true,
        get: this.getter(),
        set: this.setter()
      });
    }
  }
  detach() {
    if (defined(this.key) && defined(this.parent)) {
      delete this.parent[this.key];
    }
    delete this.key;
    delete this.parent;
  }
  dataError(type, sink) {
    var e = new DataError(type, this.getPath());
    if (sink) {
      sink.push(e);
    } else {
      throw e;
    }
  }
  check(v) {
    if (!defined(v) && this.config.required) {
      this.dataError('required');
    }
    if (this.config.validator && !this.config.validator(v, this)) {
      this.dataError('validator');
    }
  }
  init(v, errors) {
    this.check(v);
  }
  getter() {
    var f = this.getValue.bind(this);
    f.config = this.config;
    return f;
  }
  getValue() {
    this.check(this.value);
    return this.value;
  }
  setter() {
    var f = this.setValue.bind(this);
    f.config = this.config;
    return f;
  }
  setValue(v, errors) {
    try {
      this.init(v, errors);
    } catch(e) {
      if (errors) {
        errors.push(e);
      } else {
        throw e;
      }
    }
    return this.value = v;
  }
  getPath() {
    var p = '';
    if (this.parent && this.key) {
      if (this.parent[__sym]) {
        p = this.parent[__sym].getPath();
      }
      p += (p ? '.' : '') + this.key;
    }
    return p;
  }
  meta(key) {
    if (key) {
      var desc = Object.getOwnPropertyDescriptor(this.value, key);
      return ((desc || {}).get || {}).config;
    } else {
      return this.config;
    }
  }
  static registerType(type, config) {
    if (!Property.types) Property.types = {};
    config.name = type;
    Property.types[type] = config;
  }
  static getConfig(typeOrConfig) {
    if (!Property.types) Property.types = {};
    var config = null;
    if (typeOrConfig) {
      if (typeof typeOrConfig === 'string') {
        config = Property.types[typeOrConfig];
      } else if (typeof typeOrConfig === 'object') {
        config = typeOrConfig;
      }
    }
    if (!config) {
      throw new Error('bad_config');
    }
    return config;
  }
  static create(typeOrConfig, value, parent, key, errors) {
    var factories = {
      "string": StringProperty,
      "number": NumberProperty,
      "boolean": BooleanProperty,
      "array": ArrayProperty,
      "date": DateProperty,
      "select": SelectProperty,
      "object": ObjectProperty
    };
    var config = Property.getConfig(typeOrConfig);
    if (!factories[config.type]) {
      throw new Error('bad_type');
    }
    return new factories[config.type](config, value, parent, key, errors);
  }
}

class StringProperty extends Property {
  constructor(config, value, parent, key, errors) {
    super(config, value, parent, key, errors);
    if (defined(this.config.pattern)) {
      if (typeof this.config.pattern === 'string') {
        this.config.pattern = new RegExp(this.config.pattern);
      } else if (!(this.config.patten instanceof RegExp)) {
        throw new Error('bad_pattern');
      }
    }
  }
  check(v) {
    if (defined(v) && typeof v !== 'string') {
      this.dataError('type');
    }
    super.check(v);
    if (defined(v)) {
      if (defined(this.config.minLength) && v.length < +this.config.minLength) {
        this.dataError('minLength');
      }
      if (defined(this.config.maxLength) && v.length > +this.config.maxLength) {
        this.dataError('maxLength');
      }
      if (defined(this.config.pattern) && !this.config.pattern.test(v)) {
        this.dataError('pattern');
      }
    }
  }
}

class NumberProperty extends Property {
  constructor(config, value, parent, key, errors) {
    super(config, value, parent, key, errors);
  }
  check(v) {
    if (defined(v) && typeof v !== 'number') {
      this.dataError('type');
    }
    super.check(v);
    if (defined(v)) {
      if (defined(this.config.min) && !(v >= +this.config.min)) {
        this.dataError('min');
      }
      if (defined(this.config.max) && !(v <= +this.config.max)) {
        this.dataError('max');
      }
    }
  }
}

class BooleanProperty extends Property {
  constructor(config, value, parent, key, errors) {
    super(config, value, parent, key, errors);
  }
  check(v) {
    if (defined(v) && typeof v !== 'boolean') {
      this.dataError('type');
    }
    super.check(v);
  }
}

class ArrayProperty extends Property {
  constructor(config, value, parent, key, errors) {
    super(config, value, parent, key, errors);
    this.config.value = Property.getConfig(this.config.value);
  }
  init(v, errors) {
    this.check(v);
    if (!defined(v) || v[__sym] === this) return;
    v[__sym] = this;
    for (var i = 0, p ; i < v.length ; i++) {
      p = Property.create(this.config.value, v[i], v, i, errors);
    }
    v.push = (...args) => {
      for (var i = 0 ; i < args.length ; i++) {
        p = Property.create(this.config.value, args[i], v, v.length);
      }
    }
  }
  check(v) {
    if (defined(v) && typeof v !== 'object' && !(v instanceof Array)) {
      this.dataError('type');
    }
    super.check(v);
    if (defined(v)) {
      if (defined(this.config.minLength) && v.length < +this.config.minLength) {
        this.dataError('minLength');
      }
      if (defined(this.config.maxLength) && v.length > +this.config.maxLength) {
        this.dataError('maxLength');
      }
    }
  }
}

class DateProperty extends Property {
  constructor(config, value, parent, key, errors) {
    super(config, value, parent, key, errors);
  }
  setValue(v) {
    var _v = v;
    if (defined(_v) && !(_v instanceof Date)) _v = new Date(v);
    super.setValue(v);
  }
}

class SelectProperty extends Property {
  constructor(config, value, parent, key, errors) {
    super(config, value, parent, key, errors);
    if (!(this.config.value instanceof Array) || !this.config.value.length) {
      throw new Error('bad_value');
    }
  }
  check(v) {
    super.check(v);
    if (this.config.value.indexOf(v) === -1) {
      this.dataError('value');
    }
  }
}

class ObjectProperty extends Property {
  constructor(config, value, parent, key, errors) {
    super(config, value, parent, key, errors);
  }
  init(v, errors) {
    this.check(v);
    if (!defined(v) || v[__sym] === this) return;
    v[__sym] = this;
    var k, p, sub = this.config.value || {};
    for (k in sub) {
      sub[k] = Property.getConfig(sub[k]);
      p = Property.create(sub[k], v[k], v, k, errors);
    }
  }
  check(v) {
    if (defined(v) && typeof v !== 'object') {
      this.dataError('type');
    }
    super.check(v);
  }
}

export function create(typeOrConfig, value, parent, key) {
  return Property.create(typeOrConfig, value || {}, parent, key).value;
}
export function safeCreate(typeOrConfig, value, parent, key) {
  var errors = [];
  var value = Property.create(typeOrConfig, value || {}, parent, key, errors).value;
  if (errors.length) {
    throw new InitError(value, errors);
  } else {
    return value;
  }
}
export function register(type, config, parent) {
  return Property.registerType(type, parent ? extend(Property.getConfig(parent), config) : config);
}
export function config(type) {
  return Property.getConfig(type);
}
export function meta(obj, key) {
  if (defined(obj) && obj[__sym]) {
    return obj[__sym].meta(key);
  } else {
    return undefined;
  }
}