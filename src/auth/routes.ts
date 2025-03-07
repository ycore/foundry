import { type RouteConfig, route } from '@react-router/dev/routes';

import authConfig from './config/config.auth.js';
export const authRoutes = [
  route(`${authConfig.routes.auth.confirm}/:token`, 'routes/auth/confirm.tsx'),
  route(`${authConfig.routes.auth.delete}`, 'routes/auth/delete.tsx'),
  route(`${authConfig.routes.auth.forgot}`, 'routes/auth/forgot.tsx'),
  route(`${authConfig.routes.auth.signin}`, 'routes/auth/signin.tsx'),
  route(`${authConfig.routes.auth.signout}`, 'routes/auth/signout.tsx'),
  route(`${authConfig.routes.auth.signup}`, 'routes/auth/signup.tsx'),
  route(`${authConfig.routes.auth.verify}/:token`, 'routes/auth/verify.tsx'),
] satisfies RouteConfig;
