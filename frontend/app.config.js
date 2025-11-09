// Load environment variables from .env file
import 'dotenv/config';

export default {
  expo: {
    name: 'redi',
    slug: 'redi',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'redi',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.incubator.redi',
      googleServicesFile: './GoogleService-Info.plist',
      buildNumber: '2',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.incubator.redi',
      googleServicesFile: './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'dynamic',
          },
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: 'com.googleusercontent.apps.272234540869-6okghrkn79ub3kf6urj9h2jed3nmopel',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'The app needs access to your photos to upload profile pictures.',
          cameraPermission:
            'The app needs access to your camera to take profile pictures.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Production URL is hardcoded as fallback to prevent localhost in production builds
      // Development can override via REACT_APP_API_BASE_URL environment variable
      apiBaseUrl:
        process.env.REACT_APP_API_BASE_URL ||
        (process.env.EAS_BUILD_PROFILE === 'development'
          ? 'http://localhost:3001'
          : 'https://redi-app-8ea0a6e9c3d9.herokuapp.com'),
      eas: {
        projectId: 'a8a89a20-069d-46de-9994-8e37117865b4',
      },
    },
  },
};
