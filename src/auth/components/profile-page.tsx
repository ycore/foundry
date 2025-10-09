import { DateFormat } from '@ycore/componentry/impetus/intl';
import { AlertDialog, Badge, Button, Card, Input, Label, Separator, Spinner } from '@ycore/componentry/shadcn-ui';
import svgSpriteUrl from '@ycore/componentry/shadcn-ui/assets/lucide-sprites.svg?url';
import { useSecureFetcher } from '@ycore/foundry/secure';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Form } from 'react-router';

import type { AuthenticatorsCardProps, ProfileCardProps, ProfilePageProps } from '../@types/auth.component.types';
import { convertServerOptionsToWebAuthn } from '../services/webauthn-credential';
import { isWebAuthnSupported, startRegistration } from './webauthn-client';

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
  const addFetcher = useSecureFetcher();
  const renameFetcher = useSecureFetcher();
  const deleteFetcher = useSecureFetcher();
  const optionsFetcher = useSecureFetcher();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'add'; authenticatorId?: string } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [webAuthnError, setWebAuthnError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [processedFetcherId, setProcessedFetcherId] = useState<string | null>(null);

  // Form refs for programmatic submission after WebAuthn
  const abortControllerRef = useRef<AbortController | null>(null);
  const freshCsrfTokenRef = useRef<string | null>(null);

  // Handle WebAuthn registration flow for add
  useEffect(() => {
    // Handle options response (data is returned directly, not wrapped in success/data)
    // Prevent duplicate processing by checking if we've already processed this data
    const currentFetcherId = optionsFetcher.state + JSON.stringify(optionsFetcher.data);
    if (optionsFetcher.data && pendingAction && processedFetcherId !== currentFetcherId) {
      setProcessedFetcherId(currentFetcherId);
      const performWebAuthnRegistration = async () => {
        try {
          setIsRegistering(true);
          setWebAuthnError(null);

          // Create AbortController for this operation
          abortControllerRef.current = new AbortController();

          const responseData = optionsFetcher.data as { challenge?: string; options?: any; csrfToken?: string };

          // Validate response structure
          if (!responseData || !responseData.challenge || !responseData.options) {
            console.error('Invalid options response structure:', responseData);
            throw new Error('Invalid response from server. Please try again.');
          }

          const { challenge, options, csrfToken: freshCsrfToken } = responseData;

          // Store the fresh CSRF token if provided
          if (freshCsrfToken) {
            freshCsrfTokenRef.current = freshCsrfToken;
          }

          // Convert server options to WebAuthn API format
          let webAuthnOptions: PublicKeyCredentialCreationOptions;
          try {
            webAuthnOptions = convertServerOptionsToWebAuthn(options, challenge);
          } catch (conversionError) {
            console.error('Options conversion failed:', conversionError);
            throw new Error('Failed to process registration options. Please try again.');
          }

          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Registration timed out. Please try again.'));
            }, 60000);

            // Clear timeout if aborted
            abortControllerRef.current?.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
            });
          });

          // Race between WebAuthn registration and timeout
          const credential = await Promise.race([startRegistration(webAuthnOptions), timeoutPromise]);

          // Check if still mounted and not aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          // Submit based on action type
          const formData = new FormData();
          if (pendingAction.type === 'add') {
            formData.append('intent', 'add-passkey');
            formData.append('challenge', challenge);
            formData.append('credentialData', JSON.stringify(credential));

            // Use the fresh CSRF token from the response if available
            if (freshCsrfTokenRef.current) {
              formData.append('csrf_token', freshCsrfTokenRef.current);
            }

            addFetcher.submitSecure(formData, { method: 'post', action: '/auth/profile' });
          }

          setPendingAction(null);
          setIsRegistering(false);
        } catch (error) {
          // Check if component is still mounted and operation wasn't aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setIsRegistering(false);
          setPendingAction(null);

          // Provide more specific error messages
          let errorMessage = 'Registration failed';
          if (error instanceof Error) {
            if (error.message.includes('cancelled')) {
              errorMessage = 'Registration was cancelled. Please try again when ready.';
            } else if (error.message.includes('timed out')) {
              errorMessage = error.message;
            } else if (error.message.includes('already registered')) {
              errorMessage = 'This authenticator is already registered.';
            } else {
              errorMessage = error.message;
            }
          }
          setWebAuthnError(errorMessage);
        }
      };

      performWebAuthnRegistration();
    }
  }, [optionsFetcher.data, optionsFetcher.state, pendingAction, processedFetcherId, addFetcher]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Set client state after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Monitor add fetcher state changes
  useEffect(() => {
    if (addFetcher.data && addFetcher.state === 'idle') {
      setWebAuthnError(null);
      setIsRegistering(false);
    }

    // Check for errors
    if (addFetcher.state === 'idle' && addFetcher.data) {
      const data = addFetcher.data as { success?: boolean; error?: { message?: string } };
      if (data.success === false) {
        setWebAuthnError(data.error?.message || 'Failed to add passkey');
        setIsRegistering(false);
      }
    }
  }, [addFetcher.data, addFetcher.state]);

  const handleAddPasskey = () => {
    // Clear any previous errors
    setWebAuthnError(null);

    if (!isWebAuthnSupported()) {
      setWebAuthnError('WebAuthn is not supported on this device');
      return;
    }

    setPendingAction({ type: 'add' });

    // Request registration options from server (server has correct RP ID logic)
    const formData = new FormData();
    formData.append('intent', 'add-passkey-options');
    optionsFetcher.submitSecure(formData, { method: 'post', action: '/auth/profile' });
  };

  const handleStartEdit = (authenticator: (typeof authenticators)[0]) => {
    setEditingId(authenticator.id);
    setEditingName(authenticator.name || '');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const formData = new FormData();
    formData.append('intent', 'rename-passkey');
    formData.append('authenticatorId', editingId);
    formData.append('name', editingName.trim());

    renameFetcher.submitSecure(formData, { method: 'post', action: '/auth/profile' });

    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeletePasskey = (authenticatorId: string) => {
    const formData = new FormData();
    formData.append('intent', 'delete-passkey');
    formData.append('authenticatorId', authenticatorId);

    deleteFetcher.submitSecure(formData, { method: 'post', action: '/auth/profile' });
  };

  // Determine loading states
  const isAddingPasskey = addFetcher.state === 'submitting' || isRegistering || (optionsFetcher.state !== 'idle' && pendingAction?.type === 'add');

  const isRenamingPasskey = renameFetcher.state === 'submitting';
  const isDeletingPasskey = (id: string) => deleteFetcher.state === 'submitting' && deleteFetcher.formData?.get('authenticatorId') === id;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title className="flex items-center gap-2">Passkeys</Card.Title>
            <Card.Description>Security keys and devices used to sign in to your account</Card.Description>
          </div>
          <Button onClick={handleAddPasskey} disabled={isAddingPasskey || authenticators.length >= 10 || (isClient && !isWebAuthnSupported())} size="sm">
            <Spinner spriteUrl={svgSpriteUrl} className={clsx('mr-1 size-4', !isAddingPasskey && 'hidden')} />
            {isAddingPasskey ? (isRegistering ? 'Setting up...' : 'Adding...') : 'Add Passkey'}
          </Button>
        </div>
      </Card.Header>

      <Card.Content>
        {/* WebAuthn error display */}
        {webAuthnError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="font-medium text-red-800 text-sm">Registration Failed</p>
            <p className="mt-1 text-red-600 text-xs">{webAuthnError}</p>
          </div>
        )}

        {/* Registration in progress indicator */}
        {isRegistering && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm">
            <div className="flex items-center gap-2">
              <Spinner spriteUrl={svgSpriteUrl} className="size-4" />
              <span>Please set up your authenticator...</span>
            </div>
            <p className="mt-1 text-xs">Follow the prompts to create a passkey on your device.</p>
          </div>
        )}

        {authenticators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h4 className="mb-2 font-medium text-muted-foreground">No passkeys registered</h4>
            <p className="max-w-sm text-muted-foreground text-sm">Add a security key or biometric device to secure your account</p>
          </div>
        ) : (
          <div className="space-y-3">
            {authenticators.map(auth => (
              <div key={auth.id} className="rounded-lg border p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {editingId === auth.id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-8 w-48" placeholder="Enter passkey name" />
                          <Button size="sm" onClick={handleSaveEdit} disabled={isRenamingPasskey}>
                            {isRenamingPasskey ? 'Saving...' : 'Save'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium text-sm">{auth.name}</h4>
                          <span className="text-muted-foreground text-xs">•</span>
                          <p className="text-muted-foreground text-xs uppercase">{auth.credentialDeviceType}</p>
                          {auth.credentialBackedUp && (
                            <Badge variant="outline" className="text-xs">
                              Synced
                            </Badge>
                          )}
                        </>
                      )}
                    </div>

                    {editingId !== auth.id && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleStartEdit(auth)} className="h-8 px-2">
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialog.Trigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive" disabled={authenticators.length <= 1 || isDeletingPasskey(auth.id)}>
                              {isDeletingPasskey(auth.id) ? 'Deleting...' : 'Delete'}
                            </Button>
                          </AlertDialog.Trigger>
                          <AlertDialog.Content>
                            <AlertDialog.Header>
                              <AlertDialog.Title>Delete Passkey</AlertDialog.Title>
                              <AlertDialog.Description asChild>
                                <div>
                                  <p>Are you sure you want to delete "{auth.name}"? This action cannot be undone.</p>
                                  {authenticators.length <= 1 && <p className="mt-2 text-destructive text-sm">You cannot delete your last passkey as it would lock you out of your account.</p>}
                                </div>
                              </AlertDialog.Description>
                            </AlertDialog.Header>
                            <AlertDialog.Footer>
                              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                              <AlertDialog.Action onClick={() => handleDeletePasskey(auth.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete Passkey
                              </AlertDialog.Action>
                            </AlertDialog.Footer>
                          </AlertDialog.Content>
                        </AlertDialog>
                      </div>
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

        {authenticators.length >= 10 && (
          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-muted-foreground text-sm">You have reached the maximum limit of 10 passkeys. Delete an existing passkey to add a new one.</p>
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
