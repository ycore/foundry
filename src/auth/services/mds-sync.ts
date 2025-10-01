import { logger } from '@ycore/forge/logger';
import { type AppResult, createAppError, flattenErrors, returnFailure, returnSuccess, transformError } from '@ycore/forge/result';

import type { EnhancedDeviceInfo } from '../@types/auth.types';
import { DEVICE_TYPES, TRANSPORT_METHODS } from '../auth.constants';

export interface MDSEntry {
  aaguid?: string;
  aaid?: string;
  attestationCertificateKeyIdentifiers?: string[];
  metadataStatement?: MDSMetadataStatement;
  biometricStatusReports?: Array<{
    certLevel?: number;
    modality?: string;
    effectiveDate?: string;
    certificationDescriptor?: string;
    certificateNumber?: string;
    certificationPolicyVersion?: string;
    certificationRequirementsVersion?: string;
  }>;
  statusReports: Array<{
    status:
    | 'FIDO_CERTIFIED'
    | 'NOT_FIDO_CERTIFIED'
    | 'FIDO_CERTIFIED_L1'
    | 'FIDO_CERTIFIED_L2'
    | 'UPDATE_AVAILABLE'
    | 'REVOKED'
    | 'SELF_ASSERTION_SUBMITTED'
    | 'FIDO_CERTIFIED_L1_PLUS'
    | 'FIDO_CERTIFIED_L2_PLUS'
    | 'FIDO_CERTIFIED_L3'
    | 'FIDO_CERTIFIED_L3_PLUS';
    effectiveDate?: string;
    authenticatorVersion?: number;
    certificate?: string;
    url?: string;
    certificationDescriptor?: string;
    certificateNumber?: string;
    certificationPolicyVersion?: string;
    certificationRequirementsVersion?: string;
  }>;
  timeOfLastStatusChange?: string;
  rogueListURL?: string;
  rogueListHash?: string;
}

export interface MDSMetadataStatement {
  legalHeader?: string;
  aaguid?: string;
  aaid?: string;
  attestationCertificateKeyIdentifiers?: string[];
  description?: string;
  alternativeDescriptions?: Record<string, string>;
  authenticatorVersion?: number;
  protocolFamily?: 'u2f' | 'fido2';
  schema?: number;
  upv?: Array<{ major: number; minor: number }>;
  authenticationAlgorithms?: string[];
  publicKeyAlgAndEncodings?: string[];
  attestationTypes?: string[];
  userVerificationDetails?: Array<Array<Record<string, any>>>;
  keyProtection?: string[];
  isKeyRestricted?: boolean;
  isFreshUserVerificationRequired?: boolean;
  matcherProtection?: string[];
  cryptoStrength?: number;
  attachmentHint?: string[];
  tcDisplay?: string[];
  tcDisplayContentType?: string;
  tcDisplayPNGCharacteristics?: Array<{
    width: number;
    height: number;
    bitDepth: number;
    colorType: number;
    compression: number;
    filter: number;
    interlace: number;
    plte?: Array<{ r: number; g: number; b: number }>;
  }>;
  attestationRootCertificates?: string[];
  ecdaaTrustAnchors?: Array<{
    X: string;
    Y: string;
    c: string;
    sx: string;
    sy: string;
    G1Curve: string;
  }>;
  icon?: string;
  supportedExtensions?: Array<{
    id: string;
    tag?: number;
    data?: string;
    fail_if_unknown?: boolean;
  }>;
  authenticatorGetInfo?: Record<string, any>;
}

export interface MDSPayload {
  legalHeader: string;
  no: number;
  nextUpdate: string;
  entries: MDSEntry[];
}

export interface SyncResult {
  synced: number;
  failed: number;
  lastSync: string;
}

function mapTransportHints(attachmentHint: string[] = []): string[] {
  const transports: string[] = [];

  for (const hint of attachmentHint) {
    switch (hint.toLowerCase()) {
      case 'internal':
        transports.push(TRANSPORT_METHODS.INTERNAL);
        break;
      case 'external':
        transports.push(TRANSPORT_METHODS.USB);
        break;
      case 'wired':
        transports.push(TRANSPORT_METHODS.USB);
        break;
      case 'wireless':
        transports.push(TRANSPORT_METHODS.BLE);
        break;
      case 'nfc':
        transports.push(TRANSPORT_METHODS.NFC);
        break;
      case 'hybrid':
        transports.push(TRANSPORT_METHODS.HYBRID);
        break;
      default:
        logger.debug('mds_unknown_transport_hint', { hint });
    }
  }

  // Default transports if none specified
  if (transports.length === 0) {
    transports.push(TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC);
  }

  return [...new Set(transports)]; // Remove duplicates
}

function determineDeviceType(protocolFamily?: string, attachmentHint: string[] = []): 'platform' | 'cross-platform' {
  // Check attachment hints first
  if (attachmentHint.includes('internal')) {
    return DEVICE_TYPES.PLATFORM;
  }

  if (attachmentHint.includes('external') || attachmentHint.includes('wired')) {
    return DEVICE_TYPES.CROSS_PLATFORM;
  }

  // Default based on protocol family
  return protocolFamily === 'fido2' ? DEVICE_TYPES.CROSS_PLATFORM : DEVICE_TYPES.CROSS_PLATFORM;
}

