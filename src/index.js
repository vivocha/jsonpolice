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
  constructor(config, value, _opts) {
    var opts = _opts || {};
    this.config = Property.getConfig(config);
    if (config.loose) {
      this.loose = true;
    }
    if (opts.errors) {
      this.errors = opts.errors;
    }
    if (defined(opts.parent) && defined(opts.key)) {
      this.attach(opts.parent, opts.key);
      if (!defined(this.loose)) {
        var parent_meta = meta(this.parent);
        if (parent_meta && parent_meta.loose){
          this.loose = true;
        }
      }
    }
    this.setValue(defined(value) ? value : this.config.default);
    delete this.errors;
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
    return v;
  }
  init(v) {
    return this.check(v);
  }
  getter() {
    var f = this.getValue.bind(this);
    f.meta = this;
    return f;
  }
  getValue() {
    return this.check(this.value);
  }
  setter() {
    if (this.parent && ((meta(this.parent) || {}).config || {}).readonly) {
      return () => {
        this.dataError('readonly');
      }
    } else {
      var f = this.setValue.bind(this);
      f.meta = this;
      return f;
    }
  }
  setValue(v) {
    try {
      return this.value = this.init(v);
    } catch(e) {
      if (this.errors) {
        this.errors.push(e);
      } else {
        throw e;
      }
    }
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
      return ((desc || {}).get || {}).meta;
    } else {
      return this;
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
  static create(typeOrConfig, value, opts) {
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
    return new factories[config.type](config, value, opts);
  }
}

class StringProperty extends Property {
  constructor(config, value, opts) {
    super(config, value, opts);
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
      if (this.loose) {
        v = v.toString();
      } else {
        this.dataError('type');
      }
    }
    v = super.check(v);
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
    return v;
  }
}

class NumberProperty extends Property {
  constructor(config, value, opts) {
    super(config, value, opts);
  }
  check(v) {
    if (defined(v) && typeof v !== 'number') {
      if (this.loose) {
        v = +v;
        if (isNaN(v)) {
          this.dataError('type');
        }
      } else {
        this.dataError('type');
      }
    }
    v = super.check(v);
    if (defined(v)) {
      if (defined(this.config.min) && !(v >= +this.config.min)) {
        this.dataError('min');
      }
      if (defined(this.config.max) && !(v <= +this.config.max)) {
        this.dataError('max');
      }
    }
    return v;
  }
}

class BooleanProperty extends Property {
  constructor(config, value, opts) {
    super(config, value, opts);
  }
  check(v) {
    if (defined(v) && typeof v !== 'boolean') {
      if (this.loose) {
        v = (v != 0 && v !== 'false');
      } else {
        this.dataError('type');
      }
    }
    return super.check(v);
  }
}

class ArrayProperty extends Property {
  constructor(config, value, opts) {
    super(config, value, opts);
    this.config.value = Property.getConfig(this.config.value);
  }
  init(v) {
    v = this.check(v);
    if (!defined(v) || v[__sym] === this) return;
    v[__sym] = this;
    for (var i = 0, p ; i < v.length ; i++) {
      p = Property.create(this.config.value, v[i], {
        parent: v,
        key: i,
        errors: this.errors
      });
    }
    v.push = (...args) => {
      for (var i = 0 ; i < args.length ; i++) {
        p = Property.create(this.config.value, args[i], {
          parent: v,
          key: v.length
        });
      }
    }
    return v;
  }
  check(v) {
    if (defined(v) && typeof v !== 'object' && !(v instanceof Array)) {
      this.dataError('type');
    }
    v = super.check(v);
    if (defined(v)) {
      if (defined(this.config.minLength) && v.length < +this.config.minLength) {
        this.dataError('minLength');
      }
      if (defined(this.config.maxLength) && v.length > +this.config.maxLength) {
        this.dataError('maxLength');
      }
    }
    return v;
  }
}

class DateProperty extends Property {
  constructor(config, value, opts) {
    super(config, value, opts);
  }
  setValue(v) {
    var _v = v;
    if (defined(_v) && !(_v instanceof Date)) _v = new Date(v);
    return super.setValue(_v);
  }
}

class SelectProperty extends Property {
  constructor(config, value, opts) {
    super(config, value, opts);
    if (!(this.config.value instanceof Array) || !this.config.value.length) {
      throw new Error('bad_value');
    }
  }
  check(v) {
    v = super.check(v);
    if (this.config.value.indexOf(v) === -1) {
      this.dataError('value');
    }
    return v;
  }
}

class ObjectProperty extends Property {
  constructor(config, value, opts) {
    super(config, value, opts);
    if (this.config.readonly) {
      Object.freeze(this.value);
    } else if (this.config.seal) {
      Object.seal(this.value);
    }
  }
  init(v) {
    v = this.check(v);
    if (!defined(v) || v[__sym] === this) return;
    v[__sym] = this;
    var k, p, sub = this.config.value || {};
    for (k in sub) {
      sub[k] = Property.getConfig(sub[k]);
      p = Property.create(sub[k], v[k], {
        parent: v,
        key: k,
        errors: this.errors
      });
    }
    if (this.config.readonly || this.config.seal) {
      for (k in v) {
        if (!defined(sub[k])) {
          delete v[k];
        }
      }
    }
    return v;
  }
  check(v) {
    if (defined(v) && typeof v !== 'object') {
      if (this.loose && typeof v === 'string') {
        try {
          v = JSON.parse(v);
        } catch(e) {
          this.dataError('parse');
        }
      } else {
        this.dataError('type');
      }
    }
    return super.check(v);
  }
}

export function create(typeOrConfig, value, opts) {
  return Property.create(typeOrConfig, value || {}, opts).value;
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