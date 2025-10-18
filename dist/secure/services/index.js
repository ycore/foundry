// src/secure/csrf/csrf.ts
import { createCookie } from "react-router";
import { CSRF } from "remix-utils/csrf/server";
function createCSRF(secret, config) {
  const cookie = createCookie(config.cookieName, {
    path: config.cookie.path,
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAge,
    secrets: [secret]
  });
  return new CSRF({
    cookie,
    secret,
    formDataKey: config.formDataKey
  });
}
// src/secure/csrf/csrf.middleware.ts
import { logger } from "@ycore/forge/logger";
import { middlewarePassthrough } from "@ycore/forge/result";
import { getBindings, isDevelopment } from "@ycore/forge/services";
import { createContext } from "react-router";
var csrfContext = createContext(null);
var skipCSRFValidation = createContext(false);
function createCommitCSRFMiddleware(config) {
  return async ({ request, context }, next) => {
    if (request.method !== "GET") {
      return next();
    }
    const bindings = getBindings(context);
    if (!bindings) {
      logger.error("csrf_bindings_not_available", { secretKey: config.secretKey });
      throw new Error("Cloudflare bindings not available - context setup issue");
    }
    const secret = bindings[config.secretKey];
    if (!secret) {
      logger.error("csrf_secret_not_found", { secretKey: config.secretKey, availableBindings: Object.keys(bindings) });
      throw new Error(`CSRF secret binding '${config.secretKey}' not found in environment`);
    }
    const runtimeConfig = {
      ...config,
      cookie: {
        ...config.cookie,
        secure: isDevelopment(context) ? false : config.cookie.secure
      }
    };
    const csrf = createCSRF(secret, runtimeConfig);
    const [token, cookieHeader] = await csrf.commitToken();
    const csrfData = { token, formDataKey: config.formDataKey, headerName: config.headerName };
    context.set(csrfContext, csrfData);
    const response = await next();
    if (cookieHeader) {
      return middlewarePassthrough(response, {
        append: { "Set-Cookie": cookieHeader }
      });
    }
    return response;
  };
}
function createValidateCSRFMiddleware(config) {
  return async ({ request, context }, next) => {
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      return next();
    }
    const skipCSRF = context.get(skipCSRFValidation);
    if (skipCSRF) {
      context.set(skipCSRFValidation, false);
      return next();
    }
    const bindings = getBindings(context);
    if (!bindings) {
      logger.error("csrf_bindings_not_available", { secretKey: config.secretKey });
      throw new Error("Cloudflare bindings not available - context setup issue");
    }
    const secret = bindings[config.secretKey];
    if (!secret) {
      logger.error("csrf_secret_not_found", { secretKey: config.secretKey, availableBindings: Object.keys(bindings) });
      throw new Error(`CSRF secret binding '${config.secretKey}' not found in environment`);
    }
    const runtimeConfig = {
      ...config,
      cookie: {
        ...config.cookie,
        secure: isDevelopment(context) ? false : config.cookie.secure
      }
    };
    const csrf = createCSRF(secret, runtimeConfig);
    try {
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      await csrf.validate(formData, request.headers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Token mismatch";
      logger.error("csrf_validation_failed", { error: errorMessage, url: request.url });
      throw new Response("Token mismatch", { status: 403, statusText: errorMessage });
    }
    return next();
  };
}
function createCSRFMiddleware(config) {
  return [createCommitCSRFMiddleware(config), createValidateCSRFMiddleware(config)];
}
// src/secure/headers/secure-headers.middleware.ts
import { unstable_createSecureHeadersMiddleware } from "remix-utils/middleware/secure-headers";
// src/secure/rate-limiter/rate-limiter.middleware.ts
import { logger as logger2 } from "@ycore/forge/logger";
import { getClientIP, isError as isError2 } from "@ycore/forge/result";
import { data } from "react-router";

// src/secure/rate-limiter/rate-limiter.provider.ts
import { err as err3, isError } from "@ycore/forge/result";