function extractVendorAndModel(description = ''): { vendor: string; model: string } {
  // Common patterns for extracting vendor and model from description
  const patterns = [
    /^([A-Za-z]+)\s+(.+)/, // "Yubico YubiKey 5 Series"
    /^(.+?)\s*-\s*(.+)/, // "Google - Titan Security Key"
    /^(.+?)\s+(.+)/, // "Microsoft Windows Hello"
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return {
        vendor: match[1].trim(),
        model: match[2].trim(),
      };
    }
  }

  // Fallback
  return {
    vendor: 'Unknown',
    model: description || 'Security Key',
  };
}

function transformMDSToDeviceInfo(entry: MDSEntry): EnhancedDeviceInfo {
  const metadata = entry.metadataStatement;
  const latestStatus = entry.statusReports?.[0]; // Most recent status

  const description = metadata?.description || '';
  const { vendor, model } = extractVendorAndModel(description);

  const deviceType = determineDeviceType(metadata?.protocolFamily, metadata?.attachmentHint);

  const transports = mapTransportHints(metadata?.attachmentHint);

  const isCertified = latestStatus?.status?.includes('FIDO_CERTIFIED') || false;

  return {
    type: deviceType,
    vendor,
    model,
    certified: isCertified,
    transports,
    // Enhanced MDS fields
    certificationStatus: latestStatus?.status,
    effectiveDate: latestStatus?.effectiveDate,
    policyVersion: latestStatus?.certificationPolicyVersion,
    protocolFamily: metadata?.protocolFamily,
    userVerificationDetails: metadata?.userVerificationDetails?.flat().map(detail => Object.keys(detail).join(',')),
    keyProtection: metadata?.keyProtection,
    matcherProtection: metadata?.matcherProtection,
    cryptoStrength: metadata?.cryptoStrength,
    attachmentHint: metadata?.attachmentHint,
    tcDisplay: metadata?.tcDisplay,
    attestationRootCertificates: metadata?.attestationRootCertificates,
    icon: metadata?.icon,
    supportedExtensions: metadata?.supportedExtensions,
    authenticatorVersion: metadata?.authenticatorVersion,
    upv: metadata?.upv,
  };
}

async function verifyMDSJWT(jwt: string): Promise<{ payload: MDSPayload }> {
  // Basic JWT parsing without verification for now
  // In production, you should verify the JWT signature using FIDO Alliance's public key
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  try {
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as MDSPayload;

    logger.debug('mds_jwt_parsed', {
      entriesCount: payload.entries?.length || 0,
      nextUpdate: payload.nextUpdate,
    });

    return { payload };
  } catch (error) {
    throw new Error(`Failed to parse JWT payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function syncMetadataFromMDS(metadataKV: KVNamespace): Promise<AppResult<SyncResult>> {
  try {
    logger.info('mds_sync_started');

    // 1. Fetch MDS JWT blob
    const mdsResponse = await fetch('https://mds.fidoalliance.org/v1/metadata');

    if (!mdsResponse.ok) {
      throw new Error(`MDS fetch failed: ${mdsResponse.status} ${mdsResponse.statusText}`);
    }

    const mdsJWT = await mdsResponse.text();

    // 2. Verify and parse JWT
    const { payload } = await verifyMDSJWT(mdsJWT);

    if (!payload.entries || !Array.isArray(payload.entries)) {
      throw new Error('Invalid MDS payload: missing entries array');
    }

    // 3. Process each metadata statement
    const results = await Promise.allSettled(
      payload.entries
        .filter(entry => entry.aaguid) // Only process entries with AAGUID
        .map(async (entry: MDSEntry) => {
          try {
            const deviceInfo = transformMDSToDeviceInfo(entry);
            const key = `device:${entry.aaguid}`;

            await metadataKV.put(
              key,
              JSON.stringify(deviceInfo),
              { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
            );

            logger.debug('mds_device_cached', {
              aaguid: entry.aaguid,
              vendor: deviceInfo.vendor,
              model: deviceInfo.model,
            });

            return entry.aaguid;
          } catch (error) {
            logger.warn('mds_device_processing_failed', {
              aaguid: entry.aaguid,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
          }
        })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // 4. Update sync metadata
    const lastSync = new Date().toISOString();
    await metadataKV.put('mds:last_sync', lastSync);
    await metadataKV.put(
      'mds:sync_stats',
      JSON.stringify({
        lastSync,
        totalEntries: payload.entries.length,
        processedEntries: successful,
        failedEntries: failed,
        nextUpdate: payload.nextUpdate,
      })
    );

    logger.info('mds_sync_completed', {
      successful,
      failed,
      total: payload.entries.length,
      nextUpdate: payload.nextUpdate,
    });

    return returnSuccess({
      synced: successful,
      failed,
      lastSync,
    });
  } catch (error) {
    logger.error('mds_sync_failed', {
      error: flattenErrors(transformError(error)),
    });

    return returnFailure(createAppError('Failed to sync metadata from MDS', { sync: error instanceof Error ? error.message : 'Unknown sync error' }));
  }
}

export async function getMDSSyncStatus(metadataKV: KVNamespace): Promise<
  AppResult<{
    lastSync: string | null;
    stats: any;
  }>
> {
  try {
    const [lastSync, statsJson] = await Promise.all([metadataKV.get('mds:last_sync'), metadataKV.get('mds:sync_stats')]);

    const stats = statsJson ? JSON.parse(statsJson) : null;

    return returnSuccess({
      lastSync,
      stats,
    });
  } catch (error) {
    logger.error('mds_status_fetch_failed', {
      error: flattenErrors(transformError(error)),
    });

    return returnFailure(transformError(error));
  }
}
