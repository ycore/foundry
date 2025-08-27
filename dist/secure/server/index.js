var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// ../../node_modules/react/cjs/react.production.js
var exports_react_production = {};
__export(exports_react_production, {
  version: () => $version,
  useTransition: () => $useTransition,
  useSyncExternalStore: () => $useSyncExternalStore,
  useState: () => $useState,
  useRef: () => $useRef,
  useReducer: () => $useReducer,
  useOptimistic: () => $useOptimistic,
  useMemo: () => $useMemo,
  useLayoutEffect: () => $useLayoutEffect,
  useInsertionEffect: () => $useInsertionEffect,
  useImperativeHandle: () => $useImperativeHandle,
  useId: () => $useId,
  useEffect: () => $useEffect,
  useDeferredValue: () => $useDeferredValue,
  useDebugValue: () => $useDebugValue,
  useContext: () => $useContext,
  useCallback: () => $useCallback,
  useActionState: () => $useActionState,
  use: () => $use,
  unstable_useCacheRefresh: () => $unstable_useCacheRefresh,
  startTransition: () => $startTransition,
  memo: () => $memo,
  lazy: () => $lazy,
  isValidElement: () => $isValidElement,
  forwardRef: () => $forwardRef,
  createRef: () => $createRef,
  createElement: () => $createElement,
  createContext: () => $createContext,
  cloneElement: () => $cloneElement,
  cache: () => $cache,
  __COMPILER_RUNTIME: () => $__COMPILER_RUNTIME,
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: () => $__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  Suspense: () => $Suspense,
  StrictMode: () => $StrictMode,
  PureComponent: () => $PureComponent,
  Profiler: () => $Profiler,
  Fragment: () => $Fragment,
  Component: () => $Component,
  Children: () => $Children
});
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== "object")
    return null;
  maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
  return typeof maybeIterable === "function" ? maybeIterable : null;
}
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
function ComponentDummy() {}
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
function ReactElement(type, key, self, source, owner, props) {
  self = props.ref;
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref: self !== undefined ? self : null,
    props
  };
}
function cloneAndReplaceKey(oldElement, newKey) {
  return ReactElement(oldElement.type, newKey, undefined, undefined, undefined, oldElement.props);
}
function isValidElement(object) {
  return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
function escape(key) {
  var escaperLookup = { "=": "=0", ":": "=2" };
  return "$" + key.replace(/[=:]/g, function(match) {
    return escaperLookup[match];
  });
}
function getElementKey(element, index) {
  return typeof element === "object" && element !== null && element.key != null ? escape("" + element.key) : index.toString(36);
}
function noop$1() {}
function resolveThenable(thenable) {
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw thenable.reason;
    default:
      switch (typeof thenable.status === "string" ? thenable.then(noop$1, noop$1) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
        thenable.status === "pending" && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
      }, function(error) {
        thenable.status === "pending" && (thenable.status = "rejected", thenable.reason = error);
      })), thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
      }
  }
  throw thenable;
}
function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;
  if (type === "undefined" || type === "boolean")
    children = null;
  var invokeCallback = false;
  if (children === null)
    invokeCallback = true;
  else
    switch (type) {
      case "bigint":
      case "string":
      case "number":
        invokeCallback = true;
        break;
      case "object":
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
            break;
          case REACT_LAZY_TYPE:
            return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
        }
    }
  if (invokeCallback)
    return callback = callback(children), invokeCallback = nameSoFar === "" ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", invokeCallback != null && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
      return c;
    })) : callback != null && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (callback.key == null || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
  invokeCallback = 0;
  var nextNamePrefix = nameSoFar === "" ? "." : nameSoFar + ":";
  if (isArrayImpl(children))
    for (var i = 0;i < children.length; i++)
      nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
  else if (i = getIteratorFn(children), typeof i === "function")
    for (children = i.call(children), i = 0;!(nameSoFar = children.next()).done; )
      nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
  else if (type === "object") {
    if (typeof children.then === "function")
      return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
    array = String(children);
    throw Error("Objects are not valid as a React child (found: " + (array === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
  }
  return invokeCallback;
}
function mapChildren(children, func, context) {
  if (children == null)
    return children;
  var result = [], count = 0;
  mapIntoArray(children, result, "", "", function(child) {
    return func.call(context, child, count++);
  });
  return result;
}
function lazyInitializer(payload) {
  if (payload._status === -1) {
    var ctor = payload._result;
    ctor = ctor();
    ctor.then(function(moduleObject) {
      if (payload._status === 0 || payload._status === -1)
        payload._status = 1, payload._result = moduleObject;
    }, function(error) {
      if (payload._status === 0 || payload._status === -1)
        payload._status = 2, payload._result = error;
    });
    payload._status === -1 && (payload._status = 0, payload._result = ctor);
  }
  if (payload._status === 1)
    return payload._result.default;
  throw payload._result;
}
function noop() {}
var REACT_ELEMENT_TYPE, REACT_PORTAL_TYPE, REACT_FRAGMENT_TYPE, REACT_STRICT_MODE_TYPE, REACT_PROFILER_TYPE, REACT_CONSUMER_TYPE, REACT_CONTEXT_TYPE, REACT_FORWARD_REF_TYPE, REACT_SUSPENSE_TYPE, REACT_MEMO_TYPE, REACT_LAZY_TYPE, MAYBE_ITERATOR_SYMBOL, ReactNoopUpdateQueue, assign, emptyObject, pureComponentPrototype, isArrayImpl, ReactSharedInternals, hasOwnProperty, userProvidedKeyEscapeRegex, reportGlobalError, $Children, $Component, $Fragment, $Profiler, $PureComponent, $StrictMode, $Suspense, $__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, $__COMPILER_RUNTIME, $cache = function(fn) {
  return function() {
    return fn.apply(null, arguments);
  };
}, $cloneElement = function(element, config, children) {
  if (element === null || element === undefined)
    throw Error("The argument must be a React element, but you passed " + element + ".");
  var props = assign({}, element.props), key = element.key, owner = undefined;
  if (config != null)
    for (propName in config.ref !== undefined && (owner = undefined), config.key !== undefined && (key = "" + config.key), config)
      !hasOwnProperty.call(config, propName) || propName === "key" || propName === "__self" || propName === "__source" || propName === "ref" && config.ref === undefined || (props[propName] = config[propName]);
  var propName = arguments.length - 2;
  if (propName === 1)
    props.children = children;
  else if (1 < propName) {
    for (var childArray = Array(propName), i = 0;i < propName; i++)
      childArray[i] = arguments[i + 2];
    props.children = childArray;
  }
  return ReactElement(element.type, key, undefined, undefined, owner, props);
}, $createContext = function(defaultValue) {
  defaultValue = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: null,
    Consumer: null
  };
  defaultValue.Provider = defaultValue;
  defaultValue.Consumer = {
    $$typeof: REACT_CONSUMER_TYPE,
    _context: defaultValue
  };
  return defaultValue;
}, $createElement = function(type, config, children) {
  var propName, props = {}, key = null;
  if (config != null)
    for (propName in config.key !== undefined && (key = "" + config.key), config)
      hasOwnProperty.call(config, propName) && propName !== "key" && propName !== "__self" && propName !== "__source" && (props[propName] = config[propName]);
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1)
    props.children = children;
  else if (1 < childrenLength) {
    for (var childArray = Array(childrenLength), i = 0;i < childrenLength; i++)
      childArray[i] = arguments[i + 2];
    props.children = childArray;
  }
  if (type && type.defaultProps)
    for (propName in childrenLength = type.defaultProps, childrenLength)
      props[propName] === undefined && (props[propName] = childrenLength[propName]);
  return ReactElement(type, key, undefined, undefined, null, props);
}, $createRef = function() {
  return { current: null };
}, $forwardRef = function(render) {
  return { $$typeof: REACT_FORWARD_REF_TYPE, render };
}, $isValidElement, $lazy = function(ctor) {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: { _status: -1, _result: ctor },
    _init: lazyInitializer
  };
}, $memo = function(type, compare) {
  return {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === undefined ? null : compare
  };
}, $startTransition = function(scope) {
  var prevTransition = ReactSharedInternals.T, currentTransition = {};
  ReactSharedInternals.T = currentTransition;
  try {
    var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
    onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue);
    typeof returnValue === "object" && returnValue !== null && typeof returnValue.then === "function" && returnValue.then(noop, reportGlobalError);
  } catch (error) {
    reportGlobalError(error);
  } finally {
    ReactSharedInternals.T = prevTransition;
  }
}, $unstable_useCacheRefresh = function() {
  return ReactSharedInternals.H.useCacheRefresh();
}, $use = function(usable) {
  return ReactSharedInternals.H.use(usable);
}, $useActionState = function(action, initialState, permalink) {
  return ReactSharedInternals.H.useActionState(action, initialState, permalink);
}, $useCallback = function(callback, deps) {
  return ReactSharedInternals.H.useCallback(callback, deps);
}, $useContext = function(Context) {
  return ReactSharedInternals.H.useContext(Context);
}, $useDebugValue = function() {}, $useDeferredValue = function(value, initialValue) {
  return ReactSharedInternals.H.useDeferredValue(value, initialValue);
}, $useEffect = function(create, createDeps, update) {
  var dispatcher = ReactSharedInternals.H;
  if (typeof update === "function")
    throw Error("useEffect CRUD overload is not enabled in this build of React.");
  return dispatcher.useEffect(create, createDeps);
}, $useId = function() {
  return ReactSharedInternals.H.useId();
}, $useImperativeHandle = function(ref, create, deps) {
  return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
}, $useInsertionEffect = function(create, deps) {
  return ReactSharedInternals.H.useInsertionEffect(create, deps);
}, $useLayoutEffect = function(create, deps) {
  return ReactSharedInternals.H.useLayoutEffect(create, deps);
}, $useMemo = function(create, deps) {
  return ReactSharedInternals.H.useMemo(create, deps);
}, $useOptimistic = function(passthrough, reducer) {
  return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
}, $useReducer = function(reducer, initialArg, init) {
  return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
}, $useRef = function(initialValue) {
  return ReactSharedInternals.H.useRef(initialValue);
}, $useState = function(initialState) {
  return ReactSharedInternals.H.useState(initialState);
}, $useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
  return ReactSharedInternals.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}, $useTransition = function() {
  return ReactSharedInternals.H.useTransition();
}, $version = "19.1.1";
var init_react_production = __esm(() => {
  REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
  REACT_PORTAL_TYPE = Symbol.for("react.portal");
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
  REACT_PROFILER_TYPE = Symbol.for("react.profiler");
  REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
  REACT_CONTEXT_TYPE = Symbol.for("react.context");
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
  REACT_MEMO_TYPE = Symbol.for("react.memo");
  REACT_LAZY_TYPE = Symbol.for("react.lazy");
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
  ReactNoopUpdateQueue = {
    isMounted: function() {
      return false;
    },
    enqueueForceUpdate: function() {},
    enqueueReplaceState: function() {},
    enqueueSetState: function() {}
  };
  assign = Object.assign;
  emptyObject = {};
  Component.prototype.isReactComponent = {};
  Component.prototype.setState = function(partialState, callback) {
    if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null)
      throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, partialState, callback, "setState");
  };
  Component.prototype.forceUpdate = function(callback) {
    this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
  };
  ComponentDummy.prototype = Component.prototype;
  pureComponentPrototype = PureComponent.prototype = new ComponentDummy;
  pureComponentPrototype.constructor = PureComponent;
  assign(pureComponentPrototype, Component.prototype);
  pureComponentPrototype.isPureReactComponent = true;
  isArrayImpl = Array.isArray;
  ReactSharedInternals = { H: null, A: null, T: null, S: null, V: null };
  hasOwnProperty = Object.prototype.hasOwnProperty;
  userProvidedKeyEscapeRegex = /\/+/g;
  reportGlobalError = typeof reportError === "function" ? reportError : function(error) {
    if (typeof window === "object" && typeof window.ErrorEvent === "function") {
      var event = new window.ErrorEvent("error", {
        bubbles: true,
        cancelable: true,
        message: typeof error === "object" && error !== null && typeof error.message === "string" ? String(error.message) : String(error),
        error
      });
      if (!window.dispatchEvent(event))
        return;
    } else if (typeof process === "object" && typeof process.emit === "function") {
      process.emit("uncaughtException", error);
      return;
    }
    console.error(error);
  };
  $Children = {
    map: mapChildren,
    forEach: function(children, forEachFunc, forEachContext) {
      mapChildren(children, function() {
        forEachFunc.apply(this, arguments);
      }, forEachContext);
    },
    count: function(children) {
      var n = 0;
      mapChildren(children, function() {
        n++;
      });
      return n;
    },
    toArray: function(children) {
      return mapChildren(children, function(child) {
        return child;
      }) || [];
    },
    only: function(children) {
      if (!isValidElement(children))
        throw Error("React.Children.only expected to receive a single React element child.");
      return children;
    }
  };
  $Component = Component;
  $Fragment = REACT_FRAGMENT_TYPE;
  $Profiler = REACT_PROFILER_TYPE;
  $PureComponent = PureComponent;
  $StrictMode = REACT_STRICT_MODE_TYPE;
  $Suspense = REACT_SUSPENSE_TYPE;
  $__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
  $__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(size) {
      return ReactSharedInternals.H.useMemoCache(size);
    }
  };
  $isValidElement = isValidElement;
});

// ../../node_modules/react/index.js
var require_react = __commonJS((exports, module) => {
  init_react_production();
  if (true) {
    module.exports = exports_react_production;
  } else {}
});

