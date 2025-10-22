import { Button, Card, Input, Link } from '@ycore/componentry/vibrant';
import { formErrors, isError } from '@ycore/forge/result';
import { FormError, FormField, SecureForm, SecureProvider } from '@ycore/foundry/secure';
import { useActionData, useLoaderData, useNavigation } from 'react-router';
import type { RecoverFormProps, RecoverPageProps } from '../@types/auth.component.types';

export function RecoverForm({ signinUrl }: RecoverFormProps) {
  const navigation = useNavigation();
  const actionData = useActionData<any>();
  const isSubmitting = navigation.state === 'submitting';
  const errors = isError(actionData) ? formErrors(actionData) : {};

  return (
    <SecureForm method="post" className="flex flex-col gap-6">
      <input type="hidden" name="intent" value="recover" />

      <FormField label="Email" error={errors.email}>
        <Input name="email" type="email" placeholder="Enter your email" autoComplete="email" required autoFocus />
      </FormField>

      {errors.form && <FormError error={errors.form} />}

      <div className="flex justify-between gap-x-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Sending Recovery Code...' : 'Send Recovery Code'}
        </Button>

        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
          <Link href={signinUrl}>Sign In</Link>
        </Button>
      </div>
    </SecureForm>
  );
}

export function RecoverPage({ children, title = 'Account Recovery', description = 'Lost access to your passkeys? Enter your registered email to recover access.' }: RecoverPageProps) {
  const loaderData = useLoaderData<any>();
  const token = isError(loaderData) ? '' : (loaderData?.token ?? '');

  return (
    <SecureProvider token={token}>
      <div className="mx-auto min-w-md max-w-lg px-4 py-8">
        <Card>
          <Card.Header>
            <Card.Title>{title}</Card.Title>
            <Card.Description>{description}</Card.Description>
          </Card.Header>
          <Card.Content>{children}</Card.Content>
        </Card>
      </div>
    </SecureProvider>
  );
}
