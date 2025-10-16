// src/secure/csrf/csrf.config.ts
var defaultCSRFConfig = {
  secretKey: "UNCONFIGURED",
  cookieName: "__csrf",
  formDataKey: "csrf_token",
  headerName: "x-csrf-token",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    maxAge: undefined
  }
};
// src/secure/csrf/csrf.context.tsx
import { createContext, useContext } from "react";
var SecureContext = createContext(null);
var SecureContextProvider = SecureContext.Provider;
function useSecureContext() {
  const data = useContext(SecureContext);
  if (!data) {
    return {
      token: "",
      formDataKey: defaultCSRFConfig.formDataKey,
      headerName: defaultCSRFConfig.headerName
    };
  }
  return data;
}
// src/secure/csrf/csrf.middleware.ts
import { logger } from "@ycore/forge/logger";
import { middlewarePassthrough } from "@ycore/forge/result";
import { getBindings, isDevelopment } from "@ycore/forge/services";
import { createContext as createContext2 } from "react-router";

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
var csrfContext = createContext2(null);
var skipCSRFValidation = createContext2(false);
function createCommitCSRFMiddleware(config) {
  return async ({ request, context }, next) => {
    if (request.method !== "GET") {
      return next();
    }
    const bindings = getBindings(context);
    if (!bindings) {
      logger.error("CSRF bindings not available", {
        secretKey: config.secretKey
      });
      throw new Error("Cloudflare bindings not available - context setup issue");
    }
    const secret = bindings[config.secretKey];
    if (!secret) {
      logger.error("CSRF secret not found in bindings", {
        secretKey: config.secretKey,
        availableBindings: Object.keys(bindings),
        bindingsType: typeof bindings,
        hasBindingsObject: !!bindings,
        specificSecretType: typeof bindings[config.secretKey]
      });
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
    context.set(csrfContext, {
      token,
      formDataKey: config.formDataKey,
      headerName: config.headerName
    });
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
      logger.error("CSRF bindings not available", {
        secretKey: config.secretKey
      });
      throw new Error("Cloudflare bindings not available - context setup issue");
    }
    const secret = bindings[config.secretKey];
    if (!secret) {
      logger.error("CSRF secret not found in bindings", {
        secretKey: config.secretKey,
        availableBindings: Object.keys(bindings),
        bindingsType: typeof bindings,
        hasBindingsObject: !!bindings,
        specificSecretType: typeof bindings[config.secretKey]
      });
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
      const clonedFormData = await request.clone().formData();
      const formDataKeys = [];
      clonedFormData.forEach((_, key) => {
        formDataKeys.push(key);
      });
      logger.error("CSRF validation failed", {
        error: errorMessage,
        url: request.url,
        formDataKeys,
        hasCsrfToken: clonedFormData.has(config.formDataKey)
      });
      throw new Response("Token mismatch", { status: 403, statusText: errorMessage });
    }
    return next();
  };
}
function createCSRFMiddleware(config) {
  return [createCommitCSRFMiddleware(config), createValidateCSRFMiddleware(config)];
}
// src/secure/csrf/form.tsx
import { Label } from "@ycore/componentry/vibrant";

// ../../node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if (typeof e == "string" || typeof e == "number")
    n += e;
  else if (typeof e == "object")
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0;t < o; t++)
        e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    } else
      for (f in e)
        e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length;f < o; f++)
    (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
var clsx_default = clsx;

// src/secure/csrf/form.tsx
import React from "react";
import { Form } from "react-router";
import { jsx, jsxs } from "react/jsx-runtime";
var FormFieldContext = React.createContext(null);
function FormField({ label, description, error, className, children }) {
  const id = React.useId();
  const fieldId = `${id}-field`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);
  const contextValue = React.useMemo(() => ({ fieldId, descriptionId, errorId, hasError }), [fieldId, descriptionId, errorId, hasError]);
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child))
      return child;
    const childProps = child.props;
    if (childProps.name) {
      const ariaDescribedBy = [description && descriptionId, error && errorId].filter(Boolean).join(" ") || undefined;
      return React.cloneElement(child, {
        id: childProps.id || fieldId,
        "aria-invalid": hasError || undefined,
        "aria-describedby": ariaDescribedBy,
        "data-error": hasError || undefined
      });
    }
    return child;
  });
  return /* @__PURE__ */ jsx(FormFieldContext.Provider, {
    value: contextValue,
    children: /* @__PURE__ */ jsxs("div", {
      className,
      "data-slot": "form-field",
      children: [
        label && /* @__PURE__ */ jsx(Label, {
          htmlFor: fieldId,
          "data-slot": "form-label",
          "data-error": hasError,
          className: clsx_default(hasError && "text-destructive"),
          children: label
        }),
        enhancedChildren,
        description && !error && /* @__PURE__ */ jsx("p", {
          id: descriptionId,
          "data-slot": "form-description",
          className: "text-muted-foreground text-sm",
          children: description
        }),
        error && /* @__PURE__ */ jsx(FormError, {
          id: errorId,
          error
        })
      ]
    })
  });
}
function FormError({ error, className, id }) {
  if (!error) {
    return null;
  }
  return /* @__PURE__ */ jsx("p", {
    id,
    "data-slot": "form-error",
    className: clsx_default("text-destructive text-sm", className),
    children: error
  });
}
function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error("useFormField must be used within a FormField");
  }
  return context;
}
// src/secure/csrf/SecureFetcher.tsx
import { extractFieldErrors, isError } from "@ycore/forge/result";
import React3 from "react";
import { useFetcher } from "react-router";
import { AuthenticityTokenInput as AuthenticityTokenInput2 } from "remix-utils/csrf/react";

