/**
 * Crypto utilities for the application.
 * Provides functions for key generation, import/export, and encryption/decryption operations.
 */

/**
 * Exports a public key in SPKI format
 * @param key - The CryptoKey to export
 * @returns Base64 encoded string representation of the key
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return window.btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Exports a private key in PKCS8 format
 * @param key - The CryptoKey to export
 * @returns Base64 encoded string representation of the key
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  return window.btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Imports a public key from SPKI format
 * @param keyData - Base64 encoded string representation of the key
 * @returns Imported CryptoKey object configured for encryption
 */
export async function importPublicKey(keyData: string): Promise<CryptoKey> {
  const binaryData = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "spki",
    binaryData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"],
  );
}

/**
 * Imports a private key from PKCS8 format
 * @param keyData - Base64 encoded string representation of the key
 * @returns Imported CryptoKey object configured for decryption
 */
export async function importPrivateKey(keyData: string): Promise<CryptoKey> {
  const binaryData = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"],
  );
}

/**
 * Generates a random symmetric key for AES-GCM encryption
 * @returns A new AES-GCM CryptoKey for both encryption and decryption
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Exports a symmetric key in raw format
 * @param key - The symmetric key to export
 * @returns Raw binary data of the key
 */
export async function exportSymmetricKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await window.crypto.subtle.exportKey("raw", key);
}

/**
 * Imports a symmetric key from raw format
 * @param keyData - Raw binary data of the key
 * @returns Imported symmetric key for encryption/decryption
 */
export async function importSymmetricKey(
  keyData: ArrayBuffer,
): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt", "encrypt"],
  );
}

/**
 * Generates a random initialization vector for AES-GCM
 * @returns A 12-byte initialization vector
 */
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Validates the strength of a passphrase
 * @param passphrase - The passphrase to validate
 * @returns Object indicating validity and reason if invalid
 */
export function validatePassphraseStrength(passphrase: string): {
  isValid: boolean;
  reason?: string;
} {
  // Minimum length
  if (passphrase.length < 12) {
    return {
      isValid: false,
      reason: "Passphrase must be at least 12 characters",
    };
  }

  // Complexity requirements
  const hasUppercase = /[A-Z]/.test(passphrase);
  const hasLowercase = /[a-z]/.test(passphrase);
  const hasNumbers = /[0-9]/.test(passphrase);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(passphrase);

  if (!(hasUppercase && hasLowercase && hasNumbers && hasSpecialChars)) {
    return {
      isValid: false,
      reason:
        "Passphrase must include uppercase, lowercase, numbers, and special characters",
    };
  }

  return { isValid: true };
}

/**
 * Wraps (encrypts) a private key using a passphrase
 * @param privateKey - The private key to wrap
 * @param passphrase - The user's passphrase
 * @returns Encrypted private key data including salt and IV
 */
export async function wrapPrivateKey(
  privateKey: CryptoKey,
  passphrase: string,
): Promise<string> {
  // Export the private key to binary format
  const privateKeyData = await window.crypto.subtle.exportKey(
    "pkcs8",
    privateKey,
  );

  // Generate a random salt for PBKDF2
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // Derive a key from the passphrase
  const derivedKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Create an AES-GCM key from the derived key
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    derivedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // Generate an IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the private key
  const encryptedPrivateKey = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    privateKeyData,
  );

  // Combine the salt, IV, and encrypted data
  const result = {
    salt: Array.from(new Uint8Array(salt)),
    iv: Array.from(new Uint8Array(iv)),
    encryptedKey: Array.from(new Uint8Array(encryptedPrivateKey)),
  };

  // Convert to JSON string and then Base64
  return window.btoa(JSON.stringify(result));
}

/**
 * Unwraps (decrypts) a private key using a passphrase
 * @param wrappedKeyData - The encrypted private key data
 * @param passphrase - The user's passphrase
 * @returns Decrypted private key or null if passphrase is incorrect
 */
export async function unwrapPrivateKey(
  wrappedKeyData: string,
  passphrase: string,
): Promise<CryptoKey | null> {
  try {
    // Parse the wrapped key data
    const parsedData = JSON.parse(window.atob(wrappedKeyData));
    const salt = new Uint8Array(parsedData.salt);
    const iv = new Uint8Array(parsedData.iv);
    const encryptedKey = new Uint8Array(parsedData.encryptedKey);

    // Derive a key from the passphrase
    const derivedKey = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    // Create an AES-GCM key from the derived key
    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      derivedKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    // Decrypt the private key
    const decryptedPrivateKey = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encryptedKey,
    );

    // Import the private key
    return await window.crypto.subtle.importKey(
      "pkcs8",
      decryptedPrivateKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"],
    );
  } catch (error) {
    // Incorrect passphrase or corrupted data
    return null;
  }
}
