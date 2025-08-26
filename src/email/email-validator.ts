import * as v from 'valibot';

export const EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email(), v.maxLength(254));

export type ValidEmail = v.InferOutput<typeof EmailSchema>;
