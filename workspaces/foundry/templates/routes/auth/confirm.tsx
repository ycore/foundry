import { Auth } from '@ycore/foundry/auth/server';
import type { LoaderFunctionArgs } from '@ycore/foundry/vendor';

export const loader = async ({ ...props }: LoaderFunctionArgs) => await Auth.confirmLoader(props);
