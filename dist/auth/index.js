// src/auth/auth.config.ts
var defaultAuthRoutes = {
  signup: "/auth/signup",
  signin: "/auth/signin",
  signout: "/auth/signout",
  signedin: "/",
  signedout: "/",
  verify: "/auth/verify"
};
var defaultAuthConfig = {
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
    }
  },
  webauthn: {
    rpName: "React Router Cloudflare App",
    challengeSessionKey: "challenge",
    requireUserVerification: true
  },
  verification: {
    digits: 6,
    period: 60 * 8,
    maxAttempts: 3,
    window: 1,
    requireEmailVerification: false,
    resendCooldown: 60
  }
};
// src/auth/auth.context.ts
import { createContext } from "react-router";
var authConfigContext = createContext(null);
function getAuthConfig(context) {
  return context.get(authConfigContext);
}
function setAuthConfig(context, config) {
  context.set(authConfigContext, config);
}
var authUserContext = createContext(null);
function isAuthenticated(context) {
  return context.get(authUserContext) !== null;
}
function getUser(context) {
  return context.get(authUserContext);
}
// src/auth/components/profile-page.tsx
import { DateFormat } from "@ycore/componentry/impetus/intl";
import { AlertDialog, Badge, Button, Card, Input, Label, Link, Separator, Spinner } from "@ycore/componentry/vibrant";
import { useSecureFetcher } from "@ycore/foundry/secure";

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

// src/auth/components/profile-page.tsx
import { useEffect, useRef, useState } from "react";
import { Form } from "react-router";

// src/auth/services/webauthn-credential.ts
import { decodeBase64url } from "@oslojs/encoding";
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

