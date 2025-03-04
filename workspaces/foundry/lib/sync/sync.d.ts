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
export declare const cfRetrieve: {
    /*** Cloudflare fetch wrapper. */
    fetch: (headers: RequestInit | undefined, url: string | URL) => Promise<any>;
    /*** Retrieves remote project production and preview information. */
    remote: (projectName: string) => Promise<RemoteProject>;
    /*** Retrieves local wrangler project default and production information. */
    wrangler: (wranglerPath: string) => Promise<LocalProject>;
    /*** Writes project configuration back to the local wrangler file. */
    write: (projectPath: string, localProject: LocalProject) => Promise<void>;
};
export declare const cfSyncToRemote: {
    /*** Synchronizes environment variables between local and remote projects. */
    envVars: (environments: string[], localProject: LocalProject, remoteProject: RemoteProject) => Promise<any[]>;
    /**
     * Synchronizes KV namespaces between local and remote projects.
     * - loop thru all local KV Namespaces
     * - find a remote KV Namespace by id, or by name using projectname as prefix
     * - if not found create a new remote KV Namespace, and update the local id from the remote id
     */
    kvNamespaces: (prefix: string, environments: string[], localProject: LocalProject) => Promise<any[]>;
    /**
     * Synchronizes D1 databases between local and remote projects.
     * - loop thru all local D1 databases
     * - find a remote D1 database by id, or by name using projectname as prefix
     * - if not found create a new remote D1 database, and update the local id from the remote id
     */
    d1Databases: (prefix: string, environments: string[], localProject: LocalProject) => Promise<any[]>;
};
export {};
//# sourceMappingURL=sync.d.ts.map