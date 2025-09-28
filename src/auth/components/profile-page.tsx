import { Button, Card } from '@ycore/componentry/shadcn-ui';
import { Form } from 'react-router';
import type { UserDetails } from '../@types/auth.types';

interface ProfileCardProps {
  user: UserDetails | null | undefined;
  signoutUrl: string;
}

export function ProfileCard({ user, signoutUrl }: ProfileCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Profile</Card.Title>
        <Card.Description>Your account information</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div>
          <p className="text-muted-foreground text-sm">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Display Name</p>
          <p className="font-medium">{user?.displayName}</p>
        </div>
      </Card.Content>
      <Card.Footer className="flex justify-between">
        <Form method="post" action={signoutUrl}>
          <Button type="submit" variant="destructive">
            Sign Out
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
}

interface ProfilePageProps {
  loaderData: { user: any };
  children?: React.ReactNode;
}

export function ProfilePage({ loaderData, children }: ProfilePageProps) {
  const { user } = loaderData;

  if (children) {
    return (
      <div className="mx-auto min-w-md max-w-lg px-4 py-8">
        {children}
      </div>
    );
  }

  // Default rendering (backward compatible)
  return (
    <div className="mx-auto min-w-md max-w-lg px-4 py-8">
      <Card>
        <Card.Header>
          <Card.Title>Profile</Card.Title>
          <Card.Description>Your account information</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Display Name</p>
            <p className="font-medium">{user?.displayName}</p>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
