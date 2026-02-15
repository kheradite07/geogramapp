import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geogram.app',
  appName: 'geogram',
  webDir: 'out',
  server: {
    url: 'https://geogramapp.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'geogramapp.vercel.app',
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com'
    ]
  },
  android: {
    overrideUserAgent: "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '10634920795-ufuhjo447jjlkfmpgjucebouj6h5n4vc.apps.googleusercontent.com', // Web Client ID from .env
      forceCodeForRefreshToken: true,
      androidClientId: '10634920795-g7kg310rkho5gnlt7hjrcet8fqa8d3rh.apps.googleusercontent.com',
    },
  }
};

export default config;
