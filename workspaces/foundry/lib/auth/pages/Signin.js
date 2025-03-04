import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Fieldset, Input, Link } from '@ycore/componentry/catalyst';
import { Spinner } from '@ycore/componentry/core';
import { AuthenticityTokenInput, HoneypotInputs } from '@ycore/foundry/form';
import { Form, useNavigation } from 'react-router';
export default function Route({ actionData, loaderData }) {
    const { authConfig } = loaderData;
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    return (_jsxs(Form, { method: "POST", className: "mx-auto mt-2 flex w-1/3 flex-col gap-y-4", children: [_jsx(AuthenticityTokenInput, {}), _jsx(HoneypotInputs, {}), _jsxs(Fieldset, { children: [_jsxs(Fieldset.Field, { children: [_jsx(Fieldset.Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { type: "email", name: "email", id: "email", defaultValue: authConfig?.DEV_SIGNIN.username, disabled: isSubmitting }), _jsx(Fieldset.ErrorMessage, { children: actionData?.errors?.email })] }), _jsxs(Fieldset.Field, { children: [_jsx(Fieldset.Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { type: "password", name: "password", id: "password", defaultValue: authConfig?.DEV_SIGNIN.password, disabled: isSubmitting }), _jsx(Fieldset.ErrorMessage, { children: actionData?.errors?.password })] })] }), _jsxs("div", { className: "flex flex-row justify-between", children: [_jsxs(Button, { type: "submit", disabled: isSubmitting, children: [_jsx("span", { className: "pl-5", children: "Sign in" }), _jsx(Spinner, { className: isSubmitting ? 'visible' : 'invisible' })] }), _jsx(Link, { href: authConfig.routes.auth.signup, children: "Sign up" }), _jsx(Link, { href: authConfig.routes.auth.forgot, children: "Forgot Password" })] })] }));
}
//# sourceMappingURL=Signin.js.map