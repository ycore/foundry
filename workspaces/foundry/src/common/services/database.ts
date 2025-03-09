import { drizzle } from 'drizzle-orm/d1';
import type { AppLoadContext } from 'react-router';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#smart_self-overwriting_lazy_getters
export const resolveDatabase = (() => {
  // biome-ignore lint/suspicious/noImplicitAnyLet:
  let cached;
  // biome-ignore lint/suspicious/noExplicitAny:
  return (context: Pick<AppLoadContext, 'cloudflare'>, schema: any) =>
    // biome-ignore lint/suspicious/noAssignInExpressions:
    (cached ??= drizzle<typeof schema>(context.cloudflare.env.MAIN_D1, {
      schema,
      logger: context.cloudflare.env.ENVIRONMENT === 'development',
    }));
})();
