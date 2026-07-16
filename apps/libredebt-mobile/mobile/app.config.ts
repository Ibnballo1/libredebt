import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "LibreDebt",
  slug: "libredebt",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0F172A",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.libredebt.app",
    infoPlist: {
      NSCameraUsageDescription: "Used to capture receipt photos for payment records.",
      NSPhotoLibraryUsageDescription: "Used to attach receipt images to payment records.",
      NSFaceIDUsageDescription: "Used for quick biometric sign-in.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0F172A",
    },
    package: "com.libredebt.app",
    permissions: ["USE_BIOMETRIC", "USE_FINGERPRINT", "CAMERA", "READ_EXTERNAL_STORAGE"],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-local-authentication",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#10B981",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Used to attach receipt images to payment records.",
        cameraPermission: "Used to capture receipt photos for payment records.",
      },
    ],
  ],
  scheme: "libredebt",
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "your-eas-project-id",
    },
  },
})
