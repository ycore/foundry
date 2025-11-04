import { setContext, getContext } from "@ycore/forge/context";
import { createContext } from "react-router";
import { logger } from "@ycore/forge/logger";
import { err, tryCatch, ok, isError, flattenError } from "@ycore/forge/result";
import { getBindings } from "@ycore/forge/services";
import { renderEmail } from "@ycore/componentry/email/server";
const emailContext = createContext(null);
function emailConfigMiddleware(emailConfig) {
  return async ({ context }, next) => {
    setContext(context, emailContext, emailConfig);
    return next();
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
function getProviderConfig(emailConfig, providerName) {
  return emailConfig.providers.find((provider) => provider.name === providerName);
}
async function sendMail(context, options) {
  try {
    const { to, template, from: optionsFrom, provider: optionsProvider, apiKey: optionsApiKey } = options;
    const emailConfig = getContext(context, emailContext, null);
    const provider = optionsProvider || emailConfig?.active || defaultEmailConfig.active;
    if (!provider) {
      logger.error("email_no_provider", { optionsProvider, contextActive: emailConfig?.active, defaultActive: defaultEmailConfig.active, to });
      return err("No email provider configured");
    }
    const providerConfig = emailConfig && getProviderConfig(emailConfig, provider) || getProviderConfig(defaultEmailConfig, provider);
    if (!providerConfig) {
      logger.error("email_provider_config_missing", { provider, to, contextProviders: emailConfig?.providers.map((p) => p.name) });
      return err(`Provider configuration not found for: ${provider}`);
    }
    let apiKey = optionsApiKey;
    if (!apiKey && providerConfig.apiKey) {
      const bindings = getBindings(context);
      apiKey = bindings[providerConfig.apiKey];
    }
    const from = optionsFrom || providerConfig.sendFrom;
    const emailProviderResult = createEmailProvider(provider);
    if (isError(emailProviderResult)) {
      logger.error("email_provider_creation_failed", { provider, to, error: flattenError(emailProviderResult) });
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
      logger.error("email_send_failed", { to, from, provider, error: flattenError(sendResult) });
      return sendResult;
    }
    return ok(void 0);
  } catch (error) {
    logger.error("email_send_unexpected_error", { to: options.to, error });
    return err("Failed to send email", { error });
  }
}
async function renderEmailTemplate(template, data, options) {
  const result = await renderEmail(
    template.component,
    {
      ...data,
      subject: template.subject
    },
    {
      ...options,
      tailwindStylesMap: template.stylesMap ?? options?.tailwindStylesMap
    }
  );
  return {
    subject: result.subject || "",
    html: result.html,
    text: result.text
  };
}
export {
  emailConfigMiddleware,
  renderEmailTemplate,
  sendMail
};
//# sourceMappingURL=index.js.map
