import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.workplacehub.app',
  appName: 'Workplace Hub',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'upload',
      keystorePassword: 'password',
      keystoreAliasPassword: 'password',
      releaseType: 'APK'
    }
  }
};

export default config;
