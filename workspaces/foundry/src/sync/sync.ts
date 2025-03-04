import process from 'node:process';

import fs from 'node:fs/promises';

import { go } from '../common';

interface LocalProjectInfo {
  vars?: Record<string, string>;
  kv_namespaces?: KVNamespace[];
  d1_databases?: D1Database[];
}

interface RemoteProjectInfo {
  compatibility_date?: string;
  env_vars?: Record<string, string>;
  kv_namespaces?: KVNamespace[];
  d1_databases?: D1Database[];
}

interface LocalProject {
  name: string;
  env: {
    production?: LocalProjectInfo;
  };
  vars?: Record<string, string>;
  kv_namespaces?: KVNamespace[];
  d1_databases?: D1Database[];
}

interface RemoteProject {
  name?: string;
  preview: RemoteProjectInfo;
  production: RemoteProjectInfo;
}

const CF_ACCOUNT_ID = `${process.env.CLOUDFLARE_ACCOUNT_ID}`;
const CF_API_URL = 'https://api.cloudflare.com/client/v4';
const CF_API_PATHS = {
  headers: {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'X-Auth-Key': `${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  project: `${CF_API_URL}/accounts/${CF_ACCOUNT_ID}/pages/projects`,
  kv_namespace: `${CF_API_URL}/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces`,
  d1_database: `${CF_API_URL}/accounts/${CF_ACCOUNT_ID}/d1/database`,
  secrets: `${CF_API_URL}/accounts/${CF_ACCOUNT_ID}/d1/database`,
};

const cfAPI = {
  project: {
    /*** Fetches project information by name. */
    get: async (projectName: string) => {
      const [response, error] = await go(cfRetrieve.fetch({ method: 'get', headers: CF_API_PATHS.headers }, `${CF_API_PATHS.project}/${projectName}`));
      if (error) throw error;
      if (!response.success) throw new Error(`${response.errors}`);
      return response.result;
    },
  },
  d1Database: {
    /*** Creates a new remote D1 database. */
    post: async (db_name: string) => {
      const [response, error] = await go(cfRetrieve.fetch({ method: 'post', headers: CF_API_PATHS.headers, body: `{ "name": "${db_name}" }` }, `${CF_API_PATHS.d1_database}`));
      if (error) throw error;
      console.info('NEW', db_name, response);
      if (!response.success) throw new Error(`${response.errors}`);
      return response.result;
    },
    /*** Lists all remote D1 databases. */
    list: async () => {
      const [response, error] = await go(cfRetrieve.fetch({ method: 'get', headers: CF_API_PATHS.headers }, `${CF_API_PATHS.d1_database}`));
      if (error) throw error;
      if (!response.success) throw new Error(`${response.errors}`);
      return response.result;
    },
  },
  kvNamespace: {
    /*** Creates a new remote KV namespace. */
    post: async (kv_name: string) => {
      const [response, error] = await go(cfRetrieve.fetch({ method: 'post', headers: CF_API_PATHS.headers, body: `{ "title": "${kv_name}" }` }, `${CF_API_PATHS.kv_namespace}`));
      if (error) throw error;
      console.info('NEW', kv_name, response);
      if (!response.success) throw new Error(`${response.errors}`);
      return response.result;
    },
    /*** Lists all remote KV namespaces. */
    list: async () => {
      const [response, error] = await go(cfRetrieve.fetch({ method: 'get', headers: CF_API_PATHS.headers }, `${CF_API_PATHS.kv_namespace}`));
      if (error) throw error;
      if (!response.success) throw new Error(`${response.errors}`);
      return response.result;
    },
  },
};

export const cfRetrieve = {
  /*** Cloudflare fetch wrapper. */
  fetch: async (headers: RequestInit | undefined, url: string | URL): Promise<any> => {
    const [response, fetchError] = await go(fetch(url, headers));
    if (fetchError) throw fetchError;

    const [data, jsonError] = await go(response.json());
    if (jsonError) throw jsonError;

    return data;
  },
  /*** Retrieves remote project production and preview information. */
  remote: async (projectName: string) => {
    const [projectInfo, error] = await go(cfAPI.project.get(projectName));
    if (error) throw error;

    const remoteProject: RemoteProject = { preview: {}, production: {} };
    remoteProject.name = projectInfo.name;
    remoteProject.production.compatibility_date = projectInfo.deployment_configs.production.compatibility_date;
    remoteProject.production.env_vars = projectInfo.deployment_configs.production.env_vars;
    remoteProject.production.kv_namespaces = projectInfo.deployment_configs.production.kv_namespaces;
    remoteProject.production.d1_databases = projectInfo.deployment_configs.production.d1_databases;
    remoteProject.preview.compatibility_date = projectInfo.deployment_configs.preview.compatibility_date;
    remoteProject.preview.env_vars = projectInfo.deployment_configs.preview.env_vars;
    remoteProject.preview.kv_namespaces = projectInfo.deployment_configs.preview.kv_namespaces;
    remoteProject.preview.d1_databases = projectInfo.deployment_configs.preview.d1_databases;

    return remoteProject;
  },
  /*** Retrieves local wrangler project default and production information. */
  wrangler: async (wranglerPath: string): Promise<LocalProject> => {
    const [project, error] = await go(import(wranglerPath));
    if (error) throw error;

    if (!project.default.env.production) project.default.env.production = {};
    if (project.default.vars) project.default.env.production.vars = project.default.vars;
    if (project.default.kv_namespaces) project.default.env.production.kv_namespaces = project.default.kv_namespaces;
    if (project.default.d1_databases) project.default.env.production.d1_databases = project.default.d1_databases;

    return project.default;
  },
  /*** Writes project configuration back to the local wrangler file. */
  write: async (projectPath: string, localProject: LocalProject): Promise<void> => {
    try {
      if (localProject.env.production?.vars) localProject.vars = localProject.env.production.vars;
      if (localProject.env.production?.kv_namespaces) localProject.kv_namespaces = localProject.env.production.kv_namespaces;
      if (localProject.env.production?.d1_databases) localProject.d1_databases = localProject.env.production.d1_databases;

      delete localProject.env.production;

      await fs.writeFile(projectPath, JSON.stringify(localProject, null, 2));
      // await fs.writeFile(projectPath.replace('.json', '.toml'), stringifyTOML(localProject));
      console.info(`Updated ${projectPath} successfully.`);
    } catch (writeError) {
      console.error(`Error writing to ${projectPath}:`, writeError);
    }
  },
};

export const cfSyncToRemote = {
  /*** Synchronizes environment variables between local and remote projects. */
  envVars: async (environments: string[], localProject: LocalProject, remoteProject: RemoteProject): Promise<any[]> => {
    const lineData = [['Environment Vars', 'Variable', 'Type', 'Local Value', 'Remote Value']];
    environments.forEach(environment => {
      const envVars = remoteProject[environment]?.env_vars;
      if (envVars) {
        for (const key in envVars) {
          lineData.push([environment, key, envVars[key].type, truncateString(localProject[environment]?.vars[key]), truncateString(envVars[key].value)]);
        }
      }
    });
    return lineData;
  },
  /**
   * Synchronizes KV namespaces between local and remote projects.
   * - loop thru all local KV Namespaces
   * - find a remote KV Namespace by id, or by name using projectname as prefix
   * - if not found create a new remote KV Namespace, and update the local id from the remote id
   */
  kvNamespaces: async (prefix: string, environments: string[], localProject: LocalProject): Promise<any[]> => {
    const lineData = [['KV Namespaces', 'Binding', 'Name', 'Status', 'Local ID', 'Remote ID']];

    for (const environment of environments) {
      const kvNamespacePromises = localProject[environment].kv_namespaces.map(async localItem => {
        const kv_name = `${prefix}_${localItem.binding}`;
        let remoteItemId = '';
        let status = '';

        const [kvNamespaceList, kvNamespacesError] = await go(cfAPI.kvNamespace.list());
        if (kvNamespacesError) throw kvNamespacesError;

        let kv_namespace = kvNamespaceList?.find((namespace: { id }) => namespace.id === localItem.id);
        if (!kv_namespace) kv_namespace = kvNamespaceList?.find((namespace: { title }) => namespace.title === kv_name);

        if (kv_namespace?.id) {
          localItem.id = kv_namespace.id;
          remoteItemId = kv_namespace.id;
          status = 'Exists on remote';
        } else {
          const [kvCreateInfo, kvCreateError] = await go(cfAPI.kvNamespace.post(kv_name));
          if (kvCreateError) throw kvCreateError;

          if (kvCreateInfo && kvCreateInfo.id) {
            localItem.id = kvCreateInfo.id;
            remoteItemId = kv_namespace.id;
            status = 'Created on remote';
          }
        }

        lineData.push([environment, localItem.binding, kv_name, status, localItem.id, remoteItemId]);
      });

      await Promise.all(kvNamespacePromises);
    }

    return lineData;
  },
  /**
   * Synchronizes D1 databases between local and remote projects.
   * - loop thru all local D1 databases
   * - find a remote D1 database by id, or by name using projectname as prefix
   * - if not found create a new remote D1 database, and update the local id from the remote id
   */
  d1Databases: async (prefix: string, environments: string[], localProject: LocalProject): Promise<any[]> => {
    const lineData = [['D1 Databases', 'Binding', 'Name', 'Status', 'Local ID', 'Remote ID']];

    for (const environment of environments) {
      const d1DatabasePromises = localProject[environment].d1_databases.map(async localItem => {
        const db_name = `${prefix}_${localItem.binding}`;
        let remoteItemId = '';
        let status = '';

        const [d1DatabaseList, d1DatabaseError] = await go(cfAPI.d1Database.list());
        if (d1DatabaseError) throw d1DatabaseError;

        let d1_database = d1DatabaseList?.find((database: { uuid }) => database.uuid === localItem.id);
        if (!d1_database) d1_database = d1DatabaseList?.find((database: { name }) => database.name === db_name);

        if (d1_database?.uuid) {
          localItem.database_id = d1_database.uuid;
          remoteItemId = d1_database.uuid;
          status = 'Exists on remote';
        } else {
          const [kvCreateInfo, kvCreateError] = await go(cfAPI.d1Database.post(db_name));
          if (kvCreateError) throw kvCreateError;

          if (kvCreateInfo && kvCreateInfo.uuid) {
            localItem.database_id = kvCreateInfo.uuid;
            remoteItemId = kvCreateInfo.uuid;
            status = 'Created on remote';
          }
        }

        lineData.push([environment, localItem.binding, db_name, status, localItem.database_id, remoteItemId]);
      });

      await Promise.all(d1DatabasePromises);
    }

    return lineData;
  },
};

const truncateString = (str: string, num = 40) => (str && str.length > num ? str.slice(0, num) + '...' : str);
