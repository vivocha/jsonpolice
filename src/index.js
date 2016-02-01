'use strict';

var __sym = Symbol();

function defined(v) {
   return typeof v !== 'undefined';
}

class DataError extends Error {
  constructor(name, path) {
    super(name);
    this.path = path;
  }
}

class Property {
  constructor(config, value) {
    this.config = Property.getConfig(config);
    try {
      this.setValue(value || this.config.default);
    } catch(e) {}
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
  check(v) {
    if (!defined(v) && this.config.required) throw new DataError('required', this.getPath());
    if (this.config.validator && !this.config.validator(v)) throw new DataError('validator', this.getPath());
  }
  init(v) {
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
  setValue(v) {
    this.init(v);
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
    if (!config) throw new Error('bad_config');
    return config;
  }
  static create(typeOrConfig, value) {
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
    if (!factories[config.type]) throw new Error('bad_type');
    return new factories[config.type](config, value);
  }
}

class StringProperty extends Property {
  constructor(config, value) {
    super(config, value);
    if (defined(this.config.pattern)) {
      if (typeof this.config.pattern === 'string') {
        this.config.pattern = new RegExp(this.config.pattern);
      } else if (!(this.config.patten instanceof RegExp)) {
        throw new Error('bad_pattern');
      }
    }
  }
  check(v) {
    if (defined(v) && typeof v !== 'string') throw new DataError('type', this.getPath());
    super.check(v);
    if (defined(v)) {
      if (defined(this.config.minLength) && v.length < +this.config.minLength) throw new DataError('minLength', this.getPath());
      if (defined(this.config.maxLength) && v.length > +this.config.maxLength) throw new DataError('maxLength', this.getPath());
      if (defined(this.config.pattern) && !this.config.pattern.test(v)) throw new DataError('pattern', this.getPath());
    }
  }
}

class NumberProperty extends Property {
  constructor(config, value) {
    super(config, value);
  }
  check(v) {
    if (defined(v) && typeof v !== 'number') throw new DataError('type', this.getPath());
    super.check(v);
    if (defined(v)) {
      if (defined(this.config.min) && !(v >= +this.config.min)) throw new DataError('min', this.getPath());
      if (defined(this.config.max) && !(v <= +this.config.max)) throw new DataError('max', this.getPath());
    }
  }
}

class BooleanProperty extends Property {
  constructor(config, value) {
    super(config, value);
  }
  check(v) {
    if (defined(v) && typeof v !== 'boolean') throw new DataError('type', this.getPath());
    super.check(v);
  }
}

class ArrayProperty extends Property {
  constructor(config, value) {
    super(config, value);
    this.config.value = Property.getConfig(this.config.value);
  }
  init(v) {
    this.check(v);
    if (!defined(v) || v[__sym] === this) return;
    for (var i = 0, p ; i < v.length ; i++) {
      p = Property.create(this.config.value, v[i]);
      if (p) p.attach(v, i);
    }
    v.push = (...args) => {
      for (var i = 0 ; i < args.length ; i++) {
        p = Property.create(this.config.value, args[i]);
        if (p) p.attach(v, v.length);
      }
    }
    v[__sym] = this;
  }
  check(v) {
    if (defined(v) && typeof v !== 'object' && !(v instanceof Array)) throw new DataError('type', this.getPath());
    super.check(v);
    if (defined(v)) {
      if (defined(this.config.minLength) && v.length < +this.config.minLength) throw new DataError('minLength', this.getPath());
      if (defined(this.config.maxLength) && v.length > +this.config.maxLength) throw new DataError('maxLength', this.getPath());
    }
  }
}

class DateProperty extends Property {
  constructor(config, value) {
    super(config, value);
  }
  setValue(v) {
    var _v = v;
    if (defined(_v) && !(_v instanceof Date)) _v = new Date(v);
    super.setValue(v);
  }
}

class SelectProperty extends Property {
  constructor(config, value) {
    super(config, value);
    if (!(this.config.value instanceof Array) || !this.config.value.length) throw new Error('bad_value');
  }
  check(v) {
    super.check(v);
    if (this.config.value.indexOf(v) === -1) throw new DataError('value', this.getPath());
  }
}

class ObjectProperty extends Property {
  constructor(config, value) {
    super(config, value);
  }
  init(v) {
    this.check(v);
    if (!defined(v) || v[__sym] === this) return;
    var k, p, sub = this.config.value || {};
    for (k in sub) {
      sub[k] = Property.getConfig(sub[k]);
      p = Property.create(sub[k], v[k]);
      if (p) p.attach(v, k);
    }
    v[__sym] = this;
  }
  check(v) {
    if (defined(v) && typeof v !== 'object') throw new DataError('type', this.getPath());
    super.check(v);
  }
}

export function create(typeOrConfig, value) {
  return Property.create(typeOrConfig, value || {}).value;
}
export function register(type, config) {
  return Property.registerType(type, config);
}
export function meta(obj, key) {
  if (defined(obj) && obj[__sym]) {
    return obj[__sym].meta(key);
  } else {
    return undefined;
  }
}