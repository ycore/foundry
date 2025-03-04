import * as v from 'valibot';
export declare const CredentialSchema: v.ObjectSchema<{
    readonly email: v.SchemaWithPipe<[v.StringSchema<string>, v.NonEmptyAction<string, string>, v.EmailAction<string, string>, v.TrimAction, v.ToLowerCaseAction]>;
    readonly password: v.SchemaWithPipe<[v.StringSchema<string>, v.NonEmptyAction<string, string>, v.MinLengthAction<string, number, `The password must have ${number} characters or more.`>, v.TrimAction]>;
}, undefined>;
export type Credentials = v.InferOutput<typeof CredentialSchema>;
export declare const VerificationSchema: v.ObjectSchema<{
    readonly email: v.SchemaWithPipe<[v.StringSchema<string>, v.NonEmptyAction<string, string>, v.EmailAction<string, string>, v.TrimAction, v.ToLowerCaseAction]>;
    readonly code: v.SchemaWithPipe<[v.StringSchema<undefined>, v.RegexAction<string, "OTP code format is invalid">]>;
}, undefined>;
export type Verification = v.InferOutput<typeof VerificationSchema>;
//# sourceMappingURL=valid-auth.d.ts.map