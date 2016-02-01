'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.register = register;
exports.meta = meta;

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

    _this.path = path;
    return _this;
  }

  return DataError;
}(Error);

var Property = function () {
  function Property(config, value) {
    _classCallCheck(this, Property);

    this.config = Property.getConfig(config);
    try {
      this.setValue(value || this.config.default);
    } catch (e) {}
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
    key: 'check',
    value: function check(v) {
      if (!defined(v) && this.config.required) throw new DataError('required', this.getPath());
      if (this.config.validator && !this.config.validator(v)) throw new DataError('validator', this.getPath());
    }
  }, {
    key: 'init',
    value: function init(v) {
      this.check(v);
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
      this.check(this.value);
      return this.value;
    }
  }, {
    key: 'setter',
    value: function setter() {
      var f = this.setValue.bind(this);
      f.config = this.config;
      return f;
    }
  }, {
    key: 'setValue',
    value: function setValue(v) {
      this.init(v);
      return this.value = v;
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
  }, {
    key: 'meta',
    value: function meta(key) {
      if (key) {
        var desc = Object.getOwnPropertyDescriptor(this.value, key);
        return ((desc || {}).get || {}).config;
      } else {
        return this.config;
      }
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
      if (!config) throw new Error('bad_config');
      return config;
    }
  }, {
    key: 'create',
    value: function create(typeOrConfig, value) {
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
  }]);

  return Property;
}();

var StringProperty = function (_Property) {
  _inherits(StringProperty, _Property);

  function StringProperty(config, value) {
    _classCallCheck(this, StringProperty);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(StringProperty).call(this, config, value));

    if (defined(_this2.config.pattern)) {
      if (typeof _this2.config.pattern === 'string') {
        _this2.config.pattern = new RegExp(_this2.config.pattern);
      } else if (!(_this2.config.patten instanceof RegExp)) {
        throw new Error('bad_pattern');
      }
    }
    return _this2;
  }

  _createClass(StringProperty, [{
    key: 'check',
    value: function check(v) {
      if (defined(v) && typeof v !== 'string') throw new DataError('type', this.getPath());
      _get(Object.getPrototypeOf(StringProperty.prototype), 'check', this).call(this, v);
      if (defined(v)) {
        if (defined(this.config.minLength) && v.length < +this.config.minLength) throw new DataError('minLength', this.getPath());
        if (defined(this.config.maxLength) && v.length > +this.config.maxLength) throw new DataError('maxLength', this.getPath());
        if (defined(this.config.pattern) && !this.config.pattern.test(v)) throw new DataError('pattern', this.getPath());
      }
    }
  }]);

  return StringProperty;
}(Property);

var NumberProperty = function (_Property2) {
  _inherits(NumberProperty, _Property2);

  function NumberProperty(config, value) {
    _classCallCheck(this, NumberProperty);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NumberProperty).call(this, config, value));
  }

  _createClass(NumberProperty, [{
    key: 'check',
    value: function check(v) {
      if (defined(v) && typeof v !== 'number') throw new DataError('type', this.getPath());
      _get(Object.getPrototypeOf(NumberProperty.prototype), 'check', this).call(this, v);
      if (defined(v)) {
        if (defined(this.config.min) && !(v >= +this.config.min)) throw new DataError('min', this.getPath());
        if (defined(this.config.max) && !(v <= +this.config.max)) throw new DataError('max', this.getPath());
      }
    }
  }]);

  return NumberProperty;
}(Property);

var BooleanProperty = function (_Property3) {
  _inherits(BooleanProperty, _Property3);

  function BooleanProperty(config, value) {
    _classCallCheck(this, BooleanProperty);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(BooleanProperty).call(this, config, value));
  }

  _createClass(BooleanProperty, [{
    key: 'check',
    value: function check(v) {
      if (defined(v) && typeof v !== 'boolean') throw new DataError('type', this.getPath());
      _get(Object.getPrototypeOf(BooleanProperty.prototype), 'check', this).call(this, v);
    }
  }]);

  return BooleanProperty;
}(Property);

