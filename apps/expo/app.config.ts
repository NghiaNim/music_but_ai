import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Classica",
  slug: "classica",
  scheme: "classica",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon-light.png",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0,
  },
  newArchEnabled: true,
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.getclassica.app",
    buildNumber: "1",
    supportsTablet: false,
    icon: {
      light: "./assets/icon-light.png",
      dark: "./assets/icon-dark.png",
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.getclassica.app",
    adaptiveIcon: {
      foregroundImage: "./assets/icon-light.png",
      backgroundColor: "#FFFBEB",
    },
    edgeToEdgeEnabled: true,
  },
  // Run `eas init` to provision the project, then fill in the id below.
  // extra: {
  //   eas: {
  //     projectId: "your-eas-project-id",
  //   },
  // },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
    reactCanary: true,
    reactCompiler: true,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-audio",
    [
      "expo-speech-recognition",
      {
        microphonePermission:
          "Classica uses the microphone so you can tell Ton Ton about music you love.",
        speechRecognitionPermission:
          "Classica transcribes your voice to personalize your recommendations.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Classica uses your photo library so you can upload an event poster or profile photo.",
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FFFBEB",
        image: "./assets/icon-light.png",
        dark: {
          backgroundColor: "#1C0A00",
          image: "./assets/icon-dark.png",
        },
      },
    ],
  ],
});
