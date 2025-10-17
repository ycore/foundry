import { Button, Input, InputOtp } from '@ycore/componentry/vibrant';
import { formErrors, isError } from '@ycore/forge/result';
import { SecureForm } from '@ycore/foundry/secure';
import { useEffect, useState } from 'react';
import type { VerificationPurpose } from '../services/totp-service';

export interface VerifyFormProps {
  email: string;
  purpose?: VerificationPurpose;
  resendCooldown?: number;
  period?: number;
  digits?: number;
  actionData?: unknown;
}

export function VerifyForm({ email, purpose = 'signup', resendCooldown: initialCooldown = 60, period = 480, digits = 6, actionData }: VerifyFormProps) {
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const errors = actionData && isError(actionData) ? formErrors(actionData) : {};

  // Auto-start cooldown when form loads (page just loaded after resend)
  useEffect(() => {
    // Check if we just did a resend (actionData exists, not an error, and has resent flag)
    if (actionData && !isError(actionData) && typeof actionData === 'object' && 'resent' in actionData && actionData.resent) {
      setResendCooldown(initialCooldown);
    }
  }, [actionData, initialCooldown]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const purposeLabels: Record<VerificationPurpose, string> = {
    signup: 'Email Verification',
    'passkey-add': 'Confirm Adding Passkey',
    'passkey-delete': 'Confirm Removing Passkey',
    'email-change': 'Verify New Email',
    'account-delete': 'Confirm Removing Account',
    recovery: 'Recover Account',
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-3xl tracking-tight">{purposeLabels[purpose]}</h1>
        <p className="text-muted-foreground">
          Please enter the {digits}-digit verification code sent to <strong className="text-nowrap">{email}</strong>
        </p>
      </div>

      <SecureForm method="post" className="space-y-4" errors={errors}>
        <Input type="hidden" name="email" value={email} />
        <Input type="hidden" name="purpose" value={purpose} />

        <SecureForm.Field label="Verification Code" name="code" error={errors.code} className="flex flex-col items-center">
          <InputOtp value={code} onValueChange={setCode} autoComplete="one-time-code" validationType="numeric" disabled={false}>
            <InputOtp.Group>
              {Array.from({ length: digits }).map((_, index) => (
                <InputOtp.Slot key={index} index={index} />
              ))}
            </InputOtp.Group>
            <InputOtp.HiddenInput name="code" />
          </InputOtp>
        </SecureForm.Field>

        <div className="space-y-3">
          <div className="flex justify-around">
            <Button type="submit" name="intent" value="verify" disabled={code.length !== digits}>
              Verify Code
            </Button>

            <Button type="submit" name="intent" value="resend" variant="outline" disabled={resendCooldown > 0} formNoValidate>
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
            </Button>
          </div>
          <div className="flex justify-center">
            <Button type="submit" name="intent" value="unverify" variant="destructive" formNoValidate>
              Unverify Email
            </Button>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-sm">The code expires within {Math.floor(period / 60)} minutes</p>
      </SecureForm>
    </div>
  );
}