var ArrayProperty = function (_Property4) {
  _inherits(ArrayProperty, _Property4);

  function ArrayProperty(config, value) {
    _classCallCheck(this, ArrayProperty);

    var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayProperty).call(this, config, value));

    _this5.config.value = Property.getConfig(_this5.config.value);
    return _this5;
  }

  _createClass(ArrayProperty, [{
    key: 'init',
    value: function init(v) {
      var _this6 = this;

      this.check(v);
      if (!defined(v) || v[__sym] === this) return;
      for (var i = 0, p; i < v.length; i++) {
        p = Property.create(this.config.value, v[i]);
        if (p) p.attach(v, i);
      }
      v.push = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        for (var i = 0; i < args.length; i++) {
          p = Property.create(_this6.config.value, args[i]);
          if (p) p.attach(v, v.length);
        }
      };
      v[__sym] = this;
    }
  }, {
    key: 'check',
    value: function check(v) {
      if (defined(v) && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) !== 'object' && !(v instanceof Array)) throw new DataError('type', this.getPath());
      _get(Object.getPrototypeOf(ArrayProperty.prototype), 'check', this).call(this, v);
      if (defined(v)) {
        if (defined(this.config.minLength) && v.length < +this.config.minLength) throw new DataError('minLength', this.getPath());
        if (defined(this.config.maxLength) && v.length > +this.config.maxLength) throw new DataError('maxLength', this.getPath());
      }
    }
  }]);

  return ArrayProperty;
}(Property);

var DateProperty = function (_Property5) {
  _inherits(DateProperty, _Property5);

  function DateProperty(config, value) {
    _classCallCheck(this, DateProperty);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(DateProperty).call(this, config, value));
  }

  _createClass(DateProperty, [{
    key: 'setValue',
    value: function setValue(v) {
      var _v = v;
      if (defined(_v) && !(_v instanceof Date)) _v = new Date(v);
      _get(Object.getPrototypeOf(DateProperty.prototype), 'setValue', this).call(this, v);
    }
  }]);

  return DateProperty;
}(Property);

var SelectProperty = function (_Property6) {
  _inherits(SelectProperty, _Property6);

  function SelectProperty(config, value) {
    _classCallCheck(this, SelectProperty);

    var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(SelectProperty).call(this, config, value));

    if (!(_this8.config.value instanceof Array) || !_this8.config.value.length) throw new Error('bad_value');
    return _this8;
  }

  _createClass(SelectProperty, [{
    key: 'check',
    value: function check(v) {
      _get(Object.getPrototypeOf(SelectProperty.prototype), 'check', this).call(this, v);
      if (this.config.value.indexOf(v) === -1) throw new DataError('value', this.getPath());
    }
  }]);

  return SelectProperty;
}(Property);

var ObjectProperty = function (_Property7) {
  _inherits(ObjectProperty, _Property7);

  function ObjectProperty(config, value) {
    _classCallCheck(this, ObjectProperty);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ObjectProperty).call(this, config, value));
  }

  _createClass(ObjectProperty, [{
    key: 'init',
    value: function init(v) {
      this.check(v);
      if (!defined(v) || v[__sym] === this) return;
      var k,
          p,
          sub = this.config.value || {};
      for (k in sub) {
        sub[k] = Property.getConfig(sub[k]);
        p = Property.create(sub[k], v[k]);
        if (p) p.attach(v, k);
      }
      v[__sym] = this;
    }
  }, {
    key: 'check',
    value: function check(v) {
      if (defined(v) && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) !== 'object') throw new DataError('type', this.getPath());
      _get(Object.getPrototypeOf(ObjectProperty.prototype), 'check', this).call(this, v);
    }
  }]);

  return ObjectProperty;
}(Property);

function create(typeOrConfig, value) {
  return Property.create(typeOrConfig, value || {}).value;
}
function register(type, config) {
  return Property.registerType(type, config);
}
function meta(obj, key) {
  if (defined(obj) && obj[__sym]) {
    return obj[__sym].meta(key);
  } else {
    return undefined;
  }
}

//# sourceMappingURL=index.js.map