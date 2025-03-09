import { Button, DescriptionList, Link } from '@ycore/componentry/catalyst';
import React from 'react';
import { Form } from 'react-router';
import { AuthenticityTokenInput, HoneypotInputs } from '../../form/vendor.js';
import { VerifyActionInput } from '../components/VerifyActionInput.js';
import { createVerifyUrl } from '../utils/auth-utils.js';
export function AuthUser({ user, authConfig }) {
    const action = createVerifyUrl(authConfig.routes.auth.verify, '', user?.email);
    return (<>
      {user ? (<div className="flex flex-col gap-4">
          <DescriptionList className="min-w-96 gap-4 rounded-3xl border border-gray-200 px-6 py-2 dark:border-gray-700">
            <DescriptionList.Term>User email:</DescriptionList.Term>
            <DescriptionList.Details className="text-nowrap">{user.email}</DescriptionList.Details>
            <DescriptionList.Term>Verified:</DescriptionList.Term>
            <DescriptionList.Details>
              {user.emailVerified ? ('🟢') : (<Form method="POST" action={action}>
                  <AuthenticityTokenInput />
                  <HoneypotInputs />
                  <VerifyActionInput value="resend"/>
                  <Button type="submit" className="w-full">
                    Verify
                  </Button>
                </Form>)}
            </DescriptionList.Details>
          </DescriptionList>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4">
              <Link href={authConfig.routes.auth.forgot}>Change Password</Link>
              <Form method="POST" action={authConfig.routes.auth.delete}>
                <Button type="submit" className="w-full">
                  Remove account
                </Button>
              </Form>
            </div>
            <Form method="POST" action={authConfig.routes.auth.signout}>
              <Button type="submit" className="w-full">
                Sign out
              </Button>
            </Form>
          </div>
        </div>) : (<div className="flex min-w-72 items-center justify-between gap-4 rounded-xl border border-gray-200 px-8 py-4 dark:border-gray-700">
          <Button href={authConfig.routes.auth.signin}>Sign In</Button>
          <Link href={authConfig.routes.auth.signup}>Sign Up</Link>
        </div>)}
    </>);
}
//# sourceMappingURL=AuthUser.jsx.map