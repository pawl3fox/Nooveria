import { apiService, User } from './api';

export const generateDeviceFingerprint = (): string => {
  const hardwareFingerprint = {
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}x${screen.pixelDepth}`,
    availScreen: `${screen.availWidth}x${screen.availHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    platform: navigator.platform,
    languages: navigator.languages ? navigator.languages.slice(0, 3).join(',') : navigator.language,
    userAgent: navigator.userAgent.substring(0, 100),
    touchPoints: navigator.maxTouchPoints || 0
  };
  
  return JSON.stringify(hardwareFingerprint);
};

export const authService = {
  async createAnonymousSession(): Promise<User> {
    const deviceFingerprint = generateDeviceFingerprint();
    return apiService.createAnonymousSession(deviceFingerprint);
  },

  async register(email: string, password: string, displayName: string): Promise<User> {
    return apiService.register(email, password, displayName);
  },

  async login(email: string, password: string): Promise<User> {
    return apiService.login(email, password);
  },

  async logout(): Promise<User> {
    const deviceFingerprint = generateDeviceFingerprint();
    return apiService.logout(deviceFingerprint);
  }
};