// ../../node_modules/cookie/dist/index.js
var require_dist = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parse = parse;
  exports.serialize = serialize;
  var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
  var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
  var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
  var __toString = Object.prototype.toString;
  var NullObject = /* @__PURE__ */ (() => {
    const C = function() {};
    C.prototype = Object.create(null);
    return C;
  })();
  function parse(str, options) {
    const obj = new NullObject;
    const len = str.length;
    if (len < 2)
      return obj;
    const dec = options?.decode || decode;
    let index = 0;
    do {
      const eqIdx = str.indexOf("=", index);
      if (eqIdx === -1)
        break;
      const colonIdx = str.indexOf(";", index);
      const endIdx = colonIdx === -1 ? len : colonIdx;
      if (eqIdx > endIdx) {
        index = str.lastIndexOf(";", eqIdx - 1) + 1;
        continue;
      }
      const keyStartIdx = startIndex(str, index, eqIdx);
      const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
      const key = str.slice(keyStartIdx, keyEndIdx);
      if (obj[key] === undefined) {
        let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
        let valEndIdx = endIndex(str, endIdx, valStartIdx);
        const value = dec(str.slice(valStartIdx, valEndIdx));
        obj[key] = value;
      }
      index = endIdx + 1;
    } while (index < len);
    return obj;
  }
  function startIndex(str, index, max) {
    do {
      const code = str.charCodeAt(index);
      if (code !== 32 && code !== 9)
        return index;
    } while (++index < max);
    return max;
  }
  function endIndex(str, index, min) {
    while (index > min) {
      const code = str.charCodeAt(--index);
      if (code !== 32 && code !== 9)
        return index + 1;
    }
    return min;
  }
  function serialize(name, val, options) {
    const enc = options?.encode || encodeURIComponent;
    if (!cookieNameRegExp.test(name)) {
      throw new TypeError(`argument name is invalid: ${name}`);
    }
    const value = enc(val);
    if (!cookieValueRegExp.test(value)) {
      throw new TypeError(`argument val is invalid: ${val}`);
    }
    let str = name + "=" + value;
    if (!options)
      return str;
    if (options.maxAge !== undefined) {
      if (!Number.isInteger(options.maxAge)) {
        throw new TypeError(`option maxAge is invalid: ${options.maxAge}`);
      }
      str += "; Max-Age=" + options.maxAge;
    }
    if (options.domain) {
      if (!domainValueRegExp.test(options.domain)) {
        throw new TypeError(`option domain is invalid: ${options.domain}`);
      }
      str += "; Domain=" + options.domain;
    }
    if (options.path) {
      if (!pathValueRegExp.test(options.path)) {
        throw new TypeError(`option path is invalid: ${options.path}`);
      }
      str += "; Path=" + options.path;
    }
    if (options.expires) {
      if (!isDate(options.expires) || !Number.isFinite(options.expires.valueOf())) {
        throw new TypeError(`option expires is invalid: ${options.expires}`);
      }
      str += "; Expires=" + options.expires.toUTCString();
    }
    if (options.httpOnly) {
      str += "; HttpOnly";
    }
    if (options.secure) {
      str += "; Secure";
    }
    if (options.partitioned) {
      str += "; Partitioned";
    }
    if (options.priority) {
      const priority = typeof options.priority === "string" ? options.priority.toLowerCase() : undefined;
      switch (priority) {
        case "low":
          str += "; Priority=Low";
          break;
        case "medium":
          str += "; Priority=Medium";
          break;
        case "high":
          str += "; Priority=High";
          break;
        default:
          throw new TypeError(`option priority is invalid: ${options.priority}`);
      }
    }
    if (options.sameSite) {
      const sameSite = typeof options.sameSite === "string" ? options.sameSite.toLowerCase() : options.sameSite;
      switch (sameSite) {
        case true:
        case "strict":
          str += "; SameSite=Strict";
          break;
        case "lax":
          str += "; SameSite=Lax";
          break;
        case "none":
          str += "; SameSite=None";
          break;
        default:
          throw new TypeError(`option sameSite is invalid: ${options.sameSite}`);
      }
    }
    return str;
  }
  function decode(str) {
    if (str.indexOf("%") === -1)
      return str;
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }
  function isDate(val) {
    return __toString.call(val) === "[object Date]";
  }
});

// ../../node_modules/react-dom/cjs/react-dom.production.js
var exports_react_dom_production = {};
__export(exports_react_dom_production, {
  version: () => $version2,
  useFormStatus: () => $useFormStatus,
  useFormState: () => $useFormState,
  unstable_batchedUpdates: () => $unstable_batchedUpdates,
  requestFormReset: () => $requestFormReset,
  preloadModule: () => $preloadModule,
  preload: () => $preload,
  preinitModule: () => $preinitModule,
  preinit: () => $preinit,
  prefetchDNS: () => $prefetchDNS,
  preconnect: () => $preconnect,
  flushSync: () => $flushSync,
  createPortal: () => $createPortal,
  __DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: () => $__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
});
function formatProdErrorMessage(code) {
  var url = "https://react.dev/errors/" + code;
  if (1 < arguments.length) {
    url += "?args[]=" + encodeURIComponent(arguments[1]);
    for (var i = 2;i < arguments.length; i++)
      url += "&args[]=" + encodeURIComponent(arguments[i]);
  }
  return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
function noop2() {}
function createPortal$1(children, containerInfo, implementation) {
  var key = 3 < arguments.length && arguments[3] !== undefined ? arguments[3] : null;
  return {
    $$typeof: REACT_PORTAL_TYPE2,
    key: key == null ? null : "" + key,
    children,
    containerInfo,
    implementation
  };
}
function getCrossOriginStringAs(as, input) {
  if (as === "font")
    return "";
  if (typeof input === "string")
    return input === "use-credentials" ? input : "";
}
var React12, Internals, REACT_PORTAL_TYPE2, ReactSharedInternals2, $__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, $createPortal = function(children, container) {
  var key = 2 < arguments.length && arguments[2] !== undefined ? arguments[2] : null;
  if (!container || container.nodeType !== 1 && container.nodeType !== 9 && container.nodeType !== 11)
    throw Error(formatProdErrorMessage(299));
  return createPortal$1(children, container, null, key);
}, $flushSync = function(fn) {
  var previousTransition = ReactSharedInternals2.T, previousUpdatePriority = Internals.p;
  try {
    if (ReactSharedInternals2.T = null, Internals.p = 2, fn)
      return fn();
  } finally {
    ReactSharedInternals2.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
  }
}, $preconnect = function(href, options) {
  typeof href === "string" && (options ? (options = options.crossOrigin, options = typeof options === "string" ? options === "use-credentials" ? options : "" : undefined) : options = null, Internals.d.C(href, options));
}, $prefetchDNS = function(href) {
  typeof href === "string" && Internals.d.D(href);
}, $preinit = function(href, options) {
  if (typeof href === "string" && options && typeof options.as === "string") {
    var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = typeof options.integrity === "string" ? options.integrity : undefined, fetchPriority = typeof options.fetchPriority === "string" ? options.fetchPriority : undefined;
    as === "style" ? Internals.d.S(href, typeof options.precedence === "string" ? options.precedence : undefined, {
      crossOrigin,
      integrity,
      fetchPriority
    }) : as === "script" && Internals.d.X(href, {
      crossOrigin,
      integrity,
      fetchPriority,
      nonce: typeof options.nonce === "string" ? options.nonce : undefined
    });
  }
}, $preinitModule = function(href, options) {
  if (typeof href === "string")
    if (typeof options === "object" && options !== null) {
      if (options.as == null || options.as === "script") {
        var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
        Internals.d.M(href, {
          crossOrigin,
          integrity: typeof options.integrity === "string" ? options.integrity : undefined,
          nonce: typeof options.nonce === "string" ? options.nonce : undefined
        });
      }
    } else
      options == null && Internals.d.M(href);
}, $preload = function(href, options) {
  if (typeof href === "string" && typeof options === "object" && options !== null && typeof options.as === "string") {
    var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin);
    Internals.d.L(href, as, {
      crossOrigin,
      integrity: typeof options.integrity === "string" ? options.integrity : undefined,
      nonce: typeof options.nonce === "string" ? options.nonce : undefined,
      type: typeof options.type === "string" ? options.type : undefined,
      fetchPriority: typeof options.fetchPriority === "string" ? options.fetchPriority : undefined,
      referrerPolicy: typeof options.referrerPolicy === "string" ? options.referrerPolicy : undefined,
      imageSrcSet: typeof options.imageSrcSet === "string" ? options.imageSrcSet : undefined,
      imageSizes: typeof options.imageSizes === "string" ? options.imageSizes : undefined,
      media: typeof options.media === "string" ? options.media : undefined
    });
  }
}, $preloadModule = function(href, options) {
  if (typeof href === "string")
    if (options) {
      var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
      Internals.d.m(href, {
        as: typeof options.as === "string" && options.as !== "script" ? options.as : undefined,
        crossOrigin,
        integrity: typeof options.integrity === "string" ? options.integrity : undefined
      });
    } else
      Internals.d.m(href);
}, $requestFormReset = function(form) {
  Internals.d.r(form);
}, $unstable_batchedUpdates = function(fn, a) {
  return fn(a);
}, $useFormState = function(action, initialState, permalink) {
  return ReactSharedInternals2.H.useFormState(action, initialState, permalink);
}, $useFormStatus = function() {
  return ReactSharedInternals2.H.useHostTransitionStatus();
}, $version2 = "19.1.1";
var init_react_dom_production = __esm(() => {
  React12 = __toESM(require_react(), 1);
  Internals = {
    d: {
      f: noop2,
      r: function() {
        throw Error(formatProdErrorMessage(522));
      },
      D: noop2,
      C: noop2,
      L: noop2,
      m: noop2,
      X: noop2,
      S: noop2,
      M: noop2
    },
    p: 0,
    findDOMNode: null
  };
  REACT_PORTAL_TYPE2 = Symbol.for("react.portal");
  ReactSharedInternals2 = React12.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  $__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
});

// ../../node_modules/react-dom/index.js
var require_react_dom = __commonJS((exports, module) => {
  init_react_dom_production();
  function checkDCE() {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
      return;
    }
    if (false) {}
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
    } catch (err) {
      console.error(err);
    }
  }
  if (true) {
    checkDCE();
    module.exports = exports_react_dom_production;
  } else {}
});

