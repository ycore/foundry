// npx tsx ./utils/cf-sync.ts
import path from 'node:path';
import { table } from 'table';
import { go } from '../common';
import { cfRetrieve, cfSyncToRemote } from './sync';
// Catching termination signals (Ctrl+C or other term signals)
process.on('SIGINT', () => {
  console.info('Received SIGINT, exiting...');
  process.exit(0);
});
const syncRemote = async projectPath => {
  console.log('*** syncRemote');
  /*** Retrieve local wrangler configuration. */
  const localProject = await cfRetrieve.wrangler(projectPath);
  if (!localProject?.name) throw `${projectPath} is not a valid local wrangler config file.`;
  console.log('*** ', localProject);
  /*** Retrieve remote cloudflare configuration. */
  const [remoteProject, remoteError] = await go(cfRetrieve.remote(localProject.name));
  if (remoteError || !remoteProject?.name) {
    console.error(`Create a new project for '${localProject.name}' at dash.cloudflare.com`);
    return false;
  }
  // make valid project name
  const prefix = localProject.name.replace(/[^\w]/g, '_').toUpperCase();
  const environments = ['production', 'preview'];
  // inspect envVars
  const evRows = await cfSyncToRemote.envVars(environments, localProject.env, remoteProject);
  console.info('*** Environment variable listing only. Environment Variables will push to remote on next deploy');
  console.info(table(evRows));
  // inspect or create kvNamespaces
  const kvRows = await cfSyncToRemote.kvNamespaces(prefix, environments, localProject.env);
  console.info('*** Any missing KV Namespaces are created on remote. Bindings will push to remote on next deploy');
  console.info(table(kvRows));
  // inspect or create d1Databases
  const dbRows = await cfSyncToRemote.d1Databases(prefix, environments, localProject.env);
  console.info('*** Any missing D1 Databases are created on remote. Bindings will push to remote on next deploy');
  console.info(table(dbRows));
  // update local config
  await cfRetrieve.write(projectPath, localProject);
};
await syncRemote(path.resolve('./wrangler.jsonc'));
//# sourceMappingURL=cf-sync.js.map
