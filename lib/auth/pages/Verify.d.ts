import type { loader } from '~/routes/auth/verify';
export default function Route({ loaderData }: {
    loaderData: Awaited<ReturnType<typeof loader>>;
}): import("react/jsx-runtime").JSX.Element;
