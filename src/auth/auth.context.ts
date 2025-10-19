import { createContext } from 'react-router';

import type { AuthConfig } from './@types/auth.config.types';
import type { User } from './schema';

export const authConfigContext = createContext<AuthConfig | null>(null);

export const authUserContext = createContext<User | null>(null);
