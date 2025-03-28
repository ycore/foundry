import { jsx as _jsx } from "react/jsx-runtime";
export function MultiActionInput({ name = 'intent', value = 'default' }) {
    return _jsx("input", { type: "hidden", value: value, name: name });
}
