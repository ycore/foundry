var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca, _Da, _Ea, _Fa, _Ga, _Ha;
import { requireContext, getContext, setContext } from "@ycore/forge/context";
import { createContext, createSessionStorage, redirect } from "react-router";
import { logger } from "@ycore/forge/logger";
import { ok, err, isError, middlewarePassthrough, notFoundError, serverError, tryCatch, flattenError, isSystemError, throwSystemError, respondError, respondRedirect, respondOk, validateFormData, transformError } from "@ycore/forge/result";
import { isProduction, UNCONFIGURED, getBindings, getKVStore, getDatabase, getOrigin, isDevelopment, getOriginDomain } from "@ycore/forge/services";
import { pipe, string, nonEmpty, email, maxLength, minLength, object } from "valibot";
import { cuid, updatedAt, createdAt } from "@ycore/forge/utils";
import { handleIntent } from "@ycore/forge/intent/server";
import { requireCSRFToken } from "@ycore/foundry/secure/server";
import { renderEmail } from "@ycore/componentry/email/server";
import { jsxs, jsx } from "react/jsx-runtime";
import { Html, Head, Body, Container, Section, Heading, Text, Link } from "@ycore/componentry/email";
import { encodeBase64url, decodeBase64url } from "@oslojs/encoding";
import { ECDSAPublicKey, p256, decodePKIXECDSASignature, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { parseAttestationObject, parseClientDataJSON, ClientDataType, COSEKeyType, parseAuthenticatorData, createAssertionSignatureMessage } from "@oslojs/webauthn";
const authConfigContext = createContext(null);
const authUserContext = createContext(null);
function requireAuthUser(context) {
  const user = requireContext(context, authUserContext, {
    errorMessage: "Authentication required - user must be logged in to access this resource",
    errorStatus: 401
  });
  return user;
}
function getAuthUser(context) {
  return getContext(context, authUserContext, null);
}
function isAuthenticated(context) {
  return getContext(context, authUserContext, null) !== null;
}
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
  session: {
    cookie: {
      name: "__auth_session"
    }
  }
};
/**
 * @react-router/cloudflare v7.9.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function createWorkersKVSessionStorage({
  cookie,
  kv
}) {
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      while (true) {
        let randomBytes = crypto.getRandomValues(new Uint8Array(8));
        let id = [...randomBytes].map((x) => x.toString(16).padStart(2, "0")).join("");
        if (await kv.get(id, "json")) {
          continue;
        }
        await kv.put(id, JSON.stringify(data), {
          expiration: expires ? Math.round(expires.getTime() / 1e3) : void 0
        });
        return id;
      }
    },
    async readData(id) {
      let session = await kv.get(id);
      if (!session) {
        return null;
      }
      return JSON.parse(session);
    },
    async updateData(id, data, expires) {
      await kv.put(id, JSON.stringify(data), {
        expiration: expires ? Math.round(expires.getTime() / 1e3) : void 0
      });
    },
    async deleteData(id) {
      await kv.delete(id);
    }
  });
}
const challengeKvTemplate = (challenge) => `challenge:${challenge}`;
function resolveAuthBindings(context) {
  const authConfig = getContext(context, authConfigContext);
  if (!authConfig) {
    throw new Error("Auth configuration not found in context. Ensure auth middleware is properly configured.");
  }
  const { session } = authConfig;
  if (session.kvBinding === UNCONFIGURED) {
    throw new Error("Auth session KV binding is not configured. Please specify kvBinding in your auth config.");
  }
  if (session.secretKey === UNCONFIGURED) {
    throw new Error("Auth session secret key is not configured. Please specify secretKey in your auth config.");
  }
  const bindings = getBindings(context);
  const secret = bindings[session.secretKey];
  if (!secret) {
    throw new Error(`Auth secret binding '${session.secretKey}' not found in environment. Available bindings: ${Object.keys(bindings).join(", ")}`);
  }
  const kv = getKVStore(context, session.kvBinding);
  if (!kv) {
    throw new Error(`KV binding '${session.kvBinding}' not found for session. `);
  }
  return { secret, kv };
}
function createAuthSessionStorage(context) {
  const authConfig = getContext(context, authConfigContext);
  if (!authConfig) {
    throw new Error("Auth configuration not found in context. Ensure auth middleware is properly configured.");
  }
  const { secret, kv } = resolveAuthBindings(context);
  const { session } = authConfig;
  return createWorkersKVSessionStorage({
    kv,
    cookie: {
      name: session.cookie.name,
      httpOnly: session.cookie.httpOnly,
      maxAge: session.cookie.maxAge,
      path: session.cookie.path,
      sameSite: session.cookie.sameSite,
      secrets: [secret],
      secure: session.cookie.secure === "auto" ? isProduction(context) : session.cookie.secure ?? false
    }
  });
}
async function getAuthSession(request, context) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const user = session.get("user");
    const challenge = session.get("challenge");
    if (!user) {
      return ok(null);
    }
    return ok({ user, challenge });
  } catch (error) {
    return err("Failed to get session", { error });
  }
}
async function verifyChallengeUniqueness(challenge, context) {
  try {
    const { kv } = resolveAuthBindings(context);
    const uniqueKey = challengeKvTemplate(challenge);
    const existing = await kv.get(uniqueKey);
    if (existing) {
      return err("Challenge already used", { challenge });
    }
    await kv.put(uniqueKey, "used", { expirationTtl: 300 });
    return ok(true);
  } catch (error) {
    return err("Failed to verify challenge uniqueness", { challenge, error });
  }
}
async function cleanupChallengeSession(challenge, context) {
  try {
    const { kv } = resolveAuthBindings(context);
    const uniqueKey = challengeKvTemplate(challenge);
    await kv.delete(uniqueKey);
    return ok(void 0);
  } catch (error) {
    return err("Failed to cleanup challenge uniqueness", { challenge, error });
  }
}
async function createChallengeSession(context, challenge) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession();
    session.set("challenge", challenge);
    session.set("challengeCreatedAt", Date.now());
    const cookie = await sessionStorage.commitSession(session);
    return ok(cookie);
  } catch (error) {
    return err("Failed to create challenge session", { error });
  }
}
async function getChallengeFromSession(request, context) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const storedChallenge = session.get("challenge");
    const challengeCreatedAt = session.get("challengeCreatedAt");
    if (!storedChallenge || !challengeCreatedAt) {
      return err("Invalid session. Please refresh and try again.", { field: "general" });
    }
    return ok({ challenge: storedChallenge, challengeCreatedAt, session });
  } catch (error) {
    return err("Failed to get challenge from session", { error });
  }
}
async function destroyChallengeSession(session, context) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    await sessionStorage.destroySession(session);
    return ok(void 0);
  } catch (error) {
    return err("Failed to destroy challenge session", { error });
  }
}
async function createAuthSession(context, sessionData) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const newSession = await sessionStorage.getSession();
    newSession.set("user", sessionData.user);
    newSession.set("authenticatedAt", Date.now());
    const cookie = await sessionStorage.commitSession(newSession);
    return ok(cookie);
  } catch (error) {
    return err("Failed to create session", { error });
  }
}
async function updateAuthSession(request, context, sessionData) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    if (sessionData.user) {
      session.set("user", sessionData.user);
    }
    if (sessionData.challenge !== void 0) {
      session.set("challenge", sessionData.challenge);
    }
    const cookie = await sessionStorage.commitSession(session);
    return ok(cookie);
  } catch (error) {
    return err("Failed to update session", { error });
  }
}
async function destroyAuthSession(request, context) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const cookie = await sessionStorage.destroySession(session);
    return ok(cookie);
  } catch (error) {
    return err("Failed to destroy session", { error });
  }
}
function authSessionMiddleware(authConfig) {
  return async ({ request, context }, next) => {
    setContext(context, authConfigContext, authConfig);
    const authSession = await getAuthSession(request, context);
    if (!isError(authSession) && authSession !== null && authSession.user) {
      if (authSession.user.status === "active") {
        setContext(context, authUserContext, authSession.user);
      }
      return next();
    }
    const cookieHeader = request.headers.get("Cookie");
    const sessionCookieName = authConfig?.session.cookie.name || defaultAuthConfig.session.cookie.name;
    if (cookieHeader?.includes(sessionCookieName)) {
      const sessionStorage = createAuthSessionStorage(context);
      const session = await sessionStorage.getSession(cookieHeader);
      const hasUser = session.get("user");
      const hasChallenge = session.get("challenge");
      if (!hasUser && !hasChallenge) {
        const destroyResult = await destroyAuthSession(request, context);
        if (!isError(destroyResult)) {
          const response = await next();
          return middlewarePassthrough(response, { set: { "Set-Cookie": destroyResult } });
        }
      }
    }
    return next();
  };
}
function unguardedAuthMiddleware(authConfig) {
  return [authSessionMiddleware(authConfig), unprotectedAuthMiddleware(authConfig)];
}
function guardedAuthMiddleware(authConfig) {
  return [authSessionMiddleware(authConfig), protectedAuthMiddleware(authConfig)];
}
function verifyRouteMiddleware(authConfig) {
  return [authSessionMiddleware(authConfig), verifyAuthMiddleware(authConfig)];
}
function verifyAuthMiddleware(authConfig) {
  return async ({ request, context }, next) => {
    const user = getAuthUser(context);
    if (user) {
      throw redirect(authConfig?.routes.signedin || defaultAuthRoutes.signedin);
    }
    const sessionResult = await getAuthSession(request, context);
    if (isError(sessionResult) || !sessionResult?.user) {
      throw redirect(authConfig?.routes.signin || defaultAuthRoutes.signin);
    }
    return next();
  };
}
function protectedAuthMiddleware(authConfig) {
  return async ({ context }, next) => {
    const user = getAuthUser(context);
    if (!user) {
      throw redirect(authConfig?.routes.signedout || defaultAuthRoutes.signedout);
    }
    return next();
  };
}
function unprotectedAuthMiddleware(authConfig) {
  return async ({ request, context }, next) => {
    const user = getAuthUser(context);
    if (user) {
      throw redirect(authConfig?.routes.signedin || defaultAuthRoutes.signedin);
    }
    const sessionResult = await getAuthSession(request, context);
    if (!isError(sessionResult) && sessionResult?.user && sessionResult.user.status !== "active") {
      throw redirect(authConfig?.routes.verify || defaultAuthRoutes.verify);
    }
    return next();
  };
}
const emailField = pipe(string(), nonEmpty("Please enter your email."), email("Please enter a valid email."), maxLength(254, "Email exceeds maximum length"));
const displayNameField = pipe(string(), nonEmpty("Display name is required"), minLength(1, "Display name is required"));
const authFormSchema = object({ email: emailField });
const signupFormSchema = object({ email: emailField, displayName: displayNameField });
const signinFormSchema = object({ email: emailField });
const changeEmailSchema = object({ newEmail: emailField });
const entityKind = Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
_a = entityKind;
class Column {
  constructor(table, config) {
    __publicField(this, "name");
    __publicField(this, "keyAsName");
    __publicField(this, "primary");
    __publicField(this, "notNull");
    __publicField(this, "default");
    __publicField(this, "defaultFn");
    __publicField(this, "onUpdateFn");
    __publicField(this, "hasDefault");
    __publicField(this, "isUnique");
    __publicField(this, "uniqueName");
    __publicField(this, "uniqueType");
    __publicField(this, "dataType");
    __publicField(this, "columnType");
    __publicField(this, "enumValues");
    __publicField(this, "generated");
    __publicField(this, "generatedIdentity");
    __publicField(this, "config");
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
}
__publicField(Column, _a, "Column");
_b = entityKind;
class ColumnBuilder {
  constructor(name, dataType, columnType) {
    __publicField(this, "config");
    /**
     * Alias for {@link $defaultFn}.
     */
    __publicField(this, "$default", this.$defaultFn);
    /**
     * Alias for {@link $onUpdateFn}.
     */
    __publicField(this, "$onUpdate", this.$onUpdateFn);
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
}
__publicField(ColumnBuilder, _b, "ColumnBuilder");
const TableName = Symbol.for("drizzle:Name");
const isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
_c = entityKind;
class Subquery {
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
}
__publicField(Subquery, _c, "Subquery");
const tracer = {
  startActiveSpan(name, fn) {
    {
      return fn();
    }
  }
};
const ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");
const Schema = Symbol.for("drizzle:Schema");
const Columns = Symbol.for("drizzle:Columns");
const ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
const OriginalName = Symbol.for("drizzle:OriginalName");
const BaseName = Symbol.for("drizzle:BaseName");
const IsAlias = Symbol.for("drizzle:IsAlias");
const ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
const IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
_m = entityKind, _l = TableName, _k = OriginalName, _j = Schema, _i = Columns, _h = ExtraConfigColumns, _g = BaseName, _f = IsAlias, _e = IsDrizzleTable, _d = ExtraConfigBuilder;
class Table {
  constructor(name, schema, baseName) {
    /**
     * @internal
     * Can be changed if the table is aliased.
     */
    __publicField(this, _l);
    /**
     * @internal
     * Used to store the original name of the table, before any aliasing.
     */
    __publicField(this, _k);
    /** @internal */
    __publicField(this, _j);
    /** @internal */
    __publicField(this, _i);
    /** @internal */
    __publicField(this, _h);
    /**
     *  @internal
     * Used to store the table name before the transformation via the `tableCreator` functions.
     */
    __publicField(this, _g);
    /** @internal */
    __publicField(this, _f, false);
    /** @internal */
    __publicField(this, _e, true);
    /** @internal */
    __publicField(this, _d);
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}
__publicField(Table, _m, "Table");
/** @internal */
__publicField(Table, "Symbol", {
  Name: TableName,
  Schema,
  OriginalName,
  Columns,
  ExtraConfigColumns,
  BaseName,
  IsAlias,
  ExtraConfigBuilder
});
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
_n = entityKind;
class StringChunk {
  constructor(value) {
    __publicField(this, "value");
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}
__publicField(StringChunk, _n, "StringChunk");
_o = entityKind;
const _SQL = class _SQL {
  constructor(queryChunks) {
    /** @internal */
    __publicField(this, "decoder", noopDecoder);
    __publicField(this, "shouldInlineParams", false);
    /** @internal */
    __publicField(this, "usedTables", []);
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
__publicField(_SQL, _o, "SQL");
let SQL = _SQL;
_p = entityKind;
class Name {
  constructor(value) {
    __publicField(this, "brand");
    this.value = value;
  }
  getSQL() {
    return new SQL([this]);
  }
}
__publicField(Name, _p, "Name");
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
const noopDecoder = {
  mapFromDriverValue: (value) => value
};
const noopEncoder = {
  mapToDriverValue: (value) => value
};
({
  ...noopDecoder,
  ...noopEncoder
});
_q = entityKind;
class Param {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    __publicField(this, "brand");
    this.value = value;
    this.encoder = encoder;
  }
  getSQL() {
    return new SQL([this]);
  }
}
__publicField(Param, _q, "Param");
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  var _a2;
  _a2 = entityKind;
  const _Aliased = class _Aliased {
    constructor(sql2, fieldAlias) {
      /** @internal */
      __publicField(this, "isSelectionField", false);
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new _Aliased(this.sql, this.fieldAlias);
    }
  };
  __publicField(_Aliased, _a2, "SQL.Aliased");
  let Aliased = _Aliased;
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
_r = entityKind;
class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  getSQL() {
    return new SQL([this]);
  }
}
__publicField(Placeholder, _r, "Placeholder");
const IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
_u = entityKind, _t = ViewBaseConfig, _s = IsDrizzleView;
class View {
  constructor({ name: name2, schema, selectedFields, query }) {
    /** @internal */
    __publicField(this, _t);
    /** @internal */
    __publicField(this, _s, true);
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
__publicField(View, _u, "View");
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
const textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
const eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
const lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
_v = entityKind;
class ForeignKeyBuilder {
  constructor(config, actions) {
    /** @internal */
    __publicField(this, "reference");
    /** @internal */
    __publicField(this, "_onUpdate");
    /** @internal */
    __publicField(this, "_onDelete");
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
}
__publicField(ForeignKeyBuilder, _v, "SQLiteForeignKeyBuilder");
_w = entityKind;
class ForeignKey {
  constructor(table, builder) {
    __publicField(this, "reference");
    __publicField(this, "onUpdate");
    __publicField(this, "onDelete");
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}
__publicField(ForeignKey, _w, "SQLiteForeignKey");
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
class SQLiteColumnBuilder extends (_y = ColumnBuilder, _x = entityKind, _y) {
  constructor() {
    super(...arguments);
    __publicField(this, "foreignKeyConfigs", []);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
}
__publicField(SQLiteColumnBuilder, _x, "SQLiteColumnBuilder");
class SQLiteColumn extends (_A = Column, _z = entityKind, _A) {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
}
__publicField(SQLiteColumn, _z, "SQLiteColumn");
class SQLiteBigIntBuilder extends (_C = SQLiteColumnBuilder, _B = entityKind, _C) {
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}
__publicField(SQLiteBigIntBuilder, _B, "SQLiteBigIntBuilder");
class SQLiteBigInt extends (_E = SQLiteColumn, _D = entityKind, _E) {
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
}
__publicField(SQLiteBigInt, _D, "SQLiteBigInt");
class SQLiteBlobJsonBuilder extends (_G = SQLiteColumnBuilder, _F = entityKind, _G) {
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
}
__publicField(SQLiteBlobJsonBuilder, _F, "SQLiteBlobJsonBuilder");
class SQLiteBlobJson extends (_I = SQLiteColumn, _H = entityKind, _I) {
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
}
__publicField(SQLiteBlobJson, _H, "SQLiteBlobJson");
class SQLiteBlobBufferBuilder extends (_K = SQLiteColumnBuilder, _J = entityKind, _K) {
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}
__publicField(SQLiteBlobBufferBuilder, _J, "SQLiteBlobBufferBuilder");
class SQLiteBlobBuffer extends (_M = SQLiteColumn, _L = entityKind, _M) {
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
}
__publicField(SQLiteBlobBuffer, _L, "SQLiteBlobBuffer");
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
class SQLiteCustomColumnBuilder extends (_O = SQLiteColumnBuilder, _N = entityKind, _O) {
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
}
__publicField(SQLiteCustomColumnBuilder, _N, "SQLiteCustomColumnBuilder");
class SQLiteCustomColumn extends (_Q = SQLiteColumn, _P = entityKind, _Q) {
  constructor(table, config) {
    super(table, config);
    __publicField(this, "sqlName");
    __publicField(this, "mapTo");
    __publicField(this, "mapFrom");
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
__publicField(SQLiteCustomColumn, _P, "SQLiteCustomColumn");
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}
class SQLiteBaseIntegerBuilder extends (_S = SQLiteColumnBuilder, _R = entityKind, _S) {
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
}
__publicField(SQLiteBaseIntegerBuilder, _R, "SQLiteBaseIntegerBuilder");
class SQLiteBaseInteger extends (_U = SQLiteColumn, _T = entityKind, _U) {
  constructor() {
    super(...arguments);
    __publicField(this, "autoIncrement", this.config.autoIncrement);
  }
  getSQLType() {
    return "integer";
  }
}
__publicField(SQLiteBaseInteger, _T, "SQLiteBaseInteger");
class SQLiteIntegerBuilder extends (_W = SQLiteBaseIntegerBuilder, _V = entityKind, _W) {
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
}
__publicField(SQLiteIntegerBuilder, _V, "SQLiteIntegerBuilder");
class SQLiteInteger extends (_Y = SQLiteBaseInteger, _X = entityKind, _Y) {
}
__publicField(SQLiteInteger, _X, "SQLiteInteger");
class SQLiteTimestampBuilder extends (__ = SQLiteBaseIntegerBuilder, _Z = entityKind, __) {
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
}
__publicField(SQLiteTimestampBuilder, _Z, "SQLiteTimestampBuilder");
class SQLiteTimestamp extends (_aa = SQLiteBaseInteger, _$ = entityKind, _aa) {
  constructor() {
    super(...arguments);
    __publicField(this, "mode", this.config.mode);
  }
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
}
__publicField(SQLiteTimestamp, _$, "SQLiteTimestamp");
class SQLiteBooleanBuilder extends (_ca = SQLiteBaseIntegerBuilder, _ba = entityKind, _ca) {
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
}
__publicField(SQLiteBooleanBuilder, _ba, "SQLiteBooleanBuilder");
class SQLiteBoolean extends (_ea = SQLiteBaseInteger, _da = entityKind, _ea) {
  constructor() {
    super(...arguments);
    __publicField(this, "mode", this.config.mode);
  }
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
__publicField(SQLiteBoolean, _da, "SQLiteBoolean");
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
class SQLiteNumericBuilder extends (_ga = SQLiteColumnBuilder, _fa = entityKind, _ga) {
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
}
__publicField(SQLiteNumericBuilder, _fa, "SQLiteNumericBuilder");
class SQLiteNumeric extends (_ia = SQLiteColumn, _ha = entityKind, _ia) {
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}
__publicField(SQLiteNumeric, _ha, "SQLiteNumeric");
class SQLiteNumericNumberBuilder extends (_ka = SQLiteColumnBuilder, _ja = entityKind, _ka) {
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
}
__publicField(SQLiteNumericNumberBuilder, _ja, "SQLiteNumericNumberBuilder");
class SQLiteNumericNumber extends (_ma = SQLiteColumn, _la = entityKind, _ma) {
  constructor() {
    super(...arguments);
    __publicField(this, "mapToDriverValue", String);
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  getSQLType() {
    return "numeric";
  }
}
__publicField(SQLiteNumericNumber, _la, "SQLiteNumericNumber");
class SQLiteNumericBigIntBuilder extends (_oa = SQLiteColumnBuilder, _na = entityKind, _oa) {
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
}
__publicField(SQLiteNumericBigIntBuilder, _na, "SQLiteNumericBigIntBuilder");
class SQLiteNumericBigInt extends (_qa = SQLiteColumn, _pa = entityKind, _qa) {
  constructor() {
    super(...arguments);
    __publicField(this, "mapFromDriverValue", BigInt);
    __publicField(this, "mapToDriverValue", String);
  }
  getSQLType() {
    return "numeric";
  }
}
__publicField(SQLiteNumericBigInt, _pa, "SQLiteNumericBigInt");
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
class SQLiteRealBuilder extends (_sa = SQLiteColumnBuilder, _ra = entityKind, _sa) {
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}
__publicField(SQLiteRealBuilder, _ra, "SQLiteRealBuilder");
class SQLiteReal extends (_ua = SQLiteColumn, _ta = entityKind, _ua) {
  getSQLType() {
    return "real";
  }
}
__publicField(SQLiteReal, _ta, "SQLiteReal");
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
class SQLiteTextBuilder extends (_wa = SQLiteColumnBuilder, _va = entityKind, _wa) {
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
}
__publicField(SQLiteTextBuilder, _va, "SQLiteTextBuilder");
class SQLiteText extends (_ya = SQLiteColumn, _xa = entityKind, _ya) {
  constructor(table, config) {
    super(table, config);
    __publicField(this, "enumValues", this.config.enumValues);
    __publicField(this, "length", this.config.length);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}
__publicField(SQLiteText, _xa, "SQLiteText");
class SQLiteTextJsonBuilder extends (_Aa = SQLiteColumnBuilder, _za = entityKind, _Aa) {
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
}
__publicField(SQLiteTextJsonBuilder, _za, "SQLiteTextJsonBuilder");
class SQLiteTextJson extends (_Ca = SQLiteColumn, _Ba = entityKind, _Ca) {
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
}
__publicField(SQLiteTextJson, _Ba, "SQLiteTextJson");
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}
const InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");
class SQLiteTable extends (_Ha = Table, _Ga = entityKind, _Fa = Table.Symbol.Columns, _Ea = InlineForeignKeys, _Da = Table.Symbol.ExtraConfigBuilder, _Ha) {
  constructor() {
    super(...arguments);
    /** @internal */
    __publicField(this, _Fa);
    /** @internal */
    __publicField(this, _Ea, []);
    /** @internal */
    __publicField(this, _Da);
  }
}
__publicField(SQLiteTable, _Ga, "SQLiteTable");
/** @internal */
__publicField(SQLiteTable, "Symbol", Object.assign({}, Table.Symbol, {
  InlineForeignKeys
}));
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  return table;
}
const sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns);
};
const users = sqliteTable("users", {
  id: cuid("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  status: text("status", { enum: ["active", "unverified", "unrecovered", "deleted"] }).notNull().default("unverified").$type(),
  pending: text("pending", { mode: "json" }).$type(),
  createdAt,
  updatedAt
});
const authenticators = sqliteTable("authenticators", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialPublicKey: text("credential_public_key").notNull(),
  counter: integer("counter").notNull(),
  credentialDeviceType: text("credential_device_type").notNull(),
  credentialBackedUp: integer("credential_backed_up", { mode: "boolean" }).notNull(),
  transports: text("transports", { mode: "json" }).notNull().$type(),
  aaguid: text("aaguid").notNull(),
  name: text("name"),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  attestationType: text("attestation_type").notNull().default("none"),
  rpId: text("rp_id").notNull(),
  algorithm: integer("algorithm").notNull(),
  createdAt,
  updatedAt
});
function createAuthRepository(db) {
  return {
    /** Get user by ID */
    getUserById: async (id) => {
      return tryCatch(async () => {
        const result = await db.select().from(users).where(eq(users.id, id)).get();
        if (!result) {
          return notFoundError("User", id);
        }
        return result;
      }, `Failed to get user by ID: ${id}`);
    },
    /** Get user by email */
    getUserByEmail: async (email2) => {
      return tryCatch(async () => {
        const result = await db.select().from(users).where(eq(users.email, email2)).get();
        if (!result) {
          return notFoundError("User", email2);
        }
        return result;
      }, `Failed to get user by email: ${email2}`);
    },
    /** Create a new user */
    createUser: async (email2, displayName) => {
      try {
        const newUser = { email: email2, displayName };
        const [result] = await db.insert(users).values(newUser).returning();
        if (!result) {
          return err("Failed to create user", { email: email2, displayName });
        }
        return result;
      } catch (error) {
        if (error instanceof Error && error.message.includes("UNIQUE")) {
          return err("Email already exists", {
            email: email2,
            code: "DUPLICATE_USER"
          });
        }
        return serverError("Failed to create user", error);
      }
    },
    /** Get authenticator by ID */
    getAuthenticatorById: async (id) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.id, id)).get();
        if (!result) {
          return notFoundError("Authenticator", id);
        }
        return result;
      }, `Failed to get authenticator by ID: ${id}`);
    },
    /** Get all authenticators for a user */
    getAuthenticatorsByUserId: async (userId) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();
        return result;
      }, `Failed to get authenticators for user: ${userId}`);
    },
    /** Create a new authenticator */
    createAuthenticator: async (authenticator) => {
      try {
        const [result] = await db.insert(authenticators).values(authenticator).returning();
        if (!result) {
          return err("Failed to create authenticator", { id: authenticator.id });
        }
        return result;
      } catch (error) {
        return serverError("Failed to create authenticator", error);
      }
    },
    /** Update authenticator counter */
    updateAuthenticatorCounter: async (id, counter) => {
      try {
        const result = await db.update(authenticators).set({ counter }).where(eq(authenticators.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("Authenticator", id);
        }
        return true;
      } catch (error) {
        return serverError("Failed to update authenticator counter", error);
      }
    },
    /** Update authenticator usage (counter and last used timestamp) */
    updateAuthenticatorUsage: async (id, counter, lastUsedAt) => {
      try {
        const result = await db.update(authenticators).set({
          counter,
          lastUsedAt
        }).where(eq(authenticators.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("Authenticator", id);
        }
        return true;
      } catch (error) {
        return serverError("Failed to update authenticator usage", error);
      }
    },
    /** Update authenticator name */
    updateAuthenticatorName: async (id, name) => {
      try {
        const result = await db.update(authenticators).set({ name }).where(eq(authenticators.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("Authenticator", id);
        }
        const updatedAuthenticator = result[0];
        if (!updatedAuthenticator) {
          return serverError("Failed to retrieve updated authenticator", new Error("Update returned empty result"));
        }
        return updatedAuthenticator;
      } catch (error) {
        return serverError("Failed to update authenticator name", error);
      }
    },
    /** Delete an authenticator */
    deleteAuthenticator: async (id) => {
      try {
        const result = await db.delete(authenticators).where(eq(authenticators.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("Authenticator", id);
        }
        return true;
      } catch (error) {
        return serverError("Failed to delete authenticator", error);
      }
    },
    /** Check if an authenticator belongs to a specific user */
    authenticatorBelongsToUser: async (id, userId) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.id, id)).get();
        if (!result) {
          return false;
        }
        return result.userId === userId;
      }, `Failed to verify authenticator ownership for ID: ${id}`);
    },
    /** Count authenticators for a user */
    countAuthenticatorsByUserId: async (userId) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();
        return result.length;
      }, `Failed to count authenticators for user: ${userId}`);
    },
    /** Update user email and set status to unverified */
    updateUserEmail: async (id, newEmail) => {
      try {
        const result = await db.update(users).set({ email: newEmail, status: "unverified" }).where(eq(users.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("User", id);
        }
        const updatedUser = result[0];
        if (!updatedUser) {
          return serverError("Failed to retrieve updated user", new Error("Update returned empty result"));
        }
        return updatedUser;
      } catch (error) {
        if (error instanceof Error && error.message.includes("UNIQUE")) {
          return err("Email already exists", {
            email: newEmail,
            code: "DUPLICATE_EMAIL"
          });
        }
        return serverError("Failed to update user email", error);
      }
    },
    /** Update user status */
    updateUserStatus: async (id, status) => {
      try {
        const result = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("User", id);
        }
        const updatedUser = result[0];
        if (!updatedUser) {
          return serverError("Failed to retrieve updated user", new Error("Update returned empty result"));
        }
        return updatedUser;
      } catch (error) {
        return serverError("Failed to update user status", error);
      }
    },
    /** Update user pending data */
    updateUserPending: async (id, pending) => {
      try {
        const result = await db.update(users).set({ pending }).where(eq(users.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("User", id);
        }
        const updatedUser = result[0];
        if (!updatedUser) {
          return serverError("Failed to retrieve updated user", new Error("Update returned empty result"));
        }
        return updatedUser;
      } catch (error) {
        return serverError("Failed to update user pending data", error);
      }
    },
    /** Delete all authenticators created before a specific timestamp */
    deleteAuthenticatorsByTimestamp: async (userId, beforeTimestamp) => {
      try {
        const beforeDate = new Date(beforeTimestamp);
        const result = await db.delete(authenticators).where(and(eq(authenticators.userId, userId), lt(authenticators.updatedAt, beforeDate))).returning();
        return result.length;
      } catch (error) {
        return serverError("Failed to delete authenticators by timestamp", error);
      }
    },
    /** Delete a user and all their authenticators */
    deleteUser: async (id) => {
      try {
        const _deleteAuthenticatorsResult = await db.delete(authenticators).where(eq(authenticators.userId, id));
        const deleteUserResult = await db.delete(users).where(eq(users.id, id)).returning();
        if (deleteUserResult.length === 0) {
          return notFoundError("User", id);
        }
        return true;
      } catch (error) {
        return serverError("Failed to delete user", error);
      }
    },
    /** Delete user account (soft delete with anonymization) */
    deleteUserAccount: async (id) => {
      try {
        const timestamp = Date.now();
        const anonymizedEmail = `deleted_${id}_${timestamp}@deleted.local`;
        const result = await db.update(users).set({
          email: anonymizedEmail,
          displayName: "Deleted User",
          status: "deleted",
          pending: null
        }).where(eq(users.id, id)).returning();
        if (result.length === 0) {
          return notFoundError("User", id);
        }
        const deletedUser = result[0];
        if (!deletedUser) {
          return serverError("Failed to retrieve deleted user", new Error("Update returned empty result"));
        }
        return deletedUser;
      } catch (error) {
        return serverError("Failed to delete user account", error);
      }
    }
  };
}
function getAuthRepository(context) {
  const db = getDatabase(context);
  return createAuthRepository(db);
}
async function profileLoader({ context }) {
  const user = requireAuthUser(context);
  return ok({ user });
}
async function getUserWithAuthenticators(context, userId) {
  const repository = getAuthRepository(context);
  const userResult = await repository.getUserById(userId);
  if (isError(userResult)) {
    return userResult;
  }
  const authenticatorsResult = await repository.getAuthenticatorsByUserId(userId);
  if (isError(authenticatorsResult)) {
    return authenticatorsResult;
  }
  return ok({ user: userResult, authenticators: authenticatorsResult });
}
const emailContext = createContext(null);
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
const RecoveryVerificationTemplate = defineEmailTemplate({
  component: ({ code, email: email2, verificationUrl }) => /* @__PURE__ */ jsxs(Html, { lang: "en", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Body, { className: "bg-white font-sans", children: /* @__PURE__ */ jsxs(Container, { className: "mx-auto max-w-2xl text-foreground leading-relaxed", children: [
      /* @__PURE__ */ jsx(Section, { className: "px-5 pt-10 pb-5 text-center", children: /* @__PURE__ */ jsx(Heading, { level: 1, children: "Account Recovery Request" }) }),
      /* @__PURE__ */ jsxs(Section, { className: "m-5 rounded-lg border-2 border-border bg-muted p-5 text-center", children: [
        /* @__PURE__ */ jsxs(Text, { children: [
          "An account recovery request for ",
          /* @__PURE__ */ jsx("strong", { children: email2 }),
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
        /* @__PURE__ */ jsx(Text, { className: "mx-2", children: /* @__PURE__ */ jsx(Link, { href: verificationUrl, className: "font-bold no-underline", children: "Click this link to approve the change" }) }),
        /* @__PURE__ */ jsxs(Text, { className: "mx-2", children: [
          /* @__PURE__ */ jsx(Text, { children: "If having trouble using the link above, use the url below to verify." }),
          /* @__PURE__ */ jsx(Link, { href: verificationUrl, className: "underline", children: verificationUrl })
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
            email2
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
function base32Decode(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanInput = input.replace(/[^A-Z2-7]/gi, "").toUpperCase();
  let bits = "";
  for (const char of cleanInput) {
    const value = alphabet.indexOf(char);
    if (value === -1) throw new Error(`Invalid base32 character: ${char}`);
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}
function normalizeSecret(secret) {
  if (secret instanceof Uint8Array) return secret;
  try {
    return base32Decode(secret);
  } catch {
    return new TextEncoder().encode(secret);
  }
}
function uint64ToBytes(num) {
  const bytes = new Uint8Array(8);
  const high = Math.floor(num / 4294967296);
  const low = num & 4294967295;
  bytes[0] = high >>> 24 & 255;
  bytes[1] = high >>> 16 & 255;
  bytes[2] = high >>> 8 & 255;
  bytes[3] = high & 255;
  bytes[4] = low >>> 24 & 255;
  bytes[5] = low >>> 16 & 255;
  bytes[6] = low >>> 8 & 255;
  bytes[7] = low & 255;
  return bytes;
}
async function hmac(algorithm, key, data) {
  const keyBuffer = new ArrayBuffer(key.length);
  new Uint8Array(keyBuffer).set(key);
  const dataBuffer = new ArrayBuffer(data.length);
  new Uint8Array(dataBuffer).set(data);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "HMAC", hash: algorithm }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}
function dynamicTruncation(hash, digits) {
  const offset = hash[hash.length - 1] & 15;
  const code = (hash[offset] & 127) << 24 | (hash[offset + 1] & 255) << 16 | (hash[offset + 2] & 255) << 8 | hash[offset + 3] & 255;
  return (code % 10 ** digits).toString().padStart(digits, "0");
}
function constantTimeEqual(a, b) {
  const maxLength2 = Math.max(a.length, b.length);
  const aPadded = a.padEnd(maxLength2, "\0");
  const bPadded = b.padEnd(maxLength2, "\0");
  let result = 0;
  for (let i = 0; i < maxLength2; i++) {
    result |= aPadded.charCodeAt(i) ^ bPadded.charCodeAt(i);
  }
  result |= a.length ^ b.length;
  return result === 0;
}
function generateSecret(length = 32) {
  if (length <= 0) throw new Error("Length must be positive");
  return crypto.getRandomValues(new Uint8Array(length));
}
function base32Encode(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    result += alphabet[Number.parseInt(chunk, 2)];
  }
  return result;
}
async function generateTOTP(options) {
  const { secret, timestamp = Date.now(), period = 30, digits = 6, algorithm = "SHA-1" } = options;
  if (period <= 0) throw new Error("Period must be positive");
  const counter = Math.floor(timestamp / 1e3 / period);
  const secretBytes = normalizeSecret(secret);
  const counterBytes = uint64ToBytes(counter);
  const algoName = algorithm === "SHA-1" ? "SHA-1" : algorithm === "SHA-256" ? "SHA-256" : "SHA-512";
  const hash = await hmac(algoName, secretBytes, counterBytes);
  return dynamicTruncation(hash, digits);
}
async function verifyTOTP(options) {
  const { token, window = 1, timestamp = Date.now(), period = 30, ...totpOptions } = options;
  if (!/^\d+$/.test(token)) {
    return { valid: false };
  }
  const currentPeriod = Math.floor(timestamp / 1e3 / period);
  for (let i = -window; i <= window; i++) {
    const testPeriod = currentPeriod + i;
    const testTimestamp = testPeriod * period * 1e3;
    const expectedToken = await generateTOTP({
      ...totpOptions,
      timestamp: testTimestamp,
      period
    });
    if (constantTimeEqual(token, expectedToken)) {
      return { valid: true, timestamp: testTimestamp };
    }
  }
  return { valid: false };
}
const kvKeyTemplate = (purpose, email2) => `totp:${purpose}:${email2}`;
async function createVerificationCode(email2, purpose, context, metadata) {
  try {
    const authConfig = getContext(context, authConfigContext);
    if (!authConfig) {
      return err("Auth configuration not found");
    }
    const env = getBindings(context);
    const kv = env[authConfig.session.kvBinding];
    if (!kv) {
      return err(`KV binding '${authConfig.session.kvBinding}' not found`);
    }
    const secret = base32Encode(generateSecret());
    const period = authConfig.verification.period;
    const digits = authConfig.verification.digits;
    const code = await generateTOTP({ secret, period, digits });
    const verificationData = {
      secret,
      expireAt: Date.now() + period * 1e3,
      attempts: 0,
      purpose,
      metadata
    };
    await kv.put(kvKeyTemplate(purpose, email2), JSON.stringify(verificationData), { expirationTtl: period });
    return ok(code);
  } catch (error) {
    logger.error("verification_code_creation_failed", {
      email: email2,
      purpose,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : void 0
    });
    return err("Failed to create verification code", { error });
  }
}
async function verifyCode(email2, code, purpose, context) {
  try {
    const authConfig = getContext(context, authConfigContext);
    if (!authConfig) {
      return err("Auth configuration not found");
    }
    const env = getBindings(context);
    const kv = env[authConfig.session.kvBinding];
    if (!kv) {
      return err(`KV binding '${authConfig.session.kvBinding}' not found`);
    }
    const kvKey = kvKeyTemplate(purpose, email2);
    const storedData = await kv.get(kvKey);
    if (!storedData) {
      logger.warning("verification_code_not_found", { email: email2, purpose });
      return err("Verification code expired or not found");
    }
    const verification = JSON.parse(storedData);
    if (verification.purpose !== purpose) {
      logger.warning("verification_purpose_mismatch", {
        email: email2,
        expected: purpose,
        actual: verification.purpose
      });
      return err("Invalid verification code");
    }
    if (verification.attempts >= authConfig.verification.maxAttempts) {
      await kv.delete(kvKey);
      logger.warning("verification_max_attempts", { email: email2, purpose });
      return err("Maximum verification attempts reached");
    }
    if (Date.now() > verification.expireAt) {
      await kv.delete(kvKey);
      logger.warning("verification_expired", { email: email2, purpose });
      return err("Verification code has expired");
    }
    const result = await verifyTOTP({
      secret: verification.secret,
      token: code,
      period: authConfig.verification.period,
      digits: authConfig.verification.digits,
      window: authConfig.verification.window
    });
    if (!result.valid) {
      await kv.put(kvKey, JSON.stringify({ ...verification, attempts: verification.attempts + 1 }), { expirationTtl: authConfig.verification.period });
      logger.warning("verification_code_invalid", { email: email2, purpose, attempts: verification.attempts + 1 });
      return err("Invalid verification code");
    }
    await kv.delete(kvKey);
    return ok(verification);
  } catch (error) {
    logger.error("verification_code_verification_failed", {
      email: email2,
      purpose,
      error: error instanceof Error ? error.message : String(error)
    });
    return err("Failed to verify code", { error });
  }
}
async function sendRecoveryVerification(email2, context, verificationUrl) {
  try {
    const codeResult = await createVerificationCode(email2, "recovery", context, { email: email2 });
    if (isError(codeResult)) {
      logger.error("recovery_verification_code_generation_failed", { email: email2, error: flattenError(codeResult) });
      return codeResult;
    }
    const code = codeResult;
    const emailTemplate = await renderEmailTemplate(RecoveryVerificationTemplate, {
      code,
      email: email2,
      verificationUrl
    });
    const sendResult = await sendMail(context, { to: email2, template: emailTemplate });
    if (isError(sendResult)) {
      logger.error("recovery_verification_send_failed", { email: email2, error: flattenError(sendResult) });
      return sendResult;
    }
    return ok(void 0);
  } catch (error) {
    logger.error("recovery_verification_unexpected_error", { email: email2, error: error instanceof Error ? error.message : "Unknown error", stack: error instanceof Error ? error.stack : void 0 });
    return err("Failed to send recovery verification", { error });
  }
}
async function requestAccountRecovery(email2, context, verificationUrl) {
  const repository = getAuthRepository(context);
  const userResult = await repository.getUserByEmail(email2);
  if (isError(userResult)) {
    logger.error("recovery_request_email_not_found", { email: email2 });
    return ok(null);
  }
  const user = userResult;
  const statusUpdateResult = await repository.updateUserStatus(user.id, "unrecovered");
  if (isError(statusUpdateResult)) {
    logger.error("recovery_request_status_update_failed", { userId: user.id, email: email2, error: flattenError(statusUpdateResult) });
    return statusUpdateResult;
  }
  const verificationResult = await sendRecoveryVerification(email2, context, verificationUrl);
  if (isError(verificationResult)) {
    logger.error("recovery_request_verification_email_failed", { userId: user.id, email: email2, error: flattenError(verificationResult) });
    await repository.updateUserStatus(user.id, user.status);
    return verificationResult;
  }
  return ok(statusUpdateResult);
}
const recoverFormSchema = object({
  email: pipe(string(), minLength(1, "Email is required"), email("Must be a valid email address"))
});
async function recoverLoader({ context }) {
  const token = requireCSRFToken(context);
  return respondOk({
    token
  });
}
async function recoverAction({ request, context }) {
  const formData = await request.formData();
  const authConfig = getContext(context, authConfigContext);
  const handlers = {
    /**
     * Request account recovery
     */
    recover: async (formData2) => {
      const validationResult = await validateFormData(recoverFormSchema, formData2);
      if (isError(validationResult)) {
        return validationResult;
      }
      const { email: email2 } = validationResult;
      const result2 = await requestAccountRecovery(email2, context);
      if (isError(result2)) {
        if (isSystemError(result2)) {
          logger.error("recover_email_system_error", { email: email2, error: flattenError(result2) });
        }
        return result2;
      }
      const user = result2;
      if (user) {
        const sessionResult = await createAuthSession(context, { user });
        if (isError(sessionResult)) {
          if (isSystemError(sessionResult)) {
            logger.error("recover_session_system_error", { userId: user.id, email: email2, error: flattenError(sessionResult) });
          }
          return err("Failed to create recovery session");
        }
        return ok({
          message: "If this email exists, a verification code has been sent.",
          redirectTo: authConfig?.routes.verify || defaultAuthRoutes.verify,
          sessionCookie: sessionResult
        });
      }
      return ok({ message: "If this email exists, a verification code has been sent." });
    }
  };
  const result = await handleIntent(formData, handlers);
  if (isError(result)) {
    if (isSystemError(result)) {
      logger.error("recover_system_error", { error: flattenError(result) });
      throwSystemError(result.message, result.status);
    }
    return respondError(result);
  }
  const resultData = result;
  if (resultData.redirectTo && resultData.sessionCookie) {
    throw respondRedirect(resultData.redirectTo, {
      headers: { "Set-Cookie": resultData.sessionCookie }
    });
  }
  return respondOk(result);
}
const WEBAUTHN_ALGORITHMS = {
  ES256: -7,
  RS256: -257
};
const WEBAUTHN_CONFIG = {
  CHALLENGE_TIMEOUT: 6e4,
  // 60 seconds
  CHALLENGE_SIZE: 32,
  // 32 bytes
  USER_ID_SIZE: 16,
  // 16 bytes
  COORDINATE_LENGTH: 32,
  // P-256 coordinates should be 32 bytes each
  HEX_COORDINATE_LENGTH: 64
  // 32 bytes = 64 hex characters
};
const TRANSPORT_METHODS = {
  INTERNAL: "internal",
  HYBRID: "hybrid",
  USB: "usb",
  NFC: "nfc"
};
const ATTESTATION_TYPES = {
  NONE: "none",
  BASIC: "basic",
  SELF: "self",
  ATTCA: "attca",
  ECDAA: "ecdaa"
};
const DEVICE_TYPES = {
  PLATFORM: "platform",
  CROSS_PLATFORM: "cross-platform"
};
const AUTHENTICATOR_FLAGS = {
  BACKUP_ELIGIBLE: 8,
  // BE flag (bit 3)
  BACKUP_STATE: 16
  // BS flag (bit 4)
};
const DEFAULT_DEVICE_INFO = {
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
const ATTESTATION_FORMAT_HANDLERS = /* @__PURE__ */ new Map([
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
var WebAuthnErrorCode = /* @__PURE__ */ ((WebAuthnErrorCode2) => {
  WebAuthnErrorCode2["INVALID_CHALLENGE"] = "INVALID_CHALLENGE";
  WebAuthnErrorCode2["INVALID_ORIGIN"] = "INVALID_ORIGIN";
  WebAuthnErrorCode2["INVALID_RPID"] = "INVALID_RPID";
  WebAuthnErrorCode2["USER_NOT_PRESENT"] = "USER_NOT_PRESENT";
  WebAuthnErrorCode2["INVALID_COUNTER"] = "INVALID_COUNTER";
  WebAuthnErrorCode2["SIGNATURE_FAILED"] = "SIGNATURE_FAILED";
  WebAuthnErrorCode2["UNSUPPORTED_ALGORITHM"] = "UNSUPPORTED_ALGORITHM";
  WebAuthnErrorCode2["INVALID_CREDENTIAL"] = "INVALID_CREDENTIAL";
  WebAuthnErrorCode2["CHALLENGE_EXPIRED"] = "CHALLENGE_EXPIRED";
  WebAuthnErrorCode2["INVALID_KEY_FORMAT"] = "INVALID_KEY_FORMAT";
  WebAuthnErrorCode2["DEFAULT"] = "DEFAULT";
  return WebAuthnErrorCode2;
})(WebAuthnErrorCode || {});
const WEBAUTHN_ERROR_MESSAGES = /* @__PURE__ */ new Map([
  ["CHALLENGE_EXPIRED", () => "Session expired. Please refresh the page and try again."],
  ["INVALID_CHALLENGE", () => "Security check failed. Please refresh the page and try again."],
  ["INVALID_COUNTER", () => "Security violation detected. Your authenticator may be compromised. Please contact support immediately."],
  ["INVALID_KEY_FORMAT", () => "Invalid security key format. Please re-register your device."],
  ["INVALID_ORIGIN", () => "Request origin not recognized. Please ensure you are on the correct website."],
  ["INVALID_RPID", () => "Security configuration error. Please contact support."],
  ["UNSUPPORTED_ALGORITHM", () => "Your authenticator uses an unsupported security algorithm. Please use a different device."],
  ["USER_NOT_PRESENT", () => "User presence verification failed. Please interact with your authenticator when prompted."],
  ["INVALID_CREDENTIAL", (operation) => operation === "registration" ? "Failed to create credential. Please try again." : "Authenticator not recognized. Please use the device you registered with."],
  [
    "SIGNATURE_FAILED",
    (operation) => operation === "registration" ? "Failed to verify authenticator. Please try a different device." : "Authentication failed. Please verify you are using the correct authenticator."
  ],
  ["DEFAULT", (operation) => operation === "registration" ? "Registration failed. Please try again." : "Authentication failed. Please try again."]
]);
function convertAAGUIDToUUID(aaguid) {
  const aaguidString = Array.from(aaguid).map((b) => b.toString(16).padStart(2, "0")).join("");
  return [aaguidString.slice(0, 8), aaguidString.slice(8, 12), aaguidString.slice(12, 16), aaguidString.slice(16, 20), aaguidString.slice(20, 32)].join("-");
}
function isAAGUIDAllZeros(aaguid) {
  return Array.from(aaguid).every((byte) => byte === 0);
}
function toArrayBuffer(uint8Array) {
  const buffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(buffer).set(uint8Array);
  return buffer;
}
function extractBackupState(authenticatorData) {
  const flags = authenticatorData.flags || 0;
  const isBackupEligible = (flags & AUTHENTICATOR_FLAGS.BACKUP_ELIGIBLE) !== 0;
  const isBackedUp = (flags & AUTHENTICATOR_FLAGS.BACKUP_STATE) !== 0;
  return { isBackupEligible, isBackedUp };
}
function extractTransportMethods(deviceInfo) {
  return [...deviceInfo.transports];
}
function extractAttestationType(attestationObject) {
  try {
    const fmt = attestationObject.fmt;
    const attStmt = attestationObject.attStmt;
    const handler = ATTESTATION_FORMAT_HANDLERS.get(fmt);
    if (handler) {
      return handler(attStmt);
    }
    logger.warning("webauthn_unknown_attestation_format", { format: fmt });
    return ATTESTATION_TYPES.NONE;
  } catch (error) {
    logger.error("webauthn_attestation_extraction_error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return ATTESTATION_TYPES.NONE;
  }
}
function generateDefaultAuthenticatorName(deviceInfo) {
  if (deviceInfo.vendor !== "Unknown" && deviceInfo.model !== "Security Key" && deviceInfo.model !== "Device") {
    return `${deviceInfo.vendor} ${deviceInfo.model}`;
  }
  const deviceType = deviceInfo.type === "platform" ? "Biometric Device" : "Security Key";
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
  return `${deviceType} (${timestamp})`;
}
async function getDeviceInfoByAAGUID(aaguid, metadataKV) {
  if (isAAGUIDAllZeros(aaguid)) {
    return DEFAULT_DEVICE_INFO.platform;
  }
  const uuid = convertAAGUIDToUUID(aaguid);
  if (metadataKV) {
    try {
      const mdsData = await metadataKV.get(`device:${uuid}`, "json");
      if (mdsData) {
        logger.debug("device_info_mds_hit", { uuid });
        return mdsData;
      }
    } catch (error) {
      logger.warning("device_info_kv_lookup_failed", {
        uuid,
        error: error instanceof Error ? error.message : "Unknown"
      });
    }
  }
  logger.debug("device_info_fallback", { uuid });
  return DEFAULT_DEVICE_INFO["cross-platform"];
}
function getWebAuthnErrorMessage(code, operation) {
  if (!code) {
    return WEBAUTHN_ERROR_MESSAGES.get(WebAuthnErrorCode.DEFAULT)?.(operation) || "Auth failure. Please try again.";
  }
  const messageResolver = WEBAUTHN_ERROR_MESSAGES.get(code);
  return messageResolver ? messageResolver(operation) : WEBAUTHN_ERROR_MESSAGES.get(WebAuthnErrorCode.DEFAULT)?.(operation) || "Auth failure. Please try again.";
}
function generateChallenge() {
  const bytes = new Uint8Array(WEBAUTHN_CONFIG.CHALLENGE_SIZE);
  crypto.getRandomValues(bytes);
  return encodeBase64url(bytes);
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
async function verifyRegistration(credential, expectedChallenge, expectedOrigin, expectedRPID, metadataKV) {
  try {
    const attestationObject = await parseAttestationObject(new Uint8Array(credential.response.attestationObject));
    const { authenticatorData } = attestationObject;
    const clientData = parseClientDataJSON(new Uint8Array(credential.response.clientDataJSON));
    const receivedChallenge = encodeBase64url(new Uint8Array(clientData.challenge));
    if (receivedChallenge !== expectedChallenge) {
      return err("Invalid challenge", {
        field: "challenge",
        code: WebAuthnErrorCode.INVALID_CHALLENGE
      });
    }
    if (clientData.origin !== expectedOrigin) {
      return err("Invalid origin", {
        field: "origin",
        code: WebAuthnErrorCode.INVALID_ORIGIN
      });
    }
    if (clientData.type !== ClientDataType.Create) {
      return err("Invalid request type", {
        field: "type",
        code: WebAuthnErrorCode.INVALID_CREDENTIAL
      });
    }
    if (!authenticatorData.verifyRelyingPartyIdHash(expectedRPID)) {
      return err("Invalid relying party", {
        field: "rpId",
        code: WebAuthnErrorCode.INVALID_RPID
      });
    }
    if (!authenticatorData.userPresent) {
      return err("User presence required", {
        field: "userPresence",
        code: WebAuthnErrorCode.USER_NOT_PRESENT
      });
    }
    const attestedCredential = authenticatorData.credential;
    if (!attestedCredential) {
      return err("No credential found", {
        field: "credential",
        code: WebAuthnErrorCode.INVALID_CREDENTIAL
      });
    }
    const publicKey = attestedCredential.publicKey;
    if (publicKey.type() !== COSEKeyType.EC2) {
      return err("Only ES256 algorithm is supported", {
        field: "keyType",
        code: WebAuthnErrorCode.UNSUPPORTED_ALGORITHM
      });
    }
    const publicKeyAlgorithm = publicKey.algorithm();
    if (publicKeyAlgorithm !== WEBAUTHN_ALGORITHMS.ES256) {
      return err("Only ES256 algorithm is supported", {
        field: "algorithm",
        code: WebAuthnErrorCode.UNSUPPORTED_ALGORITHM
      });
    }
    const credentialPublicKey = encodeBase64url(new TextEncoder().encode(JSON.stringify(attestedCredential.publicKey.decoded)));
    let transports = [];
    if (credential.response.transports && credential.response.transports.length > 0) {
      transports = credential.response.transports;
      logger.debug("webauthn_using_actual_transports", { transports });
    } else {
      const deviceInfo2 = await getDeviceInfoByAAGUID(attestedCredential.authenticatorAAGUID, metadataKV);
      transports = extractTransportMethods(deviceInfo2);
      logger.debug("webauthn_using_fallback_transports", { transports, source: "deviceInfo" });
    }
    let credentialDeviceType = "cross-platform";
    if (credential.authenticatorAttachment) {
      credentialDeviceType = credential.authenticatorAttachment === "platform" ? "platform" : "cross-platform";
      logger.debug("webauthn_device_type_from_attachment", {
        authenticatorAttachment: credential.authenticatorAttachment,
        credentialDeviceType
      });
    } else {
      const deviceInfo2 = await getDeviceInfoByAAGUID(attestedCredential.authenticatorAAGUID, metadataKV);
      credentialDeviceType = deviceInfo2.type;
      logger.debug("webauthn_device_type_from_aaguid", {
        aaguid: encodeBase64url(attestedCredential.authenticatorAAGUID),
        credentialDeviceType
      });
    }
    const deviceInfo = await getDeviceInfoByAAGUID(attestedCredential.authenticatorAAGUID, metadataKV);
    const backupState = extractBackupState(authenticatorData);
    const keyAlgorithm = attestedCredential.publicKey.algorithm();
    const attestationType = extractAttestationType(attestationObject);
    const defaultName = generateDefaultAuthenticatorName(deviceInfo);
    return {
      id: encodeBase64url(attestedCredential.id),
      credentialPublicKey,
      counter: authenticatorData.signatureCounter,
      credentialDeviceType,
      credentialBackedUp: backupState.isBackedUp,
      transports,
      aaguid: encodeBase64url(attestedCredential.authenticatorAAGUID),
      name: defaultName,
      lastUsedAt: null,
      attestationType,
      rpId: expectedRPID,
      algorithm: keyAlgorithm
    };
  } catch (error) {
    logger.error("webauthn_registration_error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err("Registration verification failed", { field: "general" }, { status: 500 });
  }
}
async function verifyAuthentication(credential, expectedChallenge, expectedOrigin, expectedRPID, storedCredential) {
  try {
    const authenticatorData = parseAuthenticatorData(new Uint8Array(credential.response.authenticatorData));
    const clientData = parseClientDataJSON(new Uint8Array(credential.response.clientDataJSON));
    const receivedChallenge = encodeBase64url(new Uint8Array(clientData.challenge));
    if (receivedChallenge !== expectedChallenge) {
      return err("Invalid challenge", {
        field: "challenge",
        code: WebAuthnErrorCode.INVALID_CHALLENGE
      });
    }
    if (clientData.origin !== expectedOrigin) {
      return err("Invalid origin", {
        field: "origin",
        code: WebAuthnErrorCode.INVALID_ORIGIN
      });
    }
    if (clientData.type !== ClientDataType.Get) {
      return err("Invalid request type", {
        field: "type",
        code: WebAuthnErrorCode.INVALID_CREDENTIAL
      });
    }
    if (!authenticatorData.verifyRelyingPartyIdHash(expectedRPID)) {
      return err("Invalid relying party", {
        field: "rpId",
        code: WebAuthnErrorCode.INVALID_RPID
      });
    }
    if (!authenticatorData.userPresent) {
      return err("User presence required", {
        field: "userPresence",
        code: WebAuthnErrorCode.USER_NOT_PRESENT
      });
    }
    if (storedCredential.counter > 0 || authenticatorData.signatureCounter > 0) {
      if (authenticatorData.signatureCounter <= storedCredential.counter) {
        logger.critical("webauthn_authentication_counter_rollback_detected", {
          stored: storedCredential.counter,
          received: authenticatorData.signatureCounter,
          credentialId: credential.id,
          userId: storedCredential.userId
        });
        return err("Security violation: Counter rollback detected", {
          field: "counter",
          code: WebAuthnErrorCode.INVALID_COUNTER
        });
      }
    }
    const signatureMessage = createAssertionSignatureMessage(new Uint8Array(credential.response.authenticatorData), new Uint8Array(credential.response.clientDataJSON));
    let publicKeyData;
    try {
      const storedKeyJson = new TextDecoder().decode(decodeBase64url(storedCredential.credentialPublicKey));
      publicKeyData = JSON.parse(storedKeyJson);
      if (!publicKeyData) {
        return err(
          "Invalid stored public key",
          {
            field: "publicKey",
            code: WebAuthnErrorCode.INVALID_KEY_FORMAT
          },
          { status: 500 }
        );
      }
    } catch (error) {
      logger.error("webauthn_authentication_key_parse_error", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return err(
        "Failed to parse stored public key",
        {
          field: "publicKey",
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT
        },
        { status: 500 }
      );
    }
    try {
      const signatureBytes = new Uint8Array(credential.response.signature);
      const xCoordinate = publicKeyData[-2];
      const yCoordinate = publicKeyData[-3];
      if (!xCoordinate || !yCoordinate) {
        return err("Invalid public key structure", {
          field: "publicKey",
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT
        });
      }
      let xBytes;
      let yBytes;
      try {
        if (typeof xCoordinate === "string") {
          xBytes = decodeBase64url(xCoordinate);
        } else if (Array.isArray(xCoordinate)) {
          xBytes = new Uint8Array(xCoordinate);
        } else if (typeof xCoordinate === "object" && xCoordinate !== null) {
          const values = Object.values(xCoordinate);
          xBytes = new Uint8Array(values);
        } else {
          xBytes = new Uint8Array(xCoordinate);
        }
        if (typeof yCoordinate === "string") {
          yBytes = decodeBase64url(yCoordinate);
        } else if (Array.isArray(yCoordinate)) {
          yBytes = new Uint8Array(yCoordinate);
        } else if (typeof yCoordinate === "object" && yCoordinate !== null) {
          const values = Object.values(yCoordinate);
          yBytes = new Uint8Array(values);
        } else {
          yBytes = new Uint8Array(yCoordinate);
        }
      } catch (error) {
        logger.error("webauthn_authentication_coordinate_decode_error", {
          error: error instanceof Error ? error.message : "Unknown error"
        });
        return err("Failed to decode key coordinates", {
          field: "publicKey",
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT
        });
      }
      if (xBytes.length !== WEBAUTHN_CONFIG.COORDINATE_LENGTH || yBytes.length !== WEBAUTHN_CONFIG.COORDINATE_LENGTH) {
        return err("Invalid coordinate length for P-256 key", {
          field: "publicKey",
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT
        });
      }
      const xHex = Array.from(xBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const yHex = Array.from(yBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      if (xHex.length === 0 || yHex.length === 0) {
        return err("Empty coordinate data", {
          field: "publicKey",
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT
        });
      }
      const xHexPadded = xHex.padStart(WEBAUTHN_CONFIG.HEX_COORDINATE_LENGTH, "0");
      const yHexPadded = yHex.padStart(WEBAUTHN_CONFIG.HEX_COORDINATE_LENGTH, "0");
      const xBigInt = BigInt(`0x${xHexPadded}`);
      const yBigInt = BigInt(`0x${yHexPadded}`);
      const publicKey = new ECDSAPublicKey(p256, xBigInt, yBigInt);
      if (!publicKey.isCurve(p256)) {
        return err("Public key not on P-256 curve", {
          field: "publicKey",
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT
        });
      }
      try {
        publicKey.encodeSEC1Uncompressed();
      } catch (error) {
        logger.error("webauthn_authentication_public_key_encoding_error", {
          error: error instanceof Error ? error.message : "Unknown error"
        });
        return err("Invalid public key encoding", {
          field: "publicKey",
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT
        });
      }
      const messageHash = sha256(signatureMessage);
      const signature = decodePKIXECDSASignature(signatureBytes);
      const isValid = verifyECDSASignature(publicKey, messageHash, signature);
      if (!isValid) {
        return err("Invalid signature", {
          field: "signature",
          code: WebAuthnErrorCode.SIGNATURE_FAILED
        });
      }
    } catch (error) {
      logger.error("webauthn_authentication_signature_verification_error", {
        error: error instanceof Error ? error.message : "Unknown error",
        credentialId: credential.id
      });
      return err(
        "Signature verification failed",
        {
          field: "signature",
          code: WebAuthnErrorCode.SIGNATURE_FAILED
        },
        { status: 500 }
      );
    }
    return {
      verified: true,
      newCounter: authenticatorData.signatureCounter
    };
  } catch (error) {
    logger.error("webauthn_authentication_error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err("Authentication verification failed", { field: "general" }, { status: 500 });
  }
}
function parseWebAuthnCredential(formData, operation) {
  const webauthnResponse = formData.get("webauthn_response")?.toString();
  if (!webauthnResponse) {
    const errorMessage = operation === "signin" ? "Authentication failed. Please try again." : "Registration failed. Please try again.";
    logger.warning(`${operation}_missing_webauthn_response`);
    return err(errorMessage, { field: "general" });
  }
  try {
    const credential = JSON.parse(webauthnResponse);
    return ok(credential);
  } catch (error) {
    logger.error(`${operation}_webauthn_parse_error`, {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err("Invalid authentication data. Please try again.", { field: "general" });
  }
}
async function createAuthenticatedSession(context, user, email2, operation) {
  const sessionResult = await createAuthSession(context, { user });
  if (isError(sessionResult)) {
    logger.error(`${operation}_session_creation_failed`, {
      email: email2,
      userId: user.id,
      error: sessionResult.message
    });
    return err("Failed to create session", { field: "general" });
  }
  return ok(sessionResult);
}
function createAuthSuccessResponse(context, cookie, user) {
  const authConfig = getContext(context, authConfigContext);
  if (user && user.status !== "active") {
    const redirectTo2 = authConfig?.routes.verify || defaultAuthRoutes.verify;
    return { redirectTo: redirectTo2, cookie };
  }
  const redirectTo = authConfig?.routes.signedin || defaultAuthRoutes.signedin;
  return { redirectTo, cookie };
}
function isLocalhostDomain(domain) {
  return domain === "localhost" || domain === "127.0.0.1" || domain === "[::1]";
}
function resolveRpId(context, request) {
  const originDomain = getOriginDomain(context, request);
  if (isLocalhostDomain(originDomain)) {
    return "localhost";
  }
  return originDomain;
}
function resolveOrigins(context, request) {
  const originUrl = getOrigin(context, request);
  const requestOrigin = new URL(request.url).origin;
  const isDevMode = isDevelopment(context);
  if (isDevMode) {
    return [.../* @__PURE__ */ new Set([originUrl, requestOrigin])];
  }
  return [originUrl];
}
function validateOrigin(clientOrigin, allowedOrigins) {
  return allowedOrigins.includes(clientOrigin);
}
async function validateChallenge(options, context) {
  const { storedChallenge, challengeCreatedAt, maxAge = 5 * 60 * 1e3 } = options;
  if (Date.now() - challengeCreatedAt > maxAge) {
    return err("Session expired. Please refresh and try again.", {
      field: "general",
      code: WebAuthnErrorCode.CHALLENGE_EXPIRED
    });
  }
  const uniquenessResult = await verifyChallengeUniqueness(storedChallenge, context);
  if (!uniquenessResult) {
    return err("Invalid challenge. Please refresh and try again.", {
      field: "general",
      code: WebAuthnErrorCode.INVALID_CHALLENGE
    });
  }
  return ok(void 0);
}
async function validateWebAuthnOrigin(request, options, context) {
  const { clientDataJSON, logContext = {}, operation } = options;
  const allowedOrigins = resolveOrigins(context, request);
  const serverOrigin = new URL(request.url).origin;
  if (!validateOrigin(serverOrigin, allowedOrigins)) {
    logger.error(`${operation}_server_origin_not_allowed`, {
      serverOrigin,
      allowedOrigins,
      ...logContext
    });
    return err("Server configuration error", { field: "general" });
  }
  const clientData = JSON.parse(new TextDecoder().decode(decodeBase64url(clientDataJSON)));
  const clientOrigin = clientData.origin;
  if (clientOrigin !== serverOrigin) {
    return err("Origin mismatch", { field: "general" });
  }
  return ok(serverOrigin);
}
async function validateWebAuthnRequest(request, options, context) {
  const { storedChallenge, challengeCreatedAt, clientDataJSON, logContext, operation, maxAge } = options;
  const challengeResult = await validateChallenge({ storedChallenge, challengeCreatedAt, maxAge }, context);
  if (isError(challengeResult)) {
    return challengeResult;
  }
  const originResult = await validateWebAuthnOrigin(request, { clientDataJSON, logContext, operation }, context);
  if (isError(originResult)) {
    return originResult;
  }
  const rpId = resolveRpId(context, request);
  return ok({ challenge: storedChallenge, origin: originResult, rpId });
}
async function signinLoader({ context }) {
  const token = requireCSRFToken(context);
  const challenge = generateChallenge();
  const cookieResult = await createChallengeSession(context, challenge);
  if (isError(cookieResult)) {
    logger.error("signin_loader_session_creation_failed", { error: cookieResult.message });
    return respondError(cookieResult);
  }
  return respondOk({ token, challenge }, { headers: { "Set-Cookie": cookieResult } });
}
async function signinAction({ request, context }) {
  const repository = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);
  const formData = await request.formData();
  const handlers = {
    signin: async (formData2) => {
      try {
        const validationResult = await validateFormData(signinFormSchema, formData2);
        if (isError(validationResult)) {
          return validationResult;
        }
        const email2 = validationResult.email;
        const userResult = await repository.getUserByEmail(email2);
        const userExists = !isError(userResult);
        const user = userExists ? userResult : null;
        const authenticatorsResult = user ? await repository.getAuthenticatorsByUserId(user.id) : [];
        const hasAuthenticators = !isError(authenticatorsResult) && authenticatorsResult.length > 0;
        if (!userExists || !hasAuthenticators) {
          return err("The credentials are incorrect", { email: "The credentials are incorrect" });
        }
        const authenticators2 = authenticatorsResult;
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError(sessionResult)) {
          return sessionResult;
        }
        const { challenge: storedChallenge, challengeCreatedAt, session } = sessionResult;
        const credentialResult = parseWebAuthnCredential(formData2, "signin");
        if (isError(credentialResult)) {
          return credentialResult;
        }
        const credential = credentialResult;
        const authenticator = authenticators2.find((auth) => auth.id === credential.rawId);
        if (!authenticator) {
          return err("The credentials are incorrect", { email: "The credentials are incorrect" });
        }
        if (authenticator.userId !== user?.id) {
          logger.critical("signin_authenticator_user_mismatch", {
            authenticatorUserId: authenticator.userId,
            requestUserId: user?.id,
            email: email2,
            credentialId: credential.rawId
          });
          return err("The credentials are incorrect", { email: "The credentials are incorrect" });
        }
        const webauthnValidationResult = await validateWebAuthnRequest(
          request,
          {
            storedChallenge,
            challengeCreatedAt,
            clientDataJSON: credential.response.clientDataJSON,
            operation: "signin",
            logContext: { email: email2 }
          },
          context
        );
        if (isError(webauthnValidationResult)) {
          return webauthnValidationResult;
        }
        const { challenge, origin, rpId } = webauthnValidationResult;
        const authenticationData = {
          id: credential.id,
          rawId: decodeBase64url(credential.rawId).buffer,
          response: {
            authenticatorData: decodeBase64url(credential.response.authenticatorData).buffer,
            clientDataJSON: decodeBase64url(credential.response.clientDataJSON).buffer,
            signature: decodeBase64url(credential.response.signature).buffer,
            userHandle: credential.response.userHandle ? decodeBase64url(credential.response.userHandle).buffer : void 0
          },
          type: "public-key"
        };
        const verificationResult = await verifyAuthentication(authenticationData, challenge, origin, rpId, authenticator);
        if (isError(verificationResult)) {
          if (isSystemError(verificationResult)) {
            logger.error("signin_verification_system_error", { email: email2, error: flattenError(verificationResult), code: verificationResult.code });
          }
          const errorMessage = getWebAuthnErrorMessage(verificationResult.code, "authentication");
          return err(errorMessage, { field: "general", code: verificationResult.code });
        }
        const updateResult = await repository.updateAuthenticatorUsage(authenticator.id, verificationResult.newCounter, /* @__PURE__ */ new Date());
        if (isError(updateResult)) {
          logger.warning("signin_authenticator_update_failed", { authenticatorId: authenticator.id, error: updateResult.message });
        }
        if (user?.pending) {
          const pendingType = user?.pending.type;
          if (pendingType === "recovery") {
            const recoveryTimestamp = user?.pending.timestamp;
            logger.info("recovery_cleanup_detected", { userId: user?.id, email: email2, recoveryTimestamp });
            const deleteResult = await repository.deleteAuthenticatorsByTimestamp(user?.id, recoveryTimestamp);
            if (isError(deleteResult)) {
              logger.warning("recovery_cleanup_delete_failed", { userId: user?.id, email: email2, error: flattenError(deleteResult) });
            } else {
              logger.info("recovery_cleanup_completed", { userId: user?.id, email: email2, deletedCount: deleteResult });
            }
          } else {
            logger.info("pending_operation_abandoned_on_signin", { userId: user?.id, email: email2, pendingType });
          }
          const pendingUpdateResult = await repository.updateUserPending(user?.id, null);
          if (isError(pendingUpdateResult)) {
            logger.warning("pending_clear_failed_on_signin", { userId: user?.id, email: email2, pendingType, error: flattenError(pendingUpdateResult) });
          }
          if (user?.status !== "active") {
            const statusUpdateResult = await repository.updateUserStatus(user?.id, "active");
            if (isError(statusUpdateResult)) {
              logger.warning("status_restore_failed_on_signin", { userId: user?.id, email: email2, error: flattenError(statusUpdateResult) });
            } else {
              user.status = "active";
            }
          }
        }
        const destroyResult = await destroyChallengeSession(session, context);
        if (isError(destroyResult)) {
          logger.warning("signin_challenge_cleanup_failed", { error: flattenError(destroyResult) });
        }
        const cleanupResult = await cleanupChallengeSession(challenge, context);
        if (isError(cleanupResult)) {
          logger.warning("signin_challenge_uniqueness_cleanup_failed", { error: flattenError(cleanupResult) });
        }
        const authSessionResult = await createAuthenticatedSession(context, user, email2, "signin");
        if (isError(authSessionResult)) {
          if (isSystemError(authSessionResult)) {
            logger.error("signin_session_creation_failed", { email: email2, error: flattenError(authSessionResult) });
          }
          return authSessionResult;
        }
        const redirectTo2 = user?.status === "active" ? authConfig?.routes.signedin || defaultAuthRoutes.signedin : authConfig?.routes.verify || defaultAuthRoutes.verify;
        return ok({ sessionCookie: authSessionResult, redirectTo: redirectTo2 });
      } catch (error) {
        if (error instanceof Response) {
          throw error;
        }
        logger.error("signin_error", { error: transformError(error) });
        return err("Authentication failed", { field: "general" });
      }
    }
  };
  const result = await handleIntent(formData, handlers);
  if (isError(result)) {
    if (isSystemError(result)) {
      logger.error("signin_system_error", { error: flattenError(result) });
      throwSystemError(result.message, result.status);
    }
    return respondError(result);
  }
  const { redirectTo, sessionCookie } = result;
  throw respondRedirect(redirectTo, {
    headers: { "Set-Cookie": sessionCookie }
  });
}
async function signoutAction({ request, context }) {
  const destroyResult = await destroyAuthSession(request, context);
  if (isError(destroyResult)) {
    if (isSystemError(destroyResult)) {
      logger.error("signout_session_destruction_failed", { error: flattenError(destroyResult) });
    }
  }
  const authConfig = getContext(context, authConfigContext);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;
  throw respondRedirect(redirectTo, {
    headers: { "Set-Cookie": !isError(destroyResult) ? destroyResult : "" }
  });
}
async function signoutLoader({ context }) {
  const authConfig = getContext(context, authConfigContext);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;
  throw respondRedirect(redirectTo);
}
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
async function sendVerificationEmail(options) {
  const { email: email2, purpose, metadata, context } = options;
  try {
    const codeResult = await createVerificationCode(email2, purpose, context, metadata);
    if (isError(codeResult)) {
      logger.error("verification_email_code_generation_failed", {
        email: email2,
        purpose,
        error: flattenError(codeResult)
      });
      return codeResult;
    }
    const code = codeResult;
    const emailContent = await renderEmailTemplate(TotpEmailTemplate, {
      code,
      purpose
    });
    const sendResult = await sendMail(context, {
      to: email2,
      template: emailContent
    });
    if (isError(sendResult)) {
      logger.error("verification_email_send_failed", {
        email: email2,
        purpose,
        error: flattenError(sendResult)
      });
      return sendResult;
    }
    logger.info("verification_email_sent", { email: email2, purpose });
    return ok(void 0);
  } catch (error) {
    logger.error("verification_email_unexpected_error", {
      email: email2,
      purpose,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : void 0
    });
    return err("Failed to send verification email", { error });
  }
}
async function signupLoader({ context }) {
  const token = requireCSRFToken(context);
  const challenge = generateChallenge();
  const cookieResult = await createChallengeSession(context, challenge);
  if (isError(cookieResult)) {
    logger.error("signup_loader_session_creation_failed", { error: cookieResult.message });
    return respondError(cookieResult);
  }
  return respondOk({ token, challenge }, { headers: { "Set-Cookie": cookieResult } });
}
async function signupAction({ request, context }) {
  const repository = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);
  const formData = await request.formData();
  const handlers = {
    signup: async (formData2) => {
      try {
        const validationResult = await validateFormData(signupFormSchema, formData2);
        if (isError(validationResult)) {
          return validationResult;
        }
        const { email: email2, displayName } = validationResult;
        const existingUserResult = await repository.getUserByEmail(email2);
        const isRecoveryMode = !isError(existingUserResult) && existingUserResult.status === "unrecovered";
        if (!isError(existingUserResult) && !isRecoveryMode) {
          return err("An account already exists with this email", { email: "An account already exists with this email" });
        }
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError(sessionResult)) {
          return sessionResult;
        }
        const { challenge: storedChallenge, challengeCreatedAt, session } = sessionResult;
        const credentialResult = parseWebAuthnCredential(formData2, "signup");
        if (isError(credentialResult)) {
          return credentialResult;
        }
        const credential = credentialResult;
        const webauthnValidationResult = await validateWebAuthnRequest(
          request,
          {
            storedChallenge,
            challengeCreatedAt,
            clientDataJSON: credential.response.clientDataJSON,
            operation: "signup",
            logContext: { email: email2 }
          },
          context
        );
        if (isError(webauthnValidationResult)) {
          return webauthnValidationResult;
        }
        const { challenge, origin, rpId } = webauthnValidationResult;
        const registrationData = {
          id: credential.id,
          rawId: decodeBase64url(credential.rawId).buffer,
          response: {
            attestationObject: decodeBase64url(credential.response.attestationObject).buffer,
            clientDataJSON: decodeBase64url(credential.response.clientDataJSON).buffer,
            transports: credential.response?.transports || []
          },
          type: "public-key",
          authenticatorAttachment: credential.authenticatorAttachment || null
        };
        const metadataKV = authConfig?.webauthn.kvBinding ? getKVStore(context, authConfig.webauthn.kvBinding) : void 0;
        const verificationResult = await verifyRegistration(registrationData, challenge, origin, rpId, metadataKV);
        if (isError(verificationResult)) {
          if (isSystemError(verificationResult)) {
            logger.error("signup_verification_system_error", { email: email2, error: flattenError(verificationResult), code: verificationResult.code });
          }
          const errorMessage = getWebAuthnErrorMessage(verificationResult.code, "registration");
          return err(errorMessage, { field: "general", code: verificationResult.code });
        }
        let user;
        if (isRecoveryMode) {
          user = existingUserResult;
        } else {
          const createUserResult = await repository.createUser(email2, displayName);
          if (isError(createUserResult)) {
            logger.error("signup_create_user_failed", { email: email2, error: flattenError(createUserResult) });
            return err("Failed to create account", { field: "general" }, { status: 503 });
          }
          user = createUserResult;
        }
        const createAuthResult = await repository.createAuthenticator({ ...verificationResult, userId: user.id });
        if (isError(createAuthResult)) {
          logger.error("signup_create_authenticator_failed", { email: email2, userId: user.id, error: flattenError(createAuthResult) });
          if (!isRecoveryMode) {
            await repository.deleteUser(user.id);
          }
          return err("Failed to register authenticator", { field: "general" }, { status: 503 });
        }
        if (isRecoveryMode) {
          const recoveryTimestamp = Date.now();
          const pendingUpdateResult = await repository.updateUserPending(user.id, {
            type: "recovery",
            timestamp: recoveryTimestamp
          });
          if (isError(pendingUpdateResult)) {
            logger.error("recovery_pending_update_failed", { userId: user.id, error: flattenError(pendingUpdateResult) });
          }
          const statusUpdateResult = await repository.updateUserStatus(user.id, "active");
          if (isError(statusUpdateResult)) {
            logger.error("recovery_status_update_failed", { userId: user.id, error: flattenError(statusUpdateResult) });
          }
        }
        const destroyResult = await destroyChallengeSession(session, context);
        if (isError(destroyResult)) {
          logger.warning("signup_challenge_cleanup_failed", { error: flattenError(destroyResult) });
        }
        const cleanupResult = await cleanupChallengeSession(challenge, context);
        if (isError(cleanupResult)) {
          logger.warning("signup_challenge_uniqueness_cleanup_failed", { error: flattenError(cleanupResult) });
        }
        if (isRecoveryMode) {
          const destroyResult2 = await destroyAuthSession(request, context);
          if (isError(destroyResult2)) {
            logger.warning("recovery_session_destroy_failed", { userId: user.id, error: flattenError(destroyResult2) });
          }
        }
        const authSessionResult = await createAuthenticatedSession(context, user, email2, "signup");
        if (isError(authSessionResult)) {
          if (isSystemError(authSessionResult)) {
            logger.error("signup_session_creation_failed", { email: email2, error: flattenError(authSessionResult) });
          }
          return authSessionResult;
        }
        if (user.status !== "active") {
          const verificationResult2 = await sendVerificationEmail({ email: email2, purpose: "signup", context });
          if (isError(verificationResult2)) {
            logger.warning("signup_verification_email_error", { email: email2, error: flattenError(verificationResult2) });
          }
        }
        const redirectTo2 = user.status === "active" ? authConfig?.routes.signedin || defaultAuthRoutes.signedin : authConfig?.routes.verify || defaultAuthRoutes.verify;
        return ok({ sessionCookie: authSessionResult, redirectTo: redirectTo2 });
      } catch (error) {
        if (error instanceof Response) {
          throw error;
        }
        logger.error("signup_error", { error: transformError(error) });
        return err("Registration failed", { field: "general" });
      }
    }
  };
  const result = await handleIntent(formData, handlers);
  if (isError(result)) {
    if (isSystemError(result)) {
      logger.error("signup_system_error", { error: flattenError(result) });
      throwSystemError(result.message, result.status);
    }
    return respondError(result);
  }
  const { redirectTo, sessionCookie } = result;
  throw respondRedirect(redirectTo, {
    headers: { "Set-Cookie": sessionCookie }
  });
}
const verifyFormSchema = object({
  email: pipe(string(), minLength(1, "Email is required")),
  code: pipe(string(), minLength(6, "Code must be 6 digits"))
});
async function verifyLoader({ request, context }) {
  const token = requireCSRFToken(context);
  const sessionResult = await getAuthSession(request, context);
  if (isError(sessionResult)) {
    if (isSystemError(sessionResult)) {
      logger.error("verify_loader_session_error", { error: flattenError(sessionResult) });
      throwSystemError(sessionResult.message, sessionResult.status);
    }
    return respondError(err("Failed to get session"));
  }
  const session = sessionResult;
  if (!session || !session.user) {
    const authConfig = getContext(context, authConfigContext);
    throw respondRedirect(authConfig?.routes.signin || defaultAuthRoutes.signin);
  }
  let emailToVerify = session.user.email;
  let purpose = "signup";
  if (session.user.pending?.type === "email-change") {
    emailToVerify = session.user.pending.email;
    purpose = "email-change";
  } else if (session.user.pending?.type === "account-delete") {
    purpose = "account-delete";
  }
  return respondOk({
    token,
    email: emailToVerify,
    status: session.user.status,
    purpose
  });
}
async function verifyAction({ request, context }) {
  const repository = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);
  const formData = await request.formData();
  const purpose = formData.get("purpose")?.toString() || "signup";
  const sessionResult = await getAuthSession(request, context);
  if (isError(sessionResult)) {
    if (isSystemError(sessionResult)) {
      logger.error("verify_action_session_error", { error: flattenError(sessionResult) });
      throwSystemError(sessionResult.message, sessionResult.status);
    }
    return respondError(err("Failed to get session"));
  }
  const session = sessionResult;
  if (!session || !session.user) {
    return respondError(err("No active session found"));
  }
  const handlers = {
    /**
     * Resend verification code
     */
    resend: async () => {
      let emailToSendTo = session.user.email;
      if (purpose === "email-change" && session.user.pending?.type === "email-change") {
        emailToSendTo = session.user.pending.email;
      }
      const sendResult = await sendVerificationEmail({
        email: emailToSendTo,
        purpose,
        context
      });
      if (isError(sendResult)) {
        if (isSystemError(sendResult)) {
          logger.error("verify_resend_email_system_error", { email: emailToSendTo, purpose, error: flattenError(sendResult) });
        }
        return sendResult;
      }
      return ok({ resent: true });
    },
    /**
     * Unverify user (set status to unverified)
     */
    unverify: async () => {
      const updateResult = await repository.updateUserStatus(session.user.id, "unverified");
      if (isError(updateResult)) {
        if (isSystemError(updateResult)) {
          logger.error("verify_unverify_system_error", { userId: session.user.id, error: flattenError(updateResult) });
        }
        return updateResult;
      }
      return ok({ unverified: true });
    },
    /**
     * Verify the code
     */
    verify: async (formData2) => {
      const validationResult = await validateFormData(verifyFormSchema, formData2);
      if (isError(validationResult)) {
        return validationResult;
      }
      const { email: email2, code } = validationResult;
      if (purpose !== "email-change") {
        if (session.user.email !== email2) {
          return err("Session mismatch", { email: "Email does not match session" });
        }
      }
      const verifyResult = await verifyCode(email2, code, purpose, context);
      if (isError(verifyResult)) {
        return err(verifyResult.message, { code: verifyResult.message });
      }
      const verification = verifyResult;
      let userResult;
      if (purpose === "email-change") {
        userResult = await repository.getUserById(session.user.id);
      } else {
        userResult = await repository.getUserByEmail(email2);
      }
      if (isError(userResult)) {
        logger.error("verify_user_not_found", { email: email2, purpose, userId: session.user.id, error: flattenError(userResult) });
        return err("User not found", void 0, { status: 500 });
      }
      const user = userResult;
      switch (purpose) {
        case "signup": {
          const updateResult = await repository.updateUserStatus(user.id, "active");
          if (isError(updateResult)) {
            if (isSystemError(updateResult)) {
              logger.error("verify_update_system_error", { userId: user.id, purpose, error: flattenError(updateResult) });
            }
            return updateResult;
          }
          const destroyResult = await destroyAuthSession(request, context);
          if (isError(destroyResult)) {
            logger.warning("verify_signup_session_destroy_failed", { userId: user.id, error: flattenError(destroyResult) });
          }
          const updatedUser = {
            ...user,
            status: "active"
          };
          const newSessionResult = await createAuthSession(context, { user: updatedUser });
          if (isError(newSessionResult)) {
            logger.error("verify_signup_session_creation_failed", { userId: user.id, error: flattenError(newSessionResult) });
            return err("Failed to create session", void 0, { status: 500 });
          }
          return ok({ sessionCookie: newSessionResult, redirectTo: authConfig?.routes.signedin || defaultAuthRoutes.signedin });
        }
        case "email-change": {
          if (!user.pending || user.pending.type !== "email-change") {
            logger.error("verify_email_change_no_pending_request", { userId: user.id, email: email2 });
            return err("No pending email change request found. Request may have expired.");
          }
          const newEmail = user.pending.email;
          user.email;
          if (email2 !== newEmail) {
            logger.error("verify_email_change_email_mismatch", {
              userId: user.id,
              expectedEmail: newEmail,
              actualEmail: email2
            });
            return err("Email mismatch. Please try again.");
          }
          const updateResult = await repository.updateUserEmail(user.id, newEmail);
          if (isError(updateResult)) {
            if (isSystemError(updateResult)) {
              logger.error("verify_email_change_update_system_error", { userId: user.id, error: flattenError(updateResult) });
            }
            return updateResult;
          }
          const verifyResult2 = await repository.updateUserStatus(user.id, "active");
          if (isError(verifyResult2)) {
            logger.warning("verify_email_change_status_update_failed", { userId: user.id, error: flattenError(verifyResult2) });
          }
          const pendingClearResult = await repository.updateUserPending(user.id, null);
          if (isError(pendingClearResult)) {
            logger.warning("verify_email_change_pending_clear_failed", {
              userId: user.id,
              error: flattenError(pendingClearResult)
            });
          }
          const destroyResult = await destroyAuthSession(request, context);
          if (isError(destroyResult)) {
            logger.warning("verify_email_change_session_destroy_failed", { userId: user.id, error: flattenError(destroyResult) });
          }
          const updatedUser = {
            ...user,
            email: newEmail,
            status: "active",
            pending: null
          };
          const newSessionResult = await createAuthSession(context, { user: updatedUser });
          if (isError(newSessionResult)) {
            logger.error("verify_email_change_session_creation_failed", { userId: user.id, error: flattenError(newSessionResult) });
            return err("Failed to create session", void 0, { status: 500 });
          }
          return ok({ sessionCookie: newSessionResult, redirectTo: authConfig?.routes.profile || defaultAuthRoutes.profile });
        }
        case "recovery": {
          return ok({ redirectTo: authConfig?.routes.signup || defaultAuthRoutes.signup });
        }
        case "account-delete": {
          if (!user.pending || user.pending.type !== "account-delete") {
            logger.error("verify_account_delete_no_pending_request", { userId: user.id, email: email2 });
            return err("No pending account deletion request found. Request may have expired.");
          }
          const deleteResult = await repository.deleteUserAccount(user.id);
          if (isError(deleteResult)) {
            if (isSystemError(deleteResult)) {
              logger.error("verify_account_delete_system_error", { userId: user.id, error: flattenError(deleteResult) });
            }
            return deleteResult;
          }
          return ok({ redirectTo: authConfig?.routes.signedout || defaultAuthRoutes.signedout, destroySession: true });
        }
        case "passkey-add":
        case "passkey-delete": {
          return ok({ verified: true, purpose, metadata: verification.metadata });
        }
        default: {
          return err("Unknown verification purpose");
        }
      }
    }
  };
  const result = await handleIntent(formData, handlers);
  if (isError(result)) {
    if (isSystemError(result)) {
      logger.error("verify_system_error", { error: flattenError(result), email: session.user.email });
      throwSystemError(result.message, result.status);
    }
    return respondError(result);
  }
  const resultData = result;
  if (resultData.redirectTo) {
    if (resultData.destroySession) {
      const destroyResult = await destroyAuthSession(request, context);
      throw respondRedirect(resultData.redirectTo, {
        headers: { "Set-Cookie": !isError(destroyResult) ? destroyResult : "" }
      });
    }
    throw respondRedirect(resultData.redirectTo, {
      headers: resultData.sessionCookie ? { "Set-Cookie": resultData.sessionCookie } : void 0
    });
  }
  return respondOk(result);
}
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
        /* @__PURE__ */ jsx(Text, { className: "mx-2", children: /* @__PURE__ */ jsx(Link, { href: verificationUrl, className: "font-bold no-underline", children: "Click this link to approve the change" }) }),
        /* @__PURE__ */ jsxs(Text, { className: "mx-2", children: [
          /* @__PURE__ */ jsx(Text, { children: "If having trouble using the link above, use the url below to verify." }),
          /* @__PURE__ */ jsx(Link, { href: verificationUrl, className: "underline", children: verificationUrl })
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
function getEmailChangeKey(userId) {
  return `email_change:${userId}`;
}
async function createEmailChangeRequest(userId, oldEmail, newEmail, context, kvBinding, expirationTtl = 480) {
  try {
    const kv = getKVStore(context, kvBinding);
    if (!kv) {
      logger.error("email_change_request_kv_not_found", { userId, kvBinding });
      return err("KV storage not configured");
    }
    const pendingChange = {
      userId,
      oldEmail,
      newEmail,
      requestedAt: Date.now()
    };
    await kv.put(getEmailChangeKey(userId), JSON.stringify(pendingChange), {
      expirationTtl
    });
    return ok(void 0);
  } catch (error) {
    logger.error("email_change_request_creation_failed", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err("Failed to create email change request", { error });
  }
}
async function getEmailChangeRequest(userId, context, kvBinding) {
  try {
    const kv = getKVStore(context, kvBinding);
    if (!kv) {
      logger.error("email_change_request_kv_not_found", { userId, kvBinding });
      return err("KV storage not configured");
    }
    const value = await kv.get(getEmailChangeKey(userId), "text");
    if (!value) {
      return ok(null);
    }
    const pendingChange = JSON.parse(value);
    logger.debug("email_change_request_retrieved", {
      userId,
      newEmail: pendingChange.newEmail
    });
    return ok(pendingChange);
  } catch (error) {
    logger.error("email_change_request_retrieval_failed", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err("Failed to retrieve email change request", { error });
  }
}
async function deleteEmailChangeRequest(userId, context, kvBinding) {
  try {
    const kv = getKVStore(context, kvBinding);
    if (!kv) {
      logger.error("email_change_request_kv_not_found", { userId, kvBinding });
      return err("KV storage not configured");
    }
    await kv.delete(getEmailChangeKey(userId));
    return ok(void 0);
  } catch (error) {
    logger.error("email_change_request_deletion_failed", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err("Failed to delete email change request", { error });
  }
}
async function sendEmailChangeNotification(oldEmail, newEmail, context) {
  try {
    const emailContent = await renderEmailTemplate(EmailChangeNotificationTemplate, {
      oldEmail,
      newEmail
    });
    const sendResult = await sendMail(context, {
      to: oldEmail,
      template: emailContent
    });
    if (isError(sendResult)) {
      logger.error("email_change_notification_send_failed", {
        oldEmail,
        newEmail,
        error: flattenError(sendResult)
      });
      return sendResult;
    }
    logger.info("email_change_notification_sent", { oldEmail, newEmail });
    return ok(void 0);
  } catch (error) {
    logger.error("email_change_notification_unexpected_error", {
      oldEmail,
      newEmail,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : void 0
    });
    return err("Failed to send email change notification", { error });
  }
}
async function sendEmailChangeVerification(newEmail, oldEmail, context, verificationUrl) {
  try {
    const codeResult = await createVerificationCode(newEmail, "email-change", context, { oldEmail, newEmail });
    if (isError(codeResult)) {
      logger.error("email_change_verification_code_generation_failed", {
        newEmail,
        oldEmail,
        error: flattenError(codeResult)
      });
      return codeResult;
    }
    const code = codeResult;
    const emailTemplate = await renderEmailTemplate(EmailChangeVerificationTemplate, {
      code,
      oldEmail,
      newEmail,
      verificationUrl
    });
    const sendResult = await sendMail(context, {
      to: newEmail,
      template: emailTemplate
    });
    if (isError(sendResult)) {
      logger.error("email_change_verification_send_failed", {
        newEmail,
        oldEmail,
        error: flattenError(sendResult)
      });
      return sendResult;
    }
    logger.info("email_change_verification_sent", { newEmail, oldEmail });
    return ok(void 0);
  } catch (error) {
    logger.error("email_change_verification_unexpected_error", {
      newEmail,
      oldEmail,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : void 0
    });
    return err("Failed to send email change verification", { error });
  }
}
async function requestEmailChange(userId, oldEmail, newEmail, context, kvBinding, verificationUrl) {
  const createResult = await createEmailChangeRequest(userId, oldEmail, newEmail, context, kvBinding);
  if (isError(createResult)) {
    return createResult;
  }
  const verificationResult = await sendEmailChangeVerification(newEmail, oldEmail, context, verificationUrl);
  if (isError(verificationResult)) {
    await deleteEmailChangeRequest(userId, context, kvBinding);
    return verificationResult;
  }
  const notificationResult = await sendEmailChangeNotification(oldEmail, newEmail, context);
  if (isError(notificationResult)) {
    logger.warning("email_change_old_email_notification_failed", {
      userId,
      oldEmail,
      newEmail,
      error: flattenError(notificationResult)
    });
  }
  return ok(void 0);
}
const MAX_AUTHENTICATORS_PER_USER = 10;
const MIN_AUTHENTICATORS_PER_USER = 1;
async function addPasskeyForUser(context, userId, credential, challenge, origin, request) {
  const repo = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);
  if (!authConfig) {
    return err("Auth configuration not found", { field: "general" });
  }
  const rpId = resolveRpId(context, request);
  const metadataKV = authConfig.webauthn.kvBinding ? getKVStore(context, authConfig.webauthn.kvBinding) : void 0;
  const countResult = await repo.countAuthenticatorsByUserId(userId);
  if (isError(countResult)) {
    return countResult;
  }
  if (countResult >= MAX_AUTHENTICATORS_PER_USER) {
    logger.warning("passkey_add_max_reached", { userId, count: countResult });
    return err("Maximum number of authenticators reached", {
      limit: `You can have a maximum of ${MAX_AUTHENTICATORS_PER_USER} authenticators`
    });
  }
  const verificationResult = await verifyRegistration(credential, challenge, origin, rpId, metadataKV);
  if (isError(verificationResult)) {
    logger.error("passkey_add_verification_failed", { userId, error: verificationResult });
    return verificationResult;
  }
  const createResult = await repo.createAuthenticator({ ...verificationResult, userId });
  if (isError(createResult)) {
    logger.error("passkey_add_create_failed", { userId, error: createResult });
    return createResult;
  }
  return ok(createResult);
}
async function renamePasskey(context, userId, authenticatorId, newName) {
  const repo = getAuthRepository(context);
  const ownershipResult = await repo.authenticatorBelongsToUser(authenticatorId, userId);
  if (isError(ownershipResult)) {
    logger.error("passkey_rename_ownership_check_failed", { userId, authenticatorId, error: ownershipResult });
    return ownershipResult;
  }
  if (!ownershipResult) {
    logger.warning("passkey_rename_unauthorized", { userId, authenticatorId });
    return err("Authenticator not found or unauthorized", {
      authenticator: "You do not have permission to modify this authenticator"
    });
  }
  const trimmedName = newName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 50) {
    return err("Invalid authenticator name", {
      name: "Name must be between 1 and 50 characters"
    });
  }
  const updateResult = await repo.updateAuthenticatorName(authenticatorId, trimmedName);
  if (isError(updateResult)) {
    logger.error("passkey_rename_failed", { userId, authenticatorId, error: updateResult });
    return updateResult;
  }
  return ok(updateResult);
}
async function deletePasskey(context, userId, authenticatorId) {
  const repo = getAuthRepository(context);
  const ownershipResult = await repo.authenticatorBelongsToUser(authenticatorId, userId);
  if (isError(ownershipResult)) {
    logger.error("passkey_delete_ownership_check_failed", { userId, authenticatorId, error: ownershipResult });
    return ownershipResult;
  }
  if (!ownershipResult) {
    logger.warning("passkey_delete_unauthorized", { userId, authenticatorId });
    return err("Authenticator not found or unauthorized", {
      authenticator: "You do not have permission to delete this authenticator"
    });
  }
  const countResult = await repo.countAuthenticatorsByUserId(userId);
  if (isError(countResult)) {
    logger.error("passkey_delete_count_failed", { userId, error: countResult });
    return countResult;
  }
  if (countResult <= MIN_AUTHENTICATORS_PER_USER) {
    logger.warning("passkey_delete_minimum_required", { userId, count: countResult });
    return err("Cannot delete last authenticator", {
      authenticator: "You must have at least one authenticator for security"
    });
  }
  const deleteResult = await repo.deleteAuthenticator(authenticatorId);
  if (isError(deleteResult)) {
    logger.error("passkey_delete_failed", { userId, authenticatorId, error: deleteResult });
    return deleteResult;
  }
  return ok(true);
}
async function generateAddPasskeyOptions(context, request, userId, rpName, rpId) {
  const repo = getAuthRepository(context);
  const authSession = await getAuthSession(request, context);
  if (isError(authSession)) {
    return authSession;
  }
  if (!authSession || !authSession.user) {
    return err("User not authenticated", { user: "Session does not contain user data" });
  }
  const session = authSession;
  const existingAuthsResult = await repo.getAuthenticatorsByUserId(userId);
  if (isError(existingAuthsResult)) {
    logger.error("passkey_options_get_existing_failed", { userId, error: existingAuthsResult });
    return existingAuthsResult;
  }
  const excludeCredentials = existingAuthsResult.map((auth) => ({ id: auth.id, transports: auth.transports }));
  const challenge = generateChallenge();
  const options = createRegistrationOptions(rpName, rpId, session.user.email, session.user.displayName, challenge, excludeCredentials);
  return ok({ challenge, options });
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
function convertWebAuthnCredentialToStorage(credential) {
  const rawIdUint8Array = decodeBase64url(credential.rawId);
  const rawIdBuffer = new ArrayBuffer(rawIdUint8Array.length);
  new Uint8Array(rawIdBuffer).set(rawIdUint8Array);
  const attestationUint8Array = decodeBase64url(credential.response.attestationObject);
  const attestationBuffer = new ArrayBuffer(attestationUint8Array.length);
  new Uint8Array(attestationBuffer).set(attestationUint8Array);
  const clientDataUint8Array = decodeBase64url(credential.response.clientDataJSON);
  const clientDataBuffer = new ArrayBuffer(clientDataUint8Array.length);
  new Uint8Array(clientDataBuffer).set(clientDataUint8Array);
  return {
    id: credential.id,
    rawId: rawIdBuffer,
    response: {
      attestationObject: attestationBuffer,
      clientDataJSON: clientDataBuffer,
      transports: credential.response?.transports
    },
    type: "public-key",
    authenticatorAttachment: credential.authenticatorAttachment
  };
}
export {
  addPasskeyForUser,
  arrayBufferFromObject,
  authConfigContext,
  authFormSchema,
  authSessionMiddleware,
  authUserContext,
  changeEmailSchema,
  cleanupChallengeSession,
  convertServerOptionsToWebAuthn,
  convertWebAuthnCredentialToStorage,
  createAuthRepository,
  createAuthSession,
  createAuthSessionStorage,
  createAuthSuccessResponse,
  createAuthenticatedSession,
  createChallengeSession,
  createEmailChangeRequest,
  createVerificationCode,
  deleteEmailChangeRequest,
  deletePasskey,
  destroyAuthSession,
  destroyChallengeSession,
  generateAddPasskeyOptions,
  getAuthRepository,
  getAuthSession,
  getAuthUser,
  getChallengeFromSession,
  getEmailChangeRequest,
  getUserWithAuthenticators,
  getWebAuthnErrorMessage,
  guardedAuthMiddleware,
  isAuthenticated,
  parseWebAuthnCredential,
  profileLoader,
  recoverAction,
  recoverLoader,
  renamePasskey,
  requestAccountRecovery,
  requestEmailChange,
  requireAuthUser,
  resolveOrigins,
  resolveRpId,
  sendEmailChangeNotification,
  sendVerificationEmail,
  signinAction,
  signinFormSchema,
  signinLoader,
  signoutAction,
  signoutLoader,
  signupAction,
  signupFormSchema,
  signupLoader,
  unguardedAuthMiddleware,
  updateAuthSession,
  validateChallenge,
  validateOrigin,
  validateWebAuthnOrigin,
  validateWebAuthnRequest,
  verifyAction,
  verifyChallengeUniqueness,
  verifyCode,
  verifyLoader,
  verifyRouteMiddleware
};
//# sourceMappingURL=index.js.map
