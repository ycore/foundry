import { Auth } from '@ycore/foundry/auth/server';
import type { ActionFunctionArgs } from 'react-router';

export const action = async ({ ...props }: ActionFunctionArgs) => await Auth.destroyUserAction(props);
