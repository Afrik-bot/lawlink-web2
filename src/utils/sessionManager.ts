export const SESSION_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  LAST_ACTIVE: 'lastActive',
};

export const SESSION_CONFIG = {
  INACTIVE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
};

export const sessionManager = {
  setToken(token: string) {
    localStorage.setItem(SESSION_STORAGE_KEYS.TOKEN, token);
    this.updateLastActive();
  },

  getToken(): string | null {
    return localStorage.getItem(SESSION_STORAGE_KEYS.TOKEN);
  },

  setUser(user: any) {
    localStorage.setItem(SESSION_STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser(): any | null {
    const user = localStorage.getItem(SESSION_STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  updateLastActive() {
    localStorage.setItem(SESSION_STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
  },

  getLastActive(): number {
    const lastActive = localStorage.getItem(SESSION_STORAGE_KEYS.LAST_ACTIVE);
    return lastActive ? parseInt(lastActive, 10) : 0;
  },

  isSessionExpired(): boolean {
    const lastActive = this.getLastActive();
    return Date.now() - lastActive > SESSION_CONFIG.INACTIVE_TIMEOUT;
  },

  clearSession() {
    localStorage.removeItem(SESSION_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(SESSION_STORAGE_KEYS.USER);
    localStorage.removeItem(SESSION_STORAGE_KEYS.LAST_ACTIVE);
  },
};
