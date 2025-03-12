import * as v from 'valibot';
export declare function safeParseForm<TSchema extends v.BaseSchema<any, any, any>>(schema: TSchema, formData: FormData, fields: string[]): {
    success: false;
    data: null;
    errors: (Readonly<Partial<Record<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> | v.BaseSchemaAsync<unknown, unknown, v.BaseIssue<unknown>> ? v.IssueDotPath<TSchema> : string, [string, ...string[]]>>> extends infer T ? { [TKey in keyof T]: Readonly<Partial<Record<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> | v.BaseSchemaAsync<unknown, unknown, v.BaseIssue<unknown>> ? v.IssueDotPath<TSchema> : string, [string, ...string[]]>>>[TKey]; } : never) | undefined;
} | {
    success: true;
    data: v.InferOutput<TSchema>;
    errors: null;
};
export declare function safeParse<TSchema extends v.BaseSchema<any, any, any>>(schema: TSchema, values: any): {
    success: false;
    data: null;
    errors: (Readonly<Partial<Record<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> | v.BaseSchemaAsync<unknown, unknown, v.BaseIssue<unknown>> ? v.IssueDotPath<TSchema> : string, [string, ...string[]]>>> extends infer T ? { [TKey in keyof T]: Readonly<Partial<Record<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> | v.BaseSchemaAsync<unknown, unknown, v.BaseIssue<unknown>> ? v.IssueDotPath<TSchema> : string, [string, ...string[]]>>>[TKey]; } : never) | undefined;
} | {
    success: true;
    data: v.InferOutput<TSchema>;
    errors: null;
};
//# sourceMappingURL=validate.d.ts.map