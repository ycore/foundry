import * as v from 'valibot';

export function safeParseForm<TSchema extends v.BaseSchema<any, any, any>>(schema: TSchema, formData: FormData, fields: string[]) {
  const formValues = fields.reduce(
    (acc, field) => {
      acc[field] = formData.get(field);
      return acc;
    },
    {} as Record<string, FormDataEntryValue | null>
  );

  const parsed = v.safeParse(schema, formValues);
  if (!parsed.success) {
    const issues = v.flatten<typeof schema>(parsed.issues);
    return { success: parsed.success, data: null, errors: issues.nested };
  }

  return { success: parsed.success, data: parsed.output, errors: null };
}

export function safeParse<TSchema extends v.BaseSchema<any, any, any>>(schema: TSchema, values: any) {
  const parsed = v.safeParse(schema, values);
  if (!parsed.success) {
    const issues = v.flatten<typeof schema>(parsed.issues);
    return { success: parsed.success, data: null, errors: issues.nested };
  }

  return { success: parsed.success, data: parsed.output, errors: null };
}