// src/auth/components/webauthn-client.ts
import { encodeBase64url } from "@oslojs/encoding";
var WEBAUTHN_REGISTRATION_ERROR_MESSAGES = new Map([
  ["NotAllowedError", "Registration was cancelled or timed out. Please try again."],
  ["InvalidStateError", "This authenticator is already registered. Please try a different device."],
  ["NotSupportedError", "This authenticator is not supported. Please try a different device."],
  ["SecurityError", "Security error occurred. Please ensure you are on a secure connection."],
  ["UnknownError", "An unknown error occurred during registration. Please try again."],
  ["ConstraintError", "Authenticator constraints not satisfied. Please try a different device."]
]);
var WEBAUTHN_AUTHENTICATION_ERROR_MESSAGES = new Map([
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
      userHandle: response.userHandle ? encodeBase64url(new Uint8Array(response.userHandle)) : undefined
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

// src/auth/components/profile-page.tsx
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
function ProfileCard({ user, signoutUrl, verifyUrl }) {
  return /* @__PURE__ */ jsxs(Card, {
    children: [
      /* @__PURE__ */ jsx(Card.Header, {
        children: /* @__PURE__ */ jsxs(Card.Title, {
          className: "flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx("div", {
              className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground",
              children: user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"
            }),
            /* @__PURE__ */ jsxs("div", {
              children: [
                /* @__PURE__ */ jsx("h3", {
                  className: "font-semibold text-lg",
                  children: user?.displayName || "Profile"
                }),
                /* @__PURE__ */ jsx("p", {
                  className: "text-muted-foreground text-sm",
                  children: user?.email
                })
              ]
            })
          ]
        })
      }),
      /* @__PURE__ */ jsx(Card.Content, {
        className: "space-y-6",
        children: /* @__PURE__ */ jsx("div", {
          className: "grid gap-4",
          children: user?.createdAt && /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [
              /* @__PURE__ */ jsx(Label, {
                className: "text-muted-foreground text-sm",
                children: "Since"
              }),
              /* @__PURE__ */ jsx("p", {
                className: "text-sm",
                children: /* @__PURE__ */ jsx(DateFormat.Long, {
                  date: user.createdAt
                })
              })
            ]
          })
        })
      }),
      /* @__PURE__ */ jsx(Separator, {}),
      /* @__PURE__ */ jsxs(Card.Footer, {
        className: "flex justify-between pt-6",
        children: [
          /* @__PURE__ */ jsx("div", {
            className: "flex gap-2",
            children: user?.emailVerified ? /* @__PURE__ */ jsx(Badge, {
              variant: "secondary",
              children: "Verified Account"
            }) : /* @__PURE__ */ jsx(Button, {
              asChild: true,
              variant: "default",
              size: "sm",
              className: "bg-amber-600 hover:bg-amber-700",
              children: /* @__PURE__ */ jsx(Link, {
                href: verifyUrl,
                children: "Verify Email"
              })
            })
          }),
          /* @__PURE__ */ jsx(Form, {
            method: "post",
            action: signoutUrl,
            children: /* @__PURE__ */ jsx(Button, {
              type: "submit",
              variant: "destructive",
              size: "sm",
              children: "Sign Out"
            })
          })
        ]
      })
    ]
  });
}
function AuthenticatorsCard({ authenticators }) {
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
          abortControllerRef.current = new AbortController;
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
            }, 60000);
            abortControllerRef.current?.signal.addEventListener("abort", () => {
              clearTimeout(timeoutId);
            });
          });
          const credential = await Promise.race([startRegistration(webAuthnOptions), timeoutPromise]);
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
          const formData = new FormData;
          if (pendingAction.type === "add") {
            formData.append("intent", "add-passkey");
            formData.append("challenge", challenge);
            formData.append("credentialData", JSON.stringify(credential));
            if (freshCsrfTokenRef.current) {
              formData.append("csrf_token", freshCsrfTokenRef.current);
            }
            addFetcher.submitSecure(formData, { method: "post", action: "/auth/profile" });
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
    if (addFetcher.state === "idle" && addFetcher.data) {
      const data = addFetcher.data;
      if (data.success === false) {
        setWebAuthnError(data.error?.message || "Failed to add passkey");
        setIsRegistering(false);
      }
    }
  }, [addFetcher.data, addFetcher.state]);
  const handleAddPasskey = () => {
    setWebAuthnError(null);
    if (!isWebAuthnSupported()) {
      setWebAuthnError("WebAuthn is not supported on this device");
      return;
    }
    setPendingAction({ type: "add" });
    const formData = new FormData;
    formData.append("intent", "add-passkey-options");
    optionsFetcher.submitSecure(formData, { method: "post", action: "/auth/profile" });
  };
  const handleStartEdit = (authenticator) => {
    setEditingId(authenticator.id);
    setEditingName(authenticator.name || "");
  };
  const handleSaveEdit = () => {
    if (!editingId)
      return;
    const formData = new FormData;
    formData.append("intent", "rename-passkey");
    formData.append("authenticatorId", editingId);
    formData.append("name", editingName.trim());
    renameFetcher.submitSecure(formData, { method: "post", action: "/auth/profile" });
    setEditingId(null);
    setEditingName("");
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };
  const handleDeletePasskey = (authenticatorId) => {
    const formData = new FormData;
    formData.append("intent", "delete-passkey");
    formData.append("authenticatorId", authenticatorId);
    deleteFetcher.submitSecure(formData, { method: "post", action: "/auth/profile" });
  };
  const isAddingPasskey = addFetcher.state === "submitting" || isRegistering || optionsFetcher.state !== "idle" && pendingAction?.type === "add";
  const isRenamingPasskey = renameFetcher.state === "submitting";
  const isDeletingPasskey = (id) => deleteFetcher.state === "submitting" && deleteFetcher.formData?.get("authenticatorId") === id;
  return /* @__PURE__ */ jsxs(Card, {
    children: [
      /* @__PURE__ */ jsx(Card.Header, {
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between",
          children: [
            /* @__PURE__ */ jsxs("div", {
              children: [
                /* @__PURE__ */ jsx(Card.Title, {
                  className: "flex items-center gap-2",
                  children: "Passkeys"
                }),
                /* @__PURE__ */ jsx(Card.Description, {
                  children: "Security keys and devices used to sign in to your account"
                })
              ]
            }),
            /* @__PURE__ */ jsxs(Button, {
              onClick: handleAddPasskey,
              disabled: isAddingPasskey || authenticators.length >= 10 || isClient && !isWebAuthnSupported(),
              size: "sm",
              children: [
                /* @__PURE__ */ jsx(Spinner, {
                  className: clsx_default("mr-1 size-4", !isAddingPasskey && "hidden")
                }),
                isAddingPasskey ? isRegistering ? "Setting up..." : "Adding..." : "Add Passkey"
              ]
            })
          ]
        })
      }),
      /* @__PURE__ */ jsxs(Card.Content, {
        children: [
          webAuthnError && /* @__PURE__ */ jsxs("div", {
            className: "mb-4 rounded-lg border border-red-200 bg-red-50 p-3",
            children: [
              /* @__PURE__ */ jsx("p", {
                className: "font-medium text-red-800 text-sm",
                children: "Registration Failed"
              }),
              /* @__PURE__ */ jsx("p", {
                className: "mt-1 text-red-600 text-xs",
                children: webAuthnError
              })
            ]
          }),
          isRegistering && /* @__PURE__ */ jsxs("div", {
            className: "mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm",
            children: [
              /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Spinner, {
                    className: "size-4"
                  }),
                  /* @__PURE__ */ jsx("span", {
                    children: "Please set up your authenticator..."
                  })
                ]
              }),
              /* @__PURE__ */ jsx("p", {
                className: "mt-1 text-xs",
                children: "Follow the prompts to create a passkey on your device."
              })
            ]
          }),
          authenticators.length === 0 ? /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col items-center justify-center py-12 text-center",
            children: [
              /* @__PURE__ */ jsx("h4", {
                className: "mb-2 font-medium text-muted-foreground",
                children: "No passkeys registered"
              }),
              /* @__PURE__ */ jsx("p", {
                className: "max-w-sm text-muted-foreground text-sm",
                children: "Add a security key or biometric device to secure your account"
              })
            ]
          }) : /* @__PURE__ */ jsx("div", {
            className: "space-y-3",
            children: authenticators.map((auth) => /* @__PURE__ */ jsx("div", {
              className: "rounded-lg border p-4",
              children: /* @__PURE__ */ jsxs("div", {
                className: "space-y-3",
                children: [
                  /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      /* @__PURE__ */ jsx("div", {
                        className: "flex items-center gap-2",
                        children: editingId === auth.id ? /* @__PURE__ */ jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            /* @__PURE__ */ jsx(Input, {
                              value: editingName,
                              onChange: (e) => setEditingName(e.target.value),
                              className: "h-8 w-48",
                              placeholder: "Enter passkey name"
                            }),
                            /* @__PURE__ */ jsx(Button, {
                              size: "sm",
                              onClick: handleSaveEdit,
                              disabled: isRenamingPasskey,
                              children: isRenamingPasskey ? "Saving..." : "Save"
                            }),
                            /* @__PURE__ */ jsx(Button, {
                              size: "sm",
                              variant: "outline",
                              onClick: handleCancelEdit,
                              children: "Cancel"
                            })
                          ]
                        }) : /* @__PURE__ */ jsxs(Fragment, {
                          children: [
                            /* @__PURE__ */ jsx("h4", {
                              className: "font-medium text-sm",
                              children: auth.name
                            }),
                            /* @__PURE__ */ jsx("span", {
                              className: "text-muted-foreground text-xs",
                              children: "•"
                            }),
                            /* @__PURE__ */ jsx("p", {
                              className: "text-muted-foreground text-xs uppercase",
                              children: auth.credentialDeviceType
                            }),
                            auth.credentialBackedUp && /* @__PURE__ */ jsx(Badge, {
                              variant: "outline",
                              className: "text-xs",
                              children: "Synced"
                            })
                          ]
                        })
                      }),
                      editingId !== auth.id && /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-1",
                        children: [
                          /* @__PURE__ */ jsx(Button, {
                            size: "sm",
                            variant: "ghost",
                            onClick: () => handleStartEdit(auth),
                            className: "h-8 px-2",
                            children: "Edit"
                          }),
                          /* @__PURE__ */ jsxs(AlertDialog, {
                            children: [
                              /* @__PURE__ */ jsx(AlertDialog.Trigger, {
                                asChild: true,
                                children: /* @__PURE__ */ jsx(Button, {
                                  size: "sm",
                                  variant: "ghost",
                                  className: "h-8 px-2 text-destructive hover:text-destructive",
                                  disabled: authenticators.length <= 1 || isDeletingPasskey(auth.id),
                                  children: isDeletingPasskey(auth.id) ? "Deleting..." : "Delete"
                                })
                              }),
                              /* @__PURE__ */ jsxs(AlertDialog.Content, {
                                children: [
                                  /* @__PURE__ */ jsxs(AlertDialog.Header, {
                                    children: [
                                      /* @__PURE__ */ jsx(AlertDialog.Title, {
                                        children: "Delete Passkey"
                                      }),
                                      /* @__PURE__ */ jsx(AlertDialog.Description, {
                                        asChild: true,
                                        children: /* @__PURE__ */ jsxs("div", {
                                          children: [
                                            /* @__PURE__ */ jsxs("p", {
                                              children: [
                                                'Are you sure you want to delete "',
                                                auth.name,
                                                '"? This action cannot be undone.'
                                              ]
                                            }),
                                            authenticators.length <= 1 && /* @__PURE__ */ jsx("p", {
                                              className: "mt-2 text-destructive text-sm",
                                              children: "You cannot delete your last passkey as it would lock you out of your account."
                                            })
                                          ]
                                        })
                                      })
                                    ]
                                  }),
                                  /* @__PURE__ */ jsxs(AlertDialog.Footer, {
                                    children: [
                                      /* @__PURE__ */ jsx(AlertDialog.Cancel, {
                                        children: "Cancel"
                                      }),
                                      /* @__PURE__ */ jsx(AlertDialog.Action, {
                                        onClick: () => handleDeletePasskey(auth.id),
                                        className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                        children: "Delete Passkey"
                                      })
                                    ]
                                  })
                                ]
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  }),
                  /* @__PURE__ */ jsx("div", {
                    className: "flex flex-wrap gap-1",
                    children: auth.transports.map((transport) => /* @__PURE__ */ jsx(Badge, {
                      variant: "secondary",
                      className: "text-xs",
                      children: transport.toUpperCase()
                    }, transport))
                  }),
                  /* @__PURE__ */ jsxs("div", {
                    className: "flex justify-between text-muted-foreground text-xs",
                    children: [
                      /* @__PURE__ */ jsxs("span", {
                        className: "flex items-center gap-1",
                        children: [
                          /* @__PURE__ */ jsx(Label, {
                            children: "Added:"
                          }),
                          /* @__PURE__ */ jsx(DateFormat.Medium, {
                            date: auth.createdAt
                          })
                        ]
                      }),
                      auth.lastUsedAt ? /* @__PURE__ */ jsxs("span", {
                        className: "flex items-center gap-1",
                        children: [
                          /* @__PURE__ */ jsx(Label, {
                            children: "Last used:"
                          }),
                          /* @__PURE__ */ jsx(DateFormat.Medium, {
                            date: auth.lastUsedAt
                          })
                        ]
                      }) : /* @__PURE__ */ jsx("span", {
                        children: "Never used"
                      })
                    ]
                  })
                ]
              })
            }, auth.id))
          }),
          authenticators.length >= 10 && /* @__PURE__ */ jsx("div", {
            className: "mt-4 rounded-lg bg-muted p-3",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground text-sm",
              children: "You have reached the maximum limit of 10 passkeys. Delete an existing passkey to add a new one."
            })
          })
        ]
      })
    ]
  });
}
function ProfilePage({ children }) {
  return /* @__PURE__ */ jsxs("div", {
    className: "mx-auto max-w-2xl px-4 py-8",
    children: [
      /* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [
          /* @__PURE__ */ jsx("h1", {
            className: "font-bold text-2xl tracking-tight",
            children: "Account Settings"
          }),
          /* @__PURE__ */ jsx("p", {
            className: "text-muted-foreground",
            children: "Manage your account information and security settings"
          })
        ]
      }),
      /* @__PURE__ */ jsx("div", {
        className: "space-y-6",
        children
      })
    ]
  });
}
// src/auth/components/signin-page.tsx
import { Button as Button2, Card as Card2, Input as Input2, Link as Link2, Spinner as Spinner2, SvgIcon } from "@ycore/componentry/vibrant";
import { isError } from "@ycore/forge/result";
import { FormError, FormField, SecureForm, SecureProvider } from "@ycore/foundry/secure";
import * as React from "react";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";

