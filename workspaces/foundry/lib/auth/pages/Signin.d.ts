import type { action, loader } from '~/routes/auth/signin';
export default function Route({ actionData, loaderData }: {
    actionData: Awaited<ReturnType<typeof action>>;
    loaderData: Awaited<ReturnType<typeof loader>>;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Signin.d.ts.map