// src/auth/services/auth.middleware.ts
import { isError, middlewarePassthrough } from "@ycore/forge/result";
import { authUserContext, setAuthConfig } from "@ycore/foundry/auth";
import { redirect } from "react-router";

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

// ../../node_modules/@react-router/cloudflare/dist/index.mjs
import { createSessionStorage } from "react-router";
import { createRequestHandler as createReactRouterRequestHandler } from "react-router";
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
          expiration: expires ? Math.round(expires.getTime() / 1000) : undefined
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
        expiration: expires ? Math.round(expires.getTime() / 1000) : undefined
      });
    },
    async deleteData(id) {
      await kv.delete(id);
    }
  });
}

// src/auth/services/session.ts
import { err, ok } from "@ycore/forge/result";
import { getBindings, getKVStore, isProduction, UNCONFIGURED } from "@ycore/forge/services";
import { getAuthConfig } from "@ycore/foundry/auth";
var challengeKvTemplate = (email) => `challenge:${email}`;
var challengeUniqueKvTemplate = (challenge) => `challenge-unique:${challenge}`;
function resolveAuthBindings(context) {
  const authConfig = getAuthConfig(context);
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
    throw new Error(`Auth secret binding '${session.secretKey}' not found in environment. ` + `Available bindings: ${Object.keys(bindings).join(", ")}`);
  }
  const kv = getKVStore(context, session.kvBinding);
  if (!kv) {
    throw new Error(`KV binding '${session.kvBinding}' not found for session. `);
  }
  return { secret, kv };
}
function createAuthSessionStorage(context) {
  const authConfig = getAuthConfig(context);
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
    const uniqueKey = challengeUniqueKvTemplate(challenge);
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
async function cleanupChallengeSession(email, context) {
  try {
    const { kv } = resolveAuthBindings(context);
    const challengeKey = challengeKvTemplate(email);
    await kv.delete(challengeKey);
    return ok(undefined);
  } catch (error) {
    return err("Failed to cleanup challenge session", { email, error });
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
    return ok(undefined);
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
async function destroyAuthSession(request, context) {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const email = session.get("email");
    if (email) {
      await cleanupChallengeSession(email, context);
    }
    const cookie = await sessionStorage.destroySession(session);
    return ok(cookie);
  } catch (error) {
    return err("Failed to destroy session", { error });
  }
}

// src/auth/services/auth.middleware.ts
function authSessionMiddleware(authConfig) {
  return async ({ request, context }, next) => {
    setAuthConfig(context, authConfig);
    const authSession = await getAuthSession(request, context);
    if (!isError(authSession) && authSession?.user) {
      context.set(authUserContext, authSession.user);
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
function guardedAuthMiddleware(signedOutRoute) {
  return async ({ context }, next) => {
    const user = context.get(authUserContext);
    if (!user) {
      throw redirect(signedOutRoute);
    }
    return next();
  };
}
function unguardedAuthMiddleware(signedInRoute) {
  return async ({ context }, next) => {
    const user = context.get(authUserContext);
    if (user) {
      throw redirect(signedInRoute);
    }
    return next();
  };
}
function unprotectedAuthMiddleware(authConfig) {
  const signedInRoute = authConfig?.routes.signedin || defaultAuthRoutes.signedin;
  return [authSessionMiddleware(authConfig), unguardedAuthMiddleware(signedInRoute)];
}
function protectedAuthMiddleware(authConfig) {
  const signedOutRoute = authConfig?.routes.signedout || defaultAuthRoutes.signedout;
  return [authSessionMiddleware(authConfig), guardedAuthMiddleware(signedOutRoute)];
}
// src/auth/services/auth-passkey-manager.ts
import { logger as logger2 } from "@ycore/forge/logger";
import { err as err4, isError as isError2, ok as ok2 } from "@ycore/forge/result";
import { getKVStore as getKVStore2 } from "@ycore/forge/services";
import { getAuthConfig as getAuthConfig2 } from "@ycore/foundry/auth";

// src/auth/services/repository.ts
import { err as err2, notFoundError, serverError, tryCatch } from "@ycore/forge/result";
import { getDatabase } from "@ycore/forge/services";

// ../../node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(`Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`);
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

// ../../node_modules/drizzle-orm/column.js
class Column {
  constructor(table, config) {
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
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = undefined;
  generated = undefined;
  generatedIdentity = undefined;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  shouldDisableInsert() {
    return this.config.generated !== undefined && this.config.generated.type !== "byDefault";
  }
}

// ../../node_modules/drizzle-orm/column-builder.js
class ColumnBuilder {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: undefined,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: undefined,
      uniqueType: undefined,
      dataType,
      columnType,
      generated: undefined
    };
  }
  $type() {
    return this;
  }
  notNull() {
    this.config.notNull = true;
    return this;
  }
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $default = this.$defaultFn;
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $onUpdate = this.$onUpdateFn;
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  setName(name) {
    if (this.config.name !== "")
      return;
    this.config.name = name;
  }
}

// ../../node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// ../../node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// ../../node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}

// ../../node_modules/drizzle-orm/pg-core/columns/common.js
class PgColumn extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
}

class ExtraConfigColumn extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: undefined
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
}

// ../../node_modules/drizzle-orm/pg-core/columns/enum.js
class PgEnumObjectColumn extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
class PgEnumColumn extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}

// ../../node_modules/drizzle-orm/subquery.js
class Subquery {
  static [entityKind] = "Subquery";
  constructor(sql, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
}

// ../../node_modules/drizzle-orm/version.js
var version = "0.44.6";

// ../../node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife((otel2, rawTracer2) => rawTracer2.startActiveSpan(name, (span) => {
      try {
        return fn(span);
      } catch (e) {
        span.setStatus({
          code: otel2.SpanStatusCode.ERROR,
          message: e instanceof Error ? e.message : "Unknown error"
        });
        throw e;
      } finally {
        span.end();
      }
    }), otel, rawTracer);
  }
};

// ../../node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// ../../node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");

class Table {
  static [entityKind] = "Table";
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  [TableName];
  [OriginalName];
  [Schema];
  [Columns];
  [ExtraConfigColumns];
  [BaseName];
  [IsAlias] = false;
  [IsDrizzleTable] = true;
  [ExtraConfigBuilder] = undefined;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}

// ../../node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
  return value !== null && value !== undefined && typeof value.getSQL === "function";
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

class StringChunk {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}

class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(schemaName === undefined ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]);
      }
    }
  }
  static [entityKind] = "SQL";
  decoder = noopDecoder;
  shouldInlineParams = false;
  usedTables = [];
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
      if (chunk === undefined) {
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
      if (is(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === undefined || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
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
          sql: chunk.table[IsAlias] || schemaName === undefined ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === undefined || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, SQL)) {
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
      if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== undefined) {
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
    if (alias === undefined) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  if(condition) {
    return condition ? this : undefined;
  }
}

class Name {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};

class Param {
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
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
      if (i > 0 && separator !== undefined) {
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

  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));

class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");

class View {
  static [entityKind] = "View";
  [ViewBaseConfig];
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
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
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../../node_modules/drizzle-orm/utils.js
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder;

// ../../node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};

// src/auth/schema/schema.ts
import { createdAt, cuid, updatedAt } from "@ycore/forge/utils";

// ../../node_modules/drizzle-orm/sqlite-core/foreign-keys.js
class ForeignKeyBuilder {
  static [entityKind] = "SQLiteForeignKeyBuilder";
  reference;
  _onUpdate;
  _onDelete;
  constructor(config, actions) {
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
  build(table) {
    return new ForeignKey(table, this);
  }
}

class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
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

// ../../node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}

// ../../node_modules/drizzle-orm/sqlite-core/columns/common.js
class SQLiteColumnBuilder extends ColumnBuilder {
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
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

class SQLiteColumn extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
}

// ../../node_modules/drizzle-orm/sqlite-core/columns/blob.js
class SQLiteBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}

class SQLiteBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteBigInt";
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

class SQLiteBlobJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  build(table) {
    return new SQLiteBlobJson(table, this.config);
  }
}

class SQLiteBlobJson extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobJson";
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

class SQLiteBlobBufferBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}

class SQLiteBlobBuffer extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobBuffer";
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

// ../../node_modules/drizzle-orm/sqlite-core/columns/custom.js
class SQLiteCustomColumnBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  build(table) {
    return new SQLiteCustomColumn(table, this.config);
  }
}

class SQLiteCustomColumn extends SQLiteColumn {
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
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
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(name, config, customTypeParams);
  };
}

// ../../node_modules/drizzle-orm/sqlite-core/columns/integer.js
class SQLiteBaseIntegerBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBaseIntegerBuilder";
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

