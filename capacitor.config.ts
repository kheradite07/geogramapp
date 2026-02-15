import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geogram.app',
  appName: 'geogram',
  webDir: 'out',
  server: {
    url: 'https://geogramapp.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
