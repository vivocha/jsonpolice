'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.register = register;
exports.config = config;
exports.meta = meta;

var _eredita = require('eredita');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var __sym = Symbol();

function defined(v) {
  return typeof v !== 'undefined';
}

var DataError = function (_Error) {
  _inherits(DataError, _Error);

  function DataError(name, path) {
    _classCallCheck(this, DataError);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(DataError).call(this, name));

    _this.name = 'DataError';
    _this.path = path;
    return _this;
  }

  return DataError;
}(Error);

var InitError = function (_Error2) {
  _inherits(InitError, _Error2);

  function InitError(value, errors) {
    _classCallCheck(this, InitError);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(InitError).call(this));

    _this2.name = 'InitError';
    _this2.value = value;
    _this2.errors = errors;
    return _this2;
  }

  return InitError;
}(Error);

var Property = function () {
  function Property(config, value, _opts) {
    _classCallCheck(this, Property);

    var opts = _opts || {};
    this.errors = opts.errors;
    this.config = Property.getConfig(config);
    this.loose = config.loose;
    if (defined(opts.parent) && defined(opts.key)) {
      this.attach(opts.parent, opts.key);
      if (!defined(this.loose)) {
        this.loose = (meta(this.parent) || {}).loose;
      }
    }
    this.setValue(defined(value) ? value : this.config.default);
    delete this.errors;
  }

  _createClass(Property, [{
    key: 'attach',
    value: function attach(parent, key) {
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
  }, {
    key: 'detach',
    value: function detach() {
      if (defined(this.key) && defined(this.parent)) {
        delete this.parent[this.key];
      }
      delete this.key;
      delete this.parent;
    }
  }, {
    key: 'dataError',
    value: function dataError(type, sink) {
      var e = new DataError(type, this.getPath());
      if (sink) {
        sink.push(e);
      } else {
        throw e;
      }
    }
  }, {
    key: 'check',
    value: function check(v) {
      if (!defined(v) && this.config.required) {
        this.dataError('required');
      }
      if (this.config.validator && !this.config.validator(v, this)) {
        this.dataError('validator');
      }
      return v;
    }
  }, {
    key: 'init',
    value: function init(v) {
      return this.check(v);
    }
  }, {
    key: 'getter',
    value: function getter() {
      var f = this.getValue.bind(this);
      f.config = this.config;
      return f;
    }
  }, {
    key: 'getValue',
    value: function getValue() {
      return this.check(this.value);
    }
  }, {
    key: 'setter',
    value: function setter() {
      var _this3 = this;

      if (this.parent && ((meta(this.parent) || {}).config || {}).readonly) {
        return function () {
          _this3.dataError('readonly');
        };
      } else {
        var f = this.setValue.bind(this);
        f.config = this.config;
        return f;
      }
    }
  }, {
    key: 'setValue',
    value: function setValue(v) {
      try {
        return this.value = this.init(v);
      } catch (e) {
        if (this.errors) {
          this.errors.push(e);
        } else {
          throw e;
        }
      }
    }
  }, {
    key: 'getPath',
    value: function getPath() {
      var p = '';
      if (this.parent && this.key) {
        if (this.parent[__sym]) {
          p = this.parent[__sym].getPath();
        }
        p += (p ? '.' : '') + this.key;
      }
      return p;
    }
  }], [{
    key: 'registerType',
    value: function registerType(type, config) {
      if (!Property.types) Property.types = {};
      config.name = type;
      Property.types[type] = config;
    }
  }, {
    key: 'getConfig',
    value: function getConfig(typeOrConfig) {
      if (!Property.types) Property.types = {};
      var config = null;
      if (typeOrConfig) {
        if (typeof typeOrConfig === 'string') {
          config = Property.types[typeOrConfig];
        } else if ((typeof typeOrConfig === 'undefined' ? 'undefined' : _typeof(typeOrConfig)) === 'object') {
          config = typeOrConfig;
        }
      }
      if (!config) {
        throw new Error('bad_config');
      }
      return config;
    }
  }, {
    key: 'create',
    value: function create(typeOrConfig, value, opts) {
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
  }]);

  return Property;
}();

var StringProperty = function (_Property) {
  _inherits(StringProperty, _Property);

  function StringProperty(config, value, opts) {
    _classCallCheck(this, StringProperty);

    var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(StringProperty).call(this, config, value, opts));

    if (defined(_this4.config.pattern)) {
      if (typeof _this4.config.pattern === 'string') {
        _this4.config.pattern = new RegExp(_this4.config.pattern);
      } else if (!(_this4.config.patten instanceof RegExp)) {
        throw new Error('bad_pattern');
      }
    }
    return _this4;
  }

  _createClass(StringProperty, [{
    key: 'check',
    value: function check(v) {
      if (defined(v) && typeof v !== 'string') {
        if (this.loose) {
          v = v.toString();
        } else {
          this.dataError('type');
        }
      }
      v = _get(Object.getPrototypeOf(StringProperty.prototype), 'check', this).call(this, v);
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
  }]);

  return StringProperty;
}(Property);

var NumberProperty = function (_Property2) {
  _inherits(NumberProperty, _Property2);

  function NumberProperty(config, value, opts) {
    _classCallCheck(this, NumberProperty);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NumberProperty).call(this, config, value, opts));
  }

  _createClass(NumberProperty, [{
    key: 'check',
    value: function check(v) {
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
      v = _get(Object.getPrototypeOf(NumberProperty.prototype), 'check', this).call(this, v);
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
  }]);

  return NumberProperty;
}(Property);

var BooleanProperty = function (_Property3) {
  _inherits(BooleanProperty, _Property3);

  function BooleanProperty(config, value, opts) {
    _classCallCheck(this, BooleanProperty);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(BooleanProperty).call(this, config, value, opts));
  }

  _createClass(BooleanProperty, [{
    key: 'check',
    value: function check(v) {
      if (defined(v) && typeof v !== 'boolean') {
        if (this.loose) {
          v = v != 0 && v !== 'false';
        } else {
          this.dataError('type');
        }
      }
      return _get(Object.getPrototypeOf(BooleanProperty.prototype), 'check', this).call(this, v);
    }
  }]);

  return BooleanProperty;
}(Property);