// ../../node_modules/react-router/dist/development/chunk-PVWAREVJ.mjs
var React = __toESM(require_react(), 1);
var React2 = __toESM(require_react(), 1);
var React3 = __toESM(require_react(), 1);
var React4 = __toESM(require_react(), 1);
var React9 = __toESM(require_react(), 1);
var React8 = __toESM(require_react(), 1);
var React7 = __toESM(require_react(), 1);
var React6 = __toESM(require_react(), 1);
var React5 = __toESM(require_react(), 1);
var React10 = __toESM(require_react(), 1);
var React11 = __toESM(require_react(), 1);
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message);
  }
}
function warning(cond, message) {
  if (!cond) {
    if (typeof console !== "undefined")
      console.warn(message);
    try {
      throw new Error(message);
    } catch (e) {}
  }
}
function createPath({
  pathname = "/",
  search = "",
  hash = ""
}) {
  if (search && search !== "?")
    pathname += search.charAt(0) === "?" ? search : "?" + search;
  if (hash && hash !== "#")
    pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
  return pathname;
}
function parsePath(path) {
  let parsedPath = {};
  if (path) {
    let hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
      parsedPath.hash = path.substring(hashIndex);
      path = path.substring(0, hashIndex);
    }
    let searchIndex = path.indexOf("?");
    if (searchIndex >= 0) {
      parsedPath.search = path.substring(searchIndex);
      path = path.substring(0, searchIndex);
    }
    if (path) {
      parsedPath.pathname = path;
    }
  }
  return parsedPath;
}
function unstable_createContext(defaultValue) {
  return { defaultValue };
}
var _map;
_map = new WeakMap;
function matchRoutes(routes, locationArg, basename = "/") {
  return matchRoutesImpl(routes, locationArg, basename, false);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
  let location2 = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
  let pathname = stripBasename(location2.pathname || "/", basename);
  if (pathname == null) {
    return null;
  }
  let branches = flattenRoutes(routes);
  rankRouteBranches(branches);
  let matches = null;
  for (let i = 0;matches == null && i < branches.length; ++i) {
    let decoded = decodePath(pathname);
    matches = matchRouteBranch(branches[i], decoded, allowPartial);
  }
  return matches;
}
function convertRouteMatchToUiMatch(match, loaderData) {
  let { route, pathname, params } = match;
  return {
    id: route.id,
    pathname,
    params,
    data: loaderData[route.id],
    loaderData: loaderData[route.id],
    handle: route.handle
  };
}
function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = "", _hasParentOptionalSegments = false) {
  let flattenRoute = (route, index, hasParentOptionalSegments = _hasParentOptionalSegments, relativePath) => {
    let meta = {
      relativePath: relativePath === undefined ? route.path || "" : relativePath,
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route
    };
    if (meta.relativePath.startsWith("/")) {
      if (!meta.relativePath.startsWith(parentPath) && hasParentOptionalSegments) {
        return;
      }
      invariant(meta.relativePath.startsWith(parentPath), `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`);
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }
    let path = joinPaths([parentPath, meta.relativePath]);
    let routesMeta = parentsMeta.concat(meta);
    if (route.children && route.children.length > 0) {
      invariant(route.index !== true, `Index routes must not have child routes. Please remove all child routes from route path "${path}".`);
      flattenRoutes(route.children, branches, routesMeta, path, hasParentOptionalSegments);
    }
    if (route.path == null && !route.index) {
      return;
    }
    branches.push({
      path,
      score: computeScore(path, route.index),
      routesMeta
    });
  };
  routes.forEach((route, index) => {
    if (route.path === "" || !route.path?.includes("?")) {
      flattenRoute(route, index);
    } else {
      for (let exploded of explodeOptionalSegments(route.path)) {
        flattenRoute(route, index, true, exploded);
      }
    }
  });
  return branches;
}
function explodeOptionalSegments(path) {
  let segments = path.split("/");
  if (segments.length === 0)
    return [];
  let [first, ...rest] = segments;
  let isOptional = first.endsWith("?");
  let required = first.replace(/\?$/, "");
  if (rest.length === 0) {
    return isOptional ? [required, ""] : [required];
  }
  let restExploded = explodeOptionalSegments(rest.join("/"));
  let result = [];
  result.push(...restExploded.map((subpath) => subpath === "" ? required : [required, subpath].join("/")));
  if (isOptional) {
    result.push(...restExploded);
  }
  return result.map((exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded);
}
function rankRouteBranches(branches) {
  branches.sort((a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(a.routesMeta.map((meta) => meta.childrenIndex), b.routesMeta.map((meta) => meta.childrenIndex)));
}
var paramRe = /^:[\w-]+$/;
var dynamicSegmentValue = 3;
var indexRouteValue = 2;
var emptySegmentValue = 1;
var staticSegmentValue = 10;
var splatPenalty = -2;
var isSplat = (s) => s === "*";
function computeScore(path, index) {
  let segments = path.split("/");
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }
  if (index) {
    initialScore += indexRouteValue;
  }
  return segments.filter((s) => !isSplat(s)).reduce((score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
}
function compareIndexes(a, b) {
  let siblings = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);
  return siblings ? a[a.length - 1] - b[b.length - 1] : 0;
}
function matchRouteBranch(branch, pathname, allowPartial = false) {
  let { routesMeta } = branch;
  let matchedParams = {};
  let matchedPathname = "/";
  let matches = [];
  for (let i = 0;i < routesMeta.length; ++i) {
    let meta = routesMeta[i];
    let end = i === routesMeta.length - 1;
    let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
    let match = matchPath({ path: meta.relativePath, caseSensitive: meta.caseSensitive, end }, remainingPathname);
    let route = meta.route;
    if (!match && end && allowPartial && !routesMeta[routesMeta.length - 1].route.index) {
      match = matchPath({
        path: meta.relativePath,
        caseSensitive: meta.caseSensitive,
        end: false
      }, remainingPathname);
    }
    if (!match) {
      return null;
    }
    Object.assign(matchedParams, match.params);
    matches.push({
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
      route
    });
    if (match.pathnameBase !== "/") {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }
  return matches;
}
function matchPath(pattern, pathname) {
  if (typeof pattern === "string") {
    pattern = { path: pattern, caseSensitive: false, end: true };
  }
  let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
  let match = pathname.match(matcher);
  if (!match)
    return null;
  let matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  let captureGroups = match.slice(1);
  let params = compiledParams.reduce((memo2, { paramName, isOptional }, index) => {
    if (paramName === "*") {
      let splatValue = captureGroups[index] || "";
      pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
    }
    const value = captureGroups[index];
    if (isOptional && !value) {
      memo2[paramName] = undefined;
    } else {
      memo2[paramName] = (value || "").replace(/%2F/g, "/");
    }
    return memo2;
  }, {});
  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}
function compilePath(path, caseSensitive = false, end = true) {
  warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), `Route path "${path}" will be treated as if it were "${path.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${path.replace(/\*$/, "/*")}".`);
  let params = [];
  let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
    params.push({ paramName, isOptional: isOptional != null });
    return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
  }).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
  if (path.endsWith("*")) {
    params.push({ paramName: "*" });
    regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
  } else if (end) {
    regexpSource += "\\/*$";
  } else if (path !== "" && path !== "/") {
    regexpSource += "(?:(?=\\/|$))";
  } else {}
  let matcher = new RegExp(regexpSource, caseSensitive ? undefined : "i");
  return [matcher, params];
}
function decodePath(value) {
  try {
    return value.split("/").map((v) => decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
  } catch (error) {
    warning(false, `The URL path "${value}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${error}).`);
    return value;
  }
}
function stripBasename(pathname, basename) {
  if (basename === "/")
    return pathname;
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }
  let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
  let nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") {
    return null;
  }
  return pathname.slice(startIndex) || "/";
}
function resolvePath(to, fromPathname = "/") {
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;
  let pathname = toPathname ? toPathname.startsWith("/") ? toPathname : resolvePathname(toPathname, fromPathname) : fromPathname;
  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash)
  };
}
function resolvePathname(relativePath, fromPathname) {
  let segments = fromPathname.replace(/\/+$/, "").split("/");
  let relativeSegments = relativePath.split("/");
  relativeSegments.forEach((segment) => {
    if (segment === "..") {
      if (segments.length > 1)
        segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });
  return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
  return `Cannot include a '${char}' character in a manually specified \`to.${field}\` field [${JSON.stringify(path)}].  Please separate it out to the \`to.${dest}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function getPathContributingMatches(matches) {
  return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
}
function getResolveToMatches(matches) {
  let pathMatches = getPathContributingMatches(matches);
  return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
}
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative = false) {
  let to;
  if (typeof toArg === "string") {
    to = parsePath(toArg);
  } else {
    to = { ...toArg };
    invariant(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
    invariant(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
    invariant(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
  }
  let isEmptyPath = toArg === "" || to.pathname === "";
  let toPathname = isEmptyPath ? "/" : to.pathname;
  let from;
  if (toPathname == null) {
    from = locationPathname;
  } else {
    let routePathnameIndex = routePathnames.length - 1;
    if (!isPathRelative && toPathname.startsWith("..")) {
      let toSegments = toPathname.split("/");
      while (toSegments[0] === "..") {
        toSegments.shift();
        routePathnameIndex -= 1;
      }
      to.pathname = toSegments.join("/");
    }
    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
  }
  let path = resolvePath(to, from);
  let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
  let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
  if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
    path.pathname += "/";
  }
  return path;
}
var joinPaths = (paths) => paths.join("/").replace(/\/\/+/g, "/");
var normalizePathname = (pathname) => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
var normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
var normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
function isRouteErrorResponse(error) {
  return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
var validMutationMethodsArr = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE"
];
var validMutationMethods = new Set(validMutationMethodsArr);
var validRequestMethodsArr = [
  "GET",
  ...validMutationMethodsArr
];
var validRequestMethods = new Set(validRequestMethodsArr);
var ResetLoaderDataSymbol = Symbol("ResetLoaderData");
var DataRouterContext = React.createContext(null);
DataRouterContext.displayName = "DataRouter";
var DataRouterStateContext = React.createContext(null);
DataRouterStateContext.displayName = "DataRouterState";
var RSCRouterContext = React.createContext(false);
var ViewTransitionContext = React.createContext({
  isTransitioning: false
});
ViewTransitionContext.displayName = "ViewTransition";
var FetchersContext = React.createContext(/* @__PURE__ */ new Map);
FetchersContext.displayName = "Fetchers";
var AwaitContext = React.createContext(null);
AwaitContext.displayName = "Await";
var NavigationContext = React.createContext(null);
NavigationContext.displayName = "Navigation";
var LocationContext = React.createContext(null);
LocationContext.displayName = "Location";
var RouteContext = React.createContext({
  outlet: null,
  matches: [],
  isDataRoute: false
});
RouteContext.displayName = "Route";
var RouteErrorContext = React.createContext(null);
RouteErrorContext.displayName = "RouteError";
var ENABLE_DEV_WARNINGS = true;
function useHref(to, { relative } = {}) {
  invariant(useInRouterContext(), `useHref() may be used only in the context of a <Router> component.`);
  let { basename, navigator } = React2.useContext(NavigationContext);
  let { hash, pathname, search } = useResolvedPath(to, { relative });
  let joinedPathname = pathname;
  if (basename !== "/") {
    joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
  }
  return navigator.createHref({ pathname: joinedPathname, search, hash });
}
function useInRouterContext() {
  return React2.useContext(LocationContext) != null;
}
function useLocation() {
  invariant(useInRouterContext(), `useLocation() may be used only in the context of a <Router> component.`);
  return React2.useContext(LocationContext).location;
}
var navigateEffectWarning = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;
function useIsomorphicLayoutEffect(cb) {
  let isStatic = React2.useContext(NavigationContext).static;
  if (!isStatic) {
    React2.useLayoutEffect(cb);
  }
}
function useNavigate() {
  let { isDataRoute } = React2.useContext(RouteContext);
  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
  invariant(useInRouterContext(), `useNavigate() may be used only in the context of a <Router> component.`);
  let dataRouterContext = React2.useContext(DataRouterContext);
  let { basename, navigator } = React2.useContext(NavigationContext);
  let { matches } = React2.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
  let activeRef = React2.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = React2.useCallback((to, options = {}) => {
    warning(activeRef.current, navigateEffectWarning);
    if (!activeRef.current)
      return;
    if (typeof to === "number") {
      navigator.go(to);
      return;
    }
    let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
    if (dataRouterContext == null && basename !== "/") {
      path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
    }
    (options.replace ? navigator.replace : navigator.push)(path, options.state, options);
  }, [
    basename,
    navigator,
    routePathnamesJson,
    locationPathname,
    dataRouterContext
  ]);
  return navigate;
}
var OutletContext = React2.createContext(null);
function useResolvedPath(to, { relative } = {}) {
  let { matches } = React2.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
  return React2.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [to, routePathnamesJson, locationPathname, relative]);
}
function useRoutesImpl(routes, locationArg, dataRouterState, unstable_onError, future) {
  invariant(useInRouterContext(), `useRoutes() may be used only in the context of a <Router> component.`);
  let { navigator } = React2.useContext(NavigationContext);
  let { matches: parentMatches } = React2.useContext(RouteContext);
  let routeMatch = parentMatches[parentMatches.length - 1];
  let parentParams = routeMatch ? routeMatch.params : {};
  let parentPathname = routeMatch ? routeMatch.pathname : "/";
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
  let parentRoute = routeMatch && routeMatch.route;
  if (ENABLE_DEV_WARNINGS) {
    let parentPath = parentRoute && parentRoute.path || "";
    warningOnce(parentPathname, !parentRoute || parentPath.endsWith("*") || parentPath.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${parentPathname}" (under <Route path="${parentPath}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${parentPath}"> to <Route path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`);
  }
  let locationFromContext = useLocation();
  let location2;
  if (locationArg) {
    let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    invariant(parentPathnameBase === "/" || parsedLocationArg.pathname?.startsWith(parentPathnameBase), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${parentPathnameBase}" but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`);
    location2 = parsedLocationArg;
  } else {
    location2 = locationFromContext;
  }
  let pathname = location2.pathname || "/";
  let remainingPathname = pathname;
  if (parentPathnameBase !== "/") {
    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
    let segments = pathname.replace(/^\//, "").split("/");
    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
  }
  let matches = matchRoutes(routes, { pathname: remainingPathname });
  if (ENABLE_DEV_WARNINGS) {
    warning(parentRoute || matches != null, `No routes matched location "${location2.pathname}${location2.search}${location2.hash}" `);
    warning(matches == null || matches[matches.length - 1].route.element !== undefined || matches[matches.length - 1].route.Component !== undefined || matches[matches.length - 1].route.lazy !== undefined, `Matched leaf route at location "${location2.pathname}${location2.search}${location2.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);
  }
  let renderedMatches = _renderMatches(matches && matches.map((match) => Object.assign({}, match, {
    params: Object.assign({}, parentParams, match.params),
    pathname: joinPaths([
      parentPathnameBase,
      navigator.encodeLocation ? navigator.encodeLocation(match.pathname).pathname : match.pathname
    ]),
    pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([
      parentPathnameBase,
      navigator.encodeLocation ? navigator.encodeLocation(match.pathnameBase).pathname : match.pathnameBase
    ])
  })), parentMatches, dataRouterState, unstable_onError, future);
  if (locationArg && renderedMatches) {
    return /* @__PURE__ */ React2.createElement(LocationContext.Provider, {
      value: {
        location: {
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: "default",
          ...location2
        },
        navigationType: "POP"
      }
    }, renderedMatches);
  }
  return renderedMatches;
}
function DefaultErrorComponent() {
  let error = useRouteError();
  let message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : JSON.stringify(error);
  let stack = error instanceof Error ? error.stack : null;
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = { padding: "0.5rem", backgroundColor: lightgrey };
  let codeStyles = { padding: "2px 4px", backgroundColor: lightgrey };
  let devInfo = null;
  if (ENABLE_DEV_WARNINGS) {
    console.error("Error handled by React Router default ErrorBoundary:", error);
    devInfo = /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("p", null, "\uD83D\uDCBF Hey developer \uD83D\uDC4B"), /* @__PURE__ */ React2.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ React2.createElement("code", { style: codeStyles }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ React2.createElement("code", { style: codeStyles }, "errorElement"), " prop on your route."));
  }
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ React2.createElement("h3", { style: { fontStyle: "italic" } }, message), stack ? /* @__PURE__ */ React2.createElement("pre", { style: preStyles }, stack) : null, devInfo);
}
var defaultErrorElement = /* @__PURE__ */ React2.createElement(DefaultErrorComponent, null);
var RenderErrorBoundary = class extends React2.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.location,
      revalidation: props.revalidation,
      error: props.error
    };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") {
      return {
        error: props.error,
        location: props.location,
        revalidation: props.revalidation
      };
    }
    return {
      error: props.error !== undefined ? props.error : state.error,
      location: state.location,
      revalidation: props.revalidation || state.revalidation
    };
  }
  componentDidCatch(error, errorInfo) {
    if (this.props.unstable_onError) {
      this.props.unstable_onError(error, errorInfo);
    } else {
      console.error("React Router caught the following error during render", error);
    }
  }
  render() {
    return this.state.error !== undefined ? /* @__PURE__ */ React2.createElement(RouteContext.Provider, { value: this.props.routeContext }, /* @__PURE__ */ React2.createElement(RouteErrorContext.Provider, {
      value: this.state.error,
      children: this.props.component
    })) : this.props.children;
  }
};
function RenderedRoute({ routeContext, match, children }) {
  let dataRouterContext = React2.useContext(DataRouterContext);
  if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) {
    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
  }
  return /* @__PURE__ */ React2.createElement(RouteContext.Provider, { value: routeContext }, children);
}
function _renderMatches(matches, parentMatches = [], dataRouterState = null, unstable_onError = null, future = null) {
  if (matches == null) {
    if (!dataRouterState) {
      return null;
    }
    if (dataRouterState.errors) {
      matches = dataRouterState.matches;
    } else if (parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) {
      matches = dataRouterState.matches;
    } else {
      return null;
    }
  }
  let renderedMatches = matches;
  let errors = dataRouterState?.errors;
  if (errors != null) {
    let errorIndex = renderedMatches.findIndex((m) => m.route.id && errors?.[m.route.id] !== undefined);
    invariant(errorIndex >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(errors).join(",")}`);
    renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
  }
  let renderFallback = false;
  let fallbackIndex = -1;
  if (dataRouterState) {
    for (let i = 0;i < renderedMatches.length; i++) {
      let match = renderedMatches[i];
      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
        fallbackIndex = i;
      }
      if (match.route.id) {
        let { loaderData, errors: errors2 } = dataRouterState;
        let needsToRunLoader = match.route.loader && !loaderData.hasOwnProperty(match.route.id) && (!errors2 || errors2[match.route.id] === undefined);
        if (match.route.lazy || needsToRunLoader) {
          renderFallback = true;
          if (fallbackIndex >= 0) {
            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
          } else {
            renderedMatches = [renderedMatches[0]];
          }
          break;
        }
      }
    }
  }
  return renderedMatches.reduceRight((outlet, match, index) => {
    let error;
    let shouldRenderHydrateFallback = false;
    let errorElement = null;
    let hydrateFallbackElement = null;
    if (dataRouterState) {
      error = errors && match.route.id ? errors[match.route.id] : undefined;
      errorElement = match.route.errorElement || defaultErrorElement;
      if (renderFallback) {
        if (fallbackIndex < 0 && index === 0) {
          warningOnce("route-fallback", false, "No `HydrateFallback` element provided to render during initial hydration");
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = null;
        } else if (fallbackIndex === index) {
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = match.route.hydrateFallbackElement || null;
        }
      }
    }
    let matches2 = parentMatches.concat(renderedMatches.slice(0, index + 1));
    let getChildren = () => {
      let children;
      if (error) {
        children = errorElement;
      } else if (shouldRenderHydrateFallback) {
        children = hydrateFallbackElement;
      } else if (match.route.Component) {
        children = /* @__PURE__ */ React2.createElement(match.route.Component, null);
      } else if (match.route.element) {
        children = match.route.element;
      } else {
        children = outlet;
      }
      return /* @__PURE__ */ React2.createElement(RenderedRoute, {
        match,
        routeContext: {
          outlet,
          matches: matches2,
          isDataRoute: dataRouterState != null
        },
        children
      });
    };
    return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ React2.createElement(RenderErrorBoundary, {
      location: dataRouterState.location,
      revalidation: dataRouterState.revalidation,
      component: errorElement,
      error,
      children: getChildren(),
      routeContext: { outlet: null, matches: matches2, isDataRoute: true },
      unstable_onError
    }) : getChildren();
  }, null);
}
function getDataRouterConsoleError(hookName) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useDataRouterContext(hookName) {
  let ctx = React2.useContext(DataRouterContext);
  invariant(ctx, getDataRouterConsoleError(hookName));
  return ctx;
}
function useDataRouterState(hookName) {
  let state = React2.useContext(DataRouterStateContext);
  invariant(state, getDataRouterConsoleError(hookName));
  return state;
}
function useRouteContext(hookName) {
  let route = React2.useContext(RouteContext);
  invariant(route, getDataRouterConsoleError(hookName));
  return route;
}
function useCurrentRouteId(hookName) {
  let route = useRouteContext(hookName);
  let thisRoute = route.matches[route.matches.length - 1];
  invariant(thisRoute.route.id, `${hookName} can only be used on routes that contain a unique "id"`);
  return thisRoute.route.id;
}
function useRouteId() {
  return useCurrentRouteId("useRouteId");
}
function useNavigation() {
  let state = useDataRouterState("useNavigation");
  return state.navigation;
}
function useMatches() {
  let { matches, loaderData } = useDataRouterState("useMatches");
  return React2.useMemo(() => matches.map((m) => convertRouteMatchToUiMatch(m, loaderData)), [matches, loaderData]);
}
function useRouteError() {
  let error = React2.useContext(RouteErrorContext);
  let state = useDataRouterState("useRouteError");
  let routeId = useCurrentRouteId("useRouteError");
  if (error !== undefined) {
    return error;
  }
  return state.errors?.[routeId];
}
function useNavigateStable() {
  let { router } = useDataRouterContext("useNavigate");
  let id = useCurrentRouteId("useNavigate");
  let activeRef = React2.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = React2.useCallback(async (to, options = {}) => {
    warning(activeRef.current, navigateEffectWarning);
    if (!activeRef.current)
      return;
    if (typeof to === "number") {
      router.navigate(to);
    } else {
      await router.navigate(to, { fromRouteId: id, ...options });
    }
  }, [router, id]);
  return navigate;
}
var alreadyWarned = {};
function warningOnce(key, cond, message) {
  if (!cond && !alreadyWarned[key]) {
    alreadyWarned[key] = true;
    warning(false, message);
  }
}
var alreadyWarned2 = {};
function warnOnce(condition, message) {
  if (!condition && !alreadyWarned2[message]) {
    alreadyWarned2[message] = true;
    console.warn(message);
  }
}
var MemoizedDataRoutes = React3.memo(DataRoutes);
function DataRoutes({
  routes,
  future,
  state,
  unstable_onError
}) {
  return useRoutesImpl(routes, undefined, state, unstable_onError, future);
}
function Router({
  basename: basenameProp = "/",
  children = null,
  location: locationProp,
  navigationType = "POP",
  navigator,
  static: staticProp = false
}) {
  invariant(!useInRouterContext(), `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`);
  let basename = basenameProp.replace(/^\/*/, "/");
  let navigationContext = React3.useMemo(() => ({
    basename,
    navigator,
    static: staticProp,
    future: {}
  }), [basename, navigator, staticProp]);
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }
  let {
    pathname = "/",
    search = "",
    hash = "",
    state = null,
    key = "default"
  } = locationProp;
  let locationContext = React3.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);
    if (trailingPathname == null) {
      return null;
    }
    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state,
        key
      },
      navigationType
    };
  }, [basename, pathname, search, hash, state, key, navigationType]);
  warning(locationContext != null, `<Router basename="${basename}"> is not able to match the URL "${pathname}${search}${hash}" because it does not start with the basename, so the <Router> won't render anything.`);
  if (locationContext == null) {
    return null;
  }
  return /* @__PURE__ */ React3.createElement(NavigationContext.Provider, { value: navigationContext }, /* @__PURE__ */ React3.createElement(LocationContext.Provider, { children, value: locationContext }));
}
var defaultMethod = "get";
var defaultEncType = "application/x-www-form-urlencoded";
function isHtmlElement(object) {
  return object != null && typeof object.tagName === "string";
}
function isButtonElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}
function isFormElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}
function isInputElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
  return event.button === 0 && (!target || target === "_self") && !isModifiedEvent(event);
}
var _formDataSupportsSubmitter = null;
function isFormDataSubmitterSupported() {
  if (_formDataSupportsSubmitter === null) {
    try {
      new FormData(document.createElement("form"), 0);
      _formDataSupportsSubmitter = false;
    } catch (e) {
      _formDataSupportsSubmitter = true;
    }
  }
  return _formDataSupportsSubmitter;
}
var supportedFormEncTypes = /* @__PURE__ */ new Set([
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
]);
function getFormEncType(encType) {
  if (encType != null && !supportedFormEncTypes.has(encType)) {
    warning(false, `"${encType}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${defaultEncType}"`);
    return null;
  }
  return encType;
}
function getFormSubmissionInfo(target, basename) {
  let method;
  let action;
  let encType;
  let formData;
  let body;
  if (isFormElement(target)) {
    let attr = target.getAttribute("action");
    action = attr ? stripBasename(attr, basename) : null;
    method = target.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(target);
  } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
    let form = target.form;
    if (form == null) {
      throw new Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);
    }
    let attr = target.getAttribute("formaction") || form.getAttribute("action");
    action = attr ? stripBasename(attr, basename) : null;
    method = target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(form, target);
    if (!isFormDataSubmitterSupported()) {
      let { name, type, value } = target;
      if (type === "image") {
        let prefix = name ? `${name}.` : "";
        formData.append(`${prefix}x`, "0");
        formData.append(`${prefix}y`, "0");
      } else if (name) {
        formData.append(name, value);
      }
    }
  } else if (isHtmlElement(target)) {
    throw new Error(`Cannot submit element that is not <form>, <button>, or <input type="submit|image">`);
  } else {
    method = defaultMethod;
    action = null;
    encType = defaultEncType;
    body = target;
  }
  if (formData && encType === "text/plain") {
    body = formData;
    formData = undefined;
  }
  return { action, method: method.toLowerCase(), encType, formData, body };
}
var objectProtoNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\x00");
function invariant2(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message);
  }
}
var SingleFetchRedirectSymbol = Symbol("SingleFetchRedirect");
var NO_BODY_STATUS_CODES = /* @__PURE__ */ new Set([100, 101, 204, 205]);
function singleFetchUrl(reqUrl, basename, extension) {
  let url = typeof reqUrl === "string" ? new URL(reqUrl, typeof window === "undefined" ? "server://singlefetch/" : window.location.origin) : reqUrl;
  if (url.pathname === "/") {
    url.pathname = `_root.${extension}`;
  } else if (basename && stripBasename(url.pathname, basename) === "/") {
    url.pathname = `${basename.replace(/\/$/, "")}/_root.${extension}`;
  } else {
    url.pathname = `${url.pathname.replace(/\/$/, "")}.${extension}`;
  }
  return url;
}
async function loadRouteModule(route, routeModulesCache) {
  if (route.id in routeModulesCache) {
    return routeModulesCache[route.id];
  }
  try {
    let routeModule = await import(route.module);
    routeModulesCache[route.id] = routeModule;
    return routeModule;
  } catch (error) {
    console.error(`Error loading route module \`${route.module}\`, reloading page...`);
    console.error(error);
    if (window.__reactRouterContext && window.__reactRouterContext.isSpaMode && undefined) {}
    window.location.reload();
    return new Promise(() => {});
  }
}
function isPageLinkDescriptor(object) {
  return object != null && typeof object.page === "string";
}
function isHtmlLinkDescriptor(object) {
  if (object == null) {
    return false;
  }
  if (object.href == null) {
    return object.rel === "preload" && typeof object.imageSrcSet === "string" && typeof object.imageSizes === "string";
  }
  return typeof object.rel === "string" && typeof object.href === "string";
}
async function getKeyedPrefetchLinks(matches, manifest, routeModules) {
  let links = await Promise.all(matches.map(async (match) => {
    let route = manifest.routes[match.route.id];
    if (route) {
      let mod = await loadRouteModule(route, routeModules);
      return mod.links ? mod.links() : [];
    }
    return [];
  }));
  return dedupeLinkDescriptors(links.flat(1).filter(isHtmlLinkDescriptor).filter((link) => link.rel === "stylesheet" || link.rel === "preload").map((link) => link.rel === "stylesheet" ? { ...link, rel: "prefetch", as: "style" } : { ...link, rel: "prefetch" }));
}
function getNewMatchesForLinks(page, nextMatches, currentMatches, manifest, location2, mode) {
  let isNew = (match, index) => {
    if (!currentMatches[index])
      return true;
    return match.route.id !== currentMatches[index].route.id;
  };
  let matchPathChanged = (match, index) => {
    return currentMatches[index].pathname !== match.pathname || currentMatches[index].route.path?.endsWith("*") && currentMatches[index].params["*"] !== match.params["*"];
  };
  if (mode === "assets") {
    return nextMatches.filter((match, index) => isNew(match, index) || matchPathChanged(match, index));
  }
  if (mode === "data") {
    return nextMatches.filter((match, index) => {
      let manifestRoute = manifest.routes[match.route.id];
      if (!manifestRoute || !manifestRoute.hasLoader) {
        return false;
      }
      if (isNew(match, index) || matchPathChanged(match, index)) {
        return true;
      }
      if (match.route.shouldRevalidate) {
        let routeChoice = match.route.shouldRevalidate({
          currentUrl: new URL(location2.pathname + location2.search + location2.hash, window.origin),
          currentParams: currentMatches[0]?.params || {},
          nextUrl: new URL(page, window.origin),
          nextParams: match.params,
          defaultShouldRevalidate: true
        });
        if (typeof routeChoice === "boolean") {
          return routeChoice;
        }
      }
      return true;
    });
  }
  return [];
}
function getModuleLinkHrefs(matches, manifest, { includeHydrateFallback } = {}) {
  return dedupeHrefs(matches.map((match) => {
    let route = manifest.routes[match.route.id];
    if (!route)
      return [];
    let hrefs = [route.module];
    if (route.clientActionModule) {
      hrefs = hrefs.concat(route.clientActionModule);
    }
    if (route.clientLoaderModule) {
      hrefs = hrefs.concat(route.clientLoaderModule);
    }
    if (includeHydrateFallback && route.hydrateFallbackModule) {
      hrefs = hrefs.concat(route.hydrateFallbackModule);
    }
    if (route.imports) {
      hrefs = hrefs.concat(route.imports);
    }
    return hrefs;
  }).flat(1));
}
function dedupeHrefs(hrefs) {
  return [...new Set(hrefs)];
}
function sortKeys(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}
function dedupeLinkDescriptors(descriptors, preloads) {
  let set = /* @__PURE__ */ new Set;
  let preloadsSet = new Set(preloads);
  return descriptors.reduce((deduped, descriptor) => {
    let alreadyModulePreload = preloads && !isPageLinkDescriptor(descriptor) && descriptor.as === "script" && descriptor.href && preloadsSet.has(descriptor.href);
    if (alreadyModulePreload) {
      return deduped;
    }
    let key = JSON.stringify(sortKeys(descriptor));
    if (!set.has(key)) {
      set.add(key);
      deduped.push({ key, link: descriptor });
    }
    return deduped;
  }, []);
}
function useDataRouterContext2() {
  let context = React8.useContext(DataRouterContext);
  invariant2(context, "You must render this element inside a <DataRouterContext.Provider> element");
  return context;
}
function useDataRouterStateContext() {
  let context = React8.useContext(DataRouterStateContext);
  invariant2(context, "You must render this element inside a <DataRouterStateContext.Provider> element");
  return context;
}
var FrameworkContext = React8.createContext(undefined);
FrameworkContext.displayName = "FrameworkContext";
function useFrameworkContext() {
  let context = React8.useContext(FrameworkContext);
  invariant2(context, "You must render this element inside a <HydratedRouter> element");
  return context;
}
function usePrefetchBehavior(prefetch, theirElementProps) {
  let frameworkContext = React8.useContext(FrameworkContext);
  let [maybePrefetch, setMaybePrefetch] = React8.useState(false);
  let [shouldPrefetch, setShouldPrefetch] = React8.useState(false);
  let { onFocus, onBlur, onMouseEnter, onMouseLeave, onTouchStart } = theirElementProps;
  let ref = React8.useRef(null);
  React8.useEffect(() => {
    if (prefetch === "render") {
      setShouldPrefetch(true);
    }
    if (prefetch === "viewport") {
      let callback = (entries) => {
        entries.forEach((entry) => {
          setShouldPrefetch(entry.isIntersecting);
        });
      };
      let observer = new IntersectionObserver(callback, { threshold: 0.5 });
      if (ref.current)
        observer.observe(ref.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [prefetch]);
  React8.useEffect(() => {
    if (maybePrefetch) {
      let id = setTimeout(() => {
        setShouldPrefetch(true);
      }, 100);
      return () => {
        clearTimeout(id);
      };
    }
  }, [maybePrefetch]);
  let setIntent = () => {
    setMaybePrefetch(true);
  };
  let cancelIntent = () => {
    setMaybePrefetch(false);
    setShouldPrefetch(false);
  };
  if (!frameworkContext) {
    return [false, ref, {}];
  }
  if (prefetch !== "intent") {
    return [shouldPrefetch, ref, {}];
  }
  return [
    shouldPrefetch,
    ref,
    {
      onFocus: composeEventHandlers(onFocus, setIntent),
      onBlur: composeEventHandlers(onBlur, cancelIntent),
      onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
      onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
      onTouchStart: composeEventHandlers(onTouchStart, setIntent)
    }
  ];
}
function composeEventHandlers(theirHandler, ourHandler) {
  return (event) => {
    theirHandler && theirHandler(event);
    if (!event.defaultPrevented) {
      ourHandler(event);
    }
  };
}
function PrefetchPageLinks({ page, ...linkProps }) {
  let { router } = useDataRouterContext2();
  let matches = React8.useMemo(() => matchRoutes(router.routes, page, router.basename), [router.routes, page, router.basename]);
  if (!matches) {
    return null;
  }
  return /* @__PURE__ */ React8.createElement(PrefetchPageLinksImpl, { page, matches, ...linkProps });
}
function useKeyedPrefetchLinks(matches) {
  let { manifest, routeModules } = useFrameworkContext();
  let [keyedPrefetchLinks, setKeyedPrefetchLinks] = React8.useState([]);
  React8.useEffect(() => {
    let interrupted = false;
    getKeyedPrefetchLinks(matches, manifest, routeModules).then((links) => {
      if (!interrupted) {
        setKeyedPrefetchLinks(links);
      }
    });
    return () => {
      interrupted = true;
    };
  }, [matches, manifest, routeModules]);
  return keyedPrefetchLinks;
}
function PrefetchPageLinksImpl({
  page,
  matches: nextMatches,
  ...linkProps
}) {
  let location2 = useLocation();
  let { manifest, routeModules } = useFrameworkContext();
  let { basename } = useDataRouterContext2();
  let { loaderData, matches } = useDataRouterStateContext();
  let newMatchesForData = React8.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, manifest, location2, "data"), [page, nextMatches, matches, manifest, location2]);
  let newMatchesForAssets = React8.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, manifest, location2, "assets"), [page, nextMatches, matches, manifest, location2]);
  let dataHrefs = React8.useMemo(() => {
    if (page === location2.pathname + location2.search + location2.hash) {
      return [];
    }
    let routesParams = /* @__PURE__ */ new Set;
    let foundOptOutRoute = false;
    nextMatches.forEach((m) => {
      let manifestRoute = manifest.routes[m.route.id];
      if (!manifestRoute || !manifestRoute.hasLoader) {
        return;
      }
      if (!newMatchesForData.some((m2) => m2.route.id === m.route.id) && m.route.id in loaderData && routeModules[m.route.id]?.shouldRevalidate) {
        foundOptOutRoute = true;
      } else if (manifestRoute.hasClientLoader) {
        foundOptOutRoute = true;
      } else {
        routesParams.add(m.route.id);
      }
    });
    if (routesParams.size === 0) {
      return [];
    }
    let url = singleFetchUrl(page, basename, "data");
    if (foundOptOutRoute && routesParams.size > 0) {
      url.searchParams.set("_routes", nextMatches.filter((m) => routesParams.has(m.route.id)).map((m) => m.route.id).join(","));
    }
    return [url.pathname + url.search];
  }, [
    basename,
    loaderData,
    location2,
    manifest,
    newMatchesForData,
    nextMatches,
    page,
    routeModules
  ]);
  let moduleHrefs = React8.useMemo(() => getModuleLinkHrefs(newMatchesForAssets, manifest), [newMatchesForAssets, manifest]);
  let keyedPrefetchLinks = useKeyedPrefetchLinks(newMatchesForAssets);
  return /* @__PURE__ */ React8.createElement(React8.Fragment, null, dataHrefs.map((href) => /* @__PURE__ */ React8.createElement("link", { key: href, rel: "prefetch", as: "fetch", href, ...linkProps })), moduleHrefs.map((href) => /* @__PURE__ */ React8.createElement("link", { key: href, rel: "modulepreload", href, ...linkProps })), keyedPrefetchLinks.map(({ key, link }) => /* @__PURE__ */ React8.createElement("link", { key, nonce: linkProps.nonce, ...link })));
}
function mergeRefs(...refs) {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        ref.current = value;
      }
    });
  };
}
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
try {
  if (isBrowser) {
    window.__reactRouterVersion = "7.8.2";
  }
} catch (e) {}
function HistoryRouter({
  basename,
  children,
  history
}) {
  let [state, setStateImpl] = React10.useState({
    action: history.action,
    location: history.location
  });
  let setState = React10.useCallback((newState) => {
    React10.startTransition(() => setStateImpl(newState));
  }, [setStateImpl]);
  React10.useLayoutEffect(() => history.listen(setState), [history, setState]);
  return /* @__PURE__ */ React10.createElement(Router, {
    basename,
    children,
    location: state.location,
    navigationType: state.action,
    navigator: history
  });
}
HistoryRouter.displayName = "unstable_HistoryRouter";
var ABSOLUTE_URL_REGEX2 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
var Link = React10.forwardRef(function LinkWithRef({
  onClick,
  discover = "render",
  prefetch = "none",
  relative,
  reloadDocument,
  replace: replace2,
  state,
  target,
  to,
  preventScrollReset,
  viewTransition,
  ...rest
}, forwardedRef) {
  let { basename } = React10.useContext(NavigationContext);
  let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX2.test(to);
  let absoluteHref;
  let isExternal = false;
  if (typeof to === "string" && isAbsolute) {
    absoluteHref = to;
    if (isBrowser) {
      try {
        let currentUrl = new URL(window.location.href);
        let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
        let path = stripBasename(targetUrl.pathname, basename);
        if (targetUrl.origin === currentUrl.origin && path != null) {
          to = path + targetUrl.search + targetUrl.hash;
        } else {
          isExternal = true;
        }
      } catch (e) {
        warning(false, `<Link to="${to}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`);
      }
    }
  }
  let href = useHref(to, { relative });
  let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(prefetch, rest);
  let internalOnClick = useLinkClickHandler(to, {
    replace: replace2,
    state,
    target,
    preventScrollReset,
    relative,
    viewTransition
  });
  function handleClick(event) {
    if (onClick)
      onClick(event);
    if (!event.defaultPrevented) {
      internalOnClick(event);
    }
  }
  let link = /* @__PURE__ */ React10.createElement("a", {
    ...rest,
    ...prefetchHandlers,
    href: absoluteHref || href,
    onClick: isExternal || reloadDocument ? onClick : handleClick,
    ref: mergeRefs(forwardedRef, prefetchRef),
    target,
    "data-discover": !isAbsolute && discover === "render" ? "true" : undefined
  });
  return shouldPrefetch && !isAbsolute ? /* @__PURE__ */ React10.createElement(React10.Fragment, null, link, /* @__PURE__ */ React10.createElement(PrefetchPageLinks, { page: href })) : link;
});
Link.displayName = "Link";
var NavLink = React10.forwardRef(function NavLinkWithRef({
  "aria-current": ariaCurrentProp = "page",
  caseSensitive = false,
  className: classNameProp = "",
  end = false,
  style: styleProp,
  to,
  viewTransition,
  children,
  ...rest
}, ref) {
  let path = useResolvedPath(to, { relative: rest.relative });
  let location2 = useLocation();
  let routerState = React10.useContext(DataRouterStateContext);
  let { navigator, basename } = React10.useContext(NavigationContext);
  let isTransitioning = routerState != null && useViewTransitionState(path) && viewTransition === true;
  let toPathname = navigator.encodeLocation ? navigator.encodeLocation(path).pathname : path.pathname;
  let locationPathname = location2.pathname;
  let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
  if (!caseSensitive) {
    locationPathname = locationPathname.toLowerCase();
    nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
    toPathname = toPathname.toLowerCase();
  }
  if (nextLocationPathname && basename) {
    nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
  }
  const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
  let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
  let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
  let renderProps = {
    isActive,
    isPending,
    isTransitioning
  };
  let ariaCurrent = isActive ? ariaCurrentProp : undefined;
  let className;
  if (typeof classNameProp === "function") {
    className = classNameProp(renderProps);
  } else {
    className = [
      classNameProp,
      isActive ? "active" : null,
      isPending ? "pending" : null,
      isTransitioning ? "transitioning" : null
    ].filter(Boolean).join(" ");
  }
  let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
  return /* @__PURE__ */ React10.createElement(Link, {
    ...rest,
    "aria-current": ariaCurrent,
    className,
    ref,
    style,
    to,
    viewTransition
  }, typeof children === "function" ? children(renderProps) : children);
});
NavLink.displayName = "NavLink";
var Form = React10.forwardRef(({
  discover = "render",
  fetcherKey,
  navigate,
  reloadDocument,
  replace: replace2,
  state,
  method = defaultMethod,
  action,
  onSubmit,
  relative,
  preventScrollReset,
  viewTransition,
  ...props
}, forwardedRef) => {
  let submit = useSubmit();
  let formAction = useFormAction(action, { relative });
  let formMethod = method.toLowerCase() === "get" ? "get" : "post";
  let isAbsolute = typeof action === "string" && ABSOLUTE_URL_REGEX2.test(action);
  let submitHandler = (event) => {
    onSubmit && onSubmit(event);
    if (event.defaultPrevented)
      return;
    event.preventDefault();
    let submitter = event.nativeEvent.submitter;
    let submitMethod = submitter?.getAttribute("formmethod") || method;
    submit(submitter || event.currentTarget, {
      fetcherKey,
      method: submitMethod,
      navigate,
      replace: replace2,
      state,
      relative,
      preventScrollReset,
      viewTransition
    });
  };
  return /* @__PURE__ */ React10.createElement("form", {
    ref: forwardedRef,
    method: formMethod,
    action: formAction,
    onSubmit: reloadDocument ? onSubmit : submitHandler,
    ...props,
    "data-discover": !isAbsolute && discover === "render" ? "true" : undefined
  });
});
Form.displayName = "Form";
function ScrollRestoration({
  getKey,
  storageKey,
  ...props
}) {
  let remixContext = React10.useContext(FrameworkContext);
  let { basename } = React10.useContext(NavigationContext);
  let location2 = useLocation();
  let matches = useMatches();
  useScrollRestoration({ getKey, storageKey });
  let ssrKey = React10.useMemo(() => {
    if (!remixContext || !getKey)
      return null;
    let userKey = getScrollRestorationKey(location2, matches, basename, getKey);
    return userKey !== location2.key ? userKey : null;
  }, []);
  if (!remixContext || remixContext.isSpaMode) {
    return null;
  }
  let restoreScroll = ((storageKey2, restoreKey) => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key }, "");
    }
    try {
      let positions = JSON.parse(sessionStorage.getItem(storageKey2) || "{}");
      let storedY = positions[restoreKey || window.history.state.key];
      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem(storageKey2);
    }
  }).toString();
  return /* @__PURE__ */ React10.createElement("script", {
    ...props,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: {
      __html: `(${restoreScroll})(${JSON.stringify(storageKey || SCROLL_RESTORATION_STORAGE_KEY)}, ${JSON.stringify(ssrKey)})`
    }
  });
}
ScrollRestoration.displayName = "ScrollRestoration";
function getDataRouterConsoleError2(hookName) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useDataRouterContext3(hookName) {
  let ctx = React10.useContext(DataRouterContext);
  invariant(ctx, getDataRouterConsoleError2(hookName));
  return ctx;
}
function useDataRouterState2(hookName) {
  let state = React10.useContext(DataRouterStateContext);
  invariant(state, getDataRouterConsoleError2(hookName));
  return state;
}
function useLinkClickHandler(to, {
  target,
  replace: replaceProp,
  state,
  preventScrollReset,
  relative,
  viewTransition
} = {}) {
  let navigate = useNavigate();
  let location2 = useLocation();
  let path = useResolvedPath(to, { relative });
  return React10.useCallback((event) => {
    if (shouldProcessLinkClick(event, target)) {
      event.preventDefault();
      let replace2 = replaceProp !== undefined ? replaceProp : createPath(location2) === createPath(path);
      navigate(to, {
        replace: replace2,
        state,
        preventScrollReset,
        relative,
        viewTransition
      });
    }
  }, [
    location2,
    navigate,
    path,
    replaceProp,
    state,
    target,
    to,
    preventScrollReset,
    relative,
    viewTransition
  ]);
}
var fetcherId = 0;
var getUniqueFetcherId = () => `__${String(++fetcherId)}__`;
function useSubmit() {
  let { router } = useDataRouterContext3("useSubmit");
  let { basename } = React10.useContext(NavigationContext);
  let currentRouteId = useRouteId();
  return React10.useCallback(async (target, options = {}) => {
    let { action, method, encType, formData, body } = getFormSubmissionInfo(target, basename);
    if (options.navigate === false) {
      let key = options.fetcherKey || getUniqueFetcherId();
      await router.fetch(key, currentRouteId, options.action || action, {
        preventScrollReset: options.preventScrollReset,
        formData,
        body,
        formMethod: options.method || method,
        formEncType: options.encType || encType,
        flushSync: options.flushSync
      });
    } else {
      await router.navigate(options.action || action, {
        preventScrollReset: options.preventScrollReset,
        formData,
        body,
        formMethod: options.method || method,
        formEncType: options.encType || encType,
        replace: options.replace,
        state: options.state,
        fromRouteId: currentRouteId,
        flushSync: options.flushSync,
        viewTransition: options.viewTransition
      });
    }
  }, [router, basename, currentRouteId]);
}
function useFormAction(action, { relative } = {}) {
  let { basename } = React10.useContext(NavigationContext);
  let routeContext = React10.useContext(RouteContext);
  invariant(routeContext, "useFormAction must be used inside a RouteContext");
  let [match] = routeContext.matches.slice(-1);
  let path = { ...useResolvedPath(action ? action : ".", { relative }) };
  let location2 = useLocation();
  if (action == null) {
    path.search = location2.search;
    let params = new URLSearchParams(path.search);
    let indexValues = params.getAll("index");
    let hasNakedIndexParam = indexValues.some((v) => v === "");
    if (hasNakedIndexParam) {
      params.delete("index");
      indexValues.filter((v) => v).forEach((v) => params.append("index", v));
      let qs = params.toString();
      path.search = qs ? `?${qs}` : "";
    }
  }
  if ((!action || action === ".") && match.route.index) {
    path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
  }
  if (basename !== "/") {
    path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
  }
  return createPath(path);
}
var SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
var savedScrollPositions = {};
function getScrollRestorationKey(location2, matches, basename, getKey) {
  let key = null;
  if (getKey) {
    if (basename !== "/") {
      key = getKey({
        ...location2,
        pathname: stripBasename(location2.pathname, basename) || location2.pathname
      }, matches);
    } else {
      key = getKey(location2, matches);
    }
  }
  if (key == null) {
    key = location2.key;
  }
  return key;
}
function useScrollRestoration({
  getKey,
  storageKey
} = {}) {
  let { router } = useDataRouterContext3("useScrollRestoration");
  let { restoreScrollPosition, preventScrollReset } = useDataRouterState2("useScrollRestoration");
  let { basename } = React10.useContext(NavigationContext);
  let location2 = useLocation();
  let matches = useMatches();
  let navigation = useNavigation();
  React10.useEffect(() => {
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);
  usePageHide(React10.useCallback(() => {
    if (navigation.state === "idle") {
      let key = getScrollRestorationKey(location2, matches, basename, getKey);
      savedScrollPositions[key] = window.scrollY;
    }
    try {
      sessionStorage.setItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY, JSON.stringify(savedScrollPositions));
    } catch (error) {
      warning(false, `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`);
    }
    window.history.scrollRestoration = "auto";
  }, [navigation.state, getKey, basename, location2, matches, storageKey]));
  if (typeof document !== "undefined") {
    React10.useLayoutEffect(() => {
      try {
        let sessionPositions = sessionStorage.getItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY);
        if (sessionPositions) {
          savedScrollPositions = JSON.parse(sessionPositions);
        }
      } catch (e) {}
    }, [storageKey]);
    React10.useLayoutEffect(() => {
      let disableScrollRestoration = router?.enableScrollRestoration(savedScrollPositions, () => window.scrollY, getKey ? (location22, matches2) => getScrollRestorationKey(location22, matches2, basename, getKey) : undefined);
      return () => disableScrollRestoration && disableScrollRestoration();
    }, [router, basename, getKey]);
    React10.useLayoutEffect(() => {
      if (restoreScrollPosition === false) {
        return;
      }
      if (typeof restoreScrollPosition === "number") {
        window.scrollTo(0, restoreScrollPosition);
        return;
      }
      try {
        if (location2.hash) {
          let el = document.getElementById(decodeURIComponent(location2.hash.slice(1)));
          if (el) {
            el.scrollIntoView();
            return;
          }
        }
      } catch {
        warning(false, `"${location2.hash.slice(1)}" is not a decodable element ID. The view will not scroll to it.`);
      }
      if (preventScrollReset === true) {
        return;
      }
      window.scrollTo(0, 0);
    }, [location2, restoreScrollPosition, preventScrollReset]);
  }
}
function usePageHide(callback, options) {
  let { capture } = options || {};
  React10.useEffect(() => {
    let opts = capture != null ? { capture } : undefined;
    window.addEventListener("pagehide", callback, opts);
    return () => {
      window.removeEventListener("pagehide", callback, opts);
    };
  }, [callback, capture]);
}
function useViewTransitionState(to, { relative } = {}) {
  let vtContext = React10.useContext(ViewTransitionContext);
  invariant(vtContext != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
  let { basename } = useDataRouterContext3("useViewTransitionState");
  let path = useResolvedPath(to, { relative });
  if (!vtContext.isTransitioning) {
    return false;
  }
  let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
  let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
  return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
}

// ../../node_modules/react-router/dist/development/chunk-5UALIXAM.mjs
var React14 = __toESM(require_react(), 1);
var React22 = __toESM(require_react(), 1);
var import_cookie = __toESM(require_dist(), 1);
var React42 = __toESM(require_react(), 1);
var ReactDOM = __toESM(require_react_dom(), 1);
var import_react = __toESM(require_react(), 1);
var React52 = __toESM(require_react(), 1);
var encoder = /* @__PURE__ */ new TextEncoder;
var sign = async (value, secret) => {
  let data2 = encoder.encode(value);
  let key = await createKey(secret, ["sign"]);
  let signature = await crypto.subtle.sign("HMAC", key, data2);
  let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+$/, "");
  return value + "." + hash;
};
var unsign = async (cookie, secret) => {
  let index = cookie.lastIndexOf(".");
  let value = cookie.slice(0, index);
  let hash = cookie.slice(index + 1);
  let data2 = encoder.encode(value);
  let key = await createKey(secret, ["verify"]);
  try {
    let signature = byteStringToUint8Array(atob(hash));
    let valid = await crypto.subtle.verify("HMAC", key, signature, data2);
    return valid ? value : false;
  } catch (error) {
    return false;
  }
};
var createKey = async (secret, usages) => crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
function byteStringToUint8Array(byteString) {
  let array = new Uint8Array(byteString.length);
  for (let i = 0;i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }
  return array;
}
var createCookie = (name, cookieOptions = {}) => {
  let { secrets = [], ...options } = {
    path: "/",
    sameSite: "lax",
    ...cookieOptions
  };
  warnOnceAboutExpiresCookie(name, options.expires);
  return {
    get name() {
      return name;
    },
    get isSigned() {
      return secrets.length > 0;
    },
    get expires() {
      return typeof options.maxAge !== "undefined" ? new Date(Date.now() + options.maxAge * 1000) : options.expires;
    },
    async parse(cookieHeader, parseOptions) {
      if (!cookieHeader)
        return null;
      let cookies = import_cookie.parse(cookieHeader, { ...options, ...parseOptions });
      if (name in cookies) {
        let value = cookies[name];
        if (typeof value === "string" && value !== "") {
          let decoded = await decodeCookieValue(value, secrets);
          return decoded;
        } else {
          return "";
        }
      } else {
        return null;
      }
    },
    async serialize(value, serializeOptions) {
      return import_cookie.serialize(name, value === "" ? "" : await encodeCookieValue(value, secrets), {
        ...options,
        ...serializeOptions
      });
    }
  };
};
async function encodeCookieValue(value, secrets) {
  let encoded = encodeData(value);
  if (secrets.length > 0) {
    encoded = await sign(encoded, secrets[0]);
  }
  return encoded;
}
async function decodeCookieValue(value, secrets) {
  if (secrets.length > 0) {
    for (let secret of secrets) {
      let unsignedValue = await unsign(value, secret);
      if (unsignedValue !== false) {
        return decodeData(unsignedValue);
      }
    }
    return null;
  }
  return decodeData(value);
}
function encodeData(value) {
  return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
}
function decodeData(value) {
  try {
    return JSON.parse(decodeURIComponent(myEscape(atob(value))));
  } catch (error) {
    return {};
  }
}
function myEscape(value) {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, code;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (/[\w*+\-./@]/.exec(chr)) {
      result += chr;
    } else {
      code = chr.charCodeAt(0);
      if (code < 256) {
        result += "%" + hex(code, 2);
      } else {
        result += "%u" + hex(code, 4).toUpperCase();
      }
    }
  }
  return result;
}
function hex(code, length) {
  let result = code.toString(16);
  while (result.length < length)
    result = "0" + result;
  return result;
}
function myUnescape(value) {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, part;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (chr === "%") {
      if (str.charAt(index) === "u") {
        part = str.slice(index + 1, index + 5);
        if (/^[\da-f]{4}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 5;
          continue;
        }
      } else {
        part = str.slice(index, index + 2);
        if (/^[\da-f]{2}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 2;
          continue;
        }
      }
    }
    result += chr;
  }
  return result;
}
function warnOnceAboutExpiresCookie(name, expires) {
  warnOnce(!expires, `The "${name}" cookie has an "expires" property set. This will cause the expires value to not be updated when the session is committed. Instead, you should set the expires value when serializing the cookie. You can use \`commitSession(session, { expires })\` if using a session storage object, or \`cookie.serialize("value", { expires })\` if you're using the cookie directly.`);
}
var SERVER_NO_BODY_STATUS_CODES = /* @__PURE__ */ new Set([
  ...NO_BODY_STATUS_CODES,
  304
]);
var RSCRouterGlobalErrorBoundary = class extends import_react.default.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, location: props.location };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location) {
      return { error: null, location: props.location };
    }
    return { error: state.error, location: state.location };
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ import_react.default.createElement(RSCDefaultRootErrorBoundaryImpl, {
        error: this.state.error,
        renderAppShell: true
      });
    } else {
      return this.props.children;
    }
  }
};
function ErrorWrapper({
  renderAppShell,
  title,
  children
}) {
  if (!renderAppShell) {
    return children;
  }
  return /* @__PURE__ */ import_react.default.createElement("html", { lang: "en" }, /* @__PURE__ */ import_react.default.createElement("head", null, /* @__PURE__ */ import_react.default.createElement("meta", { charSet: "utf-8" }), /* @__PURE__ */ import_react.default.createElement("meta", {
    name: "viewport",
    content: "width=device-width,initial-scale=1,viewport-fit=cover"
  }), /* @__PURE__ */ import_react.default.createElement("title", null, title)), /* @__PURE__ */ import_react.default.createElement("body", null, /* @__PURE__ */ import_react.default.createElement("main", { style: { fontFamily: "system-ui, sans-serif", padding: "2rem" } }, children)));
}
function RSCDefaultRootErrorBoundaryImpl({
  error,
  renderAppShell
}) {
  console.error(error);
  let heyDeveloper = /* @__PURE__ */ import_react.default.createElement("script", {
    dangerouslySetInnerHTML: {
      __html: `
        console.log(
          "\uD83D\uDCBF Hey developer \uD83D\uDC4B. You can provide a way better UX than this when your app throws errors. Check out https://reactrouter.com/how-to/error-boundary for more information."
        );
      `
    }
  });
  if (isRouteErrorResponse(error)) {
    return /* @__PURE__ */ import_react.default.createElement(ErrorWrapper, {
      renderAppShell,
      title: "Unhandled Thrown Response!"
    }, /* @__PURE__ */ import_react.default.createElement("h1", { style: { fontSize: "24px" } }, error.status, " ", error.statusText), ENABLE_DEV_WARNINGS ? heyDeveloper : null);
  }
  let errorInstance;
  if (error instanceof Error) {
    errorInstance = error;
  } else {
    let errorString = error == null ? "Unknown Error" : typeof error === "object" && ("toString" in error) ? error.toString() : JSON.stringify(error);
    errorInstance = new Error(errorString);
  }
  return /* @__PURE__ */ import_react.default.createElement(ErrorWrapper, { renderAppShell, title: "Application Error!" }, /* @__PURE__ */ import_react.default.createElement("h1", { style: { fontSize: "24px" } }, "Application Error"), /* @__PURE__ */ import_react.default.createElement("pre", {
    style: {
      padding: "2rem",
      background: "hsla(10, 50%, 50%, 0.1)",
      color: "red",
      overflow: "auto"
    }
  }, errorInstance.stack), heyDeveloper);
}
var renderedRoutesContext = unstable_createContext();
var encoder2 = new TextEncoder;
var REACT_USE = "use";
var useImpl = React52[REACT_USE];

