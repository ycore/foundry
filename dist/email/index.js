import { createContextSingleton } from "@ycore/forge/context";
import { err, tryCatch, ok } from "@ycore/forge/result";
import { logger } from "@ycore/forge/logger";
import * as v from "valibot";
import { jsxs, jsx } from "react/jsx-runtime";
import { Html, Head, Body, Container, Section, Text, Heading, Hr } from "@ycore/componentry/email";
function defineEmailTemplate({ component, subject, stylesMap }) {
  return {
    component,
    subject,
    stylesMap,
    // Helper method for type-safe rendering
    render: (data) => ({
      component: component(data),
      subject: subject(data),
      stylesMap
    })
  };
}
const defaultEmailConfig = {
  active: "local-dev",
  providers: [
    {
      name: "local-dev",
      sendFrom: "dev@localhost"
    }
  ]
};
const emailContext = createContextSingleton("EmailContext", null);
const EMAIL_PROVIDER_DELAYS = {
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
function createLocalDevEmailProvider() {
  return createEmailProviderBase("local-dev", async (options) => {
    const { to, from, template } = options;
    await new Promise((resolve) => setTimeout(resolve, EMAIL_PROVIDER_DELAYS.LOCAL_DEV));
    logger.info("local_dev_email_sent", { provider: "local-dev", from, to, subject: template.subject });
    console.log(" === Message content (plain text)", "=".repeat(48), "\n", template.text, "\n", "=".repeat(80));
  });
}
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
let sentEmails = [];
let shouldFail = false;
let failureReason = "Simulated email failure";
function createTestMockEmailProvider() {
  return {
    async sendEmail(options) {
      const { to, from, template } = options;
      if (!from) {
        return err("From address is required");
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
        return err(failureReason);
      }
      const baseProvider = createEmailProviderBase("test-mock", async (opts) => {
        await new Promise((resolve) => setTimeout(resolve, EMAIL_PROVIDER_DELAYS.TEST_MOCK));
        logger.debug("email_test_mock_sent", {
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
    return void 0;
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
const providerRegistry = {
  "local-dev": createLocalDevEmailProvider,
  mailchannels: createMailChannelsEmailProvider,
  resend: createResendEmailProvider,
  "test-mock": createTestMockEmailProvider
};
function createEmailProvider(providerName) {
  if (!isValidProvider(providerName)) {
    return err(`Unsupported email provider: ${providerName}`);
  }
  try {
    const factory = providerRegistry[providerName];
    const provider = factory();
    return ok(provider);
  } catch (error) {
    return err(`Failed to create email provider: ${providerName}`, void 0, { cause: error });
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
const EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email(), v.maxLength(254));
const TAILWIND_TO_CSS_MAP = {
  "mx-auto": { "marginInline": "auto" },
  "my-5": { "marginBlock": "1.25rem" },
  "max-w-2xl": { "maxWidth": "42rem" },
  "rounded": { "borderRadius": "0.25rem" },
  "border-b": { "borderBottomStyle": "solid", "borderBottomWidth": "1px" },
  "border-l-4": { "borderLeftStyle": "solid", "borderLeftWidth": "4px" },
  "border-blue-500": { "borderColor": "oklch(62.3% 0.214 259.815)" },
  "border-border": { "borderColor": "oklch(70.7% 0.022 261.325)" },
  "bg-muted": { "backgroundColor": "oklch(87.2% 0.01 258.338)" },
  "bg-white": { "backgroundColor": "#fff" },
  "p-4": { "padding": "1rem" },
  "p-5": { "padding": "1.25rem" },
  "px-5": { "paddingInline": "1.25rem" },
  "py-5": { "paddingBlock": "1.25rem" },
  "py-8": { "paddingBlock": "2rem" },
  "pt-10": { "paddingTop": "2.5rem" },
  "pb-5": { "paddingBottom": "1.25rem" },
  "text-center": { "textAlign": "center" },
  "font-sans": { "fontFamily": "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',\n    'Noto Color Emoji'" },
  "text-sm": { "fontSize": "0.875rem", "lineHeight": "var(--text-sm--line-height)" },
  "text-foreground": { "color": "oklch(27.8% 0.033 256.848)" },
  "text-gray-900": { "color": "oklch(21% 0.034 264.665)" },
  "text-muted-foreground": { "color": "oklch(55.1% 0.027 264.364)" },
  "dark": { "color": "color-mix(in lab, red, red)) {\n    & {\n      --border: color-mix(in oklab, oklch(96.7% 0.003 264.542) 10%, transparent)" }
};
const DYNAMIC_UTILITY_PATTERNS = [
  // No dynamic patterns detected
];
const TEMPLATE_STYLES_MAP = {
  cssMap: TAILWIND_TO_CSS_MAP,
  dynamicPatterns: DYNAMIC_UTILITY_PATTERNS
};
const MinimalEmailTemplate = defineEmailTemplate({
  component: ({ message }) => /* @__PURE__ */ jsxs(Html, { lang: "en", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Body, { className: "bg-white font-sans", children: /* @__PURE__ */ jsx(Container, { className: "mx-auto max-w-2xl", children: /* @__PURE__ */ jsx(Section, { className: "p-4", children: /* @__PURE__ */ jsx(Text, { className: "text-gray-900", children: message }) }) }) })
  ] }),
  subject: ({ subject }) => subject,
  stylesMap: TEMPLATE_STYLES_MAP
});
const MockEmailTemplate = defineEmailTemplate({
  component: ({ subject, message, recipientName = "there" }) => /* @__PURE__ */ jsxs(Html, { lang: "en", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Body, { className: "bg-white font-sans", children: /* @__PURE__ */ jsxs(Container, { className: "mx-auto max-w-2xl text-foreground", children: [
      /* @__PURE__ */ jsx(Section, { className: "border-border border-b px-5 pt-10 pb-5 text-center", children: /* @__PURE__ */ jsx(Heading, { level: 1, children: subject }) }),
      /* @__PURE__ */ jsxs(Section, { className: "px-5 py-8", children: [
        /* @__PURE__ */ jsxs(Text, { children: [
          "Hello ",
          recipientName,
          ","
        ] }),
        /* @__PURE__ */ jsx(Section, { className: "my-5 rounded border-blue-500 border-l-4 bg-muted p-5 text-foreground", children: /* @__PURE__ */ jsx(Text, { children: message }) }),
        /* @__PURE__ */ jsx(Text, { children: "Thank you for testing the Foundry email system!" })
      ] }),
      /* @__PURE__ */ jsx(Hr, { className: "my-5 border-border" }),
      /* @__PURE__ */ jsxs(Section, { className: "px-5 py-5 text-center text-muted-foreground text-sm", children: [
        /* @__PURE__ */ jsx(Text, { children: "This is a test email sent from the Foundry system." }),
        /* @__PURE__ */ jsx(Text, { children: "If you received this email by mistake, please ignore it." })
      ] })
    ] }) })
  ] }),
  subject: ({ subject }) => subject,
  stylesMap: TEMPLATE_STYLES_MAP
});
export {
  EmailSchema,
  MinimalEmailTemplate,
  MockEmailTemplate,
  assertTestEmailCount,
  assertTestEmailSent,
  assertTestNoEmailsSent,
  clearTestSentEmails,
  createEmailProvider,
  createLocalDevEmailProvider,
  createMailChannelsEmailProvider,
  createResendEmailProvider,
  createTestMockEmailProvider,
  defaultEmailConfig,
  defineEmailTemplate,
  emailContext,
  findTestEmailByTo,
  findTestEmailsBySubject,
  getEmailProviderNames,
  getProviderConfig,
  getSupportedProviders,
  getTestEmailCount,
  getTestEmailFailureState,
  getTestLastSentEmail,
  getTestSentEmails,
  isValidProvider,
  resetTestEmailProvider,
  resetTestEmailToSuccess,
  simulateTestEmailFailure
};
//# sourceMappingURL=index.js.map
