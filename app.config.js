export default {
  expo: {
    name: "voice-summarizer",
    slug: "voice-summarizer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    extra: {
      runpodEndpoint: process.env.RUNPOD_ENDPOINT ?? "https://u0yfim6wmdb9ov-8000.proxy.runpod.net/predict",
      runpodApiKey: process.env.RUNPOD_API_KEY ?? "",
      firebaseApiKey: process.env.FIREBASE_API_KEY ?? "",
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "",
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "",
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "",
      firebaseAppId: process.env.FIREBASE_APP_ID ?? "",
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? "",
    }
  }
};
