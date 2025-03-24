import * as v from 'valibot';
export function safeParseForm(schema, formData, fields) {
    const formValues = fields.reduce((acc, field) => {
        acc[field] = formData.get(field);
        return acc;
    }, {});
    const parsed = v.safeParse(schema, formValues);
    if (!parsed.success) {
        const issues = v.flatten(parsed.issues);
        return { success: parsed.success, data: null, errors: issues.nested };
    }
    return { success: parsed.success, data: parsed.output, errors: null };
}
export function safeParse(schema, values) {
    const parsed = v.safeParse(schema, values);
    if (!parsed.success) {
        const issues = v.flatten(parsed.issues);
        return { success: parsed.success, data: null, errors: issues.nested };
    }
    return { success: parsed.success, data: parsed.output, errors: null };
}
//# sourceMappingURL=validate.js.map