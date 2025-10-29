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
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// ../../node_modules/.bun/deepmerge@4.3.1/node_modules/deepmerge/dist/cjs.js
var require_cjs = __commonJS((exports, module) => {
  var isMergeableObject = function isMergeableObject(value) {
    return isNonNullObject(value) && !isSpecial(value);
  };
  function isNonNullObject(value) {
    return !!value && typeof value === "object";
  }
  function isSpecial(value) {
    var stringValue = Object.prototype.toString.call(value);
    return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
  }
  var canUseSymbol = typeof Symbol === "function" && Symbol.for;
  var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
  function isReactElement(value) {
    return value.$$typeof === REACT_ELEMENT_TYPE;
  }
  function emptyTarget(val) {
    return Array.isArray(val) ? [] : {};
  }
  function cloneUnlessOtherwiseSpecified(value, options) {
    return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
  }
  function defaultArrayMerge(target, source, options) {
    return target.concat(source).map(function(element) {
      return cloneUnlessOtherwiseSpecified(element, options);
    });
  }
  function getMergeFunction(key, options) {
    if (!options.customMerge) {
      return deepmerge;
    }
    var customMerge = options.customMerge(key);
    return typeof customMerge === "function" ? customMerge : deepmerge;
  }
  function getEnumerableOwnPropertySymbols(target) {
    return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
      return Object.propertyIsEnumerable.call(target, symbol);
    }) : [];
  }
  function getKeys(target) {
    return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
  }
  function propertyIsOnObject(object, property) {
    try {
      return property in object;
    } catch (_3) {
      return false;
    }
  }
  function propertyIsUnsafe(target, key) {
    return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
  }
  function mergeObject(target, source, options) {
    var destination = {};
    if (options.isMergeableObject(target)) {
      getKeys(target).forEach(function(key) {
        destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
      });
    }
    getKeys(source).forEach(function(key) {
      if (propertyIsUnsafe(target, key)) {
        return;
      }
      if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
        destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
      } else {
        destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
      }
    });
    return destination;
  }
  function deepmerge(target, source, options) {
    options = options || {};
    options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    options.isMergeableObject = options.isMergeableObject || isMergeableObject;
    options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
    var sourceIsArray = Array.isArray(source);
    var targetIsArray = Array.isArray(target);
    var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
    if (!sourceAndTargetTypesMatch) {
      return cloneUnlessOtherwiseSpecified(source, options);
    } else if (sourceIsArray) {
      return options.arrayMerge(target, source, options);
    } else {
      return mergeObject(target, source, options);
    }
  }
  deepmerge.all = function deepmergeAll(array, options) {
    if (!Array.isArray(array)) {
      throw new Error("first argument should be an array");
    }
    return array.reduce(function(prev, next) {
      return deepmerge(prev, next, options);
    }, {});
  };
  var deepmerge_1 = deepmerge;
  module.exports = deepmerge_1;
});

// src/email/server/email.middleware.ts
import { setContext } from "@ycore/forge/context";

// src/email/email.context.ts
import { createContext } from "react-router";
var emailContext = createContext(null);

// src/email/server/email.middleware.ts
function emailConfigMiddleware(emailConfig) {
  return async ({ context }, next) => {
    setContext(context, emailContext, emailConfig);
    return next();
  };
}
// src/email/server/email.service.ts
import { getContext } from "@ycore/forge/context";
import { logger as logger4 } from "@ycore/forge/logger";
import { err as err4, flattenError, isError, ok as ok2 } from "@ycore/forge/result";
import { getBindings } from "@ycore/forge/services";

// src/email/email.config.ts
var defaultEmailConfig = {
  active: "local-dev",
  providers: [
    {
      name: "local-dev",
      sendFrom: "dev@localhost"
    }
  ]
};

// src/email/email-provider.ts
import { err as err3, ok } from "@ycore/forge/result";

// src/email/providers/local-dev.ts
import { logger as logger2 } from "@ycore/forge/logger";

// src/email/providers/base-provider.ts
import { logger } from "@ycore/forge/logger";
import { err, tryCatch } from "@ycore/forge/result";
var EMAIL_PROVIDER_DELAYS = {
  LOCAL_DEV: 800,
  TEST_MOCK: 10
};
function createEmailProviderBase(name, sendFn) {
  return {
    async sendEmail(options) {
      const { from, to, template } = options;
      if (!from) {
        return err("From address is required");
      }
      return tryCatch(async () => {
        await sendFn(options);
        logger.debug("email_sent_success", {
          provider: name,
          to,
          subject: template.subject
        });
      }, `Failed to send email via ${name}`);
    }
  };
}

// src/email/providers/local-dev.ts
function createLocalDevEmailProvider() {
  return createEmailProviderBase("local-dev", async (options) => {
    const { to, from, template } = options;
    await new Promise((resolve) => setTimeout(resolve, EMAIL_PROVIDER_DELAYS.LOCAL_DEV));
    logger2.info("local_dev_email_sent", {
      provider: "local-dev",
      from,
      to,
      subject: template.subject,
      text: template.text
    });
  });
}

// src/email/providers/mailchannels.ts
function createMailChannelsEmailProvider() {
  const apiUrl = "https://api.mailchannels.net/tx/v1/send";
  return createEmailProviderBase("mailchannels", async (options) => {
    const { apiKey, to, from, template } = options;
    const payload = {
      personalizations: [
        {
          to: [{ email: to }]
        }
      ],
      from: { email: from },
      subject: template.subject,
      content: [
        { type: "text/plain", value: template.text },
        { type: "text/html", value: template.html }
      ]
    };
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MailChannels API error (${response.status}): ${errorText}`);
    }
  });
}

// src/email/providers/resend.ts
function createResendEmailProvider() {
  return createEmailProviderBase("resend", async (options) => {
    const { apiKey, to, from, template } = options;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error (${response.status}): ${errorText}`);
    }
  });
}

// src/email/providers/test-mock.ts
import { logger as logger3 } from "@ycore/forge/logger";
import { err as err2 } from "@ycore/forge/result";
var sentEmails = [];
var shouldFail = false;
var failureReason = "Simulated email failure";
function createTestMockEmailProvider() {
  return {
    async sendEmail(options) {
      const { to, from, template } = options;
      if (!from) {
        return err2("From address is required");
      }
      sentEmails.push({
        to,
        from,
        template: {
          subject: template.subject,
          html: template.html,
          text: template.text
        }
      });
      if (shouldFail) {
        return err2(failureReason);
      }
      const baseProvider = createEmailProviderBase("test-mock", async (opts) => {
        await new Promise((resolve) => setTimeout(resolve, EMAIL_PROVIDER_DELAYS.TEST_MOCK));
        logger3.debug("email_test_mock_sent", {
          provider: "test-mock",
          from: opts.from,
          to: opts.to,
          subject: opts.template.subject,
          textLength: opts.template.text.length,
          htmlLength: opts.template.html.length
        });
      });
      return baseProvider.sendEmail(options);
    }
  };
}

// src/email/email-provider.ts
var providerRegistry = {
  "local-dev": createLocalDevEmailProvider,
  mailchannels: createMailChannelsEmailProvider,
  resend: createResendEmailProvider,
  "test-mock": createTestMockEmailProvider
};
function createEmailProvider(providerName) {
  if (!isValidProvider(providerName)) {
    return err3(`Unsupported email provider: ${providerName}`);
  }
  try {
    const factory = providerRegistry[providerName];
    const provider = factory();
    return ok(provider);
  } catch (error) {
    return err3(`Failed to create email provider: ${providerName}`, undefined, { cause: error });
  }
}
function isValidProvider(providerName) {
  return providerName in providerRegistry;
}
function getProviderConfig(emailConfig, providerName) {
  return emailConfig.providers.find((provider) => provider.name === providerName);
}

// src/email/server/email.service.ts
async function sendMail(context, options) {
  try {
    const { to, template, from: optionsFrom, provider: optionsProvider, apiKey: optionsApiKey } = options;
    const emailConfig = getContext(context, emailContext, null);
    const provider = optionsProvider || emailConfig?.active || defaultEmailConfig.active;
    if (!provider) {
      logger4.error("email_no_provider", { optionsProvider, contextActive: emailConfig?.active, defaultActive: defaultEmailConfig.active, to });
      return err4("No email provider configured");
    }
    const providerConfig = emailConfig && getProviderConfig(emailConfig, provider) || getProviderConfig(defaultEmailConfig, provider);
    if (!providerConfig) {
      logger4.error("email_provider_config_missing", { provider, to, contextProviders: emailConfig?.providers.map((p) => p.name) });
      return err4(`Provider configuration not found for: ${provider}`);
    }
    let apiKey = optionsApiKey;
    if (!apiKey && providerConfig.apiKey) {
      const bindings = getBindings(context);
      apiKey = bindings[providerConfig.apiKey];
    }
    const from = optionsFrom || providerConfig.sendFrom;
    const emailProviderResult = createEmailProvider(provider);
    if (isError(emailProviderResult)) {
      logger4.error("email_provider_creation_failed", { provider, to, error: flattenError(emailProviderResult) });
      return emailProviderResult;
    }
    const sendResult = await emailProviderResult.sendEmail({
      apiKey: apiKey || "",
      to,
      from,
      template: {
        subject: template.subject,
        text: template.text,
        html: template.html
      }
    });
    if (isError(sendResult)) {
      logger4.error("email_send_failed", { to, from, provider, error: flattenError(sendResult) });
      return sendResult;
    }
    return ok2(undefined);
  } catch (error) {
    logger4.error("email_send_unexpected_error", { to: options.to, error });
    return err4("Failed to send email", { error });
  }
}
// ../../node_modules/.bun/@react-email+render@1.4.0+2b5434204782a989/node_modules/@react-email/render/dist/browser/index.mjs
import { Suspense } from "react";

// ../../node_modules/.bun/prettier@3.6.2/node_modules/prettier/plugins/html.mjs
var exports_html = {};
__export(exports_html, {
  printers: () => uu,
  parsers: () => tn,
  options: () => Us,
  languages: () => Hs,
  default: () => ym
});
var on = Object.defineProperty;
var un = (t) => {
  throw TypeError(t);
};
var Ai = (t, e, r) => (e in t) ? on(t, e, { enumerable: true, configurable: true, writable: true, value: r }) : t[e] = r;
var ln = (t, e) => {
  for (var r in e)
    on(t, r, { get: e[r], enumerable: true });
};
var lr = (t, e, r) => Ai(t, typeof e != "symbol" ? e + "" : e, r);
var cn = (t, e, r) => e.has(t) || un("Cannot " + r);
var R = (t, e, r) => (cn(t, e, "read from private field"), r ? r.call(t) : e.get(t));
var At = (t, e, r) => e.has(t) ? un("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r);
var pn = (t, e, r, n) => (cn(t, e, "write to private field"), n ? n.call(t, r) : e.set(t, r), r);
var rn = {};
ln(rn, { languages: () => Hs, options: () => Us, parsers: () => tn, printers: () => uu });
var Di = (t, e, r, n) => {
  if (!(t && e == null))
    return e.replaceAll ? e.replaceAll(r, n) : r.global ? e.replace(r, n) : e.split(r).join(n);
};
var w = Di;
var we = "string";
var ze = "array";
var Ye = "cursor";
var be = "indent";
var Te = "align";
var je = "trim";
var xe = "group";
var ke = "fill";
var ce = "if-break";
var Be = "indent-if-break";
var Ke = "line-suffix";
var Xe = "line-suffix-boundary";
var j = "line";
var Qe = "label";
var Le = "break-parent";
var Dt = new Set([Ye, be, Te, je, xe, ke, ce, Be, Ke, Xe, j, Qe, Le]);
var vi = (t, e, r) => {
  if (!(t && e == null))
    return Array.isArray(e) || typeof e == "string" ? e[r < 0 ? e.length + r : r] : e.at(r);
};
var K = vi;
function yi(t) {
  if (typeof t == "string")
    return we;
  if (Array.isArray(t))
    return ze;
  if (!t)
    return;
  let { type: e } = t;
  if (Dt.has(e))
    return e;
}
var Fe = yi;
var wi = (t) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(t);
function bi(t) {
  let e = t === null ? "null" : typeof t;
  if (e !== "string" && e !== "object")
    return `Unexpected doc '${e}', 
Expected it to be 'string' or 'object'.`;
  if (Fe(t))
    throw new Error("doc is valid.");
  let r = Object.prototype.toString.call(t);
  if (r !== "[object Object]")
    return `Unexpected doc '${r}'.`;
  let n = wi([...Dt].map((s) => `'${s}'`));
  return `Unexpected doc.type '${t.type}'.
Expected it to be ${n}.`;
}
var cr = class extends Error {
  name = "InvalidDocError";
  constructor(e) {
    super(bi(e)), this.doc = e;
  }
};
var pr = cr;
function hr(t, e) {
  if (typeof t == "string")
    return e(t);
  let r = new Map;
  return n(t);
  function n(i) {
    if (r.has(i))
      return r.get(i);
    let a = s(i);
    return r.set(i, a), a;
  }
  function s(i) {
    switch (Fe(i)) {
      case ze:
        return e(i.map(n));
      case ke:
        return e({ ...i, parts: i.parts.map(n) });
      case ce:
        return e({ ...i, breakContents: n(i.breakContents), flatContents: n(i.flatContents) });
      case xe: {
        let { expandedStates: a, contents: o } = i;
        return a ? (a = a.map(n), o = a[0]) : o = n(o), e({ ...i, contents: o, expandedStates: a });
      }
      case Te:
      case be:
      case Be:
      case Qe:
      case Ke:
        return e({ ...i, contents: n(i.contents) });
      case we:
      case Ye:
      case je:
      case Xe:
      case j:
      case Le:
        return e(i);
      default:
        throw new pr(i);
    }
  }
}
function B(t, e = hn) {
  return hr(t, (r) => typeof r == "string" ? H(e, r.split(`
`)) : r);
}
var mr = () => {};
var re = mr;
var fr = mr;
var mn = mr;
function k(t) {
  return re(t), { type: be, contents: t };
}
function fn(t, e) {
  return re(e), { type: Te, contents: e, n: t };
}
function E(t, e = {}) {
  return re(t), fr(e.expandedStates, true), { type: xe, id: e.id, contents: t, break: !!e.shouldBreak, expandedStates: e.expandedStates };
}
function dn(t) {
  return fn(Number.NEGATIVE_INFINITY, t);
}
function gn(t) {
  return fn({ type: "root" }, t);
}
function vt(t) {
  return mn(t), { type: ke, parts: t };
}
function pe(t, e = "", r = {}) {
  return re(t), e !== "" && re(e), { type: ce, breakContents: t, flatContents: e, groupId: r.groupId };
}
function Cn(t, e) {
  return re(t), { type: Be, contents: t, groupId: e.groupId, negate: e.negate };
}
var ne = { type: Le };
var xi = { type: j, hard: true };
var ki = { type: j, hard: true, literal: true };
var _ = { type: j };
var v = { type: j, soft: true };
var S = [xi, ne];
var hn = [ki, ne];
function H(t, e) {
  re(t), fr(e);
  let r = [];
  for (let n = 0;n < e.length; n++)
    n !== 0 && r.push(t), r.push(e[n]);
  return r;
}
var yt = "'";
var Sn = '"';
function Bi(t, e) {
  let r = e === true || e === yt ? yt : Sn, n = r === yt ? Sn : yt, s = 0, i = 0;
  for (let a of t)
    a === r ? s++ : a === n && i++;
  return s > i ? n : r;
}
var _n = Bi;
function dr(t) {
  if (typeof t != "string")
    throw new TypeError("Expected a string");
  return t.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
var V;
var gr = class {
  constructor(e) {
    At(this, V);
    pn(this, V, new Set(e));
  }
  getLeadingWhitespaceCount(e) {
    let r = R(this, V), n = 0;
    for (let s = 0;s < e.length && r.has(e.charAt(s)); s++)
      n++;
    return n;
  }
  getTrailingWhitespaceCount(e) {
    let r = R(this, V), n = 0;
    for (let s = e.length - 1;s >= 0 && r.has(e.charAt(s)); s--)
      n++;
    return n;
  }
  getLeadingWhitespace(e) {
    let r = this.getLeadingWhitespaceCount(e);
    return e.slice(0, r);
  }
  getTrailingWhitespace(e) {
    let r = this.getTrailingWhitespaceCount(e);
    return e.slice(e.length - r);
  }
  hasLeadingWhitespace(e) {
    return R(this, V).has(e.charAt(0));
  }
  hasTrailingWhitespace(e) {
    return R(this, V).has(K(false, e, -1));
  }
  trimStart(e) {
    let r = this.getLeadingWhitespaceCount(e);
    return e.slice(r);
  }
  trimEnd(e) {
    let r = this.getTrailingWhitespaceCount(e);
    return e.slice(0, e.length - r);
  }
  trim(e) {
    return this.trimEnd(this.trimStart(e));
  }
  split(e, r = false) {
    let n = `[${dr([...R(this, V)].join(""))}]+`, s = new RegExp(r ? `(${n})` : n, "u");
    return e.split(s);
  }
  hasWhitespaceCharacter(e) {
    let r = R(this, V);
    return Array.prototype.some.call(e, (n) => r.has(n));
  }
  hasNonWhitespaceCharacter(e) {
    let r = R(this, V);
    return Array.prototype.some.call(e, (n) => !r.has(n));
  }
  isWhitespaceOnly(e) {
    let r = R(this, V);
    return Array.prototype.every.call(e, (n) => r.has(n));
  }
};
V = new WeakMap;
var En = gr;
var Li = ["\t", `
`, "\f", "\r", " "];
var Fi = new En(Li);
var O = Fi;
var Cr = class extends Error {
  name = "UnexpectedNodeError";
  constructor(e, r, n = "type") {
    super(`Unexpected ${r} node ${n}: ${JSON.stringify(e[n])}.`), this.node = e;
  }
};
var An = Cr;
function Pi(t) {
  return (t == null ? undefined : t.type) === "front-matter";
}
var Pe = Pi;
var Ni = new Set(["sourceSpan", "startSourceSpan", "endSourceSpan", "nameSpan", "valueSpan", "keySpan", "tagDefinition", "tokens", "valueTokens", "switchValueSourceSpan", "expSourceSpan", "valueSourceSpan"]);
var Ii = new Set(["if", "else if", "for", "switch", "case"]);
function Dn(t, e) {
  var r;
  if (t.type === "text" || t.type === "comment" || Pe(t) || t.type === "yaml" || t.type === "toml")
    return null;
  if (t.type === "attribute" && delete e.value, t.type === "docType" && delete e.value, t.type === "angularControlFlowBlock" && ((r = t.parameters) != null && r.children))
    for (let n of e.parameters.children)
      Ii.has(t.name) ? delete n.expression : n.expression = n.expression.trim();
  t.type === "angularIcuExpression" && (e.switchValue = t.switchValue.trim()), t.type === "angularLetDeclarationInitializer" && delete e.value;
}
Dn.ignoredProperties = Ni;
var vn = Dn;
async function Ri(t, e) {
  if (t.language === "yaml") {
    let r = t.value.trim(), n = r ? await e(r, { parser: "yaml" }) : "";
    return gn([t.startDelimiter, t.explicitLanguage, S, n, n ? S : "", t.endDelimiter]);
  }
}
var yn = Ri;
function he(t, e = true) {
  return [k([v, t]), e ? v : ""];
}
function X(t, e) {
  let r = t.type === "NGRoot" ? t.node.type === "NGMicrosyntax" && t.node.body.length === 1 && t.node.body[0].type === "NGMicrosyntaxExpression" ? t.node.body[0].expression : t.node : t.type === "JsExpressionRoot" ? t.node : t;
  return r && (r.type === "ObjectExpression" || r.type === "ArrayExpression" || (e.parser === "__vue_expression" || e.parser === "__vue_ts_expression") && (r.type === "TemplateLiteral" || r.type === "StringLiteral"));
}
async function T(t, e, r, n) {
  r = { __isInHtmlAttribute: true, __embeddedInHtml: true, ...r };
  let s = true;
  n && (r.__onHtmlBindingRoot = (a, o) => {
    s = n(a, o);
  });
  let i = await e(t, r, e);
  return s ? E(i) : he(i);
}
function $i(t, e, r, n) {
  let { node: s } = r, i = n.originalText.slice(s.sourceSpan.start.offset, s.sourceSpan.end.offset);
  return /^\s*$/u.test(i) ? "" : T(i, t, { parser: "__ng_directive", __isInHtmlAttribute: false }, X);
}
var wn = $i;
var Oi = (t, e) => {
  if (!(t && e == null))
    return e.toReversed || !Array.isArray(e) ? e.toReversed() : [...e].reverse();
};
var bn = Oi;
function Mi(t) {
  return Array.isArray(t) && t.length > 0;
}
var me = Mi;
var Tn;
var xn;
var kn;
var Bn;
var Ln;
var qi = ((Tn = globalThis.Deno) == null ? undefined : Tn.build.os) === "windows" || ((kn = (xn = globalThis.navigator) == null ? undefined : xn.platform) == null ? undefined : kn.startsWith("Win")) || ((Ln = (Bn = globalThis.process) == null ? undefined : Bn.platform) == null ? undefined : Ln.startsWith("win")) || false;
function Fn(t) {
  if (t = t instanceof URL ? t : new URL(t), t.protocol !== "file:")
    throw new TypeError(`URL must be a file URL: received "${t.protocol}"`);
  return t;
}
function Hi(t) {
  return t = Fn(t), decodeURIComponent(t.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function Vi(t) {
  t = Fn(t);
  let e = decodeURIComponent(t.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
  return t.hostname !== "" && (e = `\\\\${t.hostname}${e}`), e;
}
function Pn(t) {
  return qi ? Vi(t) : Hi(t);
}
var Nn = Pn;
var Ui = (t) => String(t).split(/[/\\]/u).pop();
function In(t, e) {
  if (!e)
    return;
  let r = Ui(e).toLowerCase();
  return t.find(({ filenames: n }) => n == null ? undefined : n.some((s) => s.toLowerCase() === r)) ?? t.find(({ extensions: n }) => n == null ? undefined : n.some((s) => r.endsWith(s)));
}
function Wi(t, e) {
  if (e)
    return t.find(({ name: r }) => r.toLowerCase() === e) ?? t.find(({ aliases: r }) => r == null ? undefined : r.includes(e)) ?? t.find(({ extensions: r }) => r == null ? undefined : r.includes(`.${e}`));
}
function Rn(t, e) {
  if (e) {
    if (String(e).startsWith("file:"))
      try {
        e = Nn(e);
      } catch {
        return;
      }
    if (typeof e == "string")
      return t.find(({ isSupported: r }) => r == null ? undefined : r({ filepath: e }));
  }
}
function Gi(t, e) {
  let r = bn(false, t.plugins).flatMap((s) => s.languages ?? []), n = Wi(r, e.language) ?? In(r, e.physicalFile) ?? In(r, e.file) ?? Rn(r, e.physicalFile) ?? Rn(r, e.file) ?? (e.physicalFile, undefined);
  return n == null ? undefined : n.parsers[0];
}
var Ne = Gi;
var $n = "inline";
var Sr = { area: "none", base: "none", basefont: "none", datalist: "none", head: "none", link: "none", meta: "none", noembed: "none", noframes: "none", param: "block", rp: "none", script: "block", style: "none", template: "inline", title: "none", html: "block", body: "block", address: "block", blockquote: "block", center: "block", dialog: "block", div: "block", figure: "block", figcaption: "block", footer: "block", form: "block", header: "block", hr: "block", legend: "block", listing: "block", main: "block", p: "block", plaintext: "block", pre: "block", search: "block", xmp: "block", slot: "contents", ruby: "ruby", rt: "ruby-text", article: "block", aside: "block", h1: "block", h2: "block", h3: "block", h4: "block", h5: "block", h6: "block", hgroup: "block", nav: "block", section: "block", dir: "block", dd: "block", dl: "block", dt: "block", menu: "block", ol: "block", ul: "block", li: "list-item", table: "table", caption: "table-caption", colgroup: "table-column-group", col: "table-column", thead: "table-header-group", tbody: "table-row-group", tfoot: "table-footer-group", tr: "table-row", td: "table-cell", th: "table-cell", input: "inline-block", button: "inline-block", fieldset: "block", details: "block", summary: "block", marquee: "inline-block", source: "block", track: "block", meter: "inline-block", progress: "inline-block", object: "inline-block", video: "inline-block", audio: "inline-block", select: "inline-block", option: "block", optgroup: "block" };
var On = "normal";
var _r = { listing: "pre", plaintext: "pre", pre: "pre", xmp: "pre", nobr: "nowrap", table: "initial", textarea: "pre-wrap" };
function zi(t) {
  return t.type === "element" && !t.hasExplicitNamespace && !["html", "svg"].includes(t.namespace);
}
var fe = zi;
var Yi = (t) => w(false, t, /^[\t\f\r ]*\n/gu, "");
var Er = (t) => Yi(O.trimEnd(t));
var Mn = (t) => {
  let e = t, r = O.getLeadingWhitespace(e);
  r && (e = e.slice(r.length));
  let n = O.getTrailingWhitespace(e);
  return n && (e = e.slice(0, -n.length)), { leadingWhitespace: r, trailingWhitespace: n, text: e };
};
function wt(t, e) {
  return !!(t.type === "ieConditionalComment" && t.lastChild && !t.lastChild.isSelfClosing && !t.lastChild.endSourceSpan || t.type === "ieConditionalComment" && !t.complete || de(t) && t.children.some((r) => r.type !== "text" && r.type !== "interpolation") || xt(t, e) && !W(t, e) && t.type !== "interpolation");
}
function ge(t) {
  return t.type === "attribute" || !t.parent || !t.prev ? false : ji(t.prev);
}
function ji(t) {
  return t.type === "comment" && t.value.trim() === "prettier-ignore";
}
function $(t) {
  return t.type === "text" || t.type === "comment";
}
function W(t, e) {
  return t.type === "element" && (t.fullName === "script" || t.fullName === "style" || t.fullName === "svg:style" || t.fullName === "svg:script" || t.fullName === "mj-style" && e.parser === "mjml" || fe(t) && (t.name === "script" || t.name === "style"));
}
function qn(t, e) {
  return t.children && !W(t, e);
}
function Hn(t, e) {
  return W(t, e) || t.type === "interpolation" || Ar(t);
}
function Ar(t) {
  return Jn(t).startsWith("pre");
}
function Vn(t, e) {
  var s, i;
  let r = n();
  if (r && !t.prev && ((i = (s = t.parent) == null ? undefined : s.tagDefinition) != null && i.ignoreFirstLf))
    return t.type === "interpolation";
  return r;
  function n() {
    return Pe(t) || t.type === "angularControlFlowBlock" ? false : (t.type === "text" || t.type === "interpolation") && t.prev && (t.prev.type === "text" || t.prev.type === "interpolation") ? true : !t.parent || t.parent.cssDisplay === "none" ? false : de(t.parent) ? true : !(!t.prev && (t.parent.type === "root" || de(t) && t.parent || W(t.parent, e) || et(t.parent, e) || !ea(t.parent.cssDisplay)) || t.prev && !na(t.prev.cssDisplay));
  }
}
function Un(t, e) {
  return Pe(t) || t.type === "angularControlFlowBlock" ? false : (t.type === "text" || t.type === "interpolation") && t.next && (t.next.type === "text" || t.next.type === "interpolation") ? true : !t.parent || t.parent.cssDisplay === "none" ? false : de(t.parent) ? true : !(!t.next && (t.parent.type === "root" || de(t) && t.parent || W(t.parent, e) || et(t.parent, e) || !ta(t.parent.cssDisplay)) || t.next && !ra(t.next.cssDisplay));
}
function Wn(t, e) {
  return sa(t.cssDisplay) && !W(t, e);
}
function Je(t) {
  return Pe(t) || t.next && t.sourceSpan.end && t.sourceSpan.end.line + 1 < t.next.sourceSpan.start.line;
}
function Gn(t) {
  return Dr(t) || t.type === "element" && t.children.length > 0 && (["body", "script", "style"].includes(t.name) || t.children.some((e) => Xi(e))) || t.firstChild && t.firstChild === t.lastChild && t.firstChild.type !== "text" && Yn(t.firstChild) && (!t.lastChild.isTrailingSpaceSensitive || jn(t.lastChild));
}
function Dr(t) {
  return t.type === "element" && t.children.length > 0 && (["html", "head", "ul", "ol", "select"].includes(t.name) || t.cssDisplay.startsWith("table") && t.cssDisplay !== "table-cell");
}
function bt(t) {
  return Kn(t) || t.prev && Ki(t.prev) || zn(t);
}
function Ki(t) {
  return Kn(t) || t.type === "element" && t.fullName === "br" || zn(t);
}
function zn(t) {
  return Yn(t) && jn(t);
}
function Yn(t) {
  return t.hasLeadingSpaces && (t.prev ? t.prev.sourceSpan.end.line < t.sourceSpan.start.line : t.parent.type === "root" || t.parent.startSourceSpan.end.line < t.sourceSpan.start.line);
}
function jn(t) {
  return t.hasTrailingSpaces && (t.next ? t.next.sourceSpan.start.line > t.sourceSpan.end.line : t.parent.type === "root" || t.parent.endSourceSpan && t.parent.endSourceSpan.start.line > t.sourceSpan.end.line);
}
function Kn(t) {
  switch (t.type) {
    case "ieConditionalComment":
    case "comment":
    case "directive":
      return true;
    case "element":
      return ["script", "select"].includes(t.name);
  }
  return false;
}
function Tt(t) {
  return t.lastChild ? Tt(t.lastChild) : t;
}
function Xi(t) {
  var e;
  return (e = t.children) == null ? undefined : e.some((r) => r.type !== "text");
}
function Xn(t) {
  if (t)
    switch (t) {
      case "module":
      case "text/javascript":
      case "text/babel":
      case "text/jsx":
      case "application/javascript":
        return "babel";
      case "application/x-typescript":
        return "typescript";
      case "text/markdown":
        return "markdown";
      case "text/html":
        return "html";
      case "text/x-handlebars-template":
        return "glimmer";
      default:
        if (t.endsWith("json") || t.endsWith("importmap") || t === "speculationrules")
          return "json";
    }
}
function Qi(t, e) {
  let { name: r, attrMap: n } = t;
  if (r !== "script" || Object.prototype.hasOwnProperty.call(n, "src"))
    return;
  let { type: s, lang: i } = t.attrMap;
  return !i && !s ? "babel" : Ne(e, { language: i }) ?? Xn(s);
}
function Ji(t, e) {
  if (!xt(t, e))
    return;
  let { attrMap: r } = t;
  if (Object.prototype.hasOwnProperty.call(r, "src"))
    return;
  let { type: n, lang: s } = r;
  return Ne(e, { language: s }) ?? Xn(n);
}
function Zi(t, e) {
  if (t.name === "style") {
    let { lang: r } = t.attrMap;
    return r ? Ne(e, { language: r }) : "css";
  }
  if (t.name === "mj-style" && e.parser === "mjml")
    return "css";
}
function vr(t, e) {
  return Qi(t, e) ?? Zi(t, e) ?? Ji(t, e);
}
function Ze(t) {
  return t === "block" || t === "list-item" || t.startsWith("table");
}
function ea(t) {
  return !Ze(t) && t !== "inline-block";
}
function ta(t) {
  return !Ze(t) && t !== "inline-block";
}
function ra(t) {
  return !Ze(t);
}
function na(t) {
  return !Ze(t);
}
function sa(t) {
  return !Ze(t) && t !== "inline-block";
}
function de(t) {
  return Jn(t).startsWith("pre");
}
function ia(t, e) {
  let r = t;
  for (;r; ) {
    if (e(r))
      return true;
    r = r.parent;
  }
  return false;
}
function Qn(t, e) {
  var n;
  if (Ce(t, e))
    return "block";
  if (((n = t.prev) == null ? undefined : n.type) === "comment") {
    let s = t.prev.value.match(/^\s*display:\s*([a-z]+)\s*$/u);
    if (s)
      return s[1];
  }
  let r = false;
  if (t.type === "element" && t.namespace === "svg")
    if (ia(t, (s) => s.fullName === "svg:foreignObject"))
      r = true;
    else
      return t.name === "svg" ? "inline-block" : "block";
  switch (e.htmlWhitespaceSensitivity) {
    case "strict":
      return "inline";
    case "ignore":
      return "block";
    default:
      if (t.type === "element" && (!t.namespace || r || fe(t)) && Object.prototype.hasOwnProperty.call(Sr, t.name))
        return Sr[t.name];
  }
  return $n;
}
function Jn(t) {
  return t.type === "element" && (!t.namespace || fe(t)) && Object.prototype.hasOwnProperty.call(_r, t.name) ? _r[t.name] : On;
}
function aa(t) {
  let e = Number.POSITIVE_INFINITY;
  for (let r of t.split(`
`)) {
    if (r.length === 0)
      continue;
    let n = O.getLeadingWhitespaceCount(r);
    if (n === 0)
      return 0;
    r.length !== n && n < e && (e = n);
  }
  return e === Number.POSITIVE_INFINITY ? 0 : e;
}
function yr(t, e = aa(t)) {
  return e === 0 ? t : t.split(`
`).map((r) => r.slice(e)).join(`
`);
}
function wr(t) {
  return w(false, w(false, t, "&apos;", "'"), "&quot;", '"');
}
function P(t) {
  return wr(t.value);
}
var oa = new Set(["template", "style", "script"]);
function et(t, e) {
  return Ce(t, e) && !oa.has(t.fullName);
}
function Ce(t, e) {
  return e.parser === "vue" && t.type === "element" && t.parent.type === "root" && t.fullName.toLowerCase() !== "html";
}
function xt(t, e) {
  return Ce(t, e) && (et(t, e) || t.attrMap.lang && t.attrMap.lang !== "html");
}
function Zn(t) {
  let e = t.fullName;
  return e.charAt(0) === "#" || e === "slot-scope" || e === "v-slot" || e.startsWith("v-slot:");
}
function es(t, e) {
  let r = t.parent;
  if (!Ce(r, e))
    return false;
  let n = r.fullName, s = t.fullName;
  return n === "script" && s === "setup" || n === "style" && s === "vars";
}
function kt(t, e = t.value) {
  return t.parent.isWhitespaceSensitive ? t.parent.isIndentationSensitive ? B(e) : B(yr(Er(e)), S) : H(_, O.split(e));
}
function Bt(t, e) {
  return Ce(t, e) && t.name === "script";
}
var br = /\{\{(.+?)\}\}/su;
async function ts(t, e) {
  let r = [];
  for (let [n, s] of t.split(br).entries())
    if (n % 2 === 0)
      r.push(B(s));
    else
      try {
        r.push(E(["{{", k([_, await T(s, e, { parser: "__ng_interpolation", __isInHtmlInterpolation: true })]), _, "}}"]));
      } catch {
        r.push("{{", B(s), "}}");
      }
  return r;
}
function Tr({ parser: t }) {
  return (e, r, n) => T(P(n.node), e, { parser: t }, X);
}
var ua = Tr({ parser: "__ng_action" });
var la = Tr({ parser: "__ng_binding" });
var ca = Tr({ parser: "__ng_directive" });
function pa(t, e) {
  if (e.parser !== "angular")
    return;
  let { node: r } = t, n = r.fullName;
  if (n.startsWith("(") && n.endsWith(")") || n.startsWith("on-"))
    return ua;
  if (n.startsWith("[") && n.endsWith("]") || /^bind(?:on)?-/u.test(n) || /^ng-(?:if|show|hide|class|style)$/u.test(n))
    return la;
  if (n.startsWith("*"))
    return ca;
  let s = P(r);
  if (/^i18n(?:-.+)?$/u.test(n))
    return () => he(vt(kt(r, s.trim())), !s.includes("@@"));
  if (br.test(s))
    return (i) => ts(s, i);
}
var rs = pa;
function ha(t, e) {
  let { node: r } = t, n = P(r);
  if (r.fullName === "class" && !e.parentParser && !n.includes("{{"))
    return () => n.trim().split(/\s+/u).join(" ");
}
var ns = ha;
function ss(t) {
  return t === "\t" || t === `
` || t === "\f" || t === "\r" || t === " ";
}
var ma = /^[ \t\n\r\u000c]+/;
var fa = /^[, \t\n\r\u000c]+/;
var da = /^[^ \t\n\r\u000c]+/;
var ga = /[,]+$/;
var is = /^\d+$/;
var Ca = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;
function Sa(t) {
  let e = t.length, r, n, s, i, a, o = 0, u;
  function p(C) {
    let A, D = C.exec(t.substring(o));
    if (D)
      return [A] = D, o += A.length, A;
  }
  let l = [];
  for (;; ) {
    if (p(fa), o >= e) {
      if (l.length === 0)
        throw new Error("Must contain one or more image candidate strings.");
      return l;
    }
    u = o, r = p(da), n = [], r.slice(-1) === "," ? (r = r.replace(ga, ""), f()) : m();
  }
  function m() {
    for (p(ma), s = "", i = "in descriptor";; ) {
      if (a = t.charAt(o), i === "in descriptor")
        if (ss(a))
          s && (n.push(s), s = "", i = "after descriptor");
        else if (a === ",") {
          o += 1, s && n.push(s), f();
          return;
        } else if (a === "(")
          s += a, i = "in parens";
        else if (a === "") {
          s && n.push(s), f();
          return;
        } else
          s += a;
      else if (i === "in parens")
        if (a === ")")
          s += a, i = "in descriptor";
        else if (a === "") {
          n.push(s), f();
          return;
        } else
          s += a;
      else if (i === "after descriptor" && !ss(a))
        if (a === "") {
          f();
          return;
        } else
          i = "in descriptor", o -= 1;
      o += 1;
    }
  }
  function f() {
    let C = false, A, D, I, F, c = {}, g, y, q, x, U;
    for (F = 0;F < n.length; F++)
      g = n[F], y = g[g.length - 1], q = g.substring(0, g.length - 1), x = parseInt(q, 10), U = parseFloat(q), is.test(q) && y === "w" ? ((A || D) && (C = true), x === 0 ? C = true : A = x) : Ca.test(q) && y === "x" ? ((A || D || I) && (C = true), U < 0 ? C = true : D = U) : is.test(q) && y === "h" ? ((I || D) && (C = true), x === 0 ? C = true : I = x) : C = true;
    if (!C)
      c.source = { value: r, startOffset: u }, A && (c.width = { value: A }), D && (c.density = { value: D }), I && (c.height = { value: I }), l.push(c);
    else
      throw new Error(`Invalid srcset descriptor found in "${t}" at "${g}".`);
  }
}
var as = Sa;
function _a(t) {
  if (t.node.fullName === "srcset" && (t.parent.fullName === "img" || t.parent.fullName === "source"))
    return () => Aa(P(t.node));
}
var os = { width: "w", height: "h", density: "x" };
var Ea = Object.keys(os);
function Aa(t) {
  let e = as(t), r = Ea.filter((l) => e.some((m) => Object.prototype.hasOwnProperty.call(m, l)));
  if (r.length > 1)
    throw new Error("Mixed descriptor in srcset is not supported");
  let [n] = r, s = os[n], i = e.map((l) => l.source.value), a = Math.max(...i.map((l) => l.length)), o = e.map((l) => l[n] ? String(l[n].value) : ""), u = o.map((l) => {
    let m = l.indexOf(".");
    return m === -1 ? l.length : m;
  }), p = Math.max(...u);
  return he(H([",", _], i.map((l, m) => {
    let f = [l], C = o[m];
    if (C) {
      let A = a - l.length + 1, D = p - u[m], I = " ".repeat(A + D);
      f.push(pe(I, " "), C + s);
    }
    return f;
  })));
}
var us = _a;
function ls(t, e) {
  let { node: r } = t, n = P(t.node).trim();
  if (r.fullName === "style" && !e.parentParser && !n.includes("{{"))
    return async (s) => he(await s(n, { parser: "css", __isHTMLStyleAttribute: true }));
}
var xr = new WeakMap;
function Da(t, e) {
  let { root: r } = t;
  return xr.has(r) || xr.set(r, r.children.some((n) => Bt(n, e) && ["ts", "typescript"].includes(n.attrMap.lang))), xr.get(r);
}
var Ie = Da;
function cs(t, e, r) {
  let { node: n } = r, s = P(n);
  return T(`type T<${s}> = any`, t, { parser: "babel-ts", __isEmbeddedTypescriptGenericParameters: true }, X);
}
function ps(t, e, { parseWithTs: r }) {
  return T(`function _(${t}) {}`, e, { parser: r ? "babel-ts" : "babel", __isVueBindings: true });
}
async function hs(t, e, r, n) {
  let s = P(r.node), { left: i, operator: a, right: o } = va(s), u = Ie(r, n);
  return [E(await T(`function _(${i}) {}`, t, { parser: u ? "babel-ts" : "babel", __isVueForBindingLeft: true })), " ", a, " ", await T(o, t, { parser: u ? "__ts_expression" : "__js_expression" })];
}
function va(t) {
  let e = /(.*?)\s+(in|of)\s+(.*)/su, r = /,([^,\]}]*)(?:,([^,\]}]*))?$/u, n = /^\(|\)$/gu, s = t.match(e);
  if (!s)
    return;
  let i = {};
  if (i.for = s[3].trim(), !i.for)
    return;
  let a = w(false, s[1].trim(), n, ""), o = a.match(r);
  o ? (i.alias = a.replace(r, ""), i.iterator1 = o[1].trim(), o[2] && (i.iterator2 = o[2].trim())) : i.alias = a;
  let u = [i.alias, i.iterator1, i.iterator2];
  if (!u.some((p, l) => !p && (l === 0 || u.slice(l + 1).some(Boolean))))
    return { left: u.filter(Boolean).join(","), operator: s[2], right: i.for };
}
function ya(t, e) {
  if (e.parser !== "vue")
    return;
  let { node: r } = t, n = r.fullName;
  if (n === "v-for")
    return hs;
  if (n === "generic" && Bt(r.parent, e))
    return cs;
  let s = P(r), i = Ie(t, e);
  if (Zn(r) || es(r, e))
    return (a) => ps(s, a, { parseWithTs: i });
  if (n.startsWith("@") || n.startsWith("v-on:"))
    return (a) => wa(s, a, { parseWithTs: i });
  if (n.startsWith(":") || n.startsWith(".") || n.startsWith("v-bind:"))
    return (a) => ba(s, a, { parseWithTs: i });
  if (n.startsWith("v-"))
    return (a) => ms(s, a, { parseWithTs: i });
}
async function wa(t, e, { parseWithTs: r }) {
  var n;
  try {
    return await ms(t, e, { parseWithTs: r });
  } catch (s) {
    if (((n = s.cause) == null ? undefined : n.code) !== "BABEL_PARSER_SYNTAX_ERROR")
      throw s;
  }
  return T(t, e, { parser: r ? "__vue_ts_event_binding" : "__vue_event_binding" }, X);
}
function ba(t, e, { parseWithTs: r }) {
  return T(t, e, { parser: r ? "__vue_ts_expression" : "__vue_expression" }, X);
}
function ms(t, e, { parseWithTs: r }) {
  return T(t, e, { parser: r ? "__ts_expression" : "__js_expression" }, X);
}
var fs = ya;
function Ta(t, e) {
  let { node: r } = t;
  if (r.value) {
    if (/^PRETTIER_HTML_PLACEHOLDER_\d+_\d+_IN_JS$/u.test(e.originalText.slice(r.valueSpan.start.offset, r.valueSpan.end.offset)) || e.parser === "lwc" && r.value.startsWith("{") && r.value.endsWith("}"))
      return [r.rawName, "=", r.value];
    for (let n of [us, ls, ns, fs, rs]) {
      let s = n(t, e);
      if (s)
        return xa(s);
    }
  }
}
function xa(t) {
  return async (e, r, n, s) => {
    let i = await t(e, r, n, s);
    if (i)
      return i = hr(i, (a) => typeof a == "string" ? w(false, a, '"', "&quot;") : a), [n.node.rawName, '="', E(i), '"'];
  };
}
var ds = Ta;
var ka = new Proxy(() => {}, { get: () => ka });
function J(t) {
  return t.sourceSpan.start.offset;
}
function se(t) {
  return t.sourceSpan.end.offset;
}
function tt(t, e) {
  return [t.isSelfClosing ? "" : Ba(t, e), Se(t, e)];
}
function Ba(t, e) {
  return t.lastChild && Ae(t.lastChild) ? "" : [La(t, e), Lt(t, e)];
}
function Se(t, e) {
  return (t.next ? Q(t.next) : Ee(t.parent)) ? "" : [_e(t, e), G(t, e)];
}
function La(t, e) {
  return Ee(t) ? _e(t.lastChild, e) : "";
}
function G(t, e) {
  return Ae(t) ? Lt(t.parent, e) : rt(t) ? Ft(t.next, e) : "";
}
function Lt(t, e) {
  if (Cs(t, e))
    return "";
  switch (t.type) {
    case "ieConditionalComment":
      return "<!";
    case "element":
      if (t.hasHtmComponentClosingTag)
        return "<//";
    default:
      return `</${t.rawName}`;
  }
}
function _e(t, e) {
  if (Cs(t, e))
    return "";
  switch (t.type) {
    case "ieConditionalComment":
    case "ieConditionalEndComment":
      return "[endif]-->";
    case "ieConditionalStartComment":
      return "]><!-->";
    case "interpolation":
      return "}}";
    case "angularIcuExpression":
      return "}";
    case "element":
      if (t.isSelfClosing)
        return "/>";
    default:
      return ">";
  }
}
function Cs(t, e) {
  return !t.isSelfClosing && !t.endSourceSpan && (ge(t) || wt(t.parent, e));
}
function Q(t) {
  return t.prev && t.prev.type !== "docType" && t.type !== "angularControlFlowBlock" && !$(t.prev) && t.isLeadingSpaceSensitive && !t.hasLeadingSpaces;
}
function Ee(t) {
  var e;
  return ((e = t.lastChild) == null ? undefined : e.isTrailingSpaceSensitive) && !t.lastChild.hasTrailingSpaces && !$(Tt(t.lastChild)) && !de(t);
}
function Ae(t) {
  return !t.next && !t.hasTrailingSpaces && t.isTrailingSpaceSensitive && $(Tt(t));
}
function rt(t) {
  return t.next && !$(t.next) && $(t) && t.isTrailingSpaceSensitive && !t.hasTrailingSpaces;
}
function Fa(t) {
  let e = t.trim().match(/^prettier-ignore-attribute(?:\s+(.+))?$/su);
  return e ? e[1] ? e[1].split(/\s+/u) : true : false;
}
function nt(t) {
  return !t.prev && t.isLeadingSpaceSensitive && !t.hasLeadingSpaces;
}
function Pa(t, e, r) {
  var m;
  let { node: n } = t;
  if (!me(n.attrs))
    return n.isSelfClosing ? " " : "";
  let s = ((m = n.prev) == null ? undefined : m.type) === "comment" && Fa(n.prev.value), i = typeof s == "boolean" ? () => s : Array.isArray(s) ? (f) => s.includes(f.rawName) : () => false, a = t.map(({ node: f }) => i(f) ? B(e.originalText.slice(J(f), se(f))) : r(), "attrs"), o = n.type === "element" && n.fullName === "script" && n.attrs.length === 1 && n.attrs[0].fullName === "src" && n.children.length === 0, p = e.singleAttributePerLine && n.attrs.length > 1 && !Ce(n, e) ? S : _, l = [k([o ? " " : _, H(p, a)])];
  return n.firstChild && nt(n.firstChild) || n.isSelfClosing && Ee(n.parent) || o ? l.push(n.isSelfClosing ? " " : "") : l.push(e.bracketSameLine ? n.isSelfClosing ? " " : "" : n.isSelfClosing ? _ : v), l;
}
function Na(t) {
  return t.firstChild && nt(t.firstChild) ? "" : Pt(t);
}
function st(t, e, r) {
  let { node: n } = t;
  return [De(n, e), Pa(t, e, r), n.isSelfClosing ? "" : Na(n)];
}
function De(t, e) {
  return t.prev && rt(t.prev) ? "" : [z(t, e), Ft(t, e)];
}
function z(t, e) {
  return nt(t) ? Pt(t.parent) : Q(t) ? _e(t.prev, e) : "";
}
var gs = "<!doctype";
function Ft(t, e) {
  switch (t.type) {
    case "ieConditionalComment":
    case "ieConditionalStartComment":
      return `<!--[if ${t.condition}`;
    case "ieConditionalEndComment":
      return "<!--<!";
    case "interpolation":
      return "{{";
    case "docType": {
      if (t.value === "html") {
        let { filepath: n } = e;
        if (n && /\.html?$/u.test(n))
          return gs;
      }
      let r = J(t);
      return e.originalText.slice(r, r + gs.length);
    }
    case "angularIcuExpression":
      return "{";
    case "element":
      if (t.condition)
        return `<!--[if ${t.condition}]><!--><${t.rawName}`;
    default:
      return `<${t.rawName}`;
  }
}
function Pt(t) {
  switch (t.type) {
    case "ieConditionalComment":
      return "]>";
    case "element":
      if (t.condition)
        return "><!--<![endif]-->";
    default:
      return ">";
  }
}
function Ia(t, e) {
  if (!t.endSourceSpan)
    return "";
  let r = t.startSourceSpan.end.offset;
  t.firstChild && nt(t.firstChild) && (r -= Pt(t).length);
  let n = t.endSourceSpan.start.offset;
  return t.lastChild && Ae(t.lastChild) ? n += Lt(t, e).length : Ee(t) && (n -= _e(t.lastChild, e).length), e.originalText.slice(r, n);
}
var Nt = Ia;
var Ra = new Set(["if", "else if", "for", "switch", "case"]);
function $a(t, e) {
  let { node: r } = t;
  switch (r.type) {
    case "element":
      if (W(r, e) || r.type === "interpolation")
        return;
      if (!r.isSelfClosing && xt(r, e)) {
        let n = vr(r, e);
        return n ? async (s, i) => {
          let a = Nt(r, e), o = /^\s*$/u.test(a), u = "";
          return o || (u = await s(Er(a), { parser: n, __embeddedInHtml: true }), o = u === ""), [z(r, e), E(st(t, e, i)), o ? "" : S, u, o ? "" : S, tt(r, e), G(r, e)];
        } : undefined;
      }
      break;
    case "text":
      if (W(r.parent, e)) {
        let n = vr(r.parent, e);
        if (n)
          return async (s) => {
            let i = n === "markdown" ? yr(r.value.replace(/^[^\S\n]*\n/u, "")) : r.value, a = { parser: n, __embeddedInHtml: true };
            if (e.parser === "html" && n === "babel") {
              let o = "script", { attrMap: u } = r.parent;
              u && (u.type === "module" || (u.type === "text/babel" || u.type === "text/jsx") && u["data-type"] === "module") && (o = "module"), a.__babelSourceType = o;
            }
            return [ne, z(r, e), await s(i, a), G(r, e)];
          };
      } else if (r.parent.type === "interpolation")
        return async (n) => {
          let s = { __isInHtmlInterpolation: true, __embeddedInHtml: true };
          return e.parser === "angular" ? s.parser = "__ng_interpolation" : e.parser === "vue" ? s.parser = Ie(t, e) ? "__vue_ts_expression" : "__vue_expression" : s.parser = "__js_expression", [k([_, await n(r.value, s)]), r.parent.next && Q(r.parent.next) ? " " : _];
        };
      break;
    case "attribute":
      return ds(t, e);
    case "front-matter":
      return (n) => yn(r, n);
    case "angularControlFlowBlockParameters":
      return Ra.has(t.parent.name) ? wn : undefined;
    case "angularLetDeclarationInitializer":
      return (n) => T(r.value, n, { parser: "__ng_binding", __isInHtmlAttribute: false });
  }
}
var Ss = $a;
var it = null;
function at(t) {
  if (it !== null && typeof it.property) {
    let e = it;
    return it = at.prototype = null, e;
  }
  return it = at.prototype = t ?? Object.create(null), new at;
}
var Oa = 10;
for (let t = 0;t <= Oa; t++)
  at();
function kr(t) {
  return at(t);
}
function Ma(t, e = "type") {
  kr(t);
  function r(n) {
    let s = n[e], i = t[s];
    if (!Array.isArray(i))
      throw Object.assign(new Error(`Missing visitor keys for '${s}'.`), { node: n });
    return i;
  }
  return r;
}
var _s = Ma;
var qa = { "front-matter": [], root: ["children"], element: ["attrs", "children"], ieConditionalComment: ["children"], ieConditionalStartComment: [], ieConditionalEndComment: [], interpolation: ["children"], text: ["children"], docType: [], comment: [], attribute: [], cdata: [], angularControlFlowBlock: ["children", "parameters"], angularControlFlowBlockParameters: ["children"], angularControlFlowBlockParameter: [], angularLetDeclaration: ["init"], angularLetDeclarationInitializer: [], angularIcuExpression: ["cases"], angularIcuCase: ["expression"] };
var Es = qa;
var Ha = _s(Es);
var As = Ha;
var Ds = "format";
var vs = /^\s*<!--\s*@(?:noformat|noprettier)\s*-->/u;
var ys = /^\s*<!--\s*@(?:format|prettier)\s*-->/u;
function ws(t) {
  return ys.test(t);
}
function bs(t) {
  return vs.test(t);
}
function Ts(t) {
  return `<!-- @${Ds} -->

${t}`;
}
var xs = new Map([["if", new Set(["else if", "else"])], ["else if", new Set(["else if", "else"])], ["for", new Set(["empty"])], ["defer", new Set(["placeholder", "error", "loading"])], ["placeholder", new Set(["placeholder", "error", "loading"])], ["error", new Set(["placeholder", "error", "loading"])], ["loading", new Set(["placeholder", "error", "loading"])]]);
function ks(t) {
  let e = se(t);
  return t.type === "element" && !t.endSourceSpan && me(t.children) ? Math.max(e, ks(K(false, t.children, -1))) : e;
}
function ot(t, e, r) {
  let n = t.node;
  if (ge(n)) {
    let s = ks(n);
    return [z(n, e), B(O.trimEnd(e.originalText.slice(J(n) + (n.prev && rt(n.prev) ? Ft(n).length : 0), s - (n.next && Q(n.next) ? _e(n, e).length : 0)))), G(n, e)];
  }
  return r();
}
function It(t, e) {
  return $(t) && $(e) ? t.isTrailingSpaceSensitive ? t.hasTrailingSpaces ? bt(e) ? S : _ : "" : bt(e) ? S : v : rt(t) && (ge(e) || e.firstChild || e.isSelfClosing || e.type === "element" && e.attrs.length > 0) || t.type === "element" && t.isSelfClosing && Q(e) ? "" : !e.isLeadingSpaceSensitive || bt(e) || Q(e) && t.lastChild && Ae(t.lastChild) && t.lastChild.lastChild && Ae(t.lastChild.lastChild) ? S : e.hasLeadingSpaces ? _ : v;
}
function Re(t, e, r) {
  let { node: n } = t;
  if (Dr(n))
    return [ne, ...t.map((i) => {
      let a = i.node, o = a.prev ? It(a.prev, a) : "";
      return [o ? [o, Je(a.prev) ? S : ""] : "", ot(i, e, r)];
    }, "children")];
  let s = n.children.map(() => Symbol(""));
  return t.map((i, a) => {
    let o = i.node;
    if ($(o)) {
      if (o.prev && $(o.prev)) {
        let A = It(o.prev, o);
        if (A)
          return Je(o.prev) ? [S, S, ot(i, e, r)] : [A, ot(i, e, r)];
      }
      return ot(i, e, r);
    }
    let u = [], p = [], l = [], m = [], f = o.prev ? It(o.prev, o) : "", C = o.next ? It(o, o.next) : "";
    return f && (Je(o.prev) ? u.push(S, S) : f === S ? u.push(S) : $(o.prev) ? p.push(f) : p.push(pe("", v, { groupId: s[a - 1] }))), C && (Je(o) ? $(o.next) && m.push(S, S) : C === S ? $(o.next) && m.push(S) : l.push(C)), [...u, E([...p, E([ot(i, e, r), ...l], { id: s[a] })]), ...m];
  }, "children");
}
function Bs(t, e, r) {
  let { node: n } = t, s = [];
  Va(t) && s.push("} "), s.push("@", n.name), n.parameters && s.push(" (", E(r("parameters")), ")"), s.push(" {");
  let i = Ls(n);
  return n.children.length > 0 ? (n.firstChild.hasLeadingSpaces = true, n.lastChild.hasTrailingSpaces = true, s.push(k([S, Re(t, e, r)])), i && s.push(S, "}")) : i && s.push("}"), E(s, { shouldBreak: true });
}
function Ls(t) {
  var e, r;
  return !(((e = t.next) == null ? undefined : e.type) === "angularControlFlowBlock" && ((r = xs.get(t.name)) != null && r.has(t.next.name)));
}
function Va(t) {
  let { previous: e } = t;
  return (e == null ? undefined : e.type) === "angularControlFlowBlock" && !ge(e) && !Ls(e);
}
function Fs(t, e, r) {
  return [k([v, H([";", _], t.map(r, "children"))]), v];
}
function Ps(t, e, r) {
  let { node: n } = t;
  return [De(n, e), E([n.switchValue.trim(), ", ", n.clause, n.cases.length > 0 ? [",", k([_, H(_, t.map(r, "cases"))])] : "", v]), Se(n, e)];
}
function Ns(t, e, r) {
  let { node: n } = t;
  return [n.value, " {", E([k([v, t.map(({ node: s, isLast: i }) => {
    let a = [r()];
    return s.type === "text" && (s.hasLeadingSpaces && a.unshift(_), s.hasTrailingSpaces && !i && a.push(_)), a;
  }, "expression")]), v]), "}"];
}
function Is(t, e, r) {
  let { node: n } = t;
  if (wt(n, e))
    return [z(n, e), E(st(t, e, r)), B(Nt(n, e)), ...tt(n, e), G(n, e)];
  let s = n.children.length === 1 && (n.firstChild.type === "interpolation" || n.firstChild.type === "angularIcuExpression") && n.firstChild.isLeadingSpaceSensitive && !n.firstChild.hasLeadingSpaces && n.lastChild.isTrailingSpaceSensitive && !n.lastChild.hasTrailingSpaces, i = Symbol("element-attr-group-id"), a = (l) => E([E(st(t, e, r), { id: i }), l, tt(n, e)]), o = (l) => s ? Cn(l, { groupId: i }) : (W(n, e) || et(n, e)) && n.parent.type === "root" && e.parser === "vue" && !e.vueIndentScriptAndStyle ? l : k(l), u = () => s ? pe(v, "", { groupId: i }) : n.firstChild.hasLeadingSpaces && n.firstChild.isLeadingSpaceSensitive ? _ : n.firstChild.type === "text" && n.isWhitespaceSensitive && n.isIndentationSensitive ? dn(v) : v, p = () => (n.next ? Q(n.next) : Ee(n.parent)) ? n.lastChild.hasTrailingSpaces && n.lastChild.isTrailingSpaceSensitive ? " " : "" : s ? pe(v, "", { groupId: i }) : n.lastChild.hasTrailingSpaces && n.lastChild.isTrailingSpaceSensitive ? _ : (n.lastChild.type === "comment" || n.lastChild.type === "text" && n.isWhitespaceSensitive && n.isIndentationSensitive) && new RegExp(`\\n[\\t ]{${e.tabWidth * (t.ancestors.length - 1)}}$`, "u").test(n.lastChild.value) ? "" : v;
  return n.children.length === 0 ? a(n.hasDanglingSpaces && n.isDanglingSpaceSensitive ? _ : "") : a([Gn(n) ? ne : "", o([u(), Re(t, e, r)]), p()]);
}
function ut(t) {
  return t >= 9 && t <= 32 || t == 160;
}
function Rt(t) {
  return 48 <= t && t <= 57;
}
function lt(t) {
  return t >= 97 && t <= 122 || t >= 65 && t <= 90;
}
function Rs(t) {
  return t >= 97 && t <= 102 || t >= 65 && t <= 70 || Rt(t);
}
function $t(t) {
  return t === 10 || t === 13;
}
function Br(t) {
  return 48 <= t && t <= 55;
}
function Ot(t) {
  return t === 39 || t === 34 || t === 96;
}
var Ua = /-+([a-z0-9])/g;
function Os(t) {
  return t.replace(Ua, (...e) => e[1].toUpperCase());
}
var ie = class t {
  constructor(e, r, n, s) {
    this.file = e, this.offset = r, this.line = n, this.col = s;
  }
  toString() {
    return this.offset != null ? `${this.file.url}@${this.line}:${this.col}` : this.file.url;
  }
  moveBy(e) {
    let r = this.file.content, n = r.length, s = this.offset, i = this.line, a = this.col;
    for (;s > 0 && e < 0; )
      if (s--, e++, r.charCodeAt(s) == 10) {
        i--;
        let u = r.substring(0, s - 1).lastIndexOf(String.fromCharCode(10));
        a = u > 0 ? s - u : s;
      } else
        a--;
    for (;s < n && e > 0; ) {
      let o = r.charCodeAt(s);
      s++, e--, o == 10 ? (i++, a = 0) : a++;
    }
    return new t(this.file, s, i, a);
  }
  getContext(e, r) {
    let n = this.file.content, s = this.offset;
    if (s != null) {
      s > n.length - 1 && (s = n.length - 1);
      let i = s, a = 0, o = 0;
      for (;a < e && s > 0 && (s--, a++, !(n[s] == `
` && ++o == r)); )
        ;
      for (a = 0, o = 0;a < e && i < n.length - 1 && (i++, a++, !(n[i] == `
` && ++o == r)); )
        ;
      return { before: n.substring(s, this.offset), after: n.substring(this.offset, i + 1) };
    }
    return null;
  }
};
var ve = class {
  constructor(e, r) {
    this.content = e, this.url = r;
  }
};
var h = class {
  constructor(e, r, n = e, s = null) {
    this.start = e, this.end = r, this.fullStart = n, this.details = s;
  }
  toString() {
    return this.start.file.content.substring(this.start.offset, this.end.offset);
  }
};
var Mt;
(function(t2) {
  t2[t2.WARNING = 0] = "WARNING", t2[t2.ERROR = 1] = "ERROR";
})(Mt || (Mt = {}));
var Oe = class {
  constructor(e, r, n = Mt.ERROR, s) {
    this.span = e, this.msg = r, this.level = n, this.relatedError = s;
  }
  contextualMessage() {
    let e = this.span.start.getContext(100, 3);
    return e ? `${this.msg} ("${e.before}[${Mt[this.level]} ->]${e.after}")` : this.msg;
  }
  toString() {
    let e = this.span.details ? `, ${this.span.details}` : "";
    return `${this.contextualMessage()}: ${this.span.start}${e}`;
  }
};
var Wa = [za, Ya, Ka, Qa, Ja, to, Za, eo, ro, Xa];
function Ga(t2, e) {
  for (let r of Wa)
    r(t2, e);
  return t2;
}
function za(t2) {
  t2.walk((e) => {
    if (e.type === "element" && e.tagDefinition.ignoreFirstLf && e.children.length > 0 && e.children[0].type === "text" && e.children[0].value[0] === `
`) {
      let r = e.children[0];
      r.value.length === 1 ? e.removeChild(r) : r.value = r.value.slice(1);
    }
  });
}
function Ya(t2) {
  let e = (r) => {
    var n, s;
    return r.type === "element" && ((n = r.prev) == null ? undefined : n.type) === "ieConditionalStartComment" && r.prev.sourceSpan.end.offset === r.startSourceSpan.start.offset && ((s = r.firstChild) == null ? undefined : s.type) === "ieConditionalEndComment" && r.firstChild.sourceSpan.start.offset === r.startSourceSpan.end.offset;
  };
  t2.walk((r) => {
    if (r.children)
      for (let n = 0;n < r.children.length; n++) {
        let s = r.children[n];
        if (!e(s))
          continue;
        let { prev: i, firstChild: a } = s;
        r.removeChild(i), n--;
        let o = new h(i.sourceSpan.start, a.sourceSpan.end), u = new h(o.start, s.sourceSpan.end);
        s.condition = i.condition, s.sourceSpan = u, s.startSourceSpan = o, s.removeChild(a);
      }
  });
}
function ja(t2, e, r) {
  t2.walk((n) => {
    if (n.children)
      for (let s = 0;s < n.children.length; s++) {
        let i = n.children[s];
        if (i.type !== "text" && !e(i))
          continue;
        i.type !== "text" && (i.type = "text", i.value = r(i));
        let a = i.prev;
        !a || a.type !== "text" || (a.value += i.value, a.sourceSpan = new h(a.sourceSpan.start, i.sourceSpan.end), n.removeChild(i), s--);
      }
  });
}
function Ka(t2) {
  return ja(t2, (e) => e.type === "cdata", (e) => `<![CDATA[${e.value}]]>`);
}
function Xa(t2) {
  let e = (r) => {
    var n, s;
    return r.type === "element" && r.attrs.length === 0 && r.children.length === 1 && r.firstChild.type === "text" && !O.hasWhitespaceCharacter(r.children[0].value) && !r.firstChild.hasLeadingSpaces && !r.firstChild.hasTrailingSpaces && r.isLeadingSpaceSensitive && !r.hasLeadingSpaces && r.isTrailingSpaceSensitive && !r.hasTrailingSpaces && ((n = r.prev) == null ? undefined : n.type) === "text" && ((s = r.next) == null ? undefined : s.type) === "text";
  };
  t2.walk((r) => {
    if (r.children)
      for (let n = 0;n < r.children.length; n++) {
        let s = r.children[n];
        if (!e(s))
          continue;
        let { prev: i, next: a } = s;
        i.value += `<${s.rawName}>` + s.firstChild.value + `</${s.rawName}>` + a.value, i.sourceSpan = new h(i.sourceSpan.start, a.sourceSpan.end), i.isTrailingSpaceSensitive = a.isTrailingSpaceSensitive, i.hasTrailingSpaces = a.hasTrailingSpaces, r.removeChild(s), n--, r.removeChild(a);
      }
  });
}
function Qa(t2, e) {
  if (e.parser === "html")
    return;
  let r = /\{\{(.+?)\}\}/su;
  t2.walk((n) => {
    if (qn(n, e))
      for (let s of n.children) {
        if (s.type !== "text")
          continue;
        let i = s.sourceSpan.start, a = null, o = s.value.split(r);
        for (let u = 0;u < o.length; u++, i = a) {
          let p = o[u];
          if (u % 2 === 0) {
            a = i.moveBy(p.length), p.length > 0 && n.insertChildBefore(s, { type: "text", value: p, sourceSpan: new h(i, a) });
            continue;
          }
          a = i.moveBy(p.length + 4), n.insertChildBefore(s, { type: "interpolation", sourceSpan: new h(i, a), children: p.length === 0 ? [] : [{ type: "text", value: p, sourceSpan: new h(i.moveBy(2), a.moveBy(-2)) }] });
        }
        n.removeChild(s);
      }
  });
}
function Ja(t2, e) {
  t2.walk((r) => {
    let n = r.$children;
    if (!n)
      return;
    if (n.length === 0 || n.length === 1 && n[0].type === "text" && O.trim(n[0].value).length === 0) {
      r.hasDanglingSpaces = n.length > 0, r.$children = [];
      return;
    }
    let s = Hn(r, e), i = Ar(r);
    if (!s)
      for (let a = 0;a < n.length; a++) {
        let o = n[a];
        if (o.type !== "text")
          continue;
        let { leadingWhitespace: u, text: p, trailingWhitespace: l } = Mn(o.value), m = o.prev, f = o.next;
        p ? (o.value = p, o.sourceSpan = new h(o.sourceSpan.start.moveBy(u.length), o.sourceSpan.end.moveBy(-l.length)), u && (m && (m.hasTrailingSpaces = true), o.hasLeadingSpaces = true), l && (o.hasTrailingSpaces = true, f && (f.hasLeadingSpaces = true))) : (r.removeChild(o), a--, (u || l) && (m && (m.hasTrailingSpaces = true), f && (f.hasLeadingSpaces = true)));
      }
    r.isWhitespaceSensitive = s, r.isIndentationSensitive = i;
  });
}
function Za(t2) {
  t2.walk((e) => {
    e.isSelfClosing = !e.children || e.type === "element" && (e.tagDefinition.isVoid || e.endSourceSpan && e.startSourceSpan.start === e.endSourceSpan.start && e.startSourceSpan.end === e.endSourceSpan.end);
  });
}
function eo(t2, e) {
  t2.walk((r) => {
    r.type === "element" && (r.hasHtmComponentClosingTag = r.endSourceSpan && /^<\s*\/\s*\/\s*>$/u.test(e.originalText.slice(r.endSourceSpan.start.offset, r.endSourceSpan.end.offset)));
  });
}
function to(t2, e) {
  t2.walk((r) => {
    r.cssDisplay = Qn(r, e);
  });
}
function ro(t2, e) {
  t2.walk((r) => {
    let { children: n } = r;
    if (n) {
      if (n.length === 0) {
        r.isDanglingSpaceSensitive = Wn(r, e);
        return;
      }
      for (let s of n)
        s.isLeadingSpaceSensitive = Vn(s, e), s.isTrailingSpaceSensitive = Un(s, e);
      for (let s = 0;s < n.length; s++) {
        let i = n[s];
        i.isLeadingSpaceSensitive = (s === 0 || i.prev.isTrailingSpaceSensitive) && i.isLeadingSpaceSensitive, i.isTrailingSpaceSensitive = (s === n.length - 1 || i.next.isLeadingSpaceSensitive) && i.isTrailingSpaceSensitive;
      }
    }
  });
}
var Ms = Ga;
function no(t2, e, r) {
  let { node: n } = t2;
  switch (n.type) {
    case "front-matter":
      return B(n.raw);
    case "root":
      return e.__onHtmlRoot && e.__onHtmlRoot(n), [E(Re(t2, e, r)), S];
    case "element":
    case "ieConditionalComment":
      return Is(t2, e, r);
    case "angularControlFlowBlock":
      return Bs(t2, e, r);
    case "angularControlFlowBlockParameters":
      return Fs(t2, e, r);
    case "angularControlFlowBlockParameter":
      return O.trim(n.expression);
    case "angularLetDeclaration":
      return E(["@let ", E([n.id, " =", E(k([_, r("init")]))]), ";"]);
    case "angularLetDeclarationInitializer":
      return n.value;
    case "angularIcuExpression":
      return Ps(t2, e, r);
    case "angularIcuCase":
      return Ns(t2, e, r);
    case "ieConditionalStartComment":
    case "ieConditionalEndComment":
      return [De(n), Se(n)];
    case "interpolation":
      return [De(n, e), ...t2.map(r, "children"), Se(n, e)];
    case "text": {
      if (n.parent.type === "interpolation") {
        let o = /\n[^\S\n]*$/u, u = o.test(n.value), p = u ? n.value.replace(o, "") : n.value;
        return [B(p), u ? S : ""];
      }
      let s = z(n, e), i = kt(n), a = G(n, e);
      return i[0] = [s, i[0]], i.push([i.pop(), a]), vt(i);
    }
    case "docType":
      return [E([De(n, e), " ", w(false, n.value.replace(/^html\b/iu, "html"), /\s+/gu, " ")]), Se(n, e)];
    case "comment":
      return [z(n, e), B(e.originalText.slice(J(n), se(n))), G(n, e)];
    case "attribute": {
      if (n.value === null)
        return n.rawName;
      let s = wr(n.value), i = _n(s, '"');
      return [n.rawName, "=", i, B(i === '"' ? w(false, s, '"', "&quot;") : w(false, s, "'", "&apos;")), i];
    }
    case "cdata":
    default:
      throw new An(n, "HTML");
  }
}
var so = { preprocess: Ms, print: no, insertPragma: Ts, massageAstNode: vn, embed: Ss, getVisitorKeys: As };
var qs = so;
var Hs = [{ name: "Angular", type: "markup", extensions: [".component.html"], tmScope: "text.html.basic", aceMode: "html", aliases: ["xhtml"], codemirrorMode: "htmlmixed", codemirrorMimeType: "text/html", parsers: ["angular"], vscodeLanguageIds: ["html"], filenames: [], linguistLanguageId: 146 }, { name: "HTML", type: "markup", extensions: [".html", ".hta", ".htm", ".html.hl", ".inc", ".xht", ".xhtml"], tmScope: "text.html.basic", aceMode: "html", aliases: ["xhtml"], codemirrorMode: "htmlmixed", codemirrorMimeType: "text/html", parsers: ["html"], vscodeLanguageIds: ["html"], linguistLanguageId: 146 }, { name: "Lightning Web Components", type: "markup", extensions: [], tmScope: "text.html.basic", aceMode: "html", aliases: ["xhtml"], codemirrorMode: "htmlmixed", codemirrorMimeType: "text/html", parsers: ["lwc"], vscodeLanguageIds: ["html"], filenames: [], linguistLanguageId: 146 }, { name: "MJML", type: "markup", extensions: [".mjml"], tmScope: "text.mjml.basic", aceMode: "html", aliases: ["MJML", "mjml"], codemirrorMode: "htmlmixed", codemirrorMimeType: "text/html", parsers: ["mjml"], filenames: [], vscodeLanguageIds: ["mjml"], linguistLanguageId: 146 }, { name: "Vue", type: "markup", extensions: [".vue"], tmScope: "source.vue", aceMode: "html", parsers: ["vue"], vscodeLanguageIds: ["vue"], linguistLanguageId: 391 }];
var Lr = { bracketSpacing: { category: "Common", type: "boolean", default: true, description: "Print spaces between brackets.", oppositeDescription: "Do not print spaces between brackets." }, objectWrap: { category: "Common", type: "choice", default: "preserve", description: "How to wrap object literals.", choices: [{ value: "preserve", description: "Keep as multi-line, if there is a newline between the opening brace and first property." }, { value: "collapse", description: "Fit to a single line when possible." }] }, singleQuote: { category: "Common", type: "boolean", default: false, description: "Use single quotes instead of double quotes." }, proseWrap: { category: "Common", type: "choice", default: "preserve", description: "How to wrap prose.", choices: [{ value: "always", description: "Wrap prose if it exceeds the print width." }, { value: "never", description: "Do not wrap prose." }, { value: "preserve", description: "Wrap prose as-is." }] }, bracketSameLine: { category: "Common", type: "boolean", default: false, description: "Put > of opening tags on the last line instead of on a new line." }, singleAttributePerLine: { category: "Common", type: "boolean", default: false, description: "Enforce single attribute per line in HTML, Vue and JSX." } };
var Vs = "HTML";
var io = { bracketSameLine: Lr.bracketSameLine, htmlWhitespaceSensitivity: { category: Vs, type: "choice", default: "css", description: "How to handle whitespaces in HTML.", choices: [{ value: "css", description: "Respect the default value of CSS display property." }, { value: "strict", description: "Whitespaces are considered sensitive." }, { value: "ignore", description: "Whitespaces are considered insensitive." }] }, singleAttributePerLine: Lr.singleAttributePerLine, vueIndentScriptAndStyle: { category: Vs, type: "boolean", default: false, description: "Indent script and style tags in Vue files." } };
var Us = io;
var tn = {};
ln(tn, { angular: () => iu, html: () => ru, lwc: () => ou, mjml: () => su, vue: () => au });
var ah = new RegExp(`(\\:not\\()|(([\\.\\#]?)[-\\w]+)|(?:\\[([-.\\w*\\\\$]+)(?:=(["']?)([^\\]"']*)\\5)?\\])|(\\))|(\\s*,\\s*)`, "g");
var Ws;
(function(t2) {
  t2[t2.Emulated = 0] = "Emulated", t2[t2.None = 2] = "None", t2[t2.ShadowDom = 3] = "ShadowDom";
})(Ws || (Ws = {}));
var Gs;
(function(t2) {
  t2[t2.OnPush = 0] = "OnPush", t2[t2.Default = 1] = "Default";
})(Gs || (Gs = {}));
var zs;
(function(t2) {
  t2[t2.None = 0] = "None", t2[t2.SignalBased = 1] = "SignalBased", t2[t2.HasDecoratorInputTransform = 2] = "HasDecoratorInputTransform";
})(zs || (zs = {}));
var Fr = { name: "custom-elements" };
var Pr = { name: "no-errors-schema" };
var Z;
(function(t2) {
  t2[t2.NONE = 0] = "NONE", t2[t2.HTML = 1] = "HTML", t2[t2.STYLE = 2] = "STYLE", t2[t2.SCRIPT = 3] = "SCRIPT", t2[t2.URL = 4] = "URL", t2[t2.RESOURCE_URL = 5] = "RESOURCE_URL";
})(Z || (Z = {}));
var Ys;
(function(t2) {
  t2[t2.Error = 0] = "Error", t2[t2.Warning = 1] = "Warning", t2[t2.Ignore = 2] = "Ignore";
})(Ys || (Ys = {}));
var N;
(function(t2) {
  t2[t2.RAW_TEXT = 0] = "RAW_TEXT", t2[t2.ESCAPABLE_RAW_TEXT = 1] = "ESCAPABLE_RAW_TEXT", t2[t2.PARSABLE_DATA = 2] = "PARSABLE_DATA";
})(N || (N = {}));
function ct(t2, e = true) {
  if (t2[0] != ":")
    return [null, t2];
  let r = t2.indexOf(":", 1);
  if (r === -1) {
    if (e)
      throw new Error(`Unsupported format "${t2}" expecting ":namespace:name"`);
    return [null, t2];
  }
  return [t2.slice(1, r), t2.slice(r + 1)];
}
function Nr(t2) {
  return ct(t2)[1] === "ng-container";
}
function Ir(t2) {
  return ct(t2)[1] === "ng-content";
}
function Me(t2) {
  return t2 === null ? null : ct(t2)[0];
}
function qe(t2, e) {
  return t2 ? `:${t2}:${e}` : e;
}
var Ht;
function Rr() {
  return Ht || (Ht = {}, qt(Z.HTML, ["iframe|srcdoc", "*|innerHTML", "*|outerHTML"]), qt(Z.STYLE, ["*|style"]), qt(Z.URL, ["*|formAction", "area|href", "area|ping", "audio|src", "a|href", "a|ping", "blockquote|cite", "body|background", "del|cite", "form|action", "img|src", "input|src", "ins|cite", "q|cite", "source|src", "track|src", "video|poster", "video|src"]), qt(Z.RESOURCE_URL, ["applet|code", "applet|codebase", "base|href", "embed|src", "frame|src", "head|profile", "html|manifest", "iframe|src", "link|href", "media|src", "object|codebase", "object|data", "script|src"])), Ht;
}
function qt(t2, e) {
  for (let r of e)
    Ht[r.toLowerCase()] = t2;
}
var Vt = class {
};
var ao = "boolean";
var oo = "number";
var uo = "string";
var lo = "object";
var co = ["[Element]|textContent,%ariaAtomic,%ariaAutoComplete,%ariaBusy,%ariaChecked,%ariaColCount,%ariaColIndex,%ariaColSpan,%ariaCurrent,%ariaDescription,%ariaDisabled,%ariaExpanded,%ariaHasPopup,%ariaHidden,%ariaKeyShortcuts,%ariaLabel,%ariaLevel,%ariaLive,%ariaModal,%ariaMultiLine,%ariaMultiSelectable,%ariaOrientation,%ariaPlaceholder,%ariaPosInSet,%ariaPressed,%ariaReadOnly,%ariaRelevant,%ariaRequired,%ariaRoleDescription,%ariaRowCount,%ariaRowIndex,%ariaRowSpan,%ariaSelected,%ariaSetSize,%ariaSort,%ariaValueMax,%ariaValueMin,%ariaValueNow,%ariaValueText,%classList,className,elementTiming,id,innerHTML,*beforecopy,*beforecut,*beforepaste,*fullscreenchange,*fullscreenerror,*search,*webkitfullscreenchange,*webkitfullscreenerror,outerHTML,%part,#scrollLeft,#scrollTop,slot,*message,*mozfullscreenchange,*mozfullscreenerror,*mozpointerlockchange,*mozpointerlockerror,*webglcontextcreationerror,*webglcontextlost,*webglcontextrestored", "[HTMLElement]^[Element]|accessKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,enterKeyHint,!hidden,!inert,innerText,inputMode,lang,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate,virtualKeyboardPolicy", "abbr,address,article,aside,b,bdi,bdo,cite,content,code,dd,dfn,dt,em,figcaption,figure,footer,header,hgroup,i,kbd,main,mark,nav,noscript,rb,rp,rt,rtc,ruby,s,samp,section,small,strong,sub,sup,u,var,wbr^[HTMLElement]|accessKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,enterKeyHint,!hidden,innerText,inputMode,lang,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate,virtualKeyboardPolicy", "media^[HTMLElement]|!autoplay,!controls,%controlsList,%crossOrigin,#currentTime,!defaultMuted,#defaultPlaybackRate,!disableRemotePlayback,!loop,!muted,*encrypted,*waitingforkey,#playbackRate,preload,!preservesPitch,src,%srcObject,#volume", ":svg:^[HTMLElement]|!autofocus,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,%style,#tabIndex", ":svg:graphics^:svg:|", ":svg:animation^:svg:|*begin,*end,*repeat", ":svg:geometry^:svg:|", ":svg:componentTransferFunction^:svg:|", ":svg:gradient^:svg:|", ":svg:textContent^:svg:graphics|", ":svg:textPositioning^:svg:textContent|", "a^[HTMLElement]|charset,coords,download,hash,host,hostname,href,hreflang,name,password,pathname,ping,port,protocol,referrerPolicy,rel,%relList,rev,search,shape,target,text,type,username", "area^[HTMLElement]|alt,coords,download,hash,host,hostname,href,!noHref,password,pathname,ping,port,protocol,referrerPolicy,rel,%relList,search,shape,target,username", "audio^media|", "br^[HTMLElement]|clear", "base^[HTMLElement]|href,target", "body^[HTMLElement]|aLink,background,bgColor,link,*afterprint,*beforeprint,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,text,vLink", "button^[HTMLElement]|!disabled,formAction,formEnctype,formMethod,!formNoValidate,formTarget,name,type,value", "canvas^[HTMLElement]|#height,#width", "content^[HTMLElement]|select", "dl^[HTMLElement]|!compact", "data^[HTMLElement]|value", "datalist^[HTMLElement]|", "details^[HTMLElement]|!open", "dialog^[HTMLElement]|!open,returnValue", "dir^[HTMLElement]|!compact", "div^[HTMLElement]|align", "embed^[HTMLElement]|align,height,name,src,type,width", "fieldset^[HTMLElement]|!disabled,name", "font^[HTMLElement]|color,face,size", "form^[HTMLElement]|acceptCharset,action,autocomplete,encoding,enctype,method,name,!noValidate,target", "frame^[HTMLElement]|frameBorder,longDesc,marginHeight,marginWidth,name,!noResize,scrolling,src", "frameset^[HTMLElement]|cols,*afterprint,*beforeprint,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,rows", "hr^[HTMLElement]|align,color,!noShade,size,width", "head^[HTMLElement]|", "h1,h2,h3,h4,h5,h6^[HTMLElement]|align", "html^[HTMLElement]|version", "iframe^[HTMLElement]|align,allow,!allowFullscreen,!allowPaymentRequest,csp,frameBorder,height,loading,longDesc,marginHeight,marginWidth,name,referrerPolicy,%sandbox,scrolling,src,srcdoc,width", "img^[HTMLElement]|align,alt,border,%crossOrigin,decoding,#height,#hspace,!isMap,loading,longDesc,lowsrc,name,referrerPolicy,sizes,src,srcset,useMap,#vspace,#width", "input^[HTMLElement]|accept,align,alt,autocomplete,!checked,!defaultChecked,defaultValue,dirName,!disabled,%files,formAction,formEnctype,formMethod,!formNoValidate,formTarget,#height,!incremental,!indeterminate,max,#maxLength,min,#minLength,!multiple,name,pattern,placeholder,!readOnly,!required,selectionDirection,#selectionEnd,#selectionStart,#size,src,step,type,useMap,value,%valueAsDate,#valueAsNumber,#width", "li^[HTMLElement]|type,#value", "label^[HTMLElement]|htmlFor", "legend^[HTMLElement]|align", "link^[HTMLElement]|as,charset,%crossOrigin,!disabled,href,hreflang,imageSizes,imageSrcset,integrity,media,referrerPolicy,rel,%relList,rev,%sizes,target,type", "map^[HTMLElement]|name", "marquee^[HTMLElement]|behavior,bgColor,direction,height,#hspace,#loop,#scrollAmount,#scrollDelay,!trueSpeed,#vspace,width", "menu^[HTMLElement]|!compact", "meta^[HTMLElement]|content,httpEquiv,media,name,scheme", "meter^[HTMLElement]|#high,#low,#max,#min,#optimum,#value", "ins,del^[HTMLElement]|cite,dateTime", "ol^[HTMLElement]|!compact,!reversed,#start,type", "object^[HTMLElement]|align,archive,border,code,codeBase,codeType,data,!declare,height,#hspace,name,standby,type,useMap,#vspace,width", "optgroup^[HTMLElement]|!disabled,label", "option^[HTMLElement]|!defaultSelected,!disabled,label,!selected,text,value", "output^[HTMLElement]|defaultValue,%htmlFor,name,value", "p^[HTMLElement]|align", "param^[HTMLElement]|name,type,value,valueType", "picture^[HTMLElement]|", "pre^[HTMLElement]|#width", "progress^[HTMLElement]|#max,#value", "q,blockquote,cite^[HTMLElement]|", "script^[HTMLElement]|!async,charset,%crossOrigin,!defer,event,htmlFor,integrity,!noModule,%referrerPolicy,src,text,type", "select^[HTMLElement]|autocomplete,!disabled,#length,!multiple,name,!required,#selectedIndex,#size,value", "slot^[HTMLElement]|name", "source^[HTMLElement]|#height,media,sizes,src,srcset,type,#width", "span^[HTMLElement]|", "style^[HTMLElement]|!disabled,media,type", "caption^[HTMLElement]|align", "th,td^[HTMLElement]|abbr,align,axis,bgColor,ch,chOff,#colSpan,headers,height,!noWrap,#rowSpan,scope,vAlign,width", "col,colgroup^[HTMLElement]|align,ch,chOff,#span,vAlign,width", "table^[HTMLElement]|align,bgColor,border,%caption,cellPadding,cellSpacing,frame,rules,summary,%tFoot,%tHead,width", "tr^[HTMLElement]|align,bgColor,ch,chOff,vAlign", "tfoot,thead,tbody^[HTMLElement]|align,ch,chOff,vAlign", "template^[HTMLElement]|", "textarea^[HTMLElement]|autocomplete,#cols,defaultValue,dirName,!disabled,#maxLength,#minLength,name,placeholder,!readOnly,!required,#rows,selectionDirection,#selectionEnd,#selectionStart,value,wrap", "time^[HTMLElement]|dateTime", "title^[HTMLElement]|text", "track^[HTMLElement]|!default,kind,label,src,srclang", "ul^[HTMLElement]|!compact,type", "unknown^[HTMLElement]|", "video^media|!disablePictureInPicture,#height,*enterpictureinpicture,*leavepictureinpicture,!playsInline,poster,#width", ":svg:a^:svg:graphics|", ":svg:animate^:svg:animation|", ":svg:animateMotion^:svg:animation|", ":svg:animateTransform^:svg:animation|", ":svg:circle^:svg:geometry|", ":svg:clipPath^:svg:graphics|", ":svg:defs^:svg:graphics|", ":svg:desc^:svg:|", ":svg:discard^:svg:|", ":svg:ellipse^:svg:geometry|", ":svg:feBlend^:svg:|", ":svg:feColorMatrix^:svg:|", ":svg:feComponentTransfer^:svg:|", ":svg:feComposite^:svg:|", ":svg:feConvolveMatrix^:svg:|", ":svg:feDiffuseLighting^:svg:|", ":svg:feDisplacementMap^:svg:|", ":svg:feDistantLight^:svg:|", ":svg:feDropShadow^:svg:|", ":svg:feFlood^:svg:|", ":svg:feFuncA^:svg:componentTransferFunction|", ":svg:feFuncB^:svg:componentTransferFunction|", ":svg:feFuncG^:svg:componentTransferFunction|", ":svg:feFuncR^:svg:componentTransferFunction|", ":svg:feGaussianBlur^:svg:|", ":svg:feImage^:svg:|", ":svg:feMerge^:svg:|", ":svg:feMergeNode^:svg:|", ":svg:feMorphology^:svg:|", ":svg:feOffset^:svg:|", ":svg:fePointLight^:svg:|", ":svg:feSpecularLighting^:svg:|", ":svg:feSpotLight^:svg:|", ":svg:feTile^:svg:|", ":svg:feTurbulence^:svg:|", ":svg:filter^:svg:|", ":svg:foreignObject^:svg:graphics|", ":svg:g^:svg:graphics|", ":svg:image^:svg:graphics|decoding", ":svg:line^:svg:geometry|", ":svg:linearGradient^:svg:gradient|", ":svg:mpath^:svg:|", ":svg:marker^:svg:|", ":svg:mask^:svg:|", ":svg:metadata^:svg:|", ":svg:path^:svg:geometry|", ":svg:pattern^:svg:|", ":svg:polygon^:svg:geometry|", ":svg:polyline^:svg:geometry|", ":svg:radialGradient^:svg:gradient|", ":svg:rect^:svg:geometry|", ":svg:svg^:svg:graphics|#currentScale,#zoomAndPan", ":svg:script^:svg:|type", ":svg:set^:svg:animation|", ":svg:stop^:svg:|", ":svg:style^:svg:|!disabled,media,title,type", ":svg:switch^:svg:graphics|", ":svg:symbol^:svg:|", ":svg:tspan^:svg:textPositioning|", ":svg:text^:svg:textPositioning|", ":svg:textPath^:svg:textContent|", ":svg:title^:svg:|", ":svg:use^:svg:graphics|", ":svg:view^:svg:|#zoomAndPan", "data^[HTMLElement]|value", "keygen^[HTMLElement]|!autofocus,challenge,!disabled,form,keytype,name", "menuitem^[HTMLElement]|type,label,icon,!disabled,!checked,radiogroup,!default", "summary^[HTMLElement]|", "time^[HTMLElement]|dateTime", ":svg:cursor^:svg:|", ":math:^[HTMLElement]|!autofocus,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforeinput,*beforematch,*beforetoggle,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contentvisibilityautostatechange,*contextlost,*contextmenu,*contextrestored,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*scrollend,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,%style,#tabIndex", ":math:math^:math:|", ":math:maction^:math:|", ":math:menclose^:math:|", ":math:merror^:math:|", ":math:mfenced^:math:|", ":math:mfrac^:math:|", ":math:mi^:math:|", ":math:mmultiscripts^:math:|", ":math:mn^:math:|", ":math:mo^:math:|", ":math:mover^:math:|", ":math:mpadded^:math:|", ":math:mphantom^:math:|", ":math:mroot^:math:|", ":math:mrow^:math:|", ":math:ms^:math:|", ":math:mspace^:math:|", ":math:msqrt^:math:|", ":math:mstyle^:math:|", ":math:msub^:math:|", ":math:msubsup^:math:|", ":math:msup^:math:|", ":math:mtable^:math:|", ":math:mtd^:math:|", ":math:mtext^:math:|", ":math:mtr^:math:|", ":math:munder^:math:|", ":math:munderover^:math:|", ":math:semantics^:math:|"];
var js = new Map(Object.entries({ class: "className", for: "htmlFor", formaction: "formAction", innerHtml: "innerHTML", readonly: "readOnly", tabindex: "tabIndex" }));
var po = Array.from(js).reduce((t2, [e, r]) => (t2.set(e, r), t2), new Map);
var Ut = class extends Vt {
  constructor() {
    super(), this._schema = new Map, this._eventSchema = new Map, co.forEach((e) => {
      let r = new Map, n = new Set, [s, i] = e.split("|"), a = i.split(","), [o, u] = s.split("^");
      o.split(",").forEach((l) => {
        this._schema.set(l.toLowerCase(), r), this._eventSchema.set(l.toLowerCase(), n);
      });
      let p = u && this._schema.get(u.toLowerCase());
      if (p) {
        for (let [l, m] of p)
          r.set(l, m);
        for (let l of this._eventSchema.get(u.toLowerCase()))
          n.add(l);
      }
      a.forEach((l) => {
        if (l.length > 0)
          switch (l[0]) {
            case "*":
              n.add(l.substring(1));
              break;
            case "!":
              r.set(l.substring(1), ao);
              break;
            case "#":
              r.set(l.substring(1), oo);
              break;
            case "%":
              r.set(l.substring(1), lo);
              break;
            default:
              r.set(l, uo);
          }
      });
    });
  }
  hasProperty(e, r, n) {
    if (n.some((i) => i.name === Pr.name))
      return true;
    if (e.indexOf("-") > -1) {
      if (Nr(e) || Ir(e))
        return false;
      if (n.some((i) => i.name === Fr.name))
        return true;
    }
    return (this._schema.get(e.toLowerCase()) || this._schema.get("unknown")).has(r);
  }
  hasElement(e, r) {
    return r.some((n) => n.name === Pr.name) || e.indexOf("-") > -1 && (Nr(e) || Ir(e) || r.some((n) => n.name === Fr.name)) ? true : this._schema.has(e.toLowerCase());
  }
  securityContext(e, r, n) {
    n && (r = this.getMappedPropName(r)), e = e.toLowerCase(), r = r.toLowerCase();
    let s = Rr()[e + "|" + r];
    return s || (s = Rr()["*|" + r], s || Z.NONE);
  }
  getMappedPropName(e) {
    return js.get(e) ?? e;
  }
  getDefaultComponentElementName() {
    return "ng-component";
  }
  validateProperty(e) {
    return e.toLowerCase().startsWith("on") ? { error: true, msg: `Binding to event property '${e}' is disallowed for security reasons, please use (${e.slice(2)})=...
If '${e}' is a directive input, make sure the directive is imported by the current module.` } : { error: false };
  }
  validateAttribute(e) {
    return e.toLowerCase().startsWith("on") ? { error: true, msg: `Binding to event attribute '${e}' is disallowed for security reasons, please use (${e.slice(2)})=...` } : { error: false };
  }
  allKnownElementNames() {
    return Array.from(this._schema.keys());
  }
  allKnownAttributesOfElement(e) {
    let r = this._schema.get(e.toLowerCase()) || this._schema.get("unknown");
    return Array.from(r.keys()).map((n) => po.get(n) ?? n);
  }
  allKnownEventsOfElement(e) {
    return Array.from(this._eventSchema.get(e.toLowerCase()) ?? []);
  }
  normalizeAnimationStyleProperty(e) {
    return Os(e);
  }
  normalizeAnimationStyleValue(e, r, n) {
    let s = "", i = n.toString().trim(), a = null;
    if (ho(e) && n !== 0 && n !== "0")
      if (typeof n == "number")
        s = "px";
      else {
        let o = n.match(/^[+-]?[\d\.]+([a-z]*)$/);
        o && o[1].length == 0 && (a = `Please provide a CSS unit value for ${r}:${n}`);
      }
    return { error: a, value: i + s };
  }
};
function ho(t2) {
  switch (t2) {
    case "width":
    case "height":
    case "minWidth":
    case "minHeight":
    case "maxWidth":
    case "maxHeight":
    case "left":
    case "top":
    case "bottom":
    case "right":
    case "fontSize":
    case "outlineWidth":
    case "outlineOffset":
    case "paddingTop":
    case "paddingLeft":
    case "paddingBottom":
    case "paddingRight":
    case "marginTop":
    case "marginLeft":
    case "marginBottom":
    case "marginRight":
    case "borderRadius":
    case "borderWidth":
    case "borderTopWidth":
    case "borderLeftWidth":
    case "borderRightWidth":
    case "borderBottomWidth":
    case "textIndent":
      return true;
    default:
      return false;
  }
}
var d = class {
  constructor({ closedByChildren: e, implicitNamespacePrefix: r, contentType: n = N.PARSABLE_DATA, closedByParent: s = false, isVoid: i = false, ignoreFirstLf: a = false, preventNamespaceInheritance: o = false, canSelfClose: u = false } = {}) {
    this.closedByChildren = {}, this.closedByParent = false, e && e.length > 0 && e.forEach((p) => this.closedByChildren[p] = true), this.isVoid = i, this.closedByParent = s || i, this.implicitNamespacePrefix = r || null, this.contentType = n, this.ignoreFirstLf = a, this.preventNamespaceInheritance = o, this.canSelfClose = u ?? i;
  }
  isClosedByChild(e) {
    return this.isVoid || e.toLowerCase() in this.closedByChildren;
  }
  getContentType(e) {
    return typeof this.contentType == "object" ? (e === undefined ? undefined : this.contentType[e]) ?? this.contentType.default : this.contentType;
  }
};
var Ks;
var pt;
function He(t2) {
  return pt || (Ks = new d({ canSelfClose: true }), pt = Object.assign(Object.create(null), { base: new d({ isVoid: true }), meta: new d({ isVoid: true }), area: new d({ isVoid: true }), embed: new d({ isVoid: true }), link: new d({ isVoid: true }), img: new d({ isVoid: true }), input: new d({ isVoid: true }), param: new d({ isVoid: true }), hr: new d({ isVoid: true }), br: new d({ isVoid: true }), source: new d({ isVoid: true }), track: new d({ isVoid: true }), wbr: new d({ isVoid: true }), p: new d({ closedByChildren: ["address", "article", "aside", "blockquote", "div", "dl", "fieldset", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul"], closedByParent: true }), thead: new d({ closedByChildren: ["tbody", "tfoot"] }), tbody: new d({ closedByChildren: ["tbody", "tfoot"], closedByParent: true }), tfoot: new d({ closedByChildren: ["tbody"], closedByParent: true }), tr: new d({ closedByChildren: ["tr"], closedByParent: true }), td: new d({ closedByChildren: ["td", "th"], closedByParent: true }), th: new d({ closedByChildren: ["td", "th"], closedByParent: true }), col: new d({ isVoid: true }), svg: new d({ implicitNamespacePrefix: "svg" }), foreignObject: new d({ implicitNamespacePrefix: "svg", preventNamespaceInheritance: true }), math: new d({ implicitNamespacePrefix: "math" }), li: new d({ closedByChildren: ["li"], closedByParent: true }), dt: new d({ closedByChildren: ["dt", "dd"] }), dd: new d({ closedByChildren: ["dt", "dd"], closedByParent: true }), rb: new d({ closedByChildren: ["rb", "rt", "rtc", "rp"], closedByParent: true }), rt: new d({ closedByChildren: ["rb", "rt", "rtc", "rp"], closedByParent: true }), rtc: new d({ closedByChildren: ["rb", "rtc", "rp"], closedByParent: true }), rp: new d({ closedByChildren: ["rb", "rt", "rtc", "rp"], closedByParent: true }), optgroup: new d({ closedByChildren: ["optgroup"], closedByParent: true }), option: new d({ closedByChildren: ["option", "optgroup"], closedByParent: true }), pre: new d({ ignoreFirstLf: true }), listing: new d({ ignoreFirstLf: true }), style: new d({ contentType: N.RAW_TEXT }), script: new d({ contentType: N.RAW_TEXT }), title: new d({ contentType: { default: N.ESCAPABLE_RAW_TEXT, svg: N.PARSABLE_DATA } }), textarea: new d({ contentType: N.ESCAPABLE_RAW_TEXT, ignoreFirstLf: true }) }), new Ut().allKnownElementNames().forEach((e) => {
    !pt[e] && Me(e) === null && (pt[e] = new d({ canSelfClose: false }));
  })), pt[t2] ?? Ks;
}
var ae = class {
  constructor(e, r) {
    this.sourceSpan = e, this.i18n = r;
  }
};
var Wt = class extends ae {
  constructor(e, r, n, s) {
    super(r, s), this.value = e, this.tokens = n, this.type = "text";
  }
  visit(e, r) {
    return e.visitText(this, r);
  }
};
var Gt = class extends ae {
  constructor(e, r, n, s) {
    super(r, s), this.value = e, this.tokens = n, this.type = "cdata";
  }
  visit(e, r) {
    return e.visitCdata(this, r);
  }
};
var zt = class extends ae {
  constructor(e, r, n, s, i, a) {
    super(s, a), this.switchValue = e, this.type = r, this.cases = n, this.switchValueSourceSpan = i;
  }
  visit(e, r) {
    return e.visitExpansion(this, r);
  }
};
var Yt = class {
  constructor(e, r, n, s, i) {
    this.value = e, this.expression = r, this.sourceSpan = n, this.valueSourceSpan = s, this.expSourceSpan = i, this.type = "expansionCase";
  }
  visit(e, r) {
    return e.visitExpansionCase(this, r);
  }
};
var jt = class extends ae {
  constructor(e, r, n, s, i, a, o) {
    super(n, o), this.name = e, this.value = r, this.keySpan = s, this.valueSpan = i, this.valueTokens = a, this.type = "attribute";
  }
  visit(e, r) {
    return e.visitAttribute(this, r);
  }
  get nameSpan() {
    return this.keySpan;
  }
};
var Y = class extends ae {
  constructor(e, r, n, s, i, a = null, o = null, u) {
    super(s, u), this.name = e, this.attrs = r, this.children = n, this.startSourceSpan = i, this.endSourceSpan = a, this.nameSpan = o, this.type = "element";
  }
  visit(e, r) {
    return e.visitElement(this, r);
  }
};
var Kt = class {
  constructor(e, r) {
    this.value = e, this.sourceSpan = r, this.type = "comment";
  }
  visit(e, r) {
    return e.visitComment(this, r);
  }
};
var Xt = class {
  constructor(e, r) {
    this.value = e, this.sourceSpan = r, this.type = "docType";
  }
  visit(e, r) {
    return e.visitDocType(this, r);
  }
};
var ee = class extends ae {
  constructor(e, r, n, s, i, a, o = null, u) {
    super(s, u), this.name = e, this.parameters = r, this.children = n, this.nameSpan = i, this.startSourceSpan = a, this.endSourceSpan = o, this.type = "block";
  }
  visit(e, r) {
    return e.visitBlock(this, r);
  }
};
var ht = class {
  constructor(e, r) {
    this.expression = e, this.sourceSpan = r, this.type = "blockParameter", this.startSourceSpan = null, this.endSourceSpan = null;
  }
  visit(e, r) {
    return e.visitBlockParameter(this, r);
  }
};
var mt = class {
  constructor(e, r, n, s, i) {
    this.name = e, this.value = r, this.sourceSpan = n, this.nameSpan = s, this.valueSpan = i, this.type = "letDeclaration", this.startSourceSpan = null, this.endSourceSpan = null;
  }
  visit(e, r) {
    return e.visitLetDeclaration(this, r);
  }
};
function Qt(t2, e, r = null) {
  let n = [], s = t2.visit ? (i) => t2.visit(i, r) || i.visit(t2, r) : (i) => i.visit(t2, r);
  return e.forEach((i) => {
    let a = s(i);
    a && n.push(a);
  }), n;
}
var ft = class {
  constructor() {}
  visitElement(e, r) {
    this.visitChildren(r, (n) => {
      n(e.attrs), n(e.children);
    });
  }
  visitAttribute(e, r) {}
  visitText(e, r) {}
  visitCdata(e, r) {}
  visitComment(e, r) {}
  visitDocType(e, r) {}
  visitExpansion(e, r) {
    return this.visitChildren(r, (n) => {
      n(e.cases);
    });
  }
  visitExpansionCase(e, r) {}
  visitBlock(e, r) {
    this.visitChildren(r, (n) => {
      n(e.parameters), n(e.children);
    });
  }
  visitBlockParameter(e, r) {}
  visitLetDeclaration(e, r) {}
  visitChildren(e, r) {
    let n = [], s = this;
    function i(a) {
      a && n.push(Qt(s, a, e));
    }
    return r(i), Array.prototype.concat.apply([], n);
  }
};
var Ve = { AElig: "Æ", AMP: "&", amp: "&", Aacute: "Á", Abreve: "Ă", Acirc: "Â", Acy: "А", Afr: "\uD835\uDD04", Agrave: "À", Alpha: "Α", Amacr: "Ā", And: "⩓", Aogon: "Ą", Aopf: "\uD835\uDD38", ApplyFunction: "⁡", af: "⁡", Aring: "Å", angst: "Å", Ascr: "\uD835\uDC9C", Assign: "≔", colone: "≔", coloneq: "≔", Atilde: "Ã", Auml: "Ä", Backslash: "∖", setminus: "∖", setmn: "∖", smallsetminus: "∖", ssetmn: "∖", Barv: "⫧", Barwed: "⌆", doublebarwedge: "⌆", Bcy: "Б", Because: "∵", becaus: "∵", because: "∵", Bernoullis: "ℬ", Bscr: "ℬ", bernou: "ℬ", Beta: "Β", Bfr: "\uD835\uDD05", Bopf: "\uD835\uDD39", Breve: "˘", breve: "˘", Bumpeq: "≎", HumpDownHump: "≎", bump: "≎", CHcy: "Ч", COPY: "©", copy: "©", Cacute: "Ć", Cap: "⋒", CapitalDifferentialD: "ⅅ", DD: "ⅅ", Cayleys: "ℭ", Cfr: "ℭ", Ccaron: "Č", Ccedil: "Ç", Ccirc: "Ĉ", Cconint: "∰", Cdot: "Ċ", Cedilla: "¸", cedil: "¸", CenterDot: "·", centerdot: "·", middot: "·", Chi: "Χ", CircleDot: "⊙", odot: "⊙", CircleMinus: "⊖", ominus: "⊖", CirclePlus: "⊕", oplus: "⊕", CircleTimes: "⊗", otimes: "⊗", ClockwiseContourIntegral: "∲", cwconint: "∲", CloseCurlyDoubleQuote: "”", rdquo: "”", rdquor: "”", CloseCurlyQuote: "’", rsquo: "’", rsquor: "’", Colon: "∷", Proportion: "∷", Colone: "⩴", Congruent: "≡", equiv: "≡", Conint: "∯", DoubleContourIntegral: "∯", ContourIntegral: "∮", conint: "∮", oint: "∮", Copf: "ℂ", complexes: "ℂ", Coproduct: "∐", coprod: "∐", CounterClockwiseContourIntegral: "∳", awconint: "∳", Cross: "⨯", Cscr: "\uD835\uDC9E", Cup: "⋓", CupCap: "≍", asympeq: "≍", DDotrahd: "⤑", DJcy: "Ђ", DScy: "Ѕ", DZcy: "Џ", Dagger: "‡", ddagger: "‡", Darr: "↡", Dashv: "⫤", DoubleLeftTee: "⫤", Dcaron: "Ď", Dcy: "Д", Del: "∇", nabla: "∇", Delta: "Δ", Dfr: "\uD835\uDD07", DiacriticalAcute: "´", acute: "´", DiacriticalDot: "˙", dot: "˙", DiacriticalDoubleAcute: "˝", dblac: "˝", DiacriticalGrave: "`", grave: "`", DiacriticalTilde: "˜", tilde: "˜", Diamond: "⋄", diam: "⋄", diamond: "⋄", DifferentialD: "ⅆ", dd: "ⅆ", Dopf: "\uD835\uDD3B", Dot: "¨", DoubleDot: "¨", die: "¨", uml: "¨", DotDot: "⃜", DotEqual: "≐", doteq: "≐", esdot: "≐", DoubleDownArrow: "⇓", Downarrow: "⇓", dArr: "⇓", DoubleLeftArrow: "⇐", Leftarrow: "⇐", lArr: "⇐", DoubleLeftRightArrow: "⇔", Leftrightarrow: "⇔", hArr: "⇔", iff: "⇔", DoubleLongLeftArrow: "⟸", Longleftarrow: "⟸", xlArr: "⟸", DoubleLongLeftRightArrow: "⟺", Longleftrightarrow: "⟺", xhArr: "⟺", DoubleLongRightArrow: "⟹", Longrightarrow: "⟹", xrArr: "⟹", DoubleRightArrow: "⇒", Implies: "⇒", Rightarrow: "⇒", rArr: "⇒", DoubleRightTee: "⊨", vDash: "⊨", DoubleUpArrow: "⇑", Uparrow: "⇑", uArr: "⇑", DoubleUpDownArrow: "⇕", Updownarrow: "⇕", vArr: "⇕", DoubleVerticalBar: "∥", par: "∥", parallel: "∥", shortparallel: "∥", spar: "∥", DownArrow: "↓", ShortDownArrow: "↓", darr: "↓", downarrow: "↓", DownArrowBar: "⤓", DownArrowUpArrow: "⇵", duarr: "⇵", DownBreve: "̑", DownLeftRightVector: "⥐", DownLeftTeeVector: "⥞", DownLeftVector: "↽", leftharpoondown: "↽", lhard: "↽", DownLeftVectorBar: "⥖", DownRightTeeVector: "⥟", DownRightVector: "⇁", rhard: "⇁", rightharpoondown: "⇁", DownRightVectorBar: "⥗", DownTee: "⊤", top: "⊤", DownTeeArrow: "↧", mapstodown: "↧", Dscr: "\uD835\uDC9F", Dstrok: "Đ", ENG: "Ŋ", ETH: "Ð", Eacute: "É", Ecaron: "Ě", Ecirc: "Ê", Ecy: "Э", Edot: "Ė", Efr: "\uD835\uDD08", Egrave: "È", Element: "∈", in: "∈", isin: "∈", isinv: "∈", Emacr: "Ē", EmptySmallSquare: "◻", EmptyVerySmallSquare: "▫", Eogon: "Ę", Eopf: "\uD835\uDD3C", Epsilon: "Ε", Equal: "⩵", EqualTilde: "≂", eqsim: "≂", esim: "≂", Equilibrium: "⇌", rightleftharpoons: "⇌", rlhar: "⇌", Escr: "ℰ", expectation: "ℰ", Esim: "⩳", Eta: "Η", Euml: "Ë", Exists: "∃", exist: "∃", ExponentialE: "ⅇ", ee: "ⅇ", exponentiale: "ⅇ", Fcy: "Ф", Ffr: "\uD835\uDD09", FilledSmallSquare: "◼", FilledVerySmallSquare: "▪", blacksquare: "▪", squarf: "▪", squf: "▪", Fopf: "\uD835\uDD3D", ForAll: "∀", forall: "∀", Fouriertrf: "ℱ", Fscr: "ℱ", GJcy: "Ѓ", GT: ">", gt: ">", Gamma: "Γ", Gammad: "Ϝ", Gbreve: "Ğ", Gcedil: "Ģ", Gcirc: "Ĝ", Gcy: "Г", Gdot: "Ġ", Gfr: "\uD835\uDD0A", Gg: "⋙", ggg: "⋙", Gopf: "\uD835\uDD3E", GreaterEqual: "≥", ge: "≥", geq: "≥", GreaterEqualLess: "⋛", gel: "⋛", gtreqless: "⋛", GreaterFullEqual: "≧", gE: "≧", geqq: "≧", GreaterGreater: "⪢", GreaterLess: "≷", gl: "≷", gtrless: "≷", GreaterSlantEqual: "⩾", geqslant: "⩾", ges: "⩾", GreaterTilde: "≳", gsim: "≳", gtrsim: "≳", Gscr: "\uD835\uDCA2", Gt: "≫", NestedGreaterGreater: "≫", gg: "≫", HARDcy: "Ъ", Hacek: "ˇ", caron: "ˇ", Hat: "^", Hcirc: "Ĥ", Hfr: "ℌ", Poincareplane: "ℌ", HilbertSpace: "ℋ", Hscr: "ℋ", hamilt: "ℋ", Hopf: "ℍ", quaternions: "ℍ", HorizontalLine: "─", boxh: "─", Hstrok: "Ħ", HumpEqual: "≏", bumpe: "≏", bumpeq: "≏", IEcy: "Е", IJlig: "Ĳ", IOcy: "Ё", Iacute: "Í", Icirc: "Î", Icy: "И", Idot: "İ", Ifr: "ℑ", Im: "ℑ", image: "ℑ", imagpart: "ℑ", Igrave: "Ì", Imacr: "Ī", ImaginaryI: "ⅈ", ii: "ⅈ", Int: "∬", Integral: "∫", int: "∫", Intersection: "⋂", bigcap: "⋂", xcap: "⋂", InvisibleComma: "⁣", ic: "⁣", InvisibleTimes: "⁢", it: "⁢", Iogon: "Į", Iopf: "\uD835\uDD40", Iota: "Ι", Iscr: "ℐ", imagline: "ℐ", Itilde: "Ĩ", Iukcy: "І", Iuml: "Ï", Jcirc: "Ĵ", Jcy: "Й", Jfr: "\uD835\uDD0D", Jopf: "\uD835\uDD41", Jscr: "\uD835\uDCA5", Jsercy: "Ј", Jukcy: "Є", KHcy: "Х", KJcy: "Ќ", Kappa: "Κ", Kcedil: "Ķ", Kcy: "К", Kfr: "\uD835\uDD0E", Kopf: "\uD835\uDD42", Kscr: "\uD835\uDCA6", LJcy: "Љ", LT: "<", lt: "<", Lacute: "Ĺ", Lambda: "Λ", Lang: "⟪", Laplacetrf: "ℒ", Lscr: "ℒ", lagran: "ℒ", Larr: "↞", twoheadleftarrow: "↞", Lcaron: "Ľ", Lcedil: "Ļ", Lcy: "Л", LeftAngleBracket: "⟨", lang: "⟨", langle: "⟨", LeftArrow: "←", ShortLeftArrow: "←", larr: "←", leftarrow: "←", slarr: "←", LeftArrowBar: "⇤", larrb: "⇤", LeftArrowRightArrow: "⇆", leftrightarrows: "⇆", lrarr: "⇆", LeftCeiling: "⌈", lceil: "⌈", LeftDoubleBracket: "⟦", lobrk: "⟦", LeftDownTeeVector: "⥡", LeftDownVector: "⇃", dharl: "⇃", downharpoonleft: "⇃", LeftDownVectorBar: "⥙", LeftFloor: "⌊", lfloor: "⌊", LeftRightArrow: "↔", harr: "↔", leftrightarrow: "↔", LeftRightVector: "⥎", LeftTee: "⊣", dashv: "⊣", LeftTeeArrow: "↤", mapstoleft: "↤", LeftTeeVector: "⥚", LeftTriangle: "⊲", vartriangleleft: "⊲", vltri: "⊲", LeftTriangleBar: "⧏", LeftTriangleEqual: "⊴", ltrie: "⊴", trianglelefteq: "⊴", LeftUpDownVector: "⥑", LeftUpTeeVector: "⥠", LeftUpVector: "↿", uharl: "↿", upharpoonleft: "↿", LeftUpVectorBar: "⥘", LeftVector: "↼", leftharpoonup: "↼", lharu: "↼", LeftVectorBar: "⥒", LessEqualGreater: "⋚", leg: "⋚", lesseqgtr: "⋚", LessFullEqual: "≦", lE: "≦", leqq: "≦", LessGreater: "≶", lessgtr: "≶", lg: "≶", LessLess: "⪡", LessSlantEqual: "⩽", leqslant: "⩽", les: "⩽", LessTilde: "≲", lesssim: "≲", lsim: "≲", Lfr: "\uD835\uDD0F", Ll: "⋘", Lleftarrow: "⇚", lAarr: "⇚", Lmidot: "Ŀ", LongLeftArrow: "⟵", longleftarrow: "⟵", xlarr: "⟵", LongLeftRightArrow: "⟷", longleftrightarrow: "⟷", xharr: "⟷", LongRightArrow: "⟶", longrightarrow: "⟶", xrarr: "⟶", Lopf: "\uD835\uDD43", LowerLeftArrow: "↙", swarr: "↙", swarrow: "↙", LowerRightArrow: "↘", searr: "↘", searrow: "↘", Lsh: "↰", lsh: "↰", Lstrok: "Ł", Lt: "≪", NestedLessLess: "≪", ll: "≪", Map: "⤅", Mcy: "М", MediumSpace: " ", Mellintrf: "ℳ", Mscr: "ℳ", phmmat: "ℳ", Mfr: "\uD835\uDD10", MinusPlus: "∓", mnplus: "∓", mp: "∓", Mopf: "\uD835\uDD44", Mu: "Μ", NJcy: "Њ", Nacute: "Ń", Ncaron: "Ň", Ncedil: "Ņ", Ncy: "Н", NegativeMediumSpace: "​", NegativeThickSpace: "​", NegativeThinSpace: "​", NegativeVeryThinSpace: "​", ZeroWidthSpace: "​", NewLine: `
`, Nfr: "\uD835\uDD11", NoBreak: "⁠", NonBreakingSpace: " ", nbsp: " ", Nopf: "ℕ", naturals: "ℕ", Not: "⫬", NotCongruent: "≢", nequiv: "≢", NotCupCap: "≭", NotDoubleVerticalBar: "∦", npar: "∦", nparallel: "∦", nshortparallel: "∦", nspar: "∦", NotElement: "∉", notin: "∉", notinva: "∉", NotEqual: "≠", ne: "≠", NotEqualTilde: "≂̸", nesim: "≂̸", NotExists: "∄", nexist: "∄", nexists: "∄", NotGreater: "≯", ngt: "≯", ngtr: "≯", NotGreaterEqual: "≱", nge: "≱", ngeq: "≱", NotGreaterFullEqual: "≧̸", ngE: "≧̸", ngeqq: "≧̸", NotGreaterGreater: "≫̸", nGtv: "≫̸", NotGreaterLess: "≹", ntgl: "≹", NotGreaterSlantEqual: "⩾̸", ngeqslant: "⩾̸", nges: "⩾̸", NotGreaterTilde: "≵", ngsim: "≵", NotHumpDownHump: "≎̸", nbump: "≎̸", NotHumpEqual: "≏̸", nbumpe: "≏̸", NotLeftTriangle: "⋪", nltri: "⋪", ntriangleleft: "⋪", NotLeftTriangleBar: "⧏̸", NotLeftTriangleEqual: "⋬", nltrie: "⋬", ntrianglelefteq: "⋬", NotLess: "≮", nless: "≮", nlt: "≮", NotLessEqual: "≰", nle: "≰", nleq: "≰", NotLessGreater: "≸", ntlg: "≸", NotLessLess: "≪̸", nLtv: "≪̸", NotLessSlantEqual: "⩽̸", nleqslant: "⩽̸", nles: "⩽̸", NotLessTilde: "≴", nlsim: "≴", NotNestedGreaterGreater: "⪢̸", NotNestedLessLess: "⪡̸", NotPrecedes: "⊀", npr: "⊀", nprec: "⊀", NotPrecedesEqual: "⪯̸", npre: "⪯̸", npreceq: "⪯̸", NotPrecedesSlantEqual: "⋠", nprcue: "⋠", NotReverseElement: "∌", notni: "∌", notniva: "∌", NotRightTriangle: "⋫", nrtri: "⋫", ntriangleright: "⋫", NotRightTriangleBar: "⧐̸", NotRightTriangleEqual: "⋭", nrtrie: "⋭", ntrianglerighteq: "⋭", NotSquareSubset: "⊏̸", NotSquareSubsetEqual: "⋢", nsqsube: "⋢", NotSquareSuperset: "⊐̸", NotSquareSupersetEqual: "⋣", nsqsupe: "⋣", NotSubset: "⊂⃒", nsubset: "⊂⃒", vnsub: "⊂⃒", NotSubsetEqual: "⊈", nsube: "⊈", nsubseteq: "⊈", NotSucceeds: "⊁", nsc: "⊁", nsucc: "⊁", NotSucceedsEqual: "⪰̸", nsce: "⪰̸", nsucceq: "⪰̸", NotSucceedsSlantEqual: "⋡", nsccue: "⋡", NotSucceedsTilde: "≿̸", NotSuperset: "⊃⃒", nsupset: "⊃⃒", vnsup: "⊃⃒", NotSupersetEqual: "⊉", nsupe: "⊉", nsupseteq: "⊉", NotTilde: "≁", nsim: "≁", NotTildeEqual: "≄", nsime: "≄", nsimeq: "≄", NotTildeFullEqual: "≇", ncong: "≇", NotTildeTilde: "≉", nap: "≉", napprox: "≉", NotVerticalBar: "∤", nmid: "∤", nshortmid: "∤", nsmid: "∤", Nscr: "\uD835\uDCA9", Ntilde: "Ñ", Nu: "Ν", OElig: "Œ", Oacute: "Ó", Ocirc: "Ô", Ocy: "О", Odblac: "Ő", Ofr: "\uD835\uDD12", Ograve: "Ò", Omacr: "Ō", Omega: "Ω", ohm: "Ω", Omicron: "Ο", Oopf: "\uD835\uDD46", OpenCurlyDoubleQuote: "“", ldquo: "“", OpenCurlyQuote: "‘", lsquo: "‘", Or: "⩔", Oscr: "\uD835\uDCAA", Oslash: "Ø", Otilde: "Õ", Otimes: "⨷", Ouml: "Ö", OverBar: "‾", oline: "‾", OverBrace: "⏞", OverBracket: "⎴", tbrk: "⎴", OverParenthesis: "⏜", PartialD: "∂", part: "∂", Pcy: "П", Pfr: "\uD835\uDD13", Phi: "Φ", Pi: "Π", PlusMinus: "±", plusmn: "±", pm: "±", Popf: "ℙ", primes: "ℙ", Pr: "⪻", Precedes: "≺", pr: "≺", prec: "≺", PrecedesEqual: "⪯", pre: "⪯", preceq: "⪯", PrecedesSlantEqual: "≼", prcue: "≼", preccurlyeq: "≼", PrecedesTilde: "≾", precsim: "≾", prsim: "≾", Prime: "″", Product: "∏", prod: "∏", Proportional: "∝", prop: "∝", propto: "∝", varpropto: "∝", vprop: "∝", Pscr: "\uD835\uDCAB", Psi: "Ψ", QUOT: '"', quot: '"', Qfr: "\uD835\uDD14", Qopf: "ℚ", rationals: "ℚ", Qscr: "\uD835\uDCAC", RBarr: "⤐", drbkarow: "⤐", REG: "®", circledR: "®", reg: "®", Racute: "Ŕ", Rang: "⟫", Rarr: "↠", twoheadrightarrow: "↠", Rarrtl: "⤖", Rcaron: "Ř", Rcedil: "Ŗ", Rcy: "Р", Re: "ℜ", Rfr: "ℜ", real: "ℜ", realpart: "ℜ", ReverseElement: "∋", SuchThat: "∋", ni: "∋", niv: "∋", ReverseEquilibrium: "⇋", leftrightharpoons: "⇋", lrhar: "⇋", ReverseUpEquilibrium: "⥯", duhar: "⥯", Rho: "Ρ", RightAngleBracket: "⟩", rang: "⟩", rangle: "⟩", RightArrow: "→", ShortRightArrow: "→", rarr: "→", rightarrow: "→", srarr: "→", RightArrowBar: "⇥", rarrb: "⇥", RightArrowLeftArrow: "⇄", rightleftarrows: "⇄", rlarr: "⇄", RightCeiling: "⌉", rceil: "⌉", RightDoubleBracket: "⟧", robrk: "⟧", RightDownTeeVector: "⥝", RightDownVector: "⇂", dharr: "⇂", downharpoonright: "⇂", RightDownVectorBar: "⥕", RightFloor: "⌋", rfloor: "⌋", RightTee: "⊢", vdash: "⊢", RightTeeArrow: "↦", map: "↦", mapsto: "↦", RightTeeVector: "⥛", RightTriangle: "⊳", vartriangleright: "⊳", vrtri: "⊳", RightTriangleBar: "⧐", RightTriangleEqual: "⊵", rtrie: "⊵", trianglerighteq: "⊵", RightUpDownVector: "⥏", RightUpTeeVector: "⥜", RightUpVector: "↾", uharr: "↾", upharpoonright: "↾", RightUpVectorBar: "⥔", RightVector: "⇀", rharu: "⇀", rightharpoonup: "⇀", RightVectorBar: "⥓", Ropf: "ℝ", reals: "ℝ", RoundImplies: "⥰", Rrightarrow: "⇛", rAarr: "⇛", Rscr: "ℛ", realine: "ℛ", Rsh: "↱", rsh: "↱", RuleDelayed: "⧴", SHCHcy: "Щ", SHcy: "Ш", SOFTcy: "Ь", Sacute: "Ś", Sc: "⪼", Scaron: "Š", Scedil: "Ş", Scirc: "Ŝ", Scy: "С", Sfr: "\uD835\uDD16", ShortUpArrow: "↑", UpArrow: "↑", uarr: "↑", uparrow: "↑", Sigma: "Σ", SmallCircle: "∘", compfn: "∘", Sopf: "\uD835\uDD4A", Sqrt: "√", radic: "√", Square: "□", squ: "□", square: "□", SquareIntersection: "⊓", sqcap: "⊓", SquareSubset: "⊏", sqsub: "⊏", sqsubset: "⊏", SquareSubsetEqual: "⊑", sqsube: "⊑", sqsubseteq: "⊑", SquareSuperset: "⊐", sqsup: "⊐", sqsupset: "⊐", SquareSupersetEqual: "⊒", sqsupe: "⊒", sqsupseteq: "⊒", SquareUnion: "⊔", sqcup: "⊔", Sscr: "\uD835\uDCAE", Star: "⋆", sstarf: "⋆", Sub: "⋐", Subset: "⋐", SubsetEqual: "⊆", sube: "⊆", subseteq: "⊆", Succeeds: "≻", sc: "≻", succ: "≻", SucceedsEqual: "⪰", sce: "⪰", succeq: "⪰", SucceedsSlantEqual: "≽", sccue: "≽", succcurlyeq: "≽", SucceedsTilde: "≿", scsim: "≿", succsim: "≿", Sum: "∑", sum: "∑", Sup: "⋑", Supset: "⋑", Superset: "⊃", sup: "⊃", supset: "⊃", SupersetEqual: "⊇", supe: "⊇", supseteq: "⊇", THORN: "Þ", TRADE: "™", trade: "™", TSHcy: "Ћ", TScy: "Ц", Tab: "\t", Tau: "Τ", Tcaron: "Ť", Tcedil: "Ţ", Tcy: "Т", Tfr: "\uD835\uDD17", Therefore: "∴", there4: "∴", therefore: "∴", Theta: "Θ", ThickSpace: "  ", ThinSpace: " ", thinsp: " ", Tilde: "∼", sim: "∼", thicksim: "∼", thksim: "∼", TildeEqual: "≃", sime: "≃", simeq: "≃", TildeFullEqual: "≅", cong: "≅", TildeTilde: "≈", ap: "≈", approx: "≈", asymp: "≈", thickapprox: "≈", thkap: "≈", Topf: "\uD835\uDD4B", TripleDot: "⃛", tdot: "⃛", Tscr: "\uD835\uDCAF", Tstrok: "Ŧ", Uacute: "Ú", Uarr: "↟", Uarrocir: "⥉", Ubrcy: "Ў", Ubreve: "Ŭ", Ucirc: "Û", Ucy: "У", Udblac: "Ű", Ufr: "\uD835\uDD18", Ugrave: "Ù", Umacr: "Ū", UnderBar: "_", lowbar: "_", UnderBrace: "⏟", UnderBracket: "⎵", bbrk: "⎵", UnderParenthesis: "⏝", Union: "⋃", bigcup: "⋃", xcup: "⋃", UnionPlus: "⊎", uplus: "⊎", Uogon: "Ų", Uopf: "\uD835\uDD4C", UpArrowBar: "⤒", UpArrowDownArrow: "⇅", udarr: "⇅", UpDownArrow: "↕", updownarrow: "↕", varr: "↕", UpEquilibrium: "⥮", udhar: "⥮", UpTee: "⊥", bot: "⊥", bottom: "⊥", perp: "⊥", UpTeeArrow: "↥", mapstoup: "↥", UpperLeftArrow: "↖", nwarr: "↖", nwarrow: "↖", UpperRightArrow: "↗", nearr: "↗", nearrow: "↗", Upsi: "ϒ", upsih: "ϒ", Upsilon: "Υ", Uring: "Ů", Uscr: "\uD835\uDCB0", Utilde: "Ũ", Uuml: "Ü", VDash: "⊫", Vbar: "⫫", Vcy: "В", Vdash: "⊩", Vdashl: "⫦", Vee: "⋁", bigvee: "⋁", xvee: "⋁", Verbar: "‖", Vert: "‖", VerticalBar: "∣", mid: "∣", shortmid: "∣", smid: "∣", VerticalLine: "|", verbar: "|", vert: "|", VerticalSeparator: "❘", VerticalTilde: "≀", wr: "≀", wreath: "≀", VeryThinSpace: " ", hairsp: " ", Vfr: "\uD835\uDD19", Vopf: "\uD835\uDD4D", Vscr: "\uD835\uDCB1", Vvdash: "⊪", Wcirc: "Ŵ", Wedge: "⋀", bigwedge: "⋀", xwedge: "⋀", Wfr: "\uD835\uDD1A", Wopf: "\uD835\uDD4E", Wscr: "\uD835\uDCB2", Xfr: "\uD835\uDD1B", Xi: "Ξ", Xopf: "\uD835\uDD4F", Xscr: "\uD835\uDCB3", YAcy: "Я", YIcy: "Ї", YUcy: "Ю", Yacute: "Ý", Ycirc: "Ŷ", Ycy: "Ы", Yfr: "\uD835\uDD1C", Yopf: "\uD835\uDD50", Yscr: "\uD835\uDCB4", Yuml: "Ÿ", ZHcy: "Ж", Zacute: "Ź", Zcaron: "Ž", Zcy: "З", Zdot: "Ż", Zeta: "Ζ", Zfr: "ℨ", zeetrf: "ℨ", Zopf: "ℤ", integers: "ℤ", Zscr: "\uD835\uDCB5", aacute: "á", abreve: "ă", ac: "∾", mstpos: "∾", acE: "∾̳", acd: "∿", acirc: "â", acy: "а", aelig: "æ", afr: "\uD835\uDD1E", agrave: "à", alefsym: "ℵ", aleph: "ℵ", alpha: "α", amacr: "ā", amalg: "⨿", and: "∧", wedge: "∧", andand: "⩕", andd: "⩜", andslope: "⩘", andv: "⩚", ang: "∠", angle: "∠", ange: "⦤", angmsd: "∡", measuredangle: "∡", angmsdaa: "⦨", angmsdab: "⦩", angmsdac: "⦪", angmsdad: "⦫", angmsdae: "⦬", angmsdaf: "⦭", angmsdag: "⦮", angmsdah: "⦯", angrt: "∟", angrtvb: "⊾", angrtvbd: "⦝", angsph: "∢", angzarr: "⍼", aogon: "ą", aopf: "\uD835\uDD52", apE: "⩰", apacir: "⩯", ape: "≊", approxeq: "≊", apid: "≋", apos: "'", aring: "å", ascr: "\uD835\uDCB6", ast: "*", midast: "*", atilde: "ã", auml: "ä", awint: "⨑", bNot: "⫭", backcong: "≌", bcong: "≌", backepsilon: "϶", bepsi: "϶", backprime: "‵", bprime: "‵", backsim: "∽", bsim: "∽", backsimeq: "⋍", bsime: "⋍", barvee: "⊽", barwed: "⌅", barwedge: "⌅", bbrktbrk: "⎶", bcy: "б", bdquo: "„", ldquor: "„", bemptyv: "⦰", beta: "β", beth: "ℶ", between: "≬", twixt: "≬", bfr: "\uD835\uDD1F", bigcirc: "◯", xcirc: "◯", bigodot: "⨀", xodot: "⨀", bigoplus: "⨁", xoplus: "⨁", bigotimes: "⨂", xotime: "⨂", bigsqcup: "⨆", xsqcup: "⨆", bigstar: "★", starf: "★", bigtriangledown: "▽", xdtri: "▽", bigtriangleup: "△", xutri: "△", biguplus: "⨄", xuplus: "⨄", bkarow: "⤍", rbarr: "⤍", blacklozenge: "⧫", lozf: "⧫", blacktriangle: "▴", utrif: "▴", blacktriangledown: "▾", dtrif: "▾", blacktriangleleft: "◂", ltrif: "◂", blacktriangleright: "▸", rtrif: "▸", blank: "␣", blk12: "▒", blk14: "░", blk34: "▓", block: "█", bne: "=⃥", bnequiv: "≡⃥", bnot: "⌐", bopf: "\uD835\uDD53", bowtie: "⋈", boxDL: "╗", boxDR: "╔", boxDl: "╖", boxDr: "╓", boxH: "═", boxHD: "╦", boxHU: "╩", boxHd: "╤", boxHu: "╧", boxUL: "╝", boxUR: "╚", boxUl: "╜", boxUr: "╙", boxV: "║", boxVH: "╬", boxVL: "╣", boxVR: "╠", boxVh: "╫", boxVl: "╢", boxVr: "╟", boxbox: "⧉", boxdL: "╕", boxdR: "╒", boxdl: "┐", boxdr: "┌", boxhD: "╥", boxhU: "╨", boxhd: "┬", boxhu: "┴", boxminus: "⊟", minusb: "⊟", boxplus: "⊞", plusb: "⊞", boxtimes: "⊠", timesb: "⊠", boxuL: "╛", boxuR: "╘", boxul: "┘", boxur: "└", boxv: "│", boxvH: "╪", boxvL: "╡", boxvR: "╞", boxvh: "┼", boxvl: "┤", boxvr: "├", brvbar: "¦", bscr: "\uD835\uDCB7", bsemi: "⁏", bsol: "\\", bsolb: "⧅", bsolhsub: "⟈", bull: "•", bullet: "•", bumpE: "⪮", cacute: "ć", cap: "∩", capand: "⩄", capbrcup: "⩉", capcap: "⩋", capcup: "⩇", capdot: "⩀", caps: "∩︀", caret: "⁁", ccaps: "⩍", ccaron: "č", ccedil: "ç", ccirc: "ĉ", ccups: "⩌", ccupssm: "⩐", cdot: "ċ", cemptyv: "⦲", cent: "¢", cfr: "\uD835\uDD20", chcy: "ч", check: "✓", checkmark: "✓", chi: "χ", cir: "○", cirE: "⧃", circ: "ˆ", circeq: "≗", cire: "≗", circlearrowleft: "↺", olarr: "↺", circlearrowright: "↻", orarr: "↻", circledS: "Ⓢ", oS: "Ⓢ", circledast: "⊛", oast: "⊛", circledcirc: "⊚", ocir: "⊚", circleddash: "⊝", odash: "⊝", cirfnint: "⨐", cirmid: "⫯", cirscir: "⧂", clubs: "♣", clubsuit: "♣", colon: ":", comma: ",", commat: "@", comp: "∁", complement: "∁", congdot: "⩭", copf: "\uD835\uDD54", copysr: "℗", crarr: "↵", cross: "✗", cscr: "\uD835\uDCB8", csub: "⫏", csube: "⫑", csup: "⫐", csupe: "⫒", ctdot: "⋯", cudarrl: "⤸", cudarrr: "⤵", cuepr: "⋞", curlyeqprec: "⋞", cuesc: "⋟", curlyeqsucc: "⋟", cularr: "↶", curvearrowleft: "↶", cularrp: "⤽", cup: "∪", cupbrcap: "⩈", cupcap: "⩆", cupcup: "⩊", cupdot: "⊍", cupor: "⩅", cups: "∪︀", curarr: "↷", curvearrowright: "↷", curarrm: "⤼", curlyvee: "⋎", cuvee: "⋎", curlywedge: "⋏", cuwed: "⋏", curren: "¤", cwint: "∱", cylcty: "⌭", dHar: "⥥", dagger: "†", daleth: "ℸ", dash: "‐", hyphen: "‐", dbkarow: "⤏", rBarr: "⤏", dcaron: "ď", dcy: "д", ddarr: "⇊", downdownarrows: "⇊", ddotseq: "⩷", eDDot: "⩷", deg: "°", delta: "δ", demptyv: "⦱", dfisht: "⥿", dfr: "\uD835\uDD21", diamondsuit: "♦", diams: "♦", digamma: "ϝ", gammad: "ϝ", disin: "⋲", div: "÷", divide: "÷", divideontimes: "⋇", divonx: "⋇", djcy: "ђ", dlcorn: "⌞", llcorner: "⌞", dlcrop: "⌍", dollar: "$", dopf: "\uD835\uDD55", doteqdot: "≑", eDot: "≑", dotminus: "∸", minusd: "∸", dotplus: "∔", plusdo: "∔", dotsquare: "⊡", sdotb: "⊡", drcorn: "⌟", lrcorner: "⌟", drcrop: "⌌", dscr: "\uD835\uDCB9", dscy: "ѕ", dsol: "⧶", dstrok: "đ", dtdot: "⋱", dtri: "▿", triangledown: "▿", dwangle: "⦦", dzcy: "џ", dzigrarr: "⟿", eacute: "é", easter: "⩮", ecaron: "ě", ecir: "≖", eqcirc: "≖", ecirc: "ê", ecolon: "≕", eqcolon: "≕", ecy: "э", edot: "ė", efDot: "≒", fallingdotseq: "≒", efr: "\uD835\uDD22", eg: "⪚", egrave: "è", egs: "⪖", eqslantgtr: "⪖", egsdot: "⪘", el: "⪙", elinters: "⏧", ell: "ℓ", els: "⪕", eqslantless: "⪕", elsdot: "⪗", emacr: "ē", empty: "∅", emptyset: "∅", emptyv: "∅", varnothing: "∅", emsp13: " ", emsp14: " ", emsp: " ", eng: "ŋ", ensp: " ", eogon: "ę", eopf: "\uD835\uDD56", epar: "⋕", eparsl: "⧣", eplus: "⩱", epsi: "ε", epsilon: "ε", epsiv: "ϵ", straightepsilon: "ϵ", varepsilon: "ϵ", equals: "=", equest: "≟", questeq: "≟", equivDD: "⩸", eqvparsl: "⧥", erDot: "≓", risingdotseq: "≓", erarr: "⥱", escr: "ℯ", eta: "η", eth: "ð", euml: "ë", euro: "€", excl: "!", fcy: "ф", female: "♀", ffilig: "ﬃ", fflig: "ﬀ", ffllig: "ﬄ", ffr: "\uD835\uDD23", filig: "ﬁ", fjlig: "fj", flat: "♭", fllig: "ﬂ", fltns: "▱", fnof: "ƒ", fopf: "\uD835\uDD57", fork: "⋔", pitchfork: "⋔", forkv: "⫙", fpartint: "⨍", frac12: "½", half: "½", frac13: "⅓", frac14: "¼", frac15: "⅕", frac16: "⅙", frac18: "⅛", frac23: "⅔", frac25: "⅖", frac34: "¾", frac35: "⅗", frac38: "⅜", frac45: "⅘", frac56: "⅚", frac58: "⅝", frac78: "⅞", frasl: "⁄", frown: "⌢", sfrown: "⌢", fscr: "\uD835\uDCBB", gEl: "⪌", gtreqqless: "⪌", gacute: "ǵ", gamma: "γ", gap: "⪆", gtrapprox: "⪆", gbreve: "ğ", gcirc: "ĝ", gcy: "г", gdot: "ġ", gescc: "⪩", gesdot: "⪀", gesdoto: "⪂", gesdotol: "⪄", gesl: "⋛︀", gesles: "⪔", gfr: "\uD835\uDD24", gimel: "ℷ", gjcy: "ѓ", glE: "⪒", gla: "⪥", glj: "⪤", gnE: "≩", gneqq: "≩", gnap: "⪊", gnapprox: "⪊", gne: "⪈", gneq: "⪈", gnsim: "⋧", gopf: "\uD835\uDD58", gscr: "ℊ", gsime: "⪎", gsiml: "⪐", gtcc: "⪧", gtcir: "⩺", gtdot: "⋗", gtrdot: "⋗", gtlPar: "⦕", gtquest: "⩼", gtrarr: "⥸", gvertneqq: "≩︀", gvnE: "≩︀", hardcy: "ъ", harrcir: "⥈", harrw: "↭", leftrightsquigarrow: "↭", hbar: "ℏ", hslash: "ℏ", planck: "ℏ", plankv: "ℏ", hcirc: "ĥ", hearts: "♥", heartsuit: "♥", hellip: "…", mldr: "…", hercon: "⊹", hfr: "\uD835\uDD25", hksearow: "⤥", searhk: "⤥", hkswarow: "⤦", swarhk: "⤦", hoarr: "⇿", homtht: "∻", hookleftarrow: "↩", larrhk: "↩", hookrightarrow: "↪", rarrhk: "↪", hopf: "\uD835\uDD59", horbar: "―", hscr: "\uD835\uDCBD", hstrok: "ħ", hybull: "⁃", iacute: "í", icirc: "î", icy: "и", iecy: "е", iexcl: "¡", ifr: "\uD835\uDD26", igrave: "ì", iiiint: "⨌", qint: "⨌", iiint: "∭", tint: "∭", iinfin: "⧜", iiota: "℩", ijlig: "ĳ", imacr: "ī", imath: "ı", inodot: "ı", imof: "⊷", imped: "Ƶ", incare: "℅", infin: "∞", infintie: "⧝", intcal: "⊺", intercal: "⊺", intlarhk: "⨗", intprod: "⨼", iprod: "⨼", iocy: "ё", iogon: "į", iopf: "\uD835\uDD5A", iota: "ι", iquest: "¿", iscr: "\uD835\uDCBE", isinE: "⋹", isindot: "⋵", isins: "⋴", isinsv: "⋳", itilde: "ĩ", iukcy: "і", iuml: "ï", jcirc: "ĵ", jcy: "й", jfr: "\uD835\uDD27", jmath: "ȷ", jopf: "\uD835\uDD5B", jscr: "\uD835\uDCBF", jsercy: "ј", jukcy: "є", kappa: "κ", kappav: "ϰ", varkappa: "ϰ", kcedil: "ķ", kcy: "к", kfr: "\uD835\uDD28", kgreen: "ĸ", khcy: "х", kjcy: "ќ", kopf: "\uD835\uDD5C", kscr: "\uD835\uDCC0", lAtail: "⤛", lBarr: "⤎", lEg: "⪋", lesseqqgtr: "⪋", lHar: "⥢", lacute: "ĺ", laemptyv: "⦴", lambda: "λ", langd: "⦑", lap: "⪅", lessapprox: "⪅", laquo: "«", larrbfs: "⤟", larrfs: "⤝", larrlp: "↫", looparrowleft: "↫", larrpl: "⤹", larrsim: "⥳", larrtl: "↢", leftarrowtail: "↢", lat: "⪫", latail: "⤙", late: "⪭", lates: "⪭︀", lbarr: "⤌", lbbrk: "❲", lbrace: "{", lcub: "{", lbrack: "[", lsqb: "[", lbrke: "⦋", lbrksld: "⦏", lbrkslu: "⦍", lcaron: "ľ", lcedil: "ļ", lcy: "л", ldca: "⤶", ldrdhar: "⥧", ldrushar: "⥋", ldsh: "↲", le: "≤", leq: "≤", leftleftarrows: "⇇", llarr: "⇇", leftthreetimes: "⋋", lthree: "⋋", lescc: "⪨", lesdot: "⩿", lesdoto: "⪁", lesdotor: "⪃", lesg: "⋚︀", lesges: "⪓", lessdot: "⋖", ltdot: "⋖", lfisht: "⥼", lfr: "\uD835\uDD29", lgE: "⪑", lharul: "⥪", lhblk: "▄", ljcy: "љ", llhard: "⥫", lltri: "◺", lmidot: "ŀ", lmoust: "⎰", lmoustache: "⎰", lnE: "≨", lneqq: "≨", lnap: "⪉", lnapprox: "⪉", lne: "⪇", lneq: "⪇", lnsim: "⋦", loang: "⟬", loarr: "⇽", longmapsto: "⟼", xmap: "⟼", looparrowright: "↬", rarrlp: "↬", lopar: "⦅", lopf: "\uD835\uDD5D", loplus: "⨭", lotimes: "⨴", lowast: "∗", loz: "◊", lozenge: "◊", lpar: "(", lparlt: "⦓", lrhard: "⥭", lrm: "‎", lrtri: "⊿", lsaquo: "‹", lscr: "\uD835\uDCC1", lsime: "⪍", lsimg: "⪏", lsquor: "‚", sbquo: "‚", lstrok: "ł", ltcc: "⪦", ltcir: "⩹", ltimes: "⋉", ltlarr: "⥶", ltquest: "⩻", ltrPar: "⦖", ltri: "◃", triangleleft: "◃", lurdshar: "⥊", luruhar: "⥦", lvertneqq: "≨︀", lvnE: "≨︀", mDDot: "∺", macr: "¯", strns: "¯", male: "♂", malt: "✠", maltese: "✠", marker: "▮", mcomma: "⨩", mcy: "м", mdash: "—", mfr: "\uD835\uDD2A", mho: "℧", micro: "µ", midcir: "⫰", minus: "−", minusdu: "⨪", mlcp: "⫛", models: "⊧", mopf: "\uD835\uDD5E", mscr: "\uD835\uDCC2", mu: "μ", multimap: "⊸", mumap: "⊸", nGg: "⋙̸", nGt: "≫⃒", nLeftarrow: "⇍", nlArr: "⇍", nLeftrightarrow: "⇎", nhArr: "⇎", nLl: "⋘̸", nLt: "≪⃒", nRightarrow: "⇏", nrArr: "⇏", nVDash: "⊯", nVdash: "⊮", nacute: "ń", nang: "∠⃒", napE: "⩰̸", napid: "≋̸", napos: "ŉ", natur: "♮", natural: "♮", ncap: "⩃", ncaron: "ň", ncedil: "ņ", ncongdot: "⩭̸", ncup: "⩂", ncy: "н", ndash: "–", neArr: "⇗", nearhk: "⤤", nedot: "≐̸", nesear: "⤨", toea: "⤨", nfr: "\uD835\uDD2B", nharr: "↮", nleftrightarrow: "↮", nhpar: "⫲", nis: "⋼", nisd: "⋺", njcy: "њ", nlE: "≦̸", nleqq: "≦̸", nlarr: "↚", nleftarrow: "↚", nldr: "‥", nopf: "\uD835\uDD5F", not: "¬", notinE: "⋹̸", notindot: "⋵̸", notinvb: "⋷", notinvc: "⋶", notnivb: "⋾", notnivc: "⋽", nparsl: "⫽⃥", npart: "∂̸", npolint: "⨔", nrarr: "↛", nrightarrow: "↛", nrarrc: "⤳̸", nrarrw: "↝̸", nscr: "\uD835\uDCC3", nsub: "⊄", nsubE: "⫅̸", nsubseteqq: "⫅̸", nsup: "⊅", nsupE: "⫆̸", nsupseteqq: "⫆̸", ntilde: "ñ", nu: "ν", num: "#", numero: "№", numsp: " ", nvDash: "⊭", nvHarr: "⤄", nvap: "≍⃒", nvdash: "⊬", nvge: "≥⃒", nvgt: ">⃒", nvinfin: "⧞", nvlArr: "⤂", nvle: "≤⃒", nvlt: "<⃒", nvltrie: "⊴⃒", nvrArr: "⤃", nvrtrie: "⊵⃒", nvsim: "∼⃒", nwArr: "⇖", nwarhk: "⤣", nwnear: "⤧", oacute: "ó", ocirc: "ô", ocy: "о", odblac: "ő", odiv: "⨸", odsold: "⦼", oelig: "œ", ofcir: "⦿", ofr: "\uD835\uDD2C", ogon: "˛", ograve: "ò", ogt: "⧁", ohbar: "⦵", olcir: "⦾", olcross: "⦻", olt: "⧀", omacr: "ō", omega: "ω", omicron: "ο", omid: "⦶", oopf: "\uD835\uDD60", opar: "⦷", operp: "⦹", or: "∨", vee: "∨", ord: "⩝", order: "ℴ", orderof: "ℴ", oscr: "ℴ", ordf: "ª", ordm: "º", origof: "⊶", oror: "⩖", orslope: "⩗", orv: "⩛", oslash: "ø", osol: "⊘", otilde: "õ", otimesas: "⨶", ouml: "ö", ovbar: "⌽", para: "¶", parsim: "⫳", parsl: "⫽", pcy: "п", percnt: "%", period: ".", permil: "‰", pertenk: "‱", pfr: "\uD835\uDD2D", phi: "φ", phiv: "ϕ", straightphi: "ϕ", varphi: "ϕ", phone: "☎", pi: "π", piv: "ϖ", varpi: "ϖ", planckh: "ℎ", plus: "+", plusacir: "⨣", pluscir: "⨢", plusdu: "⨥", pluse: "⩲", plussim: "⨦", plustwo: "⨧", pointint: "⨕", popf: "\uD835\uDD61", pound: "£", prE: "⪳", prap: "⪷", precapprox: "⪷", precnapprox: "⪹", prnap: "⪹", precneqq: "⪵", prnE: "⪵", precnsim: "⋨", prnsim: "⋨", prime: "′", profalar: "⌮", profline: "⌒", profsurf: "⌓", prurel: "⊰", pscr: "\uD835\uDCC5", psi: "ψ", puncsp: " ", qfr: "\uD835\uDD2E", qopf: "\uD835\uDD62", qprime: "⁗", qscr: "\uD835\uDCC6", quatint: "⨖", quest: "?", rAtail: "⤜", rHar: "⥤", race: "∽̱", racute: "ŕ", raemptyv: "⦳", rangd: "⦒", range: "⦥", raquo: "»", rarrap: "⥵", rarrbfs: "⤠", rarrc: "⤳", rarrfs: "⤞", rarrpl: "⥅", rarrsim: "⥴", rarrtl: "↣", rightarrowtail: "↣", rarrw: "↝", rightsquigarrow: "↝", ratail: "⤚", ratio: "∶", rbbrk: "❳", rbrace: "}", rcub: "}", rbrack: "]", rsqb: "]", rbrke: "⦌", rbrksld: "⦎", rbrkslu: "⦐", rcaron: "ř", rcedil: "ŗ", rcy: "р", rdca: "⤷", rdldhar: "⥩", rdsh: "↳", rect: "▭", rfisht: "⥽", rfr: "\uD835\uDD2F", rharul: "⥬", rho: "ρ", rhov: "ϱ", varrho: "ϱ", rightrightarrows: "⇉", rrarr: "⇉", rightthreetimes: "⋌", rthree: "⋌", ring: "˚", rlm: "‏", rmoust: "⎱", rmoustache: "⎱", rnmid: "⫮", roang: "⟭", roarr: "⇾", ropar: "⦆", ropf: "\uD835\uDD63", roplus: "⨮", rotimes: "⨵", rpar: ")", rpargt: "⦔", rppolint: "⨒", rsaquo: "›", rscr: "\uD835\uDCC7", rtimes: "⋊", rtri: "▹", triangleright: "▹", rtriltri: "⧎", ruluhar: "⥨", rx: "℞", sacute: "ś", scE: "⪴", scap: "⪸", succapprox: "⪸", scaron: "š", scedil: "ş", scirc: "ŝ", scnE: "⪶", succneqq: "⪶", scnap: "⪺", succnapprox: "⪺", scnsim: "⋩", succnsim: "⋩", scpolint: "⨓", scy: "с", sdot: "⋅", sdote: "⩦", seArr: "⇘", sect: "§", semi: ";", seswar: "⤩", tosa: "⤩", sext: "✶", sfr: "\uD835\uDD30", sharp: "♯", shchcy: "щ", shcy: "ш", shy: "­", sigma: "σ", sigmaf: "ς", sigmav: "ς", varsigma: "ς", simdot: "⩪", simg: "⪞", simgE: "⪠", siml: "⪝", simlE: "⪟", simne: "≆", simplus: "⨤", simrarr: "⥲", smashp: "⨳", smeparsl: "⧤", smile: "⌣", ssmile: "⌣", smt: "⪪", smte: "⪬", smtes: "⪬︀", softcy: "ь", sol: "/", solb: "⧄", solbar: "⌿", sopf: "\uD835\uDD64", spades: "♠", spadesuit: "♠", sqcaps: "⊓︀", sqcups: "⊔︀", sscr: "\uD835\uDCC8", star: "☆", sub: "⊂", subset: "⊂", subE: "⫅", subseteqq: "⫅", subdot: "⪽", subedot: "⫃", submult: "⫁", subnE: "⫋", subsetneqq: "⫋", subne: "⊊", subsetneq: "⊊", subplus: "⪿", subrarr: "⥹", subsim: "⫇", subsub: "⫕", subsup: "⫓", sung: "♪", sup1: "¹", sup2: "²", sup3: "³", supE: "⫆", supseteqq: "⫆", supdot: "⪾", supdsub: "⫘", supedot: "⫄", suphsol: "⟉", suphsub: "⫗", suplarr: "⥻", supmult: "⫂", supnE: "⫌", supsetneqq: "⫌", supne: "⊋", supsetneq: "⊋", supplus: "⫀", supsim: "⫈", supsub: "⫔", supsup: "⫖", swArr: "⇙", swnwar: "⤪", szlig: "ß", target: "⌖", tau: "τ", tcaron: "ť", tcedil: "ţ", tcy: "т", telrec: "⌕", tfr: "\uD835\uDD31", theta: "θ", thetasym: "ϑ", thetav: "ϑ", vartheta: "ϑ", thorn: "þ", times: "×", timesbar: "⨱", timesd: "⨰", topbot: "⌶", topcir: "⫱", topf: "\uD835\uDD65", topfork: "⫚", tprime: "‴", triangle: "▵", utri: "▵", triangleq: "≜", trie: "≜", tridot: "◬", triminus: "⨺", triplus: "⨹", trisb: "⧍", tritime: "⨻", trpezium: "⏢", tscr: "\uD835\uDCC9", tscy: "ц", tshcy: "ћ", tstrok: "ŧ", uHar: "⥣", uacute: "ú", ubrcy: "ў", ubreve: "ŭ", ucirc: "û", ucy: "у", udblac: "ű", ufisht: "⥾", ufr: "\uD835\uDD32", ugrave: "ù", uhblk: "▀", ulcorn: "⌜", ulcorner: "⌜", ulcrop: "⌏", ultri: "◸", umacr: "ū", uogon: "ų", uopf: "\uD835\uDD66", upsi: "υ", upsilon: "υ", upuparrows: "⇈", uuarr: "⇈", urcorn: "⌝", urcorner: "⌝", urcrop: "⌎", uring: "ů", urtri: "◹", uscr: "\uD835\uDCCA", utdot: "⋰", utilde: "ũ", uuml: "ü", uwangle: "⦧", vBar: "⫨", vBarv: "⫩", vangrt: "⦜", varsubsetneq: "⊊︀", vsubne: "⊊︀", varsubsetneqq: "⫋︀", vsubnE: "⫋︀", varsupsetneq: "⊋︀", vsupne: "⊋︀", varsupsetneqq: "⫌︀", vsupnE: "⫌︀", vcy: "в", veebar: "⊻", veeeq: "≚", vellip: "⋮", vfr: "\uD835\uDD33", vopf: "\uD835\uDD67", vscr: "\uD835\uDCCB", vzigzag: "⦚", wcirc: "ŵ", wedbar: "⩟", wedgeq: "≙", weierp: "℘", wp: "℘", wfr: "\uD835\uDD34", wopf: "\uD835\uDD68", wscr: "\uD835\uDCCC", xfr: "\uD835\uDD35", xi: "ξ", xnis: "⋻", xopf: "\uD835\uDD69", xscr: "\uD835\uDCCD", yacute: "ý", yacy: "я", ycirc: "ŷ", ycy: "ы", yen: "¥", yfr: "\uD835\uDD36", yicy: "ї", yopf: "\uD835\uDD6A", yscr: "\uD835\uDCCE", yucy: "ю", yuml: "ÿ", zacute: "ź", zcaron: "ž", zcy: "з", zdot: "ż", zeta: "ζ", zfr: "\uD835\uDD37", zhcy: "ж", zigrarr: "⇝", zopf: "\uD835\uDD6B", zscr: "\uD835\uDCCF", zwj: "‍", zwnj: "‌" };
var fo = "";
Ve.ngsp = fo;
var go = [/@/, /^\s*$/, /[<>]/, /^[{}]$/, /&(#|[a-z])/i, /^\/\//];
function Xs(t2, e) {
  if (e != null && !(Array.isArray(e) && e.length == 2))
    throw new Error(`Expected '${t2}' to be an array, [start, end].`);
  if (e != null) {
    let r = e[0], n = e[1];
    go.forEach((s) => {
      if (s.test(r) || s.test(n))
        throw new Error(`['${r}', '${n}'] contains unusable interpolation symbol.`);
    });
  }
}
var $r = class t2 {
  static fromArray(e) {
    return e ? (Xs("interpolation", e), new t2(e[0], e[1])) : Or;
  }
  constructor(e, r) {
    this.start = e, this.end = r;
  }
};
var Or = new $r("{{", "}}");
var gt = class extends Oe {
  constructor(e, r, n) {
    super(n, e), this.tokenType = r;
  }
};
var Ur = class {
  constructor(e, r, n) {
    this.tokens = e, this.errors = r, this.nonNormalizedIcuExpressions = n;
  }
};
function li(t3, e, r, n = {}) {
  let s = new Wr(new ve(t3, e), r, n);
  return s.tokenize(), new Ur(Vo(s.tokens), s.errors, s.nonNormalizedIcuExpressions);
}
var Io = /\r\n?/g;
function Ue(t3) {
  return `Unexpected character "${t3 === 0 ? "EOF" : String.fromCharCode(t3)}"`;
}
function ti(t3) {
  return `Unknown entity "${t3}" - use the "&#<decimal>;" or  "&#x<hex>;" syntax`;
}
function Ro(t3, e) {
  return `Unable to parse entity "${e}" - ${t3} character reference entities must end with ";"`;
}
var rr;
(function(t3) {
  t3.HEX = "hexadecimal", t3.DEC = "decimal";
})(rr || (rr = {}));
var Ct = class {
  constructor(e) {
    this.error = e;
  }
};
var Wr = class {
  constructor(e, r, n) {
    this._getTagContentType = r, this._currentTokenStart = null, this._currentTokenType = null, this._expansionCaseStack = [], this._inInterpolation = false, this._fullNameStack = [], this.tokens = [], this.errors = [], this.nonNormalizedIcuExpressions = [], this._tokenizeIcu = n.tokenizeExpansionForms || false, this._interpolationConfig = n.interpolationConfig || Or, this._leadingTriviaCodePoints = n.leadingTriviaChars && n.leadingTriviaChars.map((i) => i.codePointAt(0) || 0), this._canSelfClose = n.canSelfClose || false, this._allowHtmComponentClosingTags = n.allowHtmComponentClosingTags || false;
    let s = n.range || { endPos: e.content.length, startPos: 0, startLine: 0, startCol: 0 };
    this._cursor = n.escapedString ? new Gr(e, s) : new nr(e, s), this._preserveLineEndings = n.preserveLineEndings || false, this._i18nNormalizeLineEndingsInICUs = n.i18nNormalizeLineEndingsInICUs || false, this._tokenizeBlocks = n.tokenizeBlocks ?? true, this._tokenizeLet = n.tokenizeLet ?? true;
    try {
      this._cursor.init();
    } catch (i) {
      this.handleError(i);
    }
  }
  _processCarriageReturns(e) {
    return this._preserveLineEndings ? e : e.replace(Io, `
`);
  }
  tokenize() {
    for (;this._cursor.peek() !== 0; ) {
      let e = this._cursor.clone();
      try {
        if (this._attemptCharCode(60))
          if (this._attemptCharCode(33))
            this._attemptStr("[CDATA[") ? this._consumeCdata(e) : this._attemptStr("--") ? this._consumeComment(e) : this._attemptStrCaseInsensitive("doctype") ? this._consumeDocType(e) : this._consumeBogusComment(e);
          else if (this._attemptCharCode(47))
            this._consumeTagClose(e);
          else {
            let r = this._cursor.clone();
            this._attemptCharCode(63) ? (this._cursor = r, this._consumeBogusComment(e)) : this._consumeTagOpen(e);
          }
        else
          this._tokenizeLet && this._cursor.peek() === 64 && !this._inInterpolation && this._attemptStr("@let") ? this._consumeLetDeclaration(e) : this._tokenizeBlocks && this._attemptCharCode(64) ? this._consumeBlockStart(e) : this._tokenizeBlocks && !this._inInterpolation && !this._isInExpansionCase() && !this._isInExpansionForm() && this._attemptCharCode(125) ? this._consumeBlockEnd(e) : this._tokenizeIcu && this._tokenizeExpansionForm() || this._consumeWithInterpolation(5, 8, () => this._isTextEnd(), () => this._isTagStart());
      } catch (r) {
        this.handleError(r);
      }
    }
    this._beginToken(34), this._endToken([]);
  }
  _getBlockName() {
    let e = false, r = this._cursor.clone();
    return this._attemptCharCodeUntilFn((n) => ut(n) ? !e : si(n) ? (e = true, false) : true), this._cursor.getChars(r).trim();
  }
  _consumeBlockStart(e) {
    this._beginToken(25, e);
    let r = this._endToken([this._getBlockName()]);
    if (this._cursor.peek() === 40)
      if (this._cursor.advance(), this._consumeBlockParameters(), this._attemptCharCodeUntilFn(b), this._attemptCharCode(41))
        this._attemptCharCodeUntilFn(b);
      else {
        r.type = 29;
        return;
      }
    this._attemptCharCode(123) ? (this._beginToken(26), this._endToken([])) : r.type = 29;
  }
  _consumeBlockEnd(e) {
    this._beginToken(27, e), this._endToken([]);
  }
  _consumeBlockParameters() {
    for (this._attemptCharCodeUntilFn(ii);this._cursor.peek() !== 41 && this._cursor.peek() !== 0; ) {
      this._beginToken(28);
      let e = this._cursor.clone(), r = null, n = 0;
      for (;this._cursor.peek() !== 59 && this._cursor.peek() !== 0 || r !== null; ) {
        let s = this._cursor.peek();
        if (s === 92)
          this._cursor.advance();
        else if (s === r)
          r = null;
        else if (r === null && Ot(s))
          r = s;
        else if (s === 40 && r === null)
          n++;
        else if (s === 41 && r === null) {
          if (n === 0)
            break;
          n > 0 && n--;
        }
        this._cursor.advance();
      }
      this._endToken([this._cursor.getChars(e)]), this._attemptCharCodeUntilFn(ii);
    }
  }
  _consumeLetDeclaration(e) {
    if (this._beginToken(30, e), ut(this._cursor.peek()))
      this._attemptCharCodeUntilFn(b);
    else {
      let s = this._endToken([this._cursor.getChars(e)]);
      s.type = 33;
      return;
    }
    let r = this._endToken([this._getLetDeclarationName()]);
    if (this._attemptCharCodeUntilFn(b), !this._attemptCharCode(61)) {
      r.type = 33;
      return;
    }
    this._attemptCharCodeUntilFn((s) => b(s) && !$t(s)), this._consumeLetDeclarationValue(), this._cursor.peek() === 59 ? (this._beginToken(32), this._endToken([]), this._cursor.advance()) : (r.type = 33, r.sourceSpan = this._cursor.getSpan(e));
  }
  _getLetDeclarationName() {
    let e = this._cursor.clone(), r = false;
    return this._attemptCharCodeUntilFn((n) => lt(n) || n === 36 || n === 95 || r && Rt(n) ? (r = true, false) : true), this._cursor.getChars(e).trim();
  }
  _consumeLetDeclarationValue() {
    let e = this._cursor.clone();
    for (this._beginToken(31, e);this._cursor.peek() !== 0; ) {
      let r = this._cursor.peek();
      if (r === 59)
        break;
      Ot(r) && (this._cursor.advance(), this._attemptCharCodeUntilFn((n) => n === 92 ? (this._cursor.advance(), false) : n === r)), this._cursor.advance();
    }
    this._endToken([this._cursor.getChars(e)]);
  }
  _tokenizeExpansionForm() {
    if (this.isExpansionFormStart())
      return this._consumeExpansionFormStart(), true;
    if (qo(this._cursor.peek()) && this._isInExpansionForm())
      return this._consumeExpansionCaseStart(), true;
    if (this._cursor.peek() === 125) {
      if (this._isInExpansionCase())
        return this._consumeExpansionCaseEnd(), true;
      if (this._isInExpansionForm())
        return this._consumeExpansionFormEnd(), true;
    }
    return false;
  }
  _beginToken(e, r = this._cursor.clone()) {
    this._currentTokenStart = r, this._currentTokenType = e;
  }
  _endToken(e, r) {
    if (this._currentTokenStart === null)
      throw new gt("Programming error - attempted to end a token when there was no start to the token", this._currentTokenType, this._cursor.getSpan(r));
    if (this._currentTokenType === null)
      throw new gt("Programming error - attempted to end a token which has no token type", null, this._cursor.getSpan(this._currentTokenStart));
    let n = { type: this._currentTokenType, parts: e, sourceSpan: (r ?? this._cursor).getSpan(this._currentTokenStart, this._leadingTriviaCodePoints) };
    return this.tokens.push(n), this._currentTokenStart = null, this._currentTokenType = null, n;
  }
  _createError(e, r) {
    this._isInExpansionForm() && (e += ` (Do you have an unescaped "{" in your template? Use "{{ '{' }}") to escape it.)`);
    let n = new gt(e, this._currentTokenType, r);
    return this._currentTokenStart = null, this._currentTokenType = null, new Ct(n);
  }
  handleError(e) {
    if (e instanceof St && (e = this._createError(e.msg, this._cursor.getSpan(e.cursor))), e instanceof Ct)
      this.errors.push(e.error);
    else
      throw e;
  }
  _attemptCharCode(e) {
    return this._cursor.peek() === e ? (this._cursor.advance(), true) : false;
  }
  _attemptCharCodeCaseInsensitive(e) {
    return Ho(this._cursor.peek(), e) ? (this._cursor.advance(), true) : false;
  }
  _requireCharCode(e) {
    let r = this._cursor.clone();
    if (!this._attemptCharCode(e))
      throw this._createError(Ue(this._cursor.peek()), this._cursor.getSpan(r));
  }
  _attemptStr(e) {
    let r = e.length;
    if (this._cursor.charsLeft() < r)
      return false;
    let n = this._cursor.clone();
    for (let s = 0;s < r; s++)
      if (!this._attemptCharCode(e.charCodeAt(s)))
        return this._cursor = n, false;
    return true;
  }
  _attemptStrCaseInsensitive(e) {
    for (let r = 0;r < e.length; r++)
      if (!this._attemptCharCodeCaseInsensitive(e.charCodeAt(r)))
        return false;
    return true;
  }
  _requireStr(e) {
    let r = this._cursor.clone();
    if (!this._attemptStr(e))
      throw this._createError(Ue(this._cursor.peek()), this._cursor.getSpan(r));
  }
  _requireStrCaseInsensitive(e) {
    let r = this._cursor.clone();
    if (!this._attemptStrCaseInsensitive(e))
      throw this._createError(Ue(this._cursor.peek()), this._cursor.getSpan(r));
  }
  _attemptCharCodeUntilFn(e) {
    for (;!e(this._cursor.peek()); )
      this._cursor.advance();
  }
  _requireCharCodeUntilFn(e, r) {
    let n = this._cursor.clone();
    if (this._attemptCharCodeUntilFn(e), this._cursor.diff(n) < r)
      throw this._createError(Ue(this._cursor.peek()), this._cursor.getSpan(n));
  }
  _attemptUntilChar(e) {
    for (;this._cursor.peek() !== e; )
      this._cursor.advance();
  }
  _readChar() {
    let e = String.fromCodePoint(this._cursor.peek());
    return this._cursor.advance(), e;
  }
  _consumeEntity(e) {
    this._beginToken(9);
    let r = this._cursor.clone();
    if (this._cursor.advance(), this._attemptCharCode(35)) {
      let n = this._attemptCharCode(120) || this._attemptCharCode(88), s = this._cursor.clone();
      if (this._attemptCharCodeUntilFn(Oo), this._cursor.peek() != 59) {
        this._cursor.advance();
        let a = n ? rr.HEX : rr.DEC;
        throw this._createError(Ro(a, this._cursor.getChars(r)), this._cursor.getSpan());
      }
      let i = this._cursor.getChars(s);
      this._cursor.advance();
      try {
        let a = parseInt(i, n ? 16 : 10);
        this._endToken([String.fromCharCode(a), this._cursor.getChars(r)]);
      } catch {
        throw this._createError(ti(this._cursor.getChars(r)), this._cursor.getSpan());
      }
    } else {
      let n = this._cursor.clone();
      if (this._attemptCharCodeUntilFn(Mo), this._cursor.peek() != 59)
        this._beginToken(e, r), this._cursor = n, this._endToken(["&"]);
      else {
        let s = this._cursor.getChars(n);
        this._cursor.advance();
        let i = Ve[s];
        if (!i)
          throw this._createError(ti(s), this._cursor.getSpan(r));
        this._endToken([i, `&${s};`]);
      }
    }
  }
  _consumeRawText(e, r) {
    this._beginToken(e ? 6 : 7);
    let n = [];
    for (;; ) {
      let s = this._cursor.clone(), i = r();
      if (this._cursor = s, i)
        break;
      e && this._cursor.peek() === 38 ? (this._endToken([this._processCarriageReturns(n.join(""))]), n.length = 0, this._consumeEntity(6), this._beginToken(6)) : n.push(this._readChar());
    }
    this._endToken([this._processCarriageReturns(n.join(""))]);
  }
  _consumeComment(e) {
    this._beginToken(10, e), this._endToken([]), this._consumeRawText(false, () => this._attemptStr("-->")), this._beginToken(11), this._requireStr("-->"), this._endToken([]);
  }
  _consumeBogusComment(e) {
    this._beginToken(10, e), this._endToken([]), this._consumeRawText(false, () => this._cursor.peek() === 62), this._beginToken(11), this._cursor.advance(), this._endToken([]);
  }
  _consumeCdata(e) {
    this._beginToken(12, e), this._endToken([]), this._consumeRawText(false, () => this._attemptStr("]]>")), this._beginToken(13), this._requireStr("]]>"), this._endToken([]);
  }
  _consumeDocType(e) {
    this._beginToken(18, e), this._endToken([]), this._consumeRawText(false, () => this._cursor.peek() === 62), this._beginToken(19), this._cursor.advance(), this._endToken([]);
  }
  _consumePrefixAndName() {
    let e = this._cursor.clone(), r = "";
    for (;this._cursor.peek() !== 58 && !$o(this._cursor.peek()); )
      this._cursor.advance();
    let n;
    this._cursor.peek() === 58 ? (r = this._cursor.getChars(e), this._cursor.advance(), n = this._cursor.clone()) : n = e, this._requireCharCodeUntilFn(ri, r === "" ? 0 : 1);
    let s = this._cursor.getChars(n);
    return [r, s];
  }
  _consumeTagOpen(e) {
    let r, n, s, i = [];
    try {
      if (!lt(this._cursor.peek()))
        throw this._createError(Ue(this._cursor.peek()), this._cursor.getSpan(e));
      for (s = this._consumeTagOpenStart(e), n = s.parts[0], r = s.parts[1], this._attemptCharCodeUntilFn(b);this._cursor.peek() !== 47 && this._cursor.peek() !== 62 && this._cursor.peek() !== 60 && this._cursor.peek() !== 0; ) {
        let [o, u] = this._consumeAttributeName();
        if (this._attemptCharCodeUntilFn(b), this._attemptCharCode(61)) {
          this._attemptCharCodeUntilFn(b);
          let p = this._consumeAttributeValue();
          i.push({ prefix: o, name: u, value: p });
        } else
          i.push({ prefix: o, name: u });
        this._attemptCharCodeUntilFn(b);
      }
      this._consumeTagOpenEnd();
    } catch (o) {
      if (o instanceof Ct) {
        s ? s.type = 4 : (this._beginToken(5, e), this._endToken(["<"]));
        return;
      }
      throw o;
    }
    if (this._canSelfClose && this.tokens[this.tokens.length - 1].type === 2)
      return;
    let a = this._getTagContentType(r, n, this._fullNameStack.length > 0, i);
    this._handleFullNameStackForTagOpen(n, r), a === N.RAW_TEXT ? this._consumeRawTextWithTagClose(n, r, false) : a === N.ESCAPABLE_RAW_TEXT && this._consumeRawTextWithTagClose(n, r, true);
  }
  _consumeRawTextWithTagClose(e, r, n) {
    this._consumeRawText(n, () => !this._attemptCharCode(60) || !this._attemptCharCode(47) || (this._attemptCharCodeUntilFn(b), !this._attemptStrCaseInsensitive(e ? `${e}:${r}` : r)) ? false : (this._attemptCharCodeUntilFn(b), this._attemptCharCode(62))), this._beginToken(3), this._requireCharCodeUntilFn((s) => s === 62, 3), this._cursor.advance(), this._endToken([e, r]), this._handleFullNameStackForTagClose(e, r);
  }
  _consumeTagOpenStart(e) {
    this._beginToken(0, e);
    let r = this._consumePrefixAndName();
    return this._endToken(r);
  }
  _consumeAttributeName() {
    let e = this._cursor.peek();
    if (e === 39 || e === 34)
      throw this._createError(Ue(e), this._cursor.getSpan());
    this._beginToken(14);
    let r = this._consumePrefixAndName();
    return this._endToken(r), r;
  }
  _consumeAttributeValue() {
    let e;
    if (this._cursor.peek() === 39 || this._cursor.peek() === 34) {
      let r = this._cursor.peek();
      this._consumeQuote(r);
      let n = () => this._cursor.peek() === r;
      e = this._consumeWithInterpolation(16, 17, n, n), this._consumeQuote(r);
    } else {
      let r = () => ri(this._cursor.peek());
      e = this._consumeWithInterpolation(16, 17, r, r);
    }
    return e;
  }
  _consumeQuote(e) {
    this._beginToken(15), this._requireCharCode(e), this._endToken([String.fromCodePoint(e)]);
  }
  _consumeTagOpenEnd() {
    let e = this._attemptCharCode(47) ? 2 : 1;
    this._beginToken(e), this._requireCharCode(62), this._endToken([]);
  }
  _consumeTagClose(e) {
    if (this._beginToken(3, e), this._attemptCharCodeUntilFn(b), this._allowHtmComponentClosingTags && this._attemptCharCode(47))
      this._attemptCharCodeUntilFn(b), this._requireCharCode(62), this._endToken([]);
    else {
      let [r, n] = this._consumePrefixAndName();
      this._attemptCharCodeUntilFn(b), this._requireCharCode(62), this._endToken([r, n]), this._handleFullNameStackForTagClose(r, n);
    }
  }
  _consumeExpansionFormStart() {
    this._beginToken(20), this._requireCharCode(123), this._endToken([]), this._expansionCaseStack.push(20), this._beginToken(7);
    let e = this._readUntil(44), r = this._processCarriageReturns(e);
    if (this._i18nNormalizeLineEndingsInICUs)
      this._endToken([r]);
    else {
      let s = this._endToken([e]);
      r !== e && this.nonNormalizedIcuExpressions.push(s);
    }
    this._requireCharCode(44), this._attemptCharCodeUntilFn(b), this._beginToken(7);
    let n = this._readUntil(44);
    this._endToken([n]), this._requireCharCode(44), this._attemptCharCodeUntilFn(b);
  }
  _consumeExpansionCaseStart() {
    this._beginToken(21);
    let e = this._readUntil(123).trim();
    this._endToken([e]), this._attemptCharCodeUntilFn(b), this._beginToken(22), this._requireCharCode(123), this._endToken([]), this._attemptCharCodeUntilFn(b), this._expansionCaseStack.push(22);
  }
  _consumeExpansionCaseEnd() {
    this._beginToken(23), this._requireCharCode(125), this._endToken([]), this._attemptCharCodeUntilFn(b), this._expansionCaseStack.pop();
  }
  _consumeExpansionFormEnd() {
    this._beginToken(24), this._requireCharCode(125), this._endToken([]), this._expansionCaseStack.pop();
  }
  _consumeWithInterpolation(e, r, n, s) {
    this._beginToken(e);
    let i = [];
    for (;!n(); ) {
      let o = this._cursor.clone();
      this._interpolationConfig && this._attemptStr(this._interpolationConfig.start) ? (this._endToken([this._processCarriageReturns(i.join(""))], o), i.length = 0, this._consumeInterpolation(r, o, s), this._beginToken(e)) : this._cursor.peek() === 38 ? (this._endToken([this._processCarriageReturns(i.join(""))]), i.length = 0, this._consumeEntity(e), this._beginToken(e)) : i.push(this._readChar());
    }
    this._inInterpolation = false;
    let a = this._processCarriageReturns(i.join(""));
    return this._endToken([a]), a;
  }
  _consumeInterpolation(e, r, n) {
    let s = [];
    this._beginToken(e, r), s.push(this._interpolationConfig.start);
    let i = this._cursor.clone(), a = null, o = false;
    for (;this._cursor.peek() !== 0 && (n === null || !n()); ) {
      let u = this._cursor.clone();
      if (this._isTagStart()) {
        this._cursor = u, s.push(this._getProcessedChars(i, u)), this._endToken(s);
        return;
      }
      if (a === null)
        if (this._attemptStr(this._interpolationConfig.end)) {
          s.push(this._getProcessedChars(i, u)), s.push(this._interpolationConfig.end), this._endToken(s);
          return;
        } else
          this._attemptStr("//") && (o = true);
      let p = this._cursor.peek();
      this._cursor.advance(), p === 92 ? this._cursor.advance() : p === a ? a = null : !o && a === null && Ot(p) && (a = p);
    }
    s.push(this._getProcessedChars(i, this._cursor)), this._endToken(s);
  }
  _getProcessedChars(e, r) {
    return this._processCarriageReturns(r.getChars(e));
  }
  _isTextEnd() {
    return !!(this._isTagStart() || this._cursor.peek() === 0 || this._tokenizeIcu && !this._inInterpolation && (this.isExpansionFormStart() || this._cursor.peek() === 125 && this._isInExpansionCase()) || this._tokenizeBlocks && !this._inInterpolation && !this._isInExpansion() && (this._isBlockStart() || this._cursor.peek() === 64 || this._cursor.peek() === 125));
  }
  _isTagStart() {
    if (this._cursor.peek() === 60) {
      let e = this._cursor.clone();
      e.advance();
      let r = e.peek();
      if (97 <= r && r <= 122 || 65 <= r && r <= 90 || r === 47 || r === 33)
        return true;
    }
    return false;
  }
  _isBlockStart() {
    if (this._tokenizeBlocks && this._cursor.peek() === 64) {
      let e = this._cursor.clone();
      if (e.advance(), si(e.peek()))
        return true;
    }
    return false;
  }
  _readUntil(e) {
    let r = this._cursor.clone();
    return this._attemptUntilChar(e), this._cursor.getChars(r);
  }
  _isInExpansion() {
    return this._isInExpansionCase() || this._isInExpansionForm();
  }
  _isInExpansionCase() {
    return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 22;
  }
  _isInExpansionForm() {
    return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 20;
  }
  isExpansionFormStart() {
    if (this._cursor.peek() !== 123)
      return false;
    if (this._interpolationConfig) {
      let e = this._cursor.clone(), r = this._attemptStr(this._interpolationConfig.start);
      return this._cursor = e, !r;
    }
    return true;
  }
  _handleFullNameStackForTagOpen(e, r) {
    let n = qe(e, r);
    (this._fullNameStack.length === 0 || this._fullNameStack[this._fullNameStack.length - 1] === n) && this._fullNameStack.push(n);
  }
  _handleFullNameStackForTagClose(e, r) {
    let n = qe(e, r);
    this._fullNameStack.length !== 0 && this._fullNameStack[this._fullNameStack.length - 1] === n && this._fullNameStack.pop();
  }
};
function b(t3) {
  return !ut(t3) || t3 === 0;
}
function ri(t3) {
  return ut(t3) || t3 === 62 || t3 === 60 || t3 === 47 || t3 === 39 || t3 === 34 || t3 === 61 || t3 === 0;
}
function $o(t3) {
  return (t3 < 97 || 122 < t3) && (t3 < 65 || 90 < t3) && (t3 < 48 || t3 > 57);
}
function Oo(t3) {
  return t3 === 59 || t3 === 0 || !Rs(t3);
}
function Mo(t3) {
  return t3 === 59 || t3 === 0 || !lt(t3);
}
function qo(t3) {
  return t3 !== 125;
}
function Ho(t3, e) {
  return ni(t3) === ni(e);
}
function ni(t3) {
  return t3 >= 97 && t3 <= 122 ? t3 - 97 + 65 : t3;
}
function si(t3) {
  return lt(t3) || Rt(t3) || t3 === 95;
}
function ii(t3) {
  return t3 !== 59 && b(t3);
}
function Vo(t3) {
  let e = [], r;
  for (let n = 0;n < t3.length; n++) {
    let s = t3[n];
    r && r.type === 5 && s.type === 5 || r && r.type === 16 && s.type === 16 ? (r.parts[0] += s.parts[0], r.sourceSpan.end = s.sourceSpan.end) : (r = s, e.push(r));
  }
  return e;
}
var nr = class t3 {
  constructor(e, r) {
    if (e instanceof t3) {
      this.file = e.file, this.input = e.input, this.end = e.end;
      let n = e.state;
      this.state = { peek: n.peek, offset: n.offset, line: n.line, column: n.column };
    } else {
      if (!r)
        throw new Error("Programming error: the range argument must be provided with a file argument.");
      this.file = e, this.input = e.content, this.end = r.endPos, this.state = { peek: -1, offset: r.startPos, line: r.startLine, column: r.startCol };
    }
  }
  clone() {
    return new t3(this);
  }
  peek() {
    return this.state.peek;
  }
  charsLeft() {
    return this.end - this.state.offset;
  }
  diff(e) {
    return this.state.offset - e.state.offset;
  }
  advance() {
    this.advanceState(this.state);
  }
  init() {
    this.updatePeek(this.state);
  }
  getSpan(e, r) {
    e = e || this;
    let n = e;
    if (r)
      for (;this.diff(e) > 0 && r.indexOf(e.peek()) !== -1; )
        n === e && (e = e.clone()), e.advance();
    let s = this.locationFromCursor(e), i = this.locationFromCursor(this), a = n !== e ? this.locationFromCursor(n) : s;
    return new h(s, i, a);
  }
  getChars(e) {
    return this.input.substring(e.state.offset, this.state.offset);
  }
  charAt(e) {
    return this.input.charCodeAt(e);
  }
  advanceState(e) {
    if (e.offset >= this.end)
      throw this.state = e, new St('Unexpected character "EOF"', this);
    let r = this.charAt(e.offset);
    r === 10 ? (e.line++, e.column = 0) : $t(r) || e.column++, e.offset++, this.updatePeek(e);
  }
  updatePeek(e) {
    e.peek = e.offset >= this.end ? 0 : this.charAt(e.offset);
  }
  locationFromCursor(e) {
    return new ie(e.file, e.state.offset, e.state.line, e.state.column);
  }
};
var Gr = class t4 extends nr {
  constructor(e, r) {
    e instanceof t4 ? (super(e), this.internalState = { ...e.internalState }) : (super(e, r), this.internalState = this.state);
  }
  advance() {
    this.state = this.internalState, super.advance(), this.processEscapeSequence();
  }
  init() {
    super.init(), this.processEscapeSequence();
  }
  clone() {
    return new t4(this);
  }
  getChars(e) {
    let r = e.clone(), n = "";
    for (;r.internalState.offset < this.internalState.offset; )
      n += String.fromCodePoint(r.peek()), r.advance();
    return n;
  }
  processEscapeSequence() {
    let e = () => this.internalState.peek;
    if (e() === 92)
      if (this.internalState = { ...this.state }, this.advanceState(this.internalState), e() === 110)
        this.state.peek = 10;
      else if (e() === 114)
        this.state.peek = 13;
      else if (e() === 118)
        this.state.peek = 11;
      else if (e() === 116)
        this.state.peek = 9;
      else if (e() === 98)
        this.state.peek = 8;
      else if (e() === 102)
        this.state.peek = 12;
      else if (e() === 117)
        if (this.advanceState(this.internalState), e() === 123) {
          this.advanceState(this.internalState);
          let r = this.clone(), n = 0;
          for (;e() !== 125; )
            this.advanceState(this.internalState), n++;
          this.state.peek = this.decodeHexDigits(r, n);
        } else {
          let r = this.clone();
          this.advanceState(this.internalState), this.advanceState(this.internalState), this.advanceState(this.internalState), this.state.peek = this.decodeHexDigits(r, 4);
        }
      else if (e() === 120) {
        this.advanceState(this.internalState);
        let r = this.clone();
        this.advanceState(this.internalState), this.state.peek = this.decodeHexDigits(r, 2);
      } else if (Br(e())) {
        let r = "", n = 0, s = this.clone();
        for (;Br(e()) && n < 3; )
          s = this.clone(), r += String.fromCodePoint(e()), this.advanceState(this.internalState), n++;
        this.state.peek = parseInt(r, 8), this.internalState = s.internalState;
      } else
        $t(this.internalState.peek) ? (this.advanceState(this.internalState), this.state = this.internalState) : this.state.peek = this.internalState.peek;
  }
  decodeHexDigits(e, r) {
    let n = this.input.slice(e.internalState.offset, e.internalState.offset + r), s = parseInt(n, 16);
    if (isNaN(s))
      throw e.state = e.internalState, new St("Invalid hexadecimal escape sequence", e);
    return s;
  }
};
var St = class {
  constructor(e, r) {
    this.msg = e, this.cursor = r;
  }
};
var L = class t5 extends Oe {
  static create(e, r, n) {
    return new t5(e, r, n);
  }
  constructor(e, r, n) {
    super(r, n), this.elementName = e;
  }
};
var jr = class {
  constructor(e, r) {
    this.rootNodes = e, this.errors = r;
  }
};
var sr = class {
  constructor(e) {
    this.getTagDefinition = e;
  }
  parse(e, r, n, s = false, i) {
    let a = (D) => (I, ...F) => D(I.toLowerCase(), ...F), o = s ? this.getTagDefinition : a(this.getTagDefinition), u = (D) => o(D).getContentType(), p = s ? i : a(i), m = li(e, r, i ? (D, I, F, c) => {
      let g = p(D, I, F, c);
      return g !== undefined ? g : u(D);
    } : u, n), f = n && n.canSelfClose || false, C = n && n.allowHtmComponentClosingTags || false, A = new Kr(m.tokens, o, f, C, s);
    return A.build(), new jr(A.rootNodes, m.errors.concat(A.errors));
  }
};
var Kr = class t6 {
  constructor(e, r, n, s, i) {
    this.tokens = e, this.getTagDefinition = r, this.canSelfClose = n, this.allowHtmComponentClosingTags = s, this.isTagNameCaseSensitive = i, this._index = -1, this._containerStack = [], this.rootNodes = [], this.errors = [], this._advance();
  }
  build() {
    for (;this._peek.type !== 34; )
      this._peek.type === 0 || this._peek.type === 4 ? this._consumeStartTag(this._advance()) : this._peek.type === 3 ? (this._closeVoidElement(), this._consumeEndTag(this._advance())) : this._peek.type === 12 ? (this._closeVoidElement(), this._consumeCdata(this._advance())) : this._peek.type === 10 ? (this._closeVoidElement(), this._consumeComment(this._advance())) : this._peek.type === 5 || this._peek.type === 7 || this._peek.type === 6 ? (this._closeVoidElement(), this._consumeText(this._advance())) : this._peek.type === 20 ? this._consumeExpansion(this._advance()) : this._peek.type === 25 ? (this._closeVoidElement(), this._consumeBlockOpen(this._advance())) : this._peek.type === 27 ? (this._closeVoidElement(), this._consumeBlockClose(this._advance())) : this._peek.type === 29 ? (this._closeVoidElement(), this._consumeIncompleteBlock(this._advance())) : this._peek.type === 30 ? (this._closeVoidElement(), this._consumeLet(this._advance())) : this._peek.type === 18 ? this._consumeDocType(this._advance()) : this._peek.type === 33 ? (this._closeVoidElement(), this._consumeIncompleteLet(this._advance())) : this._advance();
    for (let e of this._containerStack)
      e instanceof ee && this.errors.push(L.create(e.name, e.sourceSpan, `Unclosed block "${e.name}"`));
  }
  _advance() {
    let e = this._peek;
    return this._index < this.tokens.length - 1 && this._index++, this._peek = this.tokens[this._index], e;
  }
  _advanceIf(e) {
    return this._peek.type === e ? this._advance() : null;
  }
  _consumeCdata(e) {
    let r = this._advance(), n = this._getText(r), s = this._advanceIf(13);
    this._addToParent(new Gt(n, new h(e.sourceSpan.start, (s || r).sourceSpan.end), [r]));
  }
  _consumeComment(e) {
    let r = this._advanceIf(7), n = this._advanceIf(11), s = r != null ? r.parts[0].trim() : null, i = n == null ? e.sourceSpan : new h(e.sourceSpan.start, n.sourceSpan.end, e.sourceSpan.fullStart);
    this._addToParent(new Kt(s, i));
  }
  _consumeDocType(e) {
    let r = this._advanceIf(7), n = this._advanceIf(19), s = r != null ? r.parts[0].trim() : null, i = new h(e.sourceSpan.start, (n || r || e).sourceSpan.end);
    this._addToParent(new Xt(s, i));
  }
  _consumeExpansion(e) {
    let r = this._advance(), n = this._advance(), s = [];
    for (;this._peek.type === 21; ) {
      let a = this._parseExpansionCase();
      if (!a)
        return;
      s.push(a);
    }
    if (this._peek.type !== 24) {
      this.errors.push(L.create(null, this._peek.sourceSpan, "Invalid ICU message. Missing '}'."));
      return;
    }
    let i = new h(e.sourceSpan.start, this._peek.sourceSpan.end, e.sourceSpan.fullStart);
    this._addToParent(new zt(r.parts[0], n.parts[0], s, i, r.sourceSpan)), this._advance();
  }
  _parseExpansionCase() {
    let e = this._advance();
    if (this._peek.type !== 22)
      return this.errors.push(L.create(null, this._peek.sourceSpan, "Invalid ICU message. Missing '{'.")), null;
    let r = this._advance(), n = this._collectExpansionExpTokens(r);
    if (!n)
      return null;
    let s = this._advance();
    n.push({ type: 34, parts: [], sourceSpan: s.sourceSpan });
    let i = new t6(n, this.getTagDefinition, this.canSelfClose, this.allowHtmComponentClosingTags, this.isTagNameCaseSensitive);
    if (i.build(), i.errors.length > 0)
      return this.errors = this.errors.concat(i.errors), null;
    let a = new h(e.sourceSpan.start, s.sourceSpan.end, e.sourceSpan.fullStart), o = new h(r.sourceSpan.start, s.sourceSpan.end, r.sourceSpan.fullStart);
    return new Yt(e.parts[0], i.rootNodes, a, e.sourceSpan, o);
  }
  _collectExpansionExpTokens(e) {
    let r = [], n = [22];
    for (;; ) {
      if ((this._peek.type === 20 || this._peek.type === 22) && n.push(this._peek.type), this._peek.type === 23)
        if (ci(n, 22)) {
          if (n.pop(), n.length === 0)
            return r;
        } else
          return this.errors.push(L.create(null, e.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
      if (this._peek.type === 24)
        if (ci(n, 20))
          n.pop();
        else
          return this.errors.push(L.create(null, e.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
      if (this._peek.type === 34)
        return this.errors.push(L.create(null, e.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
      r.push(this._advance());
    }
  }
  _getText(e) {
    let r = e.parts[0];
    if (r.length > 0 && r[0] == `
`) {
      let n = this._getClosestParentElement();
      n != null && n.children.length == 0 && this.getTagDefinition(n.name).ignoreFirstLf && (r = r.substring(1));
    }
    return r;
  }
  _consumeText(e) {
    let r = [e], n = e.sourceSpan, s = e.parts[0];
    if (s.length > 0 && s[0] === `
`) {
      let i = this._getContainer();
      i != null && i.children.length === 0 && this.getTagDefinition(i.name).ignoreFirstLf && (s = s.substring(1), r[0] = { type: e.type, sourceSpan: e.sourceSpan, parts: [s] });
    }
    for (;this._peek.type === 8 || this._peek.type === 5 || this._peek.type === 9; )
      e = this._advance(), r.push(e), e.type === 8 ? s += e.parts.join("").replace(/&([^;]+);/g, pi) : e.type === 9 ? s += e.parts[0] : s += e.parts.join("");
    if (s.length > 0) {
      let i = e.sourceSpan;
      this._addToParent(new Wt(s, new h(n.start, i.end, n.fullStart, n.details), r));
    }
  }
  _closeVoidElement() {
    let e = this._getContainer();
    e instanceof Y && this.getTagDefinition(e.name).isVoid && this._containerStack.pop();
  }
  _consumeStartTag(e) {
    let [r, n] = e.parts, s = [];
    for (;this._peek.type === 14; )
      s.push(this._consumeAttr(this._advance()));
    let i = this._getElementFullName(r, n, this._getClosestParentElement()), a = false;
    if (this._peek.type === 2) {
      this._advance(), a = true;
      let C = this.getTagDefinition(i);
      this.canSelfClose || C.canSelfClose || Me(i) !== null || C.isVoid || this.errors.push(L.create(i, e.sourceSpan, `Only void, custom and foreign elements can be self closed "${e.parts[1]}"`));
    } else
      this._peek.type === 1 && (this._advance(), a = false);
    let o = this._peek.sourceSpan.fullStart, u = new h(e.sourceSpan.start, o, e.sourceSpan.fullStart), p = new h(e.sourceSpan.start, o, e.sourceSpan.fullStart), l = new h(e.sourceSpan.start.moveBy(1), e.sourceSpan.end), m = new Y(i, s, [], u, p, undefined, l), f = this._getContainer();
    this._pushContainer(m, f instanceof Y && this.getTagDefinition(f.name).isClosedByChild(m.name)), a ? this._popContainer(i, Y, u) : e.type === 4 && (this._popContainer(i, Y, null), this.errors.push(L.create(i, u, `Opening tag "${i}" not terminated.`)));
  }
  _pushContainer(e, r) {
    r && this._containerStack.pop(), this._addToParent(e), this._containerStack.push(e);
  }
  _consumeEndTag(e) {
    let r = this.allowHtmComponentClosingTags && e.parts.length === 0 ? null : this._getElementFullName(e.parts[0], e.parts[1], this._getClosestParentElement());
    if (r && this.getTagDefinition(r).isVoid)
      this.errors.push(L.create(r, e.sourceSpan, `Void elements do not have end tags "${e.parts[1]}"`));
    else if (!this._popContainer(r, Y, e.sourceSpan)) {
      let n = `Unexpected closing tag "${r}". It may happen when the tag has already been closed by another tag. For more info see https://www.w3.org/TR/html5/syntax.html#closing-elements-that-have-implied-end-tags`;
      this.errors.push(L.create(r, e.sourceSpan, n));
    }
  }
  _popContainer(e, r, n) {
    let s = false;
    for (let i = this._containerStack.length - 1;i >= 0; i--) {
      let a = this._containerStack[i];
      if (Me(a.name) ? a.name === e : (e == null || a.name.toLowerCase() === e.toLowerCase()) && a instanceof r)
        return a.endSourceSpan = n, a.sourceSpan.end = n !== null ? n.end : a.sourceSpan.end, this._containerStack.splice(i, this._containerStack.length - i), !s;
      (a instanceof ee || a instanceof Y && !this.getTagDefinition(a.name).closedByParent) && (s = true);
    }
    return false;
  }
  _consumeAttr(e) {
    let r = qe(e.parts[0], e.parts[1]), n = e.sourceSpan.end, s;
    this._peek.type === 15 && (s = this._advance());
    let i = "", a = [], o, u;
    if (this._peek.type === 16)
      for (o = this._peek.sourceSpan, u = this._peek.sourceSpan.end;this._peek.type === 16 || this._peek.type === 17 || this._peek.type === 9; ) {
        let m = this._advance();
        a.push(m), m.type === 17 ? i += m.parts.join("").replace(/&([^;]+);/g, pi) : m.type === 9 ? i += m.parts[0] : i += m.parts.join(""), u = n = m.sourceSpan.end;
      }
    this._peek.type === 15 && (u = n = this._advance().sourceSpan.end);
    let l = o && u && new h((s == null ? undefined : s.sourceSpan.start) ?? o.start, u, (s == null ? undefined : s.sourceSpan.fullStart) ?? o.fullStart);
    return new jt(r, i, new h(e.sourceSpan.start, n, e.sourceSpan.fullStart), e.sourceSpan, l, a.length > 0 ? a : undefined, undefined);
  }
  _consumeBlockOpen(e) {
    let r = [];
    for (;this._peek.type === 28; ) {
      let o = this._advance();
      r.push(new ht(o.parts[0], o.sourceSpan));
    }
    this._peek.type === 26 && this._advance();
    let n = this._peek.sourceSpan.fullStart, s = new h(e.sourceSpan.start, n, e.sourceSpan.fullStart), i = new h(e.sourceSpan.start, n, e.sourceSpan.fullStart), a = new ee(e.parts[0], r, [], s, e.sourceSpan, i);
    this._pushContainer(a, false);
  }
  _consumeBlockClose(e) {
    this._popContainer(null, ee, e.sourceSpan) || this.errors.push(L.create(null, e.sourceSpan, 'Unexpected closing block. The block may have been closed earlier. If you meant to write the } character, you should use the "&#125;" HTML entity instead.'));
  }
  _consumeIncompleteBlock(e) {
    let r = [];
    for (;this._peek.type === 28; ) {
      let o = this._advance();
      r.push(new ht(o.parts[0], o.sourceSpan));
    }
    let n = this._peek.sourceSpan.fullStart, s = new h(e.sourceSpan.start, n, e.sourceSpan.fullStart), i = new h(e.sourceSpan.start, n, e.sourceSpan.fullStart), a = new ee(e.parts[0], r, [], s, e.sourceSpan, i);
    this._pushContainer(a, false), this._popContainer(null, ee, null), this.errors.push(L.create(e.parts[0], s, `Incomplete block "${e.parts[0]}". If you meant to write the @ character, you should use the "&#64;" HTML entity instead.`));
  }
  _consumeLet(e) {
    let r = e.parts[0], n, s;
    if (this._peek.type !== 31) {
      this.errors.push(L.create(e.parts[0], e.sourceSpan, `Invalid @let declaration "${r}". Declaration must have a value.`));
      return;
    } else
      n = this._advance();
    if (this._peek.type !== 32) {
      this.errors.push(L.create(e.parts[0], e.sourceSpan, `Unterminated @let declaration "${r}". Declaration must be terminated with a semicolon.`));
      return;
    } else
      s = this._advance();
    let i = s.sourceSpan.fullStart, a = new h(e.sourceSpan.start, i, e.sourceSpan.fullStart), o = e.sourceSpan.toString().lastIndexOf(r), u = e.sourceSpan.start.moveBy(o), p = new h(u, e.sourceSpan.end), l = new mt(r, n.parts[0], a, p, n.sourceSpan);
    this._addToParent(l);
  }
  _consumeIncompleteLet(e) {
    let r = e.parts[0] ?? "", n = r ? ` "${r}"` : "";
    if (r.length > 0) {
      let s = e.sourceSpan.toString().lastIndexOf(r), i = e.sourceSpan.start.moveBy(s), a = new h(i, e.sourceSpan.end), o = new h(e.sourceSpan.start, e.sourceSpan.start.moveBy(0)), u = new mt(r, "", e.sourceSpan, a, o);
      this._addToParent(u);
    }
    this.errors.push(L.create(e.parts[0], e.sourceSpan, `Incomplete @let declaration${n}. @let declarations must be written as \`@let <name> = <value>;\``));
  }
  _getContainer() {
    return this._containerStack.length > 0 ? this._containerStack[this._containerStack.length - 1] : null;
  }
  _getClosestParentElement() {
    for (let e = this._containerStack.length - 1;e > -1; e--)
      if (this._containerStack[e] instanceof Y)
        return this._containerStack[e];
    return null;
  }
  _addToParent(e) {
    let r = this._getContainer();
    r === null ? this.rootNodes.push(e) : r.children.push(e);
  }
  _getElementFullName(e, r, n) {
    if (e === "" && (e = this.getTagDefinition(r).implicitNamespacePrefix || "", e === "" && n != null)) {
      let s = ct(n.name)[1];
      this.getTagDefinition(s).preventNamespaceInheritance || (e = Me(n.name));
    }
    return qe(e, r);
  }
};
function ci(t7, e) {
  return t7.length > 0 && t7[t7.length - 1] === e;
}
function pi(t7, e) {
  return Ve[e] !== undefined ? Ve[e] || t7 : /^#x[a-f0-9]+$/i.test(e) ? String.fromCodePoint(parseInt(e.slice(2), 16)) : /^#\d+$/.test(e) ? String.fromCodePoint(parseInt(e.slice(1), 10)) : t7;
}
var ir = class extends sr {
  constructor() {
    super(He);
  }
  parse(e, r, n, s = false, i) {
    return super.parse(e, r, n, s, i);
  }
};
var Xr = null;
var Uo = () => (Xr || (Xr = new ir), Xr);
function Qr(t7, e = {}) {
  let { canSelfClose: r = false, allowHtmComponentClosingTags: n = false, isTagNameCaseSensitive: s = false, getTagContentType: i, tokenizeAngularBlocks: a = false, tokenizeAngularLetDeclaration: o = false } = e;
  return Uo().parse(t7, "angular-html-parser", { tokenizeExpansionForms: a, interpolationConfig: undefined, canSelfClose: r, allowHtmComponentClosingTags: n, tokenizeBlocks: a, tokenizeLet: o }, s, i);
}
function Wo(t7, e) {
  let r = new SyntaxError(t7 + " (" + e.loc.start.line + ":" + e.loc.start.column + ")");
  return Object.assign(r, e);
}
var hi = Wo;
var _t = 3;
function Go(t7) {
  let e = t7.slice(0, _t);
  if (e !== "---" && e !== "+++")
    return;
  let r = t7.indexOf(`
`, _t);
  if (r === -1)
    return;
  let n = t7.slice(_t, r).trim(), s = t7.indexOf(`
${e}`, r), i = n;
  if (i || (i = e === "+++" ? "toml" : "yaml"), s === -1 && e === "---" && i === "yaml" && (s = t7.indexOf(`
...`, r)), s === -1)
    return;
  let a = s + 1 + _t, o = t7.charAt(a + 1);
  if (!/\s?/u.test(o))
    return;
  let u = t7.slice(0, a);
  return { type: "front-matter", language: i, explicitLanguage: n, value: t7.slice(r + 1, s), startDelimiter: e, endDelimiter: u.slice(-_t), raw: u };
}
function zo(t7) {
  let e = Go(t7);
  if (!e)
    return { content: t7 };
  let { raw: r } = e;
  return { frontMatter: e, content: w(false, r, /[^\n]/gu, " ") + t7.slice(r.length) };
}
var mi = zo;
var ar = { attrs: true, children: true, cases: true, expression: true };
var fi = new Set(["parent"]);
var le;
var Jr;
var Zr;
var Ge = class Ge2 {
  constructor(e = {}) {
    At(this, le);
    lr(this, "type");
    lr(this, "parent");
    for (let r of new Set([...fi, ...Object.keys(e)]))
      this.setProperty(r, e[r]);
  }
  setProperty(e, r) {
    if (this[e] !== r) {
      if (e in ar && (r = r.map((n) => this.createChild(n))), !fi.has(e)) {
        this[e] = r;
        return;
      }
      Object.defineProperty(this, e, { value: r, enumerable: false, configurable: true });
    }
  }
  map(e) {
    let r;
    for (let n in ar) {
      let s = this[n];
      if (s) {
        let i = Yo(s, (a) => a.map(e));
        r !== s && (r || (r = new Ge2({ parent: this.parent })), r.setProperty(n, i));
      }
    }
    if (r)
      for (let n in this)
        n in ar || (r[n] = this[n]);
    return e(r || this);
  }
  walk(e) {
    for (let r in ar) {
      let n = this[r];
      if (n)
        for (let s = 0;s < n.length; s++)
          n[s].walk(e);
    }
    e(this);
  }
  createChild(e) {
    let r = e instanceof Ge2 ? e.clone() : new Ge2(e);
    return r.setProperty("parent", this), r;
  }
  insertChildBefore(e, r) {
    let n = this.$children;
    n.splice(n.indexOf(e), 0, this.createChild(r));
  }
  removeChild(e) {
    let r = this.$children;
    r.splice(r.indexOf(e), 1);
  }
  replaceChild(e, r) {
    let n = this.$children;
    n[n.indexOf(e)] = this.createChild(r);
  }
  clone() {
    return new Ge2(this);
  }
  get $children() {
    return this[R(this, le, Jr)];
  }
  set $children(e) {
    this[R(this, le, Jr)] = e;
  }
  get firstChild() {
    var e;
    return (e = this.$children) == null ? undefined : e[0];
  }
  get lastChild() {
    return K(true, this.$children, -1);
  }
  get prev() {
    let e = R(this, le, Zr);
    return e[e.indexOf(this) - 1];
  }
  get next() {
    let e = R(this, le, Zr);
    return e[e.indexOf(this) + 1];
  }
  get rawName() {
    return this.hasExplicitNamespace ? this.fullName : this.name;
  }
  get fullName() {
    return this.namespace ? this.namespace + ":" + this.name : this.name;
  }
  get attrMap() {
    return Object.fromEntries(this.attrs.map((e) => [e.fullName, e.value]));
  }
};
le = new WeakSet, Jr = function() {
  return this.type === "angularIcuCase" ? "expression" : this.type === "angularIcuExpression" ? "cases" : "children";
}, Zr = function() {
  var e;
  return ((e = this.parent) == null ? undefined : e.$children) ?? [];
};
var or = Ge;
function Yo(t7, e) {
  let r = t7.map(e);
  return r.some((n, s) => n !== t7[s]) ? r : t7;
}
var jo = [{ regex: /^(\[if([^\]]*)\]>)(.*?)<!\s*\[endif\]$/su, parse: Ko }, { regex: /^\[if([^\]]*)\]><!$/u, parse: Xo }, { regex: /^<!\s*\[endif\]$/u, parse: Qo }];
function di(t7, e) {
  if (t7.value)
    for (let { regex: r, parse: n } of jo) {
      let s = t7.value.match(r);
      if (s)
        return n(t7, e, s);
    }
  return null;
}
function Ko(t7, e, r) {
  let [, n, s, i] = r, a = 4 + n.length, o = t7.sourceSpan.start.moveBy(a), u = o.moveBy(i.length), [p, l] = (() => {
    try {
      return [true, e(i, o).children];
    } catch {
      return [false, [{ type: "text", value: i, sourceSpan: new h(o, u) }]];
    }
  })();
  return { type: "ieConditionalComment", complete: p, children: l, condition: w(false, s.trim(), /\s+/gu, " "), sourceSpan: t7.sourceSpan, startSourceSpan: new h(t7.sourceSpan.start, o), endSourceSpan: new h(u, t7.sourceSpan.end) };
}
function Xo(t7, e, r) {
  let [, n] = r;
  return { type: "ieConditionalStartComment", condition: w(false, n.trim(), /\s+/gu, " "), sourceSpan: t7.sourceSpan };
}
function Qo(t7) {
  return { type: "ieConditionalEndComment", sourceSpan: t7.sourceSpan };
}
var ur = new Map([["*", new Set(["accesskey", "autocapitalize", "autofocus", "class", "contenteditable", "dir", "draggable", "enterkeyhint", "hidden", "id", "inert", "inputmode", "is", "itemid", "itemprop", "itemref", "itemscope", "itemtype", "lang", "nonce", "popover", "slot", "spellcheck", "style", "tabindex", "title", "translate", "writingsuggestions"])], ["a", new Set(["charset", "coords", "download", "href", "hreflang", "name", "ping", "referrerpolicy", "rel", "rev", "shape", "target", "type"])], ["applet", new Set(["align", "alt", "archive", "code", "codebase", "height", "hspace", "name", "object", "vspace", "width"])], ["area", new Set(["alt", "coords", "download", "href", "hreflang", "nohref", "ping", "referrerpolicy", "rel", "shape", "target", "type"])], ["audio", new Set(["autoplay", "controls", "crossorigin", "loop", "muted", "preload", "src"])], ["base", new Set(["href", "target"])], ["basefont", new Set(["color", "face", "size"])], ["blockquote", new Set(["cite"])], ["body", new Set(["alink", "background", "bgcolor", "link", "text", "vlink"])], ["br", new Set(["clear"])], ["button", new Set(["disabled", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "name", "popovertarget", "popovertargetaction", "type", "value"])], ["canvas", new Set(["height", "width"])], ["caption", new Set(["align"])], ["col", new Set(["align", "char", "charoff", "span", "valign", "width"])], ["colgroup", new Set(["align", "char", "charoff", "span", "valign", "width"])], ["data", new Set(["value"])], ["del", new Set(["cite", "datetime"])], ["details", new Set(["name", "open"])], ["dialog", new Set(["open"])], ["dir", new Set(["compact"])], ["div", new Set(["align"])], ["dl", new Set(["compact"])], ["embed", new Set(["height", "src", "type", "width"])], ["fieldset", new Set(["disabled", "form", "name"])], ["font", new Set(["color", "face", "size"])], ["form", new Set(["accept", "accept-charset", "action", "autocomplete", "enctype", "method", "name", "novalidate", "target"])], ["frame", new Set(["frameborder", "longdesc", "marginheight", "marginwidth", "name", "noresize", "scrolling", "src"])], ["frameset", new Set(["cols", "rows"])], ["h1", new Set(["align"])], ["h2", new Set(["align"])], ["h3", new Set(["align"])], ["h4", new Set(["align"])], ["h5", new Set(["align"])], ["h6", new Set(["align"])], ["head", new Set(["profile"])], ["hr", new Set(["align", "noshade", "size", "width"])], ["html", new Set(["manifest", "version"])], ["iframe", new Set(["align", "allow", "allowfullscreen", "allowpaymentrequest", "allowusermedia", "frameborder", "height", "loading", "longdesc", "marginheight", "marginwidth", "name", "referrerpolicy", "sandbox", "scrolling", "src", "srcdoc", "width"])], ["img", new Set(["align", "alt", "border", "crossorigin", "decoding", "fetchpriority", "height", "hspace", "ismap", "loading", "longdesc", "name", "referrerpolicy", "sizes", "src", "srcset", "usemap", "vspace", "width"])], ["input", new Set(["accept", "align", "alt", "autocomplete", "checked", "dirname", "disabled", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "height", "ismap", "list", "max", "maxlength", "min", "minlength", "multiple", "name", "pattern", "placeholder", "popovertarget", "popovertargetaction", "readonly", "required", "size", "src", "step", "type", "usemap", "value", "width"])], ["ins", new Set(["cite", "datetime"])], ["isindex", new Set(["prompt"])], ["label", new Set(["for", "form"])], ["legend", new Set(["align"])], ["li", new Set(["type", "value"])], ["link", new Set(["as", "blocking", "charset", "color", "crossorigin", "disabled", "fetchpriority", "href", "hreflang", "imagesizes", "imagesrcset", "integrity", "media", "referrerpolicy", "rel", "rev", "sizes", "target", "type"])], ["map", new Set(["name"])], ["menu", new Set(["compact"])], ["meta", new Set(["charset", "content", "http-equiv", "media", "name", "scheme"])], ["meter", new Set(["high", "low", "max", "min", "optimum", "value"])], ["object", new Set(["align", "archive", "border", "classid", "codebase", "codetype", "data", "declare", "form", "height", "hspace", "name", "standby", "type", "typemustmatch", "usemap", "vspace", "width"])], ["ol", new Set(["compact", "reversed", "start", "type"])], ["optgroup", new Set(["disabled", "label"])], ["option", new Set(["disabled", "label", "selected", "value"])], ["output", new Set(["for", "form", "name"])], ["p", new Set(["align"])], ["param", new Set(["name", "type", "value", "valuetype"])], ["pre", new Set(["width"])], ["progress", new Set(["max", "value"])], ["q", new Set(["cite"])], ["script", new Set(["async", "blocking", "charset", "crossorigin", "defer", "fetchpriority", "integrity", "language", "nomodule", "referrerpolicy", "src", "type"])], ["select", new Set(["autocomplete", "disabled", "form", "multiple", "name", "required", "size"])], ["slot", new Set(["name"])], ["source", new Set(["height", "media", "sizes", "src", "srcset", "type", "width"])], ["style", new Set(["blocking", "media", "type"])], ["table", new Set(["align", "bgcolor", "border", "cellpadding", "cellspacing", "frame", "rules", "summary", "width"])], ["tbody", new Set(["align", "char", "charoff", "valign"])], ["td", new Set(["abbr", "align", "axis", "bgcolor", "char", "charoff", "colspan", "headers", "height", "nowrap", "rowspan", "scope", "valign", "width"])], ["template", new Set(["shadowrootclonable", "shadowrootdelegatesfocus", "shadowrootmode"])], ["textarea", new Set(["autocomplete", "cols", "dirname", "disabled", "form", "maxlength", "minlength", "name", "placeholder", "readonly", "required", "rows", "wrap"])], ["tfoot", new Set(["align", "char", "charoff", "valign"])], ["th", new Set(["abbr", "align", "axis", "bgcolor", "char", "charoff", "colspan", "headers", "height", "nowrap", "rowspan", "scope", "valign", "width"])], ["thead", new Set(["align", "char", "charoff", "valign"])], ["time", new Set(["datetime"])], ["tr", new Set(["align", "bgcolor", "char", "charoff", "valign"])], ["track", new Set(["default", "kind", "label", "src", "srclang"])], ["ul", new Set(["compact", "type"])], ["video", new Set(["autoplay", "controls", "crossorigin", "height", "loop", "muted", "playsinline", "poster", "preload", "src", "width"])]]);
var gi = new Set(["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "image", "img", "input", "ins", "isindex", "kbd", "keygen", "label", "legend", "li", "link", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meta", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr", "xmp"]);
function Jo(t7) {
  if (t7.type === "block") {
    if (t7.name = w(false, t7.name.toLowerCase(), /\s+/gu, " ").trim(), t7.type = "angularControlFlowBlock", !me(t7.parameters)) {
      delete t7.parameters;
      return;
    }
    for (let e of t7.parameters)
      e.type = "angularControlFlowBlockParameter";
    t7.parameters = { type: "angularControlFlowBlockParameters", children: t7.parameters, sourceSpan: new h(t7.parameters[0].sourceSpan.start, K(false, t7.parameters, -1).sourceSpan.end) };
  }
}
function Zo(t7) {
  t7.type === "letDeclaration" && (t7.type = "angularLetDeclaration", t7.id = t7.name, t7.init = { type: "angularLetDeclarationInitializer", sourceSpan: new h(t7.valueSpan.start, t7.valueSpan.end), value: t7.value }, delete t7.name, delete t7.value);
}
function eu(t7) {
  (t7.type === "plural" || t7.type === "select") && (t7.clause = t7.type, t7.type = "angularIcuExpression"), t7.type === "expansionCase" && (t7.type = "angularIcuCase");
}
function Si(t7, e, r) {
  let { name: n, canSelfClose: s = true, normalizeTagName: i = false, normalizeAttributeName: a = false, allowHtmComponentClosingTags: o = false, isTagNameCaseSensitive: u = false, shouldParseAsRawText: p } = e, { rootNodes: l, errors: m } = Qr(t7, { canSelfClose: s, allowHtmComponentClosingTags: o, isTagNameCaseSensitive: u, getTagContentType: p ? (...c) => p(...c) ? N.RAW_TEXT : undefined : undefined, tokenizeAngularBlocks: n === "angular" ? true : undefined, tokenizeAngularLetDeclaration: n === "angular" ? true : undefined });
  if (n === "vue") {
    if (l.some((x) => x.type === "docType" && x.value === "html" || x.type === "element" && x.name.toLowerCase() === "html"))
      return Si(t7, en, r);
    let g, y = () => g ?? (g = Qr(t7, { canSelfClose: s, allowHtmComponentClosingTags: o, isTagNameCaseSensitive: u })), q = (x) => y().rootNodes.find(({ startSourceSpan: U }) => U && U.start.offset === x.startSourceSpan.start.offset) ?? x;
    for (let [x, U] of l.entries()) {
      let { endSourceSpan: nn, startSourceSpan: Ei } = U;
      if (nn === null)
        m = y().errors, l[x] = q(U);
      else if (tu(U, r)) {
        let sn = y().errors.find((an) => an.span.start.offset > Ei.start.offset && an.span.start.offset < nn.end.offset);
        sn && Ci(sn), l[x] = q(U);
      }
    }
  }
  m.length > 0 && Ci(m[0]);
  let f = (c) => {
    let g = c.name.startsWith(":") ? c.name.slice(1).split(":")[0] : null, y = c.nameSpan.toString(), q = g !== null && y.startsWith(`${g}:`), x = q ? y.slice(g.length + 1) : y;
    c.name = x, c.namespace = g, c.hasExplicitNamespace = q;
  }, C = (c) => {
    switch (c.type) {
      case "element":
        f(c);
        for (let g of c.attrs)
          f(g), g.valueSpan ? (g.value = g.valueSpan.toString(), /["']/u.test(g.value[0]) && (g.value = g.value.slice(1, -1))) : g.value = null;
        break;
      case "comment":
        c.value = c.sourceSpan.toString().slice(4, -3);
        break;
      case "text":
        c.value = c.sourceSpan.toString();
        break;
    }
  }, A = (c, g) => {
    let y = c.toLowerCase();
    return g(y) ? y : c;
  }, D = (c) => {
    if (c.type === "element" && (i && (!c.namespace || c.namespace === c.tagDefinition.implicitNamespacePrefix || fe(c)) && (c.name = A(c.name, (g) => gi.has(g))), a))
      for (let g of c.attrs)
        g.namespace || (g.name = A(g.name, (y) => ur.has(c.name) && (ur.get("*").has(y) || ur.get(c.name).has(y))));
  }, I = (c) => {
    c.sourceSpan && c.endSourceSpan && (c.sourceSpan = new h(c.sourceSpan.start, c.endSourceSpan.end));
  }, F = (c) => {
    if (c.type === "element") {
      let g = He(u ? c.name : c.name.toLowerCase());
      !c.namespace || c.namespace === g.implicitNamespacePrefix || fe(c) ? c.tagDefinition = g : c.tagDefinition = He("");
    }
  };
  return Qt(new class extends ft {
    visitExpansionCase(c, g) {
      n === "angular" && this.visitChildren(g, (y) => {
        y(c.expression);
      });
    }
    visit(c) {
      C(c), F(c), D(c), I(c);
    }
  }, l), l;
}
function tu(t7, e) {
  var n;
  if (t7.type !== "element" || t7.name !== "template")
    return false;
  let r = (n = t7.attrs.find((s) => s.name === "lang")) == null ? undefined : n.value;
  return !r || Ne(e, { language: r }) === "html";
}
function Ci(t7) {
  let { msg: e, span: { start: r, end: n } } = t7;
  throw hi(e, { loc: { start: { line: r.line + 1, column: r.col + 1 }, end: { line: n.line + 1, column: n.col + 1 } }, cause: t7 });
}
function _i(t7, e, r = {}, n = true) {
  let { frontMatter: s, content: i } = n ? mi(t7) : { frontMatter: null, content: t7 }, a = new ve(t7, r.filepath), o = new ie(a, 0, 0, 0), u = o.moveBy(t7.length), p = { type: "root", sourceSpan: new h(o, u), children: Si(i, e, r) };
  if (s) {
    let f = new ie(a, 0, 0, 0), C = f.moveBy(s.raw.length);
    s.sourceSpan = new h(f, C), p.children.unshift(s);
  }
  let l = new or(p), m = (f, C) => {
    let { offset: A } = C, D = w(false, t7.slice(0, A), /[^\n\r]/gu, " "), F = _i(D + f, e, r, false);
    F.sourceSpan = new h(C, K(false, F.children, -1).sourceSpan.end);
    let c = F.children[0];
    return c.length === A ? F.children.shift() : (c.sourceSpan = new h(c.sourceSpan.start.moveBy(A), c.sourceSpan.end), c.value = c.value.slice(A)), F;
  };
  return l.walk((f) => {
    if (f.type === "comment") {
      let C = di(f, m);
      C && f.parent.replaceChild(f, C);
    }
    Jo(f), Zo(f), eu(f);
  }), l;
}
function Et(t7) {
  return { parse: (e, r) => _i(e, t7, r), hasPragma: ws, hasIgnorePragma: bs, astFormat: "html", locStart: J, locEnd: se };
}
var en = { name: "html", normalizeTagName: true, normalizeAttributeName: true, allowHtmComponentClosingTags: true };
var ru = Et(en);
var nu = new Set(["mj-style", "mj-raw"]);
var su = Et({ ...en, name: "mjml", shouldParseAsRawText: (t7) => nu.has(t7) });
var iu = Et({ name: "angular" });
var au = Et({ name: "vue", isTagNameCaseSensitive: true, shouldParseAsRawText(t7, e, r, n) {
  return t7.toLowerCase() !== "html" && !r && (t7 !== "template" || n.some(({ name: s, value: i }) => s === "lang" && i !== "html" && i !== "" && i !== undefined));
} });
var ou = Et({ name: "lwc", canSelfClose: false });
var uu = { html: qs };
var ym = rn;

// ../../node_modules/.bun/prettier@3.6.2/node_modules/prettier/standalone.mjs
var Fu = Object.create;
var pt2 = Object.defineProperty;
var pu = Object.getOwnPropertyDescriptor;
var du = Object.getOwnPropertyNames;
var mu = Object.getPrototypeOf;
var Eu = Object.prototype.hasOwnProperty;
var er = (e) => {
  throw TypeError(e);
};
var Cu = (e, t7) => () => (t7 || e((t7 = { exports: {} }).exports, t7), t7.exports);
var dt = (e, t7) => {
  for (var r in t7)
    pt2(e, r, { get: t7[r], enumerable: true });
};
var hu = (e, t7, r, n) => {
  if (t7 && typeof t7 == "object" || typeof t7 == "function")
    for (let u of du(t7))
      !Eu.call(e, u) && u !== r && pt2(e, u, { get: () => t7[u], enumerable: !(n = pu(t7, u)) || n.enumerable });
  return e;
};
var gu = (e, t7, r) => (r = e != null ? Fu(mu(e)) : {}, hu(t7 || !e || !e.__esModule ? pt2(r, "default", { value: e, enumerable: true }) : r, e));
var yu = (e, t7, r) => t7.has(e) || er("Cannot " + r);
var tr = (e, t7, r) => t7.has(e) ? er("Cannot add the same private member more than once") : t7 instanceof WeakSet ? t7.add(e) : t7.set(e, r);
var fe2 = (e, t7, r) => (yu(e, t7, "access private method"), r);
var Pn2 = Cu((Mt2) => {
  Object.defineProperty(Mt2, "__esModule", { value: true });
  function Co() {
    return new Proxy({}, { get: () => (e) => e });
  }
  var On2 = /\r\n|[\n\r\u2028\u2029]/;
  function ho2(e, t7, r) {
    let n = Object.assign({ column: 0, line: -1 }, e.start), u = Object.assign({}, n, e.end), { linesAbove: o = 2, linesBelow: i = 3 } = r || {}, s = n.line, a = n.column, c = u.line, D = u.column, p = Math.max(s - (o + 1), 0), l = Math.min(t7.length, c + i);
    s === -1 && (p = 0), c === -1 && (l = t7.length);
    let F = c - s, f = {};
    if (F)
      for (let d2 = 0;d2 <= F; d2++) {
        let m = d2 + s;
        if (!a)
          f[m] = true;
        else if (d2 === 0) {
          let C = t7[m - 1].length;
          f[m] = [a, C - a + 1];
        } else if (d2 === F)
          f[m] = [0, D];
        else {
          let C = t7[m - d2].length;
          f[m] = [0, C];
        }
      }
    else
      a === D ? a ? f[s] = [a, 0] : f[s] = true : f[s] = [a, D - a];
    return { start: p, end: l, markerLines: f };
  }
  function go2(e, t7, r = {}) {
    let u = Co(false), o = e.split(On2), { start: i, end: s, markerLines: a } = ho2(t7, o, r), c = t7.start && typeof t7.start.column == "number", D = String(s).length, l = e.split(On2, s).slice(i, s).map((F, f) => {
      let d2 = i + 1 + f, C = ` ${` ${d2}`.slice(-D)} |`, E2 = a[d2], h2 = !a[d2 + 1];
      if (E2) {
        let x = "";
        if (Array.isArray(E2)) {
          let A = F.slice(0, Math.max(E2[0] - 1, 0)).replace(/[^\t]/g, " "), $2 = E2[1] || 1;
          x = [`
 `, u.gutter(C.replace(/\d/g, " ")), " ", A, u.marker("^").repeat($2)].join(""), h2 && r.message && (x += " " + u.message(r.message));
        }
        return [u.marker(">"), u.gutter(C), F.length > 0 ? ` ${F}` : "", x].join("");
      } else
        return ` ${u.gutter(C)}${F.length > 0 ? ` ${F}` : ""}`;
    }).join(`
`);
    return r.message && !c && (l = `${" ".repeat(D + 1)}${r.message}
${l}`), l;
  }
  Mt2.codeFrameColumns = go2;
});
var Zt = {};
dt(Zt, { __debug: () => ui, check: () => ri2, doc: () => qt2, format: () => fu, formatWithCursor: () => cu, getSupportInfo: () => ni2, util: () => Qt2, version: () => tu2 });
var Au = (e, t7, r, n) => {
  if (!(e && t7 == null))
    return t7.replaceAll ? t7.replaceAll(r, n) : r.global ? t7.replace(r, n) : t7.split(r).join(n);
};
var te = Au;
var _e2 = class {
  diff(t7, r, n = {}) {
    let u;
    typeof n == "function" ? (u = n, n = {}) : ("callback" in n) && (u = n.callback);
    let o = this.castInput(t7, n), i = this.castInput(r, n), s = this.removeEmpty(this.tokenize(o, n)), a = this.removeEmpty(this.tokenize(i, n));
    return this.diffWithOptionsObj(s, a, n, u);
  }
  diffWithOptionsObj(t7, r, n, u) {
    var o;
    let i = (E2) => {
      if (E2 = this.postProcess(E2, n), u) {
        setTimeout(function() {
          u(E2);
        }, 0);
        return;
      } else
        return E2;
    }, s = r.length, a = t7.length, c = 1, D = s + a;
    n.maxEditLength != null && (D = Math.min(D, n.maxEditLength));
    let p = (o = n.timeout) !== null && o !== undefined ? o : 1 / 0, l = Date.now() + p, F = [{ oldPos: -1, lastComponent: undefined }], f = this.extractCommon(F[0], r, t7, 0, n);
    if (F[0].oldPos + 1 >= a && f + 1 >= s)
      return i(this.buildValues(F[0].lastComponent, r, t7));
    let d2 = -1 / 0, m = 1 / 0, C = () => {
      for (let E2 = Math.max(d2, -c);E2 <= Math.min(m, c); E2 += 2) {
        let h2, x = F[E2 - 1], A = F[E2 + 1];
        x && (F[E2 - 1] = undefined);
        let $2 = false;
        if (A) {
          let Be2 = A.oldPos - E2;
          $2 = A && 0 <= Be2 && Be2 < s;
        }
        let ue = x && x.oldPos + 1 < a;
        if (!$2 && !ue) {
          F[E2] = undefined;
          continue;
        }
        if (!ue || $2 && x.oldPos < A.oldPos ? h2 = this.addToPath(A, true, false, 0, n) : h2 = this.addToPath(x, false, true, 1, n), f = this.extractCommon(h2, r, t7, E2, n), h2.oldPos + 1 >= a && f + 1 >= s)
          return i(this.buildValues(h2.lastComponent, r, t7)) || true;
        F[E2] = h2, h2.oldPos + 1 >= a && (m = Math.min(m, E2 - 1)), f + 1 >= s && (d2 = Math.max(d2, E2 + 1));
      }
      c++;
    };
    if (u)
      (function E() {
        setTimeout(function() {
          if (c > D || Date.now() > l)
            return u(undefined);
          C() || E();
        }, 0);
      })();
    else
      for (;c <= D && Date.now() <= l; ) {
        let E2 = C();
        if (E2)
          return E2;
      }
  }
  addToPath(t7, r, n, u, o) {
    let i = t7.lastComponent;
    return i && !o.oneChangePerToken && i.added === r && i.removed === n ? { oldPos: t7.oldPos + u, lastComponent: { count: i.count + 1, added: r, removed: n, previousComponent: i.previousComponent } } : { oldPos: t7.oldPos + u, lastComponent: { count: 1, added: r, removed: n, previousComponent: i } };
  }
  extractCommon(t7, r, n, u, o) {
    let i = r.length, s = n.length, a = t7.oldPos, c = a - u, D = 0;
    for (;c + 1 < i && a + 1 < s && this.equals(n[a + 1], r[c + 1], o); )
      c++, a++, D++, o.oneChangePerToken && (t7.lastComponent = { count: 1, previousComponent: t7.lastComponent, added: false, removed: false });
    return D && !o.oneChangePerToken && (t7.lastComponent = { count: D, previousComponent: t7.lastComponent, added: false, removed: false }), t7.oldPos = a, c;
  }
  equals(t7, r, n) {
    return n.comparator ? n.comparator(t7, r) : t7 === r || !!n.ignoreCase && t7.toLowerCase() === r.toLowerCase();
  }
  removeEmpty(t7) {
    let r = [];
    for (let n = 0;n < t7.length; n++)
      t7[n] && r.push(t7[n]);
    return r;
  }
  castInput(t7, r) {
    return t7;
  }
  tokenize(t7, r) {
    return Array.from(t7);
  }
  join(t7) {
    return t7.join("");
  }
  postProcess(t7, r) {
    return t7;
  }
  get useLongestToken() {
    return false;
  }
  buildValues(t7, r, n) {
    let u = [], o;
    for (;t7; )
      u.push(t7), o = t7.previousComponent, delete t7.previousComponent, t7 = o;
    u.reverse();
    let i = u.length, s = 0, a = 0, c = 0;
    for (;s < i; s++) {
      let D = u[s];
      if (D.removed)
        D.value = this.join(n.slice(c, c + D.count)), c += D.count;
      else {
        if (!D.added && this.useLongestToken) {
          let p = r.slice(a, a + D.count);
          p = p.map(function(l, F) {
            let f = n[c + F];
            return f.length > l.length ? f : l;
          }), D.value = this.join(p);
        } else
          D.value = this.join(r.slice(a, a + D.count));
        a += D.count, D.added || (c += D.count);
      }
    }
    return u;
  }
};
var mt2 = class extends _e2 {
  tokenize(t7) {
    return t7.slice();
  }
  join(t7) {
    return t7;
  }
  removeEmpty(t7) {
    return t7;
  }
};
var rr2 = new mt2;
function Et2(e, t7, r) {
  return rr2.diff(e, t7, r);
}
function nr2(e) {
  let t7 = e.indexOf("\r");
  return t7 !== -1 ? e.charAt(t7 + 1) === `
` ? "crlf" : "cr" : "lf";
}
function xe2(e) {
  switch (e) {
    case "cr":
      return "\r";
    case "crlf":
      return `\r
`;
    default:
      return `
`;
  }
}
function Ct2(e, t7) {
  let r;
  switch (t7) {
    case `
`:
      r = /\n/gu;
      break;
    case "\r":
      r = /\r/gu;
      break;
    case `\r
`:
      r = /\r\n/gu;
      break;
    default:
      throw new Error(`Unexpected "eol" ${JSON.stringify(t7)}.`);
  }
  let n = e.match(r);
  return n ? n.length : 0;
}
function ur2(e) {
  return te(false, e, /\r\n?/gu, `
`);
}
var W2 = "string";
var Y2 = "array";
var j2 = "cursor";
var N2 = "indent";
var O2 = "align";
var P2 = "trim";
var B2 = "group";
var k2 = "fill";
var _2 = "if-break";
var v2 = "indent-if-break";
var L2 = "line-suffix";
var I = "line-suffix-boundary";
var g = "line";
var S2 = "label";
var w2 = "break-parent";
var Ue2 = new Set([j2, N2, O2, P2, B2, k2, _2, v2, L2, I, g, S2, w2]);
var Bu = (e, t7, r) => {
  if (!(e && t7 == null))
    return Array.isArray(t7) || typeof t7 == "string" ? t7[r < 0 ? t7.length + r : r] : t7.at(r);
};
var y = Bu;
function or2(e) {
  let t7 = e.length;
  for (;t7 > 0 && (e[t7 - 1] === "\r" || e[t7 - 1] === `
`); )
    t7--;
  return t7 < e.length ? e.slice(0, t7) : e;
}
function _u(e) {
  if (typeof e == "string")
    return W2;
  if (Array.isArray(e))
    return Y2;
  if (!e)
    return;
  let { type: t7 } = e;
  if (Ue2.has(t7))
    return t7;
}
var M = _u;
var xu = (e) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(e);
function wu(e) {
  let t7 = e === null ? "null" : typeof e;
  if (t7 !== "string" && t7 !== "object")
    return `Unexpected doc '${t7}', 
Expected it to be 'string' or 'object'.`;
  if (M(e))
    throw new Error("doc is valid.");
  let r = Object.prototype.toString.call(e);
  if (r !== "[object Object]")
    return `Unexpected doc '${r}'.`;
  let n = xu([...Ue2].map((u) => `'${u}'`));
  return `Unexpected doc.type '${e.type}'.
Expected it to be ${n}.`;
}
var ht2 = class extends Error {
  name = "InvalidDocError";
  constructor(t7) {
    super(wu(t7)), this.doc = t7;
  }
};
var q = ht2;
var ir2 = {};
function bu(e, t7, r, n) {
  let u = [e];
  for (;u.length > 0; ) {
    let o = u.pop();
    if (o === ir2) {
      r(u.pop());
      continue;
    }
    r && u.push(o, ir2);
    let i = M(o);
    if (!i)
      throw new q(o);
    if ((t7 == null ? undefined : t7(o)) !== false)
      switch (i) {
        case Y2:
        case k2: {
          let s = i === Y2 ? o : o.parts;
          for (let a = s.length, c = a - 1;c >= 0; --c)
            u.push(s[c]);
          break;
        }
        case _2:
          u.push(o.flatContents, o.breakContents);
          break;
        case B2:
          if (n && o.expandedStates)
            for (let s = o.expandedStates.length, a = s - 1;a >= 0; --a)
              u.push(o.expandedStates[a]);
          else
            u.push(o.contents);
          break;
        case O2:
        case N2:
        case v2:
        case S2:
        case L2:
          u.push(o.contents);
          break;
        case W2:
        case j2:
        case P2:
        case I:
        case g:
        case w2:
          break;
        default:
          throw new q(o);
      }
  }
}
var le2 = bu;
function be2(e, t7) {
  if (typeof e == "string")
    return t7(e);
  let r = new Map;
  return n(e);
  function n(o) {
    if (r.has(o))
      return r.get(o);
    let i = u(o);
    return r.set(o, i), i;
  }
  function u(o) {
    switch (M(o)) {
      case Y2:
        return t7(o.map(n));
      case k2:
        return t7({ ...o, parts: o.parts.map(n) });
      case _2:
        return t7({ ...o, breakContents: n(o.breakContents), flatContents: n(o.flatContents) });
      case B2: {
        let { expandedStates: i, contents: s } = o;
        return i ? (i = i.map(n), s = i[0]) : s = n(s), t7({ ...o, contents: s, expandedStates: i });
      }
      case O2:
      case N2:
      case v2:
      case S2:
      case L2:
        return t7({ ...o, contents: n(o.contents) });
      case W2:
      case j2:
      case P2:
      case I:
      case g:
      case w2:
        return t7(o);
      default:
        throw new q(o);
    }
  }
}
function Ve2(e, t7, r) {
  let n = r, u = false;
  function o(i) {
    if (u)
      return false;
    let s = t7(i);
    s !== undefined && (u = true, n = s);
  }
  return le2(e, o), n;
}
function ku(e) {
  if (e.type === B2 && e.break || e.type === g && e.hard || e.type === w2)
    return true;
}
function Dr2(e) {
  return Ve2(e, ku, false);
}
function sr2(e) {
  if (e.length > 0) {
    let t7 = y(false, e, -1);
    !t7.expandedStates && !t7.break && (t7.break = "propagated");
  }
  return null;
}
function cr2(e) {
  let t7 = new Set, r = [];
  function n(o) {
    if (o.type === w2 && sr2(r), o.type === B2) {
      if (r.push(o), t7.has(o))
        return false;
      t7.add(o);
    }
  }
  function u(o) {
    o.type === B2 && r.pop().break && sr2(r);
  }
  le2(e, n, u, true);
}
function Su(e) {
  return e.type === g && !e.hard ? e.soft ? "" : " " : e.type === _2 ? e.flatContents : e;
}
function fr2(e) {
  return be2(e, Su);
}
function ar2(e) {
  for (e = [...e];e.length >= 2 && y(false, e, -2).type === g && y(false, e, -1).type === w2; )
    e.length -= 2;
  if (e.length > 0) {
    let t7 = we2(y(false, e, -1));
    e[e.length - 1] = t7;
  }
  return e;
}
function we2(e) {
  switch (M(e)) {
    case N2:
    case v2:
    case B2:
    case L2:
    case S2: {
      let t7 = we2(e.contents);
      return { ...e, contents: t7 };
    }
    case _2:
      return { ...e, breakContents: we2(e.breakContents), flatContents: we2(e.flatContents) };
    case k2:
      return { ...e, parts: ar2(e.parts) };
    case Y2:
      return ar2(e);
    case W2:
      return or2(e);
    case O2:
    case j2:
    case P2:
    case I:
    case g:
    case w2:
      break;
    default:
      throw new q(e);
  }
  return e;
}
function $e(e) {
  return we2(Nu(e));
}
function Tu(e) {
  switch (M(e)) {
    case k2:
      if (e.parts.every((t7) => t7 === ""))
        return "";
      break;
    case B2:
      if (!e.contents && !e.id && !e.break && !e.expandedStates)
        return "";
      if (e.contents.type === B2 && e.contents.id === e.id && e.contents.break === e.break && e.contents.expandedStates === e.expandedStates)
        return e.contents;
      break;
    case O2:
    case N2:
    case v2:
    case L2:
      if (!e.contents)
        return "";
      break;
    case _2:
      if (!e.flatContents && !e.breakContents)
        return "";
      break;
    case Y2: {
      let t7 = [];
      for (let r of e) {
        if (!r)
          continue;
        let [n, ...u] = Array.isArray(r) ? r : [r];
        typeof n == "string" && typeof y(false, t7, -1) == "string" ? t7[t7.length - 1] += n : t7.push(n), t7.push(...u);
      }
      return t7.length === 0 ? "" : t7.length === 1 ? t7[0] : t7;
    }
    case W2:
    case j2:
    case P2:
    case I:
    case g:
    case S2:
    case w2:
      break;
    default:
      throw new q(e);
  }
  return e;
}
function Nu(e) {
  return be2(e, (t7) => Tu(t7));
}
function lr2(e, t7 = We) {
  return be2(e, (r) => typeof r == "string" ? ke2(t7, r.split(`
`)) : r);
}
function Ou(e) {
  if (e.type === g)
    return true;
}
function Fr2(e) {
  return Ve2(e, Ou, false);
}
function Fe2(e, t7) {
  return e.type === S2 ? { ...e, contents: t7(e.contents) } : t7(e);
}
var gt2 = () => {};
var K2 = gt2;
var yt2 = gt2;
var pr2 = gt2;
function ie2(e) {
  return K2(e), { type: N2, contents: e };
}
function oe(e, t7) {
  return K2(t7), { type: O2, contents: t7, n: e };
}
function At2(e, t7 = {}) {
  return K2(e), yt2(t7.expandedStates, true), { type: B2, id: t7.id, contents: e, break: !!t7.shouldBreak, expandedStates: t7.expandedStates };
}
function dr2(e) {
  return oe(Number.NEGATIVE_INFINITY, e);
}
function mr2(e) {
  return oe({ type: "root" }, e);
}
function Er2(e) {
  return oe(-1, e);
}
function Cr2(e, t7) {
  return At2(e[0], { ...t7, expandedStates: e });
}
function hr2(e) {
  return pr2(e), { type: k2, parts: e };
}
function gr2(e, t7 = "", r = {}) {
  return K2(e), t7 !== "" && K2(t7), { type: _2, breakContents: e, flatContents: t7, groupId: r.groupId };
}
function yr2(e, t7) {
  return K2(e), { type: v2, contents: e, groupId: t7.groupId, negate: t7.negate };
}
function Se2(e) {
  return K2(e), { type: L2, contents: e };
}
var Ar2 = { type: I };
var pe2 = { type: w2 };
var Br2 = { type: P2 };
var Te2 = { type: g, hard: true };
var Bt2 = { type: g, hard: true, literal: true };
var Me2 = { type: g };
var _r2 = { type: g, soft: true };
var z2 = [Te2, pe2];
var We = [Bt2, pe2];
var X2 = { type: j2 };
function ke2(e, t7) {
  K2(e), yt2(t7);
  let r = [];
  for (let n = 0;n < t7.length; n++)
    n !== 0 && r.push(e), r.push(t7[n]);
  return r;
}
function Ge3(e, t7, r) {
  K2(e);
  let n = e;
  if (t7 > 0) {
    for (let u = 0;u < Math.floor(t7 / r); ++u)
      n = ie2(n);
    n = oe(t7 % r, n), n = oe(Number.NEGATIVE_INFINITY, n);
  }
  return n;
}
function xr2(e, t7) {
  return K2(t7), e ? { type: S2, label: e, contents: t7 } : t7;
}
function Q2(e) {
  var t7;
  if (!e)
    return "";
  if (Array.isArray(e)) {
    let r = [];
    for (let n of e)
      if (Array.isArray(n))
        r.push(...Q2(n));
      else {
        let u = Q2(n);
        u !== "" && r.push(u);
      }
    return r;
  }
  return e.type === _2 ? { ...e, breakContents: Q2(e.breakContents), flatContents: Q2(e.flatContents) } : e.type === B2 ? { ...e, contents: Q2(e.contents), expandedStates: (t7 = e.expandedStates) == null ? undefined : t7.map(Q2) } : e.type === k2 ? { type: "fill", parts: e.parts.map(Q2) } : e.contents ? { ...e, contents: Q2(e.contents) } : e;
}
function wr2(e) {
  let t7 = Object.create(null), r = new Set;
  return n(Q2(e));
  function n(o, i, s) {
    var a, c;
    if (typeof o == "string")
      return JSON.stringify(o);
    if (Array.isArray(o)) {
      let D = o.map(n).filter(Boolean);
      return D.length === 1 ? D[0] : `[${D.join(", ")}]`;
    }
    if (o.type === g) {
      let D = ((a = s == null ? undefined : s[i + 1]) == null ? undefined : a.type) === w2;
      return o.literal ? D ? "literalline" : "literallineWithoutBreakParent" : o.hard ? D ? "hardline" : "hardlineWithoutBreakParent" : o.soft ? "softline" : "line";
    }
    if (o.type === w2)
      return ((c = s == null ? undefined : s[i - 1]) == null ? undefined : c.type) === g && s[i - 1].hard ? undefined : "breakParent";
    if (o.type === P2)
      return "trim";
    if (o.type === N2)
      return "indent(" + n(o.contents) + ")";
    if (o.type === O2)
      return o.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + n(o.contents) + ")" : o.n < 0 ? "dedent(" + n(o.contents) + ")" : o.n.type === "root" ? "markAsRoot(" + n(o.contents) + ")" : "align(" + JSON.stringify(o.n) + ", " + n(o.contents) + ")";
    if (o.type === _2)
      return "ifBreak(" + n(o.breakContents) + (o.flatContents ? ", " + n(o.flatContents) : "") + (o.groupId ? (o.flatContents ? "" : ', ""') + `, { groupId: ${u(o.groupId)} }` : "") + ")";
    if (o.type === v2) {
      let D = [];
      o.negate && D.push("negate: true"), o.groupId && D.push(`groupId: ${u(o.groupId)}`);
      let p = D.length > 0 ? `, { ${D.join(", ")} }` : "";
      return `indentIfBreak(${n(o.contents)}${p})`;
    }
    if (o.type === B2) {
      let D = [];
      o.break && o.break !== "propagated" && D.push("shouldBreak: true"), o.id && D.push(`id: ${u(o.id)}`);
      let p = D.length > 0 ? `, { ${D.join(", ")} }` : "";
      return o.expandedStates ? `conditionalGroup([${o.expandedStates.map((l) => n(l)).join(",")}]${p})` : `group(${n(o.contents)}${p})`;
    }
    if (o.type === k2)
      return `fill([${o.parts.map((D) => n(D)).join(", ")}])`;
    if (o.type === L2)
      return "lineSuffix(" + n(o.contents) + ")";
    if (o.type === I)
      return "lineSuffixBoundary";
    if (o.type === S2)
      return `label(${JSON.stringify(o.label)}, ${n(o.contents)})`;
    if (o.type === j2)
      return "cursor";
    throw new Error("Unknown doc type " + o.type);
  }
  function u(o) {
    if (typeof o != "symbol")
      return JSON.stringify(String(o));
    if (o in t7)
      return t7[o];
    let i = o.description || "symbol";
    for (let s = 0;; s++) {
      let a = i + (s > 0 ? ` #${s}` : "");
      if (!r.has(a))
        return r.add(a), t7[o] = `Symbol.for(${JSON.stringify(a)})`;
    }
  }
}
var br2 = () => /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
function kr2(e) {
  return e === 12288 || e >= 65281 && e <= 65376 || e >= 65504 && e <= 65510;
}
function Sr2(e) {
  return e >= 4352 && e <= 4447 || e === 8986 || e === 8987 || e === 9001 || e === 9002 || e >= 9193 && e <= 9196 || e === 9200 || e === 9203 || e === 9725 || e === 9726 || e === 9748 || e === 9749 || e >= 9776 && e <= 9783 || e >= 9800 && e <= 9811 || e === 9855 || e >= 9866 && e <= 9871 || e === 9875 || e === 9889 || e === 9898 || e === 9899 || e === 9917 || e === 9918 || e === 9924 || e === 9925 || e === 9934 || e === 9940 || e === 9962 || e === 9970 || e === 9971 || e === 9973 || e === 9978 || e === 9981 || e === 9989 || e === 9994 || e === 9995 || e === 10024 || e === 10060 || e === 10062 || e >= 10067 && e <= 10069 || e === 10071 || e >= 10133 && e <= 10135 || e === 10160 || e === 10175 || e === 11035 || e === 11036 || e === 11088 || e === 11093 || e >= 11904 && e <= 11929 || e >= 11931 && e <= 12019 || e >= 12032 && e <= 12245 || e >= 12272 && e <= 12287 || e >= 12289 && e <= 12350 || e >= 12353 && e <= 12438 || e >= 12441 && e <= 12543 || e >= 12549 && e <= 12591 || e >= 12593 && e <= 12686 || e >= 12688 && e <= 12773 || e >= 12783 && e <= 12830 || e >= 12832 && e <= 12871 || e >= 12880 && e <= 42124 || e >= 42128 && e <= 42182 || e >= 43360 && e <= 43388 || e >= 44032 && e <= 55203 || e >= 63744 && e <= 64255 || e >= 65040 && e <= 65049 || e >= 65072 && e <= 65106 || e >= 65108 && e <= 65126 || e >= 65128 && e <= 65131 || e >= 94176 && e <= 94180 || e === 94192 || e === 94193 || e >= 94208 && e <= 100343 || e >= 100352 && e <= 101589 || e >= 101631 && e <= 101640 || e >= 110576 && e <= 110579 || e >= 110581 && e <= 110587 || e === 110589 || e === 110590 || e >= 110592 && e <= 110882 || e === 110898 || e >= 110928 && e <= 110930 || e === 110933 || e >= 110948 && e <= 110951 || e >= 110960 && e <= 111355 || e >= 119552 && e <= 119638 || e >= 119648 && e <= 119670 || e === 126980 || e === 127183 || e === 127374 || e >= 127377 && e <= 127386 || e >= 127488 && e <= 127490 || e >= 127504 && e <= 127547 || e >= 127552 && e <= 127560 || e === 127568 || e === 127569 || e >= 127584 && e <= 127589 || e >= 127744 && e <= 127776 || e >= 127789 && e <= 127797 || e >= 127799 && e <= 127868 || e >= 127870 && e <= 127891 || e >= 127904 && e <= 127946 || e >= 127951 && e <= 127955 || e >= 127968 && e <= 127984 || e === 127988 || e >= 127992 && e <= 128062 || e === 128064 || e >= 128066 && e <= 128252 || e >= 128255 && e <= 128317 || e >= 128331 && e <= 128334 || e >= 128336 && e <= 128359 || e === 128378 || e === 128405 || e === 128406 || e === 128420 || e >= 128507 && e <= 128591 || e >= 128640 && e <= 128709 || e === 128716 || e >= 128720 && e <= 128722 || e >= 128725 && e <= 128727 || e >= 128732 && e <= 128735 || e === 128747 || e === 128748 || e >= 128756 && e <= 128764 || e >= 128992 && e <= 129003 || e === 129008 || e >= 129292 && e <= 129338 || e >= 129340 && e <= 129349 || e >= 129351 && e <= 129535 || e >= 129648 && e <= 129660 || e >= 129664 && e <= 129673 || e >= 129679 && e <= 129734 || e >= 129742 && e <= 129756 || e >= 129759 && e <= 129769 || e >= 129776 && e <= 129784 || e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141;
}
var Tr2 = (e) => !(kr2(e) || Sr2(e));
var Pu = /[^\x20-\x7F]/u;
function vu(e) {
  if (!e)
    return 0;
  if (!Pu.test(e))
    return e.length;
  e = e.replace(br2(), "  ");
  let t7 = 0;
  for (let r of e) {
    let n = r.codePointAt(0);
    n <= 31 || n >= 127 && n <= 159 || n >= 768 && n <= 879 || (t7 += Tr2(n) ? 1 : 2);
  }
  return t7;
}
var Ne2 = vu;
var R2 = Symbol("MODE_BREAK");
var H2 = Symbol("MODE_FLAT");
var de2 = Symbol("cursor");
var _t2 = Symbol("DOC_FILL_PRINTED_LENGTH");
function Nr2() {
  return { value: "", length: 0, queue: [] };
}
function Lu(e, t7) {
  return xt2(e, { type: "indent" }, t7);
}
function Iu(e, t7, r) {
  return t7 === Number.NEGATIVE_INFINITY ? e.root || Nr2() : t7 < 0 ? xt2(e, { type: "dedent" }, r) : t7 ? t7.type === "root" ? { ...e, root: e } : xt2(e, { type: typeof t7 == "string" ? "stringAlign" : "numberAlign", n: t7 }, r) : e;
}
function xt2(e, t7, r) {
  let n = t7.type === "dedent" ? e.queue.slice(0, -1) : [...e.queue, t7], u = "", o = 0, i = 0, s = 0;
  for (let f of n)
    switch (f.type) {
      case "indent":
        D(), r.useTabs ? a(1) : c(r.tabWidth);
        break;
      case "stringAlign":
        D(), u += f.n, o += f.n.length;
        break;
      case "numberAlign":
        i += 1, s += f.n;
        break;
      default:
        throw new Error(`Unexpected type '${f.type}'`);
    }
  return l(), { ...e, value: u, length: o, queue: n };
  function a(f) {
    u += "\t".repeat(f), o += r.tabWidth * f;
  }
  function c(f) {
    u += " ".repeat(f), o += f;
  }
  function D() {
    r.useTabs ? p() : l();
  }
  function p() {
    i > 0 && a(i), F();
  }
  function l() {
    s > 0 && c(s), F();
  }
  function F() {
    i = 0, s = 0;
  }
}
function wt2(e) {
  let t7 = 0, r = 0, n = e.length;
  e:
    for (;n--; ) {
      let u = e[n];
      if (u === de2) {
        r++;
        continue;
      }
      for (let o = u.length - 1;o >= 0; o--) {
        let i = u[o];
        if (i === " " || i === "\t")
          t7++;
        else {
          e[n] = u.slice(0, o + 1);
          break e;
        }
      }
    }
  if (t7 > 0 || r > 0)
    for (e.length = n + 1;r-- > 0; )
      e.push(de2);
  return t7;
}
function Ke2(e, t7, r, n, u, o) {
  if (r === Number.POSITIVE_INFINITY)
    return true;
  let i = t7.length, s = [e], a = [];
  for (;r >= 0; ) {
    if (s.length === 0) {
      if (i === 0)
        return true;
      s.push(t7[--i]);
      continue;
    }
    let { mode: c, doc: D } = s.pop(), p = M(D);
    switch (p) {
      case W2:
        a.push(D), r -= Ne2(D);
        break;
      case Y2:
      case k2: {
        let l = p === Y2 ? D : D.parts, F = D[_t2] ?? 0;
        for (let f = l.length - 1;f >= F; f--)
          s.push({ mode: c, doc: l[f] });
        break;
      }
      case N2:
      case O2:
      case v2:
      case S2:
        s.push({ mode: c, doc: D.contents });
        break;
      case P2:
        r += wt2(a);
        break;
      case B2: {
        if (o && D.break)
          return false;
        let l = D.break ? R2 : c, F = D.expandedStates && l === R2 ? y(false, D.expandedStates, -1) : D.contents;
        s.push({ mode: l, doc: F });
        break;
      }
      case _2: {
        let F = (D.groupId ? u[D.groupId] || H2 : c) === R2 ? D.breakContents : D.flatContents;
        F && s.push({ mode: c, doc: F });
        break;
      }
      case g:
        if (c === R2 || D.hard)
          return true;
        D.soft || (a.push(" "), r--);
        break;
      case L2:
        n = true;
        break;
      case I:
        if (n)
          return false;
        break;
    }
  }
  return false;
}
function me2(e, t7) {
  let r = {}, n = t7.printWidth, u = xe2(t7.endOfLine), o = 0, i = [{ ind: Nr2(), mode: R2, doc: e }], s = [], a = false, c = [], D = 0;
  for (cr2(e);i.length > 0; ) {
    let { ind: l, mode: F, doc: f } = i.pop();
    switch (M(f)) {
      case W2: {
        let d2 = u !== `
` ? te(false, f, `
`, u) : f;
        s.push(d2), i.length > 0 && (o += Ne2(d2));
        break;
      }
      case Y2:
        for (let d2 = f.length - 1;d2 >= 0; d2--)
          i.push({ ind: l, mode: F, doc: f[d2] });
        break;
      case j2:
        if (D >= 2)
          throw new Error("There are too many 'cursor' in doc.");
        s.push(de2), D++;
        break;
      case N2:
        i.push({ ind: Lu(l, t7), mode: F, doc: f.contents });
        break;
      case O2:
        i.push({ ind: Iu(l, f.n, t7), mode: F, doc: f.contents });
        break;
      case P2:
        o -= wt2(s);
        break;
      case B2:
        switch (F) {
          case H2:
            if (!a) {
              i.push({ ind: l, mode: f.break ? R2 : H2, doc: f.contents });
              break;
            }
          case R2: {
            a = false;
            let d2 = { ind: l, mode: H2, doc: f.contents }, m = n - o, C = c.length > 0;
            if (!f.break && Ke2(d2, i, m, C, r))
              i.push(d2);
            else if (f.expandedStates) {
              let E2 = y(false, f.expandedStates, -1);
              if (f.break) {
                i.push({ ind: l, mode: R2, doc: E2 });
                break;
              } else
                for (let h2 = 1;h2 < f.expandedStates.length + 1; h2++)
                  if (h2 >= f.expandedStates.length) {
                    i.push({ ind: l, mode: R2, doc: E2 });
                    break;
                  } else {
                    let x = f.expandedStates[h2], A = { ind: l, mode: H2, doc: x };
                    if (Ke2(A, i, m, C, r)) {
                      i.push(A);
                      break;
                    }
                  }
            } else
              i.push({ ind: l, mode: R2, doc: f.contents });
            break;
          }
        }
        f.id && (r[f.id] = y(false, i, -1).mode);
        break;
      case k2: {
        let d2 = n - o, m = f[_t2] ?? 0, { parts: C } = f, E2 = C.length - m;
        if (E2 === 0)
          break;
        let h2 = C[m + 0], x = C[m + 1], A = { ind: l, mode: H2, doc: h2 }, $2 = { ind: l, mode: R2, doc: h2 }, ue = Ke2(A, [], d2, c.length > 0, r, true);
        if (E2 === 1) {
          ue ? i.push(A) : i.push($2);
          break;
        }
        let Be2 = { ind: l, mode: H2, doc: x }, lt2 = { ind: l, mode: R2, doc: x };
        if (E2 === 2) {
          ue ? i.push(Be2, A) : i.push(lt2, $2);
          break;
        }
        let lu = C[m + 2], Ft2 = { ind: l, mode: F, doc: { ...f, [_t2]: m + 2 } };
        Ke2({ ind: l, mode: H2, doc: [h2, x, lu] }, [], d2, c.length > 0, r, true) ? i.push(Ft2, Be2, A) : ue ? i.push(Ft2, lt2, A) : i.push(Ft2, lt2, $2);
        break;
      }
      case _2:
      case v2: {
        let d2 = f.groupId ? r[f.groupId] : F;
        if (d2 === R2) {
          let m = f.type === _2 ? f.breakContents : f.negate ? f.contents : ie2(f.contents);
          m && i.push({ ind: l, mode: F, doc: m });
        }
        if (d2 === H2) {
          let m = f.type === _2 ? f.flatContents : f.negate ? ie2(f.contents) : f.contents;
          m && i.push({ ind: l, mode: F, doc: m });
        }
        break;
      }
      case L2:
        c.push({ ind: l, mode: F, doc: f.contents });
        break;
      case I:
        c.length > 0 && i.push({ ind: l, mode: F, doc: Te2 });
        break;
      case g:
        switch (F) {
          case H2:
            if (f.hard)
              a = true;
            else {
              f.soft || (s.push(" "), o += 1);
              break;
            }
          case R2:
            if (c.length > 0) {
              i.push({ ind: l, mode: F, doc: f }, ...c.reverse()), c.length = 0;
              break;
            }
            f.literal ? l.root ? (s.push(u, l.root.value), o = l.root.length) : (s.push(u), o = 0) : (o -= wt2(s), s.push(u + l.value), o = l.length);
            break;
        }
        break;
      case S2:
        i.push({ ind: l, mode: F, doc: f.contents });
        break;
      case w2:
        break;
      default:
        throw new q(f);
    }
    i.length === 0 && c.length > 0 && (i.push(...c.reverse()), c.length = 0);
  }
  let p = s.indexOf(de2);
  if (p !== -1) {
    let l = s.indexOf(de2, p + 1);
    if (l === -1)
      return { formatted: s.filter((m) => m !== de2).join("") };
    let F = s.slice(0, p).join(""), f = s.slice(p + 1, l).join(""), d2 = s.slice(l + 1).join("");
    return { formatted: F + f + d2, cursorNodeStart: F.length, cursorNodeText: f };
  }
  return { formatted: s.join("") };
}
function Ru(e, t7, r = 0) {
  let n = 0;
  for (let u = r;u < e.length; ++u)
    e[u] === "\t" ? n = n + t7 - n % t7 : n++;
  return n;
}
var Ee2 = Ru;
var Z2;
var kt2;
var ze2;
var bt2 = class {
  constructor(t7) {
    tr(this, Z2);
    this.stack = [t7];
  }
  get key() {
    let { stack: t7, siblings: r } = this;
    return y(false, t7, r === null ? -2 : -4) ?? null;
  }
  get index() {
    return this.siblings === null ? null : y(false, this.stack, -2);
  }
  get node() {
    return y(false, this.stack, -1);
  }
  get parent() {
    return this.getNode(1);
  }
  get grandparent() {
    return this.getNode(2);
  }
  get isInArray() {
    return this.siblings !== null;
  }
  get siblings() {
    let { stack: t7 } = this, r = y(false, t7, -3);
    return Array.isArray(r) ? r : null;
  }
  get next() {
    let { siblings: t7 } = this;
    return t7 === null ? null : t7[this.index + 1];
  }
  get previous() {
    let { siblings: t7 } = this;
    return t7 === null ? null : t7[this.index - 1];
  }
  get isFirst() {
    return this.index === 0;
  }
  get isLast() {
    let { siblings: t7, index: r } = this;
    return t7 !== null && r === t7.length - 1;
  }
  get isRoot() {
    return this.stack.length === 1;
  }
  get root() {
    return this.stack[0];
  }
  get ancestors() {
    return [...fe2(this, Z2, ze2).call(this)];
  }
  getName() {
    let { stack: t7 } = this, { length: r } = t7;
    return r > 1 ? y(false, t7, -2) : null;
  }
  getValue() {
    return y(false, this.stack, -1);
  }
  getNode(t7 = 0) {
    let r = fe2(this, Z2, kt2).call(this, t7);
    return r === -1 ? null : this.stack[r];
  }
  getParentNode(t7 = 0) {
    return this.getNode(t7 + 1);
  }
  call(t7, ...r) {
    let { stack: n } = this, { length: u } = n, o = y(false, n, -1);
    for (let i of r)
      o = o[i], n.push(i, o);
    try {
      return t7(this);
    } finally {
      n.length = u;
    }
  }
  callParent(t7, r = 0) {
    let n = fe2(this, Z2, kt2).call(this, r + 1), u = this.stack.splice(n + 1);
    try {
      return t7(this);
    } finally {
      this.stack.push(...u);
    }
  }
  each(t7, ...r) {
    let { stack: n } = this, { length: u } = n, o = y(false, n, -1);
    for (let i of r)
      o = o[i], n.push(i, o);
    try {
      for (let i = 0;i < o.length; ++i)
        n.push(i, o[i]), t7(this, i, o), n.length -= 2;
    } finally {
      n.length = u;
    }
  }
  map(t7, ...r) {
    let n = [];
    return this.each((u, o, i) => {
      n[o] = t7(u, o, i);
    }, ...r), n;
  }
  match(...t7) {
    let r = this.stack.length - 1, n = null, u = this.stack[r--];
    for (let o of t7) {
      if (u === undefined)
        return false;
      let i = null;
      if (typeof n == "number" && (i = n, n = this.stack[r--], u = this.stack[r--]), o && !o(u, n, i))
        return false;
      n = this.stack[r--], u = this.stack[r--];
    }
    return true;
  }
  findAncestor(t7) {
    for (let r of fe2(this, Z2, ze2).call(this))
      if (t7(r))
        return r;
  }
  hasAncestor(t7) {
    for (let r of fe2(this, Z2, ze2).call(this))
      if (t7(r))
        return true;
    return false;
  }
};
Z2 = new WeakSet, kt2 = function(t7) {
  let { stack: r } = this;
  for (let n = r.length - 1;n >= 0; n -= 2)
    if (!Array.isArray(r[n]) && --t7 < 0)
      return n;
  return -1;
}, ze2 = function* () {
  let { stack: t7 } = this;
  for (let r = t7.length - 3;r >= 0; r -= 2) {
    let n = t7[r];
    Array.isArray(n) || (yield n);
  }
};
var Or2 = bt2;
var Pr2 = new Proxy(() => {}, { get: () => Pr2 });
var Oe2 = Pr2;
function Yu(e) {
  return e !== null && typeof e == "object";
}
var vr2 = Yu;
function* Ce2(e, t7) {
  let { getVisitorKeys: r, filter: n = () => true } = t7, u = (o) => vr2(o) && n(o);
  for (let o of r(e)) {
    let i = e[o];
    if (Array.isArray(i))
      for (let s of i)
        u(s) && (yield s);
    else
      u(i) && (yield i);
  }
}
function* Lr2(e, t7) {
  let r = [e];
  for (let n = 0;n < r.length; n++) {
    let u = r[n];
    for (let o of Ce2(u, t7))
      yield o, r.push(o);
  }
}
function Ir2(e, t7) {
  return Ce2(e, t7).next().done;
}
function he2(e) {
  return (t7, r, n) => {
    let u = !!(n != null && n.backwards);
    if (r === false)
      return false;
    let { length: o } = t7, i = r;
    for (;i >= 0 && i < o; ) {
      let s = t7.charAt(i);
      if (e instanceof RegExp) {
        if (!e.test(s))
          return i;
      } else if (!e.includes(s))
        return i;
      u ? i-- : i++;
    }
    return i === -1 || i === o ? i : false;
  };
}
var Rr2 = he2(/\s/u);
var T2 = he2(" \t");
var He2 = he2(",; \t");
var Je2 = he2(/[^\n\r]/u);
function ju(e, t7, r) {
  let n = !!(r != null && r.backwards);
  if (t7 === false)
    return false;
  let u = e.charAt(t7);
  if (n) {
    if (e.charAt(t7 - 1) === "\r" && u === `
`)
      return t7 - 2;
    if (u === `
` || u === "\r" || u === "\u2028" || u === "\u2029")
      return t7 - 1;
  } else {
    if (u === "\r" && e.charAt(t7 + 1) === `
`)
      return t7 + 2;
    if (u === `
` || u === "\r" || u === "\u2028" || u === "\u2029")
      return t7 + 1;
  }
  return t7;
}
var U = ju;
function Uu(e, t7, r = {}) {
  let n = T2(e, r.backwards ? t7 - 1 : t7, r), u = U(e, n, r);
  return n !== u;
}
var G2 = Uu;
function Vu(e) {
  return Array.isArray(e) && e.length > 0;
}
var qe2 = Vu;
var Yr = new Set(["tokens", "comments", "parent", "enclosingNode", "precedingNode", "followingNode"]);
var $u = (e) => Object.keys(e).filter((t7) => !Yr.has(t7));
function Wu(e) {
  return e ? (t7) => e(t7, Yr) : $u;
}
var J2 = Wu;
function Mu(e) {
  let t7 = e.type || e.kind || "(unknown type)", r = String(e.name || e.id && (typeof e.id == "object" ? e.id.name : e.id) || e.key && (typeof e.key == "object" ? e.key.name : e.key) || e.value && (typeof e.value == "object" ? "" : String(e.value)) || e.operator || "");
  return r.length > 20 && (r = r.slice(0, 19) + "…"), t7 + (r ? " " + r : "");
}
function St2(e, t7) {
  (e.comments ?? (e.comments = [])).push(t7), t7.printed = false, t7.nodeDescription = Mu(e);
}
function se2(e, t7) {
  t7.leading = true, t7.trailing = false, St2(e, t7);
}
function ee2(e, t7, r) {
  t7.leading = false, t7.trailing = false, r && (t7.marker = r), St2(e, t7);
}
function ae2(e, t7) {
  t7.leading = false, t7.trailing = true, St2(e, t7);
}
var Tt2 = new WeakMap;
function Xe2(e, t7) {
  if (Tt2.has(e))
    return Tt2.get(e);
  let { printer: { getCommentChildNodes: r, canAttachComment: n, getVisitorKeys: u }, locStart: o, locEnd: i } = t7;
  if (!n)
    return [];
  let s = ((r == null ? undefined : r(e, t7)) ?? [...Ce2(e, { getVisitorKeys: J2(u) })]).flatMap((a) => n(a) ? [a] : Xe2(a, t7));
  return s.sort((a, c) => o(a) - o(c) || i(a) - i(c)), Tt2.set(e, s), s;
}
function Ur2(e, t7, r, n) {
  let { locStart: u, locEnd: o } = r, i = u(t7), s = o(t7), a = Xe2(e, r), c, D, p = 0, l = a.length;
  for (;p < l; ) {
    let F = p + l >> 1, f = a[F], d2 = u(f), m = o(f);
    if (d2 <= i && s <= m)
      return Ur2(f, t7, r, f);
    if (m <= i) {
      c = f, p = F + 1;
      continue;
    }
    if (s <= d2) {
      D = f, l = F;
      continue;
    }
    throw new Error("Comment location overlaps with node location");
  }
  if ((n == null ? undefined : n.type) === "TemplateLiteral") {
    let { quasis: F } = n, f = Ot2(F, t7, r);
    c && Ot2(F, c, r) !== f && (c = null), D && Ot2(F, D, r) !== f && (D = null);
  }
  return { enclosingNode: n, precedingNode: c, followingNode: D };
}
var Nt2 = () => false;
function Vr(e, t7) {
  let { comments: r } = e;
  if (delete e.comments, !qe2(r) || !t7.printer.canAttachComment)
    return;
  let n = [], { printer: { experimentalFeatures: { avoidAstMutation: u = false } = {}, handleComments: o = {} }, originalText: i } = t7, { ownLine: s = Nt2, endOfLine: a = Nt2, remaining: c = Nt2 } = o, D = r.map((p, l) => ({ ...Ur2(e, p, t7), comment: p, text: i, options: t7, ast: e, isLastComment: r.length - 1 === l }));
  for (let [p, l] of D.entries()) {
    let { comment: F, precedingNode: f, enclosingNode: d2, followingNode: m, text: C, options: E2, ast: h2, isLastComment: x } = l, A;
    if (u ? A = [l] : (F.enclosingNode = d2, F.precedingNode = f, F.followingNode = m, A = [F, C, E2, h2, x]), Gu(C, E2, D, p))
      F.placement = "ownLine", s(...A) || (m ? se2(m, F) : f ? ae2(f, F) : d2 ? ee2(d2, F) : ee2(h2, F));
    else if (Ku(C, E2, D, p))
      F.placement = "endOfLine", a(...A) || (f ? ae2(f, F) : m ? se2(m, F) : d2 ? ee2(d2, F) : ee2(h2, F));
    else if (F.placement = "remaining", !c(...A))
      if (f && m) {
        let $2 = n.length;
        $2 > 0 && n[$2 - 1].followingNode !== m && jr2(n, E2), n.push(l);
      } else
        f ? ae2(f, F) : m ? se2(m, F) : d2 ? ee2(d2, F) : ee2(h2, F);
  }
  if (jr2(n, t7), !u)
    for (let p of r)
      delete p.precedingNode, delete p.enclosingNode, delete p.followingNode;
}
var $r2 = (e) => !/[\S\n\u2028\u2029]/u.test(e);
function Gu(e, t7, r, n) {
  let { comment: u, precedingNode: o } = r[n], { locStart: i, locEnd: s } = t7, a = i(u);
  if (o)
    for (let c = n - 1;c >= 0; c--) {
      let { comment: D, precedingNode: p } = r[c];
      if (p !== o || !$r2(e.slice(s(D), a)))
        break;
      a = i(D);
    }
  return G2(e, a, { backwards: true });
}
function Ku(e, t7, r, n) {
  let { comment: u, followingNode: o } = r[n], { locStart: i, locEnd: s } = t7, a = s(u);
  if (o)
    for (let c = n + 1;c < r.length; c++) {
      let { comment: D, followingNode: p } = r[c];
      if (p !== o || !$r2(e.slice(a, i(D))))
        break;
      a = s(D);
    }
  return G2(e, a);
}
function jr2(e, t7) {
  var s, a;
  let r = e.length;
  if (r === 0)
    return;
  let { precedingNode: n, followingNode: u } = e[0], o = t7.locStart(u), i;
  for (i = r;i > 0; --i) {
    let { comment: c, precedingNode: D, followingNode: p } = e[i - 1];
    Oe2.strictEqual(D, n), Oe2.strictEqual(p, u);
    let l = t7.originalText.slice(t7.locEnd(c), o);
    if (((a = (s = t7.printer).isGap) == null ? undefined : a.call(s, l, t7)) ?? /^[\s(]*$/u.test(l))
      o = t7.locStart(c);
    else
      break;
  }
  for (let [c, { comment: D }] of e.entries())
    c < i ? ae2(n, D) : se2(u, D);
  for (let c of [n, u])
    c.comments && c.comments.length > 1 && c.comments.sort((D, p) => t7.locStart(D) - t7.locStart(p));
  e.length = 0;
}
function Ot2(e, t7, r) {
  let n = r.locStart(t7) - 1;
  for (let u = 1;u < e.length; ++u)
    if (n < r.locStart(e[u]))
      return u - 1;
  return 0;
}
function zu(e, t7) {
  let r = t7 - 1;
  r = T2(e, r, { backwards: true }), r = U(e, r, { backwards: true }), r = T2(e, r, { backwards: true });
  let n = U(e, r, { backwards: true });
  return r !== n;
}
var Pe2 = zu;
function Wr2(e, t7) {
  let r = e.node;
  return r.printed = true, t7.printer.printComment(e, t7);
}
function Hu(e, t7) {
  var D;
  let r = e.node, n = [Wr2(e, t7)], { printer: u, originalText: o, locStart: i, locEnd: s } = t7;
  if ((D = u.isBlockComment) == null ? undefined : D.call(u, r)) {
    let p = G2(o, s(r)) ? G2(o, i(r), { backwards: true }) ? z2 : Me2 : " ";
    n.push(p);
  } else
    n.push(z2);
  let c = U(o, T2(o, s(r)));
  return c !== false && G2(o, c) && n.push(z2), n;
}
function Ju(e, t7, r) {
  var c;
  let n = e.node, u = Wr2(e, t7), { printer: o, originalText: i, locStart: s } = t7, a = (c = o.isBlockComment) == null ? undefined : c.call(o, n);
  if (r != null && r.hasLineSuffix && !(r != null && r.isBlock) || G2(i, s(n), { backwards: true })) {
    let D = Pe2(i, s(n));
    return { doc: Se2([z2, D ? z2 : "", u]), isBlock: a, hasLineSuffix: true };
  }
  return !a || r != null && r.hasLineSuffix ? { doc: [Se2([" ", u]), pe2], isBlock: a, hasLineSuffix: true } : { doc: [" ", u], isBlock: a, hasLineSuffix: false };
}
function qu(e, t7) {
  let r = e.node;
  if (!r)
    return {};
  let n = t7[Symbol.for("printedComments")];
  if ((r.comments || []).filter((a) => !n.has(a)).length === 0)
    return { leading: "", trailing: "" };
  let o = [], i = [], s;
  return e.each(() => {
    let a = e.node;
    if (n != null && n.has(a))
      return;
    let { leading: c, trailing: D } = a;
    c ? o.push(Hu(e, t7)) : D && (s = Ju(e, t7, s), i.push(s.doc));
  }, "comments"), { leading: o, trailing: i };
}
function Mr(e, t7, r) {
  let { leading: n, trailing: u } = qu(e, r);
  return !n && !u ? t7 : Fe2(t7, (o) => [n, o, u]);
}
function Gr2(e) {
  let { [Symbol.for("comments")]: t7, [Symbol.for("printedComments")]: r } = e;
  for (let n of t7) {
    if (!n.printed && !r.has(n))
      throw new Error('Comment "' + n.value.trim() + '" was not printed. Please report this error!');
    delete n.printed;
  }
}
function Xu(e) {
  return () => {};
}
var Kr2 = Xu;
var ve2 = class extends Error {
  name = "ConfigError";
};
var Le2 = class extends Error {
  name = "UndefinedParserError";
};
var zr = { checkIgnorePragma: { category: "Special", type: "boolean", default: false, description: "Check whether the file's first docblock comment contains '@noprettier' or '@noformat' to determine if it should be formatted.", cliCategory: "Other" }, cursorOffset: { category: "Special", type: "int", default: -1, range: { start: -1, end: 1 / 0, step: 1 }, description: "Print (to stderr) where a cursor at the given position would move to after formatting.", cliCategory: "Editor" }, endOfLine: { category: "Global", type: "choice", default: "lf", description: "Which end of line characters to apply.", choices: [{ value: "lf", description: "Line Feed only (\\n), common on Linux and macOS as well as inside git repos" }, { value: "crlf", description: "Carriage Return + Line Feed characters (\\r\\n), common on Windows" }, { value: "cr", description: "Carriage Return character only (\\r), used very rarely" }, { value: "auto", description: `Maintain existing
(mixed values within one file are normalised by looking at what's used after the first line)` }] }, filepath: { category: "Special", type: "path", description: "Specify the input filepath. This will be used to do parser inference.", cliName: "stdin-filepath", cliCategory: "Other", cliDescription: "Path to the file to pretend that stdin comes from." }, insertPragma: { category: "Special", type: "boolean", default: false, description: "Insert @format pragma into file's first docblock comment.", cliCategory: "Other" }, parser: { category: "Global", type: "choice", default: undefined, description: "Which parser to use.", exception: (e) => typeof e == "string" || typeof e == "function", choices: [{ value: "flow", description: "Flow" }, { value: "babel", description: "JavaScript" }, { value: "babel-flow", description: "Flow" }, { value: "babel-ts", description: "TypeScript" }, { value: "typescript", description: "TypeScript" }, { value: "acorn", description: "JavaScript" }, { value: "espree", description: "JavaScript" }, { value: "meriyah", description: "JavaScript" }, { value: "css", description: "CSS" }, { value: "less", description: "Less" }, { value: "scss", description: "SCSS" }, { value: "json", description: "JSON" }, { value: "json5", description: "JSON5" }, { value: "jsonc", description: "JSON with Comments" }, { value: "json-stringify", description: "JSON.stringify" }, { value: "graphql", description: "GraphQL" }, { value: "markdown", description: "Markdown" }, { value: "mdx", description: "MDX" }, { value: "vue", description: "Vue" }, { value: "yaml", description: "YAML" }, { value: "glimmer", description: "Ember / Handlebars" }, { value: "html", description: "HTML" }, { value: "angular", description: "Angular" }, { value: "lwc", description: "Lightning Web Components" }, { value: "mjml", description: "MJML" }] }, plugins: { type: "path", array: true, default: [{ value: [] }], category: "Global", description: "Add a plugin. Multiple plugins can be passed as separate `--plugin`s.", exception: (e) => typeof e == "string" || typeof e == "object", cliName: "plugin", cliCategory: "Config" }, printWidth: { category: "Global", type: "int", default: 80, description: "The line length where Prettier will try wrap.", range: { start: 0, end: 1 / 0, step: 1 } }, rangeEnd: { category: "Special", type: "int", default: 1 / 0, range: { start: 0, end: 1 / 0, step: 1 }, description: `Format code ending at a given character offset (exclusive).
The range will extend forwards to the end of the selected statement.`, cliCategory: "Editor" }, rangeStart: { category: "Special", type: "int", default: 0, range: { start: 0, end: 1 / 0, step: 1 }, description: `Format code starting at a given character offset.
The range will extend backwards to the start of the first line containing the selected statement.`, cliCategory: "Editor" }, requirePragma: { category: "Special", type: "boolean", default: false, description: "Require either '@prettier' or '@format' to be present in the file's first docblock comment in order for it to be formatted.", cliCategory: "Other" }, tabWidth: { type: "int", category: "Global", default: 2, description: "Number of spaces per indentation level.", range: { start: 0, end: 1 / 0, step: 1 } }, useTabs: { category: "Global", type: "boolean", default: false, description: "Indent with tabs instead of spaces." }, embeddedLanguageFormatting: { category: "Global", type: "choice", default: "auto", description: "Control how Prettier formats quoted code embedded in the file.", choices: [{ value: "auto", description: "Format embedded code if Prettier can automatically identify it." }, { value: "off", description: "Never automatically format embedded code." }] } };
function Qe2({ plugins: e = [], showDeprecated: t7 = false } = {}) {
  let r = e.flatMap((u) => u.languages ?? []), n = [];
  for (let u of Zu(Object.assign({}, ...e.map(({ options: o }) => o), zr)))
    !t7 && u.deprecated || (Array.isArray(u.choices) && (t7 || (u.choices = u.choices.filter((o) => !o.deprecated)), u.name === "parser" && (u.choices = [...u.choices, ...Qu(u.choices, r, e)])), u.pluginDefaults = Object.fromEntries(e.filter((o) => {
      var i;
      return ((i = o.defaultOptions) == null ? undefined : i[u.name]) !== undefined;
    }).map((o) => [o.name, o.defaultOptions[u.name]])), n.push(u));
  return { languages: r, options: n };
}
function* Qu(e, t7, r) {
  let n = new Set(e.map((u) => u.value));
  for (let u of t7)
    if (u.parsers) {
      for (let o of u.parsers)
        if (!n.has(o)) {
          n.add(o);
          let i = r.find((a) => a.parsers && Object.prototype.hasOwnProperty.call(a.parsers, o)), s = u.name;
          i != null && i.name && (s += ` (plugin: ${i.name})`), yield { value: o, description: s };
        }
    }
}
function Zu(e) {
  let t7 = [];
  for (let [r, n] of Object.entries(e)) {
    let u = { name: r, ...n };
    Array.isArray(u.default) && (u.default = y(false, u.default, -1).value), t7.push(u);
  }
  return t7;
}
var eo2 = (e, t7) => {
  if (!(e && t7 == null))
    return t7.toReversed || !Array.isArray(t7) ? t7.toReversed() : [...t7].reverse();
};
var Hr = eo2;
var Jr2;
var qr;
var Xr2;
var Qr2;
var Zr2;
var to2 = ((Jr2 = globalThis.Deno) == null ? undefined : Jr2.build.os) === "windows" || ((Xr2 = (qr = globalThis.navigator) == null ? undefined : qr.platform) == null ? undefined : Xr2.startsWith("Win")) || ((Zr2 = (Qr2 = globalThis.process) == null ? undefined : Qr2.platform) == null ? undefined : Zr2.startsWith("win")) || false;
function en2(e) {
  if (e = e instanceof URL ? e : new URL(e), e.protocol !== "file:")
    throw new TypeError(`URL must be a file URL: received "${e.protocol}"`);
  return e;
}
function ro2(e) {
  return e = en2(e), decodeURIComponent(e.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function no2(e) {
  e = en2(e);
  let t7 = decodeURIComponent(e.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
  return e.hostname !== "" && (t7 = `\\\\${e.hostname}${t7}`), t7;
}
function tn2(e) {
  return to2 ? no2(e) : ro2(e);
}
var rn2 = tn2;
var uo2 = (e) => String(e).split(/[/\\]/u).pop();
function nn(e, t7) {
  if (!t7)
    return;
  let r = uo2(t7).toLowerCase();
  return e.find(({ filenames: n }) => n == null ? undefined : n.some((u) => u.toLowerCase() === r)) ?? e.find(({ extensions: n }) => n == null ? undefined : n.some((u) => r.endsWith(u)));
}
function oo2(e, t7) {
  if (t7)
    return e.find(({ name: r }) => r.toLowerCase() === t7) ?? e.find(({ aliases: r }) => r == null ? undefined : r.includes(t7)) ?? e.find(({ extensions: r }) => r == null ? undefined : r.includes(`.${t7}`));
}
function un2(e, t7) {
  if (t7) {
    if (String(t7).startsWith("file:"))
      try {
        t7 = rn2(t7);
      } catch {
        return;
      }
    if (typeof t7 == "string")
      return e.find(({ isSupported: r }) => r == null ? undefined : r({ filepath: t7 }));
  }
}
function io2(e, t7) {
  let r = Hr(false, e.plugins).flatMap((u) => u.languages ?? []), n = oo2(r, t7.language) ?? nn(r, t7.physicalFile) ?? nn(r, t7.file) ?? un2(r, t7.physicalFile) ?? un2(r, t7.file) ?? (t7.physicalFile, undefined);
  return n == null ? undefined : n.parsers[0];
}
var on2 = io2;
var re2 = { key: (e) => /^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(e) ? e : JSON.stringify(e), value(e) {
  if (e === null || typeof e != "object")
    return JSON.stringify(e);
  if (Array.isArray(e))
    return `[${e.map((r) => re2.value(r)).join(", ")}]`;
  let t7 = Object.keys(e);
  return t7.length === 0 ? "{}" : `{ ${t7.map((r) => `${re2.key(r)}: ${re2.value(e[r])}`).join(", ")} }`;
}, pair: ({ key: e, value: t7 }) => re2.value({ [e]: t7 }) };
var sn = new Proxy(String, { get: () => sn });
var V2 = sn;
var an = (e, t7, { descriptor: r }) => {
  let n = [`${V2.yellow(typeof e == "string" ? r.key(e) : r.pair(e))} is deprecated`];
  return t7 && n.push(`we now treat it as ${V2.blue(typeof t7 == "string" ? r.key(t7) : r.pair(t7))}`), n.join("; ") + ".";
};
var Ze2 = Symbol.for("vnopts.VALUE_NOT_EXIST");
var ge2 = Symbol.for("vnopts.VALUE_UNCHANGED");
var Dn2 = " ".repeat(2);
var fn2 = (e, t7, r) => {
  let { text: n, list: u } = r.normalizeExpectedResult(r.schemas[e].expected(r)), o = [];
  return n && o.push(cn2(e, t7, n, r.descriptor)), u && o.push([cn2(e, t7, u.title, r.descriptor)].concat(u.values.map((i) => ln2(i, r.loggerPrintWidth))).join(`
`)), Fn2(o, r.loggerPrintWidth);
};
function cn2(e, t7, r, n) {
  return [`Invalid ${V2.red(n.key(e))} value.`, `Expected ${V2.blue(r)},`, `but received ${t7 === Ze2 ? V2.gray("nothing") : V2.red(n.value(t7))}.`].join(" ");
}
function ln2({ text: e, list: t7 }, r) {
  let n = [];
  return e && n.push(`- ${V2.blue(e)}`), t7 && n.push([`- ${V2.blue(t7.title)}:`].concat(t7.values.map((u) => ln2(u, r - Dn2.length).replace(/^|\n/g, `$&${Dn2}`))).join(`
`)), Fn2(n, r);
}
function Fn2(e, t7) {
  if (e.length === 1)
    return e[0];
  let [r, n] = e, [u, o] = e.map((i) => i.split(`
`, 1)[0].length);
  return u > t7 && u > o ? n : r;
}
var Pt2 = [];
var pn2 = [];
function vt2(e, t7) {
  if (e === t7)
    return 0;
  let r = e;
  e.length > t7.length && (e = t7, t7 = r);
  let n = e.length, u = t7.length;
  for (;n > 0 && e.charCodeAt(~-n) === t7.charCodeAt(~-u); )
    n--, u--;
  let o = 0;
  for (;o < n && e.charCodeAt(o) === t7.charCodeAt(o); )
    o++;
  if (n -= o, u -= o, n === 0)
    return u;
  let i, s, a, c, D = 0, p = 0;
  for (;D < n; )
    pn2[D] = e.charCodeAt(o + D), Pt2[D] = ++D;
  for (;p < u; )
    for (i = t7.charCodeAt(o + p), a = p++, s = p, D = 0;D < n; D++)
      c = i === pn2[D] ? a : a + 1, a = Pt2[D], s = Pt2[D] = a > s ? c > s ? s + 1 : c : c > a ? a + 1 : c;
  return s;
}
var et2 = (e, t7, { descriptor: r, logger: n, schemas: u }) => {
  let o = [`Ignored unknown option ${V2.yellow(r.pair({ key: e, value: t7 }))}.`], i = Object.keys(u).sort().find((s) => vt2(e, s) < 3);
  i && o.push(`Did you mean ${V2.blue(r.key(i))}?`), n.warn(o.join(" "));
};
var so2 = ["default", "expected", "validate", "deprecated", "forward", "redirect", "overlap", "preprocess", "postprocess"];
function ao2(e, t7) {
  let r = new e(t7), n = Object.create(r);
  for (let u of so2)
    u in t7 && (n[u] = Do(t7[u], r, b2.prototype[u].length));
  return n;
}
var b2 = class {
  static create(t7) {
    return ao2(this, t7);
  }
  constructor(t7) {
    this.name = t7.name;
  }
  default(t7) {}
  expected(t7) {
    return "nothing";
  }
  validate(t7, r) {
    return false;
  }
  deprecated(t7, r) {
    return false;
  }
  forward(t7, r) {}
  redirect(t7, r) {}
  overlap(t7, r, n) {
    return t7;
  }
  preprocess(t7, r) {
    return t7;
  }
  postprocess(t7, r) {
    return ge2;
  }
};
function Do(e, t7, r) {
  return typeof e == "function" ? (...n) => e(...n.slice(0, r - 1), t7, ...n.slice(r - 1)) : () => e;
}
var tt2 = class extends b2 {
  constructor(t7) {
    super(t7), this._sourceName = t7.sourceName;
  }
  expected(t7) {
    return t7.schemas[this._sourceName].expected(t7);
  }
  validate(t7, r) {
    return r.schemas[this._sourceName].validate(t7, r);
  }
  redirect(t7, r) {
    return this._sourceName;
  }
};
var rt2 = class extends b2 {
  expected() {
    return "anything";
  }
  validate() {
    return true;
  }
};
var nt2 = class extends b2 {
  constructor({ valueSchema: t7, name: r = t7.name, ...n }) {
    super({ ...n, name: r }), this._valueSchema = t7;
  }
  expected(t7) {
    let { text: r, list: n } = t7.normalizeExpectedResult(this._valueSchema.expected(t7));
    return { text: r && `an array of ${r}`, list: n && { title: "an array of the following values", values: [{ list: n }] } };
  }
  validate(t7, r) {
    if (!Array.isArray(t7))
      return false;
    let n = [];
    for (let u of t7) {
      let o = r.normalizeValidateResult(this._valueSchema.validate(u, r), u);
      o !== true && n.push(o.value);
    }
    return n.length === 0 ? true : { value: n };
  }
  deprecated(t7, r) {
    let n = [];
    for (let u of t7) {
      let o = r.normalizeDeprecatedResult(this._valueSchema.deprecated(u, r), u);
      o !== false && n.push(...o.map(({ value: i }) => ({ value: [i] })));
    }
    return n;
  }
  forward(t7, r) {
    let n = [];
    for (let u of t7) {
      let o = r.normalizeForwardResult(this._valueSchema.forward(u, r), u);
      n.push(...o.map(dn2));
    }
    return n;
  }
  redirect(t7, r) {
    let n = [], u = [];
    for (let o of t7) {
      let i = r.normalizeRedirectResult(this._valueSchema.redirect(o, r), o);
      "remain" in i && n.push(i.remain), u.push(...i.redirect.map(dn2));
    }
    return n.length === 0 ? { redirect: u } : { redirect: u, remain: n };
  }
  overlap(t7, r) {
    return t7.concat(r);
  }
};
function dn2({ from: e, to: t7 }) {
  return { from: [e], to: t7 };
}
var ut2 = class extends b2 {
  expected() {
    return "true or false";
  }
  validate(t7) {
    return typeof t7 == "boolean";
  }
};
function En2(e, t7) {
  let r = Object.create(null);
  for (let n of e) {
    let u = n[t7];
    if (r[u])
      throw new Error(`Duplicate ${t7} ${JSON.stringify(u)}`);
    r[u] = n;
  }
  return r;
}
function Cn2(e, t7) {
  let r = new Map;
  for (let n of e) {
    let u = n[t7];
    if (r.has(u))
      throw new Error(`Duplicate ${t7} ${JSON.stringify(u)}`);
    r.set(u, n);
  }
  return r;
}
function hn2() {
  let e = Object.create(null);
  return (t7) => {
    let r = JSON.stringify(t7);
    return e[r] ? true : (e[r] = true, false);
  };
}
function gn2(e, t7) {
  let r = [], n = [];
  for (let u of e)
    t7(u) ? r.push(u) : n.push(u);
  return [r, n];
}
function yn2(e) {
  return e === Math.floor(e);
}
function An2(e, t7) {
  if (e === t7)
    return 0;
  let r = typeof e, n = typeof t7, u = ["undefined", "object", "boolean", "number", "string"];
  return r !== n ? u.indexOf(r) - u.indexOf(n) : r !== "string" ? Number(e) - Number(t7) : e.localeCompare(t7);
}
function Bn2(e) {
  return (...t7) => {
    let r = e(...t7);
    return typeof r == "string" ? new Error(r) : r;
  };
}
function Lt2(e) {
  return e === undefined ? {} : e;
}
function It2(e) {
  if (typeof e == "string")
    return { text: e };
  let { text: t7, list: r } = e;
  return co2((t7 || r) !== undefined, "Unexpected `expected` result, there should be at least one field."), r ? { text: t7, list: { title: r.title, values: r.values.map(It2) } } : { text: t7 };
}
function Rt2(e, t7) {
  return e === true ? true : e === false ? { value: t7 } : e;
}
function Yt2(e, t7, r = false) {
  return e === false ? false : e === true ? r ? true : [{ value: t7 }] : ("value" in e) ? [e] : e.length === 0 ? false : e;
}
function mn2(e, t7) {
  return typeof e == "string" || "key" in e ? { from: t7, to: e } : ("from" in e) ? { from: e.from, to: e.to } : { from: t7, to: e.to };
}
function ot2(e, t7) {
  return e === undefined ? [] : Array.isArray(e) ? e.map((r) => mn2(r, t7)) : [mn2(e, t7)];
}
function jt2(e, t7) {
  let r = ot2(typeof e == "object" && "redirect" in e ? e.redirect : e, t7);
  return r.length === 0 ? { remain: t7, redirect: r } : typeof e == "object" && ("remain" in e) ? { remain: e.remain, redirect: r } : { redirect: r };
}
function co2(e, t7) {
  if (!e)
    throw new Error(t7);
}
var it2 = class extends b2 {
  constructor(t7) {
    super(t7), this._choices = Cn2(t7.choices.map((r) => r && typeof r == "object" ? r : { value: r }), "value");
  }
  expected({ descriptor: t7 }) {
    let r = Array.from(this._choices.keys()).map((i) => this._choices.get(i)).filter(({ hidden: i }) => !i).map((i) => i.value).sort(An2).map(t7.value), n = r.slice(0, -2), u = r.slice(-2);
    return { text: n.concat(u.join(" or ")).join(", "), list: { title: "one of the following values", values: r } };
  }
  validate(t7) {
    return this._choices.has(t7);
  }
  deprecated(t7) {
    let r = this._choices.get(t7);
    return r && r.deprecated ? { value: t7 } : false;
  }
  forward(t7) {
    let r = this._choices.get(t7);
    return r ? r.forward : undefined;
  }
  redirect(t7) {
    let r = this._choices.get(t7);
    return r ? r.redirect : undefined;
  }
};
var st2 = class extends b2 {
  expected() {
    return "a number";
  }
  validate(t7, r) {
    return typeof t7 == "number";
  }
};
var at2 = class extends st2 {
  expected() {
    return "an integer";
  }
  validate(t7, r) {
    return r.normalizeValidateResult(super.validate(t7, r), t7) === true && yn2(t7);
  }
};
var Ie2 = class extends b2 {
  expected() {
    return "a string";
  }
  validate(t7) {
    return typeof t7 == "string";
  }
};
var _n2 = re2;
var xn2 = et2;
var wn2 = fn2;
var bn2 = an;
var Dt2 = class {
  constructor(t7, r) {
    let { logger: n = console, loggerPrintWidth: u = 80, descriptor: o = _n2, unknown: i = xn2, invalid: s = wn2, deprecated: a = bn2, missing: c = () => false, required: D = () => false, preprocess: p = (F) => F, postprocess: l = () => ge2 } = r || {};
    this._utils = { descriptor: o, logger: n || { warn: () => {} }, loggerPrintWidth: u, schemas: En2(t7, "name"), normalizeDefaultResult: Lt2, normalizeExpectedResult: It2, normalizeDeprecatedResult: Yt2, normalizeForwardResult: ot2, normalizeRedirectResult: jt2, normalizeValidateResult: Rt2 }, this._unknownHandler = i, this._invalidHandler = Bn2(s), this._deprecatedHandler = a, this._identifyMissing = (F, f) => !(F in f) || c(F, f), this._identifyRequired = D, this._preprocess = p, this._postprocess = l, this.cleanHistory();
  }
  cleanHistory() {
    this._hasDeprecationWarned = hn2();
  }
  normalize(t7) {
    let r = {}, u = [this._preprocess(t7, this._utils)], o = () => {
      for (;u.length !== 0; ) {
        let i = u.shift(), s = this._applyNormalization(i, r);
        u.push(...s);
      }
    };
    o();
    for (let i of Object.keys(this._utils.schemas)) {
      let s = this._utils.schemas[i];
      if (!(i in r)) {
        let a = Lt2(s.default(this._utils));
        "value" in a && u.push({ [i]: a.value });
      }
    }
    o();
    for (let i of Object.keys(this._utils.schemas)) {
      if (!(i in r))
        continue;
      let s = this._utils.schemas[i], a = r[i], c = s.postprocess(a, this._utils);
      c !== ge2 && (this._applyValidation(c, i, s), r[i] = c);
    }
    return this._applyPostprocess(r), this._applyRequiredCheck(r), r;
  }
  _applyNormalization(t7, r) {
    let n = [], { knownKeys: u, unknownKeys: o } = this._partitionOptionKeys(t7);
    for (let i of u) {
      let s = this._utils.schemas[i], a = s.preprocess(t7[i], this._utils);
      this._applyValidation(a, i, s);
      let c = ({ from: F, to: f }) => {
        n.push(typeof f == "string" ? { [f]: F } : { [f.key]: f.value });
      }, D = ({ value: F, redirectTo: f }) => {
        let d2 = Yt2(s.deprecated(F, this._utils), a, true);
        if (d2 !== false)
          if (d2 === true)
            this._hasDeprecationWarned(i) || this._utils.logger.warn(this._deprecatedHandler(i, f, this._utils));
          else
            for (let { value: m } of d2) {
              let C = { key: i, value: m };
              if (!this._hasDeprecationWarned(C)) {
                let E2 = typeof f == "string" ? { key: f, value: m } : f;
                this._utils.logger.warn(this._deprecatedHandler(C, E2, this._utils));
              }
            }
      };
      ot2(s.forward(a, this._utils), a).forEach(c);
      let l = jt2(s.redirect(a, this._utils), a);
      if (l.redirect.forEach(c), "remain" in l) {
        let F = l.remain;
        r[i] = i in r ? s.overlap(r[i], F, this._utils) : F, D({ value: F });
      }
      for (let { from: F, to: f } of l.redirect)
        D({ value: F, redirectTo: f });
    }
    for (let i of o) {
      let s = t7[i];
      this._applyUnknownHandler(i, s, r, (a, c) => {
        n.push({ [a]: c });
      });
    }
    return n;
  }
  _applyRequiredCheck(t7) {
    for (let r of Object.keys(this._utils.schemas))
      if (this._identifyMissing(r, t7) && this._identifyRequired(r))
        throw this._invalidHandler(r, Ze2, this._utils);
  }
  _partitionOptionKeys(t7) {
    let [r, n] = gn2(Object.keys(t7).filter((u) => !this._identifyMissing(u, t7)), (u) => (u in this._utils.schemas));
    return { knownKeys: r, unknownKeys: n };
  }
  _applyValidation(t7, r, n) {
    let u = Rt2(n.validate(t7, this._utils), t7);
    if (u !== true)
      throw this._invalidHandler(r, u.value, this._utils);
  }
  _applyUnknownHandler(t7, r, n, u) {
    let o = this._unknownHandler(t7, r, this._utils);
    if (o)
      for (let i of Object.keys(o)) {
        if (this._identifyMissing(i, o))
          continue;
        let s = o[i];
        i in this._utils.schemas ? u(i, s) : n[i] = s;
      }
  }
  _applyPostprocess(t7) {
    let r = this._postprocess(t7, this._utils);
    if (r !== ge2) {
      if (r.delete)
        for (let n of r.delete)
          delete t7[n];
      if (r.override) {
        let { knownKeys: n, unknownKeys: u } = this._partitionOptionKeys(r.override);
        for (let o of n) {
          let i = r.override[o];
          this._applyValidation(i, o, this._utils.schemas[o]), t7[o] = i;
        }
        for (let o of u) {
          let i = r.override[o];
          this._applyUnknownHandler(o, i, t7, (s, a) => {
            let c = this._utils.schemas[s];
            this._applyValidation(a, s, c), t7[s] = a;
          });
        }
      }
    }
  }
};
var Ut2;
function lo2(e, t7, { logger: r = false, isCLI: n = false, passThrough: u = false, FlagSchema: o, descriptor: i } = {}) {
  if (n) {
    if (!o)
      throw new Error("'FlagSchema' option is required.");
    if (!i)
      throw new Error("'descriptor' option is required.");
  } else
    i = re2;
  let s = u ? Array.isArray(u) ? (l, F) => u.includes(l) ? { [l]: F } : undefined : (l, F) => ({ [l]: F }) : (l, F, f) => {
    let { _: d2, ...m } = f.schemas;
    return et2(l, F, { ...f, schemas: m });
  }, a = Fo(t7, { isCLI: n, FlagSchema: o }), c = new Dt2(a, { logger: r, unknown: s, descriptor: i }), D = r !== false;
  D && Ut2 && (c._hasDeprecationWarned = Ut2);
  let p = c.normalize(e);
  return D && (Ut2 = c._hasDeprecationWarned), p;
}
function Fo(e, { isCLI: t7, FlagSchema: r }) {
  let n = [];
  t7 && n.push(rt2.create({ name: "_" }));
  for (let u of e)
    n.push(po2(u, { isCLI: t7, optionInfos: e, FlagSchema: r })), u.alias && t7 && n.push(tt2.create({ name: u.alias, sourceName: u.name }));
  return n;
}
function po2(e, { isCLI: t7, optionInfos: r, FlagSchema: n }) {
  let { name: u } = e, o = { name: u }, i, s = {};
  switch (e.type) {
    case "int":
      i = at2, t7 && (o.preprocess = Number);
      break;
    case "string":
      i = Ie2;
      break;
    case "choice":
      i = it2, o.choices = e.choices.map((a) => a != null && a.redirect ? { ...a, redirect: { to: { key: e.name, value: a.redirect } } } : a);
      break;
    case "boolean":
      i = ut2;
      break;
    case "flag":
      i = n, o.flags = r.flatMap((a) => [a.alias, a.description && a.name, a.oppositeDescription && `no-${a.name}`].filter(Boolean));
      break;
    case "path":
      i = Ie2;
      break;
    default:
      throw new Error(`Unexpected type ${e.type}`);
  }
  if (e.exception ? o.validate = (a, c, D) => e.exception(a) || c.validate(a, D) : o.validate = (a, c, D) => a === undefined || c.validate(a, D), e.redirect && (s.redirect = (a) => a ? { to: typeof e.redirect == "string" ? e.redirect : { key: e.redirect.option, value: e.redirect.value } } : undefined), e.deprecated && (s.deprecated = true), t7 && !e.array) {
    let a = o.preprocess || ((c) => c);
    o.preprocess = (c, D, p) => D.preprocess(a(Array.isArray(c) ? y(false, c, -1) : c), p);
  }
  return e.array ? nt2.create({ ...t7 ? { preprocess: (a) => Array.isArray(a) ? a : [a] } : {}, ...s, valueSchema: i.create(o) }) : i.create({ ...o, ...s });
}
var kn2 = lo2;
var mo = (e, t7, r) => {
  if (!(e && t7 == null)) {
    if (t7.findLast)
      return t7.findLast(r);
    for (let n = t7.length - 1;n >= 0; n--) {
      let u = t7[n];
      if (r(u, n, t7))
        return u;
    }
  }
};
var Vt2 = mo;
function $t2(e, t7) {
  if (!t7)
    throw new Error("parserName is required.");
  let r = Vt2(false, e, (u) => u.parsers && Object.prototype.hasOwnProperty.call(u.parsers, t7));
  if (r)
    return r;
  let n = `Couldn't resolve parser "${t7}".`;
  throw n += " Plugins must be explicitly added to the standalone bundle.", new ve2(n);
}
function Sn2(e, t7) {
  if (!t7)
    throw new Error("astFormat is required.");
  let r = Vt2(false, e, (u) => u.printers && Object.prototype.hasOwnProperty.call(u.printers, t7));
  if (r)
    return r;
  let n = `Couldn't find plugin for AST format "${t7}".`;
  throw n += " Plugins must be explicitly added to the standalone bundle.", new ve2(n);
}
function Re2({ plugins: e, parser: t7 }) {
  let r = $t2(e, t7);
  return Wt2(r, t7);
}
function Wt2(e, t7) {
  let r = e.parsers[t7];
  return typeof r == "function" ? r() : r;
}
function Tn2(e, t7) {
  let r = e.printers[t7];
  return typeof r == "function" ? r() : r;
}
var Nn2 = { astFormat: "estree", printer: {}, originalText: undefined, locStart: null, locEnd: null };
async function Eo(e, t7 = {}) {
  var p;
  let r = { ...e };
  if (!r.parser)
    if (r.filepath) {
      if (r.parser = on2(r, { physicalFile: r.filepath }), !r.parser)
        throw new Le2(`No parser could be inferred for file "${r.filepath}".`);
    } else
      throw new Le2("No parser and no file path given, couldn't infer a parser.");
  let n = Qe2({ plugins: e.plugins, showDeprecated: true }).options, u = { ...Nn2, ...Object.fromEntries(n.filter((l) => l.default !== undefined).map((l) => [l.name, l.default])) }, o = $t2(r.plugins, r.parser), i = await Wt2(o, r.parser);
  r.astFormat = i.astFormat, r.locEnd = i.locEnd, r.locStart = i.locStart;
  let s = (p = o.printers) != null && p[i.astFormat] ? o : Sn2(r.plugins, i.astFormat), a = await Tn2(s, i.astFormat);
  r.printer = a;
  let c = s.defaultOptions ? Object.fromEntries(Object.entries(s.defaultOptions).filter(([, l]) => l !== undefined)) : {}, D = { ...u, ...c };
  for (let [l, F] of Object.entries(D))
    (r[l] === null || r[l] === undefined) && (r[l] = F);
  return r.parser === "json" && (r.trailingComma = "none"), kn2(r, n, { passThrough: Object.keys(Nn2), ...t7 });
}
var ne2 = Eo;
var vn2 = gu(Pn2(), 1);
async function yo(e, t7) {
  let r = await Re2(t7), n = r.preprocess ? r.preprocess(e, t7) : e;
  t7.originalText = n;
  let u;
  try {
    u = await r.parse(n, t7, t7);
  } catch (o) {
    Ao(o, e);
  }
  return { text: n, ast: u };
}
function Ao(e, t7) {
  let { loc: r } = e;
  if (r) {
    let n = (0, vn2.codeFrameColumns)(t7, r, { highlightCode: true });
    throw e.message += `
` + n, e.codeFrame = n, e;
  }
  throw e;
}
var De2 = yo;
async function Ln2(e, t7, r, n, u) {
  let { embeddedLanguageFormatting: o, printer: { embed: i, hasPrettierIgnore: s = () => false, getVisitorKeys: a } } = r;
  if (!i || o !== "auto")
    return;
  if (i.length > 2)
    throw new Error("printer.embed has too many parameters. The API changed in Prettier v3. Please update your plugin. See https://prettier.io/docs/plugins#optional-embed");
  let c = J2(i.getVisitorKeys ?? a), D = [];
  F();
  let p = e.stack;
  for (let { print: f, node: d2, pathStack: m } of D)
    try {
      e.stack = m;
      let C = await f(l, t7, e, r);
      C && u.set(d2, C);
    } catch (C) {
      if (globalThis.PRETTIER_DEBUG)
        throw C;
    }
  e.stack = p;
  function l(f, d2) {
    return Bo(f, d2, r, n);
  }
  function F() {
    let { node: f } = e;
    if (f === null || typeof f != "object" || s(e))
      return;
    for (let m of c(f))
      Array.isArray(f[m]) ? e.each(F, m) : e.call(F, m);
    let d2 = i(e, r);
    if (d2) {
      if (typeof d2 == "function") {
        D.push({ print: d2, node: f, pathStack: [...e.stack] });
        return;
      }
      u.set(f, d2);
    }
  }
}
async function Bo(e, t7, r, n) {
  let u = await ne2({ ...r, ...t7, parentParser: r.parser, originalText: e, cursorOffset: undefined, rangeStart: undefined, rangeEnd: undefined }, { passThrough: true }), { ast: o } = await De2(e, u), i = await n(o, u);
  return $e(i);
}
function _o(e, t7) {
  let { originalText: r, [Symbol.for("comments")]: n, locStart: u, locEnd: o, [Symbol.for("printedComments")]: i } = t7, { node: s } = e, a = u(s), c = o(s);
  for (let D of n)
    u(D) >= a && o(D) <= c && i.add(D);
  return r.slice(a, c);
}
var In2 = _o;
async function Ye2(e, t7) {
  ({ ast: e } = await Gt2(e, t7));
  let r = new Map, n = new Or2(e), u = Kr2(t7), o = new Map;
  await Ln2(n, s, t7, Ye2, o);
  let i = await Rn2(n, t7, s, undefined, o);
  if (Gr2(t7), t7.cursorOffset >= 0) {
    if (t7.nodeAfterCursor && !t7.nodeBeforeCursor)
      return [X2, i];
    if (t7.nodeBeforeCursor && !t7.nodeAfterCursor)
      return [i, X2];
  }
  return i;
  function s(c, D) {
    return c === undefined || c === n ? a(D) : Array.isArray(c) ? n.call(() => a(D), ...c) : n.call(() => a(D), c);
  }
  function a(c) {
    u(n);
    let D = n.node;
    if (D == null)
      return "";
    let p = D && typeof D == "object" && c === undefined;
    if (p && r.has(D))
      return r.get(D);
    let l = Rn2(n, t7, s, c, o);
    return p && r.set(D, l), l;
  }
}
function Rn2(e, t7, r, n, u) {
  var a;
  let { node: o } = e, { printer: i } = t7, s;
  switch ((a = i.hasPrettierIgnore) != null && a.call(i, e) ? s = In2(e, t7) : u.has(o) ? s = u.get(o) : s = i.print(e, t7, r, n), o) {
    case t7.cursorNode:
      s = Fe2(s, (c) => [X2, c, X2]);
      break;
    case t7.nodeBeforeCursor:
      s = Fe2(s, (c) => [c, X2]);
      break;
    case t7.nodeAfterCursor:
      s = Fe2(s, (c) => [X2, c]);
      break;
  }
  return i.printComment && (!i.willPrintOwnComments || !i.willPrintOwnComments(e, t7)) && (s = Mr(e, s, t7)), s;
}
async function Gt2(e, t7) {
  let r = e.comments ?? [];
  t7[Symbol.for("comments")] = r, t7[Symbol.for("printedComments")] = new Set, Vr(e, t7);
  let { printer: { preprocess: n } } = t7;
  return e = n ? await n(e, t7) : e, { ast: e, comments: r };
}
function xo(e, t7) {
  let { cursorOffset: r, locStart: n, locEnd: u } = t7, o = J2(t7.printer.getVisitorKeys), i = (F) => n(F) <= r && u(F) >= r, s = e, a = [e];
  for (let F of Lr2(e, { getVisitorKeys: o, filter: i }))
    a.push(F), s = F;
  if (Ir2(s, { getVisitorKeys: o }))
    return { cursorNode: s };
  let c, D, p = -1, l = Number.POSITIVE_INFINITY;
  for (;a.length > 0 && (c === undefined || D === undefined); ) {
    s = a.pop();
    let F = c !== undefined, f = D !== undefined;
    for (let d2 of Ce2(s, { getVisitorKeys: o })) {
      if (!F) {
        let m = u(d2);
        m <= r && m > p && (c = d2, p = m);
      }
      if (!f) {
        let m = n(d2);
        m >= r && m < l && (D = d2, l = m);
      }
    }
  }
  return { nodeBeforeCursor: c, nodeAfterCursor: D };
}
var Kt2 = xo;
function wo(e, t7) {
  let { printer: { massageAstNode: r, getVisitorKeys: n } } = t7;
  if (!r)
    return e;
  let u = J2(n), o = r.ignoredProperties ?? new Set;
  return i(e);
  function i(s, a) {
    if (!(s !== null && typeof s == "object"))
      return s;
    if (Array.isArray(s))
      return s.map((l) => i(l, a)).filter(Boolean);
    let c = {}, D = new Set(u(s));
    for (let l in s)
      !Object.prototype.hasOwnProperty.call(s, l) || o.has(l) || (D.has(l) ? c[l] = i(s[l], s) : c[l] = s[l]);
    let p = r(s, c, a);
    if (p !== null)
      return p ?? c;
  }
}
var Yn2 = wo;
var bo = (e, t7, r) => {
  if (!(e && t7 == null)) {
    if (t7.findLastIndex)
      return t7.findLastIndex(r);
    for (let n = t7.length - 1;n >= 0; n--) {
      let u = t7[n];
      if (r(u, n, t7))
        return n;
    }
    return -1;
  }
};
var jn2 = bo;
var ko = ({ parser: e }) => e === "json" || e === "json5" || e === "jsonc" || e === "json-stringify";
function So(e, t7) {
  let r = [e.node, ...e.parentNodes], n = new Set([t7.node, ...t7.parentNodes]);
  return r.find((u) => $n2.has(u.type) && n.has(u));
}
function Un2(e) {
  let t7 = jn2(false, e, (r) => r.type !== "Program" && r.type !== "File");
  return t7 === -1 ? e : e.slice(0, t7 + 1);
}
function To(e, t7, { locStart: r, locEnd: n }) {
  let u = e.node, o = t7.node;
  if (u === o)
    return { startNode: u, endNode: o };
  let i = r(e.node);
  for (let a of Un2(t7.parentNodes))
    if (r(a) >= i)
      o = a;
    else
      break;
  let s = n(t7.node);
  for (let a of Un2(e.parentNodes)) {
    if (n(a) <= s)
      u = a;
    else
      break;
    if (u === o)
      break;
  }
  return { startNode: u, endNode: o };
}
function zt2(e, t7, r, n, u = [], o) {
  let { locStart: i, locEnd: s } = r, a = i(e), c = s(e);
  if (!(t7 > c || t7 < a || o === "rangeEnd" && t7 === a || o === "rangeStart" && t7 === c)) {
    for (let D of Xe2(e, r)) {
      let p = zt2(D, t7, r, n, [e, ...u], o);
      if (p)
        return p;
    }
    if (!n || n(e, u[0]))
      return { node: e, parentNodes: u };
  }
}
function No(e, t7) {
  return t7 !== "DeclareExportDeclaration" && e !== "TypeParameterDeclaration" && (e === "Directive" || e === "TypeAlias" || e === "TSExportAssignment" || e.startsWith("Declare") || e.startsWith("TSDeclare") || e.endsWith("Statement") || e.endsWith("Declaration"));
}
var $n2 = new Set(["JsonRoot", "ObjectExpression", "ArrayExpression", "StringLiteral", "NumericLiteral", "BooleanLiteral", "NullLiteral", "UnaryExpression", "TemplateLiteral"]);
var Oo2 = new Set(["OperationDefinition", "FragmentDefinition", "VariableDefinition", "TypeExtensionDefinition", "ObjectTypeDefinition", "FieldDefinition", "DirectiveDefinition", "EnumTypeDefinition", "EnumValueDefinition", "InputValueDefinition", "InputObjectTypeDefinition", "SchemaDefinition", "OperationTypeDefinition", "InterfaceTypeDefinition", "UnionTypeDefinition", "ScalarTypeDefinition"]);
function Vn2(e, t7, r) {
  if (!t7)
    return false;
  switch (e.parser) {
    case "flow":
    case "hermes":
    case "babel":
    case "babel-flow":
    case "babel-ts":
    case "typescript":
    case "acorn":
    case "espree":
    case "meriyah":
    case "oxc":
    case "oxc-ts":
    case "__babel_estree":
      return No(t7.type, r == null ? undefined : r.type);
    case "json":
    case "json5":
    case "jsonc":
    case "json-stringify":
      return $n2.has(t7.type);
    case "graphql":
      return Oo2.has(t7.kind);
    case "vue":
      return t7.tag !== "root";
  }
  return false;
}
function Wn2(e, t7, r) {
  let { rangeStart: n, rangeEnd: u, locStart: o, locEnd: i } = t7;
  Oe2.ok(u > n);
  let s = e.slice(n, u).search(/\S/u), a = s === -1;
  if (!a)
    for (n += s;u > n && !/\S/u.test(e[u - 1]); --u)
      ;
  let c = zt2(r, n, t7, (F, f) => Vn2(t7, F, f), [], "rangeStart"), D = a ? c : zt2(r, u, t7, (F) => Vn2(t7, F), [], "rangeEnd");
  if (!c || !D)
    return { rangeStart: 0, rangeEnd: 0 };
  let p, l;
  if (ko(t7)) {
    let F = So(c, D);
    p = F, l = F;
  } else
    ({ startNode: p, endNode: l } = To(c, D, t7));
  return { rangeStart: Math.min(o(p), o(l)), rangeEnd: Math.max(i(p), i(l)) };
}
var zn2 = "\uFEFF";
var Mn2 = Symbol("cursor");
async function Hn2(e, t7, r = 0) {
  if (!e || e.trim().length === 0)
    return { formatted: "", cursorOffset: -1, comments: [] };
  let { ast: n, text: u } = await De2(e, t7);
  t7.cursorOffset >= 0 && (t7 = { ...t7, ...Kt2(n, t7) });
  let o = await Ye2(n, t7, r);
  r > 0 && (o = Ge3([z2, o], r, t7.tabWidth));
  let i = me2(o, t7);
  if (r > 0) {
    let a = i.formatted.trim();
    i.cursorNodeStart !== undefined && (i.cursorNodeStart -= i.formatted.indexOf(a), i.cursorNodeStart < 0 && (i.cursorNodeStart = 0, i.cursorNodeText = i.cursorNodeText.trimStart()), i.cursorNodeStart + i.cursorNodeText.length > a.length && (i.cursorNodeText = i.cursorNodeText.trimEnd())), i.formatted = a + xe2(t7.endOfLine);
  }
  let s = t7[Symbol.for("comments")];
  if (t7.cursorOffset >= 0) {
    let a, c, D, p;
    if ((t7.cursorNode || t7.nodeBeforeCursor || t7.nodeAfterCursor) && i.cursorNodeText)
      if (D = i.cursorNodeStart, p = i.cursorNodeText, t7.cursorNode)
        a = t7.locStart(t7.cursorNode), c = u.slice(a, t7.locEnd(t7.cursorNode));
      else {
        if (!t7.nodeBeforeCursor && !t7.nodeAfterCursor)
          throw new Error("Cursor location must contain at least one of cursorNode, nodeBeforeCursor, nodeAfterCursor");
        a = t7.nodeBeforeCursor ? t7.locEnd(t7.nodeBeforeCursor) : 0;
        let C = t7.nodeAfterCursor ? t7.locStart(t7.nodeAfterCursor) : u.length;
        c = u.slice(a, C);
      }
    else
      a = 0, c = u, D = 0, p = i.formatted;
    let l = t7.cursorOffset - a;
    if (c === p)
      return { formatted: i.formatted, cursorOffset: D + l, comments: s };
    let F = c.split("");
    F.splice(l, 0, Mn2);
    let f = p.split(""), d2 = Et2(F, f), m = D;
    for (let C of d2)
      if (C.removed) {
        if (C.value.includes(Mn2))
          break;
      } else
        m += C.count;
    return { formatted: i.formatted, cursorOffset: m, comments: s };
  }
  return { formatted: i.formatted, cursorOffset: -1, comments: s };
}
async function Po(e, t7) {
  let { ast: r, text: n } = await De2(e, t7), { rangeStart: u, rangeEnd: o } = Wn2(n, t7, r), i = n.slice(u, o), s = Math.min(u, n.lastIndexOf(`
`, u) + 1), a = n.slice(s, u).match(/^\s*/u)[0], c = Ee2(a, t7.tabWidth), D = await Hn2(i, { ...t7, rangeStart: 0, rangeEnd: Number.POSITIVE_INFINITY, cursorOffset: t7.cursorOffset > u && t7.cursorOffset <= o ? t7.cursorOffset - u : -1, endOfLine: "lf" }, c), p = D.formatted.trimEnd(), { cursorOffset: l } = t7;
  l > o ? l += p.length - i.length : D.cursorOffset >= 0 && (l = D.cursorOffset + u);
  let F = n.slice(0, u) + p + n.slice(o);
  if (t7.endOfLine !== "lf") {
    let f = xe2(t7.endOfLine);
    l >= 0 && f === `\r
` && (l += Ct2(F.slice(0, l), `
`)), F = te(false, F, `
`, f);
  }
  return { formatted: F, cursorOffset: l, comments: D.comments };
}
function Ht2(e, t7, r) {
  return typeof t7 != "number" || Number.isNaN(t7) || t7 < 0 || t7 > e.length ? r : t7;
}
function Gn2(e, t7) {
  let { cursorOffset: r, rangeStart: n, rangeEnd: u } = t7;
  return r = Ht2(e, r, -1), n = Ht2(e, n, 0), u = Ht2(e, u, e.length), { ...t7, cursorOffset: r, rangeStart: n, rangeEnd: u };
}
function Jn2(e, t7) {
  let { cursorOffset: r, rangeStart: n, rangeEnd: u, endOfLine: o } = Gn2(e, t7), i = e.charAt(0) === zn2;
  if (i && (e = e.slice(1), r--, n--, u--), o === "auto" && (o = nr2(e)), e.includes("\r")) {
    let s = (a) => Ct2(e.slice(0, Math.max(a, 0)), `\r
`);
    r -= s(r), n -= s(n), u -= s(u), e = ur2(e);
  }
  return { hasBOM: i, text: e, options: Gn2(e, { ...t7, cursorOffset: r, rangeStart: n, rangeEnd: u, endOfLine: o }) };
}
async function Kn2(e, t7) {
  let r = await Re2(t7);
  return !r.hasPragma || r.hasPragma(e);
}
async function vo(e, t7) {
  var n;
  let r = await Re2(t7);
  return (n = r.hasIgnorePragma) == null ? undefined : n.call(r, e);
}
async function Jt(e, t7) {
  let { hasBOM: r, text: n, options: u } = Jn2(e, await ne2(t7));
  if (u.rangeStart >= u.rangeEnd && n !== "" || u.requirePragma && !await Kn2(n, u) || u.checkIgnorePragma && await vo(n, u))
    return { formatted: e, cursorOffset: t7.cursorOffset, comments: [] };
  let o;
  return u.rangeStart > 0 || u.rangeEnd < n.length ? o = await Po(n, u) : (!u.requirePragma && u.insertPragma && u.printer.insertPragma && !await Kn2(n, u) && (n = u.printer.insertPragma(n)), o = await Hn2(n, u)), r && (o.formatted = zn2 + o.formatted, o.cursorOffset >= 0 && o.cursorOffset++), o;
}
async function qn2(e, t7, r) {
  let { text: n, options: u } = Jn2(e, await ne2(t7)), o = await De2(n, u);
  return r && (r.preprocessForPrint && (o.ast = await Gt2(o.ast, u)), r.massage && (o.ast = Yn2(o.ast, u))), o;
}
async function Xn2(e, t7) {
  t7 = await ne2(t7);
  let r = await Ye2(e, t7);
  return me2(r, t7);
}
async function Qn2(e, t7) {
  let r = wr2(e), { formatted: n } = await Jt(r, { ...t7, parser: "__js_expression" });
  return n;
}
async function Zn2(e, t7) {
  t7 = await ne2(t7);
  let { ast: r } = await De2(e, t7);
  return t7.cursorOffset >= 0 && (t7 = { ...t7, ...Kt2(r, t7) }), Ye2(r, t7);
}
async function eu2(e, t7) {
  return me2(e, await ne2(t7));
}
var qt2 = {};
dt(qt2, { builders: () => Io2, printer: () => Ro2, utils: () => Yo2 });
var Io2 = { join: ke2, line: Me2, softline: _r2, hardline: z2, literalline: We, group: At2, conditionalGroup: Cr2, fill: hr2, lineSuffix: Se2, lineSuffixBoundary: Ar2, cursor: X2, breakParent: pe2, ifBreak: gr2, trim: Br2, indent: ie2, indentIfBreak: yr2, align: oe, addAlignmentToDoc: Ge3, markAsRoot: mr2, dedentToRoot: dr2, dedent: Er2, hardlineWithoutBreakParent: Te2, literallineWithoutBreakParent: Bt2, label: xr2, concat: (e) => e };
var Ro2 = { printDocToString: me2 };
var Yo2 = { willBreak: Dr2, traverseDoc: le2, findInDoc: Ve2, mapDoc: be2, removeLines: fr2, stripTrailingHardline: $e, replaceEndOfLine: lr2, canBreak: Fr2 };
var tu2 = "3.6.2";
var Qt2 = {};
dt(Qt2, { addDanglingComment: () => ee2, addLeadingComment: () => se2, addTrailingComment: () => ae2, getAlignmentSize: () => Ee2, getIndentSize: () => ru2, getMaxContinuousCount: () => nu2, getNextNonSpaceNonCommentCharacter: () => uu2, getNextNonSpaceNonCommentCharacterIndex: () => Xo2, getPreferredQuote: () => iu2, getStringWidth: () => Ne2, hasNewline: () => G2, hasNewlineInRange: () => su2, hasSpaces: () => au2, isNextLineEmpty: () => ti2, isNextLineEmptyAfterIndex: () => ct2, isPreviousLineEmpty: () => Zo2, makeString: () => Du, skip: () => he2, skipEverythingButNewLine: () => Je2, skipInlineComment: () => ye, skipNewline: () => U, skipSpaces: () => T2, skipToLineEnd: () => He2, skipTrailingComment: () => Ae2, skipWhitespace: () => Rr2 });
function jo2(e, t7) {
  if (t7 === false)
    return false;
  if (e.charAt(t7) === "/" && e.charAt(t7 + 1) === "*") {
    for (let r = t7 + 2;r < e.length; ++r)
      if (e.charAt(r) === "*" && e.charAt(r + 1) === "/")
        return r + 2;
  }
  return t7;
}
var ye = jo2;
function Uo2(e, t7) {
  return t7 === false ? false : e.charAt(t7) === "/" && e.charAt(t7 + 1) === "/" ? Je2(e, t7) : t7;
}
var Ae2 = Uo2;
function Vo2(e, t7) {
  let r = null, n = t7;
  for (;n !== r; )
    r = n, n = T2(e, n), n = ye(e, n), n = Ae2(e, n), n = U(e, n);
  return n;
}
var je2 = Vo2;
function $o2(e, t7) {
  let r = null, n = t7;
  for (;n !== r; )
    r = n, n = He2(e, n), n = ye(e, n), n = T2(e, n);
  return n = Ae2(e, n), n = U(e, n), n !== false && G2(e, n);
}
var ct2 = $o2;
function Wo2(e, t7) {
  let r = e.lastIndexOf(`
`);
  return r === -1 ? 0 : Ee2(e.slice(r + 1).match(/^[\t ]*/u)[0], t7);
}
var ru2 = Wo2;
function Xt2(e) {
  if (typeof e != "string")
    throw new TypeError("Expected a string");
  return e.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
function Mo2(e, t7) {
  let r = e.match(new RegExp(`(${Xt2(t7)})+`, "gu"));
  return r === null ? 0 : r.reduce((n, u) => Math.max(n, u.length / t7.length), 0);
}
var nu2 = Mo2;
function Go2(e, t7) {
  let r = je2(e, t7);
  return r === false ? "" : e.charAt(r);
}
var uu2 = Go2;
var ft2 = "'";
var ou2 = '"';
function Ko2(e, t7) {
  let r = t7 === true || t7 === ft2 ? ft2 : ou2, n = r === ft2 ? ou2 : ft2, u = 0, o = 0;
  for (let i of e)
    i === r ? u++ : i === n && o++;
  return u > o ? n : r;
}
var iu2 = Ko2;
function zo2(e, t7, r) {
  for (let n = t7;n < r; ++n)
    if (e.charAt(n) === `
`)
      return true;
  return false;
}
var su2 = zo2;
function Ho2(e, t7, r = {}) {
  return T2(e, r.backwards ? t7 - 1 : t7, r) !== t7;
}
var au2 = Ho2;
function Jo2(e, t7, r) {
  let n = t7 === '"' ? "'" : '"', o = te(false, e, /\\(.)|(["'])/gsu, (i, s, a) => s === n ? s : a === t7 ? "\\" + a : a || (r && /^[^\n\r"'0-7\\bfnrt-vx\u2028\u2029]$/u.test(s) ? s : "\\" + s));
  return t7 + o + t7;
}
var Du = Jo2;
function qo2(e, t7, r) {
  return je2(e, r(t7));
}
function Xo2(e, t7) {
  return arguments.length === 2 || typeof t7 == "number" ? je2(e, t7) : qo2(...arguments);
}
function Qo2(e, t7, r) {
  return Pe2(e, r(t7));
}
function Zo2(e, t7) {
  return arguments.length === 2 || typeof t7 == "number" ? Pe2(e, t7) : Qo2(...arguments);
}
function ei(e, t7, r) {
  return ct2(e, r(t7));
}
function ti2(e, t7) {
  return arguments.length === 2 || typeof t7 == "number" ? ct2(e, t7) : ei(...arguments);
}
function ce2(e, t7 = 1) {
  return async (...r) => {
    let n = r[t7] ?? {}, u = n.plugins ?? [];
    return r[t7] = { ...n, plugins: Array.isArray(u) ? u : Object.values(u) }, e(...r);
  };
}
var cu = ce2(Jt);
async function fu(e, t7) {
  let { formatted: r } = await cu(e, { ...t7, cursorOffset: -1 });
  return r;
}
async function ri2(e, t7) {
  return await fu(e, t7) === e;
}
var ni2 = ce2(Qe2, 0);
var ui = { parse: ce2(qn2), formatAST: ce2(Xn2), formatDoc: ce2(Qn2), printToDoc: ce2(Zn2), printDocToString: ce2(eu2) };

// ../../node_modules/.bun/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js
var ElementType;
(function(ElementType2) {
  ElementType2["Root"] = "root";
  ElementType2["Text"] = "text";
  ElementType2["Directive"] = "directive";
  ElementType2["Comment"] = "comment";
  ElementType2["Script"] = "script";
  ElementType2["Style"] = "style";
  ElementType2["Tag"] = "tag";
  ElementType2["CDATA"] = "cdata";
  ElementType2["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
function isTag(elem) {
  return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
var Root = ElementType.Root;
var Text = ElementType.Text;
var Directive = ElementType.Directive;
var Comment = ElementType.Comment;
var Script = ElementType.Script;
var Style = ElementType.Style;
var Tag = ElementType.Tag;
var CDATA = ElementType.CDATA;
var Doctype = ElementType.Doctype;

// ../../node_modules/.bun/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js
class Node {
  constructor() {
    this.parent = null;
    this.prev = null;
    this.next = null;
    this.startIndex = null;
    this.endIndex = null;
  }
  get parentNode() {
    return this.parent;
  }
  set parentNode(parent) {
    this.parent = parent;
  }
  get previousSibling() {
    return this.prev;
  }
  set previousSibling(prev) {
    this.prev = prev;
  }
  get nextSibling() {
    return this.next;
  }
  set nextSibling(next) {
    this.next = next;
  }
  cloneNode(recursive = false) {
    return cloneNode(this, recursive);
  }
}

class DataNode extends Node {
  constructor(data) {
    super();
    this.data = data;
  }
  get nodeValue() {
    return this.data;
  }
  set nodeValue(data) {
    this.data = data;
  }
}

class Text2 extends DataNode {
  constructor() {
    super(...arguments);
    this.type = ElementType.Text;
  }
  get nodeType() {
    return 3;
  }
}

class Comment2 extends DataNode {
  constructor() {
    super(...arguments);
    this.type = ElementType.Comment;
  }
  get nodeType() {
    return 8;
  }
}

class ProcessingInstruction extends DataNode {
  constructor(name, data) {
    super(data);
    this.name = name;
    this.type = ElementType.Directive;
  }
  get nodeType() {
    return 1;
  }
}

class NodeWithChildren extends Node {
  constructor(children) {
    super();
    this.children = children;
  }
  get firstChild() {
    var _a2;
    return (_a2 = this.children[0]) !== null && _a2 !== undefined ? _a2 : null;
  }
  get lastChild() {
    return this.children.length > 0 ? this.children[this.children.length - 1] : null;
  }
  get childNodes() {
    return this.children;
  }
  set childNodes(children) {
    this.children = children;
  }
}

class CDATA2 extends NodeWithChildren {
  constructor() {
    super(...arguments);
    this.type = ElementType.CDATA;
  }
  get nodeType() {
    return 4;
  }
}

class Document extends NodeWithChildren {
  constructor() {
    super(...arguments);
    this.type = ElementType.Root;
  }
  get nodeType() {
    return 9;
  }
}

class Element extends NodeWithChildren {
  constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
    super(children);
    this.name = name;
    this.attribs = attribs;
    this.type = type;
  }
  get nodeType() {
    return 1;
  }
  get tagName() {
    return this.name;
  }
  set tagName(name) {
    this.name = name;
  }
  get attributes() {
    return Object.keys(this.attribs).map((name) => {
      var _a2, _b;
      return {
        name,
        value: this.attribs[name],
        namespace: (_a2 = this["x-attribsNamespace"]) === null || _a2 === undefined ? undefined : _a2[name],
        prefix: (_b = this["x-attribsPrefix"]) === null || _b === undefined ? undefined : _b[name]
      };
    });
  }
}
function isTag2(node) {
  return isTag(node);
}
function isCDATA(node) {
  return node.type === ElementType.CDATA;
}
function isText(node) {
  return node.type === ElementType.Text;
}
function isComment(node) {
  return node.type === ElementType.Comment;
}
function isDirective(node) {
  return node.type === ElementType.Directive;
}
function isDocument(node) {
  return node.type === ElementType.Root;
}
function cloneNode(node, recursive = false) {
  let result;
  if (isText(node)) {
    result = new Text2(node.data);
  } else if (isComment(node)) {
    result = new Comment2(node.data);
  } else if (isTag2(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Element(node.name, { ...node.attribs }, children);
    children.forEach((child) => child.parent = clone);
    if (node.namespace != null) {
      clone.namespace = node.namespace;
    }
    if (node["x-attribsNamespace"]) {
      clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
    }
    if (node["x-attribsPrefix"]) {
      clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
    }
    result = clone;
  } else if (isCDATA(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new CDATA2(children);
    children.forEach((child) => child.parent = clone);
    result = clone;
  } else if (isDocument(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Document(children);
    children.forEach((child) => child.parent = clone);
    if (node["x-mode"]) {
      clone["x-mode"] = node["x-mode"];
    }
    result = clone;
  } else if (isDirective(node)) {
    const instruction = new ProcessingInstruction(node.name, node.data);
    if (node["x-name"] != null) {
      instruction["x-name"] = node["x-name"];
      instruction["x-publicId"] = node["x-publicId"];
      instruction["x-systemId"] = node["x-systemId"];
    }
    result = instruction;
  } else {
    throw new Error(`Not implemented yet: ${node.type}`);
  }
  result.startIndex = node.startIndex;
  result.endIndex = node.endIndex;
  if (node.sourceCodeLocation != null) {
    result.sourceCodeLocation = node.sourceCodeLocation;
  }
  return result;
}
function cloneChildren(childs) {
  const children = childs.map((child) => cloneNode(child, true));
  for (let i = 1;i < children.length; i++) {
    children[i].prev = children[i - 1];
    children[i - 1].next = children[i];
  }
  return children;
}

// ../../node_modules/.bun/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js
var defaultOpts = {
  withStartIndices: false,
  withEndIndices: false,
  xmlMode: false
};

class DomHandler {
  constructor(callback, options, elementCB) {
    this.dom = [];
    this.root = new Document(this.dom);
    this.done = false;
    this.tagStack = [this.root];
    this.lastNode = null;
    this.parser = null;
    if (typeof options === "function") {
      elementCB = options;
      options = defaultOpts;
    }
    if (typeof callback === "object") {
      options = callback;
      callback = undefined;
    }
    this.callback = callback !== null && callback !== undefined ? callback : null;
    this.options = options !== null && options !== undefined ? options : defaultOpts;
    this.elementCB = elementCB !== null && elementCB !== undefined ? elementCB : null;
  }
  onparserinit(parser) {
    this.parser = parser;
  }
  onreset() {
    this.dom = [];
    this.root = new Document(this.dom);
    this.done = false;
    this.tagStack = [this.root];
    this.lastNode = null;
    this.parser = null;
  }
  onend() {
    if (this.done)
      return;
    this.done = true;
    this.parser = null;
    this.handleCallback(null);
  }
  onerror(error) {
    this.handleCallback(error);
  }
  onclosetag() {
    this.lastNode = null;
    const elem = this.tagStack.pop();
    if (this.options.withEndIndices) {
      elem.endIndex = this.parser.endIndex;
    }
    if (this.elementCB)
      this.elementCB(elem);
  }
  onopentag(name, attribs) {
    const type = this.options.xmlMode ? ElementType.Tag : undefined;
    const element = new Element(name, attribs, undefined, type);
    this.addNode(element);
    this.tagStack.push(element);
  }
  ontext(data) {
    const { lastNode } = this;
    if (lastNode && lastNode.type === ElementType.Text) {
      lastNode.data += data;
      if (this.options.withEndIndices) {
        lastNode.endIndex = this.parser.endIndex;
      }
    } else {
      const node2 = new Text2(data);
      this.addNode(node2);
      this.lastNode = node2;
    }
  }
  oncomment(data) {
    if (this.lastNode && this.lastNode.type === ElementType.Comment) {
      this.lastNode.data += data;
      return;
    }
    const node2 = new Comment2(data);
    this.addNode(node2);
    this.lastNode = node2;
  }
  oncommentend() {
    this.lastNode = null;
  }
  oncdatastart() {
    const text = new Text2("");
    const node2 = new CDATA2([text]);
    this.addNode(node2);
    text.parent = node2;
    this.lastNode = text;
  }
  oncdataend() {
    this.lastNode = null;
  }
  onprocessinginstruction(name, data) {
    const node2 = new ProcessingInstruction(name, data);
    this.addNode(node2);
  }
  handleCallback(error) {
    if (typeof this.callback === "function") {
      this.callback(error, this.dom);
    } else if (error) {
      throw error;
    }
  }
  addNode(node2) {
    const parent = this.tagStack[this.tagStack.length - 1];
    const previousSibling = parent.children[parent.children.length - 1];
    if (this.options.withStartIndices) {
      node2.startIndex = this.parser.startIndex;
    }
    if (this.options.withEndIndices) {
      node2.endIndex = this.parser.endIndex;
    }
    parent.children.push(node2);
    if (previousSibling) {
      node2.prev = previousSibling;
      previousSibling.next = node2;
    }
    node2.parent = parent;
    this.lastNode = null;
  }
}

// ../../node_modules/.bun/leac@0.6.0/node_modules/leac/lib/leac.mjs
var e = /\n/g;
function n(n2) {
  const o = [...n2.matchAll(e)].map((e2) => e2.index || 0);
  o.unshift(-1);
  const s = t7(o, 0, o.length);
  return (e2) => r(s, e2);
}
function t7(e2, n2, r) {
  if (r - n2 == 1)
    return { offset: e2[n2], index: n2 + 1 };
  const o = Math.ceil((n2 + r) / 2), s = t7(e2, n2, o), l = t7(e2, o, r);
  return { offset: s.offset, low: s, high: l };
}
function r(e2, n2) {
  return function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "index");
  }(e2) ? { line: e2.index, column: n2 - e2.offset } : r(e2.high.offset < n2 ? e2.high : e2.low, n2);
}
function o(e2, t8 = "", r2 = {}) {
  const o2 = typeof t8 != "string" ? t8 : r2, l = typeof t8 == "string" ? t8 : "", c = e2.map(s), f = !!o2.lineNumbers;
  return function(e3, t9 = 0) {
    const r3 = f ? n(e3) : () => ({ line: 0, column: 0 });
    let o3 = t9;
    const s = [];
    e:
      for (;o3 < e3.length; ) {
        let n2 = false;
        for (const t10 of c) {
          t10.regex.lastIndex = o3;
          const c2 = t10.regex.exec(e3);
          if (c2 && c2[0].length > 0) {
            if (!t10.discard) {
              const e4 = r3(o3), n3 = typeof t10.replace == "string" ? c2[0].replace(new RegExp(t10.regex.source, t10.regex.flags), t10.replace) : c2[0];
              s.push({ state: l, name: t10.name, text: n3, offset: o3, len: c2[0].length, line: e4.line, column: e4.column });
            }
            if (o3 = t10.regex.lastIndex, n2 = true, t10.push) {
              const n3 = t10.push(e3, o3);
              s.push(...n3.tokens), o3 = n3.offset;
            }
            if (t10.pop)
              break e;
            break;
          }
        }
        if (!n2)
          break;
      }
    return { tokens: s, offset: o3, complete: e3.length <= o3 };
  };
}
function s(e2, n2) {
  return { ...e2, regex: l(e2, n2) };
}
function l(e2, n2) {
  if (e2.name.length === 0)
    throw new Error(`Rule #${n2} has empty name, which is not allowed.`);
  if (function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "regex");
  }(e2))
    return function(e3) {
      if (e3.global)
        throw new Error(`Regular expression /${e3.source}/${e3.flags} contains the global flag, which is not allowed.`);
      return e3.sticky ? e3 : new RegExp(e3.source, e3.flags + "y");
    }(e2.regex);
  if (function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "str");
  }(e2)) {
    if (e2.str.length === 0)
      throw new Error(`Rule #${n2} ("${e2.name}") has empty "str" property, which is not allowed.`);
    return new RegExp(c(e2.str), "y");
  }
  return new RegExp(c(e2.name), "y");
}
function c(e2) {
  return e2.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, "\\$&");
}

// ../../node_modules/.bun/peberminta@0.9.0/node_modules/peberminta/lib/core.mjs
function token(onToken, onEnd) {
  return (data, i) => {
    let position = i;
    let value = undefined;
    if (i < data.tokens.length) {
      value = onToken(data.tokens[i], data, i);
      if (value !== undefined) {
        position++;
      }
    } else {
      onEnd?.(data, i);
    }
    return value === undefined ? { matched: false } : {
      matched: true,
      position,
      value
    };
  };
}
function mapInner(r2, f) {
  return r2.matched ? {
    matched: true,
    position: r2.position,
    value: f(r2.value, r2.position)
  } : r2;
}
function mapOuter(r2, f) {
  return r2.matched ? f(r2) : r2;
}
function map(p, mapper) {
  return (data, i) => mapInner(p(data, i), (v3, j3) => mapper(v3, data, i, j3));
}
function option(p, def) {
  return (data, i) => {
    const r2 = p(data, i);
    return r2.matched ? r2 : {
      matched: true,
      position: i,
      value: def
    };
  };
}
function choice(...ps2) {
  return (data, i) => {
    for (const p of ps2) {
      const result = p(data, i);
      if (result.matched) {
        return result;
      }
    }
    return { matched: false };
  };
}
function otherwise(pa2, pb) {
  return (data, i) => {
    const r1 = pa2(data, i);
    return r1.matched ? r1 : pb(data, i);
  };
}
function takeWhile(p, test) {
  return (data, i) => {
    const values = [];
    let success = true;
    do {
      const r2 = p(data, i);
      if (r2.matched && test(r2.value, values.length + 1, data, i, r2.position)) {
        values.push(r2.value);
        i = r2.position;
      } else {
        success = false;
      }
    } while (success);
    return {
      matched: true,
      position: i,
      value: values
    };
  };
}
function many(p) {
  return takeWhile(p, () => true);
}
function many1(p) {
  return ab(p, many(p), (head, tail) => [head, ...tail]);
}
function ab(pa2, pb, join) {
  return (data, i) => mapOuter(pa2(data, i), (ma2) => mapInner(pb(data, ma2.position), (vb, j3) => join(ma2.value, vb, data, i, j3)));
}
function left(pa2, pb) {
  return ab(pa2, pb, (va2) => va2);
}
function right(pa2, pb) {
  return ab(pa2, pb, (va2, vb) => vb);
}
function abc(pa2, pb, pc, join) {
  return (data, i) => mapOuter(pa2(data, i), (ma2) => mapOuter(pb(data, ma2.position), (mb) => mapInner(pc(data, mb.position), (vc, j3) => join(ma2.value, mb.value, vc, data, i, j3))));
}
function middle(pa2, pb, pc) {
  return abc(pa2, pb, pc, (ra2, rb) => rb);
}
function all(...ps2) {
  return (data, i) => {
    const result = [];
    let position = i;
    for (const p of ps2) {
      const r1 = p(data, position);
      if (r1.matched) {
        result.push(r1.value);
        position = r1.position;
      } else {
        return { matched: false };
      }
    }
    return {
      matched: true,
      position,
      value: result
    };
  };
}
function flatten(...ps2) {
  return flatten1(all(...ps2));
}
function flatten1(p) {
  return map(p, (vs2) => vs2.flatMap((v3) => v3));
}
function chainReduce(acc, f) {
  return (data, i) => {
    let loop = true;
    let acc1 = acc;
    let pos = i;
    do {
      const r2 = f(acc1, data, pos)(data, pos);
      if (r2.matched) {
        acc1 = r2.value;
        pos = r2.position;
      } else {
        loop = false;
      }
    } while (loop);
    return {
      matched: true,
      position: pos,
      value: acc1
    };
  };
}
function reduceLeft(acc, p, reducer) {
  return chainReduce(acc, (acc2) => map(p, (v3, data, i, j3) => reducer(acc2, v3, data, i, j3)));
}
function leftAssoc2(pLeft, pOper, pRight) {
  return chain(pLeft, (v0) => reduceLeft(v0, ab(pOper, pRight, (f, y2) => [f, y2]), (acc, [f, y2]) => f(acc, y2)));
}
function chain(p, f) {
  return (data, i) => mapOuter(p(data, i), (m1) => f(m1.value, data, i, m1.position)(data, m1.position));
}

// ../../node_modules/.bun/parseley@0.12.1/node_modules/parseley/lib/parseley.mjs
var ws2 = `(?:[ \\t\\r\\n\\f]*)`;
var nl = `(?:\\n|\\r\\n|\\r|\\f)`;
var nonascii = `[^\\x00-\\x7F]`;
var unicode = `(?:\\\\[0-9a-f]{1,6}(?:\\r\\n|[ \\n\\r\\t\\f])?)`;
var escape = `(?:\\\\[^\\n\\r\\f0-9a-f])`;
var nmstart = `(?:[_a-z]|${nonascii}|${unicode}|${escape})`;
var nmchar = `(?:[_a-z0-9-]|${nonascii}|${unicode}|${escape})`;
var name = `(?:${nmchar}+)`;
var ident = `(?:[-]?${nmstart}${nmchar}*)`;
var string1 = `'([^\\n\\r\\f\\\\']|\\\\${nl}|${nonascii}|${unicode}|${escape})*'`;
var string2 = `"([^\\n\\r\\f\\\\"]|\\\\${nl}|${nonascii}|${unicode}|${escape})*"`;
var lexSelector = o([
  { name: "ws", regex: new RegExp(ws2) },
  { name: "hash", regex: new RegExp(`#${name}`, "i") },
  { name: "ident", regex: new RegExp(ident, "i") },
  { name: "str1", regex: new RegExp(string1, "i") },
  { name: "str2", regex: new RegExp(string2, "i") },
  { name: "*" },
  { name: "." },
  { name: "," },
  { name: "[" },
  { name: "]" },
  { name: "=" },
  { name: ">" },
  { name: "|" },
  { name: "+" },
  { name: "~" },
  { name: "^" },
  { name: "$" }
]);
var lexEscapedString = o([
  { name: "unicode", regex: new RegExp(unicode, "i") },
  { name: "escape", regex: new RegExp(escape, "i") },
  { name: "any", regex: new RegExp("[\\s\\S]", "i") }
]);
function sumSpec([a0, a1, a2], [b0, b1, b22]) {
  return [a0 + b0, a1 + b1, a2 + b22];
}
function sumAllSpec(ss2) {
  return ss2.reduce(sumSpec, [0, 0, 0]);
}
var unicodeEscapedSequence_ = token((t8) => t8.name === "unicode" ? String.fromCodePoint(parseInt(t8.text.slice(1), 16)) : undefined);
var escapedSequence_ = token((t8) => t8.name === "escape" ? t8.text.slice(1) : undefined);
var anyChar_ = token((t8) => t8.name === "any" ? t8.text : undefined);
var escapedString_ = map(many(choice(unicodeEscapedSequence_, escapedSequence_, anyChar_)), (cs2) => cs2.join(""));
function unescape(escapedString) {
  const lexerResult = lexEscapedString(escapedString);
  const result = escapedString_({ tokens: lexerResult.tokens, options: undefined }, 0);
  return result.value;
}
function literal(name2) {
  return token((t8) => t8.name === name2 ? true : undefined);
}
var whitespace_ = token((t8) => t8.name === "ws" ? null : undefined);
var optionalWhitespace_ = option(whitespace_, null);
function optionallySpaced(parser) {
  return middle(optionalWhitespace_, parser, optionalWhitespace_);
}
var identifier_ = token((t8) => t8.name === "ident" ? unescape(t8.text) : undefined);
var hashId_ = token((t8) => t8.name === "hash" ? unescape(t8.text.slice(1)) : undefined);
var string_ = token((t8) => t8.name.startsWith("str") ? unescape(t8.text.slice(1, -1)) : undefined);
var namespace_ = left(option(identifier_, ""), literal("|"));
var qualifiedName_ = otherwise(ab(namespace_, identifier_, (ns2, name2) => ({ name: name2, namespace: ns2 })), map(identifier_, (name2) => ({ name: name2, namespace: null })));
var uniSelector_ = otherwise(ab(namespace_, literal("*"), (ns2) => ({ type: "universal", namespace: ns2, specificity: [0, 0, 0] })), map(literal("*"), () => ({ type: "universal", namespace: null, specificity: [0, 0, 0] })));
var tagSelector_ = map(qualifiedName_, ({ name: name2, namespace }) => ({
  type: "tag",
  name: name2,
  namespace,
  specificity: [0, 0, 1]
}));
var classSelector_ = ab(literal("."), identifier_, (fullstop, name2) => ({
  type: "class",
  name: name2,
  specificity: [0, 1, 0]
}));
var idSelector_ = map(hashId_, (name2) => ({
  type: "id",
  name: name2,
  specificity: [1, 0, 0]
}));
var attrModifier_ = token((t8) => {
  if (t8.name === "ident") {
    if (t8.text === "i" || t8.text === "I") {
      return "i";
    }
    if (t8.text === "s" || t8.text === "S") {
      return "s";
    }
  }
  return;
});
var attrValue_ = otherwise(ab(string_, option(right(optionalWhitespace_, attrModifier_), null), (v3, mod) => ({ value: v3, modifier: mod })), ab(identifier_, option(right(whitespace_, attrModifier_), null), (v3, mod) => ({ value: v3, modifier: mod })));
var attrMatcher_ = choice(map(literal("="), () => "="), ab(literal("~"), literal("="), () => "~="), ab(literal("|"), literal("="), () => "|="), ab(literal("^"), literal("="), () => "^="), ab(literal("$"), literal("="), () => "$="), ab(literal("*"), literal("="), () => "*="));
var attrPresenceSelector_ = abc(literal("["), optionallySpaced(qualifiedName_), literal("]"), (lbr, { name: name2, namespace }) => ({
  type: "attrPresence",
  name: name2,
  namespace,
  specificity: [0, 1, 0]
}));
var attrValueSelector_ = middle(literal("["), abc(optionallySpaced(qualifiedName_), attrMatcher_, optionallySpaced(attrValue_), ({ name: name2, namespace }, matcher, { value, modifier }) => ({
  type: "attrValue",
  name: name2,
  namespace,
  matcher,
  value,
  modifier,
  specificity: [0, 1, 0]
})), literal("]"));
var attrSelector_ = otherwise(attrPresenceSelector_, attrValueSelector_);
var typeSelector_ = otherwise(uniSelector_, tagSelector_);
var subclassSelector_ = choice(idSelector_, classSelector_, attrSelector_);
var compoundSelector_ = map(otherwise(flatten(typeSelector_, many(subclassSelector_)), many1(subclassSelector_)), (ss2) => {
  return {
    type: "compound",
    list: ss2,
    specificity: sumAllSpec(ss2.map((s2) => s2.specificity))
  };
});
var combinator_ = choice(map(literal(">"), () => ">"), map(literal("+"), () => "+"), map(literal("~"), () => "~"), ab(literal("|"), literal("|"), () => "||"));
var combinatorSeparator_ = otherwise(optionallySpaced(combinator_), map(whitespace_, () => " "));
var complexSelector_ = leftAssoc2(compoundSelector_, map(combinatorSeparator_, (c2) => (left2, right2) => ({
  type: "compound",
  list: [...right2.list, { type: "combinator", combinator: c2, left: left2, specificity: left2.specificity }],
  specificity: sumSpec(left2.specificity, right2.specificity)
})), compoundSelector_);
var listSelector_ = leftAssoc2(map(complexSelector_, (s2) => ({ type: "list", list: [s2] })), map(optionallySpaced(literal(",")), () => (acc, next) => ({ type: "list", list: [...acc.list, next] })), complexSelector_);
function parse_(parser, str) {
  if (!(typeof str === "string" || str instanceof String)) {
    throw new Error("Expected a selector string. Actual input is not a string!");
  }
  const lexerResult = lexSelector(str);
  if (!lexerResult.complete) {
    throw new Error(`The input "${str}" was only partially tokenized, stopped at offset ${lexerResult.offset}!
` + prettyPrintPosition(str, lexerResult.offset));
  }
  const result = optionallySpaced(parser)({ tokens: lexerResult.tokens, options: undefined }, 0);
  if (!result.matched) {
    throw new Error(`No match for "${str}" input!`);
  }
  if (result.position < lexerResult.tokens.length) {
    const token2 = lexerResult.tokens[result.position];
    throw new Error(`The input "${str}" was only partially parsed, stopped at offset ${token2.offset}!
` + prettyPrintPosition(str, token2.offset, token2.len));
  }
  return result.value;
}
function prettyPrintPosition(str, offset, len = 1) {
  return `${str.replace(/(\t)|(\r)|(\n)/g, (m, t8, r2) => t8 ? "␉" : r2 ? "␍" : "␊")}
${"".padEnd(offset)}${"^".repeat(len)}`;
}
function parse1(str) {
  return parse_(complexSelector_, str);
}
function serialize(selector) {
  if (!selector.type) {
    throw new Error("This is not an AST node.");
  }
  switch (selector.type) {
    case "universal":
      return _serNs(selector.namespace) + "*";
    case "tag":
      return _serNs(selector.namespace) + _serIdent(selector.name);
    case "class":
      return "." + _serIdent(selector.name);
    case "id":
      return "#" + _serIdent(selector.name);
    case "attrPresence":
      return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}]`;
    case "attrValue":
      return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}${selector.matcher}"${_serStr(selector.value)}"${selector.modifier ? selector.modifier : ""}]`;
    case "combinator":
      return serialize(selector.left) + selector.combinator;
    case "compound":
      return selector.list.reduce((acc, node2) => {
        if (node2.type === "combinator") {
          return serialize(node2) + acc;
        } else {
          return acc + serialize(node2);
        }
      }, "");
    case "list":
      return selector.list.map(serialize).join(",");
  }
}
function _serNs(ns2) {
  return ns2 || ns2 === "" ? _serIdent(ns2) + "|" : "";
}
function _codePoint(char) {
  return `\\${char.codePointAt(0).toString(16)} `;
}
function _serIdent(str) {
  return str.replace(/(^[0-9])|(^-[0-9])|(^-$)|([-0-9a-zA-Z_]|[^\x00-\x7F])|(\x00)|([\x01-\x1f]|\x7f)|([\s\S])/g, (m, d1, d2, hy, safe, nl2, ctrl, other) => d1 ? _codePoint(d1) : d2 ? "-" + _codePoint(d2.slice(1)) : hy ? "\\-" : safe ? safe : nl2 ? "�" : ctrl ? _codePoint(ctrl) : "\\" + other);
}
function _serStr(str) {
  return str.replace(/(")|(\\)|(\x00)|([\x01-\x1f]|\x7f)/g, (m, dq, bs2, nl2, ctrl) => dq ? "\\\"" : bs2 ? "\\\\" : nl2 ? "�" : _codePoint(ctrl));
}
function normalize(selector) {
  if (!selector.type) {
    throw new Error("This is not an AST node.");
  }
  switch (selector.type) {
    case "compound": {
      selector.list.forEach(normalize);
      selector.list.sort((a, b3) => _compareArrays(_getSelectorPriority(a), _getSelectorPriority(b3)));
      break;
    }
    case "combinator": {
      normalize(selector.left);
      break;
    }
    case "list": {
      selector.list.forEach(normalize);
      selector.list.sort((a, b3) => serialize(a) < serialize(b3) ? -1 : 1);
      break;
    }
  }
  return selector;
}
function _getSelectorPriority(selector) {
  switch (selector.type) {
    case "universal":
      return [1];
    case "tag":
      return [1];
    case "id":
      return [2];
    case "class":
      return [3, selector.name];
    case "attrPresence":
      return [4, serialize(selector)];
    case "attrValue":
      return [5, serialize(selector)];
    case "combinator":
      return [15, serialize(selector)];
  }
}
function compareSpecificity(a, b3) {
  return _compareArrays(a, b3);
}
function _compareArrays(a, b3) {
  if (!Array.isArray(a) || !Array.isArray(b3)) {
    throw new Error("Arguments must be arrays.");
  }
  const shorter = a.length < b3.length ? a.length : b3.length;
  for (let i = 0;i < shorter; i++) {
    if (a[i] === b3[i]) {
      continue;
    }
    return a[i] < b3[i] ? -1 : 1;
  }
  return a.length - b3.length;
}

// ../../node_modules/.bun/selderee@0.11.0/node_modules/selderee/lib/selderee.mjs
class DecisionTree {
  constructor(input) {
    this.branches = weave(toAstTerminalPairs(input));
  }
  build(builder) {
    return builder(this.branches);
  }
}
function toAstTerminalPairs(array) {
  const len = array.length;
  const results = new Array(len);
  for (let i = 0;i < len; i++) {
    const [selectorString, val] = array[i];
    const ast = preprocess(parse1(selectorString));
    results[i] = {
      ast,
      terminal: {
        type: "terminal",
        valueContainer: { index: i, value: val, specificity: ast.specificity }
      }
    };
  }
  return results;
}
function preprocess(ast) {
  reduceSelectorVariants(ast);
  normalize(ast);
  return ast;
}
function reduceSelectorVariants(ast) {
  const newList = [];
  ast.list.forEach((sel) => {
    switch (sel.type) {
      case "class":
        newList.push({
          matcher: "~=",
          modifier: null,
          name: "class",
          namespace: null,
          specificity: sel.specificity,
          type: "attrValue",
          value: sel.name
        });
        break;
      case "id":
        newList.push({
          matcher: "=",
          modifier: null,
          name: "id",
          namespace: null,
          specificity: sel.specificity,
          type: "attrValue",
          value: sel.name
        });
        break;
      case "combinator":
        reduceSelectorVariants(sel.left);
        newList.push(sel);
        break;
      case "universal":
        break;
      default:
        newList.push(sel);
        break;
    }
  });
  ast.list = newList;
}
function weave(items) {
  const branches = [];
  while (items.length) {
    const topKind = findTopKey(items, (sel) => true, getSelectorKind);
    const { matches, nonmatches, empty } = breakByKind(items, topKind);
    items = nonmatches;
    if (matches.length) {
      branches.push(branchOfKind(topKind, matches));
    }
    if (empty.length) {
      branches.push(...terminate(empty));
    }
  }
  return branches;
}
function terminate(items) {
  const results = [];
  for (const item of items) {
    const terminal = item.terminal;
    if (terminal.type === "terminal") {
      results.push(terminal);
    } else {
      const { matches, rest } = partition(terminal.cont, (node2) => node2.type === "terminal");
      matches.forEach((node2) => results.push(node2));
      if (rest.length) {
        terminal.cont = rest;
        results.push(terminal);
      }
    }
  }
  return results;
}
function breakByKind(items, selectedKind) {
  const matches = [];
  const nonmatches = [];
  const empty = [];
  for (const item of items) {
    const simpsels = item.ast.list;
    if (simpsels.length) {
      const isMatch = simpsels.some((node2) => getSelectorKind(node2) === selectedKind);
      (isMatch ? matches : nonmatches).push(item);
    } else {
      empty.push(item);
    }
  }
  return { matches, nonmatches, empty };
}
function getSelectorKind(sel) {
  switch (sel.type) {
    case "attrPresence":
      return `attrPresence ${sel.name}`;
    case "attrValue":
      return `attrValue ${sel.name}`;
    case "combinator":
      return `combinator ${sel.combinator}`;
    default:
      return sel.type;
  }
}
function branchOfKind(kind, items) {
  if (kind === "tag") {
    return tagNameBranch(items);
  }
  if (kind.startsWith("attrValue ")) {
    return attrValueBranch(kind.substring(10), items);
  }
  if (kind.startsWith("attrPresence ")) {
    return attrPresenceBranch(kind.substring(13), items);
  }
  if (kind === "combinator >") {
    return combinatorBranch(">", items);
  }
  if (kind === "combinator +") {
    return combinatorBranch("+", items);
  }
  throw new Error(`Unsupported selector kind: ${kind}`);
}
function tagNameBranch(items) {
  const groups = spliceAndGroup(items, (x) => x.type === "tag", (x) => x.name);
  const variants = Object.entries(groups).map(([name2, group]) => ({
    type: "variant",
    value: name2,
    cont: weave(group.items)
  }));
  return {
    type: "tagName",
    variants
  };
}
function attrPresenceBranch(name2, items) {
  for (const item of items) {
    spliceSimpleSelector(item, (x) => x.type === "attrPresence" && x.name === name2);
  }
  return {
    type: "attrPresence",
    name: name2,
    cont: weave(items)
  };
}
function attrValueBranch(name2, items) {
  const groups = spliceAndGroup(items, (x) => x.type === "attrValue" && x.name === name2, (x) => `${x.matcher} ${x.modifier || ""} ${x.value}`);
  const matchers = [];
  for (const group of Object.values(groups)) {
    const sel = group.oneSimpleSelector;
    const predicate = getAttrPredicate(sel);
    const continuation = weave(group.items);
    matchers.push({
      type: "matcher",
      matcher: sel.matcher,
      modifier: sel.modifier,
      value: sel.value,
      predicate,
      cont: continuation
    });
  }
  return {
    type: "attrValue",
    name: name2,
    matchers
  };
}
function getAttrPredicate(sel) {
  if (sel.modifier === "i") {
    const expected = sel.value.toLowerCase();
    switch (sel.matcher) {
      case "=":
        return (actual) => expected === actual.toLowerCase();
      case "~=":
        return (actual) => actual.toLowerCase().split(/[ \t]+/).includes(expected);
      case "^=":
        return (actual) => actual.toLowerCase().startsWith(expected);
      case "$=":
        return (actual) => actual.toLowerCase().endsWith(expected);
      case "*=":
        return (actual) => actual.toLowerCase().includes(expected);
      case "|=":
        return (actual) => {
          const lower = actual.toLowerCase();
          return expected === lower || lower.startsWith(expected) && lower[expected.length] === "-";
        };
    }
  } else {
    const expected = sel.value;
    switch (sel.matcher) {
      case "=":
        return (actual) => expected === actual;
      case "~=":
        return (actual) => actual.split(/[ \t]+/).includes(expected);
      case "^=":
        return (actual) => actual.startsWith(expected);
      case "$=":
        return (actual) => actual.endsWith(expected);
      case "*=":
        return (actual) => actual.includes(expected);
      case "|=":
        return (actual) => expected === actual || actual.startsWith(expected) && actual[expected.length] === "-";
    }
  }
}
function combinatorBranch(combinator, items) {
  const groups = spliceAndGroup(items, (x) => x.type === "combinator" && x.combinator === combinator, (x) => serialize(x.left));
  const leftItems = [];
  for (const group of Object.values(groups)) {
    const rightCont = weave(group.items);
    const leftAst = group.oneSimpleSelector.left;
    leftItems.push({
      ast: leftAst,
      terminal: { type: "popElement", cont: rightCont }
    });
  }
  return {
    type: "pushElement",
    combinator,
    cont: weave(leftItems)
  };
}
function spliceAndGroup(items, predicate, keyCallback) {
  const groups = {};
  while (items.length) {
    const bestKey = findTopKey(items, predicate, keyCallback);
    const bestKeyPredicate = (sel) => predicate(sel) && keyCallback(sel) === bestKey;
    const hasBestKeyPredicate = (item) => item.ast.list.some(bestKeyPredicate);
    const { matches, rest } = partition1(items, hasBestKeyPredicate);
    let oneSimpleSelector = null;
    for (const item of matches) {
      const splicedNode = spliceSimpleSelector(item, bestKeyPredicate);
      if (!oneSimpleSelector) {
        oneSimpleSelector = splicedNode;
      }
    }
    if (oneSimpleSelector == null) {
      throw new Error("No simple selector is found.");
    }
    groups[bestKey] = { oneSimpleSelector, items: matches };
    items = rest;
  }
  return groups;
}
function spliceSimpleSelector(item, predicate) {
  const simpsels = item.ast.list;
  const matches = new Array(simpsels.length);
  let firstIndex = -1;
  for (let i = simpsels.length;i-- > 0; ) {
    if (predicate(simpsels[i])) {
      matches[i] = true;
      firstIndex = i;
    }
  }
  if (firstIndex == -1) {
    throw new Error(`Couldn't find the required simple selector.`);
  }
  const result = simpsels[firstIndex];
  item.ast.list = simpsels.filter((sel, i) => !matches[i]);
  return result;
}
function findTopKey(items, predicate, keyCallback) {
  const candidates = {};
  for (const item of items) {
    const candidates1 = {};
    for (const node2 of item.ast.list.filter(predicate)) {
      candidates1[keyCallback(node2)] = true;
    }
    for (const key of Object.keys(candidates1)) {
      if (candidates[key]) {
        candidates[key]++;
      } else {
        candidates[key] = 1;
      }
    }
  }
  let topKind = "";
  let topCounter = 0;
  for (const entry of Object.entries(candidates)) {
    if (entry[1] > topCounter) {
      topKind = entry[0];
      topCounter = entry[1];
    }
  }
  return topKind;
}
function partition(src, predicate) {
  const matches = [];
  const rest = [];
  for (const x of src) {
    if (predicate(x)) {
      matches.push(x);
    } else {
      rest.push(x);
    }
  }
  return { matches, rest };
}
function partition1(src, predicate) {
  const matches = [];
  const rest = [];
  for (const x of src) {
    if (predicate(x)) {
      matches.push(x);
    } else {
      rest.push(x);
    }
  }
  return { matches, rest };
}

class Picker {
  constructor(f) {
    this.f = f;
  }
  pickAll(el) {
    return this.f(el);
  }
  pick1(el, preferFirst = false) {
    const results = this.f(el);
    const len = results.length;
    if (len === 0) {
      return null;
    }
    if (len === 1) {
      return results[0].value;
    }
    const comparator = preferFirst ? comparatorPreferFirst : comparatorPreferLast;
    let result = results[0];
    for (let i = 1;i < len; i++) {
      const next = results[i];
      if (comparator(result, next)) {
        result = next;
      }
    }
    return result.value;
  }
}
function comparatorPreferFirst(acc, next) {
  const diff = compareSpecificity(next.specificity, acc.specificity);
  return diff > 0 || diff === 0 && next.index < acc.index;
}
function comparatorPreferLast(acc, next) {
  const diff = compareSpecificity(next.specificity, acc.specificity);
  return diff > 0 || diff === 0 && next.index > acc.index;
}

// ../../node_modules/.bun/@selderee+plugin-htmlparser2@0.11.0/node_modules/@selderee/plugin-htmlparser2/lib/hp2-builder.mjs
function hp2Builder(nodes) {
  return new Picker(handleArray(nodes));
}
function handleArray(nodes) {
  const matchers = nodes.map(handleNode);
  return (el, ...tail) => matchers.flatMap((m) => m(el, ...tail));
}
function handleNode(node2) {
  switch (node2.type) {
    case "terminal": {
      const result = [node2.valueContainer];
      return (el, ...tail) => result;
    }
    case "tagName":
      return handleTagName(node2);
    case "attrValue":
      return handleAttrValueName(node2);
    case "attrPresence":
      return handleAttrPresenceName(node2);
    case "pushElement":
      return handlePushElementNode(node2);
    case "popElement":
      return handlePopElementNode(node2);
  }
}
function handleTagName(node2) {
  const variants = {};
  for (const variant of node2.variants) {
    variants[variant.value] = handleArray(variant.cont);
  }
  return (el, ...tail) => {
    const continuation = variants[el.name];
    return continuation ? continuation(el, ...tail) : [];
  };
}
function handleAttrPresenceName(node2) {
  const attrName = node2.name;
  const continuation = handleArray(node2.cont);
  return (el, ...tail) => Object.prototype.hasOwnProperty.call(el.attribs, attrName) ? continuation(el, ...tail) : [];
}
function handleAttrValueName(node2) {
  const callbacks = [];
  for (const matcher of node2.matchers) {
    const predicate = matcher.predicate;
    const continuation = handleArray(matcher.cont);
    callbacks.push((attr, el, ...tail) => predicate(attr) ? continuation(el, ...tail) : []);
  }
  const attrName = node2.name;
  return (el, ...tail) => {
    const attr = el.attribs[attrName];
    return attr || attr === "" ? callbacks.flatMap((cb) => cb(attr, el, ...tail)) : [];
  };
}
function handlePushElementNode(node2) {
  const continuation = handleArray(node2.cont);
  const leftElementGetter = node2.combinator === "+" ? getPrecedingElement : getParentElement;
  return (el, ...tail) => {
    const next = leftElementGetter(el);
    if (next === null) {
      return [];
    }
    return continuation(next, el, ...tail);
  };
}
var getPrecedingElement = (el) => {
  const prev = el.prev;
  if (prev === null) {
    return null;
  }
  return isTag2(prev) ? prev : getPrecedingElement(prev);
};
var getParentElement = (el) => {
  const parent = el.parent;
  return parent && isTag2(parent) ? parent : null;
};
function handlePopElementNode(node2) {
  const continuation = handleArray(node2.cont);
  return (el, next, ...tail) => continuation(next, ...tail);
}

// ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-html.js
var decode_data_html_default = new Uint16Array("ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\x00\x00\x00\x00\x00\x00ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀\uD835\uDD04rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀\uD835\uDD38plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀\uD835\uDC9Cign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀\uD835\uDD05pf;쀀\uD835\uDD39eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀\uD835\uDC9EpĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀\uD835\uDD07Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\x00\x00\x00͔͂\x00Ѕf;쀀\uD835\uDD3Bƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\x00\x00ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\x00\x00ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\x00ц\x00ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\x00ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀\uD835\uDC9Frok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀\uD835\uDD08rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\x00\x00ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀\uD835\uDD3Csilon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀\uD835\uDD09lledɓ֗\x00\x00֣mallSquare;旼erySmallSquare;斪Ͱֺ\x00ֿ\x00\x00ׄf;쀀\uD835\uDD3DAll;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀\uD835\uDD0A;拙pf;쀀\uD835\uDD3Eeater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀\uD835\uDCA2;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\x00ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\x00ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀\uD835\uDD40a;䎙cr;愐ilde;䄨ǫޚ\x00ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀\uD835\uDD0Dpf;쀀\uD835\uDD41ǣ߇\x00ߌr;쀀\uD835\uDCA5rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀\uD835\uDD0Epf;쀀\uD835\uDD42cr;쀀\uD835\uDCA6րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\x00ࣃbleBracket;柦nǔࣈ\x00࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀\uD835\uDD0FĀ;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀\uD835\uDD43erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀\uD835\uDD10nusPlus;戓pf;쀀\uD835\uDD44cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀\uD835\uDD11ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀\uD835\uDCA9ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀\uD835\uDD12rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀\uD835\uDD46enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀\uD835\uDCAAash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀\uD835\uDD13i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀\uD835\uDCAB;䎨ȀUfos༑༖༛༟OT耻\"䀢r;쀀\uD835\uDD14pf;愚cr;쀀\uD835\uDCAC؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\x00စbleBracket;柧nǔည\x00နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀\uD835\uDD16ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀\uD835\uDD4Aɲᅭ\x00\x00ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀\uD835\uDCAEar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀\uD835\uDD17Āeiቻ኉ǲኀ\x00ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀\uD835\uDD4BipleDot;惛Āctዖዛr;쀀\uD835\uDCAFrok;䅦ૡዷጎጚጦ\x00ጬጱ\x00\x00\x00\x00\x00ጸጽ፷ᎅ\x00᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\x00጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀\uD835\uDD18rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀\uD835\uDD4CЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀\uD835\uDCB0ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀\uD835\uDD19pf;쀀\uD835\uDD4Dcr;쀀\uD835\uDCB1dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀\uD835\uDD1Apf;쀀\uD835\uDD4Ecr;쀀\uD835\uDCB2Ȁfiosᓋᓐᓒᓘr;쀀\uD835\uDD1B;䎞pf;쀀\uD835\uDD4Fcr;쀀\uD835\uDCB3ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀\uD835\uDD1Cpf;쀀\uD835\uDD50cr;쀀\uD835\uDCB4ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\x00ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀\uD835\uDCB5௡ᖃᖊᖐ\x00ᖰᖶᖿ\x00\x00\x00\x00ᗆᗛᗫᙟ᙭\x00ᚕ᚛ᚲᚹ\x00ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀\uD835\uDD1Erave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\x00\x00ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀\uD835\uDD52΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀\uD835\uDCB6;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀\uD835\uDD1Fg΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\x00\x00ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\x00ᠳƲᠯ\x00ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀\uD835\uDD53Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀\uD835\uDCB7mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\x00᧨ᨑᨕᨲ\x00ᨷᩐ\x00\x00᪴\x00\x00᫁\x00\x00ᬡᬮ᭍᭒\x00᯽\x00ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\x00᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀\uD835\uDD20ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\x00\x00᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\x00ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\x00\x00᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\x00ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀\uD835\uDD54oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀\uD835\uDCB8Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\x00\x00᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\x00\x00ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀\uD835\uDD21arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\x00\x00ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀\uD835\uDD55ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\x00\x00ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀\uD835\uDCB9;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀\uD835\uDD22ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀\uD835\uDD56ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\x00\x00ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\x00ᾞ\x00ᾡᾧ\x00\x00ῆῌ\x00ΐ\x00ῦῪ \x00 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\x00\x00᾽g;耀ﬀig;耀ﬄ;쀀\uD835\uDD23lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\x00ῳf;쀀\uD835\uDD57ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\x00⁐β•‥‧‪‬\x00‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\x00‶;慔;慖ʴ‾⁁\x00\x00⁃耻¾䂾;慗;慜5;慘ƶ⁌\x00⁎;慚;慝8;慞l;恄wn;挢cr;쀀\uD835\uDCBBࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀\uD835\uDD24Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀\uD835\uDD58Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\x00↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀\uD835\uDD25sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀\uD835\uDD59bar;怕ƀclt≯≴≸r;쀀\uD835\uDCBDasè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\x00⊪\x00⊸⋅⋎\x00⋕⋳\x00\x00⋸⌢⍧⍢⍿\x00⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀\uD835\uDD26rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀\uD835\uDD5Aa;䎹uest耻¿䂿Āci⎊⎏r;쀀\uD835\uDCBEnʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\x00⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀\uD835\uDD27ath;䈷pf;쀀\uD835\uDD5Bǣ⏬\x00⏱r;쀀\uD835\uDCBFrcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀\uD835\uDD28reen;䄸cy;䑅cy;䑜pf;쀀\uD835\uDD5Ccr;쀀\uD835\uDCC0஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\x00⒪\x00⒱\x00\x00\x00\x00\x00⒵Ⓔ\x00ⓆⓈⓍ\x00⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀\uD835\uDD29Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀\uD835\uDD5Dus;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀\uD835\uDCC1mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀\uD835\uDD2Ao;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀\uD835\uDD5EĀct⣸⣽r;쀀\uD835\uDCC2pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\x00⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\x00⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀\uD835\uDD2BȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀\uD835\uDD5F膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀\uD835\uDCC3ortɭ⬅\x00\x00⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00ⴭ\x00ⴸⵈⵠⵥ⵲ⶄᬇ\x00\x00ⶍⶫ\x00ⷈⷎ\x00ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀\uD835\uDD2Cͯ⵹\x00\x00⵼\x00ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀\uD835\uDD60ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\x00⹽\x00⺀⺝\x00⺢⺹\x00\x00⻋ຜ\x00⼓\x00\x00⼫⾼\x00⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\x00\x00⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀\uD835\uDD2Dƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀\uD835\uDD61nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀\uD835\uDCC5;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀\uD835\uDD2Epf;쀀\uD835\uDD62rime;恗cr;쀀\uD835\uDCC6ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀\uD835\uDD2FĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀\uD835\uDD63us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀\uD835\uDCC7Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\x00㍺㎤\x00\x00㏬㏰\x00㐨㑈㑚㒭㒱㓊㓱\x00㘖\x00\x00㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\x00㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀\uD835\uDD30Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\x00\x00㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀\uD835\uDD64aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀\uD835\uDCC8tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\x00㙾㛂\x00\x00\x00\x00\x00㛛㜃\x00㜉㝬\x00\x00\x00㞇ɲ㙖\x00\x00㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀\uD835\uDD31Ȁeiko㚆㚝㚵㚼ǲ㚋\x00㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀\uD835\uDD65rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀\uD835\uDCC9;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\x00㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀\uD835\uDD32rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\x00\x00㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀\uD835\uDD66̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\x00\x00㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀\uD835\uDCCAƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀\uD835\uDD33tré㦮suĀbp㧯㧱»ജ»൙pf;쀀\uD835\uDD67roð໻tré㦴Ācu㨆㨋r;쀀\uD835\uDCCBĀbp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀\uD835\uDD34pf;쀀\uD835\uDD68Ā;eᑹ㩦atèᑹcr;쀀\uD835\uDCCCૣណ㪇\x00㪋\x00㪐㪛\x00\x00㪝㪨㪫㪯\x00\x00㫃㫎\x00㫘ៜ៟tré៑r;쀀\uD835\uDD35ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀\uD835\uDD69imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀\uD835\uDCCDĀpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀\uD835\uDD36cy;䑗pf;쀀\uD835\uDD6Acr;쀀\uD835\uDCCEĀcm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀\uD835\uDD37cy;䐶grarr;懝pf;쀀\uD835\uDD6Bcr;쀀\uD835\uDCCFĀjn㮅㮇;怍j;怌".split("").map((c2) => c2.charCodeAt(0)));

// ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-xml.js
var decode_data_xml_default = new Uint16Array("Ȁaglq\t\x15\x18\x1Bɭ\x0F\x00\x00\x12p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((c2) => c2.charCodeAt(0)));

// ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/decode_codepoint.js
var _a2;
var decodeMap = new Map([
  [0, 65533],
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
var fromCodePoint = (_a2 = String.fromCodePoint) !== null && _a2 !== undefined ? _a2 : function(codePoint) {
  let output = "";
  if (codePoint > 65535) {
    codePoint -= 65536;
    output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
    codePoint = 56320 | codePoint & 1023;
  }
  output += String.fromCharCode(codePoint);
  return output;
};
function replaceCodePoint(codePoint) {
  var _a3;
  if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
    return 65533;
  }
  return (_a3 = decodeMap.get(codePoint)) !== null && _a3 !== undefined ? _a3 : codePoint;
}
// ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/decode.js
var CharCodes;
(function(CharCodes2) {
  CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
  CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
  CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
  CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
  CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
  CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
  CharCodes2[CharCodes2["LOWER_F"] = 102] = "LOWER_F";
  CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
  CharCodes2[CharCodes2["LOWER_Z"] = 122] = "LOWER_Z";
  CharCodes2[CharCodes2["UPPER_A"] = 65] = "UPPER_A";
  CharCodes2[CharCodes2["UPPER_F"] = 70] = "UPPER_F";
  CharCodes2[CharCodes2["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
var TO_LOWER_BIT = 32;
var BinTrieFlags;
(function(BinTrieFlags2) {
  BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
  BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
  BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function isNumber(code) {
  return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
}
function isAsciiAlphaNumeric(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
}
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function(EntityDecoderState2) {
  EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
  EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
  EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
  EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
  EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode2) {
  DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
  DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
  DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));

class EntityDecoder {
  constructor(decodeTree, emitCodePoint, errors) {
    this.decodeTree = decodeTree;
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
    this.state = EntityDecoderState.EntityStart;
    this.consumed = 1;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.decodeMode = DecodingMode.Strict;
  }
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = EntityDecoderState.EntityStart;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.consumed = 1;
  }
  write(str, offset) {
    switch (this.state) {
      case EntityDecoderState.EntityStart: {
        if (str.charCodeAt(offset) === CharCodes.NUM) {
          this.state = EntityDecoderState.NumericStart;
          this.consumed += 1;
          return this.stateNumericStart(str, offset + 1);
        }
        this.state = EntityDecoderState.NamedEntity;
        return this.stateNamedEntity(str, offset);
      }
      case EntityDecoderState.NumericStart: {
        return this.stateNumericStart(str, offset);
      }
      case EntityDecoderState.NumericDecimal: {
        return this.stateNumericDecimal(str, offset);
      }
      case EntityDecoderState.NumericHex: {
        return this.stateNumericHex(str, offset);
      }
      case EntityDecoderState.NamedEntity: {
        return this.stateNamedEntity(str, offset);
      }
    }
  }
  stateNumericStart(str, offset) {
    if (offset >= str.length) {
      return -1;
    }
    if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
      this.state = EntityDecoderState.NumericHex;
      this.consumed += 1;
      return this.stateNumericHex(str, offset + 1);
    }
    this.state = EntityDecoderState.NumericDecimal;
    return this.stateNumericDecimal(str, offset);
  }
  addToNumericResult(str, start, end, base) {
    if (start !== end) {
      const digitCount = end - start;
      this.result = this.result * Math.pow(base, digitCount) + parseInt(str.substr(start, digitCount), base);
      this.consumed += digitCount;
    }
  }
  stateNumericHex(str, offset) {
    const startIdx = offset;
    while (offset < str.length) {
      const char = str.charCodeAt(offset);
      if (isNumber(char) || isHexadecimalCharacter(char)) {
        offset += 1;
      } else {
        this.addToNumericResult(str, startIdx, offset, 16);
        return this.emitNumericEntity(char, 3);
      }
    }
    this.addToNumericResult(str, startIdx, offset, 16);
    return -1;
  }
  stateNumericDecimal(str, offset) {
    const startIdx = offset;
    while (offset < str.length) {
      const char = str.charCodeAt(offset);
      if (isNumber(char)) {
        offset += 1;
      } else {
        this.addToNumericResult(str, startIdx, offset, 10);
        return this.emitNumericEntity(char, 2);
      }
    }
    this.addToNumericResult(str, startIdx, offset, 10);
    return -1;
  }
  emitNumericEntity(lastCp, expectedLength) {
    var _a3;
    if (this.consumed <= expectedLength) {
      (_a3 = this.errors) === null || _a3 === undefined || _a3.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CharCodes.SEMI) {
      this.consumed += 1;
    } else if (this.decodeMode === DecodingMode.Strict) {
      return 0;
    }
    this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CharCodes.SEMI) {
        this.errors.missingSemicolonAfterCharacterReference();
      }
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  stateNamedEntity(str, offset) {
    const { decodeTree } = this;
    let current = decodeTree[this.treeIndex];
    let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
    for (;offset < str.length; offset++, this.excess++) {
      const char = str.charCodeAt(offset);
      this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
      if (this.treeIndex < 0) {
        return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
      }
      current = decodeTree[this.treeIndex];
      valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      if (valueLength !== 0) {
        if (char === CharCodes.SEMI) {
          return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
        }
        if (this.decodeMode !== DecodingMode.Strict) {
          this.result = this.treeIndex;
          this.consumed += this.excess;
          this.excess = 0;
        }
      }
    }
    return -1;
  }
  emitNotTerminatedNamedEntity() {
    var _a3;
    const { result, decodeTree } = this;
    const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
    this.emitNamedEntityData(result, valueLength, this.consumed);
    (_a3 = this.errors) === null || _a3 === undefined || _a3.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
  emitNamedEntityData(result, valueLength, consumed) {
    const { decodeTree } = this;
    this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
    if (valueLength === 3) {
      this.emitCodePoint(decodeTree[result + 2], consumed);
    }
    return consumed;
  }
  end() {
    var _a3;
    switch (this.state) {
      case EntityDecoderState.NamedEntity: {
        return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      }
      case EntityDecoderState.NumericDecimal: {
        return this.emitNumericEntity(0, 2);
      }
      case EntityDecoderState.NumericHex: {
        return this.emitNumericEntity(0, 3);
      }
      case EntityDecoderState.NumericStart: {
        (_a3 = this.errors) === null || _a3 === undefined || _a3.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      case EntityDecoderState.EntityStart: {
        return 0;
      }
    }
  }
}
function getDecoder(decodeTree) {
  let ret = "";
  const decoder = new EntityDecoder(decodeTree, (str) => ret += fromCodePoint(str));
  return function decodeWithTrie(str, decodeMode) {
    let lastIndex = 0;
    let offset = 0;
    while ((offset = str.indexOf("&", offset)) >= 0) {
      ret += str.slice(lastIndex, offset);
      decoder.startEntity(decodeMode);
      const len = decoder.write(str, offset + 1);
      if (len < 0) {
        lastIndex = offset + decoder.end();
        break;
      }
      lastIndex = offset + len;
      offset = len === 0 ? lastIndex + 1 : lastIndex;
    }
    const result = ret + str.slice(lastIndex);
    ret = "";
    return result;
  };
}
function determineBranch(decodeTree, current, nodeIdx, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (branchCount === 0) {
    return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
  }
  if (jumpOffset) {
    const value = char - jumpOffset;
    return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
  }
  let lo3 = nodeIdx;
  let hi2 = lo3 + branchCount - 1;
  while (lo3 <= hi2) {
    const mid = lo3 + hi2 >>> 1;
    const midVal = decodeTree[mid];
    if (midVal < char) {
      lo3 = mid + 1;
    } else if (midVal > char) {
      hi2 = mid - 1;
    } else {
      return decodeTree[mid + branchCount];
    }
  }
  return -1;
}
var htmlDecoder = getDecoder(decode_data_html_default);
var xmlDecoder = getDecoder(decode_data_xml_default);

// ../../node_modules/.bun/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/Tokenizer.js
var CharCodes2;
(function(CharCodes3) {
  CharCodes3[CharCodes3["Tab"] = 9] = "Tab";
  CharCodes3[CharCodes3["NewLine"] = 10] = "NewLine";
  CharCodes3[CharCodes3["FormFeed"] = 12] = "FormFeed";
  CharCodes3[CharCodes3["CarriageReturn"] = 13] = "CarriageReturn";
  CharCodes3[CharCodes3["Space"] = 32] = "Space";
  CharCodes3[CharCodes3["ExclamationMark"] = 33] = "ExclamationMark";
  CharCodes3[CharCodes3["Number"] = 35] = "Number";
  CharCodes3[CharCodes3["Amp"] = 38] = "Amp";
  CharCodes3[CharCodes3["SingleQuote"] = 39] = "SingleQuote";
  CharCodes3[CharCodes3["DoubleQuote"] = 34] = "DoubleQuote";
  CharCodes3[CharCodes3["Dash"] = 45] = "Dash";
  CharCodes3[CharCodes3["Slash"] = 47] = "Slash";
  CharCodes3[CharCodes3["Zero"] = 48] = "Zero";
  CharCodes3[CharCodes3["Nine"] = 57] = "Nine";
  CharCodes3[CharCodes3["Semi"] = 59] = "Semi";
  CharCodes3[CharCodes3["Lt"] = 60] = "Lt";
  CharCodes3[CharCodes3["Eq"] = 61] = "Eq";
  CharCodes3[CharCodes3["Gt"] = 62] = "Gt";
  CharCodes3[CharCodes3["Questionmark"] = 63] = "Questionmark";
  CharCodes3[CharCodes3["UpperA"] = 65] = "UpperA";
  CharCodes3[CharCodes3["LowerA"] = 97] = "LowerA";
  CharCodes3[CharCodes3["UpperF"] = 70] = "UpperF";
  CharCodes3[CharCodes3["LowerF"] = 102] = "LowerF";
  CharCodes3[CharCodes3["UpperZ"] = 90] = "UpperZ";
  CharCodes3[CharCodes3["LowerZ"] = 122] = "LowerZ";
  CharCodes3[CharCodes3["LowerX"] = 120] = "LowerX";
  CharCodes3[CharCodes3["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes2 || (CharCodes2 = {}));
var State;
(function(State2) {
  State2[State2["Text"] = 1] = "Text";
  State2[State2["BeforeTagName"] = 2] = "BeforeTagName";
  State2[State2["InTagName"] = 3] = "InTagName";
  State2[State2["InSelfClosingTag"] = 4] = "InSelfClosingTag";
  State2[State2["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
  State2[State2["InClosingTagName"] = 6] = "InClosingTagName";
  State2[State2["AfterClosingTagName"] = 7] = "AfterClosingTagName";
  State2[State2["BeforeAttributeName"] = 8] = "BeforeAttributeName";
  State2[State2["InAttributeName"] = 9] = "InAttributeName";
  State2[State2["AfterAttributeName"] = 10] = "AfterAttributeName";
  State2[State2["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
  State2[State2["InAttributeValueDq"] = 12] = "InAttributeValueDq";
  State2[State2["InAttributeValueSq"] = 13] = "InAttributeValueSq";
  State2[State2["InAttributeValueNq"] = 14] = "InAttributeValueNq";
  State2[State2["BeforeDeclaration"] = 15] = "BeforeDeclaration";
  State2[State2["InDeclaration"] = 16] = "InDeclaration";
  State2[State2["InProcessingInstruction"] = 17] = "InProcessingInstruction";
  State2[State2["BeforeComment"] = 18] = "BeforeComment";
  State2[State2["CDATASequence"] = 19] = "CDATASequence";
  State2[State2["InSpecialComment"] = 20] = "InSpecialComment";
  State2[State2["InCommentLike"] = 21] = "InCommentLike";
  State2[State2["BeforeSpecialS"] = 22] = "BeforeSpecialS";
  State2[State2["SpecialStartSequence"] = 23] = "SpecialStartSequence";
  State2[State2["InSpecialTag"] = 24] = "InSpecialTag";
  State2[State2["BeforeEntity"] = 25] = "BeforeEntity";
  State2[State2["BeforeNumericEntity"] = 26] = "BeforeNumericEntity";
  State2[State2["InNamedEntity"] = 27] = "InNamedEntity";
  State2[State2["InNumericEntity"] = 28] = "InNumericEntity";
  State2[State2["InHexEntity"] = 29] = "InHexEntity";
})(State || (State = {}));
function isWhitespace(c2) {
  return c2 === CharCodes2.Space || c2 === CharCodes2.NewLine || c2 === CharCodes2.Tab || c2 === CharCodes2.FormFeed || c2 === CharCodes2.CarriageReturn;
}
function isEndOfTagSection(c2) {
  return c2 === CharCodes2.Slash || c2 === CharCodes2.Gt || isWhitespace(c2);
}
function isNumber2(c2) {
  return c2 >= CharCodes2.Zero && c2 <= CharCodes2.Nine;
}
function isASCIIAlpha(c2) {
  return c2 >= CharCodes2.LowerA && c2 <= CharCodes2.LowerZ || c2 >= CharCodes2.UpperA && c2 <= CharCodes2.UpperZ;
}
function isHexDigit(c2) {
  return c2 >= CharCodes2.UpperA && c2 <= CharCodes2.UpperF || c2 >= CharCodes2.LowerA && c2 <= CharCodes2.LowerF;
}
var QuoteType;
(function(QuoteType2) {
  QuoteType2[QuoteType2["NoValue"] = 0] = "NoValue";
  QuoteType2[QuoteType2["Unquoted"] = 1] = "Unquoted";
  QuoteType2[QuoteType2["Single"] = 2] = "Single";
  QuoteType2[QuoteType2["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
var Sequences = {
  Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
  CdataEnd: new Uint8Array([93, 93, 62]),
  CommentEnd: new Uint8Array([45, 45, 62]),
  ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
  StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
  TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101])
};

class Tokenizer {
  constructor({ xmlMode = false, decodeEntities = true }, cbs) {
    this.cbs = cbs;
    this.state = State.Text;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.baseState = State.Text;
    this.isSpecial = false;
    this.running = true;
    this.offset = 0;
    this.currentSequence = undefined;
    this.sequenceIndex = 0;
    this.trieIndex = 0;
    this.trieCurrent = 0;
    this.entityResult = 0;
    this.entityExcess = 0;
    this.xmlMode = xmlMode;
    this.decodeEntities = decodeEntities;
    this.entityTrie = xmlMode ? decode_data_xml_default : decode_data_html_default;
  }
  reset() {
    this.state = State.Text;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.baseState = State.Text;
    this.currentSequence = undefined;
    this.running = true;
    this.offset = 0;
  }
  write(chunk) {
    this.offset += this.buffer.length;
    this.buffer = chunk;
    this.parse();
  }
  end() {
    if (this.running)
      this.finish();
  }
  pause() {
    this.running = false;
  }
  resume() {
    this.running = true;
    if (this.index < this.buffer.length + this.offset) {
      this.parse();
    }
  }
  getIndex() {
    return this.index;
  }
  getSectionStart() {
    return this.sectionStart;
  }
  stateText(c2) {
    if (c2 === CharCodes2.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes2.Lt)) {
      if (this.index > this.sectionStart) {
        this.cbs.ontext(this.sectionStart, this.index);
      }
      this.state = State.BeforeTagName;
      this.sectionStart = this.index;
    } else if (this.decodeEntities && c2 === CharCodes2.Amp) {
      this.state = State.BeforeEntity;
    }
  }
  stateSpecialStartSequence(c2) {
    const isEnd = this.sequenceIndex === this.currentSequence.length;
    const isMatch = isEnd ? isEndOfTagSection(c2) : (c2 | 32) === this.currentSequence[this.sequenceIndex];
    if (!isMatch) {
      this.isSpecial = false;
    } else if (!isEnd) {
      this.sequenceIndex++;
      return;
    }
    this.sequenceIndex = 0;
    this.state = State.InTagName;
    this.stateInTagName(c2);
  }
  stateInSpecialTag(c2) {
    if (this.sequenceIndex === this.currentSequence.length) {
      if (c2 === CharCodes2.Gt || isWhitespace(c2)) {
        const endOfText = this.index - this.currentSequence.length;
        if (this.sectionStart < endOfText) {
          const actualIndex = this.index;
          this.index = endOfText;
          this.cbs.ontext(this.sectionStart, endOfText);
          this.index = actualIndex;
        }
        this.isSpecial = false;
        this.sectionStart = endOfText + 2;
        this.stateInClosingTagName(c2);
        return;
      }
      this.sequenceIndex = 0;
    }
    if ((c2 | 32) === this.currentSequence[this.sequenceIndex]) {
      this.sequenceIndex += 1;
    } else if (this.sequenceIndex === 0) {
      if (this.currentSequence === Sequences.TitleEnd) {
        if (this.decodeEntities && c2 === CharCodes2.Amp) {
          this.state = State.BeforeEntity;
        }
      } else if (this.fastForwardTo(CharCodes2.Lt)) {
        this.sequenceIndex = 1;
      }
    } else {
      this.sequenceIndex = Number(c2 === CharCodes2.Lt);
    }
  }
  stateCDATASequence(c2) {
    if (c2 === Sequences.Cdata[this.sequenceIndex]) {
      if (++this.sequenceIndex === Sequences.Cdata.length) {
        this.state = State.InCommentLike;
        this.currentSequence = Sequences.CdataEnd;
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
      }
    } else {
      this.sequenceIndex = 0;
      this.state = State.InDeclaration;
      this.stateInDeclaration(c2);
    }
  }
  fastForwardTo(c2) {
    while (++this.index < this.buffer.length + this.offset) {
      if (this.buffer.charCodeAt(this.index - this.offset) === c2) {
        return true;
      }
    }
    this.index = this.buffer.length + this.offset - 1;
    return false;
  }
  stateInCommentLike(c2) {
    if (c2 === this.currentSequence[this.sequenceIndex]) {
      if (++this.sequenceIndex === this.currentSequence.length) {
        if (this.currentSequence === Sequences.CdataEnd) {
          this.cbs.oncdata(this.sectionStart, this.index, 2);
        } else {
          this.cbs.oncomment(this.sectionStart, this.index, 2);
        }
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
        this.state = State.Text;
      }
    } else if (this.sequenceIndex === 0) {
      if (this.fastForwardTo(this.currentSequence[0])) {
        this.sequenceIndex = 1;
      }
    } else if (c2 !== this.currentSequence[this.sequenceIndex - 1]) {
      this.sequenceIndex = 0;
    }
  }
  isTagStartChar(c2) {
    return this.xmlMode ? !isEndOfTagSection(c2) : isASCIIAlpha(c2);
  }
  startSpecial(sequence, offset) {
    this.isSpecial = true;
    this.currentSequence = sequence;
    this.sequenceIndex = offset;
    this.state = State.SpecialStartSequence;
  }
  stateBeforeTagName(c2) {
    if (c2 === CharCodes2.ExclamationMark) {
      this.state = State.BeforeDeclaration;
      this.sectionStart = this.index + 1;
    } else if (c2 === CharCodes2.Questionmark) {
      this.state = State.InProcessingInstruction;
      this.sectionStart = this.index + 1;
    } else if (this.isTagStartChar(c2)) {
      const lower = c2 | 32;
      this.sectionStart = this.index;
      if (!this.xmlMode && lower === Sequences.TitleEnd[2]) {
        this.startSpecial(Sequences.TitleEnd, 3);
      } else {
        this.state = !this.xmlMode && lower === Sequences.ScriptEnd[2] ? State.BeforeSpecialS : State.InTagName;
      }
    } else if (c2 === CharCodes2.Slash) {
      this.state = State.BeforeClosingTagName;
    } else {
      this.state = State.Text;
      this.stateText(c2);
    }
  }
  stateInTagName(c2) {
    if (isEndOfTagSection(c2)) {
      this.cbs.onopentagname(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    }
  }
  stateBeforeClosingTagName(c2) {
    if (isWhitespace(c2)) {} else if (c2 === CharCodes2.Gt) {
      this.state = State.Text;
    } else {
      this.state = this.isTagStartChar(c2) ? State.InClosingTagName : State.InSpecialComment;
      this.sectionStart = this.index;
    }
  }
  stateInClosingTagName(c2) {
    if (c2 === CharCodes2.Gt || isWhitespace(c2)) {
      this.cbs.onclosetag(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.AfterClosingTagName;
      this.stateAfterClosingTagName(c2);
    }
  }
  stateAfterClosingTagName(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.state = State.Text;
      this.baseState = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeAttributeName(c2) {
    if (c2 === CharCodes2.Gt) {
      this.cbs.onopentagend(this.index);
      if (this.isSpecial) {
        this.state = State.InSpecialTag;
        this.sequenceIndex = 0;
      } else {
        this.state = State.Text;
      }
      this.baseState = this.state;
      this.sectionStart = this.index + 1;
    } else if (c2 === CharCodes2.Slash) {
      this.state = State.InSelfClosingTag;
    } else if (!isWhitespace(c2)) {
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateInSelfClosingTag(c2) {
    if (c2 === CharCodes2.Gt) {
      this.cbs.onselfclosingtag(this.index);
      this.state = State.Text;
      this.baseState = State.Text;
      this.sectionStart = this.index + 1;
      this.isSpecial = false;
    } else if (!isWhitespace(c2)) {
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    }
  }
  stateInAttributeName(c2) {
    if (c2 === CharCodes2.Eq || isEndOfTagSection(c2)) {
      this.cbs.onattribname(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.AfterAttributeName;
      this.stateAfterAttributeName(c2);
    }
  }
  stateAfterAttributeName(c2) {
    if (c2 === CharCodes2.Eq) {
      this.state = State.BeforeAttributeValue;
    } else if (c2 === CharCodes2.Slash || c2 === CharCodes2.Gt) {
      this.cbs.onattribend(QuoteType.NoValue, this.index);
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    } else if (!isWhitespace(c2)) {
      this.cbs.onattribend(QuoteType.NoValue, this.index);
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateBeforeAttributeValue(c2) {
    if (c2 === CharCodes2.DoubleQuote) {
      this.state = State.InAttributeValueDq;
      this.sectionStart = this.index + 1;
    } else if (c2 === CharCodes2.SingleQuote) {
      this.state = State.InAttributeValueSq;
      this.sectionStart = this.index + 1;
    } else if (!isWhitespace(c2)) {
      this.sectionStart = this.index;
      this.state = State.InAttributeValueNq;
      this.stateInAttributeValueNoQuotes(c2);
    }
  }
  handleInAttributeValue(c2, quote) {
    if (c2 === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(quote === CharCodes2.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index);
      this.state = State.BeforeAttributeName;
    } else if (this.decodeEntities && c2 === CharCodes2.Amp) {
      this.baseState = this.state;
      this.state = State.BeforeEntity;
    }
  }
  stateInAttributeValueDoubleQuotes(c2) {
    this.handleInAttributeValue(c2, CharCodes2.DoubleQuote);
  }
  stateInAttributeValueSingleQuotes(c2) {
    this.handleInAttributeValue(c2, CharCodes2.SingleQuote);
  }
  stateInAttributeValueNoQuotes(c2) {
    if (isWhitespace(c2) || c2 === CharCodes2.Gt) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(QuoteType.Unquoted, this.index);
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    } else if (this.decodeEntities && c2 === CharCodes2.Amp) {
      this.baseState = this.state;
      this.state = State.BeforeEntity;
    }
  }
  stateBeforeDeclaration(c2) {
    if (c2 === CharCodes2.OpeningSquareBracket) {
      this.state = State.CDATASequence;
      this.sequenceIndex = 0;
    } else {
      this.state = c2 === CharCodes2.Dash ? State.BeforeComment : State.InDeclaration;
    }
  }
  stateInDeclaration(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.ondeclaration(this.sectionStart, this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateInProcessingInstruction(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.onprocessinginstruction(this.sectionStart, this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeComment(c2) {
    if (c2 === CharCodes2.Dash) {
      this.state = State.InCommentLike;
      this.currentSequence = Sequences.CommentEnd;
      this.sequenceIndex = 2;
      this.sectionStart = this.index + 1;
    } else {
      this.state = State.InDeclaration;
    }
  }
  stateInSpecialComment(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.oncomment(this.sectionStart, this.index, 0);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeSpecialS(c2) {
    const lower = c2 | 32;
    if (lower === Sequences.ScriptEnd[3]) {
      this.startSpecial(Sequences.ScriptEnd, 4);
    } else if (lower === Sequences.StyleEnd[3]) {
      this.startSpecial(Sequences.StyleEnd, 4);
    } else {
      this.state = State.InTagName;
      this.stateInTagName(c2);
    }
  }
  stateBeforeEntity(c2) {
    this.entityExcess = 1;
    this.entityResult = 0;
    if (c2 === CharCodes2.Number) {
      this.state = State.BeforeNumericEntity;
    } else if (c2 === CharCodes2.Amp) {} else {
      this.trieIndex = 0;
      this.trieCurrent = this.entityTrie[0];
      this.state = State.InNamedEntity;
      this.stateInNamedEntity(c2);
    }
  }
  stateInNamedEntity(c2) {
    this.entityExcess += 1;
    this.trieIndex = determineBranch(this.entityTrie, this.trieCurrent, this.trieIndex + 1, c2);
    if (this.trieIndex < 0) {
      this.emitNamedEntity();
      this.index--;
      return;
    }
    this.trieCurrent = this.entityTrie[this.trieIndex];
    const masked = this.trieCurrent & BinTrieFlags.VALUE_LENGTH;
    if (masked) {
      const valueLength = (masked >> 14) - 1;
      if (!this.allowLegacyEntity() && c2 !== CharCodes2.Semi) {
        this.trieIndex += valueLength;
      } else {
        const entityStart = this.index - this.entityExcess + 1;
        if (entityStart > this.sectionStart) {
          this.emitPartial(this.sectionStart, entityStart);
        }
        this.entityResult = this.trieIndex;
        this.trieIndex += valueLength;
        this.entityExcess = 0;
        this.sectionStart = this.index + 1;
        if (valueLength === 0) {
          this.emitNamedEntity();
        }
      }
    }
  }
  emitNamedEntity() {
    this.state = this.baseState;
    if (this.entityResult === 0) {
      return;
    }
    const valueLength = (this.entityTrie[this.entityResult] & BinTrieFlags.VALUE_LENGTH) >> 14;
    switch (valueLength) {
      case 1: {
        this.emitCodePoint(this.entityTrie[this.entityResult] & ~BinTrieFlags.VALUE_LENGTH);
        break;
      }
      case 2: {
        this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
        break;
      }
      case 3: {
        this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
        this.emitCodePoint(this.entityTrie[this.entityResult + 2]);
      }
    }
  }
  stateBeforeNumericEntity(c2) {
    if ((c2 | 32) === CharCodes2.LowerX) {
      this.entityExcess++;
      this.state = State.InHexEntity;
    } else {
      this.state = State.InNumericEntity;
      this.stateInNumericEntity(c2);
    }
  }
  emitNumericEntity(strict) {
    const entityStart = this.index - this.entityExcess - 1;
    const numberStart = entityStart + 2 + Number(this.state === State.InHexEntity);
    if (numberStart !== this.index) {
      if (entityStart > this.sectionStart) {
        this.emitPartial(this.sectionStart, entityStart);
      }
      this.sectionStart = this.index + Number(strict);
      this.emitCodePoint(replaceCodePoint(this.entityResult));
    }
    this.state = this.baseState;
  }
  stateInNumericEntity(c2) {
    if (c2 === CharCodes2.Semi) {
      this.emitNumericEntity(true);
    } else if (isNumber2(c2)) {
      this.entityResult = this.entityResult * 10 + (c2 - CharCodes2.Zero);
      this.entityExcess++;
    } else {
      if (this.allowLegacyEntity()) {
        this.emitNumericEntity(false);
      } else {
        this.state = this.baseState;
      }
      this.index--;
    }
  }
  stateInHexEntity(c2) {
    if (c2 === CharCodes2.Semi) {
      this.emitNumericEntity(true);
    } else if (isNumber2(c2)) {
      this.entityResult = this.entityResult * 16 + (c2 - CharCodes2.Zero);
      this.entityExcess++;
    } else if (isHexDigit(c2)) {
      this.entityResult = this.entityResult * 16 + ((c2 | 32) - CharCodes2.LowerA + 10);
      this.entityExcess++;
    } else {
      if (this.allowLegacyEntity()) {
        this.emitNumericEntity(false);
      } else {
        this.state = this.baseState;
      }
      this.index--;
    }
  }
  allowLegacyEntity() {
    return !this.xmlMode && (this.baseState === State.Text || this.baseState === State.InSpecialTag);
  }
  cleanup() {
    if (this.running && this.sectionStart !== this.index) {
      if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
        this.cbs.ontext(this.sectionStart, this.index);
        this.sectionStart = this.index;
      } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
        this.cbs.onattribdata(this.sectionStart, this.index);
        this.sectionStart = this.index;
      }
    }
  }
  shouldContinue() {
    return this.index < this.buffer.length + this.offset && this.running;
  }
  parse() {
    while (this.shouldContinue()) {
      const c2 = this.buffer.charCodeAt(this.index - this.offset);
      switch (this.state) {
        case State.Text: {
          this.stateText(c2);
          break;
        }
        case State.SpecialStartSequence: {
          this.stateSpecialStartSequence(c2);
          break;
        }
        case State.InSpecialTag: {
          this.stateInSpecialTag(c2);
          break;
        }
        case State.CDATASequence: {
          this.stateCDATASequence(c2);
          break;
        }
        case State.InAttributeValueDq: {
          this.stateInAttributeValueDoubleQuotes(c2);
          break;
        }
        case State.InAttributeName: {
          this.stateInAttributeName(c2);
          break;
        }
        case State.InCommentLike: {
          this.stateInCommentLike(c2);
          break;
        }
        case State.InSpecialComment: {
          this.stateInSpecialComment(c2);
          break;
        }
        case State.BeforeAttributeName: {
          this.stateBeforeAttributeName(c2);
          break;
        }
        case State.InTagName: {
          this.stateInTagName(c2);
          break;
        }
        case State.InClosingTagName: {
          this.stateInClosingTagName(c2);
          break;
        }
        case State.BeforeTagName: {
          this.stateBeforeTagName(c2);
          break;
        }
        case State.AfterAttributeName: {
          this.stateAfterAttributeName(c2);
          break;
        }
        case State.InAttributeValueSq: {
          this.stateInAttributeValueSingleQuotes(c2);
          break;
        }
        case State.BeforeAttributeValue: {
          this.stateBeforeAttributeValue(c2);
          break;
        }
        case State.BeforeClosingTagName: {
          this.stateBeforeClosingTagName(c2);
          break;
        }
        case State.AfterClosingTagName: {
          this.stateAfterClosingTagName(c2);
          break;
        }
        case State.BeforeSpecialS: {
          this.stateBeforeSpecialS(c2);
          break;
        }
        case State.InAttributeValueNq: {
          this.stateInAttributeValueNoQuotes(c2);
          break;
        }
        case State.InSelfClosingTag: {
          this.stateInSelfClosingTag(c2);
          break;
        }
        case State.InDeclaration: {
          this.stateInDeclaration(c2);
          break;
        }
        case State.BeforeDeclaration: {
          this.stateBeforeDeclaration(c2);
          break;
        }
        case State.BeforeComment: {
          this.stateBeforeComment(c2);
          break;
        }
        case State.InProcessingInstruction: {
          this.stateInProcessingInstruction(c2);
          break;
        }
        case State.InNamedEntity: {
          this.stateInNamedEntity(c2);
          break;
        }
        case State.BeforeEntity: {
          this.stateBeforeEntity(c2);
          break;
        }
        case State.InHexEntity: {
          this.stateInHexEntity(c2);
          break;
        }
        case State.InNumericEntity: {
          this.stateInNumericEntity(c2);
          break;
        }
        default: {
          this.stateBeforeNumericEntity(c2);
        }
      }
      this.index++;
    }
    this.cleanup();
  }
  finish() {
    if (this.state === State.InNamedEntity) {
      this.emitNamedEntity();
    }
    if (this.sectionStart < this.index) {
      this.handleTrailingData();
    }
    this.cbs.onend();
  }
  handleTrailingData() {
    const endIndex = this.buffer.length + this.offset;
    if (this.state === State.InCommentLike) {
      if (this.currentSequence === Sequences.CdataEnd) {
        this.cbs.oncdata(this.sectionStart, endIndex, 0);
      } else {
        this.cbs.oncomment(this.sectionStart, endIndex, 0);
      }
    } else if (this.state === State.InNumericEntity && this.allowLegacyEntity()) {
      this.emitNumericEntity(false);
    } else if (this.state === State.InHexEntity && this.allowLegacyEntity()) {
      this.emitNumericEntity(false);
    } else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {} else {
      this.cbs.ontext(this.sectionStart, endIndex);
    }
  }
  emitPartial(start, endIndex) {
    if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
      this.cbs.onattribdata(start, endIndex);
    } else {
      this.cbs.ontext(start, endIndex);
    }
  }
  emitCodePoint(cp) {
    if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
      this.cbs.onattribentity(cp);
    } else {
      this.cbs.ontextentity(cp);
    }
  }
}

// ../../node_modules/.bun/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/Parser.js
var formTags = new Set([
  "input",
  "option",
  "optgroup",
  "select",
  "button",
  "datalist",
  "textarea"
]);
var pTag = new Set(["p"]);
var tableSectionTags = new Set(["thead", "tbody"]);
var ddtTags = new Set(["dd", "dt"]);
var rtpTags = new Set(["rt", "rp"]);
var openImpliesClose = new Map([
  ["tr", new Set(["tr", "th", "td"])],
  ["th", new Set(["th"])],
  ["td", new Set(["thead", "th", "td"])],
  ["body", new Set(["head", "link", "script"])],
  ["li", new Set(["li"])],
  ["p", pTag],
  ["h1", pTag],
  ["h2", pTag],
  ["h3", pTag],
  ["h4", pTag],
  ["h5", pTag],
  ["h6", pTag],
  ["select", formTags],
  ["input", formTags],
  ["output", formTags],
  ["button", formTags],
  ["datalist", formTags],
  ["textarea", formTags],
  ["option", new Set(["option"])],
  ["optgroup", new Set(["optgroup", "option"])],
  ["dd", ddtTags],
  ["dt", ddtTags],
  ["address", pTag],
  ["article", pTag],
  ["aside", pTag],
  ["blockquote", pTag],
  ["details", pTag],
  ["div", pTag],
  ["dl", pTag],
  ["fieldset", pTag],
  ["figcaption", pTag],
  ["figure", pTag],
  ["footer", pTag],
  ["form", pTag],
  ["header", pTag],
  ["hr", pTag],
  ["main", pTag],
  ["nav", pTag],
  ["ol", pTag],
  ["pre", pTag],
  ["section", pTag],
  ["table", pTag],
  ["ul", pTag],
  ["rt", rtpTags],
  ["rp", rtpTags],
  ["tbody", tableSectionTags],
  ["tfoot", tableSectionTags]
]);
var voidElements = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
var foreignContextElements = new Set(["math", "svg"]);
var htmlIntegrationElements = new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignobject",
  "desc",
  "title"
]);
var reNameEnd = /\s|\//;

class Parser {
  constructor(cbs, options = {}) {
    var _a3, _b, _c, _d, _e3;
    this.options = options;
    this.startIndex = 0;
    this.endIndex = 0;
    this.openTagStart = 0;
    this.tagname = "";
    this.attribname = "";
    this.attribvalue = "";
    this.attribs = null;
    this.stack = [];
    this.foreignContext = [];
    this.buffers = [];
    this.bufferOffset = 0;
    this.writeIndex = 0;
    this.ended = false;
    this.cbs = cbs !== null && cbs !== undefined ? cbs : {};
    this.lowerCaseTagNames = (_a3 = options.lowerCaseTags) !== null && _a3 !== undefined ? _a3 : !options.xmlMode;
    this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== undefined ? _b : !options.xmlMode;
    this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== undefined ? _c : Tokenizer)(this.options, this);
    (_e3 = (_d = this.cbs).onparserinit) === null || _e3 === undefined || _e3.call(_d, this);
  }
  ontext(start, endIndex) {
    var _a3, _b;
    const data = this.getSlice(start, endIndex);
    this.endIndex = endIndex - 1;
    (_b = (_a3 = this.cbs).ontext) === null || _b === undefined || _b.call(_a3, data);
    this.startIndex = endIndex;
  }
  ontextentity(cp) {
    var _a3, _b;
    const index = this.tokenizer.getSectionStart();
    this.endIndex = index - 1;
    (_b = (_a3 = this.cbs).ontext) === null || _b === undefined || _b.call(_a3, fromCodePoint(cp));
    this.startIndex = index;
  }
  isVoidElement(name2) {
    return !this.options.xmlMode && voidElements.has(name2);
  }
  onopentagname(start, endIndex) {
    this.endIndex = endIndex;
    let name2 = this.getSlice(start, endIndex);
    if (this.lowerCaseTagNames) {
      name2 = name2.toLowerCase();
    }
    this.emitOpenTag(name2);
  }
  emitOpenTag(name2) {
    var _a3, _b, _c, _d;
    this.openTagStart = this.startIndex;
    this.tagname = name2;
    const impliesClose = !this.options.xmlMode && openImpliesClose.get(name2);
    if (impliesClose) {
      while (this.stack.length > 0 && impliesClose.has(this.stack[this.stack.length - 1])) {
        const element = this.stack.pop();
        (_b = (_a3 = this.cbs).onclosetag) === null || _b === undefined || _b.call(_a3, element, true);
      }
    }
    if (!this.isVoidElement(name2)) {
      this.stack.push(name2);
      if (foreignContextElements.has(name2)) {
        this.foreignContext.push(true);
      } else if (htmlIntegrationElements.has(name2)) {
        this.foreignContext.push(false);
      }
    }
    (_d = (_c = this.cbs).onopentagname) === null || _d === undefined || _d.call(_c, name2);
    if (this.cbs.onopentag)
      this.attribs = {};
  }
  endOpenTag(isImplied) {
    var _a3, _b;
    this.startIndex = this.openTagStart;
    if (this.attribs) {
      (_b = (_a3 = this.cbs).onopentag) === null || _b === undefined || _b.call(_a3, this.tagname, this.attribs, isImplied);
      this.attribs = null;
    }
    if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
      this.cbs.onclosetag(this.tagname, true);
    }
    this.tagname = "";
  }
  onopentagend(endIndex) {
    this.endIndex = endIndex;
    this.endOpenTag(false);
    this.startIndex = endIndex + 1;
  }
  onclosetag(start, endIndex) {
    var _a3, _b, _c, _d, _e3, _f;
    this.endIndex = endIndex;
    let name2 = this.getSlice(start, endIndex);
    if (this.lowerCaseTagNames) {
      name2 = name2.toLowerCase();
    }
    if (foreignContextElements.has(name2) || htmlIntegrationElements.has(name2)) {
      this.foreignContext.pop();
    }
    if (!this.isVoidElement(name2)) {
      const pos = this.stack.lastIndexOf(name2);
      if (pos !== -1) {
        if (this.cbs.onclosetag) {
          let count = this.stack.length - pos;
          while (count--) {
            this.cbs.onclosetag(this.stack.pop(), count !== 0);
          }
        } else
          this.stack.length = pos;
      } else if (!this.options.xmlMode && name2 === "p") {
        this.emitOpenTag("p");
        this.closeCurrentTag(true);
      }
    } else if (!this.options.xmlMode && name2 === "br") {
      (_b = (_a3 = this.cbs).onopentagname) === null || _b === undefined || _b.call(_a3, "br");
      (_d = (_c = this.cbs).onopentag) === null || _d === undefined || _d.call(_c, "br", {}, true);
      (_f = (_e3 = this.cbs).onclosetag) === null || _f === undefined || _f.call(_e3, "br", false);
    }
    this.startIndex = endIndex + 1;
  }
  onselfclosingtag(endIndex) {
    this.endIndex = endIndex;
    if (this.options.xmlMode || this.options.recognizeSelfClosing || this.foreignContext[this.foreignContext.length - 1]) {
      this.closeCurrentTag(false);
      this.startIndex = endIndex + 1;
    } else {
      this.onopentagend(endIndex);
    }
  }
  closeCurrentTag(isOpenImplied) {
    var _a3, _b;
    const name2 = this.tagname;
    this.endOpenTag(isOpenImplied);
    if (this.stack[this.stack.length - 1] === name2) {
      (_b = (_a3 = this.cbs).onclosetag) === null || _b === undefined || _b.call(_a3, name2, !isOpenImplied);
      this.stack.pop();
    }
  }
  onattribname(start, endIndex) {
    this.startIndex = start;
    const name2 = this.getSlice(start, endIndex);
    this.attribname = this.lowerCaseAttributeNames ? name2.toLowerCase() : name2;
  }
  onattribdata(start, endIndex) {
    this.attribvalue += this.getSlice(start, endIndex);
  }
  onattribentity(cp) {
    this.attribvalue += fromCodePoint(cp);
  }
  onattribend(quote, endIndex) {
    var _a3, _b;
    this.endIndex = endIndex;
    (_b = (_a3 = this.cbs).onattribute) === null || _b === undefined || _b.call(_a3, this.attribname, this.attribvalue, quote === QuoteType.Double ? '"' : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? undefined : null);
    if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
      this.attribs[this.attribname] = this.attribvalue;
    }
    this.attribvalue = "";
  }
  getInstructionName(value) {
    const index = value.search(reNameEnd);
    let name2 = index < 0 ? value : value.substr(0, index);
    if (this.lowerCaseTagNames) {
      name2 = name2.toLowerCase();
    }
    return name2;
  }
  ondeclaration(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name2 = this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`!${name2}`, `!${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  onprocessinginstruction(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name2 = this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`?${name2}`, `?${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  oncomment(start, endIndex, offset) {
    var _a3, _b, _c, _d;
    this.endIndex = endIndex;
    (_b = (_a3 = this.cbs).oncomment) === null || _b === undefined || _b.call(_a3, this.getSlice(start, endIndex - offset));
    (_d = (_c = this.cbs).oncommentend) === null || _d === undefined || _d.call(_c);
    this.startIndex = endIndex + 1;
  }
  oncdata(start, endIndex, offset) {
    var _a3, _b, _c, _d, _e3, _f, _g, _h, _j, _k;
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex - offset);
    if (this.options.xmlMode || this.options.recognizeCDATA) {
      (_b = (_a3 = this.cbs).oncdatastart) === null || _b === undefined || _b.call(_a3);
      (_d = (_c = this.cbs).ontext) === null || _d === undefined || _d.call(_c, value);
      (_f = (_e3 = this.cbs).oncdataend) === null || _f === undefined || _f.call(_e3);
    } else {
      (_h = (_g = this.cbs).oncomment) === null || _h === undefined || _h.call(_g, `[CDATA[${value}]]`);
      (_k = (_j = this.cbs).oncommentend) === null || _k === undefined || _k.call(_j);
    }
    this.startIndex = endIndex + 1;
  }
  onend() {
    var _a3, _b;
    if (this.cbs.onclosetag) {
      this.endIndex = this.startIndex;
      for (let index = this.stack.length;index > 0; this.cbs.onclosetag(this.stack[--index], true))
        ;
    }
    (_b = (_a3 = this.cbs).onend) === null || _b === undefined || _b.call(_a3);
  }
  reset() {
    var _a3, _b, _c, _d;
    (_b = (_a3 = this.cbs).onreset) === null || _b === undefined || _b.call(_a3);
    this.tokenizer.reset();
    this.tagname = "";
    this.attribname = "";
    this.attribs = null;
    this.stack.length = 0;
    this.startIndex = 0;
    this.endIndex = 0;
    (_d = (_c = this.cbs).onparserinit) === null || _d === undefined || _d.call(_c, this);
    this.buffers.length = 0;
    this.bufferOffset = 0;
    this.writeIndex = 0;
    this.ended = false;
  }
  parseComplete(data) {
    this.reset();
    this.end(data);
  }
  getSlice(start, end) {
    while (start - this.bufferOffset >= this.buffers[0].length) {
      this.shiftBuffer();
    }
    let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
    while (end - this.bufferOffset > this.buffers[0].length) {
      this.shiftBuffer();
      slice += this.buffers[0].slice(0, end - this.bufferOffset);
    }
    return slice;
  }
  shiftBuffer() {
    this.bufferOffset += this.buffers[0].length;
    this.writeIndex--;
    this.buffers.shift();
  }
  write(chunk) {
    var _a3, _b;
    if (this.ended) {
      (_b = (_a3 = this.cbs).onerror) === null || _b === undefined || _b.call(_a3, new Error(".write() after done!"));
      return;
    }
    this.buffers.push(chunk);
    if (this.tokenizer.running) {
      this.tokenizer.write(chunk);
      this.writeIndex++;
    }
  }
  end(chunk) {
    var _a3, _b;
    if (this.ended) {
      (_b = (_a3 = this.cbs).onerror) === null || _b === undefined || _b.call(_a3, new Error(".end() after done!"));
      return;
    }
    if (chunk)
      this.write(chunk);
    this.ended = true;
    this.tokenizer.end();
  }
  pause() {
    this.tokenizer.pause();
  }
  resume() {
    this.tokenizer.resume();
    while (this.tokenizer.running && this.writeIndex < this.buffers.length) {
      this.tokenizer.write(this.buffers[this.writeIndex++]);
    }
    if (this.ended)
      this.tokenizer.end();
  }
  parseChunk(chunk) {
    this.write(chunk);
  }
  done(chunk) {
    this.end(chunk);
  }
}
// ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/escape.js
var xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
var xmlCodeMap = new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [39, "&apos;"],
  [60, "&lt;"],
  [62, "&gt;"]
]);
var getCodePoint = String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (c2, index) => (c2.charCodeAt(index) & 64512) === 55296 ? (c2.charCodeAt(index) - 55296) * 1024 + c2.charCodeAt(index + 1) - 56320 + 65536 : c2.charCodeAt(index);
function encodeXML(str) {
  let ret = "";
  let lastIdx = 0;
  let match;
  while ((match = xmlReplacer.exec(str)) !== null) {
    const i = match.index;
    const char = str.charCodeAt(i);
    const next = xmlCodeMap.get(char);
    if (next !== undefined) {
      ret += str.substring(lastIdx, i) + next;
      lastIdx = i + 1;
    } else {
      ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
      lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
    }
  }
  return ret + str.substr(lastIdx);
}
function getEscaper(regex, map2) {
  return function escape(data) {
    let match;
    let lastIdx = 0;
    let result = "";
    while (match = regex.exec(data)) {
      if (lastIdx !== match.index) {
        result += data.substring(lastIdx, match.index);
      }
      result += map2.get(match[0].charCodeAt(0));
      lastIdx = match.index + 1;
    }
    return result + data.substring(lastIdx);
  };
}
var escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
var escapeAttribute = getEscaper(/["&\u00A0]/g, new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [160, "&nbsp;"]
]));
var escapeText = getEscaper(/[&<>\u00A0]/g, new Map([
  [38, "&amp;"],
  [60, "&lt;"],
  [62, "&gt;"],
  [160, "&nbsp;"]
]));
// ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/index.js
var EntityLevel;
(function(EntityLevel2) {
  EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
  EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function(EncodingMode2) {
  EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
  EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
  EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
  EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
  EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));

// ../../node_modules/.bun/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js
var elementNames = new Map([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "clipPath",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "foreignObject",
  "glyphRef",
  "linearGradient",
  "radialGradient",
  "textPath"
].map((val) => [val.toLowerCase(), val]));
var attributeNames = new Map([
  "definitionURL",
  "attributeName",
  "attributeType",
  "baseFrequency",
  "baseProfile",
  "calcMode",
  "clipPathUnits",
  "diffuseConstant",
  "edgeMode",
  "filterUnits",
  "glyphRef",
  "gradientTransform",
  "gradientUnits",
  "kernelMatrix",
  "kernelUnitLength",
  "keyPoints",
  "keySplines",
  "keyTimes",
  "lengthAdjust",
  "limitingConeAngle",
  "markerHeight",
  "markerUnits",
  "markerWidth",
  "maskContentUnits",
  "maskUnits",
  "numOctaves",
  "pathLength",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "preserveAlpha",
  "preserveAspectRatio",
  "primitiveUnits",
  "refX",
  "refY",
  "repeatCount",
  "repeatDur",
  "requiredExtensions",
  "requiredFeatures",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "startOffset",
  "stdDeviation",
  "stitchTiles",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "textLength",
  "viewBox",
  "viewTarget",
  "xChannelSelector",
  "yChannelSelector",
  "zoomAndPan"
].map((val) => [val.toLowerCase(), val]));

// ../../node_modules/.bun/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js
var unencodedElements = new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript"
]);
function replaceQuotes(value) {
  return value.replace(/"/g, "&quot;");
}
function formatAttributes(attributes, opts) {
  var _a3;
  if (!attributes)
    return;
  const encode = ((_a3 = opts.encodeEntities) !== null && _a3 !== undefined ? _a3 : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
  return Object.keys(attributes).map((key) => {
    var _a4, _b;
    const value = (_a4 = attributes[key]) !== null && _a4 !== undefined ? _a4 : "";
    if (opts.xmlMode === "foreign") {
      key = (_b = attributeNames.get(key)) !== null && _b !== undefined ? _b : key;
    }
    if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
      return key;
    }
    return `${key}="${encode(value)}"`;
  }).join(" ");
}
var singleTag = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function render(node2, options = {}) {
  const nodes = "length" in node2 ? node2 : [node2];
  let output = "";
  for (let i = 0;i < nodes.length; i++) {
    output += renderNode(nodes[i], options);
  }
  return output;
}
function renderNode(node2, options) {
  switch (node2.type) {
    case Root:
      return render(node2.children, options);
    case Doctype:
    case Directive:
      return renderDirective(node2);
    case Comment:
      return renderComment(node2);
    case CDATA:
      return renderCdata(node2);
    case Script:
    case Style:
    case Tag:
      return renderTag(node2, options);
    case Text:
      return renderText(node2, options);
  }
}
var foreignModeIntegrationPoints = new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignObject",
  "desc",
  "title"
]);
var foreignElements = new Set(["svg", "math"]);
function renderTag(elem, opts) {
  var _a3;
  if (opts.xmlMode === "foreign") {
    elem.name = (_a3 = elementNames.get(elem.name)) !== null && _a3 !== undefined ? _a3 : elem.name;
    if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
      opts = { ...opts, xmlMode: false };
    }
  }
  if (!opts.xmlMode && foreignElements.has(elem.name)) {
    opts = { ...opts, xmlMode: "foreign" };
  }
  let tag = `<${elem.name}`;
  const attribs = formatAttributes(elem.attribs, opts);
  if (attribs) {
    tag += ` ${attribs}`;
  }
  if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
    if (!opts.xmlMode)
      tag += " ";
    tag += "/>";
  } else {
    tag += ">";
    if (elem.children.length > 0) {
      tag += render(elem.children, opts);
    }
    if (opts.xmlMode || !singleTag.has(elem.name)) {
      tag += `</${elem.name}>`;
    }
  }
  return tag;
}
function renderDirective(elem) {
  return `<${elem.data}>`;
}
function renderText(elem, opts) {
  var _a3;
  let data = elem.data || "";
  if (((_a3 = opts.encodeEntities) !== null && _a3 !== undefined ? _a3 : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
    data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
  }
  return data;
}
function renderCdata(elem) {
  return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
  return `<!--${elem.data}-->`;
}

// ../../node_modules/.bun/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/index.js
function parseDocument(data, options) {
  const handler = new DomHandler(undefined, options);
  new Parser(handler, options).end(data);
  return handler.root;
}

// ../../node_modules/.bun/html-to-text@9.0.5/node_modules/html-to-text/lib/html-to-text.mjs
var import_deepmerge = __toESM(require_cjs(), 1);
function limitedDepthRecursive(n2, f, g2 = () => {
  return;
}) {
  if (n2 === undefined) {
    const f1 = function(...args) {
      return f(f1, ...args);
    };
    return f1;
  }
  if (n2 >= 0) {
    return function(...args) {
      return f(limitedDepthRecursive(n2 - 1, f, g2), ...args);
    };
  }
  return g2;
}
function trimCharacter(str, char) {
  let start = 0;
  let end = str.length;
  while (start < end && str[start] === char) {
    ++start;
  }
  while (end > start && str[end - 1] === char) {
    --end;
  }
  return start > 0 || end < str.length ? str.substring(start, end) : str;
}
function trimCharacterEnd(str, char) {
  let end = str.length;
  while (end > 0 && str[end - 1] === char) {
    --end;
  }
  return end < str.length ? str.substring(0, end) : str;
}
function unicodeEscape(str) {
  return str.replace(/[\s\S]/g, (c2) => "\\u" + c2.charCodeAt().toString(16).padStart(4, "0"));
}
function mergeDuplicatesPreferLast(items, getKey) {
  const map2 = new Map;
  for (let i = items.length;i-- > 0; ) {
    const item = items[i];
    const key = getKey(item);
    map2.set(key, map2.has(key) ? import_deepmerge.default(item, map2.get(key), { arrayMerge: overwriteMerge$1 }) : item);
  }
  return [...map2.values()].reverse();
}
var overwriteMerge$1 = (acc, src, options) => [...src];
function get(obj, path) {
  for (const key of path) {
    if (!obj) {
      return;
    }
    obj = obj[key];
  }
  return obj;
}
function numberToLetterSequence(num, baseChar = "a", base = 26) {
  const digits = [];
  do {
    num -= 1;
    digits.push(num % base);
    num = num / base >> 0;
  } while (num > 0);
  const baseCode = baseChar.charCodeAt(0);
  return digits.reverse().map((n2) => String.fromCharCode(baseCode + n2)).join("");
}
var I2 = ["I", "X", "C", "M"];
var V3 = ["V", "L", "D"];
function numberToRoman(num) {
  return [...num + ""].map((n2) => +n2).reverse().map((v3, i) => v3 % 5 < 4 ? (v3 < 5 ? "" : V3[i]) + I2[i].repeat(v3 % 5) : I2[i] + (v3 < 5 ? V3[i] : I2[i + 1])).reverse().join("");
}

class InlineTextBuilder {
  constructor(options, maxLineLength = undefined) {
    this.lines = [];
    this.nextLineWords = [];
    this.maxLineLength = maxLineLength || options.wordwrap || Number.MAX_VALUE;
    this.nextLineAvailableChars = this.maxLineLength;
    this.wrapCharacters = get(options, ["longWordSplit", "wrapCharacters"]) || [];
    this.forceWrapOnLimit = get(options, ["longWordSplit", "forceWrapOnLimit"]) || false;
    this.stashedSpace = false;
    this.wordBreakOpportunity = false;
  }
  pushWord(word, noWrap = false) {
    if (this.nextLineAvailableChars <= 0 && !noWrap) {
      this.startNewLine();
    }
    const isLineStart = this.nextLineWords.length === 0;
    const cost = word.length + (isLineStart ? 0 : 1);
    if (cost <= this.nextLineAvailableChars || noWrap) {
      this.nextLineWords.push(word);
      this.nextLineAvailableChars -= cost;
    } else {
      const [first, ...rest] = this.splitLongWord(word);
      if (!isLineStart) {
        this.startNewLine();
      }
      this.nextLineWords.push(first);
      this.nextLineAvailableChars -= first.length;
      for (const part of rest) {
        this.startNewLine();
        this.nextLineWords.push(part);
        this.nextLineAvailableChars -= part.length;
      }
    }
  }
  popWord() {
    const lastWord = this.nextLineWords.pop();
    if (lastWord !== undefined) {
      const isLineStart = this.nextLineWords.length === 0;
      const cost = lastWord.length + (isLineStart ? 0 : 1);
      this.nextLineAvailableChars += cost;
    }
    return lastWord;
  }
  concatWord(word, noWrap = false) {
    if (this.wordBreakOpportunity && word.length > this.nextLineAvailableChars) {
      this.pushWord(word, noWrap);
      this.wordBreakOpportunity = false;
    } else {
      const lastWord = this.popWord();
      this.pushWord(lastWord ? lastWord.concat(word) : word, noWrap);
    }
  }
  startNewLine(n2 = 1) {
    this.lines.push(this.nextLineWords);
    if (n2 > 1) {
      this.lines.push(...Array.from({ length: n2 - 1 }, () => []));
    }
    this.nextLineWords = [];
    this.nextLineAvailableChars = this.maxLineLength;
  }
  isEmpty() {
    return this.lines.length === 0 && this.nextLineWords.length === 0;
  }
  clear() {
    this.lines.length = 0;
    this.nextLineWords.length = 0;
    this.nextLineAvailableChars = this.maxLineLength;
  }
  toString() {
    return [...this.lines, this.nextLineWords].map((words) => words.join(" ")).join(`
`);
  }
  splitLongWord(word) {
    const parts = [];
    let idx = 0;
    while (word.length > this.maxLineLength) {
      const firstLine = word.substring(0, this.maxLineLength);
      const remainingChars = word.substring(this.maxLineLength);
      const splitIndex = firstLine.lastIndexOf(this.wrapCharacters[idx]);
      if (splitIndex > -1) {
        word = firstLine.substring(splitIndex + 1) + remainingChars;
        parts.push(firstLine.substring(0, splitIndex + 1));
      } else {
        idx++;
        if (idx < this.wrapCharacters.length) {
          word = firstLine + remainingChars;
        } else {
          if (this.forceWrapOnLimit) {
            parts.push(firstLine);
            word = remainingChars;
            if (word.length > this.maxLineLength) {
              continue;
            }
          } else {
            word = firstLine + remainingChars;
          }
          break;
        }
      }
    }
    parts.push(word);
    return parts;
  }
}

class StackItem {
  constructor(next = null) {
    this.next = next;
  }
  getRoot() {
    return this.next ? this.next : this;
  }
}

class BlockStackItem extends StackItem {
  constructor(options, next = null, leadingLineBreaks = 1, maxLineLength = undefined) {
    super(next);
    this.leadingLineBreaks = leadingLineBreaks;
    this.inlineTextBuilder = new InlineTextBuilder(options, maxLineLength);
    this.rawText = "";
    this.stashedLineBreaks = 0;
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class ListStackItem extends BlockStackItem {
  constructor(options, next = null, {
    interRowLineBreaks = 1,
    leadingLineBreaks = 2,
    maxLineLength = undefined,
    maxPrefixLength = 0,
    prefixAlign = "left"
  } = {}) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.maxPrefixLength = maxPrefixLength;
    this.prefixAlign = prefixAlign;
    this.interRowLineBreaks = interRowLineBreaks;
  }
}

class ListItemStackItem extends BlockStackItem {
  constructor(options, next = null, {
    leadingLineBreaks = 1,
    maxLineLength = undefined,
    prefix = ""
  } = {}) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.prefix = prefix;
  }
}

class TableStackItem extends StackItem {
  constructor(next = null) {
    super(next);
    this.rows = [];
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TableRowStackItem extends StackItem {
  constructor(next = null) {
    super(next);
    this.cells = [];
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TableCellStackItem extends StackItem {
  constructor(options, next = null, maxColumnWidth = undefined) {
    super(next);
    this.inlineTextBuilder = new InlineTextBuilder(options, maxColumnWidth);
    this.rawText = "";
    this.stashedLineBreaks = 0;
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TransformerStackItem extends StackItem {
  constructor(next = null, transform) {
    super(next);
    this.transform = transform;
  }
}
function charactersToCodes(str) {
  return [...str].map((c2) => "\\u" + c2.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}

class WhitespaceProcessor {
  constructor(options) {
    this.whitespaceChars = options.preserveNewlines ? options.whitespaceCharacters.replace(/\n/g, "") : options.whitespaceCharacters;
    const whitespaceCodes = charactersToCodes(this.whitespaceChars);
    this.leadingWhitespaceRe = new RegExp(`^[${whitespaceCodes}]`);
    this.trailingWhitespaceRe = new RegExp(`[${whitespaceCodes}]$`);
    this.allWhitespaceOrEmptyRe = new RegExp(`^[${whitespaceCodes}]*$`);
    this.newlineOrNonWhitespaceRe = new RegExp(`(\\n|[^\\n${whitespaceCodes}])`, "g");
    this.newlineOrNonNewlineStringRe = new RegExp(`(\\n|[^\\n]+)`, "g");
    if (options.preserveNewlines) {
      const wordOrNewlineRe = new RegExp(`\\n|[^\\n${whitespaceCodes}]+`, "gm");
      this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = (str) => str, noWrap = false) {
        if (!text) {
          return;
        }
        const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
        let anyMatch = false;
        let m = wordOrNewlineRe.exec(text);
        if (m) {
          anyMatch = true;
          if (m[0] === `
`) {
            inlineTextBuilder.startNewLine();
          } else if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
            inlineTextBuilder.pushWord(transform(m[0]), noWrap);
          } else {
            inlineTextBuilder.concatWord(transform(m[0]), noWrap);
          }
          while ((m = wordOrNewlineRe.exec(text)) !== null) {
            if (m[0] === `
`) {
              inlineTextBuilder.startNewLine();
            } else {
              inlineTextBuilder.pushWord(transform(m[0]), noWrap);
            }
          }
        }
        inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
      };
    } else {
      const wordRe = new RegExp(`[^${whitespaceCodes}]+`, "g");
      this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = (str) => str, noWrap = false) {
        if (!text) {
          return;
        }
        const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
        let anyMatch = false;
        let m = wordRe.exec(text);
        if (m) {
          anyMatch = true;
          if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
            inlineTextBuilder.pushWord(transform(m[0]), noWrap);
          } else {
            inlineTextBuilder.concatWord(transform(m[0]), noWrap);
          }
          while ((m = wordRe.exec(text)) !== null) {
            inlineTextBuilder.pushWord(transform(m[0]), noWrap);
          }
        }
        inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
      };
    }
  }
  addLiteral(text, inlineTextBuilder, noWrap = true) {
    if (!text) {
      return;
    }
    const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
    let anyMatch = false;
    let m = this.newlineOrNonNewlineStringRe.exec(text);
    if (m) {
      anyMatch = true;
      if (m[0] === `
`) {
        inlineTextBuilder.startNewLine();
      } else if (previouslyStashedSpace) {
        inlineTextBuilder.pushWord(m[0], noWrap);
      } else {
        inlineTextBuilder.concatWord(m[0], noWrap);
      }
      while ((m = this.newlineOrNonNewlineStringRe.exec(text)) !== null) {
        if (m[0] === `
`) {
          inlineTextBuilder.startNewLine();
        } else {
          inlineTextBuilder.pushWord(m[0], noWrap);
        }
      }
    }
    inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch;
  }
  testLeadingWhitespace(text) {
    return this.leadingWhitespaceRe.test(text);
  }
  testTrailingWhitespace(text) {
    return this.trailingWhitespaceRe.test(text);
  }
  testContainsWords(text) {
    return !this.allWhitespaceOrEmptyRe.test(text);
  }
  countNewlinesNoWords(text) {
    this.newlineOrNonWhitespaceRe.lastIndex = 0;
    let counter = 0;
    let match;
    while ((match = this.newlineOrNonWhitespaceRe.exec(text)) !== null) {
      if (match[0] === `
`) {
        counter++;
      } else {
        return 0;
      }
    }
    return counter;
  }
}

class BlockTextBuilder {
  constructor(options, picker, metadata = undefined) {
    this.options = options;
    this.picker = picker;
    this.metadata = metadata;
    this.whitespaceProcessor = new WhitespaceProcessor(options);
    this._stackItem = new BlockStackItem(options);
    this._wordTransformer = undefined;
  }
  pushWordTransform(wordTransform) {
    this._wordTransformer = new TransformerStackItem(this._wordTransformer, wordTransform);
  }
  popWordTransform() {
    if (!this._wordTransformer) {
      return;
    }
    const transform = this._wordTransformer.transform;
    this._wordTransformer = this._wordTransformer.next;
    return transform;
  }
  startNoWrap() {
    this._stackItem.isNoWrap = true;
  }
  stopNoWrap() {
    this._stackItem.isNoWrap = false;
  }
  _getCombinedWordTransformer() {
    const wt3 = this._wordTransformer ? (str) => applyTransformer(str, this._wordTransformer) : undefined;
    const ce3 = this.options.encodeCharacters;
    return wt3 ? ce3 ? (str) => ce3(wt3(str)) : wt3 : ce3;
  }
  _popStackItem() {
    const item = this._stackItem;
    this._stackItem = item.next;
    return item;
  }
  addLineBreak() {
    if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
      return;
    }
    if (this._stackItem.isPre) {
      this._stackItem.rawText += `
`;
    } else {
      this._stackItem.inlineTextBuilder.startNewLine();
    }
  }
  addWordBreakOpportunity() {
    if (this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem) {
      this._stackItem.inlineTextBuilder.wordBreakOpportunity = true;
    }
  }
  addInline(str, { noWordTransform = false } = {}) {
    if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
      return;
    }
    if (this._stackItem.isPre) {
      this._stackItem.rawText += str;
      return;
    }
    if (str.length === 0 || this._stackItem.stashedLineBreaks && !this.whitespaceProcessor.testContainsWords(str)) {
      return;
    }
    if (this.options.preserveNewlines) {
      const newlinesNumber = this.whitespaceProcessor.countNewlinesNoWords(str);
      if (newlinesNumber > 0) {
        this._stackItem.inlineTextBuilder.startNewLine(newlinesNumber);
        return;
      }
    }
    if (this._stackItem.stashedLineBreaks) {
      this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
    }
    this.whitespaceProcessor.shrinkWrapAdd(str, this._stackItem.inlineTextBuilder, noWordTransform ? undefined : this._getCombinedWordTransformer(), this._stackItem.isNoWrap);
    this._stackItem.stashedLineBreaks = 0;
  }
  addLiteral(str) {
    if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
      return;
    }
    if (str.length === 0) {
      return;
    }
    if (this._stackItem.isPre) {
      this._stackItem.rawText += str;
      return;
    }
    if (this._stackItem.stashedLineBreaks) {
      this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
    }
    this.whitespaceProcessor.addLiteral(str, this._stackItem.inlineTextBuilder, this._stackItem.isNoWrap);
    this._stackItem.stashedLineBreaks = 0;
  }
  openBlock({ leadingLineBreaks = 1, reservedLineLength = 0, isPre = false } = {}) {
    const maxLineLength = Math.max(20, this._stackItem.inlineTextBuilder.maxLineLength - reservedLineLength);
    this._stackItem = new BlockStackItem(this.options, this._stackItem, leadingLineBreaks, maxLineLength);
    if (isPre) {
      this._stackItem.isPre = true;
    }
  }
  closeBlock({ trailingLineBreaks = 1, blockTransform = undefined } = {}) {
    const block = this._popStackItem();
    const blockText = blockTransform ? blockTransform(getText(block)) : getText(block);
    addText(this._stackItem, blockText, block.leadingLineBreaks, Math.max(block.stashedLineBreaks, trailingLineBreaks));
  }
  openList({ maxPrefixLength = 0, prefixAlign = "left", interRowLineBreaks = 1, leadingLineBreaks = 2 } = {}) {
    this._stackItem = new ListStackItem(this.options, this._stackItem, {
      interRowLineBreaks,
      leadingLineBreaks,
      maxLineLength: this._stackItem.inlineTextBuilder.maxLineLength,
      maxPrefixLength,
      prefixAlign
    });
  }
  openListItem({ prefix = "" } = {}) {
    if (!(this._stackItem instanceof ListStackItem)) {
      throw new Error("Can't add a list item to something that is not a list! Check the formatter.");
    }
    const list = this._stackItem;
    const prefixLength = Math.max(prefix.length, list.maxPrefixLength);
    const maxLineLength = Math.max(20, list.inlineTextBuilder.maxLineLength - prefixLength);
    this._stackItem = new ListItemStackItem(this.options, list, {
      prefix,
      maxLineLength,
      leadingLineBreaks: list.interRowLineBreaks
    });
  }
  closeListItem() {
    const listItem = this._popStackItem();
    const list = listItem.next;
    const prefixLength = Math.max(listItem.prefix.length, list.maxPrefixLength);
    const spacing = `
` + " ".repeat(prefixLength);
    const prefix = list.prefixAlign === "right" ? listItem.prefix.padStart(prefixLength) : listItem.prefix.padEnd(prefixLength);
    const text = prefix + getText(listItem).replace(/\n/g, spacing);
    addText(list, text, listItem.leadingLineBreaks, Math.max(listItem.stashedLineBreaks, list.interRowLineBreaks));
  }
  closeList({ trailingLineBreaks = 2 } = {}) {
    const list = this._popStackItem();
    const text = getText(list);
    if (text) {
      addText(this._stackItem, text, list.leadingLineBreaks, trailingLineBreaks);
    }
  }
  openTable() {
    this._stackItem = new TableStackItem(this._stackItem);
  }
  openTableRow() {
    if (!(this._stackItem instanceof TableStackItem)) {
      throw new Error("Can't add a table row to something that is not a table! Check the formatter.");
    }
    this._stackItem = new TableRowStackItem(this._stackItem);
  }
  openTableCell({ maxColumnWidth = undefined } = {}) {
    if (!(this._stackItem instanceof TableRowStackItem)) {
      throw new Error("Can't add a table cell to something that is not a table row! Check the formatter.");
    }
    this._stackItem = new TableCellStackItem(this.options, this._stackItem, maxColumnWidth);
  }
  closeTableCell({ colspan = 1, rowspan = 1 } = {}) {
    const cell = this._popStackItem();
    const text = trimCharacter(getText(cell), `
`);
    cell.next.cells.push({ colspan, rowspan, text });
  }
  closeTableRow() {
    const row = this._popStackItem();
    row.next.rows.push(row.cells);
  }
  closeTable({ tableToString, leadingLineBreaks = 2, trailingLineBreaks = 2 }) {
    const table = this._popStackItem();
    const output = tableToString(table.rows);
    if (output) {
      addText(this._stackItem, output, leadingLineBreaks, trailingLineBreaks);
    }
  }
  toString() {
    return getText(this._stackItem.getRoot());
  }
}
function getText(stackItem) {
  if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) {
    throw new Error("Only blocks, list items and table cells can be requested for text contents.");
  }
  return stackItem.inlineTextBuilder.isEmpty() ? stackItem.rawText : stackItem.rawText + stackItem.inlineTextBuilder.toString();
}
function addText(stackItem, text, leadingLineBreaks, trailingLineBreaks) {
  if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) {
    throw new Error("Only blocks, list items and table cells can contain text.");
  }
  const parentText = getText(stackItem);
  const lineBreaks = Math.max(stackItem.stashedLineBreaks, leadingLineBreaks);
  stackItem.inlineTextBuilder.clear();
  if (parentText) {
    stackItem.rawText = parentText + `
`.repeat(lineBreaks) + text;
  } else {
    stackItem.rawText = text;
    stackItem.leadingLineBreaks = lineBreaks;
  }
  stackItem.stashedLineBreaks = trailingLineBreaks;
}
function applyTransformer(str, transformer) {
  return transformer ? applyTransformer(transformer.transform(str), transformer.next) : str;
}
function compile$1(options = {}) {
  const selectorsWithoutFormat = options.selectors.filter((s2) => !s2.format);
  if (selectorsWithoutFormat.length) {
    throw new Error("Following selectors have no specified format: " + selectorsWithoutFormat.map((s2) => `\`${s2.selector}\``).join(", "));
  }
  const picker = new DecisionTree(options.selectors.map((s2) => [s2.selector, s2])).build(hp2Builder);
  if (typeof options.encodeCharacters !== "function") {
    options.encodeCharacters = makeReplacerFromDict(options.encodeCharacters);
  }
  const baseSelectorsPicker = new DecisionTree(options.baseElements.selectors.map((s2, i) => [s2, i + 1])).build(hp2Builder);
  function findBaseElements(dom) {
    return findBases(dom, options, baseSelectorsPicker);
  }
  const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk, function(dom, builder) {
    builder.addInline(options.limits.ellipsis || "");
  });
  return function(html, metadata = undefined) {
    return process(html, metadata, options, picker, findBaseElements, limitedWalk);
  };
}
function process(html, metadata, options, picker, findBaseElements, walk) {
  const maxInputLength = options.limits.maxInputLength;
  if (maxInputLength && html && html.length > maxInputLength) {
    console.warn(`Input length ${html.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`);
    html = html.substring(0, maxInputLength);
  }
  const document = parseDocument(html, { decodeEntities: options.decodeEntities });
  const bases = findBaseElements(document.children);
  const builder = new BlockTextBuilder(options, picker, metadata);
  walk(bases, builder);
  return builder.toString();
}
function findBases(dom, options, baseSelectorsPicker) {
  const results = [];
  function recursiveWalk(walk, dom2) {
    dom2 = dom2.slice(0, options.limits.maxChildNodes);
    for (const elem of dom2) {
      if (elem.type !== "tag") {
        continue;
      }
      const pickedSelectorIndex = baseSelectorsPicker.pick1(elem);
      if (pickedSelectorIndex > 0) {
        results.push({ selectorIndex: pickedSelectorIndex, element: elem });
      } else if (elem.children) {
        walk(elem.children);
      }
      if (results.length >= options.limits.maxBaseElements) {
        return;
      }
    }
  }
  const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk);
  limitedWalk(dom);
  if (options.baseElements.orderBy !== "occurrence") {
    results.sort((a, b3) => a.selectorIndex - b3.selectorIndex);
  }
  return options.baseElements.returnDomByDefault && results.length === 0 ? dom : results.map((x) => x.element);
}
function recursiveWalk(walk, dom, builder) {
  if (!dom) {
    return;
  }
  const options = builder.options;
  const tooManyChildNodes = dom.length > options.limits.maxChildNodes;
  if (tooManyChildNodes) {
    dom = dom.slice(0, options.limits.maxChildNodes);
    dom.push({
      data: options.limits.ellipsis,
      type: "text"
    });
  }
  for (const elem of dom) {
    switch (elem.type) {
      case "text": {
        builder.addInline(elem.data);
        break;
      }
      case "tag": {
        const tagDefinition = builder.picker.pick1(elem);
        const format = options.formatters[tagDefinition.format];
        format(elem, walk, builder, tagDefinition.options || {});
        break;
      }
    }
  }
  return;
}
function makeReplacerFromDict(dict) {
  if (!dict || Object.keys(dict).length === 0) {
    return;
  }
  const entries = Object.entries(dict).filter(([, v3]) => v3 !== false);
  const regex = new RegExp(entries.map(([c2]) => `(${unicodeEscape([...c2][0])})`).join("|"), "g");
  const values = entries.map(([, v3]) => v3);
  const replacer = (m, ...cgs) => values[cgs.findIndex((cg) => cg)];
  return (str) => str.replace(regex, replacer);
}
function formatSkip(elem, walk, builder, formatOptions) {}
function formatInlineString(elem, walk, builder, formatOptions) {
  builder.addLiteral(formatOptions.string || "");
}
function formatBlockString(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addLiteral(formatOptions.string || "");
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatInline(elem, walk, builder, formatOptions) {
  walk(elem.children, builder);
}
function formatBlock$1(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function renderOpenTag(elem) {
  const attrs = elem.attribs && elem.attribs.length ? " " + Object.entries(elem.attribs).map(([k3, v3]) => v3 === "" ? k3 : `${k3}=${v3.replace(/"/g, "&quot;")}`).join(" ") : "";
  return `<${elem.name}${attrs}>`;
}
function renderCloseTag(elem) {
  return `</${elem.name}>`;
}
function formatInlineTag(elem, walk, builder, formatOptions) {
  builder.startNoWrap();
  builder.addLiteral(renderOpenTag(elem));
  builder.stopNoWrap();
  walk(elem.children, builder);
  builder.startNoWrap();
  builder.addLiteral(renderCloseTag(elem));
  builder.stopNoWrap();
}
function formatBlockTag(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.startNoWrap();
  builder.addLiteral(renderOpenTag(elem));
  builder.stopNoWrap();
  walk(elem.children, builder);
  builder.startNoWrap();
  builder.addLiteral(renderCloseTag(elem));
  builder.stopNoWrap();
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatInlineHtml(elem, walk, builder, formatOptions) {
  builder.startNoWrap();
  builder.addLiteral(render(elem, { decodeEntities: builder.options.decodeEntities }));
  builder.stopNoWrap();
}
function formatBlockHtml(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.startNoWrap();
  builder.addLiteral(render(elem, { decodeEntities: builder.options.decodeEntities }));
  builder.stopNoWrap();
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatInlineSurround(elem, walk, builder, formatOptions) {
  builder.addLiteral(formatOptions.prefix || "");
  walk(elem.children, builder);
  builder.addLiteral(formatOptions.suffix || "");
}
var genericFormatters = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  block: formatBlock$1,
  blockHtml: formatBlockHtml,
  blockString: formatBlockString,
  blockTag: formatBlockTag,
  inline: formatInline,
  inlineHtml: formatInlineHtml,
  inlineString: formatInlineString,
  inlineSurround: formatInlineSurround,
  inlineTag: formatInlineTag,
  skip: formatSkip
});
function getRow(matrix, j3) {
  if (!matrix[j3]) {
    matrix[j3] = [];
  }
  return matrix[j3];
}
function findFirstVacantIndex(row, x = 0) {
  while (row[x]) {
    x++;
  }
  return x;
}
function transposeInPlace(matrix, maxSize) {
  for (let i = 0;i < maxSize; i++) {
    const rowI = getRow(matrix, i);
    for (let j3 = 0;j3 < i; j3++) {
      const rowJ = getRow(matrix, j3);
      if (rowI[j3] || rowJ[i]) {
        const temp = rowI[j3];
        rowI[j3] = rowJ[i];
        rowJ[i] = temp;
      }
    }
  }
}
function putCellIntoLayout(cell, layout, baseRow, baseCol) {
  for (let r2 = 0;r2 < cell.rowspan; r2++) {
    const layoutRow = getRow(layout, baseRow + r2);
    for (let c2 = 0;c2 < cell.colspan; c2++) {
      layoutRow[baseCol + c2] = cell;
    }
  }
}
function getOrInitOffset(offsets, index) {
  if (offsets[index] === undefined) {
    offsets[index] = index === 0 ? 0 : 1 + getOrInitOffset(offsets, index - 1);
  }
  return offsets[index];
}
function updateOffset(offsets, base, span, value) {
  offsets[base + span] = Math.max(getOrInitOffset(offsets, base + span), getOrInitOffset(offsets, base) + value);
}
function tableToString(tableRows, rowSpacing, colSpacing) {
  const layout = [];
  let colNumber = 0;
  const rowNumber = tableRows.length;
  const rowOffsets = [0];
  for (let j3 = 0;j3 < rowNumber; j3++) {
    const layoutRow = getRow(layout, j3);
    const cells = tableRows[j3];
    let x = 0;
    for (let i = 0;i < cells.length; i++) {
      const cell = cells[i];
      x = findFirstVacantIndex(layoutRow, x);
      putCellIntoLayout(cell, layout, j3, x);
      x += cell.colspan;
      cell.lines = cell.text.split(`
`);
      const cellHeight = cell.lines.length;
      updateOffset(rowOffsets, j3, cell.rowspan, cellHeight + rowSpacing);
    }
    colNumber = layoutRow.length > colNumber ? layoutRow.length : colNumber;
  }
  transposeInPlace(layout, rowNumber > colNumber ? rowNumber : colNumber);
  const outputLines = [];
  const colOffsets = [0];
  for (let x = 0;x < colNumber; x++) {
    let y2 = 0;
    let cell;
    const rowsInThisColumn = Math.min(rowNumber, layout[x].length);
    while (y2 < rowsInThisColumn) {
      cell = layout[x][y2];
      if (cell) {
        if (!cell.rendered) {
          let cellWidth = 0;
          for (let j3 = 0;j3 < cell.lines.length; j3++) {
            const line = cell.lines[j3];
            const lineOffset = rowOffsets[y2] + j3;
            outputLines[lineOffset] = (outputLines[lineOffset] || "").padEnd(colOffsets[x]) + line;
            cellWidth = line.length > cellWidth ? line.length : cellWidth;
          }
          updateOffset(colOffsets, x, cell.colspan, cellWidth + colSpacing);
          cell.rendered = true;
        }
        y2 += cell.rowspan;
      } else {
        const lineOffset = rowOffsets[y2];
        outputLines[lineOffset] = outputLines[lineOffset] || "";
        y2++;
      }
    }
  }
  return outputLines.join(`
`);
}
function formatLineBreak(elem, walk, builder, formatOptions) {
  builder.addLineBreak();
}
function formatWbr(elem, walk, builder, formatOptions) {
  builder.addWordBreakOpportunity();
}
function formatHorizontalLine(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addInline("-".repeat(formatOptions.length || builder.options.wordwrap || 40));
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatParagraph(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatPre(elem, walk, builder, formatOptions) {
  builder.openBlock({
    isPre: true,
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2
  });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatHeading(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  if (formatOptions.uppercase !== false) {
    builder.pushWordTransform((str) => str.toUpperCase());
    walk(elem.children, builder);
    builder.popWordTransform();
  } else {
    walk(elem.children, builder);
  }
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatBlockquote(elem, walk, builder, formatOptions) {
  builder.openBlock({
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
    reservedLineLength: 2
  });
  walk(elem.children, builder);
  builder.closeBlock({
    trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
    blockTransform: (str) => (formatOptions.trimEmptyLines !== false ? trimCharacter(str, `
`) : str).split(`
`).map((line) => "> " + line).join(`
`)
  });
}
function withBrackets(str, brackets) {
  if (!brackets) {
    return str;
  }
  const lbr = typeof brackets[0] === "string" ? brackets[0] : "[";
  const rbr = typeof brackets[1] === "string" ? brackets[1] : "]";
  return lbr + str + rbr;
}
function pathRewrite(path, rewriter, baseUrl, metadata, elem) {
  const modifiedPath = typeof rewriter === "function" ? rewriter(path, metadata, elem) : path;
  return modifiedPath[0] === "/" && baseUrl ? trimCharacterEnd(baseUrl, "/") + modifiedPath : modifiedPath;
}
function formatImage(elem, walk, builder, formatOptions) {
  const attribs = elem.attribs || {};
  const alt = attribs.alt ? attribs.alt : "";
  const src = !attribs.src ? "" : pathRewrite(attribs.src, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
  const text = !src ? alt : !alt ? withBrackets(src, formatOptions.linkBrackets) : alt + " " + withBrackets(src, formatOptions.linkBrackets);
  builder.addInline(text, { noWordTransform: true });
}
function formatAnchor(elem, walk, builder, formatOptions) {
  function getHref() {
    if (formatOptions.ignoreHref) {
      return "";
    }
    if (!elem.attribs || !elem.attribs.href) {
      return "";
    }
    let href2 = elem.attribs.href.replace(/^mailto:/, "");
    if (formatOptions.noAnchorUrl && href2[0] === "#") {
      return "";
    }
    href2 = pathRewrite(href2, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
    return href2;
  }
  const href = getHref();
  if (!href) {
    walk(elem.children, builder);
  } else {
    let text = "";
    builder.pushWordTransform((str) => {
      if (str) {
        text += str;
      }
      return str;
    });
    walk(elem.children, builder);
    builder.popWordTransform();
    const hideSameLink = formatOptions.hideLinkHrefIfSameAsText && href === text;
    if (!hideSameLink) {
      builder.addInline(!text ? href : " " + withBrackets(href, formatOptions.linkBrackets), { noWordTransform: true });
    }
  }
}
function formatList(elem, walk, builder, formatOptions, nextPrefixCallback) {
  const isNestedList = get(elem, ["parent", "name"]) === "li";
  let maxPrefixLength = 0;
  const listItems = (elem.children || []).filter((child) => child.type !== "text" || !/^\s*$/.test(child.data)).map(function(child) {
    if (child.name !== "li") {
      return { node: child, prefix: "" };
    }
    const prefix = isNestedList ? nextPrefixCallback().trimStart() : nextPrefixCallback();
    if (prefix.length > maxPrefixLength) {
      maxPrefixLength = prefix.length;
    }
    return { node: child, prefix };
  });
  if (!listItems.length) {
    return;
  }
  builder.openList({
    interRowLineBreaks: 1,
    leadingLineBreaks: isNestedList ? 1 : formatOptions.leadingLineBreaks || 2,
    maxPrefixLength,
    prefixAlign: "left"
  });
  for (const { node: node2, prefix } of listItems) {
    builder.openListItem({ prefix });
    walk([node2], builder);
    builder.closeListItem();
  }
  builder.closeList({ trailingLineBreaks: isNestedList ? 1 : formatOptions.trailingLineBreaks || 2 });
}
function formatUnorderedList(elem, walk, builder, formatOptions) {
  const prefix = formatOptions.itemPrefix || " * ";
  return formatList(elem, walk, builder, formatOptions, () => prefix);
}
function formatOrderedList(elem, walk, builder, formatOptions) {
  let nextIndex = Number(elem.attribs.start || "1");
  const indexFunction = getOrderedListIndexFunction(elem.attribs.type);
  const nextPrefixCallback = () => " " + indexFunction(nextIndex++) + ". ";
  return formatList(elem, walk, builder, formatOptions, nextPrefixCallback);
}
function getOrderedListIndexFunction(olType = "1") {
  switch (olType) {
    case "a":
      return (i) => numberToLetterSequence(i, "a");
    case "A":
      return (i) => numberToLetterSequence(i, "A");
    case "i":
      return (i) => numberToRoman(i).toLowerCase();
    case "I":
      return (i) => numberToRoman(i);
    case "1":
    default:
      return (i) => i.toString();
  }
}
function splitClassesAndIds(selectors) {
  const classes = [];
  const ids = [];
  for (const selector of selectors) {
    if (selector.startsWith(".")) {
      classes.push(selector.substring(1));
    } else if (selector.startsWith("#")) {
      ids.push(selector.substring(1));
    }
  }
  return { classes, ids };
}
function isDataTable(attr, tables) {
  if (tables === true) {
    return true;
  }
  if (!attr) {
    return false;
  }
  const { classes, ids } = splitClassesAndIds(tables);
  const attrClasses = (attr["class"] || "").split(" ");
  const attrIds = (attr["id"] || "").split(" ");
  return attrClasses.some((x) => classes.includes(x)) || attrIds.some((x) => ids.includes(x));
}
function formatTable(elem, walk, builder, formatOptions) {
  return isDataTable(elem.attribs, builder.options.tables) ? formatDataTable(elem, walk, builder, formatOptions) : formatBlock(elem, walk, builder, formatOptions);
}
function formatBlock(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks });
}
function formatDataTable(elem, walk, builder, formatOptions) {
  builder.openTable();
  elem.children.forEach(walkTable);
  builder.closeTable({
    tableToString: (rows) => tableToString(rows, formatOptions.rowSpacing ?? 0, formatOptions.colSpacing ?? 3),
    leadingLineBreaks: formatOptions.leadingLineBreaks,
    trailingLineBreaks: formatOptions.trailingLineBreaks
  });
  function formatCell(cellNode) {
    const colspan = +get(cellNode, ["attribs", "colspan"]) || 1;
    const rowspan = +get(cellNode, ["attribs", "rowspan"]) || 1;
    builder.openTableCell({ maxColumnWidth: formatOptions.maxColumnWidth });
    walk(cellNode.children, builder);
    builder.closeTableCell({ colspan, rowspan });
  }
  function walkTable(elem2) {
    if (elem2.type !== "tag") {
      return;
    }
    const formatHeaderCell = formatOptions.uppercaseHeaderCells !== false ? (cellNode) => {
      builder.pushWordTransform((str) => str.toUpperCase());
      formatCell(cellNode);
      builder.popWordTransform();
    } : formatCell;
    switch (elem2.name) {
      case "thead":
      case "tbody":
      case "tfoot":
      case "center":
        elem2.children.forEach(walkTable);
        return;
      case "tr": {
        builder.openTableRow();
        for (const childOfTr of elem2.children) {
          if (childOfTr.type !== "tag") {
            continue;
          }
          switch (childOfTr.name) {
            case "th": {
              formatHeaderCell(childOfTr);
              break;
            }
            case "td": {
              formatCell(childOfTr);
              break;
            }
          }
        }
        builder.closeTableRow();
        break;
      }
    }
  }
}
var textFormatters = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  anchor: formatAnchor,
  blockquote: formatBlockquote,
  dataTable: formatDataTable,
  heading: formatHeading,
  horizontalLine: formatHorizontalLine,
  image: formatImage,
  lineBreak: formatLineBreak,
  orderedList: formatOrderedList,
  paragraph: formatParagraph,
  pre: formatPre,
  table: formatTable,
  unorderedList: formatUnorderedList,
  wbr: formatWbr
});
var DEFAULT_OPTIONS = {
  baseElements: {
    selectors: ["body"],
    orderBy: "selectors",
    returnDomByDefault: true
  },
  decodeEntities: true,
  encodeCharacters: {},
  formatters: {},
  limits: {
    ellipsis: "...",
    maxBaseElements: undefined,
    maxChildNodes: undefined,
    maxDepth: undefined,
    maxInputLength: 1 << 24
  },
  longWordSplit: {
    forceWrapOnLimit: false,
    wrapCharacters: []
  },
  preserveNewlines: false,
  selectors: [
    { selector: "*", format: "inline" },
    {
      selector: "a",
      format: "anchor",
      options: {
        baseUrl: null,
        hideLinkHrefIfSameAsText: false,
        ignoreHref: false,
        linkBrackets: ["[", "]"],
        noAnchorUrl: true
      }
    },
    { selector: "article", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "aside", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "blockquote",
      format: "blockquote",
      options: { leadingLineBreaks: 2, trailingLineBreaks: 2, trimEmptyLines: true }
    },
    { selector: "br", format: "lineBreak" },
    { selector: "div", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "footer", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "form", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "h1", format: "heading", options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h2", format: "heading", options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h3", format: "heading", options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h4", format: "heading", options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h5", format: "heading", options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h6", format: "heading", options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: "header", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "hr",
      format: "horizontalLine",
      options: { leadingLineBreaks: 2, length: undefined, trailingLineBreaks: 2 }
    },
    {
      selector: "img",
      format: "image",
      options: { baseUrl: null, linkBrackets: ["[", "]"] }
    },
    { selector: "main", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "nav", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "ol",
      format: "orderedList",
      options: { leadingLineBreaks: 2, trailingLineBreaks: 2 }
    },
    { selector: "p", format: "paragraph", options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    { selector: "pre", format: "pre", options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    { selector: "section", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "table",
      format: "table",
      options: {
        colSpacing: 3,
        leadingLineBreaks: 2,
        maxColumnWidth: 60,
        rowSpacing: 0,
        trailingLineBreaks: 2,
        uppercaseHeaderCells: true
      }
    },
    {
      selector: "ul",
      format: "unorderedList",
      options: { itemPrefix: " * ", leadingLineBreaks: 2, trailingLineBreaks: 2 }
    },
    { selector: "wbr", format: "wbr" }
  ],
  tables: [],
  whitespaceCharacters: ` 	\r
\f​`,
  wordwrap: 80
};
var concatMerge = (acc, src, options) => [...acc, ...src];
var overwriteMerge = (acc, src, options) => [...src];
var selectorsMerge = (acc, src, options) => acc.some((s2) => typeof s2 === "object") ? concatMerge(acc, src) : overwriteMerge(acc, src);
function compile(options = {}) {
  options = import_deepmerge.default(DEFAULT_OPTIONS, options, {
    arrayMerge: overwriteMerge,
    customMerge: (key) => key === "selectors" ? selectorsMerge : undefined
  });
  options.formatters = Object.assign({}, genericFormatters, textFormatters, options.formatters);
  options.selectors = mergeDuplicatesPreferLast(options.selectors, (s2) => s2.selector);
  handleDeprecatedOptions(options);
  return compile$1(options);
}
function convert(html, options = {}, metadata = undefined) {
  return compile(options)(html, metadata);
}
function handleDeprecatedOptions(options) {
  if (options.tags) {
    const tagDefinitions = Object.entries(options.tags).map(([selector, definition]) => ({ ...definition, selector: selector || "*" }));
    options.selectors.push(...tagDefinitions);
    options.selectors = mergeDuplicatesPreferLast(options.selectors, (s2) => s2.selector);
  }
  function set(obj, path, value) {
    const valueKey = path.pop();
    for (const key of path) {
      let nested = obj[key];
      if (!nested) {
        nested = {};
        obj[key] = nested;
      }
      obj = nested;
    }
    obj[valueKey] = value;
  }
  if (options["baseElement"]) {
    const baseElement = options["baseElement"];
    set(options, ["baseElements", "selectors"], Array.isArray(baseElement) ? baseElement : [baseElement]);
  }
  if (options["returnDomByDefault"] !== undefined) {
    set(options, ["baseElements", "returnDomByDefault"], options["returnDomByDefault"]);
  }
  for (const definition of options.selectors) {
    if (definition.format === "anchor" && get(definition, ["options", "noLinkBrackets"])) {
      set(definition, ["options", "linkBrackets"], false);
    }
  }
}

// ../../node_modules/.bun/@react-email+render@1.4.0+2b5434204782a989/node_modules/@react-email/render/dist/browser/index.mjs
import { jsx } from "react/jsx-runtime";
function recursivelyMapDoc(doc, callback) {
  if (Array.isArray(doc))
    return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
  if (typeof doc === "object") {
    if (doc.type === "group")
      return {
        ...doc,
        contents: recursivelyMapDoc(doc.contents, callback),
        expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
      };
    if ("contents" in doc)
      return {
        ...doc,
        contents: recursivelyMapDoc(doc.contents, callback)
      };
    if ("parts" in doc)
      return {
        ...doc,
        parts: recursivelyMapDoc(doc.parts, callback)
      };
    if (doc.type === "if-break")
      return {
        ...doc,
        breakContents: recursivelyMapDoc(doc.breakContents, callback),
        flatContents: recursivelyMapDoc(doc.flatContents, callback)
      };
  }
  return callback(doc);
}
var modifiedHtml = { ...exports_html };
if (modifiedHtml.printers) {
  const previousPrint = modifiedHtml.printers.html.print;
  modifiedHtml.printers.html.print = (path, options, print, args) => {
    const node2 = path.getNode();
    const rawPrintingResult = previousPrint(path, options, print, args);
    if (node2.type === "ieConditionalComment")
      return recursivelyMapDoc(rawPrintingResult, (doc) => {
        if (typeof doc === "object" && doc.type === "line")
          return doc.soft ? "" : " ";
        return doc;
      });
    return rawPrintingResult;
  };
}
var defaults = {
  endOfLine: "lf",
  tabWidth: 2,
  plugins: [modifiedHtml],
  bracketSameLine: true,
  parser: "html"
};
var pretty = (str, options = {}) => {
  return fu(str.replaceAll("\x00", ""), {
    ...defaults,
    ...options
  });
};
var plainTextSelectors = [
  {
    selector: "img",
    format: "skip"
  },
  {
    selector: "[data-skip-in-text=true]",
    format: "skip"
  },
  {
    selector: "a",
    options: {
      linkBrackets: false,
      hideLinkHrefIfSameAsText: true
    }
  }
];
function toPlainText(html$1, options) {
  return convert(html$1, {
    selectors: plainTextSelectors,
    wordwrap: false,
    ...options
  });
}
var decoder = new TextDecoder("utf-8");
var readStream = async (stream) => {
  const chunks = [];
  const writableStream = new WritableStream({
    write(chunk) {
      chunks.push(chunk);
    },
    abort(reason) {
      throw new Error("Stream aborted", { cause: { reason } });
    }
  });
  await stream.pipeTo(writableStream);
  let length = 0;
  chunks.forEach((item) => {
    length += item.length;
  });
  const mergedChunks = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((item) => {
    mergedChunks.set(item, offset);
    offset += item.length;
  });
  return decoder.decode(mergedChunks);
};
var render2 = async (node2, options) => {
  const suspendedElement = /* @__PURE__ */ jsx(Suspense, { children: node2 });
  const reactDOMServer = await import("react-dom/server.browser").then((m) => m.default);
  const html$1 = await new Promise((resolve, reject) => {
    reactDOMServer.renderToReadableStream(suspendedElement, {
      onError(error) {
        reject(error);
      },
      progressiveChunkSize: Number.POSITIVE_INFINITY
    }).then(readStream).then(resolve).catch(reject);
  });
  if (options?.plainText)
    return toPlainText(html$1, options.htmlToTextOptions);
  const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html$1.replace(/<!DOCTYPE.*?>/, "")}`;
  if (options?.pretty)
    return pretty(document);
  return document;
};

// src/email/server/render-email.ts
async function renderEmailTemplate(component, props) {
  const { subject } = props;
  let emailSubject;
  let componentProps;
  if (typeof subject === "function") {
    const { subject: _3, ...restProps } = props;
    componentProps = restProps;
    emailSubject = subject(componentProps);
  } else {
    componentProps = props;
    emailSubject = subject;
  }
  const [html, text] = await Promise.all([render2(component(componentProps)), render2(component(componentProps), { plainText: true })]);
  return {
    subject: emailSubject,
    html,
    text
  };
}
export {
  sendMail,
  renderEmailTemplate,
  emailConfigMiddleware
};

//# debugId=BC67465A3BD794E964756E2164756E21
