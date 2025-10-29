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
// src/email/email.context.ts
import { createContext } from "react-router";
var emailContext = createContext(null);
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
function getTestSentEmails() {
  return sentEmails.map((email) => ({
    to: email.to,
    from: email.from,
    template: {
      subject: email.template.subject,
      html: email.template.html,
      text: email.template.text
    }
  }));
}
function getTestLastSentEmail() {
  const lastEmail = sentEmails[sentEmails.length - 1];
  if (!lastEmail) {
    return;
  }
  return {
    to: lastEmail.to,
    from: lastEmail.from,
    template: {
      subject: lastEmail.template.subject,
      html: lastEmail.template.html,
      text: lastEmail.template.text
    }
  };
}
function getTestEmailCount() {
  return sentEmails.length;
}
function findTestEmailByTo(to) {
  return sentEmails.find((email) => email.to === to);
}
function findTestEmailsBySubject(subject) {
  return sentEmails.filter((email) => email.template.subject.includes(subject));
}
function clearTestSentEmails() {
  sentEmails = [];
}
function simulateTestEmailFailure(reason = "Simulated email failure") {
  shouldFail = true;
  failureReason = reason;
}
function resetTestEmailToSuccess() {
  shouldFail = false;
  failureReason = "Simulated email failure";
}
function resetTestEmailProvider() {
  clearTestSentEmails();
  resetTestEmailToSuccess();
}
function getTestEmailFailureState() {
  return {
    shouldFail,
    reason: failureReason
  };
}
function assertTestEmailSent(to) {
  const email = findTestEmailByTo(to);
  if (!email) {
    throw new Error(`Expected email to be sent to ${to}, but no email was found`);
  }
  return email;
}
function assertTestEmailCount(expectedCount) {
  const actualCount = getTestEmailCount();
  if (actualCount !== expectedCount) {
    throw new Error(`Expected ${expectedCount} emails to be sent, but ${actualCount} were sent`);
  }
}
function assertTestNoEmailsSent() {
  assertTestEmailCount(0);
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
function getSupportedProviders() {
  return Object.keys(providerRegistry);
}
function getEmailProviderNames(emailConfig) {
  return emailConfig.providers.map((provider) => provider.name);
}
function getProviderConfig(emailConfig, providerName) {
  return emailConfig.providers.find((provider) => provider.name === providerName);
}
// src/email/email-validator.ts
import * as v from "valibot";
var EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email(), v.maxLength(254));
// ../../node_modules/.bun/@react-email+body@0.1.0+2f44e903108183df/node_modules/@react-email/body/dist/index.mjs
import * as React from "react";
import { jsx } from "react/jsx-runtime";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => (key in obj) ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var Body = React.forwardRef((_a, ref) => {
  var _b = _a, { children, style } = _b, props = __objRest(_b, ["children", "style"]);
  return /* @__PURE__ */ jsx("body", __spreadProps(__spreadValues({}, props), {
    style: {
      background: style == null ? undefined : style.background,
      backgroundColor: style == null ? undefined : style.backgroundColor
    },
    ref,
    children: /* @__PURE__ */ jsx("table", {
      border: 0,
      width: "100%",
      cellPadding: "0",
      cellSpacing: "0",
      role: "presentation",
      align: "center",
      children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style, children }) }) })
    })
  }));
});
Body.displayName = "Body";

// ../../node_modules/.bun/@react-email+container@0.0.15+2f44e903108183df/node_modules/@react-email/container/dist/index.mjs
import * as React2 from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var __defProp2 = Object.defineProperty;
var __defProps2 = Object.defineProperties;
var __getOwnPropDescs2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => (key in obj) ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp2(a, prop, b[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b)) {
      if (__propIsEnum2.call(b, prop))
        __defNormalProp2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps2 = (a, b) => __defProps2(a, __getOwnPropDescs2(b));
var __objRest2 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp2.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum2.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var Container = React2.forwardRef((_a, ref) => {
  var _b = _a, { children, style } = _b, props = __objRest2(_b, ["children", "style"]);
  return /* @__PURE__ */ jsx2("table", __spreadProps2(__spreadValues2({
    align: "center",
    width: "100%"
  }, props), {
    border: 0,
    cellPadding: "0",
    cellSpacing: "0",
    ref,
    role: "presentation",
    style: __spreadValues2({ maxWidth: "37.5em" }, style),
    children: /* @__PURE__ */ jsx2("tbody", { children: /* @__PURE__ */ jsx2("tr", { style: { width: "100%" }, children: /* @__PURE__ */ jsx2("td", { children }) }) })
  }));
});
Container.displayName = "Container";

// ../../node_modules/.bun/@react-email+head@0.0.12+2f44e903108183df/node_modules/@react-email/head/dist/index.mjs
import * as React3 from "react";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var __defProp3 = Object.defineProperty;
var __defProps3 = Object.defineProperties;
var __getOwnPropDescs3 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols3 = Object.getOwnPropertySymbols;
var __hasOwnProp3 = Object.prototype.hasOwnProperty;
var __propIsEnum3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp3 = (obj, key, value) => (key in obj) ? __defProp3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues3 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp3.call(b, prop))
      __defNormalProp3(a, prop, b[prop]);
  if (__getOwnPropSymbols3)
    for (var prop of __getOwnPropSymbols3(b)) {
      if (__propIsEnum3.call(b, prop))
        __defNormalProp3(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps3 = (a, b) => __defProps3(a, __getOwnPropDescs3(b));
var __objRest3 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp3.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols3)
    for (var prop of __getOwnPropSymbols3(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum3.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var Head = React3.forwardRef((_a, ref) => {
  var _b = _a, { children } = _b, props = __objRest3(_b, ["children"]);
  return /* @__PURE__ */ jsxs("head", __spreadProps3(__spreadValues3({}, props), { ref, children: [
    /* @__PURE__ */ jsx3("meta", { content: "text/html; charset=UTF-8", httpEquiv: "Content-Type" }),
    /* @__PURE__ */ jsx3("meta", { name: "x-apple-disable-message-reformatting" }),
    children
  ] }));
});
Head.displayName = "Head";

// ../../node_modules/.bun/@react-email+heading@0.0.15+2f44e903108183df/node_modules/@react-email/heading/dist/index.mjs
import * as React4 from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var __defProp4 = Object.defineProperty;
var __defProps4 = Object.defineProperties;
var __getOwnPropDescs4 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols4 = Object.getOwnPropertySymbols;
var __hasOwnProp4 = Object.prototype.hasOwnProperty;
var __propIsEnum4 = Object.prototype.propertyIsEnumerable;
var __defNormalProp4 = (obj, key, value) => (key in obj) ? __defProp4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues4 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp4.call(b, prop))
      __defNormalProp4(a, prop, b[prop]);
  if (__getOwnPropSymbols4)
    for (var prop of __getOwnPropSymbols4(b)) {
      if (__propIsEnum4.call(b, prop))
        __defNormalProp4(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps4 = (a, b) => __defProps4(a, __getOwnPropDescs4(b));
var __objRest4 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp4.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols4)
    for (var prop of __getOwnPropSymbols4(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum4.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var withMargin = (props) => {
  const nonEmptyStyles = [
    withSpace(props.m, ["margin"]),
    withSpace(props.mx, ["marginLeft", "marginRight"]),
    withSpace(props.my, ["marginTop", "marginBottom"]),
    withSpace(props.mt, ["marginTop"]),
    withSpace(props.mr, ["marginRight"]),
    withSpace(props.mb, ["marginBottom"]),
    withSpace(props.ml, ["marginLeft"])
  ].filter((s) => Object.keys(s).length);
  const mergedStyles = nonEmptyStyles.reduce((acc, style) => {
    return __spreadValues4(__spreadValues4({}, acc), style);
  }, {});
  return mergedStyles;
};
var withSpace = (value, properties) => {
  return properties.reduce((styles, property) => {
    if (!isNaN(parseFloat(value))) {
      return __spreadProps4(__spreadValues4({}, styles), { [property]: `${value}px` });
    }
    return styles;
  }, {});
};
var Heading = React4.forwardRef((_a, ref) => {
  var _b = _a, { as: Tag = "h1", children, style, m, mx, my, mt, mr, mb, ml } = _b, props = __objRest4(_b, ["as", "children", "style", "m", "mx", "my", "mt", "mr", "mb", "ml"]);
  return /* @__PURE__ */ jsx4(Tag, __spreadProps4(__spreadValues4({}, props), {
    ref,
    style: __spreadValues4(__spreadValues4({}, withMargin({ m, mx, my, mt, mr, mb, ml })), style),
    children
  }));
});
Heading.displayName = "Heading";

// ../../node_modules/.bun/@react-email+hr@0.0.11+2f44e903108183df/node_modules/@react-email/hr/dist/index.mjs
import * as React5 from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var __defProp5 = Object.defineProperty;
var __defProps5 = Object.defineProperties;
var __getOwnPropDescs5 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols5 = Object.getOwnPropertySymbols;
var __hasOwnProp5 = Object.prototype.hasOwnProperty;
var __propIsEnum5 = Object.prototype.propertyIsEnumerable;
var __defNormalProp5 = (obj, key, value) => (key in obj) ? __defProp5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues5 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp5.call(b, prop))
      __defNormalProp5(a, prop, b[prop]);
  if (__getOwnPropSymbols5)
    for (var prop of __getOwnPropSymbols5(b)) {
      if (__propIsEnum5.call(b, prop))
        __defNormalProp5(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps5 = (a, b) => __defProps5(a, __getOwnPropDescs5(b));
var __objRest5 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp5.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols5)
    for (var prop of __getOwnPropSymbols5(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum5.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var Hr = React5.forwardRef((_a, ref) => {
  var _b = _a, { style } = _b, props = __objRest5(_b, ["style"]);
  return /* @__PURE__ */ jsx5("hr", __spreadProps5(__spreadValues5({}, props), {
    ref,
    style: __spreadValues5({
      width: "100%",
      border: "none",
      borderTop: "1px solid #eaeaea"
    }, style)
  }));
});
Hr.displayName = "Hr";

// ../../node_modules/.bun/@react-email+html@0.0.11+2f44e903108183df/node_modules/@react-email/html/dist/index.mjs
import * as React6 from "react";
import { jsx as jsx6 } from "react/jsx-runtime";
var __defProp6 = Object.defineProperty;
var __defProps6 = Object.defineProperties;
var __getOwnPropDescs6 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols6 = Object.getOwnPropertySymbols;
var __hasOwnProp6 = Object.prototype.hasOwnProperty;
var __propIsEnum6 = Object.prototype.propertyIsEnumerable;
var __defNormalProp6 = (obj, key, value) => (key in obj) ? __defProp6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues6 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp6.call(b, prop))
      __defNormalProp6(a, prop, b[prop]);
  if (__getOwnPropSymbols6)
    for (var prop of __getOwnPropSymbols6(b)) {
      if (__propIsEnum6.call(b, prop))
        __defNormalProp6(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps6 = (a, b) => __defProps6(a, __getOwnPropDescs6(b));
var __objRest6 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp6.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols6)
    for (var prop of __getOwnPropSymbols6(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum6.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var Html = React6.forwardRef((_a, ref) => {
  var _b = _a, { children, lang = "en", dir = "ltr" } = _b, props = __objRest6(_b, ["children", "lang", "dir"]);
  return /* @__PURE__ */ jsx6("html", __spreadProps6(__spreadValues6({}, props), { dir, lang, ref, children }));
});
Html.displayName = "Html";

// ../../node_modules/.bun/@react-email+link@0.0.12+2f44e903108183df/node_modules/@react-email/link/dist/index.mjs
import * as React7 from "react";
import { jsx as jsx7 } from "react/jsx-runtime";
var __defProp7 = Object.defineProperty;
var __defProps7 = Object.defineProperties;
var __getOwnPropDescs7 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols7 = Object.getOwnPropertySymbols;
var __hasOwnProp7 = Object.prototype.hasOwnProperty;
var __propIsEnum7 = Object.prototype.propertyIsEnumerable;
var __defNormalProp7 = (obj, key, value) => (key in obj) ? __defProp7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues7 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp7.call(b, prop))
      __defNormalProp7(a, prop, b[prop]);
  if (__getOwnPropSymbols7)
    for (var prop of __getOwnPropSymbols7(b)) {
      if (__propIsEnum7.call(b, prop))
        __defNormalProp7(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps7 = (a, b) => __defProps7(a, __getOwnPropDescs7(b));
var __objRest7 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp7.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols7)
    for (var prop of __getOwnPropSymbols7(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum7.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var Link = React7.forwardRef((_a, ref) => {
  var _b = _a, { target = "_blank", style } = _b, props = __objRest7(_b, ["target", "style"]);
  return /* @__PURE__ */ jsx7("a", __spreadProps7(__spreadValues7({}, props), {
    ref,
    style: __spreadValues7({
      color: "#067df7",
      textDecorationLine: "none"
    }, style),
    target,
    children: props.children
  }));
});
Link.displayName = "Link";

// ../../node_modules/.bun/@react-email+section@0.0.16+2f44e903108183df/node_modules/@react-email/section/dist/index.mjs
import * as React8 from "react";
import { jsx as jsx8 } from "react/jsx-runtime";
var __defProp8 = Object.defineProperty;
var __defProps8 = Object.defineProperties;
var __getOwnPropDescs8 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols8 = Object.getOwnPropertySymbols;
var __hasOwnProp8 = Object.prototype.hasOwnProperty;
var __propIsEnum8 = Object.prototype.propertyIsEnumerable;
var __defNormalProp8 = (obj, key, value) => (key in obj) ? __defProp8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues8 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp8.call(b, prop))
      __defNormalProp8(a, prop, b[prop]);
  if (__getOwnPropSymbols8)
    for (var prop of __getOwnPropSymbols8(b)) {
      if (__propIsEnum8.call(b, prop))
        __defNormalProp8(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps8 = (a, b) => __defProps8(a, __getOwnPropDescs8(b));
var __objRest8 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp8.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols8)
    for (var prop of __getOwnPropSymbols8(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum8.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var Section = React8.forwardRef((_a, ref) => {
  var _b = _a, { children, style } = _b, props = __objRest8(_b, ["children", "style"]);
  return /* @__PURE__ */ jsx8("table", __spreadProps8(__spreadValues8({
    align: "center",
    width: "100%",
    border: 0,
    cellPadding: "0",
    cellSpacing: "0",
    role: "presentation"
  }, props), {
    ref,
    style,
    children: /* @__PURE__ */ jsx8("tbody", { children: /* @__PURE__ */ jsx8("tr", { children: /* @__PURE__ */ jsx8("td", { children }) }) })
  }));
});
Section.displayName = "Section";

// ../../node_modules/.bun/@react-email+tailwind@1.2.2+2f44e903108183df/node_modules/@react-email/tailwind/dist/index.mjs
import { jsx as fu } from "react/jsx-runtime";
import * as Or from "react";
import ot from "react";
var __dirname = "/src/rr-cf/node_modules/.bun/@react-email+tailwind@1.2.2+2f44e903108183df/node_modules/@react-email/tailwind/dist";
var ta = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function He(u) {
  return u && u.__esModule && Object.prototype.hasOwnProperty.call(u, "default") ? u.default : u;
}
function cu(u) {
  if (Object.prototype.hasOwnProperty.call(u, "__esModule"))
    return u;
  var a = u.default;
  if (typeof a == "function") {
    var h = function p() {
      return this instanceof p ? Reflect.construct(a, arguments, this.constructor) : a.apply(this, arguments);
    };
    h.prototype = a.prototype;
  } else
    h = {};
  return Object.defineProperty(h, "__esModule", { value: true }), Object.keys(u).forEach(function(p) {
    var l = Object.getOwnPropertyDescriptor(u, p);
    Object.defineProperty(h, p, l.get ? l : {
      enumerable: true,
      get: function() {
        return u[p];
      }
    });
  }), h;
}
var pt = { exports: {} };
var ra;
function Ti() {
  if (ra)
    return pt.exports;
  ra = 1;
  var u = String, a = function() {
    return { isColorSupported: false, reset: u, bold: u, dim: u, italic: u, underline: u, inverse: u, hidden: u, strikethrough: u, black: u, red: u, green: u, yellow: u, blue: u, magenta: u, cyan: u, white: u, gray: u, bgBlack: u, bgRed: u, bgGreen: u, bgYellow: u, bgBlue: u, bgMagenta: u, bgCyan: u, bgWhite: u, blackBright: u, redBright: u, greenBright: u, yellowBright: u, blueBright: u, magentaBright: u, cyanBright: u, whiteBright: u, bgBlackBright: u, bgRedBright: u, bgGreenBright: u, bgYellowBright: u, bgBlueBright: u, bgMagentaBright: u, bgCyanBright: u, bgWhiteBright: u };
  };
  return pt.exports = a(), pt.exports.createColors = a, pt.exports;
}
var du = {};
var pu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: du
}, Symbol.toStringTag, { value: "Module" }));
var Ne = /* @__PURE__ */ cu(pu);
var kr;
var na;
function Ai() {
  if (na)
    return kr;
  na = 1;
  let u = /* @__PURE__ */ Ti(), a = Ne;

  class h extends Error {
    constructor(l, f, s, c, t, e) {
      super(l), this.name = "CssSyntaxError", this.reason = l, t && (this.file = t), c && (this.source = c), e && (this.plugin = e), typeof f < "u" && typeof s < "u" && (typeof f == "number" ? (this.line = f, this.column = s) : (this.line = f.line, this.column = f.column, this.endLine = s.line, this.endColumn = s.column)), this.setMessage(), Error.captureStackTrace && Error.captureStackTrace(this, h);
    }
    setMessage() {
      this.message = this.plugin ? this.plugin + ": " : "", this.message += this.file ? this.file : "<css input>", typeof this.line < "u" && (this.message += ":" + this.line + ":" + this.column), this.message += ": " + this.reason;
    }
    showSourceCode(l) {
      if (!this.source)
        return "";
      let f = this.source;
      l == null && (l = u.isColorSupported);
      let s = (v2) => v2, c = (v2) => v2, t = (v2) => v2;
      if (l) {
        let { bold: v2, gray: m, red: n } = u.createColors(true);
        c = (d) => v2(n(d)), s = (d) => m(d), a && (t = (d) => a(d));
      }
      let e = f.split(/\r?\n/), r = Math.max(this.line - 3, 0), i = Math.min(this.line + 2, e.length), o = String(i).length;
      return e.slice(r, i).map((v2, m) => {
        let n = r + 1 + m, d = " " + (" " + n).slice(-o) + " | ";
        if (n === this.line) {
          if (v2.length > 160) {
            let w = 20, y = Math.max(0, this.column - w), x = Math.max(this.column + w, this.endColumn + w), g = v2.slice(y, x), O = s(d.replace(/\d/g, " ")) + v2.slice(0, Math.min(this.column - 1, w - 1)).replace(/[^\t]/g, " ");
            return c(">") + s(d) + t(g) + `
 ` + O + c("^");
          }
          let _ = s(d.replace(/\d/g, " ")) + v2.slice(0, this.column - 1).replace(/[^\t]/g, " ");
          return c(">") + s(d) + t(v2) + `
 ` + _ + c("^");
        }
        return " " + s(d) + t(v2);
      }).join(`
`);
    }
    toString() {
      let l = this.showSourceCode();
      return l && (l = `

` + l + `
`), this.name + ": " + this.message + l;
    }
  }
  return kr = h, h.default = h, kr;
}
var Pr;
var ia;
function dl() {
  if (ia)
    return Pr;
  ia = 1;
  const u = {
    after: `
`,
    beforeClose: `
`,
    beforeComment: `
`,
    beforeDecl: `
`,
    beforeOpen: " ",
    beforeRule: `
`,
    colon: ": ",
    commentLeft: " ",
    commentRight: " ",
    emptyBody: "",
    indent: "    ",
    semicolon: false
  };
  function a(p) {
    return p[0].toUpperCase() + p.slice(1);
  }

  class h {
    constructor(l) {
      this.builder = l;
    }
    atrule(l, f) {
      let s = "@" + l.name, c = l.params ? this.rawValue(l, "params") : "";
      if (typeof l.raws.afterName < "u" ? s += l.raws.afterName : c && (s += " "), l.nodes)
        this.block(l, s + c);
      else {
        let t = (l.raws.between || "") + (f ? ";" : "");
        this.builder(s + c + t, l);
      }
    }
    beforeAfter(l, f) {
      let s;
      l.type === "decl" ? s = this.raw(l, null, "beforeDecl") : l.type === "comment" ? s = this.raw(l, null, "beforeComment") : f === "before" ? s = this.raw(l, null, "beforeRule") : s = this.raw(l, null, "beforeClose");
      let c = l.parent, t = 0;
      for (;c && c.type !== "root"; )
        t += 1, c = c.parent;
      if (s.includes(`
`)) {
        let e = this.raw(l, null, "indent");
        if (e.length)
          for (let r = 0;r < t; r++)
            s += e;
      }
      return s;
    }
    block(l, f) {
      let s = this.raw(l, "between", "beforeOpen");
      this.builder(f + s + "{", l, "start");
      let c;
      l.nodes && l.nodes.length ? (this.body(l), c = this.raw(l, "after")) : c = this.raw(l, "after", "emptyBody"), c && this.builder(c), this.builder("}", l, "end");
    }
    body(l) {
      let f = l.nodes.length - 1;
      for (;f > 0 && l.nodes[f].type === "comment"; )
        f -= 1;
      let s = this.raw(l, "semicolon");
      for (let c = 0;c < l.nodes.length; c++) {
        let t = l.nodes[c], e = this.raw(t, "before");
        e && this.builder(e), this.stringify(t, f !== c || s);
      }
    }
    comment(l) {
      let f = this.raw(l, "left", "commentLeft"), s = this.raw(l, "right", "commentRight");
      this.builder("/*" + f + l.text + s + "*/", l);
    }
    decl(l, f) {
      let s = this.raw(l, "between", "colon"), c = l.prop + s + this.rawValue(l, "value");
      l.important && (c += l.raws.important || " !important"), f && (c += ";"), this.builder(c, l);
    }
    document(l) {
      this.body(l);
    }
    raw(l, f, s) {
      let c;
      if (s || (s = f), f && (c = l.raws[f], typeof c < "u"))
        return c;
      let t = l.parent;
      if (s === "before" && (!t || t.type === "root" && t.first === l || t && t.type === "document"))
        return "";
      if (!t)
        return u[s];
      let e = l.root();
      if (e.rawCache || (e.rawCache = {}), typeof e.rawCache[s] < "u")
        return e.rawCache[s];
      if (s === "before" || s === "after")
        return this.beforeAfter(l, s);
      {
        let r = "raw" + a(s);
        this[r] ? c = this[r](e, l) : e.walk((i) => {
          if (c = i.raws[f], typeof c < "u")
            return false;
        });
      }
      return typeof c > "u" && (c = u[s]), e.rawCache[s] = c, c;
    }
    rawBeforeClose(l) {
      let f;
      return l.walk((s) => {
        if (s.nodes && s.nodes.length > 0 && typeof s.raws.after < "u")
          return f = s.raws.after, f.includes(`
`) && (f = f.replace(/[^\n]+$/, "")), false;
      }), f && (f = f.replace(/\S/g, "")), f;
    }
    rawBeforeComment(l, f) {
      let s;
      return l.walkComments((c) => {
        if (typeof c.raws.before < "u")
          return s = c.raws.before, s.includes(`
`) && (s = s.replace(/[^\n]+$/, "")), false;
      }), typeof s > "u" ? s = this.raw(f, null, "beforeDecl") : s && (s = s.replace(/\S/g, "")), s;
    }
    rawBeforeDecl(l, f) {
      let s;
      return l.walkDecls((c) => {
        if (typeof c.raws.before < "u")
          return s = c.raws.before, s.includes(`
`) && (s = s.replace(/[^\n]+$/, "")), false;
      }), typeof s > "u" ? s = this.raw(f, null, "beforeRule") : s && (s = s.replace(/\S/g, "")), s;
    }
    rawBeforeOpen(l) {
      let f;
      return l.walk((s) => {
        if (s.type !== "decl" && (f = s.raws.between, typeof f < "u"))
          return false;
      }), f;
    }
    rawBeforeRule(l) {
      let f;
      return l.walk((s) => {
        if (s.nodes && (s.parent !== l || l.first !== s) && typeof s.raws.before < "u")
          return f = s.raws.before, f.includes(`
`) && (f = f.replace(/[^\n]+$/, "")), false;
      }), f && (f = f.replace(/\S/g, "")), f;
    }
    rawColon(l) {
      let f;
      return l.walkDecls((s) => {
        if (typeof s.raws.between < "u")
          return f = s.raws.between.replace(/[^\s:]/g, ""), false;
      }), f;
    }
    rawEmptyBody(l) {
      let f;
      return l.walk((s) => {
        if (s.nodes && s.nodes.length === 0 && (f = s.raws.after, typeof f < "u"))
          return false;
      }), f;
    }
    rawIndent(l) {
      if (l.raws.indent)
        return l.raws.indent;
      let f;
      return l.walk((s) => {
        let c = s.parent;
        if (c && c !== l && c.parent && c.parent === l && typeof s.raws.before < "u") {
          let t = s.raws.before.split(`
`);
          return f = t[t.length - 1], f = f.replace(/\S/g, ""), false;
        }
      }), f;
    }
    rawSemicolon(l) {
      let f;
      return l.walk((s) => {
        if (s.nodes && s.nodes.length && s.last.type === "decl" && (f = s.raws.semicolon, typeof f < "u"))
          return false;
      }), f;
    }
    rawValue(l, f) {
      let s = l[f], c = l.raws[f];
      return c && c.value === s ? c.raw : s;
    }
    root(l) {
      this.body(l), l.raws.after && this.builder(l.raws.after);
    }
    rule(l) {
      this.block(l, this.rawValue(l, "selector")), l.raws.ownSemicolon && this.builder(l.raws.ownSemicolon, l, "end");
    }
    stringify(l, f) {
      if (!this[l.type])
        throw new Error("Unknown AST node type " + l.type + ". Maybe you need to change PostCSS stringifier.");
      this[l.type](l, f);
    }
  }
  return Pr = h, h.default = h, Pr;
}
var Er;
var aa;
function or() {
  if (aa)
    return Er;
  aa = 1;
  let u = dl();
  function a(h, p) {
    new u(p).stringify(h);
  }
  return Er = a, a.default = a, Er;
}
var ht = {};
var sa;
function Ci() {
  return sa || (sa = 1, ht.isClean = Symbol("isClean"), ht.my = Symbol("my")), ht;
}
var Tr;
var oa;
function lr() {
  if (oa)
    return Tr;
  oa = 1;
  let u = Ai(), a = dl(), h = or(), { isClean: p, my: l } = Ci();
  function f(t, e) {
    let r = new t.constructor;
    for (let i in t) {
      if (!Object.prototype.hasOwnProperty.call(t, i) || i === "proxyCache")
        continue;
      let o = t[i], v2 = typeof o;
      i === "parent" && v2 === "object" ? e && (r[i] = e) : i === "source" ? r[i] = o : Array.isArray(o) ? r[i] = o.map((m) => f(m, r)) : (v2 === "object" && o !== null && (o = f(o)), r[i] = o);
    }
    return r;
  }
  function s(t, e) {
    if (e && typeof e.offset < "u")
      return e.offset;
    let r = 1, i = 1, o = 0;
    for (let v2 = 0;v2 < t.length; v2++) {
      if (i === e.line && r === e.column) {
        o = v2;
        break;
      }
      t[v2] === `
` ? (r = 1, i += 1) : r += 1;
    }
    return o;
  }

  class c {
    get proxyOf() {
      return this;
    }
    constructor(e = {}) {
      this.raws = {}, this[p] = false, this[l] = true;
      for (let r in e)
        if (r === "nodes") {
          this.nodes = [];
          for (let i of e[r])
            typeof i.clone == "function" ? this.append(i.clone()) : this.append(i);
        } else
          this[r] = e[r];
    }
    addToError(e) {
      if (e.postcssNode = this, e.stack && this.source && /\n\s{4}at /.test(e.stack)) {
        let r = this.source;
        e.stack = e.stack.replace(/\n\s{4}at /, `$&${r.input.from}:${r.start.line}:${r.start.column}$&`);
      }
      return e;
    }
    after(e) {
      return this.parent.insertAfter(this, e), this;
    }
    assign(e = {}) {
      for (let r in e)
        this[r] = e[r];
      return this;
    }
    before(e) {
      return this.parent.insertBefore(this, e), this;
    }
    cleanRaws(e) {
      delete this.raws.before, delete this.raws.after, e || delete this.raws.between;
    }
    clone(e = {}) {
      let r = f(this);
      for (let i in e)
        r[i] = e[i];
      return r;
    }
    cloneAfter(e = {}) {
      let r = this.clone(e);
      return this.parent.insertAfter(this, r), r;
    }
    cloneBefore(e = {}) {
      let r = this.clone(e);
      return this.parent.insertBefore(this, r), r;
    }
    error(e, r = {}) {
      if (this.source) {
        let { end: i, start: o } = this.rangeBy(r);
        return this.source.input.error(e, { column: o.column, line: o.line }, { column: i.column, line: i.line }, r);
      }
      return new u(e);
    }
    getProxyProcessor() {
      return {
        get(e, r) {
          return r === "proxyOf" ? e : r === "root" ? () => e.root().toProxy() : e[r];
        },
        set(e, r, i) {
          return e[r] === i || (e[r] = i, (r === "prop" || r === "value" || r === "name" || r === "params" || r === "important" || r === "text") && e.markDirty()), true;
        }
      };
    }
    markClean() {
      this[p] = true;
    }
    markDirty() {
      if (this[p]) {
        this[p] = false;
        let e = this;
        for (;e = e.parent; )
          e[p] = false;
      }
    }
    next() {
      if (!this.parent)
        return;
      let e = this.parent.index(this);
      return this.parent.nodes[e + 1];
    }
    positionBy(e) {
      let r = this.source.start;
      if (e.index)
        r = this.positionInside(e.index);
      else if (e.word) {
        let i = "document" in this.source.input ? this.source.input.document : this.source.input.css, v2 = i.slice(s(i, this.source.start), s(i, this.source.end)).indexOf(e.word);
        v2 !== -1 && (r = this.positionInside(v2));
      }
      return r;
    }
    positionInside(e) {
      let r = this.source.start.column, i = this.source.start.line, o = "document" in this.source.input ? this.source.input.document : this.source.input.css, v2 = s(o, this.source.start), m = v2 + e;
      for (let n = v2;n < m; n++)
        o[n] === `
` ? (r = 1, i += 1) : r += 1;
      return { column: r, line: i };
    }
    prev() {
      if (!this.parent)
        return;
      let e = this.parent.index(this);
      return this.parent.nodes[e - 1];
    }
    rangeBy(e) {
      let r = {
        column: this.source.start.column,
        line: this.source.start.line
      }, i = this.source.end ? {
        column: this.source.end.column + 1,
        line: this.source.end.line
      } : {
        column: r.column + 1,
        line: r.line
      };
      if (e.word) {
        let o = "document" in this.source.input ? this.source.input.document : this.source.input.css, m = o.slice(s(o, this.source.start), s(o, this.source.end)).indexOf(e.word);
        m !== -1 && (r = this.positionInside(m), i = this.positionInside(m + e.word.length));
      } else
        e.start ? r = {
          column: e.start.column,
          line: e.start.line
        } : e.index && (r = this.positionInside(e.index)), e.end ? i = {
          column: e.end.column,
          line: e.end.line
        } : typeof e.endIndex == "number" ? i = this.positionInside(e.endIndex) : e.index && (i = this.positionInside(e.index + 1));
      return (i.line < r.line || i.line === r.line && i.column <= r.column) && (i = { column: r.column + 1, line: r.line }), { end: i, start: r };
    }
    raw(e, r) {
      return new a().raw(this, e, r);
    }
    remove() {
      return this.parent && this.parent.removeChild(this), this.parent = undefined, this;
    }
    replaceWith(...e) {
      if (this.parent) {
        let r = this, i = false;
        for (let o of e)
          o === this ? i = true : i ? (this.parent.insertAfter(r, o), r = o) : this.parent.insertBefore(r, o);
        i || this.remove();
      }
      return this;
    }
    root() {
      let e = this;
      for (;e.parent && e.parent.type !== "document"; )
        e = e.parent;
      return e;
    }
    toJSON(e, r) {
      let i = {}, o = r == null;
      r = r || /* @__PURE__ */ new Map;
      let v2 = 0;
      for (let m in this) {
        if (!Object.prototype.hasOwnProperty.call(this, m) || m === "parent" || m === "proxyCache")
          continue;
        let n = this[m];
        if (Array.isArray(n))
          i[m] = n.map((d) => typeof d == "object" && d.toJSON ? d.toJSON(null, r) : d);
        else if (typeof n == "object" && n.toJSON)
          i[m] = n.toJSON(null, r);
        else if (m === "source") {
          let d = r.get(n.input);
          d == null && (d = v2, r.set(n.input, v2), v2++), i[m] = {
            end: n.end,
            inputId: d,
            start: n.start
          };
        } else
          i[m] = n;
      }
      return o && (i.inputs = [...r.keys()].map((m) => m.toJSON())), i;
    }
    toProxy() {
      return this.proxyCache || (this.proxyCache = new Proxy(this, this.getProxyProcessor())), this.proxyCache;
    }
    toString(e = h) {
      e.stringify && (e = e.stringify);
      let r = "";
      return e(this, (i) => {
        r += i;
      }), r;
    }
    warn(e, r, i) {
      let o = { node: this };
      for (let v2 in i)
        o[v2] = i[v2];
      return e.warn(r, o);
    }
  }
  return Tr = c, c.default = c, Tr;
}
var Ar;
var la;
function ur() {
  if (la)
    return Ar;
  la = 1;
  let u = lr();

  class a extends u {
    constructor(p) {
      super(p), this.type = "comment";
    }
  }
  return Ar = a, a.default = a, Ar;
}
var Cr;
var ua;
function fr() {
  if (ua)
    return Cr;
  ua = 1;
  let u = lr();

  class a extends u {
    get variable() {
      return this.prop.startsWith("--") || this.prop[0] === "$";
    }
    constructor(p) {
      p && typeof p.value < "u" && typeof p.value != "string" && (p = { ...p, value: String(p.value) }), super(p), this.type = "decl";
    }
  }
  return Cr = a, a.default = a, Cr;
}
var Rr;
var fa;
function nt() {
  if (fa)
    return Rr;
  fa = 1;
  let u = ur(), a = fr(), h = lr(), { isClean: p, my: l } = Ci(), f, s, c, t;
  function e(o) {
    return o.map((v2) => (v2.nodes && (v2.nodes = e(v2.nodes)), delete v2.source, v2));
  }
  function r(o) {
    if (o[p] = false, o.proxyOf.nodes)
      for (let v2 of o.proxyOf.nodes)
        r(v2);
  }

  class i extends h {
    get first() {
      if (this.proxyOf.nodes)
        return this.proxyOf.nodes[0];
    }
    get last() {
      if (this.proxyOf.nodes)
        return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
    }
    append(...v2) {
      for (let m of v2) {
        let n = this.normalize(m, this.last);
        for (let d of n)
          this.proxyOf.nodes.push(d);
      }
      return this.markDirty(), this;
    }
    cleanRaws(v2) {
      if (super.cleanRaws(v2), this.nodes)
        for (let m of this.nodes)
          m.cleanRaws(v2);
    }
    each(v2) {
      if (!this.proxyOf.nodes)
        return;
      let m = this.getIterator(), n, d;
      for (;this.indexes[m] < this.proxyOf.nodes.length && (n = this.indexes[m], d = v2(this.proxyOf.nodes[n], n), d !== false); )
        this.indexes[m] += 1;
      return delete this.indexes[m], d;
    }
    every(v2) {
      return this.nodes.every(v2);
    }
    getIterator() {
      this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach += 1;
      let v2 = this.lastEach;
      return this.indexes[v2] = 0, v2;
    }
    getProxyProcessor() {
      return {
        get(v2, m) {
          return m === "proxyOf" ? v2 : v2[m] ? m === "each" || typeof m == "string" && m.startsWith("walk") ? (...n) => v2[m](...n.map((d) => typeof d == "function" ? (_, w) => d(_.toProxy(), w) : d)) : m === "every" || m === "some" ? (n) => v2[m]((d, ..._) => n(d.toProxy(), ..._)) : m === "root" ? () => v2.root().toProxy() : m === "nodes" ? v2.nodes.map((n) => n.toProxy()) : m === "first" || m === "last" ? v2[m].toProxy() : v2[m] : v2[m];
        },
        set(v2, m, n) {
          return v2[m] === n || (v2[m] = n, (m === "name" || m === "params" || m === "selector") && v2.markDirty()), true;
        }
      };
    }
    index(v2) {
      return typeof v2 == "number" ? v2 : (v2.proxyOf && (v2 = v2.proxyOf), this.proxyOf.nodes.indexOf(v2));
    }
    insertAfter(v2, m) {
      let n = this.index(v2), d = this.normalize(m, this.proxyOf.nodes[n]).reverse();
      n = this.index(v2);
      for (let w of d)
        this.proxyOf.nodes.splice(n + 1, 0, w);
      let _;
      for (let w in this.indexes)
        _ = this.indexes[w], n < _ && (this.indexes[w] = _ + d.length);
      return this.markDirty(), this;
    }
    insertBefore(v2, m) {
      let n = this.index(v2), d = n === 0 ? "prepend" : false, _ = this.normalize(m, this.proxyOf.nodes[n], d).reverse();
      n = this.index(v2);
      for (let y of _)
        this.proxyOf.nodes.splice(n, 0, y);
      let w;
      for (let y in this.indexes)
        w = this.indexes[y], n <= w && (this.indexes[y] = w + _.length);
      return this.markDirty(), this;
    }
    normalize(v2, m) {
      if (typeof v2 == "string")
        v2 = e(s(v2).nodes);
      else if (typeof v2 > "u")
        v2 = [];
      else if (Array.isArray(v2)) {
        v2 = v2.slice(0);
        for (let d of v2)
          d.parent && d.parent.removeChild(d, "ignore");
      } else if (v2.type === "root" && this.type !== "document") {
        v2 = v2.nodes.slice(0);
        for (let d of v2)
          d.parent && d.parent.removeChild(d, "ignore");
      } else if (v2.type)
        v2 = [v2];
      else if (v2.prop) {
        if (typeof v2.value > "u")
          throw new Error("Value field is missed in node creation");
        typeof v2.value != "string" && (v2.value = String(v2.value)), v2 = [new a(v2)];
      } else if (v2.selector || v2.selectors)
        v2 = [new t(v2)];
      else if (v2.name)
        v2 = [new f(v2)];
      else if (v2.text)
        v2 = [new u(v2)];
      else
        throw new Error("Unknown node type in node creation");
      return v2.map((d) => (d[l] || i.rebuild(d), d = d.proxyOf, d.parent && d.parent.removeChild(d), d[p] && r(d), d.raws || (d.raws = {}), typeof d.raws.before > "u" && m && typeof m.raws.before < "u" && (d.raws.before = m.raws.before.replace(/\S/g, "")), d.parent = this.proxyOf, d));
    }
    prepend(...v2) {
      v2 = v2.reverse();
      for (let m of v2) {
        let n = this.normalize(m, this.first, "prepend").reverse();
        for (let d of n)
          this.proxyOf.nodes.unshift(d);
        for (let d in this.indexes)
          this.indexes[d] = this.indexes[d] + n.length;
      }
      return this.markDirty(), this;
    }
    push(v2) {
      return v2.parent = this, this.proxyOf.nodes.push(v2), this;
    }
    removeAll() {
      for (let v2 of this.proxyOf.nodes)
        v2.parent = undefined;
      return this.proxyOf.nodes = [], this.markDirty(), this;
    }
    removeChild(v2) {
      v2 = this.index(v2), this.proxyOf.nodes[v2].parent = undefined, this.proxyOf.nodes.splice(v2, 1);
      let m;
      for (let n in this.indexes)
        m = this.indexes[n], m >= v2 && (this.indexes[n] = m - 1);
      return this.markDirty(), this;
    }
    replaceValues(v2, m, n) {
      return n || (n = m, m = {}), this.walkDecls((d) => {
        m.props && !m.props.includes(d.prop) || m.fast && !d.value.includes(m.fast) || (d.value = d.value.replace(v2, n));
      }), this.markDirty(), this;
    }
    some(v2) {
      return this.nodes.some(v2);
    }
    walk(v2) {
      return this.each((m, n) => {
        let d;
        try {
          d = v2(m, n);
        } catch (_) {
          throw m.addToError(_);
        }
        return d !== false && m.walk && (d = m.walk(v2)), d;
      });
    }
    walkAtRules(v2, m) {
      return m ? v2 instanceof RegExp ? this.walk((n, d) => {
        if (n.type === "atrule" && v2.test(n.name))
          return m(n, d);
      }) : this.walk((n, d) => {
        if (n.type === "atrule" && n.name === v2)
          return m(n, d);
      }) : (m = v2, this.walk((n, d) => {
        if (n.type === "atrule")
          return m(n, d);
      }));
    }
    walkComments(v2) {
      return this.walk((m, n) => {
        if (m.type === "comment")
          return v2(m, n);
      });
    }
    walkDecls(v2, m) {
      return m ? v2 instanceof RegExp ? this.walk((n, d) => {
        if (n.type === "decl" && v2.test(n.prop))
          return m(n, d);
      }) : this.walk((n, d) => {
        if (n.type === "decl" && n.prop === v2)
          return m(n, d);
      }) : (m = v2, this.walk((n, d) => {
        if (n.type === "decl")
          return m(n, d);
      }));
    }
    walkRules(v2, m) {
      return m ? v2 instanceof RegExp ? this.walk((n, d) => {
        if (n.type === "rule" && v2.test(n.selector))
          return m(n, d);
      }) : this.walk((n, d) => {
        if (n.type === "rule" && n.selector === v2)
          return m(n, d);
      }) : (m = v2, this.walk((n, d) => {
        if (n.type === "rule")
          return m(n, d);
      }));
    }
  }
  return i.registerParse = (o) => {
    s = o;
  }, i.registerRule = (o) => {
    t = o;
  }, i.registerAtRule = (o) => {
    f = o;
  }, i.registerRoot = (o) => {
    c = o;
  }, Rr = i, i.default = i, i.rebuild = (o) => {
    o.type === "atrule" ? Object.setPrototypeOf(o, f.prototype) : o.type === "rule" ? Object.setPrototypeOf(o, t.prototype) : o.type === "decl" ? Object.setPrototypeOf(o, a.prototype) : o.type === "comment" ? Object.setPrototypeOf(o, u.prototype) : o.type === "root" && Object.setPrototypeOf(o, c.prototype), o[l] = true, o.nodes && o.nodes.forEach((v2) => {
      i.rebuild(v2);
    });
  }, Rr;
}
var Ir;
var ca;
function Ri() {
  if (ca)
    return Ir;
  ca = 1;
  let u = nt();

  class a extends u {
    constructor(p) {
      super(p), this.type = "atrule";
    }
    append(...p) {
      return this.proxyOf.nodes || (this.nodes = []), super.append(...p);
    }
    prepend(...p) {
      return this.proxyOf.nodes || (this.nodes = []), super.prepend(...p);
    }
  }
  return Ir = a, a.default = a, u.registerAtRule(a), Ir;
}
var Mr;
var da;
function Ii() {
  if (da)
    return Mr;
  da = 1;
  let u = nt(), a, h;

  class p extends u {
    constructor(f) {
      super({ type: "document", ...f }), this.nodes || (this.nodes = []);
    }
    toResult(f = {}) {
      return new a(new h, this, f).stringify();
    }
  }
  return p.registerLazyResult = (l) => {
    a = l;
  }, p.registerProcessor = (l) => {
    h = l;
  }, Mr = p, p.default = p, Mr;
}
var Dr;
var pa;
function hu() {
  if (pa)
    return Dr;
  pa = 1;
  let u = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
  return Dr = { nanoid: (p = 21) => {
    let l = "", f = p | 0;
    for (;f--; )
      l += u[Math.random() * 64 | 0];
    return l;
  }, customAlphabet: (p, l = 21) => (f = l) => {
    let s = "", c = f | 0;
    for (;c--; )
      s += p[Math.random() * p.length | 0];
    return s;
  } }, Dr;
}
var qr;
var ha;
function pl() {
  if (ha)
    return qr;
  ha = 1;
  let { existsSync: u, readFileSync: a } = Ne, { dirname: h, join: p } = Ne, { SourceMapConsumer: l, SourceMapGenerator: f } = Ne;
  function s(t) {
    return Buffer ? Buffer.from(t, "base64").toString() : window.atob(t);
  }

  class c {
    constructor(e, r) {
      if (r.map === false)
        return;
      this.loadAnnotation(e), this.inline = this.startWith(this.annotation, "data:");
      let i = r.map ? r.map.prev : undefined, o = this.loadMap(r.from, i);
      !this.mapFile && r.from && (this.mapFile = r.from), this.mapFile && (this.root = h(this.mapFile)), o && (this.text = o);
    }
    consumer() {
      return this.consumerCache || (this.consumerCache = new l(this.text)), this.consumerCache;
    }
    decodeInline(e) {
      let r = /^data:application\/json;charset=utf-?8;base64,/, i = /^data:application\/json;base64,/, o = /^data:application\/json;charset=utf-?8,/, v2 = /^data:application\/json,/, m = e.match(o) || e.match(v2);
      if (m)
        return decodeURIComponent(e.substr(m[0].length));
      let n = e.match(r) || e.match(i);
      if (n)
        return s(e.substr(n[0].length));
      let d = e.match(/data:application\/json;([^,]+),/)[1];
      throw new Error("Unsupported source map encoding " + d);
    }
    getAnnotationURL(e) {
      return e.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
    }
    isMap(e) {
      return typeof e != "object" ? false : typeof e.mappings == "string" || typeof e._mappings == "string" || Array.isArray(e.sections);
    }
    loadAnnotation(e) {
      let r = e.match(/\/\*\s*# sourceMappingURL=/g);
      if (!r)
        return;
      let i = e.lastIndexOf(r.pop()), o = e.indexOf("*/", i);
      i > -1 && o > -1 && (this.annotation = this.getAnnotationURL(e.substring(i, o)));
    }
    loadFile(e) {
      if (this.root = h(e), u(e))
        return this.mapFile = e, a(e, "utf-8").toString().trim();
    }
    loadMap(e, r) {
      if (r === false)
        return false;
      if (r) {
        if (typeof r == "string")
          return r;
        if (typeof r == "function") {
          let i = r(e);
          if (i) {
            let o = this.loadFile(i);
            if (!o)
              throw new Error("Unable to load previous source map: " + i.toString());
            return o;
          }
        } else {
          if (r instanceof l)
            return f.fromSourceMap(r).toString();
          if (r instanceof f)
            return r.toString();
          if (this.isMap(r))
            return JSON.stringify(r);
          throw new Error("Unsupported previous source map format: " + r.toString());
        }
      } else {
        if (this.inline)
          return this.decodeInline(this.annotation);
        if (this.annotation) {
          let i = this.annotation;
          return e && (i = p(h(e), i)), this.loadFile(i);
        }
      }
    }
    startWith(e, r) {
      return e ? e.substr(0, r.length) === r : false;
    }
    withContent() {
      return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
    }
  }
  return qr = c, c.default = c, qr;
}
var Lr;
var va;
function cr() {
  if (va)
    return Lr;
  va = 1;
  let { nanoid: u } = /* @__PURE__ */ hu(), { isAbsolute: a, resolve: h } = Ne, { SourceMapConsumer: p, SourceMapGenerator: l } = Ne, { fileURLToPath: f, pathToFileURL: s } = Ne, c = Ai(), t = pl(), e = Ne, r = Symbol("fromOffsetCache"), i = !!(p && l), o = !!(h && a);

  class v2 {
    get from() {
      return this.file || this.id;
    }
    constructor(n, d = {}) {
      if (n === null || typeof n > "u" || typeof n == "object" && !n.toString)
        throw new Error(`PostCSS received ${n} instead of CSS string`);
      if (this.css = n.toString(), this.css[0] === "\uFEFF" || this.css[0] === "￾" ? (this.hasBOM = true, this.css = this.css.slice(1)) : this.hasBOM = false, this.document = this.css, d.document && (this.document = d.document.toString()), d.from && (!o || /^\w+:\/\//.test(d.from) || a(d.from) ? this.file = d.from : this.file = h(d.from)), o && i) {
        let _ = new t(this.css, d);
        if (_.text) {
          this.map = _;
          let w = _.consumer().file;
          !this.file && w && (this.file = this.mapResolve(w));
        }
      }
      this.file || (this.id = "<input css " + u(6) + ">"), this.map && (this.map.file = this.from);
    }
    error(n, d, _, w = {}) {
      let y, x, g;
      if (d && typeof d == "object") {
        let A = d, E = _;
        if (typeof A.offset == "number") {
          let b = this.fromOffset(A.offset);
          d = b.line, _ = b.col;
        } else
          d = A.line, _ = A.column;
        if (typeof E.offset == "number") {
          let b = this.fromOffset(E.offset);
          x = b.line, y = b.col;
        } else
          x = E.line, y = E.column;
      } else if (!_) {
        let A = this.fromOffset(d);
        d = A.line, _ = A.col;
      }
      let O = this.origin(d, _, x, y);
      return O ? g = new c(n, O.endLine === undefined ? O.line : { column: O.column, line: O.line }, O.endLine === undefined ? O.column : { column: O.endColumn, line: O.endLine }, O.source, O.file, w.plugin) : g = new c(n, x === undefined ? d : { column: _, line: d }, x === undefined ? _ : { column: y, line: x }, this.css, this.file, w.plugin), g.input = { column: _, endColumn: y, endLine: x, line: d, source: this.css }, this.file && (s && (g.input.url = s(this.file).toString()), g.input.file = this.file), g;
    }
    fromOffset(n) {
      let d, _;
      if (this[r])
        _ = this[r];
      else {
        let y = this.css.split(`
`);
        _ = new Array(y.length);
        let x = 0;
        for (let g = 0, O = y.length;g < O; g++)
          _[g] = x, x += y[g].length + 1;
        this[r] = _;
      }
      d = _[_.length - 1];
      let w = 0;
      if (n >= d)
        w = _.length - 1;
      else {
        let y = _.length - 2, x;
        for (;w < y; )
          if (x = w + (y - w >> 1), n < _[x])
            y = x - 1;
          else if (n >= _[x + 1])
            w = x + 1;
          else {
            w = x;
            break;
          }
      }
      return {
        col: n - _[w] + 1,
        line: w + 1
      };
    }
    mapResolve(n) {
      return /^\w+:\/\//.test(n) ? n : h(this.map.consumer().sourceRoot || this.map.root || ".", n);
    }
    origin(n, d, _, w) {
      if (!this.map)
        return false;
      let y = this.map.consumer(), x = y.originalPositionFor({ column: d, line: n });
      if (!x.source)
        return false;
      let g;
      typeof _ == "number" && (g = y.originalPositionFor({ column: w, line: _ }));
      let O;
      a(x.source) ? O = s(x.source) : O = new URL(x.source, this.map.consumer().sourceRoot || s(this.map.mapFile));
      let A = {
        column: x.column,
        endColumn: g && g.column,
        endLine: g && g.line,
        line: x.line,
        url: O.toString()
      };
      if (O.protocol === "file:")
        if (f)
          A.file = f(O);
        else
          throw new Error("file: protocol is not available in this PostCSS build");
      let E = y.sourceContentFor(x.source);
      return E && (A.source = E), A;
    }
    toJSON() {
      let n = {};
      for (let d of ["hasBOM", "css", "file", "id"])
        this[d] != null && (n[d] = this[d]);
      return this.map && (n.map = { ...this.map }, n.map.consumerCache && (n.map.consumerCache = undefined)), n;
    }
  }
  return Lr = v2, v2.default = v2, e && e.registerInput && e.registerInput(v2), Lr;
}
var Nr;
var ga;
function lt() {
  if (ga)
    return Nr;
  ga = 1;
  let u = nt(), a, h;

  class p extends u {
    constructor(f) {
      super(f), this.type = "root", this.nodes || (this.nodes = []);
    }
    normalize(f, s, c) {
      let t = super.normalize(f);
      if (s) {
        if (c === "prepend")
          this.nodes.length > 1 ? s.raws.before = this.nodes[1].raws.before : delete s.raws.before;
        else if (this.first !== s)
          for (let e of t)
            e.raws.before = s.raws.before;
      }
      return t;
    }
    removeChild(f, s) {
      let c = this.index(f);
      return !s && c === 0 && this.nodes.length > 1 && (this.nodes[1].raws.before = this.nodes[c].raws.before), super.removeChild(f);
    }
    toResult(f = {}) {
      return new a(new h, this, f).stringify();
    }
  }
  return p.registerLazyResult = (l) => {
    a = l;
  }, p.registerProcessor = (l) => {
    h = l;
  }, Nr = p, p.default = p, u.registerRoot(p), Nr;
}
var Fr;
var ma;
function hl() {
  if (ma)
    return Fr;
  ma = 1;
  let u = {
    comma(a) {
      return u.split(a, [","], true);
    },
    space(a) {
      let h = [" ", `
`, "\t"];
      return u.split(a, h);
    },
    split(a, h, p) {
      let l = [], f = "", s = false, c = 0, t = false, e = "", r = false;
      for (let i of a)
        r ? r = false : i === "\\" ? r = true : t ? i === e && (t = false) : i === '"' || i === "'" ? (t = true, e = i) : i === "(" ? c += 1 : i === ")" ? c > 0 && (c -= 1) : c === 0 && h.includes(i) && (s = true), s ? (f !== "" && l.push(f.trim()), f = "", s = false) : f += i;
      return (p || f !== "") && l.push(f.trim()), l;
    }
  };
  return Fr = u, u.default = u, Fr;
}
var $r;
var ya;
function Mi() {
  if (ya)
    return $r;
  ya = 1;
  let u = nt(), a = hl();

  class h extends u {
    get selectors() {
      return a.comma(this.selector);
    }
    set selectors(l) {
      let f = this.selector ? this.selector.match(/,\s*/) : null, s = f ? f[0] : "," + this.raw("between", "beforeOpen");
      this.selector = l.join(s);
    }
    constructor(l) {
      super(l), this.type = "rule", this.nodes || (this.nodes = []);
    }
  }
  return $r = h, h.default = h, u.registerRule(h), $r;
}
var Ur;
var wa;
function vu() {
  if (wa)
    return Ur;
  wa = 1;
  let u = Ri(), a = ur(), h = fr(), p = cr(), l = pl(), f = lt(), s = Mi();
  function c(t, e) {
    if (Array.isArray(t))
      return t.map((o) => c(o));
    let { inputs: r, ...i } = t;
    if (r) {
      e = [];
      for (let o of r) {
        let v2 = { ...o, __proto__: p.prototype };
        v2.map && (v2.map = {
          ...v2.map,
          __proto__: l.prototype
        }), e.push(v2);
      }
    }
    if (i.nodes && (i.nodes = t.nodes.map((o) => c(o, e))), i.source) {
      let { inputId: o, ...v2 } = i.source;
      i.source = v2, o != null && (i.source.input = e[o]);
    }
    if (i.type === "root")
      return new f(i);
    if (i.type === "decl")
      return new h(i);
    if (i.type === "rule")
      return new s(i);
    if (i.type === "comment")
      return new a(i);
    if (i.type === "atrule")
      return new u(i);
    throw new Error("Unknown node type: " + t.type);
  }
  return Ur = c, c.default = c, Ur;
}
var zr;
var ba;
function vl() {
  if (ba)
    return zr;
  ba = 1;
  let { dirname: u, relative: a, resolve: h, sep: p } = Ne, { SourceMapConsumer: l, SourceMapGenerator: f } = Ne, { pathToFileURL: s } = Ne, c = cr(), t = !!(l && f), e = !!(u && h && a && p);

  class r {
    constructor(o, v2, m, n) {
      this.stringify = o, this.mapOpts = m.map || {}, this.root = v2, this.opts = m, this.css = n, this.originalCSS = n, this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute, this.memoizedFileURLs = /* @__PURE__ */ new Map, this.memoizedPaths = /* @__PURE__ */ new Map, this.memoizedURLs = /* @__PURE__ */ new Map;
    }
    addAnnotation() {
      let o;
      this.isInline() ? o = "data:application/json;base64," + this.toBase64(this.map.toString()) : typeof this.mapOpts.annotation == "string" ? o = this.mapOpts.annotation : typeof this.mapOpts.annotation == "function" ? o = this.mapOpts.annotation(this.opts.to, this.root) : o = this.outputFile() + ".map";
      let v2 = `
`;
      this.css.includes(`\r
`) && (v2 = `\r
`), this.css += v2 + "/*# sourceMappingURL=" + o + " */";
    }
    applyPrevMaps() {
      for (let o of this.previous()) {
        let v2 = this.toUrl(this.path(o.file)), m = o.root || u(o.file), n;
        this.mapOpts.sourcesContent === false ? (n = new l(o.text), n.sourcesContent && (n.sourcesContent = null)) : n = o.consumer(), this.map.applySourceMap(n, v2, this.toUrl(this.path(m)));
      }
    }
    clearAnnotation() {
      if (this.mapOpts.annotation !== false)
        if (this.root) {
          let o;
          for (let v2 = this.root.nodes.length - 1;v2 >= 0; v2--)
            o = this.root.nodes[v2], o.type === "comment" && o.text.startsWith("# sourceMappingURL=") && this.root.removeChild(v2);
        } else
          this.css && (this.css = this.css.replace(/\n*\/\*#[\S\s]*?\*\/$/gm, ""));
    }
    generate() {
      if (this.clearAnnotation(), e && t && this.isMap())
        return this.generateMap();
      {
        let o = "";
        return this.stringify(this.root, (v2) => {
          o += v2;
        }), [o];
      }
    }
    generateMap() {
      if (this.root)
        this.generateString();
      else if (this.previous().length === 1) {
        let o = this.previous()[0].consumer();
        o.file = this.outputFile(), this.map = f.fromSourceMap(o, {
          ignoreInvalidMapping: true
        });
      } else
        this.map = new f({
          file: this.outputFile(),
          ignoreInvalidMapping: true
        }), this.map.addMapping({
          generated: { column: 0, line: 1 },
          original: { column: 0, line: 1 },
          source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
        });
      return this.isSourcesContent() && this.setSourcesContent(), this.root && this.previous().length > 0 && this.applyPrevMaps(), this.isAnnotation() && this.addAnnotation(), this.isInline() ? [this.css] : [this.css, this.map];
    }
    generateString() {
      this.css = "", this.map = new f({
        file: this.outputFile(),
        ignoreInvalidMapping: true
      });
      let o = 1, v2 = 1, m = "<no source>", n = {
        generated: { column: 0, line: 0 },
        original: { column: 0, line: 0 },
        source: ""
      }, d, _;
      this.stringify(this.root, (w, y, x) => {
        if (this.css += w, y && x !== "end" && (n.generated.line = o, n.generated.column = v2 - 1, y.source && y.source.start ? (n.source = this.sourcePath(y), n.original.line = y.source.start.line, n.original.column = y.source.start.column - 1, this.map.addMapping(n)) : (n.source = m, n.original.line = 1, n.original.column = 0, this.map.addMapping(n))), _ = w.match(/\n/g), _ ? (o += _.length, d = w.lastIndexOf(`
`), v2 = w.length - d) : v2 += w.length, y && x !== "start") {
          let g = y.parent || { raws: {} };
          (!(y.type === "decl" || y.type === "atrule" && !y.nodes) || y !== g.last || g.raws.semicolon) && (y.source && y.source.end ? (n.source = this.sourcePath(y), n.original.line = y.source.end.line, n.original.column = y.source.end.column - 1, n.generated.line = o, n.generated.column = v2 - 2, this.map.addMapping(n)) : (n.source = m, n.original.line = 1, n.original.column = 0, n.generated.line = o, n.generated.column = v2 - 1, this.map.addMapping(n)));
        }
      });
    }
    isAnnotation() {
      return this.isInline() ? true : typeof this.mapOpts.annotation < "u" ? this.mapOpts.annotation : this.previous().length ? this.previous().some((o) => o.annotation) : true;
    }
    isInline() {
      if (typeof this.mapOpts.inline < "u")
        return this.mapOpts.inline;
      let o = this.mapOpts.annotation;
      return typeof o < "u" && o !== true ? false : this.previous().length ? this.previous().some((v2) => v2.inline) : true;
    }
    isMap() {
      return typeof this.opts.map < "u" ? !!this.opts.map : this.previous().length > 0;
    }
    isSourcesContent() {
      return typeof this.mapOpts.sourcesContent < "u" ? this.mapOpts.sourcesContent : this.previous().length ? this.previous().some((o) => o.withContent()) : true;
    }
    outputFile() {
      return this.opts.to ? this.path(this.opts.to) : this.opts.from ? this.path(this.opts.from) : "to.css";
    }
    path(o) {
      if (this.mapOpts.absolute || o.charCodeAt(0) === 60 || /^\w+:\/\//.test(o))
        return o;
      let v2 = this.memoizedPaths.get(o);
      if (v2)
        return v2;
      let m = this.opts.to ? u(this.opts.to) : ".";
      typeof this.mapOpts.annotation == "string" && (m = u(h(m, this.mapOpts.annotation)));
      let n = a(m, o);
      return this.memoizedPaths.set(o, n), n;
    }
    previous() {
      if (!this.previousMaps)
        if (this.previousMaps = [], this.root)
          this.root.walk((o) => {
            if (o.source && o.source.input.map) {
              let v2 = o.source.input.map;
              this.previousMaps.includes(v2) || this.previousMaps.push(v2);
            }
          });
        else {
          let o = new c(this.originalCSS, this.opts);
          o.map && this.previousMaps.push(o.map);
        }
      return this.previousMaps;
    }
    setSourcesContent() {
      let o = {};
      if (this.root)
        this.root.walk((v2) => {
          if (v2.source) {
            let m = v2.source.input.from;
            if (m && !o[m]) {
              o[m] = true;
              let n = this.usesFileUrls ? this.toFileUrl(m) : this.toUrl(this.path(m));
              this.map.setSourceContent(n, v2.source.input.css);
            }
          }
        });
      else if (this.css) {
        let v2 = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
        this.map.setSourceContent(v2, this.css);
      }
    }
    sourcePath(o) {
      return this.mapOpts.from ? this.toUrl(this.mapOpts.from) : this.usesFileUrls ? this.toFileUrl(o.source.input.from) : this.toUrl(this.path(o.source.input.from));
    }
    toBase64(o) {
      return Buffer ? Buffer.from(o).toString("base64") : window.btoa(unescape(encodeURIComponent(o)));
    }
    toFileUrl(o) {
      let v2 = this.memoizedFileURLs.get(o);
      if (v2)
        return v2;
      if (s) {
        let m = s(o).toString();
        return this.memoizedFileURLs.set(o, m), m;
      } else
        throw new Error("`map.absolute` option is not available in this PostCSS build");
    }
    toUrl(o) {
      let v2 = this.memoizedURLs.get(o);
      if (v2)
        return v2;
      p === "\\" && (o = o.replace(/\\/g, "/"));
      let m = encodeURI(o).replace(/[#?]/g, encodeURIComponent);
      return this.memoizedURLs.set(o, m), m;
    }
  }
  return zr = r, zr;
}
var Wr;
var _a;
function gu() {
  if (_a)
    return Wr;
  _a = 1;
  const u = 39, a = 34, h = 92, p = 47, l = 10, f = 32, s = 12, c = 9, t = 13, e = 91, r = 93, i = 40, o = 41, v2 = 123, m = 125, n = 59, d = 42, _ = 58, w = 64, y = /[\t\n\f\r "#'()/;[\\\]{}]/g, x = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g, g = /.[\r\n"'(/\\]/, O = /[\da-f]/i;
  return Wr = function(E, b = {}) {
    let k = E.css.valueOf(), q = b.ignoreErrors, M, W, S, P, C, R, $, B, z, L, F = k.length, D = 0, I = [], N = [];
    function J() {
      return D;
    }
    function T(V) {
      throw E.error("Unclosed " + V, D);
    }
    function U() {
      return N.length === 0 && D >= F;
    }
    function j(V) {
      if (N.length)
        return N.pop();
      if (D >= F)
        return;
      let K = V ? V.ignoreUnclosed : false;
      switch (M = k.charCodeAt(D), M) {
        case l:
        case f:
        case c:
        case t:
        case s: {
          P = D;
          do
            P += 1, M = k.charCodeAt(P);
          while (M === f || M === l || M === c || M === t || M === s);
          R = ["space", k.slice(D, P)], D = P - 1;
          break;
        }
        case e:
        case r:
        case v2:
        case m:
        case _:
        case n:
        case o: {
          let X = String.fromCharCode(M);
          R = [X, X, D];
          break;
        }
        case i: {
          if (L = I.length ? I.pop()[1] : "", z = k.charCodeAt(D + 1), L === "url" && z !== u && z !== a && z !== f && z !== l && z !== c && z !== s && z !== t) {
            P = D;
            do {
              if ($ = false, P = k.indexOf(")", P + 1), P === -1)
                if (q || K) {
                  P = D;
                  break;
                } else
                  T("bracket");
              for (B = P;k.charCodeAt(B - 1) === h; )
                B -= 1, $ = !$;
            } while ($);
            R = ["brackets", k.slice(D, P + 1), D, P], D = P;
          } else
            P = k.indexOf(")", D + 1), W = k.slice(D, P + 1), P === -1 || g.test(W) ? R = ["(", "(", D] : (R = ["brackets", W, D, P], D = P);
          break;
        }
        case u:
        case a: {
          C = M === u ? "'" : '"', P = D;
          do {
            if ($ = false, P = k.indexOf(C, P + 1), P === -1)
              if (q || K) {
                P = D + 1;
                break;
              } else
                T("string");
            for (B = P;k.charCodeAt(B - 1) === h; )
              B -= 1, $ = !$;
          } while ($);
          R = ["string", k.slice(D, P + 1), D, P], D = P;
          break;
        }
        case w: {
          y.lastIndex = D + 1, y.test(k), y.lastIndex === 0 ? P = k.length - 1 : P = y.lastIndex - 2, R = ["at-word", k.slice(D, P + 1), D, P], D = P;
          break;
        }
        case h: {
          for (P = D, S = true;k.charCodeAt(P + 1) === h; )
            P += 1, S = !S;
          if (M = k.charCodeAt(P + 1), S && M !== p && M !== f && M !== l && M !== c && M !== t && M !== s && (P += 1, O.test(k.charAt(P)))) {
            for (;O.test(k.charAt(P + 1)); )
              P += 1;
            k.charCodeAt(P + 1) === f && (P += 1);
          }
          R = ["word", k.slice(D, P + 1), D, P], D = P;
          break;
        }
        default: {
          M === p && k.charCodeAt(D + 1) === d ? (P = k.indexOf("*/", D + 2) + 1, P === 0 && (q || K ? P = k.length : T("comment")), R = ["comment", k.slice(D, P + 1), D, P], D = P) : (x.lastIndex = D + 1, x.test(k), x.lastIndex === 0 ? P = k.length - 1 : P = x.lastIndex - 2, R = ["word", k.slice(D, P + 1), D, P], I.push(R), D = P);
          break;
        }
      }
      return D++, R;
    }
    function H(V) {
      N.push(V);
    }
    return {
      back: H,
      endOfFile: U,
      nextToken: j,
      position: J
    };
  }, Wr;
}
var Vr;
var Sa;
function mu() {
  if (Sa)
    return Vr;
  Sa = 1;
  let u = Ri(), a = ur(), h = fr(), p = lt(), l = Mi(), f = gu();
  const s = {
    empty: true,
    space: true
  };
  function c(e) {
    for (let r = e.length - 1;r >= 0; r--) {
      let i = e[r], o = i[3] || i[2];
      if (o)
        return o;
    }
  }

  class t {
    constructor(r) {
      this.input = r, this.root = new p, this.current = this.root, this.spaces = "", this.semicolon = false, this.createTokenizer(), this.root.source = { input: r, start: { column: 1, line: 1, offset: 0 } };
    }
    atrule(r) {
      let i = new u;
      i.name = r[1].slice(1), i.name === "" && this.unnamedAtrule(i, r), this.init(i, r[2]);
      let o, v2, m, n = false, d = false, _ = [], w = [];
      for (;!this.tokenizer.endOfFile(); ) {
        if (r = this.tokenizer.nextToken(), o = r[0], o === "(" || o === "[" ? w.push(o === "(" ? ")" : "]") : o === "{" && w.length > 0 ? w.push("}") : o === w[w.length - 1] && w.pop(), w.length === 0)
          if (o === ";") {
            i.source.end = this.getPosition(r[2]), i.source.end.offset++, this.semicolon = true;
            break;
          } else if (o === "{") {
            d = true;
            break;
          } else if (o === "}") {
            if (_.length > 0) {
              for (m = _.length - 1, v2 = _[m];v2 && v2[0] === "space"; )
                v2 = _[--m];
              v2 && (i.source.end = this.getPosition(v2[3] || v2[2]), i.source.end.offset++);
            }
            this.end(r);
            break;
          } else
            _.push(r);
        else
          _.push(r);
        if (this.tokenizer.endOfFile()) {
          n = true;
          break;
        }
      }
      i.raws.between = this.spacesAndCommentsFromEnd(_), _.length ? (i.raws.afterName = this.spacesAndCommentsFromStart(_), this.raw(i, "params", _), n && (r = _[_.length - 1], i.source.end = this.getPosition(r[3] || r[2]), i.source.end.offset++, this.spaces = i.raws.between, i.raws.between = "")) : (i.raws.afterName = "", i.params = ""), d && (i.nodes = [], this.current = i);
    }
    checkMissedSemicolon(r) {
      let i = this.colon(r);
      if (i === false)
        return;
      let o = 0, v2;
      for (let m = i - 1;m >= 0 && (v2 = r[m], !(v2[0] !== "space" && (o += 1, o === 2))); m--)
        ;
      throw this.input.error("Missed semicolon", v2[0] === "word" ? v2[3] + 1 : v2[2]);
    }
    colon(r) {
      let i = 0, o, v2, m;
      for (let [n, d] of r.entries()) {
        if (v2 = d, m = v2[0], m === "(" && (i += 1), m === ")" && (i -= 1), i === 0 && m === ":")
          if (!o)
            this.doubleColon(v2);
          else {
            if (o[0] === "word" && o[1] === "progid")
              continue;
            return n;
          }
        o = v2;
      }
      return false;
    }
    comment(r) {
      let i = new a;
      this.init(i, r[2]), i.source.end = this.getPosition(r[3] || r[2]), i.source.end.offset++;
      let o = r[1].slice(2, -2);
      if (/^\s*$/.test(o))
        i.text = "", i.raws.left = o, i.raws.right = "";
      else {
        let v2 = o.match(/^(\s*)([^]*\S)(\s*)$/);
        i.text = v2[2], i.raws.left = v2[1], i.raws.right = v2[3];
      }
    }
    createTokenizer() {
      this.tokenizer = f(this.input);
    }
    decl(r, i) {
      let o = new h;
      this.init(o, r[0][2]);
      let v2 = r[r.length - 1];
      for (v2[0] === ";" && (this.semicolon = true, r.pop()), o.source.end = this.getPosition(v2[3] || v2[2] || c(r)), o.source.end.offset++;r[0][0] !== "word"; )
        r.length === 1 && this.unknownWord(r), o.raws.before += r.shift()[1];
      for (o.source.start = this.getPosition(r[0][2]), o.prop = "";r.length; ) {
        let w = r[0][0];
        if (w === ":" || w === "space" || w === "comment")
          break;
        o.prop += r.shift()[1];
      }
      o.raws.between = "";
      let m;
      for (;r.length; )
        if (m = r.shift(), m[0] === ":") {
          o.raws.between += m[1];
          break;
        } else
          m[0] === "word" && /\w/.test(m[1]) && this.unknownWord([m]), o.raws.between += m[1];
      (o.prop[0] === "_" || o.prop[0] === "*") && (o.raws.before += o.prop[0], o.prop = o.prop.slice(1));
      let n = [], d;
      for (;r.length && (d = r[0][0], !(d !== "space" && d !== "comment")); )
        n.push(r.shift());
      this.precheckMissedSemicolon(r);
      for (let w = r.length - 1;w >= 0; w--) {
        if (m = r[w], m[1].toLowerCase() === "!important") {
          o.important = true;
          let y = this.stringFrom(r, w);
          y = this.spacesFromEnd(r) + y, y !== " !important" && (o.raws.important = y);
          break;
        } else if (m[1].toLowerCase() === "important") {
          let y = r.slice(0), x = "";
          for (let g = w;g > 0; g--) {
            let O = y[g][0];
            if (x.trim().startsWith("!") && O !== "space")
              break;
            x = y.pop()[1] + x;
          }
          x.trim().startsWith("!") && (o.important = true, o.raws.important = x, r = y);
        }
        if (m[0] !== "space" && m[0] !== "comment")
          break;
      }
      r.some((w) => w[0] !== "space" && w[0] !== "comment") && (o.raws.between += n.map((w) => w[1]).join(""), n = []), this.raw(o, "value", n.concat(r), i), o.value.includes(":") && !i && this.checkMissedSemicolon(r);
    }
    doubleColon(r) {
      throw this.input.error("Double colon", { offset: r[2] }, { offset: r[2] + r[1].length });
    }
    emptyRule(r) {
      let i = new l;
      this.init(i, r[2]), i.selector = "", i.raws.between = "", this.current = i;
    }
    end(r) {
      this.current.nodes && this.current.nodes.length && (this.current.raws.semicolon = this.semicolon), this.semicolon = false, this.current.raws.after = (this.current.raws.after || "") + this.spaces, this.spaces = "", this.current.parent ? (this.current.source.end = this.getPosition(r[2]), this.current.source.end.offset++, this.current = this.current.parent) : this.unexpectedClose(r);
    }
    endFile() {
      this.current.parent && this.unclosedBlock(), this.current.nodes && this.current.nodes.length && (this.current.raws.semicolon = this.semicolon), this.current.raws.after = (this.current.raws.after || "") + this.spaces, this.root.source.end = this.getPosition(this.tokenizer.position());
    }
    freeSemicolon(r) {
      if (this.spaces += r[1], this.current.nodes) {
        let i = this.current.nodes[this.current.nodes.length - 1];
        i && i.type === "rule" && !i.raws.ownSemicolon && (i.raws.ownSemicolon = this.spaces, this.spaces = "", i.source.end = this.getPosition(r[2]), i.source.end.offset += i.raws.ownSemicolon.length);
      }
    }
    getPosition(r) {
      let i = this.input.fromOffset(r);
      return {
        column: i.col,
        line: i.line,
        offset: r
      };
    }
    init(r, i) {
      this.current.push(r), r.source = {
        input: this.input,
        start: this.getPosition(i)
      }, r.raws.before = this.spaces, this.spaces = "", r.type !== "comment" && (this.semicolon = false);
    }
    other(r) {
      let i = false, o = null, v2 = false, m = null, n = [], d = r[1].startsWith("--"), _ = [], w = r;
      for (;w; ) {
        if (o = w[0], _.push(w), o === "(" || o === "[")
          m || (m = w), n.push(o === "(" ? ")" : "]");
        else if (d && v2 && o === "{")
          m || (m = w), n.push("}");
        else if (n.length === 0)
          if (o === ";")
            if (v2) {
              this.decl(_, d);
              return;
            } else
              break;
          else if (o === "{") {
            this.rule(_);
            return;
          } else if (o === "}") {
            this.tokenizer.back(_.pop()), i = true;
            break;
          } else
            o === ":" && (v2 = true);
        else
          o === n[n.length - 1] && (n.pop(), n.length === 0 && (m = null));
        w = this.tokenizer.nextToken();
      }
      if (this.tokenizer.endOfFile() && (i = true), n.length > 0 && this.unclosedBracket(m), i && v2) {
        if (!d)
          for (;_.length && (w = _[_.length - 1][0], !(w !== "space" && w !== "comment")); )
            this.tokenizer.back(_.pop());
        this.decl(_, d);
      } else
        this.unknownWord(_);
    }
    parse() {
      let r;
      for (;!this.tokenizer.endOfFile(); )
        switch (r = this.tokenizer.nextToken(), r[0]) {
          case "space":
            this.spaces += r[1];
            break;
          case ";":
            this.freeSemicolon(r);
            break;
          case "}":
            this.end(r);
            break;
          case "comment":
            this.comment(r);
            break;
          case "at-word":
            this.atrule(r);
            break;
          case "{":
            this.emptyRule(r);
            break;
          default:
            this.other(r);
            break;
        }
      this.endFile();
    }
    precheckMissedSemicolon() {}
    raw(r, i, o, v2) {
      let m, n, d = o.length, _ = "", w = true, y, x;
      for (let g = 0;g < d; g += 1)
        m = o[g], n = m[0], n === "space" && g === d - 1 && !v2 ? w = false : n === "comment" ? (x = o[g - 1] ? o[g - 1][0] : "empty", y = o[g + 1] ? o[g + 1][0] : "empty", !s[x] && !s[y] ? _.slice(-1) === "," ? w = false : _ += m[1] : w = false) : _ += m[1];
      if (!w) {
        let g = o.reduce((O, A) => O + A[1], "");
        r.raws[i] = { raw: g, value: _ };
      }
      r[i] = _;
    }
    rule(r) {
      r.pop();
      let i = new l;
      this.init(i, r[0][2]), i.raws.between = this.spacesAndCommentsFromEnd(r), this.raw(i, "selector", r), this.current = i;
    }
    spacesAndCommentsFromEnd(r) {
      let i, o = "";
      for (;r.length && (i = r[r.length - 1][0], !(i !== "space" && i !== "comment")); )
        o = r.pop()[1] + o;
      return o;
    }
    spacesAndCommentsFromStart(r) {
      let i, o = "";
      for (;r.length && (i = r[0][0], !(i !== "space" && i !== "comment")); )
        o += r.shift()[1];
      return o;
    }
    spacesFromEnd(r) {
      let i, o = "";
      for (;r.length && (i = r[r.length - 1][0], i === "space"); )
        o = r.pop()[1] + o;
      return o;
    }
    stringFrom(r, i) {
      let o = "";
      for (let v2 = i;v2 < r.length; v2++)
        o += r[v2][1];
      return r.splice(i, r.length - i), o;
    }
    unclosedBlock() {
      let r = this.current.source.start;
      throw this.input.error("Unclosed block", r.line, r.column);
    }
    unclosedBracket(r) {
      throw this.input.error("Unclosed bracket", { offset: r[2] }, { offset: r[2] + 1 });
    }
    unexpectedClose(r) {
      throw this.input.error("Unexpected }", { offset: r[2] }, { offset: r[2] + 1 });
    }
    unknownWord(r) {
      throw this.input.error("Unknown word " + r[0][1], { offset: r[0][2] }, { offset: r[0][2] + r[0][1].length });
    }
    unnamedAtrule(r, i) {
      throw this.input.error("At-rule without name", { offset: i[2] }, { offset: i[2] + i[1].length });
    }
  }
  return Vr = t, Vr;
}
var jr;
var xa;
function Di() {
  if (xa)
    return jr;
  xa = 1;
  let u = nt(), a = cr(), h = mu();
  function p(l, f) {
    let s = new a(l, f), c = new h(s);
    try {
      c.parse();
    } catch (t) {
      throw false, t;
    }
    return c.root;
  }
  return jr = p, p.default = p, u.registerParse(p), jr;
}
var Br;
var Oa;
function gl() {
  if (Oa)
    return Br;
  Oa = 1;

  class u {
    constructor(h, p = {}) {
      if (this.type = "warning", this.text = h, p.node && p.node.source) {
        let l = p.node.rangeBy(p);
        this.line = l.start.line, this.column = l.start.column, this.endLine = l.end.line, this.endColumn = l.end.column;
      }
      for (let l in p)
        this[l] = p[l];
    }
    toString() {
      return this.node ? this.node.error(this.text, {
        index: this.index,
        plugin: this.plugin,
        word: this.word
      }).message : this.plugin ? this.plugin + ": " + this.text : this.text;
    }
  }
  return Br = u, u.default = u, Br;
}
var Gr;
var ka;
function qi() {
  if (ka)
    return Gr;
  ka = 1;
  let u = gl();

  class a {
    get content() {
      return this.css;
    }
    constructor(p, l, f) {
      this.processor = p, this.messages = [], this.root = l, this.opts = f, this.css = undefined, this.map = undefined;
    }
    toString() {
      return this.css;
    }
    warn(p, l = {}) {
      l.plugin || this.lastPlugin && this.lastPlugin.postcssPlugin && (l.plugin = this.lastPlugin.postcssPlugin);
      let f = new u(p, l);
      return this.messages.push(f), f;
    }
    warnings() {
      return this.messages.filter((p) => p.type === "warning");
    }
  }
  return Gr = a, a.default = a, Gr;
}
var Yr;
var Pa;
function ml() {
  if (Pa)
    return Yr;
  Pa = 1;
  let u = {};
  return Yr = function(h) {
    u[h] || (u[h] = true, typeof console < "u" && console.warn && console.warn(h));
  }, Yr;
}
var Qr;
var Ea;
function yl() {
  if (Ea)
    return Qr;
  Ea = 1;
  let u = nt(), a = Ii(), h = vl(), p = Di(), l = qi(), f = lt(), s = or(), { isClean: c, my: t } = Ci(), e = ml();
  const r = {
    atrule: "AtRule",
    comment: "Comment",
    decl: "Declaration",
    document: "Document",
    root: "Root",
    rule: "Rule"
  }, i = {
    AtRule: true,
    AtRuleExit: true,
    Comment: true,
    CommentExit: true,
    Declaration: true,
    DeclarationExit: true,
    Document: true,
    DocumentExit: true,
    Once: true,
    OnceExit: true,
    postcssPlugin: true,
    prepare: true,
    Root: true,
    RootExit: true,
    Rule: true,
    RuleExit: true
  }, o = {
    Once: true,
    postcssPlugin: true,
    prepare: true
  }, v2 = 0;
  function m(x) {
    return typeof x == "object" && typeof x.then == "function";
  }
  function n(x) {
    let g = false, O = r[x.type];
    return x.type === "decl" ? g = x.prop.toLowerCase() : x.type === "atrule" && (g = x.name.toLowerCase()), g && x.append ? [
      O,
      O + "-" + g,
      v2,
      O + "Exit",
      O + "Exit-" + g
    ] : g ? [O, O + "-" + g, O + "Exit", O + "Exit-" + g] : x.append ? [O, v2, O + "Exit"] : [O, O + "Exit"];
  }
  function d(x) {
    let g;
    return x.type === "document" ? g = ["Document", v2, "DocumentExit"] : x.type === "root" ? g = ["Root", v2, "RootExit"] : g = n(x), {
      eventIndex: 0,
      events: g,
      iterator: 0,
      node: x,
      visitorIndex: 0,
      visitors: []
    };
  }
  function _(x) {
    return x[c] = false, x.nodes && x.nodes.forEach((g) => _(g)), x;
  }
  let w = {};

  class y {
    get content() {
      return this.stringify().content;
    }
    get css() {
      return this.stringify().css;
    }
    get map() {
      return this.stringify().map;
    }
    get messages() {
      return this.sync().messages;
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      return this.sync().root;
    }
    get [Symbol.toStringTag]() {
      return "LazyResult";
    }
    constructor(g, O, A) {
      this.stringified = false, this.processed = false;
      let E;
      if (typeof O == "object" && O !== null && (O.type === "root" || O.type === "document"))
        E = _(O);
      else if (O instanceof y || O instanceof l)
        E = _(O.root), O.map && (typeof A.map > "u" && (A.map = {}), A.map.inline || (A.map.inline = false), A.map.prev = O.map);
      else {
        let b = p;
        A.syntax && (b = A.syntax.parse), A.parser && (b = A.parser), b.parse && (b = b.parse);
        try {
          E = b(O, A);
        } catch (k) {
          this.processed = true, this.error = k;
        }
        E && !E[t] && u.rebuild(E);
      }
      this.result = new l(g, E, A), this.helpers = { ...w, postcss: w, result: this.result }, this.plugins = this.processor.plugins.map((b) => typeof b == "object" && b.prepare ? { ...b, ...b.prepare(this.result) } : b);
    }
    async() {
      return this.error ? Promise.reject(this.error) : this.processed ? Promise.resolve(this.result) : (this.processing || (this.processing = this.runAsync()), this.processing);
    }
    catch(g) {
      return this.async().catch(g);
    }
    finally(g) {
      return this.async().then(g, g);
    }
    getAsyncError() {
      throw new Error("Use process(css).then(cb) to work with async plugins");
    }
    handleError(g, O) {
      let A = this.result.lastPlugin;
      try {
        if (O && O.addToError(g), this.error = g, g.name === "CssSyntaxError" && !g.plugin)
          g.plugin = A.postcssPlugin, g.setMessage();
        else if (A.postcssVersion && false) {}
      } catch (E) {
        console && console.error && console.error(E);
      }
      return g;
    }
    prepareVisitors() {
      this.listeners = {};
      let g = (O, A, E) => {
        this.listeners[A] || (this.listeners[A] = []), this.listeners[A].push([O, E]);
      };
      for (let O of this.plugins)
        if (typeof O == "object")
          for (let A in O) {
            if (!i[A] && /^[A-Z]/.test(A))
              throw new Error(`Unknown event ${A} in ${O.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`);
            if (!o[A])
              if (typeof O[A] == "object")
                for (let E in O[A])
                  E === "*" ? g(O, A, O[A][E]) : g(O, A + "-" + E.toLowerCase(), O[A][E]);
              else
                typeof O[A] == "function" && g(O, A, O[A]);
          }
      this.hasListener = Object.keys(this.listeners).length > 0;
    }
    async runAsync() {
      this.plugin = 0;
      for (let g = 0;g < this.plugins.length; g++) {
        let O = this.plugins[g], A = this.runOnRoot(O);
        if (m(A))
          try {
            await A;
          } catch (E) {
            throw this.handleError(E);
          }
      }
      if (this.prepareVisitors(), this.hasListener) {
        let g = this.result.root;
        for (;!g[c]; ) {
          g[c] = true;
          let O = [d(g)];
          for (;O.length > 0; ) {
            let A = this.visitTick(O);
            if (m(A))
              try {
                await A;
              } catch (E) {
                let b = O[O.length - 1].node;
                throw this.handleError(E, b);
              }
          }
        }
        if (this.listeners.OnceExit)
          for (let [O, A] of this.listeners.OnceExit) {
            this.result.lastPlugin = O;
            try {
              if (g.type === "document") {
                let E = g.nodes.map((b) => A(b, this.helpers));
                await Promise.all(E);
              } else
                await A(g, this.helpers);
            } catch (E) {
              throw this.handleError(E);
            }
          }
      }
      return this.processed = true, this.stringify();
    }
    runOnRoot(g) {
      this.result.lastPlugin = g;
      try {
        if (typeof g == "object" && g.Once) {
          if (this.result.root.type === "document") {
            let O = this.result.root.nodes.map((A) => g.Once(A, this.helpers));
            return m(O[0]) ? Promise.all(O) : O;
          }
          return g.Once(this.result.root, this.helpers);
        } else if (typeof g == "function")
          return g(this.result.root, this.result);
      } catch (O) {
        throw this.handleError(O);
      }
    }
    stringify() {
      if (this.error)
        throw this.error;
      if (this.stringified)
        return this.result;
      this.stringified = true, this.sync();
      let g = this.result.opts, O = s;
      g.syntax && (O = g.syntax.stringify), g.stringifier && (O = g.stringifier), O.stringify && (O = O.stringify);
      let E = new h(O, this.result.root, this.result.opts).generate();
      return this.result.css = E[0], this.result.map = E[1], this.result;
    }
    sync() {
      if (this.error)
        throw this.error;
      if (this.processed)
        return this.result;
      if (this.processed = true, this.processing)
        throw this.getAsyncError();
      for (let g of this.plugins) {
        let O = this.runOnRoot(g);
        if (m(O))
          throw this.getAsyncError();
      }
      if (this.prepareVisitors(), this.hasListener) {
        let g = this.result.root;
        for (;!g[c]; )
          g[c] = true, this.walkSync(g);
        if (this.listeners.OnceExit)
          if (g.type === "document")
            for (let O of g.nodes)
              this.visitSync(this.listeners.OnceExit, O);
          else
            this.visitSync(this.listeners.OnceExit, g);
      }
      return this.result;
    }
    then(g, O) {
      return false, this.async().then(g, O);
    }
    toString() {
      return this.css;
    }
    visitSync(g, O) {
      for (let [A, E] of g) {
        this.result.lastPlugin = A;
        let b;
        try {
          b = E(O, this.helpers);
        } catch (k) {
          throw this.handleError(k, O.proxyOf);
        }
        if (O.type !== "root" && O.type !== "document" && !O.parent)
          return true;
        if (m(b))
          throw this.getAsyncError();
      }
    }
    visitTick(g) {
      let O = g[g.length - 1], { node: A, visitors: E } = O;
      if (A.type !== "root" && A.type !== "document" && !A.parent) {
        g.pop();
        return;
      }
      if (E.length > 0 && O.visitorIndex < E.length) {
        let [k, q] = E[O.visitorIndex];
        O.visitorIndex += 1, O.visitorIndex === E.length && (O.visitors = [], O.visitorIndex = 0), this.result.lastPlugin = k;
        try {
          return q(A.toProxy(), this.helpers);
        } catch (M) {
          throw this.handleError(M, A);
        }
      }
      if (O.iterator !== 0) {
        let k = O.iterator, q;
        for (;q = A.nodes[A.indexes[k]]; )
          if (A.indexes[k] += 1, !q[c]) {
            q[c] = true, g.push(d(q));
            return;
          }
        O.iterator = 0, delete A.indexes[k];
      }
      let b = O.events;
      for (;O.eventIndex < b.length; ) {
        let k = b[O.eventIndex];
        if (O.eventIndex += 1, k === v2) {
          A.nodes && A.nodes.length && (A[c] = true, O.iterator = A.getIterator());
          return;
        } else if (this.listeners[k]) {
          O.visitors = this.listeners[k];
          return;
        }
      }
      g.pop();
    }
    walkSync(g) {
      g[c] = true;
      let O = n(g);
      for (let A of O)
        if (A === v2)
          g.nodes && g.each((E) => {
            E[c] || this.walkSync(E);
          });
        else {
          let E = this.listeners[A];
          if (E && this.visitSync(E, g.toProxy()))
            return;
        }
    }
    warnings() {
      return this.sync().warnings();
    }
  }
  return y.registerPostcss = (x) => {
    w = x;
  }, Qr = y, y.default = y, f.registerLazyResult(y), a.registerLazyResult(y), Qr;
}
var Hr2;
var Ta;
function yu() {
  if (Ta)
    return Hr2;
  Ta = 1;
  let u = vl(), a = Di();
  const h = qi();
  let p = or(), l = ml();

  class f {
    get content() {
      return this.result.css;
    }
    get css() {
      return this.result.css;
    }
    get map() {
      return this.result.map;
    }
    get messages() {
      return [];
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      if (this._root)
        return this._root;
      let c, t = a;
      try {
        c = t(this._css, this._opts);
      } catch (e) {
        this.error = e;
      }
      if (this.error)
        throw this.error;
      return this._root = c, c;
    }
    get [Symbol.toStringTag]() {
      return "NoWorkResult";
    }
    constructor(c, t, e) {
      t = t.toString(), this.stringified = false, this._processor = c, this._css = t, this._opts = e, this._map = undefined;
      let r, i = p;
      this.result = new h(this._processor, r, this._opts), this.result.css = t;
      let o = this;
      Object.defineProperty(this.result, "root", {
        get() {
          return o.root;
        }
      });
      let v2 = new u(i, r, this._opts, t);
      if (v2.isMap()) {
        let [m, n] = v2.generate();
        m && (this.result.css = m), n && (this.result.map = n);
      } else
        v2.clearAnnotation(), this.result.css = v2.css;
    }
    async() {
      return this.error ? Promise.reject(this.error) : Promise.resolve(this.result);
    }
    catch(c) {
      return this.async().catch(c);
    }
    finally(c) {
      return this.async().then(c, c);
    }
    sync() {
      if (this.error)
        throw this.error;
      return this.result;
    }
    then(c, t) {
      return false, this.async().then(c, t);
    }
    toString() {
      return this._css;
    }
    warnings() {
      return [];
    }
  }
  return Hr2 = f, f.default = f, Hr2;
}
var Jr;
var Aa;
function wu() {
  if (Aa)
    return Jr;
  Aa = 1;
  let u = Ii(), a = yl(), h = yu(), p = lt();

  class l {
    constructor(s = []) {
      this.version = "8.5.3", this.plugins = this.normalize(s);
    }
    normalize(s) {
      let c = [];
      for (let t of s)
        if (t.postcss === true ? t = t() : t.postcss && (t = t.postcss), typeof t == "object" && Array.isArray(t.plugins))
          c = c.concat(t.plugins);
        else if (typeof t == "object" && t.postcssPlugin)
          c.push(t);
        else if (typeof t == "function")
          c.push(t);
        else if (typeof t == "object" && (t.parse || t.stringify)) {
          if (false)
            ;
        } else
          throw new Error(t + " is not a PostCSS plugin");
      return c;
    }
    process(s, c = {}) {
      return !this.plugins.length && !c.parser && !c.stringifier && !c.syntax ? new h(this, s, c) : new a(this, s, c);
    }
    use(s) {
      return this.plugins = this.plugins.concat(this.normalize([s])), this;
    }
  }
  return Jr = l, l.default = l, p.registerProcessor(l), u.registerProcessor(l), Jr;
}
var Kr;
var Ca;
function Be() {
  if (Ca)
    return Kr;
  Ca = 1;
  let u = Ri(), a = ur(), h = nt(), p = Ai(), l = fr(), f = Ii(), s = vu(), c = cr(), t = yl(), e = hl(), r = lr(), i = Di(), o = wu(), v2 = qi(), m = lt(), n = Mi(), d = or(), _ = gl();
  function w(...y) {
    return y.length === 1 && Array.isArray(y[0]) && (y = y[0]), new o(y);
  }
  return w.plugin = function(x, g) {
    let O = false;
    function A(...b) {
      console && console.warn && !O && (O = true, console.warn(x + `: postcss.plugin was deprecated. Migration guide:
https://evilmartians.com/chronicles/postcss-8-plugin-migration`), process.env.LANG && process.env.LANG.startsWith("cn") && console.warn(x + `: 里面 postcss.plugin 被弃用. 迁移指南:
https://www.w3ctech.com/topic/2226`));
      let k = g(...b);
      return k.postcssPlugin = x, k.postcssVersion = new o().version, k;
    }
    let E;
    return Object.defineProperty(A, "postcss", {
      get() {
        return E || (E = A()), E;
      }
    }), A.process = function(b, k, q) {
      return w([A(q)]).process(b, k);
    }, A;
  }, w.stringify = d, w.parse = i, w.fromJSON = s, w.list = e, w.comment = (y) => new a(y), w.atRule = (y) => new u(y), w.decl = (y) => new l(y), w.rule = (y) => new n(y), w.root = (y) => new m(y), w.document = (y) => new f(y), w.CssSyntaxError = p, w.Declaration = l, w.Container = h, w.Processor = o, w.Document = f, w.Comment = a, w.Warning = _, w.AtRule = u, w.Result = v2, w.Input = c, w.Rule = n, w.Root = m, w.Node = r, t.registerPostcss(w), Kr = w, w.default = w, Kr;
}
var bu = Be();
var Le = /* @__PURE__ */ He(bu);
Le.stringify;
Le.fromJSON;
Le.plugin;
var _u = Le.parse;
Le.list;
Le.document;
Le.comment;
Le.atRule;
var Su = Le.rule;
var xu = Le.decl;
Le.root;
Le.CssSyntaxError;
Le.Declaration;
Le.Container;
Le.Processor;
Le.Document;
Le.Comment;
Le.Warning;
var wl = Le.AtRule;
Le.Result;
Le.Input;
var Ra = Le.Rule;
var Ou = Le.Root;
Le.Node;
var ku = (u) => u.replace(/\/\*[\s\S]*?\*\//gm, "").replace(/;\s+/gm, ";").replace(/:\s+/gm, ":").replace(/\)\s*{/gm, "){").replace(/\s+\(/gm, "(").replace(/{\s+/gm, "{").replace(/}\s+/gm, "}").replace(/\s*{/gm, "{").replace(/;?\s*}/gm, "}");
var Li = (u) => {
  if (u.first === undefined) {
    const a = u.parent;
    a && (u.remove(), Li(a));
  }
};
var Pu = (u) => {
  u.walkRules((a) => {
    u.walkRules(a.selector, (h) => {
      if (h === a)
        return;
      const p = h.parent;
      h.remove(), p && Li(p);
    });
  });
};
var bl = (u) => typeof u.type == "function" || u.type.render !== undefined;
function sr(u, a) {
  const h = ot.Children.map(u, (p) => {
    if (ot.isValidElement(p)) {
      const l = { ...p.props };
      p.props.children && !bl(p) && (l.children = sr(p.props.children, a));
      const f = a(ot.cloneElement(p, l, l.children));
      if (ot.isValidElement(f) && (typeof f.type == "function" || f.type.render)) {
        const c = (typeof f.type == "object" ? f.type.render : f.type)(f.props);
        return sr(c, a);
      }
      return f;
    }
    return a(p);
  });
  return h && h.length === 1 ? h[0] : h;
}
var Eu = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine"
};
var _l = (u) => u.replaceAll("+", "plus").replaceAll("[", "").replaceAll("%", "pc").replaceAll("]", "").replaceAll("(", "").replaceAll(")", "").replaceAll("!", "imprtnt").replaceAll(">", "gt").replaceAll("<", "lt").replaceAll("=", "eq").replace(/^[0-9]/, (a) => Eu[a]).replace(/[^a-zA-Z0-9\-_]/g, "_");
var vt = { exports: {} };
var gt = { exports: {} };
var mt = { exports: {} };
var yt = { exports: {} };
var wt = { exports: {} };
var bt = { exports: {} };
var Ye = {};
var _t = { exports: {} };
var Ia;
function Sl() {
  return Ia || (Ia = 1, function(u, a) {
    a.__esModule = true, a.default = l;
    function h(f) {
      for (var s = f.toLowerCase(), c = "", t = false, e = 0;e < 6 && s[e] !== undefined; e++) {
        var r = s.charCodeAt(e), i = r >= 97 && r <= 102 || r >= 48 && r <= 57;
        if (t = r === 32, !i)
          break;
        c += s[e];
      }
      if (c.length !== 0) {
        var o = parseInt(c, 16), v2 = o >= 55296 && o <= 57343;
        return v2 || o === 0 || o > 1114111 ? ["�", c.length + (t ? 1 : 0)] : [String.fromCodePoint(o), c.length + (t ? 1 : 0)];
      }
    }
    var p = /\\/;
    function l(f) {
      var s = p.test(f);
      if (!s)
        return f;
      for (var c = "", t = 0;t < f.length; t++) {
        if (f[t] === "\\") {
          var e = h(f.slice(t + 1, t + 7));
          if (e !== undefined) {
            c += e[0], t += e[1];
            continue;
          }
          if (f[t + 1] === "\\") {
            c += "\\", t++;
            continue;
          }
          f.length === t + 1 && (c += f[t]);
          continue;
        }
        c += f[t];
      }
      return c;
    }
    u.exports = a.default;
  }(_t, _t.exports)), _t.exports;
}
var St = { exports: {} };
var Ma;
function Tu() {
  return Ma || (Ma = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      for (var l = arguments.length, f = new Array(l > 1 ? l - 1 : 0), s = 1;s < l; s++)
        f[s - 1] = arguments[s];
      for (;f.length > 0; ) {
        var c = f.shift();
        if (!p[c])
          return;
        p = p[c];
      }
      return p;
    }
    u.exports = a.default;
  }(St, St.exports)), St.exports;
}
var xt = { exports: {} };
var Da;
function Au() {
  return Da || (Da = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      for (var l = arguments.length, f = new Array(l > 1 ? l - 1 : 0), s = 1;s < l; s++)
        f[s - 1] = arguments[s];
      for (;f.length > 0; ) {
        var c = f.shift();
        p[c] || (p[c] = {}), p = p[c];
      }
    }
    u.exports = a.default;
  }(xt, xt.exports)), xt.exports;
}
var Ot = { exports: {} };
var qa;
function Cu() {
  return qa || (qa = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      for (var l = "", f = p.indexOf("/*"), s = 0;f >= 0; ) {
        l = l + p.slice(s, f);
        var c = p.indexOf("*/", f + 2);
        if (c < 0)
          return l;
        s = c + 2, f = p.indexOf("/*", s);
      }
      return l = l + p.slice(s), l;
    }
    u.exports = a.default;
  }(Ot, Ot.exports)), Ot.exports;
}
var La;
function dr() {
  if (La)
    return Ye;
  La = 1, Ye.__esModule = true, Ye.unesc = Ye.stripComments = Ye.getProp = Ye.ensureObject = undefined;
  var u = l(Sl());
  Ye.unesc = u.default;
  var a = l(Tu());
  Ye.getProp = a.default;
  var h = l(Au());
  Ye.ensureObject = h.default;
  var p = l(Cu());
  Ye.stripComments = p.default;
  function l(f) {
    return f && f.__esModule ? f : { default: f };
  }
  return Ye;
}
var Na;
function et() {
  return Na || (Na = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = dr();
    function p(c, t) {
      for (var e = 0;e < t.length; e++) {
        var r = t[e];
        r.enumerable = r.enumerable || false, r.configurable = true, "value" in r && (r.writable = true), Object.defineProperty(c, r.key, r);
      }
    }
    function l(c, t, e) {
      return t && p(c.prototype, t), Object.defineProperty(c, "prototype", { writable: false }), c;
    }
    var f = function c(t, e) {
      if (typeof t != "object" || t === null)
        return t;
      var r = new t.constructor;
      for (var i in t)
        if (t.hasOwnProperty(i)) {
          var o = t[i], v2 = typeof o;
          i === "parent" && v2 === "object" ? e && (r[i] = e) : o instanceof Array ? r[i] = o.map(function(m) {
            return c(m, r);
          }) : r[i] = c(o, r);
        }
      return r;
    }, s = /* @__PURE__ */ function() {
      function c(e) {
        e === undefined && (e = {}), Object.assign(this, e), this.spaces = this.spaces || {}, this.spaces.before = this.spaces.before || "", this.spaces.after = this.spaces.after || "";
      }
      var t = c.prototype;
      return t.remove = function() {
        return this.parent && this.parent.removeChild(this), this.parent = undefined, this;
      }, t.replaceWith = function() {
        if (this.parent) {
          for (var r in arguments)
            this.parent.insertBefore(this, arguments[r]);
          this.remove();
        }
        return this;
      }, t.next = function() {
        return this.parent.at(this.parent.index(this) + 1);
      }, t.prev = function() {
        return this.parent.at(this.parent.index(this) - 1);
      }, t.clone = function(r) {
        r === undefined && (r = {});
        var i = f(this);
        for (var o in r)
          i[o] = r[o];
        return i;
      }, t.appendToPropertyAndEscape = function(r, i, o) {
        this.raws || (this.raws = {});
        var v2 = this[r], m = this.raws[r];
        this[r] = v2 + i, m || o !== i ? this.raws[r] = (m || v2) + o : delete this.raws[r];
      }, t.setPropertyAndEscape = function(r, i, o) {
        this.raws || (this.raws = {}), this[r] = i, this.raws[r] = o;
      }, t.setPropertyWithoutEscape = function(r, i) {
        this[r] = i, this.raws && delete this.raws[r];
      }, t.isAtPosition = function(r, i) {
        if (this.source && this.source.start && this.source.end)
          return !(this.source.start.line > r || this.source.end.line < r || this.source.start.line === r && this.source.start.column > i || this.source.end.line === r && this.source.end.column < i);
      }, t.stringifyProperty = function(r) {
        return this.raws && this.raws[r] || this[r];
      }, t.valueToString = function() {
        return String(this.stringifyProperty("value"));
      }, t.toString = function() {
        return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
      }, l(c, [{
        key: "rawSpaceBefore",
        get: function() {
          var r = this.raws && this.raws.spaces && this.raws.spaces.before;
          return r === undefined && (r = this.spaces && this.spaces.before), r || "";
        },
        set: function(r) {
          (0, h.ensureObject)(this, "raws", "spaces"), this.raws.spaces.before = r;
        }
      }, {
        key: "rawSpaceAfter",
        get: function() {
          var r = this.raws && this.raws.spaces && this.raws.spaces.after;
          return r === undefined && (r = this.spaces.after), r || "";
        },
        set: function(r) {
          (0, h.ensureObject)(this, "raws", "spaces"), this.raws.spaces.after = r;
        }
      }]), c;
    }();
    a.default = s, u.exports = a.default;
  }(bt, bt.exports)), bt.exports;
}
var Re = {};
var Fa;
function Fe() {
  if (Fa)
    return Re;
  Fa = 1, Re.__esModule = true, Re.UNIVERSAL = Re.TAG = Re.STRING = Re.SELECTOR = Re.ROOT = Re.PSEUDO = Re.NESTING = Re.ID = Re.COMMENT = Re.COMBINATOR = Re.CLASS = Re.ATTRIBUTE = undefined;
  var u = "tag";
  Re.TAG = u;
  var a = "string";
  Re.STRING = a;
  var h = "selector";
  Re.SELECTOR = h;
  var p = "root";
  Re.ROOT = p;
  var l = "pseudo";
  Re.PSEUDO = l;
  var f = "nesting";
  Re.NESTING = f;
  var s = "id";
  Re.ID = s;
  var c = "comment";
  Re.COMMENT = c;
  var t = "combinator";
  Re.COMBINATOR = t;
  var e = "class";
  Re.CLASS = e;
  var r = "attribute";
  Re.ATTRIBUTE = r;
  var i = "universal";
  return Re.UNIVERSAL = i, Re;
}
var $a;
function Ni() {
  return $a || ($a = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = s(et()), p = f(Fe());
    function l(n) {
      if (typeof WeakMap != "function")
        return null;
      var d = /* @__PURE__ */ new WeakMap, _ = /* @__PURE__ */ new WeakMap;
      return (l = function(y) {
        return y ? _ : d;
      })(n);
    }
    function f(n, d) {
      if (n && n.__esModule)
        return n;
      if (n === null || typeof n != "object" && typeof n != "function")
        return { default: n };
      var _ = l(d);
      if (_ && _.has(n))
        return _.get(n);
      var w = {}, y = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var x in n)
        if (x !== "default" && Object.prototype.hasOwnProperty.call(n, x)) {
          var g = y ? Object.getOwnPropertyDescriptor(n, x) : null;
          g && (g.get || g.set) ? Object.defineProperty(w, x, g) : w[x] = n[x];
        }
      return w.default = n, _ && _.set(n, w), w;
    }
    function s(n) {
      return n && n.__esModule ? n : { default: n };
    }
    function c(n, d) {
      var _ = typeof Symbol < "u" && n[Symbol.iterator] || n["@@iterator"];
      if (_)
        return (_ = _.call(n)).next.bind(_);
      if (Array.isArray(n) || (_ = t(n)) || d) {
        _ && (n = _);
        var w = 0;
        return function() {
          return w >= n.length ? { done: true } : { done: false, value: n[w++] };
        };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    function t(n, d) {
      if (n) {
        if (typeof n == "string")
          return e(n, d);
        var _ = Object.prototype.toString.call(n).slice(8, -1);
        if (_ === "Object" && n.constructor && (_ = n.constructor.name), _ === "Map" || _ === "Set")
          return Array.from(n);
        if (_ === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(_))
          return e(n, d);
      }
    }
    function e(n, d) {
      (d == null || d > n.length) && (d = n.length);
      for (var _ = 0, w = new Array(d);_ < d; _++)
        w[_] = n[_];
      return w;
    }
    function r(n, d) {
      for (var _ = 0;_ < d.length; _++) {
        var w = d[_];
        w.enumerable = w.enumerable || false, w.configurable = true, "value" in w && (w.writable = true), Object.defineProperty(n, w.key, w);
      }
    }
    function i(n, d, _) {
      return d && r(n.prototype, d), Object.defineProperty(n, "prototype", { writable: false }), n;
    }
    function o(n, d) {
      n.prototype = Object.create(d.prototype), n.prototype.constructor = n, v2(n, d);
    }
    function v2(n, d) {
      return v2 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(w, y) {
        return w.__proto__ = y, w;
      }, v2(n, d);
    }
    var m = /* @__PURE__ */ function(n) {
      o(d, n);
      function d(w) {
        var y;
        return y = n.call(this, w) || this, y.nodes || (y.nodes = []), y;
      }
      var _ = d.prototype;
      return _.append = function(y) {
        return y.parent = this, this.nodes.push(y), this;
      }, _.prepend = function(y) {
        y.parent = this, this.nodes.unshift(y);
        for (var x in this.indexes)
          this.indexes[x]++;
        return this;
      }, _.at = function(y) {
        return this.nodes[y];
      }, _.index = function(y) {
        return typeof y == "number" ? y : this.nodes.indexOf(y);
      }, _.removeChild = function(y) {
        y = this.index(y), this.at(y).parent = undefined, this.nodes.splice(y, 1);
        var x;
        for (var g in this.indexes)
          x = this.indexes[g], x >= y && (this.indexes[g] = x - 1);
        return this;
      }, _.removeAll = function() {
        for (var y = c(this.nodes), x;!(x = y()).done; ) {
          var g = x.value;
          g.parent = undefined;
        }
        return this.nodes = [], this;
      }, _.empty = function() {
        return this.removeAll();
      }, _.insertAfter = function(y, x) {
        var g;
        x.parent = this;
        for (var O = this.index(y), A = [], E = 2;E < arguments.length; E++)
          A.push(arguments[E]);
        (g = this.nodes).splice.apply(g, [O + 1, 0, x].concat(A)), x.parent = this;
        var b;
        for (var k in this.indexes)
          b = this.indexes[k], O < b && (this.indexes[k] = b + arguments.length - 1);
        return this;
      }, _.insertBefore = function(y, x) {
        var g;
        x.parent = this;
        for (var O = this.index(y), A = [], E = 2;E < arguments.length; E++)
          A.push(arguments[E]);
        (g = this.nodes).splice.apply(g, [O, 0, x].concat(A)), x.parent = this;
        var b;
        for (var k in this.indexes)
          b = this.indexes[k], b >= O && (this.indexes[k] = b + arguments.length - 1);
        return this;
      }, _._findChildAtPosition = function(y, x) {
        var g = undefined;
        return this.each(function(O) {
          if (O.atPosition) {
            var A = O.atPosition(y, x);
            if (A)
              return g = A, false;
          } else if (O.isAtPosition(y, x))
            return g = O, false;
        }), g;
      }, _.atPosition = function(y, x) {
        if (this.isAtPosition(y, x))
          return this._findChildAtPosition(y, x) || this;
      }, _._inferEndPosition = function() {
        this.last && this.last.source && this.last.source.end && (this.source = this.source || {}, this.source.end = this.source.end || {}, Object.assign(this.source.end, this.last.source.end));
      }, _.each = function(y) {
        this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach++;
        var x = this.lastEach;
        if (this.indexes[x] = 0, !!this.length) {
          for (var g, O;this.indexes[x] < this.length && (g = this.indexes[x], O = y(this.at(g), g), O !== false); )
            this.indexes[x] += 1;
          if (delete this.indexes[x], O === false)
            return false;
        }
      }, _.walk = function(y) {
        return this.each(function(x, g) {
          var O = y(x, g);
          if (O !== false && x.length && (O = x.walk(y)), O === false)
            return false;
        });
      }, _.walkAttributes = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.ATTRIBUTE)
            return y.call(x, g);
        });
      }, _.walkClasses = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.CLASS)
            return y.call(x, g);
        });
      }, _.walkCombinators = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.COMBINATOR)
            return y.call(x, g);
        });
      }, _.walkComments = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.COMMENT)
            return y.call(x, g);
        });
      }, _.walkIds = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.ID)
            return y.call(x, g);
        });
      }, _.walkNesting = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.NESTING)
            return y.call(x, g);
        });
      }, _.walkPseudos = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.PSEUDO)
            return y.call(x, g);
        });
      }, _.walkTags = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.TAG)
            return y.call(x, g);
        });
      }, _.walkUniversals = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.UNIVERSAL)
            return y.call(x, g);
        });
      }, _.split = function(y) {
        var x = this, g = [];
        return this.reduce(function(O, A, E) {
          var b = y.call(x, A);
          return g.push(A), b ? (O.push(g), g = []) : E === x.length - 1 && O.push(g), O;
        }, []);
      }, _.map = function(y) {
        return this.nodes.map(y);
      }, _.reduce = function(y, x) {
        return this.nodes.reduce(y, x);
      }, _.every = function(y) {
        return this.nodes.every(y);
      }, _.some = function(y) {
        return this.nodes.some(y);
      }, _.filter = function(y) {
        return this.nodes.filter(y);
      }, _.sort = function(y) {
        return this.nodes.sort(y);
      }, _.toString = function() {
        return this.map(String).join("");
      }, i(d, [{
        key: "first",
        get: function() {
          return this.at(0);
        }
      }, {
        key: "last",
        get: function() {
          return this.at(this.length - 1);
        }
      }, {
        key: "length",
        get: function() {
          return this.nodes.length;
        }
      }]), d;
    }(h.default);
    a.default = m, u.exports = a.default;
  }(wt, wt.exports)), wt.exports;
}
var Ua;
function xl() {
  return Ua || (Ua = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Ni()), p = Fe();
    function l(r) {
      return r && r.__esModule ? r : { default: r };
    }
    function f(r, i) {
      for (var o = 0;o < i.length; o++) {
        var v2 = i[o];
        v2.enumerable = v2.enumerable || false, v2.configurable = true, "value" in v2 && (v2.writable = true), Object.defineProperty(r, v2.key, v2);
      }
    }
    function s(r, i, o) {
      return i && f(r.prototype, i), Object.defineProperty(r, "prototype", { writable: false }), r;
    }
    function c(r, i) {
      r.prototype = Object.create(i.prototype), r.prototype.constructor = r, t(r, i);
    }
    function t(r, i) {
      return t = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(v2, m) {
        return v2.__proto__ = m, v2;
      }, t(r, i);
    }
    var e = /* @__PURE__ */ function(r) {
      c(i, r);
      function i(v2) {
        var m;
        return m = r.call(this, v2) || this, m.type = p.ROOT, m;
      }
      var o = i.prototype;
      return o.toString = function() {
        var m = this.reduce(function(n, d) {
          return n.push(String(d)), n;
        }, []).join(",");
        return this.trailingComma ? m + "," : m;
      }, o.error = function(m, n) {
        return this._error ? this._error(m, n) : new Error(m);
      }, s(i, [{
        key: "errorGenerator",
        set: function(m) {
          this._error = m;
        }
      }]), i;
    }(h.default);
    a.default = e, u.exports = a.default;
  }(yt, yt.exports)), yt.exports;
}
var kt = { exports: {} };
var za;
function Ol() {
  return za || (za = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Ni()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.SELECTOR, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(kt, kt.exports)), kt.exports;
}
var Pt = { exports: {} };
/*! https://mths.be/cssesc v3.0.0 by @mathias */
var Xr;
var Wa;
function at() {
  if (Wa)
    return Xr;
  Wa = 1;
  var u = {}, a = u.hasOwnProperty, h = function(t, e) {
    if (!t)
      return e;
    var r = {};
    for (var i in e)
      r[i] = a.call(t, i) ? t[i] : e[i];
    return r;
  }, p = /[ -,\.\/:-@\[-\^`\{-~]/, l = /[ -,\.\/:-@\[\]\^`\{-~]/, f = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g, s = function c(t, e) {
    e = h(e, c.options), e.quotes != "single" && e.quotes != "double" && (e.quotes = "single");
    for (var r = e.quotes == "double" ? '"' : "'", i = e.isIdentifier, o = t.charAt(0), v2 = "", m = 0, n = t.length;m < n; ) {
      var d = t.charAt(m++), _ = d.charCodeAt(), w = undefined;
      if (_ < 32 || _ > 126) {
        if (_ >= 55296 && _ <= 56319 && m < n) {
          var y = t.charCodeAt(m++);
          (y & 64512) == 56320 ? _ = ((_ & 1023) << 10) + (y & 1023) + 65536 : m--;
        }
        w = "\\" + _.toString(16).toUpperCase() + " ";
      } else
        e.escapeEverything ? p.test(d) ? w = "\\" + d : w = "\\" + _.toString(16).toUpperCase() + " " : /[\t\n\f\r\x0B]/.test(d) ? w = "\\" + _.toString(16).toUpperCase() + " " : d == "\\" || !i && (d == '"' && r == d || d == "'" && r == d) || i && l.test(d) ? w = "\\" + d : w = d;
      v2 += w;
    }
    return i && (/^-[-\d]/.test(v2) ? v2 = "\\-" + v2.slice(1) : /\d/.test(o) && (v2 = "\\3" + o + " " + v2.slice(1))), v2 = v2.replace(f, function(x, g, O) {
      return g && g.length % 2 ? x : (g || "") + O;
    }), !i && e.wrap ? r + v2 + r : v2;
  };
  return s.options = {
    escapeEverything: false,
    isIdentifier: false,
    quotes: "single",
    wrap: false
  }, s.version = "3.0.0", Xr = s, Xr;
}
var Va;
function kl() {
  return Va || (Va = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = s(at()), p = dr(), l = s(et()), f = Fe();
    function s(o) {
      return o && o.__esModule ? o : { default: o };
    }
    function c(o, v2) {
      for (var m = 0;m < v2.length; m++) {
        var n = v2[m];
        n.enumerable = n.enumerable || false, n.configurable = true, "value" in n && (n.writable = true), Object.defineProperty(o, n.key, n);
      }
    }
    function t(o, v2, m) {
      return v2 && c(o.prototype, v2), Object.defineProperty(o, "prototype", { writable: false }), o;
    }
    function e(o, v2) {
      o.prototype = Object.create(v2.prototype), o.prototype.constructor = o, r(o, v2);
    }
    function r(o, v2) {
      return r = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(n, d) {
        return n.__proto__ = d, n;
      }, r(o, v2);
    }
    var i = /* @__PURE__ */ function(o) {
      e(v2, o);
      function v2(n) {
        var d;
        return d = o.call(this, n) || this, d.type = f.CLASS, d._constructed = true, d;
      }
      var m = v2.prototype;
      return m.valueToString = function() {
        return "." + o.prototype.valueToString.call(this);
      }, t(v2, [{
        key: "value",
        get: function() {
          return this._value;
        },
        set: function(d) {
          if (this._constructed) {
            var _ = (0, h.default)(d, {
              isIdentifier: true
            });
            _ !== d ? ((0, p.ensureObject)(this, "raws"), this.raws.value = _) : this.raws && delete this.raws.value;
          }
          this._value = d;
        }
      }]), v2;
    }(l.default);
    a.default = i, u.exports = a.default;
  }(Pt, Pt.exports)), Pt.exports;
}
var Et = { exports: {} };
var ja;
function Pl() {
  return ja || (ja = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(et()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.COMMENT, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Et, Et.exports)), Et.exports;
}
var Tt = { exports: {} };
var Ba;
function El() {
  return Ba || (Ba = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(et()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(i) {
        var o;
        return o = t.call(this, i) || this, o.type = p.ID, o;
      }
      var r = e.prototype;
      return r.valueToString = function() {
        return "#" + t.prototype.valueToString.call(this);
      }, e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Tt, Tt.exports)), Tt.exports;
}
var At = { exports: {} };
var Ct = { exports: {} };
var Ga;
function Fi() {
  return Ga || (Ga = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = f(at()), p = dr(), l = f(et());
    function f(i) {
      return i && i.__esModule ? i : { default: i };
    }
    function s(i, o) {
      for (var v2 = 0;v2 < o.length; v2++) {
        var m = o[v2];
        m.enumerable = m.enumerable || false, m.configurable = true, "value" in m && (m.writable = true), Object.defineProperty(i, m.key, m);
      }
    }
    function c(i, o, v2) {
      return o && s(i.prototype, o), Object.defineProperty(i, "prototype", { writable: false }), i;
    }
    function t(i, o) {
      i.prototype = Object.create(o.prototype), i.prototype.constructor = i, e(i, o);
    }
    function e(i, o) {
      return e = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(m, n) {
        return m.__proto__ = n, m;
      }, e(i, o);
    }
    var r = /* @__PURE__ */ function(i) {
      t(o, i);
      function o() {
        return i.apply(this, arguments) || this;
      }
      var v2 = o.prototype;
      return v2.qualifiedName = function(n) {
        return this.namespace ? this.namespaceString + "|" + n : n;
      }, v2.valueToString = function() {
        return this.qualifiedName(i.prototype.valueToString.call(this));
      }, c(o, [{
        key: "namespace",
        get: function() {
          return this._namespace;
        },
        set: function(n) {
          if (n === true || n === "*" || n === "&") {
            this._namespace = n, this.raws && delete this.raws.namespace;
            return;
          }
          var d = (0, h.default)(n, {
            isIdentifier: true
          });
          this._namespace = n, d !== n ? ((0, p.ensureObject)(this, "raws"), this.raws.namespace = d) : this.raws && delete this.raws.namespace;
        }
      }, {
        key: "ns",
        get: function() {
          return this._namespace;
        },
        set: function(n) {
          this.namespace = n;
        }
      }, {
        key: "namespaceString",
        get: function() {
          if (this.namespace) {
            var n = this.stringifyProperty("namespace");
            return n === true ? "" : n;
          } else
            return "";
        }
      }]), o;
    }(l.default);
    a.default = r, u.exports = a.default;
  }(Ct, Ct.exports)), Ct.exports;
}
var Ya;
function Tl() {
  return Ya || (Ya = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Fi()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.TAG, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(At, At.exports)), At.exports;
}
var Rt = { exports: {} };
var Qa;
function Al() {
  return Qa || (Qa = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(et()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.STRING, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Rt, Rt.exports)), Rt.exports;
}
var It = { exports: {} };
var Ha;
function Cl() {
  return Ha || (Ha = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Ni()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(i) {
        var o;
        return o = t.call(this, i) || this, o.type = p.PSEUDO, o;
      }
      var r = e.prototype;
      return r.toString = function() {
        var o = this.length ? "(" + this.map(String).join(",") + ")" : "";
        return [this.rawSpaceBefore, this.stringifyProperty("value"), o, this.rawSpaceAfter].join("");
      }, e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(It, It.exports)), It.exports;
}
var Zr = {};
var en;
var Ja;
function Rl() {
  if (Ja)
    return en;
  Ja = 1, en = u;
  function u(h, p) {
    if (a("noDeprecation"))
      return h;
    var l = false;
    function f() {
      if (!l) {
        if (a("throwDeprecation"))
          throw new Error(p);
        a("traceDeprecation") ? console.trace(p) : console.warn(p), l = true;
      }
      return h.apply(this, arguments);
    }
    return f;
  }
  function a(h) {
    try {
      if (!ta.localStorage)
        return false;
    } catch {
      return false;
    }
    var p = ta.localStorage[h];
    return p == null ? false : String(p).toLowerCase() === "true";
  }
  return en;
}
var Ka;
function Il() {
  return Ka || (Ka = 1, function(u) {
    u.__esModule = true, u.default = undefined, u.unescapeValue = d;
    var a = s(at()), h = s(Sl()), p = s(Fi()), l = Fe(), f;
    function s(g) {
      return g && g.__esModule ? g : { default: g };
    }
    function c(g, O) {
      for (var A = 0;A < O.length; A++) {
        var E = O[A];
        E.enumerable = E.enumerable || false, E.configurable = true, "value" in E && (E.writable = true), Object.defineProperty(g, E.key, E);
      }
    }
    function t(g, O, A) {
      return O && c(g.prototype, O), Object.defineProperty(g, "prototype", { writable: false }), g;
    }
    function e(g, O) {
      g.prototype = Object.create(O.prototype), g.prototype.constructor = g, r(g, O);
    }
    function r(g, O) {
      return r = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(E, b) {
        return E.__proto__ = b, E;
      }, r(g, O);
    }
    var i = Rl(), o = /^('|")([^]*)\1$/, v2 = i(function() {}, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead."), m = i(function() {}, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead."), n = i(function() {}, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
    function d(g) {
      var O = false, A = null, E = g, b = E.match(o);
      return b && (A = b[1], E = b[2]), E = (0, h.default)(E), E !== g && (O = true), {
        deprecatedUsage: O,
        unescaped: E,
        quoteMark: A
      };
    }
    function _(g) {
      if (g.quoteMark !== undefined || g.value === undefined)
        return g;
      n();
      var O = d(g.value), A = O.quoteMark, E = O.unescaped;
      return g.raws || (g.raws = {}), g.raws.value === undefined && (g.raws.value = g.value), g.value = E, g.quoteMark = A, g;
    }
    var w = /* @__PURE__ */ function(g) {
      e(O, g);
      function O(E) {
        var b;
        return E === undefined && (E = {}), b = g.call(this, _(E)) || this, b.type = l.ATTRIBUTE, b.raws = b.raws || {}, Object.defineProperty(b.raws, "unquoted", {
          get: i(function() {
            return b.value;
          }, "attr.raws.unquoted is deprecated. Call attr.value instead."),
          set: i(function() {
            return b.value;
          }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.")
        }), b._constructed = true, b;
      }
      var A = O.prototype;
      return A.getQuotedValue = function(b) {
        b === undefined && (b = {});
        var k = this._determineQuoteMark(b), q = y[k], M = (0, a.default)(this._value, q);
        return M;
      }, A._determineQuoteMark = function(b) {
        return b.smart ? this.smartQuoteMark(b) : this.preferredQuoteMark(b);
      }, A.setValue = function(b, k) {
        k === undefined && (k = {}), this._value = b, this._quoteMark = this._determineQuoteMark(k), this._syncRawValue();
      }, A.smartQuoteMark = function(b) {
        var k = this.value, q = k.replace(/[^']/g, "").length, M = k.replace(/[^"]/g, "").length;
        if (q + M === 0) {
          var W = (0, a.default)(k, {
            isIdentifier: true
          });
          if (W === k)
            return O.NO_QUOTE;
          var S = this.preferredQuoteMark(b);
          if (S === O.NO_QUOTE) {
            var P = this.quoteMark || b.quoteMark || O.DOUBLE_QUOTE, C = y[P], R = (0, a.default)(k, C);
            if (R.length < W.length)
              return P;
          }
          return S;
        } else
          return M === q ? this.preferredQuoteMark(b) : M < q ? O.DOUBLE_QUOTE : O.SINGLE_QUOTE;
      }, A.preferredQuoteMark = function(b) {
        var k = b.preferCurrentQuoteMark ? this.quoteMark : b.quoteMark;
        return k === undefined && (k = b.preferCurrentQuoteMark ? b.quoteMark : this.quoteMark), k === undefined && (k = O.DOUBLE_QUOTE), k;
      }, A._syncRawValue = function() {
        var b = (0, a.default)(this._value, y[this.quoteMark]);
        b === this._value ? this.raws && delete this.raws.value : this.raws.value = b;
      }, A._handleEscapes = function(b, k) {
        if (this._constructed) {
          var q = (0, a.default)(k, {
            isIdentifier: true
          });
          q !== k ? this.raws[b] = q : delete this.raws[b];
        }
      }, A._spacesFor = function(b) {
        var k = {
          before: "",
          after: ""
        }, q = this.spaces[b] || {}, M = this.raws.spaces && this.raws.spaces[b] || {};
        return Object.assign(k, q, M);
      }, A._stringFor = function(b, k, q) {
        k === undefined && (k = b), q === undefined && (q = x);
        var M = this._spacesFor(k);
        return q(this.stringifyProperty(b), M);
      }, A.offsetOf = function(b) {
        var k = 1, q = this._spacesFor("attribute");
        if (k += q.before.length, b === "namespace" || b === "ns")
          return this.namespace ? k : -1;
        if (b === "attributeNS" || (k += this.namespaceString.length, this.namespace && (k += 1), b === "attribute"))
          return k;
        k += this.stringifyProperty("attribute").length, k += q.after.length;
        var M = this._spacesFor("operator");
        k += M.before.length;
        var W = this.stringifyProperty("operator");
        if (b === "operator")
          return W ? k : -1;
        k += W.length, k += M.after.length;
        var S = this._spacesFor("value");
        k += S.before.length;
        var P = this.stringifyProperty("value");
        if (b === "value")
          return P ? k : -1;
        k += P.length, k += S.after.length;
        var C = this._spacesFor("insensitive");
        return k += C.before.length, b === "insensitive" && this.insensitive ? k : -1;
      }, A.toString = function() {
        var b = this, k = [this.rawSpaceBefore, "["];
        return k.push(this._stringFor("qualifiedAttribute", "attribute")), this.operator && (this.value || this.value === "") && (k.push(this._stringFor("operator")), k.push(this._stringFor("value")), k.push(this._stringFor("insensitiveFlag", "insensitive", function(q, M) {
          return q.length > 0 && !b.quoted && M.before.length === 0 && !(b.spaces.value && b.spaces.value.after) && (M.before = " "), x(q, M);
        }))), k.push("]"), k.push(this.rawSpaceAfter), k.join("");
      }, t(O, [{
        key: "quoted",
        get: function() {
          var b = this.quoteMark;
          return b === "'" || b === '"';
        },
        set: function(b) {
          m();
        }
      }, {
        key: "quoteMark",
        get: function() {
          return this._quoteMark;
        },
        set: function(b) {
          if (!this._constructed) {
            this._quoteMark = b;
            return;
          }
          this._quoteMark !== b && (this._quoteMark = b, this._syncRawValue());
        }
      }, {
        key: "qualifiedAttribute",
        get: function() {
          return this.qualifiedName(this.raws.attribute || this.attribute);
        }
      }, {
        key: "insensitiveFlag",
        get: function() {
          return this.insensitive ? "i" : "";
        }
      }, {
        key: "value",
        get: function() {
          return this._value;
        },
        set: function(b) {
          if (this._constructed) {
            var k = d(b), q = k.deprecatedUsage, M = k.unescaped, W = k.quoteMark;
            if (q && v2(), M === this._value && W === this._quoteMark)
              return;
            this._value = M, this._quoteMark = W, this._syncRawValue();
          } else
            this._value = b;
        }
      }, {
        key: "insensitive",
        get: function() {
          return this._insensitive;
        },
        set: function(b) {
          b || (this._insensitive = false, this.raws && (this.raws.insensitiveFlag === "I" || this.raws.insensitiveFlag === "i") && (this.raws.insensitiveFlag = undefined)), this._insensitive = b;
        }
      }, {
        key: "attribute",
        get: function() {
          return this._attribute;
        },
        set: function(b) {
          this._handleEscapes("attribute", b), this._attribute = b;
        }
      }]), O;
    }(p.default);
    u.default = w, w.NO_QUOTE = null, w.SINGLE_QUOTE = "'", w.DOUBLE_QUOTE = '"';
    var y = (f = {
      "'": {
        quotes: "single",
        wrap: true
      },
      '"': {
        quotes: "double",
        wrap: true
      }
    }, f[null] = {
      isIdentifier: true
    }, f);
    function x(g, O) {
      return "" + O.before + g + O.after;
    }
  }(Zr)), Zr;
}
var Mt = { exports: {} };
var Xa;
function Ml() {
  return Xa || (Xa = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Fi()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.UNIVERSAL, i.value = "*", i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Mt, Mt.exports)), Mt.exports;
}
var Dt = { exports: {} };
var Za;
function Dl() {
  return Za || (Za = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(et()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.COMBINATOR, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Dt, Dt.exports)), Dt.exports;
}
var qt = { exports: {} };
var es;
function ql() {
  return es || (es = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(et()), p = Fe();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.NESTING, i.value = "&", i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(qt, qt.exports)), qt.exports;
}
var Lt = { exports: {} };
var ts;
function Ru() {
  return ts || (ts = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      return p.sort(function(l, f) {
        return l - f;
      });
    }
    u.exports = a.default;
  }(Lt, Lt.exports)), Lt.exports;
}
var tn = {};
var oe = {};
var rs;
function Ll() {
  if (rs)
    return oe;
  rs = 1, oe.__esModule = true, oe.word = oe.tilde = oe.tab = oe.str = oe.space = oe.slash = oe.singleQuote = oe.semicolon = oe.plus = oe.pipe = oe.openSquare = oe.openParenthesis = oe.newline = oe.greaterThan = oe.feed = oe.equals = oe.doubleQuote = oe.dollar = oe.cr = oe.comment = oe.comma = oe.combinator = oe.colon = oe.closeSquare = oe.closeParenthesis = oe.caret = oe.bang = oe.backslash = oe.at = oe.asterisk = oe.ampersand = undefined;
  var u = 38;
  oe.ampersand = u;
  var a = 42;
  oe.asterisk = a;
  var h = 64;
  oe.at = h;
  var p = 44;
  oe.comma = p;
  var l = 58;
  oe.colon = l;
  var f = 59;
  oe.semicolon = f;
  var s = 40;
  oe.openParenthesis = s;
  var c = 41;
  oe.closeParenthesis = c;
  var t = 91;
  oe.openSquare = t;
  var e = 93;
  oe.closeSquare = e;
  var r = 36;
  oe.dollar = r;
  var i = 126;
  oe.tilde = i;
  var o = 94;
  oe.caret = o;
  var v2 = 43;
  oe.plus = v2;
  var m = 61;
  oe.equals = m;
  var n = 124;
  oe.pipe = n;
  var d = 62;
  oe.greaterThan = d;
  var _ = 32;
  oe.space = _;
  var w = 39;
  oe.singleQuote = w;
  var y = 34;
  oe.doubleQuote = y;
  var x = 47;
  oe.slash = x;
  var g = 33;
  oe.bang = g;
  var O = 92;
  oe.backslash = O;
  var A = 13;
  oe.cr = A;
  var E = 12;
  oe.feed = E;
  var b = 10;
  oe.newline = b;
  var k = 9;
  oe.tab = k;
  var q = w;
  oe.str = q;
  var M = -1;
  oe.comment = M;
  var W = -2;
  oe.word = W;
  var S = -3;
  return oe.combinator = S, oe;
}
var ns;
function Iu() {
  return ns || (ns = 1, function(u) {
    u.__esModule = true, u.FIELDS = undefined, u.default = m;
    var a = f(Ll()), h, p;
    function l(n) {
      if (typeof WeakMap != "function")
        return null;
      var d = /* @__PURE__ */ new WeakMap, _ = /* @__PURE__ */ new WeakMap;
      return (l = function(y) {
        return y ? _ : d;
      })(n);
    }
    function f(n, d) {
      if (n && n.__esModule)
        return n;
      if (n === null || typeof n != "object" && typeof n != "function")
        return { default: n };
      var _ = l(d);
      if (_ && _.has(n))
        return _.get(n);
      var w = {}, y = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var x in n)
        if (x !== "default" && Object.prototype.hasOwnProperty.call(n, x)) {
          var g = y ? Object.getOwnPropertyDescriptor(n, x) : null;
          g && (g.get || g.set) ? Object.defineProperty(w, x, g) : w[x] = n[x];
        }
      return w.default = n, _ && _.set(n, w), w;
    }
    for (var s = (h = {}, h[a.tab] = true, h[a.newline] = true, h[a.cr] = true, h[a.feed] = true, h), c = (p = {}, p[a.space] = true, p[a.tab] = true, p[a.newline] = true, p[a.cr] = true, p[a.feed] = true, p[a.ampersand] = true, p[a.asterisk] = true, p[a.bang] = true, p[a.comma] = true, p[a.colon] = true, p[a.semicolon] = true, p[a.openParenthesis] = true, p[a.closeParenthesis] = true, p[a.openSquare] = true, p[a.closeSquare] = true, p[a.singleQuote] = true, p[a.doubleQuote] = true, p[a.plus] = true, p[a.pipe] = true, p[a.tilde] = true, p[a.greaterThan] = true, p[a.equals] = true, p[a.dollar] = true, p[a.caret] = true, p[a.slash] = true, p), t = {}, e = "0123456789abcdefABCDEF", r = 0;r < e.length; r++)
      t[e.charCodeAt(r)] = true;
    function i(n, d) {
      var _ = d, w;
      do {
        if (w = n.charCodeAt(_), c[w])
          return _ - 1;
        w === a.backslash ? _ = o(n, _) + 1 : _++;
      } while (_ < n.length);
      return _ - 1;
    }
    function o(n, d) {
      var _ = d, w = n.charCodeAt(_ + 1);
      if (!s[w])
        if (t[w]) {
          var y = 0;
          do
            _++, y++, w = n.charCodeAt(_ + 1);
          while (t[w] && y < 6);
          y < 6 && w === a.space && _++;
        } else
          _++;
      return _;
    }
    var v2 = {
      TYPE: 0,
      START_LINE: 1,
      START_COL: 2,
      END_LINE: 3,
      END_COL: 4,
      START_POS: 5,
      END_POS: 6
    };
    u.FIELDS = v2;
    function m(n) {
      var d = [], _ = n.css.valueOf(), w = _, y = w.length, x = -1, g = 1, O = 0, A = 0, E, b, k, q, M, W, S, P, C, R, $, B, z;
      function L(F, D) {
        if (n.safe)
          _ += D, C = _.length - 1;
        else
          throw n.error("Unclosed " + F, g, O - x, O);
      }
      for (;O < y; ) {
        switch (E = _.charCodeAt(O), E === a.newline && (x = O, g += 1), E) {
          case a.space:
          case a.tab:
          case a.newline:
          case a.cr:
          case a.feed:
            C = O;
            do
              C += 1, E = _.charCodeAt(C), E === a.newline && (x = C, g += 1);
            while (E === a.space || E === a.newline || E === a.tab || E === a.cr || E === a.feed);
            z = a.space, q = g, k = C - x - 1, A = C;
            break;
          case a.plus:
          case a.greaterThan:
          case a.tilde:
          case a.pipe:
            C = O;
            do
              C += 1, E = _.charCodeAt(C);
            while (E === a.plus || E === a.greaterThan || E === a.tilde || E === a.pipe);
            z = a.combinator, q = g, k = O - x, A = C;
            break;
          case a.asterisk:
          case a.ampersand:
          case a.bang:
          case a.comma:
          case a.equals:
          case a.dollar:
          case a.caret:
          case a.openSquare:
          case a.closeSquare:
          case a.colon:
          case a.semicolon:
          case a.openParenthesis:
          case a.closeParenthesis:
            C = O, z = E, q = g, k = O - x, A = C + 1;
            break;
          case a.singleQuote:
          case a.doubleQuote:
            B = E === a.singleQuote ? "'" : '"', C = O;
            do
              for (M = false, C = _.indexOf(B, C + 1), C === -1 && L("quote", B), W = C;_.charCodeAt(W - 1) === a.backslash; )
                W -= 1, M = !M;
            while (M);
            z = a.str, q = g, k = O - x, A = C + 1;
            break;
          default:
            E === a.slash && _.charCodeAt(O + 1) === a.asterisk ? (C = _.indexOf("*/", O + 2) + 1, C === 0 && L("comment", "*/"), b = _.slice(O, C + 1), P = b.split(`
`), S = P.length - 1, S > 0 ? (R = g + S, $ = C - P[S].length) : (R = g, $ = x), z = a.comment, g = R, q = R, k = C - $) : E === a.slash ? (C = O, z = E, q = g, k = O - x, A = C + 1) : (C = i(_, O), z = a.word, q = g, k = C - x), A = C + 1;
            break;
        }
        d.push([
          z,
          g,
          O - x,
          q,
          k,
          O,
          A
        ]), $ && (x = $, $ = null), O = A;
      }
      return d;
    }
  }(tn)), tn;
}
var is;
function Mu() {
  return is || (is = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = A(xl()), p = A(Ol()), l = A(kl()), f = A(Pl()), s = A(El()), c = A(Tl()), t = A(Al()), e = A(Cl()), r = O(Il()), i = A(Ml()), o = A(Dl()), v2 = A(ql()), m = A(Ru()), n = O(Iu()), d = O(Ll()), _ = O(Fe()), w = dr(), y, x;
    function g(L) {
      if (typeof WeakMap != "function")
        return null;
      var F = /* @__PURE__ */ new WeakMap, D = /* @__PURE__ */ new WeakMap;
      return (g = function(N) {
        return N ? D : F;
      })(L);
    }
    function O(L, F) {
      if (L && L.__esModule)
        return L;
      if (L === null || typeof L != "object" && typeof L != "function")
        return { default: L };
      var D = g(F);
      if (D && D.has(L))
        return D.get(L);
      var I = {}, N = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var J in L)
        if (J !== "default" && Object.prototype.hasOwnProperty.call(L, J)) {
          var T = N ? Object.getOwnPropertyDescriptor(L, J) : null;
          T && (T.get || T.set) ? Object.defineProperty(I, J, T) : I[J] = L[J];
        }
      return I.default = L, D && D.set(L, I), I;
    }
    function A(L) {
      return L && L.__esModule ? L : { default: L };
    }
    function E(L, F) {
      for (var D = 0;D < F.length; D++) {
        var I = F[D];
        I.enumerable = I.enumerable || false, I.configurable = true, "value" in I && (I.writable = true), Object.defineProperty(L, I.key, I);
      }
    }
    function b(L, F, D) {
      return F && E(L.prototype, F), Object.defineProperty(L, "prototype", { writable: false }), L;
    }
    var k = (y = {}, y[d.space] = true, y[d.cr] = true, y[d.feed] = true, y[d.newline] = true, y[d.tab] = true, y), q = Object.assign({}, k, (x = {}, x[d.comment] = true, x));
    function M(L) {
      return {
        line: L[n.FIELDS.START_LINE],
        column: L[n.FIELDS.START_COL]
      };
    }
    function W(L) {
      return {
        line: L[n.FIELDS.END_LINE],
        column: L[n.FIELDS.END_COL]
      };
    }
    function S(L, F, D, I) {
      return {
        start: {
          line: L,
          column: F
        },
        end: {
          line: D,
          column: I
        }
      };
    }
    function P(L) {
      return S(L[n.FIELDS.START_LINE], L[n.FIELDS.START_COL], L[n.FIELDS.END_LINE], L[n.FIELDS.END_COL]);
    }
    function C(L, F) {
      if (L)
        return S(L[n.FIELDS.START_LINE], L[n.FIELDS.START_COL], F[n.FIELDS.END_LINE], F[n.FIELDS.END_COL]);
    }
    function R(L, F) {
      var D = L[F];
      if (typeof D == "string")
        return D.indexOf("\\") !== -1 && ((0, w.ensureObject)(L, "raws"), L[F] = (0, w.unesc)(D), L.raws[F] === undefined && (L.raws[F] = D)), L;
    }
    function $(L, F) {
      for (var D = -1, I = [];(D = L.indexOf(F, D + 1)) !== -1; )
        I.push(D);
      return I;
    }
    function B() {
      var L = Array.prototype.concat.apply([], arguments);
      return L.filter(function(F, D) {
        return D === L.indexOf(F);
      });
    }
    var z = /* @__PURE__ */ function() {
      function L(D, I) {
        I === undefined && (I = {}), this.rule = D, this.options = Object.assign({
          lossy: false,
          safe: false
        }, I), this.position = 0, this.css = typeof this.rule == "string" ? this.rule : this.rule.selector, this.tokens = (0, n.default)({
          css: this.css,
          error: this._errorGenerator(),
          safe: this.options.safe
        });
        var N = C(this.tokens[0], this.tokens[this.tokens.length - 1]);
        this.root = new h.default({
          source: N
        }), this.root.errorGenerator = this._errorGenerator();
        var J = new p.default({
          source: {
            start: {
              line: 1,
              column: 1
            }
          },
          sourceIndex: 0
        });
        this.root.append(J), this.current = J, this.loop();
      }
      var F = L.prototype;
      return F._errorGenerator = function() {
        var I = this;
        return function(N, J) {
          return typeof I.rule == "string" ? new Error(N) : I.rule.error(N, J);
        };
      }, F.attribute = function() {
        var I = [], N = this.currToken;
        for (this.position++;this.position < this.tokens.length && this.currToken[n.FIELDS.TYPE] !== d.closeSquare; )
          I.push(this.currToken), this.position++;
        if (this.currToken[n.FIELDS.TYPE] !== d.closeSquare)
          return this.expected("closing square bracket", this.currToken[n.FIELDS.START_POS]);
        var J = I.length, T = {
          source: S(N[1], N[2], this.currToken[3], this.currToken[4]),
          sourceIndex: N[n.FIELDS.START_POS]
        };
        if (J === 1 && !~[d.word].indexOf(I[0][n.FIELDS.TYPE]))
          return this.expected("attribute", I[0][n.FIELDS.START_POS]);
        for (var U = 0, j = "", H = "", V = null, K = false;U < J; ) {
          var X = I[U], Q = this.content(X), ne = I[U + 1];
          switch (X[n.FIELDS.TYPE]) {
            case d.space:
              if (K = true, this.options.lossy)
                break;
              if (V) {
                (0, w.ensureObject)(T, "spaces", V);
                var de = T.spaces[V].after || "";
                T.spaces[V].after = de + Q;
                var _e = (0, w.getProp)(T, "raws", "spaces", V, "after") || null;
                _e && (T.raws.spaces[V].after = _e + Q);
              } else
                j = j + Q, H = H + Q;
              break;
            case d.asterisk:
              if (ne[n.FIELDS.TYPE] === d.equals)
                T.operator = Q, V = "operator";
              else if ((!T.namespace || V === "namespace" && !K) && ne) {
                j && ((0, w.ensureObject)(T, "spaces", "attribute"), T.spaces.attribute.before = j, j = ""), H && ((0, w.ensureObject)(T, "raws", "spaces", "attribute"), T.raws.spaces.attribute.before = j, H = ""), T.namespace = (T.namespace || "") + Q;
                var be = (0, w.getProp)(T, "raws", "namespace") || null;
                be && (T.raws.namespace += Q), V = "namespace";
              }
              K = false;
              break;
            case d.dollar:
              if (V === "value") {
                var ie = (0, w.getProp)(T, "raws", "value");
                T.value += "$", ie && (T.raws.value = ie + "$");
                break;
              }
            case d.caret:
              ne[n.FIELDS.TYPE] === d.equals && (T.operator = Q, V = "operator"), K = false;
              break;
            case d.combinator:
              if (Q === "~" && ne[n.FIELDS.TYPE] === d.equals && (T.operator = Q, V = "operator"), Q !== "|") {
                K = false;
                break;
              }
              ne[n.FIELDS.TYPE] === d.equals ? (T.operator = Q, V = "operator") : !T.namespace && !T.attribute && (T.namespace = true), K = false;
              break;
            case d.word:
              if (ne && this.content(ne) === "|" && I[U + 2] && I[U + 2][n.FIELDS.TYPE] !== d.equals && !T.operator && !T.namespace)
                T.namespace = Q, V = "namespace";
              else if (!T.attribute || V === "attribute" && !K) {
                j && ((0, w.ensureObject)(T, "spaces", "attribute"), T.spaces.attribute.before = j, j = ""), H && ((0, w.ensureObject)(T, "raws", "spaces", "attribute"), T.raws.spaces.attribute.before = H, H = ""), T.attribute = (T.attribute || "") + Q;
                var ke = (0, w.getProp)(T, "raws", "attribute") || null;
                ke && (T.raws.attribute += Q), V = "attribute";
              } else if (!T.value && T.value !== "" || V === "value" && !(K || T.quoteMark)) {
                var Y = (0, w.unesc)(Q), G = (0, w.getProp)(T, "raws", "value") || "", te = T.value || "";
                T.value = te + Y, T.quoteMark = null, (Y !== Q || G) && ((0, w.ensureObject)(T, "raws"), T.raws.value = (G || te) + Q), V = "value";
              } else {
                var Z = Q === "i" || Q === "I";
                (T.value || T.value === "") && (T.quoteMark || K) ? (T.insensitive = Z, (!Z || Q === "I") && ((0, w.ensureObject)(T, "raws"), T.raws.insensitiveFlag = Q), V = "insensitive", j && ((0, w.ensureObject)(T, "spaces", "insensitive"), T.spaces.insensitive.before = j, j = ""), H && ((0, w.ensureObject)(T, "raws", "spaces", "insensitive"), T.raws.spaces.insensitive.before = H, H = "")) : (T.value || T.value === "") && (V = "value", T.value += Q, T.raws.value && (T.raws.value += Q));
              }
              K = false;
              break;
            case d.str:
              if (!T.attribute || !T.operator)
                return this.error("Expected an attribute followed by an operator preceding the string.", {
                  index: X[n.FIELDS.START_POS]
                });
              var ee = (0, r.unescapeValue)(Q), se = ee.unescaped, ue = ee.quoteMark;
              T.value = se, T.quoteMark = ue, V = "value", (0, w.ensureObject)(T, "raws"), T.raws.value = Q, K = false;
              break;
            case d.equals:
              if (!T.attribute)
                return this.expected("attribute", X[n.FIELDS.START_POS], Q);
              if (T.value)
                return this.error('Unexpected "=" found; an operator was already defined.', {
                  index: X[n.FIELDS.START_POS]
                });
              T.operator = T.operator ? T.operator + Q : Q, V = "operator", K = false;
              break;
            case d.comment:
              if (V)
                if (K || ne && ne[n.FIELDS.TYPE] === d.space || V === "insensitive") {
                  var xe = (0, w.getProp)(T, "spaces", V, "after") || "", ce = (0, w.getProp)(T, "raws", "spaces", V, "after") || xe;
                  (0, w.ensureObject)(T, "raws", "spaces", V), T.raws.spaces[V].after = ce + Q;
                } else {
                  var Te = T[V] || "", ve = (0, w.getProp)(T, "raws", V) || Te;
                  (0, w.ensureObject)(T, "raws"), T.raws[V] = ve + Q;
                }
              else
                H = H + Q;
              break;
            default:
              return this.error('Unexpected "' + Q + '" found.', {
                index: X[n.FIELDS.START_POS]
              });
          }
          U++;
        }
        R(T, "attribute"), R(T, "namespace"), this.newNode(new r.default(T)), this.position++;
      }, F.parseWhitespaceEquivalentTokens = function(I) {
        I < 0 && (I = this.tokens.length);
        var N = this.position, J = [], T = "", U = undefined;
        do
          if (k[this.currToken[n.FIELDS.TYPE]])
            this.options.lossy || (T += this.content());
          else if (this.currToken[n.FIELDS.TYPE] === d.comment) {
            var j = {};
            T && (j.before = T, T = ""), U = new f.default({
              value: this.content(),
              source: P(this.currToken),
              sourceIndex: this.currToken[n.FIELDS.START_POS],
              spaces: j
            }), J.push(U);
          }
        while (++this.position < I);
        if (T) {
          if (U)
            U.spaces.after = T;
          else if (!this.options.lossy) {
            var H = this.tokens[N], V = this.tokens[this.position - 1];
            J.push(new t.default({
              value: "",
              source: S(H[n.FIELDS.START_LINE], H[n.FIELDS.START_COL], V[n.FIELDS.END_LINE], V[n.FIELDS.END_COL]),
              sourceIndex: H[n.FIELDS.START_POS],
              spaces: {
                before: T,
                after: ""
              }
            }));
          }
        }
        return J;
      }, F.convertWhitespaceNodesToSpace = function(I, N) {
        var J = this;
        N === undefined && (N = false);
        var T = "", U = "";
        I.forEach(function(H) {
          var V = J.lossySpace(H.spaces.before, N), K = J.lossySpace(H.rawSpaceBefore, N);
          T += V + J.lossySpace(H.spaces.after, N && V.length === 0), U += V + H.value + J.lossySpace(H.rawSpaceAfter, N && K.length === 0);
        }), U === T && (U = undefined);
        var j = {
          space: T,
          rawSpace: U
        };
        return j;
      }, F.isNamedCombinator = function(I) {
        return I === undefined && (I = this.position), this.tokens[I + 0] && this.tokens[I + 0][n.FIELDS.TYPE] === d.slash && this.tokens[I + 1] && this.tokens[I + 1][n.FIELDS.TYPE] === d.word && this.tokens[I + 2] && this.tokens[I + 2][n.FIELDS.TYPE] === d.slash;
      }, F.namedCombinator = function() {
        if (this.isNamedCombinator()) {
          var I = this.content(this.tokens[this.position + 1]), N = (0, w.unesc)(I).toLowerCase(), J = {};
          N !== I && (J.value = "/" + I + "/");
          var T = new o.default({
            value: "/" + N + "/",
            source: S(this.currToken[n.FIELDS.START_LINE], this.currToken[n.FIELDS.START_COL], this.tokens[this.position + 2][n.FIELDS.END_LINE], this.tokens[this.position + 2][n.FIELDS.END_COL]),
            sourceIndex: this.currToken[n.FIELDS.START_POS],
            raws: J
          });
          return this.position = this.position + 3, T;
        } else
          this.unexpected();
      }, F.combinator = function() {
        var I = this;
        if (this.content() === "|")
          return this.namespace();
        var N = this.locateNextMeaningfulToken(this.position);
        if (N < 0 || this.tokens[N][n.FIELDS.TYPE] === d.comma || this.tokens[N][n.FIELDS.TYPE] === d.closeParenthesis) {
          var J = this.parseWhitespaceEquivalentTokens(N);
          if (J.length > 0) {
            var T = this.current.last;
            if (T) {
              var U = this.convertWhitespaceNodesToSpace(J), j = U.space, H = U.rawSpace;
              H !== undefined && (T.rawSpaceAfter += H), T.spaces.after += j;
            } else
              J.forEach(function(G) {
                return I.newNode(G);
              });
          }
          return;
        }
        var V = this.currToken, K = undefined;
        N > this.position && (K = this.parseWhitespaceEquivalentTokens(N));
        var X;
        if (this.isNamedCombinator() ? X = this.namedCombinator() : this.currToken[n.FIELDS.TYPE] === d.combinator ? (X = new o.default({
          value: this.content(),
          source: P(this.currToken),
          sourceIndex: this.currToken[n.FIELDS.START_POS]
        }), this.position++) : k[this.currToken[n.FIELDS.TYPE]] || K || this.unexpected(), X) {
          if (K) {
            var Q = this.convertWhitespaceNodesToSpace(K), ne = Q.space, de = Q.rawSpace;
            X.spaces.before = ne, X.rawSpaceBefore = de;
          }
        } else {
          var _e = this.convertWhitespaceNodesToSpace(K, true), be = _e.space, ie = _e.rawSpace;
          ie || (ie = be);
          var ke = {}, Y = {
            spaces: {}
          };
          be.endsWith(" ") && ie.endsWith(" ") ? (ke.before = be.slice(0, be.length - 1), Y.spaces.before = ie.slice(0, ie.length - 1)) : be.startsWith(" ") && ie.startsWith(" ") ? (ke.after = be.slice(1), Y.spaces.after = ie.slice(1)) : Y.value = ie, X = new o.default({
            value: " ",
            source: C(V, this.tokens[this.position - 1]),
            sourceIndex: V[n.FIELDS.START_POS],
            spaces: ke,
            raws: Y
          });
        }
        return this.currToken && this.currToken[n.FIELDS.TYPE] === d.space && (X.spaces.after = this.optionalSpace(this.content()), this.position++), this.newNode(X);
      }, F.comma = function() {
        if (this.position === this.tokens.length - 1) {
          this.root.trailingComma = true, this.position++;
          return;
        }
        this.current._inferEndPosition();
        var I = new p.default({
          source: {
            start: M(this.tokens[this.position + 1])
          },
          sourceIndex: this.tokens[this.position + 1][n.FIELDS.START_POS]
        });
        this.current.parent.append(I), this.current = I, this.position++;
      }, F.comment = function() {
        var I = this.currToken;
        this.newNode(new f.default({
          value: this.content(),
          source: P(I),
          sourceIndex: I[n.FIELDS.START_POS]
        })), this.position++;
      }, F.error = function(I, N) {
        throw this.root.error(I, N);
      }, F.missingBackslash = function() {
        return this.error("Expected a backslash preceding the semicolon.", {
          index: this.currToken[n.FIELDS.START_POS]
        });
      }, F.missingParenthesis = function() {
        return this.expected("opening parenthesis", this.currToken[n.FIELDS.START_POS]);
      }, F.missingSquareBracket = function() {
        return this.expected("opening square bracket", this.currToken[n.FIELDS.START_POS]);
      }, F.unexpected = function() {
        return this.error("Unexpected '" + this.content() + "'. Escaping special characters with \\ may help.", this.currToken[n.FIELDS.START_POS]);
      }, F.unexpectedPipe = function() {
        return this.error("Unexpected '|'.", this.currToken[n.FIELDS.START_POS]);
      }, F.namespace = function() {
        var I = this.prevToken && this.content(this.prevToken) || true;
        if (this.nextToken[n.FIELDS.TYPE] === d.word)
          return this.position++, this.word(I);
        if (this.nextToken[n.FIELDS.TYPE] === d.asterisk)
          return this.position++, this.universal(I);
        this.unexpectedPipe();
      }, F.nesting = function() {
        if (this.nextToken) {
          var I = this.content(this.nextToken);
          if (I === "|") {
            this.position++;
            return;
          }
        }
        var N = this.currToken;
        this.newNode(new v2.default({
          value: this.content(),
          source: P(N),
          sourceIndex: N[n.FIELDS.START_POS]
        })), this.position++;
      }, F.parentheses = function() {
        var I = this.current.last, N = 1;
        if (this.position++, I && I.type === _.PSEUDO) {
          var J = new p.default({
            source: {
              start: M(this.tokens[this.position])
            },
            sourceIndex: this.tokens[this.position][n.FIELDS.START_POS]
          }), T = this.current;
          for (I.append(J), this.current = J;this.position < this.tokens.length && N; )
            this.currToken[n.FIELDS.TYPE] === d.openParenthesis && N++, this.currToken[n.FIELDS.TYPE] === d.closeParenthesis && N--, N ? this.parse() : (this.current.source.end = W(this.currToken), this.current.parent.source.end = W(this.currToken), this.position++);
          this.current = T;
        } else {
          for (var U = this.currToken, j = "(", H;this.position < this.tokens.length && N; )
            this.currToken[n.FIELDS.TYPE] === d.openParenthesis && N++, this.currToken[n.FIELDS.TYPE] === d.closeParenthesis && N--, H = this.currToken, j += this.parseParenthesisToken(this.currToken), this.position++;
          I ? I.appendToPropertyAndEscape("value", j, j) : this.newNode(new t.default({
            value: j,
            source: S(U[n.FIELDS.START_LINE], U[n.FIELDS.START_COL], H[n.FIELDS.END_LINE], H[n.FIELDS.END_COL]),
            sourceIndex: U[n.FIELDS.START_POS]
          }));
        }
        if (N)
          return this.expected("closing parenthesis", this.currToken[n.FIELDS.START_POS]);
      }, F.pseudo = function() {
        for (var I = this, N = "", J = this.currToken;this.currToken && this.currToken[n.FIELDS.TYPE] === d.colon; )
          N += this.content(), this.position++;
        if (!this.currToken)
          return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
        if (this.currToken[n.FIELDS.TYPE] === d.word)
          this.splitWord(false, function(T, U) {
            N += T, I.newNode(new e.default({
              value: N,
              source: C(J, I.currToken),
              sourceIndex: J[n.FIELDS.START_POS]
            })), U > 1 && I.nextToken && I.nextToken[n.FIELDS.TYPE] === d.openParenthesis && I.error("Misplaced parenthesis.", {
              index: I.nextToken[n.FIELDS.START_POS]
            });
          });
        else
          return this.expected(["pseudo-class", "pseudo-element"], this.currToken[n.FIELDS.START_POS]);
      }, F.space = function() {
        var I = this.content();
        this.position === 0 || this.prevToken[n.FIELDS.TYPE] === d.comma || this.prevToken[n.FIELDS.TYPE] === d.openParenthesis || this.current.nodes.every(function(N) {
          return N.type === "comment";
        }) ? (this.spaces = this.optionalSpace(I), this.position++) : this.position === this.tokens.length - 1 || this.nextToken[n.FIELDS.TYPE] === d.comma || this.nextToken[n.FIELDS.TYPE] === d.closeParenthesis ? (this.current.last.spaces.after = this.optionalSpace(I), this.position++) : this.combinator();
      }, F.string = function() {
        var I = this.currToken;
        this.newNode(new t.default({
          value: this.content(),
          source: P(I),
          sourceIndex: I[n.FIELDS.START_POS]
        })), this.position++;
      }, F.universal = function(I) {
        var N = this.nextToken;
        if (N && this.content(N) === "|")
          return this.position++, this.namespace();
        var J = this.currToken;
        this.newNode(new i.default({
          value: this.content(),
          source: P(J),
          sourceIndex: J[n.FIELDS.START_POS]
        }), I), this.position++;
      }, F.splitWord = function(I, N) {
        for (var J = this, T = this.nextToken, U = this.content();T && ~[d.dollar, d.caret, d.equals, d.word].indexOf(T[n.FIELDS.TYPE]); ) {
          this.position++;
          var j = this.content();
          if (U += j, j.lastIndexOf("\\") === j.length - 1) {
            var H = this.nextToken;
            H && H[n.FIELDS.TYPE] === d.space && (U += this.requiredSpace(this.content(H)), this.position++);
          }
          T = this.nextToken;
        }
        var V = $(U, ".").filter(function(ne) {
          var de = U[ne - 1] === "\\", _e = /^\d+\.\d+%$/.test(U);
          return !de && !_e;
        }), K = $(U, "#").filter(function(ne) {
          return U[ne - 1] !== "\\";
        }), X = $(U, "#{");
        X.length && (K = K.filter(function(ne) {
          return !~X.indexOf(ne);
        }));
        var Q = (0, m.default)(B([0].concat(V, K)));
        Q.forEach(function(ne, de) {
          var _e = Q[de + 1] || U.length, be = U.slice(ne, _e);
          if (de === 0 && N)
            return N.call(J, be, Q.length);
          var ie, ke = J.currToken, Y = ke[n.FIELDS.START_POS] + Q[de], G = S(ke[1], ke[2] + ne, ke[3], ke[2] + (_e - 1));
          if (~V.indexOf(ne)) {
            var te = {
              value: be.slice(1),
              source: G,
              sourceIndex: Y
            };
            ie = new l.default(R(te, "value"));
          } else if (~K.indexOf(ne)) {
            var Z = {
              value: be.slice(1),
              source: G,
              sourceIndex: Y
            };
            ie = new s.default(R(Z, "value"));
          } else {
            var ee = {
              value: be,
              source: G,
              sourceIndex: Y
            };
            R(ee, "value"), ie = new c.default(ee);
          }
          J.newNode(ie, I), I = null;
        }), this.position++;
      }, F.word = function(I) {
        var N = this.nextToken;
        return N && this.content(N) === "|" ? (this.position++, this.namespace()) : this.splitWord(I);
      }, F.loop = function() {
        for (;this.position < this.tokens.length; )
          this.parse(true);
        return this.current._inferEndPosition(), this.root;
      }, F.parse = function(I) {
        switch (this.currToken[n.FIELDS.TYPE]) {
          case d.space:
            this.space();
            break;
          case d.comment:
            this.comment();
            break;
          case d.openParenthesis:
            this.parentheses();
            break;
          case d.closeParenthesis:
            I && this.missingParenthesis();
            break;
          case d.openSquare:
            this.attribute();
            break;
          case d.dollar:
          case d.caret:
          case d.equals:
          case d.word:
            this.word();
            break;
          case d.colon:
            this.pseudo();
            break;
          case d.comma:
            this.comma();
            break;
          case d.asterisk:
            this.universal();
            break;
          case d.ampersand:
            this.nesting();
            break;
          case d.slash:
          case d.combinator:
            this.combinator();
            break;
          case d.str:
            this.string();
            break;
          case d.closeSquare:
            this.missingSquareBracket();
          case d.semicolon:
            this.missingBackslash();
          default:
            this.unexpected();
        }
      }, F.expected = function(I, N, J) {
        if (Array.isArray(I)) {
          var T = I.pop();
          I = I.join(", ") + " or " + T;
        }
        var U = /^[aeiou]/.test(I[0]) ? "an" : "a";
        return J ? this.error("Expected " + U + " " + I + ', found "' + J + '" instead.', {
          index: N
        }) : this.error("Expected " + U + " " + I + ".", {
          index: N
        });
      }, F.requiredSpace = function(I) {
        return this.options.lossy ? " " : I;
      }, F.optionalSpace = function(I) {
        return this.options.lossy ? "" : I;
      }, F.lossySpace = function(I, N) {
        return this.options.lossy ? N ? " " : "" : I;
      }, F.parseParenthesisToken = function(I) {
        var N = this.content(I);
        return I[n.FIELDS.TYPE] === d.space ? this.requiredSpace(N) : N;
      }, F.newNode = function(I, N) {
        return N && (/^ +$/.test(N) && (this.options.lossy || (this.spaces = (this.spaces || "") + N), N = true), I.namespace = N, R(I, "namespace")), this.spaces && (I.spaces.before = this.spaces, this.spaces = ""), this.current.append(I);
      }, F.content = function(I) {
        return I === undefined && (I = this.currToken), this.css.slice(I[n.FIELDS.START_POS], I[n.FIELDS.END_POS]);
      }, F.locateNextMeaningfulToken = function(I) {
        I === undefined && (I = this.position + 1);
        for (var N = I;N < this.tokens.length; )
          if (q[this.tokens[N][n.FIELDS.TYPE]]) {
            N++;
            continue;
          } else
            return N;
        return -1;
      }, b(L, [{
        key: "currToken",
        get: function() {
          return this.tokens[this.position];
        }
      }, {
        key: "nextToken",
        get: function() {
          return this.tokens[this.position + 1];
        }
      }, {
        key: "prevToken",
        get: function() {
          return this.tokens[this.position - 1];
        }
      }]), L;
    }();
    a.default = z, u.exports = a.default;
  }(mt, mt.exports)), mt.exports;
}
var as;
function Du() {
  return as || (as = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = p(Mu());
    function p(f) {
      return f && f.__esModule ? f : { default: f };
    }
    var l = /* @__PURE__ */ function() {
      function f(c, t) {
        this.func = c || function() {}, this.funcRes = null, this.options = t;
      }
      var s = f.prototype;
      return s._shouldUpdateSelector = function(t, e) {
        e === undefined && (e = {});
        var r = Object.assign({}, this.options, e);
        return r.updateSelector === false ? false : typeof t != "string";
      }, s._isLossy = function(t) {
        t === undefined && (t = {});
        var e = Object.assign({}, this.options, t);
        return e.lossless === false;
      }, s._root = function(t, e) {
        e === undefined && (e = {});
        var r = new h.default(t, this._parseOptions(e));
        return r.root;
      }, s._parseOptions = function(t) {
        return {
          lossy: this._isLossy(t)
        };
      }, s._run = function(t, e) {
        var r = this;
        return e === undefined && (e = {}), new Promise(function(i, o) {
          try {
            var v2 = r._root(t, e);
            Promise.resolve(r.func(v2)).then(function(m) {
              var n = undefined;
              return r._shouldUpdateSelector(t, e) && (n = v2.toString(), t.selector = n), {
                transform: m,
                root: v2,
                string: n
              };
            }).then(i, o);
          } catch (m) {
            o(m);
            return;
          }
        });
      }, s._runSync = function(t, e) {
        e === undefined && (e = {});
        var r = this._root(t, e), i = this.func(r);
        if (i && typeof i.then == "function")
          throw new Error("Selector processor returned a promise to a synchronous call.");
        var o = undefined;
        return e.updateSelector && typeof t != "string" && (o = r.toString(), t.selector = o), {
          transform: i,
          root: r,
          string: o
        };
      }, s.ast = function(t, e) {
        return this._run(t, e).then(function(r) {
          return r.root;
        });
      }, s.astSync = function(t, e) {
        return this._runSync(t, e).root;
      }, s.transform = function(t, e) {
        return this._run(t, e).then(function(r) {
          return r.transform;
        });
      }, s.transformSync = function(t, e) {
        return this._runSync(t, e).transform;
      }, s.process = function(t, e) {
        return this._run(t, e).then(function(r) {
          return r.string || r.root.toString();
        });
      }, s.processSync = function(t, e) {
        var r = this._runSync(t, e);
        return r.string || r.root.toString();
      }, f;
    }();
    a.default = l, u.exports = a.default;
  }(gt, gt.exports)), gt.exports;
}
var rn = {};
var Ie = {};
var ss;
function qu() {
  if (ss)
    return Ie;
  ss = 1, Ie.__esModule = true, Ie.universal = Ie.tag = Ie.string = Ie.selector = Ie.root = Ie.pseudo = Ie.nesting = Ie.id = Ie.comment = Ie.combinator = Ie.className = Ie.attribute = undefined;
  var u = o(Il()), a = o(kl()), h = o(Dl()), p = o(Pl()), l = o(El()), f = o(ql()), s = o(Cl()), c = o(xl()), t = o(Ol()), e = o(Al()), r = o(Tl()), i = o(Ml());
  function o(b) {
    return b && b.__esModule ? b : { default: b };
  }
  var v2 = function(k) {
    return new u.default(k);
  };
  Ie.attribute = v2;
  var m = function(k) {
    return new a.default(k);
  };
  Ie.className = m;
  var n = function(k) {
    return new h.default(k);
  };
  Ie.combinator = n;
  var d = function(k) {
    return new p.default(k);
  };
  Ie.comment = d;
  var _ = function(k) {
    return new l.default(k);
  };
  Ie.id = _;
  var w = function(k) {
    return new f.default(k);
  };
  Ie.nesting = w;
  var y = function(k) {
    return new s.default(k);
  };
  Ie.pseudo = y;
  var x = function(k) {
    return new c.default(k);
  };
  Ie.root = x;
  var g = function(k) {
    return new t.default(k);
  };
  Ie.selector = g;
  var O = function(k) {
    return new e.default(k);
  };
  Ie.string = O;
  var A = function(k) {
    return new r.default(k);
  };
  Ie.tag = A;
  var E = function(k) {
    return new i.default(k);
  };
  return Ie.universal = E, Ie;
}
var Pe = {};
var os;
function Lu() {
  if (os)
    return Pe;
  os = 1, Pe.__esModule = true, Pe.isComment = Pe.isCombinator = Pe.isClassName = Pe.isAttribute = undefined, Pe.isContainer = y, Pe.isIdentifier = undefined, Pe.isNamespace = x, Pe.isNesting = undefined, Pe.isNode = p, Pe.isPseudo = undefined, Pe.isPseudoClass = w, Pe.isPseudoElement = _, Pe.isUniversal = Pe.isTag = Pe.isString = Pe.isSelector = Pe.isRoot = undefined;
  var u = Fe(), a, h = (a = {}, a[u.ATTRIBUTE] = true, a[u.CLASS] = true, a[u.COMBINATOR] = true, a[u.COMMENT] = true, a[u.ID] = true, a[u.NESTING] = true, a[u.PSEUDO] = true, a[u.ROOT] = true, a[u.SELECTOR] = true, a[u.STRING] = true, a[u.TAG] = true, a[u.UNIVERSAL] = true, a);
  function p(g) {
    return typeof g == "object" && h[g.type];
  }
  function l(g, O) {
    return p(O) && O.type === g;
  }
  var f = l.bind(null, u.ATTRIBUTE);
  Pe.isAttribute = f;
  var s = l.bind(null, u.CLASS);
  Pe.isClassName = s;
  var c = l.bind(null, u.COMBINATOR);
  Pe.isCombinator = c;
  var t = l.bind(null, u.COMMENT);
  Pe.isComment = t;
  var e = l.bind(null, u.ID);
  Pe.isIdentifier = e;
  var r = l.bind(null, u.NESTING);
  Pe.isNesting = r;
  var i = l.bind(null, u.PSEUDO);
  Pe.isPseudo = i;
  var o = l.bind(null, u.ROOT);
  Pe.isRoot = o;
  var v2 = l.bind(null, u.SELECTOR);
  Pe.isSelector = v2;
  var m = l.bind(null, u.STRING);
  Pe.isString = m;
  var n = l.bind(null, u.TAG);
  Pe.isTag = n;
  var d = l.bind(null, u.UNIVERSAL);
  Pe.isUniversal = d;
  function _(g) {
    return i(g) && g.value && (g.value.startsWith("::") || g.value.toLowerCase() === ":before" || g.value.toLowerCase() === ":after" || g.value.toLowerCase() === ":first-letter" || g.value.toLowerCase() === ":first-line");
  }
  function w(g) {
    return i(g) && !_(g);
  }
  function y(g) {
    return !!(p(g) && g.walk);
  }
  function x(g) {
    return f(g) || n(g);
  }
  return Pe;
}
var ls;
function Nu() {
  return ls || (ls = 1, function(u) {
    u.__esModule = true;
    var a = Fe();
    Object.keys(a).forEach(function(l) {
      l === "default" || l === "__esModule" || l in u && u[l] === a[l] || (u[l] = a[l]);
    });
    var h = qu();
    Object.keys(h).forEach(function(l) {
      l === "default" || l === "__esModule" || l in u && u[l] === h[l] || (u[l] = h[l]);
    });
    var p = Lu();
    Object.keys(p).forEach(function(l) {
      l === "default" || l === "__esModule" || l in u && u[l] === p[l] || (u[l] = p[l]);
    });
  }(rn)), rn;
}
var us;
function Fu() {
  return us || (us = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = s(Du()), p = f(Nu());
    function l(e) {
      if (typeof WeakMap != "function")
        return null;
      var r = /* @__PURE__ */ new WeakMap, i = /* @__PURE__ */ new WeakMap;
      return (l = function(v2) {
        return v2 ? i : r;
      })(e);
    }
    function f(e, r) {
      if (e && e.__esModule)
        return e;
      if (e === null || typeof e != "object" && typeof e != "function")
        return { default: e };
      var i = l(r);
      if (i && i.has(e))
        return i.get(e);
      var o = {}, v2 = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var m in e)
        if (m !== "default" && Object.prototype.hasOwnProperty.call(e, m)) {
          var n = v2 ? Object.getOwnPropertyDescriptor(e, m) : null;
          n && (n.get || n.set) ? Object.defineProperty(o, m, n) : o[m] = e[m];
        }
      return o.default = e, i && i.set(e, o), o;
    }
    function s(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var c = function(r) {
      return new h.default(r);
    };
    Object.assign(c, p), delete c.__esModule;
    var t = c;
    a.default = t, u.exports = a.default;
  }(vt, vt.exports)), vt.exports;
}
var $u = Fu();
var $i = /* @__PURE__ */ He($u);
var fs = (u) => u.replace(/-(\w|$)/g, (a, h) => h.toUpperCase());
var Uu = (u) => {
  const a = u.toLowerCase();
  return a.startsWith("--") ? a : a.startsWith("-ms-") ? fs(a.slice(1)) : fs(a);
};
function zu(u) {
  return u.replaceAll(/\\[0-9]|\\/g, "");
}
var Wu = (u, a) => {
  u.walkRules((h) => {
    var p;
    ((p = h.parent) == null ? undefined : p.type) !== "atrule" && $i((l) => {
      let f = false;
      l.walkPseudos(() => {
        f = true;
      }), f || a(h);
    }).processSync(h.selector);
  });
};
function Vu(u, a) {
  let p = [...u.split(" ")];
  const l = {};
  return Wu(a, (f) => {
    const s = [];
    $i((c) => {
      c.walkClasses((t) => {
        s.push(zu(t.value));
      });
    }).processSync(f.selector), p = p.filter((c) => !s.includes(c)), f.walkDecls((c) => {
      l[Uu(c.prop)] = c.value + (c.important ? "!important" : "");
    });
  }), {
    styles: l,
    residualClassName: p.join(" ")
  };
}
var ju = (u) => {
  u.walkDecls((a) => {
    const h = /rgb\(\s*(\d+)\s*(\d+)\s*(\d+)(?:\s*\/\s*([\d%.]+))?\s*\)/g;
    a.value = a.value.replaceAll(h, (p, l, f, s, c) => {
      const t = c === "1" || typeof c > "u" ? "" : `,${c}`;
      return `rgb(${l},${f},${s}${t})`;
    });
  });
};
var Bu = (u) => {
  const a = [], h = [], p = $i();
  return u.walkAtRules((l) => {
    const f = l.clone();
    f.walkRules((c) => {
      const t = p.astSync(c.selector);
      t.walkClasses((r) => {
        h.push(r.value), cs(r);
      });
      const e = c.clone({ selector: t.toString() });
      e.walkDecls((r) => {
        r.important = true;
      }), c.replaceWith(e);
    });
    const s = a.find((c) => c instanceof wl && c.params === f.params);
    s ? s.append(f.nodes) : a.push(f);
  }), u.walkRules((l) => {
    if (l.parent && l.parent.type !== "root")
      return;
    const f = p.astSync(l.selector);
    let s = false;
    if (f.walkPseudos(() => {
      s = true;
    }), !!s && (f.walkClasses((c) => {
      h.push(c.value), cs(c);
    }), s)) {
      const c = l.clone({ selector: f.toString() });
      c.walkDecls((t) => {
        t.important = true;
      }), a.push(c);
    }
  }), {
    nonInlinableClasses: h,
    sanitizedRules: a
  };
};
var cs = (u) => {
  u.replaceWith(u.clone({
    value: _l(u.value)
  }));
};
var Gu = (u, a) => {
  const h = {};
  let p = [], l = [];
  if (u.props.className) {
    const s = a.generateRootForClasses(u.props.className.split(" "));
    ju(s), {
      sanitizedRules: l,
      nonInlinableClasses: p
    } = Bu(s);
    const { styles: c, residualClassName: t } = Vu(u.props.className, s);
    if (h.style = {
      ...c,
      ...u.props.style
    }, !bl(u))
      if (t.trim().length > 0) {
        h.className = t;
        for (const e of p)
          h.className = h.className.replace(e, _l(e));
      } else
        h.className = undefined;
  }
  const f = {
    ...u.props,
    ...h
  };
  return {
    elementWithInlinedStyles: ot.cloneElement(u, f, f.children),
    nonInlinableClasses: p,
    nonInlineStyleNodes: l
  };
};
var nn = {};
var ds;
function Yu() {
  return ds || (ds = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return p;
      }
    });
    let a = {
      atrule: [
        "name",
        "params"
      ],
      rule: [
        "selector"
      ]
    }, h = new Set(Object.keys(a));
    function p() {
      function l(f) {
        let s = null;
        f.each((c) => {
          if (!h.has(c.type)) {
            s = null;
            return;
          }
          if (s === null) {
            s = c;
            return;
          }
          let t = a[c.type];
          var e, r;
          c.type === "atrule" && c.name === "font-face" ? s = c : t.every((i) => ((e = c[i]) !== null && e !== undefined ? e : "").replace(/\s+/g, " ") === ((r = s[i]) !== null && r !== undefined ? r : "").replace(/\s+/g, " ")) ? (c.nodes && s.append(c.nodes), c.remove()) : s = c;
        }), f.each((c) => {
          c.type === "atrule" && l(c);
        });
      }
      return (f) => {
        l(f);
      };
    }
  }(nn)), nn;
}
var Qu = Yu();
var Hu = /* @__PURE__ */ He(Qu);
var an = {};
var ps;
function Ju() {
  return ps || (ps = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a() {
      return (l) => {
        l.walkRules((f) => {
          let s = /* @__PURE__ */ new Map, c = /* @__PURE__ */ new Set([]), t = /* @__PURE__ */ new Map;
          f.walkDecls((e) => {
            if (e.parent === f) {
              if (s.has(e.prop)) {
                if (s.get(e.prop).value === e.value) {
                  c.add(s.get(e.prop)), s.set(e.prop, e);
                  return;
                }
                t.has(e.prop) || t.set(e.prop, /* @__PURE__ */ new Set), t.get(e.prop).add(s.get(e.prop)), t.get(e.prop).add(e);
              }
              s.set(e.prop, e);
            }
          });
          for (let e of c)
            e.remove();
          for (let e of t.values()) {
            let r = /* @__PURE__ */ new Map;
            for (let i of e) {
              let o = p(i.value);
              o !== null && (r.has(o) || r.set(o, /* @__PURE__ */ new Set), r.get(o).add(i));
            }
            for (let i of r.values()) {
              let o = Array.from(i).slice(0, -1);
              for (let v2 of o)
                v2.remove();
            }
          }
        });
      };
    }
    let h = Symbol("unitless-number");
    function p(l) {
      let f = /^-?\d*.?\d+([\w%]+)?$/g.exec(l);
      if (f) {
        var s;
        return (s = f[1]) !== null && s !== undefined ? s : h;
      }
      return null;
    }
  }(an)), an;
}
var Ku = Ju();
var Xu = /* @__PURE__ */ He(Ku);
var sn = {};
var on = { exports: {} };
var hs;
function Nl() {
  return hs || (hs = 1, function(u, a) {
    (function(h, p) {
      u.exports = function(l, f, s, c, t) {
        for (f = f.split ? f.split(".") : f, c = 0;c < f.length; c++)
          l = l ? l[f[c]] : t;
        return l === t ? s : l;
      };
    })();
  }(on)), on.exports;
}
var ln = { exports: {} };
var vs;
function Zu() {
  return vs || (vs = 1, function(u) {
    (function() {
      function a(l, f, s) {
        if (!l)
          return null;
        a.caseSensitive || (l = l.toLowerCase());
        var c = a.threshold === null ? null : a.threshold * l.length, t = a.thresholdAbsolute, e;
        c !== null && t !== null ? e = Math.min(c, t) : c !== null ? e = c : t !== null ? e = t : e = null;
        var r, i, o, v2, m, n = f.length;
        for (m = 0;m < n; m++)
          if (i = f[m], s && (i = i[s]), !!i && (a.caseSensitive ? o = i : o = i.toLowerCase(), v2 = p(l, o, e), (e === null || v2 < e) && (e = v2, s && a.returnWinningObject ? r = f[m] : r = i, a.returnFirstMatch)))
            return r;
        return r || a.nullResultValue;
      }
      a.threshold = 0.4, a.thresholdAbsolute = 20, a.caseSensitive = false, a.nullResultValue = null, a.returnWinningObject = null, a.returnFirstMatch = false, u.exports ? u.exports = a : window.didYouMean = a;
      var h = Math.pow(2, 32) - 1;
      function p(l, f, s) {
        s = s || s === 0 ? s : h;
        var c = l.length, t = f.length;
        if (c === 0)
          return Math.min(s + 1, t);
        if (t === 0)
          return Math.min(s + 1, c);
        if (Math.abs(c - t) > s)
          return s + 1;
        var e = [], r, i, o, v2, m;
        for (r = 0;r <= t; r++)
          e[r] = [r];
        for (i = 0;i <= c; i++)
          e[0][i] = i;
        for (r = 1;r <= t; r++) {
          for (o = h, v2 = 1, r > s && (v2 = r - s), m = t + 1, m > s + r && (m = s + r), i = 1;i <= c; i++)
            i < v2 || i > m ? e[r][i] = s + 1 : f.charAt(r - 1) === l.charAt(i - 1) ? e[r][i] = e[r - 1][i - 1] : e[r][i] = Math.min(e[r - 1][i - 1] + 1, Math.min(e[r][i - 1] + 1, e[r - 1][i] + 1)), e[r][i] < o && (o = e[r][i]);
          if (o > s)
            return s + 1;
        }
        return e[t][c];
      }
    })();
  }(ln)), ln.exports;
}
var un = {};
var fn = {};
var gs;
function ut() {
  return gs || (gs = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      if (Object.prototype.toString.call(h) !== "[object Object]")
        return false;
      const p = Object.getPrototypeOf(h);
      return p === null || Object.getPrototypeOf(p) === null;
    }
  }(fn)), fn;
}
var ms;
function pr() {
  return ms || (ms = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = /* @__PURE__ */ p(Be()), h = /* @__PURE__ */ p(ut());
    function p(f) {
      return f && f.__esModule ? f : {
        default: f
      };
    }
    function l(f) {
      return [
        "fontSize",
        "outline"
      ].includes(f) ? (s) => (typeof s == "function" && (s = s({})), Array.isArray(s) && (s = s[0]), s) : f === "fontFamily" ? (s) => {
        typeof s == "function" && (s = s({}));
        let c = Array.isArray(s) && (0, h.default)(s[1]) ? s[0] : s;
        return Array.isArray(c) ? c.join(", ") : c;
      } : [
        "boxShadow",
        "transitionProperty",
        "transitionDuration",
        "transitionDelay",
        "transitionTimingFunction",
        "backgroundImage",
        "backgroundSize",
        "backgroundColor",
        "cursor",
        "animation"
      ].includes(f) ? (s) => (typeof s == "function" && (s = s({})), Array.isArray(s) && (s = s.join(", ")), s) : [
        "gridTemplateColumns",
        "gridTemplateRows",
        "objectPosition"
      ].includes(f) ? (s) => (typeof s == "function" && (s = s({})), typeof s == "string" && (s = a.default.list.comma(s).join(" ")), s) : (s, c = {}) => (typeof s == "function" && (s = s(c)), s);
    }
  }(un)), un;
}
var cn;
var ys;
function ef() {
  if (ys)
    return cn;
  ys = 1;
  var u = 40, a = 41, h = 39, p = 34, l = 92, f = 47, s = 44, c = 58, t = 42, e = 117, r = 85, i = 43, o = /^[a-f0-9?-]+$/i;
  return cn = function(v2) {
    for (var m = [], n = v2, d, _, w, y, x, g, O, A, E = 0, b = n.charCodeAt(E), k = n.length, q = [
      {
        nodes: m
      }
    ], M = 0, W, S = "", P = "", C = "";E < k; )
      if (b <= 32) {
        d = E;
        do
          d += 1, b = n.charCodeAt(d);
        while (b <= 32);
        y = n.slice(E, d), w = m[m.length - 1], b === a && M ? C = y : w && w.type === "div" ? (w.after = y, w.sourceEndIndex += y.length) : b === s || b === c || b === f && n.charCodeAt(d + 1) !== t && (!W || W && W.type === "function" && false) ? P = y : m.push({
          type: "space",
          sourceIndex: E,
          sourceEndIndex: d,
          value: y
        }), E = d;
      } else if (b === h || b === p) {
        d = E, _ = b === h ? "'" : '"', y = {
          type: "string",
          sourceIndex: E,
          quote: _
        };
        do
          if (x = false, d = n.indexOf(_, d + 1), ~d)
            for (g = d;n.charCodeAt(g - 1) === l; )
              g -= 1, x = !x;
          else
            n += _, d = n.length - 1, y.unclosed = true;
        while (x);
        y.value = n.slice(E + 1, d), y.sourceEndIndex = y.unclosed ? d : d + 1, m.push(y), E = d + 1, b = n.charCodeAt(E);
      } else if (b === f && n.charCodeAt(E + 1) === t)
        d = n.indexOf("*/", E), y = {
          type: "comment",
          sourceIndex: E,
          sourceEndIndex: d + 2
        }, d === -1 && (y.unclosed = true, d = n.length, y.sourceEndIndex = d), y.value = n.slice(E + 2, d), m.push(y), E = d + 2, b = n.charCodeAt(E);
      else if ((b === f || b === t) && W && W.type === "function")
        y = n[E], m.push({
          type: "word",
          sourceIndex: E - P.length,
          sourceEndIndex: E + y.length,
          value: y
        }), E += 1, b = n.charCodeAt(E);
      else if (b === f || b === s || b === c)
        y = n[E], m.push({
          type: "div",
          sourceIndex: E - P.length,
          sourceEndIndex: E + y.length,
          value: y,
          before: P,
          after: ""
        }), P = "", E += 1, b = n.charCodeAt(E);
      else if (u === b) {
        d = E;
        do
          d += 1, b = n.charCodeAt(d);
        while (b <= 32);
        if (A = E, y = {
          type: "function",
          sourceIndex: E - S.length,
          value: S,
          before: n.slice(A + 1, d)
        }, E = d, S === "url" && b !== h && b !== p) {
          d -= 1;
          do
            if (x = false, d = n.indexOf(")", d + 1), ~d)
              for (g = d;n.charCodeAt(g - 1) === l; )
                g -= 1, x = !x;
            else
              n += ")", d = n.length - 1, y.unclosed = true;
          while (x);
          O = d;
          do
            O -= 1, b = n.charCodeAt(O);
          while (b <= 32);
          A < O ? (E !== O + 1 ? y.nodes = [
            {
              type: "word",
              sourceIndex: E,
              sourceEndIndex: O + 1,
              value: n.slice(E, O + 1)
            }
          ] : y.nodes = [], y.unclosed && O + 1 !== d ? (y.after = "", y.nodes.push({
            type: "space",
            sourceIndex: O + 1,
            sourceEndIndex: d,
            value: n.slice(O + 1, d)
          })) : (y.after = n.slice(O + 1, d), y.sourceEndIndex = d)) : (y.after = "", y.nodes = []), E = d + 1, y.sourceEndIndex = y.unclosed ? d : E, b = n.charCodeAt(E), m.push(y);
        } else
          M += 1, y.after = "", y.sourceEndIndex = E + 1, m.push(y), q.push(y), m = y.nodes = [], W = y;
        S = "";
      } else if (a === b && M)
        E += 1, b = n.charCodeAt(E), W.after = C, W.sourceEndIndex += C.length, C = "", M -= 1, q[q.length - 1].sourceEndIndex = E, q.pop(), W = q[M], m = W.nodes;
      else {
        d = E;
        do
          b === l && (d += 1), d += 1, b = n.charCodeAt(d);
        while (d < k && !(b <= 32 || b === h || b === p || b === s || b === c || b === f || b === u || b === t && W && W.type === "function" || b === f && W.type === "function" || b === a && M));
        y = n.slice(E, d), u === b ? S = y : (e === y.charCodeAt(0) || r === y.charCodeAt(0)) && i === y.charCodeAt(1) && o.test(y.slice(2)) ? m.push({
          type: "unicode-range",
          sourceIndex: E,
          sourceEndIndex: d,
          value: y
        }) : m.push({
          type: "word",
          sourceIndex: E,
          sourceEndIndex: d,
          value: y
        }), E = d;
      }
    for (E = q.length - 1;E; E -= 1)
      q[E].unclosed = true, q[E].sourceEndIndex = n.length;
    return q[0].nodes;
  }, cn;
}
var dn;
var ws;
function tf() {
  return ws || (ws = 1, dn = function u(a, h, p) {
    var l, f, s, c;
    for (l = 0, f = a.length;l < f; l += 1)
      s = a[l], p || (c = h(s, l, a)), c !== false && s.type === "function" && Array.isArray(s.nodes) && u(s.nodes, h, p), p && h(s, l, a);
  }), dn;
}
var pn;
var bs;
function rf() {
  if (bs)
    return pn;
  bs = 1;
  function u(h, p) {
    var { type: l, value: f } = h, s, c;
    return p && (c = p(h)) !== undefined ? c : l === "word" || l === "space" ? f : l === "string" ? (s = h.quote || "", s + f + (h.unclosed ? "" : s)) : l === "comment" ? "/*" + f + (h.unclosed ? "" : "*/") : l === "div" ? (h.before || "") + f + (h.after || "") : Array.isArray(h.nodes) ? (s = a(h.nodes, p), l !== "function" ? s : f + "(" + (h.before || "") + s + (h.after || "") + (h.unclosed ? "" : ")")) : f;
  }
  function a(h, p) {
    var l, f;
    if (Array.isArray(h)) {
      for (l = "", f = h.length - 1;~f; f -= 1)
        l = u(h[f], p) + l;
      return l;
    }
    return u(h, p);
  }
  return pn = a, pn;
}
var hn;
var _s;
function nf() {
  if (_s)
    return hn;
  _s = 1;
  var u = 45, a = 43, h = 46, p = 101, l = 69;
  function f(s) {
    var c = s.charCodeAt(0), t;
    if (c === a || c === u) {
      if (t = s.charCodeAt(1), t >= 48 && t <= 57)
        return true;
      var e = s.charCodeAt(2);
      return t === h && e >= 48 && e <= 57;
    }
    return c === h ? (t = s.charCodeAt(1), t >= 48 && t <= 57) : c >= 48 && c <= 57;
  }
  return hn = function(s) {
    var c = 0, t = s.length, e, r, i;
    if (t === 0 || !f(s))
      return false;
    for (e = s.charCodeAt(c), (e === a || e === u) && c++;c < t && (e = s.charCodeAt(c), !(e < 48 || e > 57)); )
      c += 1;
    if (e = s.charCodeAt(c), r = s.charCodeAt(c + 1), e === h && r >= 48 && r <= 57)
      for (c += 2;c < t && (e = s.charCodeAt(c), !(e < 48 || e > 57)); )
        c += 1;
    if (e = s.charCodeAt(c), r = s.charCodeAt(c + 1), i = s.charCodeAt(c + 2), (e === p || e === l) && (r >= 48 && r <= 57 || (r === a || r === u) && i >= 48 && i <= 57))
      for (c += r === a || r === u ? 3 : 2;c < t && (e = s.charCodeAt(c), !(e < 48 || e > 57)); )
        c += 1;
    return {
      number: s.slice(0, c),
      unit: s.slice(c)
    };
  }, hn;
}
var vn;
var Ss;
function af() {
  if (Ss)
    return vn;
  Ss = 1;
  var u = ef(), a = tf(), h = rf();
  function p(l) {
    return this instanceof p ? (this.nodes = u(l), this) : new p(l);
  }
  return p.prototype.toString = function() {
    return Array.isArray(this.nodes) ? h(this.nodes) : "";
  }, p.prototype.walk = function(l, f) {
    return a(this.nodes, l, f), this;
  }, p.unit = nf(), p.walk = a, p.stringify = h, vn = p, vn;
}
var gn = {};
var xs;
function Ui() {
  return xs || (xs = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(c, t) {
      for (var e in t)
        Object.defineProperty(c, e, {
          enumerable: true,
          get: t[e]
        });
    }
    a(u, {
      normalizeScreens: function() {
        return h;
      },
      isScreenSortable: function() {
        return p;
      },
      compareScreens: function() {
        return l;
      },
      toScreen: function() {
        return f;
      }
    });
    function h(c, t = true) {
      return Array.isArray(c) ? c.map((e) => {
        if (t && Array.isArray(e))
          throw new Error("The tuple syntax is not supported for `screens`.");
        if (typeof e == "string")
          return {
            name: e.toString(),
            not: false,
            values: [
              {
                min: e,
                max: undefined
              }
            ]
          };
        let [r, i] = e;
        return r = r.toString(), typeof i == "string" ? {
          name: r,
          not: false,
          values: [
            {
              min: i,
              max: undefined
            }
          ]
        } : Array.isArray(i) ? {
          name: r,
          not: false,
          values: i.map((o) => s(o))
        } : {
          name: r,
          not: false,
          values: [
            s(i)
          ]
        };
      }) : h(Object.entries(c ?? {}), false);
    }
    function p(c) {
      return c.values.length !== 1 ? {
        result: false,
        reason: "multiple-values"
      } : c.values[0].raw !== undefined ? {
        result: false,
        reason: "raw-values"
      } : c.values[0].min !== undefined && c.values[0].max !== undefined ? {
        result: false,
        reason: "min-and-max"
      } : {
        result: true,
        reason: null
      };
    }
    function l(c, t, e) {
      let r = f(t, c), i = f(e, c), o = p(r), v2 = p(i);
      if (o.reason === "multiple-values" || v2.reason === "multiple-values")
        throw new Error("Attempted to sort a screen with multiple values. This should never happen. Please open a bug report.");
      if (o.reason === "raw-values" || v2.reason === "raw-values")
        throw new Error("Attempted to sort a screen with raw values. This should never happen. Please open a bug report.");
      if (o.reason === "min-and-max" || v2.reason === "min-and-max")
        throw new Error("Attempted to sort a screen with both min and max values. This should never happen. Please open a bug report.");
      let { min: m, max: n } = r.values[0], { min: d, max: _ } = i.values[0];
      t.not && ([m, n] = [
        n,
        m
      ]), e.not && ([d, _] = [
        _,
        d
      ]), m = m === undefined ? m : parseFloat(m), n = n === undefined ? n : parseFloat(n), d = d === undefined ? d : parseFloat(d), _ = _ === undefined ? _ : parseFloat(_);
      let [w, y] = c === "min" ? [
        m,
        d
      ] : [
        _,
        n
      ];
      return w - y;
    }
    function f(c, t) {
      return typeof c == "object" ? c : {
        name: "arbitrary-screen",
        values: [
          {
            [t]: c
          }
        ]
      };
    }
    function s({ "min-width": c, min: t = c, max: e, raw: r } = {}) {
      return {
        min: t,
        max: e,
        raw: r
      };
    }
  }(gn)), gn;
}
var mn = {};
var Os;
function zi() {
  return Os || (Os = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      return h = Array.isArray(h) ? h : [
        h
      ], h.map((p) => {
        let l = p.values.map((f) => f.raw !== undefined ? f.raw : [
          f.min && `(min-width: ${f.min})`,
          f.max && `(max-width: ${f.max})`
        ].filter(Boolean).join(" and "));
        return p.not ? `not all and ${l}` : l;
      }).join(", ");
    }
  }(mn)), mn;
}
var yn = {};
var ks;
function Wi() {
  return ks || (ks = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "toPath", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      if (Array.isArray(h))
        return h;
      let p = h.split("[").length - 1, l = h.split("]").length - 1;
      if (p !== l)
        throw new Error(`Path is invalid. Has unbalanced brackets: ${h}`);
      return h.split(/\.(?![^\[]*\])|[\[\]]/g).filter(Boolean);
    }
  }(yn)), yn;
}
var wn = {};
var bn = {};
var _n = {};
var Ps;
function sf() {
  return Ps || (Ps = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    const a = {
      aliceblue: [
        240,
        248,
        255
      ],
      antiquewhite: [
        250,
        235,
        215
      ],
      aqua: [
        0,
        255,
        255
      ],
      aquamarine: [
        127,
        255,
        212
      ],
      azure: [
        240,
        255,
        255
      ],
      beige: [
        245,
        245,
        220
      ],
      bisque: [
        255,
        228,
        196
      ],
      black: [
        0,
        0,
        0
      ],
      blanchedalmond: [
        255,
        235,
        205
      ],
      blue: [
        0,
        0,
        255
      ],
      blueviolet: [
        138,
        43,
        226
      ],
      brown: [
        165,
        42,
        42
      ],
      burlywood: [
        222,
        184,
        135
      ],
      cadetblue: [
        95,
        158,
        160
      ],
      chartreuse: [
        127,
        255,
        0
      ],
      chocolate: [
        210,
        105,
        30
      ],
      coral: [
        255,
        127,
        80
      ],
      cornflowerblue: [
        100,
        149,
        237
      ],
      cornsilk: [
        255,
        248,
        220
      ],
      crimson: [
        220,
        20,
        60
      ],
      cyan: [
        0,
        255,
        255
      ],
      darkblue: [
        0,
        0,
        139
      ],
      darkcyan: [
        0,
        139,
        139
      ],
      darkgoldenrod: [
        184,
        134,
        11
      ],
      darkgray: [
        169,
        169,
        169
      ],
      darkgreen: [
        0,
        100,
        0
      ],
      darkgrey: [
        169,
        169,
        169
      ],
      darkkhaki: [
        189,
        183,
        107
      ],
      darkmagenta: [
        139,
        0,
        139
      ],
      darkolivegreen: [
        85,
        107,
        47
      ],
      darkorange: [
        255,
        140,
        0
      ],
      darkorchid: [
        153,
        50,
        204
      ],
      darkred: [
        139,
        0,
        0
      ],
      darksalmon: [
        233,
        150,
        122
      ],
      darkseagreen: [
        143,
        188,
        143
      ],
      darkslateblue: [
        72,
        61,
        139
      ],
      darkslategray: [
        47,
        79,
        79
      ],
      darkslategrey: [
        47,
        79,
        79
      ],
      darkturquoise: [
        0,
        206,
        209
      ],
      darkviolet: [
        148,
        0,
        211
      ],
      deeppink: [
        255,
        20,
        147
      ],
      deepskyblue: [
        0,
        191,
        255
      ],
      dimgray: [
        105,
        105,
        105
      ],
      dimgrey: [
        105,
        105,
        105
      ],
      dodgerblue: [
        30,
        144,
        255
      ],
      firebrick: [
        178,
        34,
        34
      ],
      floralwhite: [
        255,
        250,
        240
      ],
      forestgreen: [
        34,
        139,
        34
      ],
      fuchsia: [
        255,
        0,
        255
      ],
      gainsboro: [
        220,
        220,
        220
      ],
      ghostwhite: [
        248,
        248,
        255
      ],
      gold: [
        255,
        215,
        0
      ],
      goldenrod: [
        218,
        165,
        32
      ],
      gray: [
        128,
        128,
        128
      ],
      green: [
        0,
        128,
        0
      ],
      greenyellow: [
        173,
        255,
        47
      ],
      grey: [
        128,
        128,
        128
      ],
      honeydew: [
        240,
        255,
        240
      ],
      hotpink: [
        255,
        105,
        180
      ],
      indianred: [
        205,
        92,
        92
      ],
      indigo: [
        75,
        0,
        130
      ],
      ivory: [
        255,
        255,
        240
      ],
      khaki: [
        240,
        230,
        140
      ],
      lavender: [
        230,
        230,
        250
      ],
      lavenderblush: [
        255,
        240,
        245
      ],
      lawngreen: [
        124,
        252,
        0
      ],
      lemonchiffon: [
        255,
        250,
        205
      ],
      lightblue: [
        173,
        216,
        230
      ],
      lightcoral: [
        240,
        128,
        128
      ],
      lightcyan: [
        224,
        255,
        255
      ],
      lightgoldenrodyellow: [
        250,
        250,
        210
      ],
      lightgray: [
        211,
        211,
        211
      ],
      lightgreen: [
        144,
        238,
        144
      ],
      lightgrey: [
        211,
        211,
        211
      ],
      lightpink: [
        255,
        182,
        193
      ],
      lightsalmon: [
        255,
        160,
        122
      ],
      lightseagreen: [
        32,
        178,
        170
      ],
      lightskyblue: [
        135,
        206,
        250
      ],
      lightslategray: [
        119,
        136,
        153
      ],
      lightslategrey: [
        119,
        136,
        153
      ],
      lightsteelblue: [
        176,
        196,
        222
      ],
      lightyellow: [
        255,
        255,
        224
      ],
      lime: [
        0,
        255,
        0
      ],
      limegreen: [
        50,
        205,
        50
      ],
      linen: [
        250,
        240,
        230
      ],
      magenta: [
        255,
        0,
        255
      ],
      maroon: [
        128,
        0,
        0
      ],
      mediumaquamarine: [
        102,
        205,
        170
      ],
      mediumblue: [
        0,
        0,
        205
      ],
      mediumorchid: [
        186,
        85,
        211
      ],
      mediumpurple: [
        147,
        112,
        219
      ],
      mediumseagreen: [
        60,
        179,
        113
      ],
      mediumslateblue: [
        123,
        104,
        238
      ],
      mediumspringgreen: [
        0,
        250,
        154
      ],
      mediumturquoise: [
        72,
        209,
        204
      ],
      mediumvioletred: [
        199,
        21,
        133
      ],
      midnightblue: [
        25,
        25,
        112
      ],
      mintcream: [
        245,
        255,
        250
      ],
      mistyrose: [
        255,
        228,
        225
      ],
      moccasin: [
        255,
        228,
        181
      ],
      navajowhite: [
        255,
        222,
        173
      ],
      navy: [
        0,
        0,
        128
      ],
      oldlace: [
        253,
        245,
        230
      ],
      olive: [
        128,
        128,
        0
      ],
      olivedrab: [
        107,
        142,
        35
      ],
      orange: [
        255,
        165,
        0
      ],
      orangered: [
        255,
        69,
        0
      ],
      orchid: [
        218,
        112,
        214
      ],
      palegoldenrod: [
        238,
        232,
        170
      ],
      palegreen: [
        152,
        251,
        152
      ],
      paleturquoise: [
        175,
        238,
        238
      ],
      palevioletred: [
        219,
        112,
        147
      ],
      papayawhip: [
        255,
        239,
        213
      ],
      peachpuff: [
        255,
        218,
        185
      ],
      peru: [
        205,
        133,
        63
      ],
      pink: [
        255,
        192,
        203
      ],
      plum: [
        221,
        160,
        221
      ],
      powderblue: [
        176,
        224,
        230
      ],
      purple: [
        128,
        0,
        128
      ],
      rebeccapurple: [
        102,
        51,
        153
      ],
      red: [
        255,
        0,
        0
      ],
      rosybrown: [
        188,
        143,
        143
      ],
      royalblue: [
        65,
        105,
        225
      ],
      saddlebrown: [
        139,
        69,
        19
      ],
      salmon: [
        250,
        128,
        114
      ],
      sandybrown: [
        244,
        164,
        96
      ],
      seagreen: [
        46,
        139,
        87
      ],
      seashell: [
        255,
        245,
        238
      ],
      sienna: [
        160,
        82,
        45
      ],
      silver: [
        192,
        192,
        192
      ],
      skyblue: [
        135,
        206,
        235
      ],
      slateblue: [
        106,
        90,
        205
      ],
      slategray: [
        112,
        128,
        144
      ],
      slategrey: [
        112,
        128,
        144
      ],
      snow: [
        255,
        250,
        250
      ],
      springgreen: [
        0,
        255,
        127
      ],
      steelblue: [
        70,
        130,
        180
      ],
      tan: [
        210,
        180,
        140
      ],
      teal: [
        0,
        128,
        128
      ],
      thistle: [
        216,
        191,
        216
      ],
      tomato: [
        255,
        99,
        71
      ],
      turquoise: [
        64,
        224,
        208
      ],
      violet: [
        238,
        130,
        238
      ],
      wheat: [
        245,
        222,
        179
      ],
      white: [
        255,
        255,
        255
      ],
      whitesmoke: [
        245,
        245,
        245
      ],
      yellow: [
        255,
        255,
        0
      ],
      yellowgreen: [
        154,
        205,
        50
      ]
    };
  }(_n)), _n;
}
var Es;
function Fl() {
  return Es || (Es = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(m, n) {
      for (var d in n)
        Object.defineProperty(m, d, {
          enumerable: true,
          get: n[d]
        });
    }
    a(u, {
      parseColor: function() {
        return o;
      },
      formatColor: function() {
        return v2;
      }
    });
    const h = /* @__PURE__ */ p(sf());
    function p(m) {
      return m && m.__esModule ? m : {
        default: m
      };
    }
    let l = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i, f = /^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i, s = /(?:\d+|\d*\.\d+)%?/, c = /(?:\s*,\s*|\s+)/, t = /\s*[,/]\s*/, e = /var\(--(?:[^ )]*?)(?:,(?:[^ )]*?|var\(--[^ )]*?\)))?\)/, r = new RegExp(`^(rgba?)\\(\\s*(${s.source}|${e.source})(?:${c.source}(${s.source}|${e.source}))?(?:${c.source}(${s.source}|${e.source}))?(?:${t.source}(${s.source}|${e.source}))?\\s*\\)$`), i = new RegExp(`^(hsla?)\\(\\s*((?:${s.source})(?:deg|rad|grad|turn)?|${e.source})(?:${c.source}(${s.source}|${e.source}))?(?:${c.source}(${s.source}|${e.source}))?(?:${t.source}(${s.source}|${e.source}))?\\s*\\)$`);
    function o(m, { loose: n = false } = {}) {
      var d, _;
      if (typeof m != "string")
        return null;
      if (m = m.trim(), m === "transparent")
        return {
          mode: "rgb",
          color: [
            "0",
            "0",
            "0"
          ],
          alpha: "0"
        };
      if (m in h.default)
        return {
          mode: "rgb",
          color: h.default[m].map((O) => O.toString())
        };
      let w = m.replace(f, (O, A, E, b, k) => [
        "#",
        A,
        A,
        E,
        E,
        b,
        b,
        k ? k + k : ""
      ].join("")).match(l);
      if (w !== null)
        return {
          mode: "rgb",
          color: [
            parseInt(w[1], 16),
            parseInt(w[2], 16),
            parseInt(w[3], 16)
          ].map((O) => O.toString()),
          alpha: w[4] ? (parseInt(w[4], 16) / 255).toString() : undefined
        };
      var y;
      let x = (y = m.match(r)) !== null && y !== undefined ? y : m.match(i);
      if (x === null)
        return null;
      let g = [
        x[2],
        x[3],
        x[4]
      ].filter(Boolean).map((O) => O.toString());
      return g.length === 2 && g[0].startsWith("var(") ? {
        mode: x[1],
        color: [
          g[0]
        ],
        alpha: g[1]
      } : !n && g.length !== 3 || g.length < 3 && !g.some((O) => /^var\(.*?\)$/.test(O)) ? null : {
        mode: x[1],
        color: g,
        alpha: (d = x[5]) === null || d === undefined || (_ = d.toString) === null || _ === undefined ? undefined : _.call(d)
      };
    }
    function v2({ mode: m, color: n, alpha: d }) {
      let _ = d !== undefined;
      return m === "rgba" || m === "hsla" ? `${m}(${n.join(", ")}${_ ? `, ${d}` : ""})` : `${m}(${n.join(" ")}${_ ? ` / ${d}` : ""})`;
    }
  }(bn)), bn;
}
var Ts;
function hr() {
  return Ts || (Ts = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(f, s) {
      for (var c in s)
        Object.defineProperty(f, c, {
          enumerable: true,
          get: s[c]
        });
    }
    a(u, {
      withAlphaValue: function() {
        return p;
      },
      default: function() {
        return l;
      }
    });
    const h = Fl();
    function p(f, s, c) {
      if (typeof f == "function")
        return f({
          opacityValue: s
        });
      let t = (0, h.parseColor)(f, {
        loose: true
      });
      return t === null ? c : (0, h.formatColor)({
        ...t,
        alpha: s
      });
    }
    function l({ color: f, property: s, variable: c }) {
      let t = [].concat(s);
      if (typeof f == "function")
        return {
          [c]: "1",
          ...Object.fromEntries(t.map((r) => [
            r,
            f({
              opacityVariable: c,
              opacityValue: `var(${c})`
            })
          ]))
        };
      const e = (0, h.parseColor)(f);
      return e === null ? Object.fromEntries(t.map((r) => [
        r,
        f
      ])) : e.alpha !== undefined ? Object.fromEntries(t.map((r) => [
        r,
        f
      ])) : {
        [c]: "1",
        ...Object.fromEntries(t.map((r) => [
          r,
          (0, h.formatColor)({
            ...e,
            alpha: `var(${c})`
          })
        ]))
      };
    }
  }(wn)), wn;
}
var Sn = {};
var xn = {};
var As;
function Vi() {
  return As || (As = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      return h.replace(/\\,/g, "\\2c ");
    }
  }(xn)), xn;
}
var On = {};
var kn = {};
var Pn = {};
var Cs;
function st() {
  return Cs || (Cs = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "splitAtTopLevelOnly", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h, p) {
      let l = [], f = [], s = 0, c = false;
      for (let t = 0;t < h.length; t++) {
        let e = h[t];
        l.length === 0 && e === p[0] && !c && (p.length === 1 || h.slice(t, t + p.length) === p) && (f.push(h.slice(s, t)), s = t + p.length), c = c ? false : e === "\\", e === "(" || e === "[" || e === "{" ? l.push(e) : (e === ")" && l[l.length - 1] === "(" || e === "]" && l[l.length - 1] === "[" || e === "}" && l[l.length - 1] === "{") && l.pop();
      }
      return f.push(h.slice(s)), f;
    }
  }(Pn)), Pn;
}
var Rs;
function $l() {
  return Rs || (Rs = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(t, e) {
      for (var r in e)
        Object.defineProperty(t, r, {
          enumerable: true,
          get: e[r]
        });
    }
    a(u, {
      parseBoxShadowValue: function() {
        return s;
      },
      formatBoxShadowValue: function() {
        return c;
      }
    });
    const h = st();
    let p = /* @__PURE__ */ new Set([
      "inset",
      "inherit",
      "initial",
      "revert",
      "unset"
    ]), l = /\ +(?![^(]*\))/g, f = /^-?(\d+|\.\d+)(.*?)$/g;
    function s(t) {
      return (0, h.splitAtTopLevelOnly)(t, ",").map((r) => {
        let i = r.trim(), o = {
          raw: i
        }, v2 = i.split(l), m = /* @__PURE__ */ new Set;
        for (let n of v2)
          f.lastIndex = 0, !m.has("KEYWORD") && p.has(n) ? (o.keyword = n, m.add("KEYWORD")) : f.test(n) ? m.has("X") ? m.has("Y") ? m.has("BLUR") ? m.has("SPREAD") || (o.spread = n, m.add("SPREAD")) : (o.blur = n, m.add("BLUR")) : (o.y = n, m.add("Y")) : (o.x = n, m.add("X")) : o.color ? (o.unknown || (o.unknown = []), o.unknown.push(n)) : o.color = n;
        return o.valid = o.x !== undefined && o.y !== undefined, o;
      });
    }
    function c(t) {
      return t.map((e) => e.valid ? [
        e.keyword,
        e.x,
        e.y,
        e.blur,
        e.spread,
        e.color
      ].filter(Boolean).join(" ") : e.raw).join(", ");
    }
  }(kn)), kn;
}
var Is;
function vr() {
  return Is || (Is = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(R, $) {
      for (var B in $)
        Object.defineProperty(R, B, {
          enumerable: true,
          get: $[B]
        });
    }
    a(u, {
      normalize: function() {
        return t;
      },
      normalizeAttributeSelectors: function() {
        return e;
      },
      url: function() {
        return i;
      },
      number: function() {
        return o;
      },
      percentage: function() {
        return v2;
      },
      length: function() {
        return d;
      },
      lineWidth: function() {
        return w;
      },
      shadow: function() {
        return y;
      },
      color: function() {
        return x;
      },
      image: function() {
        return g;
      },
      gradient: function() {
        return A;
      },
      position: function() {
        return b;
      },
      familyName: function() {
        return k;
      },
      genericName: function() {
        return M;
      },
      absoluteSize: function() {
        return S;
      },
      relativeSize: function() {
        return C;
      }
    });
    const h = Fl(), p = $l(), l = st();
    let f = [
      "min",
      "max",
      "clamp",
      "calc"
    ];
    function s(R) {
      return f.some(($) => new RegExp(`^${$}\\(.*\\)`).test(R));
    }
    const c = /* @__PURE__ */ new Set([
      "scroll-timeline-name",
      "timeline-scope",
      "view-timeline-name",
      "font-palette",
      "anchor-name",
      "anchor-scope",
      "position-anchor",
      "position-try-options",
      "scroll-timeline",
      "animation-timeline",
      "view-timeline",
      "position-try"
    ]);
    function t(R, $ = null, B = true) {
      let z = $ && c.has($.property);
      return R.startsWith("--") && !z ? `var(${R})` : R.includes("url(") ? R.split(/(url\(.*?\))/g).filter(Boolean).map((L) => /^url\(.*?\)$/.test(L) ? L : t(L, $, false)).join("") : (R = R.replace(/([^\\])_+/g, (L, F) => F + " ".repeat(L.length - 1)).replace(/^_/g, " ").replace(/\\_/g, "_"), B && (R = R.trim()), R = r(R), R);
    }
    function e(R) {
      return R.includes("=") && (R = R.replace(/(=.*)/g, ($, B) => {
        if (B[1] === "'" || B[1] === '"')
          return B;
        if (B.length > 2) {
          let z = B[B.length - 1];
          if (B[B.length - 2] === " " && (z === "i" || z === "I" || z === "s" || z === "S"))
            return `="${B.slice(1, -2)}" ${B[B.length - 1]}`;
        }
        return `="${B.slice(1)}"`;
      })), R;
    }
    function r(R) {
      let $ = [
        "theme"
      ], B = [
        "min-content",
        "max-content",
        "fit-content",
        "safe-area-inset-top",
        "safe-area-inset-right",
        "safe-area-inset-bottom",
        "safe-area-inset-left",
        "titlebar-area-x",
        "titlebar-area-y",
        "titlebar-area-width",
        "titlebar-area-height",
        "keyboard-inset-top",
        "keyboard-inset-right",
        "keyboard-inset-bottom",
        "keyboard-inset-left",
        "keyboard-inset-width",
        "keyboard-inset-height",
        "radial-gradient",
        "linear-gradient",
        "conic-gradient",
        "repeating-radial-gradient",
        "repeating-linear-gradient",
        "repeating-conic-gradient"
      ];
      return R.replace(/(calc|min|max|clamp)\(.+\)/g, (z) => {
        let L = "";
        function F() {
          let D = L.trimEnd();
          return D[D.length - 1];
        }
        for (let D = 0;D < z.length; D++) {
          let I = function(T) {
            return T.split("").every((U, j) => z[D + j] === U);
          }, N = function(T) {
            let U = 1 / 0;
            for (let H of T) {
              let V = z.indexOf(H, D);
              V !== -1 && V < U && (U = V);
            }
            let j = z.slice(D, U);
            return D += j.length - 1, j;
          }, J = z[D];
          if (I("var"))
            L += N([
              ")",
              ","
            ]);
          else if (B.some((T) => I(T))) {
            let T = B.find((U) => I(U));
            L += T, D += T.length - 1;
          } else
            $.some((T) => I(T)) ? L += N([
              ")"
            ]) : I("[") ? L += N([
              "]"
            ]) : [
              "+",
              "-",
              "*",
              "/"
            ].includes(J) && ![
              "(",
              "+",
              "-",
              "*",
              "/",
              ","
            ].includes(F()) ? L += ` ${J} ` : L += J;
        }
        return L.replace(/\s+/g, " ");
      });
    }
    function i(R) {
      return R.startsWith("url(");
    }
    function o(R) {
      return !isNaN(Number(R)) || s(R);
    }
    function v2(R) {
      return R.endsWith("%") && o(R.slice(0, -1)) || s(R);
    }
    let n = `(?:${[
      "cm",
      "mm",
      "Q",
      "in",
      "pc",
      "pt",
      "px",
      "em",
      "ex",
      "ch",
      "rem",
      "lh",
      "rlh",
      "vw",
      "vh",
      "vmin",
      "vmax",
      "vb",
      "vi",
      "svw",
      "svh",
      "lvw",
      "lvh",
      "dvw",
      "dvh",
      "cqw",
      "cqh",
      "cqi",
      "cqb",
      "cqmin",
      "cqmax"
    ].join("|")})`;
    function d(R) {
      return R === "0" || new RegExp(`^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?${n}$`).test(R) || s(R);
    }
    let _ = /* @__PURE__ */ new Set([
      "thin",
      "medium",
      "thick"
    ]);
    function w(R) {
      return _.has(R);
    }
    function y(R) {
      let $ = (0, p.parseBoxShadowValue)(t(R));
      for (let B of $)
        if (!B.valid)
          return false;
      return true;
    }
    function x(R) {
      let $ = 0;
      return (0, l.splitAtTopLevelOnly)(R, "_").every((z) => (z = t(z), z.startsWith("var(") ? true : (0, h.parseColor)(z, {
        loose: true
      }) !== null ? ($++, true) : false)) ? $ > 0 : false;
    }
    function g(R) {
      let $ = 0;
      return (0, l.splitAtTopLevelOnly)(R, ",").every((z) => (z = t(z), z.startsWith("var(") ? true : i(z) || A(z) || [
        "element(",
        "image(",
        "cross-fade(",
        "image-set("
      ].some((L) => z.startsWith(L)) ? ($++, true) : false)) ? $ > 0 : false;
    }
    let O = /* @__PURE__ */ new Set([
      "conic-gradient",
      "linear-gradient",
      "radial-gradient",
      "repeating-conic-gradient",
      "repeating-linear-gradient",
      "repeating-radial-gradient"
    ]);
    function A(R) {
      R = t(R);
      for (let $ of O)
        if (R.startsWith(`${$}(`))
          return true;
      return false;
    }
    let E = /* @__PURE__ */ new Set([
      "center",
      "top",
      "right",
      "bottom",
      "left"
    ]);
    function b(R) {
      let $ = 0;
      return (0, l.splitAtTopLevelOnly)(R, "_").every((z) => (z = t(z), z.startsWith("var(") ? true : E.has(z) || d(z) || v2(z) ? ($++, true) : false)) ? $ > 0 : false;
    }
    function k(R) {
      let $ = 0;
      return (0, l.splitAtTopLevelOnly)(R, ",").every((z) => (z = t(z), z.startsWith("var(") ? true : z.includes(" ") && !/(['"])([^"']+)\1/g.test(z) || /^\d/g.test(z) ? false : ($++, true))) ? $ > 0 : false;
    }
    let q = /* @__PURE__ */ new Set([
      "serif",
      "sans-serif",
      "monospace",
      "cursive",
      "fantasy",
      "system-ui",
      "ui-serif",
      "ui-sans-serif",
      "ui-monospace",
      "ui-rounded",
      "math",
      "emoji",
      "fangsong"
    ]);
    function M(R) {
      return q.has(R);
    }
    let W = /* @__PURE__ */ new Set([
      "xx-small",
      "x-small",
      "small",
      "medium",
      "large",
      "x-large",
      "xx-large",
      "xxx-large"
    ]);
    function S(R) {
      return W.has(R);
    }
    let P = /* @__PURE__ */ new Set([
      "larger",
      "smaller"
    ]);
    function C(R) {
      return P.has(R);
    }
  }(On)), On;
}
var En = {};
var Ms;
function ji() {
  return Ms || (Ms = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      if (h = `${h}`, h === "0")
        return "0";
      if (/^[+-]?(\d+|\d*\.\d+)(e[+-]?\d+)?(%|\w+)?$/.test(h))
        return h.replace(/^[+-]?/, (l) => l === "-" ? "" : "-");
      let p = [
        "var",
        "calc",
        "min",
        "max",
        "clamp"
      ];
      for (const l of p)
        if (h.includes(`${l}(`))
          return `calc(${h} * -1)`;
    }
  }(En)), En;
}
var Tn = {};
var Ds;
function of() {
  return Ds || (Ds = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "backgroundSize", {
      enumerable: true,
      get: function() {
        return p;
      }
    });
    const a = vr(), h = st();
    function p(l) {
      let f = [
        "cover",
        "contain"
      ];
      return (0, h.splitAtTopLevelOnly)(l, ",").every((s) => {
        let c = (0, h.splitAtTopLevelOnly)(s, "_").filter(Boolean);
        return c.length === 1 && f.includes(c[0]) ? true : c.length !== 1 && c.length !== 2 ? false : c.every((t) => (0, a.length)(t) || (0, a.percentage)(t) || t === "auto");
      });
    }
  }(Tn)), Tn;
}
var An = {};
var Cn = {};
var qs;
function tt() {
  return qs || (qs = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(t, e) {
      for (var r in e)
        Object.defineProperty(t, r, {
          enumerable: true,
          get: e[r]
        });
    }
    a(u, {
      dim: function() {
        return s;
      },
      default: function() {
        return c;
      }
    });
    const h = /* @__PURE__ */ p(/* @__PURE__ */ Ti());
    function p(t) {
      return t && t.__esModule ? t : {
        default: t
      };
    }
    let l = /* @__PURE__ */ new Set;
    function f(t, e, r) {
      typeof process < "u" && process.env.JEST_WORKER_ID || r && l.has(r) || (r && l.add(r), console.warn(""), e.forEach((i) => console.warn(t, "-", i)));
    }
    function s(t) {
      return h.default.dim(t);
    }
    const c = {
      info(t, e) {
        f(h.default.bold(h.default.cyan("info")), ...Array.isArray(t) ? [
          t
        ] : [
          e,
          t
        ]);
      },
      warn(t, e) {
        f(h.default.bold(h.default.yellow("warn")), ...Array.isArray(t) ? [
          t
        ] : [
          e,
          t
        ]);
      },
      risk(t, e) {
        f(h.default.bold(h.default.magenta("risk")), ...Array.isArray(t) ? [
          t
        ] : [
          e,
          t
        ]);
      }
    };
  }(Cn)), Cn;
}
var Ls;
function it() {
  return Ls || (Ls = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(i, o) {
      for (var v2 in o)
        Object.defineProperty(i, v2, {
          enumerable: true,
          get: o[v2]
        });
    }
    a(u, {
      flagEnabled: function() {
        return c;
      },
      issueFlagNotices: function() {
        return e;
      },
      default: function() {
        return r;
      }
    });
    const h = /* @__PURE__ */ l(/* @__PURE__ */ Ti()), p = /* @__PURE__ */ l(tt());
    function l(i) {
      return i && i.__esModule ? i : {
        default: i
      };
    }
    let f = {
      optimizeUniversalDefaults: false,
      generalizedModifiers: true,
      disableColorOpacityUtilitiesByDefault: false,
      relativeContentPathsByDefault: false
    }, s = {
      future: [
        "hoverOnlyWhenSupported",
        "respectDefaultRingColorOpacity",
        "disableColorOpacityUtilitiesByDefault",
        "relativeContentPathsByDefault"
      ],
      experimental: [
        "optimizeUniversalDefaults",
        "generalizedModifiers"
      ]
    };
    function c(i, o) {
      if (s.future.includes(o)) {
        var v2, m, n;
        return i.future === "all" || ((n = (m = i == null || (v2 = i.future) === null || v2 === undefined ? undefined : v2[o]) !== null && m !== undefined ? m : f[o]) !== null && n !== undefined ? n : false);
      }
      if (s.experimental.includes(o)) {
        var d, _, w;
        return i.experimental === "all" || ((w = (_ = i == null || (d = i.experimental) === null || d === undefined ? undefined : d[o]) !== null && _ !== undefined ? _ : f[o]) !== null && w !== undefined ? w : false);
      }
      return false;
    }
    function t(i) {
      if (i.experimental === "all")
        return s.experimental;
      var o;
      return Object.keys((o = i == null ? undefined : i.experimental) !== null && o !== undefined ? o : {}).filter((v2) => s.experimental.includes(v2) && i.experimental[v2]);
    }
    function e(i) {
      if (process.env.JEST_WORKER_ID === undefined && t(i).length > 0) {
        let o = t(i).map((v2) => h.default.yellow(v2)).join(", ");
        p.default.warn("experimental-flags-enabled", [
          `You have enabled experimental features: ${o}`,
          "Experimental features in Tailwind CSS are not covered by semver, may introduce breaking changes, and can change at any time."
        ]);
      }
    }
    const r = s;
  }(An)), An;
}
var Ns;
function gr() {
  return Ns || (Ns = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(b, k) {
      for (var q in k)
        Object.defineProperty(b, q, {
          enumerable: true,
          get: k[q]
        });
    }
    a(u, {
      updateAllClasses: function() {
        return e;
      },
      asValue: function() {
        return o;
      },
      parseColorFormat: function() {
        return n;
      },
      asColor: function() {
        return _;
      },
      asLookupValue: function() {
        return w;
      },
      typeMap: function() {
        return x;
      },
      coerceValue: function() {
        return A;
      },
      getMatchingTypes: function() {
        return E;
      }
    });
    const h = /* @__PURE__ */ t(Vi()), p = hr(), l = vr(), f = /* @__PURE__ */ t(ji()), s = of(), c = it();
    function t(b) {
      return b && b.__esModule ? b : {
        default: b
      };
    }
    function e(b, k) {
      b.walkClasses((q) => {
        q.value = k(q.value), q.raws && q.raws.value && (q.raws.value = (0, h.default)(q.raws.value));
      });
    }
    function r(b, k) {
      if (!v2(b))
        return;
      let q = b.slice(1, -1);
      if (k(q))
        return (0, l.normalize)(q);
    }
    function i(b, k = {}, q) {
      let M = k[b];
      if (M !== undefined)
        return (0, f.default)(M);
      if (v2(b)) {
        let W = r(b, q);
        return W === undefined ? undefined : (0, f.default)(W);
      }
    }
    function o(b, k = {}, { validate: q = () => true } = {}) {
      var M;
      let W = (M = k.values) === null || M === undefined ? undefined : M[b];
      return W !== undefined ? W : k.supportsNegativeValues && b.startsWith("-") ? i(b.slice(1), k.values, q) : r(b, q);
    }
    function v2(b) {
      return b.startsWith("[") && b.endsWith("]");
    }
    function m(b) {
      let k = b.lastIndexOf("/"), q = b.lastIndexOf("[", k), M = b.indexOf("]", k);
      return b[k - 1] === "]" || b[k + 1] === "[" || q !== -1 && M !== -1 && q < k && k < M && (k = b.lastIndexOf("/", q)), k === -1 || k === b.length - 1 ? [
        b,
        undefined
      ] : v2(b) && !b.includes("]/[") ? [
        b,
        undefined
      ] : [
        b.slice(0, k),
        b.slice(k + 1)
      ];
    }
    function n(b) {
      if (typeof b == "string" && b.includes("<alpha-value>")) {
        let k = b;
        return ({ opacityValue: q = 1 }) => k.replace(/<alpha-value>/g, q);
      }
      return b;
    }
    function d(b) {
      return (0, l.normalize)(b.slice(1, -1));
    }
    function _(b, k = {}, { tailwindConfig: q = {} } = {}) {
      var M;
      if (((M = k.values) === null || M === undefined ? undefined : M[b]) !== undefined) {
        var W;
        return n((W = k.values) === null || W === undefined ? undefined : W[b]);
      }
      let [S, P] = m(b);
      if (P !== undefined) {
        var C, R, $, B;
        let z = (B = (C = k.values) === null || C === undefined ? undefined : C[S]) !== null && B !== undefined ? B : v2(S) ? S.slice(1, -1) : undefined;
        return z === undefined ? undefined : (z = n(z), v2(P) ? (0, p.withAlphaValue)(z, d(P)) : ((R = q.theme) === null || R === undefined || ($ = R.opacity) === null || $ === undefined ? undefined : $[P]) === undefined ? undefined : (0, p.withAlphaValue)(z, q.theme.opacity[P]));
      }
      return o(b, k, {
        validate: l.color
      });
    }
    function w(b, k = {}) {
      var q;
      return (q = k.values) === null || q === undefined ? undefined : q[b];
    }
    function y(b) {
      return (k, q) => o(k, q, {
        validate: b
      });
    }
    let x = {
      any: o,
      color: _,
      url: y(l.url),
      image: y(l.image),
      length: y(l.length),
      percentage: y(l.percentage),
      position: y(l.position),
      lookup: w,
      "generic-name": y(l.genericName),
      "family-name": y(l.familyName),
      number: y(l.number),
      "line-width": y(l.lineWidth),
      "absolute-size": y(l.absoluteSize),
      "relative-size": y(l.relativeSize),
      shadow: y(l.shadow),
      size: y(s.backgroundSize)
    }, g = Object.keys(x);
    function O(b, k) {
      let q = b.indexOf(k);
      return q === -1 ? [
        undefined,
        b
      ] : [
        b.slice(0, q),
        b.slice(q + 1)
      ];
    }
    function A(b, k, q, M) {
      if (q.values && k in q.values)
        for (let { type: S } of b ?? []) {
          let P = x[S](k, q, {
            tailwindConfig: M
          });
          if (P !== undefined)
            return [
              P,
              S,
              null
            ];
        }
      if (v2(k)) {
        let S = k.slice(1, -1), [P, C] = O(S, ":");
        if (!/^[\w-_]+$/g.test(P))
          C = S;
        else if (P !== undefined && !g.includes(P))
          return [];
        if (C.length > 0 && g.includes(P))
          return [
            o(`[${C}]`, q),
            P,
            null
          ];
      }
      let W = E(b, k, q, M);
      for (let S of W)
        return S;
      return [];
    }
    function* E(b, k, q, M) {
      let W = (0, c.flagEnabled)(M, "generalizedModifiers"), [S, P] = m(k);
      if (W && q.modifiers != null && (q.modifiers === "any" || typeof q.modifiers == "object" && (P && v2(P) || (P in q.modifiers))) || (S = k, P = undefined), P !== undefined && S === "" && (S = "DEFAULT"), P !== undefined && typeof q.modifiers == "object") {
        var R, $;
        let B = ($ = (R = q.modifiers) === null || R === undefined ? undefined : R[P]) !== null && $ !== undefined ? $ : null;
        B !== null ? P = B : v2(P) && (P = d(P));
      }
      for (let { type: B } of b ?? []) {
        let z = x[B](S, q, {
          tailwindConfig: M
        });
        z !== undefined && (yield [
          z,
          B,
          P ?? null
        ]);
      }
    }
  }(Sn)), Sn;
}
var Fs;
function lf() {
  return Fs || (Fs = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return E;
      }
    });
    const a = /* @__PURE__ */ i(Nl()), h = /* @__PURE__ */ i(Zu()), p = /* @__PURE__ */ i(pr()), l = /* @__PURE__ */ i(af()), f = Ui(), s = /* @__PURE__ */ i(zi()), c = Wi(), t = hr(), e = gr(), r = /* @__PURE__ */ i(tt());
    function i(b) {
      return b && b.__esModule ? b : {
        default: b
      };
    }
    function o(b) {
      return typeof b == "object" && b !== null;
    }
    function v2(b, k) {
      let q = (0, c.toPath)(k);
      do
        if (q.pop(), (0, a.default)(b, q) !== undefined)
          break;
      while (q.length);
      return q.length ? q : undefined;
    }
    function m(b) {
      return typeof b == "string" ? b : b.reduce((k, q, M) => q.includes(".") ? `${k}[${q}]` : M === 0 ? q : `${k}.${q}`, "");
    }
    function n(b) {
      return b.map((k) => `'${k}'`).join(", ");
    }
    function d(b) {
      return n(Object.keys(b));
    }
    function _(b, k, q, M = {}) {
      const W = Array.isArray(k) ? m(k) : k.replace(/^['"]+|['"]+$/g, ""), S = Array.isArray(k) ? k : (0, c.toPath)(W), P = (0, a.default)(b.theme, S, q);
      if (P === undefined) {
        let R = `'${W}' does not exist in your theme config.`;
        const $ = S.slice(0, -1), B = (0, a.default)(b.theme, $);
        if (o(B)) {
          const z = Object.keys(B).filter((F) => _(b, [
            ...$,
            F
          ]).isValid), L = (0, h.default)(S[S.length - 1], z);
          L ? R += ` Did you mean '${m([
            ...$,
            L
          ])}'?` : z.length > 0 && (R += ` '${m($)}' has the following valid keys: ${n(z)}`);
        } else {
          const z = v2(b.theme, W);
          if (z) {
            const L = (0, a.default)(b.theme, z);
            o(L) ? R += ` '${m(z)}' has the following keys: ${d(L)}` : R += ` '${m(z)}' is not an object.`;
          } else
            R += ` Your theme has the following top-level keys: ${d(b.theme)}`;
        }
        return {
          isValid: false,
          error: R
        };
      }
      if (!(typeof P == "string" || typeof P == "number" || typeof P == "function" || P instanceof String || P instanceof Number || Array.isArray(P))) {
        let R = `'${W}' was found but does not resolve to a string.`;
        if (o(P)) {
          let $ = Object.keys(P).filter((B) => _(b, [
            ...S,
            B
          ]).isValid);
          $.length && (R += ` Did you mean something like '${m([
            ...S,
            $[0]
          ])}'?`);
        }
        return {
          isValid: false,
          error: R
        };
      }
      const [C] = S;
      return {
        isValid: true,
        value: (0, p.default)(C)(P, M)
      };
    }
    function w(b, k, q) {
      k = k.map((W) => y(b, W, q));
      let M = [
        ""
      ];
      for (let W of k)
        W.type === "div" && W.value === "," ? M.push("") : M[M.length - 1] += l.default.stringify(W);
      return M;
    }
    function y(b, k, q) {
      if (k.type === "function" && q[k.value] !== undefined) {
        let M = w(b, k.nodes, q);
        k.type = "word", k.value = q[k.value](b, ...M);
      }
      return k;
    }
    function x(b, k, q) {
      return Object.keys(q).some((W) => k.includes(`${W}(`)) ? (0, l.default)(k).walk((W) => {
        y(b, W, q);
      }).toString() : k;
    }
    let g = {
      atrule: "params",
      decl: "value"
    };
    function* O(b) {
      b = b.replace(/^['"]+|['"]+$/g, "");
      let k = b.match(/^([^\s]+)(?![^\[]*\])(?:\s*\/\s*([^\/\s]+))$/), q;
      yield [
        b,
        undefined
      ], k && (b = k[1], q = k[2], yield [
        b,
        q
      ]);
    }
    function A(b, k, q) {
      const M = Array.from(O(k)).map(([S, P]) => Object.assign(_(b, S, q, {
        opacityValue: P
      }), {
        resolvedPath: S,
        alpha: P
      }));
      var W;
      return (W = M.find((S) => S.isValid)) !== null && W !== undefined ? W : M[0];
    }
    function E(b) {
      let k = b.tailwindConfig, q = {
        theme: (M, W, ...S) => {
          let { isValid: P, value: C, error: R, alpha: $ } = A(k, W, S.length ? S : undefined);
          if (!P) {
            var B;
            let F = M.parent, D = (B = F == null ? undefined : F.raws.tailwind) === null || B === undefined ? undefined : B.candidate;
            if (F && D !== undefined) {
              b.markInvalidUtilityNode(F), F.remove(), r.default.warn("invalid-theme-key-in-class", [
                `The utility \`${D}\` contains an invalid theme value and was not generated.`
              ]);
              return;
            }
            throw M.error(R);
          }
          let z = (0, e.parseColorFormat)(C);
          return ($ !== undefined || z !== undefined && typeof z == "function") && ($ === undefined && ($ = 1), C = (0, t.withAlphaValue)(z, $, z)), C;
        },
        screen: (M, W) => {
          W = W.replace(/^['"]+/g, "").replace(/['"]+$/g, "");
          let P = (0, f.normalizeScreens)(k.theme.screens).find(({ name: C }) => C === W);
          if (!P)
            throw M.error(`The '${W}' screen does not exist in your theme.`);
          return (0, s.default)(P);
        }
      };
      return (M) => {
        M.walk((W) => {
          let S = g[W.type];
          S !== undefined && (W[S] = x(W, W[S], q));
        });
      };
    }
  }(sn)), sn;
}
var uf = lf();
var ff = /* @__PURE__ */ He(uf);
var Rn = {};
var Nt = { exports: {} };
var Ft = { exports: {} };
var $t = { exports: {} };
var Ut = { exports: {} };
var zt = { exports: {} };
var Wt = { exports: {} };
var Qe = {};
var Vt = { exports: {} };
var $s;
function Bi() {
  return $s || ($s = 1, function(u, a) {
    a.__esModule = true, a.default = l;
    function h(f) {
      for (var s = f.toLowerCase(), c = "", t = false, e = 0;e < 6 && s[e] !== undefined; e++) {
        var r = s.charCodeAt(e), i = r >= 97 && r <= 102 || r >= 48 && r <= 57;
        if (t = r === 32, !i)
          break;
        c += s[e];
      }
      if (c.length !== 0) {
        var o = parseInt(c, 16), v2 = o >= 55296 && o <= 57343;
        return v2 || o === 0 || o > 1114111 ? ["�", c.length + (t ? 1 : 0)] : [String.fromCodePoint(o), c.length + (t ? 1 : 0)];
      }
    }
    var p = /\\/;
    function l(f) {
      var s = p.test(f);
      if (!s)
        return f;
      for (var c = "", t = 0;t < f.length; t++) {
        if (f[t] === "\\") {
          var e = h(f.slice(t + 1, t + 7));
          if (e !== undefined) {
            c += e[0], t += e[1];
            continue;
          }
          if (f[t + 1] === "\\") {
            c += "\\", t++;
            continue;
          }
          f.length === t + 1 && (c += f[t]);
          continue;
        }
        c += f[t];
      }
      return c;
    }
    u.exports = a.default;
  }(Vt, Vt.exports)), Vt.exports;
}
var jt = { exports: {} };
var Us;
function cf() {
  return Us || (Us = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      for (var l = arguments.length, f = new Array(l > 1 ? l - 1 : 0), s = 1;s < l; s++)
        f[s - 1] = arguments[s];
      for (;f.length > 0; ) {
        var c = f.shift();
        if (!p[c])
          return;
        p = p[c];
      }
      return p;
    }
    u.exports = a.default;
  }(jt, jt.exports)), jt.exports;
}
var Bt = { exports: {} };
var zs;
function df() {
  return zs || (zs = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      for (var l = arguments.length, f = new Array(l > 1 ? l - 1 : 0), s = 1;s < l; s++)
        f[s - 1] = arguments[s];
      for (;f.length > 0; ) {
        var c = f.shift();
        p[c] || (p[c] = {}), p = p[c];
      }
    }
    u.exports = a.default;
  }(Bt, Bt.exports)), Bt.exports;
}
var Gt = { exports: {} };
var Ws;
function pf() {
  return Ws || (Ws = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      for (var l = "", f = p.indexOf("/*"), s = 0;f >= 0; ) {
        l = l + p.slice(s, f);
        var c = p.indexOf("*/", f + 2);
        if (c < 0)
          return l;
        s = c + 2, f = p.indexOf("/*", s);
      }
      return l = l + p.slice(s), l;
    }
    u.exports = a.default;
  }(Gt, Gt.exports)), Gt.exports;
}
var Vs;
function mr() {
  if (Vs)
    return Qe;
  Vs = 1, Qe.__esModule = true, Qe.unesc = Qe.stripComments = Qe.getProp = Qe.ensureObject = undefined;
  var u = l(Bi());
  Qe.unesc = u.default;
  var a = l(cf());
  Qe.getProp = a.default;
  var h = l(df());
  Qe.ensureObject = h.default;
  var p = l(pf());
  Qe.stripComments = p.default;
  function l(f) {
    return f && f.__esModule ? f : { default: f };
  }
  return Qe;
}
var js;
function rt() {
  return js || (js = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = mr();
    function p(c, t) {
      for (var e = 0;e < t.length; e++) {
        var r = t[e];
        r.enumerable = r.enumerable || false, r.configurable = true, "value" in r && (r.writable = true), Object.defineProperty(c, r.key, r);
      }
    }
    function l(c, t, e) {
      return t && p(c.prototype, t), Object.defineProperty(c, "prototype", { writable: false }), c;
    }
    var f = function c(t, e) {
      if (typeof t != "object" || t === null)
        return t;
      var r = new t.constructor;
      for (var i in t)
        if (t.hasOwnProperty(i)) {
          var o = t[i], v2 = typeof o;
          i === "parent" && v2 === "object" ? e && (r[i] = e) : o instanceof Array ? r[i] = o.map(function(m) {
            return c(m, r);
          }) : r[i] = c(o, r);
        }
      return r;
    }, s = /* @__PURE__ */ function() {
      function c(e) {
        e === undefined && (e = {}), Object.assign(this, e), this.spaces = this.spaces || {}, this.spaces.before = this.spaces.before || "", this.spaces.after = this.spaces.after || "";
      }
      var t = c.prototype;
      return t.remove = function() {
        return this.parent && this.parent.removeChild(this), this.parent = undefined, this;
      }, t.replaceWith = function() {
        if (this.parent) {
          for (var r in arguments)
            this.parent.insertBefore(this, arguments[r]);
          this.remove();
        }
        return this;
      }, t.next = function() {
        return this.parent.at(this.parent.index(this) + 1);
      }, t.prev = function() {
        return this.parent.at(this.parent.index(this) - 1);
      }, t.clone = function(r) {
        r === undefined && (r = {});
        var i = f(this);
        for (var o in r)
          i[o] = r[o];
        return i;
      }, t.appendToPropertyAndEscape = function(r, i, o) {
        this.raws || (this.raws = {});
        var v2 = this[r], m = this.raws[r];
        this[r] = v2 + i, m || o !== i ? this.raws[r] = (m || v2) + o : delete this.raws[r];
      }, t.setPropertyAndEscape = function(r, i, o) {
        this.raws || (this.raws = {}), this[r] = i, this.raws[r] = o;
      }, t.setPropertyWithoutEscape = function(r, i) {
        this[r] = i, this.raws && delete this.raws[r];
      }, t.isAtPosition = function(r, i) {
        if (this.source && this.source.start && this.source.end)
          return !(this.source.start.line > r || this.source.end.line < r || this.source.start.line === r && this.source.start.column > i || this.source.end.line === r && this.source.end.column < i);
      }, t.stringifyProperty = function(r) {
        return this.raws && this.raws[r] || this[r];
      }, t.valueToString = function() {
        return String(this.stringifyProperty("value"));
      }, t.toString = function() {
        return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
      }, l(c, [{
        key: "rawSpaceBefore",
        get: function() {
          var r = this.raws && this.raws.spaces && this.raws.spaces.before;
          return r === undefined && (r = this.spaces && this.spaces.before), r || "";
        },
        set: function(r) {
          (0, h.ensureObject)(this, "raws", "spaces"), this.raws.spaces.before = r;
        }
      }, {
        key: "rawSpaceAfter",
        get: function() {
          var r = this.raws && this.raws.spaces && this.raws.spaces.after;
          return r === undefined && (r = this.spaces.after), r || "";
        },
        set: function(r) {
          (0, h.ensureObject)(this, "raws", "spaces"), this.raws.spaces.after = r;
        }
      }]), c;
    }();
    a.default = s, u.exports = a.default;
  }(Wt, Wt.exports)), Wt.exports;
}
var Me = {};
var Bs;
function $e() {
  if (Bs)
    return Me;
  Bs = 1, Me.__esModule = true, Me.UNIVERSAL = Me.TAG = Me.STRING = Me.SELECTOR = Me.ROOT = Me.PSEUDO = Me.NESTING = Me.ID = Me.COMMENT = Me.COMBINATOR = Me.CLASS = Me.ATTRIBUTE = undefined;
  var u = "tag";
  Me.TAG = u;
  var a = "string";
  Me.STRING = a;
  var h = "selector";
  Me.SELECTOR = h;
  var p = "root";
  Me.ROOT = p;
  var l = "pseudo";
  Me.PSEUDO = l;
  var f = "nesting";
  Me.NESTING = f;
  var s = "id";
  Me.ID = s;
  var c = "comment";
  Me.COMMENT = c;
  var t = "combinator";
  Me.COMBINATOR = t;
  var e = "class";
  Me.CLASS = e;
  var r = "attribute";
  Me.ATTRIBUTE = r;
  var i = "universal";
  return Me.UNIVERSAL = i, Me;
}
var Gs;
function Gi() {
  return Gs || (Gs = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = s(rt()), p = f($e());
    function l(n) {
      if (typeof WeakMap != "function")
        return null;
      var d = /* @__PURE__ */ new WeakMap, _ = /* @__PURE__ */ new WeakMap;
      return (l = function(y) {
        return y ? _ : d;
      })(n);
    }
    function f(n, d) {
      if (n && n.__esModule)
        return n;
      if (n === null || typeof n != "object" && typeof n != "function")
        return { default: n };
      var _ = l(d);
      if (_ && _.has(n))
        return _.get(n);
      var w = {}, y = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var x in n)
        if (x !== "default" && Object.prototype.hasOwnProperty.call(n, x)) {
          var g = y ? Object.getOwnPropertyDescriptor(n, x) : null;
          g && (g.get || g.set) ? Object.defineProperty(w, x, g) : w[x] = n[x];
        }
      return w.default = n, _ && _.set(n, w), w;
    }
    function s(n) {
      return n && n.__esModule ? n : { default: n };
    }
    function c(n, d) {
      var _ = typeof Symbol < "u" && n[Symbol.iterator] || n["@@iterator"];
      if (_)
        return (_ = _.call(n)).next.bind(_);
      if (Array.isArray(n) || (_ = t(n)) || d) {
        _ && (n = _);
        var w = 0;
        return function() {
          return w >= n.length ? { done: true } : { done: false, value: n[w++] };
        };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    function t(n, d) {
      if (n) {
        if (typeof n == "string")
          return e(n, d);
        var _ = Object.prototype.toString.call(n).slice(8, -1);
        if (_ === "Object" && n.constructor && (_ = n.constructor.name), _ === "Map" || _ === "Set")
          return Array.from(n);
        if (_ === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(_))
          return e(n, d);
      }
    }
    function e(n, d) {
      (d == null || d > n.length) && (d = n.length);
      for (var _ = 0, w = new Array(d);_ < d; _++)
        w[_] = n[_];
      return w;
    }
    function r(n, d) {
      for (var _ = 0;_ < d.length; _++) {
        var w = d[_];
        w.enumerable = w.enumerable || false, w.configurable = true, "value" in w && (w.writable = true), Object.defineProperty(n, w.key, w);
      }
    }
    function i(n, d, _) {
      return d && r(n.prototype, d), Object.defineProperty(n, "prototype", { writable: false }), n;
    }
    function o(n, d) {
      n.prototype = Object.create(d.prototype), n.prototype.constructor = n, v2(n, d);
    }
    function v2(n, d) {
      return v2 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(w, y) {
        return w.__proto__ = y, w;
      }, v2(n, d);
    }
    var m = /* @__PURE__ */ function(n) {
      o(d, n);
      function d(w) {
        var y;
        return y = n.call(this, w) || this, y.nodes || (y.nodes = []), y;
      }
      var _ = d.prototype;
      return _.append = function(y) {
        return y.parent = this, this.nodes.push(y), this;
      }, _.prepend = function(y) {
        return y.parent = this, this.nodes.unshift(y), this;
      }, _.at = function(y) {
        return this.nodes[y];
      }, _.index = function(y) {
        return typeof y == "number" ? y : this.nodes.indexOf(y);
      }, _.removeChild = function(y) {
        y = this.index(y), this.at(y).parent = undefined, this.nodes.splice(y, 1);
        var x;
        for (var g in this.indexes)
          x = this.indexes[g], x >= y && (this.indexes[g] = x - 1);
        return this;
      }, _.removeAll = function() {
        for (var y = c(this.nodes), x;!(x = y()).done; ) {
          var g = x.value;
          g.parent = undefined;
        }
        return this.nodes = [], this;
      }, _.empty = function() {
        return this.removeAll();
      }, _.insertAfter = function(y, x) {
        x.parent = this;
        var g = this.index(y);
        this.nodes.splice(g + 1, 0, x), x.parent = this;
        var O;
        for (var A in this.indexes)
          O = this.indexes[A], g <= O && (this.indexes[A] = O + 1);
        return this;
      }, _.insertBefore = function(y, x) {
        x.parent = this;
        var g = this.index(y);
        this.nodes.splice(g, 0, x), x.parent = this;
        var O;
        for (var A in this.indexes)
          O = this.indexes[A], O <= g && (this.indexes[A] = O + 1);
        return this;
      }, _._findChildAtPosition = function(y, x) {
        var g = undefined;
        return this.each(function(O) {
          if (O.atPosition) {
            var A = O.atPosition(y, x);
            if (A)
              return g = A, false;
          } else if (O.isAtPosition(y, x))
            return g = O, false;
        }), g;
      }, _.atPosition = function(y, x) {
        if (this.isAtPosition(y, x))
          return this._findChildAtPosition(y, x) || this;
      }, _._inferEndPosition = function() {
        this.last && this.last.source && this.last.source.end && (this.source = this.source || {}, this.source.end = this.source.end || {}, Object.assign(this.source.end, this.last.source.end));
      }, _.each = function(y) {
        this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach++;
        var x = this.lastEach;
        if (this.indexes[x] = 0, !!this.length) {
          for (var g, O;this.indexes[x] < this.length && (g = this.indexes[x], O = y(this.at(g), g), O !== false); )
            this.indexes[x] += 1;
          if (delete this.indexes[x], O === false)
            return false;
        }
      }, _.walk = function(y) {
        return this.each(function(x, g) {
          var O = y(x, g);
          if (O !== false && x.length && (O = x.walk(y)), O === false)
            return false;
        });
      }, _.walkAttributes = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.ATTRIBUTE)
            return y.call(x, g);
        });
      }, _.walkClasses = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.CLASS)
            return y.call(x, g);
        });
      }, _.walkCombinators = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.COMBINATOR)
            return y.call(x, g);
        });
      }, _.walkComments = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.COMMENT)
            return y.call(x, g);
        });
      }, _.walkIds = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.ID)
            return y.call(x, g);
        });
      }, _.walkNesting = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.NESTING)
            return y.call(x, g);
        });
      }, _.walkPseudos = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.PSEUDO)
            return y.call(x, g);
        });
      }, _.walkTags = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.TAG)
            return y.call(x, g);
        });
      }, _.walkUniversals = function(y) {
        var x = this;
        return this.walk(function(g) {
          if (g.type === p.UNIVERSAL)
            return y.call(x, g);
        });
      }, _.split = function(y) {
        var x = this, g = [];
        return this.reduce(function(O, A, E) {
          var b = y.call(x, A);
          return g.push(A), b ? (O.push(g), g = []) : E === x.length - 1 && O.push(g), O;
        }, []);
      }, _.map = function(y) {
        return this.nodes.map(y);
      }, _.reduce = function(y, x) {
        return this.nodes.reduce(y, x);
      }, _.every = function(y) {
        return this.nodes.every(y);
      }, _.some = function(y) {
        return this.nodes.some(y);
      }, _.filter = function(y) {
        return this.nodes.filter(y);
      }, _.sort = function(y) {
        return this.nodes.sort(y);
      }, _.toString = function() {
        return this.map(String).join("");
      }, i(d, [{
        key: "first",
        get: function() {
          return this.at(0);
        }
      }, {
        key: "last",
        get: function() {
          return this.at(this.length - 1);
        }
      }, {
        key: "length",
        get: function() {
          return this.nodes.length;
        }
      }]), d;
    }(h.default);
    a.default = m, u.exports = a.default;
  }(zt, zt.exports)), zt.exports;
}
var Ys;
function Ul() {
  return Ys || (Ys = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Gi()), p = $e();
    function l(r) {
      return r && r.__esModule ? r : { default: r };
    }
    function f(r, i) {
      for (var o = 0;o < i.length; o++) {
        var v2 = i[o];
        v2.enumerable = v2.enumerable || false, v2.configurable = true, "value" in v2 && (v2.writable = true), Object.defineProperty(r, v2.key, v2);
      }
    }
    function s(r, i, o) {
      return i && f(r.prototype, i), Object.defineProperty(r, "prototype", { writable: false }), r;
    }
    function c(r, i) {
      r.prototype = Object.create(i.prototype), r.prototype.constructor = r, t(r, i);
    }
    function t(r, i) {
      return t = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(v2, m) {
        return v2.__proto__ = m, v2;
      }, t(r, i);
    }
    var e = /* @__PURE__ */ function(r) {
      c(i, r);
      function i(v2) {
        var m;
        return m = r.call(this, v2) || this, m.type = p.ROOT, m;
      }
      var o = i.prototype;
      return o.toString = function() {
        var m = this.reduce(function(n, d) {
          return n.push(String(d)), n;
        }, []).join(",");
        return this.trailingComma ? m + "," : m;
      }, o.error = function(m, n) {
        return this._error ? this._error(m, n) : new Error(m);
      }, s(i, [{
        key: "errorGenerator",
        set: function(m) {
          this._error = m;
        }
      }]), i;
    }(h.default);
    a.default = e, u.exports = a.default;
  }(Ut, Ut.exports)), Ut.exports;
}
var Yt = { exports: {} };
var Qs;
function zl() {
  return Qs || (Qs = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Gi()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.SELECTOR, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Yt, Yt.exports)), Yt.exports;
}
var Qt = { exports: {} };
var Hs;
function Wl() {
  return Hs || (Hs = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = s(at()), p = mr(), l = s(rt()), f = $e();
    function s(o) {
      return o && o.__esModule ? o : { default: o };
    }
    function c(o, v2) {
      for (var m = 0;m < v2.length; m++) {
        var n = v2[m];
        n.enumerable = n.enumerable || false, n.configurable = true, "value" in n && (n.writable = true), Object.defineProperty(o, n.key, n);
      }
    }
    function t(o, v2, m) {
      return v2 && c(o.prototype, v2), Object.defineProperty(o, "prototype", { writable: false }), o;
    }
    function e(o, v2) {
      o.prototype = Object.create(v2.prototype), o.prototype.constructor = o, r(o, v2);
    }
    function r(o, v2) {
      return r = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(n, d) {
        return n.__proto__ = d, n;
      }, r(o, v2);
    }
    var i = /* @__PURE__ */ function(o) {
      e(v2, o);
      function v2(n) {
        var d;
        return d = o.call(this, n) || this, d.type = f.CLASS, d._constructed = true, d;
      }
      var m = v2.prototype;
      return m.valueToString = function() {
        return "." + o.prototype.valueToString.call(this);
      }, t(v2, [{
        key: "value",
        get: function() {
          return this._value;
        },
        set: function(d) {
          if (this._constructed) {
            var _ = (0, h.default)(d, {
              isIdentifier: true
            });
            _ !== d ? ((0, p.ensureObject)(this, "raws"), this.raws.value = _) : this.raws && delete this.raws.value;
          }
          this._value = d;
        }
      }]), v2;
    }(l.default);
    a.default = i, u.exports = a.default;
  }(Qt, Qt.exports)), Qt.exports;
}
var Ht = { exports: {} };
var Js;
function Vl() {
  return Js || (Js = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(rt()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.COMMENT, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Ht, Ht.exports)), Ht.exports;
}
var Jt = { exports: {} };
var Ks;
function jl() {
  return Ks || (Ks = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(rt()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(i) {
        var o;
        return o = t.call(this, i) || this, o.type = p.ID, o;
      }
      var r = e.prototype;
      return r.valueToString = function() {
        return "#" + t.prototype.valueToString.call(this);
      }, e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Jt, Jt.exports)), Jt.exports;
}
var Kt = { exports: {} };
var Xt = { exports: {} };
var Xs;
function Yi() {
  return Xs || (Xs = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = f(at()), p = mr(), l = f(rt());
    function f(i) {
      return i && i.__esModule ? i : { default: i };
    }
    function s(i, o) {
      for (var v2 = 0;v2 < o.length; v2++) {
        var m = o[v2];
        m.enumerable = m.enumerable || false, m.configurable = true, "value" in m && (m.writable = true), Object.defineProperty(i, m.key, m);
      }
    }
    function c(i, o, v2) {
      return o && s(i.prototype, o), Object.defineProperty(i, "prototype", { writable: false }), i;
    }
    function t(i, o) {
      i.prototype = Object.create(o.prototype), i.prototype.constructor = i, e(i, o);
    }
    function e(i, o) {
      return e = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(m, n) {
        return m.__proto__ = n, m;
      }, e(i, o);
    }
    var r = /* @__PURE__ */ function(i) {
      t(o, i);
      function o() {
        return i.apply(this, arguments) || this;
      }
      var v2 = o.prototype;
      return v2.qualifiedName = function(n) {
        return this.namespace ? this.namespaceString + "|" + n : n;
      }, v2.valueToString = function() {
        return this.qualifiedName(i.prototype.valueToString.call(this));
      }, c(o, [{
        key: "namespace",
        get: function() {
          return this._namespace;
        },
        set: function(n) {
          if (n === true || n === "*" || n === "&") {
            this._namespace = n, this.raws && delete this.raws.namespace;
            return;
          }
          var d = (0, h.default)(n, {
            isIdentifier: true
          });
          this._namespace = n, d !== n ? ((0, p.ensureObject)(this, "raws"), this.raws.namespace = d) : this.raws && delete this.raws.namespace;
        }
      }, {
        key: "ns",
        get: function() {
          return this._namespace;
        },
        set: function(n) {
          this.namespace = n;
        }
      }, {
        key: "namespaceString",
        get: function() {
          if (this.namespace) {
            var n = this.stringifyProperty("namespace");
            return n === true ? "" : n;
          } else
            return "";
        }
      }]), o;
    }(l.default);
    a.default = r, u.exports = a.default;
  }(Xt, Xt.exports)), Xt.exports;
}
var Zs;
function Bl() {
  return Zs || (Zs = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Yi()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.TAG, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Kt, Kt.exports)), Kt.exports;
}
var Zt = { exports: {} };
var eo;
function Gl() {
  return eo || (eo = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(rt()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.STRING, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(Zt, Zt.exports)), Zt.exports;
}
var er = { exports: {} };
var to;
function Yl() {
  return to || (to = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Gi()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(i) {
        var o;
        return o = t.call(this, i) || this, o.type = p.PSEUDO, o;
      }
      var r = e.prototype;
      return r.toString = function() {
        var o = this.length ? "(" + this.map(String).join(",") + ")" : "";
        return [this.rawSpaceBefore, this.stringifyProperty("value"), o, this.rawSpaceAfter].join("");
      }, e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(er, er.exports)), er.exports;
}
var In = {};
var ro;
function Ql() {
  return ro || (ro = 1, function(u) {
    u.__esModule = true, u.default = undefined, u.unescapeValue = d;
    var a = s(at()), h = s(Bi()), p = s(Yi()), l = $e(), f;
    function s(g) {
      return g && g.__esModule ? g : { default: g };
    }
    function c(g, O) {
      for (var A = 0;A < O.length; A++) {
        var E = O[A];
        E.enumerable = E.enumerable || false, E.configurable = true, "value" in E && (E.writable = true), Object.defineProperty(g, E.key, E);
      }
    }
    function t(g, O, A) {
      return O && c(g.prototype, O), Object.defineProperty(g, "prototype", { writable: false }), g;
    }
    function e(g, O) {
      g.prototype = Object.create(O.prototype), g.prototype.constructor = g, r(g, O);
    }
    function r(g, O) {
      return r = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(E, b) {
        return E.__proto__ = b, E;
      }, r(g, O);
    }
    var i = Rl(), o = /^('|")([^]*)\1$/, v2 = i(function() {}, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead."), m = i(function() {}, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead."), n = i(function() {}, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
    function d(g) {
      var O = false, A = null, E = g, b = E.match(o);
      return b && (A = b[1], E = b[2]), E = (0, h.default)(E), E !== g && (O = true), {
        deprecatedUsage: O,
        unescaped: E,
        quoteMark: A
      };
    }
    function _(g) {
      if (g.quoteMark !== undefined || g.value === undefined)
        return g;
      n();
      var O = d(g.value), A = O.quoteMark, E = O.unescaped;
      return g.raws || (g.raws = {}), g.raws.value === undefined && (g.raws.value = g.value), g.value = E, g.quoteMark = A, g;
    }
    var w = /* @__PURE__ */ function(g) {
      e(O, g);
      function O(E) {
        var b;
        return E === undefined && (E = {}), b = g.call(this, _(E)) || this, b.type = l.ATTRIBUTE, b.raws = b.raws || {}, Object.defineProperty(b.raws, "unquoted", {
          get: i(function() {
            return b.value;
          }, "attr.raws.unquoted is deprecated. Call attr.value instead."),
          set: i(function() {
            return b.value;
          }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.")
        }), b._constructed = true, b;
      }
      var A = O.prototype;
      return A.getQuotedValue = function(b) {
        b === undefined && (b = {});
        var k = this._determineQuoteMark(b), q = y[k], M = (0, a.default)(this._value, q);
        return M;
      }, A._determineQuoteMark = function(b) {
        return b.smart ? this.smartQuoteMark(b) : this.preferredQuoteMark(b);
      }, A.setValue = function(b, k) {
        k === undefined && (k = {}), this._value = b, this._quoteMark = this._determineQuoteMark(k), this._syncRawValue();
      }, A.smartQuoteMark = function(b) {
        var k = this.value, q = k.replace(/[^']/g, "").length, M = k.replace(/[^"]/g, "").length;
        if (q + M === 0) {
          var W = (0, a.default)(k, {
            isIdentifier: true
          });
          if (W === k)
            return O.NO_QUOTE;
          var S = this.preferredQuoteMark(b);
          if (S === O.NO_QUOTE) {
            var P = this.quoteMark || b.quoteMark || O.DOUBLE_QUOTE, C = y[P], R = (0, a.default)(k, C);
            if (R.length < W.length)
              return P;
          }
          return S;
        } else
          return M === q ? this.preferredQuoteMark(b) : M < q ? O.DOUBLE_QUOTE : O.SINGLE_QUOTE;
      }, A.preferredQuoteMark = function(b) {
        var k = b.preferCurrentQuoteMark ? this.quoteMark : b.quoteMark;
        return k === undefined && (k = b.preferCurrentQuoteMark ? b.quoteMark : this.quoteMark), k === undefined && (k = O.DOUBLE_QUOTE), k;
      }, A._syncRawValue = function() {
        var b = (0, a.default)(this._value, y[this.quoteMark]);
        b === this._value ? this.raws && delete this.raws.value : this.raws.value = b;
      }, A._handleEscapes = function(b, k) {
        if (this._constructed) {
          var q = (0, a.default)(k, {
            isIdentifier: true
          });
          q !== k ? this.raws[b] = q : delete this.raws[b];
        }
      }, A._spacesFor = function(b) {
        var k = {
          before: "",
          after: ""
        }, q = this.spaces[b] || {}, M = this.raws.spaces && this.raws.spaces[b] || {};
        return Object.assign(k, q, M);
      }, A._stringFor = function(b, k, q) {
        k === undefined && (k = b), q === undefined && (q = x);
        var M = this._spacesFor(k);
        return q(this.stringifyProperty(b), M);
      }, A.offsetOf = function(b) {
        var k = 1, q = this._spacesFor("attribute");
        if (k += q.before.length, b === "namespace" || b === "ns")
          return this.namespace ? k : -1;
        if (b === "attributeNS" || (k += this.namespaceString.length, this.namespace && (k += 1), b === "attribute"))
          return k;
        k += this.stringifyProperty("attribute").length, k += q.after.length;
        var M = this._spacesFor("operator");
        k += M.before.length;
        var W = this.stringifyProperty("operator");
        if (b === "operator")
          return W ? k : -1;
        k += W.length, k += M.after.length;
        var S = this._spacesFor("value");
        k += S.before.length;
        var P = this.stringifyProperty("value");
        if (b === "value")
          return P ? k : -1;
        k += P.length, k += S.after.length;
        var C = this._spacesFor("insensitive");
        return k += C.before.length, b === "insensitive" && this.insensitive ? k : -1;
      }, A.toString = function() {
        var b = this, k = [this.rawSpaceBefore, "["];
        return k.push(this._stringFor("qualifiedAttribute", "attribute")), this.operator && (this.value || this.value === "") && (k.push(this._stringFor("operator")), k.push(this._stringFor("value")), k.push(this._stringFor("insensitiveFlag", "insensitive", function(q, M) {
          return q.length > 0 && !b.quoted && M.before.length === 0 && !(b.spaces.value && b.spaces.value.after) && (M.before = " "), x(q, M);
        }))), k.push("]"), k.push(this.rawSpaceAfter), k.join("");
      }, t(O, [{
        key: "quoted",
        get: function() {
          var b = this.quoteMark;
          return b === "'" || b === '"';
        },
        set: function(b) {
          m();
        }
      }, {
        key: "quoteMark",
        get: function() {
          return this._quoteMark;
        },
        set: function(b) {
          if (!this._constructed) {
            this._quoteMark = b;
            return;
          }
          this._quoteMark !== b && (this._quoteMark = b, this._syncRawValue());
        }
      }, {
        key: "qualifiedAttribute",
        get: function() {
          return this.qualifiedName(this.raws.attribute || this.attribute);
        }
      }, {
        key: "insensitiveFlag",
        get: function() {
          return this.insensitive ? "i" : "";
        }
      }, {
        key: "value",
        get: function() {
          return this._value;
        },
        set: function(b) {
          if (this._constructed) {
            var k = d(b), q = k.deprecatedUsage, M = k.unescaped, W = k.quoteMark;
            if (q && v2(), M === this._value && W === this._quoteMark)
              return;
            this._value = M, this._quoteMark = W, this._syncRawValue();
          } else
            this._value = b;
        }
      }, {
        key: "insensitive",
        get: function() {
          return this._insensitive;
        },
        set: function(b) {
          b || (this._insensitive = false, this.raws && (this.raws.insensitiveFlag === "I" || this.raws.insensitiveFlag === "i") && (this.raws.insensitiveFlag = undefined)), this._insensitive = b;
        }
      }, {
        key: "attribute",
        get: function() {
          return this._attribute;
        },
        set: function(b) {
          this._handleEscapes("attribute", b), this._attribute = b;
        }
      }]), O;
    }(p.default);
    u.default = w, w.NO_QUOTE = null, w.SINGLE_QUOTE = "'", w.DOUBLE_QUOTE = '"';
    var y = (f = {
      "'": {
        quotes: "single",
        wrap: true
      },
      '"': {
        quotes: "double",
        wrap: true
      }
    }, f[null] = {
      isIdentifier: true
    }, f);
    function x(g, O) {
      return "" + O.before + g + O.after;
    }
  }(In)), In;
}
var tr = { exports: {} };
var no;
function Hl() {
  return no || (no = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(Yi()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.UNIVERSAL, i.value = "*", i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(tr, tr.exports)), tr.exports;
}
var rr = { exports: {} };
var io;
function Jl() {
  return io || (io = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(rt()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.COMBINATOR, i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(rr, rr.exports)), rr.exports;
}
var nr = { exports: {} };
var ao;
function Kl() {
  return ao || (ao = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = l(rt()), p = $e();
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function f(t, e) {
      t.prototype = Object.create(e.prototype), t.prototype.constructor = t, s(t, e);
    }
    function s(t, e) {
      return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(i, o) {
        return i.__proto__ = o, i;
      }, s(t, e);
    }
    var c = /* @__PURE__ */ function(t) {
      f(e, t);
      function e(r) {
        var i;
        return i = t.call(this, r) || this, i.type = p.NESTING, i.value = "&", i;
      }
      return e;
    }(h.default);
    a.default = c, u.exports = a.default;
  }(nr, nr.exports)), nr.exports;
}
var ir = { exports: {} };
var so;
function hf() {
  return so || (so = 1, function(u, a) {
    a.__esModule = true, a.default = h;
    function h(p) {
      return p.sort(function(l, f) {
        return l - f;
      });
    }
    u.exports = a.default;
  }(ir, ir.exports)), ir.exports;
}
var Mn = {};
var le = {};
var oo;
function Xl() {
  if (oo)
    return le;
  oo = 1, le.__esModule = true, le.word = le.tilde = le.tab = le.str = le.space = le.slash = le.singleQuote = le.semicolon = le.plus = le.pipe = le.openSquare = le.openParenthesis = le.newline = le.greaterThan = le.feed = le.equals = le.doubleQuote = le.dollar = le.cr = le.comment = le.comma = le.combinator = le.colon = le.closeSquare = le.closeParenthesis = le.caret = le.bang = le.backslash = le.at = le.asterisk = le.ampersand = undefined;
  var u = 38;
  le.ampersand = u;
  var a = 42;
  le.asterisk = a;
  var h = 64;
  le.at = h;
  var p = 44;
  le.comma = p;
  var l = 58;
  le.colon = l;
  var f = 59;
  le.semicolon = f;
  var s = 40;
  le.openParenthesis = s;
  var c = 41;
  le.closeParenthesis = c;
  var t = 91;
  le.openSquare = t;
  var e = 93;
  le.closeSquare = e;
  var r = 36;
  le.dollar = r;
  var i = 126;
  le.tilde = i;
  var o = 94;
  le.caret = o;
  var v2 = 43;
  le.plus = v2;
  var m = 61;
  le.equals = m;
  var n = 124;
  le.pipe = n;
  var d = 62;
  le.greaterThan = d;
  var _ = 32;
  le.space = _;
  var w = 39;
  le.singleQuote = w;
  var y = 34;
  le.doubleQuote = y;
  var x = 47;
  le.slash = x;
  var g = 33;
  le.bang = g;
  var O = 92;
  le.backslash = O;
  var A = 13;
  le.cr = A;
  var E = 12;
  le.feed = E;
  var b = 10;
  le.newline = b;
  var k = 9;
  le.tab = k;
  var q = w;
  le.str = q;
  var M = -1;
  le.comment = M;
  var W = -2;
  le.word = W;
  var S = -3;
  return le.combinator = S, le;
}
var lo;
function vf() {
  return lo || (lo = 1, function(u) {
    u.__esModule = true, u.FIELDS = undefined, u.default = m;
    var a = f(Xl()), h, p;
    function l(n) {
      if (typeof WeakMap != "function")
        return null;
      var d = /* @__PURE__ */ new WeakMap, _ = /* @__PURE__ */ new WeakMap;
      return (l = function(y) {
        return y ? _ : d;
      })(n);
    }
    function f(n, d) {
      if (n && n.__esModule)
        return n;
      if (n === null || typeof n != "object" && typeof n != "function")
        return { default: n };
      var _ = l(d);
      if (_ && _.has(n))
        return _.get(n);
      var w = {}, y = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var x in n)
        if (x !== "default" && Object.prototype.hasOwnProperty.call(n, x)) {
          var g = y ? Object.getOwnPropertyDescriptor(n, x) : null;
          g && (g.get || g.set) ? Object.defineProperty(w, x, g) : w[x] = n[x];
        }
      return w.default = n, _ && _.set(n, w), w;
    }
    for (var s = (h = {}, h[a.tab] = true, h[a.newline] = true, h[a.cr] = true, h[a.feed] = true, h), c = (p = {}, p[a.space] = true, p[a.tab] = true, p[a.newline] = true, p[a.cr] = true, p[a.feed] = true, p[a.ampersand] = true, p[a.asterisk] = true, p[a.bang] = true, p[a.comma] = true, p[a.colon] = true, p[a.semicolon] = true, p[a.openParenthesis] = true, p[a.closeParenthesis] = true, p[a.openSquare] = true, p[a.closeSquare] = true, p[a.singleQuote] = true, p[a.doubleQuote] = true, p[a.plus] = true, p[a.pipe] = true, p[a.tilde] = true, p[a.greaterThan] = true, p[a.equals] = true, p[a.dollar] = true, p[a.caret] = true, p[a.slash] = true, p), t = {}, e = "0123456789abcdefABCDEF", r = 0;r < e.length; r++)
      t[e.charCodeAt(r)] = true;
    function i(n, d) {
      var _ = d, w;
      do {
        if (w = n.charCodeAt(_), c[w])
          return _ - 1;
        w === a.backslash ? _ = o(n, _) + 1 : _++;
      } while (_ < n.length);
      return _ - 1;
    }
    function o(n, d) {
      var _ = d, w = n.charCodeAt(_ + 1);
      if (!s[w])
        if (t[w]) {
          var y = 0;
          do
            _++, y++, w = n.charCodeAt(_ + 1);
          while (t[w] && y < 6);
          y < 6 && w === a.space && _++;
        } else
          _++;
      return _;
    }
    var v2 = {
      TYPE: 0,
      START_LINE: 1,
      START_COL: 2,
      END_LINE: 3,
      END_COL: 4,
      START_POS: 5,
      END_POS: 6
    };
    u.FIELDS = v2;
    function m(n) {
      var d = [], _ = n.css.valueOf(), w = _, y = w.length, x = -1, g = 1, O = 0, A = 0, E, b, k, q, M, W, S, P, C, R, $, B, z;
      function L(F, D) {
        if (n.safe)
          _ += D, C = _.length - 1;
        else
          throw n.error("Unclosed " + F, g, O - x, O);
      }
      for (;O < y; ) {
        switch (E = _.charCodeAt(O), E === a.newline && (x = O, g += 1), E) {
          case a.space:
          case a.tab:
          case a.newline:
          case a.cr:
          case a.feed:
            C = O;
            do
              C += 1, E = _.charCodeAt(C), E === a.newline && (x = C, g += 1);
            while (E === a.space || E === a.newline || E === a.tab || E === a.cr || E === a.feed);
            z = a.space, q = g, k = C - x - 1, A = C;
            break;
          case a.plus:
          case a.greaterThan:
          case a.tilde:
          case a.pipe:
            C = O;
            do
              C += 1, E = _.charCodeAt(C);
            while (E === a.plus || E === a.greaterThan || E === a.tilde || E === a.pipe);
            z = a.combinator, q = g, k = O - x, A = C;
            break;
          case a.asterisk:
          case a.ampersand:
          case a.bang:
          case a.comma:
          case a.equals:
          case a.dollar:
          case a.caret:
          case a.openSquare:
          case a.closeSquare:
          case a.colon:
          case a.semicolon:
          case a.openParenthesis:
          case a.closeParenthesis:
            C = O, z = E, q = g, k = O - x, A = C + 1;
            break;
          case a.singleQuote:
          case a.doubleQuote:
            B = E === a.singleQuote ? "'" : '"', C = O;
            do
              for (M = false, C = _.indexOf(B, C + 1), C === -1 && L("quote", B), W = C;_.charCodeAt(W - 1) === a.backslash; )
                W -= 1, M = !M;
            while (M);
            z = a.str, q = g, k = O - x, A = C + 1;
            break;
          default:
            E === a.slash && _.charCodeAt(O + 1) === a.asterisk ? (C = _.indexOf("*/", O + 2) + 1, C === 0 && L("comment", "*/"), b = _.slice(O, C + 1), P = b.split(`
`), S = P.length - 1, S > 0 ? (R = g + S, $ = C - P[S].length) : (R = g, $ = x), z = a.comment, g = R, q = R, k = C - $) : E === a.slash ? (C = O, z = E, q = g, k = O - x, A = C + 1) : (C = i(_, O), z = a.word, q = g, k = C - x), A = C + 1;
            break;
        }
        d.push([
          z,
          g,
          O - x,
          q,
          k,
          O,
          A
        ]), $ && (x = $, $ = null), O = A;
      }
      return d;
    }
  }(Mn)), Mn;
}
var uo;
function gf() {
  return uo || (uo = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = A(Ul()), p = A(zl()), l = A(Wl()), f = A(Vl()), s = A(jl()), c = A(Bl()), t = A(Gl()), e = A(Yl()), r = O(Ql()), i = A(Hl()), o = A(Jl()), v2 = A(Kl()), m = A(hf()), n = O(vf()), d = O(Xl()), _ = O($e()), w = mr(), y, x;
    function g(L) {
      if (typeof WeakMap != "function")
        return null;
      var F = /* @__PURE__ */ new WeakMap, D = /* @__PURE__ */ new WeakMap;
      return (g = function(N) {
        return N ? D : F;
      })(L);
    }
    function O(L, F) {
      if (L && L.__esModule)
        return L;
      if (L === null || typeof L != "object" && typeof L != "function")
        return { default: L };
      var D = g(F);
      if (D && D.has(L))
        return D.get(L);
      var I = {}, N = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var J in L)
        if (J !== "default" && Object.prototype.hasOwnProperty.call(L, J)) {
          var T = N ? Object.getOwnPropertyDescriptor(L, J) : null;
          T && (T.get || T.set) ? Object.defineProperty(I, J, T) : I[J] = L[J];
        }
      return I.default = L, D && D.set(L, I), I;
    }
    function A(L) {
      return L && L.__esModule ? L : { default: L };
    }
    function E(L, F) {
      for (var D = 0;D < F.length; D++) {
        var I = F[D];
        I.enumerable = I.enumerable || false, I.configurable = true, "value" in I && (I.writable = true), Object.defineProperty(L, I.key, I);
      }
    }
    function b(L, F, D) {
      return F && E(L.prototype, F), Object.defineProperty(L, "prototype", { writable: false }), L;
    }
    var k = (y = {}, y[d.space] = true, y[d.cr] = true, y[d.feed] = true, y[d.newline] = true, y[d.tab] = true, y), q = Object.assign({}, k, (x = {}, x[d.comment] = true, x));
    function M(L) {
      return {
        line: L[n.FIELDS.START_LINE],
        column: L[n.FIELDS.START_COL]
      };
    }
    function W(L) {
      return {
        line: L[n.FIELDS.END_LINE],
        column: L[n.FIELDS.END_COL]
      };
    }
    function S(L, F, D, I) {
      return {
        start: {
          line: L,
          column: F
        },
        end: {
          line: D,
          column: I
        }
      };
    }
    function P(L) {
      return S(L[n.FIELDS.START_LINE], L[n.FIELDS.START_COL], L[n.FIELDS.END_LINE], L[n.FIELDS.END_COL]);
    }
    function C(L, F) {
      if (L)
        return S(L[n.FIELDS.START_LINE], L[n.FIELDS.START_COL], F[n.FIELDS.END_LINE], F[n.FIELDS.END_COL]);
    }
    function R(L, F) {
      var D = L[F];
      if (typeof D == "string")
        return D.indexOf("\\") !== -1 && ((0, w.ensureObject)(L, "raws"), L[F] = (0, w.unesc)(D), L.raws[F] === undefined && (L.raws[F] = D)), L;
    }
    function $(L, F) {
      for (var D = -1, I = [];(D = L.indexOf(F, D + 1)) !== -1; )
        I.push(D);
      return I;
    }
    function B() {
      var L = Array.prototype.concat.apply([], arguments);
      return L.filter(function(F, D) {
        return D === L.indexOf(F);
      });
    }
    var z = /* @__PURE__ */ function() {
      function L(D, I) {
        I === undefined && (I = {}), this.rule = D, this.options = Object.assign({
          lossy: false,
          safe: false
        }, I), this.position = 0, this.css = typeof this.rule == "string" ? this.rule : this.rule.selector, this.tokens = (0, n.default)({
          css: this.css,
          error: this._errorGenerator(),
          safe: this.options.safe
        });
        var N = C(this.tokens[0], this.tokens[this.tokens.length - 1]);
        this.root = new h.default({
          source: N
        }), this.root.errorGenerator = this._errorGenerator();
        var J = new p.default({
          source: {
            start: {
              line: 1,
              column: 1
            }
          },
          sourceIndex: 0
        });
        this.root.append(J), this.current = J, this.loop();
      }
      var F = L.prototype;
      return F._errorGenerator = function() {
        var I = this;
        return function(N, J) {
          return typeof I.rule == "string" ? new Error(N) : I.rule.error(N, J);
        };
      }, F.attribute = function() {
        var I = [], N = this.currToken;
        for (this.position++;this.position < this.tokens.length && this.currToken[n.FIELDS.TYPE] !== d.closeSquare; )
          I.push(this.currToken), this.position++;
        if (this.currToken[n.FIELDS.TYPE] !== d.closeSquare)
          return this.expected("closing square bracket", this.currToken[n.FIELDS.START_POS]);
        var J = I.length, T = {
          source: S(N[1], N[2], this.currToken[3], this.currToken[4]),
          sourceIndex: N[n.FIELDS.START_POS]
        };
        if (J === 1 && !~[d.word].indexOf(I[0][n.FIELDS.TYPE]))
          return this.expected("attribute", I[0][n.FIELDS.START_POS]);
        for (var U = 0, j = "", H = "", V = null, K = false;U < J; ) {
          var X = I[U], Q = this.content(X), ne = I[U + 1];
          switch (X[n.FIELDS.TYPE]) {
            case d.space:
              if (K = true, this.options.lossy)
                break;
              if (V) {
                (0, w.ensureObject)(T, "spaces", V);
                var de = T.spaces[V].after || "";
                T.spaces[V].after = de + Q;
                var _e = (0, w.getProp)(T, "raws", "spaces", V, "after") || null;
                _e && (T.raws.spaces[V].after = _e + Q);
              } else
                j = j + Q, H = H + Q;
              break;
            case d.asterisk:
              if (ne[n.FIELDS.TYPE] === d.equals)
                T.operator = Q, V = "operator";
              else if ((!T.namespace || V === "namespace" && !K) && ne) {
                j && ((0, w.ensureObject)(T, "spaces", "attribute"), T.spaces.attribute.before = j, j = ""), H && ((0, w.ensureObject)(T, "raws", "spaces", "attribute"), T.raws.spaces.attribute.before = j, H = ""), T.namespace = (T.namespace || "") + Q;
                var be = (0, w.getProp)(T, "raws", "namespace") || null;
                be && (T.raws.namespace += Q), V = "namespace";
              }
              K = false;
              break;
            case d.dollar:
              if (V === "value") {
                var ie = (0, w.getProp)(T, "raws", "value");
                T.value += "$", ie && (T.raws.value = ie + "$");
                break;
              }
            case d.caret:
              ne[n.FIELDS.TYPE] === d.equals && (T.operator = Q, V = "operator"), K = false;
              break;
            case d.combinator:
              if (Q === "~" && ne[n.FIELDS.TYPE] === d.equals && (T.operator = Q, V = "operator"), Q !== "|") {
                K = false;
                break;
              }
              ne[n.FIELDS.TYPE] === d.equals ? (T.operator = Q, V = "operator") : !T.namespace && !T.attribute && (T.namespace = true), K = false;
              break;
            case d.word:
              if (ne && this.content(ne) === "|" && I[U + 2] && I[U + 2][n.FIELDS.TYPE] !== d.equals && !T.operator && !T.namespace)
                T.namespace = Q, V = "namespace";
              else if (!T.attribute || V === "attribute" && !K) {
                j && ((0, w.ensureObject)(T, "spaces", "attribute"), T.spaces.attribute.before = j, j = ""), H && ((0, w.ensureObject)(T, "raws", "spaces", "attribute"), T.raws.spaces.attribute.before = H, H = ""), T.attribute = (T.attribute || "") + Q;
                var ke = (0, w.getProp)(T, "raws", "attribute") || null;
                ke && (T.raws.attribute += Q), V = "attribute";
              } else if (!T.value && T.value !== "" || V === "value" && !(K || T.quoteMark)) {
                var Y = (0, w.unesc)(Q), G = (0, w.getProp)(T, "raws", "value") || "", te = T.value || "";
                T.value = te + Y, T.quoteMark = null, (Y !== Q || G) && ((0, w.ensureObject)(T, "raws"), T.raws.value = (G || te) + Q), V = "value";
              } else {
                var Z = Q === "i" || Q === "I";
                (T.value || T.value === "") && (T.quoteMark || K) ? (T.insensitive = Z, (!Z || Q === "I") && ((0, w.ensureObject)(T, "raws"), T.raws.insensitiveFlag = Q), V = "insensitive", j && ((0, w.ensureObject)(T, "spaces", "insensitive"), T.spaces.insensitive.before = j, j = ""), H && ((0, w.ensureObject)(T, "raws", "spaces", "insensitive"), T.raws.spaces.insensitive.before = H, H = "")) : (T.value || T.value === "") && (V = "value", T.value += Q, T.raws.value && (T.raws.value += Q));
              }
              K = false;
              break;
            case d.str:
              if (!T.attribute || !T.operator)
                return this.error("Expected an attribute followed by an operator preceding the string.", {
                  index: X[n.FIELDS.START_POS]
                });
              var ee = (0, r.unescapeValue)(Q), se = ee.unescaped, ue = ee.quoteMark;
              T.value = se, T.quoteMark = ue, V = "value", (0, w.ensureObject)(T, "raws"), T.raws.value = Q, K = false;
              break;
            case d.equals:
              if (!T.attribute)
                return this.expected("attribute", X[n.FIELDS.START_POS], Q);
              if (T.value)
                return this.error('Unexpected "=" found; an operator was already defined.', {
                  index: X[n.FIELDS.START_POS]
                });
              T.operator = T.operator ? T.operator + Q : Q, V = "operator", K = false;
              break;
            case d.comment:
              if (V)
                if (K || ne && ne[n.FIELDS.TYPE] === d.space || V === "insensitive") {
                  var xe = (0, w.getProp)(T, "spaces", V, "after") || "", ce = (0, w.getProp)(T, "raws", "spaces", V, "after") || xe;
                  (0, w.ensureObject)(T, "raws", "spaces", V), T.raws.spaces[V].after = ce + Q;
                } else {
                  var Te = T[V] || "", ve = (0, w.getProp)(T, "raws", V) || Te;
                  (0, w.ensureObject)(T, "raws"), T.raws[V] = ve + Q;
                }
              else
                H = H + Q;
              break;
            default:
              return this.error('Unexpected "' + Q + '" found.', {
                index: X[n.FIELDS.START_POS]
              });
          }
          U++;
        }
        R(T, "attribute"), R(T, "namespace"), this.newNode(new r.default(T)), this.position++;
      }, F.parseWhitespaceEquivalentTokens = function(I) {
        I < 0 && (I = this.tokens.length);
        var N = this.position, J = [], T = "", U = undefined;
        do
          if (k[this.currToken[n.FIELDS.TYPE]])
            this.options.lossy || (T += this.content());
          else if (this.currToken[n.FIELDS.TYPE] === d.comment) {
            var j = {};
            T && (j.before = T, T = ""), U = new f.default({
              value: this.content(),
              source: P(this.currToken),
              sourceIndex: this.currToken[n.FIELDS.START_POS],
              spaces: j
            }), J.push(U);
          }
        while (++this.position < I);
        if (T) {
          if (U)
            U.spaces.after = T;
          else if (!this.options.lossy) {
            var H = this.tokens[N], V = this.tokens[this.position - 1];
            J.push(new t.default({
              value: "",
              source: S(H[n.FIELDS.START_LINE], H[n.FIELDS.START_COL], V[n.FIELDS.END_LINE], V[n.FIELDS.END_COL]),
              sourceIndex: H[n.FIELDS.START_POS],
              spaces: {
                before: T,
                after: ""
              }
            }));
          }
        }
        return J;
      }, F.convertWhitespaceNodesToSpace = function(I, N) {
        var J = this;
        N === undefined && (N = false);
        var T = "", U = "";
        I.forEach(function(H) {
          var V = J.lossySpace(H.spaces.before, N), K = J.lossySpace(H.rawSpaceBefore, N);
          T += V + J.lossySpace(H.spaces.after, N && V.length === 0), U += V + H.value + J.lossySpace(H.rawSpaceAfter, N && K.length === 0);
        }), U === T && (U = undefined);
        var j = {
          space: T,
          rawSpace: U
        };
        return j;
      }, F.isNamedCombinator = function(I) {
        return I === undefined && (I = this.position), this.tokens[I + 0] && this.tokens[I + 0][n.FIELDS.TYPE] === d.slash && this.tokens[I + 1] && this.tokens[I + 1][n.FIELDS.TYPE] === d.word && this.tokens[I + 2] && this.tokens[I + 2][n.FIELDS.TYPE] === d.slash;
      }, F.namedCombinator = function() {
        if (this.isNamedCombinator()) {
          var I = this.content(this.tokens[this.position + 1]), N = (0, w.unesc)(I).toLowerCase(), J = {};
          N !== I && (J.value = "/" + I + "/");
          var T = new o.default({
            value: "/" + N + "/",
            source: S(this.currToken[n.FIELDS.START_LINE], this.currToken[n.FIELDS.START_COL], this.tokens[this.position + 2][n.FIELDS.END_LINE], this.tokens[this.position + 2][n.FIELDS.END_COL]),
            sourceIndex: this.currToken[n.FIELDS.START_POS],
            raws: J
          });
          return this.position = this.position + 3, T;
        } else
          this.unexpected();
      }, F.combinator = function() {
        var I = this;
        if (this.content() === "|")
          return this.namespace();
        var N = this.locateNextMeaningfulToken(this.position);
        if (N < 0 || this.tokens[N][n.FIELDS.TYPE] === d.comma || this.tokens[N][n.FIELDS.TYPE] === d.closeParenthesis) {
          var J = this.parseWhitespaceEquivalentTokens(N);
          if (J.length > 0) {
            var T = this.current.last;
            if (T) {
              var U = this.convertWhitespaceNodesToSpace(J), j = U.space, H = U.rawSpace;
              H !== undefined && (T.rawSpaceAfter += H), T.spaces.after += j;
            } else
              J.forEach(function(G) {
                return I.newNode(G);
              });
          }
          return;
        }
        var V = this.currToken, K = undefined;
        N > this.position && (K = this.parseWhitespaceEquivalentTokens(N));
        var X;
        if (this.isNamedCombinator() ? X = this.namedCombinator() : this.currToken[n.FIELDS.TYPE] === d.combinator ? (X = new o.default({
          value: this.content(),
          source: P(this.currToken),
          sourceIndex: this.currToken[n.FIELDS.START_POS]
        }), this.position++) : k[this.currToken[n.FIELDS.TYPE]] || K || this.unexpected(), X) {
          if (K) {
            var Q = this.convertWhitespaceNodesToSpace(K), ne = Q.space, de = Q.rawSpace;
            X.spaces.before = ne, X.rawSpaceBefore = de;
          }
        } else {
          var _e = this.convertWhitespaceNodesToSpace(K, true), be = _e.space, ie = _e.rawSpace;
          ie || (ie = be);
          var ke = {}, Y = {
            spaces: {}
          };
          be.endsWith(" ") && ie.endsWith(" ") ? (ke.before = be.slice(0, be.length - 1), Y.spaces.before = ie.slice(0, ie.length - 1)) : be.startsWith(" ") && ie.startsWith(" ") ? (ke.after = be.slice(1), Y.spaces.after = ie.slice(1)) : Y.value = ie, X = new o.default({
            value: " ",
            source: C(V, this.tokens[this.position - 1]),
            sourceIndex: V[n.FIELDS.START_POS],
            spaces: ke,
            raws: Y
          });
        }
        return this.currToken && this.currToken[n.FIELDS.TYPE] === d.space && (X.spaces.after = this.optionalSpace(this.content()), this.position++), this.newNode(X);
      }, F.comma = function() {
        if (this.position === this.tokens.length - 1) {
          this.root.trailingComma = true, this.position++;
          return;
        }
        this.current._inferEndPosition();
        var I = new p.default({
          source: {
            start: M(this.tokens[this.position + 1])
          },
          sourceIndex: this.tokens[this.position + 1][n.FIELDS.START_POS]
        });
        this.current.parent.append(I), this.current = I, this.position++;
      }, F.comment = function() {
        var I = this.currToken;
        this.newNode(new f.default({
          value: this.content(),
          source: P(I),
          sourceIndex: I[n.FIELDS.START_POS]
        })), this.position++;
      }, F.error = function(I, N) {
        throw this.root.error(I, N);
      }, F.missingBackslash = function() {
        return this.error("Expected a backslash preceding the semicolon.", {
          index: this.currToken[n.FIELDS.START_POS]
        });
      }, F.missingParenthesis = function() {
        return this.expected("opening parenthesis", this.currToken[n.FIELDS.START_POS]);
      }, F.missingSquareBracket = function() {
        return this.expected("opening square bracket", this.currToken[n.FIELDS.START_POS]);
      }, F.unexpected = function() {
        return this.error("Unexpected '" + this.content() + "'. Escaping special characters with \\ may help.", this.currToken[n.FIELDS.START_POS]);
      }, F.unexpectedPipe = function() {
        return this.error("Unexpected '|'.", this.currToken[n.FIELDS.START_POS]);
      }, F.namespace = function() {
        var I = this.prevToken && this.content(this.prevToken) || true;
        if (this.nextToken[n.FIELDS.TYPE] === d.word)
          return this.position++, this.word(I);
        if (this.nextToken[n.FIELDS.TYPE] === d.asterisk)
          return this.position++, this.universal(I);
        this.unexpectedPipe();
      }, F.nesting = function() {
        if (this.nextToken) {
          var I = this.content(this.nextToken);
          if (I === "|") {
            this.position++;
            return;
          }
        }
        var N = this.currToken;
        this.newNode(new v2.default({
          value: this.content(),
          source: P(N),
          sourceIndex: N[n.FIELDS.START_POS]
        })), this.position++;
      }, F.parentheses = function() {
        var I = this.current.last, N = 1;
        if (this.position++, I && I.type === _.PSEUDO) {
          var J = new p.default({
            source: {
              start: M(this.tokens[this.position])
            },
            sourceIndex: this.tokens[this.position][n.FIELDS.START_POS]
          }), T = this.current;
          for (I.append(J), this.current = J;this.position < this.tokens.length && N; )
            this.currToken[n.FIELDS.TYPE] === d.openParenthesis && N++, this.currToken[n.FIELDS.TYPE] === d.closeParenthesis && N--, N ? this.parse() : (this.current.source.end = W(this.currToken), this.current.parent.source.end = W(this.currToken), this.position++);
          this.current = T;
        } else {
          for (var U = this.currToken, j = "(", H;this.position < this.tokens.length && N; )
            this.currToken[n.FIELDS.TYPE] === d.openParenthesis && N++, this.currToken[n.FIELDS.TYPE] === d.closeParenthesis && N--, H = this.currToken, j += this.parseParenthesisToken(this.currToken), this.position++;
          I ? I.appendToPropertyAndEscape("value", j, j) : this.newNode(new t.default({
            value: j,
            source: S(U[n.FIELDS.START_LINE], U[n.FIELDS.START_COL], H[n.FIELDS.END_LINE], H[n.FIELDS.END_COL]),
            sourceIndex: U[n.FIELDS.START_POS]
          }));
        }
        if (N)
          return this.expected("closing parenthesis", this.currToken[n.FIELDS.START_POS]);
      }, F.pseudo = function() {
        for (var I = this, N = "", J = this.currToken;this.currToken && this.currToken[n.FIELDS.TYPE] === d.colon; )
          N += this.content(), this.position++;
        if (!this.currToken)
          return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
        if (this.currToken[n.FIELDS.TYPE] === d.word)
          this.splitWord(false, function(T, U) {
            N += T, I.newNode(new e.default({
              value: N,
              source: C(J, I.currToken),
              sourceIndex: J[n.FIELDS.START_POS]
            })), U > 1 && I.nextToken && I.nextToken[n.FIELDS.TYPE] === d.openParenthesis && I.error("Misplaced parenthesis.", {
              index: I.nextToken[n.FIELDS.START_POS]
            });
          });
        else
          return this.expected(["pseudo-class", "pseudo-element"], this.currToken[n.FIELDS.START_POS]);
      }, F.space = function() {
        var I = this.content();
        this.position === 0 || this.prevToken[n.FIELDS.TYPE] === d.comma || this.prevToken[n.FIELDS.TYPE] === d.openParenthesis || this.current.nodes.every(function(N) {
          return N.type === "comment";
        }) ? (this.spaces = this.optionalSpace(I), this.position++) : this.position === this.tokens.length - 1 || this.nextToken[n.FIELDS.TYPE] === d.comma || this.nextToken[n.FIELDS.TYPE] === d.closeParenthesis ? (this.current.last.spaces.after = this.optionalSpace(I), this.position++) : this.combinator();
      }, F.string = function() {
        var I = this.currToken;
        this.newNode(new t.default({
          value: this.content(),
          source: P(I),
          sourceIndex: I[n.FIELDS.START_POS]
        })), this.position++;
      }, F.universal = function(I) {
        var N = this.nextToken;
        if (N && this.content(N) === "|")
          return this.position++, this.namespace();
        var J = this.currToken;
        this.newNode(new i.default({
          value: this.content(),
          source: P(J),
          sourceIndex: J[n.FIELDS.START_POS]
        }), I), this.position++;
      }, F.splitWord = function(I, N) {
        for (var J = this, T = this.nextToken, U = this.content();T && ~[d.dollar, d.caret, d.equals, d.word].indexOf(T[n.FIELDS.TYPE]); ) {
          this.position++;
          var j = this.content();
          if (U += j, j.lastIndexOf("\\") === j.length - 1) {
            var H = this.nextToken;
            H && H[n.FIELDS.TYPE] === d.space && (U += this.requiredSpace(this.content(H)), this.position++);
          }
          T = this.nextToken;
        }
        var V = $(U, ".").filter(function(ne) {
          var de = U[ne - 1] === "\\", _e = /^\d+\.\d+%$/.test(U);
          return !de && !_e;
        }), K = $(U, "#").filter(function(ne) {
          return U[ne - 1] !== "\\";
        }), X = $(U, "#{");
        X.length && (K = K.filter(function(ne) {
          return !~X.indexOf(ne);
        }));
        var Q = (0, m.default)(B([0].concat(V, K)));
        Q.forEach(function(ne, de) {
          var _e = Q[de + 1] || U.length, be = U.slice(ne, _e);
          if (de === 0 && N)
            return N.call(J, be, Q.length);
          var ie, ke = J.currToken, Y = ke[n.FIELDS.START_POS] + Q[de], G = S(ke[1], ke[2] + ne, ke[3], ke[2] + (_e - 1));
          if (~V.indexOf(ne)) {
            var te = {
              value: be.slice(1),
              source: G,
              sourceIndex: Y
            };
            ie = new l.default(R(te, "value"));
          } else if (~K.indexOf(ne)) {
            var Z = {
              value: be.slice(1),
              source: G,
              sourceIndex: Y
            };
            ie = new s.default(R(Z, "value"));
          } else {
            var ee = {
              value: be,
              source: G,
              sourceIndex: Y
            };
            R(ee, "value"), ie = new c.default(ee);
          }
          J.newNode(ie, I), I = null;
        }), this.position++;
      }, F.word = function(I) {
        var N = this.nextToken;
        return N && this.content(N) === "|" ? (this.position++, this.namespace()) : this.splitWord(I);
      }, F.loop = function() {
        for (;this.position < this.tokens.length; )
          this.parse(true);
        return this.current._inferEndPosition(), this.root;
      }, F.parse = function(I) {
        switch (this.currToken[n.FIELDS.TYPE]) {
          case d.space:
            this.space();
            break;
          case d.comment:
            this.comment();
            break;
          case d.openParenthesis:
            this.parentheses();
            break;
          case d.closeParenthesis:
            I && this.missingParenthesis();
            break;
          case d.openSquare:
            this.attribute();
            break;
          case d.dollar:
          case d.caret:
          case d.equals:
          case d.word:
            this.word();
            break;
          case d.colon:
            this.pseudo();
            break;
          case d.comma:
            this.comma();
            break;
          case d.asterisk:
            this.universal();
            break;
          case d.ampersand:
            this.nesting();
            break;
          case d.slash:
          case d.combinator:
            this.combinator();
            break;
          case d.str:
            this.string();
            break;
          case d.closeSquare:
            this.missingSquareBracket();
          case d.semicolon:
            this.missingBackslash();
          default:
            this.unexpected();
        }
      }, F.expected = function(I, N, J) {
        if (Array.isArray(I)) {
          var T = I.pop();
          I = I.join(", ") + " or " + T;
        }
        var U = /^[aeiou]/.test(I[0]) ? "an" : "a";
        return J ? this.error("Expected " + U + " " + I + ', found "' + J + '" instead.', {
          index: N
        }) : this.error("Expected " + U + " " + I + ".", {
          index: N
        });
      }, F.requiredSpace = function(I) {
        return this.options.lossy ? " " : I;
      }, F.optionalSpace = function(I) {
        return this.options.lossy ? "" : I;
      }, F.lossySpace = function(I, N) {
        return this.options.lossy ? N ? " " : "" : I;
      }, F.parseParenthesisToken = function(I) {
        var N = this.content(I);
        return I[n.FIELDS.TYPE] === d.space ? this.requiredSpace(N) : N;
      }, F.newNode = function(I, N) {
        return N && (/^ +$/.test(N) && (this.options.lossy || (this.spaces = (this.spaces || "") + N), N = true), I.namespace = N, R(I, "namespace")), this.spaces && (I.spaces.before = this.spaces, this.spaces = ""), this.current.append(I);
      }, F.content = function(I) {
        return I === undefined && (I = this.currToken), this.css.slice(I[n.FIELDS.START_POS], I[n.FIELDS.END_POS]);
      }, F.locateNextMeaningfulToken = function(I) {
        I === undefined && (I = this.position + 1);
        for (var N = I;N < this.tokens.length; )
          if (q[this.tokens[N][n.FIELDS.TYPE]]) {
            N++;
            continue;
          } else
            return N;
        return -1;
      }, b(L, [{
        key: "currToken",
        get: function() {
          return this.tokens[this.position];
        }
      }, {
        key: "nextToken",
        get: function() {
          return this.tokens[this.position + 1];
        }
      }, {
        key: "prevToken",
        get: function() {
          return this.tokens[this.position - 1];
        }
      }]), L;
    }();
    a.default = z, u.exports = a.default;
  }($t, $t.exports)), $t.exports;
}
var fo;
function mf() {
  return fo || (fo = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = p(gf());
    function p(f) {
      return f && f.__esModule ? f : { default: f };
    }
    var l = /* @__PURE__ */ function() {
      function f(c, t) {
        this.func = c || function() {}, this.funcRes = null, this.options = t;
      }
      var s = f.prototype;
      return s._shouldUpdateSelector = function(t, e) {
        e === undefined && (e = {});
        var r = Object.assign({}, this.options, e);
        return r.updateSelector === false ? false : typeof t != "string";
      }, s._isLossy = function(t) {
        t === undefined && (t = {});
        var e = Object.assign({}, this.options, t);
        return e.lossless === false;
      }, s._root = function(t, e) {
        e === undefined && (e = {});
        var r = new h.default(t, this._parseOptions(e));
        return r.root;
      }, s._parseOptions = function(t) {
        return {
          lossy: this._isLossy(t)
        };
      }, s._run = function(t, e) {
        var r = this;
        return e === undefined && (e = {}), new Promise(function(i, o) {
          try {
            var v2 = r._root(t, e);
            Promise.resolve(r.func(v2)).then(function(m) {
              var n = undefined;
              return r._shouldUpdateSelector(t, e) && (n = v2.toString(), t.selector = n), {
                transform: m,
                root: v2,
                string: n
              };
            }).then(i, o);
          } catch (m) {
            o(m);
            return;
          }
        });
      }, s._runSync = function(t, e) {
        e === undefined && (e = {});
        var r = this._root(t, e), i = this.func(r);
        if (i && typeof i.then == "function")
          throw new Error("Selector processor returned a promise to a synchronous call.");
        var o = undefined;
        return e.updateSelector && typeof t != "string" && (o = r.toString(), t.selector = o), {
          transform: i,
          root: r,
          string: o
        };
      }, s.ast = function(t, e) {
        return this._run(t, e).then(function(r) {
          return r.root;
        });
      }, s.astSync = function(t, e) {
        return this._runSync(t, e).root;
      }, s.transform = function(t, e) {
        return this._run(t, e).then(function(r) {
          return r.transform;
        });
      }, s.transformSync = function(t, e) {
        return this._runSync(t, e).transform;
      }, s.process = function(t, e) {
        return this._run(t, e).then(function(r) {
          return r.string || r.root.toString();
        });
      }, s.processSync = function(t, e) {
        var r = this._runSync(t, e);
        return r.string || r.root.toString();
      }, f;
    }();
    a.default = l, u.exports = a.default;
  }(Ft, Ft.exports)), Ft.exports;
}
var Dn = {};
var De = {};
var co;
function yf() {
  if (co)
    return De;
  co = 1, De.__esModule = true, De.universal = De.tag = De.string = De.selector = De.root = De.pseudo = De.nesting = De.id = De.comment = De.combinator = De.className = De.attribute = undefined;
  var u = o(Ql()), a = o(Wl()), h = o(Jl()), p = o(Vl()), l = o(jl()), f = o(Kl()), s = o(Yl()), c = o(Ul()), t = o(zl()), e = o(Gl()), r = o(Bl()), i = o(Hl());
  function o(b) {
    return b && b.__esModule ? b : { default: b };
  }
  var v2 = function(k) {
    return new u.default(k);
  };
  De.attribute = v2;
  var m = function(k) {
    return new a.default(k);
  };
  De.className = m;
  var n = function(k) {
    return new h.default(k);
  };
  De.combinator = n;
  var d = function(k) {
    return new p.default(k);
  };
  De.comment = d;
  var _ = function(k) {
    return new l.default(k);
  };
  De.id = _;
  var w = function(k) {
    return new f.default(k);
  };
  De.nesting = w;
  var y = function(k) {
    return new s.default(k);
  };
  De.pseudo = y;
  var x = function(k) {
    return new c.default(k);
  };
  De.root = x;
  var g = function(k) {
    return new t.default(k);
  };
  De.selector = g;
  var O = function(k) {
    return new e.default(k);
  };
  De.string = O;
  var A = function(k) {
    return new r.default(k);
  };
  De.tag = A;
  var E = function(k) {
    return new i.default(k);
  };
  return De.universal = E, De;
}
var Ee = {};
var po;
function wf() {
  if (po)
    return Ee;
  po = 1, Ee.__esModule = true, Ee.isComment = Ee.isCombinator = Ee.isClassName = Ee.isAttribute = undefined, Ee.isContainer = y, Ee.isIdentifier = undefined, Ee.isNamespace = x, Ee.isNesting = undefined, Ee.isNode = p, Ee.isPseudo = undefined, Ee.isPseudoClass = w, Ee.isPseudoElement = _, Ee.isUniversal = Ee.isTag = Ee.isString = Ee.isSelector = Ee.isRoot = undefined;
  var u = $e(), a, h = (a = {}, a[u.ATTRIBUTE] = true, a[u.CLASS] = true, a[u.COMBINATOR] = true, a[u.COMMENT] = true, a[u.ID] = true, a[u.NESTING] = true, a[u.PSEUDO] = true, a[u.ROOT] = true, a[u.SELECTOR] = true, a[u.STRING] = true, a[u.TAG] = true, a[u.UNIVERSAL] = true, a);
  function p(g) {
    return typeof g == "object" && h[g.type];
  }
  function l(g, O) {
    return p(O) && O.type === g;
  }
  var f = l.bind(null, u.ATTRIBUTE);
  Ee.isAttribute = f;
  var s = l.bind(null, u.CLASS);
  Ee.isClassName = s;
  var c = l.bind(null, u.COMBINATOR);
  Ee.isCombinator = c;
  var t = l.bind(null, u.COMMENT);
  Ee.isComment = t;
  var e = l.bind(null, u.ID);
  Ee.isIdentifier = e;
  var r = l.bind(null, u.NESTING);
  Ee.isNesting = r;
  var i = l.bind(null, u.PSEUDO);
  Ee.isPseudo = i;
  var o = l.bind(null, u.ROOT);
  Ee.isRoot = o;
  var v2 = l.bind(null, u.SELECTOR);
  Ee.isSelector = v2;
  var m = l.bind(null, u.STRING);
  Ee.isString = m;
  var n = l.bind(null, u.TAG);
  Ee.isTag = n;
  var d = l.bind(null, u.UNIVERSAL);
  Ee.isUniversal = d;
  function _(g) {
    return i(g) && g.value && (g.value.startsWith("::") || g.value.toLowerCase() === ":before" || g.value.toLowerCase() === ":after" || g.value.toLowerCase() === ":first-letter" || g.value.toLowerCase() === ":first-line");
  }
  function w(g) {
    return i(g) && !_(g);
  }
  function y(g) {
    return !!(p(g) && g.walk);
  }
  function x(g) {
    return f(g) || n(g);
  }
  return Ee;
}
var ho;
function bf() {
  return ho || (ho = 1, function(u) {
    u.__esModule = true;
    var a = $e();
    Object.keys(a).forEach(function(l) {
      l === "default" || l === "__esModule" || l in u && u[l] === a[l] || (u[l] = a[l]);
    });
    var h = yf();
    Object.keys(h).forEach(function(l) {
      l === "default" || l === "__esModule" || l in u && u[l] === h[l] || (u[l] = h[l]);
    });
    var p = wf();
    Object.keys(p).forEach(function(l) {
      l === "default" || l === "__esModule" || l in u && u[l] === p[l] || (u[l] = p[l]);
    });
  }(Dn)), Dn;
}
var vo;
function Ke() {
  return vo || (vo = 1, function(u, a) {
    a.__esModule = true, a.default = undefined;
    var h = s(mf()), p = f(bf());
    function l(e) {
      if (typeof WeakMap != "function")
        return null;
      var r = /* @__PURE__ */ new WeakMap, i = /* @__PURE__ */ new WeakMap;
      return (l = function(v2) {
        return v2 ? i : r;
      })(e);
    }
    function f(e, r) {
      if (e && e.__esModule)
        return e;
      if (e === null || typeof e != "object" && typeof e != "function")
        return { default: e };
      var i = l(r);
      if (i && i.has(e))
        return i.get(e);
      var o = {}, v2 = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var m in e)
        if (m !== "default" && Object.prototype.hasOwnProperty.call(e, m)) {
          var n = v2 ? Object.getOwnPropertyDescriptor(e, m) : null;
          n && (n.get || n.set) ? Object.defineProperty(o, m, n) : o[m] = e[m];
        }
      return o.default = e, i && i.set(e, o), o;
    }
    function s(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var c = function(r) {
      return new h.default(r);
    };
    Object.assign(c, p), delete c.__esModule;
    var t = c;
    a.default = t, u.exports = a.default;
  }(Nt, Nt.exports)), Nt.exports;
}
var qn = {};
var Ln = {};
var ar = { exports: {} };
var go;
function _f() {
  if (go)
    return ar.exports;
  go = 1;
  const { AtRule: u, Rule: a } = Be();
  let h = Ke();
  function p(_, w) {
    let y;
    try {
      h((x) => {
        y = x;
      }).processSync(_);
    } catch (x) {
      throw _.includes(":") ? w ? w.error("Missed semicolon") : x : w ? w.error(x.message) : x;
    }
    return y.at(0);
  }
  function l(_, w) {
    let y = false;
    return _.each((x) => {
      if (x.type === "nesting") {
        let g = w.clone({});
        x.value !== "&" ? x.replaceWith(p(x.value.replace("&", g.toString()))) : x.replaceWith(g), y = true;
      } else
        "nodes" in x && x.nodes && l(x, w) && (y = true);
    }), y;
  }
  function f(_, w) {
    let y = [];
    return _.selectors.forEach((x) => {
      let g = p(x, _);
      w.selectors.forEach((O) => {
        if (!O)
          return;
        let A = p(O, w);
        l(A, g) || (A.prepend(h.combinator({ value: " " })), A.prepend(g.clone({}))), y.push(A.toString());
      });
    }), y;
  }
  function s(_, w) {
    let y = _.prev();
    for (w.after(_);y && y.type === "comment"; ) {
      let x = y.prev();
      w.after(y), y = x;
    }
    return _;
  }
  function c(_) {
    return function w(y, x, g, O = g) {
      let A = [];
      if (x.each((E) => {
        E.type === "rule" && g ? O && (E.selectors = f(y, E)) : E.type === "atrule" && E.nodes ? _[E.name] ? w(y, E, O) : x[v2] !== false && A.push(E) : A.push(E);
      }), g && A.length) {
        let E = y.clone({ nodes: [] });
        for (let b of A)
          E.append(b);
        x.prepend(E);
      }
    };
  }
  function t(_, w, y) {
    let x = new a({
      nodes: [],
      selector: _
    });
    return x.append(w), y.after(x), x;
  }
  function e(_, w) {
    let y = {};
    for (let x of _)
      y[x] = true;
    if (w)
      for (let x of w)
        y[x.replace(/^@/, "")] = true;
    return y;
  }
  function r(_) {
    _ = _.trim();
    let w = _.match(/^\((.*)\)$/);
    if (!w)
      return { selector: _, type: "basic" };
    let y = w[1].match(/^(with(?:out)?):(.+)$/);
    if (y) {
      let x = y[1] === "with", g = Object.fromEntries(y[2].trim().split(/\s+/).map((A) => [A, true]));
      if (x && g.all)
        return { type: "noop" };
      let O = (A) => !!g[A];
      return g.all ? O = () => true : x && (O = (A) => A === "all" ? false : !g[A]), {
        escapes: O,
        type: "withrules"
      };
    }
    return { type: "unknown" };
  }
  function i(_) {
    let w = [], y = _.parent;
    for (;y && y instanceof u; )
      w.push(y), y = y.parent;
    return w;
  }
  function o(_) {
    let w = _[m];
    if (!w)
      _.after(_.nodes);
    else {
      let y = _.nodes, x, g = -1, O, A, E, b = i(_);
      if (b.forEach((k, q) => {
        if (w(k.name))
          x = k, g = q, A = E;
        else {
          let M = E;
          E = k.clone({ nodes: [] }), M && E.append(M), O = O || E;
        }
      }), x ? A ? (O.append(y), x.after(A)) : x.after(y) : _.after(y), _.next() && x) {
        let k;
        b.slice(0, g + 1).forEach((q, M, W) => {
          let S = k;
          k = q.clone({ nodes: [] }), S && k.append(S);
          let P = [], R = (W[M - 1] || _).next();
          for (;R; )
            P.push(R), R = R.next();
          k.append(P);
        }), k && (A || y[y.length - 1]).after(k);
      }
    }
    _.remove();
  }
  const v2 = Symbol("rootRuleMergeSel"), m = Symbol("rootRuleEscapes");
  function n(_) {
    let { params: w } = _, { escapes: y, selector: x, type: g } = r(w);
    if (g === "unknown")
      throw _.error(`Unknown @${_.name} parameter ${JSON.stringify(w)}`);
    if (g === "basic" && x) {
      let O = new a({ nodes: _.nodes, selector: x });
      _.removeAll(), _.append(O);
    }
    _[m] = y, _[v2] = y ? !y("all") : g === "noop";
  }
  const d = Symbol("hasRootRule");
  return ar.exports = (_ = {}) => {
    let w = e(["media", "supports", "layer", "container", "starting-style"], _.bubble), y = c(w), x = e([
      "document",
      "font-face",
      "keyframes",
      "-webkit-keyframes",
      "-moz-keyframes"
    ], _.unwrap), g = (_.rootRuleName || "at-root").replace(/^@/, ""), O = _.preserveEmpty;
    return {
      Once(A) {
        A.walkAtRules(g, (E) => {
          n(E), A[d] = true;
        });
      },
      postcssPlugin: "postcss-nested",
      RootExit(A) {
        A[d] && (A.walkAtRules(g, o), A[d] = false);
      },
      Rule(A) {
        let E = false, b = A, k = false, q = [];
        A.each((M) => {
          M.type === "rule" ? (q.length && (b = t(A.selector, q, b), q = []), k = true, E = true, M.selectors = f(A, M), b = s(M, b)) : M.type === "atrule" ? (q.length && (b = t(A.selector, q, b), q = []), M.name === g ? (E = true, y(A, M, true, M[v2]), b = s(M, b)) : w[M.name] ? (k = true, E = true, y(A, M, true), b = s(M, b)) : x[M.name] ? (k = true, E = true, y(A, M, false), b = s(M, b)) : k && q.push(M)) : M.type === "decl" && k && q.push(M);
        }), q.length && (b = t(A.selector, q, b)), E && O !== true && (A.raws.semicolon = true, A.nodes.length === 0 && A.remove());
      }
    };
  }, ar.exports.postcss = true, ar.exports;
}
var Nn;
var mo;
function Sf() {
  if (mo)
    return Nn;
  mo = 1;
  var u = /-(\w|$)/g, a = function(l, f) {
    return f.toUpperCase();
  }, h = function(l) {
    return l = l.toLowerCase(), l === "float" ? "cssFloat" : l.charCodeAt(0) === 45 && l.charCodeAt(1) === 109 && l.charCodeAt(2) === 115 && l.charCodeAt(3) === 45 ? l.substr(1).replace(u, a) : l.replace(u, a);
  };
  return Nn = h, Nn;
}
var Fn;
var yo;
function Zl() {
  if (yo)
    return Fn;
  yo = 1;
  let u = Sf(), a = {
    boxFlex: true,
    boxFlexGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    fillOpacity: true,
    strokeDashoffset: true,
    strokeOpacity: true,
    strokeWidth: true
  };
  function h(l) {
    return typeof l.nodes > "u" ? true : p(l);
  }
  function p(l) {
    let f, s = {};
    return l.each((c) => {
      if (c.type === "atrule")
        f = "@" + c.name, c.params && (f += " " + c.params), typeof s[f] > "u" ? s[f] = h(c) : Array.isArray(s[f]) ? s[f].push(h(c)) : s[f] = [s[f], h(c)];
      else if (c.type === "rule") {
        let t = p(c);
        if (s[c.selector])
          for (let e in t)
            s[c.selector][e] = t[e];
        else
          s[c.selector] = t;
      } else if (c.type === "decl") {
        c.prop[0] === "-" && c.prop[1] === "-" || c.parent && c.parent.selector === ":export" ? f = c.prop : f = u(c.prop);
        let t = c.value;
        !isNaN(c.value) && a[f] && (t = parseFloat(c.value)), c.important && (t += " !important"), typeof s[f] > "u" ? s[f] = t : Array.isArray(s[f]) ? s[f].push(t) : s[f] = [s[f], t];
      }
    }), s;
  }
  return Fn = p, Fn;
}
var $n;
var wo;
function Qi() {
  if (wo)
    return $n;
  wo = 1;
  let u = Be(), a = /\s*!important\s*$/i, h = {
    "box-flex": true,
    "box-flex-group": true,
    "column-count": true,
    flex: true,
    "flex-grow": true,
    "flex-positive": true,
    "flex-shrink": true,
    "flex-negative": true,
    "font-weight": true,
    "line-clamp": true,
    "line-height": true,
    opacity: true,
    order: true,
    orphans: true,
    "tab-size": true,
    widows: true,
    "z-index": true,
    zoom: true,
    "fill-opacity": true,
    "stroke-dashoffset": true,
    "stroke-opacity": true,
    "stroke-width": true
  };
  function p(c) {
    return c.replace(/([A-Z])/g, "-$1").replace(/^ms-/, "-ms-").toLowerCase();
  }
  function l(c, t, e) {
    e === false || e === null || (t.startsWith("--") || (t = p(t)), typeof e == "number" && (e === 0 || h[t] ? e = e.toString() : e += "px"), t === "css-float" && (t = "float"), a.test(e) ? (e = e.replace(a, ""), c.push(u.decl({ prop: t, value: e, important: true }))) : c.push(u.decl({ prop: t, value: e })));
  }
  function f(c, t, e) {
    let r = u.atRule({ name: t[1], params: t[3] || "" });
    typeof e == "object" && (r.nodes = [], s(e, r)), c.push(r);
  }
  function s(c, t) {
    let e, r, i;
    for (e in c)
      if (r = c[e], !(r === null || typeof r > "u"))
        if (e[0] === "@") {
          let o = e.match(/@(\S+)(\s+([\W\w]*)\s*)?/);
          if (Array.isArray(r))
            for (let v2 of r)
              f(t, o, v2);
          else
            f(t, o, r);
        } else if (Array.isArray(r))
          for (let o of r)
            l(t, e, o);
        else
          typeof r == "object" ? (i = u.rule({ selector: e }), s(r, i), t.push(i)) : l(t, e, r);
  }
  return $n = function(c) {
    let t = u.root();
    return s(c, t), t;
  }, $n;
}
var Un;
var bo;
function eu() {
  if (bo)
    return Un;
  bo = 1;
  let u = Zl();
  return Un = function(h) {
    return console && console.warn && h.warnings().forEach((p) => {
      let l = p.plugin || "PostCSS";
      console.warn(l + ": " + p.text);
    }), u(h.root);
  }, Un;
}
var zn;
var _o;
function xf() {
  if (_o)
    return zn;
  _o = 1;
  let u = Be(), a = eu(), h = Qi();
  return zn = function(l) {
    let f = u(l);
    return async (s) => {
      let c = await f.process(s, {
        parser: h,
        from: undefined
      });
      return a(c);
    };
  }, zn;
}
var Wn;
var So;
function Of() {
  if (So)
    return Wn;
  So = 1;
  let u = Be(), a = eu(), h = Qi();
  return Wn = function(p) {
    let l = u(p);
    return (f) => {
      let s = l.process(f, { parser: h, from: undefined });
      return a(s);
    };
  }, Wn;
}
var Vn;
var xo;
function kf() {
  if (xo)
    return Vn;
  xo = 1;
  let u = Zl(), a = Qi(), h = xf(), p = Of();
  return Vn = {
    objectify: u,
    parse: a,
    async: h,
    sync: p
  }, Vn;
}
var Oo;
function tu() {
  return Oo || (Oo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return f;
      }
    });
    const a = /* @__PURE__ */ l(Be()), h = /* @__PURE__ */ l(_f()), p = /* @__PURE__ */ l(kf());
    function l(s) {
      return s && s.__esModule ? s : {
        default: s
      };
    }
    function f(s) {
      return Array.isArray(s) ? s.flatMap((c) => (0, a.default)([
        (0, h.default)({
          bubble: [
            "screen"
          ]
        })
      ]).process(c, {
        parser: p.default
      }).root.nodes) : f([
        s
      ]);
    }
  }(Ln)), Ln;
}
var jn = {};
var ko;
function Hi() {
  return ko || (ko = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return p;
      }
    });
    const a = /* @__PURE__ */ h(Ke());
    function h(l) {
      return l && l.__esModule ? l : {
        default: l
      };
    }
    function p(l, f, s = false) {
      if (l === "")
        return f;
      let c = typeof f == "string" ? (0, a.default)().astSync(f) : f;
      return c.walkClasses((t) => {
        let e = t.value, r = s && e.startsWith("-");
        t.value = r ? `-${l}${e.slice(1)}` : `${l}${e}`;
      }), typeof f == "string" ? c.toString() : c;
    }
  }(jn)), jn;
}
var Bn = {};
var Po;
function yr() {
  return Po || (Po = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(r, i) {
      for (var o in i)
        Object.defineProperty(r, o, {
          enumerable: true,
          get: i[o]
        });
    }
    a(u, {
      env: function() {
        return h;
      },
      contextMap: function() {
        return p;
      },
      configContextMap: function() {
        return l;
      },
      contextSourcesMap: function() {
        return f;
      },
      sourceHashMap: function() {
        return s;
      },
      NOT_ON_DEMAND: function() {
        return c;
      },
      NONE: function() {
        return t;
      },
      resolveDebug: function() {
        return e;
      }
    });
    const h = typeof process < "u" ? {
      NODE_ENV: "production",
      DEBUG: e(process.env.DEBUG)
    } : {
      NODE_ENV: "production",
      DEBUG: false
    }, p = /* @__PURE__ */ new Map, l = /* @__PURE__ */ new Map, f = /* @__PURE__ */ new Map, s = /* @__PURE__ */ new Map, c = new String("*"), t = Symbol("__NONE__");
    function e(r) {
      if (r === undefined)
        return false;
      if (r === "true" || r === "1")
        return true;
      if (r === "false" || r === "0")
        return false;
      if (r === "*")
        return true;
      let i = r.split(",").map((o) => o.split(":")[0]);
      return i.includes("-tailwindcss") ? false : !!i.includes("tailwindcss");
    }
  }(Bn)), Bn;
}
var Gn = {};
var Yn = {};
var Eo;
function ft() {
  return Eo || (Eo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = /* @__PURE__ */ p(Ke()), h = /* @__PURE__ */ p(Vi());
    function p(f) {
      return f && f.__esModule ? f : {
        default: f
      };
    }
    function l(f) {
      var s;
      let c = a.default.className();
      c.value = f;
      var t;
      return (0, h.default)((t = c == null || (s = c.raws) === null || s === undefined ? undefined : s.value) !== null && t !== undefined ? t : c.value);
    }
  }(Yn)), Yn;
}
var Qn = {};
var To;
function Ji() {
  return To || (To = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "movePseudos", {
      enumerable: true,
      get: function() {
        return h;
      }
    });
    let a = {
      "::after": [
        "terminal",
        "jumpable"
      ],
      "::backdrop": [
        "terminal",
        "jumpable"
      ],
      "::before": [
        "terminal",
        "jumpable"
      ],
      "::cue": [
        "terminal"
      ],
      "::cue-region": [
        "terminal"
      ],
      "::first-letter": [
        "terminal",
        "jumpable"
      ],
      "::first-line": [
        "terminal",
        "jumpable"
      ],
      "::grammar-error": [
        "terminal"
      ],
      "::marker": [
        "terminal",
        "jumpable"
      ],
      "::part": [
        "terminal",
        "actionable"
      ],
      "::placeholder": [
        "terminal",
        "jumpable"
      ],
      "::selection": [
        "terminal",
        "jumpable"
      ],
      "::slotted": [
        "terminal"
      ],
      "::spelling-error": [
        "terminal"
      ],
      "::target-text": [
        "terminal"
      ],
      "::file-selector-button": [
        "terminal",
        "actionable"
      ],
      "::deep": [
        "actionable"
      ],
      "::v-deep": [
        "actionable"
      ],
      "::ng-deep": [
        "actionable"
      ],
      ":after": [
        "terminal",
        "jumpable"
      ],
      ":before": [
        "terminal",
        "jumpable"
      ],
      ":first-letter": [
        "terminal",
        "jumpable"
      ],
      ":first-line": [
        "terminal",
        "jumpable"
      ],
      ":where": [],
      ":is": [],
      ":has": [],
      __default__: [
        "terminal",
        "actionable"
      ]
    };
    function h(t) {
      let [e] = p(t);
      return e.forEach(([r, i]) => r.removeChild(i)), t.nodes.push(...e.map(([, r]) => r)), t;
    }
    function p(t) {
      let e = [], r = null;
      for (let o of t.nodes)
        if (o.type === "combinator")
          e = e.filter(([, v2]) => c(v2).includes("jumpable")), r = null;
        else if (o.type === "pseudo") {
          f(o) ? (r = o, e.push([
            t,
            o,
            null
          ])) : r && s(o, r) ? e.push([
            t,
            o,
            r
          ]) : r = null;
          var i;
          for (let v2 of (i = o.nodes) !== null && i !== undefined ? i : []) {
            let [m, n] = p(v2);
            r = n || r, e.push(...m);
          }
        }
      return [
        e,
        r
      ];
    }
    function l(t) {
      return t.value.startsWith("::") || a[t.value] !== undefined;
    }
    function f(t) {
      return l(t) && c(t).includes("terminal");
    }
    function s(t, e) {
      return t.type !== "pseudo" || l(t) ? false : c(e).includes("actionable");
    }
    function c(t) {
      var e;
      return (e = a[t.value]) !== null && e !== undefined ? e : a.__default__;
    }
  }(Qn)), Qn;
}
var Ao;
function ru() {
  return Ao || (Ao = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(d, _) {
      for (var w in _)
        Object.defineProperty(d, w, {
          enumerable: true,
          get: _[w]
        });
    }
    a(u, {
      formatVariantSelector: function() {
        return r;
      },
      eliminateIrrelevantSelectors: function() {
        return v2;
      },
      finalizeSelector: function() {
        return m;
      },
      handleMergePseudo: function() {
        return n;
      }
    });
    const h = /* @__PURE__ */ t(Ke()), p = /* @__PURE__ */ t(Bi()), l = /* @__PURE__ */ t(ft()), f = /* @__PURE__ */ t(Hi()), s = Ji(), c = st();
    function t(d) {
      return d && d.__esModule ? d : {
        default: d
      };
    }
    let e = ":merge";
    function r(d, { context: _, candidate: w }) {
      var y;
      let x = (y = _ == null ? undefined : _.tailwindConfig.prefix) !== null && y !== undefined ? y : "", g = d.map((A) => {
        let E = (0, h.default)().astSync(A.format);
        return {
          ...A,
          ast: A.respectPrefix ? (0, f.default)(x, E) : E
        };
      }), O = h.default.root({
        nodes: [
          h.default.selector({
            nodes: [
              h.default.className({
                value: (0, l.default)(w)
              })
            ]
          })
        ]
      });
      for (let { ast: A } of g)
        [O, A] = n(O, A), A.walkNesting((E) => E.replaceWith(...O.nodes[0].nodes)), O = A;
      return O;
    }
    function i(d) {
      let _ = [];
      for (;d.prev() && d.prev().type !== "combinator"; )
        d = d.prev();
      for (;d && d.type !== "combinator"; )
        _.push(d), d = d.next();
      return _;
    }
    function o(d) {
      return d.sort((_, w) => _.type === "tag" && w.type === "class" ? -1 : _.type === "class" && w.type === "tag" ? 1 : _.type === "class" && w.type === "pseudo" && w.value.startsWith("::") ? -1 : _.type === "pseudo" && _.value.startsWith("::") && w.type === "class" ? 1 : d.index(_) - d.index(w)), d;
    }
    function v2(d, _) {
      let w = false;
      d.walk((y) => {
        if (y.type === "class" && y.value === _)
          return w = true, false;
      }), w || d.remove();
    }
    function m(d, _, { context: w, candidate: y, base: x }) {
      var g, O;
      let A = (O = w == null || (g = w.tailwindConfig) === null || g === undefined ? undefined : g.separator) !== null && O !== undefined ? O : ":";
      x = x ?? (0, c.splitAtTopLevelOnly)(y, A).pop();
      let E = (0, h.default)().astSync(d);
      if (E.walkClasses((M) => {
        M.raws && M.value.includes(x) && (M.raws.value = (0, l.default)((0, p.default)(M.raws.value)));
      }), E.each((M) => v2(M, x)), E.length === 0)
        return null;
      let b = Array.isArray(_) ? r(_, {
        context: w,
        candidate: y
      }) : _;
      if (b === null)
        return E.toString();
      let k = h.default.comment({
        value: "/*__simple__*/"
      }), q = h.default.comment({
        value: "/*__simple__*/"
      });
      return E.walkClasses((M) => {
        if (M.value !== x)
          return;
        let W = M.parent, S = b.nodes[0].nodes;
        if (W.nodes.length === 1) {
          M.replaceWith(...S);
          return;
        }
        let P = i(M);
        W.insertBefore(P[0], k), W.insertAfter(P[P.length - 1], q);
        for (let R of S)
          W.insertBefore(P[0], R.clone());
        M.remove(), P = i(k);
        let C = W.index(k);
        W.nodes.splice(C, P.length, ...o(h.default.selector({
          nodes: P
        })).nodes), k.remove(), q.remove();
      }), E.walkPseudos((M) => {
        M.value === e && M.replaceWith(M.nodes);
      }), E.each((M) => (0, s.movePseudos)(M)), E.toString();
    }
    function n(d, _) {
      let w = [];
      return d.walkPseudos((y) => {
        y.value === e && w.push({
          pseudo: y,
          value: y.nodes[0].toString()
        });
      }), _.walkPseudos((y) => {
        if (y.value !== e)
          return;
        let x = y.nodes[0].toString(), g = w.find((b) => b.value === x);
        if (!g)
          return;
        let O = [], A = y.next();
        for (;A && A.type !== "combinator"; )
          O.push(A), A = A.next();
        let E = A;
        g.pseudo.parent.insertAfter(g.pseudo, h.default.selector({
          nodes: O.map((b) => b.clone())
        })), y.remove(), O.forEach((b) => b.remove()), E && E.type === "combinator" && E.remove();
      }), [
        d,
        _
      ];
    }
  }(Gn)), Gn;
}
var Hn = {};
var Co;
function nu() {
  return Co || (Co = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(t, e) {
      for (var r in e)
        Object.defineProperty(t, r, {
          enumerable: true,
          get: e[r]
        });
    }
    a(u, {
      asClass: function() {
        return f;
      },
      default: function() {
        return s;
      },
      formatClass: function() {
        return c;
      }
    });
    const h = /* @__PURE__ */ l(ft()), p = /* @__PURE__ */ l(Vi());
    function l(t) {
      return t && t.__esModule ? t : {
        default: t
      };
    }
    function f(t) {
      return (0, p.default)(`.${(0, h.default)(t)}`);
    }
    function s(t, e) {
      return f(c(t, e));
    }
    function c(t, e) {
      return e === "DEFAULT" ? t : e === "-" || e === "-DEFAULT" ? `-${t}` : e.startsWith("-") ? `-${t}${e}` : e.startsWith("/") ? `${t}${e}` : `${t}-${e}`;
    }
  }(Hn)), Hn;
}
var Jn = {};
var Kn = {};
var Xn = {};
var Ro;
function Pf() {
  return Ro || (Ro = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return p;
      }
    });
    const a = /* @__PURE__ */ h(pr());
    function h(l) {
      return l && l.__esModule ? l : {
        default: l
      };
    }
    function p(l, f = [
      [
        l,
        [
          l
        ]
      ]
    ], { filterDefault: s = false, ...c } = {}) {
      let t = (0, a.default)(l);
      return function({ matchUtilities: e, theme: r }) {
        for (let o of f) {
          let v2 = Array.isArray(o[0]) ? o : [
            o
          ];
          var i;
          e(v2.reduce((m, [n, d]) => Object.assign(m, {
            [n]: (_) => d.reduce((w, y) => Array.isArray(y) ? Object.assign(w, {
              [y[0]]: y[1]
            }) : Object.assign(w, {
              [y]: t(_)
            }), {})
          }), {}), {
            ...c,
            values: s ? Object.fromEntries(Object.entries((i = r(l)) !== null && i !== undefined ? i : {}).filter(([m]) => m !== "DEFAULT")) : r(l)
          });
        }
      };
    }
  }(Xn)), Xn;
}
var Zn = {};
var Io;
function Ef() {
  return Io || (Io = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return i;
      }
    });
    const a = /* @__PURE__ */ new Set([
      "normal",
      "reverse",
      "alternate",
      "alternate-reverse"
    ]), h = /* @__PURE__ */ new Set([
      "running",
      "paused"
    ]), p = /* @__PURE__ */ new Set([
      "none",
      "forwards",
      "backwards",
      "both"
    ]), l = /* @__PURE__ */ new Set([
      "infinite"
    ]), f = /* @__PURE__ */ new Set([
      "linear",
      "ease",
      "ease-in",
      "ease-out",
      "ease-in-out",
      "step-start",
      "step-end"
    ]), s = [
      "cubic-bezier",
      "steps"
    ], c = /\,(?![^(]*\))/g, t = /\ +(?![^(]*\))/g, e = /^(-?[\d.]+m?s)$/, r = /^(\d+)$/;
    function i(o) {
      return o.split(c).map((m) => {
        let n = m.trim(), d = {
          value: n
        }, _ = n.split(t), w = /* @__PURE__ */ new Set;
        for (let y of _)
          !w.has("DIRECTIONS") && a.has(y) ? (d.direction = y, w.add("DIRECTIONS")) : !w.has("PLAY_STATES") && h.has(y) ? (d.playState = y, w.add("PLAY_STATES")) : !w.has("FILL_MODES") && p.has(y) ? (d.fillMode = y, w.add("FILL_MODES")) : !w.has("ITERATION_COUNTS") && (l.has(y) || r.test(y)) ? (d.iterationCount = y, w.add("ITERATION_COUNTS")) : !w.has("TIMING_FUNCTION") && f.has(y) || !w.has("TIMING_FUNCTION") && s.some((x) => y.startsWith(`${x}(`)) ? (d.timingFunction = y, w.add("TIMING_FUNCTION")) : !w.has("DURATION") && e.test(y) ? (d.duration = y, w.add("DURATION")) : !w.has("DELAY") && e.test(y) ? (d.delay = y, w.add("DELAY")) : w.has("NAME") ? (d.unknown || (d.unknown = []), d.unknown.push(y)) : (d.name = y, w.add("NAME"));
        return d;
      });
    }
  }(Zn)), Zn;
}
var ei = {};
var Mo;
function Tf() {
  return Mo || (Mo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return h;
      }
    });
    const a = (p) => Object.assign({}, ...Object.entries(p ?? {}).flatMap(([l, f]) => typeof f == "object" ? Object.entries(a(f)).map(([s, c]) => ({
      [l + (s === "DEFAULT" ? "" : `-${s}`)]: c
    })) : [
      {
        [`${l}`]: f
      }
    ])), h = a;
  }(ei)), ei;
}
var ti = {};
var Do;
function iu() {
  return Do || (Do = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      return typeof h == "function" ? h({}) : h;
    }
  }(ti)), ti;
}
var Af = "3.4.10";
var Cf = {
  version: Af
};
var ri = {};
var qo;
function Rf() {
  return qo || (qo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "removeAlphaVariables", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h, p) {
      h.walkDecls((l) => {
        if (p.includes(l.prop)) {
          l.remove();
          return;
        }
        for (let f of p)
          l.value.includes(`/ var(${f})`) && (l.value = l.value.replace(`/ var(${f})`, ""));
      });
    }
  }(ri)), ri;
}
var Lo;
function If() {
  return Lo || (Lo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(S, P) {
      for (var C in P)
        Object.defineProperty(S, C, {
          enumerable: true,
          get: P[C]
        });
    }
    a(u, {
      variantPlugins: function() {
        return b;
      },
      corePlugins: function() {
        return W;
      }
    });
    const h = /* @__PURE__ */ O(Ne), p = /* @__PURE__ */ E(Ne), l = /* @__PURE__ */ O(Be()), f = /* @__PURE__ */ O(Pf()), s = /* @__PURE__ */ O(zi()), c = /* @__PURE__ */ O(ft()), t = /* @__PURE__ */ O(Ef()), e = /* @__PURE__ */ O(Tf()), r = /* @__PURE__ */ E(hr()), i = /* @__PURE__ */ O(iu()), o = /* @__PURE__ */ O(ut()), v2 = /* @__PURE__ */ O(pr()), m = Cf, n = /* @__PURE__ */ O(tt()), d = Ui(), _ = $l(), w = Rf(), y = it(), x = vr(), g = Ki();
    function O(S) {
      return S && S.__esModule ? S : {
        default: S
      };
    }
    function A(S) {
      if (typeof WeakMap != "function")
        return null;
      var P = /* @__PURE__ */ new WeakMap, C = /* @__PURE__ */ new WeakMap;
      return (A = function(R) {
        return R ? C : P;
      })(S);
    }
    function E(S, P) {
      if (S && S.__esModule)
        return S;
      if (S === null || typeof S != "object" && typeof S != "function")
        return {
          default: S
        };
      var C = A(P);
      if (C && C.has(S))
        return C.get(S);
      var R = {}, $ = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var B in S)
        if (B !== "default" && Object.prototype.hasOwnProperty.call(S, B)) {
          var z = $ ? Object.getOwnPropertyDescriptor(S, B) : null;
          z && (z.get || z.set) ? Object.defineProperty(R, B, z) : R[B] = S[B];
        }
      return R.default = S, C && C.set(S, R), R;
    }
    let b = {
      childVariant: ({ addVariant: S }) => {
        S("*", "& > *");
      },
      pseudoElementVariants: ({ addVariant: S }) => {
        S("first-letter", "&::first-letter"), S("first-line", "&::first-line"), S("marker", [
          ({ container: P }) => ((0, w.removeAlphaVariables)(P, [
            "--tw-text-opacity"
          ]), "& *::marker"),
          ({ container: P }) => ((0, w.removeAlphaVariables)(P, [
            "--tw-text-opacity"
          ]), "&::marker")
        ]), S("selection", [
          "& *::selection",
          "&::selection"
        ]), S("file", "&::file-selector-button"), S("placeholder", "&::placeholder"), S("backdrop", "&::backdrop"), S("before", ({ container: P }) => (P.walkRules((C) => {
          let R = false;
          C.walkDecls("content", () => {
            R = true;
          }), R || C.prepend(l.default.decl({
            prop: "content",
            value: "var(--tw-content)"
          }));
        }), "&::before")), S("after", ({ container: P }) => (P.walkRules((C) => {
          let R = false;
          C.walkDecls("content", () => {
            R = true;
          }), R || C.prepend(l.default.decl({
            prop: "content",
            value: "var(--tw-content)"
          }));
        }), "&::after"));
      },
      pseudoClassVariants: ({ addVariant: S, matchVariant: P, config: C, prefix: R }) => {
        let $ = [
          [
            "first",
            "&:first-child"
          ],
          [
            "last",
            "&:last-child"
          ],
          [
            "only",
            "&:only-child"
          ],
          [
            "odd",
            "&:nth-child(odd)"
          ],
          [
            "even",
            "&:nth-child(even)"
          ],
          "first-of-type",
          "last-of-type",
          "only-of-type",
          [
            "visited",
            ({ container: z }) => ((0, w.removeAlphaVariables)(z, [
              "--tw-text-opacity",
              "--tw-border-opacity",
              "--tw-bg-opacity"
            ]), "&:visited")
          ],
          "target",
          [
            "open",
            "&[open]"
          ],
          "default",
          "checked",
          "indeterminate",
          "placeholder-shown",
          "autofill",
          "optional",
          "required",
          "valid",
          "invalid",
          "in-range",
          "out-of-range",
          "read-only",
          "empty",
          "focus-within",
          [
            "hover",
            (0, y.flagEnabled)(C(), "hoverOnlyWhenSupported") ? "@media (hover: hover) and (pointer: fine) { &:hover }" : "&:hover"
          ],
          "focus",
          "focus-visible",
          "active",
          "enabled",
          "disabled"
        ].map((z) => Array.isArray(z) ? z : [
          z,
          `&:${z}`
        ]);
        for (let [z, L] of $)
          S(z, (F) => typeof L == "function" ? L(F) : L);
        let B = {
          group: (z, { modifier: L }) => L ? [
            `:merge(${R(".group")}\\/${(0, c.default)(L)})`,
            " &"
          ] : [
            `:merge(${R(".group")})`,
            " &"
          ],
          peer: (z, { modifier: L }) => L ? [
            `:merge(${R(".peer")}\\/${(0, c.default)(L)})`,
            " ~ &"
          ] : [
            `:merge(${R(".peer")})`,
            " ~ &"
          ]
        };
        for (let [z, L] of Object.entries(B))
          P(z, (F = "", D) => {
            let I = (0, x.normalize)(typeof F == "function" ? F(D) : F);
            I.includes("&") || (I = "&" + I);
            let [N, J] = L("", D), T = null, U = null, j = 0;
            for (let H = 0;H < I.length; ++H) {
              let V = I[H];
              V === "&" ? T = H : V === "'" || V === '"' ? j += 1 : T !== null && V === " " && !j && (U = H);
            }
            return T !== null && U === null && (U = I.length), I.slice(0, T) + N + I.slice(T + 1, U) + J + I.slice(U);
          }, {
            values: Object.fromEntries($),
            [g.INTERNAL_FEATURES]: {
              respectPrefix: false
            }
          });
      },
      directionVariants: ({ addVariant: S }) => {
        S("ltr", '&:where([dir="ltr"], [dir="ltr"] *)'), S("rtl", '&:where([dir="rtl"], [dir="rtl"] *)');
      },
      reducedMotionVariants: ({ addVariant: S }) => {
        S("motion-safe", "@media (prefers-reduced-motion: no-preference)"), S("motion-reduce", "@media (prefers-reduced-motion: reduce)");
      },
      darkVariants: ({ config: S, addVariant: P }) => {
        let [C, R = ".dark"] = [].concat(S("darkMode", "media"));
        if (C === false && (C = "media", n.default.warn("darkmode-false", [
          "The `darkMode` option in your Tailwind CSS configuration is set to `false`, which now behaves the same as `media`.",
          "Change `darkMode` to `media` or remove it entirely.",
          "https://tailwindcss.com/docs/upgrade-guide#remove-dark-mode-configuration"
        ])), C === "variant") {
          let $;
          if (Array.isArray(R) || typeof R == "function" ? $ = R : typeof R == "string" && ($ = [
            R
          ]), Array.isArray($))
            for (let B of $)
              B === ".dark" ? (C = false, n.default.warn("darkmode-variant-without-selector", [
                "When using `variant` for `darkMode`, you must provide a selector.",
                'Example: `darkMode: ["variant", ".your-selector &"]`'
              ])) : B.includes("&") || (C = false, n.default.warn("darkmode-variant-without-ampersand", [
                "When using `variant` for `darkMode`, your selector must contain `&`.",
                'Example `darkMode: ["variant", ".your-selector &"]`'
              ]));
          R = $;
        }
        C === "selector" ? P("dark", `&:where(${R}, ${R} *)`) : C === "media" ? P("dark", "@media (prefers-color-scheme: dark)") : C === "variant" ? P("dark", R) : C === "class" && P("dark", `&:is(${R} *)`);
      },
      printVariant: ({ addVariant: S }) => {
        S("print", "@media print");
      },
      screenVariants: ({ theme: S, addVariant: P, matchVariant: C }) => {
        var R;
        let $ = (R = S("screens")) !== null && R !== undefined ? R : {}, B = Object.values($).every((K) => typeof K == "string"), z = (0, d.normalizeScreens)(S("screens")), L = /* @__PURE__ */ new Set([]);
        function F(K) {
          var X, Q;
          return (Q = (X = K.match(/(\D+)$/)) === null || X === undefined ? undefined : X[1]) !== null && Q !== undefined ? Q : "(none)";
        }
        function D(K) {
          K !== undefined && L.add(F(K));
        }
        function I(K) {
          return D(K), L.size === 1;
        }
        for (const K of z)
          for (const X of K.values)
            D(X.min), D(X.max);
        let N = L.size <= 1;
        function J(K) {
          return Object.fromEntries(z.filter((X) => (0, d.isScreenSortable)(X).result).map((X) => {
            let { min: Q, max: ne } = X.values[0];
            if (ne !== undefined)
              return X;
            if (Q !== undefined)
              return {
                ...X,
                not: !X.not
              };
          }).map((X) => [
            X.name,
            X
          ]));
        }
        function T(K) {
          return (X, Q) => (0, d.compareScreens)(K, X.value, Q.value);
        }
        let U = T("max"), j = T("min");
        function H(K) {
          return (X) => {
            if (B)
              if (N) {
                if (typeof X == "string" && !I(X))
                  return n.default.warn("minmax-have-mixed-units", [
                    "The `min-*` and `max-*` variants are not supported with a `screens` configuration containing mixed units."
                  ]), [];
              } else
                return n.default.warn("mixed-screen-units", [
                  "The `min-*` and `max-*` variants are not supported with a `screens` configuration containing mixed units."
                ]), [];
            else
              return n.default.warn("complex-screen-config", [
                "The `min-*` and `max-*` variants are not supported with a `screens` configuration containing objects."
              ]), [];
            return [
              `@media ${(0, s.default)((0, d.toScreen)(X, K))}`
            ];
          };
        }
        C("max", H("max"), {
          sort: U,
          values: B ? J() : {}
        });
        let V = "min-screens";
        for (let K of z)
          P(K.name, `@media ${(0, s.default)(K)}`, {
            id: V,
            sort: B && N ? j : undefined,
            value: K
          });
        C("min", H("min"), {
          id: V,
          sort: j
        });
      },
      supportsVariants: ({ matchVariant: S, theme: P }) => {
        var C;
        S("supports", (R = "") => {
          let $ = (0, x.normalize)(R), B = /^\w*\s*\(/.test($);
          return $ = B ? $.replace(/\b(and|or|not)\b/g, " $1 ") : $, B ? `@supports ${$}` : ($.includes(":") || ($ = `${$}: var(--tw)`), $.startsWith("(") && $.endsWith(")") || ($ = `(${$})`), `@supports ${$}`);
        }, {
          values: (C = P("supports")) !== null && C !== undefined ? C : {}
        });
      },
      hasVariants: ({ matchVariant: S, prefix: P }) => {
        S("has", (C) => `&:has(${(0, x.normalize)(C)})`, {
          values: {},
          [g.INTERNAL_FEATURES]: {
            respectPrefix: false
          }
        }), S("group-has", (C, { modifier: R }) => R ? `:merge(${P(".group")}\\/${R}):has(${(0, x.normalize)(C)}) &` : `:merge(${P(".group")}):has(${(0, x.normalize)(C)}) &`, {
          values: {},
          [g.INTERNAL_FEATURES]: {
            respectPrefix: false
          }
        }), S("peer-has", (C, { modifier: R }) => R ? `:merge(${P(".peer")}\\/${R}):has(${(0, x.normalize)(C)}) ~ &` : `:merge(${P(".peer")}):has(${(0, x.normalize)(C)}) ~ &`, {
          values: {},
          [g.INTERNAL_FEATURES]: {
            respectPrefix: false
          }
        });
      },
      ariaVariants: ({ matchVariant: S, theme: P }) => {
        var C;
        S("aria", (B) => `&[aria-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}]`, {
          values: (C = P("aria")) !== null && C !== undefined ? C : {}
        });
        var R;
        S("group-aria", (B, { modifier: z }) => z ? `:merge(.group\\/${z})[aria-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] &` : `:merge(.group)[aria-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] &`, {
          values: (R = P("aria")) !== null && R !== undefined ? R : {}
        });
        var $;
        S("peer-aria", (B, { modifier: z }) => z ? `:merge(.peer\\/${z})[aria-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] ~ &` : `:merge(.peer)[aria-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] ~ &`, {
          values: ($ = P("aria")) !== null && $ !== undefined ? $ : {}
        });
      },
      dataVariants: ({ matchVariant: S, theme: P }) => {
        var C;
        S("data", (B) => `&[data-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}]`, {
          values: (C = P("data")) !== null && C !== undefined ? C : {}
        });
        var R;
        S("group-data", (B, { modifier: z }) => z ? `:merge(.group\\/${z})[data-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] &` : `:merge(.group)[data-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] &`, {
          values: (R = P("data")) !== null && R !== undefined ? R : {}
        });
        var $;
        S("peer-data", (B, { modifier: z }) => z ? `:merge(.peer\\/${z})[data-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] ~ &` : `:merge(.peer)[data-${(0, x.normalizeAttributeSelectors)((0, x.normalize)(B))}] ~ &`, {
          values: ($ = P("data")) !== null && $ !== undefined ? $ : {}
        });
      },
      orientationVariants: ({ addVariant: S }) => {
        S("portrait", "@media (orientation: portrait)"), S("landscape", "@media (orientation: landscape)");
      },
      prefersContrastVariants: ({ addVariant: S }) => {
        S("contrast-more", "@media (prefers-contrast: more)"), S("contrast-less", "@media (prefers-contrast: less)");
      },
      forcedColorsVariants: ({ addVariant: S }) => {
        S("forced-colors", "@media (forced-colors: active)");
      }
    }, k = [
      "translate(var(--tw-translate-x), var(--tw-translate-y))",
      "rotate(var(--tw-rotate))",
      "skewX(var(--tw-skew-x))",
      "skewY(var(--tw-skew-y))",
      "scaleX(var(--tw-scale-x))",
      "scaleY(var(--tw-scale-y))"
    ].join(" "), q = [
      "var(--tw-blur)",
      "var(--tw-brightness)",
      "var(--tw-contrast)",
      "var(--tw-grayscale)",
      "var(--tw-hue-rotate)",
      "var(--tw-invert)",
      "var(--tw-saturate)",
      "var(--tw-sepia)",
      "var(--tw-drop-shadow)"
    ].join(" "), M = [
      "var(--tw-backdrop-blur)",
      "var(--tw-backdrop-brightness)",
      "var(--tw-backdrop-contrast)",
      "var(--tw-backdrop-grayscale)",
      "var(--tw-backdrop-hue-rotate)",
      "var(--tw-backdrop-invert)",
      "var(--tw-backdrop-opacity)",
      "var(--tw-backdrop-saturate)",
      "var(--tw-backdrop-sepia)"
    ].join(" "), W = {
      preflight: ({ addBase: S }) => {
        let P = l.default.parse(h.default.readFileSync(p.join(__dirname, "./css/preflight.css"), "utf8"));
        S([
          l.default.comment({
            text: `! tailwindcss v${m.version} | MIT License | https://tailwindcss.com`
          }),
          ...P.nodes
        ]);
      },
      container: /* @__PURE__ */ (() => {
        function S(C = []) {
          return C.flatMap((R) => R.values.map(($) => $.min)).filter((R) => R !== undefined);
        }
        function P(C, R, $) {
          if (typeof $ > "u")
            return [];
          if (!(typeof $ == "object" && $ !== null))
            return [
              {
                screen: "DEFAULT",
                minWidth: 0,
                padding: $
              }
            ];
          let B = [];
          $.DEFAULT && B.push({
            screen: "DEFAULT",
            minWidth: 0,
            padding: $.DEFAULT
          });
          for (let z of C)
            for (let L of R)
              for (let { min: F } of L.values)
                F === z && B.push({
                  minWidth: z,
                  padding: $[L.name]
                });
          return B;
        }
        return function({ addComponents: C, theme: R }) {
          let $ = (0, d.normalizeScreens)(R("container.screens", R("screens"))), B = S($), z = P(B, $, R("container.padding")), L = (D) => {
            let I = z.find((N) => N.minWidth === D);
            return I ? {
              paddingRight: I.padding,
              paddingLeft: I.padding
            } : {};
          }, F = Array.from(new Set(B.slice().sort((D, I) => parseInt(D) - parseInt(I)))).map((D) => ({
            [`@media (min-width: ${D})`]: {
              ".container": {
                "max-width": D,
                ...L(D)
              }
            }
          }));
          C([
            {
              ".container": Object.assign({
                width: "100%"
              }, R("container.center", false) ? {
                marginRight: "auto",
                marginLeft: "auto"
              } : {}, L(0))
            },
            ...F
          ]);
        };
      })(),
      accessibility: ({ addUtilities: S }) => {
        S({
          ".sr-only": {
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: "0",
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            borderWidth: "0"
          },
          ".not-sr-only": {
            position: "static",
            width: "auto",
            height: "auto",
            padding: "0",
            margin: "0",
            overflow: "visible",
            clip: "auto",
            whiteSpace: "normal"
          }
        });
      },
      pointerEvents: ({ addUtilities: S }) => {
        S({
          ".pointer-events-none": {
            "pointer-events": "none"
          },
          ".pointer-events-auto": {
            "pointer-events": "auto"
          }
        });
      },
      visibility: ({ addUtilities: S }) => {
        S({
          ".visible": {
            visibility: "visible"
          },
          ".invisible": {
            visibility: "hidden"
          },
          ".collapse": {
            visibility: "collapse"
          }
        });
      },
      position: ({ addUtilities: S }) => {
        S({
          ".static": {
            position: "static"
          },
          ".fixed": {
            position: "fixed"
          },
          ".absolute": {
            position: "absolute"
          },
          ".relative": {
            position: "relative"
          },
          ".sticky": {
            position: "sticky"
          }
        });
      },
      inset: (0, f.default)("inset", [
        [
          "inset",
          [
            "inset"
          ]
        ],
        [
          [
            "inset-x",
            [
              "left",
              "right"
            ]
          ],
          [
            "inset-y",
            [
              "top",
              "bottom"
            ]
          ]
        ],
        [
          [
            "start",
            [
              "inset-inline-start"
            ]
          ],
          [
            "end",
            [
              "inset-inline-end"
            ]
          ],
          [
            "top",
            [
              "top"
            ]
          ],
          [
            "right",
            [
              "right"
            ]
          ],
          [
            "bottom",
            [
              "bottom"
            ]
          ],
          [
            "left",
            [
              "left"
            ]
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      isolation: ({ addUtilities: S }) => {
        S({
          ".isolate": {
            isolation: "isolate"
          },
          ".isolation-auto": {
            isolation: "auto"
          }
        });
      },
      zIndex: (0, f.default)("zIndex", [
        [
          "z",
          [
            "zIndex"
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      order: (0, f.default)("order", undefined, {
        supportsNegativeValues: true
      }),
      gridColumn: (0, f.default)("gridColumn", [
        [
          "col",
          [
            "gridColumn"
          ]
        ]
      ]),
      gridColumnStart: (0, f.default)("gridColumnStart", [
        [
          "col-start",
          [
            "gridColumnStart"
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      gridColumnEnd: (0, f.default)("gridColumnEnd", [
        [
          "col-end",
          [
            "gridColumnEnd"
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      gridRow: (0, f.default)("gridRow", [
        [
          "row",
          [
            "gridRow"
          ]
        ]
      ]),
      gridRowStart: (0, f.default)("gridRowStart", [
        [
          "row-start",
          [
            "gridRowStart"
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      gridRowEnd: (0, f.default)("gridRowEnd", [
        [
          "row-end",
          [
            "gridRowEnd"
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      float: ({ addUtilities: S }) => {
        S({
          ".float-start": {
            float: "inline-start"
          },
          ".float-end": {
            float: "inline-end"
          },
          ".float-right": {
            float: "right"
          },
          ".float-left": {
            float: "left"
          },
          ".float-none": {
            float: "none"
          }
        });
      },
      clear: ({ addUtilities: S }) => {
        S({
          ".clear-start": {
            clear: "inline-start"
          },
          ".clear-end": {
            clear: "inline-end"
          },
          ".clear-left": {
            clear: "left"
          },
          ".clear-right": {
            clear: "right"
          },
          ".clear-both": {
            clear: "both"
          },
          ".clear-none": {
            clear: "none"
          }
        });
      },
      margin: (0, f.default)("margin", [
        [
          "m",
          [
            "margin"
          ]
        ],
        [
          [
            "mx",
            [
              "margin-left",
              "margin-right"
            ]
          ],
          [
            "my",
            [
              "margin-top",
              "margin-bottom"
            ]
          ]
        ],
        [
          [
            "ms",
            [
              "margin-inline-start"
            ]
          ],
          [
            "me",
            [
              "margin-inline-end"
            ]
          ],
          [
            "mt",
            [
              "margin-top"
            ]
          ],
          [
            "mr",
            [
              "margin-right"
            ]
          ],
          [
            "mb",
            [
              "margin-bottom"
            ]
          ],
          [
            "ml",
            [
              "margin-left"
            ]
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      boxSizing: ({ addUtilities: S }) => {
        S({
          ".box-border": {
            "box-sizing": "border-box"
          },
          ".box-content": {
            "box-sizing": "content-box"
          }
        });
      },
      lineClamp: ({ matchUtilities: S, addUtilities: P, theme: C }) => {
        S({
          "line-clamp": (R) => ({
            overflow: "hidden",
            display: "-webkit-box",
            "-webkit-box-orient": "vertical",
            "-webkit-line-clamp": `${R}`
          })
        }, {
          values: C("lineClamp")
        }), P({
          ".line-clamp-none": {
            overflow: "visible",
            display: "block",
            "-webkit-box-orient": "horizontal",
            "-webkit-line-clamp": "none"
          }
        });
      },
      display: ({ addUtilities: S }) => {
        S({
          ".block": {
            display: "block"
          },
          ".inline-block": {
            display: "inline-block"
          },
          ".inline": {
            display: "inline"
          },
          ".flex": {
            display: "flex"
          },
          ".inline-flex": {
            display: "inline-flex"
          },
          ".table": {
            display: "table"
          },
          ".inline-table": {
            display: "inline-table"
          },
          ".table-caption": {
            display: "table-caption"
          },
          ".table-cell": {
            display: "table-cell"
          },
          ".table-column": {
            display: "table-column"
          },
          ".table-column-group": {
            display: "table-column-group"
          },
          ".table-footer-group": {
            display: "table-footer-group"
          },
          ".table-header-group": {
            display: "table-header-group"
          },
          ".table-row-group": {
            display: "table-row-group"
          },
          ".table-row": {
            display: "table-row"
          },
          ".flow-root": {
            display: "flow-root"
          },
          ".grid": {
            display: "grid"
          },
          ".inline-grid": {
            display: "inline-grid"
          },
          ".contents": {
            display: "contents"
          },
          ".list-item": {
            display: "list-item"
          },
          ".hidden": {
            display: "none"
          }
        });
      },
      aspectRatio: (0, f.default)("aspectRatio", [
        [
          "aspect",
          [
            "aspect-ratio"
          ]
        ]
      ]),
      size: (0, f.default)("size", [
        [
          "size",
          [
            "width",
            "height"
          ]
        ]
      ]),
      height: (0, f.default)("height", [
        [
          "h",
          [
            "height"
          ]
        ]
      ]),
      maxHeight: (0, f.default)("maxHeight", [
        [
          "max-h",
          [
            "maxHeight"
          ]
        ]
      ]),
      minHeight: (0, f.default)("minHeight", [
        [
          "min-h",
          [
            "minHeight"
          ]
        ]
      ]),
      width: (0, f.default)("width", [
        [
          "w",
          [
            "width"
          ]
        ]
      ]),
      minWidth: (0, f.default)("minWidth", [
        [
          "min-w",
          [
            "minWidth"
          ]
        ]
      ]),
      maxWidth: (0, f.default)("maxWidth", [
        [
          "max-w",
          [
            "maxWidth"
          ]
        ]
      ]),
      flex: (0, f.default)("flex"),
      flexShrink: (0, f.default)("flexShrink", [
        [
          "flex-shrink",
          [
            "flex-shrink"
          ]
        ],
        [
          "shrink",
          [
            "flex-shrink"
          ]
        ]
      ]),
      flexGrow: (0, f.default)("flexGrow", [
        [
          "flex-grow",
          [
            "flex-grow"
          ]
        ],
        [
          "grow",
          [
            "flex-grow"
          ]
        ]
      ]),
      flexBasis: (0, f.default)("flexBasis", [
        [
          "basis",
          [
            "flex-basis"
          ]
        ]
      ]),
      tableLayout: ({ addUtilities: S }) => {
        S({
          ".table-auto": {
            "table-layout": "auto"
          },
          ".table-fixed": {
            "table-layout": "fixed"
          }
        });
      },
      captionSide: ({ addUtilities: S }) => {
        S({
          ".caption-top": {
            "caption-side": "top"
          },
          ".caption-bottom": {
            "caption-side": "bottom"
          }
        });
      },
      borderCollapse: ({ addUtilities: S }) => {
        S({
          ".border-collapse": {
            "border-collapse": "collapse"
          },
          ".border-separate": {
            "border-collapse": "separate"
          }
        });
      },
      borderSpacing: ({ addDefaults: S, matchUtilities: P, theme: C }) => {
        S("border-spacing", {
          "--tw-border-spacing-x": 0,
          "--tw-border-spacing-y": 0
        }), P({
          "border-spacing": (R) => ({
            "--tw-border-spacing-x": R,
            "--tw-border-spacing-y": R,
            "@defaults border-spacing": {},
            "border-spacing": "var(--tw-border-spacing-x) var(--tw-border-spacing-y)"
          }),
          "border-spacing-x": (R) => ({
            "--tw-border-spacing-x": R,
            "@defaults border-spacing": {},
            "border-spacing": "var(--tw-border-spacing-x) var(--tw-border-spacing-y)"
          }),
          "border-spacing-y": (R) => ({
            "--tw-border-spacing-y": R,
            "@defaults border-spacing": {},
            "border-spacing": "var(--tw-border-spacing-x) var(--tw-border-spacing-y)"
          })
        }, {
          values: C("borderSpacing")
        });
      },
      transformOrigin: (0, f.default)("transformOrigin", [
        [
          "origin",
          [
            "transformOrigin"
          ]
        ]
      ]),
      translate: (0, f.default)("translate", [
        [
          [
            "translate-x",
            [
              [
                "@defaults transform",
                {}
              ],
              "--tw-translate-x",
              [
                "transform",
                k
              ]
            ]
          ],
          [
            "translate-y",
            [
              [
                "@defaults transform",
                {}
              ],
              "--tw-translate-y",
              [
                "transform",
                k
              ]
            ]
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      rotate: (0, f.default)("rotate", [
        [
          "rotate",
          [
            [
              "@defaults transform",
              {}
            ],
            "--tw-rotate",
            [
              "transform",
              k
            ]
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      skew: (0, f.default)("skew", [
        [
          [
            "skew-x",
            [
              [
                "@defaults transform",
                {}
              ],
              "--tw-skew-x",
              [
                "transform",
                k
              ]
            ]
          ],
          [
            "skew-y",
            [
              [
                "@defaults transform",
                {}
              ],
              "--tw-skew-y",
              [
                "transform",
                k
              ]
            ]
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      scale: (0, f.default)("scale", [
        [
          "scale",
          [
            [
              "@defaults transform",
              {}
            ],
            "--tw-scale-x",
            "--tw-scale-y",
            [
              "transform",
              k
            ]
          ]
        ],
        [
          [
            "scale-x",
            [
              [
                "@defaults transform",
                {}
              ],
              "--tw-scale-x",
              [
                "transform",
                k
              ]
            ]
          ],
          [
            "scale-y",
            [
              [
                "@defaults transform",
                {}
              ],
              "--tw-scale-y",
              [
                "transform",
                k
              ]
            ]
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      transform: ({ addDefaults: S, addUtilities: P }) => {
        S("transform", {
          "--tw-translate-x": "0",
          "--tw-translate-y": "0",
          "--tw-rotate": "0",
          "--tw-skew-x": "0",
          "--tw-skew-y": "0",
          "--tw-scale-x": "1",
          "--tw-scale-y": "1"
        }), P({
          ".transform": {
            "@defaults transform": {},
            transform: k
          },
          ".transform-cpu": {
            transform: k
          },
          ".transform-gpu": {
            transform: k.replace("translate(var(--tw-translate-x), var(--tw-translate-y))", "translate3d(var(--tw-translate-x), var(--tw-translate-y), 0)")
          },
          ".transform-none": {
            transform: "none"
          }
        });
      },
      animation: ({ matchUtilities: S, theme: P, config: C }) => {
        let R = (z) => (0, c.default)(C("prefix") + z);
        var $;
        let B = Object.fromEntries(Object.entries(($ = P("keyframes")) !== null && $ !== undefined ? $ : {}).map(([z, L]) => [
          z,
          {
            [`@keyframes ${R(z)}`]: L
          }
        ]));
        S({
          animate: (z) => {
            let L = (0, t.default)(z);
            return [
              ...L.flatMap((F) => B[F.name]),
              {
                animation: L.map(({ name: F, value: D }) => F === undefined || B[F] === undefined ? D : D.replace(F, R(F))).join(", ")
              }
            ];
          }
        }, {
          values: P("animation")
        });
      },
      cursor: (0, f.default)("cursor"),
      touchAction: ({ addDefaults: S, addUtilities: P }) => {
        S("touch-action", {
          "--tw-pan-x": " ",
          "--tw-pan-y": " ",
          "--tw-pinch-zoom": " "
        });
        let C = "var(--tw-pan-x) var(--tw-pan-y) var(--tw-pinch-zoom)";
        P({
          ".touch-auto": {
            "touch-action": "auto"
          },
          ".touch-none": {
            "touch-action": "none"
          },
          ".touch-pan-x": {
            "@defaults touch-action": {},
            "--tw-pan-x": "pan-x",
            "touch-action": C
          },
          ".touch-pan-left": {
            "@defaults touch-action": {},
            "--tw-pan-x": "pan-left",
            "touch-action": C
          },
          ".touch-pan-right": {
            "@defaults touch-action": {},
            "--tw-pan-x": "pan-right",
            "touch-action": C
          },
          ".touch-pan-y": {
            "@defaults touch-action": {},
            "--tw-pan-y": "pan-y",
            "touch-action": C
          },
          ".touch-pan-up": {
            "@defaults touch-action": {},
            "--tw-pan-y": "pan-up",
            "touch-action": C
          },
          ".touch-pan-down": {
            "@defaults touch-action": {},
            "--tw-pan-y": "pan-down",
            "touch-action": C
          },
          ".touch-pinch-zoom": {
            "@defaults touch-action": {},
            "--tw-pinch-zoom": "pinch-zoom",
            "touch-action": C
          },
          ".touch-manipulation": {
            "touch-action": "manipulation"
          }
        });
      },
      userSelect: ({ addUtilities: S }) => {
        S({
          ".select-none": {
            "user-select": "none"
          },
          ".select-text": {
            "user-select": "text"
          },
          ".select-all": {
            "user-select": "all"
          },
          ".select-auto": {
            "user-select": "auto"
          }
        });
      },
      resize: ({ addUtilities: S }) => {
        S({
          ".resize-none": {
            resize: "none"
          },
          ".resize-y": {
            resize: "vertical"
          },
          ".resize-x": {
            resize: "horizontal"
          },
          ".resize": {
            resize: "both"
          }
        });
      },
      scrollSnapType: ({ addDefaults: S, addUtilities: P }) => {
        S("scroll-snap-type", {
          "--tw-scroll-snap-strictness": "proximity"
        }), P({
          ".snap-none": {
            "scroll-snap-type": "none"
          },
          ".snap-x": {
            "@defaults scroll-snap-type": {},
            "scroll-snap-type": "x var(--tw-scroll-snap-strictness)"
          },
          ".snap-y": {
            "@defaults scroll-snap-type": {},
            "scroll-snap-type": "y var(--tw-scroll-snap-strictness)"
          },
          ".snap-both": {
            "@defaults scroll-snap-type": {},
            "scroll-snap-type": "both var(--tw-scroll-snap-strictness)"
          },
          ".snap-mandatory": {
            "--tw-scroll-snap-strictness": "mandatory"
          },
          ".snap-proximity": {
            "--tw-scroll-snap-strictness": "proximity"
          }
        });
      },
      scrollSnapAlign: ({ addUtilities: S }) => {
        S({
          ".snap-start": {
            "scroll-snap-align": "start"
          },
          ".snap-end": {
            "scroll-snap-align": "end"
          },
          ".snap-center": {
            "scroll-snap-align": "center"
          },
          ".snap-align-none": {
            "scroll-snap-align": "none"
          }
        });
      },
      scrollSnapStop: ({ addUtilities: S }) => {
        S({
          ".snap-normal": {
            "scroll-snap-stop": "normal"
          },
          ".snap-always": {
            "scroll-snap-stop": "always"
          }
        });
      },
      scrollMargin: (0, f.default)("scrollMargin", [
        [
          "scroll-m",
          [
            "scroll-margin"
          ]
        ],
        [
          [
            "scroll-mx",
            [
              "scroll-margin-left",
              "scroll-margin-right"
            ]
          ],
          [
            "scroll-my",
            [
              "scroll-margin-top",
              "scroll-margin-bottom"
            ]
          ]
        ],
        [
          [
            "scroll-ms",
            [
              "scroll-margin-inline-start"
            ]
          ],
          [
            "scroll-me",
            [
              "scroll-margin-inline-end"
            ]
          ],
          [
            "scroll-mt",
            [
              "scroll-margin-top"
            ]
          ],
          [
            "scroll-mr",
            [
              "scroll-margin-right"
            ]
          ],
          [
            "scroll-mb",
            [
              "scroll-margin-bottom"
            ]
          ],
          [
            "scroll-ml",
            [
              "scroll-margin-left"
            ]
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      scrollPadding: (0, f.default)("scrollPadding", [
        [
          "scroll-p",
          [
            "scroll-padding"
          ]
        ],
        [
          [
            "scroll-px",
            [
              "scroll-padding-left",
              "scroll-padding-right"
            ]
          ],
          [
            "scroll-py",
            [
              "scroll-padding-top",
              "scroll-padding-bottom"
            ]
          ]
        ],
        [
          [
            "scroll-ps",
            [
              "scroll-padding-inline-start"
            ]
          ],
          [
            "scroll-pe",
            [
              "scroll-padding-inline-end"
            ]
          ],
          [
            "scroll-pt",
            [
              "scroll-padding-top"
            ]
          ],
          [
            "scroll-pr",
            [
              "scroll-padding-right"
            ]
          ],
          [
            "scroll-pb",
            [
              "scroll-padding-bottom"
            ]
          ],
          [
            "scroll-pl",
            [
              "scroll-padding-left"
            ]
          ]
        ]
      ]),
      listStylePosition: ({ addUtilities: S }) => {
        S({
          ".list-inside": {
            "list-style-position": "inside"
          },
          ".list-outside": {
            "list-style-position": "outside"
          }
        });
      },
      listStyleType: (0, f.default)("listStyleType", [
        [
          "list",
          [
            "listStyleType"
          ]
        ]
      ]),
      listStyleImage: (0, f.default)("listStyleImage", [
        [
          "list-image",
          [
            "listStyleImage"
          ]
        ]
      ]),
      appearance: ({ addUtilities: S }) => {
        S({
          ".appearance-none": {
            appearance: "none"
          },
          ".appearance-auto": {
            appearance: "auto"
          }
        });
      },
      columns: (0, f.default)("columns", [
        [
          "columns",
          [
            "columns"
          ]
        ]
      ]),
      breakBefore: ({ addUtilities: S }) => {
        S({
          ".break-before-auto": {
            "break-before": "auto"
          },
          ".break-before-avoid": {
            "break-before": "avoid"
          },
          ".break-before-all": {
            "break-before": "all"
          },
          ".break-before-avoid-page": {
            "break-before": "avoid-page"
          },
          ".break-before-page": {
            "break-before": "page"
          },
          ".break-before-left": {
            "break-before": "left"
          },
          ".break-before-right": {
            "break-before": "right"
          },
          ".break-before-column": {
            "break-before": "column"
          }
        });
      },
      breakInside: ({ addUtilities: S }) => {
        S({
          ".break-inside-auto": {
            "break-inside": "auto"
          },
          ".break-inside-avoid": {
            "break-inside": "avoid"
          },
          ".break-inside-avoid-page": {
            "break-inside": "avoid-page"
          },
          ".break-inside-avoid-column": {
            "break-inside": "avoid-column"
          }
        });
      },
      breakAfter: ({ addUtilities: S }) => {
        S({
          ".break-after-auto": {
            "break-after": "auto"
          },
          ".break-after-avoid": {
            "break-after": "avoid"
          },
          ".break-after-all": {
            "break-after": "all"
          },
          ".break-after-avoid-page": {
            "break-after": "avoid-page"
          },
          ".break-after-page": {
            "break-after": "page"
          },
          ".break-after-left": {
            "break-after": "left"
          },
          ".break-after-right": {
            "break-after": "right"
          },
          ".break-after-column": {
            "break-after": "column"
          }
        });
      },
      gridAutoColumns: (0, f.default)("gridAutoColumns", [
        [
          "auto-cols",
          [
            "gridAutoColumns"
          ]
        ]
      ]),
      gridAutoFlow: ({ addUtilities: S }) => {
        S({
          ".grid-flow-row": {
            gridAutoFlow: "row"
          },
          ".grid-flow-col": {
            gridAutoFlow: "column"
          },
          ".grid-flow-dense": {
            gridAutoFlow: "dense"
          },
          ".grid-flow-row-dense": {
            gridAutoFlow: "row dense"
          },
          ".grid-flow-col-dense": {
            gridAutoFlow: "column dense"
          }
        });
      },
      gridAutoRows: (0, f.default)("gridAutoRows", [
        [
          "auto-rows",
          [
            "gridAutoRows"
          ]
        ]
      ]),
      gridTemplateColumns: (0, f.default)("gridTemplateColumns", [
        [
          "grid-cols",
          [
            "gridTemplateColumns"
          ]
        ]
      ]),
      gridTemplateRows: (0, f.default)("gridTemplateRows", [
        [
          "grid-rows",
          [
            "gridTemplateRows"
          ]
        ]
      ]),
      flexDirection: ({ addUtilities: S }) => {
        S({
          ".flex-row": {
            "flex-direction": "row"
          },
          ".flex-row-reverse": {
            "flex-direction": "row-reverse"
          },
          ".flex-col": {
            "flex-direction": "column"
          },
          ".flex-col-reverse": {
            "flex-direction": "column-reverse"
          }
        });
      },
      flexWrap: ({ addUtilities: S }) => {
        S({
          ".flex-wrap": {
            "flex-wrap": "wrap"
          },
          ".flex-wrap-reverse": {
            "flex-wrap": "wrap-reverse"
          },
          ".flex-nowrap": {
            "flex-wrap": "nowrap"
          }
        });
      },
      placeContent: ({ addUtilities: S }) => {
        S({
          ".place-content-center": {
            "place-content": "center"
          },
          ".place-content-start": {
            "place-content": "start"
          },
          ".place-content-end": {
            "place-content": "end"
          },
          ".place-content-between": {
            "place-content": "space-between"
          },
          ".place-content-around": {
            "place-content": "space-around"
          },
          ".place-content-evenly": {
            "place-content": "space-evenly"
          },
          ".place-content-baseline": {
            "place-content": "baseline"
          },
          ".place-content-stretch": {
            "place-content": "stretch"
          }
        });
      },
      placeItems: ({ addUtilities: S }) => {
        S({
          ".place-items-start": {
            "place-items": "start"
          },
          ".place-items-end": {
            "place-items": "end"
          },
          ".place-items-center": {
            "place-items": "center"
          },
          ".place-items-baseline": {
            "place-items": "baseline"
          },
          ".place-items-stretch": {
            "place-items": "stretch"
          }
        });
      },
      alignContent: ({ addUtilities: S }) => {
        S({
          ".content-normal": {
            "align-content": "normal"
          },
          ".content-center": {
            "align-content": "center"
          },
          ".content-start": {
            "align-content": "flex-start"
          },
          ".content-end": {
            "align-content": "flex-end"
          },
          ".content-between": {
            "align-content": "space-between"
          },
          ".content-around": {
            "align-content": "space-around"
          },
          ".content-evenly": {
            "align-content": "space-evenly"
          },
          ".content-baseline": {
            "align-content": "baseline"
          },
          ".content-stretch": {
            "align-content": "stretch"
          }
        });
      },
      alignItems: ({ addUtilities: S }) => {
        S({
          ".items-start": {
            "align-items": "flex-start"
          },
          ".items-end": {
            "align-items": "flex-end"
          },
          ".items-center": {
            "align-items": "center"
          },
          ".items-baseline": {
            "align-items": "baseline"
          },
          ".items-stretch": {
            "align-items": "stretch"
          }
        });
      },
      justifyContent: ({ addUtilities: S }) => {
        S({
          ".justify-normal": {
            "justify-content": "normal"
          },
          ".justify-start": {
            "justify-content": "flex-start"
          },
          ".justify-end": {
            "justify-content": "flex-end"
          },
          ".justify-center": {
            "justify-content": "center"
          },
          ".justify-between": {
            "justify-content": "space-between"
          },
          ".justify-around": {
            "justify-content": "space-around"
          },
          ".justify-evenly": {
            "justify-content": "space-evenly"
          },
          ".justify-stretch": {
            "justify-content": "stretch"
          }
        });
      },
      justifyItems: ({ addUtilities: S }) => {
        S({
          ".justify-items-start": {
            "justify-items": "start"
          },
          ".justify-items-end": {
            "justify-items": "end"
          },
          ".justify-items-center": {
            "justify-items": "center"
          },
          ".justify-items-stretch": {
            "justify-items": "stretch"
          }
        });
      },
      gap: (0, f.default)("gap", [
        [
          "gap",
          [
            "gap"
          ]
        ],
        [
          [
            "gap-x",
            [
              "columnGap"
            ]
          ],
          [
            "gap-y",
            [
              "rowGap"
            ]
          ]
        ]
      ]),
      space: ({ matchUtilities: S, addUtilities: P, theme: C }) => {
        S({
          "space-x": (R) => (R = R === "0" ? "0px" : R, {
            "& > :not([hidden]) ~ :not([hidden])": {
              "--tw-space-x-reverse": "0",
              "margin-right": `calc(${R} * var(--tw-space-x-reverse))`,
              "margin-left": `calc(${R} * calc(1 - var(--tw-space-x-reverse)))`
            }
          }),
          "space-y": (R) => (R = R === "0" ? "0px" : R, {
            "& > :not([hidden]) ~ :not([hidden])": {
              "--tw-space-y-reverse": "0",
              "margin-top": `calc(${R} * calc(1 - var(--tw-space-y-reverse)))`,
              "margin-bottom": `calc(${R} * var(--tw-space-y-reverse))`
            }
          })
        }, {
          values: C("space"),
          supportsNegativeValues: true
        }), P({
          ".space-y-reverse > :not([hidden]) ~ :not([hidden])": {
            "--tw-space-y-reverse": "1"
          },
          ".space-x-reverse > :not([hidden]) ~ :not([hidden])": {
            "--tw-space-x-reverse": "1"
          }
        });
      },
      divideWidth: ({ matchUtilities: S, addUtilities: P, theme: C }) => {
        S({
          "divide-x": (R) => (R = R === "0" ? "0px" : R, {
            "& > :not([hidden]) ~ :not([hidden])": {
              "@defaults border-width": {},
              "--tw-divide-x-reverse": "0",
              "border-right-width": `calc(${R} * var(--tw-divide-x-reverse))`,
              "border-left-width": `calc(${R} * calc(1 - var(--tw-divide-x-reverse)))`
            }
          }),
          "divide-y": (R) => (R = R === "0" ? "0px" : R, {
            "& > :not([hidden]) ~ :not([hidden])": {
              "@defaults border-width": {},
              "--tw-divide-y-reverse": "0",
              "border-top-width": `calc(${R} * calc(1 - var(--tw-divide-y-reverse)))`,
              "border-bottom-width": `calc(${R} * var(--tw-divide-y-reverse))`
            }
          })
        }, {
          values: C("divideWidth"),
          type: [
            "line-width",
            "length",
            "any"
          ]
        }), P({
          ".divide-y-reverse > :not([hidden]) ~ :not([hidden])": {
            "@defaults border-width": {},
            "--tw-divide-y-reverse": "1"
          },
          ".divide-x-reverse > :not([hidden]) ~ :not([hidden])": {
            "@defaults border-width": {},
            "--tw-divide-x-reverse": "1"
          }
        });
      },
      divideStyle: ({ addUtilities: S }) => {
        S({
          ".divide-solid > :not([hidden]) ~ :not([hidden])": {
            "border-style": "solid"
          },
          ".divide-dashed > :not([hidden]) ~ :not([hidden])": {
            "border-style": "dashed"
          },
          ".divide-dotted > :not([hidden]) ~ :not([hidden])": {
            "border-style": "dotted"
          },
          ".divide-double > :not([hidden]) ~ :not([hidden])": {
            "border-style": "double"
          },
          ".divide-none > :not([hidden]) ~ :not([hidden])": {
            "border-style": "none"
          }
        });
      },
      divideColor: ({ matchUtilities: S, theme: P, corePlugins: C }) => {
        S({
          divide: (R) => C("divideOpacity") ? {
            "& > :not([hidden]) ~ :not([hidden])": (0, r.default)({
              color: R,
              property: "border-color",
              variable: "--tw-divide-opacity"
            })
          } : {
            "& > :not([hidden]) ~ :not([hidden])": {
              "border-color": (0, i.default)(R)
            }
          }
        }, {
          values: (({ DEFAULT: R, ...$ }) => $)((0, e.default)(P("divideColor"))),
          type: [
            "color",
            "any"
          ]
        });
      },
      divideOpacity: ({ matchUtilities: S, theme: P }) => {
        S({
          "divide-opacity": (C) => ({
            "& > :not([hidden]) ~ :not([hidden])": {
              "--tw-divide-opacity": C
            }
          })
        }, {
          values: P("divideOpacity")
        });
      },
      placeSelf: ({ addUtilities: S }) => {
        S({
          ".place-self-auto": {
            "place-self": "auto"
          },
          ".place-self-start": {
            "place-self": "start"
          },
          ".place-self-end": {
            "place-self": "end"
          },
          ".place-self-center": {
            "place-self": "center"
          },
          ".place-self-stretch": {
            "place-self": "stretch"
          }
        });
      },
      alignSelf: ({ addUtilities: S }) => {
        S({
          ".self-auto": {
            "align-self": "auto"
          },
          ".self-start": {
            "align-self": "flex-start"
          },
          ".self-end": {
            "align-self": "flex-end"
          },
          ".self-center": {
            "align-self": "center"
          },
          ".self-stretch": {
            "align-self": "stretch"
          },
          ".self-baseline": {
            "align-self": "baseline"
          }
        });
      },
      justifySelf: ({ addUtilities: S }) => {
        S({
          ".justify-self-auto": {
            "justify-self": "auto"
          },
          ".justify-self-start": {
            "justify-self": "start"
          },
          ".justify-self-end": {
            "justify-self": "end"
          },
          ".justify-self-center": {
            "justify-self": "center"
          },
          ".justify-self-stretch": {
            "justify-self": "stretch"
          }
        });
      },
      overflow: ({ addUtilities: S }) => {
        S({
          ".overflow-auto": {
            overflow: "auto"
          },
          ".overflow-hidden": {
            overflow: "hidden"
          },
          ".overflow-clip": {
            overflow: "clip"
          },
          ".overflow-visible": {
            overflow: "visible"
          },
          ".overflow-scroll": {
            overflow: "scroll"
          },
          ".overflow-x-auto": {
            "overflow-x": "auto"
          },
          ".overflow-y-auto": {
            "overflow-y": "auto"
          },
          ".overflow-x-hidden": {
            "overflow-x": "hidden"
          },
          ".overflow-y-hidden": {
            "overflow-y": "hidden"
          },
          ".overflow-x-clip": {
            "overflow-x": "clip"
          },
          ".overflow-y-clip": {
            "overflow-y": "clip"
          },
          ".overflow-x-visible": {
            "overflow-x": "visible"
          },
          ".overflow-y-visible": {
            "overflow-y": "visible"
          },
          ".overflow-x-scroll": {
            "overflow-x": "scroll"
          },
          ".overflow-y-scroll": {
            "overflow-y": "scroll"
          }
        });
      },
      overscrollBehavior: ({ addUtilities: S }) => {
        S({
          ".overscroll-auto": {
            "overscroll-behavior": "auto"
          },
          ".overscroll-contain": {
            "overscroll-behavior": "contain"
          },
          ".overscroll-none": {
            "overscroll-behavior": "none"
          },
          ".overscroll-y-auto": {
            "overscroll-behavior-y": "auto"
          },
          ".overscroll-y-contain": {
            "overscroll-behavior-y": "contain"
          },
          ".overscroll-y-none": {
            "overscroll-behavior-y": "none"
          },
          ".overscroll-x-auto": {
            "overscroll-behavior-x": "auto"
          },
          ".overscroll-x-contain": {
            "overscroll-behavior-x": "contain"
          },
          ".overscroll-x-none": {
            "overscroll-behavior-x": "none"
          }
        });
      },
      scrollBehavior: ({ addUtilities: S }) => {
        S({
          ".scroll-auto": {
            "scroll-behavior": "auto"
          },
          ".scroll-smooth": {
            "scroll-behavior": "smooth"
          }
        });
      },
      textOverflow: ({ addUtilities: S }) => {
        S({
          ".truncate": {
            overflow: "hidden",
            "text-overflow": "ellipsis",
            "white-space": "nowrap"
          },
          ".overflow-ellipsis": {
            "text-overflow": "ellipsis"
          },
          ".text-ellipsis": {
            "text-overflow": "ellipsis"
          },
          ".text-clip": {
            "text-overflow": "clip"
          }
        });
      },
      hyphens: ({ addUtilities: S }) => {
        S({
          ".hyphens-none": {
            hyphens: "none"
          },
          ".hyphens-manual": {
            hyphens: "manual"
          },
          ".hyphens-auto": {
            hyphens: "auto"
          }
        });
      },
      whitespace: ({ addUtilities: S }) => {
        S({
          ".whitespace-normal": {
            "white-space": "normal"
          },
          ".whitespace-nowrap": {
            "white-space": "nowrap"
          },
          ".whitespace-pre": {
            "white-space": "pre"
          },
          ".whitespace-pre-line": {
            "white-space": "pre-line"
          },
          ".whitespace-pre-wrap": {
            "white-space": "pre-wrap"
          },
          ".whitespace-break-spaces": {
            "white-space": "break-spaces"
          }
        });
      },
      textWrap: ({ addUtilities: S }) => {
        S({
          ".text-wrap": {
            "text-wrap": "wrap"
          },
          ".text-nowrap": {
            "text-wrap": "nowrap"
          },
          ".text-balance": {
            "text-wrap": "balance"
          },
          ".text-pretty": {
            "text-wrap": "pretty"
          }
        });
      },
      wordBreak: ({ addUtilities: S }) => {
        S({
          ".break-normal": {
            "overflow-wrap": "normal",
            "word-break": "normal"
          },
          ".break-words": {
            "overflow-wrap": "break-word"
          },
          ".break-all": {
            "word-break": "break-all"
          },
          ".break-keep": {
            "word-break": "keep-all"
          }
        });
      },
      borderRadius: (0, f.default)("borderRadius", [
        [
          "rounded",
          [
            "border-radius"
          ]
        ],
        [
          [
            "rounded-s",
            [
              "border-start-start-radius",
              "border-end-start-radius"
            ]
          ],
          [
            "rounded-e",
            [
              "border-start-end-radius",
              "border-end-end-radius"
            ]
          ],
          [
            "rounded-t",
            [
              "border-top-left-radius",
              "border-top-right-radius"
            ]
          ],
          [
            "rounded-r",
            [
              "border-top-right-radius",
              "border-bottom-right-radius"
            ]
          ],
          [
            "rounded-b",
            [
              "border-bottom-right-radius",
              "border-bottom-left-radius"
            ]
          ],
          [
            "rounded-l",
            [
              "border-top-left-radius",
              "border-bottom-left-radius"
            ]
          ]
        ],
        [
          [
            "rounded-ss",
            [
              "border-start-start-radius"
            ]
          ],
          [
            "rounded-se",
            [
              "border-start-end-radius"
            ]
          ],
          [
            "rounded-ee",
            [
              "border-end-end-radius"
            ]
          ],
          [
            "rounded-es",
            [
              "border-end-start-radius"
            ]
          ],
          [
            "rounded-tl",
            [
              "border-top-left-radius"
            ]
          ],
          [
            "rounded-tr",
            [
              "border-top-right-radius"
            ]
          ],
          [
            "rounded-br",
            [
              "border-bottom-right-radius"
            ]
          ],
          [
            "rounded-bl",
            [
              "border-bottom-left-radius"
            ]
          ]
        ]
      ]),
      borderWidth: (0, f.default)("borderWidth", [
        [
          "border",
          [
            [
              "@defaults border-width",
              {}
            ],
            "border-width"
          ]
        ],
        [
          [
            "border-x",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-left-width",
              "border-right-width"
            ]
          ],
          [
            "border-y",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-top-width",
              "border-bottom-width"
            ]
          ]
        ],
        [
          [
            "border-s",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-inline-start-width"
            ]
          ],
          [
            "border-e",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-inline-end-width"
            ]
          ],
          [
            "border-t",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-top-width"
            ]
          ],
          [
            "border-r",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-right-width"
            ]
          ],
          [
            "border-b",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-bottom-width"
            ]
          ],
          [
            "border-l",
            [
              [
                "@defaults border-width",
                {}
              ],
              "border-left-width"
            ]
          ]
        ]
      ], {
        type: [
          "line-width",
          "length"
        ]
      }),
      borderStyle: ({ addUtilities: S }) => {
        S({
          ".border-solid": {
            "border-style": "solid"
          },
          ".border-dashed": {
            "border-style": "dashed"
          },
          ".border-dotted": {
            "border-style": "dotted"
          },
          ".border-double": {
            "border-style": "double"
          },
          ".border-hidden": {
            "border-style": "hidden"
          },
          ".border-none": {
            "border-style": "none"
          }
        });
      },
      borderColor: ({ matchUtilities: S, theme: P, corePlugins: C }) => {
        S({
          border: (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: "border-color",
            variable: "--tw-border-opacity"
          }) : {
            "border-color": (0, i.default)(R)
          }
        }, {
          values: (({ DEFAULT: R, ...$ }) => $)((0, e.default)(P("borderColor"))),
          type: [
            "color",
            "any"
          ]
        }), S({
          "border-x": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: [
              "border-left-color",
              "border-right-color"
            ],
            variable: "--tw-border-opacity"
          }) : {
            "border-left-color": (0, i.default)(R),
            "border-right-color": (0, i.default)(R)
          },
          "border-y": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: [
              "border-top-color",
              "border-bottom-color"
            ],
            variable: "--tw-border-opacity"
          }) : {
            "border-top-color": (0, i.default)(R),
            "border-bottom-color": (0, i.default)(R)
          }
        }, {
          values: (({ DEFAULT: R, ...$ }) => $)((0, e.default)(P("borderColor"))),
          type: [
            "color",
            "any"
          ]
        }), S({
          "border-s": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: "border-inline-start-color",
            variable: "--tw-border-opacity"
          }) : {
            "border-inline-start-color": (0, i.default)(R)
          },
          "border-e": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: "border-inline-end-color",
            variable: "--tw-border-opacity"
          }) : {
            "border-inline-end-color": (0, i.default)(R)
          },
          "border-t": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: "border-top-color",
            variable: "--tw-border-opacity"
          }) : {
            "border-top-color": (0, i.default)(R)
          },
          "border-r": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: "border-right-color",
            variable: "--tw-border-opacity"
          }) : {
            "border-right-color": (0, i.default)(R)
          },
          "border-b": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: "border-bottom-color",
            variable: "--tw-border-opacity"
          }) : {
            "border-bottom-color": (0, i.default)(R)
          },
          "border-l": (R) => C("borderOpacity") ? (0, r.default)({
            color: R,
            property: "border-left-color",
            variable: "--tw-border-opacity"
          }) : {
            "border-left-color": (0, i.default)(R)
          }
        }, {
          values: (({ DEFAULT: R, ...$ }) => $)((0, e.default)(P("borderColor"))),
          type: [
            "color",
            "any"
          ]
        });
      },
      borderOpacity: (0, f.default)("borderOpacity", [
        [
          "border-opacity",
          [
            "--tw-border-opacity"
          ]
        ]
      ]),
      backgroundColor: ({ matchUtilities: S, theme: P, corePlugins: C }) => {
        S({
          bg: (R) => C("backgroundOpacity") ? (0, r.default)({
            color: R,
            property: "background-color",
            variable: "--tw-bg-opacity"
          }) : {
            "background-color": (0, i.default)(R)
          }
        }, {
          values: (0, e.default)(P("backgroundColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      backgroundOpacity: (0, f.default)("backgroundOpacity", [
        [
          "bg-opacity",
          [
            "--tw-bg-opacity"
          ]
        ]
      ]),
      backgroundImage: (0, f.default)("backgroundImage", [
        [
          "bg",
          [
            "background-image"
          ]
        ]
      ], {
        type: [
          "lookup",
          "image",
          "url"
        ]
      }),
      gradientColorStops: /* @__PURE__ */ (() => {
        function S(P) {
          return (0, r.withAlphaValue)(P, 0, "rgb(255 255 255 / 0)");
        }
        return function({ matchUtilities: P, theme: C, addDefaults: R }) {
          R("gradient-color-stops", {
            "--tw-gradient-from-position": " ",
            "--tw-gradient-via-position": " ",
            "--tw-gradient-to-position": " "
          });
          let $ = {
            values: (0, e.default)(C("gradientColorStops")),
            type: [
              "color",
              "any"
            ]
          }, B = {
            values: C("gradientColorStopPositions"),
            type: [
              "length",
              "percentage"
            ]
          };
          P({
            from: (z) => {
              let L = S(z);
              return {
                "@defaults gradient-color-stops": {},
                "--tw-gradient-from": `${(0, i.default)(z)} var(--tw-gradient-from-position)`,
                "--tw-gradient-to": `${L} var(--tw-gradient-to-position)`,
                "--tw-gradient-stops": "var(--tw-gradient-from), var(--tw-gradient-to)"
              };
            }
          }, $), P({
            from: (z) => ({
              "--tw-gradient-from-position": z
            })
          }, B), P({
            via: (z) => {
              let L = S(z);
              return {
                "@defaults gradient-color-stops": {},
                "--tw-gradient-to": `${L}  var(--tw-gradient-to-position)`,
                "--tw-gradient-stops": `var(--tw-gradient-from), ${(0, i.default)(z)} var(--tw-gradient-via-position), var(--tw-gradient-to)`
              };
            }
          }, $), P({
            via: (z) => ({
              "--tw-gradient-via-position": z
            })
          }, B), P({
            to: (z) => ({
              "@defaults gradient-color-stops": {},
              "--tw-gradient-to": `${(0, i.default)(z)} var(--tw-gradient-to-position)`
            })
          }, $), P({
            to: (z) => ({
              "--tw-gradient-to-position": z
            })
          }, B);
        };
      })(),
      boxDecorationBreak: ({ addUtilities: S }) => {
        S({
          ".decoration-slice": {
            "box-decoration-break": "slice"
          },
          ".decoration-clone": {
            "box-decoration-break": "clone"
          },
          ".box-decoration-slice": {
            "box-decoration-break": "slice"
          },
          ".box-decoration-clone": {
            "box-decoration-break": "clone"
          }
        });
      },
      backgroundSize: (0, f.default)("backgroundSize", [
        [
          "bg",
          [
            "background-size"
          ]
        ]
      ], {
        type: [
          "lookup",
          "length",
          "percentage",
          "size"
        ]
      }),
      backgroundAttachment: ({ addUtilities: S }) => {
        S({
          ".bg-fixed": {
            "background-attachment": "fixed"
          },
          ".bg-local": {
            "background-attachment": "local"
          },
          ".bg-scroll": {
            "background-attachment": "scroll"
          }
        });
      },
      backgroundClip: ({ addUtilities: S }) => {
        S({
          ".bg-clip-border": {
            "background-clip": "border-box"
          },
          ".bg-clip-padding": {
            "background-clip": "padding-box"
          },
          ".bg-clip-content": {
            "background-clip": "content-box"
          },
          ".bg-clip-text": {
            "background-clip": "text"
          }
        });
      },
      backgroundPosition: (0, f.default)("backgroundPosition", [
        [
          "bg",
          [
            "background-position"
          ]
        ]
      ], {
        type: [
          "lookup",
          [
            "position",
            {
              preferOnConflict: true
            }
          ]
        ]
      }),
      backgroundRepeat: ({ addUtilities: S }) => {
        S({
          ".bg-repeat": {
            "background-repeat": "repeat"
          },
          ".bg-no-repeat": {
            "background-repeat": "no-repeat"
          },
          ".bg-repeat-x": {
            "background-repeat": "repeat-x"
          },
          ".bg-repeat-y": {
            "background-repeat": "repeat-y"
          },
          ".bg-repeat-round": {
            "background-repeat": "round"
          },
          ".bg-repeat-space": {
            "background-repeat": "space"
          }
        });
      },
      backgroundOrigin: ({ addUtilities: S }) => {
        S({
          ".bg-origin-border": {
            "background-origin": "border-box"
          },
          ".bg-origin-padding": {
            "background-origin": "padding-box"
          },
          ".bg-origin-content": {
            "background-origin": "content-box"
          }
        });
      },
      fill: ({ matchUtilities: S, theme: P }) => {
        S({
          fill: (C) => ({
            fill: (0, i.default)(C)
          })
        }, {
          values: (0, e.default)(P("fill")),
          type: [
            "color",
            "any"
          ]
        });
      },
      stroke: ({ matchUtilities: S, theme: P }) => {
        S({
          stroke: (C) => ({
            stroke: (0, i.default)(C)
          })
        }, {
          values: (0, e.default)(P("stroke")),
          type: [
            "color",
            "url",
            "any"
          ]
        });
      },
      strokeWidth: (0, f.default)("strokeWidth", [
        [
          "stroke",
          [
            "stroke-width"
          ]
        ]
      ], {
        type: [
          "length",
          "number",
          "percentage"
        ]
      }),
      objectFit: ({ addUtilities: S }) => {
        S({
          ".object-contain": {
            "object-fit": "contain"
          },
          ".object-cover": {
            "object-fit": "cover"
          },
          ".object-fill": {
            "object-fit": "fill"
          },
          ".object-none": {
            "object-fit": "none"
          },
          ".object-scale-down": {
            "object-fit": "scale-down"
          }
        });
      },
      objectPosition: (0, f.default)("objectPosition", [
        [
          "object",
          [
            "object-position"
          ]
        ]
      ]),
      padding: (0, f.default)("padding", [
        [
          "p",
          [
            "padding"
          ]
        ],
        [
          [
            "px",
            [
              "padding-left",
              "padding-right"
            ]
          ],
          [
            "py",
            [
              "padding-top",
              "padding-bottom"
            ]
          ]
        ],
        [
          [
            "ps",
            [
              "padding-inline-start"
            ]
          ],
          [
            "pe",
            [
              "padding-inline-end"
            ]
          ],
          [
            "pt",
            [
              "padding-top"
            ]
          ],
          [
            "pr",
            [
              "padding-right"
            ]
          ],
          [
            "pb",
            [
              "padding-bottom"
            ]
          ],
          [
            "pl",
            [
              "padding-left"
            ]
          ]
        ]
      ]),
      textAlign: ({ addUtilities: S }) => {
        S({
          ".text-left": {
            "text-align": "left"
          },
          ".text-center": {
            "text-align": "center"
          },
          ".text-right": {
            "text-align": "right"
          },
          ".text-justify": {
            "text-align": "justify"
          },
          ".text-start": {
            "text-align": "start"
          },
          ".text-end": {
            "text-align": "end"
          }
        });
      },
      textIndent: (0, f.default)("textIndent", [
        [
          "indent",
          [
            "text-indent"
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      verticalAlign: ({ addUtilities: S, matchUtilities: P }) => {
        S({
          ".align-baseline": {
            "vertical-align": "baseline"
          },
          ".align-top": {
            "vertical-align": "top"
          },
          ".align-middle": {
            "vertical-align": "middle"
          },
          ".align-bottom": {
            "vertical-align": "bottom"
          },
          ".align-text-top": {
            "vertical-align": "text-top"
          },
          ".align-text-bottom": {
            "vertical-align": "text-bottom"
          },
          ".align-sub": {
            "vertical-align": "sub"
          },
          ".align-super": {
            "vertical-align": "super"
          }
        }), P({
          align: (C) => ({
            "vertical-align": C
          })
        });
      },
      fontFamily: ({ matchUtilities: S, theme: P }) => {
        S({
          font: (C) => {
            let [R, $ = {}] = Array.isArray(C) && (0, o.default)(C[1]) ? C : [
              C
            ], { fontFeatureSettings: B, fontVariationSettings: z } = $;
            return {
              "font-family": Array.isArray(R) ? R.join(", ") : R,
              ...B === undefined ? {} : {
                "font-feature-settings": B
              },
              ...z === undefined ? {} : {
                "font-variation-settings": z
              }
            };
          }
        }, {
          values: P("fontFamily"),
          type: [
            "lookup",
            "generic-name",
            "family-name"
          ]
        });
      },
      fontSize: ({ matchUtilities: S, theme: P }) => {
        S({
          text: (C, { modifier: R }) => {
            let [$, B] = Array.isArray(C) ? C : [
              C
            ];
            if (R)
              return {
                "font-size": $,
                "line-height": R
              };
            let { lineHeight: z, letterSpacing: L, fontWeight: F } = (0, o.default)(B) ? B : {
              lineHeight: B
            };
            return {
              "font-size": $,
              ...z === undefined ? {} : {
                "line-height": z
              },
              ...L === undefined ? {} : {
                "letter-spacing": L
              },
              ...F === undefined ? {} : {
                "font-weight": F
              }
            };
          }
        }, {
          values: P("fontSize"),
          modifiers: P("lineHeight"),
          type: [
            "absolute-size",
            "relative-size",
            "length",
            "percentage"
          ]
        });
      },
      fontWeight: (0, f.default)("fontWeight", [
        [
          "font",
          [
            "fontWeight"
          ]
        ]
      ], {
        type: [
          "lookup",
          "number",
          "any"
        ]
      }),
      textTransform: ({ addUtilities: S }) => {
        S({
          ".uppercase": {
            "text-transform": "uppercase"
          },
          ".lowercase": {
            "text-transform": "lowercase"
          },
          ".capitalize": {
            "text-transform": "capitalize"
          },
          ".normal-case": {
            "text-transform": "none"
          }
        });
      },
      fontStyle: ({ addUtilities: S }) => {
        S({
          ".italic": {
            "font-style": "italic"
          },
          ".not-italic": {
            "font-style": "normal"
          }
        });
      },
      fontVariantNumeric: ({ addDefaults: S, addUtilities: P }) => {
        let C = "var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)";
        S("font-variant-numeric", {
          "--tw-ordinal": " ",
          "--tw-slashed-zero": " ",
          "--tw-numeric-figure": " ",
          "--tw-numeric-spacing": " ",
          "--tw-numeric-fraction": " "
        }), P({
          ".normal-nums": {
            "font-variant-numeric": "normal"
          },
          ".ordinal": {
            "@defaults font-variant-numeric": {},
            "--tw-ordinal": "ordinal",
            "font-variant-numeric": C
          },
          ".slashed-zero": {
            "@defaults font-variant-numeric": {},
            "--tw-slashed-zero": "slashed-zero",
            "font-variant-numeric": C
          },
          ".lining-nums": {
            "@defaults font-variant-numeric": {},
            "--tw-numeric-figure": "lining-nums",
            "font-variant-numeric": C
          },
          ".oldstyle-nums": {
            "@defaults font-variant-numeric": {},
            "--tw-numeric-figure": "oldstyle-nums",
            "font-variant-numeric": C
          },
          ".proportional-nums": {
            "@defaults font-variant-numeric": {},
            "--tw-numeric-spacing": "proportional-nums",
            "font-variant-numeric": C
          },
          ".tabular-nums": {
            "@defaults font-variant-numeric": {},
            "--tw-numeric-spacing": "tabular-nums",
            "font-variant-numeric": C
          },
          ".diagonal-fractions": {
            "@defaults font-variant-numeric": {},
            "--tw-numeric-fraction": "diagonal-fractions",
            "font-variant-numeric": C
          },
          ".stacked-fractions": {
            "@defaults font-variant-numeric": {},
            "--tw-numeric-fraction": "stacked-fractions",
            "font-variant-numeric": C
          }
        });
      },
      lineHeight: (0, f.default)("lineHeight", [
        [
          "leading",
          [
            "lineHeight"
          ]
        ]
      ]),
      letterSpacing: (0, f.default)("letterSpacing", [
        [
          "tracking",
          [
            "letterSpacing"
          ]
        ]
      ], {
        supportsNegativeValues: true
      }),
      textColor: ({ matchUtilities: S, theme: P, corePlugins: C }) => {
        S({
          text: (R) => C("textOpacity") ? (0, r.default)({
            color: R,
            property: "color",
            variable: "--tw-text-opacity"
          }) : {
            color: (0, i.default)(R)
          }
        }, {
          values: (0, e.default)(P("textColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      textOpacity: (0, f.default)("textOpacity", [
        [
          "text-opacity",
          [
            "--tw-text-opacity"
          ]
        ]
      ]),
      textDecoration: ({ addUtilities: S }) => {
        S({
          ".underline": {
            "text-decoration-line": "underline"
          },
          ".overline": {
            "text-decoration-line": "overline"
          },
          ".line-through": {
            "text-decoration-line": "line-through"
          },
          ".no-underline": {
            "text-decoration-line": "none"
          }
        });
      },
      textDecorationColor: ({ matchUtilities: S, theme: P }) => {
        S({
          decoration: (C) => ({
            "text-decoration-color": (0, i.default)(C)
          })
        }, {
          values: (0, e.default)(P("textDecorationColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      textDecorationStyle: ({ addUtilities: S }) => {
        S({
          ".decoration-solid": {
            "text-decoration-style": "solid"
          },
          ".decoration-double": {
            "text-decoration-style": "double"
          },
          ".decoration-dotted": {
            "text-decoration-style": "dotted"
          },
          ".decoration-dashed": {
            "text-decoration-style": "dashed"
          },
          ".decoration-wavy": {
            "text-decoration-style": "wavy"
          }
        });
      },
      textDecorationThickness: (0, f.default)("textDecorationThickness", [
        [
          "decoration",
          [
            "text-decoration-thickness"
          ]
        ]
      ], {
        type: [
          "length",
          "percentage"
        ]
      }),
      textUnderlineOffset: (0, f.default)("textUnderlineOffset", [
        [
          "underline-offset",
          [
            "text-underline-offset"
          ]
        ]
      ], {
        type: [
          "length",
          "percentage",
          "any"
        ]
      }),
      fontSmoothing: ({ addUtilities: S }) => {
        S({
          ".antialiased": {
            "-webkit-font-smoothing": "antialiased",
            "-moz-osx-font-smoothing": "grayscale"
          },
          ".subpixel-antialiased": {
            "-webkit-font-smoothing": "auto",
            "-moz-osx-font-smoothing": "auto"
          }
        });
      },
      placeholderColor: ({ matchUtilities: S, theme: P, corePlugins: C }) => {
        S({
          placeholder: (R) => C("placeholderOpacity") ? {
            "&::placeholder": (0, r.default)({
              color: R,
              property: "color",
              variable: "--tw-placeholder-opacity"
            })
          } : {
            "&::placeholder": {
              color: (0, i.default)(R)
            }
          }
        }, {
          values: (0, e.default)(P("placeholderColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      placeholderOpacity: ({ matchUtilities: S, theme: P }) => {
        S({
          "placeholder-opacity": (C) => ({
            "&::placeholder": {
              "--tw-placeholder-opacity": C
            }
          })
        }, {
          values: P("placeholderOpacity")
        });
      },
      caretColor: ({ matchUtilities: S, theme: P }) => {
        S({
          caret: (C) => ({
            "caret-color": (0, i.default)(C)
          })
        }, {
          values: (0, e.default)(P("caretColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      accentColor: ({ matchUtilities: S, theme: P }) => {
        S({
          accent: (C) => ({
            "accent-color": (0, i.default)(C)
          })
        }, {
          values: (0, e.default)(P("accentColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      opacity: (0, f.default)("opacity", [
        [
          "opacity",
          [
            "opacity"
          ]
        ]
      ]),
      backgroundBlendMode: ({ addUtilities: S }) => {
        S({
          ".bg-blend-normal": {
            "background-blend-mode": "normal"
          },
          ".bg-blend-multiply": {
            "background-blend-mode": "multiply"
          },
          ".bg-blend-screen": {
            "background-blend-mode": "screen"
          },
          ".bg-blend-overlay": {
            "background-blend-mode": "overlay"
          },
          ".bg-blend-darken": {
            "background-blend-mode": "darken"
          },
          ".bg-blend-lighten": {
            "background-blend-mode": "lighten"
          },
          ".bg-blend-color-dodge": {
            "background-blend-mode": "color-dodge"
          },
          ".bg-blend-color-burn": {
            "background-blend-mode": "color-burn"
          },
          ".bg-blend-hard-light": {
            "background-blend-mode": "hard-light"
          },
          ".bg-blend-soft-light": {
            "background-blend-mode": "soft-light"
          },
          ".bg-blend-difference": {
            "background-blend-mode": "difference"
          },
          ".bg-blend-exclusion": {
            "background-blend-mode": "exclusion"
          },
          ".bg-blend-hue": {
            "background-blend-mode": "hue"
          },
          ".bg-blend-saturation": {
            "background-blend-mode": "saturation"
          },
          ".bg-blend-color": {
            "background-blend-mode": "color"
          },
          ".bg-blend-luminosity": {
            "background-blend-mode": "luminosity"
          }
        });
      },
      mixBlendMode: ({ addUtilities: S }) => {
        S({
          ".mix-blend-normal": {
            "mix-blend-mode": "normal"
          },
          ".mix-blend-multiply": {
            "mix-blend-mode": "multiply"
          },
          ".mix-blend-screen": {
            "mix-blend-mode": "screen"
          },
          ".mix-blend-overlay": {
            "mix-blend-mode": "overlay"
          },
          ".mix-blend-darken": {
            "mix-blend-mode": "darken"
          },
          ".mix-blend-lighten": {
            "mix-blend-mode": "lighten"
          },
          ".mix-blend-color-dodge": {
            "mix-blend-mode": "color-dodge"
          },
          ".mix-blend-color-burn": {
            "mix-blend-mode": "color-burn"
          },
          ".mix-blend-hard-light": {
            "mix-blend-mode": "hard-light"
          },
          ".mix-blend-soft-light": {
            "mix-blend-mode": "soft-light"
          },
          ".mix-blend-difference": {
            "mix-blend-mode": "difference"
          },
          ".mix-blend-exclusion": {
            "mix-blend-mode": "exclusion"
          },
          ".mix-blend-hue": {
            "mix-blend-mode": "hue"
          },
          ".mix-blend-saturation": {
            "mix-blend-mode": "saturation"
          },
          ".mix-blend-color": {
            "mix-blend-mode": "color"
          },
          ".mix-blend-luminosity": {
            "mix-blend-mode": "luminosity"
          },
          ".mix-blend-plus-darker": {
            "mix-blend-mode": "plus-darker"
          },
          ".mix-blend-plus-lighter": {
            "mix-blend-mode": "plus-lighter"
          }
        });
      },
      boxShadow: (() => {
        let S = (0, v2.default)("boxShadow"), P = [
          "var(--tw-ring-offset-shadow, 0 0 #0000)",
          "var(--tw-ring-shadow, 0 0 #0000)",
          "var(--tw-shadow)"
        ].join(", ");
        return function({ matchUtilities: C, addDefaults: R, theme: $ }) {
          R("box-shadow", {
            "--tw-ring-offset-shadow": "0 0 #0000",
            "--tw-ring-shadow": "0 0 #0000",
            "--tw-shadow": "0 0 #0000",
            "--tw-shadow-colored": "0 0 #0000"
          }), C({
            shadow: (B) => {
              B = S(B);
              let z = (0, _.parseBoxShadowValue)(B);
              for (let L of z)
                L.valid && (L.color = "var(--tw-shadow-color)");
              return {
                "@defaults box-shadow": {},
                "--tw-shadow": B === "none" ? "0 0 #0000" : B,
                "--tw-shadow-colored": B === "none" ? "0 0 #0000" : (0, _.formatBoxShadowValue)(z),
                "box-shadow": P
              };
            }
          }, {
            values: $("boxShadow"),
            type: [
              "shadow"
            ]
          });
        };
      })(),
      boxShadowColor: ({ matchUtilities: S, theme: P }) => {
        S({
          shadow: (C) => ({
            "--tw-shadow-color": (0, i.default)(C),
            "--tw-shadow": "var(--tw-shadow-colored)"
          })
        }, {
          values: (0, e.default)(P("boxShadowColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      outlineStyle: ({ addUtilities: S }) => {
        S({
          ".outline-none": {
            outline: "2px solid transparent",
            "outline-offset": "2px"
          },
          ".outline": {
            "outline-style": "solid"
          },
          ".outline-dashed": {
            "outline-style": "dashed"
          },
          ".outline-dotted": {
            "outline-style": "dotted"
          },
          ".outline-double": {
            "outline-style": "double"
          }
        });
      },
      outlineWidth: (0, f.default)("outlineWidth", [
        [
          "outline",
          [
            "outline-width"
          ]
        ]
      ], {
        type: [
          "length",
          "number",
          "percentage"
        ]
      }),
      outlineOffset: (0, f.default)("outlineOffset", [
        [
          "outline-offset",
          [
            "outline-offset"
          ]
        ]
      ], {
        type: [
          "length",
          "number",
          "percentage",
          "any"
        ],
        supportsNegativeValues: true
      }),
      outlineColor: ({ matchUtilities: S, theme: P }) => {
        S({
          outline: (C) => ({
            "outline-color": (0, i.default)(C)
          })
        }, {
          values: (0, e.default)(P("outlineColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      ringWidth: ({ matchUtilities: S, addDefaults: P, addUtilities: C, theme: R, config: $ }) => {
        let B = (() => {
          var z, L;
          if ((0, y.flagEnabled)($(), "respectDefaultRingColorOpacity"))
            return R("ringColor.DEFAULT");
          let F = R("ringOpacity.DEFAULT", "0.5");
          return !((z = R("ringColor")) === null || z === undefined) && z.DEFAULT ? (0, r.withAlphaValue)((L = R("ringColor")) === null || L === undefined ? undefined : L.DEFAULT, F, `rgb(147 197 253 / ${F})`) : `rgb(147 197 253 / ${F})`;
        })();
        P("ring-width", {
          "--tw-ring-inset": " ",
          "--tw-ring-offset-width": R("ringOffsetWidth.DEFAULT", "0px"),
          "--tw-ring-offset-color": R("ringOffsetColor.DEFAULT", "#fff"),
          "--tw-ring-color": B,
          "--tw-ring-offset-shadow": "0 0 #0000",
          "--tw-ring-shadow": "0 0 #0000",
          "--tw-shadow": "0 0 #0000",
          "--tw-shadow-colored": "0 0 #0000"
        }), S({
          ring: (z) => ({
            "@defaults ring-width": {},
            "--tw-ring-offset-shadow": "var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
            "--tw-ring-shadow": `var(--tw-ring-inset) 0 0 0 calc(${z} + var(--tw-ring-offset-width)) var(--tw-ring-color)`,
            "box-shadow": [
              "var(--tw-ring-offset-shadow)",
              "var(--tw-ring-shadow)",
              "var(--tw-shadow, 0 0 #0000)"
            ].join(", ")
          })
        }, {
          values: R("ringWidth"),
          type: "length"
        }), C({
          ".ring-inset": {
            "@defaults ring-width": {},
            "--tw-ring-inset": "inset"
          }
        });
      },
      ringColor: ({ matchUtilities: S, theme: P, corePlugins: C }) => {
        S({
          ring: (R) => C("ringOpacity") ? (0, r.default)({
            color: R,
            property: "--tw-ring-color",
            variable: "--tw-ring-opacity"
          }) : {
            "--tw-ring-color": (0, i.default)(R)
          }
        }, {
          values: Object.fromEntries(Object.entries((0, e.default)(P("ringColor"))).filter(([R]) => R !== "DEFAULT")),
          type: [
            "color",
            "any"
          ]
        });
      },
      ringOpacity: (S) => {
        let { config: P } = S;
        return (0, f.default)("ringOpacity", [
          [
            "ring-opacity",
            [
              "--tw-ring-opacity"
            ]
          ]
        ], {
          filterDefault: !(0, y.flagEnabled)(P(), "respectDefaultRingColorOpacity")
        })(S);
      },
      ringOffsetWidth: (0, f.default)("ringOffsetWidth", [
        [
          "ring-offset",
          [
            "--tw-ring-offset-width"
          ]
        ]
      ], {
        type: "length"
      }),
      ringOffsetColor: ({ matchUtilities: S, theme: P }) => {
        S({
          "ring-offset": (C) => ({
            "--tw-ring-offset-color": (0, i.default)(C)
          })
        }, {
          values: (0, e.default)(P("ringOffsetColor")),
          type: [
            "color",
            "any"
          ]
        });
      },
      blur: ({ matchUtilities: S, theme: P }) => {
        S({
          blur: (C) => ({
            "--tw-blur": C.trim() === "" ? " " : `blur(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("blur")
        });
      },
      brightness: ({ matchUtilities: S, theme: P }) => {
        S({
          brightness: (C) => ({
            "--tw-brightness": `brightness(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("brightness")
        });
      },
      contrast: ({ matchUtilities: S, theme: P }) => {
        S({
          contrast: (C) => ({
            "--tw-contrast": `contrast(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("contrast")
        });
      },
      dropShadow: ({ matchUtilities: S, theme: P }) => {
        S({
          "drop-shadow": (C) => ({
            "--tw-drop-shadow": Array.isArray(C) ? C.map((R) => `drop-shadow(${R})`).join(" ") : `drop-shadow(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("dropShadow")
        });
      },
      grayscale: ({ matchUtilities: S, theme: P }) => {
        S({
          grayscale: (C) => ({
            "--tw-grayscale": `grayscale(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("grayscale")
        });
      },
      hueRotate: ({ matchUtilities: S, theme: P }) => {
        S({
          "hue-rotate": (C) => ({
            "--tw-hue-rotate": `hue-rotate(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("hueRotate"),
          supportsNegativeValues: true
        });
      },
      invert: ({ matchUtilities: S, theme: P }) => {
        S({
          invert: (C) => ({
            "--tw-invert": `invert(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("invert")
        });
      },
      saturate: ({ matchUtilities: S, theme: P }) => {
        S({
          saturate: (C) => ({
            "--tw-saturate": `saturate(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("saturate")
        });
      },
      sepia: ({ matchUtilities: S, theme: P }) => {
        S({
          sepia: (C) => ({
            "--tw-sepia": `sepia(${C})`,
            "@defaults filter": {},
            filter: q
          })
        }, {
          values: P("sepia")
        });
      },
      filter: ({ addDefaults: S, addUtilities: P }) => {
        S("filter", {
          "--tw-blur": " ",
          "--tw-brightness": " ",
          "--tw-contrast": " ",
          "--tw-grayscale": " ",
          "--tw-hue-rotate": " ",
          "--tw-invert": " ",
          "--tw-saturate": " ",
          "--tw-sepia": " ",
          "--tw-drop-shadow": " "
        }), P({
          ".filter": {
            "@defaults filter": {},
            filter: q
          },
          ".filter-none": {
            filter: "none"
          }
        });
      },
      backdropBlur: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-blur": (C) => ({
            "--tw-backdrop-blur": C.trim() === "" ? " " : `blur(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropBlur")
        });
      },
      backdropBrightness: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-brightness": (C) => ({
            "--tw-backdrop-brightness": `brightness(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropBrightness")
        });
      },
      backdropContrast: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-contrast": (C) => ({
            "--tw-backdrop-contrast": `contrast(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropContrast")
        });
      },
      backdropGrayscale: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-grayscale": (C) => ({
            "--tw-backdrop-grayscale": `grayscale(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropGrayscale")
        });
      },
      backdropHueRotate: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-hue-rotate": (C) => ({
            "--tw-backdrop-hue-rotate": `hue-rotate(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropHueRotate"),
          supportsNegativeValues: true
        });
      },
      backdropInvert: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-invert": (C) => ({
            "--tw-backdrop-invert": `invert(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropInvert")
        });
      },
      backdropOpacity: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-opacity": (C) => ({
            "--tw-backdrop-opacity": `opacity(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropOpacity")
        });
      },
      backdropSaturate: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-saturate": (C) => ({
            "--tw-backdrop-saturate": `saturate(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropSaturate")
        });
      },
      backdropSepia: ({ matchUtilities: S, theme: P }) => {
        S({
          "backdrop-sepia": (C) => ({
            "--tw-backdrop-sepia": `sepia(${C})`,
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          })
        }, {
          values: P("backdropSepia")
        });
      },
      backdropFilter: ({ addDefaults: S, addUtilities: P }) => {
        S("backdrop-filter", {
          "--tw-backdrop-blur": " ",
          "--tw-backdrop-brightness": " ",
          "--tw-backdrop-contrast": " ",
          "--tw-backdrop-grayscale": " ",
          "--tw-backdrop-hue-rotate": " ",
          "--tw-backdrop-invert": " ",
          "--tw-backdrop-opacity": " ",
          "--tw-backdrop-saturate": " ",
          "--tw-backdrop-sepia": " "
        }), P({
          ".backdrop-filter": {
            "@defaults backdrop-filter": {},
            "-webkit-backdrop-filter": M,
            "backdrop-filter": M
          },
          ".backdrop-filter-none": {
            "-webkit-backdrop-filter": "none",
            "backdrop-filter": "none"
          }
        });
      },
      transitionProperty: ({ matchUtilities: S, theme: P }) => {
        let C = P("transitionTimingFunction.DEFAULT"), R = P("transitionDuration.DEFAULT");
        S({
          transition: ($) => ({
            "transition-property": $,
            ...$ === "none" ? {} : {
              "transition-timing-function": C,
              "transition-duration": R
            }
          })
        }, {
          values: P("transitionProperty")
        });
      },
      transitionDelay: (0, f.default)("transitionDelay", [
        [
          "delay",
          [
            "transitionDelay"
          ]
        ]
      ]),
      transitionDuration: (0, f.default)("transitionDuration", [
        [
          "duration",
          [
            "transitionDuration"
          ]
        ]
      ], {
        filterDefault: true
      }),
      transitionTimingFunction: (0, f.default)("transitionTimingFunction", [
        [
          "ease",
          [
            "transitionTimingFunction"
          ]
        ]
      ], {
        filterDefault: true
      }),
      willChange: (0, f.default)("willChange", [
        [
          "will-change",
          [
            "will-change"
          ]
        ]
      ]),
      contain: ({ addDefaults: S, addUtilities: P }) => {
        let C = "var(--tw-contain-size) var(--tw-contain-layout) var(--tw-contain-paint) var(--tw-contain-style)";
        S("contain", {
          "--tw-contain-size": " ",
          "--tw-contain-layout": " ",
          "--tw-contain-paint": " ",
          "--tw-contain-style": " "
        }), P({
          ".contain-none": {
            contain: "none"
          },
          ".contain-content": {
            contain: "content"
          },
          ".contain-strict": {
            contain: "strict"
          },
          ".contain-size": {
            "@defaults contain": {},
            "--tw-contain-size": "size",
            contain: C
          },
          ".contain-inline-size": {
            "@defaults contain": {},
            "--tw-contain-size": "inline-size",
            contain: C
          },
          ".contain-layout": {
            "@defaults contain": {},
            "--tw-contain-layout": "layout",
            contain: C
          },
          ".contain-paint": {
            "@defaults contain": {},
            "--tw-contain-paint": "paint",
            contain: C
          },
          ".contain-style": {
            "@defaults contain": {},
            "--tw-contain-style": "style",
            contain: C
          }
        });
      },
      content: (0, f.default)("content", [
        [
          "content",
          [
            "--tw-content",
            [
              "content",
              "var(--tw-content)"
            ]
          ]
        ]
      ]),
      forcedColorAdjust: ({ addUtilities: S }) => {
        S({
          ".forced-color-adjust-auto": {
            "forced-color-adjust": "auto"
          },
          ".forced-color-adjust-none": {
            "forced-color-adjust": "none"
          }
        });
      }
    };
  }(Kn)), Kn;
}
var ni = {};
var No;
function au() {
  return No || (No = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    let a = /* @__PURE__ */ new Map([
      [
        "{",
        "}"
      ],
      [
        "[",
        "]"
      ],
      [
        "(",
        ")"
      ]
    ]), h = new Map(Array.from(a.entries()).map(([f, s]) => [
      s,
      f
    ])), p = /* @__PURE__ */ new Set([
      '"',
      "'",
      "`"
    ]);
    function l(f) {
      let s = [], c = false;
      for (let t = 0;t < f.length; t++) {
        let e = f[t];
        if (e === ":" && !c && s.length === 0)
          return false;
        if (p.has(e) && f[t - 1] !== "\\" && (c = !c), !c && f[t - 1] !== "\\") {
          if (a.has(e))
            s.push(e);
          else if (h.has(e)) {
            let r = h.get(e);
            if (s.length <= 0 || s.pop() !== r)
              return false;
          }
        }
      }
      return !(s.length > 0);
    }
  }(ni)), ni;
}
var ii = {};
var Fo;
function Mf() {
  return Fo || (Fo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "hasContentChanged", {
      enumerable: true,
      get: function() {
        return c;
      }
    });
    const a = /* @__PURE__ */ p(Ne), h = /* @__PURE__ */ f(yr());
    function p(t) {
      return t && t.__esModule ? t : {
        default: t
      };
    }
    function l(t) {
      if (typeof WeakMap != "function")
        return null;
      var e = /* @__PURE__ */ new WeakMap, r = /* @__PURE__ */ new WeakMap;
      return (l = function(i) {
        return i ? r : e;
      })(t);
    }
    function f(t, e) {
      if (t && t.__esModule)
        return t;
      if (t === null || typeof t != "object" && typeof t != "function")
        return {
          default: t
        };
      var r = l(e);
      if (r && r.has(t))
        return r.get(t);
      var i = {}, o = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var v2 in t)
        if (v2 !== "default" && Object.prototype.hasOwnProperty.call(t, v2)) {
          var m = o ? Object.getOwnPropertyDescriptor(t, v2) : null;
          m && (m.get || m.set) ? Object.defineProperty(i, v2, m) : i[v2] = t[v2];
        }
      return i.default = t, r && r.set(t, i), i;
    }
    function s(t) {
      try {
        return a.default.createHash("md5").update(t, "utf-8").digest("binary");
      } catch {
        return "";
      }
    }
    function c(t, e) {
      let r = e.toString();
      if (!r.includes("@tailwind"))
        return false;
      let i = h.sourceHashMap.get(t), o = s(r), v2 = i !== o;
      return h.sourceHashMap.set(t, o), v2;
    }
  }(ii)), ii;
}
var ai = {};
var si = {};
var $o;
function Df() {
  return $o || ($o = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      return (h > 0n) - (h < 0n);
    }
  }(si)), si;
}
var oi = {};
var Uo;
function qf() {
  return Uo || (Uo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "remapBitfield", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h, p) {
      let l = 0n, f = 0n;
      for (let [s, c] of p)
        h & s && (l = l | s, f = f | c);
      return h & ~l | f;
    }
  }(oi)), oi;
}
var zo;
function Lf() {
  return zo || (zo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "Offsets", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = /* @__PURE__ */ p(Df()), h = qf();
    function p(c) {
      return c && c.__esModule ? c : {
        default: c
      };
    }

    class l {
      constructor() {
        this.offsets = {
          defaults: 0n,
          base: 0n,
          components: 0n,
          utilities: 0n,
          variants: 0n,
          user: 0n
        }, this.layerPositions = {
          defaults: 0n,
          base: 1n,
          components: 2n,
          utilities: 3n,
          user: 4n,
          variants: 5n
        }, this.reservedVariantBits = 0n, this.variantOffsets = /* @__PURE__ */ new Map;
      }
      create(t) {
        return {
          layer: t,
          parentLayer: t,
          arbitrary: 0n,
          variants: 0n,
          parallelIndex: 0n,
          index: this.offsets[t]++,
          propertyOffset: 0n,
          property: "",
          options: []
        };
      }
      arbitraryProperty(t) {
        return {
          ...this.create("utilities"),
          arbitrary: 1n,
          property: t
        };
      }
      forVariant(t, e = 0) {
        let r = this.variantOffsets.get(t);
        if (r === undefined)
          throw new Error(`Cannot find offset for unknown variant ${t}`);
        return {
          ...this.create("variants"),
          variants: r << BigInt(e)
        };
      }
      applyVariantOffset(t, e, r) {
        return r.variant = e.variants, {
          ...t,
          layer: "variants",
          parentLayer: t.layer === "variants" ? t.parentLayer : t.layer,
          variants: t.variants | e.variants,
          options: r.sort ? [].concat(r, t.options) : t.options,
          parallelIndex: f([
            t.parallelIndex,
            e.parallelIndex
          ])
        };
      }
      applyParallelOffset(t, e) {
        return {
          ...t,
          parallelIndex: BigInt(e)
        };
      }
      recordVariants(t, e) {
        for (let r of t)
          this.recordVariant(r, e(r));
      }
      recordVariant(t, e = 1) {
        return this.variantOffsets.set(t, 1n << this.reservedVariantBits), this.reservedVariantBits += BigInt(e), {
          ...this.create("variants"),
          variants: this.variantOffsets.get(t)
        };
      }
      compare(t, e) {
        if (t.layer !== e.layer)
          return this.layerPositions[t.layer] - this.layerPositions[e.layer];
        if (t.parentLayer !== e.parentLayer)
          return this.layerPositions[t.parentLayer] - this.layerPositions[e.parentLayer];
        for (let i of t.options)
          for (let o of e.options) {
            if (i.id !== o.id || !i.sort || !o.sort)
              continue;
            var r;
            let v2 = (r = f([
              i.variant,
              o.variant
            ])) !== null && r !== undefined ? r : 0n, m = ~(v2 | v2 - 1n), n = t.variants & m, d = e.variants & m;
            if (n !== d)
              continue;
            let _ = i.sort({
              value: i.value,
              modifier: i.modifier
            }, {
              value: o.value,
              modifier: o.modifier
            });
            if (_ !== 0)
              return _;
          }
        return t.variants !== e.variants ? t.variants - e.variants : t.parallelIndex !== e.parallelIndex ? t.parallelIndex - e.parallelIndex : t.arbitrary !== e.arbitrary ? t.arbitrary - e.arbitrary : t.propertyOffset !== e.propertyOffset ? t.propertyOffset - e.propertyOffset : t.index - e.index;
      }
      recalculateVariantOffsets() {
        let t = Array.from(this.variantOffsets.entries()).filter(([i]) => i.startsWith("[")).sort(([i], [o]) => s(i, o)), e = t.map(([, i]) => i).sort((i, o) => (0, a.default)(i - o));
        return t.map(([, i], o) => [
          i,
          e[o]
        ]).filter(([i, o]) => i !== o);
      }
      remapArbitraryVariantOffsets(t) {
        let e = this.recalculateVariantOffsets();
        return e.length === 0 ? t : t.map((r) => {
          let [i, o] = r;
          return i = {
            ...i,
            variants: (0, h.remapBitfield)(i.variants, e)
          }, [
            i,
            o
          ];
        });
      }
      sortArbitraryProperties(t) {
        let e = /* @__PURE__ */ new Set;
        for (let [v2] of t)
          v2.arbitrary === 1n && e.add(v2.property);
        if (e.size === 0)
          return t;
        let r = Array.from(e).sort(), i = /* @__PURE__ */ new Map, o = 1n;
        for (let v2 of r)
          i.set(v2, o++);
        return t.map((v2) => {
          let [m, n] = v2;
          var d;
          return m = {
            ...m,
            propertyOffset: (d = i.get(m.property)) !== null && d !== undefined ? d : 0n
          }, [
            m,
            n
          ];
        });
      }
      sort(t) {
        return t = this.remapArbitraryVariantOffsets(t), t = this.sortArbitraryProperties(t), t.sort(([e], [r]) => (0, a.default)(this.compare(e, r)));
      }
    }
    function f(c) {
      let t = null;
      for (const e of c)
        t = t ?? e, t = t > e ? t : e;
      return t;
    }
    function s(c, t) {
      let e = c.length, r = t.length, i = e < r ? e : r;
      for (let o = 0;o < i; o++) {
        let v2 = c.charCodeAt(o) - t.charCodeAt(o);
        if (v2 !== 0)
          return v2;
      }
      return e - r;
    }
  }(ai)), ai;
}
var Wo;
function Ki() {
  return Wo || (Wo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(Y, G) {
      for (var te in G)
        Object.defineProperty(Y, te, {
          enumerable: true,
          get: G[te]
        });
    }
    a(u, {
      INTERNAL_FEATURES: function() {
        return M;
      },
      isValidVariantFormatString: function() {
        return I;
      },
      parseVariant: function() {
        return N;
      },
      getFileModifiedMap: function() {
        return U;
      },
      createContext: function() {
        return de;
      },
      getContext: function() {
        return ke;
      }
    });
    const h = /* @__PURE__ */ b(Ne), p = /* @__PURE__ */ b(Ne), l = /* @__PURE__ */ b(Be()), f = /* @__PURE__ */ b(Nl()), s = /* @__PURE__ */ b(Ke()), c = /* @__PURE__ */ b(pr()), t = /* @__PURE__ */ b(tu()), e = /* @__PURE__ */ b(Hi()), r = /* @__PURE__ */ b(ut()), i = /* @__PURE__ */ b(ft()), o = /* @__PURE__ */ q(nu()), v2 = gr(), m = If(), n = /* @__PURE__ */ q(yr()), d = Wi(), _ = /* @__PURE__ */ b(tt()), w = /* @__PURE__ */ b(ji()), y = /* @__PURE__ */ b(au()), x = wr(), g = Mf(), O = Lf(), A = it(), E = ru();
    function b(Y) {
      return Y && Y.__esModule ? Y : {
        default: Y
      };
    }
    function k(Y) {
      if (typeof WeakMap != "function")
        return null;
      var G = /* @__PURE__ */ new WeakMap, te = /* @__PURE__ */ new WeakMap;
      return (k = function(Z) {
        return Z ? te : G;
      })(Y);
    }
    function q(Y, G) {
      if (Y && Y.__esModule)
        return Y;
      if (Y === null || typeof Y != "object" && typeof Y != "function")
        return {
          default: Y
        };
      var te = k(G);
      if (te && te.has(Y))
        return te.get(Y);
      var Z = {}, ee = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var se in Y)
        if (se !== "default" && Object.prototype.hasOwnProperty.call(Y, se)) {
          var ue = ee ? Object.getOwnPropertyDescriptor(Y, se) : null;
          ue && (ue.get || ue.set) ? Object.defineProperty(Z, se, ue) : Z[se] = Y[se];
        }
      return Z.default = Y, te && te.set(Y, Z), Z;
    }
    const M = Symbol(), W = {
      MatchVariant: Symbol.for("MATCH_VARIANT")
    }, S = {
      Base: 1,
      Dynamic: 2
    };
    function P(Y, G) {
      let te = Y.tailwindConfig.prefix;
      return typeof te == "function" ? te(G) : te + G;
    }
    function C({ type: Y = "any", ...G }) {
      let te = [].concat(Y);
      return {
        ...G,
        types: te.map((Z) => Array.isArray(Z) ? {
          type: Z[0],
          ...Z[1]
        } : {
          type: Z,
          preferOnConflict: false
        })
      };
    }
    function R(Y) {
      let G = [], te = "", Z = 0;
      for (let ee = 0;ee < Y.length; ee++) {
        let se = Y[ee];
        if (se === "\\")
          te += "\\" + Y[++ee];
        else if (se === "{")
          ++Z, G.push(te.trim()), te = "";
        else if (se === "}") {
          if (--Z < 0)
            throw new Error("Your { and } are unbalanced.");
          G.push(te.trim()), te = "";
        } else
          te += se;
      }
      return te.length > 0 && G.push(te.trim()), G = G.filter((ee) => ee !== ""), G;
    }
    function $(Y, G, { before: te = [] } = {}) {
      if (te = [].concat(te), te.length <= 0) {
        Y.push(G);
        return;
      }
      let Z = Y.length - 1;
      for (let ee of te) {
        let se = Y.indexOf(ee);
        se !== -1 && (Z = Math.min(Z, se));
      }
      Y.splice(Z, 0, G);
    }
    function B(Y) {
      return Array.isArray(Y) ? Y.flatMap((G) => !Array.isArray(G) && !(0, r.default)(G) ? G : (0, t.default)(G)) : B([
        Y
      ]);
    }
    function z(Y, G) {
      return (0, s.default)((Z) => {
        let ee = [];
        return G && G(Z), Z.walkClasses((se) => {
          ee.push(se.value);
        }), ee;
      }).transformSync(Y);
    }
    function L(Y) {
      Y.walkPseudos((G) => {
        G.value === ":not" && G.remove();
      });
    }
    function F(Y, G = {
      containsNonOnDemandable: false
    }, te = 0) {
      let Z = [], ee = [];
      Y.type === "rule" ? ee.push(...Y.selectors) : Y.type === "atrule" && Y.walkRules((se) => ee.push(...se.selectors));
      for (let se of ee) {
        let ue = z(se, L);
        ue.length === 0 && (G.containsNonOnDemandable = true);
        for (let xe of ue)
          Z.push(xe);
      }
      return te === 0 ? [
        G.containsNonOnDemandable || Z.length === 0,
        Z
      ] : Z;
    }
    function D(Y) {
      return B(Y).flatMap((G) => {
        let te = /* @__PURE__ */ new Map, [Z, ee] = F(G);
        return Z && ee.unshift(n.NOT_ON_DEMAND), ee.map((se) => (te.has(G) || te.set(G, G), [
          se,
          te.get(G)
        ]));
      });
    }
    function I(Y) {
      return Y.startsWith("@") || Y.includes("&");
    }
    function N(Y) {
      Y = Y.replace(/\n+/g, "").replace(/\s{1,}/g, " ").trim();
      let G = R(Y).map((te) => {
        if (!te.startsWith("@"))
          return ({ format: ue }) => ue(te);
        let [, Z, ee] = /@(\S*)( .+|[({].*)?/g.exec(te);
        var se;
        return ({ wrap: ue }) => ue(l.default.atRule({
          name: Z,
          params: (se = ee == null ? undefined : ee.trim()) !== null && se !== undefined ? se : ""
        }));
      }).reverse();
      return (te) => {
        for (let Z of G)
          Z(te);
      };
    }
    function J(Y, G, { variantList: te, variantMap: Z, offsets: ee, classList: se }) {
      function ue(ae, re) {
        return ae ? (0, f.default)(Y, ae, re) : Y;
      }
      function xe(ae) {
        return (0, e.default)(Y.prefix, ae);
      }
      function ce(ae, re) {
        return ae === n.NOT_ON_DEMAND ? n.NOT_ON_DEMAND : re.respectPrefix ? G.tailwindConfig.prefix + ae : ae;
      }
      function Te(ae, re, fe = {}) {
        let we = (0, d.toPath)(ae), ye = ue([
          "theme",
          ...we
        ], re);
        return (0, c.default)(we[0])(ye, fe);
      }
      let ve = 0, Ae = {
        postcss: l.default,
        prefix: xe,
        e: i.default,
        config: ue,
        theme: Te,
        corePlugins: (ae) => Array.isArray(Y.corePlugins) ? Y.corePlugins.includes(ae) : ue([
          "corePlugins",
          ae
        ], true),
        variants: () => [],
        addBase(ae) {
          for (let [re, fe] of D(ae)) {
            let we = ce(re, {}), ye = ee.create("base");
            G.candidateRuleMap.has(we) || G.candidateRuleMap.set(we, []), G.candidateRuleMap.get(we).push([
              {
                sort: ye,
                layer: "base"
              },
              fe
            ]);
          }
        },
        addDefaults(ae, re) {
          const fe = {
            [`@defaults ${ae}`]: re
          };
          for (let [we, ye] of D(fe)) {
            let he = ce(we, {});
            G.candidateRuleMap.has(he) || G.candidateRuleMap.set(he, []), G.candidateRuleMap.get(he).push([
              {
                sort: ee.create("defaults"),
                layer: "defaults"
              },
              ye
            ]);
          }
        },
        addComponents(ae, re) {
          re = Object.assign({}, {
            preserveSource: false,
            respectPrefix: true,
            respectImportant: false
          }, Array.isArray(re) ? {} : re);
          for (let [we, ye] of D(ae)) {
            let he = ce(we, re);
            se.add(he), G.candidateRuleMap.has(he) || G.candidateRuleMap.set(he, []), G.candidateRuleMap.get(he).push([
              {
                sort: ee.create("components"),
                layer: "components",
                options: re
              },
              ye
            ]);
          }
        },
        addUtilities(ae, re) {
          re = Object.assign({}, {
            preserveSource: false,
            respectPrefix: true,
            respectImportant: true
          }, Array.isArray(re) ? {} : re);
          for (let [we, ye] of D(ae)) {
            let he = ce(we, re);
            se.add(he), G.candidateRuleMap.has(he) || G.candidateRuleMap.set(he, []), G.candidateRuleMap.get(he).push([
              {
                sort: ee.create("utilities"),
                layer: "utilities",
                options: re
              },
              ye
            ]);
          }
        },
        matchUtilities: function(ae, re) {
          re = C({
            ...{
              respectPrefix: true,
              respectImportant: true,
              modifiers: false
            },
            ...re
          });
          let we = ee.create("utilities");
          for (let ye in ae) {
            let qe = function(Se, { isOnlyPlugin: me }) {
              let [pe, Oe, Ue] = (0, v2.coerceValue)(re.types, Se, re, Y);
              if (pe === undefined)
                return [];
              if (!re.types.some(({ type: We }) => We === Oe))
                if (me)
                  _.default.warn([
                    `Unnecessary typehint \`${Oe}\` in \`${ye}-${Se}\`.`,
                    `You can safely update it to \`${ye}-${Se.replace(Oe + ":", "")}\`.`
                  ]);
                else
                  return [];
              if (!(0, y.default)(pe))
                return [];
              let Xe = {
                get modifier() {
                  return re.modifiers || _.default.warn(`modifier-used-without-options-for-${ye}`, [
                    "Your plugin must set `modifiers: true` in its options to support modifiers."
                  ]), Ue;
                }
              }, ze = (0, A.flagEnabled)(Y, "generalizedModifiers");
              return [].concat(ze ? Ce(pe, Xe) : Ce(pe)).filter(Boolean).map((We) => ({
                [(0, o.default)(ye, Se)]: We
              }));
            }, he = ce(ye, re), Ce = ae[ye];
            se.add([
              he,
              re
            ]);
            let ge = [
              {
                sort: we,
                layer: "utilities",
                options: re
              },
              qe
            ];
            G.candidateRuleMap.has(he) || G.candidateRuleMap.set(he, []), G.candidateRuleMap.get(he).push(ge);
          }
        },
        matchComponents: function(ae, re) {
          re = C({
            ...{
              respectPrefix: true,
              respectImportant: false,
              modifiers: false
            },
            ...re
          });
          let we = ee.create("components");
          for (let ye in ae) {
            let qe = function(Se, { isOnlyPlugin: me }) {
              let [pe, Oe, Ue] = (0, v2.coerceValue)(re.types, Se, re, Y);
              if (pe === undefined)
                return [];
              if (!re.types.some(({ type: We }) => We === Oe))
                if (me)
                  _.default.warn([
                    `Unnecessary typehint \`${Oe}\` in \`${ye}-${Se}\`.`,
                    `You can safely update it to \`${ye}-${Se.replace(Oe + ":", "")}\`.`
                  ]);
                else
                  return [];
              if (!(0, y.default)(pe))
                return [];
              let Xe = {
                get modifier() {
                  return re.modifiers || _.default.warn(`modifier-used-without-options-for-${ye}`, [
                    "Your plugin must set `modifiers: true` in its options to support modifiers."
                  ]), Ue;
                }
              }, ze = (0, A.flagEnabled)(Y, "generalizedModifiers");
              return [].concat(ze ? Ce(pe, Xe) : Ce(pe)).filter(Boolean).map((We) => ({
                [(0, o.default)(ye, Se)]: We
              }));
            }, he = ce(ye, re), Ce = ae[ye];
            se.add([
              he,
              re
            ]);
            let ge = [
              {
                sort: we,
                layer: "components",
                options: re
              },
              qe
            ];
            G.candidateRuleMap.has(he) || G.candidateRuleMap.set(he, []), G.candidateRuleMap.get(he).push(ge);
          }
        },
        addVariant(ae, re, fe = {}) {
          re = [].concat(re).map((we) => {
            if (typeof we != "string")
              return (ye = {}) => {
                let { args: he, modifySelectors: Ce, container: qe, separator: ge, wrap: Se, format: me } = ye, pe = we(Object.assign({
                  modifySelectors: Ce,
                  container: qe,
                  separator: ge
                }, fe.type === W.MatchVariant && {
                  args: he,
                  wrap: Se,
                  format: me
                }));
                if (typeof pe == "string" && !I(pe))
                  throw new Error(`Your custom variant \`${ae}\` has an invalid format string. Make sure it's an at-rule or contains a \`&\` placeholder.`);
                return Array.isArray(pe) ? pe.filter((Oe) => typeof Oe == "string").map((Oe) => N(Oe)) : pe && typeof pe == "string" && N(pe)(ye);
              };
            if (!I(we))
              throw new Error(`Your custom variant \`${ae}\` has an invalid format string. Make sure it's an at-rule or contains a \`&\` placeholder.`);
            return N(we);
          }), $(te, ae, fe), Z.set(ae, re), G.variantOptions.set(ae, fe);
        },
        matchVariant(ae, re, fe) {
          var we;
          let ye = (we = fe == null ? undefined : fe.id) !== null && we !== undefined ? we : ++ve, he = ae === "@", Ce = (0, A.flagEnabled)(Y, "generalizedModifiers");
          var qe;
          for (let [me, pe] of Object.entries((qe = fe == null ? undefined : fe.values) !== null && qe !== undefined ? qe : {}))
            me !== "DEFAULT" && Ae.addVariant(he ? `${ae}${me}` : `${ae}-${me}`, ({ args: Oe, container: Ue }) => re(pe, Ce ? {
              modifier: Oe == null ? undefined : Oe.modifier,
              container: Ue
            } : {
              container: Ue
            }), {
              ...fe,
              value: pe,
              id: ye,
              type: W.MatchVariant,
              variantInfo: S.Base
            });
          var ge;
          let Se = "DEFAULT" in ((ge = fe == null ? undefined : fe.values) !== null && ge !== undefined ? ge : {});
          Ae.addVariant(ae, ({ args: me, container: pe }) => {
            if ((me == null ? undefined : me.value) === n.NONE && !Se)
              return null;
            var Oe;
            return re((me == null ? undefined : me.value) === n.NONE ? fe.values.DEFAULT : (Oe = me == null ? undefined : me.value) !== null && Oe !== undefined ? Oe : typeof me == "string" ? me : "", Ce ? {
              modifier: me == null ? undefined : me.modifier,
              container: pe
            } : {
              container: pe
            });
          }, {
            ...fe,
            id: ye,
            type: W.MatchVariant,
            variantInfo: S.Dynamic
          });
        }
      };
      return Ae;
    }
    let T = /* @__PURE__ */ new WeakMap;
    function U(Y) {
      return T.has(Y) || T.set(Y, /* @__PURE__ */ new Map), T.get(Y);
    }
    function j(Y, G) {
      let te = false, Z = /* @__PURE__ */ new Map;
      for (let se of Y) {
        var ee;
        if (!se)
          continue;
        let ue = p.default.parse(se), xe = ue.hash ? ue.href.replace(ue.hash, "") : ue.href;
        xe = ue.search ? xe.replace(ue.search, "") : xe;
        let ce = (ee = h.default.statSync(decodeURIComponent(xe), {
          throwIfNoEntry: false
        })) === null || ee === undefined ? undefined : ee.mtimeMs;
        ce && ((!G.has(se) || ce > G.get(se)) && (te = true), Z.set(se, ce));
      }
      return [
        te,
        Z
      ];
    }
    function H(Y) {
      Y.walkAtRules((G) => {
        [
          "responsive",
          "variants"
        ].includes(G.name) && (H(G), G.before(G.nodes), G.remove());
      });
    }
    function V(Y) {
      let G = [];
      return Y.each((te) => {
        te.type === "atrule" && [
          "responsive",
          "variants"
        ].includes(te.name) && (te.name = "layer", te.params = "utilities");
      }), Y.walkAtRules("layer", (te) => {
        if (H(te), te.params === "base") {
          for (let Z of te.nodes)
            G.push(function({ addBase: ee }) {
              ee(Z, {
                respectPrefix: false
              });
            });
          te.remove();
        } else if (te.params === "components") {
          for (let Z of te.nodes)
            G.push(function({ addComponents: ee }) {
              ee(Z, {
                respectPrefix: false,
                preserveSource: true
              });
            });
          te.remove();
        } else if (te.params === "utilities") {
          for (let Z of te.nodes)
            G.push(function({ addUtilities: ee }) {
              ee(Z, {
                respectPrefix: false,
                preserveSource: true
              });
            });
          te.remove();
        }
      }), G;
    }
    function K(Y, G) {
      let te = Object.entries({
        ...m.variantPlugins,
        ...m.corePlugins
      }).map(([ce, Te]) => Y.tailwindConfig.corePlugins.includes(ce) ? Te : null).filter(Boolean), Z = Y.tailwindConfig.plugins.map((ce) => (ce.__isOptionsFunction && (ce = ce()), typeof ce == "function" ? ce : ce.handler)), ee = V(G), se = [
        m.variantPlugins.childVariant,
        m.variantPlugins.pseudoElementVariants,
        m.variantPlugins.pseudoClassVariants,
        m.variantPlugins.hasVariants,
        m.variantPlugins.ariaVariants,
        m.variantPlugins.dataVariants
      ], ue = [
        m.variantPlugins.supportsVariants,
        m.variantPlugins.reducedMotionVariants,
        m.variantPlugins.prefersContrastVariants,
        m.variantPlugins.screenVariants,
        m.variantPlugins.orientationVariants,
        m.variantPlugins.directionVariants,
        m.variantPlugins.darkVariants,
        m.variantPlugins.forcedColorsVariants,
        m.variantPlugins.printVariant
      ];
      return (Y.tailwindConfig.darkMode === "class" || Array.isArray(Y.tailwindConfig.darkMode) && Y.tailwindConfig.darkMode[0] === "class") && (ue = [
        m.variantPlugins.supportsVariants,
        m.variantPlugins.reducedMotionVariants,
        m.variantPlugins.prefersContrastVariants,
        m.variantPlugins.darkVariants,
        m.variantPlugins.screenVariants,
        m.variantPlugins.orientationVariants,
        m.variantPlugins.directionVariants,
        m.variantPlugins.forcedColorsVariants,
        m.variantPlugins.printVariant
      ]), [
        ...te,
        ...se,
        ...Z,
        ...ue,
        ...ee
      ];
    }
    function X(Y, G) {
      let te = [], Z = /* @__PURE__ */ new Map;
      G.variantMap = Z;
      let ee = new O.Offsets;
      G.offsets = ee;
      let se = /* @__PURE__ */ new Set, ue = J(G.tailwindConfig, G, {
        variantList: te,
        variantMap: Z,
        offsets: ee,
        classList: se
      });
      for (let re of Y)
        if (Array.isArray(re))
          for (let fe of re)
            fe(ue);
        else
          re == null || re(ue);
      ee.recordVariants(te, (re) => Z.get(re).length);
      for (let [re, fe] of Z.entries())
        G.variantMap.set(re, fe.map((we, ye) => [
          ee.forVariant(re, ye),
          we
        ]));
      var xe;
      let ce = ((xe = G.tailwindConfig.safelist) !== null && xe !== undefined ? xe : []).filter(Boolean);
      if (ce.length > 0) {
        let re = [];
        for (let fe of ce) {
          if (typeof fe == "string") {
            G.changedContent.push({
              content: fe,
              extension: "html"
            });
            continue;
          }
          if (fe instanceof RegExp) {
            _.default.warn("root-regex", [
              "Regular expressions in `safelist` work differently in Tailwind CSS v3.0.",
              "Update your `safelist` configuration to eliminate this warning.",
              "https://tailwindcss.com/docs/content-configuration#safelisting-classes"
            ]);
            continue;
          }
          re.push(fe);
        }
        if (re.length > 0) {
          let fe = /* @__PURE__ */ new Map, we = G.tailwindConfig.prefix.length, ye = re.some((he) => he.pattern.source.includes("!"));
          for (let he of se) {
            let Ce = Array.isArray(he) ? (() => {
              let [qe, ge] = he;
              var Se;
              let pe = Object.keys((Se = ge == null ? undefined : ge.values) !== null && Se !== undefined ? Se : {}).map((Oe) => (0, o.formatClass)(qe, Oe));
              return ge != null && ge.supportsNegativeValues && (pe = [
                ...pe,
                ...pe.map((Oe) => "-" + Oe)
              ], pe = [
                ...pe,
                ...pe.map((Oe) => Oe.slice(0, we) + "-" + Oe.slice(we))
              ]), ge.types.some(({ type: Oe }) => Oe === "color") && (pe = [
                ...pe,
                ...pe.flatMap((Oe) => Object.keys(G.tailwindConfig.theme.opacity).map((Ue) => `${Oe}/${Ue}`))
              ]), ye && (ge != null && ge.respectImportant) && (pe = [
                ...pe,
                ...pe.map((Oe) => "!" + Oe)
              ]), pe;
            })() : [
              he
            ];
            for (let qe of Ce)
              for (let { pattern: ge, variants: Se = [] } of re)
                if (ge.lastIndex = 0, fe.has(ge) || fe.set(ge, 0), !!ge.test(qe)) {
                  fe.set(ge, fe.get(ge) + 1), G.changedContent.push({
                    content: qe,
                    extension: "html"
                  });
                  for (let me of Se)
                    G.changedContent.push({
                      content: me + G.tailwindConfig.separator + qe,
                      extension: "html"
                    });
                }
          }
          for (let [he, Ce] of fe.entries())
            Ce === 0 && _.default.warn([
              `The safelist pattern \`${he}\` doesn't match any Tailwind CSS classes.`,
              "Fix this pattern or remove it from your `safelist` configuration.",
              "https://tailwindcss.com/docs/content-configuration#safelisting-classes"
            ]);
        }
      }
      var Te, ve;
      let Ae = (ve = [].concat((Te = G.tailwindConfig.darkMode) !== null && Te !== undefined ? Te : "media")[1]) !== null && ve !== undefined ? ve : "dark", ae = [
        P(G, Ae),
        P(G, "group"),
        P(G, "peer")
      ];
      G.getClassOrder = function(fe) {
        let we = [
          ...fe
        ].sort((ge, Se) => ge === Se ? 0 : ge < Se ? -1 : 1), ye = new Map(we.map((ge) => [
          ge,
          null
        ])), he = (0, x.generateRules)(new Set(we), G, true);
        he = G.offsets.sort(he);
        let Ce = BigInt(ae.length);
        for (const [, ge] of he) {
          let Se = ge.raws.tailwind.candidate;
          var qe;
          ye.set(Se, (qe = ye.get(Se)) !== null && qe !== undefined ? qe : Ce++);
        }
        return fe.map((ge) => {
          var Se;
          let me = (Se = ye.get(ge)) !== null && Se !== undefined ? Se : null, pe = ae.indexOf(ge);
          return me === null && pe !== -1 && (me = BigInt(pe)), [
            ge,
            me
          ];
        });
      }, G.getClassList = function(fe = {}) {
        let we = [];
        for (let ge of se)
          if (Array.isArray(ge)) {
            var ye;
            let [Se, me] = ge, pe = [];
            var he;
            let Oe = Object.keys((he = me == null ? undefined : me.modifiers) !== null && he !== undefined ? he : {});
            if (!(me == null || (ye = me.types) === null || ye === undefined) && ye.some(({ type: ze }) => ze === "color")) {
              var Ce;
              Oe.push(...Object.keys((Ce = G.tailwindConfig.theme.opacity) !== null && Ce !== undefined ? Ce : {}));
            }
            let Ue = {
              modifiers: Oe
            }, Xe = fe.includeMetadata && Oe.length > 0;
            var qe;
            for (let [ze, Ze] of Object.entries((qe = me == null ? undefined : me.values) !== null && qe !== undefined ? qe : {})) {
              if (Ze == null)
                continue;
              let We = (0, o.formatClass)(Se, ze);
              if (we.push(Xe ? [
                We,
                Ue
              ] : We), me != null && me.supportsNegativeValues && (0, w.default)(Ze)) {
                let Je = (0, o.formatClass)(Se, `-${ze}`);
                pe.push(Xe ? [
                  Je,
                  Ue
                ] : Je);
              }
            }
            we.push(...pe);
          } else
            we.push(ge);
        return we;
      }, G.getVariants = function() {
        let fe = Math.random().toString(36).substring(7).toUpperCase(), we = [];
        for (let [he, Ce] of G.variantOptions.entries())
          if (Ce.variantInfo !== S.Base) {
            var ye;
            we.push({
              name: he,
              isArbitrary: Ce.type === Symbol.for("MATCH_VARIANT"),
              values: Object.keys((ye = Ce.values) !== null && ye !== undefined ? ye : {}),
              hasDash: he !== "@",
              selectors({ modifier: qe, value: ge } = {}) {
                let Se = `TAILWINDPLACEHOLDER${fe}`, me = l.default.rule({
                  selector: `.${Se}`
                }), pe = l.default.root({
                  nodes: [
                    me.clone()
                  ]
                }), Oe = pe.toString();
                var Ue;
                let Xe = ((Ue = G.variantMap.get(he)) !== null && Ue !== undefined ? Ue : []).flatMap(([Ve, je]) => je), ze = [];
                for (let Ve of Xe) {
                  var Ze;
                  let je = [];
                  var We;
                  let ct = {
                    args: {
                      modifier: qe,
                      value: (We = (Ze = Ce.values) === null || Ze === undefined ? undefined : Ze[ge]) !== null && We !== undefined ? We : ge
                    },
                    separator: G.tailwindConfig.separator,
                    modifySelectors(Ge) {
                      return pe.each((xr) => {
                        xr.type === "rule" && (xr.selectors = xr.selectors.map((ea) => Ge({
                          get className() {
                            return (0, x.getClassNameFromSelector)(ea);
                          },
                          selector: ea
                        })));
                      }), pe;
                    },
                    format(Ge) {
                      je.push(Ge);
                    },
                    wrap(Ge) {
                      je.push(`@${Ge.name} ${Ge.params} { & }`);
                    },
                    container: pe
                  }, dt = Ve(ct);
                  if (je.length > 0 && ze.push(je), Array.isArray(dt))
                    for (let Ge of dt)
                      je = [], Ge(ct), ze.push(je);
                }
                let Je = [], ou = pe.toString();
                Oe !== ou && (pe.walkRules((Ve) => {
                  let je = Ve.selector, ct = (0, s.default)((dt) => {
                    dt.walkClasses((Ge) => {
                      Ge.value = `${he}${G.tailwindConfig.separator}${Ge.value}`;
                    });
                  }).processSync(je);
                  Je.push(je.replace(ct, "&").replace(Se, "&"));
                }), pe.walkAtRules((Ve) => {
                  Je.push(`@${Ve.name} (${Ve.params}) { & }`);
                }));
                var br;
                let lu = !(ge in ((br = Ce.values) !== null && br !== undefined ? br : {}));
                var _r;
                let uu = (_r = Ce[M]) !== null && _r !== undefined ? _r : {}, Xi = !(lu || uu.respectPrefix === false);
                ze = ze.map((Ve) => Ve.map((je) => ({
                  format: je,
                  respectPrefix: Xi
                }))), Je = Je.map((Ve) => ({
                  format: Ve,
                  respectPrefix: Xi
                }));
                let Sr = {
                  candidate: Se,
                  context: G
                }, Zi = ze.map((Ve) => (0, E.finalizeSelector)(`.${Se}`, (0, E.formatVariantSelector)(Ve, Sr), Sr).replace(`.${Se}`, "&").replace("{ & }", "").trim());
                return Je.length > 0 && Zi.push((0, E.formatVariantSelector)(Je, Sr).toString().replace(`.${Se}`, "&")), Zi;
              }
            });
          }
        return we;
      };
    }
    function Q(Y, G) {
      Y.classCache.has(G) && (Y.notClassCache.add(G), Y.classCache.delete(G), Y.applyClassCache.delete(G), Y.candidateRuleMap.delete(G), Y.candidateRuleCache.delete(G), Y.stylesheetCache = null);
    }
    function ne(Y, G) {
      let te = G.raws.tailwind.candidate;
      if (te) {
        for (const Z of Y.ruleCache)
          Z[1].raws.tailwind.candidate === te && Y.ruleCache.delete(Z);
        Q(Y, te);
      }
    }
    function de(Y, G = [], te = l.default.root()) {
      var Z;
      let ee = {
        disposables: [],
        ruleCache: /* @__PURE__ */ new Set,
        candidateRuleCache: /* @__PURE__ */ new Map,
        classCache: /* @__PURE__ */ new Map,
        applyClassCache: /* @__PURE__ */ new Map,
        notClassCache: new Set((Z = Y.blocklist) !== null && Z !== undefined ? Z : []),
        postCssNodeCache: /* @__PURE__ */ new Map,
        candidateRuleMap: /* @__PURE__ */ new Map,
        tailwindConfig: Y,
        changedContent: G,
        variantMap: /* @__PURE__ */ new Map,
        stylesheetCache: null,
        variantOptions: /* @__PURE__ */ new Map,
        markInvalidUtilityCandidate: (ue) => Q(ee, ue),
        markInvalidUtilityNode: (ue) => ne(ee, ue)
      }, se = K(ee, te);
      return X(se, ee), ee;
    }
    let { contextMap: _e, configContextMap: be, contextSourcesMap: ie } = n;
    function ke(Y, G, te, Z, ee, se) {
      let ue = G.opts.from, xe = Z !== null;
      n.env.DEBUG && console.log("Source path:", ue);
      let ce;
      if (xe && _e.has(ue))
        ce = _e.get(ue);
      else if (be.has(ee)) {
        let ae = be.get(ee);
        ie.get(ae).add(ue), _e.set(ue, ae), ce = ae;
      }
      let Te = (0, g.hasContentChanged)(ue, Y);
      if (ce) {
        let [ae, re] = j([
          ...se
        ], U(ce));
        if (!ae && !Te)
          return [
            ce,
            false,
            re
          ];
      }
      if (_e.has(ue)) {
        let ae = _e.get(ue);
        if (ie.has(ae) && (ie.get(ae).delete(ue), ie.get(ae).size === 0)) {
          ie.delete(ae);
          for (let [re, fe] of be)
            fe === ae && be.delete(re);
          for (let re of ae.disposables.splice(0))
            re(ae);
        }
      }
      n.env.DEBUG && console.log("Setting up new context...");
      let ve = de(te, [], Y);
      Object.assign(ve, {
        userConfigPath: Z
      });
      let [, Ae] = j([
        ...se
      ], U(ve));
      return be.set(ee, ve), _e.set(ue, ve), ie.has(ve) || ie.set(ve, /* @__PURE__ */ new Set), ie.get(ve).add(ue), [
        ve,
        true,
        Ae
      ];
    }
  }(Jn)), Jn;
}
var li = {};
var Vo;
function su() {
  return Vo || (Vo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "applyImportantSelector", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = /* @__PURE__ */ p(Ke()), h = Ji();
    function p(f) {
      return f && f.__esModule ? f : {
        default: f
      };
    }
    function l(f, s) {
      let c = (0, a.default)().astSync(f);
      return c.each((t) => {
        t.nodes.some((r) => r.type === "combinator") && (t.nodes = [
          a.default.pseudo({
            value: ":is",
            nodes: [
              t.clone()
            ]
          })
        ]), (0, h.movePseudos)(t);
      }), `${s} ${c.toString()}`;
    }
  }(li)), li;
}
var jo;
function wr() {
  return jo || (jo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(T, U) {
      for (var j in U)
        Object.defineProperty(T, j, {
          enumerable: true,
          get: U[j]
        });
    }
    a(u, {
      getClassNameFromSelector: function() {
        return O;
      },
      resolveMatches: function() {
        return L;
      },
      generateRules: function() {
        return N;
      }
    });
    const h = /* @__PURE__ */ w(Be()), p = /* @__PURE__ */ w(Ke()), l = /* @__PURE__ */ w(tu()), f = /* @__PURE__ */ w(ut()), s = /* @__PURE__ */ w(Hi()), c = gr(), t = /* @__PURE__ */ w(tt()), e = /* @__PURE__ */ x(yr()), r = ru(), i = nu(), o = vr(), v2 = Ki(), m = /* @__PURE__ */ w(au()), n = st(), d = it(), _ = su();
    function w(T) {
      return T && T.__esModule ? T : {
        default: T
      };
    }
    function y(T) {
      if (typeof WeakMap != "function")
        return null;
      var U = /* @__PURE__ */ new WeakMap, j = /* @__PURE__ */ new WeakMap;
      return (y = function(H) {
        return H ? j : U;
      })(T);
    }
    function x(T, U) {
      if (T && T.__esModule)
        return T;
      if (T === null || typeof T != "object" && typeof T != "function")
        return {
          default: T
        };
      var j = y(U);
      if (j && j.has(T))
        return j.get(T);
      var H = {}, V = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var K in T)
        if (K !== "default" && Object.prototype.hasOwnProperty.call(T, K)) {
          var X = V ? Object.getOwnPropertyDescriptor(T, K) : null;
          X && (X.get || X.set) ? Object.defineProperty(H, K, X) : H[K] = T[K];
        }
      return H.default = T, j && j.set(T, H), H;
    }
    let g = (0, p.default)((T) => T.first.filter(({ type: U }) => U === "class").pop().value);
    function O(T) {
      return g.transformSync(T);
    }
    function* A(T) {
      let U = 1 / 0;
      for (;U >= 0; ) {
        let j, H = false;
        if (U === 1 / 0 && T.endsWith("]")) {
          let X = T.indexOf("[");
          T[X - 1] === "-" ? j = X - 1 : T[X - 1] === "/" ? (j = X - 1, H = true) : j = -1;
        } else
          U === 1 / 0 && T.includes("/") ? (j = T.lastIndexOf("/"), H = true) : j = T.lastIndexOf("-", U);
        if (j < 0)
          break;
        let V = T.slice(0, j), K = T.slice(H ? j : j + 1);
        U = j - 1, !(V === "" || K === "/") && (yield [
          V,
          K
        ]);
      }
    }
    function E(T, U) {
      if (T.length === 0 || U.tailwindConfig.prefix === "")
        return T;
      for (let j of T) {
        let [H] = j;
        if (H.options.respectPrefix) {
          let V = h.default.root({
            nodes: [
              j[1].clone()
            ]
          }), K = j[1].raws.tailwind.classCandidate;
          V.walkRules((X) => {
            let Q = K.startsWith("-");
            X.selector = (0, s.default)(U.tailwindConfig.prefix, X.selector, Q);
          }), j[1] = V.nodes[0];
        }
      }
      return T;
    }
    function b(T, U) {
      if (T.length === 0)
        return T;
      let j = [];
      function H(V) {
        return V.parent && V.parent.type === "atrule" && V.parent.name === "keyframes";
      }
      for (let [V, K] of T) {
        let X = h.default.root({
          nodes: [
            K.clone()
          ]
        });
        X.walkRules((Q) => {
          if (H(Q))
            return;
          let ne = (0, p.default)().astSync(Q.selector);
          ne.each((de) => (0, r.eliminateIrrelevantSelectors)(de, U)), (0, c.updateAllClasses)(ne, (de) => de === U ? `!${de}` : de), Q.selector = ne.toString(), Q.walkDecls((de) => de.important = true);
        }), j.push([
          {
            ...V,
            important: true
          },
          X.nodes[0]
        ]);
      }
      return j;
    }
    function k(T, U, j) {
      if (U.length === 0)
        return U;
      let H = {
        modifier: null,
        value: e.NONE
      };
      {
        let [Q, ...ne] = (0, n.splitAtTopLevelOnly)(T, "/");
        if (ne.length > 1 && (Q = Q + "/" + ne.slice(0, -1).join("/"), ne = ne.slice(-1)), ne.length && !j.variantMap.has(T) && (T = Q, H.modifier = ne[0], !(0, d.flagEnabled)(j.tailwindConfig, "generalizedModifiers")))
          return [];
      }
      if (T.endsWith("]") && !T.startsWith("[")) {
        let Q = /(.)(-?)\[(.*)\]/g.exec(T);
        if (Q) {
          let [, ne, de, _e] = Q;
          if (ne === "@" && de === "-")
            return [];
          if (ne !== "@" && de === "")
            return [];
          T = T.replace(`${de}[${_e}]`, ""), H.value = _e;
        }
      }
      if (J(T) && !j.variantMap.has(T)) {
        let Q = j.offsets.recordVariant(T), ne = (0, o.normalize)(T.slice(1, -1)), de = (0, n.splitAtTopLevelOnly)(ne, ",");
        if (de.length > 1)
          return [];
        if (!de.every(v2.isValidVariantFormatString))
          return [];
        let _e = de.map((be, ie) => [
          j.offsets.applyParallelOffset(Q, ie),
          (0, v2.parseVariant)(be.trim())
        ]);
        j.variantMap.set(T, _e);
      }
      if (j.variantMap.has(T)) {
        var V;
        let Q = J(T);
        var K;
        let ne = (K = (V = j.variantOptions.get(T)) === null || V === undefined ? undefined : V[v2.INTERNAL_FEATURES]) !== null && K !== undefined ? K : {}, de = j.variantMap.get(T).slice(), _e = [], be = !(Q || ne.respectPrefix === false);
        for (let [ie, ke] of U) {
          if (ie.layer === "user")
            continue;
          let Y = h.default.root({
            nodes: [
              ke.clone()
            ]
          });
          for (let [G, te, Z] of de) {
            let ue = function() {
              ee.raws.neededBackup || (ee.raws.neededBackup = true, ee.walkRules((ve) => ve.raws.originalSelector = ve.selector));
            }, xe = function(ve) {
              return ue(), ee.each((Ae) => {
                Ae.type === "rule" && (Ae.selectors = Ae.selectors.map((ae) => ve({
                  get className() {
                    return O(ae);
                  },
                  selector: ae
                })));
              }), ee;
            }, ee = (Z ?? Y).clone(), se = [], ce = te({
              get container() {
                return ue(), ee;
              },
              separator: j.tailwindConfig.separator,
              modifySelectors: xe,
              wrap(ve) {
                let Ae = ee.nodes;
                ee.removeAll(), ve.append(Ae), ee.append(ve);
              },
              format(ve) {
                se.push({
                  format: ve,
                  respectPrefix: be
                });
              },
              args: H
            });
            if (Array.isArray(ce)) {
              for (let [ve, Ae] of ce.entries())
                de.push([
                  j.offsets.applyParallelOffset(G, ve),
                  Ae,
                  ee.clone()
                ]);
              continue;
            }
            if (typeof ce == "string" && se.push({
              format: ce,
              respectPrefix: be
            }), ce === null)
              continue;
            ee.raws.neededBackup && (delete ee.raws.neededBackup, ee.walkRules((ve) => {
              let Ae = ve.raws.originalSelector;
              if (!Ae || (delete ve.raws.originalSelector, Ae === ve.selector))
                return;
              let ae = ve.selector, re = (0, p.default)((fe) => {
                fe.walkClasses((we) => {
                  we.value = `${T}${j.tailwindConfig.separator}${we.value}`;
                });
              }).processSync(Ae);
              se.push({
                format: ae.replace(re, "&"),
                respectPrefix: be
              }), ve.selector = Ae;
            })), ee.nodes[0].raws.tailwind = {
              ...ee.nodes[0].raws.tailwind,
              parentLayer: ie.layer
            };
            var X;
            let Te = [
              {
                ...ie,
                sort: j.offsets.applyVariantOffset(ie.sort, G, Object.assign(H, j.variantOptions.get(T))),
                collectedFormats: ((X = ie.collectedFormats) !== null && X !== undefined ? X : []).concat(se)
              },
              ee.nodes[0]
            ];
            _e.push(Te);
          }
        }
        return _e;
      }
      return [];
    }
    function q(T, U, j = {}) {
      return !(0, f.default)(T) && !Array.isArray(T) ? [
        [
          T
        ],
        j
      ] : Array.isArray(T) ? q(T[0], U, T[1]) : (U.has(T) || U.set(T, (0, l.default)(T)), [
        U.get(T),
        j
      ]);
    }
    const M = /^[a-z_-]/;
    function W(T) {
      return M.test(T);
    }
    function S(T) {
      if (!T.includes("://"))
        return false;
      try {
        const U = new URL(T);
        return U.scheme !== "" && U.host !== "";
      } catch {
        return false;
      }
    }
    function P(T) {
      let U = true;
      return T.walkDecls((j) => {
        if (!C(j.prop, j.value))
          return U = false, false;
      }), U;
    }
    function C(T, U) {
      if (S(`${T}:${U}`))
        return false;
      try {
        return h.default.parse(`a{${T}:${U}}`).toResult(), true;
      } catch {
        return false;
      }
    }
    function R(T, U) {
      var j;
      let [, H, V] = (j = T.match(/^\[([a-zA-Z0-9-_]+):(\S+)\]$/)) !== null && j !== undefined ? j : [];
      if (V === undefined || !W(H) || !(0, m.default)(V))
        return null;
      let K = (0, o.normalize)(V, {
        property: H
      });
      return C(H, K) ? [
        [
          {
            sort: U.offsets.arbitraryProperty(T),
            layer: "utilities",
            options: {
              respectImportant: true
            }
          },
          () => ({
            [(0, i.asClass)(T)]: {
              [H]: K
            }
          })
        ]
      ] : null;
    }
    function* $(T, U) {
      U.candidateRuleMap.has(T) && (yield [
        U.candidateRuleMap.get(T),
        "DEFAULT"
      ]), yield* function* (Q) {
        Q !== null && (yield [
          Q,
          "DEFAULT"
        ]);
      }(R(T, U));
      let j = T, H = false;
      const V = U.tailwindConfig.prefix, K = V.length, X = j.startsWith(V) || j.startsWith(`-${V}`);
      j[K] === "-" && X && (H = true, j = V + j.slice(K + 1)), H && U.candidateRuleMap.has(j) && (yield [
        U.candidateRuleMap.get(j),
        "-DEFAULT"
      ]);
      for (let [Q, ne] of A(j))
        U.candidateRuleMap.has(Q) && (yield [
          U.candidateRuleMap.get(Q),
          H ? `-${ne}` : ne
        ]);
    }
    function B(T, U) {
      return T === e.NOT_ON_DEMAND ? [
        e.NOT_ON_DEMAND
      ] : (0, n.splitAtTopLevelOnly)(T, U);
    }
    function* z(T, U) {
      for (const V of T) {
        var j, H;
        V[1].raws.tailwind = {
          ...V[1].raws.tailwind,
          classCandidate: U,
          preserveSource: (H = (j = V[0].options) === null || j === undefined ? undefined : j.preserveSource) !== null && H !== undefined ? H : false
        }, yield V;
      }
    }
    function* L(T, U) {
      let j = U.tailwindConfig.separator, [H, ...V] = B(T, j).reverse(), K = false;
      H.startsWith("!") && (K = true, H = H.slice(1));
      for (let be of $(H, U)) {
        let ie = [], ke = /* @__PURE__ */ new Map, [Y, G] = be, te = Y.length === 1;
        for (let [Z, ee] of Y) {
          let se = [];
          if (typeof ee == "function")
            for (let ue of [].concat(ee(G, {
              isOnlyPlugin: te
            }))) {
              let [xe, ce] = q(ue, U.postCssNodeCache);
              for (let Te of xe)
                se.push([
                  {
                    ...Z,
                    options: {
                      ...Z.options,
                      ...ce
                    }
                  },
                  Te
                ]);
            }
          else if (G === "DEFAULT" || G === "-DEFAULT") {
            let ue = ee, [xe, ce] = q(ue, U.postCssNodeCache);
            for (let Te of xe)
              se.push([
                {
                  ...Z,
                  options: {
                    ...Z.options,
                    ...ce
                  }
                },
                Te
              ]);
          }
          if (se.length > 0) {
            var X, Q, ne;
            let ue = Array.from((0, c.getMatchingTypes)((Q = (X = Z.options) === null || X === undefined ? undefined : X.types) !== null && Q !== undefined ? Q : [], G, (ne = Z.options) !== null && ne !== undefined ? ne : {}, U.tailwindConfig)).map(([xe, ce]) => ce);
            ue.length > 0 && ke.set(se, ue), ie.push(se);
          }
        }
        if (J(G)) {
          if (ie.length > 1) {
            let se = function(xe) {
              return xe.length === 1 ? xe[0] : xe.find((ce) => {
                let Te = ke.get(ce);
                return ce.some(([{ options: ve }, Ae]) => P(Ae) ? ve.types.some(({ type: ae, preferOnConflict: re }) => Te.includes(ae) && re) : false);
              });
            }, [Z, ee] = ie.reduce((xe, ce) => (ce.some(([{ options: ve }]) => ve.types.some(({ type: Ae }) => Ae === "any")) ? xe[0].push(ce) : xe[1].push(ce), xe), [
              [],
              []
            ]);
            var de;
            let ue = (de = se(ee)) !== null && de !== undefined ? de : se(Z);
            if (ue)
              ie = [
                ue
              ];
            else {
              var _e;
              let xe = ie.map((Te) => /* @__PURE__ */ new Set([
                ...(_e = ke.get(Te)) !== null && _e !== undefined ? _e : []
              ]));
              for (let Te of xe)
                for (let ve of Te) {
                  let Ae = false;
                  for (let ae of xe)
                    Te !== ae && ae.has(ve) && (ae.delete(ve), Ae = true);
                  Ae && Te.delete(ve);
                }
              let ce = [];
              for (let [Te, ve] of xe.entries())
                for (let Ae of ve) {
                  let ae = ie[Te].map(([, re]) => re).flat().map((re) => re.toString().split(`
`).slice(1, -1).map((fe) => fe.trim()).map((fe) => `      ${fe}`).join(`
`)).join(`

`);
                  ce.push(`  Use \`${T.replace("[", `[${Ae}:`)}\` for \`${ae.trim()}\``);
                  break;
                }
              t.default.warn([
                `The class \`${T}\` is ambiguous and matches multiple utilities.`,
                ...ce,
                `If this is content and not a class, replace it with \`${T.replace("[", "&lsqb;").replace("]", "&rsqb;")}\` to silence this warning.`
              ]);
              continue;
            }
          }
          ie = ie.map((Z) => Z.filter((ee) => P(ee[1])));
        }
        ie = ie.flat(), ie = Array.from(z(ie, H)), ie = E(ie, U), K && (ie = b(ie, H));
        for (let Z of V)
          ie = k(Z, ie, U);
        for (let Z of ie)
          Z[1].raws.tailwind = {
            ...Z[1].raws.tailwind,
            candidate: T
          }, Z = F(Z, {
            context: U,
            candidate: T
          }), Z !== null && (yield Z);
      }
    }
    function F(T, { context: U, candidate: j }) {
      if (!T[0].collectedFormats)
        return T;
      let H = true, V;
      try {
        V = (0, r.formatVariantSelector)(T[0].collectedFormats, {
          context: U,
          candidate: j
        });
      } catch {
        return null;
      }
      let K = h.default.root({
        nodes: [
          T[1].clone()
        ]
      });
      return K.walkRules((X) => {
        if (!D(X))
          try {
            let Q = (0, r.finalizeSelector)(X.selector, V, {
              candidate: j,
              context: U
            });
            if (Q === null) {
              X.remove();
              return;
            }
            X.selector = Q;
          } catch {
            return H = false, false;
          }
      }), !H || K.nodes.length === 0 ? null : (T[1] = K.nodes[0], T);
    }
    function D(T) {
      return T.parent && T.parent.type === "atrule" && T.parent.name === "keyframes";
    }
    function I(T) {
      if (T === true)
        return (U) => {
          D(U) || U.walkDecls((j) => {
            j.parent.type === "rule" && !D(j.parent) && (j.important = true);
          });
        };
      if (typeof T == "string")
        return (U) => {
          D(U) || (U.selectors = U.selectors.map((j) => (0, _.applyImportantSelector)(j, T)));
        };
    }
    function N(T, U, j = false) {
      let H = [], V = I(U.tailwindConfig.important);
      for (let X of T) {
        if (U.notClassCache.has(X))
          continue;
        if (U.candidateRuleCache.has(X)) {
          H = H.concat(Array.from(U.candidateRuleCache.get(X)));
          continue;
        }
        let Q = Array.from(L(X, U));
        if (Q.length === 0) {
          U.notClassCache.add(X);
          continue;
        }
        U.classCache.set(X, Q);
        var K;
        let ne = (K = U.candidateRuleCache.get(X)) !== null && K !== undefined ? K : /* @__PURE__ */ new Set;
        U.candidateRuleCache.set(X, ne);
        for (const de of Q) {
          let [{ sort: _e, options: be }, ie] = de;
          if (be.respectImportant && V) {
            let Y = h.default.root({
              nodes: [
                ie.clone()
              ]
            });
            Y.walkRules(V), ie = Y.nodes[0];
          }
          let ke = [
            _e,
            j ? ie.clone() : ie
          ];
          ne.add(ke), U.ruleCache.add(ke), H.push(ke);
        }
      }
      return H;
    }
    function J(T) {
      return T.startsWith("[") && T.endsWith("]");
    }
  }(qn)), qn;
}
var Bo;
function Nf() {
  return Bo || (Bo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return O;
      }
    });
    const a = /* @__PURE__ */ c(Be()), h = /* @__PURE__ */ c(Ke()), p = wr(), l = /* @__PURE__ */ c(ft()), f = su(), s = Ji();
    function c(A) {
      return A && A.__esModule ? A : {
        default: A
      };
    }
    function t(A) {
      let E = /* @__PURE__ */ new Map;
      a.default.root({
        nodes: [
          A.clone()
        ]
      }).walkRules((M) => {
        (0, h.default)((W) => {
          W.walkClasses((S) => {
            let P = S.parent.toString(), C = E.get(P);
            C || E.set(P, C = /* @__PURE__ */ new Set), C.add(S.value);
          });
        }).processSync(M.selector);
      });
      let k = Array.from(E.values(), (M) => Array.from(M)), q = k.flat();
      return Object.assign(q, {
        groups: k
      });
    }
    let e = (0, h.default)();
    function r(A) {
      return e.astSync(A);
    }
    function i(A, E) {
      let b = /* @__PURE__ */ new Set;
      for (let k of A)
        b.add(k.split(E).pop());
      return Array.from(b);
    }
    function o(A, E) {
      let b = A.tailwindConfig.prefix;
      return typeof b == "function" ? b(E) : b + E;
    }
    function* v2(A) {
      for (yield A;A.parent; )
        yield A.parent, A = A.parent;
    }
    function m(A, E = {}) {
      let b = A.nodes;
      A.nodes = [];
      let k = A.clone(E);
      return A.nodes = b, k;
    }
    function n(A) {
      for (let E of v2(A))
        if (A !== E) {
          if (E.type === "root")
            break;
          A = m(E, {
            nodes: [
              A
            ]
          });
        }
      return A;
    }
    function d(A, E) {
      let b = /* @__PURE__ */ new Map;
      return A.walkRules((k) => {
        for (let S of v2(k)) {
          var q;
          if (((q = S.raws.tailwind) === null || q === undefined ? undefined : q.layer) !== undefined)
            return;
        }
        let M = n(k), W = E.offsets.create("user");
        for (let S of t(k)) {
          let P = b.get(S) || [];
          b.set(S, P), P.push([
            {
              layer: "user",
              sort: W,
              important: false
            },
            M
          ]);
        }
      }), b;
    }
    function _(A, E) {
      for (let b of A) {
        if (E.notClassCache.has(b) || E.applyClassCache.has(b))
          continue;
        if (E.classCache.has(b)) {
          E.applyClassCache.set(b, E.classCache.get(b).map(([q, M]) => [
            q,
            M.clone()
          ]));
          continue;
        }
        let k = Array.from((0, p.resolveMatches)(b, E));
        if (k.length === 0) {
          E.notClassCache.add(b);
          continue;
        }
        E.applyClassCache.set(b, k);
      }
      return E.applyClassCache;
    }
    function w(A) {
      let E = null;
      return {
        get: (b) => (E = E || A(), E.get(b)),
        has: (b) => (E = E || A(), E.has(b))
      };
    }
    function y(A) {
      return {
        get: (E) => A.flatMap((b) => b.get(E) || []),
        has: (E) => A.some((b) => b.has(E))
      };
    }
    function x(A) {
      let E = A.split(/[\s\t\n]+/g);
      return E[E.length - 1] === "!important" ? [
        E.slice(0, -1),
        true
      ] : [
        E,
        false
      ];
    }
    function g(A, E, b) {
      let k = /* @__PURE__ */ new Set, q = [];
      if (A.walkAtRules("apply", (P) => {
        let [C] = x(P.params);
        for (let R of C)
          k.add(R);
        q.push(P);
      }), q.length === 0)
        return;
      let M = y([
        b,
        _(k, E)
      ]);
      function W(P, C, R) {
        let $ = r(P), B = r(C), L = r(`.${(0, l.default)(R)}`).nodes[0].nodes[0];
        return $.each((F) => {
          let D = /* @__PURE__ */ new Set;
          B.each((I) => {
            let N = false;
            I = I.clone(), I.walkClasses((J) => {
              J.value === L.value && (N || (J.replaceWith(...F.nodes.map((T) => T.clone())), D.add(I), N = true));
            });
          });
          for (let I of D) {
            let N = [
              []
            ];
            for (let J of I.nodes)
              J.type === "combinator" ? (N.push(J), N.push([])) : N[N.length - 1].push(J);
            I.nodes = [];
            for (let J of N)
              Array.isArray(J) && J.sort((T, U) => T.type === "tag" && U.type === "class" ? -1 : T.type === "class" && U.type === "tag" ? 1 : T.type === "class" && U.type === "pseudo" && U.value.startsWith("::") ? -1 : T.type === "pseudo" && T.value.startsWith("::") && U.type === "class" ? 1 : 0), I.nodes = I.nodes.concat(J);
          }
          F.replaceWith(...D);
        }), $.toString();
      }
      let S = /* @__PURE__ */ new Map;
      for (let P of q) {
        let [C] = S.get(P.parent) || [
          [],
          P.source
        ];
        S.set(P.parent, [
          C,
          P.source
        ]);
        let [R, $] = x(P.params);
        if (P.parent.type === "atrule") {
          if (P.parent.name === "screen") {
            let B = P.parent.params;
            throw P.error(`@apply is not supported within nested at-rules like @screen. We suggest you write this as @apply ${R.map((z) => `${B}:${z}`).join(" ")} instead.`);
          }
          throw P.error(`@apply is not supported within nested at-rules like @${P.parent.name}. You can fix this by un-nesting @${P.parent.name}.`);
        }
        for (let B of R) {
          if ([
            o(E, "group"),
            o(E, "peer")
          ].includes(B))
            throw P.error(`@apply should not be used with the '${B}' utility`);
          if (!M.has(B))
            throw P.error(`The \`${B}\` class does not exist. If \`${B}\` is a custom class, make sure it is defined within a \`@layer\` directive.`);
          let z = M.get(B);
          for (let [, L] of z)
            L.type !== "atrule" && L.walkRules(() => {
              throw P.error([
                `The \`${B}\` class cannot be used with \`@apply\` because \`@apply\` does not currently support nested CSS.`,
                "Rewrite the selector without nesting or configure the `tailwindcss/nesting` plugin:",
                "https://tailwindcss.com/docs/using-with-preprocessors#nesting"
              ].join(`
`));
            });
          C.push([
            B,
            $,
            z
          ]);
        }
      }
      for (let [P, [C, R]] of S) {
        let $ = [];
        for (let [z, L, F] of C) {
          let D = [
            z,
            ...i([
              z
            ], E.tailwindConfig.separator)
          ];
          for (let [I, N] of F) {
            let J = t(P), T = t(N);
            if (T = T.groups.filter((V) => V.some((K) => D.includes(K))).flat(), T = T.concat(i(T, E.tailwindConfig.separator)), J.some((V) => T.includes(V)))
              throw N.error(`You cannot \`@apply\` the \`${z}\` utility here because it creates a circular dependency.`);
            let j = a.default.root({
              nodes: [
                N.clone()
              ]
            });
            j.walk((V) => {
              V.source = R;
            }), (N.type !== "atrule" || N.type === "atrule" && N.name !== "keyframes") && j.walkRules((V) => {
              if (!t(V).some((de) => de === z)) {
                V.remove();
                return;
              }
              let K = typeof E.tailwindConfig.important == "string" ? E.tailwindConfig.important : null, Q = P.raws.tailwind !== undefined && K && P.selector.indexOf(K) === 0 ? P.selector.slice(K.length) : P.selector;
              Q === "" && (Q = P.selector), V.selector = W(Q, V.selector, z), K && Q !== P.selector && (V.selector = (0, f.applyImportantSelector)(V.selector, K)), V.walkDecls((de) => {
                de.important = I.important || L;
              });
              let ne = (0, h.default)().astSync(V.selector);
              ne.each((de) => (0, s.movePseudos)(de)), V.selector = ne.toString();
            }), j.nodes[0] && $.push([
              I.sort,
              j.nodes[0]
            ]);
          }
        }
        let B = E.offsets.sort($).map((z) => z[1]);
        P.after(B);
      }
      for (let P of q)
        P.parent.nodes.length > 1 ? P.remove() : P.parent.remove();
      g(A, E, b);
    }
    function O(A) {
      return (E) => {
        let b = w(() => d(E, A));
        g(E, A, b);
      };
    }
  }(Rn)), Rn;
}
var Ff = Nf();
var $f = /* @__PURE__ */ He(Ff);
var ui = {};
var fi;
var Go;
function Uf() {
  if (Go)
    return fi;
  Go = 1;

  class u {
    constructor(h = {}) {
      if (!(h.maxSize && h.maxSize > 0))
        throw new TypeError("`maxSize` must be a number greater than 0");
      if (typeof h.maxAge == "number" && h.maxAge === 0)
        throw new TypeError("`maxAge` must be a number greater than 0");
      this.maxSize = h.maxSize, this.maxAge = h.maxAge || 1 / 0, this.onEviction = h.onEviction, this.cache = /* @__PURE__ */ new Map, this.oldCache = /* @__PURE__ */ new Map, this._size = 0;
    }
    _emitEvictions(h) {
      if (typeof this.onEviction == "function")
        for (const [p, l] of h)
          this.onEviction(p, l.value);
    }
    _deleteIfExpired(h, p) {
      return typeof p.expiry == "number" && p.expiry <= Date.now() ? (typeof this.onEviction == "function" && this.onEviction(h, p.value), this.delete(h)) : false;
    }
    _getOrDeleteIfExpired(h, p) {
      if (this._deleteIfExpired(h, p) === false)
        return p.value;
    }
    _getItemValue(h, p) {
      return p.expiry ? this._getOrDeleteIfExpired(h, p) : p.value;
    }
    _peek(h, p) {
      const l = p.get(h);
      return this._getItemValue(h, l);
    }
    _set(h, p) {
      this.cache.set(h, p), this._size++, this._size >= this.maxSize && (this._size = 0, this._emitEvictions(this.oldCache), this.oldCache = this.cache, this.cache = /* @__PURE__ */ new Map);
    }
    _moveToRecent(h, p) {
      this.oldCache.delete(h), this._set(h, p);
    }
    *_entriesAscending() {
      for (const h of this.oldCache) {
        const [p, l] = h;
        this.cache.has(p) || this._deleteIfExpired(p, l) === false && (yield h);
      }
      for (const h of this.cache) {
        const [p, l] = h;
        this._deleteIfExpired(p, l) === false && (yield h);
      }
    }
    get(h) {
      if (this.cache.has(h)) {
        const p = this.cache.get(h);
        return this._getItemValue(h, p);
      }
      if (this.oldCache.has(h)) {
        const p = this.oldCache.get(h);
        if (this._deleteIfExpired(h, p) === false)
          return this._moveToRecent(h, p), p.value;
      }
    }
    set(h, p, { maxAge: l = this.maxAge === 1 / 0 ? undefined : Date.now() + this.maxAge } = {}) {
      this.cache.has(h) ? this.cache.set(h, {
        value: p,
        maxAge: l
      }) : this._set(h, { value: p, expiry: l });
    }
    has(h) {
      return this.cache.has(h) ? !this._deleteIfExpired(h, this.cache.get(h)) : this.oldCache.has(h) ? !this._deleteIfExpired(h, this.oldCache.get(h)) : false;
    }
    peek(h) {
      if (this.cache.has(h))
        return this._peek(h, this.cache);
      if (this.oldCache.has(h))
        return this._peek(h, this.oldCache);
    }
    delete(h) {
      const p = this.cache.delete(h);
      return p && this._size--, this.oldCache.delete(h) || p;
    }
    clear() {
      this.cache.clear(), this.oldCache.clear(), this._size = 0;
    }
    resize(h) {
      if (!(h && h > 0))
        throw new TypeError("`maxSize` must be a number greater than 0");
      const p = [...this._entriesAscending()], l = p.length - h;
      l < 0 ? (this.cache = new Map(p), this.oldCache = /* @__PURE__ */ new Map, this._size = p.length) : (l > 0 && this._emitEvictions(p.slice(0, l)), this.oldCache = new Map(p.slice(l)), this.cache = /* @__PURE__ */ new Map, this._size = 0), this.maxSize = h;
    }
    *keys() {
      for (const [h] of this)
        yield h;
    }
    *values() {
      for (const [, h] of this)
        yield h;
    }
    *[Symbol.iterator]() {
      for (const h of this.cache) {
        const [p, l] = h;
        this._deleteIfExpired(p, l) === false && (yield [p, l.value]);
      }
      for (const h of this.oldCache) {
        const [p, l] = h;
        this.cache.has(p) || this._deleteIfExpired(p, l) === false && (yield [p, l.value]);
      }
    }
    *entriesDescending() {
      let h = [...this.cache];
      for (let p = h.length - 1;p >= 0; --p) {
        const l = h[p], [f, s] = l;
        this._deleteIfExpired(f, s) === false && (yield [f, s.value]);
      }
      h = [...this.oldCache];
      for (let p = h.length - 1;p >= 0; --p) {
        const l = h[p], [f, s] = l;
        this.cache.has(f) || this._deleteIfExpired(f, s) === false && (yield [f, s.value]);
      }
    }
    *entriesAscending() {
      for (const [h, p] of this._entriesAscending())
        yield [h, p.value];
    }
    get size() {
      if (!this._size)
        return this.oldCache.size;
      let h = 0;
      for (const p of this.oldCache.keys())
        this.cache.has(p) || h++;
      return Math.min(this._size + h, this.maxSize);
    }
  }
  return fi = u, fi;
}
var ci = {};
var Yo;
function zf() {
  return Yo || (Yo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(p, l = undefined, f = undefined) {
      return p.map((s) => {
        let c = s.clone();
        return f !== undefined && (c.raws.tailwind = {
          ...c.raws.tailwind,
          ...f
        }), l !== undefined && h(c, (t) => {
          var e;
          if (((e = t.raws.tailwind) === null || e === undefined ? undefined : e.preserveSource) === true && t.source)
            return false;
          t.source = l;
        }), c;
      });
    }
    function h(p, l) {
      if (l(p) !== false) {
        var f;
        (f = p.each) === null || f === undefined || f.call(p, (s) => h(s, l));
      }
    }
  }(ci)), ci;
}
var di = {};
var pi = {};
var Qo;
function Wf() {
  return Qo || (Qo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(o, v2) {
      for (var m in v2)
        Object.defineProperty(o, m, {
          enumerable: true,
          get: v2[m]
        });
    }
    a(u, {
      pattern: function() {
        return f;
      },
      withoutCapturing: function() {
        return s;
      },
      any: function() {
        return c;
      },
      optional: function() {
        return t;
      },
      zeroOrMore: function() {
        return e;
      },
      nestedBrackets: function() {
        return r;
      },
      escape: function() {
        return i;
      }
    });
    const h = /[\\^$.*+?()[\]{}|]/g, p = RegExp(h.source);
    function l(o) {
      return o = Array.isArray(o) ? o : [
        o
      ], o = o.map((v2) => v2 instanceof RegExp ? v2.source : v2), o.join("");
    }
    function f(o) {
      return new RegExp(l(o), "g");
    }
    function s(o) {
      return new RegExp(`(?:${l(o)})`, "g");
    }
    function c(o) {
      return `(?:${o.map(l).join("|")})`;
    }
    function t(o) {
      return `(?:${l(o)})?`;
    }
    function e(o) {
      return `(?:${l(o)})*`;
    }
    function r(o, v2, m = 1) {
      return s([
        i(o),
        /[^\s]*/,
        m === 1 ? `[^${i(o)}${i(v2)}s]*` : c([
          `[^${i(o)}${i(v2)}s]*`,
          r(o, v2, m - 1)
        ]),
        /[^\s]*/,
        i(v2)
      ]);
    }
    function i(o) {
      return o && p.test(o) ? o.replace(h, "\\$&") : o || "";
    }
  }(pi)), pi;
}
var Ho;
function Vf() {
  return Ho || (Ho = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "defaultExtractor", {
      enumerable: true,
      get: function() {
        return f;
      }
    });
    const a = /* @__PURE__ */ l(Wf()), h = st();
    function p(r) {
      if (typeof WeakMap != "function")
        return null;
      var i = /* @__PURE__ */ new WeakMap, o = /* @__PURE__ */ new WeakMap;
      return (p = function(v2) {
        return v2 ? o : i;
      })(r);
    }
    function l(r, i) {
      if (r && r.__esModule)
        return r;
      if (r === null || typeof r != "object" && typeof r != "function")
        return {
          default: r
        };
      var o = p(i);
      if (o && o.has(r))
        return o.get(r);
      var v2 = {}, m = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var n in r)
        if (n !== "default" && Object.prototype.hasOwnProperty.call(r, n)) {
          var d = m ? Object.getOwnPropertyDescriptor(r, n) : null;
          d && (d.get || d.set) ? Object.defineProperty(v2, n, d) : v2[n] = r[n];
        }
      return v2.default = r, o && o.set(r, v2), v2;
    }
    function f(r) {
      let i = Array.from(s(r));
      return (o) => {
        let v2 = [];
        for (let n of i) {
          var m;
          for (let d of (m = o.match(n)) !== null && m !== undefined ? m : [])
            v2.push(e(d));
        }
        for (let n of v2.slice()) {
          let d = (0, h.splitAtTopLevelOnly)(n, ".");
          for (let _ = 0;_ < d.length; _++) {
            let w = d[_];
            if (_ >= d.length - 1) {
              v2.push(w);
              continue;
            }
            let y = Number(d[_ + 1]);
            isNaN(y) ? v2.push(w) : _++;
          }
        }
        return v2;
      };
    }
    function* s(r) {
      let i = r.tailwindConfig.separator, o = r.tailwindConfig.prefix !== "" ? a.optional(a.pattern([
        /-?/,
        a.escape(r.tailwindConfig.prefix)
      ])) : "", v2 = a.any([
        /\[[^\s:'"`]+:[^\s\[\]]+\]/,
        /\[[^\s:'"`\]]+:[^\s]+?\[[^\s]+\][^\s]+?\]/,
        a.pattern([
          a.any([
            /-?(?:\w+)/,
            /@(?:\w+)/
          ]),
          a.optional(a.any([
            a.pattern([
              a.any([
                /-(?:\w+-)*\['[^\s]+'\]/,
                /-(?:\w+-)*\["[^\s]+"\]/,
                /-(?:\w+-)*\[`[^\s]+`\]/,
                /-(?:\w+-)*\[(?:[^\s\[\]]+\[[^\s\[\]]+\])*[^\s:\[\]]+\]/
              ]),
              /(?![{([]])/,
              /(?:\/[^\s'"`\\><$]*)?/
            ]),
            a.pattern([
              a.any([
                /-(?:\w+-)*\['[^\s]+'\]/,
                /-(?:\w+-)*\["[^\s]+"\]/,
                /-(?:\w+-)*\[`[^\s]+`\]/,
                /-(?:\w+-)*\[(?:[^\s\[\]]+\[[^\s\[\]]+\])*[^\s\[\]]+\]/
              ]),
              /(?![{([]])/,
              /(?:\/[^\s'"`\\$]*)?/
            ]),
            /[-\/][^\s'"`\\$={><]*/
          ]))
        ])
      ]), m = [
        a.any([
          a.pattern([
            /@\[[^\s"'`]+\](\/[^\s"'`]+)?/,
            i
          ]),
          a.pattern([
            /([^\s"'`\[\\]+-)?\[[^\s"'`]+\]\/[\w_-]+/,
            i
          ]),
          a.pattern([
            /([^\s"'`\[\\]+-)?\[[^\s"'`]+\]/,
            i
          ]),
          a.pattern([
            /[^\s"'`\[\\]+/,
            i
          ])
        ]),
        a.any([
          a.pattern([
            /([^\s"'`\[\\]+-)?\[[^\s`]+\]\/[\w_-]+/,
            i
          ]),
          a.pattern([
            /([^\s"'`\[\\]+-)?\[[^\s`]+\]/,
            i
          ]),
          a.pattern([
            /[^\s`\[\\]+/,
            i
          ])
        ])
      ];
      for (const n of m)
        yield a.pattern([
          "((?=((",
          n,
          ")+))\\2)?",
          /!?/,
          o,
          v2
        ]);
      yield /[^<>"'`\s.(){}[\]#=%$][^<>"'`\s(){}[\]#=%$]*[^<>"'`\s.(){}[\]#=%:$]/g;
    }
    let c = /([\[\]'"`])([^\[\]'"`])?/g, t = /[^"'`\s<>\]]+/;
    function e(r) {
      if (!r.includes("-["))
        return r;
      let i = 0, o = [], v2 = r.matchAll(c);
      v2 = Array.from(v2).flatMap((m) => {
        const [, ...n] = m;
        return n.map((d, _) => Object.assign([], m, {
          index: m.index + _,
          0: d
        }));
      });
      for (let m of v2) {
        let n = m[0], d = o[o.length - 1];
        if (n === d ? o.pop() : (n === "'" || n === '"' || n === "`") && o.push(n), !d) {
          if (n === "[") {
            i++;
            continue;
          } else if (n === "]") {
            i--;
            continue;
          }
          if (i < 0)
            return r.substring(0, m.index - 1);
          if (i === 0 && !t.test(n))
            return r.substring(0, m.index);
        }
      }
      return r;
    }
  }(di)), di;
}
var Jo;
function jf() {
  return Jo || (Jo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return y;
      }
    });
    const a = /* @__PURE__ */ t(Ne), h = /* @__PURE__ */ t(Uf()), p = /* @__PURE__ */ r(yr()), l = wr(), f = /* @__PURE__ */ t(tt()), s = /* @__PURE__ */ t(zf()), c = Vf();
    function t(x) {
      return x && x.__esModule ? x : {
        default: x
      };
    }
    function e(x) {
      if (typeof WeakMap != "function")
        return null;
      var g = /* @__PURE__ */ new WeakMap, O = /* @__PURE__ */ new WeakMap;
      return (e = function(A) {
        return A ? O : g;
      })(x);
    }
    function r(x, g) {
      if (x && x.__esModule)
        return x;
      if (x === null || typeof x != "object" && typeof x != "function")
        return {
          default: x
        };
      var O = e(g);
      if (O && O.has(x))
        return O.get(x);
      var A = {}, E = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var b in x)
        if (b !== "default" && Object.prototype.hasOwnProperty.call(x, b)) {
          var k = E ? Object.getOwnPropertyDescriptor(x, b) : null;
          k && (k.get || k.set) ? Object.defineProperty(A, b, k) : A[b] = x[b];
        }
      return A.default = x, O && O.set(x, A), A;
    }
    let i = p.env;
    const o = {
      DEFAULT: c.defaultExtractor
    }, v2 = {
      DEFAULT: (x) => x,
      svelte: (x) => x.replace(/(?:^|\s)class:/g, " ")
    };
    function m(x, g) {
      let O = x.tailwindConfig.content.extract;
      return O[g] || O.DEFAULT || o[g] || o.DEFAULT(x);
    }
    function n(x, g) {
      let O = x.content.transform;
      return O[g] || O.DEFAULT || v2[g] || v2.DEFAULT;
    }
    let d = /* @__PURE__ */ new WeakMap;
    function _(x, g, O, A) {
      d.has(g) || d.set(g, new h.default({
        maxSize: 25000
      }));
      for (let E of x.split(`
`))
        if (E = E.trim(), !A.has(E))
          if (A.add(E), d.get(g).has(E))
            for (let b of d.get(g).get(E))
              O.add(b);
          else {
            let b = g(E).filter((q) => q !== "!*"), k = new Set(b);
            for (let q of k)
              O.add(q);
            d.get(g).set(E, k);
          }
    }
    function w(x, g) {
      let O = g.offsets.sort(x), A = {
        base: /* @__PURE__ */ new Set,
        defaults: /* @__PURE__ */ new Set,
        components: /* @__PURE__ */ new Set,
        utilities: /* @__PURE__ */ new Set,
        variants: /* @__PURE__ */ new Set
      };
      for (let [E, b] of O)
        A[E.layer].add(b);
      return A;
    }
    function y(x) {
      return async (g) => {
        let O = {
          base: null,
          components: null,
          utilities: null,
          variants: null
        };
        if (g.walkAtRules((F) => {
          F.name === "tailwind" && Object.keys(O).includes(F.params) && (O[F.params] = F);
        }), Object.values(O).every((F) => F === null))
          return g;
        var A;
        let E = /* @__PURE__ */ new Set([
          ...(A = x.candidates) !== null && A !== undefined ? A : [],
          p.NOT_ON_DEMAND
        ]), b = /* @__PURE__ */ new Set;
        i.DEBUG && console.time("Reading changed files");
        let k = [];
        for (let F of x.changedContent) {
          let D = n(x.tailwindConfig, F.extension), I = m(x, F.extension);
          k.push([
            F,
            {
              transformer: D,
              extractor: I
            }
          ]);
        }
        const q = 500;
        for (let F = 0;F < k.length; F += q) {
          let D = k.slice(F, F + q);
          await Promise.all(D.map(async ([{ file: I, content: N }, { transformer: J, extractor: T }]) => {
            N = I ? await a.default.promises.readFile(I, "utf8") : N, _(J(N), T, E, b);
          }));
        }
        i.DEBUG && console.timeEnd("Reading changed files");
        let M = x.classCache.size;
        i.DEBUG && console.time("Generate rules"), i.DEBUG && console.time("Sorting candidates");
        let W = new Set([
          ...E
        ].sort((F, D) => F === D ? 0 : F < D ? -1 : 1));
        i.DEBUG && console.timeEnd("Sorting candidates"), (0, l.generateRules)(W, x), i.DEBUG && console.timeEnd("Generate rules"), i.DEBUG && console.time("Build stylesheet"), (x.stylesheetCache === null || x.classCache.size !== M) && (x.stylesheetCache = w([
          ...x.ruleCache
        ], x)), i.DEBUG && console.timeEnd("Build stylesheet");
        let { defaults: S, base: P, components: C, utilities: R, variants: $ } = x.stylesheetCache;
        O.base && (O.base.before((0, s.default)([
          ...P,
          ...S
        ], O.base.source, {
          layer: "base"
        })), O.base.remove()), O.components && (O.components.before((0, s.default)([
          ...C
        ], O.components.source, {
          layer: "components"
        })), O.components.remove()), O.utilities && (O.utilities.before((0, s.default)([
          ...R
        ], O.utilities.source, {
          layer: "utilities"
        })), O.utilities.remove());
        const B = Array.from($).filter((F) => {
          var D;
          const I = (D = F.raws.tailwind) === null || D === undefined ? undefined : D.parentLayer;
          return I === "components" ? O.components !== null : I === "utilities" ? O.utilities !== null : true;
        });
        O.variants ? (O.variants.before((0, s.default)(B, O.variants.source, {
          layer: "variants"
        })), O.variants.remove()) : B.length > 0 && g.append((0, s.default)(B, g.source, {
          layer: "variants"
        }));
        var z;
        g.source.end = (z = g.source.end) !== null && z !== undefined ? z : g.source.start;
        const L = B.some((F) => {
          var D;
          return ((D = F.raws.tailwind) === null || D === undefined ? undefined : D.parentLayer) === "utilities";
        });
        O.utilities && R.size === 0 && !L && f.default.warn("content-problems", [
          "No utility classes were detected in your source files. If this is unexpected, double-check the `content` option in your Tailwind CSS configuration.",
          "https://tailwindcss.com/docs/content-configuration"
        ]), i.DEBUG && (console.log("Potential classes: ", E.size), console.log("Active contexts: ", p.contextSourcesMap.size)), x.changedContent = [], g.walkAtRules("layer", (F) => {
          Object.keys(O).includes(F.params) && F.remove();
        });
      };
    }
  }(ui)), ui;
}
var Bf = jf();
var Gf = /* @__PURE__ */ He(Bf);
var Yf = wr();
var hi = {};
var Ko;
function Qf() {
  return Ko || (Ko = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return h;
      }
    });
    function a(p) {
      if (!p.walkAtRules)
        return;
      let l = /* @__PURE__ */ new Set;
      if (p.walkAtRules("apply", (f) => {
        l.add(f.parent);
      }), l.size !== 0)
        for (let f of l) {
          let s = [], c = [];
          for (let t of f.nodes)
            t.type === "atrule" && t.name === "apply" ? (c.length > 0 && (s.push(c), c = []), s.push([
              t
            ])) : c.push(t);
          if (c.length > 0 && s.push(c), s.length !== 1) {
            for (let t of [
              ...s
            ].reverse()) {
              let e = f.clone({
                nodes: []
              });
              e.append(t), f.after(e);
            }
            f.remove();
          }
        }
    }
    function h() {
      return (p) => {
        a(p);
      };
    }
  }(hi)), hi;
}
var Hf = Qf();
var Xo = /* @__PURE__ */ He(Hf);
var vi = {};
var Zo;
function Jf() {
  return Zo || (Zo = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    });
    function a(o, v2) {
      for (var m in v2)
        Object.defineProperty(o, m, {
          enumerable: true,
          get: v2[m]
        });
    }
    a(u, {
      elementSelectorParser: function() {
        return t;
      },
      default: function() {
        return i;
      }
    });
    const h = /* @__PURE__ */ f(Be()), p = /* @__PURE__ */ f(Ke()), l = it();
    function f(o) {
      return o && o.__esModule ? o : {
        default: o
      };
    }
    let s = {
      id(o) {
        return p.default.attribute({
          attribute: "id",
          operator: "=",
          value: o.value,
          quoteMark: '"'
        });
      }
    };
    function c(o) {
      let v2 = o.filter((y) => y.type !== "pseudo" || y.nodes.length > 0 ? true : y.value.startsWith("::") || [
        ":before",
        ":after",
        ":first-line",
        ":first-letter"
      ].includes(y.value)).reverse(), m = /* @__PURE__ */ new Set([
        "tag",
        "class",
        "id",
        "attribute"
      ]), n = v2.findIndex((y) => m.has(y.type));
      if (n === -1)
        return v2.reverse().join("").trim();
      let d = v2[n], _ = s[d.type] ? s[d.type](d) : d;
      v2 = v2.slice(0, n);
      let w = v2.findIndex((y) => y.type === "combinator" && y.value === ">");
      return w !== -1 && (v2.splice(0, w), v2.unshift(p.default.universal())), [
        _,
        ...v2.reverse()
      ].join("").trim();
    }
    let t = (0, p.default)((o) => o.map((v2) => {
      let m = v2.split((n) => n.type === "combinator" && n.value === " ").pop();
      return c(m);
    })), e = /* @__PURE__ */ new Map;
    function r(o) {
      return e.has(o) || e.set(o, t.transformSync(o)), e.get(o);
    }
    function i({ tailwindConfig: o }) {
      return (v2) => {
        let m = /* @__PURE__ */ new Map, n = /* @__PURE__ */ new Set;
        if (v2.walkAtRules("defaults", (w) => {
          if (w.nodes && w.nodes.length > 0) {
            n.add(w);
            return;
          }
          let y = w.params;
          m.has(y) || m.set(y, /* @__PURE__ */ new Set), m.get(y).add(w.parent), w.remove();
        }), (0, l.flagEnabled)(o, "optimizeUniversalDefaults"))
          for (let w of n) {
            let y = /* @__PURE__ */ new Map;
            var d;
            let x = (d = m.get(w.params)) !== null && d !== undefined ? d : [];
            for (let g of x)
              for (let O of r(g.selector)) {
                let A = O.includes(":-") || O.includes("::-") || O.includes(":has") ? O : "__DEFAULT__";
                var _;
                let E = (_ = y.get(A)) !== null && _ !== undefined ? _ : /* @__PURE__ */ new Set;
                y.set(A, E), E.add(O);
              }
            if ((0, l.flagEnabled)(o, "optimizeUniversalDefaults")) {
              if (y.size === 0) {
                w.remove();
                continue;
              }
              for (let [, g] of y) {
                let O = h.default.rule({
                  source: w.source
                });
                O.selectors = [
                  ...g
                ], O.append(w.nodes.map((A) => A.clone())), w.before(O);
              }
            }
            w.remove();
          }
        else if (n.size) {
          let w = h.default.rule({
            selectors: [
              "*",
              "::before",
              "::after"
            ]
          });
          for (let x of n)
            w.append(x.nodes), w.parent || x.before(w), w.source || (w.source = x.source), x.remove();
          let y = w.clone({
            selectors: [
              "::backdrop"
            ]
          });
          w.after(y);
        }
      };
    }
  }(vi)), vi;
}
var Kf = Jf();
var Xf = /* @__PURE__ */ He(Kf);
var gi = {};
var el;
function Zf() {
  return el || (el = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = Ui(), h = /* @__PURE__ */ p(zi());
    function p(f) {
      return f && f.__esModule ? f : {
        default: f
      };
    }
    function l({ tailwindConfig: { theme: f } }) {
      return function(s) {
        s.walkAtRules("screen", (c) => {
          let t = c.params, r = (0, a.normalizeScreens)(f.screens).find(({ name: i }) => i === t);
          if (!r)
            throw c.error(`No \`${t}\` screen found.`);
          c.name = "media", c.params = (0, h.default)(r);
        });
      };
    }
  }(gi)), gi;
}
var ec = Zf();
var tc = /* @__PURE__ */ He(ec);
var rc = (u, a) => u instanceof Ra && a instanceof Ra ? u.selector === a.selector || a.selector.includes("*") || a.selector.includes(":root") : u === a;
var nc = (u) => (u.walkRules((a) => {
  const h = /* @__PURE__ */ new Map, p = /* @__PURE__ */ new Set;
  a.walkDecls((l) => {
    if (/var\(--[^\s)]+\)/.test(l.value)) {
      const f = [
        ...l.value.matchAll(/var\(--[^\s)]+\)/gm)
      ].map((s) => s.toString());
      u.walkDecls((s) => {
        var c;
        if (/--[^\s]+/.test(s.prop)) {
          const t = `var(${s.prop})`;
          if (f != null && f.includes(t) && rc(l.parent, s.parent)) {
            if (((c = s.parent) == null ? undefined : c.parent) instanceof wl && s.parent !== l.parent) {
              const e = s.parent.parent, r = xu();
              r.prop = l.prop, r.value = l.value.replaceAll(t, s.value), r.important = l.important;
              const i = h.get(e);
              i ? i.add(r) : h.set(s.parent.parent, /* @__PURE__ */ new Set([r]));
              return;
            }
            p.add({
              declaration: l,
              replacing: t,
              replacement: s.value
            });
          }
        }
      });
    }
  });
  for (const {
    declaration: l,
    replacing: f,
    replacement: s
  } of p)
    l.value = l.value.replaceAll(f, s);
  for (const [l, f] of h.entries()) {
    const s = Su();
    s.selector = a.selector, s.append(...f), l.append(s);
  }
}), u.walkDecls((a) => {
  if (/--[^\s]+/.test(a.prop)) {
    const h = a.parent;
    a.remove(), h && Li(h);
  }
}), u);
var ic = Ki();
var mi = {};
var yi = {};
var wi = {};
var tl;
function ac() {
  return tl || (tl = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    const a = [
      "preflight",
      "container",
      "accessibility",
      "pointerEvents",
      "visibility",
      "position",
      "inset",
      "isolation",
      "zIndex",
      "order",
      "gridColumn",
      "gridColumnStart",
      "gridColumnEnd",
      "gridRow",
      "gridRowStart",
      "gridRowEnd",
      "float",
      "clear",
      "margin",
      "boxSizing",
      "lineClamp",
      "display",
      "aspectRatio",
      "size",
      "height",
      "maxHeight",
      "minHeight",
      "width",
      "minWidth",
      "maxWidth",
      "flex",
      "flexShrink",
      "flexGrow",
      "flexBasis",
      "tableLayout",
      "captionSide",
      "borderCollapse",
      "borderSpacing",
      "transformOrigin",
      "translate",
      "rotate",
      "skew",
      "scale",
      "transform",
      "animation",
      "cursor",
      "touchAction",
      "userSelect",
      "resize",
      "scrollSnapType",
      "scrollSnapAlign",
      "scrollSnapStop",
      "scrollMargin",
      "scrollPadding",
      "listStylePosition",
      "listStyleType",
      "listStyleImage",
      "appearance",
      "columns",
      "breakBefore",
      "breakInside",
      "breakAfter",
      "gridAutoColumns",
      "gridAutoFlow",
      "gridAutoRows",
      "gridTemplateColumns",
      "gridTemplateRows",
      "flexDirection",
      "flexWrap",
      "placeContent",
      "placeItems",
      "alignContent",
      "alignItems",
      "justifyContent",
      "justifyItems",
      "gap",
      "space",
      "divideWidth",
      "divideStyle",
      "divideColor",
      "divideOpacity",
      "placeSelf",
      "alignSelf",
      "justifySelf",
      "overflow",
      "overscrollBehavior",
      "scrollBehavior",
      "textOverflow",
      "hyphens",
      "whitespace",
      "textWrap",
      "wordBreak",
      "borderRadius",
      "borderWidth",
      "borderStyle",
      "borderColor",
      "borderOpacity",
      "backgroundColor",
      "backgroundOpacity",
      "backgroundImage",
      "gradientColorStops",
      "boxDecorationBreak",
      "backgroundSize",
      "backgroundAttachment",
      "backgroundClip",
      "backgroundPosition",
      "backgroundRepeat",
      "backgroundOrigin",
      "fill",
      "stroke",
      "strokeWidth",
      "objectFit",
      "objectPosition",
      "padding",
      "textAlign",
      "textIndent",
      "verticalAlign",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "textTransform",
      "fontStyle",
      "fontVariantNumeric",
      "lineHeight",
      "letterSpacing",
      "textColor",
      "textOpacity",
      "textDecoration",
      "textDecorationColor",
      "textDecorationStyle",
      "textDecorationThickness",
      "textUnderlineOffset",
      "fontSmoothing",
      "placeholderColor",
      "placeholderOpacity",
      "caretColor",
      "accentColor",
      "opacity",
      "backgroundBlendMode",
      "mixBlendMode",
      "boxShadow",
      "boxShadowColor",
      "outlineStyle",
      "outlineWidth",
      "outlineOffset",
      "outlineColor",
      "ringWidth",
      "ringColor",
      "ringOpacity",
      "ringOffsetWidth",
      "ringOffsetColor",
      "blur",
      "brightness",
      "contrast",
      "dropShadow",
      "grayscale",
      "hueRotate",
      "invert",
      "saturate",
      "sepia",
      "filter",
      "backdropBlur",
      "backdropBrightness",
      "backdropContrast",
      "backdropGrayscale",
      "backdropHueRotate",
      "backdropInvert",
      "backdropOpacity",
      "backdropSaturate",
      "backdropSepia",
      "backdropFilter",
      "transitionProperty",
      "transitionDelay",
      "transitionDuration",
      "transitionTimingFunction",
      "willChange",
      "contain",
      "content",
      "forcedColorAdjust"
    ];
  }(wi)), wi;
}
var bi = {};
var rl;
function sc() {
  return rl || (rl = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h, p) {
      return h === undefined ? p : Array.isArray(h) ? h : [
        ...new Set(p.filter((f) => h !== false && h[f] !== false).concat(Object.keys(h).filter((f) => h[f] !== false)))
      ];
    }
  }(bi)), bi;
}
var _i = {};
var nl;
function oc() {
  return nl || (nl = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = /* @__PURE__ */ h(tt());
    function h(f) {
      return f && f.__esModule ? f : {
        default: f
      };
    }
    function p({ version: f, from: s, to: c }) {
      a.default.warn(`${s}-color-renamed`, [
        `As of Tailwind CSS ${f}, \`${s}\` has been renamed to \`${c}\`.`,
        "Update your configuration file to silence this warning."
      ]);
    }
    const l = {
      inherit: "inherit",
      current: "currentColor",
      transparent: "transparent",
      black: "#000",
      white: "#fff",
      slate: {
        50: "#f8fafc",
        100: "#f1f5f9",
        200: "#e2e8f0",
        300: "#cbd5e1",
        400: "#94a3b8",
        500: "#64748b",
        600: "#475569",
        700: "#334155",
        800: "#1e293b",
        900: "#0f172a",
        950: "#020617"
      },
      gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
        950: "#030712"
      },
      zinc: {
        50: "#fafafa",
        100: "#f4f4f5",
        200: "#e4e4e7",
        300: "#d4d4d8",
        400: "#a1a1aa",
        500: "#71717a",
        600: "#52525b",
        700: "#3f3f46",
        800: "#27272a",
        900: "#18181b",
        950: "#09090b"
      },
      neutral: {
        50: "#fafafa",
        100: "#f5f5f5",
        200: "#e5e5e5",
        300: "#d4d4d4",
        400: "#a3a3a3",
        500: "#737373",
        600: "#525252",
        700: "#404040",
        800: "#262626",
        900: "#171717",
        950: "#0a0a0a"
      },
      stone: {
        50: "#fafaf9",
        100: "#f5f5f4",
        200: "#e7e5e4",
        300: "#d6d3d1",
        400: "#a8a29e",
        500: "#78716c",
        600: "#57534e",
        700: "#44403c",
        800: "#292524",
        900: "#1c1917",
        950: "#0c0a09"
      },
      red: {
        50: "#fef2f2",
        100: "#fee2e2",
        200: "#fecaca",
        300: "#fca5a5",
        400: "#f87171",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
        800: "#991b1b",
        900: "#7f1d1d",
        950: "#450a0a"
      },
      orange: {
        50: "#fff7ed",
        100: "#ffedd5",
        200: "#fed7aa",
        300: "#fdba74",
        400: "#fb923c",
        500: "#f97316",
        600: "#ea580c",
        700: "#c2410c",
        800: "#9a3412",
        900: "#7c2d12",
        950: "#431407"
      },
      amber: {
        50: "#fffbeb",
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
        800: "#92400e",
        900: "#78350f",
        950: "#451a03"
      },
      yellow: {
        50: "#fefce8",
        100: "#fef9c3",
        200: "#fef08a",
        300: "#fde047",
        400: "#facc15",
        500: "#eab308",
        600: "#ca8a04",
        700: "#a16207",
        800: "#854d0e",
        900: "#713f12",
        950: "#422006"
      },
      lime: {
        50: "#f7fee7",
        100: "#ecfccb",
        200: "#d9f99d",
        300: "#bef264",
        400: "#a3e635",
        500: "#84cc16",
        600: "#65a30d",
        700: "#4d7c0f",
        800: "#3f6212",
        900: "#365314",
        950: "#1a2e05"
      },
      green: {
        50: "#f0fdf4",
        100: "#dcfce7",
        200: "#bbf7d0",
        300: "#86efac",
        400: "#4ade80",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
        800: "#166534",
        900: "#14532d",
        950: "#052e16"
      },
      emerald: {
        50: "#ecfdf5",
        100: "#d1fae5",
        200: "#a7f3d0",
        300: "#6ee7b7",
        400: "#34d399",
        500: "#10b981",
        600: "#059669",
        700: "#047857",
        800: "#065f46",
        900: "#064e3b",
        950: "#022c22"
      },
      teal: {
        50: "#f0fdfa",
        100: "#ccfbf1",
        200: "#99f6e4",
        300: "#5eead4",
        400: "#2dd4bf",
        500: "#14b8a6",
        600: "#0d9488",
        700: "#0f766e",
        800: "#115e59",
        900: "#134e4a",
        950: "#042f2e"
      },
      cyan: {
        50: "#ecfeff",
        100: "#cffafe",
        200: "#a5f3fc",
        300: "#67e8f9",
        400: "#22d3ee",
        500: "#06b6d4",
        600: "#0891b2",
        700: "#0e7490",
        800: "#155e75",
        900: "#164e63",
        950: "#083344"
      },
      sky: {
        50: "#f0f9ff",
        100: "#e0f2fe",
        200: "#bae6fd",
        300: "#7dd3fc",
        400: "#38bdf8",
        500: "#0ea5e9",
        600: "#0284c7",
        700: "#0369a1",
        800: "#075985",
        900: "#0c4a6e",
        950: "#082f49"
      },
      blue: {
        50: "#eff6ff",
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a",
        950: "#172554"
      },
      indigo: {
        50: "#eef2ff",
        100: "#e0e7ff",
        200: "#c7d2fe",
        300: "#a5b4fc",
        400: "#818cf8",
        500: "#6366f1",
        600: "#4f46e5",
        700: "#4338ca",
        800: "#3730a3",
        900: "#312e81",
        950: "#1e1b4b"
      },
      violet: {
        50: "#f5f3ff",
        100: "#ede9fe",
        200: "#ddd6fe",
        300: "#c4b5fd",
        400: "#a78bfa",
        500: "#8b5cf6",
        600: "#7c3aed",
        700: "#6d28d9",
        800: "#5b21b6",
        900: "#4c1d95",
        950: "#2e1065"
      },
      purple: {
        50: "#faf5ff",
        100: "#f3e8ff",
        200: "#e9d5ff",
        300: "#d8b4fe",
        400: "#c084fc",
        500: "#a855f7",
        600: "#9333ea",
        700: "#7e22ce",
        800: "#6b21a8",
        900: "#581c87",
        950: "#3b0764"
      },
      fuchsia: {
        50: "#fdf4ff",
        100: "#fae8ff",
        200: "#f5d0fe",
        300: "#f0abfc",
        400: "#e879f9",
        500: "#d946ef",
        600: "#c026d3",
        700: "#a21caf",
        800: "#86198f",
        900: "#701a75",
        950: "#4a044e"
      },
      pink: {
        50: "#fdf2f8",
        100: "#fce7f3",
        200: "#fbcfe8",
        300: "#f9a8d4",
        400: "#f472b6",
        500: "#ec4899",
        600: "#db2777",
        700: "#be185d",
        800: "#9d174d",
        900: "#831843",
        950: "#500724"
      },
      rose: {
        50: "#fff1f2",
        100: "#ffe4e6",
        200: "#fecdd3",
        300: "#fda4af",
        400: "#fb7185",
        500: "#f43f5e",
        600: "#e11d48",
        700: "#be123c",
        800: "#9f1239",
        900: "#881337",
        950: "#4c0519"
      },
      get lightBlue() {
        return p({
          version: "v2.2",
          from: "lightBlue",
          to: "sky"
        }), this.sky;
      },
      get warmGray() {
        return p({
          version: "v3.0",
          from: "warmGray",
          to: "stone"
        }), this.stone;
      },
      get trueGray() {
        return p({
          version: "v3.0",
          from: "trueGray",
          to: "neutral"
        }), this.neutral;
      },
      get coolGray() {
        return p({
          version: "v3.0",
          from: "coolGray",
          to: "gray"
        }), this.gray;
      },
      get blueGray() {
        return p({
          version: "v3.0",
          from: "blueGray",
          to: "slate"
        }), this.slate;
      }
    };
  }(_i)), _i;
}
var Si = {};
var il;
function lc() {
  return il || (il = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "defaults", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h, ...p) {
      for (let s of p) {
        for (let c in s) {
          var l;
          !(h == null || (l = h.hasOwnProperty) === null || l === undefined) && l.call(h, c) || (h[c] = s[c]);
        }
        for (let c of Object.getOwnPropertySymbols(s)) {
          var f;
          !(h == null || (f = h.hasOwnProperty) === null || f === undefined) && f.call(h, c) || (h[c] = s[c]);
        }
      }
      return h;
    }
  }(Si)), Si;
}
var xi = {};
var al;
function uc() {
  return al || (al = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "normalizeConfig", {
      enumerable: true,
      get: function() {
        return f;
      }
    });
    const a = it(), h = /* @__PURE__ */ l(tt());
    function p(s) {
      if (typeof WeakMap != "function")
        return null;
      var c = /* @__PURE__ */ new WeakMap, t = /* @__PURE__ */ new WeakMap;
      return (p = function(e) {
        return e ? t : c;
      })(s);
    }
    function l(s, c) {
      if (s && s.__esModule)
        return s;
      if (s === null || typeof s != "object" && typeof s != "function")
        return {
          default: s
        };
      var t = p(c);
      if (t && t.has(s))
        return t.get(s);
      var e = {}, r = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var i in s)
        if (i !== "default" && Object.prototype.hasOwnProperty.call(s, i)) {
          var o = r ? Object.getOwnPropertyDescriptor(s, i) : null;
          o && (o.get || o.set) ? Object.defineProperty(e, i, o) : e[i] = s[i];
        }
      return e.default = s, t && t.set(s, e), e;
    }
    function f(s) {
      if ((() => {
        if (s.purge || !s.content || !Array.isArray(s.content) && !(typeof s.content == "object" && s.content !== null))
          return false;
        if (Array.isArray(s.content))
          return s.content.every((e) => typeof e == "string" ? true : !(typeof (e == null ? undefined : e.raw) != "string" || e != null && e.extension && typeof (e == null ? undefined : e.extension) != "string"));
        if (typeof s.content == "object" && s.content !== null) {
          if (Object.keys(s.content).some((e) => ![
            "files",
            "relative",
            "extract",
            "transform"
          ].includes(e)))
            return false;
          if (Array.isArray(s.content.files)) {
            if (!s.content.files.every((e) => typeof e == "string" ? true : !(typeof (e == null ? undefined : e.raw) != "string" || e != null && e.extension && typeof (e == null ? undefined : e.extension) != "string")))
              return false;
            if (typeof s.content.extract == "object") {
              for (let e of Object.values(s.content.extract))
                if (typeof e != "function")
                  return false;
            } else if (!(s.content.extract === undefined || typeof s.content.extract == "function"))
              return false;
            if (typeof s.content.transform == "object") {
              for (let e of Object.values(s.content.transform))
                if (typeof e != "function")
                  return false;
            } else if (!(s.content.transform === undefined || typeof s.content.transform == "function"))
              return false;
            if (typeof s.content.relative != "boolean" && typeof s.content.relative < "u")
              return false;
          }
          return true;
        }
        return false;
      })() || h.default.warn("purge-deprecation", [
        "The `purge`/`content` options have changed in Tailwind CSS v3.0.",
        "Update your configuration file to eliminate this warning.",
        "https://tailwindcss.com/docs/upgrade-guide#configure-content-sources"
      ]), s.safelist = (() => {
        var e;
        let { content: r, purge: i, safelist: o } = s;
        return Array.isArray(o) ? o : Array.isArray(r == null ? undefined : r.safelist) ? r.safelist : Array.isArray(i == null ? undefined : i.safelist) ? i.safelist : Array.isArray(i == null || (e = i.options) === null || e === undefined ? undefined : e.safelist) ? i.options.safelist : [];
      })(), s.blocklist = (() => {
        let { blocklist: e } = s;
        if (Array.isArray(e)) {
          if (e.every((r) => typeof r == "string"))
            return e;
          h.default.warn("blocklist-invalid", [
            "The `blocklist` option must be an array of strings.",
            "https://tailwindcss.com/docs/content-configuration#discarding-classes"
          ]);
        }
        return [];
      })(), typeof s.prefix == "function")
        h.default.warn("prefix-function", [
          "As of Tailwind CSS v3.0, `prefix` cannot be a function.",
          "Update `prefix` in your configuration to be a string to eliminate this warning.",
          "https://tailwindcss.com/docs/upgrade-guide#prefix-cannot-be-a-function"
        ]), s.prefix = "";
      else {
        var t;
        s.prefix = (t = s.prefix) !== null && t !== undefined ? t : "";
      }
      s.content = {
        relative: (() => {
          let { content: e } = s;
          return e != null && e.relative ? e.relative : (0, a.flagEnabled)(s, "relativeContentPathsByDefault");
        })(),
        files: (() => {
          let { content: e, purge: r } = s;
          return Array.isArray(r) ? r : Array.isArray(r == null ? undefined : r.content) ? r.content : Array.isArray(e) ? e : Array.isArray(e == null ? undefined : e.content) ? e.content : Array.isArray(e == null ? undefined : e.files) ? e.files : [];
        })(),
        extract: (() => {
          let e = (() => {
            var o, v2, m, n, d, _, w, y, x, g;
            return !((o = s.purge) === null || o === undefined) && o.extract ? s.purge.extract : !((v2 = s.content) === null || v2 === undefined) && v2.extract ? s.content.extract : !((m = s.purge) === null || m === undefined || (n = m.extract) === null || n === undefined) && n.DEFAULT ? s.purge.extract.DEFAULT : !((d = s.content) === null || d === undefined || (_ = d.extract) === null || _ === undefined) && _.DEFAULT ? s.content.extract.DEFAULT : !((w = s.purge) === null || w === undefined || (y = w.options) === null || y === undefined) && y.extractors ? s.purge.options.extractors : !((x = s.content) === null || x === undefined || (g = x.options) === null || g === undefined) && g.extractors ? s.content.options.extractors : {};
          })(), r = {}, i = (() => {
            var o, v2, m, n;
            if (!((o = s.purge) === null || o === undefined || (v2 = o.options) === null || v2 === undefined) && v2.defaultExtractor)
              return s.purge.options.defaultExtractor;
            if (!((m = s.content) === null || m === undefined || (n = m.options) === null || n === undefined) && n.defaultExtractor)
              return s.content.options.defaultExtractor;
          })();
          if (i !== undefined && (r.DEFAULT = i), typeof e == "function")
            r.DEFAULT = e;
          else if (Array.isArray(e))
            for (let { extensions: o, extractor: v2 } of e ?? [])
              for (let m of o)
                r[m] = v2;
          else
            typeof e == "object" && e !== null && Object.assign(r, e);
          return r;
        })(),
        transform: (() => {
          let e = (() => {
            var i, o, v2, m, n, d;
            return !((i = s.purge) === null || i === undefined) && i.transform ? s.purge.transform : !((o = s.content) === null || o === undefined) && o.transform ? s.content.transform : !((v2 = s.purge) === null || v2 === undefined || (m = v2.transform) === null || m === undefined) && m.DEFAULT ? s.purge.transform.DEFAULT : !((n = s.content) === null || n === undefined || (d = n.transform) === null || d === undefined) && d.DEFAULT ? s.content.transform.DEFAULT : {};
          })(), r = {};
          return typeof e == "function" ? r.DEFAULT = e : typeof e == "object" && e !== null && Object.assign(r, e), r;
        })()
      };
      for (let e of s.content.files)
        if (typeof e == "string" && /{([^,]*?)}/g.test(e)) {
          h.default.warn("invalid-glob-braces", [
            `The glob pattern ${(0, h.dim)(e)} in your Tailwind CSS configuration is invalid.`,
            `Update it to ${(0, h.dim)(e.replace(/{([^,]*?)}/g, "$1"))} to silence this warning.`
          ]);
          break;
        }
      return s;
    }
  }(xi)), xi;
}
var Oi = {};
var sl;
function fc() {
  return sl || (sl = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "cloneDeep", {
      enumerable: true,
      get: function() {
        return a;
      }
    });
    function a(h) {
      return Array.isArray(h) ? h.map((p) => a(p)) : typeof h == "object" && h !== null ? Object.fromEntries(Object.entries(h).map(([p, l]) => [
        p,
        a(l)
      ])) : h;
    }
  }(Oi)), Oi;
}
var ol;
function cc() {
  return ol || (ol = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return q;
      }
    });
    const a = /* @__PURE__ */ v2(ji()), h = /* @__PURE__ */ v2(ac()), p = /* @__PURE__ */ v2(sc()), l = /* @__PURE__ */ v2(oc()), f = lc(), s = Wi(), c = uc(), t = /* @__PURE__ */ v2(ut()), e = fc(), r = gr(), i = hr(), o = /* @__PURE__ */ v2(iu());
    function v2(M) {
      return M && M.__esModule ? M : {
        default: M
      };
    }
    function m(M) {
      return typeof M == "function";
    }
    function n(M, ...W) {
      let S = W.pop();
      for (let P of W)
        for (let C in P) {
          let R = S(M[C], P[C]);
          R === undefined ? (0, t.default)(M[C]) && (0, t.default)(P[C]) ? M[C] = n({}, M[C], P[C], S) : M[C] = P[C] : M[C] = R;
        }
      return M;
    }
    const d = {
      colors: l.default,
      negative(M) {
        return Object.keys(M).filter((W) => M[W] !== "0").reduce((W, S) => {
          let P = (0, a.default)(M[S]);
          return P !== undefined && (W[`-${S}`] = P), W;
        }, {});
      },
      breakpoints(M) {
        return Object.keys(M).filter((W) => typeof M[W] == "string").reduce((W, S) => ({
          ...W,
          [`screen-${S}`]: M[S]
        }), {});
      }
    };
    function _(M, ...W) {
      return m(M) ? M(...W) : M;
    }
    function w(M) {
      return M.reduce((W, { extend: S }) => n(W, S, (P, C) => P === undefined ? [
        C
      ] : Array.isArray(P) ? [
        C,
        ...P
      ] : [
        C,
        P
      ]), {});
    }
    function y(M) {
      return {
        ...M.reduce((W, S) => (0, f.defaults)(W, S), {}),
        extend: w(M)
      };
    }
    function x(M, W) {
      if (Array.isArray(M) && (0, t.default)(M[0]))
        return M.concat(W);
      if (Array.isArray(W) && (0, t.default)(W[0]) && (0, t.default)(M))
        return [
          M,
          ...W
        ];
      if (Array.isArray(W))
        return W;
    }
    function g({ extend: M, ...W }) {
      return n(W, M, (S, P) => !m(S) && !P.some(m) ? n({}, S, ...P, x) : (C, R) => n({}, ...[
        S,
        ...P
      ].map(($) => _($, C, R)), x));
    }
    function* O(M) {
      let W = (0, s.toPath)(M);
      if (W.length === 0 || (yield W, Array.isArray(M)))
        return;
      let S = /^(.*?)\s*\/\s*([^/]+)$/, P = M.match(S);
      if (P !== null) {
        let [, C, R] = P, $ = (0, s.toPath)(C);
        $.alpha = R, yield $;
      }
    }
    function A(M) {
      const W = (S, P) => {
        for (const C of O(S)) {
          let R = 0, $ = M;
          for (;$ != null && R < C.length; )
            $ = $[C[R++]], $ = m($) && (C.alpha === undefined || R <= C.length - 1) ? $(W, d) : $;
          if ($ !== undefined) {
            if (C.alpha !== undefined) {
              let B = (0, r.parseColorFormat)($);
              return (0, i.withAlphaValue)(B, C.alpha, (0, o.default)(B));
            }
            return (0, t.default)($) ? (0, e.cloneDeep)($) : $;
          }
        }
        return P;
      };
      return Object.assign(W, {
        theme: W,
        ...d
      }), Object.keys(M).reduce((S, P) => (S[P] = m(M[P]) ? M[P](W, d) : M[P], S), {});
    }
    function E(M) {
      let W = [];
      return M.forEach((S) => {
        W = [
          ...W,
          S
        ];
        var P;
        const C = (P = S == null ? undefined : S.plugins) !== null && P !== undefined ? P : [];
        C.length !== 0 && C.forEach((R) => {
          R.__isOptionsFunction && (R = R());
          var $;
          W = [
            ...W,
            ...E([
              ($ = R == null ? undefined : R.config) !== null && $ !== undefined ? $ : {}
            ])
          ];
        });
      }), W;
    }
    function b(M) {
      return [
        ...M
      ].reduceRight((S, P) => m(P) ? P({
        corePlugins: S
      }) : (0, p.default)(P, S), h.default);
    }
    function k(M) {
      return [
        ...M
      ].reduceRight((S, P) => [
        ...S,
        ...P
      ], []);
    }
    function q(M) {
      let W = [
        ...E(M),
        {
          prefix: "",
          important: false,
          separator: ":"
        }
      ];
      var S, P;
      return (0, c.normalizeConfig)((0, f.defaults)({
        theme: A(g(y(W.map((C) => (S = C == null ? undefined : C.theme) !== null && S !== undefined ? S : {})))),
        corePlugins: b(W.map((C) => C.corePlugins)),
        plugins: k(M.map((C) => (P = C == null ? undefined : C.plugins) !== null && P !== undefined ? P : []))
      }, ...W));
    }
  }(yi)), yi;
}
var ki = {};
var Pi;
var ll;
function dc() {
  return ll || (ll = 1, Pi = {
    content: [],
    presets: [],
    darkMode: "media",
    theme: {
      accentColor: ({ theme: u }) => ({
        ...u("colors"),
        auto: "auto"
      }),
      animation: {
        none: "none",
        spin: "spin 1s linear infinite",
        ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite"
      },
      aria: {
        busy: 'busy="true"',
        checked: 'checked="true"',
        disabled: 'disabled="true"',
        expanded: 'expanded="true"',
        hidden: 'hidden="true"',
        pressed: 'pressed="true"',
        readonly: 'readonly="true"',
        required: 'required="true"',
        selected: 'selected="true"'
      },
      aspectRatio: {
        auto: "auto",
        square: "1 / 1",
        video: "16 / 9"
      },
      backdropBlur: ({ theme: u }) => u("blur"),
      backdropBrightness: ({ theme: u }) => u("brightness"),
      backdropContrast: ({ theme: u }) => u("contrast"),
      backdropGrayscale: ({ theme: u }) => u("grayscale"),
      backdropHueRotate: ({ theme: u }) => u("hueRotate"),
      backdropInvert: ({ theme: u }) => u("invert"),
      backdropOpacity: ({ theme: u }) => u("opacity"),
      backdropSaturate: ({ theme: u }) => u("saturate"),
      backdropSepia: ({ theme: u }) => u("sepia"),
      backgroundColor: ({ theme: u }) => u("colors"),
      backgroundImage: {
        none: "none",
        "gradient-to-t": "linear-gradient(to top, var(--tw-gradient-stops))",
        "gradient-to-tr": "linear-gradient(to top right, var(--tw-gradient-stops))",
        "gradient-to-r": "linear-gradient(to right, var(--tw-gradient-stops))",
        "gradient-to-br": "linear-gradient(to bottom right, var(--tw-gradient-stops))",
        "gradient-to-b": "linear-gradient(to bottom, var(--tw-gradient-stops))",
        "gradient-to-bl": "linear-gradient(to bottom left, var(--tw-gradient-stops))",
        "gradient-to-l": "linear-gradient(to left, var(--tw-gradient-stops))",
        "gradient-to-tl": "linear-gradient(to top left, var(--tw-gradient-stops))"
      },
      backgroundOpacity: ({ theme: u }) => u("opacity"),
      backgroundPosition: {
        bottom: "bottom",
        center: "center",
        left: "left",
        "left-bottom": "left bottom",
        "left-top": "left top",
        right: "right",
        "right-bottom": "right bottom",
        "right-top": "right top",
        top: "top"
      },
      backgroundSize: {
        auto: "auto",
        cover: "cover",
        contain: "contain"
      },
      blur: {
        0: "0",
        none: "",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
        "3xl": "64px"
      },
      borderColor: ({ theme: u }) => ({
        ...u("colors"),
        DEFAULT: u("colors.gray.200", "currentColor")
      }),
      borderOpacity: ({ theme: u }) => u("opacity"),
      borderRadius: {
        none: "0px",
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px"
      },
      borderSpacing: ({ theme: u }) => ({
        ...u("spacing")
      }),
      borderWidth: {
        DEFAULT: "1px",
        0: "0px",
        2: "2px",
        4: "4px",
        8: "8px"
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none: "none"
      },
      boxShadowColor: ({ theme: u }) => u("colors"),
      brightness: {
        0: "0",
        50: ".5",
        75: ".75",
        90: ".9",
        95: ".95",
        100: "1",
        105: "1.05",
        110: "1.1",
        125: "1.25",
        150: "1.5",
        200: "2"
      },
      caretColor: ({ theme: u }) => u("colors"),
      colors: ({ colors: u }) => ({
        inherit: u.inherit,
        current: u.current,
        transparent: u.transparent,
        black: u.black,
        white: u.white,
        slate: u.slate,
        gray: u.gray,
        zinc: u.zinc,
        neutral: u.neutral,
        stone: u.stone,
        red: u.red,
        orange: u.orange,
        amber: u.amber,
        yellow: u.yellow,
        lime: u.lime,
        green: u.green,
        emerald: u.emerald,
        teal: u.teal,
        cyan: u.cyan,
        sky: u.sky,
        blue: u.blue,
        indigo: u.indigo,
        violet: u.violet,
        purple: u.purple,
        fuchsia: u.fuchsia,
        pink: u.pink,
        rose: u.rose
      }),
      columns: {
        auto: "auto",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        8: "8",
        9: "9",
        10: "10",
        11: "11",
        12: "12",
        "3xs": "16rem",
        "2xs": "18rem",
        xs: "20rem",
        sm: "24rem",
        md: "28rem",
        lg: "32rem",
        xl: "36rem",
        "2xl": "42rem",
        "3xl": "48rem",
        "4xl": "56rem",
        "5xl": "64rem",
        "6xl": "72rem",
        "7xl": "80rem"
      },
      container: {},
      content: {
        none: "none"
      },
      contrast: {
        0: "0",
        50: ".5",
        75: ".75",
        100: "1",
        125: "1.25",
        150: "1.5",
        200: "2"
      },
      cursor: {
        auto: "auto",
        default: "default",
        pointer: "pointer",
        wait: "wait",
        text: "text",
        move: "move",
        help: "help",
        "not-allowed": "not-allowed",
        none: "none",
        "context-menu": "context-menu",
        progress: "progress",
        cell: "cell",
        crosshair: "crosshair",
        "vertical-text": "vertical-text",
        alias: "alias",
        copy: "copy",
        "no-drop": "no-drop",
        grab: "grab",
        grabbing: "grabbing",
        "all-scroll": "all-scroll",
        "col-resize": "col-resize",
        "row-resize": "row-resize",
        "n-resize": "n-resize",
        "e-resize": "e-resize",
        "s-resize": "s-resize",
        "w-resize": "w-resize",
        "ne-resize": "ne-resize",
        "nw-resize": "nw-resize",
        "se-resize": "se-resize",
        "sw-resize": "sw-resize",
        "ew-resize": "ew-resize",
        "ns-resize": "ns-resize",
        "nesw-resize": "nesw-resize",
        "nwse-resize": "nwse-resize",
        "zoom-in": "zoom-in",
        "zoom-out": "zoom-out"
      },
      divideColor: ({ theme: u }) => u("borderColor"),
      divideOpacity: ({ theme: u }) => u("borderOpacity"),
      divideWidth: ({ theme: u }) => u("borderWidth"),
      dropShadow: {
        sm: "0 1px 1px rgb(0 0 0 / 0.05)",
        DEFAULT: ["0 1px 2px rgb(0 0 0 / 0.1)", "0 1px 1px rgb(0 0 0 / 0.06)"],
        md: ["0 4px 3px rgb(0 0 0 / 0.07)", "0 2px 2px rgb(0 0 0 / 0.06)"],
        lg: ["0 10px 8px rgb(0 0 0 / 0.04)", "0 4px 3px rgb(0 0 0 / 0.1)"],
        xl: ["0 20px 13px rgb(0 0 0 / 0.03)", "0 8px 5px rgb(0 0 0 / 0.08)"],
        "2xl": "0 25px 25px rgb(0 0 0 / 0.15)",
        none: "0 0 #0000"
      },
      fill: ({ theme: u }) => ({
        none: "none",
        ...u("colors")
      }),
      flex: {
        1: "1 1 0%",
        auto: "1 1 auto",
        initial: "0 1 auto",
        none: "none"
      },
      flexBasis: ({ theme: u }) => ({
        auto: "auto",
        ...u("spacing"),
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "2/4": "50%",
        "3/4": "75%",
        "1/5": "20%",
        "2/5": "40%",
        "3/5": "60%",
        "4/5": "80%",
        "1/6": "16.666667%",
        "2/6": "33.333333%",
        "3/6": "50%",
        "4/6": "66.666667%",
        "5/6": "83.333333%",
        "1/12": "8.333333%",
        "2/12": "16.666667%",
        "3/12": "25%",
        "4/12": "33.333333%",
        "5/12": "41.666667%",
        "6/12": "50%",
        "7/12": "58.333333%",
        "8/12": "66.666667%",
        "9/12": "75%",
        "10/12": "83.333333%",
        "11/12": "91.666667%",
        full: "100%"
      }),
      flexGrow: {
        0: "0",
        DEFAULT: "1"
      },
      flexShrink: {
        0: "0",
        DEFAULT: "1"
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ],
        serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace"
        ]
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }]
      },
      fontWeight: {
        thin: "100",
        extralight: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900"
      },
      gap: ({ theme: u }) => u("spacing"),
      gradientColorStops: ({ theme: u }) => u("colors"),
      gradientColorStopPositions: {
        "0%": "0%",
        "5%": "5%",
        "10%": "10%",
        "15%": "15%",
        "20%": "20%",
        "25%": "25%",
        "30%": "30%",
        "35%": "35%",
        "40%": "40%",
        "45%": "45%",
        "50%": "50%",
        "55%": "55%",
        "60%": "60%",
        "65%": "65%",
        "70%": "70%",
        "75%": "75%",
        "80%": "80%",
        "85%": "85%",
        "90%": "90%",
        "95%": "95%",
        "100%": "100%"
      },
      grayscale: {
        0: "0",
        DEFAULT: "100%"
      },
      gridAutoColumns: {
        auto: "auto",
        min: "min-content",
        max: "max-content",
        fr: "minmax(0, 1fr)"
      },
      gridAutoRows: {
        auto: "auto",
        min: "min-content",
        max: "max-content",
        fr: "minmax(0, 1fr)"
      },
      gridColumn: {
        auto: "auto",
        "span-1": "span 1 / span 1",
        "span-2": "span 2 / span 2",
        "span-3": "span 3 / span 3",
        "span-4": "span 4 / span 4",
        "span-5": "span 5 / span 5",
        "span-6": "span 6 / span 6",
        "span-7": "span 7 / span 7",
        "span-8": "span 8 / span 8",
        "span-9": "span 9 / span 9",
        "span-10": "span 10 / span 10",
        "span-11": "span 11 / span 11",
        "span-12": "span 12 / span 12",
        "span-full": "1 / -1"
      },
      gridColumnEnd: {
        auto: "auto",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        8: "8",
        9: "9",
        10: "10",
        11: "11",
        12: "12",
        13: "13"
      },
      gridColumnStart: {
        auto: "auto",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        8: "8",
        9: "9",
        10: "10",
        11: "11",
        12: "12",
        13: "13"
      },
      gridRow: {
        auto: "auto",
        "span-1": "span 1 / span 1",
        "span-2": "span 2 / span 2",
        "span-3": "span 3 / span 3",
        "span-4": "span 4 / span 4",
        "span-5": "span 5 / span 5",
        "span-6": "span 6 / span 6",
        "span-7": "span 7 / span 7",
        "span-8": "span 8 / span 8",
        "span-9": "span 9 / span 9",
        "span-10": "span 10 / span 10",
        "span-11": "span 11 / span 11",
        "span-12": "span 12 / span 12",
        "span-full": "1 / -1"
      },
      gridRowEnd: {
        auto: "auto",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        8: "8",
        9: "9",
        10: "10",
        11: "11",
        12: "12",
        13: "13"
      },
      gridRowStart: {
        auto: "auto",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        8: "8",
        9: "9",
        10: "10",
        11: "11",
        12: "12",
        13: "13"
      },
      gridTemplateColumns: {
        none: "none",
        subgrid: "subgrid",
        1: "repeat(1, minmax(0, 1fr))",
        2: "repeat(2, minmax(0, 1fr))",
        3: "repeat(3, minmax(0, 1fr))",
        4: "repeat(4, minmax(0, 1fr))",
        5: "repeat(5, minmax(0, 1fr))",
        6: "repeat(6, minmax(0, 1fr))",
        7: "repeat(7, minmax(0, 1fr))",
        8: "repeat(8, minmax(0, 1fr))",
        9: "repeat(9, minmax(0, 1fr))",
        10: "repeat(10, minmax(0, 1fr))",
        11: "repeat(11, minmax(0, 1fr))",
        12: "repeat(12, minmax(0, 1fr))"
      },
      gridTemplateRows: {
        none: "none",
        subgrid: "subgrid",
        1: "repeat(1, minmax(0, 1fr))",
        2: "repeat(2, minmax(0, 1fr))",
        3: "repeat(3, minmax(0, 1fr))",
        4: "repeat(4, minmax(0, 1fr))",
        5: "repeat(5, minmax(0, 1fr))",
        6: "repeat(6, minmax(0, 1fr))",
        7: "repeat(7, minmax(0, 1fr))",
        8: "repeat(8, minmax(0, 1fr))",
        9: "repeat(9, minmax(0, 1fr))",
        10: "repeat(10, minmax(0, 1fr))",
        11: "repeat(11, minmax(0, 1fr))",
        12: "repeat(12, minmax(0, 1fr))"
      },
      height: ({ theme: u }) => ({
        auto: "auto",
        ...u("spacing"),
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "2/4": "50%",
        "3/4": "75%",
        "1/5": "20%",
        "2/5": "40%",
        "3/5": "60%",
        "4/5": "80%",
        "1/6": "16.666667%",
        "2/6": "33.333333%",
        "3/6": "50%",
        "4/6": "66.666667%",
        "5/6": "83.333333%",
        full: "100%",
        screen: "100vh",
        svh: "100svh",
        lvh: "100lvh",
        dvh: "100dvh",
        min: "min-content",
        max: "max-content",
        fit: "fit-content"
      }),
      hueRotate: {
        0: "0deg",
        15: "15deg",
        30: "30deg",
        60: "60deg",
        90: "90deg",
        180: "180deg"
      },
      inset: ({ theme: u }) => ({
        auto: "auto",
        ...u("spacing"),
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "2/4": "50%",
        "3/4": "75%",
        full: "100%"
      }),
      invert: {
        0: "0",
        DEFAULT: "100%"
      },
      keyframes: {
        spin: {
          to: {
            transform: "rotate(360deg)"
          }
        },
        ping: {
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0"
          }
        },
        pulse: {
          "50%": {
            opacity: ".5"
          }
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8,0,1,1)"
          },
          "50%": {
            transform: "none",
            animationTimingFunction: "cubic-bezier(0,0,0.2,1)"
          }
        }
      },
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0em",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em"
      },
      lineHeight: {
        none: "1",
        tight: "1.25",
        snug: "1.375",
        normal: "1.5",
        relaxed: "1.625",
        loose: "2",
        3: ".75rem",
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
        7: "1.75rem",
        8: "2rem",
        9: "2.25rem",
        10: "2.5rem"
      },
      listStyleType: {
        none: "none",
        disc: "disc",
        decimal: "decimal"
      },
      listStyleImage: {
        none: "none"
      },
      margin: ({ theme: u }) => ({
        auto: "auto",
        ...u("spacing")
      }),
      lineClamp: {
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6"
      },
      maxHeight: ({ theme: u }) => ({
        ...u("spacing"),
        none: "none",
        full: "100%",
        screen: "100vh",
        svh: "100svh",
        lvh: "100lvh",
        dvh: "100dvh",
        min: "min-content",
        max: "max-content",
        fit: "fit-content"
      }),
      maxWidth: ({ theme: u, breakpoints: a }) => ({
        ...u("spacing"),
        none: "none",
        xs: "20rem",
        sm: "24rem",
        md: "28rem",
        lg: "32rem",
        xl: "36rem",
        "2xl": "42rem",
        "3xl": "48rem",
        "4xl": "56rem",
        "5xl": "64rem",
        "6xl": "72rem",
        "7xl": "80rem",
        full: "100%",
        min: "min-content",
        max: "max-content",
        fit: "fit-content",
        prose: "65ch",
        ...a(u("screens"))
      }),
      minHeight: ({ theme: u }) => ({
        ...u("spacing"),
        full: "100%",
        screen: "100vh",
        svh: "100svh",
        lvh: "100lvh",
        dvh: "100dvh",
        min: "min-content",
        max: "max-content",
        fit: "fit-content"
      }),
      minWidth: ({ theme: u }) => ({
        ...u("spacing"),
        full: "100%",
        min: "min-content",
        max: "max-content",
        fit: "fit-content"
      }),
      objectPosition: {
        bottom: "bottom",
        center: "center",
        left: "left",
        "left-bottom": "left bottom",
        "left-top": "left top",
        right: "right",
        "right-bottom": "right bottom",
        "right-top": "right top",
        top: "top"
      },
      opacity: {
        0: "0",
        5: "0.05",
        10: "0.1",
        15: "0.15",
        20: "0.2",
        25: "0.25",
        30: "0.3",
        35: "0.35",
        40: "0.4",
        45: "0.45",
        50: "0.5",
        55: "0.55",
        60: "0.6",
        65: "0.65",
        70: "0.7",
        75: "0.75",
        80: "0.8",
        85: "0.85",
        90: "0.9",
        95: "0.95",
        100: "1"
      },
      order: {
        first: "-9999",
        last: "9999",
        none: "0",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        8: "8",
        9: "9",
        10: "10",
        11: "11",
        12: "12"
      },
      outlineColor: ({ theme: u }) => u("colors"),
      outlineOffset: {
        0: "0px",
        1: "1px",
        2: "2px",
        4: "4px",
        8: "8px"
      },
      outlineWidth: {
        0: "0px",
        1: "1px",
        2: "2px",
        4: "4px",
        8: "8px"
      },
      padding: ({ theme: u }) => u("spacing"),
      placeholderColor: ({ theme: u }) => u("colors"),
      placeholderOpacity: ({ theme: u }) => u("opacity"),
      ringColor: ({ theme: u }) => ({
        DEFAULT: u("colors.blue.500", "#3b82f6"),
        ...u("colors")
      }),
      ringOffsetColor: ({ theme: u }) => u("colors"),
      ringOffsetWidth: {
        0: "0px",
        1: "1px",
        2: "2px",
        4: "4px",
        8: "8px"
      },
      ringOpacity: ({ theme: u }) => ({
        DEFAULT: "0.5",
        ...u("opacity")
      }),
      ringWidth: {
        DEFAULT: "3px",
        0: "0px",
        1: "1px",
        2: "2px",
        4: "4px",
        8: "8px"
      },
      rotate: {
        0: "0deg",
        1: "1deg",
        2: "2deg",
        3: "3deg",
        6: "6deg",
        12: "12deg",
        45: "45deg",
        90: "90deg",
        180: "180deg"
      },
      saturate: {
        0: "0",
        50: ".5",
        100: "1",
        150: "1.5",
        200: "2"
      },
      scale: {
        0: "0",
        50: ".5",
        75: ".75",
        90: ".9",
        95: ".95",
        100: "1",
        105: "1.05",
        110: "1.1",
        125: "1.25",
        150: "1.5"
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px"
      },
      scrollMargin: ({ theme: u }) => ({
        ...u("spacing")
      }),
      scrollPadding: ({ theme: u }) => u("spacing"),
      sepia: {
        0: "0",
        DEFAULT: "100%"
      },
      skew: {
        0: "0deg",
        1: "1deg",
        2: "2deg",
        3: "3deg",
        6: "6deg",
        12: "12deg"
      },
      space: ({ theme: u }) => ({
        ...u("spacing")
      }),
      spacing: {
        px: "1px",
        0: "0px",
        0.5: "0.125rem",
        1: "0.25rem",
        1.5: "0.375rem",
        2: "0.5rem",
        2.5: "0.625rem",
        3: "0.75rem",
        3.5: "0.875rem",
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
        7: "1.75rem",
        8: "2rem",
        9: "2.25rem",
        10: "2.5rem",
        11: "2.75rem",
        12: "3rem",
        14: "3.5rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
        28: "7rem",
        32: "8rem",
        36: "9rem",
        40: "10rem",
        44: "11rem",
        48: "12rem",
        52: "13rem",
        56: "14rem",
        60: "15rem",
        64: "16rem",
        72: "18rem",
        80: "20rem",
        96: "24rem"
      },
      stroke: ({ theme: u }) => ({
        none: "none",
        ...u("colors")
      }),
      strokeWidth: {
        0: "0",
        1: "1",
        2: "2"
      },
      supports: {},
      data: {},
      textColor: ({ theme: u }) => u("colors"),
      textDecorationColor: ({ theme: u }) => u("colors"),
      textDecorationThickness: {
        auto: "auto",
        "from-font": "from-font",
        0: "0px",
        1: "1px",
        2: "2px",
        4: "4px",
        8: "8px"
      },
      textIndent: ({ theme: u }) => ({
        ...u("spacing")
      }),
      textOpacity: ({ theme: u }) => u("opacity"),
      textUnderlineOffset: {
        auto: "auto",
        0: "0px",
        1: "1px",
        2: "2px",
        4: "4px",
        8: "8px"
      },
      transformOrigin: {
        center: "center",
        top: "top",
        "top-right": "top right",
        right: "right",
        "bottom-right": "bottom right",
        bottom: "bottom",
        "bottom-left": "bottom left",
        left: "left",
        "top-left": "top left"
      },
      transitionDelay: {
        0: "0s",
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
        1000: "1000ms"
      },
      transitionDuration: {
        DEFAULT: "150ms",
        0: "0s",
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
        1000: "1000ms"
      },
      transitionProperty: {
        none: "none",
        all: "all",
        DEFAULT: "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter",
        colors: "color, background-color, border-color, text-decoration-color, fill, stroke",
        opacity: "opacity",
        shadow: "box-shadow",
        transform: "transform"
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        linear: "linear",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)"
      },
      translate: ({ theme: u }) => ({
        ...u("spacing"),
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "2/4": "50%",
        "3/4": "75%",
        full: "100%"
      }),
      size: ({ theme: u }) => ({
        auto: "auto",
        ...u("spacing"),
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "2/4": "50%",
        "3/4": "75%",
        "1/5": "20%",
        "2/5": "40%",
        "3/5": "60%",
        "4/5": "80%",
        "1/6": "16.666667%",
        "2/6": "33.333333%",
        "3/6": "50%",
        "4/6": "66.666667%",
        "5/6": "83.333333%",
        "1/12": "8.333333%",
        "2/12": "16.666667%",
        "3/12": "25%",
        "4/12": "33.333333%",
        "5/12": "41.666667%",
        "6/12": "50%",
        "7/12": "58.333333%",
        "8/12": "66.666667%",
        "9/12": "75%",
        "10/12": "83.333333%",
        "11/12": "91.666667%",
        full: "100%",
        min: "min-content",
        max: "max-content",
        fit: "fit-content"
      }),
      width: ({ theme: u }) => ({
        auto: "auto",
        ...u("spacing"),
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "2/4": "50%",
        "3/4": "75%",
        "1/5": "20%",
        "2/5": "40%",
        "3/5": "60%",
        "4/5": "80%",
        "1/6": "16.666667%",
        "2/6": "33.333333%",
        "3/6": "50%",
        "4/6": "66.666667%",
        "5/6": "83.333333%",
        "1/12": "8.333333%",
        "2/12": "16.666667%",
        "3/12": "25%",
        "4/12": "33.333333%",
        "5/12": "41.666667%",
        "6/12": "50%",
        "7/12": "58.333333%",
        "8/12": "66.666667%",
        "9/12": "75%",
        "10/12": "83.333333%",
        "11/12": "91.666667%",
        full: "100%",
        screen: "100vw",
        svw: "100svw",
        lvw: "100lvw",
        dvw: "100dvw",
        min: "min-content",
        max: "max-content",
        fit: "fit-content"
      }),
      willChange: {
        auto: "auto",
        scroll: "scroll-position",
        contents: "contents",
        transform: "transform"
      },
      zIndex: {
        auto: "auto",
        0: "0",
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50"
      }
    },
    plugins: []
  }), Pi;
}
var ul;
function pc() {
  return ul || (ul = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = /* @__PURE__ */ p(dc()), h = it();
    function p(f) {
      return f && f.__esModule ? f : {
        default: f
      };
    }
    function l(f) {
      var s;
      const c = ((s = f == null ? undefined : f.presets) !== null && s !== undefined ? s : [
        a.default
      ]).slice().reverse().flatMap((r) => l(r instanceof Function ? r() : r)), t = {
        respectDefaultRingColorOpacity: {
          theme: {
            ringColor: ({ theme: r }) => ({
              DEFAULT: "#3b82f67f",
              ...r("colors")
            })
          }
        },
        disableColorOpacityUtilitiesByDefault: {
          corePlugins: {
            backgroundOpacity: false,
            borderOpacity: false,
            divideOpacity: false,
            placeholderOpacity: false,
            ringOpacity: false,
            textOpacity: false
          }
        }
      }, e = Object.keys(t).filter((r) => (0, h.flagEnabled)(f, r)).map((r) => t[r]);
      return [
        f,
        ...e,
        ...c
      ];
    }
  }(ki)), ki;
}
var fl;
function hc() {
  return fl || (fl = 1, function(u) {
    Object.defineProperty(u, "__esModule", {
      value: true
    }), Object.defineProperty(u, "default", {
      enumerable: true,
      get: function() {
        return l;
      }
    });
    const a = /* @__PURE__ */ p(cc()), h = /* @__PURE__ */ p(pc());
    function p(f) {
      return f && f.__esModule ? f : {
        default: f
      };
    }
    function l(...f) {
      let [, ...s] = (0, h.default)(f[0]);
      return (0, a.default)([
        ...f,
        ...s
      ]);
    }
  }(mi)), mi;
}
var Ei;
var cl;
function vc() {
  if (cl)
    return Ei;
  cl = 1;
  let u = hc();
  return Ei = (u.__esModule ? u : { default: u }).default, Ei;
}
var gc = vc();
var mc = /* @__PURE__ */ He(gc);
var yc = (u) => ic.createContext(mc({
  ...u,
  content: [],
  corePlugins: {
    preflight: false
  }
}));
var wc = _u(`
  @tailwind base;
  @tailwind components;
`).root();
function bc(u) {
  "safelist" in u && (console.warn("The `safelist` option is not supported in the `Tailwind` component, it will not change any behavior."), delete u.safelist);
  const a = yc(u);
  return {
    generateRootForClasses: (h) => {
      a.candidateRuleCache = /* @__PURE__ */ new Map;
      const p = Yf.generateRules(new Set(h), a), l = wc.clone().append(...p.map(([, f]) => f));
      return Xo()(l), Gf(a)(l), Xo()(l), $f(a)(l), ff(a)(l), tc(a)(l), Xf(a)(l), Hu()(l), Xu()(l), nc(l), l;
    }
  };
}
var Oc = ({ children: u, config: a }) => {
  const h = bc(a ?? {}), p = new Ou;
  let l = [], f = false, s = sr(u, (c) => {
    if (Or.isValidElement(c)) {
      const {
        elementWithInlinedStyles: t,
        nonInlinableClasses: e,
        nonInlineStyleNodes: r
      } = Gu(c, h);
      return l = l.concat(e), p.append(r), e.length > 0 && !f && (f = true), t;
    }
    return c;
  });
  if (Pu(p), f) {
    let c = false;
    if (s = sr(s, (t) => {
      if (c)
        return t;
      if (Or.isValidElement(t) && t.type === "head") {
        c = true;
        const e = /* @__PURE__ */ fu("style", { children: ku(p.toString().trim()) });
        return Or.cloneElement(t, t.props, t.props.children, e);
      }
      return t;
    }), !c)
      throw new Error(`You are trying to use the following Tailwind classes that cannot be inlined: ${l.join(" ")}.
For the media queries to work properly on rendering, they need to be added into a <style> tag inside of a <head> tag,
the Tailwind component tried finding a <head> element but just wasn't able to find it.

Make sure that you have a <head> element at some point inside of the <Tailwind> component at any depth. 
This can also be our <Head> component.

If you do already have a <head> element at some depth, 
please file a bug https://github.com/resend/react-email/issues/new?assignees=&labels=Type%3A+Bug&projects=&template=1.bug_report.yml.`);
  }
  return s;
};

// ../../node_modules/.bun/@react-email+text@0.1.5+2f44e903108183df/node_modules/@react-email/text/dist/index.mjs
import * as React9 from "react";
import { jsx as jsx9 } from "react/jsx-runtime";
var __defProp9 = Object.defineProperty;
var __defProps9 = Object.defineProperties;
var __getOwnPropDescs9 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols9 = Object.getOwnPropertySymbols;
var __hasOwnProp9 = Object.prototype.hasOwnProperty;
var __propIsEnum9 = Object.prototype.propertyIsEnumerable;
var __defNormalProp9 = (obj, key, value) => (key in obj) ? __defProp9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues9 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp9.call(b, prop))
      __defNormalProp9(a, prop, b[prop]);
  if (__getOwnPropSymbols9)
    for (var prop of __getOwnPropSymbols9(b)) {
      if (__propIsEnum9.call(b, prop))
        __defNormalProp9(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps9 = (a, b) => __defProps9(a, __getOwnPropDescs9(b));
var __objRest9 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp9.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols9)
    for (var prop of __getOwnPropSymbols9(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum9.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function parseMarginValue(value) {
  if (typeof value === "number")
    return {
      marginTop: value,
      marginBottom: value,
      marginLeft: value,
      marginRight: value
    };
  if (typeof value === "string") {
    const values = value.toString().trim().split(/\s+/);
    if (values.length === 1) {
      return {
        marginTop: values[0],
        marginBottom: values[0],
        marginLeft: values[0],
        marginRight: values[0]
      };
    }
    if (values.length === 2) {
      return {
        marginTop: values[0],
        marginRight: values[1],
        marginBottom: values[0],
        marginLeft: values[1]
      };
    }
    if (values.length === 3) {
      return {
        marginTop: values[0],
        marginRight: values[1],
        marginBottom: values[2],
        marginLeft: values[1]
      };
    }
    if (values.length === 4) {
      return {
        marginTop: values[0],
        marginRight: values[1],
        marginBottom: values[2],
        marginLeft: values[3]
      };
    }
  }
  return {
    marginTop: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
    marginRight: undefined
  };
}
function computeMargins(properties) {
  let result = {
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined
  };
  for (const [key, value] of Object.entries(properties)) {
    if (key === "margin") {
      result = parseMarginValue(value);
    } else if (key === "marginTop") {
      result.marginTop = value;
    } else if (key === "marginRight") {
      result.marginRight = value;
    } else if (key === "marginBottom") {
      result.marginBottom = value;
    } else if (key === "marginLeft") {
      result.marginLeft = value;
    }
  }
  return result;
}
var Text = React9.forwardRef((_a2, ref) => {
  var _b = _a2, { style } = _b, props = __objRest9(_b, ["style"]);
  const defaultMargins = {};
  if ((style == null ? undefined : style.marginTop) === undefined) {
    defaultMargins.marginTop = "16px";
  }
  if ((style == null ? undefined : style.marginBottom) === undefined) {
    defaultMargins.marginBottom = "16px";
  }
  const margins = computeMargins(__spreadValues9(__spreadValues9({}, defaultMargins), style));
  return /* @__PURE__ */ jsx9("p", __spreadProps9(__spreadValues9({}, props), {
    ref,
    style: __spreadValues9(__spreadValues9({
      fontSize: "14px",
      lineHeight: "24px"
    }, style), margins)
  }));
});
Text.displayName = "Text";

// src/email/templates/email-tailwind.config.ts
var emailTailwindConfig = {
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712"
        },
        muted: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827"
        },
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554"
        },
        red: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a"
        },
        destructive: {
          DEFAULT: "#b91c1c",
          foreground: "#fef2f2"
        },
        primary: {
          500: "#667eea",
          600: "#764ba2"
        },
        danger: {
          100: "#f8d7da",
          200: "#f5c6cb",
          600: "#dc3545",
          900: "#721c24"
        },
        warning: {
          100: "#fff3cd",
          200: "#ffc107",
          900: "#856404"
        },
        info: {
          100: "#d1ecf1",
          200: "#bee5eb",
          600: "#0c5460",
          700: "#004085"
        }
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: ['"Courier New"', "monospace"]
      }
    }
  }
};

// src/email/templates/auth-totp.tsx
import { jsx as jsx10, jsxs as jsxs2 } from "react/jsx-runtime";
var totpRepository = {
  signup: {
    title: "Verify Email Address",
    message: "Thank you for signing up. Please verify the email address to complete the sign-up.",
    action: "verify your email"
  },
  "passkey-add": {
    title: "Confirm Adding Passkey",
    message: "Please verify adding a new passkey to the user account.",
    action: "confirm adding the passkey"
  },
  "passkey-delete": {
    title: "Confirm Removing Passkey",
    message: "Please verify removing a passkey from the user account.",
    action: "confirm removing the passkey"
  },
  "email-change": {
    title: "Verify Email Address Update",
    message: "Please verify the email address change.",
    action: "verify email address change"
  },
  "account-delete": {
    title: "Confirm Account Deletion",
    message: "Please confirm account delete. This action cannot be undone.",
    action: "confirm account deletion"
  },
  recovery: {
    title: "Confirm Account Recovery",
    message: "An account recovery request is pending. Use this code to regain access to the account.",
    action: "recover your account"
  }
};
function TotpEmailTemplate({ code, purpose }) {
  const content = totpRepository[purpose];
  const isHighRisk = purpose === "account-delete" || purpose === "passkey-delete";
  const isAccountDelete = purpose === "account-delete";
  return /* @__PURE__ */ jsxs2(Html, {
    children: [
      /* @__PURE__ */ jsx10(Head, {}),
      /* @__PURE__ */ jsx10(Oc, {
        config: emailTailwindConfig,
        children: /* @__PURE__ */ jsx10(Body, {
          className: "bg-white font-sans",
          children: /* @__PURE__ */ jsxs2(Container, {
            className: `mx-auto max-w-2xl text-gray-900 leading-relaxed ${isAccountDelete ? "rounded-lg border-2 border-warning-200 bg-warning-100 p-5" : ""}`,
            children: [
              /* @__PURE__ */ jsx10(Section, {
                className: "px-5 pt-10 pb-5 text-center",
                children: /* @__PURE__ */ jsx10(Heading, {
                  as: "h1",
                  children: content.title
                })
              }),
              /* @__PURE__ */ jsx10(Section, {
                className: "px-5 pb-5 text-center text-gray-600",
                children: /* @__PURE__ */ jsx10(Text, {
                  children: content.message
                })
              }),
              /* @__PURE__ */ jsx10(Section, {
                className: "mx-5 my-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center",
                children: /* @__PURE__ */ jsx10(Text, {
                  className: "m-0 font-bold text-[32px] text-muted-600 tracking-[8px]",
                  children: code
                })
              }),
              /* @__PURE__ */ jsxs2(Section, {
                className: "px-5 py-5 text-center text-muted-400 text-sm",
                children: [
                  /* @__PURE__ */ jsxs2(Text, {
                    children: [
                      "This code will expire within ",
                      /* @__PURE__ */ jsx10("strong", {
                        children: "8 minutes"
                      }),
                      " of issuing."
                    ]
                  }),
                  /* @__PURE__ */ jsxs2(Text, {
                    children: [
                      "If this code was not requested,",
                      isHighRisk ? " consider securing your account" : " it can be safely ignored",
                      "."
                    ]
                  })
                ]
              })
            ]
          })
        })
      })
    ]
  });
}
// src/email/templates/email-change-notification.tsx
import { jsx as jsx11, jsxs as jsxs3 } from "react/jsx-runtime";
function EmailChangeNotificationTemplate({ oldEmail, newEmail }) {
  return /* @__PURE__ */ jsxs3(Html, {
    children: [
      /* @__PURE__ */ jsx11(Head, {}),
      /* @__PURE__ */ jsx11(Oc, {
        config: emailTailwindConfig,
        children: /* @__PURE__ */ jsx11(Body, {
          className: "bg-white font-sans",
          children: /* @__PURE__ */ jsxs3(Container, {
            className: "mx-auto max-w-2xl text-gray-800 leading-relaxed",
            children: [
              /* @__PURE__ */ jsx11(Section, {
                className: "m-5 text-center",
                children: /* @__PURE__ */ jsx11(Heading, {
                  as: "h1",
                  children: "Important security notification"
                })
              }),
              /* @__PURE__ */ jsxs3(Section, {
                className: "m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center",
                children: [
                  /* @__PURE__ */ jsxs3(Text, {
                    children: [
                      "A request was received to change the account access email from ",
                      /* @__PURE__ */ jsx11("strong", {
                        children: oldEmail
                      }),
                      " to ",
                      /* @__PURE__ */ jsx11("strong", {
                        children: newEmail
                      }),
                      ", and is pending approval."
                    ]
                  }),
                  /* @__PURE__ */ jsxs3(Text, {
                    children: [
                      "A verification code was sent to ",
                      /* @__PURE__ */ jsx11("strong", {
                        children: newEmail
                      }),
                      "."
                    ]
                  }),
                  /* @__PURE__ */ jsx11(Text, {
                    children: "The account email will only be changed once the new address is successfully verified."
                  })
                ]
              }),
              /* @__PURE__ */ jsxs3(Section, {
                className: "m-4 text-center text-muted-400 text-sm",
                children: [
                  /* @__PURE__ */ jsx11(Text, {
                    children: "If the email change was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account."
                  }),
                  /* @__PURE__ */ jsx11(Heading, {
                    as: "h3",
                    className: "text-red-500",
                    children: "If unauthorized, take immediate action:"
                  }),
                  /* @__PURE__ */ jsxs3(Section, {
                    className: "text-left mx-auto max-w-md",
                    children: [
                      /* @__PURE__ */ jsxs3(Text, {
                        className: "italic",
                        children: [
                          "• Sign in to the account at ",
                          oldEmail
                        ]
                      }),
                      /* @__PURE__ */ jsx11(Text, {
                        className: "italic",
                        children: "• Review the security settings and passkeys"
                      }),
                      /* @__PURE__ */ jsx11(Text, {
                        className: "italic",
                        children: "• Remove any unfamiliar devices"
                      })
                    ]
                  })
                ]
              })
            ]
          })
        })
      })
    ]
  });
}
// src/email/templates/email-change-verification.tsx
import { jsx as jsx12, jsxs as jsxs4 } from "react/jsx-runtime";
function EmailChangeVerificationTemplate({ code, oldEmail, newEmail, verificationUrl }) {
  return /* @__PURE__ */ jsxs4(Html, {
    children: [
      /* @__PURE__ */ jsx12(Head, {}),
      /* @__PURE__ */ jsx12(Oc, {
        config: emailTailwindConfig,
        children: /* @__PURE__ */ jsx12(Body, {
          className: "bg-white font-sans",
          children: /* @__PURE__ */ jsxs4(Container, {
            className: "mx-auto max-w-2xl text-gray-900 leading-relaxed",
            children: [
              /* @__PURE__ */ jsx12(Section, {
                className: "px-5 pt-10 pb-5 text-center",
                children: /* @__PURE__ */ jsx12(Heading, {
                  as: "h1",
                  children: "Email Address Change Verification"
                })
              }),
              /* @__PURE__ */ jsxs4(Section, {
                className: "m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center",
                children: [
                  /* @__PURE__ */ jsxs4(Text, {
                    children: [
                      "An account email address change from ",
                      /* @__PURE__ */ jsx12("strong", {
                        children: oldEmail
                      }),
                      " to ",
                      /* @__PURE__ */ jsx12("strong", {
                        children: newEmail
                      }),
                      " is pending."
                    ]
                  }),
                  /* @__PURE__ */ jsx12(Text, {
                    children: "Please approve the email address change using the code below."
                  })
                ]
              }),
              /* @__PURE__ */ jsx12(Section, {
                className: "m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center",
                children: /* @__PURE__ */ jsx12(Text, {
                  className: "m-0 font-bold text-[32px] text-muted-600 tracking-[8px]",
                  children: code
                })
              }),
              /* @__PURE__ */ jsx12(Section, {
                className: "m-3 text-center text-muted-400 text-sm",
                children: /* @__PURE__ */ jsxs4(Text, {
                  children: [
                    " ",
                    "This code will expire within ",
                    /* @__PURE__ */ jsx12("strong", {
                      children: "8 minutes"
                    }),
                    " if not approved."
                  ]
                })
              }),
              verificationUrl && /* @__PURE__ */ jsxs4(Section, {
                className: "m-4 rounded-2xl bg-muted-100 p-3 text-center",
                children: [
                  /* @__PURE__ */ jsx12(Text, {
                    className: "mx-2",
                    children: /* @__PURE__ */ jsx12(Link, {
                      href: verificationUrl,
                      className: "font-bold no-underline",
                      children: "Click this link to approve the change"
                    })
                  }),
                  /* @__PURE__ */ jsxs4(Text, {
                    className: "mx-2",
                    children: [
                      /* @__PURE__ */ jsx12(Text, {
                        children: "If having trouble using the link above, use the url below to verify."
                      }),
                      /* @__PURE__ */ jsx12(Link, {
                        href: verificationUrl,
                        className: "underline",
                        children: verificationUrl
                      })
                    ]
                  })
                ]
              }),
              /* @__PURE__ */ jsxs4(Section, {
                className: "m-4 text-center text-muted-400 text-sm",
                children: [
                  /* @__PURE__ */ jsx12(Text, {
                    children: "If this code was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account."
                  }),
                  /* @__PURE__ */ jsx12(Heading, {
                    as: "h3",
                    className: "text-red-500",
                    children: "If unauthorized, take immediate action:"
                  }),
                  /* @__PURE__ */ jsxs4(Section, {
                    className: "text-left mx-auto max-w-md",
                    children: [
                      /* @__PURE__ */ jsxs4(Text, {
                        className: "italic",
                        children: [
                          "• ",
                          /* @__PURE__ */ jsx12("strong", {
                            children: "Do not enter the verification code."
                          })
                        ]
                      }),
                      /* @__PURE__ */ jsxs4(Text, {
                        className: "italic",
                        children: [
                          "• Sign in to the account at ",
                          oldEmail
                        ]
                      }),
                      /* @__PURE__ */ jsx12(Text, {
                        className: "italic",
                        children: "• Review the security settings and passkeys"
                      }),
                      /* @__PURE__ */ jsx12(Text, {
                        className: "italic",
                        children: "• Remove any unfamiliar devices"
                      })
                    ]
                  })
                ]
              })
            ]
          })
        })
      })
    ]
  });
}
// src/email/templates/minimal-template.tsx
import { jsx as jsx13, jsxs as jsxs5 } from "react/jsx-runtime";
function MinimalEmailTemplate({ message }) {
  return /* @__PURE__ */ jsxs5(Html, {
    children: [
      /* @__PURE__ */ jsx13(Head, {}),
      /* @__PURE__ */ jsx13(Oc, {
        config: emailTailwindConfig,
        children: /* @__PURE__ */ jsx13(Body, {
          className: "bg-white font-sans",
          children: /* @__PURE__ */ jsx13(Container, {
            className: "mx-auto max-w-2xl",
            children: /* @__PURE__ */ jsx13(Text, {
              className: "text-gray-900",
              children: message
            })
          })
        })
      })
    ]
  });
}
// src/email/templates/mock-template.tsx
import { jsx as jsx14, jsxs as jsxs6 } from "react/jsx-runtime";
function MockEmailTemplate({ subject, message, recipientName = "there" }) {
  return /* @__PURE__ */ jsxs6(Html, {
    children: [
      /* @__PURE__ */ jsx14(Head, {}),
      /* @__PURE__ */ jsx14(Oc, {
        config: emailTailwindConfig,
        children: /* @__PURE__ */ jsx14(Body, {
          className: "bg-white font-sans",
          children: /* @__PURE__ */ jsxs6(Container, {
            className: "mx-auto max-w-2xl text-gray-900",
            children: [
              /* @__PURE__ */ jsx14(Section, {
                className: "border-muted-100 border-b px-5 pt-10 pb-5 text-center",
                children: /* @__PURE__ */ jsx14(Heading, {
                  as: "h1",
                  children: subject
                })
              }),
              /* @__PURE__ */ jsxs6(Section, {
                className: "px-5 py-8",
                children: [
                  /* @__PURE__ */ jsxs6(Text, {
                    children: [
                      "Hello ",
                      recipientName,
                      ","
                    ]
                  }),
                  /* @__PURE__ */ jsx14(Section, {
                    className: "my-5 rounded border-blue-500 border-l-4 bg-muted-50 p-5 text-muted-600",
                    children: /* @__PURE__ */ jsx14(Text, {
                      children: message
                    })
                  }),
                  /* @__PURE__ */ jsx14(Text, {
                    children: "Thank you for testing the Foundry email system!"
                  })
                ]
              }),
              /* @__PURE__ */ jsx14(Hr, {
                className: "my-5 border-muted-100"
              }),
              /* @__PURE__ */ jsxs6(Section, {
                className: "px-5 py-5 text-center text-muted-400 text-sm",
                children: [
                  /* @__PURE__ */ jsx14(Text, {
                    children: "This is a test email sent from the Foundry system."
                  }),
                  /* @__PURE__ */ jsx14(Text, {
                    children: "If you received this email by mistake, please ignore it."
                  })
                ]
              })
            ]
          })
        })
      })
    ]
  });
}
// src/email/templates/recovery-verification.tsx
import { jsx as jsx15, jsxs as jsxs7 } from "react/jsx-runtime";
function RecoveryVerificationTemplate({ code, email: email2, verificationUrl }) {
  return /* @__PURE__ */ jsxs7(Html, {
    children: [
      /* @__PURE__ */ jsx15(Head, {}),
      /* @__PURE__ */ jsx15(Oc, {
        config: emailTailwindConfig,
        children: /* @__PURE__ */ jsx15(Body, {
          className: "bg-white font-sans",
          children: /* @__PURE__ */ jsxs7(Container, {
            className: "mx-auto max-w-2xl text-gray-900 leading-relaxed",
            children: [
              /* @__PURE__ */ jsx15(Section, {
                className: "px-5 pt-10 pb-5 text-center",
                children: /* @__PURE__ */ jsx15(Heading, {
                  as: "h1",
                  children: "Account Recovery Request"
                })
              }),
              /* @__PURE__ */ jsxs7(Section, {
                className: "m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center",
                children: [
                  /* @__PURE__ */ jsxs7(Text, {
                    children: [
                      "An account recovery request for ",
                      /* @__PURE__ */ jsx15("strong", {
                        children: email2
                      }),
                      " is pending approval.",
                      " "
                    ]
                  }),
                  /* @__PURE__ */ jsx15(Text, {
                    children: "If approved, registration of a new passkey will be allowed to proceed."
                  }),
                  /* @__PURE__ */ jsx15(Text, {
                    children: "Please approve the account recovery request using the code below."
                  })
                ]
              }),
              /* @__PURE__ */ jsx15(Section, {
                className: "m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center",
                children: /* @__PURE__ */ jsx15(Text, {
                  className: "m-0 font-bold text-[32px] text-muted-600 tracking-[8px]",
                  children: code
                })
              }),
              /* @__PURE__ */ jsx15(Section, {
                className: "m-3 text-center text-muted-400 text-sm",
                children: /* @__PURE__ */ jsxs7(Text, {
                  children: [
                    " ",
                    "This code will expire within ",
                    /* @__PURE__ */ jsx15("strong", {
                      children: "8 minutes"
                    }),
                    " if not approved."
                  ]
                })
              }),
              verificationUrl && /* @__PURE__ */ jsxs7(Section, {
                className: "m-4 rounded-2xl bg-muted-100 p-3 text-center",
                children: [
                  /* @__PURE__ */ jsx15(Text, {
                    className: "mx-2",
                    children: /* @__PURE__ */ jsx15(Link, {
                      href: verificationUrl,
                      className: "font-bold no-underline",
                      children: "Click this link to approve the change"
                    })
                  }),
                  /* @__PURE__ */ jsxs7(Text, {
                    className: "mx-2",
                    children: [
                      /* @__PURE__ */ jsx15(Text, {
                        children: "If having trouble using the link above, use the url below to verify."
                      }),
                      /* @__PURE__ */ jsx15(Link, {
                        href: verificationUrl,
                        className: "underline",
                        children: verificationUrl
                      })
                    ]
                  })
                ]
              }),
              /* @__PURE__ */ jsxs7(Section, {
                className: "m-4 text-center text-muted-400 text-sm",
                children: [
                  /* @__PURE__ */ jsx15(Text, {
                    children: "If this code was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account."
                  }),
                  /* @__PURE__ */ jsx15(Heading, {
                    as: "h3",
                    className: "text-red-500",
                    children: "If unauthorized, take immediate action:"
                  }),
                  /* @__PURE__ */ jsxs7(Section, {
                    className: "text-left mx-auto max-w-md",
                    children: [
                      /* @__PURE__ */ jsxs7(Text, {
                        className: "italic",
                        children: [
                          "• ",
                          /* @__PURE__ */ jsx15("strong", {
                            children: "Do not enter the verification code."
                          })
                        ]
                      }),
                      /* @__PURE__ */ jsxs7(Text, {
                        className: "italic",
                        children: [
                          "• Sign in to the account at ",
                          email2
                        ]
                      }),
                      /* @__PURE__ */ jsx15(Text, {
                        className: "italic",
                        children: "• Review the security settings and passkeys"
                      }),
                      /* @__PURE__ */ jsx15(Text, {
                        className: "italic",
                        children: "• Remove any unfamiliar devices"
                      })
                    ]
                  })
                ]
              })
            ]
          })
        })
      })
    ]
  });
}
export {
  totpRepository,
  simulateTestEmailFailure,
  resetTestEmailToSuccess,
  resetTestEmailProvider,
  isValidProvider,
  getTestSentEmails,
  getTestLastSentEmail,
  getTestEmailFailureState,
  getTestEmailCount,
  getSupportedProviders,
  getProviderConfig,
  getEmailProviderNames,
  findTestEmailsBySubject,
  findTestEmailByTo,
  emailTailwindConfig,
  emailContext,
  defaultEmailConfig,
  createTestMockEmailProvider,
  createResendEmailProvider,
  createMailChannelsEmailProvider,
  createLocalDevEmailProvider,
  createEmailProvider,
  clearTestSentEmails,
  assertTestNoEmailsSent,
  assertTestEmailSent,
  assertTestEmailCount,
  TotpEmailTemplate,
  RecoveryVerificationTemplate,
  MockEmailTemplate,
  MinimalEmailTemplate,
  EmailSchema,
  EmailChangeVerificationTemplate,
  EmailChangeNotificationTemplate
};

//# debugId=A48A13C6BB10B58E64756E2164756E21
