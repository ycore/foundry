import { verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture, RegistrationResponseJSON } from '@simplewebauthn/types';
import { logger } from '@ycore/forge/logger';
import { Strategy } from 'remix-auth/strategy';
import type { UserDetails, WebAuthnAuthenticator, WebAuthnOptions, WebAuthnOptionsResponse, WebAuthnVerifyParams } from '../@types/auth.types';

export class WebAuthnStrategy<TUser> extends Strategy<TUser, WebAuthnVerifyParams> {
  name = 'webauthn';
  sessionStorage: WebAuthnOptions<TUser>['sessionStorage'];
  challengeSessionKey = 'challenge';
  requireUserVerification = false;

  rpName: WebAuthnOptions<TUser>['rpName'];
  rpID: WebAuthnOptions<TUser>['rpID'];
  origin: WebAuthnOptions<TUser>['origin'];
  getUserAuthenticators: WebAuthnOptions<TUser>['getUserAuthenticators'];
  getUserDetails: WebAuthnOptions<TUser>['getUserDetails'];
  getUserByUsername: WebAuthnOptions<TUser>['getUserByUsername'];
  getAuthenticatorById: WebAuthnOptions<TUser>['getAuthenticatorById'];

  constructor(options: WebAuthnOptions<TUser>, verify: Strategy.VerifyFunction<TUser, WebAuthnVerifyParams>) {
    super(verify);
    this.sessionStorage = options.sessionStorage;
    this.rpName = options.rpName;
    this.rpID = options.rpID;
    this.origin = options.origin;
    this.getUserAuthenticators = options.getUserAuthenticators;
    this.getUserDetails = options.getUserDetails;
    this.getUserByUsername = options.getUserByUsername;
    this.getAuthenticatorById = options.getAuthenticatorById;
    this.challengeSessionKey = options.challengeSessionKey || 'challenge';
    this.requireUserVerification = options.requireUserVerification ?? false;
  }

  async getRP(request: Request) {
    const rp = {
      name: typeof this.rpName === 'function' ? await this.rpName(request) : this.rpName,
      id: typeof this.rpID === 'function' ? await this.rpID(request) : this.rpID,
      origin: typeof this.origin === 'function' ? await this.origin(request) : this.origin,
    };

    return rp;
  }

  async generateOptions(request: Request, user: TUser | null | undefined) {
    let authenticators: WebAuthnAuthenticator[] = [];
    let userDetails: UserDetails | null = null;
    let usernameAvailable: boolean | null = null;
    let foundUser = user;

    const rp = await this.getRP(request);

    const username = new URL(request.url).searchParams.get('username');
    if (!foundUser) {
      if (username) {
        usernameAvailable = true;
        foundUser = await this.getUserByUsername(username || '');
      }
    }

    if (foundUser) {
      authenticators = await this.getUserAuthenticators(foundUser);
      userDetails = await this.getUserDetails(foundUser);
      usernameAvailable = false;
    }

    const options: WebAuthnOptionsResponse = {
      usernameAvailable,
      rp,
      user: userDetails ? { displayName: userDetails.username, ...userDetails } : null,
      challenge: isoBase64URL.fromBuffer(crypto.getRandomValues(new Uint8Array(32))),
      authenticators: authenticators.map(({ id, transports }) => ({
        id,
        type: 'public-key',
        transports: transports as AuthenticatorTransportFuture[],
      })),
    };

    return options;
  }

  async authenticate(request: Request): Promise<TUser> {
    const session = await this.sessionStorage.getSession(request.headers.get('Cookie'));

    const rp = await this.getRP(request);

    if (request.method !== 'POST') throw new Error('The WebAuthn strategy only supports POST requests.');

    const expectedChallenge = session.get(this.challengeSessionKey);

    if (!expectedChallenge) {
      throw new Error(`Expected challenge not found. It needs to set to the \`${this.challengeSessionKey}\` property on the auth session storage.`);
    }

    const formData = await request.formData();

    let data: unknown;
    try {
      const responseData = formData.get('response');
      if (typeof responseData !== 'string') throw new Error('Response data is not a string');
      data = JSON.parse(responseData);
    } catch (error) {
      logger.error('Failed to parse response data:', error);
      throw new Error('Invalid passkey response JSON.');
    }

    const type = formData.get('type');
    let username = formData.get('username');
    const displayName = formData.get('displayName')?.toString();

    if (typeof username !== 'string') username = null;
    if (type === 'registration') {
      if (!username) throw new Error('Username is a required form value.');
      const verification = await verifyRegistrationResponse({
        response: data as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin: rp.origin,
        expectedRPID: rp.id,
        requireUserVerification: this.requireUserVerification,
      });

      if (verification.verified && verification.registrationInfo) {
        const {
          credential: { id, publicKey, counter, transports },
          credentialBackedUp,
          credentialDeviceType,
          aaguid,
        } = verification.registrationInfo;

        const newAuthenticator = {
          id,
          credentialPublicKey: isoBase64URL.fromBuffer(publicKey),
          counter,
          credentialBackedUp,
          credentialDeviceType,
          transports: transports?.join(',') || '',
          aaguid,
        };
        return this.verify({
          authenticator: newAuthenticator,
          type: 'registration',
          username,
          displayName,
        });
      }
      throw new Error('Passkey verification failed.');
    }
    if (type === 'authentication') {
      const authenticationData = data as AuthenticationResponseJSON;
      const authenticator = await this.getAuthenticatorById(authenticationData.id);
      if (!authenticator) throw new Error('Passkey not found.');

      const verification = await verifyAuthenticationResponse({
        response: authenticationData,
        expectedChallenge,
        expectedOrigin: rp.origin,
        expectedRPID: rp.id,
        credential: {
          id: authenticator.id,
          publicKey: isoBase64URL.toBuffer(authenticator.credentialPublicKey),
          counter: authenticator.counter,
          transports: authenticator.transports.split(',') as AuthenticatorTransportFuture[],
        },
        requireUserVerification: this.requireUserVerification,
      });

      if (!verification.verified) throw new Error('Passkey verification failed.');

      return this.verify({
        authenticator: {
          id: authenticator.id,
          credentialPublicKey: authenticator.credentialPublicKey,
          counter: authenticator.counter,
          credentialDeviceType: authenticator.credentialDeviceType,
          credentialBackedUp: authenticator.credentialBackedUp,
          transports: authenticator.transports,
          aaguid: authenticator.aaguid,
        },
        type: 'authentication',
        username,
        displayName,
      });
    }
    throw new Error('Invalid verification type.');
  }
}
