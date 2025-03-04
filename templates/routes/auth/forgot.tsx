import { Forgot } from '@ycore/foundry/auth/pages';
import { Auth } from '@ycore/foundry/auth/server';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@ycore/foundry/vendor';

export const loader = async ({ ...props }: LoaderFunctionArgs) => await Auth.forgotLoader(props);
export const action = async ({ ...props }: ActionFunctionArgs) => await Auth.forgotAction(props);
export default Forgot;
