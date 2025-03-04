import { Signup } from '@ycore/foundry/auth/pages';
import { Auth } from '@ycore/foundry/auth/server';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@ycore/foundry/vendor';

export const loader = async ({ ...props }: LoaderFunctionArgs) => await Auth.signupLoader(props);
export const action = async ({ ...props }: ActionFunctionArgs) => await Auth.signupAction(props);
export default Signup;
