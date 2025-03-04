import * as v from 'valibot';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const safeParse = <TSchema extends v.BaseSchema<any, any, any>>(formData: FormData, schema: TSchema, fields: string[]) => {
  const formValues = fields.reduce(
    (acc, field) => {
      acc[field] = formData.get(field);
      return acc;
    },
    {} as Record<string, FormDataEntryValue | null>,
  );

  const parsed = v.safeParse(schema, formValues);
  if (!parsed.success) {
    const issues = v.flatten<typeof schema>(parsed.issues);
    return { success: parsed.success, data: null, errors: issues.nested };
  }

  return { success: parsed.success, data: parsed.output, errors: null };
};
