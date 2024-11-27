import { AES, enc } from 'crypto-js';

const STORAGE_KEYS = {
  CREDENTIALS: 'lawlink_credentials',
  REMEMBER_ME: 'lawlink_remember_me',
};

// Use a constant salt for encryption (in production, this should be an environment variable)
const ENCRYPTION_KEY = 'LAWLINK_SECURE_KEY_2023';

interface StoredCredentials {
  email: string;
  password: string;
}

export const credentialsManager = {
  /**
   * Securely stores user credentials
   */
  saveCredentials(email: string, password: string, rememberMe: boolean): void {
    if (!rememberMe) {
      this.clearCredentials();
      return;
    }

    const credentials: StoredCredentials = { email, password };
    const encrypted = AES.encrypt(
      JSON.stringify(credentials),
      ENCRYPTION_KEY
    ).toString();

    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, encrypted);
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
  },

  /**
   * Retrieves stored credentials
   */
  getCredentials(): StoredCredentials | null {
    try {
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (!rememberMe) return null;

      const encrypted = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (!encrypted) return null;

      const decrypted = AES.decrypt(encrypted, ENCRYPTION_KEY).toString(enc.Utf8);
      if (!decrypted) return null;

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      this.clearCredentials();
      return null;
    }
  },

  /**
   * Checks if credentials are stored
   */
  hasStoredCredentials(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.CREDENTIALS) &&
           !!localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
  },

  /**
   * Clears stored credentials
   */
  clearCredentials(): void {
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  },
};