// ../../node_modules/react-router/dist/development/index.mjs
"use client";

// ../../node_modules/@oslojs/binary/dist/uint.js
class BigEndian {
  uint8(data, offset) {
    if (data.byteLength < offset + 1) {
      throw new TypeError("Insufficient bytes");
    }
    return data[offset];
  }
  uint16(data, offset) {
    if (data.byteLength < offset + 2) {
      throw new TypeError("Insufficient bytes");
    }
    return data[offset] << 8 | data[offset + 1];
  }
  uint32(data, offset) {
    if (data.byteLength < offset + 4) {
      throw new TypeError("Insufficient bytes");
    }
    let result = 0;
    for (let i = 0;i < 4; i++) {
      result |= data[offset + i] << 24 - i * 8;
    }
    return result;
  }
  uint64(data, offset) {
    if (data.byteLength < offset + 8) {
      throw new TypeError("Insufficient bytes");
    }
    let result = 0n;
    for (let i = 0;i < 8; i++) {
      result |= BigInt(data[offset + i]) << BigInt(56 - i * 8);
    }
    return result;
  }
  putUint8(target, value, offset) {
    if (target.length < offset + 1) {
      throw new TypeError("Not enough space");
    }
    if (value < 0 || value > 255) {
      throw new TypeError("Invalid uint8 value");
    }
    target[offset] = value;
  }
  putUint16(target, value, offset) {
    if (target.length < offset + 2) {
      throw new TypeError("Not enough space");
    }
    if (value < 0 || value > 65535) {
      throw new TypeError("Invalid uint16 value");
    }
    target[offset] = value >> 8;
    target[offset + 1] = value & 255;
  }
  putUint32(target, value, offset) {
    if (target.length < offset + 4) {
      throw new TypeError("Not enough space");
    }
    if (value < 0 || value > 4294967295) {
      throw new TypeError("Invalid uint32 value");
    }
    for (let i = 0;i < 4; i++) {
      target[offset + i] = value >> (3 - i) * 8 & 255;
    }
  }
  putUint64(target, value, offset) {
    if (target.length < offset + 8) {
      throw new TypeError("Not enough space");
    }
    if (value < 0 || value > 18446744073709551615n) {
      throw new TypeError("Invalid uint64 value");
    }
    for (let i = 0;i < 8; i++) {
      target[offset + i] = Number(value >> BigInt((7 - i) * 8) & 0xffn);
    }
  }
}

