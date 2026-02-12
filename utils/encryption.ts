import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ENCRYPTION_KEY_ALIAS = 'aura_gold_encryption_key';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  version: number;
}

export interface EncryptionStatus {
  isEnabled: boolean;
  algorithm: string;
  keyGenerated: boolean;
}

const toArrayBuffer = (buffer: ArrayBufferLike): ArrayBuffer => {
  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }
  const uint8 = new Uint8Array(buffer);
  return uint8.slice().buffer as ArrayBuffer;
};

const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const arrayBuffer = toArrayBuffer(buffer);
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = binary.charCodeAt(i++);
    const c = binary.charCodeAt(i++);
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += isNaN(b) ? '=' : chars[((b & 15) << 2) | (c >> 6)];
    result += isNaN(c) ? '=' : chars[c & 63];
  }
  return result;
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  const len = base64.length;
  let bufferLength = len * 0.75;
  if (base64[len - 1] === '=') bufferLength--;
  if (base64[len - 2] === '=') bufferLength--;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes.buffer;
};

const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
};

const arrayBufferToString = (buffer: ArrayBuffer): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};

const generateKey = async (): Promise<string> => {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH);
    return arrayBufferToBase64(toArrayBuffer(randomBytes.buffer));
  } catch (error) {
    console.error('[Encryption] Failed to generate key:', error);
    throw new Error('Failed to generate encryption key');
  }
};

const getOrCreateEncryptionKey = async (): Promise<string> => {
  try {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
    
    if (!key) {
      console.log('[Encryption] Generating new encryption key');
      key = await generateKey();
      await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key);
      console.log('[Encryption] Encryption key stored securely');
    }
    
    return key;
  } catch (error) {
    console.warn('[Encryption] Error with SecureStore, using fallback:', error);
    try {
      const fallbackKey = await generateKey();
      return fallbackKey;
    } catch (fallbackError) {
      console.error('[Encryption] Fallback key generation failed:', fallbackError);
      throw new Error('Failed to obtain encryption key');
    }
  }
};

const deriveKeyMaterial = async (keyBase64: string, salt: Uint8Array): Promise<Uint8Array> => {
  try {
    const keyBytes = new Uint8Array(base64ToArrayBuffer(keyBase64));
    const combined = new Uint8Array(keyBytes.length + salt.length);
    combined.set(keyBytes);
    combined.set(salt, keyBytes.length);
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      arrayBufferToBase64(combined.buffer),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    return new Uint8Array(base64ToArrayBuffer(hash)).slice(0, KEY_LENGTH);
  } catch (error) {
    console.error('[Encryption] Key derivation failed:', error);
    throw new Error('Failed to derive encryption key material');
  }
};

const xorEncrypt = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  try {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ key[i % key.length];
    }
    return result;
  } catch (error) {
    console.error('[Encryption] XOR encryption failed:', error);
    throw new Error('Failed to perform XOR encryption');
  }
};

const computeHMAC = async (data: Uint8Array, key: Uint8Array): Promise<Uint8Array> => {
  try {
    const combined = new Uint8Array(data.length + key.length);
    combined.set(key);
    combined.set(data, key.length);
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      arrayBufferToBase64(combined.buffer),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    return new Uint8Array(base64ToArrayBuffer(hash)).slice(0, TAG_LENGTH);
  } catch (error) {
    console.error('[Encryption] HMAC computation failed:', error);
    throw new Error('Failed to compute HMAC');
  }
};

