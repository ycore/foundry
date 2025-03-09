import { Button, Fieldset, Input } from '@ycore/componentry/catalyst';
import { Spinner } from '@ycore/componentry/core';
import { VerifyActionInput } from '@ycore/foundry/auth/components';
import { AuthenticityTokenInput, HoneypotInputs } from '@ycore/foundry/form';
import React from 'react';
import { Form, useNavigation } from 'react-router';
export default function Route({ loaderData }) {
    const { action, code, email } = loaderData;
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    return (<div className="mx-auto flex items-end justify-center">
      <Form method="POST" className="mt-2 min-w-72 flex-col gap-y-4">
        <AuthenticityTokenInput />
        <HoneypotInputs />
        <Fieldset>
          <Fieldset.Field>
            <Fieldset.Label htmlFor="code">Code</Fieldset.Label>
            <Input type="text" name="code" id="code" defaultValue={code} disabled={isSubmitting}/>
          </Fieldset.Field>
          <Fieldset.Field>
            <Fieldset.Label htmlFor="email">Email</Fieldset.Label>
            <Input type="email" name="email" id="email" defaultValue={email} disabled={isSubmitting}/>
          </Fieldset.Field>
        </Fieldset>
        <div className="mt-8 flex flex-row justify-between">
          <VerifyActionInput value={action}/>
          <Button type="submit" disabled={isSubmitting}>
            <span className="pl-5">Verify</span>
            <Spinner className={isSubmitting ? 'visible' : 'invisible'}/>
          </Button>
        </div>
      </Form>
      <Form method="POST" className="mt-4">
        <AuthenticityTokenInput />
        <HoneypotInputs />
        <VerifyActionInput value="resend"/>
        <Button type="submit" disabled={isSubmitting}>
          <span className="pl-5">Resend</span>
          <Spinner className={isSubmitting ? 'visible' : 'invisible'}/>
        </Button>
      </Form>
    </div>);
}
//# sourceMappingURL=Verify.jsx.map