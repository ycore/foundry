import { Button, Fieldset, Input, Link } from '@ycore/componentry/catalyst';
import { Spinner } from '@ycore/componentry/core';
import { AuthenticityTokenInput, HoneypotInputs } from '@ycore/foundry/form';
import { Form, useNavigation } from 'react-router';
import type { loader } from '~/routes/auth/forgot';

export default function Route({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
  const { authConfig } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="POST" className="mx-auto mt-2 flex w-1/3 flex-col gap-y-4">
      <AuthenticityTokenInput />
      <HoneypotInputs />
      <Fieldset>
        <Fieldset.Field>
          <Fieldset.Label htmlFor="email">Email</Fieldset.Label>
          <Input type="email" name="email" id="email" defaultValue={authConfig?.DEV_SIGNIN.username} disabled={isSubmitting} />
        </Fieldset.Field>
        <Fieldset.Field>
          <Fieldset.Label htmlFor="password">Password</Fieldset.Label>
          <Input type="password" name="password" id="password" defaultValue={authConfig?.DEV_SIGNIN.password} disabled={isSubmitting} />
        </Fieldset.Field>
      </Fieldset>
      <div className="flex flex-row justify-between">
        <Button type="submit" disabled={isSubmitting}>
          <span className="pl-5">Reset password</span>
          <Spinner className={isSubmitting ? 'visible' : 'invisible'} />
        </Button>
        <Link href={authConfig.routes.auth.signin}>Sign in</Link>
      </div>
    </Form>
  );
}