// src/secure/rate-limiter/providers/cloudflare-rate-limiter.ts
import { err } from "@ycore/forge/result";
import { getBindings as getBindings2 } from "@ycore/forge/services";
var DEFAULT_WINDOW_MS = 60 * 1000;
function isCloudflareRateLimiterOptions(options) {
  return options != null && typeof options === "object" && "limiterBinding" in options && typeof options.limiterBinding === "string";
}
var cloudflareRateLimiter = {
  name: "cloudflare",
  async checkLimit(request, config, context) {
    if (config.type !== "cloudflare") {
      return err("Invalid provider type for Cloudflare rate limiter", {
        expectedType: "cloudflare",
        actualType: config.type,
        providerId: config.id
      });
    }
    const cfConfig = config;
    if (!isCloudflareRateLimiterOptions(cfConfig.options)) {
      return err("Cloudflare rate limiter binding not configured", {
        providerId: cfConfig.id,
        path: request.path,
        identifier: request.identifier
      });
    }
    const cfOptions = cfConfig.options;
    const bindings = getBindings2(context);
    const rateLimiter = bindings[cfOptions.limiterBinding];
    if (!rateLimiter || typeof rateLimiter.limit !== "function") {
      return err(`RateLimit binding '${cfOptions.limiterBinding}' not found in Cloudflare bindings`, {
        limiterBinding: cfOptions.limiterBinding,
        providerId: config.id,
        path: request.path,
        identifier: request.identifier,
        availableBindings: Object.keys(bindings)
      });
    }
    try {
      const key = `${request.path}:${request.identifier}`;
      const outcome = await rateLimiter.limit({ key });
      const windowMs = DEFAULT_WINDOW_MS;
      const response = {
        allowed: outcome.success,
        remaining: outcome.success ? 1 : 0,
        resetAt: Date.now() + windowMs,
        retryAfter: outcome.success ? undefined : Math.ceil(windowMs / 1000)
      };
      return response;
    } catch (error) {
      return err("Failed to check Cloudflare rate limit", {
        limiterBinding: cfOptions.limiterBinding,
        providerId: config.id,
        key: `${request.path}:${request.identifier}`,
        path: request.path,
        identifier: request.identifier
      }, { cause: error });
    }
  },
  async resetLimit(identifier, config, context) {
    return err("Cloudflare rate limiter does not support manual reset", {
      providerId: config.id,
      identifier,
      reason: "Cloudflare Workers Rate Limiting API has no reset method - limits expire automatically based on configured period",
      workaround: "Wait for rate limit window to expire naturally, or use KV-based provider which supports resetLimit()"
    });
  }
};