class LittleEndian {
  uint8(data, offset) {
    if (data.byteLength < offset + 1) {
      throw new TypeError("Insufficient bytes");
    }
    return data[offset];
  }
  uint16(data, offset) {
    if (data.byteLength < offset + 2) {
      throw new TypeError("Insufficient bytes");
    }
    return data[offset] | data[offset + 1] << 8;
  }
  uint32(data, offset) {
    if (data.byteLength < offset + 4) {
      throw new TypeError("Insufficient bytes");
    }
    let result = 0;
    for (let i = 0;i < 4; i++) {
      result |= data[offset + i] << i * 8;
    }
    return result;
  }
  uint64(data, offset) {
    if (data.byteLength < offset + 8) {
      throw new TypeError("Insufficient bytes");
    }
    let result = 0n;
    for (let i = 0;i < 8; i++) {
      result |= BigInt(data[offset + i]) << BigInt(i * 8);
    }
    return result;
  }
  putUint8(target, value, offset) {
    if (target.length < 1 + offset) {
      throw new TypeError("Insufficient space");
    }
    if (value < 0 || value > 255) {
      throw new TypeError("Invalid uint8 value");
    }
    target[offset] = value;
  }
  putUint16(target, value, offset) {
    if (target.length < 2 + offset) {
      throw new TypeError("Insufficient space");
    }
    if (value < 0 || value > 65535) {
      throw new TypeError("Invalid uint16 value");
    }
    target[offset + 1] = value >> 8;
    target[offset] = value & 255;
  }
  putUint32(target, value, offset) {
    if (target.length < 4 + offset) {
      throw new TypeError("Insufficient space");
    }
    if (value < 0 || value > 4294967295) {
      throw new TypeError("Invalid uint32 value");
    }
    for (let i = 0;i < 4; i++) {
      target[offset + i] = value >> i * 8 & 255;
    }
  }
  putUint64(target, value, offset) {
    if (target.length < 8 + offset) {
      throw new TypeError("Insufficient space");
    }
    if (value < 0 || value > 18446744073709551615n) {
      throw new TypeError("Invalid uint64 value");
    }
    for (let i = 0;i < 8; i++) {
      target[offset + i] = Number(value >> BigInt(i * 8) & 0xffn);
    }
  }
}
var bigEndian = new BigEndian;
var littleEndian = new LittleEndian;
// ../../node_modules/@oslojs/binary/dist/bits.js
function rotr32(x, n) {
  return (x << 32 - n | x >>> n) >>> 0;
}
function rotr64(x, n) {
  return (x << BigInt(64 - n) | x >> BigInt(n)) & 0xffffffffffffffffn;
}
// ../../node_modules/@oslojs/binary/dist/big.js
function bigIntFromBytes(bytes) {
  if (bytes.byteLength < 1) {
    throw new TypeError("Empty Uint8Array");
  }
  let decoded = 0n;
  for (let i = 0;i < bytes.byteLength; i++) {
    decoded += BigInt(bytes[i]) << BigInt((bytes.byteLength - 1 - i) * 8);
  }
  return decoded;
}
// ../../node_modules/@oslojs/crypto/dist/sha2/sha224.js
class SHA224 {
  blockSize = 64;
  size = 32;
  blocks = new Uint8Array(64);
  currentBlockSize = 0;
  H = new Uint32Array([
    3238371032,
    914150663,
    812702999,
    4144912697,
    4290775857,
    1750603025,
    1694076839,
    3204075428
  ]);
  l = 0n;
  w = new Uint32Array(64);
  update(data) {
    this.l += BigInt(data.byteLength) * 8n;
    if (this.currentBlockSize + data.byteLength < 64) {
      this.blocks.set(data, this.currentBlockSize);
      this.currentBlockSize += data.byteLength;
      return;
    }
    let processed = 0;
    if (this.currentBlockSize > 0) {
      const next = data.slice(0, 64 - this.currentBlockSize);
      this.blocks.set(next, this.currentBlockSize);
      this.process();
      processed += next.byteLength;
      this.currentBlockSize = 0;
    }
    while (processed + 64 <= data.byteLength) {
      const next = data.slice(processed, processed + 64);
      this.blocks.set(next);
      this.process();
      processed += 64;
    }
    if (data.byteLength - processed > 0) {
      const remaining = data.slice(processed);
      this.blocks.set(remaining);
      this.currentBlockSize = remaining.byteLength;
    }
  }
  digest() {
    this.blocks[this.currentBlockSize] = 128;
    this.currentBlockSize += 1;
    if (64 - this.currentBlockSize < 8) {
      this.blocks.fill(0, this.currentBlockSize);
      this.process();
      this.currentBlockSize = 0;
    }
    this.blocks.fill(0, this.currentBlockSize);
    bigEndian.putUint64(this.blocks, this.l, this.blockSize - 8);
    this.process();
    const result = new Uint8Array(28);
    for (let i = 0;i < 7; i++) {
      bigEndian.putUint32(result, this.H[i], i * 4);
    }
    return result;
  }
  process() {
    for (let t = 0;t < 16; t++) {
      this.w[t] = (this.blocks[t * 4] << 24 | this.blocks[t * 4 + 1] << 16 | this.blocks[t * 4 + 2] << 8 | this.blocks[t * 4 + 3]) >>> 0;
    }
    for (let t = 16;t < 64; t++) {
      const sigma1 = (rotr32(this.w[t - 2], 17) ^ rotr32(this.w[t - 2], 19) ^ this.w[t - 2] >>> 10) >>> 0;
      const sigma0 = (rotr32(this.w[t - 15], 7) ^ rotr32(this.w[t - 15], 18) ^ this.w[t - 15] >>> 3) >>> 0;
      this.w[t] = sigma1 + this.w[t - 7] + sigma0 + this.w[t - 16] | 0;
    }
    let a = this.H[0];
    let b = this.H[1];
    let c = this.H[2];
    let d = this.H[3];
    let e = this.H[4];
    let f = this.H[5];
    let g = this.H[6];
    let h = this.H[7];
    for (let t = 0;t < 64; t++) {
      const sigma1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
      const ch = (e & f ^ ~e & g) >>> 0;
      const t1 = h + sigma1 + ch + K[t] + this.w[t] | 0;
      const sigma0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
      const maj = (a & b ^ a & c ^ b & c) >>> 0;
      const t2 = sigma0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    this.H[0] = a + this.H[0] | 0;
    this.H[1] = b + this.H[1] | 0;
    this.H[2] = c + this.H[2] | 0;
    this.H[3] = d + this.H[3] | 0;
    this.H[4] = e + this.H[4] | 0;
    this.H[5] = f + this.H[5] | 0;
    this.H[6] = g + this.H[6] | 0;
    this.H[7] = h + this.H[7] | 0;
  }
}
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
// ../../node_modules/@oslojs/crypto/dist/sha2/sha256.js
function sha256(data) {
  const hash = new SHA256;
  hash.update(data);
  return hash.digest();
}

class SHA256 {
  blockSize = 64;
  size = 32;
  blocks = new Uint8Array(64);
  currentBlockSize = 0;
  H = new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  l = 0n;
  w = new Uint32Array(64);
  update(data) {
    this.l += BigInt(data.byteLength) * 8n;
    if (this.currentBlockSize + data.byteLength < 64) {
      this.blocks.set(data, this.currentBlockSize);
      this.currentBlockSize += data.byteLength;
      return;
    }
    let processed = 0;
    if (this.currentBlockSize > 0) {
      const next = data.slice(0, 64 - this.currentBlockSize);
      this.blocks.set(next, this.currentBlockSize);
      this.process();
      processed += next.byteLength;
      this.currentBlockSize = 0;
    }
    while (processed + 64 <= data.byteLength) {
      const next = data.slice(processed, processed + 64);
      this.blocks.set(next);
      this.process();
      processed += 64;
    }
    if (data.byteLength - processed > 0) {
      const remaining = data.slice(processed);
      this.blocks.set(remaining);
      this.currentBlockSize = remaining.byteLength;
    }
  }
  digest() {
    this.blocks[this.currentBlockSize] = 128;
    this.currentBlockSize += 1;
    if (64 - this.currentBlockSize < 8) {
      this.blocks.fill(0, this.currentBlockSize);
      this.process();
      this.currentBlockSize = 0;
    }
    this.blocks.fill(0, this.currentBlockSize);
    bigEndian.putUint64(this.blocks, this.l, this.blockSize - 8);
    this.process();
    const result = new Uint8Array(32);
    for (let i = 0;i < 8; i++) {
      bigEndian.putUint32(result, this.H[i], i * 4);
    }
    return result;
  }
  process() {
    for (let t = 0;t < 16; t++) {
      this.w[t] = (this.blocks[t * 4] << 24 | this.blocks[t * 4 + 1] << 16 | this.blocks[t * 4 + 2] << 8 | this.blocks[t * 4 + 3]) >>> 0;
    }
    for (let t = 16;t < 64; t++) {
      const sigma1 = (rotr32(this.w[t - 2], 17) ^ rotr32(this.w[t - 2], 19) ^ this.w[t - 2] >>> 10) >>> 0;
      const sigma0 = (rotr32(this.w[t - 15], 7) ^ rotr32(this.w[t - 15], 18) ^ this.w[t - 15] >>> 3) >>> 0;
      this.w[t] = sigma1 + this.w[t - 7] + sigma0 + this.w[t - 16] | 0;
    }
    let a = this.H[0];
    let b = this.H[1];
    let c = this.H[2];
    let d = this.H[3];
    let e = this.H[4];
    let f = this.H[5];
    let g = this.H[6];
    let h = this.H[7];
    for (let t = 0;t < 64; t++) {
      const sigma1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
      const ch = (e & f ^ ~e & g) >>> 0;
      const t1 = h + sigma1 + ch + K2[t] + this.w[t] | 0;
      const sigma0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
      const maj = (a & b ^ a & c ^ b & c) >>> 0;
      const t2 = sigma0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    this.H[0] = a + this.H[0] | 0;
    this.H[1] = b + this.H[1] | 0;
    this.H[2] = c + this.H[2] | 0;
    this.H[3] = d + this.H[3] | 0;
    this.H[4] = e + this.H[4] | 0;
    this.H[5] = f + this.H[5] | 0;
    this.H[6] = g + this.H[6] | 0;
    this.H[7] = h + this.H[7] | 0;
  }
}
var K2 = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
// ../../node_modules/@oslojs/crypto/dist/sha2/sha512.js
class SharedSHA512 {
  blockSize = 128;
  size = 64;
  blocks = new Uint8Array(128);
  currentBlockSize = 0;
  l = 0n;
  w = new BigUint64Array(80);
  H;
  constructor(H) {
    if (H.byteLength !== 64) {
      throw new TypeError;
    }
    this.H = H;
  }
  update(data) {
    this.l += BigInt(data.byteLength) * 8n;
    if (this.currentBlockSize + data.byteLength < 128) {
      this.blocks.set(data, this.currentBlockSize);
      this.currentBlockSize += data.byteLength;
      return;
    }
    let processed = 0;
    if (this.currentBlockSize > 0) {
      const next = data.slice(0, 128 - this.currentBlockSize);
      this.blocks.set(next, this.currentBlockSize);
      this.process();
      processed += next.byteLength;
      this.currentBlockSize = 0;
    }
    while (processed + 128 <= data.byteLength) {
      const next = data.slice(processed, processed + 128);
      this.blocks.set(next);
      this.process();
      processed += 128;
      this.currentBlockSize = 0;
    }
    if (data.byteLength - processed > 0) {
      const remaining = data.slice(processed);
      this.blocks.set(remaining);
      this.currentBlockSize = remaining.byteLength;
    }
  }
  putDigest(result) {
    if (result.byteLength > 64 || result.byteLength % 8 !== 0) {
      throw new TypeError;
    }
    this.blocks[this.currentBlockSize] = 128;
    this.currentBlockSize += 1;
    if (128 - this.currentBlockSize < 16) {
      this.blocks.fill(0, this.currentBlockSize);
      this.process();
      this.currentBlockSize = 0;
    }
    this.blocks.fill(0, this.currentBlockSize);
    bigEndian.putUint64(this.blocks, this.l, this.blockSize - 8);
    this.process();
    for (let i = 0;i < result.byteLength / 8; i++) {
      bigEndian.putUint64(result, this.H[i], i * 8);
    }
  }
  process() {
    for (let t = 0;t < 16; t++) {
      this.w[t] = BigInt(this.blocks[t * 8]) << 56n | BigInt(this.blocks[t * 8 + 1]) << 48n | BigInt(this.blocks[t * 8 + 2]) << 40n | BigInt(this.blocks[t * 8 + 3]) << 32n | BigInt(this.blocks[t * 8 + 4]) << 24n | BigInt(this.blocks[t * 8 + 5]) << 16n | BigInt(this.blocks[t * 8 + 6]) << 8n | BigInt(this.blocks[t * 8 + 7]);
    }
    for (let t = 16;t < 80; t++) {
      const sigma1 = (rotr64(this.w[t - 2], 19) ^ rotr64(this.w[t - 2], 61) ^ this.w[t - 2] >> 6n) & 0xffffffffffffffffn;
      const sigma0 = (rotr64(this.w[t - 15], 1) ^ rotr64(this.w[t - 15], 8) ^ this.w[t - 15] >> 7n) & 0xffffffffffffffffn;
      this.w[t] = sigma1 + this.w[t - 7] + sigma0 + this.w[t - 16] & 0xffffffffffffffffn;
    }
    let a = this.H[0];
    let b = this.H[1];
    let c = this.H[2];
    let d = this.H[3];
    let e = this.H[4];
    let f = this.H[5];
    let g = this.H[6];
    let h = this.H[7];
    for (let t = 0;t < 80; t++) {
      const sigma1 = (rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41)) & 0xffffffffffffffffn;
      const ch = (e & f ^ ~e & g) & 0xffffffffffffffffn;
      const t1 = h + sigma1 + ch + K3[t] + this.w[t] & 0xffffffffffffffffn;
      const sigma0 = (rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39)) & 0xffffffffffffffffn;
      const maj = (a & b ^ a & c ^ b & c) & 0xffffffffffffffffn;
      const t2 = sigma0 + maj & 0xffffffffffffffffn;
      h = g;
      g = f;
      f = e;
      e = d + t1 & 0xffffffffffffffffn;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 & 0xffffffffffffffffn;
    }
    this.H[0] = a + this.H[0] & 0xffffffffffffffffn;
    this.H[1] = b + this.H[1] & 0xffffffffffffffffn;
    this.H[2] = c + this.H[2] & 0xffffffffffffffffn;
    this.H[3] = d + this.H[3] & 0xffffffffffffffffn;
    this.H[4] = e + this.H[4] & 0xffffffffffffffffn;
    this.H[5] = f + this.H[5] & 0xffffffffffffffffn;
    this.H[6] = g + this.H[6] & 0xffffffffffffffffn;
    this.H[7] = h + this.H[7] & 0xffffffffffffffffn;
  }
}

