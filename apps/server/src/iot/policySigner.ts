import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { config } from '../config';
import { logger } from '../logger';
import { EdgePolicy } from '@parents-app/shared';

let signingKeyPair: nacl.SignKeyPair | null = null;

export function initializePolicySigner() {
  if (config.edgePolicySignSecret && config.edgePolicySignPublic) {
    try {
      const secretKey = naclUtil.decodeBase64(config.edgePolicySignSecret);
      const publicKey = naclUtil.decodeBase64(config.edgePolicySignPublic);
      signingKeyPair = {
        secretKey,
        publicKey,
      };
      logger.info('Policy signer initialized with provided keys');
    } catch (error) {
      logger.error('Failed to parse policy signing keys from env', error);
    }
  }

  if (!signingKeyPair) {
    signingKeyPair = nacl.sign.keyPair();
    const publicKeyBase64 = naclUtil.encodeBase64(signingKeyPair.publicKey);
    const secretKeyBase64 = naclUtil.encodeBase64(signingKeyPair.secretKey);
    logger.warn('Generated temporary Ed25519 keys for policy signing');
    logger.warn(`Public Key (add to .env): ${publicKeyBase64}`);
    logger.warn(`Secret Key (add to .env): ${secretKeyBase64}`);
  }
}

export function signPolicy(policy: Omit<EdgePolicy, 'signature'>): EdgePolicy {
  if (!signingKeyPair) {
    throw new Error('Policy signer not initialized');
  }

  const policyJson = JSON.stringify(policy);
  const message = naclUtil.decodeUTF8(policyJson);
  const signature = nacl.sign.detached(message, signingKeyPair.secretKey);
  const sigBase64 = naclUtil.encodeBase64(signature);

  return {
    ...policy,
    signature: {
      alg: 'Ed25519',
      sigBase64,
    },
  };
}

export function verifyPolicy(policy: EdgePolicy): boolean {
  if (!signingKeyPair) {
    return false;
  }

  if (!policy.signature) {
    return false;
  }

  try {
    const { signature: _, ...unsignedPolicy } = policy;
    const policyJson = JSON.stringify(unsignedPolicy);
    const message = naclUtil.decodeUTF8(policyJson);
    const sig = naclUtil.decodeBase64(policy.signature.sigBase64);

    return nacl.sign.detached.verify(message, sig, signingKeyPair.publicKey);
  } catch (error) {
    logger.error('Policy verification failed', error);
    return false;
  }
}

export function getPublicKey(): string {
  if (!signingKeyPair) {
    throw new Error('Policy signer not initialized');
  }
  return naclUtil.encodeBase64(signingKeyPair.publicKey);
}