// src/secure/rate-limiter/providers/kv-rate-limiter.ts
import { err as err2 } from "@ycore/forge/result";
import { getKVStore } from "@ycore/forge/services";
var KV_MINIMUM_TTL = 60;
var DEFAULT_RETRY_ATTEMPTS = 3;
var RETRY_DELAY_MS = 50;
var KV_KEY_PREFIX = "rate_limit";
var rateLimitKvTemplate = (path, identifier) => `${KV_KEY_PREFIX}:${path}:${identifier}`;
function isKvRateLimiterOptions(options) {
  return options != null && typeof options === "object" && "kvBinding" in options && typeof options.kvBinding === "string";
}
function isValidRateLimitMetadata(metadata) {
  if (metadata == null || typeof metadata !== "object") {
    return false;
  }
  const meta = metadata;
  return typeof meta.count === "number" && typeof meta.resetAt === "number" && typeof meta.version === "number" && meta.count >= 0 && meta.resetAt > 0 && meta.version >= 0;
}
var kvRateLimiter = {
  name: "kv",
  async checkLimit(request, config, context) {
    if (config.type !== "kv") {
      return err2("Invalid provider type for KV rate limiter", {
        expectedType: "kv",
        actualType: config.type,
        providerId: config.id
      });
    }
    const kvConfig = config;
    if (!isKvRateLimiterOptions(kvConfig.options)) {
      return err2("KV binding not configured for rate limiting", {
        providerId: kvConfig.id,
        path: request.path,
        identifier: request.identifier
      });
    }
    const kvOptions = kvConfig.options;
    const kv = getKVStore(context, kvOptions.kvBinding);
    if (!kv) {
      return err2(`KV namespace '${kvOptions.kvBinding}' not found in bindings`, {
        kvBinding: kvOptions.kvBinding,
        providerId: kvConfig.id,
        path: request.path,
        identifier: request.identifier
      });
    }
    const maxRequests = kvConfig.limits.maxRequests;
    const windowMs = kvConfig.limits.windowMs;
    const maxRetries = kvConfig.behavior?.optimisticLockRetries ?? DEFAULT_RETRY_ATTEMPTS;
    const key = rateLimitKvTemplate(request.path, request.identifier);
    const now = Date.now();
    try {
      let attempt = 0;
      let lastError = null;
      while (attempt < maxRetries) {
        attempt++;
        try {
          const kvValue = await kv.getWithMetadata(key);
          let metadata;
          let previousVersion;
          if (kvValue.metadata && isValidRateLimitMetadata(kvValue.metadata)) {
            metadata = kvValue.metadata;
            previousVersion = metadata.version;
            if (now >= metadata.resetAt) {
              metadata = {
                count: 1,
                resetAt: now + windowMs,
                version: previousVersion + 1
              };
            } else {
              const skipWriteWhenBlocked = kvConfig.behavior?.skipWriteWhenBlocked ?? true;
              if (skipWriteWhenBlocked && metadata.count > maxRequests) {
                const response2 = {
                  allowed: false,
                  remaining: 0,
                  resetAt: metadata.resetAt,
                  retryAfter: Math.ceil((metadata.resetAt - now) / 1000)
                };
                return response2;
              }
              metadata = {
                count: metadata.count + 1,
                resetAt: metadata.resetAt,
                version: previousVersion + 1
              };
            }
          } else {
            metadata = {
              count: 1,
              resetAt: now + windowMs,
              version: 1
            };
            previousVersion = 0;
          }
          const allowed = metadata.count <= maxRequests;
          const remaining = Math.max(0, maxRequests - metadata.count);
          const calculatedTtl = Math.ceil((metadata.resetAt - now) / 1000);
          const ttl = Math.max(KV_MINIMUM_TTL, calculatedTtl);
          await kv.put(key, "", {
            expirationTtl: ttl,
            metadata
          });
          const verifyValue = await kv.getWithMetadata(key);
          if (verifyValue.metadata && isValidRateLimitMetadata(verifyValue.metadata) && verifyValue.metadata.version !== metadata.version && verifyValue.metadata.version !== previousVersion) {
            throw new Error("Version conflict detected - concurrent write");
          }
          const response = {
            allowed,
            remaining,
            resetAt: metadata.resetAt,
            retryAfter: allowed ? undefined : Math.ceil((metadata.resetAt - now) / 1000)
          };
          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
            continue;
          }
          throw lastError;
        }
      }
      throw lastError || new Error("Failed to check rate limit after retries");
    } catch (error) {
      return err2("Failed to check rate limit", {
        key,
        path: request.path,
        identifier: request.identifier,
        maxRequests,
        windowMs
      }, { cause: error });
    }
  },
  async resetLimit(identifier, config, context) {
    if (config.type !== "kv") {
      return err2("Invalid provider type for KV rate limiter", {
        expectedType: "kv",
        actualType: config.type,
        providerId: config.id
      });
    }
    const kvConfig = config;
    if (!isKvRateLimiterOptions(kvConfig.options)) {
      return err2("KV binding not configured for rate limiting", {
        providerId: kvConfig.id,
        identifier
      });
    }
    const kvOptions = kvConfig.options;
    const kv = getKVStore(context, kvOptions.kvBinding);
    if (!kv) {
      return err2(`KV namespace '${kvOptions.kvBinding}' not found in bindings`, {
        kvBinding: kvOptions.kvBinding,
        providerId: kvConfig.id,
        identifier
      });
    }
    try {
      let deletedCount = 0;
      let cursor;
      let listComplete = false;
      while (!listComplete) {
        const listResult = await kv.list({ prefix: KV_KEY_PREFIX, cursor });
        const keysToDelete = listResult.keys.filter((keyInfo) => keyInfo.name.endsWith(`:${identifier}`)).map((keyInfo) => keyInfo.name);
        await Promise.all(keysToDelete.map((key) => kv.delete(key)));
        deletedCount += keysToDelete.length;
        listComplete = listResult.list_complete;
        cursor = listComplete ? undefined : listResult.keys[listResult.keys.length - 1]?.name;
      }
      return;
    } catch (error) {
      return err2("Failed to reset rate limit", {
        identifier,
        operation: "resetLimit"
      }, { cause: error });
    }
  }
};

