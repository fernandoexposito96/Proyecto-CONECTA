import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conecta.app',
  appName: 'CONECTA',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile'
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