class SHA512 {
  blockSize = 128;
  size = 64;
  sha512 = new SharedSHA512(new BigUint64Array([
    0x6a09e667f3bcc908n,
    0xbb67ae8584caa73bn,
    0x3c6ef372fe94f82bn,
    0xa54ff53a5f1d36f1n,
    0x510e527fade682d1n,
    0x9b05688c2b3e6c1fn,
    0x1f83d9abfb41bd6bn,
    0x5be0cd19137e2179n
  ]));
  update(data) {
    this.sha512.update(data);
  }
  digest() {
    const result = new Uint8Array(64);
    this.sha512.putDigest(result);
    return result;
  }
}
var K3 = new BigUint64Array([
  0x428a2f98d728ae22n,
  0x7137449123ef65cdn,
  0xb5c0fbcfec4d3b2fn,
  0xe9b5dba58189dbbcn,
  0x3956c25bf348b538n,
  0x59f111f1b605d019n,
  0x923f82a4af194f9bn,
  0xab1c5ed5da6d8118n,
  0xd807aa98a3030242n,
  0x12835b0145706fben,
  0x243185be4ee4b28cn,
  0x550c7dc3d5ffb4e2n,
  0x72be5d74f27b896fn,
  0x80deb1fe3b1696b1n,
  0x9bdc06a725c71235n,
  0xc19bf174cf692694n,
  0xe49b69c19ef14ad2n,
  0xefbe4786384f25e3n,
  0x0fc19dc68b8cd5b5n,
  0x240ca1cc77ac9c65n,
  0x2de92c6f592b0275n,
  0x4a7484aa6ea6e483n,
  0x5cb0a9dcbd41fbd4n,
  0x76f988da831153b5n,
  0x983e5152ee66dfabn,
  0xa831c66d2db43210n,
  0xb00327c898fb213fn,
  0xbf597fc7beef0ee4n,
  0xc6e00bf33da88fc2n,
  0xd5a79147930aa725n,
  0x06ca6351e003826fn,
  0x142929670a0e6e70n,
  0x27b70a8546d22ffcn,
  0x2e1b21385c26c926n,
  0x4d2c6dfc5ac42aedn,
  0x53380d139d95b3dfn,
  0x650a73548baf63den,
  0x766a0abb3c77b2a8n,
  0x81c2c92e47edaee6n,
  0x92722c851482353bn,
  0xa2bfe8a14cf10364n,
  0xa81a664bbc423001n,
  0xc24b8b70d0f89791n,
  0xc76c51a30654be30n,
  0xd192e819d6ef5218n,
  0xd69906245565a910n,
  0xf40e35855771202an,
  0x106aa07032bbd1b8n,
  0x19a4c116b8d2d0c8n,
  0x1e376c085141ab53n,
  0x2748774cdf8eeb99n,
  0x34b0bcb5e19b48a8n,
  0x391c0cb3c5c95a63n,
  0x4ed8aa4ae3418acbn,
  0x5b9cca4f7763e373n,
  0x682e6ff3d6b2b8a3n,
  0x748f82ee5defb2fcn,
  0x78a5636f43172f60n,
  0x84c87814a1f0ab72n,
  0x8cc702081a6439ecn,
  0x90befffa23631e28n,
  0xa4506cebde82bde9n,
  0xbef9a3f7b2c67915n,
  0xc67178f2e372532bn,
  0xca273eceea26619cn,
  0xd186b8c721c0c207n,
  0xeada7dd6cde0eb1en,
  0xf57d4f7fee6ed178n,
  0x06f067aa72176fban,
  0x0a637dc5a2c898a6n,
  0x113f9804bef90daen,
  0x1b710b35131c471bn,
  0x28db77f523047d84n,
  0x32caab7b40c72493n,
  0x3c9ebe0a15c9bebcn,
  0x431d67c49c100d4cn,
  0x4cc5d4becb3e42b6n,
  0x597f299cfc657e2an,
  0x5fcb6fab3ad6faecn,
  0x6c44198c4a475817n
]);