// src/secure/csrf/SecureForm.tsx
import { Label as Label2 } from "@ycore/componentry/vibrant";
import React2 from "react";
import { Form as Form2 } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var SecureFormContext = React2.createContext({ errors: null });
function SecureForm({ children, csrf_name, errors, ...props }) {
  const csrfData = useSecureContext();
  const tokenFieldName = csrf_name ?? csrfData.formDataKey;
  const contextValue = React2.useMemo(() => ({ errors: errors || null }), [errors]);
  return /* @__PURE__ */ jsx2(SecureFormContext.Provider, {
    value: contextValue,
    children: /* @__PURE__ */ jsxs2(Form2, {
      role: "form",
      ...props,
      children: [
        csrfData.token && /* @__PURE__ */ jsx2(AuthenticityTokenInput, {
          name: tokenFieldName
        }),
        errors?.csrf && /* @__PURE__ */ jsx2(SecureFormError, {
          error: errors.csrf,
          className: "mb-4"
        }),
        errors?.form && !errors.csrf && /* @__PURE__ */ jsx2(SecureFormError, {
          error: errors.form,
          className: "mb-4"
        }),
        children
      ]
    })
  });
}
function SecureFormField({ name, label, description, error, required, className, children }) {
  const { errors } = React2.useContext(SecureFormContext);
  const fieldError = error || errors?.[name];
  const errorId = fieldError ? `${name}-error` : undefined;
  return /* @__PURE__ */ jsxs2("div", {
    className: clsx_default("space-y-2", className),
    children: [
      label && /* @__PURE__ */ jsxs2(Label2, {
        htmlFor: name,
        children: [
          label,
          required && /* @__PURE__ */ jsx2("span", {
            className: "ml-1 text-destructive",
            children: "*"
          })
        ]
      }),
      description && /* @__PURE__ */ jsx2("p", {
        className: "text-muted-foreground text-sm",
        children: description
      }),
      React2.Children.map(children, (child) => {
        if (React2.isValidElement(child)) {
          return React2.cloneElement(child, {
            id: child.props.id || name,
            name: child.props.name || name,
            "aria-invalid": fieldError ? true : undefined,
            "aria-describedby": fieldError ? errorId : child.props["aria-describedby"]
          });
        }
        return child;
      }),
      fieldError && /* @__PURE__ */ jsx2("p", {
        id: errorId,
        className: "text-destructive text-sm",
        role: "alert",
        children: fieldError
      })
    ]
  });
}
function SecureFormError({ error, className, id }) {
  if (!error) {
    return null;
  }
  return /* @__PURE__ */ jsx2("p", {
    id,
    "data-slot": "form-error",
    className: clsx_default("text-destructive text-sm", className),
    role: "alert",
    children: error
  });
}

