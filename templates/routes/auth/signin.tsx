import { Signin } from '@ycore/foundry/auth/pages';
import { Auth } from '@ycore/foundry/auth/server';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@ycore/foundry/vendor';

export const loader = async ({ ...props }: LoaderFunctionArgs) => await Auth.signinLoader(props);
export const action = async ({ ...props }: ActionFunctionArgs) => await Auth.signinAction(props);
export default Signin;