class SQLiteBaseInteger extends SQLiteColumn {
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
}

class SQLiteIntegerBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(table, this.config);
  }
}

class SQLiteInteger extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteInteger";
}

class SQLiteTimestampBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(table, this.config);
  }
}

class SQLiteTimestamp extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1000);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1000);
    }
    return unix;
  }
}

class SQLiteBooleanBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(table, this.config);
  }
}

class SQLiteBoolean extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
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

// ../../node_modules/drizzle-orm/sqlite-core/columns/numeric.js
class SQLiteNumericBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  build(table) {
    return new SQLiteNumeric(table, this.config);
  }
}

class SQLiteNumeric extends SQLiteColumn {
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}

class SQLiteNumericNumberBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  build(table) {
    return new SQLiteNumericNumber(table, this.config);
  }
}

class SQLiteNumericNumber extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number")
      return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}

class SQLiteNumericBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  build(table) {
    return new SQLiteNumericBigInt(table, this.config);
  }
}

class SQLiteNumericBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}

// ../../node_modules/drizzle-orm/sqlite-core/columns/real.js
class SQLiteRealBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}

class SQLiteReal extends SQLiteColumn {
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
}
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}

// ../../node_modules/drizzle-orm/sqlite-core/columns/text.js
class SQLiteTextBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  build(table) {
    return new SQLiteText(table, this.config);
  }
}

class SQLiteText extends SQLiteColumn {
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}

class SQLiteTextJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  build(table) {
    return new SQLiteTextJson(table, this.config);
  }
}

class SQLiteTextJson extends SQLiteColumn {
  static [entityKind] = "SQLiteTextJson";
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
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}

// ../../node_modules/drizzle-orm/sqlite-core/columns/all.js
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

// ../../node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");

class SQLiteTable extends Table {
  static [entityKind] = "SQLiteTable";
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  [Table.Symbol.Columns];
  [InlineForeignKeys] = [];
  [Table.Symbol.ExtraConfigBuilder] = undefined;
}
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
    const colBuilder = colBuilderBase;
    colBuilder.setName(name2);
    const column = colBuilder.build(rawTable);
    rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
    return [name2, column];
  }));
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};

// src/auth/schema/schema.ts
var users = sqliteTable("users", {
  id: cuid("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  createdAt,
  updatedAt
});
var authenticators = sqliteTable("authenticators", {
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
// src/auth/services/repository.ts
class AuthRepository {
  db;
  constructor(db) {
    this.db = db;
  }
  async getUserById(id) {
    return tryCatch(async () => {
      const result = await this.db.select().from(users).where(eq(users.id, id)).get();
      if (!result) {
        return notFoundError("User", id);
      }
      return result;
    }, `Failed to get user by ID: ${id}`);
  }
  async getUserByEmail(email) {
    return tryCatch(async () => {
      const result = await this.db.select().from(users).where(eq(users.email, email)).get();
      if (!result) {
        return notFoundError("User", email);
      }
      return result;
    }, `Failed to get user by email: ${email}`);
  }
  async createUser(email, displayName) {
    try {
      const newUser = { email, displayName };
      const [result] = await this.db.insert(users).values(newUser).returning();
      if (!result) {
        return err2("Failed to create user", { email, displayName });
      }
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE")) {
        return err2("Email already exists", {
          email,
          code: "DUPLICATE_USER"
        });
      }
      return serverError("Failed to create user", error);
    }
  }
  async getAuthenticatorById(id) {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.id, id)).get();
      if (!result) {
        return notFoundError("Authenticator", id);
      }
      return result;
    }, `Failed to get authenticator by ID: ${id}`);
  }
  async getAuthenticatorsByUserId(userId) {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();
      return result;
    }, `Failed to get authenticators for user: ${userId}`);
  }
  async createAuthenticator(authenticator) {
    try {
      const [result] = await this.db.insert(authenticators).values(authenticator).returning();
      if (!result) {
        return err2("Failed to create authenticator", { id: authenticator.id });
      }
      return result;
    } catch (error) {
      return serverError("Failed to create authenticator", error);
    }
  }
  async updateAuthenticatorCounter(id, counter) {
    try {
      const result = await this.db.update(authenticators).set({ counter }).where(eq(authenticators.id, id)).returning();
      if (result.length === 0) {
        return notFoundError("Authenticator", id);
      }
      return true;
    } catch (error) {
      return serverError("Failed to update authenticator counter", error);
    }
  }
  async updateAuthenticatorUsage(id, counter, lastUsedAt) {
    try {
      const result = await this.db.update(authenticators).set({
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
  }
  async updateAuthenticatorName(id, name) {
    try {
      const result = await this.db.update(authenticators).set({ name }).where(eq(authenticators.id, id)).returning();
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
  }
  async deleteAuthenticator(id) {
    try {
      const result = await this.db.delete(authenticators).where(eq(authenticators.id, id)).returning();
      if (result.length === 0) {
        return notFoundError("Authenticator", id);
      }
      return true;
    } catch (error) {
      return serverError("Failed to delete authenticator", error);
    }
  }
  async authenticatorBelongsToUser(id, userId) {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.id, id)).get();
      if (!result) {
        return false;
      }
      return result.userId === userId;
    }, `Failed to verify authenticator ownership for ID: ${id}`);
  }
  async countAuthenticatorsByUserId(userId) {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();
      return result.length;
    }, `Failed to count authenticators for user: ${userId}`);
  }
  async updateUserEmail(id, newEmail) {
    try {
      const result = await this.db.update(users).set({ email: newEmail, emailVerified: false }).where(eq(users.id, id)).returning();
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
        return err2("Email already exists", {
          email: newEmail,
          code: "DUPLICATE_EMAIL"
        });
      }
      return serverError("Failed to update user email", error);
    }
  }
  async updateEmailVerified(id, verified) {
    try {
      const result = await this.db.update(users).set({ emailVerified: verified }).where(eq(users.id, id)).returning();
      if (result.length === 0) {
        return notFoundError("User", id);
      }
      const updatedUser = result[0];
      if (!updatedUser) {
        return serverError("Failed to retrieve updated user", new Error("Update returned empty result"));
      }
      return updatedUser;
    } catch (error) {
      return serverError("Failed to update email verified status", error);
    }
  }
  async deleteUser(id) {
    try {
      const deleteAuthenticatorsResult = await this.db.delete(authenticators).where(eq(authenticators.userId, id));
      const deleteUserResult = await this.db.delete(users).where(eq(users.id, id)).returning();
      if (deleteUserResult.length === 0) {
        return notFoundError("User", id);
      }
      return true;
    } catch (error) {
      return serverError("Failed to delete user", error);
    }
  }
}
function getAuthRepository(context) {
  const db = getDatabase(context);
  return new AuthRepository(db);
}

