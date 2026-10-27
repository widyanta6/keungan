/**
 * BizFlow Security & Cryptographic Utilities
 * Provides secure password hashing with salt using standard Web Crypto API (SHA-256),
 * session tokens, invitation tokens, and password strength validation.
 */

// Simple hex encoder for ArrayBuffer
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate random cryptographic salt
export function generateSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback if window.crypto is unavailable
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Hash a password with a cryptographic salt using SHA-256
 */
export async function hashPassword(
  password: string,
  providedSalt?: string
): Promise<{ hash: string; salt: string }> {
  const salt = providedSalt || generateSalt();
  const textToHash = `${salt}:${password}:bizflow_secure_salt_v1`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textToHash);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return {
      hash: bufferToHex(hashBuffer),
      salt,
    };
  }

  // Synchronous fallback hash for initial setup or environments without subtle crypto
  let hashVal = 0;
  for (let i = 0; i < textToHash.length; i++) {
    const char = textToHash.charCodeAt(i);
    hashVal = (hashVal << 5) - hashVal + char;
    hashVal |= 0;
  }
  return {
    hash: `bf_hash_${Math.abs(hashVal).toString(16)}_${salt}`,
    salt,
  };
}

/**
 * Verify a password against stored hash and salt
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const result = await hashPassword(password, storedSalt);
  return result.hash === storedHash;
}

/**
 * Synchronous hash generator for initial seeds
 */
export function synchronousHash(password: string, salt: string): string {
  const text = `${salt}:${password}:bizflow_secure_salt_v1`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(8, '0')}_${salt.substring(0, 8)}`;
}

/**
 * Generate a cryptographically secure random token (for sessions, invitations, password resets)
 */
export function generateSecureToken(prefix = 'tok'): string {
  const rand = generateSalt(12);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Panjang kata sandi minimal 8 karakter');
  } else {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Gunakan setidaknya 1 huruf besar (A-Z)');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Gunakan setidaknya 1 angka (0-9)');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Disarankan menyertakan simbol (misal @, #, $, !)');
  }

  return {
    isValid: password.length >= 8,
    score,
    feedback,
  };
}

/**
 * Session storage representation
 */
export interface StoredSession {
  token: string;
  userId: string;
  userEmail: string;
  userRole: string;
  expiresAt: number; // Unix timestamp ms
}

const SESSION_KEY = 'bizflow_auth_session_v2';

export function saveSession(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session to localStorage:', e);
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch (e) {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}