// src/secure/rate-limiter/rate-limiter.provider.ts
var rateLimiterProviders = {
  kv: kvRateLimiter,
  cloudflare: cloudflareRateLimiter
};
function getRateLimiterProviderIds(config) {
  return config.providers.map((provider) => provider.id);
}
function getProviderConfig(config, providerId) {
  return config.providers.find((provider) => provider.id === providerId) || null;
}
function createRateLimiterProvider(providerType) {
  const provider = rateLimiterProviders[providerType];
  if (!provider) {
    const availableProviders = Object.keys(rateLimiterProviders).join(", ");
    return err3(`Unknown rate limiter provider type: ${providerType}. Available: ${availableProviders}`);
  }
  return provider;
}
async function checkRateLimit(config, request, context, providerId) {
  const providerConfig = getProviderConfig(config, providerId);
  if (!providerConfig) {
    return err3(`Provider configuration not found for ID: ${providerId}`, {
      providerId,
      availableProviders: getRateLimiterProviderIds(config)
    });
  }
  const providerResult = createRateLimiterProvider(providerConfig.type);
  if (isError(providerResult)) {
    return providerResult;
  }
  return await providerResult.checkLimit(request, providerConfig, context);
}

// src/secure/rate-limiter/route-matcher.ts
function globToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = escaped.replace(/\*\*/g, "___DOUBLE_STAR___").replace(/\*/g, "[^/]*").replace(/___DOUBLE_STAR___/g, ".*");
  return new RegExp(`^${regex}$`);
}
function matchesRoute(path, pattern) {
  if (pattern === path)
    return true;
  if (!pattern.includes("*"))
    return false;
  const regex = globToRegex(pattern);
  return regex.test(path);
}
function findRouteConfig(path, routes) {
  let bestMatch = null;
  let bestMatchLength = 0;
  for (const route of routes) {
    if (matchesRoute(path, route.pattern)) {
      const specificityScore = route.pattern.replace(/\*/g, "").length;
      if (specificityScore > bestMatchLength) {
        bestMatch = route;
        bestMatchLength = specificityScore;
      }
    }
  }
  return bestMatch;
}
function getEffectiveRateLimitConfig(config, path, method) {
  if (config.conditions?.skipPaths?.some((skipPath) => matchesRoute(path, skipPath))) {
    return null;
  }
  const routeConfig = findRouteConfig(path, config.routes);
  if (!routeConfig) {
    return null;
  }
  if (routeConfig.methods && !routeConfig.methods.includes(method)) {
    return null;
  }
  const providerId = routeConfig.provider;
  const providerConfig = config.providers.find((p) => p.id === providerId);
  if (!providerConfig) {
    return null;
  }
  return { providerConfig, providerId };
}

// src/secure/rate-limiter/rate-limiter.middleware.ts
function rateLimiterMiddleware(config) {
  return async ({ request, context }, next) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const effectiveConfig = getEffectiveRateLimitConfig(config, path, method);
    if (!effectiveConfig) {
      return next();
    }
    const requestConfig = { ...config, providers: [effectiveConfig.providerConfig] };
    const clientIP = getClientIP(request) || "unknown";
    const rateLimitRequest = { identifier: clientIP, path, method };
    const rateLimitResult = await checkRateLimit(requestConfig, rateLimitRequest, context, effectiveConfig.providerId);
    if (isError2(rateLimitResult)) {
      logger2.error("Rate limit check (failed open)", { error: rateLimitResult.message });
      return next();
    }
    const { allowed, remaining, resetAt, retryAfter } = rateLimitResult;
    const limitHeader = effectiveConfig.providerConfig.type === "kv" ? effectiveConfig.providerConfig.limits.maxRequests.toString() : "100";
    if (!allowed) {
      logger2.warning("Rate limit exceeded", { path: rateLimitRequest.path, remaining, resetAt, retryAfter });
      const headers = {
        "X-RateLimit-Limit": limitHeader,
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(resetAt / 1000).toString()
      };
      if (retryAfter) {
        headers["Retry-After"] = retryAfter.toString();
      }
      throw data({ message: "Too many requests. Please try again later.", retryAfter }, { status: 429, headers });
    }
    const response = await next();
    if (response instanceof Response) {
      response.headers.set("X-RateLimit-Limit", limitHeader);
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());
    }
    return response;
  };
}
export {
  skipCSRFValidation,
  unstable_createSecureHeadersMiddleware as secureHeadersMiddleware,
  rateLimiterMiddleware,
  getProviderConfig,
  csrfContext,
  createValidateCSRFMiddleware,
  createCommitCSRFMiddleware,
  createCSRFMiddleware,
  createCSRF
};

//# debugId=2BB59B49C9DEC27764756E2164756E21
