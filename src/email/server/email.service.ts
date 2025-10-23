import { getContext } from '@ycore/forge/context';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, type Result } from '@ycore/forge/result';
import { getBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import type { SendMailOptions } from '../@types/email.types';
import { defaultEmailConfig } from '../email.config';
import { emailContext } from '../email.context';
import { createEmailProvider, getProviderConfig } from '../email-provider';

/**
 * Send email with cascading configuration fallback
 *
 * This is the primary email sending function for the application.
 * It implements a predictable configuration cascade:
 * 1. Provided options (highest priority)
 * 2. Email context from middleware
 * 3. Default email config (lowest priority)
 */
export async function sendMail(context: Readonly<RouterContextProvider>, options: SendMailOptions): Promise<Result<void>> {
  try {
    const { to, template, from: optionsFrom, provider: optionsProvider, apiKey: optionsApiKey } = options;

    // Get email config from context (may be null if middleware not configured)
    const emailConfig = getContext(context, emailContext, null);
    const provider = optionsProvider || emailConfig?.active || defaultEmailConfig.active;

    if (!provider) {
      logger.error('email_no_provider', { optionsProvider, contextActive: emailConfig?.active, defaultActive: defaultEmailConfig.active, to });
      return err('No email provider configured');
    }

    // Get provider config with cascading fallback
    const providerConfig = (emailConfig && getProviderConfig(emailConfig, provider)) || getProviderConfig(defaultEmailConfig, provider);
    if (!providerConfig) {
      logger.error('email_provider_config_missing', { provider, to, contextProviders: emailConfig?.providers.map(p => p.name) });
      return err(`Provider configuration not found for: ${provider}`);
    }

    // Determine apiKey with cascading fallback
    let apiKey = optionsApiKey;
    if (!apiKey && providerConfig.apiKey) {
      const bindings = getBindings(context);
      apiKey = bindings[providerConfig.apiKey as keyof typeof bindings] as string | undefined;
    }

    // Determine from address with cascading fallback
    const from = optionsFrom || providerConfig.sendFrom;

    // Create email provider instance
    const emailProviderResult = createEmailProvider(provider);
    if (isError(emailProviderResult)) {
      logger.error('email_provider_creation_failed', { provider, to, error: flattenError(emailProviderResult) });
      return emailProviderResult;
    }

    // Send email
    const sendResult = await emailProviderResult.sendEmail({
      apiKey: apiKey || '',
      to,
      from,
      template: {
        subject: template.subject,
        text: template.text,
        html: template.html,
      },
    });

    if (isError(sendResult)) {
      logger.error('email_send_failed', { to, from, provider, error: flattenError(sendResult) });
      return sendResult;
    }

    return ok(undefined);
  } catch (error) {
    logger.error('email_send_unexpected_error', { to: options.to, error: error });
    return err('Failed to send email', { error });
  }
}