// ../../node_modules/@oslojs/crypto/dist/sha2/sha384.js
class SHA384 {
  blockSize = 128;
  size = 48;
  sha512 = new SharedSHA512(new BigUint64Array([
    0xcbbb9d5dc1059ed8n,
    0x629a292a367cd507n,
    0x9159015a3070dd17n,
    0x152fecd8f70e5939n,
    0x67332667ffc00b31n,
    0x8eb44a8768581511n,
    0xdb0c2e0d64f98fa7n,
    0x47b5481dbefa4fa4n
  ]));
  update(data) {
    this.sha512.update(data);
  }
  digest() {
    const result = new Uint8Array(48);
    this.sha512.putDigest(result);
    return result;
  }
}
// ../../node_modules/@oslojs/crypto/dist/sha2/sha512_224.js
class SHA512_224 {
  blockSize = 128;
  size = 28;
  sha512 = new SharedSHA512(new BigUint64Array([
    0x8c3d37c819544da2n,
    0x73e1996689dcd4d6n,
    0x1dfab7ae32ff9c82n,
    0x679dd514582f9fcfn,
    0x0f6d2b697bd44da8n,
    0x77e36f7304c48942n,
    0x3f9d85a86a1d36c8n,
    0x1112e6ad91d692a1n
  ]));
  update(data) {
    this.sha512.update(data);
  }
  digest() {
    const result = new Uint8Array(32);
    this.sha512.putDigest(result);
    return result.slice(0, 28);
  }
}
// ../../node_modules/@oslojs/crypto/dist/sha2/sha512_256.js
class SHA512_256 {
  blockSize = 128;
  size = 28;
  sha512 = new SharedSHA512(new BigUint64Array([
    0x22312194fc2bf72cn,
    0x9f555fa3c84c64c2n,
    0x2393b86b6f53b151n,
    0x963877195940eabdn,
    0x96283ee2a88effe3n,
    0xbe5e1e2553863992n,
    0x2b0199fc2c85b8aan,
    0x0eb72ddc81c52ca2n
  ]));
  update(data) {
    this.sha512.update(data);
  }
  digest() {
    const result = new Uint8Array(32);
    this.sha512.putDigest(result);
    return result;
  }
}
// ../../node_modules/@oslojs/encoding/dist/base32.js
var EncodingPadding;
(function(EncodingPadding2) {
  EncodingPadding2[EncodingPadding2["Include"] = 0] = "Include";
  EncodingPadding2[EncodingPadding2["None"] = 1] = "None";
})(EncodingPadding || (EncodingPadding = {}));
var DecodingPadding;
(function(DecodingPadding2) {
  DecodingPadding2[DecodingPadding2["Required"] = 0] = "Required";
  DecodingPadding2[DecodingPadding2["Ignore"] = 1] = "Ignore";
})(DecodingPadding || (DecodingPadding = {}));
// ../../node_modules/@oslojs/encoding/dist/base64.js
function encodeBase64url(bytes) {
  return encodeBase64_internal(bytes, base64urlAlphabet, EncodingPadding2.Include);
}
function encodeBase64_internal(bytes, alphabet, padding) {
  let result = "";
  for (let i = 0;i < bytes.byteLength; i += 3) {
    let buffer = 0;
    let bufferBitSize = 0;
    for (let j = 0;j < 3 && i + j < bytes.byteLength; j++) {
      buffer = buffer << 8 | bytes[i + j];
      bufferBitSize += 8;
    }
    for (let j = 0;j < 4; j++) {
      if (bufferBitSize >= 6) {
        result += alphabet[buffer >> bufferBitSize - 6 & 63];
        bufferBitSize -= 6;
      } else if (bufferBitSize > 0) {
        result += alphabet[buffer << 6 - bufferBitSize & 63];
        bufferBitSize = 0;
      } else if (padding === EncodingPadding2.Include) {
        result += "=";
      }
    }
  }
  return result;
}
var base64urlAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var EncodingPadding2;
(function(EncodingPadding3) {
  EncodingPadding3[EncodingPadding3["Include"] = 0] = "Include";
  EncodingPadding3[EncodingPadding3["None"] = 1] = "None";
})(EncodingPadding2 || (EncodingPadding2 = {}));
var DecodingPadding2;
(function(DecodingPadding3) {
  DecodingPadding3[DecodingPadding3["Required"] = 0] = "Required";
  DecodingPadding3[DecodingPadding3["Ignore"] = 1] = "Ignore";
})(DecodingPadding2 || (DecodingPadding2 = {}));
// ../../node_modules/@oslojs/crypto/dist/random/index.js
function generateRandomInteger(random, max) {
  if (max < 2) {
    throw new Error("Argument 'max' must be a positive integer larger than 1");
  }
  const inclusiveMaxBitLength = (max - 1n).toString(2).length;
  const shift = inclusiveMaxBitLength % 8;
  const bytes = new Uint8Array(Math.ceil(inclusiveMaxBitLength / 8));
  try {
    random.read(bytes);
  } catch (e) {
    throw new Error("Failed to retrieve random bytes", {
      cause: e
    });
  }
  if (shift !== 0) {
    bytes[0] &= (1 << shift) - 1;
  }
  let result = bigIntFromBytes(bytes);
  while (result >= max) {
    try {
      random.read(bytes);
    } catch (e) {
      throw new Error("Failed to retrieve random bytes", {
        cause: e
      });
    }
    if (shift !== 0) {
      bytes[0] &= (1 << shift) - 1;
    }
    result = bigIntFromBytes(bytes);
  }
  return result;
}
function generateRandomIntegerNumber(random, max) {
  if (max < 2 || max > Number.MAX_SAFE_INTEGER) {
    throw new Error("Argument 'max' must be a positive integer larger than 1");
  }
  return Number(generateRandomInteger(random, BigInt(max)));
}
function generateRandomString(random, alphabet, length) {
  let result = "";
  for (let i = 0;i < length; i++) {
    result += alphabet[generateRandomIntegerNumber(random, alphabet.length)];
  }
  return result;
}