// src/auth/services/webauthn.ts
import { decodePKIXECDSASignature, ECDSAPublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { decodeBase64url as decodeBase64url2, encodeBase64url as encodeBase64url2 } from "@oslojs/encoding";
import { ClientDataType, COSEKeyType, createAssertionSignatureMessage, parseAttestationObject, parseAuthenticatorData, parseClientDataJSON } from "@oslojs/webauthn";
import { logger } from "@ycore/forge/logger";
import { err } from "@ycore/forge/result";

// src/auth/auth.constants.ts
var WEBAUTHN_ALGORITHMS = {
  ES256: -7,
  RS256: -257
};
var WEBAUTHN_CONFIG = {
  CHALLENGE_TIMEOUT: 60000,
  CHALLENGE_SIZE: 32,
  USER_ID_SIZE: 16,
  COORDINATE_LENGTH: 32,
  HEX_COORDINATE_LENGTH: 64
};
var TRANSPORT_METHODS = {
  INTERNAL: "internal",
  HYBRID: "hybrid",
  USB: "usb",
  NFC: "nfc",
  BLE: "ble",
  SMART_CARD: "smart-card"
};
var ATTESTATION_TYPES = {
  NONE: "none",
  BASIC: "basic",
  SELF: "self",
  ATTCA: "attca",
  ECDAA: "ecdaa"
};
var DEVICE_TYPES = {
  PLATFORM: "platform",
  CROSS_PLATFORM: "cross-platform"
};
var DEFAULT_DEVICE_INFO = {
  platform: {
    type: DEVICE_TYPES.PLATFORM,
    vendor: "Unknown",
    model: "Platform Authenticator",
    certified: false,
    transports: [TRANSPORT_METHODS.INTERNAL, TRANSPORT_METHODS.HYBRID]
  },
  "cross-platform": {
    type: DEVICE_TYPES.CROSS_PLATFORM,
    vendor: "Unknown",
    model: "Security Key",
    certified: false,
    transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC, TRANSPORT_METHODS.HYBRID]
  }
};
var ATTESTATION_FORMAT_HANDLERS = new Map([
  ["none", () => ATTESTATION_TYPES.NONE],
  [
    "packed",
    (attStmt) => {
      if (attStmt.x5c && attStmt.x5c.length > 0) {
        return ATTESTATION_TYPES.BASIC;
      }
      if (attStmt.sig && !attStmt.x5c) {
        return ATTESTATION_TYPES.SELF;
      }
      return ATTESTATION_TYPES.NONE;
    }
  ],
  [
    "fido-u2f",
    (attStmt) => {
      if (attStmt.x5c && attStmt.x5c.length > 0) {
        return ATTESTATION_TYPES.BASIC;
      }
      return ATTESTATION_TYPES.SELF;
    }
  ],
  ["android-key", () => ATTESTATION_TYPES.BASIC],
  ["android-safetynet", () => ATTESTATION_TYPES.ATTCA],
  ["tpm", () => ATTESTATION_TYPES.BASIC],
  ["apple", () => ATTESTATION_TYPES.BASIC]
]);
var WEBAUTHN_ERROR_MESSAGES = new Map([
  ["CHALLENGE_EXPIRED" /* CHALLENGE_EXPIRED */, () => "Session expired. Please refresh the page and try again."],
  ["INVALID_CHALLENGE" /* INVALID_CHALLENGE */, () => "Security check failed. Please refresh the page and try again."],
  ["INVALID_COUNTER" /* INVALID_COUNTER */, () => "Security violation detected. Your authenticator may be compromised. Please contact support immediately."],
  ["INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */, () => "Invalid security key format. Please re-register your device."],
  ["INVALID_ORIGIN" /* INVALID_ORIGIN */, () => "Request origin not recognized. Please ensure you are on the correct website."],
  ["INVALID_RPID" /* INVALID_RPID */, () => "Security configuration error. Please contact support."],
  ["UNSUPPORTED_ALGORITHM" /* UNSUPPORTED_ALGORITHM */, () => "Your authenticator uses an unsupported security algorithm. Please use a different device."],
  ["USER_NOT_PRESENT" /* USER_NOT_PRESENT */, () => "User presence verification failed. Please interact with your authenticator when prompted."],
  ["INVALID_CREDENTIAL" /* INVALID_CREDENTIAL */, (operation) => operation === "registration" ? "Failed to create credential. Please try again." : "Authenticator not recognized. Please use the device you registered with."],
  [
    "SIGNATURE_FAILED" /* SIGNATURE_FAILED */,
    (operation) => operation === "registration" ? "Failed to verify authenticator. Please try a different device." : "Authentication failed. Please verify you are using the correct authenticator."
  ],
  ["DEFAULT" /* DEFAULT */, (operation) => operation === "registration" ? "Registration failed. Please try again." : "Authentication failed. Please try again."]
]);

// src/auth/services/webauthn.ts
function toArrayBuffer(uint8Array) {
  const buffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(buffer).set(uint8Array);
  return buffer;
}
function generateUserId() {
  const bytes = new Uint8Array(WEBAUTHN_CONFIG.USER_ID_SIZE);
  crypto.getRandomValues(bytes);
  return encodeBase64url2(bytes);
}
function createRegistrationOptions(rpName, rpId, userName, userDisplayName, challenge, excludeCredentials = []) {
  return {
    challenge: toArrayBuffer(decodeBase64url2(challenge)),
    rp: {
      name: rpName,
      id: rpId
    },
    user: {
      id: toArrayBuffer(decodeBase64url2(generateUserId())),
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
      id: toArrayBuffer(decodeBase64url2(cred.id)),
      type: "public-key",
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
    challenge: toArrayBuffer(decodeBase64url2(challenge)),
    rpId,
    timeout: WEBAUTHN_CONFIG.CHALLENGE_TIMEOUT,
    userVerification: "preferred",
    allowCredentials: allowCredentials.length > 0 ? allowCredentials.map((cred) => ({
      id: toArrayBuffer(decodeBase64url2(cred.id)),
      type: "public-key",
      ...cred.transports && cred.transports.length > 0 ? { transports: cred.transports } : {}
    })) : []
  };
}

// src/auth/components/signin-page.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function SignInForm({ signupUrl }) {
  const navigation = useNavigation();
  const actionData = useActionData();
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.success === false ? actionData.error?.details || {} : {};
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
      abortControllerRef.current = new AbortController;
      const options = createAuthenticationOptions(window.location.hostname, loaderData.challenge, []);
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Authentication timed out. Please try again."));
        }, 60000);
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
  return /* @__PURE__ */ jsxs2(SecureForm, {
    method: "post",
    onSubmit: handleSubmit,
    className: "flex flex-col gap-6",
    children: [
      /* @__PURE__ */ jsx2(FormField, {
        label: "Email",
        error: errors.email,
        children: /* @__PURE__ */ jsx2(Input2, {
          name: "email",
          type: "email",
          placeholder: "Enter your email",
          autoComplete: "email webauthn",
          required: true,
          autoFocus: true
        })
      }),
      (errors.form || webAuthnError) && /* @__PURE__ */ jsx2(FormError, {
        error: errors.form || webAuthnError
      }),
      webAuthnSupported && /* @__PURE__ */ jsx2("div", {
        className: "text-muted-foreground text-sm",
        children: platformAuthAvailable ? /* @__PURE__ */ jsxs2("span", {
          className: "flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx2(SvgIcon, {
              iconId: "CircleCheck",
              className: "h-4 w-4 text-green-500"
            }),
            "Platform authenticator available"
          ]
        }) : /* @__PURE__ */ jsxs2("span", {
          className: "flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx2(SvgIcon, {
              iconId: "CircleAlert",
              className: "h-4 w-4 text-yellow-500"
            }),
            "External security key may be required"
          ]
        })
      }),
      isAuthenticating && /* @__PURE__ */ jsxs2("div", {
        className: "rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm",
        children: [
          /* @__PURE__ */ jsxs2("div", {
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx2(Spinner2, {
                className: "size-4"
              }),
              /* @__PURE__ */ jsx2("span", {
                children: "Please interact with your authenticator..."
              })
            ]
          }),
          /* @__PURE__ */ jsx2("p", {
            className: "mt-1 text-xs",
            children: "Touch your security key or approve the prompt on your device."
          })
        ]
      }),
      /* @__PURE__ */ jsxs2("div", {
        className: "flex justify-between gap-x-2",
        children: [
          /* @__PURE__ */ jsxs2(Button2, {
            type: "submit",
            name: "intent",
            value: "signin",
            disabled: isSubmitting || isAuthenticating || !webAuthnSupported,
            className: "flex-1",
            children: [
              /* @__PURE__ */ jsx2(Spinner2, {
                className: clsx_default("size-5", !(isSubmitting || isAuthenticating) && "hidden")
              }),
              isSubmitting || isAuthenticating ? "Authenticating..." : !webAuthnSupported ? "WebAuthn not supported" : "Sign in with Passkey"
            ]
          }),
          /* @__PURE__ */ jsx2(Button2, {
            type: "button",
            variant: "outline",
            asChild: true,
            disabled: isSubmitting || isAuthenticating,
            children: /* @__PURE__ */ jsx2(Link2, {
              href: signupUrl,
              children: "Sign Up"
            })
          })
        ]
      })
    ]
  });
}
function SignInPage({ loaderData, children, title = "Sign In", description = "Sign in to your account with your passkey" }) {
  const token = isError(loaderData) ? "" : loaderData?.token ?? "";
  return /* @__PURE__ */ jsx2(SecureProvider, {
    token,
    children: /* @__PURE__ */ jsx2("div", {
      className: "mx-auto min-w-md max-w-lg px-4 py-8",
      children: /* @__PURE__ */ jsxs2(Card2, {
        children: [
          /* @__PURE__ */ jsxs2(Card2.Header, {
            children: [
              /* @__PURE__ */ jsx2(Card2.Title, {
                children: title
              }),
              /* @__PURE__ */ jsx2(Card2.Description, {
                children: description
              })
            ]
          }),
          /* @__PURE__ */ jsx2(Card2.Content, {
            children
          })
        ]
      })
    })
  });
}
// src/auth/components/signup-page.tsx
import { Button as Button3, Card as Card3, Input as Input3, Link as Link3, Spinner as Spinner3, SvgIcon as SvgIcon2 } from "@ycore/componentry/vibrant";
import { isError as isError2 } from "@ycore/forge/result";
import { FormError as FormError2, FormField as FormField2, SecureForm as SecureForm2, SecureProvider as SecureProvider2 } from "@ycore/foundry/secure";
import * as React2 from "react";
import { useActionData as useActionData2, useLoaderData as useLoaderData2, useNavigation as useNavigation2, useSubmit as useSubmit2 } from "react-router";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function SignUpForm({ signinUrl }) {
  const navigation = useNavigation2();
  const actionData = useActionData2();
  const loaderData = useLoaderData2();
  const submit = useSubmit2();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.success === false ? actionData.error?.details || {} : {};
  const [webAuthnSupported, setWebAuthnSupported] = React2.useState(false);
  const [webAuthnError, setWebAuthnError] = React2.useState(null);
  const [isRegistering, setIsRegistering] = React2.useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = React2.useState(false);
  const abortControllerRef = React2.useRef(null);
  React2.useEffect(() => {
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
  React2.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
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
      abortControllerRef.current = new AbortController;
      const options = createRegistrationOptions(window.location.hostname, window.location.hostname, email, displayName, loaderData.challenge, []);
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Registration timed out. Please try again."));
        }, 60000);
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
  return /* @__PURE__ */ jsxs3(SecureForm2, {
    method: "post",
    onSubmit: handleSubmit,
    className: "flex flex-col gap-6",
    children: [
      /* @__PURE__ */ jsx3(FormField2, {
        label: "Email",
        error: errors.email,
        children: /* @__PURE__ */ jsx3(Input3, {
          name: "email",
          type: "email",
          placeholder: "Enter your email",
          autoComplete: "email webauthn",
          required: true,
          autoFocus: true
        })
      }),
      /* @__PURE__ */ jsx3(FormField2, {
        label: "Display Name",
        error: errors.displayName,
        children: /* @__PURE__ */ jsx3(Input3, {
          name: "displayName",
          type: "text",
          placeholder: "Enter your display name",
          autoComplete: "name",
          required: true
        })
      }),
      (errors.form || webAuthnError) && /* @__PURE__ */ jsx3(FormError2, {
        error: errors.form || webAuthnError
      }),
      webAuthnSupported && /* @__PURE__ */ jsx3("div", {
        className: "text-muted-foreground text-sm",
        children: platformAuthAvailable ? /* @__PURE__ */ jsxs3("span", {
          className: "flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx3(SvgIcon2, {
              iconId: "CircleCheck",
              className: "h-4 w-4 text-green-500"
            }),
            "Platform authenticator available"
          ]
        }) : /* @__PURE__ */ jsxs3("span", {
          className: "flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx3(SvgIcon2, {
              iconId: "CircleAlert",
              className: "h-4 w-4 text-yellow-500"
            }),
            "External security key may be required"
          ]
        })
      }),
      isRegistering && /* @__PURE__ */ jsxs3("div", {
        className: "rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm",
        children: [
          /* @__PURE__ */ jsxs3("div", {
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx3(Spinner3, {
                className: "size-4"
              }),
              /* @__PURE__ */ jsx3("span", {
                children: "Please set up your authenticator..."
              })
            ]
          }),
          /* @__PURE__ */ jsx3("p", {
            className: "mt-1 text-xs",
            children: "Follow the prompts to create a passkey on your device."
          })
        ]
      }),
      /* @__PURE__ */ jsxs3("div", {
        className: "flex justify-between gap-x-2",
        children: [
          /* @__PURE__ */ jsxs3(Button3, {
            type: "submit",
            name: "intent",
            value: "signup",
            disabled: isSubmitting || isRegistering || !webAuthnSupported,
            className: "flex-1",
            children: [
              /* @__PURE__ */ jsx3(Spinner3, {
                className: clsx_default("size-5", !(isSubmitting || isRegistering) && "hidden")
              }),
              isSubmitting || isRegistering ? "Creating account..." : !webAuthnSupported ? "WebAuthn not supported" : "Sign up with Passkey"
            ]
          }),
          /* @__PURE__ */ jsx3(Button3, {
            type: "button",
            variant: "outline",
            asChild: true,
            disabled: isSubmitting || isRegistering,
            children: /* @__PURE__ */ jsx3(Link3, {
              href: signinUrl,
              children: "Sign In"
            })
          })
        ]
      })
    ]
  });
}
function SignUpPage({ loaderData, children, title = "Create Account", description = "Sign up for a new account with your passkey" }) {
  const token = isError2(loaderData) ? "" : loaderData?.token ?? "";
  return /* @__PURE__ */ jsx3(SecureProvider2, {
    token,
    children: /* @__PURE__ */ jsx3("div", {
      className: "mx-auto min-w-md max-w-lg px-4 py-8",
      children: /* @__PURE__ */ jsxs3(Card3, {
        children: [
          /* @__PURE__ */ jsxs3(Card3.Header, {
            children: [
              /* @__PURE__ */ jsx3(Card3.Title, {
                children: title
              }),
              /* @__PURE__ */ jsx3(Card3.Description, {
                children: description
              })
            ]
          }),
          /* @__PURE__ */ jsx3(Card3.Content, {
            children
          })
        ]
      })
    })
  });
}
// src/auth/components/VerifyForm.tsx
import { Button as Button4, Input as Input4, InputOtp } from "@ycore/componentry/vibrant";
import { formErrors, isError as isError3 } from "@ycore/forge/result";
import { SecureForm as SecureForm3 } from "@ycore/foundry/secure";
import { useEffect as useEffect4, useState as useState4 } from "react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function VerifyForm({ email, purpose = "signup", resendCooldown: initialCooldown = 60, period = 480, digits = 6, actionData }) {
  const [code, setCode] = useState4("");
  const [resendCooldown, setResendCooldown] = useState4(0);
  const errors = actionData && isError3(actionData) ? formErrors(actionData) : {};
  useEffect4(() => {
    if (actionData && !isError3(actionData) && typeof actionData === "object" && "resent" in actionData && actionData.resent) {
      setResendCooldown(initialCooldown);
    }
  }, [actionData, initialCooldown]);
  useEffect4(() => {
    if (resendCooldown <= 0)
      return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);
  const purposeLabels = {
    signup: "Email Verification",
    "passkey-add": "Confirm Adding Passkey",
    "passkey-delete": "Confirm Removing Passkey",
    "email-change": "Verify New Email",
    "account-delete": "Confirm Removing Account",
    recovery: "Recover Account"
  };
  return /* @__PURE__ */ jsxs4("div", {
    className: "mx-auto w-full max-w-md space-y-6",
    children: [
      /* @__PURE__ */ jsxs4("div", {
        className: "space-y-2 text-center",
        children: [
          /* @__PURE__ */ jsx4("h1", {
            className: "font-bold text-3xl tracking-tight",
            children: purposeLabels[purpose]
          }),
          /* @__PURE__ */ jsxs4("p", {
            className: "text-muted-foreground",
            children: [
              "Please enter the ",
              digits,
              "-digit verification code sent to ",
              /* @__PURE__ */ jsx4("strong", {
                className: "text-nowrap",
                children: email
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsxs4(SecureForm3, {
        method: "post",
        className: "space-y-4",
        errors,
        children: [
          /* @__PURE__ */ jsx4(Input4, {
            type: "hidden",
            name: "email",
            value: email
          }),
          /* @__PURE__ */ jsx4(Input4, {
            type: "hidden",
            name: "purpose",
            value: purpose
          }),
          /* @__PURE__ */ jsx4(SecureForm3.Field, {
            label: "Verification Code",
            name: "code",
            error: errors.code,
            className: "flex flex-col items-center",
            children: /* @__PURE__ */ jsxs4(InputOtp, {
              value: code,
              onValueChange: setCode,
              autoComplete: "one-time-code",
              validationType: "numeric",
              disabled: false,
              children: [
                /* @__PURE__ */ jsx4(InputOtp.Group, {
                  children: Array.from({ length: digits }).map((_, index) => /* @__PURE__ */ jsx4(InputOtp.Slot, {
                    index
                  }, index))
                }),
                /* @__PURE__ */ jsx4(InputOtp.HiddenInput, {
                  name: "code"
                })
              ]
            })
          }),
          /* @__PURE__ */ jsxs4("div", {
            className: "space-y-3",
            children: [
              /* @__PURE__ */ jsxs4("div", {
                className: "flex justify-around",
                children: [
                  /* @__PURE__ */ jsx4(Button4, {
                    type: "submit",
                    name: "intent",
                    value: "verify",
                    disabled: code.length !== digits,
                    children: "Verify Code"
                  }),
                  /* @__PURE__ */ jsx4(Button4, {
                    type: "submit",
                    name: "intent",
                    value: "resend",
                    variant: "outline",
                    disabled: resendCooldown > 0,
                    formNoValidate: true,
                    children: resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"
                  })
                ]
              }),
              /* @__PURE__ */ jsx4("div", {
                className: "flex justify-center",
                children: /* @__PURE__ */ jsx4(Button4, {
                  type: "submit",
                  name: "intent",
                  value: "unverify",
                  variant: "destructive",
                  formNoValidate: true,
                  children: "Unverify Email"
                })
              })
            ]
          }),
          /* @__PURE__ */ jsxs4("p", {
            className: "text-center text-muted-foreground text-sm",
            children: [
              "The code expires within ",
              Math.floor(period / 60),
              " minutes"
            ]
          })
        ]
      })
    ]
  });
}
// src/auth/services/auth.validation.ts
import { email, maxLength, minLength, nonEmpty, object, pipe, string } from "valibot";
var emailField = pipe(string(), nonEmpty("Please enter your email."), email("Please enter a valid email."), maxLength(32, "Email is too long"));
var displayNameField = pipe(string(), nonEmpty("Display name is required"), minLength(1, "Display name is required"));
var authFormSchema = object({ email: emailField });
var signupFormSchema = object({ email: emailField, displayName: displayNameField });
var signinFormSchema = object({ email: emailField });
export {
  signupFormSchema,
  signinFormSchema,
  setAuthConfig,
  isAuthenticated,
  getUser,
  getAuthConfig,
  defaultAuthRoutes,
  defaultAuthConfig,
  authUserContext,
  authFormSchema,
  authConfigContext,
  VerifyForm,
  SignUpPage,
  SignUpForm,
  SignInPage,
  SignInForm,
  ProfilePage,
  ProfileCard,
  AuthenticatorsCard
};

//# debugId=0F128FB8609740C364756E2164756E21
