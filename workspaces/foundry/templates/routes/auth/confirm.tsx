import { Auth } from '@ycore/foundry/auth/server';
import type { LoaderFunctionArgs } from 'react-router';

export const loader = async ({ ...props }: LoaderFunctionArgs) => await Auth.confirmLoader(props);
