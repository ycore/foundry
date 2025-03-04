import { Auth } from '@ycore/foundry/auth/server';
import type { ActionFunctionArgs } from '@ycore/foundry/vendor';

export const action = async ({ ...props }: ActionFunctionArgs) => await Auth.signoutAction(props);
