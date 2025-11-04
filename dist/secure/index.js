import { jsx, jsxs } from "react/jsx-runtime";
import { Label } from "@ycore/componentry/vibrant";
import React from "react";
import { Form as Form$1, useFetcher } from "react-router";
import { isError, extractFieldErrors } from "@ycore/forge/result";
import { useAuthenticityToken, AuthenticityTokenInput, AuthenticityTokenProvider } from "remix-utils/csrf/react";
const defaultCSRFConfig = {
  secretKey: "UNCONFIGURED",
  cookieName: "__csrf",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    maxAge: void 0
    // Session cookie by default
  }
};
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
const FormFieldContext = React.createContext(null);
function FormField({ label, description, error, className, children }) {
  const id = React.useId();
  const fieldId = `${id}-field`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);
  const contextValue = React.useMemo(() => ({ fieldId, descriptionId, errorId, hasError }), [fieldId, descriptionId, errorId, hasError]);
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const childProps = child.props;
    if (childProps.name) {
      const ariaDescribedBy = [description && descriptionId, error && errorId].filter(Boolean).join(" ") || void 0;
      return React.cloneElement(child, {
        id: childProps.id || fieldId,
        "aria-invalid": hasError || void 0,
        "aria-describedby": ariaDescribedBy,
        "data-error": hasError || void 0
      });
    }
    return child;
  });
  return /* @__PURE__ */ jsx(FormFieldContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsxs("div", { className: clsx("space-y-2", className), "data-slot": "form-field", children: [
    label && /* @__PURE__ */ jsx(Label, { htmlFor: fieldId, "data-slot": "form-label", "data-error": hasError, className: clsx(hasError && "text-destructive"), children: label }),
    enhancedChildren,
    description && !error && /* @__PURE__ */ jsx("p", { id: descriptionId, "data-slot": "form-description", className: "text-muted-foreground text-sm", children: description }),
    error && /* @__PURE__ */ jsx(FormError, { id: errorId, error })
  ] }) });
}
function FormError({ error, className, id }) {
  if (!error) {
    return null;
  }
  return /* @__PURE__ */ jsx("p", { id, "data-slot": "form-error", className: clsx("text-destructive text-sm", className), children: error });
}
function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error("useFormField must be used within a FormField");
  }
  return context;
}
const CSRF_TOKER_ERROR = "Form load error. Please refresh the page or contact support if the issue persists.";
const SecureFormContext = React.createContext({ errors: null });
function SecureForm$1({ children, csrf_name, errors, ...props }) {
  const token = useAuthenticityToken();
  const tokenFieldName = csrf_name ?? "csrf_token";
  const contextValue = React.useMemo(() => ({ errors: errors || null }), [errors]);
  return (
    // if CSRF token is missing, avoid unsecured form
    !token ? /* @__PURE__ */ jsx("div", { role: "alert", className: "rounded-lg border border-destructive bg-destructive/10 p-4", children: /* @__PURE__ */ jsx(SecureFormError, { error: CSRF_TOKER_ERROR }) }) : /* @__PURE__ */ jsx(SecureFormContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsxs(Form$1, { role: "form", ...props, children: [
      /* @__PURE__ */ jsx(AuthenticityTokenInput, { name: tokenFieldName }),
      errors?.csrf && /* @__PURE__ */ jsx(SecureFormError, { error: errors.csrf, className: "mb-4" }),
      errors?.form && !errors.csrf && /* @__PURE__ */ jsx(SecureFormError, { error: errors.form, className: "mb-4" }),
      children
    ] }) })
  );
}
function SecureFormField({ name, label, description, error, required, className, children }) {
  const { errors } = React.useContext(SecureFormContext);
  const fieldError = error || errors?.[name];
  const errorId = fieldError ? `${name}-error` : void 0;
  return /* @__PURE__ */ jsxs("div", { className: clsx("space-y-2", className), children: [
    label && /* @__PURE__ */ jsxs(Label, { htmlFor: name, children: [
      label,
      required && /* @__PURE__ */ jsx("span", { className: "ml-1 text-destructive", children: "*" })
    ] }),
    description && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: description }),
    React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          id: child.props.id || name,
          name: child.props.name || name,
          "aria-invalid": fieldError ? true : void 0,
          "aria-describedby": fieldError ? errorId : child.props["aria-describedby"]
        });
      }
      return child;
    }),
    fieldError && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: fieldError })
  ] });
}
function SecureFormError({ error, className, id }) {
  if (!error) {
    return null;
  }
  return /* @__PURE__ */ jsx("p", { id, "data-slot": "form-error", className: clsx("text-destructive text-sm", className), role: "alert", children: error });
}
function useSecureFetcher({ key } = {}) {
  const fetcher = useFetcher({ key });
  const token = useAuthenticityToken();
  const errors = React.useMemo(() => {
    if (fetcher.data && isError(fetcher.data)) {
      return extractFieldErrors(fetcher.data);
    }
    return null;
  }, [fetcher.data]);
  const submitSecure = React.useCallback(
    (data, options) => {
      const secureData = new FormData();
      data.forEach((value, key2) => {
        secureData.append(key2, value);
      });
      if (!secureData.has("csrf_token") && token) {
        secureData.append("csrf_token", token);
      }
      fetcher.submit(secureData, options);
    },
    [fetcher, token]
  );
  const SecureForm2 = React.useMemo(
    () => React.forwardRef(({ children, csrf_name, errors: explicitErrors, ...props }, ref) => /* @__PURE__ */ jsx(SecureFetcherForm, { ref, fetcher, csrf_name, errors: explicitErrors || errors, ...props, children })),
    [fetcher, errors]
  );
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
const SecureFetcherForm = React.forwardRef(({ children, csrf_name, errors, fetcher, className, ...props }, ref) => {
  const tokenFieldName = csrf_name ?? "csrf_token";
  const FetcherForm = fetcher.Form;
  return /* @__PURE__ */ jsxs(FetcherForm, { ref, className, ...props, children: [
    /* @__PURE__ */ jsx(AuthenticityTokenInput, { name: tokenFieldName }),
    errors?.csrf && /* @__PURE__ */ jsx(SecureFetcherError, { error: errors.csrf, className: "mb-4" }),
    errors?.form && !errors.csrf && /* @__PURE__ */ jsx(SecureFetcherError, { error: errors.form, className: "mb-4" }),
    children
  ] });
});
SecureFetcherForm.displayName = "SecureFetcherForm";
function SecureFetcherError({ error, className, id }) {
  if (!error) {
    return null;
  }
  return /* @__PURE__ */ jsx("p", { id, "data-slot": "form-error", className: clsx("text-destructive text-sm", className), role: "alert", children: error });
}
function createFetcherFieldProps(name, errors) {
  const error = errors?.[name];
  if (!error) {
    return {};
  }
  return { error, "aria-invalid": true, "aria-describedby": `${name}-error` };
}
const SecureProvider = ({ children, token }) => {
  return /* @__PURE__ */ jsx(AuthenticityTokenProvider, { token, children });
};
const defaultRateLimiterConfig = {
  providers: [
    {
      id: "default-kv",
      type: "kv",
      options: {
        kvBinding: "UNCONFIGURED"
      },
      limits: {
        maxRequests: 10,
        windowMs: 60 * 1e3
        // 1 minute window
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
  routes: [
    // Example route configuration (uncomment and customize as needed):
    // {
    //   pattern: '/api/**',
    //   provider: 'default-kv',
    //   methods: ['POST', 'PUT', 'DELETE', 'PATCH'],
    // },
  ],
  conditions: {
    skipPaths: ["/favicon.ico"]
  }
};
const SecureForm = Object.assign(SecureForm$1, {
  Field: SecureFormField,
  Error: SecureFormError
});
const Form = Object.assign(Form$1, {
  Field: FormField,
  Error: FormError
});
const SecureFetcher = Object.assign(SecureFetcherForm, {
  Field: SecureFormField,
  Error: SecureFetcherError
});
export {
  Form,
  FormError,
  FormField,
  SecureFetcher,
  SecureFetcherError,
  SecureForm,
  SecureProvider,
  createFetcherFieldProps,
  defaultCSRFConfig,
  defaultRateLimiterConfig,
  useFormField,
  useSecureFetcher
};
//# sourceMappingURL=index.js.map
