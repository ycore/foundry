import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Fieldset, Input } from '@ycore/componentry/catalyst';
import { Spinner } from '@ycore/componentry/core';
import { VerifyActionInput } from '@ycore/foundry/auth/components';
import { AuthenticityTokenInput, HoneypotInputs } from '@ycore/foundry/form';
import { Form, useNavigation } from 'react-router';
export default function Route({ loaderData }) {
    const { action, code, email } = loaderData;
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    return (_jsxs("div", { className: "mx-auto flex items-end justify-center", children: [_jsxs(Form, { method: "POST", className: "mt-2 min-w-72 flex-col gap-y-4", children: [_jsx(AuthenticityTokenInput, {}), _jsx(HoneypotInputs, {}), _jsxs(Fieldset, { children: [_jsxs(Fieldset.Field, { children: [_jsx(Fieldset.Label, { htmlFor: "code", children: "Code" }), _jsx(Input, { type: "text", name: "code", id: "code", defaultValue: code, disabled: isSubmitting })] }), _jsxs(Fieldset.Field, { children: [_jsx(Fieldset.Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { type: "email", name: "email", id: "email", defaultValue: email, disabled: isSubmitting })] })] }), _jsxs("div", { className: "mt-8 flex flex-row justify-between", children: [_jsx(VerifyActionInput, { value: action }), _jsxs(Button, { type: "submit", disabled: isSubmitting, children: [_jsx("span", { className: "pl-5", children: "Verify" }), _jsx(Spinner, { className: isSubmitting ? 'visible' : 'invisible' })] })] })] }), _jsxs(Form, { method: "POST", className: "mt-4", children: [_jsx(AuthenticityTokenInput, {}), _jsx(HoneypotInputs, {}), _jsx(VerifyActionInput, { value: "resend" }), _jsxs(Button, { type: "submit", disabled: isSubmitting, children: [_jsx("span", { className: "pl-5", children: "Resend" }), _jsx(Spinner, { className: isSubmitting ? 'visible' : 'invisible' })] })] })] }));
}
