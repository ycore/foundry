import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { DateFormat } from "@ycore/componentry/impetus/intl";
import { Card, Button, Spinner, Input, Badge, AlertDialog, Label, Link, Separator, SvgIcon, InputOtp } from "@ycore/componentry/vibrant";
import { useSecureFetcher, SecureFetcherError, createFetcherFieldProps, SecureForm, FormField, FormError, SecureProvider } from "@ycore/foundry/secure";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Form, useNavigation, useActionData, useLoaderData, useSubmit } from "react-router";
import { decodeBase64url, encodeBase64url } from "@oslojs/encoding";
import { isError, formErrors } from "@ycore/forge/result";
import "@oslojs/crypto/ecdsa";
import "@oslojs/crypto/sha2";
import "@oslojs/webauthn";
import "@ycore/forge/logger";
import { Html, Head, Body, Container, Section, Heading, Text, Link as Link$1 } from "@ycore/componentry/email";
const defaultAuthRoutes = {
  signup: "/auth/signup",
  signin: "/auth/signin",
  signout: "/auth/signout",
  signedin: "/",
  signedout: "/",
  recover: "/auth/recover",
  verify: "/auth/verify",
  profile: "/auth/profile"
};
const defaultAuthConfig = {
  routes: defaultAuthRoutes,
  session: {
    kvBinding: "UNCONFIGURED",
    secretKey: "UNCONFIGURED",
    cookie: {
      name: "__auth_session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: "auto"
      // Will be determined by environment
    }
  },
  webauthn: {
    rpName: "React Router Cloudflare App",
    challengeSessionKey: "challenge",
    requireUserVerification: true
    // More secure
  },
  verification: {
    digits: 6,
    period: 60 * 8,
    // 8 minutes in seconds
    maxAttempts: 3,
    window: 1,
    // ±30 seconds
    resendCooldown: 60
    // seconds
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
function arrayBufferFromObject(obj) {
  if (obj instanceof ArrayBuffer) {
    return obj;
  }
  if (typeof obj === "object" && obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length > 0 && keys.every((key) => /^\d+$/.test(key))) {
      const bytes = Object.values(obj);
      const uint8Array = new Uint8Array(bytes);
      const buffer = new ArrayBuffer(uint8Array.length);
      new Uint8Array(buffer).set(uint8Array);
      return buffer;
    }
  }
  if (typeof obj === "string") {
    const uint8Array = decodeBase64url(obj);
    const buffer = new ArrayBuffer(uint8Array.length);
    new Uint8Array(buffer).set(uint8Array);
    return buffer;
  }
  return new ArrayBuffer(0);
}
function convertServerOptionsToWebAuthn(serverOptions, challengeString) {
  const challengeUint8Array = decodeBase64url(challengeString);
  const challengeBuffer = new ArrayBuffer(challengeUint8Array.length);
  new Uint8Array(challengeBuffer).set(challengeUint8Array);
  return {
    ...serverOptions,
    challenge: challengeBuffer,
    user: {
      ...serverOptions.user,
      id: arrayBufferFromObject(serverOptions.user.id)
    },
    excludeCredentials: serverOptions.excludeCredentials?.map((cred) => ({
      ...cred,
      id: arrayBufferFromObject(cred.id)
    })) || []
  };
}
const WEBAUTHN_REGISTRATION_ERROR_MESSAGES = /* @__PURE__ */ new Map([
  ["NotAllowedError", "Registration was cancelled or timed out. Please try again."],
  ["InvalidStateError", "This authenticator is already registered. Please try a different device."],
  ["NotSupportedError", "This authenticator is not supported. Please try a different device."],
  ["SecurityError", "Security error occurred. Please ensure you are on a secure connection."],
  ["UnknownError", "An unknown error occurred during registration. Please try again."],
  ["ConstraintError", "Authenticator constraints not satisfied. Please try a different device."]
]);
const WEBAUTHN_AUTHENTICATION_ERROR_MESSAGES = /* @__PURE__ */ new Map([
  ["NotAllowedError", "Authentication was cancelled or timed out. Please try again."],
  ["InvalidStateError", "No authenticator found for this account. Please use a registered device."],
  ["NotSupportedError", "This authenticator is not supported for authentication."],
  ["SecurityError", "Security error occurred. Please ensure you are on a secure connection."],
  ["UnknownError", "An unknown error occurred during authentication. Please try again."],
  ["ConstraintError", "Authenticator constraints not satisfied for authentication."]
]);
function transformWebAuthnError(error, errorMessages, defaultMessage) {
  if (!(error instanceof Error)) {
    return new Error(defaultMessage);
  }
  const message = errorMessages.get(error.name) ?? `${defaultMessage}: ${error.message}`;
  return new Error(message);
}
function convertAttestationResponse(credential) {
  const response = credential.response;
  const transports = response.getTransports ? response.getTransports() : [];
  const authenticatorAttachment = credential.authenticatorAttachment;
  return {
    id: credential.id,
    rawId: encodeBase64url(new Uint8Array(credential.rawId)),
    type: credential.type,
    authenticatorAttachment,
    response: {
      attestationObject: encodeBase64url(new Uint8Array(response.attestationObject)),
      clientDataJSON: encodeBase64url(new Uint8Array(response.clientDataJSON)),
      transports
    }
  };
}
function convertAssertionResponse(credential) {
  const response = credential.response;
  return {
    id: credential.id,
    rawId: encodeBase64url(new Uint8Array(credential.rawId)),
    type: credential.type,
    response: {
      authenticatorData: encodeBase64url(new Uint8Array(response.authenticatorData)),
      clientDataJSON: encodeBase64url(new Uint8Array(response.clientDataJSON)),
      signature: encodeBase64url(new Uint8Array(response.signature)),
      userHandle: response.userHandle ? encodeBase64url(new Uint8Array(response.userHandle)) : void 0
    }
  };
}
async function startRegistration(options) {
  try {
    const credential = await navigator.credentials.create({ publicKey: options });
    if (!credential?.response) {
      throw new Error("Failed to create credential");
    }
    return convertAttestationResponse(credential);
  } catch (error) {
    throw transformWebAuthnError(error, WEBAUTHN_REGISTRATION_ERROR_MESSAGES, "Registration failed with an unknown error");
  }
}
async function startAuthentication(options) {
  try {
    const credential = await navigator.credentials.get({
      publicKey: options
    });
    if (!credential?.response) {
      throw new Error("Failed to get credential");
    }
    return convertAssertionResponse(credential);
  } catch (error) {
    throw transformWebAuthnError(error, WEBAUTHN_AUTHENTICATION_ERROR_MESSAGES, "Authentication failed with an unknown error");
  }
}
function isWebAuthnSupported() {
  return !!(typeof window !== "undefined" && window.PublicKeyCredential && navigator?.credentials && typeof navigator.credentials.create === "function" && typeof navigator.credentials.get === "function");
}
async function isPlatformAuthenticatorAvailable() {
  if (!isWebAuthnSupported()) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
function ProfileCard({ user, signoutUrl, verifyUrl, pendingEmailChange }) {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const emailFetcher = useSecureFetcher();
  const cancelFetcher = useSecureFetcher();
  const deleteFetcher = useSecureFetcher();
  const cancelDeleteFetcher = useSecureFetcher();
  const isChangingEmail = emailFetcher.state === "submitting";
  const isCancelling = cancelFetcher.state === "submitting";
  const isDeletingAccount = deleteFetcher.state === "submitting";
  const isCancellingDelete = cancelDeleteFetcher.state === "submitting";
  const handleChangeEmail = () => {
    const formData = new FormData();
    formData.append("intent", "request-email-change");
    formData.append("newEmail", newEmail.trim());
    emailFetcher.submitSecure(formData, { method: "post" });
  };
  const handleCancelChange = () => {
    const formData = new FormData();
    formData.append("intent", "cancel-email-change");
    cancelFetcher.submitSecure(formData, { method: "post" });
  };
  const handleRequestAccountDelete = () => {
    const formData = new FormData();
    formData.append("intent", "request-account-delete");
    deleteFetcher.submitSecure(formData, { method: "post" });
  };
  const handleCancelAccountDelete = () => {
    const formData = new FormData();
    formData.append("intent", "cancel-account-delete");
    cancelDeleteFetcher.submitSecure(formData, { method: "post" });
  };
  useEffect(() => {
    if (emailFetcher.state === "idle" && emailFetcher.data) {
      const data = emailFetcher.data;
      if (data.success) {
        setIsEditingEmail(false);
        setNewEmail("");
      }
    }
  }, [emailFetcher.state, emailFetcher.data]);
  useEffect(() => {
    if (cancelFetcher.state === "idle" && cancelFetcher.data) {
      const data = cancelFetcher.data;
      if (data.success) {
        setIsEditingEmail(false);
      }
    }
  }, [cancelFetcher.state, cancelFetcher.data]);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(Card.Header, { children: /* @__PURE__ */ jsxs(Card.Title, { className: "flex items-end gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground", children: user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?" }),
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", children: user?.displayName || "Profile" })
    ] }) }),
    /* @__PURE__ */ jsxs(Card.Content, { className: "space-y-6", children: [
      pendingEmailChange && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-blue-200 bg-blue-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-blue-900 text-sm", children: "Email Change Pending" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-blue-700 text-xs", children: [
            "Pending verification for: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: pendingEmailChange.newEmail })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-blue-600 text-xs", children: "Visit the verification page and request a code to be sent to your new email address." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "default", size: "sm", children: /* @__PURE__ */ jsx(Link, { href: verifyUrl, children: "Verify Now" }) }),
          /* @__PURE__ */ jsx(Button, { onClick: handleCancelChange, disabled: isCancelling, variant: "ghost", size: "sm", children: isCancelling ? "Cancelling..." : "Cancel" })
        ] })
      ] }) }),
      user?.pending?.type === "account-delete" && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-destructive/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-destructive text-sm", children: "Account Deletion Pending" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-destructive text-xs", children: "Your account deletion request is pending verification." }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-destructive text-xs", children: "Visit the verification page and enter the code sent to your email to confirm deletion." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "destructive", size: "sm", children: /* @__PURE__ */ jsx(Link, { href: verifyUrl, children: "Verify Deletion" }) }),
          /* @__PURE__ */ jsx(Button, { onClick: handleCancelAccountDelete, disabled: isCancellingDelete, variant: "ghost", size: "sm", children: isCancellingDelete ? "Cancelling..." : "Cancel" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-muted-foreground text-sm", children: "Email Address" }),
          !isEditingEmail ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: user?.email }),
            !pendingEmailChange && /* @__PURE__ */ jsx(Button, { onClick: () => setIsEditingEmail(true), variant: "ghost", size: "sm", children: "Change" })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                value: newEmail,
                onChange: (e) => setNewEmail(e.target.value),
                placeholder: "Enter new email address",
                type: "email",
                className: "h-9",
                ...createFetcherFieldProps("newEmail", emailFetcher.errors)
              }
            ),
            /* @__PURE__ */ jsx(SecureFetcherError, { error: emailFetcher.errors?.newEmail }),
            emailFetcher.errors?.form && /* @__PURE__ */ jsx(SecureFetcherError, { error: emailFetcher.errors.form }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleChangeEmail, disabled: isChangingEmail || !newEmail.trim(), size: "sm", children: isChangingEmail ? "Sending..." : "Send Verification" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => {
                    setIsEditingEmail(false);
                    setNewEmail("");
                  },
                  children: "Cancel"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-6", children: [
          user?.createdAt && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-muted-foreground text-sm", children: "Since" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: /* @__PURE__ */ jsx(DateFormat.Long, { date: user.createdAt }) })
          ] }),
          user?.status === "active" ? /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "h-8 px-4 text-primary", children: "Verified Account" }) : /* @__PURE__ */ jsx(Button, { asChild: true, variant: "default", size: "sm", className: "bg-amber-600 hover:bg-amber-700", children: /* @__PURE__ */ jsx(Link, { href: verifyUrl, children: "Verify Email" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Form, { method: "post", action: signoutUrl, children: /* @__PURE__ */ jsx(Button, { type: "submit", variant: "secondary", size: "sm", children: "Sign Out" }) }) })
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsx(Card.Footer, { children: !pendingEmailChange && user?.pending?.type !== "account-delete" && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-destructive/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs(AlertDialog, { children: [
        /* @__PURE__ */ jsx(AlertDialog.Trigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "destructive", size: "sm", disabled: isDeletingAccount, children: isDeletingAccount ? "Processing..." : "Delete Account" }) }),
        /* @__PURE__ */ jsxs(AlertDialog.Content, { children: [
          /* @__PURE__ */ jsxs(AlertDialog.Header, { children: [
            /* @__PURE__ */ jsx(AlertDialog.Title, { children: "Delete Account" }),
            /* @__PURE__ */ jsx(AlertDialog.Description, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-destructive", children: "This action cannot be undone." }),
              /* @__PURE__ */ jsx("p", { children: "Deleting your account will:" }),
              /* @__PURE__ */ jsxs("ul", { className: "list-disc space-y-1 pl-5 text-sm", children: [
                /* @__PURE__ */ jsx("li", { children: "Permanently remove all your account data" }),
                /* @__PURE__ */ jsx("li", { children: "Delete all registered passkeys and authenticators" }),
                /* @__PURE__ */ jsx("li", { children: "Sign you out immediately after verification" }),
                /* @__PURE__ */ jsx("li", { children: "Make your email address available for new registrations" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm", children: "You will receive a verification code via email to confirm this action." })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(AlertDialog.Footer, { children: [
            /* @__PURE__ */ jsx(AlertDialog.Cancel, { children: "Cancel" }),
            /* @__PURE__ */ jsx(AlertDialog.Action, { onClick: handleRequestAccountDelete, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Continue to Verification" })
          ] })
        ] })
      ] }) }),
      deleteFetcher.errors?.form && /* @__PURE__ */ jsx(SecureFetcherError, { error: deleteFetcher.errors.form }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-destructive/80 text-xs", children: "Permanently delete your account and all associated data." })
    ] }) }) })
  ] });
}
function AuthenticatorsCard({ authenticators, profileUrl }) {
  const addFetcher = useSecureFetcher();
  const renameFetcher = useSecureFetcher();
  const deleteFetcher = useSecureFetcher();
  const optionsFetcher = useSecureFetcher();
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [webAuthnError, setWebAuthnError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [processedFetcherId, setProcessedFetcherId] = useState(null);
  const abortControllerRef = useRef(null);
  const freshCsrfTokenRef = useRef(null);
  useEffect(() => {
    const currentFetcherId = optionsFetcher.state + JSON.stringify(optionsFetcher.data);
    if (optionsFetcher.data && pendingAction && processedFetcherId !== currentFetcherId) {
      setProcessedFetcherId(currentFetcherId);
      const performWebAuthnRegistration = async () => {
        try {
          setIsRegistering(true);
          setWebAuthnError(null);
          abortControllerRef.current = new AbortController();
          const responseData = optionsFetcher.data;
          if (!responseData || !responseData.challenge || !responseData.options) {
            console.error("Invalid options response structure:", responseData);
            throw new Error("Invalid response from server. Please try again.");
          }
          const { challenge, options, csrfToken: freshCsrfToken } = responseData;
          if (freshCsrfToken) {
            freshCsrfTokenRef.current = freshCsrfToken;
          }
          let webAuthnOptions;
          try {
            webAuthnOptions = convertServerOptionsToWebAuthn(options, challenge);
          } catch (conversionError) {
            console.error("Options conversion failed:", conversionError);
            throw new Error("Failed to process registration options. Please try again.");
          }
          const timeoutPromise = new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error("Registration timed out. Please try again."));
            }, 6e4);
            abortControllerRef.current?.signal.addEventListener("abort", () => {
              clearTimeout(timeoutId);
            });
          });
          const credential = await Promise.race([startRegistration(webAuthnOptions), timeoutPromise]);
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
          const formData = new FormData();
          if (pendingAction.type === "add") {
            formData.append("intent", "add-passkey");
            formData.append("challenge", challenge);
            formData.append("credentialData", JSON.stringify(credential));
            if (freshCsrfTokenRef.current) {
              formData.append("csrf_token", freshCsrfTokenRef.current);
            }
            addFetcher.submitSecure(formData, { method: "post", action: profileUrl });
          }
          setPendingAction(null);
          setIsRegistering(false);
        } catch (error) {
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
          setIsRegistering(false);
          setPendingAction(null);
          let errorMessage = "Registration failed";
          if (error instanceof Error) {
            if (error.message.includes("cancelled")) {
              errorMessage = "Registration was cancelled. Please try again when ready.";
            } else if (error.message.includes("timed out")) {
              errorMessage = error.message;
            } else if (error.message.includes("already registered")) {
              errorMessage = "This authenticator is already registered.";
            } else {
              errorMessage = error.message;
            }
          }
          setWebAuthnError(errorMessage);
        }
      };
      performWebAuthnRegistration();
    }
  }, [optionsFetcher.data, optionsFetcher.state, pendingAction, processedFetcherId, addFetcher]);
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    if (addFetcher.data && addFetcher.state === "idle") {
      setWebAuthnError(null);
      setIsRegistering(false);
    }
    if (addFetcher.state === "idle" && addFetcher.errors?.form) {
      setWebAuthnError(addFetcher.errors.form);
      setIsRegistering(false);
    }
  }, [addFetcher.data, addFetcher.state, addFetcher.errors]);
  const handleAddPasskey = () => {
    setWebAuthnError(null);
    if (!isWebAuthnSupported()) {
      setWebAuthnError("WebAuthn is not supported on this device");
      return;
    }
    setPendingAction({ type: "add" });
    const formData = new FormData();
    formData.append("intent", "add-passkey-options");
    optionsFetcher.submitSecure(formData, { method: "post", action: profileUrl });
  };
  const handleStartEdit = (authenticator) => {
    setEditingId(authenticator.id);
    setEditingName(authenticator.name || "");
  };
  const handleSaveEdit = () => {
    if (!editingId) return;
    const formData = new FormData();
    formData.append("intent", "rename-passkey");
    formData.append("authenticatorId", editingId);
    formData.append("name", editingName.trim());
    renameFetcher.submitSecure(formData, { method: "post", action: profileUrl });
    setEditingId(null);
    setEditingName("");
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };
  const handleDeletePasskey = (authenticatorId) => {
    const formData = new FormData();
    formData.append("intent", "delete-passkey");
    formData.append("authenticatorId", authenticatorId);
    deleteFetcher.submitSecure(formData, { method: "post", action: profileUrl });
  };
  const isAddingPasskey = addFetcher.state === "submitting" || isRegistering || optionsFetcher.state !== "idle" && pendingAction?.type === "add";
  const isRenamingPasskey = renameFetcher.state === "submitting";
  const isDeletingPasskey = (id) => deleteFetcher.state === "submitting" && deleteFetcher.formData?.get("authenticatorId") === id;
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(Card.Header, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Card.Title, { className: "flex items-center", children: "Passkeys" }),
        /* @__PURE__ */ jsx(Card.Description, { children: "Security keys and devices used to sign in to your account" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleAddPasskey, disabled: isAddingPasskey || authenticators.length >= 10 || isClient && !isWebAuthnSupported(), size: "sm", children: [
        /* @__PURE__ */ jsx(Spinner, { className: clsx("mr-1 size-4", !isAddingPasskey && "hidden") }),
        isAddingPasskey ? isRegistering ? "Setting up..." : "Adding..." : "Add Passkey"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(Card.Content, { children: [
      webAuthnError && /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-lg border border-destructive p-3", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-destructive text-sm", children: "Registration Failed" }),
        /* @__PURE__ */ jsx(SecureFetcherError, { error: webAuthnError, className: "mt-1 text-destructive text-xs" })
      ] }),
      addFetcher.errors?.form && !webAuthnError && /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(SecureFetcherError, { error: addFetcher.errors.form }) }),
      deleteFetcher.errors?.form && /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(SecureFetcherError, { error: deleteFetcher.errors.form }) }),
      isRegistering && /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Spinner, { className: "size-4" }),
          /* @__PURE__ */ jsx("span", { children: "Please set up your authenticator..." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs", children: "Follow the prompts to create a passkey on your device." })
      ] }),
      authenticators.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
        /* @__PURE__ */ jsx("h4", { className: "mb-2 font-medium text-muted-foreground", children: "No passkeys registered" }),
        /* @__PURE__ */ jsx("p", { className: "max-w-sm text-muted-foreground text-sm", children: "Add a security key or biometric device to secure your account" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: authenticators.map((auth) => /* @__PURE__ */ jsx("div", { className: "rounded-lg border p-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: editingId === auth.id ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: editingName,
                  onChange: (e) => setEditingName(e.target.value),
                  className: "h-8 w-48",
                  placeholder: "Enter passkey name",
                  ...createFetcherFieldProps("name", renameFetcher.errors)
                }
              ),
              /* @__PURE__ */ jsx(Button, { size: "sm", onClick: handleSaveEdit, disabled: isRenamingPasskey, children: isRenamingPasskey ? "Saving..." : "Save" }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: handleCancelEdit, children: "Cancel" })
            ] }),
            /* @__PURE__ */ jsx(SecureFetcherError, { error: renameFetcher.errors?.name, className: "text-xs" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm", children: auth.name }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "•" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs uppercase", children: auth.credentialDeviceType }),
            auth.credentialBackedUp && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: "Synced" })
          ] }) }),
          editingId !== auth.id && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleStartEdit(auth), className: "h-8 px-2", children: "Edit" }),
            /* @__PURE__ */ jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsx(AlertDialog.Trigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-8 px-2 text-destructive hover:text-destructive", disabled: authenticators.length <= 1 || isDeletingPasskey(auth.id), children: isDeletingPasskey(auth.id) ? "Deleting..." : "Delete" }) }),
              /* @__PURE__ */ jsxs(AlertDialog.Content, { children: [
                /* @__PURE__ */ jsxs(AlertDialog.Header, { children: [
                  /* @__PURE__ */ jsx(AlertDialog.Title, { children: "Delete Passkey" }),
                  /* @__PURE__ */ jsx(AlertDialog.Description, { asChild: true, children: /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("p", { children: [
                      'Are you sure you want to delete "',
                      auth.name,
                      '"? This action cannot be undone.'
                    ] }),
                    authenticators.length <= 1 && /* @__PURE__ */ jsx("p", { className: "mt-2 text-destructive text-sm", children: "You cannot delete your last passkey as it would lock you out of your account." })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs(AlertDialog.Footer, { children: [
                  /* @__PURE__ */ jsx(AlertDialog.Cancel, { children: "Cancel" }),
                  /* @__PURE__ */ jsx(AlertDialog.Action, { onClick: () => handleDeletePasskey(auth.id), className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Delete Passkey" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: auth.transports.map((transport) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: transport.toUpperCase() }, transport)) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-muted-foreground text-xs", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Added:" }),
            /* @__PURE__ */ jsx(DateFormat.Medium, { date: auth.createdAt })
          ] }),
          auth.lastUsedAt ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Last used:" }),
            /* @__PURE__ */ jsx(DateFormat.Medium, { date: auth.lastUsedAt })
          ] }) : /* @__PURE__ */ jsx("span", { children: "Never used" })
        ] })
      ] }) }, auth.id)) }),
      authenticators.length >= 10 && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg bg-muted p-3", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "You have reached the maximum limit of 10 passkeys. Delete an existing passkey to add a new one." }) })
    ] })
  ] });
}
function ProfilePage({ children }) {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-bold text-2xl tracking-tight", children: "Account Settings" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage your account information and security settings" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children })
  ] });
}
function RecoverForm({ signinUrl }) {
  const navigation = useNavigation();
  const actionData = useActionData();
  const isSubmitting = navigation.state === "submitting";
  const errors = isError(actionData) ? formErrors(actionData) : {};
  return /* @__PURE__ */ jsxs(SecureForm, { method: "post", className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsx("input", { type: "hidden", name: "intent", value: "recover" }),
    /* @__PURE__ */ jsx(FormField, { label: "Email", error: errors.email, children: /* @__PURE__ */ jsx(Input, { name: "email", type: "email", placeholder: "Enter your email", autoComplete: "email", required: true, autoFocus: true }) }),
    errors.form && /* @__PURE__ */ jsx(FormError, { error: errors.form }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-x-2", children: [
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, className: "flex-1", children: isSubmitting ? "Sending Recovery Code..." : "Send Recovery Code" }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, disabled: isSubmitting, children: /* @__PURE__ */ jsx(Link, { href: signinUrl, children: "Sign In" }) })
    ] })
  ] });
}
function RecoverPage({ children, title = "Account Recovery", description = "Lost access to your passkeys? Enter your registered email to recover access." }) {
  const loaderData = useLoaderData();
  const token = isError(loaderData) ? "" : loaderData?.token ?? "";
  return /* @__PURE__ */ jsx(SecureProvider, { token, children: /* @__PURE__ */ jsx("div", { className: "mx-auto min-w-md max-w-lg px-4 py-8", children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(Card.Header, { children: [
      /* @__PURE__ */ jsx(Card.Title, { children: title }),
      /* @__PURE__ */ jsx(Card.Description, { children: description })
    ] }),
    /* @__PURE__ */ jsx(Card.Content, { children })
  ] }) }) });
}
const WEBAUTHN_ALGORITHMS = {
  ES256: -7,
  RS256: -257
};
const WEBAUTHN_CONFIG = {
  CHALLENGE_TIMEOUT: 6e4,
  // 32 bytes
  USER_ID_SIZE: 16
};
function toArrayBuffer(uint8Array) {
  const buffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(buffer).set(uint8Array);
  return buffer;
}
function generateUserId() {
  const bytes = new Uint8Array(WEBAUTHN_CONFIG.USER_ID_SIZE);
  crypto.getRandomValues(bytes);
  return encodeBase64url(bytes);
}
function createRegistrationOptions(rpName, rpId, userName, userDisplayName, challenge, excludeCredentials = []) {
  return {
    challenge: toArrayBuffer(decodeBase64url(challenge)),
    rp: {
      name: rpName,
      id: rpId
    },
    user: {
      id: toArrayBuffer(decodeBase64url(generateUserId())),
      name: userName,
      displayName: userDisplayName
    },
    pubKeyCredParams: [
      { alg: WEBAUTHN_ALGORITHMS.ES256, type: "public-key" },
      { alg: WEBAUTHN_ALGORITHMS.RS256, type: "public-key" }
    ],
    timeout: WEBAUTHN_CONFIG.CHALLENGE_TIMEOUT,
    attestation: "none",
    excludeCredentials: excludeCredentials.map((cred) => ({
      id: toArrayBuffer(decodeBase64url(cred.id)),
      type: "public-key",
      // Use actual transports if available, otherwise omit (let browser decide)
      ...cred.transports && cred.transports.length > 0 ? { transports: cred.transports } : {}
    })),
    authenticatorSelection: {
      residentKey: "discouraged",
      requireResidentKey: false,
      userVerification: "preferred"
    }
  };
}
function createAuthenticationOptions(rpId, challenge, allowCredentials = []) {
  return {
    challenge: toArrayBuffer(decodeBase64url(challenge)),
    rpId,
    timeout: WEBAUTHN_CONFIG.CHALLENGE_TIMEOUT,
    userVerification: "preferred",
    allowCredentials: allowCredentials.length > 0 ? allowCredentials.map((cred) => ({
      id: toArrayBuffer(decodeBase64url(cred.id)),
      type: "public-key",
      // Use actual transports if available, otherwise omit (let browser decide)
      ...cred.transports && cred.transports.length > 0 ? { transports: cred.transports } : {}
    })) : []
  };
}
function SignInForm({ signupUrl, recoverUrl }) {
  const navigation = useNavigation();
  const submit = useSubmit();
  const actionData = useActionData();
  const loaderData = useLoaderData();
  const isSubmitting = navigation.state === "submitting";
  const errors = isError(actionData) ? formErrors(actionData) : {};
  const [webAuthnSupported, setWebAuthnSupported] = React.useState(false);
  const [webAuthnError, setWebAuthnError] = React.useState(null);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = React.useState(false);
  const abortControllerRef = React.useRef(null);
  React.useEffect(() => {
    const checkWebAuthn = async () => {
      const supported = isWebAuthnSupported();
      setWebAuthnSupported(supported);
      if (supported) {
        const isPlatformAvailable = await isPlatformAuthenticatorAvailable();
        setPlatformAuthAvailable(isPlatformAvailable);
      }
    };
    checkWebAuthn();
  }, []);
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  React.useEffect(() => {
    if (isError(actionData)) {
      setIsAuthenticating(false);
      setWebAuthnError(null);
    }
  }, [actionData]);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setWebAuthnError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email")?.toString();
    if (!email) {
      setWebAuthnError("Email is required");
      return;
    }
    if (!webAuthnSupported) {
      setWebAuthnError("WebAuthn is not supported on this device");
      return;
    }
    if (!loaderData?.challenge) {
      setWebAuthnError("Session expired. Please refresh the page.");
      return;
    }
    try {
      setIsAuthenticating(true);
      setWebAuthnError(null);
      abortControllerRef.current = new AbortController();
      const options = createAuthenticationOptions(
        window.location.hostname,
        loaderData.challenge,
        []
        // Will be populated server-side in the future
      );
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Authentication timed out. Please try again."));
        }, 6e4);
        abortControllerRef.current?.signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
        });
      });
      const credential = await Promise.race([startAuthentication(options), timeoutPromise]);
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      const submitFormData = new FormData(form);
      submitFormData.append("webauthn_response", JSON.stringify(credential));
      submitFormData.append("intent", "signin");
      submit(submitFormData, { method: "post" });
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      setIsAuthenticating(false);
      let errorMessage = "Authentication failed";
      if (error instanceof Error) {
        if (error.message.includes("cancelled")) {
          errorMessage = "Authentication was cancelled. Please try again when ready.";
        } else if (error.message.includes("timed out")) {
          errorMessage = error.message;
        } else if (error.message.includes("not found")) {
          errorMessage = "No authenticator found for this account. Please sign up first.";
        } else {
          errorMessage = error.message;
        }
      }
      setWebAuthnError(errorMessage);
    }
  };
  return /* @__PURE__ */ jsxs(SecureForm, { method: "post", onSubmit: handleSubmit, className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsx(FormField, { label: "Email", error: errors.email, children: /* @__PURE__ */ jsx(Input, { name: "email", type: "email", placeholder: "Enter your email", autoComplete: "email webauthn", required: true, autoFocus: true }) }),
    (errors.form || webAuthnError) && /* @__PURE__ */ jsx(FormError, { error: errors.form || webAuthnError }),
    isAuthenticating && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Spinner, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { children: "Please interact with your authenticator..." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs", children: "Touch your security key or approve the prompt on your device." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-x-2", children: [
      /* @__PURE__ */ jsxs(Button, { type: "submit", name: "intent", value: "signin", disabled: isSubmitting || isAuthenticating || !webAuthnSupported, className: "flex-1", children: [
        /* @__PURE__ */ jsx(Spinner, { className: clsx("size-5", !(isSubmitting || isAuthenticating) && "hidden") }),
        isSubmitting || isAuthenticating ? "Authenticating..." : !webAuthnSupported ? "WebAuthn unsupported" : "Passkey Sign in"
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, disabled: isSubmitting || isAuthenticating, children: /* @__PURE__ */ jsx(Link, { href: signupUrl, children: "Sign Up" }) })
    ] }),
    webAuthnSupported && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-muted-foreground text-xs", children: [
      platformAuthAvailable ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(SvgIcon, { iconId: "CircleCheck", className: "h-4 w-4 text-green-500" }),
        "Platform authenticator available"
      ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(SvgIcon, { iconId: "CircleAlert", className: "h-4 w-4 text-yellow-500" }),
        "External security key required"
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsx(Link, { href: recoverUrl, children: "Recover access" }) })
    ] })
  ] });
}
function SignInPage({ children, title = "Sign In", description = "Sign in to your account with your passkey" }) {
  const loaderData = useLoaderData();
  const token = isError(loaderData) ? "" : loaderData?.token ?? "";
  return /* @__PURE__ */ jsx(SecureProvider, { token, children: /* @__PURE__ */ jsx("div", { className: "mx-auto min-w-md max-w-lg px-4 py-8", children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(Card.Header, { children: [
      /* @__PURE__ */ jsx(Card.Title, { children: title }),
      /* @__PURE__ */ jsx(Card.Description, { children: description })
    ] }),
    /* @__PURE__ */ jsx(Card.Content, { children })
  ] }) }) });
}
function SignUpForm({ signinUrl, recoverUrl }) {
  const navigation = useNavigation();
  const submit = useSubmit();
  const actionData = useActionData();
  const loaderData = useLoaderData();
  const isSubmitting = navigation.state === "submitting";
  const errors = isError(actionData) ? formErrors(actionData) : {};
  const [webAuthnSupported, setWebAuthnSupported] = React.useState(false);
  const [webAuthnError, setWebAuthnError] = React.useState(null);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = React.useState(false);
  const abortControllerRef = React.useRef(null);
  React.useEffect(() => {
    const checkWebAuthn = async () => {
      const supported = isWebAuthnSupported();
      setWebAuthnSupported(supported);
      if (supported) {
        const isPlatformAvailable = await isPlatformAuthenticatorAvailable();
        setPlatformAuthAvailable(isPlatformAvailable);
      }
    };
    checkWebAuthn();
  }, []);
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  React.useEffect(() => {
    if (isError(actionData)) {
      setIsRegistering(false);
      setWebAuthnError(null);
    }
  }, [actionData]);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setWebAuthnError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email")?.toString();
    const displayName = formData.get("displayName")?.toString();
    if (!email || !displayName) {
      setWebAuthnError("Email and display name are required");
      return;
    }
    if (!webAuthnSupported) {
      setWebAuthnError("WebAuthn is not supported on this device");
      return;
    }
    if (!loaderData?.challenge) {
      setWebAuthnError("Session expired. Please refresh the page.");
      return;
    }
    try {
      setIsRegistering(true);
      setWebAuthnError(null);
      abortControllerRef.current = new AbortController();
      const options = createRegistrationOptions(
        window.location.hostname,
        window.location.hostname,
        email,
        displayName,
        loaderData.challenge,
        []
        // Exclude credentials (none for new users)
      );
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Registration timed out. Please try again."));
        }, 6e4);
        abortControllerRef.current?.signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
        });
      });
      const credential = await Promise.race([startRegistration(options), timeoutPromise]);
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      const submitFormData = new FormData(form);
      submitFormData.append("webauthn_response", JSON.stringify(credential));
      submitFormData.append("intent", "signup");
      submit(submitFormData, { method: "post" });
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      setIsRegistering(false);
      let errorMessage = "Registration failed";
      if (error instanceof Error) {
        if (error.message.includes("cancelled")) {
          errorMessage = "Registration was cancelled. Please try again when ready.";
        } else if (error.message.includes("timed out")) {
          errorMessage = error.message;
        } else if (error.message.includes("already registered")) {
          errorMessage = "This authenticator is already registered. Please sign in instead.";
        } else {
          errorMessage = error.message;
        }
      }
      setWebAuthnError(errorMessage);
    }
  };
  return /* @__PURE__ */ jsxs(SecureForm, { method: "post", onSubmit: handleSubmit, className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsx(FormField, { label: "Email", error: errors.email, children: /* @__PURE__ */ jsx(Input, { name: "email", type: "email", placeholder: "Enter your email", autoComplete: "email webauthn", required: true, autoFocus: true }) }),
    /* @__PURE__ */ jsx(FormField, { label: "Display Name", error: errors.displayName, children: /* @__PURE__ */ jsx(Input, { name: "displayName", type: "text", placeholder: "Enter your display name", autoComplete: "name", required: true }) }),
    (errors.form || webAuthnError) && /* @__PURE__ */ jsx(FormError, { error: errors.form || webAuthnError }),
    isRegistering && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Spinner, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { children: "Please set up your authenticator..." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs", children: "Follow the prompts to create a passkey on your device." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between gap-x-2", children: [
      /* @__PURE__ */ jsxs(Button, { type: "submit", name: "intent", value: "signup", disabled: isSubmitting || isRegistering || !webAuthnSupported, className: "flex-1", children: [
        /* @__PURE__ */ jsx(Spinner, { className: clsx("size-5", !(isSubmitting || isRegistering) && "hidden") }),
        isSubmitting || isRegistering ? "Creating account..." : !webAuthnSupported ? "WebAuthn unsupported" : "Passkey Sign up"
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, disabled: isSubmitting || isRegistering, children: /* @__PURE__ */ jsx(Link, { href: signinUrl, children: "Sign In" }) })
    ] }),
    webAuthnSupported && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-muted-foreground text-xs", children: [
      platformAuthAvailable ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(SvgIcon, { iconId: "CircleCheck", className: "h-4 w-4 text-green-500" }),
        "Platform authenticator available"
      ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(SvgIcon, { iconId: "CircleAlert", className: "h-4 w-4 text-yellow-500" }),
        "External security key required"
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsx(Link, { href: recoverUrl, children: "Recover access" }) })
    ] })
  ] });
}
function SignUpPage({ children, title = "Create Account", description = "Sign up for a new account with your passkey" }) {
  const loaderData = useLoaderData();
  const token = isError(loaderData) ? "" : loaderData?.token ?? "";
  return /* @__PURE__ */ jsx(SecureProvider, { token, children: /* @__PURE__ */ jsx("div", { className: "mx-auto min-w-md max-w-lg px-4 py-8", children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(Card.Header, { children: [
      /* @__PURE__ */ jsx(Card.Title, { children: title }),
      /* @__PURE__ */ jsx(Card.Description, { children: description })
    ] }),
    /* @__PURE__ */ jsx(Card.Content, { children })
  ] }) }) });
}
function VerifyForm({ email, purpose = "signup", resendCooldown: initialCooldown = 60, period = 480, digits = 6, actionData }) {
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const errors = actionData && isError(actionData) ? formErrors(actionData) : {};
  useEffect(() => {
    if (actionData && !isError(actionData) && typeof actionData === "object" && "resent" in actionData && actionData.resent) {
      setResendCooldown(initialCooldown);
    }
  }, [actionData, initialCooldown]);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1e3);
    return () => clearInterval(interval);
  }, [resendCooldown]);
  const purposeLabels = {
    signup: "Email Verification",
    "passkey-add": "Confirm Adding Passkey",
    "passkey-delete": "Confirm Removing Passkey",
    "email-change": "Verify New Email",
    "account-delete": "Confirm Account Deletion",
    recovery: "Recover Account"
  };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-md space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-bold text-3xl tracking-tight", children: purposeLabels[purpose] }),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        digits,
        "-digit verification code for ",
        /* @__PURE__ */ jsx("strong", { className: "text-nowrap", children: email })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(SecureForm, { method: "post", className: "space-y-4", errors, children: [
      /* @__PURE__ */ jsx(Input, { type: "hidden", name: "email", value: email }),
      /* @__PURE__ */ jsx(Input, { type: "hidden", name: "purpose", value: purpose }),
      /* @__PURE__ */ jsx(SecureForm.Field, { label: "Verification Code", name: "code", error: errors.code, className: "flex flex-col items-center", children: /* @__PURE__ */ jsxs(InputOtp, { value: code, onValueChange: setCode, autoComplete: "one-time-code", validationType: "numeric", disabled: false, children: [
        /* @__PURE__ */ jsx(InputOtp.Group, { children: Array.from({ length: digits }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: acceptable
          /* @__PURE__ */ jsx(InputOtp.Slot, { index }, index)
        )) }),
        /* @__PURE__ */ jsx(InputOtp.HiddenInput, { name: "code" })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-around", children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", name: "intent", value: "resend", variant: code.length !== digits ? "default" : "outline", disabled: resendCooldown > 0, formNoValidate: true, children: resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", name: "intent", value: "verify", variant: code.length !== digits ? "outline" : "default", disabled: code.length !== digits, children: "Verify Code" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(Button, { type: "submit", name: "intent", value: "unverify", variant: "destructive", formNoValidate: true, children: "Unverify Email" }) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-muted-foreground text-sm", children: [
        "The code expires within ",
        Math.floor(period / 60),
        " minutes"
      ] })
    ] })
  ] });
}
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
const TAILWIND_TO_CSS_MAP = {
  "m-0": { "margin": "0rem" },
  "m-3": { "margin": "0.75rem" },
  "m-4": { "margin": "1rem" },
  "m-5": { "margin": "1.25rem" },
  "mx-2": { "marginInline": "0.5rem" },
  "mx-5": { "marginInline": "1.25rem" },
  "mx-auto": { "marginInline": "auto" },
  "my-5": { "marginBlock": "1.25rem" },
  "max-w-2xl": { "maxWidth": "42rem" },
  "max-w-md": { "maxWidth": "28rem" },
  "rounded-2xl": { "borderRadius": "1rem" },
  "rounded-lg": { "borderRadius": "0.625rem" },
  "border-2": { "borderStyle": "solid", "borderWidth": "2px" },
  "border-border": { "borderColor": "oklch(70.7% 0.022 261.325)" },
  "bg-muted": { "backgroundColor": "oklch(87.2% 0.01 258.338)" },
  "bg-white": { "backgroundColor": "#fff" },
  "p-3": { "padding": "0.75rem" },
  "p-5": { "padding": "1.25rem" },
  "px-5": { "paddingInline": "1.25rem" },
  "py-5": { "paddingBlock": "1.25rem" },
  "pt-10": { "paddingTop": "2.5rem" },
  "pb-5": { "paddingBottom": "1.25rem" },
  "text-center": { "textAlign": "center" },
  "text-left": { "textAlign": "left" },
  "font-sans": { "fontFamily": "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',\n    'Noto Color Emoji'" },
  "text-3xl": { "fontSize": "1.875rem", "lineHeight": "var(--text-3xl--line-height)" },
  "text-sm": { "fontSize": "0.875rem", "lineHeight": "var(--text-sm--line-height)" },
  "leading-relaxed": { "lineHeight": "1.625" },
  "font-bold": { "fontWeight": "700" },
  "text-destructive": { "color": "oklch(50.5% 0.213 27.518)" },
  "text-foreground": { "color": "oklch(27.8% 0.033 256.848)" },
  "text-muted-foreground": { "color": "oklch(55.1% 0.027 264.364)" },
  "italic": { "fontStyle": "italic" },
  "no-underline": { "textDecorationLine": "none" },
  "underline": { "textDecorationLine": "underline" },
  "dark": { "color": "color-mix(in lab, red, red)) {\n    & {\n      --border: color-mix(in oklab, oklch(96.7% 0.003 264.542) 10%, transparent)" }
};
const DYNAMIC_UTILITY_PATTERNS = [
  {
    regex: /^text-\[(.+?)\]$/,
    converter: (matches) => ({ fontSize: matches[1] })
  },
  {
    regex: /^tracking-\[(.+?)\]$/,
    converter: (matches) => ({ letterSpacing: matches[1] })
  }
];
const TEMPLATE_STYLES_MAP = {
  cssMap: TAILWIND_TO_CSS_MAP,
  dynamicPatterns: DYNAMIC_UTILITY_PATTERNS
};
const totpRepository = {
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
const TotpEmailTemplate = defineEmailTemplate({
  component: ({ code, purpose }) => {
    const content = totpRepository[purpose];
    const isHighRisk = purpose === "account-delete" || purpose === "passkey-delete";
    const isAccountDelete = purpose === "account-delete";
    return /* @__PURE__ */ jsxs(Html, { lang: "en", children: [
      /* @__PURE__ */ jsx(Head, {}),
      /* @__PURE__ */ jsx(Body, { className: "bg-white font-sans", children: /* @__PURE__ */ jsxs(Container, { className: `mx-auto max-w-2xl text-foreground leading-relaxed ${isAccountDelete ? "rounded-lg border-2 border-warning-200 bg-warning-100 p-5" : ""}`, children: [
        /* @__PURE__ */ jsx(Section, { className: "px-5 pt-10 pb-5 text-center", children: /* @__PURE__ */ jsx(Heading, { level: 1, children: content.title }) }),
        /* @__PURE__ */ jsx(Section, { className: "px-5 pb-5 text-center text-muted-foreground", children: /* @__PURE__ */ jsx(Text, { children: content.message }) }),
        /* @__PURE__ */ jsx(Section, { className: "mx-5 my-5 rounded-lg border-2 border-border bg-muted p-5 text-center", children: /* @__PURE__ */ jsx(Text, { className: "m-0 font-bold text-3xl text-foreground tracking-[8px]", children: code }) }),
        /* @__PURE__ */ jsxs(Section, { className: "px-5 py-5 text-center text-muted-foreground text-sm", children: [
          /* @__PURE__ */ jsxs(Text, { children: [
            "This code will expire within ",
            /* @__PURE__ */ jsx("strong", { children: "8 minutes" }),
            " of issuing."
          ] }),
          /* @__PURE__ */ jsxs(Text, { children: [
            "If this code was not requested,",
            isHighRisk ? " consider securing your account" : " it can be safely ignored",
            "."
          ] })
        ] })
      ] }) })
    ] });
  },
  subject: ({ purpose }) => totpRepository[purpose].title,
  stylesMap: TEMPLATE_STYLES_MAP
});
const EmailChangeNotificationTemplate = defineEmailTemplate({
  component: ({ oldEmail, newEmail }) => /* @__PURE__ */ jsxs(Html, { lang: "en", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Body, { className: "bg-white font-sans", children: /* @__PURE__ */ jsxs(Container, { className: "mx-auto max-w-2xl text-foreground leading-relaxed", children: [
      /* @__PURE__ */ jsx(Section, { className: "m-5 text-center", children: /* @__PURE__ */ jsx(Heading, { level: 1, children: "Important security notification" }) }),
      /* @__PURE__ */ jsxs(Section, { className: "m-5 rounded-lg border-2 border-border bg-muted p-5 text-center", children: [
        /* @__PURE__ */ jsxs(Text, { children: [
          "A request was received to change the account access email from ",
          /* @__PURE__ */ jsx("strong", { children: oldEmail }),
          " to ",
          /* @__PURE__ */ jsx("strong", { children: newEmail }),
          ", and is pending approval."
        ] }),
        /* @__PURE__ */ jsxs(Text, { children: [
          "A verification code was sent to ",
          /* @__PURE__ */ jsx("strong", { children: newEmail }),
          "."
        ] }),
        /* @__PURE__ */ jsx(Text, { children: "The account email will only be changed once the new address is successfully verified." })
      ] }),
      /* @__PURE__ */ jsxs(Section, { className: "m-4 text-center text-muted-foreground text-sm", children: [
        /* @__PURE__ */ jsx(Text, { children: "If the email change was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account." }),
        /* @__PURE__ */ jsx(Heading, { level: 3, className: "text-destructive", children: "If unauthorized, take immediate action:" }),
        /* @__PURE__ */ jsxs(Section, { className: "mx-auto max-w-md text-left", children: [
          /* @__PURE__ */ jsxs(Text, { className: "italic", children: [
            "• Sign in to the account at ",
            oldEmail
          ] }),
          /* @__PURE__ */ jsx(Text, { className: "italic", children: "• Review the security settings and passkeys" }),
          /* @__PURE__ */ jsx(Text, { className: "italic", children: "• Remove any unfamiliar devices" })
        ] })
      ] })
    ] }) })
  ] }),
  subject: () => "Important Security Notification - Email Change Request",
  stylesMap: TEMPLATE_STYLES_MAP
});
const EmailChangeVerificationTemplate = defineEmailTemplate({
  component: ({ code, oldEmail, newEmail, verificationUrl }) => /* @__PURE__ */ jsxs(Html, { lang: "en", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Body, { className: "bg-white font-sans", children: /* @__PURE__ */ jsxs(Container, { className: "mx-auto max-w-2xl text-foreground leading-relaxed", children: [
      /* @__PURE__ */ jsx(Section, { className: "px-5 pt-10 pb-5 text-center", children: /* @__PURE__ */ jsx(Heading, { level: 1, children: "Email Address Change Verification" }) }),
      /* @__PURE__ */ jsxs(Section, { className: "m-5 rounded-lg border-2 border-border bg-muted p-5 text-center", children: [
        /* @__PURE__ */ jsxs(Text, { children: [
          "An account email address change from ",
          /* @__PURE__ */ jsx("strong", { children: oldEmail }),
          " to ",
          /* @__PURE__ */ jsx("strong", { children: newEmail }),
          " is pending."
        ] }),
        /* @__PURE__ */ jsx(Text, { children: "Please approve the email address change using the code below." })
      ] }),
      /* @__PURE__ */ jsx(Section, { className: "m-5 rounded-lg border-2 border-border bg-muted p-5 text-center", children: /* @__PURE__ */ jsx(Text, { className: "m-0 font-bold text-[32px] text-foreground tracking-[8px]", children: code }) }),
      /* @__PURE__ */ jsx(Section, { className: "m-3 text-center text-muted-foreground text-sm", children: /* @__PURE__ */ jsxs(Text, { children: [
        "This code will expire within ",
        /* @__PURE__ */ jsx("strong", { children: "8 minutes" }),
        " if not approved."
      ] }) }),
      verificationUrl && /* @__PURE__ */ jsxs(Section, { className: "m-4 rounded-2xl bg-muted p-3 text-center", children: [
        /* @__PURE__ */ jsx(Text, { className: "mx-2", children: /* @__PURE__ */ jsx(Link$1, { href: verificationUrl, className: "font-bold no-underline", children: "Click this link to approve the change" }) }),
        /* @__PURE__ */ jsxs(Text, { className: "mx-2", children: [
          /* @__PURE__ */ jsx(Text, { children: "If having trouble using the link above, use the url below to verify." }),
          /* @__PURE__ */ jsx(Link$1, { href: verificationUrl, className: "underline", children: verificationUrl })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section, { className: "m-4 text-center text-muted-foreground text-sm", children: [
        /* @__PURE__ */ jsx(Text, { children: "If this code was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account." }),
        /* @__PURE__ */ jsx(Heading, { level: 3, className: "text-destructive", children: "If unauthorized, take immediate action:" }),
        /* @__PURE__ */ jsxs(Section, { className: "mx-auto max-w-md text-left", children: [
          /* @__PURE__ */ jsxs(Text, { className: "italic", children: [
            "• ",
            /* @__PURE__ */ jsx("strong", { children: "Do not enter the verification code." })
          ] }),
          /* @__PURE__ */ jsxs(Text, { className: "italic", children: [
            "• Sign in to the account at ",
            oldEmail
          ] }),
          /* @__PURE__ */ jsx(Text, { className: "italic", children: "• Review the security settings and passkeys" }),
          /* @__PURE__ */ jsx(Text, { className: "italic", children: "• Remove any unfamiliar devices" })
        ] })
      ] })
    ] }) })
  ] }),
  subject: () => "Email Address Change Verification",
  stylesMap: TEMPLATE_STYLES_MAP
});
const RecoveryVerificationTemplate = defineEmailTemplate({
  component: ({ code, email, verificationUrl }) => /* @__PURE__ */ jsxs(Html, { lang: "en", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Body, { className: "bg-white font-sans", children: /* @__PURE__ */ jsxs(Container, { className: "mx-auto max-w-2xl text-foreground leading-relaxed", children: [
      /* @__PURE__ */ jsx(Section, { className: "px-5 pt-10 pb-5 text-center", children: /* @__PURE__ */ jsx(Heading, { level: 1, children: "Account Recovery Request" }) }),
      /* @__PURE__ */ jsxs(Section, { className: "m-5 rounded-lg border-2 border-border bg-muted p-5 text-center", children: [
        /* @__PURE__ */ jsxs(Text, { children: [
          "An account recovery request for ",
          /* @__PURE__ */ jsx("strong", { children: email }),
          " is pending approval."
        ] }),
        /* @__PURE__ */ jsx(Text, { children: "If approved, registration of a new passkey will be allowed to proceed." }),
        /* @__PURE__ */ jsx(Text, { children: "Please approve the account recovery request using the code below." })
      ] }),
      /* @__PURE__ */ jsx(Section, { className: "m-5 rounded-lg border-2 border-border bg-muted p-5 text-center", children: /* @__PURE__ */ jsx(Text, { className: "m-0 font-bold text-[32px] text-foreground tracking-[8px]", children: code }) }),
      /* @__PURE__ */ jsx(Section, { className: "m-3 text-center text-muted-foreground text-sm", children: /* @__PURE__ */ jsxs(Text, { children: [
        "This code will expire within ",
        /* @__PURE__ */ jsx("strong", { children: "8 minutes" }),
        " if not approved."
      ] }) }),
      verificationUrl && /* @__PURE__ */ jsxs(Section, { className: "m-4 rounded-2xl bg-muted p-3 text-center", children: [
        /* @__PURE__ */ jsx(Text, { className: "mx-2", children: /* @__PURE__ */ jsx(Link$1, { href: verificationUrl, className: "font-bold no-underline", children: "Click this link to approve the change" }) }),
        /* @__PURE__ */ jsxs(Text, { className: "mx-2", children: [
          /* @__PURE__ */ jsx(Text, { children: "If having trouble using the link above, use the url below to verify." }),
          /* @__PURE__ */ jsx(Link$1, { href: verificationUrl, className: "underline", children: verificationUrl })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section, { className: "m-4 text-center text-muted-foreground text-sm", children: [
        /* @__PURE__ */ jsx(Text, { children: "If this code was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account." }),
        /* @__PURE__ */ jsx(Heading, { level: 3, className: "text-destructive", children: "If unauthorized, take immediate action:" }),
        /* @__PURE__ */ jsxs(Section, { className: "mx-auto max-w-md text-left", children: [
          /* @__PURE__ */ jsxs(Text, { className: "italic", children: [
            "• ",
            /* @__PURE__ */ jsx("strong", { children: "Do not enter the verification code." })
          ] }),
          /* @__PURE__ */ jsxs(Text, { className: "italic", children: [
            "• Sign in to the account at ",
            email
          ] }),
          /* @__PURE__ */ jsx(Text, { className: "italic", children: "• Review the security settings and passkeys" }),
          /* @__PURE__ */ jsx(Text, { className: "italic", children: "• Remove any unfamiliar devices" })
        ] })
      ] })
    ] }) })
  ] }),
  subject: () => "Account Recovery Verification",
  stylesMap: TEMPLATE_STYLES_MAP
});
export {
  AuthenticatorsCard,
  EmailChangeNotificationTemplate,
  EmailChangeVerificationTemplate,
  ProfileCard,
  ProfilePage,
  RecoverForm,
  RecoverPage,
  RecoveryVerificationTemplate,
  SignInForm,
  SignInPage,
  SignUpForm,
  SignUpPage,
  TotpEmailTemplate,
  VerifyForm,
  defaultAuthConfig,
  defaultAuthRoutes,
  totpRepository
};
//# sourceMappingURL=index.js.map
