import type { RouterContextProvider } from 'react-router';
import { authUserContext } from '../auth.context';

export interface ProfileLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export async function profileLoader({ context }: ProfileLoaderArgs) {
  // User is guaranteed to be authenticated due to middleware
  const user = context.get(authUserContext);

  return { user };
}
