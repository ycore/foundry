import { DateFormat } from '@ycore/componentry/impetus/intl';
import { Badge, Button, Card, Label, Separator } from '@ycore/componentry/shadcn-ui';
import { Form } from 'react-router';
import type { AuthenticatorsCardProps, ProfileCardProps, ProfilePageProps } from '../@types/auth.component.types';

export function ProfileCard({ user, signoutUrl }: ProfileCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}</div>
          <div>
            <h3 className="font-semibold text-lg">{user?.displayName || 'Profile'}</h3>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </Card.Title>
      </Card.Header>

      <Card.Content className="space-y-6">
        <div className="grid gap-4">
          {user?.createdAt && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Since</Label>
              <p className="text-sm">
                <DateFormat.Long date={user.createdAt} />
              </p>
            </div>
          )}
        </div>
      </Card.Content>

      <Separator />

      <Card.Footer className="flex justify-between pt-6">
        <div className="flex gap-2">
          <Badge variant="secondary">Verified Account</Badge>
        </div>
        <Form method="post" action={signoutUrl}>
          <Button type="submit" variant="destructive" size="sm">
            Sign Out
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
}

export function AuthenticatorsCard({ authenticators }: AuthenticatorsCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          Authenticators
        </Card.Title>
        <Card.Description>Security keys and devices used to sign in to your account</Card.Description>
      </Card.Header>

      <Card.Content>
        {authenticators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h4 className="mb-2 font-medium text-muted-foreground">No authenticators registered</h4>
            <p className="max-w-sm text-muted-foreground text-sm">Add a security key or biometric device to secure your account</p>
          </div>
        ) : (
          <div className="space-y-3">
            {authenticators.map(auth => (
              <div key={auth.id} className="rounded-lg border p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{auth.name}</h4>
                    <span className="text-muted-foreground text-xs">•</span>
                    <p className="text-muted-foreground text-xs uppercase">{auth.credentialDeviceType}</p>
                    {auth.credentialBackedUp && (
                      <Badge variant="outline" className="text-xs">
                        Synced
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {auth.transports.map(transport => (
                      <Badge key={transport} variant="secondary" className="text-xs">
                        {transport.toUpperCase()}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span className="flex items-center gap-1">
                      <Label>Added:</Label>
                      <DateFormat.Medium date={auth.createdAt} />
                    </span>
                    {auth.lastUsedAt ? (
                      <span className="flex items-center gap-1">
                        <Label>Last used:</Label>
                        <DateFormat.Medium date={auth.lastUsedAt} />
                      </span>
                    ) : (
                      <span>Never used</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

export function ProfilePage({ children }: ProfilePageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-2xl tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information and security settings</p>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