var ArrayProperty = function (_Property4) {
  _inherits(ArrayProperty, _Property4);

  function ArrayProperty(config, value, opts) {
    _classCallCheck(this, ArrayProperty);

    var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayProperty).call(this, config, value, opts));

    _this7.config.value = Property.getConfig(_this7.config.value);
    return _this7;
  }

  _createClass(ArrayProperty, [{
    key: 'init',
    value: function init(v) {
      var _this8 = this;

      v = this.check(v);
      if (!defined(v) || v[__sym] === this) return;
      v[__sym] = this;
      for (var i = 0, p; i < v.length; i++) {
        p = Property.create(this.config.value, v[i], {
          parent: v,
          key: i,
          errors: this.errors
        });
      }
      v.push = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        for (var i = 0; i < args.length; i++) {
          p = Property.create(_this8.config.value, args[i], {
            parent: v,
            key: v.length
          });
        }
      };
      return v;
    }
  }, {
    key: 'check',
    value: function check(v) {
      if (defined(v) && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) !== 'object' && !(v instanceof Array)) {
        this.dataError('type');
      }
      v = _get(Object.getPrototypeOf(ArrayProperty.prototype), 'check', this).call(this, v);
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
  }]);

  return ArrayProperty;
}(Property);

var DateProperty = function (_Property5) {
  _inherits(DateProperty, _Property5);

  function DateProperty(config, value, opts) {
    _classCallCheck(this, DateProperty);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(DateProperty).call(this, config, value, opts));
  }

  _createClass(DateProperty, [{
    key: 'setValue',
    value: function setValue(v) {
      var _v = v;
      if (defined(_v) && !(_v instanceof Date)) _v = new Date(v);
      return _get(Object.getPrototypeOf(DateProperty.prototype), 'setValue', this).call(this, _v);
    }
  }]);

  return DateProperty;
}(Property);

var SelectProperty = function (_Property6) {
  _inherits(SelectProperty, _Property6);

  function SelectProperty(config, value, opts) {
    _classCallCheck(this, SelectProperty);

    var _this10 = _possibleConstructorReturn(this, Object.getPrototypeOf(SelectProperty).call(this, config, value, opts));

    if (!(_this10.config.value instanceof Array) || !_this10.config.value.length) {
      throw new Error('bad_value');
    }
    return _this10;
  }

  _createClass(SelectProperty, [{
    key: 'check',
    value: function check(v) {
      v = _get(Object.getPrototypeOf(SelectProperty.prototype), 'check', this).call(this, v);
      if (this.config.value.indexOf(v) === -1) {
        this.dataError('value');
      }
      return v;
    }
  }]);

  return SelectProperty;
}(Property);

var ObjectProperty = function (_Property7) {
  _inherits(ObjectProperty, _Property7);

  function ObjectProperty(config, value, opts) {
    _classCallCheck(this, ObjectProperty);

    var _this11 = _possibleConstructorReturn(this, Object.getPrototypeOf(ObjectProperty).call(this, config, value, opts));

    if (_this11.config.readonly) {
      Object.freeze(_this11.value);
    } else if (_this11.config.seal) {
      Object.seal(_this11.value);
    }
    return _this11;
  }

  _createClass(ObjectProperty, [{
    key: 'init',
    value: function init(v) {
      v = this.check(v);
      if (!defined(v) || v[__sym] === this) return;
      v[__sym] = this;
      var k,
          p,
          sub = this.config.value || {};
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
  }, {
    key: 'check',
    value: function check(v) {
      if (defined(v) && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) !== 'object') {
        if (this.loose && typeof v === 'string') {
          try {
            v = JSON.parse(v);
          } catch (e) {
            this.dataError('parse');
          }
        } else {
          this.dataError('type');
        }
      }
      return _get(Object.getPrototypeOf(ObjectProperty.prototype), 'check', this).call(this, v);
    }
  }]);

  return ObjectProperty;
}(Property);

function create(typeOrConfig, value, opts) {
  return Property.create(typeOrConfig, value || {}, opts).value;
}
function register(type, config, parent) {
  return Property.registerType(type, parent ? (0, _eredita.deepExtend)(Property.getConfig(parent), config) : config);
}
function config(type) {
  return Property.getConfig(type);
}
function meta(obj) {
  return defined(obj) ? obj[__sym] : undefined;
}

//# sourceMappingURL=index.js.map