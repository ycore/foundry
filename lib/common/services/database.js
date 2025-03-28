import { drizzle } from 'drizzle-orm/d1';
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#smart_self-overwriting_lazy_getters
export const resolveDatabase = (() => {
    // biome-ignore lint/suspicious/noImplicitAnyLet:
    let cached;
    // biome-ignore lint/suspicious/noExplicitAny:
    return (context, schema) => 
    // biome-ignore lint/suspicious/noAssignInExpressions:
    (cached ??= drizzle(context.cloudflare.env.MAIN_D1, {
        schema,
        logger: context.cloudflare.env.ENVIRONMENT === 'development',
    }));
})();