// src/auth/services/webauthn.ts
import { decodePKIXECDSASignature, ECDSAPublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { decodeBase64url, encodeBase64url } from "@oslojs/encoding";
import { ClientDataType, COSEKeyType, createAssertionSignatureMessage, parseAttestationObject, parseAuthenticatorData, parseClientDataJSON } from "@oslojs/webauthn";
import { logger } from "@ycore/forge/logger";
import { err as err3 } from "@ycore/forge/result";

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
var AUTHENTICATOR_FLAGS = {
  BACKUP_ELIGIBLE: 8,
  BACKUP_STATE: 16
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
function convertAAGUIDToUUID(aaguid) {
  const aaguidString = Array.from(aaguid).map((b) => b.toString(16).padStart(2, "0")).join("");
  return [aaguidString.slice(0, 8), aaguidString.slice(8, 12), aaguidString.slice(12, 16), aaguidString.slice(16, 20), aaguidString.slice(20, 32)].join("-");
}
function isAAGUIDAllZeros(aaguid) {
  return Array.from(aaguid).every((byte) => byte === 0);
}

// src/auth/services/webauthn.ts
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
  const timestamp = new Date().toLocaleDateString("en-US", {
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
    return WEBAUTHN_ERROR_MESSAGES.get("DEFAULT" /* DEFAULT */)?.(operation) || "Auth failure. Please try again.";
  }
  const messageResolver = WEBAUTHN_ERROR_MESSAGES.get(code);
  return messageResolver ? messageResolver(operation) : WEBAUTHN_ERROR_MESSAGES.get("DEFAULT" /* DEFAULT */)?.(operation) || "Auth failure. Please try again.";
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
      return err3("Invalid challenge", {
        field: "challenge",
        code: "INVALID_CHALLENGE" /* INVALID_CHALLENGE */
      });
    }
    if (clientData.origin !== expectedOrigin) {
      return err3("Invalid origin", {
        field: "origin",
        code: "INVALID_ORIGIN" /* INVALID_ORIGIN */
      });
    }
    if (clientData.type !== ClientDataType.Create) {
      return err3("Invalid request type", {
        field: "type",
        code: "INVALID_CREDENTIAL" /* INVALID_CREDENTIAL */
      });
    }
    if (!authenticatorData.verifyRelyingPartyIdHash(expectedRPID)) {
      return err3("Invalid relying party", {
        field: "rpId",
        code: "INVALID_RPID" /* INVALID_RPID */
      });
    }
    if (!authenticatorData.userPresent) {
      return err3("User presence required", {
        field: "userPresence",
        code: "USER_NOT_PRESENT" /* USER_NOT_PRESENT */
      });
    }
    const attestedCredential = authenticatorData.credential;
    if (!attestedCredential) {
      return err3("No credential found", {
        field: "credential",
        code: "INVALID_CREDENTIAL" /* INVALID_CREDENTIAL */
      });
    }
    const publicKey = attestedCredential.publicKey;
    if (publicKey.type() !== COSEKeyType.EC2) {
      return err3("Only ES256 algorithm is supported", {
        field: "keyType",
        code: "UNSUPPORTED_ALGORITHM" /* UNSUPPORTED_ALGORITHM */
      });
    }
    const publicKeyAlgorithm = publicKey.algorithm();
    if (publicKeyAlgorithm !== WEBAUTHN_ALGORITHMS.ES256) {
      return err3("Only ES256 algorithm is supported", {
        field: "algorithm",
        code: "UNSUPPORTED_ALGORITHM" /* UNSUPPORTED_ALGORITHM */
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
    return err3("Registration verification failed", { field: "general" });
  }
}
async function verifyAuthentication(credential, expectedChallenge, expectedOrigin, expectedRPID, storedCredential) {
  try {
    const authenticatorData = parseAuthenticatorData(new Uint8Array(credential.response.authenticatorData));
    const clientData = parseClientDataJSON(new Uint8Array(credential.response.clientDataJSON));
    const receivedChallenge = encodeBase64url(new Uint8Array(clientData.challenge));
    if (receivedChallenge !== expectedChallenge) {
      return err3("Invalid challenge", {
        field: "challenge",
        code: "INVALID_CHALLENGE" /* INVALID_CHALLENGE */
      });
    }
    if (clientData.origin !== expectedOrigin) {
      return err3("Invalid origin", {
        field: "origin",
        code: "INVALID_ORIGIN" /* INVALID_ORIGIN */
      });
    }
    if (clientData.type !== ClientDataType.Get) {
      return err3("Invalid request type", {
        field: "type",
        code: "INVALID_CREDENTIAL" /* INVALID_CREDENTIAL */
      });
    }
    if (!authenticatorData.verifyRelyingPartyIdHash(expectedRPID)) {
      return err3("Invalid relying party", {
        field: "rpId",
        code: "INVALID_RPID" /* INVALID_RPID */
      });
    }
    if (!authenticatorData.userPresent) {
      return err3("User presence required", {
        field: "userPresence",
        code: "USER_NOT_PRESENT" /* USER_NOT_PRESENT */
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
        return err3("Security violation: Counter rollback detected", {
          field: "counter",
          code: "INVALID_COUNTER" /* INVALID_COUNTER */
        });
      }
    }
    const signatureMessage = createAssertionSignatureMessage(new Uint8Array(credential.response.authenticatorData), new Uint8Array(credential.response.clientDataJSON));
    let publicKeyData;
    try {
      const storedKeyJson = new TextDecoder().decode(decodeBase64url(storedCredential.credentialPublicKey));
      publicKeyData = JSON.parse(storedKeyJson);
      if (!publicKeyData) {
        return err3("Invalid stored public key", {
          field: "publicKey",
          code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
        });
      }
    } catch (error) {
      logger.error("webauthn_authentication_key_parse_error", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return err3("Failed to parse stored public key", {
        field: "publicKey",
        code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
      });
    }
    try {
      const signatureBytes = new Uint8Array(credential.response.signature);
      const xCoordinate = publicKeyData[-2];
      const yCoordinate = publicKeyData[-3];
      if (!xCoordinate || !yCoordinate) {
        return err3("Invalid public key structure", {
          field: "publicKey",
          code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
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
        return err3("Failed to decode key coordinates", {
          field: "publicKey",
          code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
        });
      }
      if (xBytes.length !== WEBAUTHN_CONFIG.COORDINATE_LENGTH || yBytes.length !== WEBAUTHN_CONFIG.COORDINATE_LENGTH) {
        return err3("Invalid coordinate length for P-256 key", {
          field: "publicKey",
          code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
        });
      }
      const xHex = Array.from(xBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const yHex = Array.from(yBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      if (xHex.length === 0 || yHex.length === 0) {
        return err3("Empty coordinate data", {
          field: "publicKey",
          code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
        });
      }
      const xHexPadded = xHex.padStart(WEBAUTHN_CONFIG.HEX_COORDINATE_LENGTH, "0");
      const yHexPadded = yHex.padStart(WEBAUTHN_CONFIG.HEX_COORDINATE_LENGTH, "0");
      const xBigInt = BigInt(`0x${xHexPadded}`);
      const yBigInt = BigInt(`0x${yHexPadded}`);
      const publicKey = new ECDSAPublicKey(p256, xBigInt, yBigInt);
      if (!publicKey.isCurve(p256)) {
        return err3("Public key not on P-256 curve", {
          field: "publicKey",
          code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
        });
      }
      try {
        publicKey.encodeSEC1Uncompressed();
      } catch (error) {
        logger.error("webauthn_authentication_public_key_encoding_error", {
          error: error instanceof Error ? error.message : "Unknown error"
        });
        return err3("Invalid public key encoding", {
          field: "publicKey",
          code: "INVALID_KEY_FORMAT" /* INVALID_KEY_FORMAT */
        });
      }
      const messageHash = sha256(signatureMessage);
      const signature = decodePKIXECDSASignature(signatureBytes);
      const isValid = verifyECDSASignature(publicKey, messageHash, signature);
      if (!isValid) {
        return err3("Invalid signature", {
          field: "signature",
          code: "SIGNATURE_FAILED" /* SIGNATURE_FAILED */
        });
      }
    } catch (error) {
      logger.error("webauthn_authentication_signature_verification_error", {
        error: error instanceof Error ? error.message : "Unknown error",
        credentialId: credential.id
      });
      return err3("Signature verification failed", {
        field: "signature",
        code: "SIGNATURE_FAILED" /* SIGNATURE_FAILED */
      });
    }
    return {
      verified: true,
      newCounter: authenticatorData.signatureCounter
    };
  } catch (error) {
    logger.error("webauthn_authentication_error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err3("Authentication verification failed", { field: "general" });
  }
}

// src/auth/services/webauthn-config.ts
import { getOrigin, getOriginDomain, isDevelopment } from "@ycore/forge/services";
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
    return [...new Set([originUrl, requestOrigin])];
  }
  return [originUrl];
}
function validateOrigin(clientOrigin, allowedOrigins) {
  return allowedOrigins.includes(clientOrigin);
}

// src/auth/services/auth-passkey-manager.ts
var MAX_AUTHENTICATORS_PER_USER = 10;
var MIN_AUTHENTICATORS_PER_USER = 1;
async function addPasskeyForUser(context, userId, credential, challenge, origin, request) {
  const repo = getAuthRepository(context);
  const authConfig = getAuthConfig2(context);
  if (!authConfig) {
    return err4("Auth configuration not found", { field: "general" });
  }
  const rpId = resolveRpId(context, request);
  const metadataKV = authConfig.webauthn.kvBinding ? getKVStore2(context, authConfig.webauthn.kvBinding) : undefined;
  const countResult = await repo.countAuthenticatorsByUserId(userId);
  if (isError2(countResult)) {
    return countResult;
  }
  if (countResult >= MAX_AUTHENTICATORS_PER_USER) {
    logger2.warning("passkey_add_max_reached", { userId, count: countResult });
    return err4("Maximum number of authenticators reached", {
      limit: `You can have a maximum of ${MAX_AUTHENTICATORS_PER_USER} authenticators`
    });
  }
  const verificationResult = await verifyRegistration(credential, challenge, origin, rpId, metadataKV);
  if (isError2(verificationResult)) {
    logger2.error("passkey_add_verification_failed", { userId, error: verificationResult });
    return verificationResult;
  }
  const createResult = await repo.createAuthenticator({ ...verificationResult, userId });
  if (isError2(createResult)) {
    logger2.error("passkey_add_create_failed", { userId, error: createResult });
    return createResult;
  }
  return ok2(createResult);
}
async function renamePasskey(context, userId, authenticatorId, newName) {
  const repo = getAuthRepository(context);
  const ownershipResult = await repo.authenticatorBelongsToUser(authenticatorId, userId);
  if (isError2(ownershipResult)) {
    logger2.error("passkey_rename_ownership_check_failed", { userId, authenticatorId, error: ownershipResult });
    return ownershipResult;
  }
  if (!ownershipResult) {
    logger2.warning("passkey_rename_unauthorized", { userId, authenticatorId });
    return err4("Authenticator not found or unauthorized", {
      authenticator: "You do not have permission to modify this authenticator"
    });
  }
  const trimmedName = newName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 50) {
    return err4("Invalid authenticator name", {
      name: "Name must be between 1 and 50 characters"
    });
  }
  const updateResult = await repo.updateAuthenticatorName(authenticatorId, trimmedName);
  if (isError2(updateResult)) {
    logger2.error("passkey_rename_failed", { userId, authenticatorId, error: updateResult });
    return updateResult;
  }
  return ok2(updateResult);
}
async function deletePasskey(context, userId, authenticatorId) {
  const repo = getAuthRepository(context);
  const ownershipResult = await repo.authenticatorBelongsToUser(authenticatorId, userId);
  if (isError2(ownershipResult)) {
    logger2.error("passkey_delete_ownership_check_failed", { userId, authenticatorId, error: ownershipResult });
    return ownershipResult;
  }
  if (!ownershipResult) {
    logger2.warning("passkey_delete_unauthorized", { userId, authenticatorId });
    return err4("Authenticator not found or unauthorized", {
      authenticator: "You do not have permission to delete this authenticator"
    });
  }
  const countResult = await repo.countAuthenticatorsByUserId(userId);
  if (isError2(countResult)) {
    logger2.error("passkey_delete_count_failed", { userId, error: countResult });
    return countResult;
  }
  if (countResult <= MIN_AUTHENTICATORS_PER_USER) {
    logger2.warning("passkey_delete_minimum_required", { userId, count: countResult });
    return err4("Cannot delete last authenticator", {
      authenticator: "You must have at least one authenticator for security"
    });
  }
  const deleteResult = await repo.deleteAuthenticator(authenticatorId);
  if (isError2(deleteResult)) {
    logger2.error("passkey_delete_failed", { userId, authenticatorId, error: deleteResult });
    return deleteResult;
  }
  return ok2(true);
}
async function generateAddPasskeyOptions(context, request, userId, rpName, rpId) {
  const repo = getAuthRepository(context);
  const authSession = await getAuthSession(request, context);
  if (isError2(authSession)) {
    return authSession;
  }
  if (!authSession || !authSession.user) {
    return err4("User not authenticated", { user: "Session does not contain user data" });
  }
  const session = authSession;
  const existingAuthsResult = await repo.getAuthenticatorsByUserId(userId);
  if (isError2(existingAuthsResult)) {
    logger2.error("passkey_options_get_existing_failed", { userId, error: existingAuthsResult });
    return existingAuthsResult;
  }
  const excludeCredentials = existingAuthsResult.map((auth) => ({ id: auth.id, transports: auth.transports }));
  const challenge = generateChallenge();
  const options = createRegistrationOptions(rpName, rpId, session.user.email, session.user.displayName, challenge, excludeCredentials);
  return ok2({ challenge, options });
}
// src/auth/services/auth-profile.ts
import { isError as isError3, ok as ok3 } from "@ycore/forge/result";
import { authUserContext as authUserContext2 } from "@ycore/foundry/auth";
async function profileLoader({ context }) {
  const user = context.get(authUserContext2);
  return ok3({ user });
}
async function getUserWithAuthenticators(context, userId) {
  const repository = getAuthRepository(context);
  const userResult = await repository.getUserById(userId);
  if (isError3(userResult)) {
    return userResult;
  }
  const authenticatorsResult = await repository.getAuthenticatorsByUserId(userId);
  if (isError3(authenticatorsResult)) {
    return authenticatorsResult;
  }
  return {
    user: userResult,
    authenticators: authenticatorsResult
  };
}
// src/auth/services/auth-signin.ts
import { decodeBase64url as decodeBase64url3 } from "@oslojs/encoding";
import { handleIntent } from "@ycore/forge/intent/server";
import { logger as logger5 } from "@ycore/forge/logger";
import { err as err7, flattenError, isError as isError6, ok as ok6, respondError, respondOk, transformError, validateFormData } from "@ycore/forge/result";
import { getAuthConfig as getAuthConfig4 } from "@ycore/foundry/auth";
import { csrfContext } from "@ycore/foundry/secure/services";
import { redirect as redirect2 } from "react-router";

// src/auth/services/auth.validation.ts
import { email, maxLength, minLength, nonEmpty, object, pipe, string } from "valibot";
var emailField = pipe(string(), nonEmpty("Please enter your email."), email("Please enter a valid email."), maxLength(32, "Email is too long"));
var displayNameField = pipe(string(), nonEmpty("Display name is required"), minLength(1, "Display name is required"));
var authFormSchema = object({ email: emailField });
var signupFormSchema = object({ email: emailField, displayName: displayNameField });
var signinFormSchema = object({ email: emailField });

// src/auth/services/webauthn-utils.ts
import { logger as logger3 } from "@ycore/forge/logger";
import { err as err5, isError as isError4, ok as ok4 } from "@ycore/forge/result";
import { getAuthConfig as getAuthConfig3 } from "@ycore/foundry/auth";
function parseWebAuthnCredential(formData, operation) {
  const webauthnResponse = formData.get("webauthn_response")?.toString();
  if (!webauthnResponse) {
    const errorMessage = operation === "signin" ? "Authentication failed. Please try again." : "Registration failed. Please try again.";
    logger3.warning(`${operation}_missing_webauthn_response`);
    return err5(errorMessage, { field: "general" });
  }
  try {
    const credential = JSON.parse(webauthnResponse);
    return ok4(credential);
  } catch (error) {
    logger3.error(`${operation}_webauthn_parse_error`, {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return err5("Invalid authentication data. Please try again.", { field: "general" });
  }
}
async function createAuthenticatedSession(context, user, email2, operation) {
  const sessionResult = await createAuthSession(context, { user });
  if (isError4(sessionResult)) {
    logger3.error(`${operation}_session_creation_failed`, {
      email: email2,
      userId: user.id,
      error: sessionResult.message
    });
    return err5("Failed to create session", { field: "general" });
  }
  return ok4(sessionResult);
}
function createAuthSuccessResponse(context, cookie) {
  const authConfig = getAuthConfig3(context);
  const redirectTo = authConfig?.routes.signedin || defaultAuthRoutes.signedin;
  return { redirectTo, cookie };
}

// src/auth/services/webauthn-validation.ts
import { decodeBase64url as decodeBase64url2 } from "@oslojs/encoding";
import { logger as logger4 } from "@ycore/forge/logger";
import { err as err6, isError as isError5, ok as ok5 } from "@ycore/forge/result";
async function validateChallenge(options, context) {
  const { storedChallenge, challengeCreatedAt, maxAge = 5 * 60 * 1000 } = options;
  if (Date.now() - challengeCreatedAt > maxAge) {
    return err6("Session expired. Please refresh and try again.", {
      field: "general",
      code: "CHALLENGE_EXPIRED" /* CHALLENGE_EXPIRED */
    });
  }
  const uniquenessResult = await verifyChallengeUniqueness(storedChallenge, context);
  if (!uniquenessResult) {
    return err6("Invalid challenge. Please refresh and try again.", {
      field: "general",
      code: "INVALID_CHALLENGE" /* INVALID_CHALLENGE */
    });
  }
  return ok5(undefined);
}
async function validateWebAuthnOrigin(request, options, context) {
  const { clientDataJSON, logContext = {}, operation } = options;
  const allowedOrigins = resolveOrigins(context, request);
  const serverOrigin = new URL(request.url).origin;
  if (!validateOrigin(serverOrigin, allowedOrigins)) {
    logger4.error(`${operation}_server_origin_not_allowed`, {
      serverOrigin,
      allowedOrigins,
      ...logContext
    });
    return err6("Server configuration error", { field: "general" });
  }
  const clientData = JSON.parse(new TextDecoder().decode(decodeBase64url2(clientDataJSON)));
  const clientOrigin = clientData.origin;
  if (clientOrigin !== serverOrigin) {
    return err6("Origin mismatch", { field: "general" });
  }
  return ok5(serverOrigin);
}
async function validateWebAuthnRequest(request, options, context) {
  const { storedChallenge, challengeCreatedAt, clientDataJSON, logContext, operation, maxAge } = options;
  const challengeResult = await validateChallenge({ storedChallenge, challengeCreatedAt, maxAge }, context);
  if (isError5(challengeResult)) {
    return challengeResult;
  }
  const originResult = await validateWebAuthnOrigin(request, { clientDataJSON, logContext, operation }, context);
  if (isError5(originResult)) {
    return originResult;
  }
  const rpId = resolveRpId(context, request);
  return ok5({ challenge: storedChallenge, origin: originResult, rpId });
}

// src/auth/services/auth-signin.ts
async function signinLoader({ context }) {
  const csrfData = context.get(csrfContext);
  const challenge = generateChallenge();
  const cookieResult = await createChallengeSession(context, challenge);
  if (isError6(cookieResult)) {
    logger5.error("signin_loader_session_creation_failed", { error: cookieResult.message });
    return respondError(cookieResult);
  }
  return respondOk({ csrfData, challenge }, { headers: { "Set-Cookie": cookieResult } });
}
async function signinAction({ request, context }) {
  const repository = getAuthRepository(context);
  const authConfig = getAuthConfig4(context);
  if (!authConfig) {
    logger5.warning("signin_action_no_config");
    return respondError(err7("Auth configuration not found", { field: "general" }));
  }
  const formData = await request.formData();
  const handlers = {
    signin: async (formData2) => {
      try {
        const validationResult = await validateFormData(signinFormSchema, formData2);
        if (isError6(validationResult)) {
          logger5.warning("signin_validation_failed", { error: flattenError(validationResult) });
          return validationResult;
        }
        const email2 = validationResult.email;
        const userResult = await repository.getUserByEmail(email2);
        const userExists = !isError6(userResult);
        const user = userExists ? userResult : null;
        const authenticatorsResult = user ? await repository.getAuthenticatorsByUserId(user.id) : [];
        const hasAuthenticators = !isError6(authenticatorsResult) && authenticatorsResult.length > 0;
        if (!userExists || !hasAuthenticators) {
          logger5.warning("signin_invalid_credentials", { email: email2 });
          return err7("The credentials are incorrect", { email: "The credentials are incorrect" });
        }
        const authenticators2 = authenticatorsResult;
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError6(sessionResult)) {
          logger5.warning("signin_invalid_session", { email: email2, error: flattenError(sessionResult) });
          return sessionResult;
        }
        const { challenge: storedChallenge, challengeCreatedAt, session } = sessionResult;
        const credentialResult = parseWebAuthnCredential(formData2, "signin");
        if (isError6(credentialResult)) {
          return credentialResult;
        }
        const credential = credentialResult;
        const authenticator = authenticators2.find((auth) => auth.id === credential.rawId);
        if (!authenticator) {
          logger5.warning("signin_authenticator_not_found", { email: email2, credentialId: credential.rawId });
          return err7("The credentials are incorrect", { email: "The credentials are incorrect" });
        }
        if (authenticator.userId !== user.id) {
          logger5.critical("signin_authenticator_user_mismatch", {
            authenticatorUserId: authenticator.userId,
            requestUserId: user.id,
            email: email2,
            credentialId: credential.rawId
          });
          return err7("The credentials are incorrect", { email: "The credentials are incorrect" });
        }
        const webauthnValidationResult = await validateWebAuthnRequest(request, {
          storedChallenge,
          challengeCreatedAt,
          clientDataJSON: credential.response.clientDataJSON,
          operation: "signin",
          logContext: { email: email2 }
        }, context);
        if (isError6(webauthnValidationResult)) {
          logger5.warning("signin_webauthn_validation_failed", { email: email2, error: flattenError(webauthnValidationResult) });
          return webauthnValidationResult;
        }
        const { challenge, origin, rpId } = webauthnValidationResult;
        const authenticationData = {
          id: credential.id,
          rawId: decodeBase64url3(credential.rawId).buffer,
          response: {
            authenticatorData: decodeBase64url3(credential.response.authenticatorData).buffer,
            clientDataJSON: decodeBase64url3(credential.response.clientDataJSON).buffer,
            signature: decodeBase64url3(credential.response.signature).buffer,
            userHandle: credential.response.userHandle ? decodeBase64url3(credential.response.userHandle).buffer : undefined
          },
          type: "public-key"
        };
        const verificationResult = await verifyAuthentication(authenticationData, challenge, origin, rpId, authenticator);
        if (isError6(verificationResult)) {
          logger5.error("signin_verification_failed", {
            email: email2,
            error: verificationResult.message,
            code: verificationResult.code,
            details: verificationResult.details
          });
          const errorMessage = getWebAuthnErrorMessage(verificationResult.code, "authentication");
          return err7(errorMessage, { field: "general", code: verificationResult.code });
        }
        const updateResult = await repository.updateAuthenticatorUsage(authenticator.id, verificationResult.newCounter, new Date);
        if (isError6(updateResult)) {
          logger5.warning("signin_authenticator_update_failed", { authenticatorId: authenticator.id, error: updateResult.message });
        }
        const cleanupResult = await destroyChallengeSession(session, context);
        if (isError6(cleanupResult)) {
          logger5.warning("signin_challenge_cleanup_failed", { error: cleanupResult.message });
        }
        const authSessionResult = await createAuthenticatedSession(context, user, email2, "signin");
        if (isError6(authSessionResult)) {
          return authSessionResult;
        }
        return ok6(createAuthSuccessResponse(context, authSessionResult));
      } catch (error) {
        if (error instanceof Response) {
          throw error;
        }
        logger5.error("signin_error", { error: transformError(error) });
        return err7("Authentication failed", { field: "general" });
      }
    }
  };
  const result = await handleIntent(formData, handlers);
  if (isError6(result)) {
    logger5.warning("signin_action_failed", { error: flattenError(result) });
    return respondError(result);
  }
  const successData = result;
  throw redirect2(successData.redirectTo, { headers: { "Set-Cookie": successData.cookie } });
}
// src/auth/services/auth-signout.ts
import { logger as logger6 } from "@ycore/forge/logger";
import { isError as isError7 } from "@ycore/forge/result";
import { getAuthConfig as getAuthConfig5 } from "@ycore/foundry/auth";
import { redirect as redirect3 } from "react-router";
async function signoutAction({ request, context }) {
  const destroyResult = await destroyAuthSession(request, context);
  if (isError7(destroyResult)) {
    logger6.error("Failed to destroy session:", destroyResult.message);
  }
  const authConfig = getAuthConfig5(context);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;
  return redirect3(redirectTo, { headers: { "Set-Cookie": !isError7(destroyResult) ? destroyResult : "" } });
}
async function signoutLoader({ context }) {
  const authConfig = getAuthConfig5(context);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;
  return redirect3(redirectTo);
}
// src/auth/services/auth-signup.ts
import { decodeBase64url as decodeBase64url4 } from "@oslojs/encoding";
import { handleIntent as handleIntent2 } from "@ycore/forge/intent/server";
import { logger as logger7 } from "@ycore/forge/logger";
import { err as err8, flattenError as flattenError2, isError as isError8, ok as ok7, respondError as respondError2, respondOk as respondOk2, transformError as transformError2, validateFormData as validateFormData2 } from "@ycore/forge/result";
import { getKVStore as getKVStore3 } from "@ycore/forge/services";
import { getAuthConfig as getAuthConfig6 } from "@ycore/foundry/auth";
import { csrfContext as csrfContext2 } from "@ycore/foundry/secure/services";
import { redirect as redirect4 } from "react-router";
async function signupLoader({ context }) {
  const csrfData = context.get(csrfContext2);
  const challenge = generateChallenge();
  const cookieResult = await createChallengeSession(context, challenge);
  if (isError8(cookieResult)) {
    logger7.error("signup_loader_session_creation_failed", { error: cookieResult.message });
    return respondError2(cookieResult);
  }
  return respondOk2({ csrfData, challenge }, { headers: { "Set-Cookie": cookieResult } });
}
async function signupAction({ request, context }) {
  const repository = getAuthRepository(context);
  const authConfig = getAuthConfig6(context);
  if (!authConfig) {
    return respondError2(err8("Auth configuration not found", { field: "general" }));
  }
  const formData = await request.formData();
  const handlers = {
    signup: async (formData2) => {
      try {
        const validationResult = await validateFormData2(signupFormSchema, formData2);
        if (isError8(validationResult)) {
          return validationResult;
        }
        const { email: email2, displayName } = validationResult;
        const existingUserResult = await repository.getUserByEmail(email2);
        if (!isError8(existingUserResult)) {
          return err8("An account already exists with this email", { email: "An account already exists with this email" });
        }
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError8(sessionResult)) {
          logger7.warning("signup_invalid_session", { email: email2, error: flattenError2(sessionResult) });
          return sessionResult;
        }
        const { challenge: storedChallenge, challengeCreatedAt, session } = sessionResult;
        const credentialResult = parseWebAuthnCredential(formData2, "signup");
        if (isError8(credentialResult)) {
          return credentialResult;
        }
        const credential = credentialResult;
        const webauthnValidationResult = await validateWebAuthnRequest(request, {
          storedChallenge,
          challengeCreatedAt,
          clientDataJSON: credential.response.clientDataJSON,
          operation: "signup",
          logContext: { email: email2 }
        }, context);
        if (isError8(webauthnValidationResult)) {
          return webauthnValidationResult;
        }
        const { challenge, origin, rpId } = webauthnValidationResult;
        const registrationData = {
          id: credential.id,
          rawId: decodeBase64url4(credential.rawId).buffer,
          response: {
            attestationObject: decodeBase64url4(credential.response.attestationObject).buffer,
            clientDataJSON: decodeBase64url4(credential.response.clientDataJSON).buffer,
            transports: credential.response?.transports || []
          },
          type: "public-key",
          authenticatorAttachment: credential.authenticatorAttachment || null
        };
        const metadataKV = authConfig.webauthn.kvBinding ? getKVStore3(context, authConfig.webauthn.kvBinding) : undefined;
        const verificationResult = await verifyRegistration(registrationData, challenge, origin, rpId, metadataKV);
        if (isError8(verificationResult)) {
          logger7.error("signup_verification_failed", {
            email: email2,
            error: verificationResult.message,
            code: verificationResult.code,
            details: verificationResult.details
          });
          const errorMessage = getWebAuthnErrorMessage(verificationResult.code, "registration");
          return err8(errorMessage, { field: "general", code: verificationResult.code });
        }
        const createUserResult = await repository.createUser(email2, displayName);
        if (isError8(createUserResult)) {
          logger7.error("signup_create_user_failed", { email: email2, error: createUserResult.message });
          return err8("Failed to create account", { field: "general" });
        }
        const user = createUserResult;
        const createAuthResult = await repository.createAuthenticator({ ...verificationResult, userId: user.id });
        if (isError8(createAuthResult)) {
          logger7.error("signup_create_authenticator_failed", { email: email2, userId: user.id, error: createAuthResult.message });
          await repository.deleteUser(user.id);
          return err8("Failed to register authenticator", { field: "general" });
        }
        const cleanupResult = await destroyChallengeSession(session, context);
        if (isError8(cleanupResult)) {
          logger7.warning("signup_challenge_cleanup_failed", { error: cleanupResult.message });
        }
        const authSessionResult = await createAuthenticatedSession(context, user, email2, "signup");
        if (isError8(authSessionResult)) {
          return authSessionResult;
        }
        return ok7(createAuthSuccessResponse(context, authSessionResult));
      } catch (error) {
        if (error instanceof Response) {
          throw error;
        }
        logger7.error("signup_error", { error: transformError2(error) });
        return err8("Registration failed", { field: "general" });
      }
    }
  };
  const result = await handleIntent2(formData, handlers);
  if (isError8(result)) {
    logger7.warning("signup_action_failed", { error: flattenError2(result) });
    return respondError2(result);
  }
  const successResult = result;
  throw redirect4(successResult.redirectTo, { headers: { "Set-Cookie": successResult.cookie } });
}
// src/auth/services/auth-verify.ts
import { handleIntent as handleIntent3 } from "@ycore/forge/intent/server";
import { logger as logger14 } from "@ycore/forge/logger";
import { err as err16, flattenError as flattenError4, isError as isError10, ok as ok10, respondError as respondError3, respondOk as respondOk3, validateFormData as validateFormData3 } from "@ycore/forge/result";
import { getAuthConfig as getAuthConfig8 } from "@ycore/foundry/auth";
import { csrfContext as csrfContext3 } from "@ycore/foundry/secure/services";
import { redirect as redirect5 } from "react-router";
import { minLength as minLength2, object as object2, pipe as pipe2, string as string2 } from "valibot";

// src/auth/services/totp-service.ts
import { logger as logger8 } from "@ycore/forge/logger";
import { err as err9, ok as ok8 } from "@ycore/forge/result";
import { getBindings as getBindings2 } from "@ycore/forge/services";
import { getAuthConfig as getAuthConfig7 } from "@ycore/foundry/auth";
function base32Decode(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanInput = input.replace(/[^A-Z2-7]/gi, "").toUpperCase();
  let bits = "";
  for (const char of cleanInput) {
    const value = alphabet.indexOf(char);
    if (value === -1)
      throw new Error(`Invalid base32 character: ${char}`);
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0;i < bytes.length; i++) {
    bytes[i] = Number.parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}
function normalizeSecret(secret) {
  if (secret instanceof Uint8Array)
    return secret;
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
function generateSecret(length = 32) {
  if (length <= 0)
    throw new Error("Length must be positive");
  return crypto.getRandomValues(new Uint8Array(length));
}
function base32Encode(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0;i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    result += alphabet[Number.parseInt(chunk, 2)];
  }
  return result;
}
async function generateTOTP(options) {
  const { secret, timestamp = Date.now(), period = 30, digits = 6, algorithm = "SHA-1" } = options;
  if (period <= 0)
    throw new Error("Period must be positive");
  const counter = Math.floor(timestamp / 1000 / period);
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
  const currentPeriod = Math.floor(timestamp / 1000 / period);
  for (let i = -window;i <= window; i++) {
    const testPeriod = currentPeriod + i;
    const testTimestamp = testPeriod * period * 1000;
    const expectedToken = await generateTOTP({
      ...totpOptions,
      timestamp: testTimestamp,
      period
    });
    if (token === expectedToken) {
      return { valid: true, timestamp: testTimestamp };
    }
  }
  return { valid: false };
}
var kvKeyTemplate = (purpose, email2) => `totp:${purpose}:${email2}`;
async function createVerificationCode(email2, purpose, context, metadata) {
  try {
    const authConfig = getAuthConfig7(context);
    if (!authConfig) {
      return err9("Auth configuration not found");
    }
    const env = getBindings2(context);
    const kv = env[authConfig.session.kvBinding];
    if (!kv) {
      return err9(`KV binding '${authConfig.session.kvBinding}' not found`);
    }
    const secret = base32Encode(generateSecret());
    const period = authConfig.verification.period;
    const digits = authConfig.verification.digits;
    const code = await generateTOTP({ secret, period, digits });
    const verificationData = {
      secret,
      expireAt: Date.now() + period * 1000,
      attempts: 0,
      purpose,
      metadata
    };
    await kv.put(kvKeyTemplate(purpose, email2), JSON.stringify(verificationData), { expirationTtl: period });
    logger8.info("verification_code_created", { email: email2, purpose });
    return ok8(code);
  } catch (error) {
    logger8.error("verification_code_creation_failed", {
      email: email2,
      purpose,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return err9("Failed to create verification code", { error });
  }
}
async function verifyCode(email2, code, purpose, context) {
  try {
    const authConfig = getAuthConfig7(context);
    if (!authConfig) {
      return err9("Auth configuration not found");
    }
    const env = getBindings2(context);
    const kv = env[authConfig.session.kvBinding];
    if (!kv) {
      return err9(`KV binding '${authConfig.session.kvBinding}' not found`);
    }
    const kvKey = kvKeyTemplate(purpose, email2);
    const storedData = await kv.get(kvKey);
    if (!storedData) {
      logger8.warning("verification_code_not_found", { email: email2, purpose });
      return err9("Verification code expired or not found");
    }
    const verification = JSON.parse(storedData);
    if (verification.purpose !== purpose) {
      logger8.warning("verification_purpose_mismatch", {
        email: email2,
        expected: purpose,
        actual: verification.purpose
      });
      return err9("Invalid verification code");
    }
    if (verification.attempts >= authConfig.verification.maxAttempts) {
      await kv.delete(kvKey);
      logger8.warning("verification_max_attempts", { email: email2, purpose });
      return err9("Maximum verification attempts reached");
    }
    if (Date.now() > verification.expireAt) {
      await kv.delete(kvKey);
      logger8.warning("verification_expired", { email: email2, purpose });
      return err9("Verification code has expired");
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
      logger8.warning("verification_code_invalid", { email: email2, purpose, attempts: verification.attempts + 1 });
      return err9("Invalid verification code");
    }
    await kv.delete(kvKey);
    logger8.info("verification_code_verified", { email: email2, purpose });
    return ok8(verification);
  } catch (error) {
    logger8.error("verification_code_verification_failed", {
      email: email2,
      purpose,
      error: error instanceof Error ? error.message : String(error)
    });
    return err9("Failed to verify code", { error });
  }
}

// src/auth/services/verification-service.ts
import { logger as logger13 } from "@ycore/forge/logger";
import { err as err15, flattenError as flattenError3, isError as isError9, ok as ok9 } from "@ycore/forge/result";
import { getBindings as getBindings3 } from "@ycore/forge/services";

// src/email/email-provider.ts
import { err as err14 } from "@ycore/forge/result";

// src/email/providers/local-dev.ts
import { logger as logger9 } from "@ycore/forge/logger";
import { err as err10, tryCatch as tryCatch2 } from "@ycore/forge/result";

class MockEmailProvider {
  async sendEmail(options) {
    const { to, from, template } = options;
    if (!from) {
      return err10("From address is required");
    }
    return tryCatch2(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      logger9.info({
        event: "local_dev_email_sent",
        provider: "local-dev",
        from,
        to,
        subject: template.subject,
        text: template.text
      });
      return;
    }, "Failed to send mock email");
  }
}

// src/email/providers/mailchannels.ts
import { logger as logger10 } from "@ycore/forge/logger";
import { err as err11, tryCatch as tryCatch3 } from "@ycore/forge/result";

class MailChannelsEmailProvider {
  apiUrl = "https://api.mailchannels.net/tx/v1/send";
  async sendEmail(options) {
    const { apiKey, to, from, template } = options;
    if (!from) {
      return err11("From address is required");
    }
    return tryCatch3(async () => {
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
      const response = await fetch(this.apiUrl, {
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
        throw new Error(`MailChannels API error: ${response.status} ${errorText}`);
      }
      logger10.debug({
        event: "email_sent_success",
        provider: "mailchannels",
        to,
        subject: template.subject
      });
      return;
    }, "Failed to send email via MailChannels");
  }
}

// src/email/providers/resend.ts
import { logger as logger11 } from "@ycore/forge/logger";
import { err as err12, tryCatch as tryCatch4 } from "@ycore/forge/result";

class ResendEmailProvider {
  async sendEmail(options) {
    const { apiKey, to, from, template } = options;
    if (!from) {
      return err12("From address is required");
    }
    return tryCatch4(async () => {
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
        const error = await response.text();
        throw new Error(`Resend API error: ${response.status} ${error}`);
      }
      logger11.debug({
        event: "email_sent_success",
        provider: "resend",
        to
      });
      return;
    }, "Failed to send email via Resend");
  }
}

// src/email/providers/test-mock.ts
import { logger as logger12 } from "@ycore/forge/logger";
import { err as err13, tryCatch as tryCatch5 } from "@ycore/forge/result";

class TestMockEmailProvider {
  static sentEmails = [];
  static shouldFail = false;
  static failureReason = "Simulated email failure";
  async sendEmail(options) {
    const { to, from, template } = options;
    if (!from) {
      return err13("From address is required");
    }
    TestMockEmailProvider.sentEmails.push({
      apiKey: options.apiKey,
      to,
      from,
      template: {
        subject: template.subject,
        html: template.html,
        text: template.text
      }
    });
    if (TestMockEmailProvider.shouldFail) {
      return err13(TestMockEmailProvider.failureReason);
    }
    return tryCatch5(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      logger12.debug({
        event: "email_test_mock_sent",
        provider: "test-mock",
        from,
        to,
        subject: template.subject,
        textLength: template.text.length,
        htmlLength: template.html.length
      });
      return;
    }, "Failed to send test mock email");
  }
  static getSentEmails() {
    return [...TestMockEmailProvider.sentEmails];
  }
  static getLastSentEmail() {
    return TestMockEmailProvider.sentEmails.length > 0 ? { ...TestMockEmailProvider.sentEmails[TestMockEmailProvider.sentEmails.length - 1] } : undefined;
  }
  static getEmailCount() {
    return TestMockEmailProvider.sentEmails.length;
  }
  static findEmailByTo(to) {
    return TestMockEmailProvider.sentEmails.find((email2) => email2.to === to);
  }
  static findEmailsBySubject(subject) {
    return TestMockEmailProvider.sentEmails.filter((email2) => email2.template.subject.includes(subject));
  }
  static clearSentEmails() {
    TestMockEmailProvider.sentEmails = [];
  }
  static simulateFailure(reason = "Simulated email failure") {
    TestMockEmailProvider.shouldFail = true;
    TestMockEmailProvider.failureReason = reason;
  }
  static resetToSuccess() {
    TestMockEmailProvider.shouldFail = false;
    TestMockEmailProvider.failureReason = "Simulated email failure";
  }
  static reset() {
    TestMockEmailProvider.clearSentEmails();
    TestMockEmailProvider.resetToSuccess();
  }
  static getFailureState() {
    return {
      shouldFail: TestMockEmailProvider.shouldFail,
      reason: TestMockEmailProvider.failureReason
    };
  }
  static assertEmailSent(to) {
    const email2 = TestMockEmailProvider.findEmailByTo(to);
    if (!email2) {
      throw new Error(`Expected email to be sent to ${to}, but no email was found`);
    }
    return email2;
  }
  static assertEmailCount(expectedCount) {
    const actualCount = TestMockEmailProvider.getEmailCount();
    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} emails to be sent, but ${actualCount} were sent`);
    }
  }
  static assertNoEmailsSent() {
    TestMockEmailProvider.assertEmailCount(0);
  }
}

// src/email/email-provider.ts
var providerRegistry = {
  "local-dev": () => new MockEmailProvider,
  mailchannels: () => new MailChannelsEmailProvider,
  resend: () => new ResendEmailProvider,
  "test-mock": () => new TestMockEmailProvider
};
function createEmailProvider(providerName) {
  if (!isValidProvider(providerName)) {
    return err14(`Unsupported email provider: ${providerName}`);
  }
  try {
    const factory = providerRegistry[providerName];
    return factory();
  } catch (error) {
    return err14(`Failed to create email provider: ${providerName}`, undefined, { cause: error });
  }
}
function isValidProvider(providerName) {
  return providerName in providerRegistry;
}
function getProviderConfig(emailConfig, providerName) {
  return emailConfig.providers.find((provider) => provider.name === providerName);
}

// src/email/templates/auth-totp.ts
var purposeContent = {
  signup: {
    title: "Verify Your Email",
    message: "Thank you for signing up! Please verify your email address to complete your registration.",
    action: "verify your email"
  },
  "passkey-add": {
    title: "Confirm Adding Passkey",
    message: "You are about to add a new passkey to your account. Please verify this action.",
    action: "confirm adding the passkey"
  },
  "passkey-delete": {
    title: "Confirm Passkey Removal",
    message: "You are about to remove a passkey from your account. Please verify this action.",
    action: "confirm removing the passkey"
  },
  "email-change": {
    title: "Verify New Email Address",
    message: "You requested to change your email address. Please verify your new email.",
    action: "verify your new email address"
  },
  "account-delete": {
    title: "Confirm Account Deletion",
    message: "You requested to delete your account. This action cannot be undone. Please confirm.",
    action: "confirm account deletion"
  },
  recovery: {
    title: "Account Recovery",
    message: "You requested account recovery. Use this code to regain access to your account.",
    action: "recover your account"
  }
};
function createTotpTemplate(data) {
  const { code, purpose } = data;
  const content = purposeContent[purpose];
  const subject = content.title;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${content.title}</title>
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #333;
          }
          .header {
            text-align: center;
            padding: 40px 20px 20px;
          }
          .message {
            text-align: center;
            padding: 0 20px 20px;
            color: #666;
          }
          .code {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            margin: 20px;
            color: #495057;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
          }
          ${purpose === "account-delete" ? ".container { background: #fff3cd; padding: 20px; border-radius: 8px; border: 2px solid #ffc107; }" : ""}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="message">
            <p>${content.message}</p>
          </div>

          <div class="code">${code}</div>

          <div class="footer">
            <p>This code will expire in <strong>8 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email${purpose === "account-delete" || purpose === "passkey-delete" ? " and consider securing your account" : ""}.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const text2 = `
${content.title}

${content.message}

Your verification code: ${code}

Use this code to ${content.action}.
This code will expire in 8 minutes.

If you didn't request this code, please ignore this email${purpose === "account-delete" || purpose === "passkey-delete" ? " and consider securing your account" : ""}.
  `.trim();
  return {
    subject,
    html,
    text: text2
  };
}

// src/auth/services/verification-service.ts
async function sendVerificationEmail(options) {
  const { email: email2, purpose, metadata, context, emailConfig } = options;
  try {
    const codeResult = await createVerificationCode(email2, purpose, context, metadata);
    if (isError9(codeResult)) {
      logger13.error("verification_email_code_generation_failed", {
        email: email2,
        purpose,
        error: flattenError3(codeResult)
      });
      return codeResult;
    }
    const code = codeResult;
    const emailContent = createTotpTemplate({ code, purpose });
    const activeProvider = emailConfig.active;
    if (!activeProvider) {
      logger13.error("verification_email_no_provider", { email: email2, purpose });
      return err15("No active email provider configured");
    }
    const providerConfig = getProviderConfig(emailConfig, activeProvider);
    if (!providerConfig) {
      logger13.error("verification_email_provider_config_missing", {
        email: email2,
        purpose,
        provider: activeProvider
      });
      return err15(`Provider configuration not found for: ${activeProvider}`);
    }
    const emailProviderResult = createEmailProvider(activeProvider);
    if (isError9(emailProviderResult)) {
      logger13.error("verification_email_provider_creation_failed", {
        email: email2,
        purpose,
        provider: activeProvider,
        error: flattenError3(emailProviderResult)
      });
      return emailProviderResult;
    }
    const bindings = getBindings3(context);
    const apiKey = providerConfig.apiKey ? bindings[providerConfig.apiKey] : undefined;
    const sendResult = await emailProviderResult.sendEmail({
      apiKey: apiKey || "",
      to: email2,
      from: providerConfig.sendFrom,
      template: {
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      }
    });
    if (isError9(sendResult)) {
      logger13.error("verification_email_send_failed", {
        email: email2,
        purpose,
        error: flattenError3(sendResult)
      });
      return sendResult;
    }
    logger13.info("verification_email_sent", { email: email2, purpose });
    return ok9(undefined);
  } catch (error) {
    logger13.error("verification_email_unexpected_error", {
      email: email2,
      purpose,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return err15("Failed to send verification email", { error });
  }
}

// src/auth/services/auth-verify.ts
var verifyFormSchema = object2({
  email: pipe2(string2(), minLength2(1, "Email is required")),
  code: pipe2(string2(), minLength2(6, "Code must be 6 digits"))
});
async function verifyLoader({ request, context }) {
  const csrfData = context.get(csrfContext3);
  const sessionResult = await getAuthSession(request, context);
  if (isError10(sessionResult)) {
    logger14.warning("verify_loader_no_session");
    return respondError3(err16("Failed to get session"));
  }
  const session = sessionResult;
  if (!session || !session.user) {
    const authConfig = getAuthConfig8(context);
    logger14.warning("verify_loader_no_user");
    throw redirect5(authConfig?.routes.signin || "/auth/signin");
  }
  return respondOk3({
    csrfData,
    email: session.user.email,
    emailVerified: session.user.emailVerified
  });
}
async function verifyAction({ request, context, emailConfig }) {
  const repository = getAuthRepository(context);
  const authConfig = getAuthConfig8(context);
  if (!authConfig) {
    logger14.error("verify_action_no_config");
    return respondError3(err16("Auth configuration not found"));
  }
  const formData = await request.formData();
  const purpose = formData.get("purpose")?.toString() || "signup";
  const sessionResult = await getAuthSession(request, context);
  if (isError10(sessionResult)) {
    logger14.warning("verify_action_no_session");
    return respondError3(err16("Failed to get session"));
  }
  const session = sessionResult;
  if (!session || !session.user) {
    logger14.warning("verify_action_no_user");
    return respondError3(err16("No active session found"));
  }
  const handlers = {
    resend: async () => {
      logger14.info("verify_resend_requested", { email: session.user.email, purpose });
      const sendResult = await sendVerificationEmail({
        email: session.user.email,
        purpose,
        context,
        emailConfig
      });
      if (isError10(sendResult)) {
        logger14.error("verify_resend_email_failed", {
          email: session.user.email,
          purpose,
          error: flattenError4(sendResult)
        });
        return sendResult;
      }
      logger14.info("verify_code_resent", { email: session.user.email, purpose });
      return ok10({ resent: true });
    },
    unverify: async () => {
      logger14.info("verify_unverify_requested", { email: session.user.email });
      const updateResult = await repository.updateEmailVerified(session.user.id, false);
      if (isError10(updateResult)) {
        logger14.error("verify_unverify_failed", {
          userId: session.user.id,
          error: flattenError4(updateResult)
        });
        return updateResult;
      }
      logger14.info("email_unverified", { email: session.user.email });
      return ok10({ unverified: true });
    },
    verify: async (formData2) => {
      const validationResult = await validateFormData3(verifyFormSchema, formData2);
      if (isError10(validationResult)) {
        logger14.warning("verify_validation_failed", {
          error: flattenError4(validationResult)
        });
        return validationResult;
      }
      const { email: email2, code } = validationResult;
      if (session.user.email !== email2) {
        logger14.warning("verify_session_mismatch", {
          sessionEmail: session.user.email,
          requestEmail: email2
        });
        return err16("Session mismatch", { email: "Email does not match session" });
      }
      const verifyResult = await verifyCode(email2, code, purpose, context);
      if (isError10(verifyResult)) {
        logger14.warning("verify_code_invalid", {
          email: email2,
          purpose,
          error: flattenError4(verifyResult)
        });
        return err16(verifyResult.message, { code: verifyResult.message });
      }
      const verification = verifyResult;
      const userResult = await repository.getUserByEmail(email2);
      if (isError10(userResult)) {
        logger14.error("verify_user_not_found", { email: email2 });
        return err16("User not found");
      }
      const user = userResult;
      switch (purpose) {
        case "signup":
        case "email-change": {
          const updateResult = await repository.updateEmailVerified(user.id, true);
          if (isError10(updateResult)) {
            logger14.error("verify_update_failed", { userId: user.id, purpose });
            return err16("Failed to update verification status");
          }
          logger14.info("email_verified", { email: email2, purpose });
          throw redirect5(authConfig.routes.signedin);
        }
        case "passkey-add":
        case "passkey-delete":
        case "account-delete": {
          logger14.info("verification_completed", { email: email2, purpose });
          return ok10({
            verified: true,
            purpose,
            metadata: verification.metadata
          });
        }
        default: {
          logger14.warning("verify_unknown_purpose", { purpose });
          return err16("Unknown verification purpose");
        }
      }
    }
  };
  const result = await handleIntent3(formData, handlers);
  if (isError10(result)) {
    logger14.warning("verify_intent_failed", {
      error: flattenError4(result),
      email: session.user.email
    });
    return respondError3(result);
  }
  return respondOk3(result);
}
// src/auth/services/webauthn-credential.ts
import { decodeBase64url as decodeBase64url5 } from "@oslojs/encoding";
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
    const uint8Array = decodeBase64url5(obj);
    const buffer = new ArrayBuffer(uint8Array.length);
    new Uint8Array(buffer).set(uint8Array);
    return buffer;
  }
  return new ArrayBuffer(0);
}
function convertServerOptionsToWebAuthn(serverOptions, challengeString) {
  const challengeUint8Array = decodeBase64url5(challengeString);
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
  const rawIdUint8Array = decodeBase64url5(credential.rawId);
  const rawIdBuffer = new ArrayBuffer(rawIdUint8Array.length);
  new Uint8Array(rawIdBuffer).set(rawIdUint8Array);
  const attestationUint8Array = decodeBase64url5(credential.response.attestationObject);
  const attestationBuffer = new ArrayBuffer(attestationUint8Array.length);
  new Uint8Array(attestationBuffer).set(attestationUint8Array);
  const clientDataUint8Array = decodeBase64url5(credential.response.clientDataJSON);
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
  verifyLoader,
  verifyCode,
  verifyChallengeUniqueness,
  verifyAction,
  validateWebAuthnRequest,
  validateWebAuthnOrigin,
  validateOrigin,
  validateChallenge,
  unprotectedAuthMiddleware,
  signupLoader,
  signupAction,
  signoutLoader,
  signoutAction,
  signinLoader,
  signinAction,
  sendVerificationEmail,
  resolveRpId,
  resolveOrigins,
  renamePasskey,
  protectedAuthMiddleware,
  profileLoader,
  parseWebAuthnCredential,
  getWebAuthnErrorMessage,
  getUserWithAuthenticators,
  getChallengeFromSession,
  getAuthSession,
  getAuthRepository,
  generateAddPasskeyOptions,
  destroyChallengeSession,
  destroyAuthSession,
  deletePasskey,
  createVerificationCode,
  createChallengeSession,
  createAuthenticatedSession,
  createAuthSuccessResponse,
  createAuthSessionStorage,
  createAuthSession,
  convertWebAuthnCredentialToStorage,
  convertServerOptionsToWebAuthn,
  cleanupChallengeSession,
  authSessionMiddleware,
  arrayBufferFromObject,
  addPasskeyForUser,
  AuthRepository
};

//# debugId=BD3F283F4FBB37B264756E2164756E21