// ../../node_modules/remix-utils/build/common/crypto.js
function randomString(bytes = 10) {
  let random = {
    read(bytes2) {
      crypto.getRandomValues(bytes2);
    }
  };
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  return generateRandomString(random, alphabet, bytes);
}

// ../../node_modules/remix-utils/build/server/get-headers.js
function getHeaders(requestOrHeaders) {
  if (requestOrHeaders instanceof Request) {
    return requestOrHeaders.headers;
  }
  return requestOrHeaders;
}

// ../../node_modules/remix-utils/build/server/csrf.js
class CSRFError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "CSRFError";
  }
}

class CSRF {
  cookie;
  formDataKey = "csrf";
  secret;
  constructor(options) {
    this.cookie = options.cookie;
    this.formDataKey = options.formDataKey ?? "csrf";
    this.secret = options.secret;
  }
  generate(bytes = 32) {
    let token = randomString(bytes);
    if (!this.secret)
      return token;
    let signature = this.sign(token);
    return [token, signature].join(".");
  }
  async getToken(requestOrHeaders = new Headers, bytes = 32) {
    let headers = getHeaders(requestOrHeaders);
    let existingToken = await this.cookie.parse(headers.get("cookie"));
    let token = typeof existingToken === "string" ? existingToken : this.generate(bytes);
    return token;
  }
  async commitToken(requestOrHeaders = new Headers, bytes = 32) {
    let headers = getHeaders(requestOrHeaders);
    let existingToken = await this.cookie.parse(headers.get("cookie"));
    let token = typeof existingToken === "string" ? existingToken : this.generate(bytes);
    let cookie = existingToken ? null : await this.cookie.serialize(token);
    return [token, cookie];
  }
  async validate(data, headers) {
    if (data instanceof Request && data.bodyUsed) {
      throw new Error("The body of the request was read before calling CSRF#verify. Ensure you clone it before reading it.");
    }
    let formData = await this.readBody(data);
    let cookie = await this.parseCookie(data, headers);
    if (cookie === null) {
      throw new CSRFError("missing_token_in_cookie", "Can't find CSRF token in cookie.");
    }
    if (typeof cookie !== "string") {
      throw new CSRFError("invalid_token_in_cookie", "Invalid CSRF token in cookie.");
    }
    if (this.verifySignature(cookie) === false) {
      throw new CSRFError("tampered_token_in_cookie", "Tampered CSRF token in cookie.");
    }
    if (!formData.get(this.formDataKey)) {
      throw new CSRFError("missing_token_in_body", "Can't find CSRF token in body.");
    }
    if (formData.get(this.formDataKey) !== cookie) {
      throw new CSRFError("mismatched_token", "Can't verify CSRF token authenticity.");
    }
  }
  async readBody(data) {
    if (data instanceof FormData)
      return data;
    return await data.clone().formData();
  }
  parseCookie(data, headers) {
    let _headers = data instanceof Request ? data.headers : headers;
    if (!_headers)
      return null;
    return this.cookie.parse(_headers.get("cookie"));
  }
  sign(token) {
    if (!this.secret)
      return token;
    return encodeBase64url(sha256(new TextEncoder().encode(token)));
  }
  verifySignature(token) {
    if (!this.secret)
      return true;
    let [value, signature] = token.split(".");
    if (!value)
      return false;
    let expectedSignature = this.sign(value);
    return signature === expectedSignature;
  }
}

// src/secure/server/csrf.server.ts
var CSRF_CONFIG = {
  SECRET: "fallback-secret",
  COOKIE_NAME: "csrf",
  FORM_DATA_KEY: "csrf_token"
};
var csrfInstance = null;
var configCache = null;
function resolveCSRF(options) {
  const hasOptions = options && Object.keys(options).length > 0;
  if (!hasOptions && csrfInstance) {
    return csrfInstance;
  }
  const config = normalizeConfig(options);
  const configKey = JSON.stringify(config);
  if (csrfInstance && configCache === configKey) {
    return csrfInstance;
  }
  csrfInstance = createCSRF(config);
  configCache = configKey;
  return csrfInstance;
}
async function validateCSRF(formData, headers) {
  try {
    const csrf = resolveCSRF();
    await csrf.validate(formData, headers);
    return { data: true, errors: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "CSRF validation failed";
    return {
      data: null,
      errors: [{ messages: [errorMessage] }]
    };
  }
}
function createCSRF(config) {
  const { secret, cookieName, formDataKey, secure } = config;
  const cookie = createCookie(cookieName, {
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "lax",
    secrets: [secret]
  });
  return new CSRF({ cookie, secret, formDataKey });
}
function normalizeConfig(options) {
  return {
    secret: options?.secret || CSRF_CONFIG.SECRET,
    cookieName: options?.cookieName || CSRF_CONFIG.COOKIE_NAME,
    formDataKey: options?.formDataKey || CSRF_CONFIG.FORM_DATA_KEY,
    secure: options?.secure || true
  };
}
export {
  validateCSRF,
  resolveCSRF
};

//# debugId=DAA1E1E8A83C762F64756E2164756E21
