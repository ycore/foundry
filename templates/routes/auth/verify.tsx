import { Verify } from '@ycore/foundry/auth/pages';
import { Auth } from '@ycore/foundry/auth/server';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@ycore/foundry/vendor';

export const loader = async ({ ...props }: LoaderFunctionArgs) => await Auth.verifyLoader(props);
export const action = async ({ ...props }: ActionFunctionArgs) => await Auth.verifyAction(props);
export default Verify;