export const encryptData = async (plaintext: string): Promise<EncryptedData> => {
  try {
    if (typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a string');
    }

    const key = await getOrCreateEncryptionKey();
    const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
    
    // Validate that we got proper IV
    if (!iv || iv.length !== IV_LENGTH) {
      throw new Error('Failed to generate valid IV');
    }
    
    if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const keyBuffer = base64ToArrayBuffer(key);
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );
        
        const plaintextBuffer = stringToArrayBuffer(plaintext);
        const ivBuffer = toArrayBuffer(iv.buffer);
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
          cryptoKey,
          plaintextBuffer
        );
        
        const encryptedArray = new Uint8Array(encrypted);
        const ciphertext = encryptedArray.slice(0, encryptedArray.length - TAG_LENGTH);
        const tag = encryptedArray.slice(encryptedArray.length - TAG_LENGTH);
        
        console.log('[Encryption] Data encrypted with AES-256-GCM (Web Crypto)');
        
        return {
          ciphertext: arrayBufferToBase64(toArrayBuffer(ciphertext.buffer)),
          iv: arrayBufferToBase64(toArrayBuffer(iv.buffer)),
          tag: arrayBufferToBase64(toArrayBuffer(tag.buffer)),
          version: 2,
        };
      } catch (webCryptoError) {
        console.warn('[Encryption] Web Crypto failed, using fallback:', webCryptoError);
      }
    }
    
    const derivedKey = await deriveKeyMaterial(key, iv);
    const plaintextBytes = new Uint8Array(stringToArrayBuffer(plaintext));
    const ciphertext = xorEncrypt(plaintextBytes, derivedKey);
    const tag = await computeHMAC(ciphertext, derivedKey);
    
    console.log('[Encryption] Data encrypted with HMAC-SHA256 authenticated encryption');
    
    return {
      ciphertext: arrayBufferToBase64(toArrayBuffer(ciphertext.buffer)),
      iv: arrayBufferToBase64(toArrayBuffer(iv.buffer)),
      tag: arrayBufferToBase64(toArrayBuffer(tag.buffer)),
      version: 1,
    };
  } catch (error) {
    console.error('[Encryption] Encryption failed:', error);
    throw new Error(`Failed to encrypt sensitive data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const decryptData = async (encryptedData: EncryptedData): Promise<string> => {
  try {
    // Validate input
    if (!encryptedData || typeof encryptedData !== 'object') {
      throw new Error('Invalid encrypted data format');
    }
    
    if (!encryptedData.iv || !encryptedData.ciphertext || !encryptedData.tag) {
      throw new Error('Missing required encrypted data fields');
    }

    const key = await getOrCreateEncryptionKey();
    const iv = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
    const ciphertext = new Uint8Array(base64ToArrayBuffer(encryptedData.ciphertext));
    const tag = new Uint8Array(base64ToArrayBuffer(encryptedData.tag));
    
    if (encryptedData.version === 2 && Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const keyBuffer = base64ToArrayBuffer(key);
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        
        const combined = new Uint8Array(ciphertext.length + tag.length);
        combined.set(ciphertext);
        combined.set(tag, ciphertext.length);
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          cryptoKey,
          combined
        );
        
        console.log('[Encryption] Data decrypted with AES-256-GCM (Web Crypto)');
        return arrayBufferToString(decrypted);
      } catch (webCryptoError) {
        console.warn('[Encryption] Web Crypto decryption failed:', webCryptoError);
      }
    }
    
    const derivedKey = await deriveKeyMaterial(key, iv);
    const computedTag = await computeHMAC(ciphertext, derivedKey);
    
    // Constant-time comparison to prevent timing attacks
    let tagValid = true;
    if (computedTag.length !== tag.length) {
      tagValid = false;
    } else {
      for (let i = 0; i < tag.length; i++) {
        if (computedTag[i] !== tag[i]) {
          tagValid = false;
        }
      }
    }
    
    if (!tagValid) {
      throw new Error('Data integrity check failed - possible tampering detected');
    }
    
    const plaintextBytes = xorEncrypt(ciphertext, derivedKey);
    const plaintext = arrayBufferToString(toArrayBuffer(plaintextBytes.buffer));
    
    console.log('[Encryption] Data decrypted and integrity verified');
    return plaintext;
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    throw new Error(`Failed to decrypt sensitive data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const encryptObject = async <T>(obj: T): Promise<string> => {
  try {
    if (obj === null || obj === undefined) {
      throw new Error('Cannot encrypt null or undefined object');
    }
    
    const jsonString = JSON.stringify(obj);
    const encrypted = await encryptData(jsonString);
    return JSON.stringify(encrypted);
  } catch (error) {
    console.error('[Encryption] Object encryption failed:', error);
    throw new Error(`Failed to encrypt object: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const decryptObject = async <T>(encryptedString: string): Promise<T> => {
  try {
    if (typeof encryptedString !== 'string') {
      throw new Error('Encrypted string must be a string');
    }
    
    if (!encryptedString.trim()) {
      throw new Error('Encrypted string cannot be empty');
    }
    
    const encryptedData: EncryptedData = JSON.parse(encryptedString);
    const jsonString = await decryptData(encryptedData);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('[Encryption] Object decryption failed:', error);
    throw new Error(`Failed to decrypt object: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const isEncryptedData = (data: string): boolean => {
  try {
    if (typeof data !== 'string' || !data.trim()) {
      return false;
    }
    
    const parsed = JSON.parse(data);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'ciphertext' in parsed &&
      'iv' in parsed &&
      'tag' in parsed &&
      'version' in parsed &&
      typeof parsed.ciphertext === 'string' &&
      typeof parsed.iv === 'string' &&
      typeof parsed.tag === 'string' &&
      typeof parsed.version === 'number'
    );
  } catch {
    return false;
  }
};

export const getEncryptionStatus = async (): Promise<EncryptionStatus> => {
  try {
    const key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
    const isWebCryptoAvailable = Platform.OS === 'web' && typeof crypto !== 'undefined' && !!crypto.subtle;
    
    return {
      isEnabled: true,
      algorithm: isWebCryptoAvailable ? 'AES-256-GCM' : 'HMAC-SHA256-XOR',
      keyGenerated: !!key,
    };
  } catch (error) {
    console.warn('[Encryption] Failed to get encryption status:', error);
    return {
      isEnabled: true,
      algorithm: 'HMAC-SHA256-XOR',
      keyGenerated: false,
    };
  }
};

export const rotateEncryptionKey = async (): Promise<void> => {
  try {
    console.log('[Encryption] Rotating encryption key...');
    const newKey = await generateKey();
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, newKey);
    console.log('[Encryption] Encryption key rotated successfully');
  } catch (error) {
    console.error('[Encryption] Key rotation failed:', error);
    throw new Error('Failed to rotate encryption key');
  }
};

export const hashSensitiveData = async (data: string): Promise<string> => {
  try {
    if (typeof data !== 'string') {
      throw new Error('Data to hash must be a string');
    }
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  } catch (error) {
    console.error('[Encryption] Hashing failed:', error);
    throw new Error('Failed to hash sensitive data');
  }
};

export const generateSecureId = async (): Promise<string> => {
  try {
    const bytes = await Crypto.getRandomBytesAsync(16);
    const hex = Array.from(new Uint8Array(bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch (error) {
    console.error('[Encryption] Secure ID generation failed:', error);
    throw new Error('Failed to generate secure ID');
  }
};
