import { setContext, getContext } from "@ycore/forge/context";
import { emailContext, defaultEmailConfig, getProviderConfig, createEmailProvider } from "@ycore/foundry/email";
import { logger } from "@ycore/forge/logger";
import { err, isError, flattenError, ok } from "@ycore/forge/result";
import { getBindings } from "@ycore/forge/services";
import { renderEmail } from "@ycore/componentry/email/server";
function emailConfigMiddleware(emailConfig) {
  return async ({ context }, next) => {
    setContext(context, emailContext, emailConfig);
    return next();
  };
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