// src/secure/csrf/SecureFetcher.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function useSecureFetcher({ key } = {}) {
  const fetcher = useFetcher({ key });
  const csrfData = useSecureContext();
  const errors = React3.useMemo(() => {
    if (fetcher.data && isError(fetcher.data)) {
      return extractFieldErrors(fetcher.data);
    }
    return null;
  }, [fetcher.data]);
  const submitSecure = React3.useCallback((data, options) => {
    const secureData = new FormData;
    data.forEach((value, key2) => {
      secureData.append(key2, value);
    });
    if (!secureData.has(csrfData.formDataKey) && csrfData.token) {
      secureData.append(csrfData.formDataKey, csrfData.token);
    }
    fetcher.submit(secureData, options);
  }, [fetcher, csrfData.token, csrfData.formDataKey]);
  const SecureForm2 = React3.useMemo(() => React3.forwardRef(({ children, csrf_name, errors: explicitErrors, ...props }, ref) => /* @__PURE__ */ jsx3(SecureFetcherForm, {
    ref,
    fetcher,
    csrf_name,
    errors: explicitErrors || errors,
    ...props,
    children
  })), [fetcher, errors]);
  SecureForm2.displayName = "SecureForm";
  return {
    SecureForm: SecureForm2,
    submitSecure,
    errors,
    data: fetcher.data,
    state: fetcher.state,
    Form: fetcher.Form,
    submit: fetcher.submit,
    load: fetcher.load,
    formData: fetcher.formData,
    formMethod: fetcher.formMethod?.toLowerCase(),
    formAction: fetcher.formAction,
    formEncType: fetcher.formEncType
  };
}
var SecureFetcherForm = React3.forwardRef(({ children, csrf_name, errors, fetcher, className, ...props }, ref) => {
  const csrfData = useSecureContext();
  const tokenFieldName = csrf_name ?? csrfData.formDataKey;
  const FetcherForm = fetcher.Form;
  return /* @__PURE__ */ jsxs3(FetcherForm, {
    ref,
    className,
    ...props,
    children: [
      /* @__PURE__ */ jsx3(AuthenticityTokenInput2, {
        name: tokenFieldName
      }),
      errors?.csrf && /* @__PURE__ */ jsx3(SecureFetcherError, {
        error: errors.csrf,
        className: "mb-4"
      }),
      errors?.form && !errors.csrf && /* @__PURE__ */ jsx3(SecureFetcherError, {
        error: errors.form,
        className: "mb-4"
      }),
      children
    ]
  });
});
SecureFetcherForm.displayName = "SecureFetcherForm";
function SecureFetcherError({ error, className, id }) {
  if (!error) {
    return null;
  }
  return /* @__PURE__ */ jsx3("p", {
    id,
    "data-slot": "form-error",
    className: clsx_default("text-destructive text-sm", className),
    role: "alert",
    children: error
  });
}
// src/secure/csrf/SecureProvider.tsx
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { jsx as jsx4 } from "react/jsx-runtime";
var SecureProvider = ({ children, csrfData }) => {
  const token = csrfData?.token ?? "";
  return /* @__PURE__ */ jsx4(SecureContextProvider, {
    value: csrfData,
    children: /* @__PURE__ */ jsx4(AuthenticityTokenProvider, {
      token,
      children
    })
  });
};
// src/secure/rate-limiter/rate-limiter.config.ts
var defaultRateLimiterConfig = {
  providers: [
    {
      id: "default-kv",
      type: "kv",
      options: {
        kvBinding: "UNCONFIGURED"
      },
      limits: {
        maxRequests: 10,
        windowMs: 60 * 1000
      }
    },
    {
      id: "default-cloudflare",
      type: "cloudflare",
      options: {
        limiterBinding: "UNCONFIGURED"
      }
    }
  ],
  routes: [],
  conditions: {
    skipPaths: ["/favicon.ico"]
  }
};
// src/secure/rate-limiter/rate-limiter.provider.ts
import { err as err3, isError as isError2 } from "@ycore/forge/result";

// src/secure/rate-limiter/providers/cloudflare-rate-limiter.ts
import { err } from "@ycore/forge/result";
import { getBindings as getBindings2 } from "@ycore/forge/services";
var DEFAULT_WINDOW_MS = 60 * 1000;

// src/secure/rate-limiter/providers/kv-rate-limiter.ts
import { err as err2 } from "@ycore/forge/result";
import { getKVStore } from "@ycore/forge/services";

// src/secure/rate-limiter/rate-limiter.provider.ts
function getProviderConfig(config, providerId) {
  return config.providers.find((provider) => provider.id === providerId) || null;
}
// src/secure/index.ts
var SecureForm2 = Object.assign(SecureForm, {
  Field: SecureFormField,
  Error: SecureFormError
});
var Form3 = Object.assign(Form, {
  Field: FormField,
  Error: FormError
});
var SecureFetcher = Object.assign(SecureFetcherForm, {
  Field: SecureFormField,
  Error: SecureFetcherError
});
export {
  useSecureFetcher,
  useSecureContext,
  useFormField,
  skipCSRFValidation,
  getProviderConfig,
  defaultRateLimiterConfig,
  defaultCSRFConfig,
  csrfContext,
  createCSRFMiddleware,
  SecureProvider,
  SecureForm2 as SecureForm,
  SecureFetcher,
  FormError,
  Form3 as Form
};

//# debugId=6E12658C94013AA964756E2164756E21
